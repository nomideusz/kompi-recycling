import type { SearchBoxItem } from './components/SearchBox.svelte';
import type { CategoryId, RecyclingPoint, TakebackType } from './types';

const PL_DIACRITICS: Record<string, string> = {
	ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
	Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
};

export function normalize(input: string): string {
	let out = '';
	for (const ch of input) out += PL_DIACRITICS[ch] ?? ch.toLowerCase();
	return out.replace(/\s+/g, ' ').trim();
}

export type Filters = {
	query: string;
	categories: Set<CategoryId>;
	takebackTypes: Set<TakebackType>;
	city: string | null;
};

export function filterPoints(
	points: RecyclingPoint[],
	filters: Filters,
): RecyclingPoint[] {
	const q = normalize(filters.query);
	return points.filter((p) => {
		if (filters.city && p.city !== filters.city) return false;
		if (filters.categories.size > 0) {
			const hasAny = p.categories.some((c) => filters.categories.has(c));
			if (!hasAny) return false;
		}
		if (filters.takebackTypes.size > 0) {
			if (!filters.takebackTypes.has(p.takebackType)) return false;
		}
		if (q.length > 0) {
			const haystack = normalize(
				`${p.name} ${p.operator} ${p.city} ${p.address} ${p.postalCode}`,
			);
			if (!haystack.includes(q)) return false;
		}
		return true;
	});
}

function pointWord(count: number): string {
	if (count === 1) return 'punkt';
	if (count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14)) return 'punkty';
	return 'punktów';
}

export function buildSuggestions(
	points: RecyclingPoint[],
	query: string,
	perGroupLimit = 6,
): SearchBoxItem[] {
	const q = normalize(query);
	if (q.length < 2) return [];

	const cities = new Map<string, number>();
	const operators = new Map<string, number>();
	const postals = new Map<string, { city: string; count: number }>();

	const hasDigit = /\d/.test(q);
	const qDigits = q.replace(/[-\s]/g, '');

	for (const p of points) {
		if (normalize(p.city).includes(q)) {
			cities.set(p.city, (cities.get(p.city) ?? 0) + 1);
		}
		if (normalize(p.operator).includes(q)) {
			operators.set(p.operator, (operators.get(p.operator) ?? 0) + 1);
		}
		if (hasDigit) {
			const postalDigits = p.postalCode.replace(/[-\s]/g, '');
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

	for (const [city, count] of [...cities.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, perGroupLimit)) {
		items.push({
			key: `city:${city}`,
			icon: 'city',
			text: city,
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

	return items;
}
