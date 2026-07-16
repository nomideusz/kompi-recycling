import { error } from '@sveltejs/kit';
import { getAllPoints, getPointBySlug } from '$lib/server/db/queries/points';
import { POINTS, getPoint as getSeedPoint } from '$lib/data';
import type { EntryGenerator } from './$types';

// Detail pages carry the same build-frozen dataset as the map, so bake all
// ~30k of them into static HTML — instant TTFB and no function cold start
// for organic search traffic, which lands here first.
export const prerender = true;

export const entries: EntryGenerator = async () => {
	const points = await getAllPoints().catch(() => [] as typeof POINTS);
	const source = points.length > 0 ? points : POINTS;
	return source.map((p) => ({ slug: p.slug }));
};

export const load = async ({ params }) => {
	const point =
		(await getPointBySlug(params.slug).catch(() => null)) ??
		getSeedPoint(params.slug);
	if (!point) throw error(404, 'Nie znaleziono punktu.');
	return { point };
};
