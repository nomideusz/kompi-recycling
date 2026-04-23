import { getAllPoints } from '$lib/server/db/queries/points';
import { POINTS } from '$lib/data';
import type { RequestHandler } from './$types';

const BASE = 'https://recycling.kompi.pl';

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

	const today = new Date().toISOString().slice(0, 10);

	const urls: string[] = [];
	urls.push(renderUrl(BASE, 'daily', '1.0', today));

	for (const p of points) {
		urls.push(renderUrl(`${BASE}/punkt/${p.slug}`, 'weekly', '0.7', today));
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	});
};
