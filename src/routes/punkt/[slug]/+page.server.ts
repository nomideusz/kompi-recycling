import { error } from '@sveltejs/kit';
import { getAllPoints, getPointBySlug } from '$lib/server/db/queries/points';
import { POINTS, getPoint as getSeedPoint } from '$lib/data';
import { haversineKm } from '$lib/distance';
import { citySlug, MIN_CITY_PAGE_COUNT } from '$lib/city-slug';
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

	// Three nearest points sharing at least one category — O(n) selection,
	// no full sort; runs 30k times during prerender so keep it lean. The
	// same pass counts the city's points to decide whether a /miasto page
	// exists for the breadcrumb.
	const all = await getAllPoints().catch(() => POINTS);
	let cityCount = 0;
	const top: Array<{ p: (typeof all)[number]; d: number }> = [];
	for (const c of all) {
		if (c.city === point.city) cityCount++;
		if (c.slug === point.slug) continue;
		if (!c.categories.some((id) => point.categories.includes(id))) continue;
		const d = haversineKm(point.lat, point.lng, c.lat, c.lng);
		if (top.length < 3) {
			top.push({ p: c, d });
			top.sort((a, b) => a.d - b.d);
		} else if (d < top[2].d) {
			top[2] = { p: c, d };
			top.sort((a, b) => a.d - b.d);
		}
	}
	return {
		point,
		cityHref:
			cityCount >= MIN_CITY_PAGE_COUNT
				? `/miasto/${citySlug(point.city)}`
				: `/?q=${encodeURIComponent(point.city)}`,
		alternatives: top.map(({ p, d }) => ({
			slug: p.slug,
			name: p.name,
			city: p.city,
			address: p.address,
			distanceKm: Math.round(d * 10) / 10,
		})),
	};
};
