import { error } from '@sveltejs/kit';
import { getAllPoints, getCityAggregates } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { citySlug, MIN_CITY_PAGE_COUNT } from '$lib/city-slug';
import type { CategoryId, RecyclingPoint } from '$lib/types';
import type { EntryGenerator } from './$types';

// City directory pages — the crawlable path from the landing into the punkt
// pages (yoga's [city] pattern). Prerendered for every city with enough
// points; same build-frozen dataset as the map and sitemap.
export const prerender = true;

// Listing every point in Warszawa (~2k) would bloat the HTML; cap the list
// and send the long tail to the map. The sitemap still covers every punkt
// page individually.
const LIST_CAP = 200;

export const entries: EntryGenerator = async () => {
	const aggs = await getCityAggregates().catch(() => []);
	const source =
		aggs.length > 0
			? aggs
			: [...new Set(POINTS.map((p) => p.city))].map((city) => ({
					city,
					count: POINTS.filter((p) => p.city === city).length,
				}));
	const seen = new Set<string>();
	const out: Array<{ slug: string }> = [];
	for (const a of source) {
		if (a.count < MIN_CITY_PAGE_COUNT) continue;
		const s = citySlug(a.city);
		if (s && !seen.has(s)) {
			seen.add(s);
			out.push({ slug: s });
		}
	}
	return out;
};

export const load = async ({ params }) => {
	const all: RecyclingPoint[] = await getAllPoints().catch(() => POINTS);
	const pts = all.filter((p) => citySlug(p.city) === params.slug);
	if (pts.length < MIN_CITY_PAGE_COUNT) {
		throw error(404, 'Nie znaleziono miasta.');
	}

	// Distinct city names can fold to the same slug — display the most
	// common spelling.
	const nameCounts = new Map<string, number>();
	for (const p of pts) {
		nameCounts.set(p.city, (nameCounts.get(p.city) ?? 0) + 1);
	}
	let cityName = pts[0].city;
	let best = 0;
	for (const [name, count] of nameCounts) {
		if (count > best) {
			best = count;
			cityName = name;
		}
	}

	const catCounts: Partial<Record<CategoryId, number>> = {};
	for (const p of pts) {
		for (const c of p.categories) {
			catCounts[c] = (catCounts[c] ?? 0) + 1;
		}
	}

	const sorted = [...pts].sort((a, b) =>
		a.name.localeCompare(b.name, 'pl'),
	);

	return {
		cityName,
		total: pts.length,
		catCounts,
		truncated: pts.length > LIST_CAP,
		points: sorted.slice(0, LIST_CAP).map((p) => ({
			slug: p.slug,
			name: p.name,
			address: p.address,
			postalCode: p.postalCode,
			takebackType: p.takebackType,
			categories: p.categories,
		})),
	};
};
