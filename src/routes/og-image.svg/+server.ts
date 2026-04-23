import type { RequestHandler } from './$types';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#0f1f16"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0%" stop-color="#39ff14" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#39ff14" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.95" r="0.5">
      <stop offset="0%" stop-color="#bf00ff" stop-opacity="0.25"/>
      <stop offset="70%" stop-color="#bf00ff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <g transform="translate(80, 90)">
    <g transform="translate(0, 0)">
      <rect width="96" height="96" rx="20" fill="#39ff14"/>
      <g transform="translate(18, 18)" stroke="#09090b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M30 48H7a4 4 0 0 1-3.5-6L12 26"/>
        <path d="M30 48h22a4 4 0 0 0 3.5-6L52 36"/>
        <path d="m34 42-6 6 6 6"/>
        <path d="M14 34 12 26l-8 2"/>
        <path d="m24 16 3-5a4 4 0 0 1 7 0l9 16"/>
        <path d="m38 26 8 2 2-8"/>
      </g>
    </g>
    <text x="120" y="42" font-family="'Inter',system-ui,sans-serif" font-size="32" font-weight="500" fill="#a1a1aa" letter-spacing="0.5">kompi.pl</text>
    <text x="120" y="82" font-family="'Inter',system-ui,sans-serif" font-size="48" font-weight="700" fill="#ffffff" letter-spacing="-1">recycling</text>
  </g>

  <g transform="translate(80, 280)">
    <text font-family="'Inter',system-ui,sans-serif" font-size="72" font-weight="700" fill="#ffffff" letter-spacing="-2">
      <tspan x="0" y="0">Mapa punktów zbiórki</tspan>
      <tspan x="0" y="88">elektroodpadów w Polsce</tspan>
    </text>
  </g>

  <g transform="translate(80, 500)" font-family="'Inter',system-ui,sans-serif" font-size="26" font-weight="500" fill="#a1a1aa">
    <circle cx="12" cy="-8" r="6" fill="#39ff14"/>
    <text x="32" y="0">Duży sprzęt AGD/RTV</text>

    <circle cx="342" cy="-8" r="6" fill="#00e5ff"/>
    <text x="362" y="0">Mały sprzęt</text>

    <circle cx="582" cy="-8" r="6" fill="#ffaa00"/>
    <text x="602" y="0">Baterie</text>

    <circle cx="762" cy="-8" r="6" fill="#ff00ff"/>
    <text x="782" y="0">Świetlówki</text>
  </g>

  <text x="80" y="580" font-family="'Inter',system-ui,sans-serif" font-size="22" font-weight="500" fill="#71717a" letter-spacing="0.5">recycling.kompi.pl</text>
</svg>`;

export const GET: RequestHandler = () =>
	new Response(SVG, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
		},
	});
