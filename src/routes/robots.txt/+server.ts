import type { RequestHandler } from './$types';

const BODY = `User-agent: *
Allow: /

Sitemap: https://recycling.kompi.pl/sitemap.xml
`;

export const GET: RequestHandler = () =>
	new Response(BODY, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400, s-maxage=86400',
		},
	});
