import type { RequestHandler } from './$types';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1f7a4f"/>
  <g transform="translate(4 4)" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M15 24H3.5a2 2 0 0 1-1.75-3L6 13"/>
    <path d="M15 24h11a2 2 0 0 0 1.75-3L26 18"/>
    <path d="m17 21-3 3 3 3"/>
    <path d="M7 17 6 13l-4 1"/>
    <path d="m12 8 1.5-2.5a2 2 0 0 1 3.5 0L21.5 13"/>
    <path d="m19 13 4 1 1-4"/>
  </g>
</svg>`;

export const GET: RequestHandler = () =>
	new Response(SVG, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
		},
	});
