import {
  getAllPoints,
  getCityAggregates,
  getPointsInBbox,
  type CityAggregate,
} from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { cityAggToWire, toWire } from '$lib/wire';
import type { RecyclingPoint } from '$lib/types';

// Country bbox for the initial render — covers continental Poland with a
// little slack. Capped subset goes down with the SSR HTML so the map shows
// pins immediately; the client fetches more as the user pans/zooms.
const POLAND_BBOX = { north: 55.5, south: 49.0, east: 24.5, west: 14.0 };
const INITIAL_LIMIT = 1000;
// Drop singleton OSM hamlets from the suggestion set — at <2 points a city
// is a long-tail noise entry the user is unlikely to search for. Cuts the
// city aggregate list from ~3.8k down to roughly 1.5k for a 30k dataset.
const MIN_CITY_COUNT = 2;

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

export const load = async ({ setHeaders }) => {
  // Edge-cache the rendered page: 5 min CDN cache + 10 min stale-while-revalidate.
  // The underlying dataset only changes when the scraper pushes (daily-ish), so
  // a stale window of a few minutes is invisible to users. Most importantly,
  // any subsequent visitor in the same Netlify region gets the cached HTML
  // instead of triggering an SSR + Turso roundtrip.
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
  });

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
      cityAggregates: cityAggregates
        .filter((c) => c.count >= MIN_CITY_COUNT)
        .map(cityAggToWire),
    };
  } catch (err) {
    console.error('[load points]', err);
    return {
      initialPoints: POINTS.map(toWire),
      initialTruncated: false,
      totalCount: POINTS.length,
      cityAggregates: aggregateCities(POINTS).map(cityAggToWire),
    };
  }
};
