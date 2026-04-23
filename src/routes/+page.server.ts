import { getAllPoints } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { toWire } from '$lib/wire';

export const load = async () => {
  const points = await getAllPoints().catch((err) => {
    console.error('[load points]', err);
    return [] as typeof POINTS;
  });
  const source = points.length > 0 ? points : POINTS;
  return { points: source.map(toWire) };
};
