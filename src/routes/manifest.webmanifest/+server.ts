import type { RequestHandler } from './$types';

const MANIFEST = {
	name: 'recycling.kompi.pl',
	short_name: 'kompi recycling',
	description:
		'Mapa punktów zbiórki elektroodpadów, baterii i świetlówek w Polsce.',
	start_url: '/',
	scope: '/',
	display: 'standalone',
	orientation: 'portrait',
	lang: 'pl-PL',
	background_color: '#09090b',
	theme_color: '#1f7a4f',
	categories: ['utilities', 'productivity', 'navigation'],
	icons: [
		{
			src: '/favicon.svg',
			sizes: 'any',
			type: 'image/svg+xml',
			purpose: 'any',
		},
		{
			src: '/icon-maskable.svg',
			sizes: 'any',
			type: 'image/svg+xml',
			purpose: 'maskable',
		},
	],
};

export const GET: RequestHandler = () =>
	new Response(JSON.stringify(MANIFEST, null, 2), {
		headers: {
			'Content-Type': 'application/manifest+json; charset=utf-8',
			'Cache-Control': 'public, max-age=86400, s-maxage=604800',
		},
	});
