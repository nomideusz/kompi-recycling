# Item-First Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorient recycling.kompi.pl around "I have a thing — where do I take it?": 7 new waste categories backfilled onto PSZOKs, an item dictionary powering an item-first home page, task-oriented point pages, and prerendered `/poradnik` guides.

**Architecture:** SvelteKit 2 + Svelte 5 (runes), fully prerendered; data frozen at build from Turso into static tiles. New logic is additive: a pure-data item dictionary (`items.ts`) and guides module (`guides.ts`) feed existing `filterPoints`. No new API endpoints, no tile format change beyond new category ids.

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, Drizzle/libsql (Turso), Vitest (new, dev-only), pnpm.

**Spec:** `docs/superpowers/specs/2026-07-17-item-first-redesign-design.md`

## Global Constraints

- All UI copy in Polish.
- Dark theme; accent is orange `#f97e21` only. Never introduce green/neon accent palettes.
- Home (`/`), point pages, poradnik pages, sitemap: `prerender = true` must be preserved.
- No new runtime dependencies. Vitest is the only new devDependency.
- Package manager: `pnpm`. Type gate: `pnpm check` must pass at the end of every task.
- Local dev has a stub DB (`TURSO_DATABASE_URL=file:local.db` in `.env`); the app falls back to seed `POINTS` from `src/lib/data.ts`. Never require live Turso for a task to pass.
- Git: commit at the end of every task; message style `feat:`/`fix:`/`docs:` as in history; end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Svelte 5 syntax only: `$props()`, `$state()`, `$derived()`, `$effect()`, `onclick` (not `on:click`).
- Indentation: tabs in `src/lib/*.ts`, 4 spaces in `.svelte` files under `src/routes`, 2 spaces in `src/lib/components` — match whatever the file you touch already uses.

---

### Task 1: Extend the category taxonomy

**Files:**
- Modify: `src/lib/types.ts:1-6` (CategoryId union)
- Modify: `src/lib/categories.ts` (7 new entries + relabel battery)
- Modify: `src/app.css:75-79` (7 new color tokens)
- Modify: `src/lib/data.ts` (seed PSZOK points get new categories so local dev shows them)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CategoryId` union with 12 members; `CATEGORIES` / `CATEGORIES_BY_ID` covering all 12; CSS vars `--kompi-cat-car-battery`, `--kompi-cat-oil`, `--kompi-cat-tires`, `--kompi-cat-chemicals`, `--kompi-cat-meds`, `--kompi-cat-bulky`, `--kompi-cat-textiles`. Every later task relies on these ids exactly: `car_battery`, `oil`, `tires`, `chemicals`, `meds`, `bulky`, `textiles`.

- [ ] **Step 1: Extend `CategoryId` in `src/lib/types.ts`**

Replace lines 1–6 with:

```ts
export type CategoryId =
	| 'weee'
	| 'battery'
	| 'lamp'
	| 'small'
	| 'mobile'
	| 'car_battery'
	| 'oil'
	| 'tires'
	| 'chemicals'
	| 'meds'
	| 'bulky'
	| 'textiles';
```

- [ ] **Step 2: Add categories + relabel battery in `src/lib/categories.ts`**

Change the `battery` entry's label to `'Baterie (małe)'` and its description to `'Baterie jednorazowe i akumulatorki AA/AAA'`. Then append to the `CATEGORIES` array (before the closing `];`):

```ts
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
```

- [ ] **Step 3: Add color tokens in `src/app.css`**

Directly after the existing block ending with `--kompi-cat-mobile: #272d2e; /* Dark */` (line 79), add:

```css
    --kompi-cat-car-battery: #c2410c; /* Deep orange */
    --kompi-cat-oil: #92400e; /* Brown */
    --kompi-cat-tires: #52525b; /* Graphite */
    --kompi-cat-chemicals: #9333ea; /* Violet */
    --kompi-cat-meds: #dc2626; /* Red */
    --kompi-cat-bulky: #0d9488; /* Teal */
    --kompi-cat-textiles: #db2777; /* Magenta */
```

(Functional category colors, like the existing blue for `weee`; the brand accent remains orange only.)

- [ ] **Step 4: Update seed data in `src/lib/data.ts`**

For every seed point with `takebackType: 'municipal'`, extend its `categories` array to:

```ts
categories: ['weee', 'small', 'battery', 'lamp', 'car_battery', 'oil', 'tires', 'chemicals', 'meds', 'bulky', 'textiles'],
```

Leave non-municipal seed points unchanged. This mirrors what the Task 3 backfill does to production data, so local dev exercises the new categories.

- [ ] **Step 5: Verify**

Run: `pnpm check`
Expected: `svelte-check found 0 errors and 0 warnings` (warnings count may match pre-existing baseline; zero NEW errors).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/categories.ts src/app.css src/lib/data.ts
git commit -m "feat: extend taxonomy with 7 PSZOK waste categories"
```

---

### Task 2: Vitest + item dictionary with matcher

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `vitest.config.ts`
- Create: `src/lib/items.ts`
- Test: `src/lib/items.test.ts`

**Interfaces:**
- Consumes: `normalize(input: string): string` from `$lib/search`; `CategoryId` from `$lib/types`.
- Produces:
  - `type WasteItem = { id: string; name: string; synonyms: string[]; categories: CategoryId[]; rules?: string; guideSlug?: string; popular?: boolean }`
  - `ITEMS: WasteItem[]` (~60 entries), `ITEMS_BY_ID: Record<string, WasteItem>`, `POPULAR_ITEMS: WasteItem[]` (exactly 12)
  - `matchItems(query: string, limit?: number): WasteItem[]` — empty array for queries under 2 normalized chars.
  - `guideSlug` values reference guides created in Tasks 10–11; integrity is tested in Task 11.

- [ ] **Step 1: Install Vitest and add script**

Run: `pnpm add -D vitest`
Then in `package.json` scripts add: `"test": "vitest run"`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
	},
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
		},
	},
});
```

(Pure-data modules only — no Svelte plugin needed; `search.ts`'s import from `SearchBox.svelte` is type-only and erased.)

- [ ] **Step 3: Write the failing test `src/lib/items.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_ID } from '$lib/categories';
import { ITEMS, ITEMS_BY_ID, POPULAR_ITEMS, matchItems } from '$lib/items';

describe('ITEMS integrity', () => {
	it('has unique ids', () => {
		const ids = ITEMS.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('references only existing categories', () => {
		for (const item of ITEMS) {
			expect(item.categories.length).toBeGreaterThan(0);
			for (const c of item.categories) {
				expect(CATEGORIES_BY_ID[c], `${item.id} → ${c}`).toBeDefined();
			}
		}
	});

	it('exposes exactly 12 popular items for the hero grid', () => {
		expect(POPULAR_ITEMS).toHaveLength(12);
	});

	it('ITEMS_BY_ID round-trips', () => {
		expect(ITEMS_BY_ID['olej-silnikowy']?.categories).toContain('oil');
	});
});

describe('matchItems', () => {
	it('returns [] for empty and 1-char queries', () => {
		expect(matchItems('')).toEqual([]);
		expect(matchItems('a')).toEqual([]);
	});

	it('matches exact names first', () => {
		expect(matchItems('baterie')[0]?.id).toBe('baterie');
	});

	it('is diacritic-insensitive both ways', () => {
		expect(matchItems('żarówki')[0]?.id).toBe('zarowki');
		expect(matchItems('zarowki')[0]?.id).toBe('zarowki');
	});

	it('matches synonyms', () => {
		expect(matchItems('laptop')[0]?.id).toBe('komputer');
		expect(matchItems('wersalka')[0]?.id).toBe('kanapa');
	});

	it('matches items embedded in a phrase', () => {
		expect(matchItems('akumulator z auta').map((i) => i.id)).toContain('akumulator');
	});

	it('respects the limit', () => {
		expect(matchItems('ol', 3).length).toBeLessThanOrEqual(3);
	});
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '$lib/items'` (or equivalent resolve error).

- [ ] **Step 5: Create `src/lib/items.ts`**

```ts
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `items.test.ts` tests green.

- [ ] **Step 7: Verify types and commit**

Run: `pnpm check`
Expected: 0 new errors.

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/items.ts src/lib/items.test.ts
git commit -m "feat: item dictionary with matcher + vitest setup"
```

---

### Task 3: PSZOK category backfill (SQL + runner)

**Files:**
- Create: `drizzle/backfill_pszok_categories.sql`
- Modify: `scripts/run-backfill.ts` (accept SQL filename as argv)

**Interfaces:**
- Consumes: `recycling_points` schema (`categories_json` TEXT JSON array, `takeback_type` TEXT).
- Produces: idempotent SQL that tags all `takeback_type = 'municipal'` rows with the 7 new category ids. Run against Turso by the user post-merge: `pnpm tsx scripts/run-backfill.ts backfill_pszok_categories.sql`.

- [ ] **Step 1: Create `drizzle/backfill_pszok_categories.sql`**

```sql
-- Statutory PSZOK acceptance list (ustawa o utrzymaniu czystości i porządku
-- w gminach, art. 3 ust. 2 pkt 6): every municipal collection point must
-- accept these waste streams, so tag every 'municipal' row with them.
-- Idempotent: instr() guard skips rows already tagged. One statement per
-- line — the runner splits on ';' and strips full-line comments.
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'car_battery') WHERE takeback_type = 'municipal' AND instr(categories_json, '"car_battery"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'oil') WHERE takeback_type = 'municipal' AND instr(categories_json, '"oil"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'tires') WHERE takeback_type = 'municipal' AND instr(categories_json, '"tires"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'chemicals') WHERE takeback_type = 'municipal' AND instr(categories_json, '"chemicals"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'meds') WHERE takeback_type = 'municipal' AND instr(categories_json, '"meds"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'bulky') WHERE takeback_type = 'municipal' AND instr(categories_json, '"bulky"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'textiles') WHERE takeback_type = 'municipal' AND instr(categories_json, '"textiles"') = 0;
```

- [ ] **Step 2: Generalize `scripts/run-backfill.ts`**

Replace the hardcoded path lines:

```ts
const here = dirname(fileURLToPath(import.meta.url));
const sqlFile = process.argv[2] ?? 'backfill_takeback_type.sql';
const sqlPath = resolve(here, '..', 'drizzle', sqlFile);
```

and update the doc comment at the top to:

```ts
/**
 * Apply a SQL backfill from drizzle/ to the configured Turso DB.
 *
 *   pnpm tsx scripts/run-backfill.ts [backfill_file.sql]
 *
 * Defaults to backfill_takeback_type.sql. Reads TURSO_DATABASE_URL +
 * TURSO_AUTH_TOKEN from .env, runs each UPDATE, and reports rows affected.
 */
```

Also change the "Before/After" summary queries so they work for any backfill — replace both `SELECT takeback_type, COUNT(*) ...` statements with:

```ts
const summarize = async (label: string) => {
  const rs = await client.execute(
    `SELECT takeback_type, COUNT(*) AS n, SUM(length(categories_json) - length(replace(categories_json, ',', ''))) + COUNT(*) AS cat_entries FROM recycling_points GROUP BY takeback_type ORDER BY n DESC`,
  );
  console.log(label);
  for (const row of rs.rows) console.log(`  ${row.takeback_type}: ${row.n} rows, ${row.cat_entries} category entries`);
};
await summarize('Before:');
```

(and `await summarize(`\nAfter (total updates: ${total}):`)` at the end, removing the old before/after blocks).

- [ ] **Step 3: Integration-check locally against a throwaway file DB**

Write a temporary script `scripts/tmp-backfill-check.ts`:

```ts
import { createClient } from '@libsql/client';

const c = createClient({ url: 'file:tmp-backfill-test.db' });
await c.execute(`CREATE TABLE IF NOT EXISTS recycling_points (
  slug TEXT PRIMARY KEY, google_place_id TEXT, name TEXT NOT NULL,
  operator TEXT DEFAULT '', city TEXT NOT NULL, address TEXT DEFAULT '',
  postal_code TEXT DEFAULT '', lat REAL NOT NULL, lng REAL NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]', hours TEXT DEFAULT '',
  phone TEXT, website TEXT, notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  takeback_type TEXT NOT NULL DEFAULT 'municipal',
  last_seen TEXT, created_at TEXT
)`);
await c.execute(`INSERT OR IGNORE INTO recycling_points (slug, name, city, lat, lng, categories_json, takeback_type) VALUES
  ('pszok-1','PSZOK Test','Testowo',52,21,'["weee","battery"]','municipal'),
  ('shop-1','Sklep Test','Testowo',52,21,'["battery"]','free_dropbox')`);
const rows = await c.execute('SELECT slug, categories_json FROM recycling_points ORDER BY slug');
for (const r of rows.rows) console.log(r.slug, r.categories_json);
await c.close();
```

Run in Git Bash:

```bash
pnpm tsx scripts/tmp-backfill-check.ts
TURSO_DATABASE_URL=file:tmp-backfill-test.db pnpm tsx scripts/run-backfill.ts backfill_pszok_categories.sql
TURSO_DATABASE_URL=file:tmp-backfill-test.db pnpm tsx scripts/run-backfill.ts backfill_pszok_categories.sql
pnpm tsx scripts/tmp-backfill-check.ts
```

Expected: first backfill run reports `rowsAffected=1` for each of the 7 statements; the second run reports `rowsAffected=0` for all (idempotent). Final print shows `pszok-1` with all 7 new ids appended exactly once and `shop-1` unchanged as `["battery"]`.

- [ ] **Step 4: Clean up and commit**

```bash
rm scripts/tmp-backfill-check.ts tmp-backfill-test.db
git add drizzle/backfill_pszok_categories.sql scripts/run-backfill.ts
git commit -m "feat: idempotent PSZOK category backfill + parametrized runner"
```

**Post-merge operator note (goes in the PR/handoff message, not code):** run `pnpm tsx scripts/run-backfill.ts backfill_pszok_categories.sql` with production Turso creds in `.env`, then trigger the Netlify build hook to re-bake tiles.

---

### Task 4: SiteHeader + SiteFooter + layout integration

**Files:**
- Create: `src/lib/components/SiteHeader.svelte`
- Create: `src/lib/components/SiteFooter.svelte`
- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/punkt/[slug]/+page.svelte` (remove its private `.topbar` block — the global header replaces it)

**Interfaces:**
- Consumes: `$app/state` `page`, logo asset `$lib/images/logo/logo-kompi-white.png`.
- Produces: `<SiteHeader />` and `<SiteFooter />`, no props. Layout renders header above and footer below `{@render children()}`. The `/poradnik` nav link 404s until Task 10 — acceptable within the same PR, note it in the commit body.

- [ ] **Step 1: Create `src/lib/components/SiteHeader.svelte`**

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import KompiLogo from '$lib/images/logo/logo-kompi-white.png';

  const path = $derived(page.url.pathname);
</script>

<header class="site-header">
  <div class="inner">
    <a class="brand" href="/">
      <img src={KompiLogo} alt="Kompi" width="100" height="30" />
      <span class="tag">recycling</span>
    </a>
    <nav aria-label="Nawigacja główna">
      <a href="/" aria-current={path === '/' ? 'page' : undefined}>Mapa</a>
      <a
        href="/poradnik"
        aria-current={path.startsWith('/poradnik') ? 'page' : undefined}
        >Poradnik</a
      >
    </nav>
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--kompi-border);
    background: var(--kompi-bg);
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .brand img {
    display: block;
    height: 26px;
    width: auto;
  }
  .tag {
    font-size: 14px;
    font-weight: 600;
    color: var(--kompi-text-2);
    border-left: 1px solid var(--kompi-border-strong);
    padding-left: 10px;
  }
  nav {
    display: flex;
    gap: 4px;
  }
  nav a {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--kompi-text-2);
    text-decoration: none;
  }
  nav a:hover {
    color: var(--kompi-text);
    background: rgba(255, 255, 255, 0.06);
    text-decoration: none;
  }
  nav a[aria-current='page'] {
    color: var(--kompi-accent);
    background: var(--kompi-accent-subtle);
  }
</style>
```

- [ ] **Step 2: Create `src/lib/components/SiteFooter.svelte`**

```svelte
<footer class="site-footer">
  <div class="inner">
    <p class="about">
      recycling.kompi.pl — niekomercyjna mapa punktów zbiórki odpadów
      problematycznych w Polsce. Dane pochodzą m.in. z Google Places oraz
      wykazów gminnych i są aktualizowane automatycznie.
    </p>
    <nav aria-label="Stopka">
      <a href="/">Mapa</a>
      <a href="/poradnik">Poradnik</a>
      <a href="mailto:kontakt@kompi.pl">kontakt@kompi.pl</a>
    </nav>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--kompi-border);
    background: var(--kompi-bg-subtle);
    margin-top: auto;
  }
  .inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 20px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }
  .about {
    margin: 0;
    font-size: 13px;
    color: var(--kompi-text-3);
    max-width: 560px;
    line-height: 1.6;
  }
  nav {
    display: flex;
    gap: 18px;
    font-size: 13px;
  }
  nav a {
    color: var(--kompi-text-2);
    font-weight: 600;
  }
</style>
```

- [ ] **Step 3: Integrate into `src/routes/+layout.svelte`**

Replace the file's markup section (keep the script and existing styles) with:

```svelte
<a href="#main" class="sr-only sr-only-focusable">Przejdź do treści</a>

<SiteHeader />

<main id="main" class:map={isMapPage}>
  {@render children()}
</main>

<SiteFooter />
```

and add to the script block:

```ts
import SiteHeader from '$lib/components/SiteHeader.svelte';
import SiteFooter from '$lib/components/SiteFooter.svelte';
```

Keep `isMapPage` and `main.map` for now — the fixed map covers header/footer on `/`, which is the current (correct) behavior until Task 6 reworks the home page.

- [ ] **Step 4: Remove the duplicate topbar from the point page**

In `src/routes/punkt/[slug]/+page.svelte`, delete the entire `<div class="topbar">…</div>` block (lines 102–133) and the now-unused `KompiLogo` import plus all `.topbar*`, `.brand*`, `.back` style rules that reference only that block. The breadcrumbs `<nav class="crumbs">` stays.

- [ ] **Step 5: Verify**

Run: `pnpm check` — 0 new errors.
Run: `pnpm dev` and confirm: header+footer visible on `/punkt/warszawa-pszok-zawodzie` (seed data), exactly one header, home `/` unchanged (map still fills viewport).

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/SiteHeader.svelte src/lib/components/SiteFooter.svelte src/routes/+layout.svelte "src/routes/punkt/[slug]/+page.svelte"
git commit -m "feat: global site header/footer; drop per-page topbar"
```

(Note in body: `/poradnik` link lands with the guides tasks in this same PR.)

---

### Task 5: ItemSearch + ItemTiles components

**Files:**
- Create: `src/lib/components/ItemSearch.svelte`
- Create: `src/lib/components/ItemTiles.svelte`

**Interfaces:**
- Consumes: `matchItems`, `POPULAR_ITEMS`, `type WasteItem` from `$lib/items`; `CATEGORIES_BY_ID` from `$lib/categories`.
- Produces:
  - `ItemSearch` props: `{ onpick: (item: WasteItem) => void; onfreetext?: (query: string) => void; placeholder?: string }`. `onfreetext` fires on Enter when nothing matches (fallback to point search).
  - `ItemTiles` props: `{ onpick: (item: WasteItem) => void }`.

- [ ] **Step 1: Create `src/lib/components/ItemSearch.svelte`**

```svelte
<script lang="ts">
  import { matchItems, type WasteItem } from '$lib/items';
  import { CATEGORIES_BY_ID } from '$lib/categories';

  let {
    onpick,
    onfreetext,
    placeholder = 'np. akumulator, olej silnikowy, laptop…',
  }: {
    onpick: (item: WasteItem) => void;
    onfreetext?: (query: string) => void;
    placeholder?: string;
  } = $props();

  let query = $state('');
  let open = $state(false);
  let active = $state(-1);
  let inputEl: HTMLInputElement | undefined = $state();

  const results = $derived(matchItems(query, 7));

  function pick(item: WasteItem) {
    onpick(item);
    query = '';
    open = false;
    active = -1;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open = true;
      active = Math.min(active + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && results[active]) pick(results[active]);
      else if (results.length > 0) pick(results[0]);
      else if (query.trim() && onfreetext) {
        onfreetext(query.trim());
        query = '';
        open = false;
      }
    } else if (e.key === 'Escape') {
      open = false;
      active = -1;
    }
  }
</script>

<div class="item-search">
  <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <input
    bind:this={inputEl}
    bind:value={query}
    type="text"
    role="combobox"
    aria-expanded={open && results.length > 0}
    aria-controls="item-search-listbox"
    aria-activedescendant={active >= 0 ? `item-opt-${active}` : undefined}
    aria-label="Co chcesz oddać?"
    autocomplete="off"
    {placeholder}
    oninput={() => {
      open = true;
      active = -1;
    }}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    {onkeydown}
  />
  {#if open && results.length > 0}
    <ul class="listbox" id="item-search-listbox" role="listbox">
      {#each results as item, i (item.id)}
        {@const cat = CATEGORIES_BY_ID[item.categories[0]]}
        <li
          id="item-opt-{i}"
          role="option"
          aria-selected={i === active}
          class:active={i === active}
        >
          <button
            type="button"
            onmousedown={(e) => {
              e.preventDefault();
              pick(item);
            }}
            onmouseenter={() => (active = i)}
          >
            <span class="dot" style="background: var({cat.colorVar});" aria-hidden="true"></span>
            <span class="name">{item.name}</span>
            <span class="cat">{cat.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .item-search {
    position: relative;
  }
  .icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--kompi-text-4);
    pointer-events: none;
  }
  input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    font-size: 16px;
    color: var(--kompi-text);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--kompi-border-strong);
    border-radius: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  input:focus {
    border-color: var(--kompi-accent);
    box-shadow: 0 0 0 3px var(--kompi-accent-muted);
  }
  input::placeholder {
    color: var(--kompi-text-4);
  }
  .listbox {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 30;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--kompi-bg-subtle);
    border: 1px solid var(--kompi-border-strong);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    max-height: 320px;
    overflow-y: auto;
  }
  .listbox button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: 0;
    border-radius: 10px;
    color: var(--kompi-text);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  li.active button,
  .listbox button:hover {
    background: var(--kompi-accent-subtle);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .name {
    font-weight: 600;
    flex: 1;
  }
  .cat {
    font-size: 12px;
    color: var(--kompi-text-3);
  }
</style>
```

- [ ] **Step 2: Create `src/lib/components/ItemTiles.svelte`**

```svelte
<script lang="ts">
  import { POPULAR_ITEMS, type WasteItem } from '$lib/items';
  import { CATEGORIES_BY_ID } from '$lib/categories';

  let { onpick }: { onpick: (item: WasteItem) => void } = $props();
</script>

<div class="tiles" role="group" aria-label="Popularne rzeczy do oddania">
  {#each POPULAR_ITEMS as item (item.id)}
    {@const cat = CATEGORIES_BY_ID[item.categories[0]]}
    <button
      type="button"
      class="tile"
      style="--tile-color: var({cat.colorVar});"
      onclick={() => onpick(item)}
    >
      <span class="name">{item.name}</span>
      <span class="cat">{cat.label}</span>
    </button>
  {/each}
</div>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--kompi-border);
    border-left: 3px solid var(--tile-color);
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s var(--kompi-ease);
  }
  .tile:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--tile-color);
    transform: translateY(-2px);
  }
  .name {
    font-size: 14px;
    font-weight: 700;
    color: var(--kompi-text);
    line-height: 1.25;
  }
  .cat {
    font-size: 11px;
    color: var(--kompi-text-3);
  }
</style>
```

- [ ] **Step 3: Verify and commit**

Run: `pnpm check` — 0 new errors (components are not yet mounted; that's fine).

```bash
git add src/lib/components/ItemSearch.svelte src/lib/components/ItemTiles.svelte
git commit -m "feat: ItemSearch combobox + popular-item tiles"
```

---

### Task 6: Item-first home — landing mode + results mode

**Files:**
- Modify: `src/routes/+page.svelte` (landing branch, item state, URL param, meta copy)
- Modify: `src/routes/+layout.svelte` (drop `isMapPage`; main always column-flex)

**Interfaces:**
- Consumes: `ItemSearch`, `ItemTiles`, `ITEMS_BY_ID`, `type WasteItem`; everything the page already uses.
- Produces: state `selectedItemId: string | null`; URL param `item=<WasteItem id>`; `showResults` gates landing vs results. Task 7 consumes `selectedItemId` for the RulesBox; Task 12 restyles the results layout for mobile.

- [ ] **Step 1: Simplify the layout**

In `src/routes/+layout.svelte`: delete the `isMapPage` derivation and the `class:map` / `main.map` style rule. `main` keeps `display:flex; flex-direction:column; min-height:100dvh; flex: 1`.

- [ ] **Step 2: Add item state + URL round-trip in `src/routes/+page.svelte`**

In the script block add:

```ts
import ItemSearch from "$lib/components/ItemSearch.svelte";
import ItemTiles from "$lib/components/ItemTiles.svelte";
import { ITEMS_BY_ID, type WasteItem } from "$lib/items";

let selectedItemId = $state<string | null>(null);
const selectedItem = $derived(
    selectedItemId ? (ITEMS_BY_ID[selectedItemId] ?? null) : null,
);

function pickItem(item: WasteItem) {
    selectedItemId = item.id;
    categories = new Set(item.categories);
}

function clearItem() {
    selectedItemId = null;
    categories = new Set();
}
```

In the browser URL-restore block (after the `tb` handling) add:

```ts
const itemParam = sp.get("item");
if (itemParam && itemParam in ITEMS_BY_ID) {
    selectedItemId = itemParam;
    categories = new Set(ITEMS_BY_ID[itemParam].categories);
}
```

In the URL-mirror `$effect`, after the `tb` line add:

```ts
if (selectedItemId) sp.set("item", selectedItemId);
```

Extend `showResults`:

```ts
const showResults = $derived(
    selectedItemId !== null ||
        query.trim().length > 0 ||
        categories.size > 0 ||
        takebackTypes.size > 0 ||
        anchor !== null,
);
```

Extend the existing "Wyczyść filtry" button handler and the page-reset `$effect` (`void selectedItemId;` added to its dependency list) so clearing filters also runs `selectedItemId = null`.

- [ ] **Step 3: Branch the markup**

Wrap the existing `<div class="map-app">…</div>` in `{#if showResults} … {/if}` and change `.map-app` CSS from `position: absolute` to `position: fixed; inset: 0; z-index: 40;`. Add a landing branch before it:

```svelte
{#if !showResults}
    <div class="landing">
        <section class="hero">
            <h1>Gdzie oddać to, czego nie potrzebujesz?</h1>
            <p class="sub">
                {totalCount.toLocaleString("pl-PL")} punktów zbiórki w
                {cityCount.toLocaleString("pl-PL")} miastach w całej Polsce —
                elektroodpady, baterie, akumulatory, oleje, opony, leki i więcej.
            </p>
            <div class="hero-search">
                <ItemSearch onpick={pickItem} onfreetext={(q) => (query = q)} />
                <div class="hero-location">
                    <SearchBox
                        bind:query
                        results={suggestions}
                        loading={geocoding}
                        onselect={handleSelect}
                        placeholder="Miasto lub adres…"
                    />
                    <button
                        type="button"
                        class="locate-cta"
                        disabled={locating}
                        onclick={locateMe}
                    >
                        {locating ? "Lokalizuję…" : "📍 Użyj mojej lokalizacji"}
                    </button>
                </div>
            </div>
            <h2 class="tiles-h">Popularne</h2>
            <ItemTiles onpick={pickItem} />
        </section>

        <section class="how">
            <h2>Jak to działa?</h2>
            <ol>
                <li><strong>Wybierz rzecz</strong> — powiedz, czego chcesz się pozbyć.</li>
                <li><strong>Podaj lokalizację</strong> — adres, miasto albo GPS.</li>
                <li><strong>Jedź lub zadzwoń</strong> — dostaniesz adresy, godziny i zasady.</li>
            </ol>
        </section>

        <section class="edu">
            <h2>Poradnik recyklingu</h2>
            <p>
                Nie wiesz, czy PSZOK przyjmie twoje opony, albo co zrobić z
                przeterminowanymi lekami? Sprawdź zasady w prostym języku.
            </p>
            <a class="edu-cta" href="/poradnik">Przejdź do poradnika →</a>
        </section>
    </div>
{/if}
```

(If `SearchBox.svelte` has no `placeholder` prop, add one: `placeholder = 'Szukaj: miasto, adres, kod pocztowy…'` in its props with the current hardcoded placeholder as default.)

Landing styles (add to the page's `<style>`):

```css
.landing {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 48px 20px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
}
.hero h1 {
    font-size: clamp(28px, 5vw, 44px);
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
}
.hero .sub {
    color: var(--kompi-text-3);
    font-size: 16px;
    max-width: 640px;
    margin: 0 0 28px;
}
.hero-search {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 640px;
    margin-bottom: 36px;
}
.hero-location {
    display: flex;
    gap: 10px;
    align-items: stretch;
}
.hero-location > :global(*:first-child) {
    flex: 1;
}
.locate-cta {
    flex-shrink: 0;
    padding: 0 18px;
    border-radius: 14px;
    border: 1px solid var(--kompi-border-strong);
    background: rgba(255, 255, 255, 0.04);
    color: var(--kompi-text-2);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}
.locate-cta:hover {
    border-color: var(--kompi-accent);
    color: var(--kompi-accent);
}
.tiles-h {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--kompi-text-4);
    margin: 0 0 12px;
}
.how ol {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    list-style: none;
    counter-reset: step;
    padding: 0;
    margin: 16px 0 0;
}
.how li {
    counter-increment: step;
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--kompi-border);
    border-radius: 14px;
    color: var(--kompi-text-2);
    font-size: 14px;
    line-height: 1.5;
}
.how li::before {
    content: counter(step);
    display: block;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--kompi-accent-muted);
    color: var(--kompi-accent);
    font-weight: 700;
    display: grid;
    place-items: center;
    margin-bottom: 10px;
}
.how h2, .edu h2 {
    font-size: 22px;
    margin: 0;
}
.edu p {
    color: var(--kompi-text-3);
    max-width: 560px;
    margin: 10px 0 16px;
}
.edu-cta {
    font-weight: 700;
    color: var(--kompi-accent);
}
```

- [ ] **Step 4: Add a "back to start" affordance in results mode**

In the results-mode brand island, next to `brand-stats`, add:

```svelte
<button
    type="button"
    class="new-search"
    onclick={() => {
        clearItem();
        query = "";
        takebackTypes = new Set();
        anchor = null;
        radiusKm = null;
    }}
>
    ← Nowe wyszukiwanie
</button>
```

with style:

```css
.new-search {
    background: transparent;
    border: 0;
    color: var(--kompi-text-3);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}
.new-search:hover {
    color: var(--kompi-accent);
}
```

- [ ] **Step 5: Update home meta + JSON-LD copy**

In `<svelte:head>`: title → `recycling.kompi.pl — gdzie oddać elektroodpady, baterie, oleje i opony`; description → `Znajdź najbliższy punkt zbiórki: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia, leki, wielkogabaryty i tekstylia. Ponad 30 000 punktów w całej Polsce.`; extend the keywords meta with `akumulatory, olej silnikowy, opony, przeterminowane leki, chemikalia, wielkogabaryty, tekstylia`. In the `Service` JSON-LD, description → `` `Katalog ${totalCount.toLocaleString('pl-PL')} punktów zbiórki w ${cityCount.toLocaleString('pl-PL')} miastach: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia, leki, wielkogabaryty, tekstylia.` ``.

- [ ] **Step 6: Verify**

Run: `pnpm check` — 0 new errors. Run `pnpm dev`; confirm: `/` shows landing (header visible); picking "Olej silnikowy" switches to full-screen results with `?item=olej-silnikowy` in the URL and oil-category filtering active (seed PSZOKs match); reload restores results mode; "← Nowe wyszukiwanie" returns to landing; `/?item=olej-silnikowy` deep link works.

- [ ] **Step 7: Commit**

```bash
git add src/routes/+page.svelte src/routes/+layout.svelte src/lib/components/SearchBox.svelte
git commit -m "feat: item-first landing that morphs into map results"
```

---

### Task 7: RulesBox + zero-results fallback

**Files:**
- Create: `src/lib/components/RulesBox.svelte`
- Modify: `src/routes/+page.svelte` (mount RulesBox; nearest-fallback when radius yields zero)

**Interfaces:**
- Consumes: `selectedItem: WasteItem | null` from Task 6; `filterPoints`/`sortByDistance` indices from the page.
- Produces: `RulesBox` props `{ item: WasteItem }`. Zero-result fallback list `nearestFallback: RecyclingPoint[]` (max 5).

- [ ] **Step 1: Create `src/lib/components/RulesBox.svelte`**

```svelte
<script lang="ts">
  import type { WasteItem } from '$lib/items';
  import type { CategoryId } from '$lib/types';

  let { item }: { item: WasteItem } = $props();

  const PSZOK_ONLY: ReadonlySet<CategoryId> = new Set([
    'car_battery',
    'oil',
    'tires',
    'chemicals',
    'meds',
    'bulky',
    'textiles',
  ]);
  const pszokOnly = $derived(item.categories.every((c) => PSZOK_ONLY.has(c)));
</script>

<aside class="rules" aria-label="Zasady oddawania: {item.name}">
  <h2>Jak oddać: {item.name}</h2>
  {#if item.rules}
    <p class="txt">{item.rules}</p>
  {/if}
  {#if pszokOnly}
    <p class="caveat">
      PSZOK-i przyjmują odpady od mieszkańców swojej gminy, a limity mogą się
      różnić — najlepiej zadzwoń przed wizytą.
    </p>
  {/if}
  {#if item.guideSlug}
    <a class="more" href="/poradnik/{item.guideSlug}">Pełny poradnik →</a>
  {/if}
</aside>

<style>
  .rules {
    padding: 14px 16px;
    background: var(--kompi-accent-subtle);
    border: 1px solid var(--kompi-accent-muted);
    border-radius: 12px;
    margin-bottom: 12px;
  }
  h2 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--kompi-accent);
  }
  .txt {
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--kompi-text-2);
  }
  .caveat {
    margin: 0 0 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--kompi-text-3);
  }
  .more {
    font-size: 13px;
    font-weight: 700;
    color: var(--kompi-accent);
  }
</style>
```

- [ ] **Step 2: Mount in results mode**

In `src/routes/+page.svelte`, import `RulesBox` and inside `.results-island`, directly after the `.results-head` div, add:

```svelte
{#if selectedItem}
    <div class="rules-slot">
        <RulesBox item={selectedItem} />
    </div>
{/if}
```

with style `.rules-slot { padding: 12px 16px 0; flex-shrink: 0; }`.

- [ ] **Step 3: Zero-results fallback**

Add derived state after `sortedFiltered`:

```ts
// When a radius filter empties the list, show the nearest matches beyond
// the radius instead of a dead end.
const nearestFallback = $derived(
    sortedFiltered.length === 0 && anchor !== null && radiusKm !== null
        ? sortByDistance(
              filterPoints(
                  points,
                  { query, categories, takebackTypes, city: null, anchor, radiusKm: null },
                  { haystack: haystackIndex, distanceKm: distanceIndex },
              ),
              anchor,
              distanceIndex,
          ).slice(0, 5)
        : [],
);
```

In the markup, inside `.results-scroll`, wrap the `<PointList …/>` so the fallback renders when the primary list is empty:

```svelte
{#if sortedFiltered.length === 0 && nearestFallback.length > 0}
    <p class="fallback-note">
        Brak punktów w promieniu {radiusKm} km. Najbliższe punkty poza
        promieniem:
    </p>
    <PointList
        points={nearestFallback}
        {selectedSlug}
        onhover={(slug) => (selectedSlug = slug)}
    />
    <button
        type="button"
        class="widen"
        onclick={() => (radiusKm = Math.min(100, (radiusKm ?? 10) * 2.5))}
    >
        Powiększ promień wyszukiwania
    </button>
{:else}
    <PointList
        points={pagedPoints}
        {selectedSlug}
        onhover={(slug) => (selectedSlug = slug)}
    />
{/if}
```

Styles:

```css
.fallback-note {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--kompi-warning, #eab308);
}
.widen {
    margin-top: 12px;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--kompi-accent-muted);
    background: var(--kompi-accent-subtle);
    color: var(--kompi-accent);
    font-weight: 700;
    cursor: pointer;
}
```

- [ ] **Step 4: Verify**

`pnpm check` — 0 new errors. In `pnpm dev`: pick "Opony", set a location far from any seed point with a small radius → fallback note + nearest list + widen button appear; widening pulls points into the radius. Pick "Olej silnikowy" → RulesBox shows rules + PSZOK caveat + guide link.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/RulesBox.svelte src/routes/+page.svelte
git commit -m "feat: per-item rules box + nearest-fallback for empty radius"
```

---

### Task 8: PointCard distance + call action

**Files:**
- Modify: `src/lib/components/PointList.svelte` (pass distance through)
- Modify: `src/lib/components/PointCard.svelte` (distance badge + tel link)
- Modify: `src/routes/+page.svelte` (pass `distanceIndex` into both `PointList` usages)

**Interfaces:**
- Consumes: `distanceIndex: Map<string, number> | null` (already derived in the page).
- Produces: `PointList` gains optional prop `distanceKm?: Map<string, number> | null`; `PointCard` gains optional prop `distanceKm?: number`.

- [ ] **Step 1: Thread distance through `PointList.svelte`**

Add to props: `distanceKm = null` typed `distanceKm?: Map<string, number> | null`. Pass to each card: `<PointCard point={p} selected={p.slug === selectedSlug} {onhover} distanceKm={distanceKm?.get(p.slug)} />`.

- [ ] **Step 2: Extend `PointCard.svelte`**

Add `distanceKm` to props (`distanceKm?: number`) and a formatter in the script:

```ts
const distLabel = $derived(
    distanceKm === undefined
        ? null
        : distanceKm < 1
          ? `${Math.round(distanceKm * 1000)} m`
          : `${distanceKm.toFixed(1).replace('.', ',')} km`,
);
```

In `.card-head`, after the `<h3>`, before `.operator`, insert:

```svelte
{#if distLabel}
    <span class="dist">{distLabel}</span>
{/if}
```

After the `.cats` list, add a call action when a phone exists:

```svelte
{#if point.phone}
    <a
        class="call"
        href="tel:{point.phone.replace(/\s+/g, '')}"
        onclick={(e) => e.stopPropagation()}
    >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        {point.phone}
    </a>
{/if}
```

Styles:

```css
.dist {
    font-size: 12px;
    font-weight: 700;
    color: var(--kompi-accent);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    white-space: nowrap;
}
.call {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--kompi-accent);
    background: var(--kompi-accent-subtle);
    border: 1px solid var(--kompi-accent-muted);
    border-radius: 8px;
}
.call:hover {
    background: var(--kompi-accent-muted);
    text-decoration: none;
}
```

- [ ] **Step 3: Pass the index from the page**

In `src/routes/+page.svelte`, both `<PointList …/>` usages (primary + fallback from Task 7) get `distanceKm={distanceIndex}`.

- [ ] **Step 4: Verify + commit**

`pnpm check` — 0 new errors. Dev: set a location → cards show "1,3 km" style badges sorted ascending; seed point with phone shows tappable call chip.

```bash
git add src/lib/components/PointList.svelte src/lib/components/PointCard.svelte src/routes/+page.svelte
git commit -m "feat: distance badge + click-to-call on point cards"
```

---

### Task 9: Task-oriented point detail page

**Files:**
- Modify: `src/routes/punkt/[slug]/+page.server.ts` (nearest alternatives)
- Modify: `src/routes/punkt/[slug]/+page.svelte` (caveat, no-phone fallback, alternatives, guide link, sticky mobile actions)

**Interfaces:**
- Consumes: `getAllPoints` from `$lib/server/db/queries/points`; `haversineKm` from `$lib/distance`; `GUIDE_BY_CATEGORY` from `$lib/guides` (Task 10 — see note below).
- Produces: load returns `{ point, alternatives: Array<{ slug: string; name: string; city: string; address: string; distanceKm: number }> }`.
- **Ordering note:** the guide link portion references `$lib/guides`; if executing tasks strictly in order, guard it — the code below only links when a mapping exists, and Task 10 creates the module. **Implement the guide-link snippet in Task 10 Step 6 instead if `$lib/guides` doesn't exist yet.**

- [ ] **Step 1: Compute alternatives in `+page.server.ts`**

Replace the `load` with:

```ts
import { haversineKm } from '$lib/distance';

export const load = async ({ params }) => {
	const point =
		(await getPointBySlug(params.slug).catch(() => null)) ??
		getSeedPoint(params.slug);
	if (!point) throw error(404, 'Nie znaleziono punktu.');

	// Three nearest points sharing at least one category — O(n) selection,
	// no full sort; runs 30k times during prerender so keep it lean.
	const all = await getAllPoints().catch(() => POINTS);
	const top: Array<{ p: (typeof all)[number]; d: number }> = [];
	for (const c of all) {
		if (c.slug === point.slug) continue;
		if (!c.categories.some((id) => point.categories.includes(id))) continue;
		const d = haversineKm(point.lat, point.lng, c.lat, c.lng);
		if (top.length < 3) {
			top.push({ p: c, d });
			top.sort((a, b) => a.d - b.d);
		} else if (d < top[2].d) {
			top[2] = { p: c, d };
			top.sort((a, b) => a.d - b.d);
		}
	}
	return {
		point,
		alternatives: top.map(({ p, d }) => ({
			slug: p.slug,
			name: p.name,
			city: p.city,
			address: p.address,
			distanceKm: Math.round(d * 10) / 10,
		})),
	};
};
```

- [ ] **Step 2: PSZOK caveat + no-phone fallback in `+page.svelte`**

After the `.actions` div, add:

```svelte
{#if p.takebackType === "municipal"}
    <p class="caveat">
        PSZOK przyjmuje odpady od mieszkańców swojej gminy; limity ilościowe
        mogą się różnić między gminami — zadzwoń lub sprawdź stronę przed
        wizytą.
    </p>
{/if}
{#if !p.phone}
    <p class="no-phone">
        Brak numeru telefonu w naszej bazie —
        {#if p.website}
            sprawdź <a href={p.website} target="_blank" rel="noopener noreferrer">stronę punktu</a>.
        {:else}
            zajrzyj na stronę swojej gminy.
        {/if}
    </p>
{/if}
```

Styles:

```css
.caveat {
    margin: 16px 0 0;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--kompi-text-2);
    background: var(--kompi-accent-subtle);
    border: 1px solid var(--kompi-accent-muted);
    border-radius: 12px;
}
.no-phone {
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--kompi-text-3);
}
```

- [ ] **Step 3: Alternatives section**

Before the page's closing `</article>`, add:

```svelte
{#if data.alternatives.length > 0}
    <section class="alts" aria-label="Punkty w pobliżu">
        <h2>Inne punkty w pobliżu</h2>
        <ul>
            {#each data.alternatives as alt (alt.slug)}
                <li>
                    <a href="/punkt/{alt.slug}">
                        <span class="alt-name">{alt.name}</span>
                        <span class="alt-meta">{alt.address}, {alt.city}</span>
                        <span class="alt-dist">{alt.distanceKm.toLocaleString("pl-PL")} km</span>
                    </a>
                </li>
            {/each}
        </ul>
    </section>
{/if}
```

Styles:

```css
.alts {
    margin-top: 32px;
}
.alts h2 {
    font-size: 18px;
    margin: 0 0 12px;
}
.alts ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}
.alts a {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: "name dist" "meta dist";
    gap: 2px 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--kompi-border);
    border-radius: 12px;
    color: var(--kompi-text);
    text-decoration: none;
}
.alts a:hover {
    border-color: var(--kompi-accent);
}
.alt-name { grid-area: name; font-weight: 700; font-size: 14px; }
.alt-meta { grid-area: meta; font-size: 12px; color: var(--kompi-text-3); }
.alt-dist { grid-area: dist; align-self: center; font-weight: 700; font-size: 13px; color: var(--kompi-accent); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 4: Sticky mobile action bar**

At the end of the page markup add:

```svelte
<div class="sticky-actions">
    <a class="btn btn-primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">Nawiguj</a>
    {#if p.phone}
        <a class="btn" href="tel:{p.phone.replace(/\s+/g, '')}">Zadzwoń</a>
    {/if}
</div>
```

```css
.sticky-actions {
    display: none;
}
@media (max-width: 720px) {
    .sticky-actions {
        display: flex;
        gap: 10px;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 30;
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
        background: rgba(9, 9, 11, 0.92);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--kompi-border);
    }
    .sticky-actions .btn {
        flex: 1;
        justify-content: center;
    }
}
```

(The page's existing `.btn`/`.btn-primary` classes are reused; if they are scoped inside a parent selector, duplicate the two rules for `.sticky-actions .btn`.) Also add bottom padding to the article on mobile so content isn't hidden: `@media (max-width: 720px) { .inner { padding-bottom: 88px; } }`.

- [ ] **Step 5: Verify + commit**

`pnpm check` — 0 new errors. Dev: visit `/punkt/warszawa-pszok-zawodzie` → caveat visible (municipal), alternatives list shows nearest seed points with km, mobile viewport (devtools) shows sticky Nawiguj/Zadzwoń bar.

```bash
git add "src/routes/punkt/[slug]/+page.server.ts" "src/routes/punkt/[slug]/+page.svelte"
git commit -m "feat: task-oriented point page — caveats, alternatives, sticky actions"
```

---

### Task 10: Guides module + /poradnik routes + sitemap (first 3 guides)

**Files:**
- Create: `src/lib/guides.ts`
- Test: `src/lib/guides.test.ts`
- Create: `src/routes/poradnik/+page.ts`, `src/routes/poradnik/+page.svelte`
- Create: `src/routes/poradnik/[temat]/+page.ts`, `src/routes/poradnik/[temat]/+page.svelte`
- Modify: `src/routes/sitemap.xml/+server.ts`
- Modify: `src/routes/punkt/[slug]/+page.svelte` (guide link deferred from Task 9)

**Interfaces:**
- Consumes: `CategoryId`.
- Produces:
  - `type Guide = { slug: string; title: string; metaTitle: string; metaDescription: string; intro: string; accepted: string[]; notAccepted: string[]; prep: string[]; afterLife: string; legal: string; faq: Array<{ q: string; a: string }>; categories: CategoryId[]; finderUrl: string }`
  - `GUIDES: Guide[]`, `GUIDES_BY_SLUG: Record<string, Guide>`, `GUIDE_BY_CATEGORY: Partial<Record<CategoryId, Guide>>` (first guide listing that category).
  - Task 11 appends 9 more guides to `GUIDES` — structure must not change after this task.

- [ ] **Step 1: Write the failing test `src/lib/guides.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_ID } from '$lib/categories';
import { GUIDES, GUIDES_BY_SLUG, GUIDE_BY_CATEGORY } from '$lib/guides';

describe('GUIDES integrity', () => {
	it('has unique slugs', () => {
		const slugs = GUIDES.map((g) => g.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('references only existing categories', () => {
		for (const g of GUIDES) {
			for (const c of g.categories) {
				expect(CATEGORIES_BY_ID[c], `${g.slug} → ${c}`).toBeDefined();
			}
		}
	});

	it('every guide has complete content', () => {
		for (const g of GUIDES) {
			expect(g.intro.length, g.slug).toBeGreaterThan(50);
			expect(g.accepted.length, g.slug).toBeGreaterThan(0);
			expect(g.prep.length, g.slug).toBeGreaterThan(0);
			expect(g.faq.length, g.slug).toBeGreaterThanOrEqual(2);
			expect(g.finderUrl, g.slug).toMatch(/^\/\?/);
		}
	});

	it('lookup maps are consistent', () => {
		expect(GUIDES_BY_SLUG['baterie']?.title).toBeDefined();
		expect(GUIDE_BY_CATEGORY['battery']?.slug).toBe('baterie');
	});
});
```

Run: `pnpm test` → FAIL (`Cannot find module '$lib/guides'`).

- [ ] **Step 2: Create `src/lib/guides.ts` with 3 guides**

```ts
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
```

Run: `pnpm test` → PASS.

- [ ] **Step 3: Create `/poradnik` index route**

`src/routes/poradnik/+page.ts`:

```ts
export const prerender = true;
```

`src/routes/poradnik/+page.svelte`:

```svelte
<script lang="ts">
    import { GUIDES } from "$lib/guides";
    import { CATEGORIES_BY_ID } from "$lib/categories";
</script>

<svelte:head>
    <title>Poradnik recyklingu — jak i gdzie oddawać odpady problemowe</title>
    <meta
        name="description"
        content="Proste zasady oddawania baterii, akumulatorów, olejów, opon, chemikaliów, leków, elektroodpadów i tekstyliów w Polsce."
    />
    <link rel="canonical" href="https://recycling.kompi.pl/poradnik" />
</svelte:head>

<div class="wrap">
    <h1>Poradnik recyklingu</h1>
    <p class="lead">
        Krótkie, praktyczne zasady: co można oddać, jak to przygotować i co
        się z tym dzieje później.
    </p>
    <ul class="grid">
        {#each GUIDES as g (g.slug)}
            {@const cat = g.categories[0] ? CATEGORIES_BY_ID[g.categories[0]] : null}
            <li>
                <a href="/poradnik/{g.slug}" style="--g-color: var({cat?.colorVar ?? '--kompi-accent'});">
                    <h2>{g.title}</h2>
                    <p>{g.metaDescription}</p>
                </a>
            </li>
        {/each}
    </ul>
</div>

<style>
    .wrap {
        max-width: 1100px;
        width: 100%;
        margin: 0 auto;
        padding: 40px 20px 64px;
    }
    h1 {
        font-size: clamp(26px, 4vw, 36px);
        margin: 0 0 8px;
    }
    .lead {
        color: var(--kompi-text-3);
        margin: 0 0 28px;
        max-width: 640px;
    }
    .grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
    }
    .grid a {
        display: block;
        height: 100%;
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--kompi-border);
        border-top: 3px solid var(--g-color);
        border-radius: 14px;
        color: var(--kompi-text);
        text-decoration: none;
        transition: all 0.2s var(--kompi-ease);
    }
    .grid a:hover {
        border-color: var(--g-color);
        transform: translateY(-2px);
    }
    .grid h2 {
        font-size: 17px;
        margin: 0 0 8px;
    }
    .grid p {
        font-size: 13px;
        color: var(--kompi-text-3);
        line-height: 1.55;
        margin: 0;
    }
</style>
```

- [ ] **Step 4: Create `/poradnik/[temat]` route**

`src/routes/poradnik/[temat]/+page.ts`:

```ts
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
```

`src/routes/poradnik/[temat]/+page.svelte`:

```svelte
<script lang="ts">
    let { data } = $props();
    const g = $derived(data.guide);
    const canonical = $derived(`https://recycling.kompi.pl/poradnik/${g.slug}`);

    const jsonLd = $derived({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: g.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    });
</script>

<svelte:head>
    <title>{g.metaTitle} — recycling.kompi.pl</title>
    <meta name="description" content={g.metaDescription} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={g.metaTitle} />
    <meta property="og:description" content={g.metaDescription} />
    <meta property="og:url" content={canonical} />
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<article class="wrap">
    <nav class="crumbs" aria-label="Ścieżka nawigacji">
        <a href="/poradnik">Poradnik</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{g.title}</span>
    </nav>

    <h1>{g.title}</h1>
    <p class="intro">{g.intro}</p>

    <a class="finder-cta" href={g.finderUrl}>Znajdź punkt na mapie →</a>

    <div class="cols">
        <section>
            <h2>Co możesz oddać</h2>
            <ul class="ok">
                {#each g.accepted as a}<li>{a}</li>{/each}
            </ul>
        </section>
        {#if g.notAccepted.length > 0}
            <section>
                <h2>Czego tu nie oddasz</h2>
                <ul class="nope">
                    {#each g.notAccepted as n}<li>{n}</li>{/each}
                </ul>
            </section>
        {/if}
    </div>

    <section>
        <h2>Jak przygotować</h2>
        <ol class="prep">
            {#each g.prep as s}<li>{s}</li>{/each}
        </ol>
    </section>

    <section>
        <h2>Co się z tym dzieje?</h2>
        <p>{g.afterLife}</p>
    </section>

    <p class="legal">{g.legal}</p>

    <section class="faq">
        <h2>Częste pytania</h2>
        {#each g.faq as f}
            <details>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
            </details>
        {/each}
    </section>
</article>

<style>
    .wrap {
        max-width: 760px;
        width: 100%;
        margin: 0 auto;
        padding: 32px 20px 64px;
    }
    .crumbs {
        display: flex;
        gap: 8px;
        font-size: 13px;
        color: var(--kompi-text-3);
        margin-bottom: 20px;
    }
    h1 {
        font-size: clamp(26px, 4vw, 36px);
        margin: 0 0 12px;
        letter-spacing: -0.02em;
    }
    .intro {
        font-size: 16px;
        line-height: 1.65;
        color: var(--kompi-text-2);
        margin: 0 0 20px;
    }
    .finder-cta {
        display: inline-block;
        padding: 12px 20px;
        background: var(--kompi-accent);
        color: #fff;
        font-weight: 700;
        border-radius: 12px;
        margin-bottom: 32px;
    }
    .finder-cta:hover {
        background: var(--kompi-accent-hover);
        text-decoration: none;
    }
    h2 {
        font-size: 18px;
        margin: 28px 0 10px;
    }
    .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 0 24px;
    }
    ul, ol {
        margin: 0;
        padding-left: 20px;
        color: var(--kompi-text-2);
        line-height: 1.7;
        font-size: 14px;
    }
    .ok li::marker { content: '✔ '; color: var(--kompi-accent); }
    .nope li::marker { content: '✘ '; color: var(--kompi-text-4); }
    .prep li { margin-bottom: 4px; }
    section > p {
        color: var(--kompi-text-2);
        line-height: 1.65;
        font-size: 14px;
        margin: 0;
    }
    .legal {
        margin: 28px 0;
        padding: 12px 16px;
        font-size: 12px;
        color: var(--kompi-text-3);
        background: rgba(255, 255, 255, 0.03);
        border-left: 3px solid var(--kompi-border-strong);
        border-radius: 8px;
        line-height: 1.6;
    }
    .faq details {
        border-bottom: 1px solid var(--kompi-border);
        padding: 12px 0;
    }
    .faq summary {
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
    }
    .faq p {
        margin: 10px 0 0;
        font-size: 14px;
        color: var(--kompi-text-2);
        line-height: 1.65;
    }
</style>
```

- [ ] **Step 5: Sitemap**

In `src/routes/sitemap.xml/+server.ts`, add `import { GUIDES } from '$lib/guides';` and after the homepage `urls.push(...)`:

```ts
urls.push(renderUrl(`${BASE}/poradnik`, 'monthly', '0.8', buildDate));
for (const g of GUIDES) {
	urls.push(renderUrl(`${BASE}/poradnik/${g.slug}`, 'monthly', '0.8', buildDate));
}
```

- [ ] **Step 6: Guide link on point pages (deferred from Task 9)**

In `src/routes/punkt/[slug]/+page.svelte` script:

```ts
import { GUIDE_BY_CATEGORY } from "$lib/guides";
const guide = $derived(
    p.categories.map((c) => GUIDE_BY_CATEGORY[c]).find(Boolean) ?? null,
);
```

Markup, after the caveat/no-phone block:

```svelte
{#if guide}
    <p class="guide-link">
        Zobacz też: <a href="/poradnik/{guide.slug}">{guide.title} — zasady oddawania</a>
    </p>
{/if}
```

Style: `.guide-link { margin: 12px 0 0; font-size: 13px; }`.

- [ ] **Step 7: Verify + commit**

`pnpm test` → PASS. `pnpm check` → 0 new errors. Dev: `/poradnik` lists 3 guides; `/poradnik/oleje` renders all sections + FAQ accordions; CTA links to `/?cat=oil` which opens results mode pre-filtered; point page shows "Zobacz też" link.

```bash
git add src/lib/guides.ts src/lib/guides.test.ts src/routes/poradnik src/routes/sitemap.xml/+server.ts "src/routes/punkt/[slug]/+page.svelte"
git commit -m "feat: /poradnik guides (module, routes, sitemap) — first 3 guides"
```

---

### Task 11: Remaining 9 guides + cross-link integrity test

**Files:**
- Modify: `src/lib/guides.ts` (append 9 guides)
- Modify: `src/lib/guides.test.ts` (item↔guide integrity)

**Interfaces:**
- Consumes: `Guide` type from Task 10; `ITEMS` from Task 2.
- Produces: `GUIDES` with 12 entries; every `WasteItem.guideSlug` resolves.

- [ ] **Step 1: Add the integrity test first**

Append to `src/lib/guides.test.ts`:

```ts
import { ITEMS } from '$lib/items';

describe('item ↔ guide cross-links', () => {
	it('every item guideSlug resolves to a guide', () => {
		for (const item of ITEMS) {
			if (!item.guideSlug) continue;
			expect(GUIDES_BY_SLUG[item.guideSlug], `${item.id} → ${item.guideSlug}`).toBeDefined();
		}
	});

	it('there are 12 guides', () => {
		expect(GUIDES).toHaveLength(12);
	});
});
```

Run: `pnpm test` → FAIL (missing guides: `opony`, `chemikalia-i-farby`, `leki`, `duzy-sprzet-agd`, `maly-sprzet-elektroniczny`, `swietlowki-i-zarowki`, `wielkogabaryty`, `tekstylia`; count 3 ≠ 12).

- [ ] **Step 2: Append the 9 guides to `GUIDES`**

Same `Guide` shape as Task 10 — complete content below (append before the closing `];`):

```ts
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
			'świetlówki liniowe („jarzeniówki")',
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
			'Sprawne meble spróbuj najpierw oddać: fundacje, grupy sąsiedzkie, „oddam za darmo".',
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
```

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: PASS — including cross-link integrity (every `guideSlug` used in `items.ts` now resolves) and `GUIDES` length 12.

Note: the `pszok` guide has `categories: []` — the index page's `{@const cat = g.categories[0] ? … : null}` guard from Task 10 handles it (falls back to accent color).

- [ ] **Step 4: Verify + commit**

`pnpm check` — 0 new errors. Dev: `/poradnik` shows 12 cards; `/poradnik/pszok` CTA opens `/?tb=municipal` filtered results.

```bash
git add src/lib/guides.ts src/lib/guides.test.ts
git commit -m "feat: complete 12-guide poradnik content"
```

---

### Task 12: Mobile results layout + final verification

**Files:**
- Modify: `src/routes/+page.svelte` (mobile bottom-sheet CSS for results mode)

**Interfaces:**
- Consumes: results-mode markup from Task 6.
- Produces: final shippable state; full gate run.

- [ ] **Step 1: Bottom-sheet layout for small screens**

In `src/routes/+page.svelte`, replace the current `@media (max-width: 720px)` block for `.controls` with:

```css
@media (max-width: 720px) {
    .controls {
        top: 12px;
        left: 12px;
        right: 12px;
        bottom: 0;
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
    }
    .chips-island {
        align-self: stretch;
        order: 2;
    }
    .left-col {
        order: 1;
        min-height: 0;
        flex: 1;
    }
    /* Results become a bottom sheet: map stays visible above. */
    .results-island {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        max-height: 48dvh;
        border-radius: 16px 16px 0 0;
        border-bottom: 0;
    }
    .results-island::before {
        content: "";
        display: block;
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.25);
        margin: 8px auto 0;
        flex-shrink: 0;
    }
    .brand-tag {
        display: none;
    }
    .brand-stats {
        font-size: 11px;
        padding: 4px 8px;
    }
    .toast {
        top: auto;
        bottom: 50dvh;
        left: 12px;
        right: 12px;
        max-width: none;
    }
    .brand-island,
    .search-island,
    .results-island {
        border-radius: 12px;
    }
    .results-island {
        border-radius: 16px 16px 0 0;
    }
    .truncation-hint {
        bottom: calc(48dvh + 12px);
    }
}
```

- [ ] **Step 2: Full gate run**

```bash
pnpm test
pnpm check
pnpm build
```

Expected: tests PASS; check 0 new errors; build completes — prerender emits `/`, `/poradnik`, all 12 `/poradnik/[temat]` pages, all `/punkt/[slug]` pages (seed set locally), sitemap includes poradnik URLs (verify: `grep -c poradnik build/sitemap.xml` → 13).

- [ ] **Step 3: End-to-end verification in the browser (verify skill / dev server)**

Drive the real flow: landing → type "olej" → pick item → results with RulesBox → open a point → sticky mobile actions (narrow viewport) → poradnik CTA round-trip. Confirm no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: mobile bottom-sheet results + final polish"
```

---

## Post-implementation (operator checklist, not tasks)

1. Run the PSZOK backfill against production Turso: `pnpm tsx scripts/run-backfill.ts backfill_pszok_categories.sql` (needs real `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` in `.env`).
2. Trigger the Netlify build hook so tiles re-bake with the new categories.
3. Smoke-test production: `/?item=olej-silnikowy` should show ~1.9k PSZOK results.
