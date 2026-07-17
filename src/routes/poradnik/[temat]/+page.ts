import { error } from '@sveltejs/kit';
import { GUIDES, GUIDES_BY_SLUG } from '$lib/guides';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
	GUIDES.map((g) => ({ temat: g.slug }));

export const load: PageLoad = ({ params }) => {
	const guide = GUIDES_BY_SLUG[params.temat];
	if (!guide) throw error(404, 'Nie znaleziono poradnika.');
	return { guide };
};
