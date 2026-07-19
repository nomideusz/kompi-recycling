import { normalize } from './search';

/** Minimum points for a city to get its own prerendered /miasto page. */
export const MIN_CITY_PAGE_COUNT = 10;

/** URL slug for a city name: diacritics folded, spaces → dashes.
 *  "Ruda Śląska" → "ruda-slaska". */
export function citySlug(city: string): string {
	return normalize(city).replace(/\s+/g, '-');
}
