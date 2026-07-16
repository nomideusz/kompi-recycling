import { json } from '@sveltejs/kit';
import { getAllPoints } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { tileKey } from '$lib/tiles';
import type { RequestHandler } from './$types';

// Baked at build time alongside the per-tile payloads — the dataset only
// changes when the scraper pushes and triggers a rebuild, so the index is
// a plain CDN file with zero function involvement.
export const prerender = true;

export const GET: RequestHandler = async () => {
	let points = await getAllPoints().catch(() => [] as typeof POINTS);
	if (points.length === 0) points = POINTS;

	const tiles: Record<string, number> = {};
	for (const p of points) {
		const key = tileKey(p.lat, p.lng);
		tiles[key] = (tiles[key] ?? 0) + 1;
	}

	return json({ total: points.length, tiles });
};
