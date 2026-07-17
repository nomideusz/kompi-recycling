import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_ID } from '$lib/categories';
import { GUIDES, GUIDES_BY_SLUG, GUIDE_BY_CATEGORY } from '$lib/guides';

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
