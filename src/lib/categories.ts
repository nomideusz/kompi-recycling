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
		label: 'Baterie i akumulatory',
		description: 'Baterie jednorazowe i akumulatorki',
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
];

export const CATEGORIES_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
	CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
