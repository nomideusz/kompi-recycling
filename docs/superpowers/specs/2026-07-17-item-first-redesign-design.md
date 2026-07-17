# Kompi Recycling — Item-First Frontend Redesign

**Date:** 2026-07-17
**Status:** Approved design, pending implementation plan

## Purpose

Reorient the site around the actual user task: *"I have a thing (car battery, engine
oil, old computer…) — where do I take it, and how?"* Recycling help is the priority;
education (Polish recycling rules, contacts, guides) is secondary.

Today the app is a map-first single page over a 30,036-point dataset that is
e-waste only (5 categories) and heavily battery-skewed (29,432 battery points,
1,891 PSZOKs). Items people commonly need to get rid of — engine oil, car
batteries, tires, chemicals — are not representable.

## Scope decisions (agreed with user)

1. **Frontend + data model** — extend categories, not just the UI.
2. **Entry flow: item-first** — landing leads with "Co chcesz oddać?", map is step 2.
3. **New-category data: rule-based PSZOK backfill now, real scraping later** —
   UI must degrade gracefully for categories served only by PSZOKs until the
   external scraper adds specialized sources (auto shops, pharmacies, vulcanizers).
4. **Education: inline item rules + prerendered guide pages** (`/poradnik`),
   not a full knowledge base.

## 1. Taxonomy & data model

### New categories (7), extending the existing 5

| id | Label (PL) | Initially served by |
|---|---|---|
| `car_battery` | Akumulatory | PSZOK backfill; auto shops via scraper later |
| `oil` | Oleje i smary | PSZOK backfill; workshops later |
| `tires` | Opony | PSZOK backfill; vulcanizers later |
| `chemicals` | Chemikalia i farby | PSZOK backfill |
| `meds` | Przeterminowane leki | PSZOK backfill; pharmacies later |
| `bulky` | Wielkogabaryty (meble) | PSZOK backfill |
| `textiles` | Tekstylia i ubrania | PSZOK backfill (mandatory at PSZOKs since Jan 2025) |

Existing `weee`, `small`, `battery`, `lamp`, `mobile` remain. `battery` is
relabeled **"Baterie (małe)"** to disambiguate from car batteries.

Basis: the statutory PSZOK acceptance list in the ustawa o utrzymaniu czystości
i porządku w gminach.

### Backfill

- New file `drizzle/backfill_pszok_categories.sql`: every `takeback_type =
  'municipal'` row gets the 7 new category ids appended to `categories_json`
  (idempotent — skip ids already present).
- `scripts/run-backfill.ts` is generalized to accept the SQL file path as an
  argument instead of hardcoding `backfill_takeback_type.sql`.
- No schema migration: `categories_json` is already a JSON text column.
- After running against Turso, trigger a Netlify rebuild to re-bake static tiles.
- Tile/wire format: category ids travel as string arrays already; new ids just
  extend the enum.

### Item dictionary (frontend-only)

New `src/lib/items.ts`: ~80 everyday items in Polish, each with:

- `name` (display), `synonyms` (diacritic-insensitive matching reuses
  `normalize` from `search.ts`),
- `categories: CategoryId[]` (usually one),
- optional `rules` (short consumer-facing preparation text),
- optional `guideSlug` (link to `/poradnik/[temat]`).

Examples: "olej silnikowy" → `oil`; "laptop"/"komputer" → `small`;
"lodówka" → `weee`; "kanapa" → `bulky`; "akumulator" → `car_battery`.

Matching order: exact/synonym match → fuzzy match → fall through to the
existing free-text point/city search.

## 2. Pages & information architecture

### `/` — Home (prerendered, item-first, morphs into results in place)

Hero:
- **"Co chcesz oddać?"** — `ItemSearch` autocomplete over the item dictionary.
- Location row: 📍 geolocation button + address/city field (existing geocoder).
- **Popular items grid** (~12 tiles): Baterie, Akumulator, Olej silnikowy,
  Komputer, Lodówka, Pralka, Telewizor, Żarówki, Opony, Leki, Farby i chemia,
  Ubrania.

Results mode (same page, no navigation):
- URL state `/?item=olej-silnikowy&lat=…&lng=…` via the existing `replaceState`
  pattern — shareable links keep working.
- Map + distance-sorted list; **`RulesBox`** pinned above the list with the
  item's preparation rules, PSZOK caveat, and guide link.
- Existing category/takeback chips remain as secondary controls ("Jak oddasz?").

Below the fold: how-it-works (3 steps), dataset stats, PSZOK explainer teaser,
poradnik links.

### `/punkt/[slug]` — Point detail (prerendered, redesigned)

Task-oriented: accepted-category chips up top; hours; **click-to-call** phone
(tel:); "Wyznacz trasę" Google Maps directions link; takeback explainer; PSZOK
caveat ("odpady od mieszkańców gminy, limity mogą się różnić — zadzwoń przed
wizytą"). Phone coverage is ~10%, so absence renders as "brak telefonu —
sprawdź stronę www" rather than an empty gap. Plus: 3 nearest alternatives
accepting the same categories, and a link to the matching guide.

### `/poradnik` + `/poradnik/[temat]` — Guides (new, prerendered)

~12 static Polish pages: one per waste type plus "Czym jest PSZOK?". Each
covers: what counts / what doesn't, how to prepare, where it goes (CTA into the
pre-filtered finder), what happens to it afterwards, legal basis, short FAQ
with `FAQPage` JSON-LD.

### Navigation

Slim header: logo, "Mapa" (home), "Poradnik". Footer: o projekcie, źródła
danych, kontakt.

## 3. Visual design & components

- **Brand:** dark theme, orange `#f97e21` as the sole accent. The retired
  civic-green and neon palettes must not reappear.
- **Mobile-first:** big touch targets; bottom-anchored list sheet over the map
  on small screens; sticky "Nawiguj / Zadzwoń" actions on point pages.
- Category tokens: 5 existing color vars stay; 7 new color tokens + icons added.

New/changed components:

| Component | Role |
|---|---|
| `ItemSearch.svelte` | Accessible autocomplete combobox (ARIA combobox pattern, keyboard nav, diacritic-insensitive) |
| `ItemTiles.svelte` | Popular-items hero grid |
| `RulesBox.svelte` | Per-item rules + PSZOK caveat + guide link above results |
| `PointCard.svelte` (redesign) | Distance, category chips, hours snippet, tel: link |
| `SiteHeader.svelte` / `SiteFooter.svelte` | New slim nav |
| Poradnik layout | Shared template for guide pages |

## 4. Data flow

Item selection → `CategoryId[]` → existing `filterPoints` pipeline. No new API
endpoints; no tile format change beyond new category ids. Rules text lives in
`items.ts`.

**Deliberate omission:** no "open now" badge — `hours` is a free-form string
(populated on only 54% of points); computed open-state would be wrong too
often. Raw hours are displayed instead.

## 5. Error handling

- Geolocation denied → address field fallback (existing behavior).
- Unknown item → fuzzy match → free-text point search fallback.
- Zero results within radius → suggest widening + show nearest matches anyway
  with distances.
- Categories with thin coverage (PSZOK-only for now) → results still honest;
  RulesBox explains that specialized points (e.g. pharmacies for meds) are
  coming from future data sources.

## 6. Testing

- `svelte-check` remains the type/compile gate.
- **Vitest** introduced (first tests in the project), focused on the logic most
  likely to rot silently: item matcher (synonyms, diacritics, fuzzy, fallback
  order) and item→category mapping integrity (every referenced `CategoryId`
  and `guideSlug` exists).
- UI verified by driving the dev server.

## Out of scope

- New scraping sources (external scraper's job; UI is designed to absorb them).
- "Open now" computation.
- Full knowledge-base articles beyond the ~12 guide pages.
- Any change to the tile pipeline or deploy model (data stays frozen at build).
