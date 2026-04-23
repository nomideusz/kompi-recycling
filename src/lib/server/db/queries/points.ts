import { eq } from 'drizzle-orm';
import { db } from '../index';
import { recyclingPoints, type RecyclingPointRow } from '../schema';
import type { RecyclingPoint, CategoryId } from '$lib/types';

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
    hours: r.hours ?? '',
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    notes: r.notes ?? undefined,
  };
}

export async function getAllPoints(): Promise<RecyclingPoint[]> {
  const rows = await db.select().from(recyclingPoints);
  return rows.map(toPoint);
}

export async function getPointBySlug(slug: string): Promise<RecyclingPoint | null> {
  const rows = await db
    .select()
    .from(recyclingPoints)
    .where(eq(recyclingPoints.slug, slug))
    .limit(1);
  return rows[0] ? toPoint(rows[0]) : null;
}
