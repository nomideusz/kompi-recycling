import { describe, expect, it } from 'vitest';
import {
	buildSuggestions,
	cityTokenScore,
	filterPoints,
	normalize,
	queryTokens,
	type CityAggregate,
} from './search';
import type { RecyclingPoint } from './types';

function mkPoint(over: Partial<RecyclingPoint>): RecyclingPoint {
	return {
		slug: 'p1',
		name: 'Punkt zbiórki',
		operator: '',
		city: 'Warszawa',
		address: 'ul. Testowa 1',
		postalCode: '00-001',
		lat: 52.2,
		lng: 21.0,
		categories: ['battery'],
		takebackType: 'municipal',
		hours: '',
		...over,
	};
}

const NO_FILTERS = {
	categories: new Set<never>() as never,
	takebackTypes: new Set<never>() as never,
	city: null,
	anchor: null,
	radiusKm: null,
};

describe('queryTokens', () => {
	it('strips Polish stop words and site-generic words', () => {
		expect(queryTokens('gdzie oddać baterie w Krakowie')).toEqual([
			'baterie',
			'krakowie',
		]);
	});

	it('falls back to raw tokens when everything is a stop word', () => {
		expect(queryTokens('gdzie oddać')).toEqual(['gdzie', 'oddac']);
	});
});

describe('cityTokenScore', () => {
	it('ranks prefix over substring over declension stem', () => {
		expect(cityTokenScore(normalize('Kraków'), 'krak')).toBe(3);
		expect(cityTokenScore(normalize('Inowrocław'), 'wroclaw')).toBe(2);
		expect(cityTokenScore(normalize('Kraków'), 'krakowie')).toBe(1);
	});

	it('ignores short tokens', () => {
		expect(cityTokenScore(normalize('Warszawa'), 'w')).toBe(0);
	});
});

describe('filterPoints token matching', () => {
	const points = [
		mkPoint({ slug: 'a', name: 'PSZOK', operator: 'MPO', city: 'Kraków' }),
		mkPoint({ slug: 'b', name: 'Biedronka', operator: 'Jeronimo Martins', city: 'Kraków' }),
		mkPoint({ slug: 'c', name: 'Biedronka', operator: 'Jeronimo Martins', city: 'Poznań' }),
	];

	it('matches multi-word queries in any order', () => {
		const hit = (q: string) =>
			filterPoints(points, { ...NO_FILTERS, query: q }).map((p) => p.slug);
		expect(hit('biedronka kraków')).toEqual(['b']);
		expect(hit('kraków biedronka')).toEqual(['b']);
	});

	it('is not defeated by stop words', () => {
		const out = filterPoints(points, {
			...NO_FILTERS,
			query: 'gdzie oddać w krakow',
		});
		expect(out.map((p) => p.slug)).toEqual(['a', 'b']);
	});
});

describe('buildSuggestions city declension', () => {
	const aggs: CityAggregate[] = [
		{ city: 'Kraków', lat: 50.06, lng: 19.94, count: 500 },
		{ city: 'Warszawa', lat: 52.23, lng: 21.01, count: 900 },
	];

	it('finds a city from its locative form', () => {
		const items = buildSuggestions([], 'krakowie', aggs);
		expect(items.some((i) => i.key === 'city:Kraków')).toBe(true);
	});

	it('finds the city inside a mixed item+city query', () => {
		const items = buildSuggestions([], 'laptop kraków', aggs);
		expect(items.some((i) => i.key === 'city:Kraków')).toBe(true);
		expect(items.some((i) => i.key === 'city:Warszawa')).toBe(false);
	});
});
