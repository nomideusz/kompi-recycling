import {
  getAllPoints,
  getCityAggregates,
  getPointsInBbox,
  type CityAggregate,
} from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { toWire } from '$lib/wire';
import type { RecyclingPoint } from '$lib/types';

// Country bbox for the initial render — covers continental Poland with a
// little slack. Capped subset goes down with the SSR HTML so the map shows
// pins immediately; the client fetches more as the user pans/zooms.
const POLAND_BBOX = { north: 55.5, south: 49.0, east: 24.5, west: 14.0 };
const INITIAL_LIMIT = 2000;

function aggregateCities(points: RecyclingPoint[]): CityAggregate[] {
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
  return [...acc].map(([city, v]) => ({
    city,
    lat: v.latSum / v.count,
    lng: v.lngSum / v.count,
    count: v.count,
  })).sort((a, b) => b.count - a.count);
}

export const load = async () => {
  try {
    const [initial, cityAggregates] = await Promise.all([
      getPointsInBbox(POLAND_BBOX, INITIAL_LIMIT),
      getCityAggregates(),
    ]);
    const all = await getAllPoints();
    return {
      initialPoints: initial.points.map(toWire),
      initialTruncated: initial.truncated,
      totalCount: all.length,
      cityAggregates,
    };
  } catch (err) {
    console.error('[load points]', err);
    return {
      initialPoints: POINTS.map(toWire),
      initialTruncated: false,
      totalCount: POINTS.length,
      cityAggregates: aggregateCities(POINTS),
    };
  }
};
