import type { RecyclingPoint, CityMarker } from './types';

/**
 * Seed dataset — a handful of real-shaped sample points across Poland.
 * Replace with a real data source (Turso/Postgres/Drizzle) once the
 * scraper pipeline (adapted from tools/yoga-scraper) is wired up.
 *
 * Coordinates and addresses are placeholders — verify against GIOŚ /
 * rejestr BDO or Google Places before going live.
 */
export const POINTS: RecyclingPoint[] = [
	{
		slug: 'warszawa-pszok-zawodzie',
		name: 'PSZOK Zawodzie',
		operator: 'MPO Warszawa',
		city: 'Warszawa',
		address: 'ul. Zawodzie 16',
		postalCode: '02-981',
		lat: 52.1625,
		lng: 21.0512,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 10:00–18:00, Sb 8:00–14:00',
		phone: '+48 22 555 00 00',
		notes: 'Wymagany dokument potwierdzający zamieszkanie w Warszawie.',
	},
	{
		slug: 'warszawa-pszok-radiowa',
		name: 'PSZOK Radiowa',
		operator: 'MPO Warszawa',
		city: 'Warszawa',
		address: 'ul. Radiowa 22',
		postalCode: '01-485',
		lat: 52.2612,
		lng: 20.9205,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 10:00–18:00, Sb 8:00–14:00',
	},
	{
		slug: 'krakow-pszok-barycz',
		name: 'PSZOK Barycz',
		operator: 'MPO Kraków',
		city: 'Kraków',
		address: 'ul. Krzemieniecka 40',
		postalCode: '30-694',
		lat: 49.9835,
		lng: 20.0412,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Sb 7:00–17:00',
	},
	{
		slug: 'krakow-pszok-nowohucka',
		name: 'PSZOK Nowohucka',
		operator: 'MPO Kraków',
		city: 'Kraków',
		address: 'ul. Nowohucka 1',
		postalCode: '30-728',
		lat: 50.0440,
		lng: 20.0180,
		categories: ['weee', 'small', 'battery'],
		takebackType: 'municipal',
		hours: 'Pn–Sb 7:00–17:00',
	},
	{
		slug: 'gdansk-pszok-meduza',
		name: 'PSZOK Meduza',
		operator: 'ZUT Gdańsk',
		city: 'Gdańsk',
		address: 'ul. Meduzy 2',
		postalCode: '80-299',
		lat: 54.3682,
		lng: 18.5912,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 10:00–18:00, Sb 10:00–14:00',
	},
	{
		slug: 'wroclaw-ekosystem-michalczyka',
		name: 'PSZOK Michalczyka',
		operator: 'Ekosystem Wrocław',
		city: 'Wrocław',
		address: 'ul. Michalczyka 9',
		postalCode: '53-633',
		lat: 51.1053,
		lng: 16.9948,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 9:00–17:00, Sb 9:00–15:00',
	},
	{
		slug: 'poznan-pszok-wrzesinska',
		name: 'PSZOK Wrzesińska',
		operator: 'GOAP Poznań',
		city: 'Poznań',
		address: 'ul. Wrzesińska 12',
		postalCode: '61-021',
		lat: 52.4033,
		lng: 17.0012,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 8:00–18:00, Sb 8:00–14:00',
	},
	{
		slug: 'warszawa-mobilny-ursynow',
		name: 'Objazdowa zbiórka — Ursynów',
		operator: 'MPO Warszawa',
		city: 'Warszawa',
		address: 'al. KEN 36 (parking)',
		postalCode: '02-797',
		lat: 52.1488,
		lng: 21.0466,
		categories: ['mobile', 'small', 'battery'],
		takebackType: 'mobile_event',
		hours: 'Pierwsza sobota miesiąca, 10:00–14:00',
		notes: 'Tylko drobny sprzęt i baterie — duże AGD do PSZOK.',
	},
	{
		slug: 'lodz-pszok-zbaszynska',
		name: 'PSZOK Zbąszyńska',
		operator: 'MPO Łódź',
		city: 'Łódź',
		address: 'ul. Zbąszyńska 6',
		postalCode: '91-342',
		lat: 51.7962,
		lng: 19.4023,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 8:00–18:00, Sb 9:00–15:00',
	},
	{
		slug: 'katowice-pszok-milowicka',
		name: 'PSZOK Milowicka',
		operator: 'MPGK Katowice',
		city: 'Katowice',
		address: 'ul. Milowicka 7a',
		postalCode: '40-312',
		lat: 50.2712,
		lng: 19.0632,
		categories: ['weee', 'small', 'battery', 'lamp'],
		takebackType: 'municipal',
		hours: 'Pn–Pt 10:00–18:00, Sb 9:00–14:00',
	},
];

export function getPoint(slug: string): RecyclingPoint | undefined {
	return POINTS.find((p) => p.slug === slug);
}

export function getCityMarkers(points = POINTS): CityMarker[] {
	const byCity = new Map<string, { lat: number; lng: number; count: number }>();
	for (const p of points) {
		const existing = byCity.get(p.city);
		if (existing) {
			existing.count += 1;
		} else {
			byCity.set(p.city, { lat: p.lat, lng: p.lng, count: 1 });
		}
	}
	return Array.from(byCity, ([city, v]) => ({ city, ...v }));
}
