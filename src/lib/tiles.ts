/**
 * Fixed 1°×1° tile grid used to serve the dataset as prerendered static
 * JSON instead of a serverless function (which paid a ~9s Netlify cold
 * start + Turso wake on first hit). Poland spans roughly 7×11 tiles, so
 * the build emits ~70 non-empty tile files of a few dozen KB each and the
 * client streams only the tiles covering the viewport.
 *
 * Shared by the prerendered endpoints (server) and PointStore (client) —
 * keep this module dependency-free.
 */
export const TILE_DEG = 1;

export type TileBbox = {
	north: number;
	south: number;
	east: number;
	west: number;
};

export function tileKey(lat: number, lng: number): string {
	return `${Math.floor(lat / TILE_DEG)}_${Math.floor(lng / TILE_DEG)}`;
}

/** Keys of every tile intersecting the bbox, row-major. */
export function tileKeysForBbox(b: TileBbox): string[] {
	const latMin = Math.floor(b.south / TILE_DEG);
	const latMax = Math.floor(b.north / TILE_DEG);
	const lngMin = Math.floor(b.west / TILE_DEG);
	const lngMax = Math.floor(b.east / TILE_DEG);
	const keys: string[] = [];
	for (let la = latMin; la <= latMax; la++) {
		for (let lo = lngMin; lo <= lngMax; lo++) {
			keys.push(`${la}_${lo}`);
		}
	}
	return keys;
}

export const TILE_KEY_RE = /^-?\d+_-?\d+$/;
