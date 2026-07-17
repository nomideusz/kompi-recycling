import { normalize } from './search';
import type { CategoryId } from './types';

/**
 * Item dictionary — maps everyday things ("olej silnikowy", "laptop",
 * "kanapa") onto waste categories. Powers the "Co chcesz oddać?" search
 * and the hero tiles. Pure data + one matcher; no framework imports so
 * it stays unit-testable under plain node.
 */
export type WasteItem = {
	/** URL-safe id, also used as the `item` query param */
	id: string;
	/** Display name (Polish) */
	name: string;
	/** Alternative names; matched diacritic-insensitively */
	synonyms: string[];
	categories: CategoryId[];
	/** Short consumer-facing preparation rules shown above results */
	rules?: string;
	/** Slug of the matching /poradnik/[temat] guide */
	guideSlug?: string;
	/** Shown as a hero tile — exactly 12 items carry this flag */
	popular?: boolean;
};

export const ITEMS: WasteItem[] = [
	// ── Popular 12 (hero tiles, in display order) ──────────────────────
	{
		id: 'baterie',
		name: 'Baterie',
		synonyms: ['bateria', 'paluszki', 'akumulatorki', 'aa', 'aaa'],
		categories: ['battery'],
		rules: 'Baterie wrzucisz bezpłatnie do pojemnika w większości marketów, drogerii i elektromarketów — bez żadnego zakupu.',
		guideSlug: 'baterie',
		popular: true,
	},
	{
		id: 'akumulator',
		name: 'Akumulator samochodowy',
		synonyms: ['akumulator', 'akumulator motocyklowy', 'akumulator żelowy', 'akumulator agm'],
		categories: ['car_battery'],
		rules: 'Przy zakupie nowego akumulatora zwrot starego odzyskuje opłatę depozytową. Przewoź pionowo i nie przechylaj — elektrolit jest żrący.',
		guideSlug: 'akumulatory',
		popular: true,
	},
	{
		id: 'olej-silnikowy',
		name: 'Olej silnikowy',
		synonyms: ['olej', 'przepracowany olej', 'olej przekładniowy', 'olej hydrauliczny'],
		categories: ['oil'],
		rules: 'Przelej do szczelnego pojemnika (najlepiej po oleju). Nie mieszaj z innymi płynami — zmieszanego oleju nie da się zregenerować.',
		guideSlug: 'oleje',
		popular: true,
	},
	{
		id: 'komputer',
		name: 'Komputer / laptop',
		synonyms: ['laptop', 'notebook', 'pc', 'komputer stacjonarny', 'jednostka centralna'],
		categories: ['small'],
		rules: 'Usuń lub zaszyfruj dane z dysku przed oddaniem. Sklep RTV/AGD o powierzchni ≥400 m² przyjmie drobny sprzęt bez zakupu.',
		guideSlug: 'maly-sprzet-elektroniczny',
		popular: true,
	},
	{
		id: 'lodowka',
		name: 'Lodówka',
		synonyms: ['chłodziarka', 'zamrażarka', 'lodówko-zamrażarka'],
		categories: ['weee'],
		rules: 'Nie odcinaj agregatu — czynnik chłodniczy musi zostać odzyskany. Przy dostawie nowej sklep ma obowiązek bezpłatnie zabrać starą (1:1).',
		guideSlug: 'duzy-sprzet-agd',
		popular: true,
	},
	{
		id: 'pralka',
		name: 'Pralka',
		synonyms: ['pralko-suszarka', 'suszarka bębnowa'],
		categories: ['weee'],
		rules: 'Przy dostawie nowej pralki sklep zabierze starą bezpłatnie (zwrot 1:1). Możesz też zawieźć ją do PSZOK.',
		guideSlug: 'duzy-sprzet-agd',
		popular: true,
	},
	{
		id: 'telewizor',
		name: 'Telewizor',
		synonyms: ['tv', 'monitor crt', 'kineskop', 'monitor'],
		categories: ['weee'],
		rules: 'Nie rozbijaj ekranu — kineskopy i matryce zawierają substancje szkodliwe. Oddaj urządzenie w całości.',
		guideSlug: 'duzy-sprzet-agd',
		popular: true,
	},
	{
		id: 'zarowki',
		name: 'Żarówki i świetlówki',
		synonyms: ['żarówka', 'świetlówka', 'led', 'halogen', 'jarzeniówka'],
		categories: ['lamp'],
		rules: 'Świetlówki zawierają rtęć — nigdy do szkła ani zmieszanych. Pojemniki na źródła światła znajdziesz w marketach budowlanych.',
		guideSlug: 'swietlowki-i-zarowki',
		popular: true,
	},
	{
		id: 'opony',
		name: 'Opony',
		synonyms: ['opona', 'opony samochodowe', 'opony zimowe', 'opony rowerowe'],
		categories: ['tires'],
		rules: 'PSZOK przyjmie opony z aut osobowych (limit zwykle 4–8 szt. rocznie na gospodarstwo). Serwis wymieniający opony też ma obowiązek przyjąć stare.',
		guideSlug: 'opony',
		popular: true,
	},
	{
		id: 'leki',
		name: 'Przeterminowane leki',
		synonyms: ['lekarstwa', 'tabletki', 'syrop', 'blistry', 'apteczka'],
		categories: ['meds'],
		rules: 'Kartoniki i ulotki do papieru; leki w blistrach i butelkach wrzuć do pojemnika w aptece lub oddaj w PSZOK.',
		guideSlug: 'leki',
		popular: true,
	},
	{
		id: 'farby',
		name: 'Farby i chemia',
		synonyms: ['farba', 'lakier', 'rozpuszczalnik', 'klej', 'aerozol', 'środki ochrony roślin'],
		categories: ['chemicals'],
		rules: 'Oddawaj w oryginalnych, zamkniętych opakowaniach z etykietą — to warunek bezpiecznej utylizacji.',
		guideSlug: 'chemikalia-i-farby',
		popular: true,
	},
	{
		id: 'ubrania',
		name: 'Ubrania i tekstylia',
		synonyms: ['odzież', 'tekstylia', 'buty', 'pościel', 'ręczniki'],
		categories: ['textiles'],
		rules: 'Od 2025 r. tekstyliów nie wolno wyrzucać do zmieszanych. Czyste i suche ubrania oddasz też w kontenerach organizacji charytatywnych.',
		guideSlug: 'tekstylia',
		popular: true,
	},
	// ── Small electronics ─────────────────────────────────────────────
	{ id: 'telefon', name: 'Telefon', synonyms: ['smartfon', 'komórka', 'iphone'], categories: ['small'], rules: 'Wykonaj reset do ustawień fabrycznych i wyjmij kartę SIM przed oddaniem.', guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'tablet', name: 'Tablet', synonyms: ['ipad', 'czytnik ebook'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'drukarka', name: 'Drukarka', synonyms: ['skaner', 'urządzenie wielofunkcyjne', 'ksero'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'czajnik', name: 'Czajnik elektryczny', synonyms: ['czajnik'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'toster', name: 'Toster', synonyms: ['opiekacz', 'gofrownica'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'mikser', name: 'Mikser / blender', synonyms: ['blender', 'robot kuchenny', 'malakser'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'zelazko', name: 'Żelazko', synonyms: ['generator pary'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'suszarka-do-wlosow', name: 'Suszarka do włosów', synonyms: ['lokówka', 'prostownica'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'golarka', name: 'Golarka', synonyms: ['maszynka do strzyżenia', 'depilator', 'trymer'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'odkurzacz', name: 'Odkurzacz', synonyms: ['robot sprzątający'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'konsola', name: 'Konsola do gier', synonyms: ['playstation', 'xbox', 'nintendo', 'pad'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'router', name: 'Router', synonyms: ['modem', 'switch'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'radio', name: 'Radio / wieża', synonyms: ['wieża', 'amplituner', 'gramofon'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'glosnik', name: 'Głośnik', synonyms: ['soundbar', 'głośnik bluetooth'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'sluchawki', name: 'Słuchawki', synonyms: ['słuchawki bezprzewodowe', 'airpods'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'aparat', name: 'Aparat / kamera', synonyms: ['kamera', 'kamerka'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'wiertarka', name: 'Elektronarzędzia', synonyms: ['wiertarka', 'szlifierka', 'wkrętarka', 'piła elektryczna'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'ekspres', name: 'Ekspres do kawy', synonyms: ['kawiarka elektryczna'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'waga', name: 'Waga elektroniczna', synonyms: ['waga łazienkowa', 'waga kuchenna'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'zegarek', name: 'Zegarek elektroniczny', synonyms: ['smartwatch', 'opaska fitness'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'kable', name: 'Kable i ładowarki', synonyms: ['ładowarka', 'zasilacz', 'przewody', 'kabel'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'myszka-klawiatura', name: 'Myszka / klawiatura', synonyms: ['myszka', 'klawiatura'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'szczoteczka', name: 'Szczoteczka elektryczna', synonyms: ['irygator'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'wentylator', name: 'Wentylator', synonyms: ['klimator'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'farelka', name: 'Grzejnik elektryczny', synonyms: ['farelka', 'termowentylator'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'lampka', name: 'Lampka biurkowa', synonyms: ['lampa stojąca'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'zabawki-elektroniczne', name: 'Zabawki elektroniczne', synonyms: ['zabawka na baterie', 'autko zdalnie sterowane', 'dron'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	// ── Large appliances ───────────────────────────────────────────────
	{ id: 'zmywarka', name: 'Zmywarka', synonyms: [], categories: ['weee'], guideSlug: 'duzy-sprzet-agd' },
	{ id: 'kuchenka', name: 'Kuchenka / piekarnik', synonyms: ['płyta indukcyjna', 'piekarnik', 'kuchnia elektryczna'], categories: ['weee'], guideSlug: 'duzy-sprzet-agd' },
	{ id: 'mikrofalowka', name: 'Mikrofalówka', synonyms: ['kuchenka mikrofalowa'], categories: ['small'], guideSlug: 'maly-sprzet-elektroniczny' },
	{ id: 'klimatyzator', name: 'Klimatyzator', synonyms: ['klima'], categories: ['weee'], rules: 'Zawiera czynnik chłodniczy — demontaż zostaw profesjonalistom, oddaj w całości.', guideSlug: 'duzy-sprzet-agd' },
	{ id: 'bojler', name: 'Bojler', synonyms: ['terma', 'podgrzewacz wody'], categories: ['weee'], guideSlug: 'duzy-sprzet-agd' },
	{ id: 'okap', name: 'Okap kuchenny', synonyms: [], categories: ['weee'], guideSlug: 'duzy-sprzet-agd' },
	// ── Batteries ─────────────────────────────────────────────────────
	{ id: 'powerbank', name: 'Powerbank', synonyms: [], categories: ['battery'], rules: 'Uszkodzony lub spuchnięty powerbank oddaj jak najszybciej — ogniwa litowe bywają przyczyną pożarów.', guideSlug: 'baterie' },
	{ id: 'bateria-telefonu', name: 'Bateria do telefonu / laptopa', synonyms: ['ogniwo', 'bateria litowa'], categories: ['battery'], guideSlug: 'baterie' },
	// ── Oils ──────────────────────────────────────────────────────────
	{ id: 'filtr-oleju', name: 'Filtr oleju', synonyms: ['filtry olejowe'], categories: ['oil'], guideSlug: 'oleje' },
	{ id: 'smar', name: 'Smar', synonyms: ['towot'], categories: ['oil'], guideSlug: 'oleje' },
	// ── Chemicals ─────────────────────────────────────────────────────
	{ id: 'plyn-hamulcowy', name: 'Płyn hamulcowy / chłodniczy', synonyms: ['płyn chłodniczy', 'płyn do chłodnic'], categories: ['chemicals'], guideSlug: 'chemikalia-i-farby' },
	{ id: 'opakowania-po-chemii', name: 'Opakowania po chemikaliach', synonyms: ['puszki po farbie', 'kanister'], categories: ['chemicals'], guideSlug: 'chemikalia-i-farby' },
	{ id: 'termometr', name: 'Termometr rtęciowy', synonyms: ['rtęć'], categories: ['chemicals'], rules: 'Rtęć jest silnie toksyczna — zapakuj termometr szczelnie i oddaj w PSZOK. Rozbitego nie zbieraj odkurzaczem.', guideSlug: 'chemikalia-i-farby' },
	// ── Medical ───────────────────────────────────────────────────────
	{ id: 'strzykawki', name: 'Igły i strzykawki', synonyms: ['igły', 'odpady medyczne'], categories: ['meds'], rules: 'Igły i strzykawki w zamkniętym, sztywnym pojemniku — przyjmie je PSZOK; apteczne pojemniki są tylko na leki.', guideSlug: 'leki' },
	// ── Bulky ─────────────────────────────────────────────────────────
	{ id: 'kanapa', name: 'Kanapa / fotel', synonyms: ['sofa', 'wersalka', 'fotel', 'narożnik'], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	{ id: 'szafa', name: 'Meble', synonyms: ['szafa', 'stół', 'krzesło', 'komoda', 'regał'], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	{ id: 'materac', name: 'Materac', synonyms: [], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	{ id: 'dywan', name: 'Dywan / wykładzina', synonyms: ['wykładzina'], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	{ id: 'wozek', name: 'Wózek dziecięcy', synonyms: ['fotelik samochodowy'], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	{ id: 'rower', name: 'Rower', synonyms: ['hulajnoga'], categories: ['bulky'], rules: 'Sprawny rower rozważ oddać fundacji lub na wymianę — recykling to ostatnia opcja.', guideSlug: 'wielkogabaryty' },
	{ id: 'drzwi', name: 'Drzwi', synonyms: ['skrzydło drzwiowe'], categories: ['bulky'], guideSlug: 'wielkogabaryty' },
	// ── Textiles ──────────────────────────────────────────────────────
	{ id: 'torby', name: 'Torby i plecaki', synonyms: ['plecak', 'torebka', 'walizka'], categories: ['textiles'], guideSlug: 'tekstylia' },
];

export const ITEMS_BY_ID: Record<string, WasteItem> = Object.fromEntries(
	ITEMS.map((i) => [i.id, i]),
);

export const POPULAR_ITEMS: WasteItem[] = ITEMS.filter((i) => i.popular);

/**
 * Rank items against a free-text query. Diacritic-insensitive via the same
 * `normalize` the point search uses. Scoring: exact term > prefix >
 * substring > term-inside-query (so "akumulator z auta" still hits).
 */
export function matchItems(query: string, limit = 6): WasteItem[] {
	const q = normalize(query);
	if (q.length < 2) return [];
	const scored: Array<{ item: WasteItem; score: number }> = [];
	for (const item of ITEMS) {
		let best = 0;
		for (const term of [item.name, ...item.synonyms]) {
			const t = normalize(term);
			if (t === q) best = Math.max(best, 100);
			else if (t.startsWith(q)) best = Math.max(best, 80);
			else if (t.includes(q)) best = Math.max(best, 60);
			else if (t.length >= 4 && q.includes(t)) best = Math.max(best, 40);
		}
		if (best > 0) scored.push({ item, score: best });
	}
	scored.sort(
		(a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'pl'),
	);
	return scored.slice(0, limit).map((s) => s.item);
}
