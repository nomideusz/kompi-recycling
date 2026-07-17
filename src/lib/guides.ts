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
			'akumulatory samochodowe (zobacz poradnik „Akumulatory”)',
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
			'baterie AA/AAA i akumulatorki (zobacz poradnik „Baterie”)',
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
	{
		slug: 'opony',
		title: 'Opony',
		metaTitle: 'Gdzie oddać zużyte opony? PSZOK i serwisy',
		metaDescription:
			'Zużyte opony z aut osobowych oddasz w PSZOK (limit roczny) lub w serwisie przy wymianie. Sprawdź zasady i znajdź punkt w pobliżu.',
		intro:
			'Opony nie mogą trafić ani do zmieszanych, ani na dzikie wysypisko — ich spalanie i porzucanie jest wykroczeniem. Najprościej zostawić stare opony w serwisie przy wymianie na nowe; poza sezonem wymiany przyjmie je PSZOK w ramach rocznego limitu.',
		accepted: ['opony z samochodów osobowych', 'opony motocyklowe', 'opony rowerowe'],
		notAccepted: [
			'opony z pojazdów ciężarowych i rolniczych — to odpad firmowy',
			'opony z felgami w niektórych gminach — sprawdź regulamin PSZOK',
		],
		prep: [
			'Zdejmij opony z felg, jeśli regulamin PSZOK tego wymaga.',
			'Policz sztuki — limity to zwykle 4–8 opon rocznie na gospodarstwo.',
		],
		afterLife:
			'Opony trafiają do recyklingu materiałowego (granulat gumowy na nawierzchnie boisk i placów zabaw) albo jako paliwo alternatywne do cementowni.',
		legal:
			'Za pozostawienie opon w lesie lub przy śmietniku grozi mandat do 5000 zł (kodeks wykroczeń, art. 162).',
		faq: [
			{
				q: 'Czy serwis ma obowiązek przyjąć moje stare opony?',
				a: 'Przy zakupie i wymianie opon w serwisie — tak, w stosunku 1:1. Bez zakupu serwis może odmówić lub policzyć opłatę.',
			},
			{
				q: 'Co z oponami od przyczepki lub taczki?',
				a: 'Małe opony gospodarcze większość PSZOK-ów przyjmuje jak opony rowerowe — w razie wątpliwości zadzwoń przed wizytą.',
			},
		],
		categories: ['tires'],
		finderUrl: '/?cat=tires',
	},
	{
		slug: 'chemikalia-i-farby',
		title: 'Chemikalia i farby',
		metaTitle: 'Gdzie oddać stare farby, lakiery i chemikalia?',
		metaDescription:
			'Resztki farb, rozpuszczalniki, aerozole i środki ochrony roślin przyjmuje PSZOK. Zobacz, jak je przygotować i czego nie wolno zlewać do kanalizacji.',
		intro:
			'Farby, lakiery, rozpuszczalniki i domowa chemia to odpady niebezpieczne. Wylane do zlewu niszczą oczyszczalnie, a wyrzucone do zmieszanych mogą zapalić się w śmieciarce. Wszystkie przyjmie bezpłatnie PSZOK — najlepiej w oryginalnych opakowaniach.',
		accepted: [
			'farby, lakiery, impregnaty i kleje',
			'rozpuszczalniki i zmywacze',
			'aerozole (także puste)',
			'środki ochrony roślin i nawozy',
			'płyny samochodowe: hamulcowy, chłodniczy',
			'termometry rtęciowe',
		],
		notAccepted: [
			'materiały wybuchowe i pirotechnika — te przyjmuje policja podczas zbiórek',
			'butle gazowe — oddaj w punkcie wymiany butli',
			'azbest — wymaga wyspecjalizowanej firmy, nie zawoź do PSZOK',
		],
		prep: [
			'Zostaw substancje w oryginalnych, zamkniętych opakowaniach z etykietą.',
			'Nie zlewaj różnych chemikaliów do jednego pojemnika.',
			'Zaschnięta farba w puszce to też odpad niebezpieczny — oddaj całą puszkę.',
		],
		afterLife:
			'Chemikalia trafiają do instalacji termicznego przekształcania odpadów niebezpiecznych z odzyskiem energii i neutralizacją spalin.',
		legal:
			'Odpady niebezpieczne z gospodarstw domowych gmina ma obowiązek przyjmować selektywnie w PSZOK (ustawa o utrzymaniu czystości i porządku w gminach, art. 3).',
		faq: [
			{
				q: 'Gdzie oddać zużyty olej spożywczy po smażeniu?',
				a: 'Coraz więcej PSZOK-ów zbiera go osobno w butelkach PET. Nie wylewaj go do zlewu — zatyka kanalizację.',
			},
			{
				q: 'Co zrobić z rozbitym termometrem rtęciowym?',
				a: 'Zbierz rtęć kartonikiem do słoika z wodą (nigdy odkurzaczem!), zamknij i zawieź do PSZOK.',
			},
		],
		categories: ['chemicals'],
		finderUrl: '/?cat=chemicals',
	},
	{
		slug: 'leki',
		title: 'Przeterminowane leki',
		metaTitle: 'Gdzie wyrzucić przeterminowane leki? Apteki i PSZOK',
		metaDescription:
			'Przeterminowane leki oddasz do pojemnika w aptece lub w PSZOK. Zobacz, co zrobić z blistrami, syropami i igłami.',
		intro:
			'Leki spuszczone w toalecie lub wyrzucone do zmieszanych trafiają do wód gruntowych — oczyszczalnie nie rozkładają substancji czynnych. Pojemniki na przeterminowane leki znajdziesz w większości aptek i w każdym PSZOK.',
		accepted: [
			'tabletki i kapsułki (w blistrach lub bez)',
			'syropy, krople i maści (w opakowaniach)',
			'ampułki i inhalatory',
		],
		notAccepted: [
			'igły i strzykawki — te wymagają sztywnego pojemnika i trafiają do PSZOK',
			'suplementy diety — możesz wyrzucić do zmieszanych, nie są lekami',
			'kartoniki i ulotki — te do papieru',
		],
		prep: [
			'Wyjmij blistry i butelki z kartoników — papier oddaj osobno.',
			'Nie wyciskaj tabletek z blistrów.',
			'Igły i strzykawki zamknij w sztywnym, opisanym pojemniku (np. butelce PET).',
		],
		afterLife:
			'Leki są spalane w spalarniach odpadów medycznych w temperaturze ponad 1100°C, co rozkłada substancje czynne całkowicie.',
		legal:
			'Zbiórkę przeterminowanych leków z gospodarstw domowych organizuje gmina; apteki uczestniczą w niej dobrowolnie na podstawie porozumień.',
		faq: [
			{
				q: 'Czy każda apteka przyjmie stare leki?',
				a: 'Nie każda — pojemniki stoją w aptekach, które mają umowę z gminą. Jeśli twoja odmówi, najbliższy PSZOK przyjmie leki na pewno.',
			},
			{
				q: 'Co zrobić z lekami po zmarłym członku rodziny?',
				a: 'Większe ilości leków też przyjmie apteka z pojemnikiem lub PSZOK — nie ma limitów ilościowych dla leków z gospodarstw domowych.',
			},
		],
		categories: ['meds'],
		finderUrl: '/?cat=meds',
	},
	{
		slug: 'duzy-sprzet-agd',
		title: 'Duży sprzęt AGD i RTV',
		metaTitle: 'Gdzie oddać lodówkę, pralkę, telewizor? Odbiór 1:1',
		metaDescription:
			'Sklep ma obowiązek zabrać starą lodówkę czy pralkę przy dostawie nowej. Sprawdź zasady odbioru 1:1, PSZOK i czego nie wolno robić z agregatem.',
		intro:
			'Duży sprzęt AGD i RTV oddasz na trzy sposoby: sklep zabiera stary sprzęt bezpłatnie przy dostawie nowego (zasada 1:1), możesz zawieźć go do PSZOK, a wiele gmin organizuje też bezpłatne odbiory elektroodpadów z domu.',
		accepted: [
			'lodówki, zamrażarki, klimatyzatory',
			'pralki, suszarki, zmywarki',
			'kuchenki, piekarniki, płyty grzewcze',
			'telewizory i monitory',
			'bojlery i grzejniki elektryczne',
		],
		notAccepted: [
			'sprzęt rozkręcony lub bez istotnych części — punkty mogą odmówić przyjęcia',
			'sprzęt z wymontowanym agregatem lub sprężarką',
		],
		prep: [
			'Nie odcinaj kabli, agregatów ani sprężarek — sprzęt oddaje się kompletny.',
			'Opróżnij i rozmroź lodówkę co najmniej dobę przed transportem.',
			'Lodówkę przewoź w pionie; po przechyleniu odczekaj 2 h przed podłączeniem (dotyczy nowej).',
		],
		afterLife:
			'Zakłady przetwarzania odzyskują stal, miedź, aluminium i tworzywa; czynniki chłodnicze są wychwytywane, by nie trafiły do atmosfery.',
		legal:
			'Dystrybutor przy dostawie nowego sprzętu ma obowiązek nieodpłatnie odebrać stary tego samego rodzaju (ustawa o ZSEiE z 11 września 2015 r., art. 37).',
		faq: [
			{
				q: 'Czy kurier z nowym sprzętem musi zabrać stary?',
				a: 'Tak, jeśli zaznaczysz to przy zakupie — dystrybutor ma ustawowy obowiązek odbioru 1:1 przy dostawie. Sprzęt musi być odłączony i przygotowany.',
			},
			{
				q: 'Czy dostanę pieniądze za stary sprzęt?',
				a: 'W skupach złomu z uprawnieniami do zbierania ZSEiE — czasem tak. Sklepy i PSZOK przyjmują bezpłatnie, ale bez zapłaty.',
			},
		],
		categories: ['weee'],
		finderUrl: '/?cat=weee',
	},
	{
		slug: 'maly-sprzet-elektroniczny',
		title: 'Mały sprzęt elektroniczny',
		metaTitle: 'Gdzie oddać stary telefon, laptop, czajnik?',
		metaDescription:
			'Drobną elektronikę przyjmują bezpłatnie elektromarkety (bez zakupu!), pojemniki na elektroodpady i PSZOK. Sprawdź zasady i wyczyść dane przed oddaniem.',
		intro:
			'Telefon, czajnik czy ładowarka — drobną elektronikę oddasz najłatwiej: sklepy elektroniczne o powierzchni od 400 m² mają obowiązek przyjąć mały sprzęt (do 25 cm) bez żadnego zakupu. Pojemniki na elektroodpady stoją też w wielu marketach i urzędach.',
		accepted: [
			'telefony, tablety, laptopy',
			'mały sprzęt kuchenny: czajniki, tostery, miksery',
			'suszarki, golarki, szczoteczki elektryczne',
			'kable, ładowarki, myszki, klawiatury',
			'elektronarzędzia i zabawki elektroniczne',
		],
		notAccepted: [
			'sprzęt większy niż 25 cm w sklepie bez zakupu — ten podlega zasadzie 1:1 albo PSZOK',
			'same baterie — te do pojemnika na baterie',
		],
		prep: [
			'Usuń dane: reset fabryczny telefonu/laptopa, wyjmij karty SIM i pamięci.',
			'Wyjmij baterie i akumulatorki, jeśli da się je łatwo wyjąć — oddaj osobno.',
			'Sprawny sprzęt rozważ sprzedać lub oddać — ponowne użycie bije recykling.',
		],
		afterLife:
			'Z elektroniki odzyskuje się złoto, srebro, miedź i pierwiastki ziem rzadkich; tona telefonów zawiera więcej złota niż tona rudy.',
		legal:
			'Sklepy o powierzchni sprzedaży ZSEiE od 400 m² przyjmują mały sprzęt (żaden wymiar nie przekracza 25 cm) nieodpłatnie i bez zakupu (ustawa o ZSEiE, art. 37 ust. 3).',
		faq: [
			{
				q: 'Czy muszę coś kupić, żeby oddać stary telefon w elektromarkecie?',
				a: 'Nie. Dla sprzętu do 25 cm duże elektromarkety mają obowiązek przyjęcia bez zakupu.',
			},
			{
				q: 'Co ze zużytymi tonerami i kartridżami?',
				a: 'Formalnie to nie ZSEiE — przyjmują je niektóre sklepy papiernicze, programy producentów i PSZOK.',
			},
		],
		categories: ['small'],
		finderUrl: '/?cat=small',
	},
	{
		slug: 'swietlowki-i-zarowki',
		title: 'Świetlówki i żarówki',
		metaTitle: 'Gdzie wyrzucić świetlówki i żarówki LED?',
		metaDescription:
			'Świetlówki zawierają rtęć i nie mogą trafić do szkła ani zmieszanych. Pojemniki znajdziesz w marketach budowlanych; zwykła żarówka to odpad zmieszany.',
		intro:
			'Uwaga na częsty błąd: świetlówki i LED-y to elektroodpady, ale tradycyjna żarówka wolframowa — nie. Świetlówki zawierają rtęć i muszą trafić do specjalnego pojemnika; zwykłą żarówkę można wyrzucić do zmieszanych.',
		accepted: [
			'świetlówki kompaktowe (energooszczędne)',
			'świetlówki liniowe („jarzeniówki”)',
			'żarówki i moduły LED',
			'lampy wyładowcze i halogenki metalohalogenkowe',
		],
		notAccepted: [
			'tradycyjne żarówki wolframowe i halogenowe — te do zmieszanych',
			'oprawy lamp — kompletna lampa to mały sprzęt elektroniczny',
		],
		prep: [
			'Nie tłucz świetlówek — rtęć uwalnia się z uszkodzonych rur.',
			'Przewoź w oryginalnym pudełku lub owinięte, by nie pękły.',
			'Rozbita świetlówka: przewietrz pomieszczenie, zbierz odłamki na mokry ręcznik do słoika i oddaj do PSZOK.',
		],
		afterLife:
			'Ze świetlówek odzyskuje się szkło, metale i luminofor; rtęć jest destylowana i wraca do przemysłu w obiegu zamkniętym.',
		legal:
			'Zużyte źródła światła to ZSEiE — sklepy oświetleniowe i markety budowlane prowadzą ich zbiórkę na zasadach ustawy o ZSEiE.',
		faq: [
			{
				q: 'Dlaczego zwykła żarówka nie idzie do szkła?',
				a: 'Szkło żarówki ma inny skład niż opakowaniowe i psuje wytop w hucie. Żarówka wolframowa to odpad zmieszany.',
			},
			{
				q: 'Gdzie w markecie budowlanym stoi pojemnik na świetlówki?',
				a: 'Zwykle przy wejściu lub punkcie obsługi klienta, obok pojemnika na baterie. Obsługa wskaże, jeśli go nie widzisz.',
			},
		],
		categories: ['lamp'],
		finderUrl: '/?cat=lamp',
	},
	{
		slug: 'wielkogabaryty',
		title: 'Odpady wielkogabarytowe',
		metaTitle: 'Gdzie oddać starą kanapę, meble, materac?',
		metaDescription:
			'Meble, materace i dywany odbierze gmina w ramach zbiórek wielkogabarytowych albo przyjmie PSZOK. Zobacz terminy, zasady i czego nie wystawiać.',
		intro:
			'Kanapa, szafa czy materac nie zmieszczą się w żadnym pojemniku — i nie wolno ich po prostu postawić przy śmietniku poza terminem zbiórki. Masz dwie legalne drogi: okresowa zbiórka wielkogabarytów sprzed domu (terminy ustala gmina) albo własny transport do PSZOK.',
		accepted: [
			'meble: kanapy, szafy, stoły, krzesła',
			'materace, dywany, wykładziny',
			'wózki dziecięce, foteliki, rowery',
			'drzwi i duże elementy wyposażenia',
		],
		notAccepted: [
			'odpady budowlane i rozbiórkowe (gruz, okna, panele) — osobne zasady i limity',
			'sprzęt AGD — to elektroodpady, zobacz osobny poradnik',
			'części samochodowe',
		],
		prep: [
			'Sprawdź harmonogram zbiórek wielkogabarytowych na stronie gminy.',
			'Wystaw odpady najwcześniej dzień przed terminem — wcześniej to zaśmiecanie.',
			'Sprawne meble spróbuj najpierw oddać: fundacje, grupy sąsiedzkie, „oddam za darmo”.',
		],
		afterLife:
			'Wielkogabaryty są rozbierane: drewno idzie na płyty i paliwo, metal do hut, pianki i tkaniny na paliwo alternatywne.',
		legal:
			'Odbiór wielkogabarytów i ich przyjmowanie w PSZOK to obowiązek gminy w ramach opłaty śmieciowej (ustawa o utrzymaniu czystości i porządku w gminach).',
		faq: [
			{
				q: 'Wystawiłem kanapę przy śmietniku, a nikt jej nie zabrał — dlaczego?',
				a: 'Wielkogabaryty odbierane są tylko w wyznaczonych terminach. Poza nimi wystawienie mebli to zaśmiecanie — grozi mandat.',
			},
			{
				q: 'Czy PSZOK przyjmie rzeczy z remontu mieszkania?',
				a: 'Meble tak; gruz i materiały budowlane podlegają limitom rocznym, a ich nadwyżkę trzeba oddać odpłatnie wyspecjalizowanej firmie.',
			},
		],
		categories: ['bulky'],
		finderUrl: '/?cat=bulky',
	},
	{
		slug: 'tekstylia',
		title: 'Tekstylia i ubrania',
		metaTitle: 'Gdzie oddać stare ubrania i tekstylia? Nowe zasady od 2025',
		metaDescription:
			'Od 2025 r. tekstyliów nie wolno wyrzucać do zmieszanych. Ubrania oddasz w PSZOK, kontenerach charytatywnych i sklepach z programami zbiórki.',
		intro:
			'Od 1 stycznia 2025 r. selektywna zbiórka tekstyliów jest w Polsce obowiązkowa — ubrania, pościel i ręczniki nie mogą już trafiać do zmieszanych. Sprawne rzeczy najlepiej oddać do ponownego użycia; zniszczone przyjmie PSZOK.',
		accepted: [
			'ubrania i bielizna (także zniszczone)',
			'buty, torby, paski',
			'pościel, ręczniki, koce, zasłony',
		],
		notAccepted: [
			'tekstylia mokre, zaolejone lub skażone chemikaliami — te do zmieszanych/PSZOK jako odpad niebezpieczny',
			'dywany i wykładziny — to wielkogabaryty',
		],
		prep: [
			'Rzeczy do kontenerów charytatywnych: czyste, suche, w zawiązanych workach.',
			'Buty zwiąż parami.',
			'Zniszczone tekstylia (szmaty) oddaj do PSZOK — nie do kontenera na odzież używaną.',
		],
		afterLife:
			'Sprawna odzież trafia do ponownego użycia; reszta jest sortowana na czyściwo przemysłowe, włókna do izolacji i paliwo alternatywne.',
		legal:
			'Obowiązek selektywnego zbierania tekstyliów od 1 stycznia 2025 r. wynika z ustawy o utrzymaniu czystości i porządku w gminach (implementacja dyrektywy UE 2018/851).',
		faq: [
			{
				q: 'Czy podarte ubrania też mam segregować?',
				a: 'Tak — od 2025 r. wszystkie tekstylia zbiera się selektywnie. Podarte rzeczy oddaj w PSZOK; kontenery charytatywne są tylko na odzież nadającą się do noszenia.',
			},
			{
				q: 'Czy kontenery na odzież na osiedlu są legalne?',
				a: 'Legalne są kontenery oznaczone nazwą i danymi prowadzącego zbiórkę. Anonimowe kontenery bywają nielegalne — lepiej wybrać oznakowany lub PSZOK.',
			},
		],
		categories: ['textiles'],
		finderUrl: '/?cat=textiles',
	},
	{
		slug: 'pszok',
		title: 'Czym jest PSZOK?',
		metaTitle: 'PSZOK — co to jest, co przyjmuje i ile kosztuje?',
		metaDescription:
			'PSZOK to gminny punkt selektywnej zbiórki odpadów — bezpłatny dla mieszkańców. Zobacz, co przyjmuje, jakie są limity i jak się przygotować do wizyty.',
		intro:
			'PSZOK (Punkt Selektywnego Zbierania Odpadów Komunalnych) to prowadzone przez gminę miejsce, gdzie mieszkańcy bezpłatnie oddają odpady problemowe: od elektroodpadów i chemikaliów po gruz i wielkogabaryty. Każda gmina w Polsce ma obowiązek zapewnić dostęp do co najmniej jednego.',
		accepted: [
			'elektroodpady, baterie i akumulatory',
			'oleje, chemikalia, farby i opony',
			'przeterminowane leki',
			'wielkogabaryty i tekstylia',
			'odpady zielone, gruz (z limitami)',
		],
		notAccepted: [
			'odpady z działalności gospodarczej',
			'azbest i materiały wybuchowe',
			'odpady zmieszane',
		],
		prep: [
			'Zabierz dokument — PSZOK obsługuje mieszkańców swojej gminy i może poprosić o potwierdzenie (np. deklarację śmieciową).',
			'Posegreguj odpady przed przyjazdem — rozładowujesz je samodzielnie do wskazanych kontenerów.',
			'Sprawdź godziny i limity w regulaminie na stronie gminy lub zadzwoń.',
		],
		afterLife:
			'Z PSZOK odpady jadą do wyspecjalizowanych instalacji: recyklingu, kompostowni i spalarni odpadów niebezpiecznych.',
		legal:
			'Utworzenie PSZOK to ustawowy obowiązek gminy, finansowany z opłaty za gospodarowanie odpadami (ustawa o utrzymaniu czystości i porządku w gminach, art. 3 ust. 2 pkt 6).',
		faq: [
			{
				q: 'Czy PSZOK jest naprawdę bezpłatny?',
				a: 'Dla mieszkańców gminy — tak, bo finansujesz go w opłacie śmieciowej. Limity (np. na gruz czy opony) wynikają z regulaminu gminy.',
			},
			{
				q: 'Czy mogę pojechać do PSZOK w sąsiedniej gminie?',
				a: 'Zwykle nie — PSZOK obsługuje mieszkańców własnej gminy. Niektóre gminy mają porozumienia międzygminne; sprawdź regulamin.',
			},
			{
				q: 'Czy PSZOK odbierze odpady z mojego domu?',
				a: 'Standardowo nie — dowozisz je sam. Część gmin oferuje osobno płatny lub okresowy odbiór wielkogabarytów i elektroodpadów z domu.',
			},
		],
		categories: [],
		finderUrl: '/?tb=municipal',
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
