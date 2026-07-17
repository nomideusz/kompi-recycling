import type { Category, CategoryId } from './types';

export const CATEGORIES: Category[] = [
	{
		id: 'weee',
		label: 'Duży sprzęt AGD/RTV',
		description: 'Lodówki, pralki, telewizory, kuchenki',
		colorVar: '--kompi-cat-weee',
	},
	{
		id: 'small',
		label: 'Mały sprzęt elektroniczny',
		description: 'Czajniki, tostery, komputery, drobne AGD',
		colorVar: '--kompi-cat-small',
	},
	{
		id: 'battery',
		label: 'Baterie (małe)',
		description: 'Baterie jednorazowe i akumulatorki AA/AAA',
		colorVar: '--kompi-cat-battery',
	},
	{
		id: 'lamp',
		label: 'Świetlówki i żarówki',
		description: 'Świetlówki kompaktowe, LED, tradycyjne',
		colorVar: '--kompi-cat-lamp',
	},
	{
		id: 'mobile',
		label: 'Mobilna zbiórka',
		description: 'Objazdowe punkty zbiórki (harmonogram)',
		colorVar: '--kompi-cat-mobile',
	},
	{
		id: 'car_battery',
		label: 'Akumulatory',
		description: 'Akumulatory samochodowe i motocyklowe',
		colorVar: '--kompi-cat-car-battery',
	},
	{
		id: 'oil',
		label: 'Oleje i smary',
		description: 'Przepracowane oleje silnikowe, smary, filtry',
		colorVar: '--kompi-cat-oil',
	},
	{
		id: 'tires',
		label: 'Opony',
		description: 'Zużyte opony samochodowe i rowerowe',
		colorVar: '--kompi-cat-tires',
	},
	{
		id: 'chemicals',
		label: 'Chemikalia i farby',
		description: 'Farby, lakiery, rozpuszczalniki, aerozole',
		colorVar: '--kompi-cat-chemicals',
	},
	{
		id: 'meds',
		label: 'Przeterminowane leki',
		description: 'Leki, syropy, blistry z domowej apteczki',
		colorVar: '--kompi-cat-meds',
	},
	{
		id: 'bulky',
		label: 'Wielkogabaryty',
		description: 'Meble, materace, dywany, wózki',
		colorVar: '--kompi-cat-bulky',
	},
	{
		id: 'textiles',
		label: 'Tekstylia',
		description: 'Ubrania, buty, pościel, ręczniki',
		colorVar: '--kompi-cat-textiles',
	},
];

export const CATEGORIES_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
	CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
