import { getAllPoints } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';

export const load = async () => {
  const points = await getAllPoints().catch((err) => {
    console.error('[load points]', err);
    return [] as typeof POINTS;
  });
  return { points: points.length > 0 ? points : POINTS };
};
