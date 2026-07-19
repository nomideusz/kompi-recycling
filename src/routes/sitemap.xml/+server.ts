import { getAllPoints, getCityAggregates } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import { GUIDES } from '$lib/guides';
import { citySlug, MIN_CITY_PAGE_COUNT } from '$lib/city-slug';
import type { RequestHandler } from './$types';

const BASE = 'https://recycling.kompi.pl';

// The dataset is frozen at deploy time (see +page.server.ts), so bake the
// sitemap at build too. A per-request `today` lastmod teaches crawlers the
// value is meaningless; the build date is when content actually changed.
export const prerender = true;

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&apos;')
		.replace(/"/g, '&quot;');
}

function renderUrl(
	loc: string,
	changefreq: string,
	priority: string,
	lastmod: string,
): string {
	return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: RequestHandler = async () => {
	let points = await getAllPoints().catch(() => [] as typeof POINTS);
	if (points.length === 0) points = POINTS;

	const buildDate = new Date().toISOString().slice(0, 10);

	const urls: string[] = [];
	urls.push(renderUrl(BASE, 'daily', '1.0', buildDate));

	urls.push(renderUrl(`${BASE}/poradnik`, 'monthly', '0.8', buildDate));
	for (const g of GUIDES) {
		urls.push(renderUrl(`${BASE}/poradnik/${g.slug}`, 'monthly', '0.8', buildDate));
	}

	const aggs = await getCityAggregates().catch(() => []);
	const citySeen = new Set<string>();
	for (const a of aggs) {
		if (a.count < MIN_CITY_PAGE_COUNT) continue;
		const s = citySlug(a.city);
		if (s && !citySeen.has(s)) {
			citySeen.add(s);
			urls.push(renderUrl(`${BASE}/miasto/${s}`, 'weekly', '0.8', buildDate));
		}
	}

	for (const p of points) {
		urls.push(renderUrl(`${BASE}/punkt/${p.slug}`, 'weekly', '0.7', buildDate));
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
};
