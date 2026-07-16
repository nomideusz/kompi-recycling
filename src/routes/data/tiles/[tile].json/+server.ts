import { error, json } from '@sveltejs/kit';
import { getAllPoints } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { toWire } from '$lib/wire';
import { tileKey, TILE_KEY_RE } from '$lib/tiles';
import type { RecyclingPoint } from '$lib/types';
import type { RequestHandler, EntryGenerator } from './$types';

export const prerender = true;

async function loadPoints(): Promise<RecyclingPoint[]> {
	const points = await getAllPoints().catch(() => [] as RecyclingPoint[]);
	return points.length > 0 ? points : POINTS;
}

// Enumerate every non-empty tile so the build emits one static JSON file
// per tile. The client only requests keys listed in index.json, so a
// runtime hit on this route means a stale/hand-crafted URL — reject fast
// instead of paying a DB wake for it.
export const entries: EntryGenerator = async () => {
	const points = await loadPoints();
	const keys = new Set<string>();
	for (const p of points) keys.add(tileKey(p.lat, p.lng));
	return [...keys].map((tile) => ({ tile }));
};

export const GET: RequestHandler = async ({ params }) => {
	if (!TILE_KEY_RE.test(params.tile)) throw error(404, 'Unknown tile');

	const points = await loadPoints();
	const inTile = points.filter((p) => tileKey(p.lat, p.lng) === params.tile);
	if (inTile.length === 0) throw error(404, 'Unknown tile');

	return json({ points: inTile.map(toWire) });
};
