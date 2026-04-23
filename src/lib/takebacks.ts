import type { Takeback, TakebackType } from './types';

export const TAKEBACKS: Takeback[] = [
	{
		id: 'free_dropbox',
		label: 'Bez zakupu',
		description: 'Wrzuć do pojemnika — nic nie kupujesz',
	},
	{
		id: 'purchase_required',
		label: 'Zwrot 1:1',
		description: 'Sklep przyjmuje stary sprzęt przy zakupie nowego',
	},
	{
		id: 'municipal',
		label: 'PSZOK',
		description: 'Punkt selektywnej zbiórki odpadów komunalnych',
	},
	{
		id: 'mobile_event',
		label: 'Mobilna zbiórka',
		description: 'Objazdowy punkt zbiórki — sprawdź harmonogram',
	},
];

export const TAKEBACKS_BY_ID: Record<TakebackType, Takeback> = Object.fromEntries(
	TAKEBACKS.map((t) => [t.id, t]),
) as Record<TakebackType, Takeback>;
