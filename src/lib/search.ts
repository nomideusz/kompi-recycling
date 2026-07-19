import { polishLocationStems } from '@nomideusz/svelte-search/locales/pl';
import type { SearchBoxItem } from './components/SearchBox.svelte';
import { haversineKm, looksLikeAddress, type Anchor } from './distance';
import type { CategoryId, RecyclingPoint, TakebackType } from './types';

export type CityAggregate = {
	city: string;
	lat: number;
	lng: number;
	count: number;
};

const DIACRITIC_RE = /\p{Diacritic}/gu;
const WHITESPACE_RE = /\s+/g;
const POLISH_L = /ł/g;
const POLISH_L_UPPER = /Ł/g;

export function normalize(input: string): string {
	if (!input) return '';
	return input
		.normalize('NFD')
		.replace(DIACRITIC_RE, '')
		.replace(POLISH_L, 'l')
		.replace(POLISH_L_UPPER, 'l')
		.toLowerCase()
		.replace(WHITESPACE_RE, ' ')
		.trim();
}

// Tokens that carry no search intent on a recycling directory — Polish
// prepositions plus site-generic words ("gdzie oddać baterie w krakowie"
// should match on "baterie" + "krakowie" only). Mirrors the yoga app's
// stop-word handling in @nomideusz/svelte-search.
const STOP_TOKENS = new Set([
	'w', 'we', 'z', 'ze', 'na', 'do', 'od', 'dla', 'i', 'o', 'u',
	'przy', 'po', 'pod', 'nad', 'za', 'lub', 'czy', 'jak', 'co', 'to',
	'gdzie', 'oddac', 'oddam', 'wyrzucic', 'wyrzucac', 'zwrot', 'zwrocic',
	'utylizacja', 'utylizacj', 'recykling', 'zbiorka', 'zbiorki',
	'blisko', 'kolo', 'okolica', 'okolice', 'okolicy', 'okolicach', 'poblizu',
]);

/**
 * Normalize a query into meaningful tokens: diacritic-folded, lowercased,
 * stop words stripped. When stripping would remove everything (e.g. the
 * query is "punkt zbiórki"), fall back to the raw tokens so the search
 * still has something to match on.
 */
export function queryTokens(query: string): string[] {
	const raw = normalize(query).split(' ').filter(Boolean);
	const stripped = raw.filter((t) => !STOP_TOKENS.has(t));
	return stripped.length > 0 ? stripped : raw;
}

/**
 * Does a normalized city name match a query token? Tries direct prefix and
 * substring first, then Polish declension stems so "krakowie"/"gdanska"
 * match "krakow"/"gdansk". Returns a score for ranking (higher is better,
 * 0 = no match).
 */
export function cityTokenScore(cityNorm: string, token: string): number {
	if (token.length < 3) return 0;
	if (cityNorm.startsWith(token)) return 3;
	if (cityNorm.includes(token)) return 2;
	for (const stem of polishLocationStems(token)) {
		if (stem !== token && cityNorm.startsWith(stem)) return 1;
	}
	return 0;
}

export type Indices = {
	/** slug → normalized "name operator city address postalCode" haystack */
	haystack: Map<string, string>;
	/** slug → km from active anchor; null when no anchor is set */
	distanceKm: Map<string, number> | null;
};

/**
 * Precompute one normalized haystack per point. O(n) once, vs. O(n) per
 * keystroke if filterPoints did this inline. Pass to filterPoints + sortByDistance.
 */
export function buildHaystackIndex(
	points: RecyclingPoint[],
): Map<string, string> {
	const m = new Map<string, string>();
	for (const p of points) {
		m.set(
			p.slug,
			normalize(`${p.name} ${p.operator} ${p.city} ${p.address} ${p.postalCode}`),
		);
	}
	return m;
}

/**
 * Precompute distance from anchor for every point. Recompute only when
 * `anchor` itself changes — not on every filter update.
 */
export function buildDistanceIndex(
	points: RecyclingPoint[],
	anchor: Anchor | null,
): Map<string, number> | null {
	if (!anchor) return null;
	const m = new Map<string, number>();
	for (const p of points) {
		m.set(p.slug, haversineKm(p.lat, p.lng, anchor.lat, anchor.lng));
	}
	return m;
}

export type Filters = {
	query: string;
	categories: Set<CategoryId>;
	takebackTypes: Set<TakebackType>;
	city: string | null;
	anchor: Anchor | null;
	radiusKm: number | null;
};

export function filterPoints(
	points: RecyclingPoint[],
	filters: Filters,
	indices?: Indices,
): RecyclingPoint[] {
	// Token-AND matching (yoga-style): every meaningful token must appear
	// somewhere in the haystack, so "biedronka kraków" and "kraków
	// biedronka" both work, and "gdzie oddać baterie" isn't defeated by
	// its stop words.
	const tokens = filters.query.trim() ? queryTokens(filters.query) : [];
	const proximityActive = filters.anchor !== null && filters.radiusKm !== null;
	const distanceMap = indices?.distanceKm ?? null;
	const haystackMap = indices?.haystack ?? null;

	return points.filter((p) => {
		if (filters.city && p.city !== filters.city) return false;
		if (filters.categories.size > 0) {
			const hasAny = p.categories.some((c) => filters.categories.has(c));
			if (!hasAny) return false;
		}
		if (filters.takebackTypes.size > 0) {
			if (!filters.takebackTypes.has(p.takebackType)) return false;
		}
		if (tokens.length > 0) {
			const haystack =
				haystackMap?.get(p.slug) ??
				normalize(`${p.name} ${p.operator} ${p.city} ${p.address} ${p.postalCode}`);
			if (!tokens.every((t) => haystack.includes(t))) return false;
		}
		if (proximityActive) {
			const d =
				distanceMap?.get(p.slug) ??
				haversineKm(p.lat, p.lng, filters.anchor!.lat, filters.anchor!.lng);
			if (d > filters.radiusKm!) return false;
		}
		return true;
	});
}

/**
 * Sort points by ascending distance from the anchor, when one is set.
 * Uses the precomputed `distanceKm` map when supplied — that's O(n log n)
 * Map lookups instead of O(n log n × 2) haversine calls.
 */
export function sortByDistance(
	points: RecyclingPoint[],
	anchor: Anchor | null,
	distanceMap?: Map<string, number> | null,
): RecyclingPoint[] {
	if (!anchor) return points;
	if (distanceMap) {
		return [...points].sort(
			(a, b) =>
				(distanceMap.get(a.slug) ?? Infinity) -
				(distanceMap.get(b.slug) ?? Infinity),
		);
	}
	return [...points].sort(
		(a, b) =>
			haversineKm(a.lat, a.lng, anchor.lat, anchor.lng) -
			haversineKm(b.lat, b.lng, anchor.lat, anchor.lng),
	);
}

function pointWord(count: number): string {
	if (count === 1) return 'punkt';
	if (count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14)) return 'punkty';
	return 'punktów';
}

export function buildSuggestions(
	points: RecyclingPoint[],
	query: string,
	cityAggregates: CityAggregate[],
	perGroupLimit = 6,
): SearchBoxItem[] {
	const q = normalize(query);
	if (q.length < 2) return [];
	const tokens = queryTokens(query);

	const operators = new Map<string, number>();
	const postals = new Map<string, { city: string; count: number }>();

	const hasDigit = /\d/.test(q);
	const qDigits = q.replace(/[-\s]/g, '');

	const normCache = new Map<string, string>();
	const normMaybe = (s: string): string => {
		if (!s) return '';
		const cached = normCache.get(s);
		if (cached !== undefined) return cached;
		const out = normalize(s);
		normCache.set(s, out);
		return out;
	};

	// City matches come from the precomputed aggregates so the user can find
	// any Polish city even when its points haven't been fetched into the
	// loaded subset yet. Matching is per-token and declension-aware
	// ("krakowie", "laptop kraków" → Kraków); prefix beats substring beats
	// stem match, then larger cities first.
	const cityMatches: Array<{ city: CityAggregate; count: number; score: number }> = [];
	for (const c of cityAggregates) {
		const cityNorm = normMaybe(c.city);
		let score = cityNorm.includes(q) ? 4 : 0;
		for (const t of tokens) {
			score = Math.max(score, cityTokenScore(cityNorm, t));
		}
		if (score > 0) {
			cityMatches.push({ city: c, count: c.count, score });
		}
	}
	cityMatches.sort((a, b) => b.score - a.score || b.count - a.count);

	for (const p of points) {
		if (p.operator) {
			const opNorm = normMaybe(p.operator);
			// Whole query as substring, or every token present — so both
			// "mpo warszawa" and partial typing "biedr" match.
			if (opNorm.includes(q) || tokens.every((t) => opNorm.includes(t))) {
				operators.set(p.operator, (operators.get(p.operator) ?? 0) + 1);
			}
		}
		if (hasDigit) {
			const postalDigits = (p.postalCode || '').replace(/[-\s]/g, '');
			if (postalDigits.includes(qDigits)) {
				const existing = postals.get(p.postalCode);
				postals.set(p.postalCode, {
					city: p.city,
					count: (existing?.count ?? 0) + 1,
				});
			}
		}
	}

	const items: SearchBoxItem[] = [];

	for (const { city, count } of cityMatches.slice(0, perGroupLimit)) {
		items.push({
			key: `city:${city.city}`,
			icon: 'city',
			text: city.city,
			meta: `${count} ${pointWord(count)}`,
			group: 'Miasta',
		});
	}

	for (const [operator, count] of [...operators.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, perGroupLimit)) {
		items.push({
			key: `operator:${operator}`,
			icon: 'operator',
			text: operator,
			meta: `${count} ${pointWord(count)}`,
			group: 'Operatorzy',
		});
	}

	for (const [postal, info] of [...postals.entries()].slice(0, perGroupLimit)) {
		items.push({
			key: `postal:${postal}`,
			icon: 'postal',
			text: postal,
			meta: info.city,
			group: 'Kody pocztowe',
		});
	}

	if (looksLikeAddress(query)) {
		items.push({
			key: `address:${query}`,
			icon: 'pin',
			text: query.trim(),
			meta: 'Pokaż w pobliżu',
			group: 'Adres',
		});
	}

	return items;
}
