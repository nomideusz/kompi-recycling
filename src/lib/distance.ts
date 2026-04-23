/**
 * Geographic distance + address geocoding helpers.
 *
 * The geocoder hits Google's Geocoding REST endpoint directly with the public
 * Maps key (the same one the map already uses). It's restricted to PL via the
 * `components` filter so a query like "Marszałkowska 1" doesn't resolve to a
 * street with the same name in Lithuania or Czechia.
 */

const EARTH_RADIUS_KM = 6371;

export type Anchor = {
	lat: number;
	lng: number;
	label: string;
	source: 'gps' | 'address';
};

export function haversineKm(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export type GeocodeResult =
	| { ok: true; anchor: Anchor }
	| { ok: false; reason: 'no-key' | 'not-found' | 'network' | 'denied' };

export async function geocodeAddress(
	query: string,
	apiKey: string,
): Promise<GeocodeResult> {
	if (!apiKey) return { ok: false, reason: 'no-key' };
	const trimmed = query.trim();
	if (trimmed.length < 2) return { ok: false, reason: 'not-found' };

	const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
	url.searchParams.set('address', trimmed);
	url.searchParams.set('key', apiKey);
	url.searchParams.set('components', 'country:PL');
	url.searchParams.set('language', 'pl');

	let res: Response;
	try {
		res = await fetch(url.toString());
	} catch {
		return { ok: false, reason: 'network' };
	}
	if (!res.ok) return { ok: false, reason: 'network' };

	const data = (await res.json()) as {
		status?: string;
		results?: Array<{
			formatted_address?: string;
			geometry?: { location?: { lat?: number; lng?: number } };
		}>;
	};

	if (data.status === 'REQUEST_DENIED') return { ok: false, reason: 'denied' };
	if (data.status !== 'OK' || !data.results?.length) {
		return { ok: false, reason: 'not-found' };
	}
	const top = data.results[0];
	const loc = top.geometry?.location;
	if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') {
		return { ok: false, reason: 'not-found' };
	}
	return {
		ok: true,
		anchor: {
			lat: loc.lat,
			lng: loc.lng,
			label: top.formatted_address ?? trimmed,
			source: 'address',
		},
	};
}

/**
 * Heuristic: does this look like an address worth geocoding?
 * (As opposed to a single-word city/operator name that the substring search
 * already handles.) Triggers when the query has either:
 * - A number (street number, postal code), or
 * - A street prefix (ul., al., pl.), or
 * - At least two whitespace-separated tokens.
 */
export function looksLikeAddress(query: string): boolean {
	const q = query.trim();
	if (q.length < 4) return false;
	if (/\d/.test(q)) return true;
	if (/^(ul\.?|al\.?|pl\.?|os\.?)\s/i.test(q)) return true;
	if (q.split(/\s+/).length >= 2) return true;
	return false;
}
