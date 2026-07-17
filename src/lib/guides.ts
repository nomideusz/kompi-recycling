import type { CategoryId } from './types';

/**
 * Static Polish guide content for /poradnik. Pure data — prerendered into
 * pages with FAQPage JSON-LD. `finderUrl` deep-links into the pre-filtered
 * map (existing `cat`/`tb` URL params).
 */
export type Guide = {
	slug: string;
	title: string;
	metaTitle: string;
	metaDescription: string;
	intro: string;
	accepted: string[];
	notAccepted: string[];
	prep: string[];
	afterLife: string;
	legal: string;
	faq: Array<{ q: string; a: string }>;
	categories: CategoryId[];
	finderUrl: string;
};

export const GUIDES: Guide[] = [
	{
		slug: 'baterie',
		title: 'Baterie i akumulatorki',
		metaTitle: 'Gdzie oddać zużyte baterie? Zasady zbiórki baterii w Polsce',
		metaDescription:
			'Zużyte baterie AA/AAA, akumulatorki i powerbanki oddasz bezpłatnie w tysiącach sklepów i punktów. Sprawdź zasady i znajdź pojemnik w pobliżu.',
		intro:
			'Baterie to najłatwiejszy do oddania odpad problemowy w Polsce — pojemniki stoją w marketach, drogeriach, szkołach i urzędach. Nigdy nie wyrzucaj ich do zmieszanych: zawierają metale ciężkie, które zatruwają glebę i wodę, a ogniwa litowe bywają przyczyną pożarów śmieciarek.',
		accepted: [
			'baterie jednorazowe (AA, AAA, płaskie, guzikowe)',
			'akumulatorki wielokrotnego ładowania',
			'baterie do telefonów i laptopów',
			'powerbanki',
		],
		notAccepted: [
			'akumulatory samochodowe (zobacz poradnik „Akumulatory")',
			'uszkodzone ogniwa z wyciekiem — te zabezpiecz i zawieź do PSZOK',
		],
		prep: [
			'Zaklej taśmą bieguny baterii litowych — zapobiega to zwarciom.',
			'Spuchnięte ogniwa włóż do słoika lub woreczka z piaskiem i oddaj jak najszybciej.',
			'Nie rozbieraj ogniw na części.',
		],
		afterLife:
			'Z baterii odzyskuje się cynk, mangan, nikiel, kadm i lit — trafiają z powrotem do produkcji nowych ogniw i stali.',
		legal:
			'Sklepy sprzedające baterie o powierzchni powyżej 25 m² mają ustawowy obowiązek przyjmować zużyte (ustawa o bateriach i akumulatorach z 24 kwietnia 2009 r.).',
		faq: [
			{
				q: 'Czy oddanie baterii coś kosztuje?',
				a: 'Nie. Zbiórka baterii jest zawsze bezpłatna i nie wymaga żadnego zakupu.',
			},
			{
				q: 'Gdzie wyrzucić baterię guzikową z zegarka?',
				a: 'Do tego samego pojemnika co paluszki — baterie guzikowe też podlegają zbiórce.',
			},
			{
				q: 'Co zrobić ze spuchniętym powerbankiem?',
				a: 'Nie ładuj go i nie przebijaj. Umieść w niepalnym pojemniku i oddaj do punktu zbiórki elektroodpadów lub PSZOK jak najszybciej.',
			},
		],
		categories: ['battery'],
		finderUrl: '/?cat=battery',
	},
	{
		slug: 'akumulatory',
		title: 'Akumulatory samochodowe',
		metaTitle: 'Gdzie oddać stary akumulator samochodowy? Opłata depozytowa',
		metaDescription:
			'Stary akumulator oddasz w sklepie motoryzacyjnym, warsztacie lub PSZOK. Sprawdź, jak odzyskać opłatę depozytową i jak bezpiecznie przewieźć akumulator.',
		intro:
			'Akumulator ołowiowy to jeden z najlepiej recyklingowanych produktów świata — odzyskuje się z niego ponad 90% materiałów. W Polsce działa system depozytowy: kupując nowy akumulator bez zwrotu starego, płacisz doliczoną opłatę depozytową, którą odzyskasz przy zwrocie.',
		accepted: [
			'akumulatory samochodowe (ołowiowe)',
			'akumulatory motocyklowe',
			'akumulatory żelowe i AGM',
		],
		notAccepted: [
			'baterie AA/AAA i akumulatorki (zobacz poradnik „Baterie")',
			'baterie trakcyjne z aut elektrycznych — te wymienia wyłącznie serwis',
		],
		prep: [
			'Przewoź pionowo, korkami do góry — elektrolit to żrący kwas siarkowy.',
			'Zabezpiecz klemy przed zwarciem (np. nasadki lub taśma).',
			'Nie przechowuj uszkodzonego akumulatora w domu — oddaj od razu.',
		],
		afterLife:
			'Ołów wraca do produkcji nowych akumulatorów, obudowa z polipropylenu do granulatu, a zneutralizowany elektrolit — do przemysłu chemicznego.',
		legal:
			'Sprzedawca detaliczny ma obowiązek przyjąć zużyty akumulator przy sprzedaży nowego i zwrócić opłatę depozytową (ustawa o bateriach i akumulatorach z 24 kwietnia 2009 r.).',
		faq: [
			{
				q: 'Ile wynosi opłata depozytowa?',
				a: 'Zgodnie z ustawą 30 zł za akumulator samochodowy kwasowo-ołowiowy. Odzyskasz ją, oddając stary akumulator w ciągu 30 dni od zakupu nowego.',
			},
			{
				q: 'Czy skup złomu przyjmie akumulator?',
				a: 'Wiele skupów tak — i zapłaci za ołów. Upewnij się jednak, że punkt ma zezwolenie na zbieranie tego rodzaju odpadów.',
			},
		],
		categories: ['car_battery'],
		finderUrl: '/?cat=car_battery',
	},
	{
		slug: 'oleje',
		title: 'Oleje silnikowe i smary',
		metaTitle: 'Gdzie oddać przepracowany olej silnikowy?',
		metaDescription:
			'Przepracowany olej silnikowy przyjmie PSZOK i wiele warsztatów. Litr oleju może skazić milion litrów wody — sprawdź, jak oddać go bezpiecznie.',
		intro:
			'Przepracowany olej to odpad niebezpieczny: jeden litr wylany do gruntu potrafi skazić nawet milion litrów wody. Jednocześnie to cenny surowiec — rafinerie regenerują go na oleje bazowe. Oddasz go bezpłatnie w każdym PSZOK, a warsztaty i stacje wymieniające olej mają obowiązek przyjąć zużyty od klientów.',
		accepted: [
			'olej silnikowy',
			'olej przekładniowy i hydrauliczny',
			'filtry oleju',
			'smary i towoty',
		],
		notAccepted: [
			'olej spożywczy (posmażalniczy) — ten zbierają niektóre PSZOK-i osobno',
			'oleje zmieszane z wodą, benzyną lub rozpuszczalnikami',
		],
		prep: [
			'Przelej olej do szczelnego pojemnika — najlepiej oryginalnego po oleju.',
			'Nie mieszaj różnych płynów: zmieszanego oleju nie da się zregenerować.',
			'Opisz pojemnik, jeśli nie jest oryginalny.',
		],
		afterLife:
			'Olej trafia do rafinerii regeneracyjnych, gdzie powstają z niego pełnowartościowe oleje bazowe — proces można powtarzać wielokrotnie.',
		legal:
			'Oleje odpadowe podlegają obowiązkowi selektywnego zbierania i regeneracji (ustawa o odpadach z 14 grudnia 2012 r., art. 90–93).',
		faq: [
			{
				q: 'Czy PSZOK przyjmie olej w dowolnej ilości?',
				a: 'Gminy zwykle ustalają limity (np. 5–10 litrów rocznie na gospodarstwo). Większe ilości z działalności warsztatowej to odpad firmowy — PSZOK go nie przyjmie.',
			},
			{
				q: 'Co z kanistrem po oleju?',
				a: 'Pusty kanister po oleju to odpad opakowaniowy po substancji niebezpiecznej — oddaj go razem z olejem w PSZOK, nie do żółtego worka.',
			},
		],
		categories: ['oil'],
		finderUrl: '/?cat=oil',
	},
];

export const GUIDES_BY_SLUG: Record<string, Guide> = Object.fromEntries(
	GUIDES.map((g) => [g.slug, g]),
);

export const GUIDE_BY_CATEGORY: Partial<Record<CategoryId, Guide>> = {};
for (const g of GUIDES) {
	for (const c of g.categories) {
		if (!GUIDE_BY_CATEGORY[c]) GUIDE_BY_CATEGORY[c] = g;
	}
}
