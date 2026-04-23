import type { RequestHandler } from './$types';

// Maskable icon — the logo sits in the center ~60% "safe zone" per the
// maskable icon spec so platforms can round/clip the edges without cropping it.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1f7a4f"/>
  <g transform="translate(156 156)" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M125 200H28a16 16 0 0 1-14-24L50 108"/>
    <path d="M125 200h97a16 16 0 0 0 14-24l-10-16"/>
    <path d="m142 172-24 24 24 24"/>
    <path d="M58 140 50 108 18 116"/>
    <path d="M100 64l12-20a16 16 0 0 1 28 0l32 56"/>
    <path d="M156 108l32 8 8-32"/>
  </g>
</svg>`;

export const GET: RequestHandler = () =>
	new Response(SVG, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
		},
	});
