import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_ID } from '$lib/categories';
import { ITEMS, ITEMS_BY_ID, POPULAR_ITEMS, matchItems } from '$lib/items';

describe('ITEMS integrity', () => {
	it('has unique ids', () => {
		const ids = ITEMS.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('references only existing categories', () => {
		for (const item of ITEMS) {
			expect(item.categories.length).toBeGreaterThan(0);
			for (const c of item.categories) {
				expect(CATEGORIES_BY_ID[c], `${item.id} → ${c}`).toBeDefined();
			}
		}
	});

	it('exposes exactly 12 popular items for the hero grid', () => {
		expect(POPULAR_ITEMS).toHaveLength(12);
	});

	it('ITEMS_BY_ID round-trips', () => {
		expect(ITEMS_BY_ID['olej-silnikowy']?.categories).toContain('oil');
	});
});

describe('matchItems', () => {
	it('returns [] for empty and 1-char queries', () => {
		expect(matchItems('')).toEqual([]);
		expect(matchItems('a')).toEqual([]);
	});

	it('matches exact names first', () => {
		expect(matchItems('baterie')[0]?.id).toBe('baterie');
	});

	it('is diacritic-insensitive both ways', () => {
		expect(matchItems('żarówki')[0]?.id).toBe('zarowki');
		expect(matchItems('zarowki')[0]?.id).toBe('zarowki');
	});

	it('matches synonyms', () => {
		expect(matchItems('laptop')[0]?.id).toBe('komputer');
		expect(matchItems('wersalka')[0]?.id).toBe('kanapa');
	});

	it('matches items embedded in a phrase', () => {
		expect(matchItems('akumulator z auta').map((i) => i.id)).toContain('akumulator');
	});

	it('respects the limit', () => {
		expect(matchItems('ol', 3).length).toBeLessThanOrEqual(3);
	});
});
