import { eq } from 'drizzle-orm';
import { db } from '../index';
import { recyclingPoints, type RecyclingPointRow } from '../schema';
import type { RecyclingPoint, CategoryId, TakebackType } from '$lib/types';

const TAKEBACK_TYPES: ReadonlySet<TakebackType> = new Set([
  'free_dropbox',
  'purchase_required',
  'municipal',
  'mobile_event',
]);

function parseTakebackType(raw: string | null | undefined): TakebackType {
  return raw && TAKEBACK_TYPES.has(raw as TakebackType)
    ? (raw as TakebackType)
    : 'municipal';
}

function parseCategories(raw: string | null): CategoryId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CategoryId[]) : [];
  } catch {
    return [];
  }
}

function toPoint(r: RecyclingPointRow): RecyclingPoint {
  return {
    slug: r.slug,
    name: r.name,
    operator: r.operator ?? '',
    city: r.city,
    address: r.address ?? '',
    postalCode: r.postalCode ?? '',
    lat: r.lat,
    lng: r.lng,
    categories: parseCategories(r.categoriesJson),
    takebackType: parseTakebackType(r.takebackType),
    hours: r.hours ?? '',
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    notes: r.notes ?? undefined,
  };
}

// Module-level TTL cache. Each warm Netlify function instance caches
// independently; cold starts pay the full Turso query and warm requests
// short-circuit with the cached array. Acceptable staleness window since
// the scraper pushes daily-ish.
const POINTS_TTL_MS = 5 * 60 * 1000;
let pointsCache: { points: RecyclingPoint[]; expiresAt: number } | null = null;

export async function getAllPoints(): Promise<RecyclingPoint[]> {
  const now = Date.now();
  if (pointsCache && pointsCache.expiresAt > now) return pointsCache.points;

  const rows = await db.select().from(recyclingPoints);
  const points = rows.map(toPoint);
  pointsCache = { points, expiresAt: now + POINTS_TTL_MS };
  return points;
}

export async function getPointBySlug(slug: string): Promise<RecyclingPoint | null> {
  const rows = await db
    .select()
    .from(recyclingPoints)
    .where(eq(recyclingPoints.slug, slug))
    .limit(1);
  return rows[0] ? toPoint(rows[0]) : null;
}

export type Bbox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type BboxResult = {
  points: RecyclingPoint[];
  truncated: boolean;
  total: number;
};

/** Filter the cached points by bbox. Caps result at `limit`; reports both
 * the capped count and the unbounded total so the client can decide whether
 * to nudge the user to zoom in. */
export async function getPointsInBbox(bbox: Bbox, limit: number): Promise<BboxResult> {
  const all = await getAllPoints();
  const out: RecyclingPoint[] = [];
  let total = 0;
  for (const p of all) {
    if (p.lat <= bbox.north && p.lat >= bbox.south && p.lng <= bbox.east && p.lng >= bbox.west) {
      total++;
      if (out.length < limit) out.push(p);
    }
  }
  return { points: out, truncated: total > out.length, total };
}

export type CityAggregate = {
  city: string;
  lat: number;
  lng: number;
  count: number;
};

const aggregatesCache: { cities?: CityAggregate[]; computedFor?: RecyclingPoint[] } = {};

/** Pre-compute one entry per distinct city: centroid (mean lat/lng) and a
 * count of points. Cheap (~888 cities for 30k points) and lets the search
 * suggestion box surface every city without holding the full point set on
 * the client. Memoised against the points-cache reference so we recompute
 * only when getAllPoints actually returns a fresh array. */
export async function getCityAggregates(): Promise<CityAggregate[]> {
  const points = await getAllPoints();
  if (aggregatesCache.computedFor === points && aggregatesCache.cities) {
    return aggregatesCache.cities;
  }

  const acc = new Map<string, { latSum: number; lngSum: number; count: number }>();
  for (const p of points) {
    if (!p.city) continue;
    const cur = acc.get(p.city);
    if (cur) {
      cur.latSum += p.lat;
      cur.lngSum += p.lng;
      cur.count += 1;
    } else {
      acc.set(p.city, { latSum: p.lat, lngSum: p.lng, count: 1 });
    }
  }
  const cities: CityAggregate[] = [];
  for (const [city, v] of acc) {
    cities.push({ city, lat: v.latSum / v.count, lng: v.lngSum / v.count, count: v.count });
  }
  cities.sort((a, b) => b.count - a.count);

  aggregatesCache.cities = cities;
  aggregatesCache.computedFor = points;
  return cities;
}

export async function getTotalCount(): Promise<number> {
  return (await getAllPoints()).length;
}
