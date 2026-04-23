import { error, json } from '@sveltejs/kit';
import { getPointsInBbox } from '$lib/server/db/queries/points';
import { toWire } from '$lib/wire';
import type { RequestHandler } from './$types';

const DEFAULT_LIMIT = 2000;
const MAX_LIMIT = 5000;

function parseFloatOrThrow(raw: string | null, name: string): number {
  if (raw === null) throw error(400, `Missing query parameter: ${name}`);
  const v = Number.parseFloat(raw);
  if (!Number.isFinite(v)) throw error(400, `Invalid ${name}: ${raw}`);
  return v;
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const north = parseFloatOrThrow(url.searchParams.get('n'), 'n');
  const south = parseFloatOrThrow(url.searchParams.get('s'), 's');
  const east = parseFloatOrThrow(url.searchParams.get('e'), 'e');
  const west = parseFloatOrThrow(url.searchParams.get('w'), 'w');

  if (north < south || east < west) {
    throw error(400, 'bbox is malformed (north < south or east < west)');
  }

  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw
    ? Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limitRaw, 10) || DEFAULT_LIMIT))
    : DEFAULT_LIMIT;

  const result = await getPointsInBbox({ north, south, east, west }, limit);

  // Each warm function instance can also let the CDN hold the same response
  // for a brief window — the underlying dataset only changes when the
  // scraper pushes (daily-ish), so a 60s shared cache is safe and will
  // dampen hot-bbox loads.
  setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

  return json({
    points: result.points.map(toWire),
    truncated: result.truncated,
    total: result.total,
  });
};
