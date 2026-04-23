import { error } from '@sveltejs/kit';
import { getPointBySlug } from '$lib/server/db/queries/points';
import { getPoint as getSeedPoint } from '$lib/data';

export const load = async ({ params }) => {
	const point =
		(await getPointBySlug(params.slug).catch(() => null)) ??
		getSeedPoint(params.slug);
	if (!point) throw error(404, 'Nie znaleziono punktu.');
	return { point };
};
