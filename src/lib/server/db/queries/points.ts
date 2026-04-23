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
