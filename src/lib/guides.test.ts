import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_ID } from '$lib/categories';
import { GUIDES, GUIDES_BY_SLUG, GUIDE_BY_CATEGORY } from '$lib/guides';
import { ITEMS } from '$lib/items';

describe('GUIDES integrity', () => {
	it('has unique slugs', () => {
		const slugs = GUIDES.map((g) => g.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('references only existing categories', () => {
		for (const g of GUIDES) {
			for (const c of g.categories) {
				expect(CATEGORIES_BY_ID[c], `${g.slug} → ${c}`).toBeDefined();
			}
		}
	});

	it('every guide has complete content', () => {
		for (const g of GUIDES) {
			expect(g.intro.length, g.slug).toBeGreaterThan(50);
			expect(g.accepted.length, g.slug).toBeGreaterThan(0);
			expect(g.prep.length, g.slug).toBeGreaterThan(0);
			expect(g.faq.length, g.slug).toBeGreaterThanOrEqual(2);
			expect(g.finderUrl, g.slug).toMatch(/^\/\?/);
		}
	});

	it('lookup maps are consistent', () => {
		expect(GUIDES_BY_SLUG['baterie']?.title).toBeDefined();
		expect(GUIDE_BY_CATEGORY['battery']?.slug).toBe('baterie');
	});
});

describe('item ↔ guide cross-links', () => {
	it('every item guideSlug resolves to a guide', () => {
		for (const item of ITEMS) {
			if (!item.guideSlug) continue;
			expect(GUIDES_BY_SLUG[item.guideSlug], `${item.id} → ${item.guideSlug}`).toBeDefined();
		}
	});

	it('there are 12 guides', () => {
		expect(GUIDES).toHaveLength(12);
	});
});
