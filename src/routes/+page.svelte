<script lang="ts">
    import RecyclingMap from "$lib/components/RecyclingMap.svelte";
    import CategoryFilter from "$lib/components/CategoryFilter.svelte";
    import TakebackFilter from "$lib/components/TakebackFilter.svelte";
    import SearchBox, {
        type SearchBoxItem,
    } from "$lib/components/SearchBox.svelte";
    import PointList from "$lib/components/PointList.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import ProximityPill from "$lib/components/ProximityPill.svelte";
    import RulesBox from "$lib/components/RulesBox.svelte";
    import {
        ITEMS_BY_ID,
        POPULAR_ITEMS,
        matchItems,
        type WasteItem,
    } from "$lib/items";
    import {
        buildDistanceIndex,
        buildHaystackIndex,
        buildSuggestions,
        cityTokenScore,
        filterPoints,
        normalize,
        queryTokens,
        sortByDistance,
    } from "$lib/search";
    import { geocodeAddress, type Anchor } from "$lib/distance";
    import { cityAggFromWire, fromWire } from "$lib/wire";
    import { PointStore, type Bbox } from "$lib/pointStore.svelte";
    import { CATEGORIES_BY_ID } from "$lib/categories";
    import { TAKEBACKS_BY_ID } from "$lib/takebacks";
    import type {
        CategoryId,
        RecyclingPoint,
        TakebackType,
    } from "$lib/types";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import { tick } from "svelte";

    let { data } = $props();

    const store = new PointStore();
    store.seed(
        data.initialPoints.map(fromWire),
        data.totalCount,
        data.initialTruncated,
    );

    let query = $state("");
    // The landing search box is a pure navigator (yoga-style): typing only
    // drives the suggestion dropdown; filter state changes on select/Enter.
    // On the results view the box binds `query` directly and filters live.
    let heroQuery = $state("");
    let categories = $state<Set<CategoryId>>(new Set());
    let takebackTypes = $state<Set<TakebackType>>(new Set());
    let anchor = $state<Anchor | null>(null);
    let radiusKm = $state<number | null>(null);
    let geocoding = $state(false);
    let selectedSlug = $state<string | null>(null);
    let mapRef: RecyclingMap | undefined = $state();
    let locating = $state(false);
    let locateError = $state<string | null>(null);
    let page = $state(1);
    let mapBounds = $state<Bbox | null>(null);
    let selectedItemId = $state<string | null>(null);
    const selectedItem = $derived(
        selectedItemId ? (ITEMS_BY_ID[selectedItemId] ?? null) : null,
    );

    // The rules box only makes sense while the item's categories are still
    // part of the active filter — invalidate the item when they diverge.
    $effect(() => {
        if (!selectedItem) return;
        if (!selectedItem.categories.every((c) => categories.has(c))) {
            selectedItemId = null;
        }
    });

    function pickItem(item: WasteItem) {
        selectedItemId = item.id;
        categories = new Set(item.categories);
    }

    function clearItem() {
        selectedItemId = null;
        categories = new Set();
    }

    const DEFAULT_RADIUS_KM = 10;

    // The page is prerendered, so query params are invisible to the server —
    // restore filter state from the URL on the client instead. This is what
    // makes shared links, the SearchAction JSON-LD (`/?q={term}`) and the
    // breadcrumb `/?q=<city>` links actually work.
    if (browser) {
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("q")?.trim();
        if (q) query = q;
        const cat = sp
            .get("cat")
            ?.split(",")
            .filter((c): c is CategoryId => c in CATEGORIES_BY_ID);
        const catApplied = cat !== undefined && cat.length > 0;
        if (catApplied) categories = new Set(cat);
        const tb = sp
            .get("tb")
            ?.split(",")
            .filter((t): t is TakebackType => t in TAKEBACKS_BY_ID);
        if (tb && tb.length > 0) takebackTypes = new Set(tb);
        const itemParam = sp.get("item");
        if (itemParam && itemParam in ITEMS_BY_ID) {
            selectedItemId = itemParam;
            // A refined `cat` param in a shared link takes precedence over
            // the item's default categories — don't clobber it.
            if (!catApplied) {
                categories = new Set(ITEMS_BY_ID[itemParam].categories);
            }
        }
        const lat = Number.parseFloat(sp.get("lat") ?? "");
        const lng = Number.parseFloat(sp.get("lng") ?? "");
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            anchor = {
                lat,
                lng,
                label: sp.get("loc")?.trim() || "Wybrana lokalizacja",
                source: "address",
            };
            const r = Number.parseFloat(sp.get("r") ?? "");
            radiusKm =
                Number.isFinite(r) && r > 0
                    ? Math.min(100, r)
                    : DEFAULT_RADIUS_KM;
        }
    }

    import KompiLogo from "$lib/images/logo/logo-kompi.png";

    const PAGE_SIZE = 50;

    // Loaded subset (may grow as the user pans/zooms). The store dedups by
    // slug so the array only updates when truly new points come in.
    const points = $derived(store.points);

    // Recomputed when the loaded set changes — typically a few times per
    // session as the user explores, not per keystroke.
    const haystackIndex = $derived(buildHaystackIndex(points));

    // Recomputed only when the anchor changes — avoids recomputing haversine
    // distances per keystroke or radius slider tick.
    const distanceIndex = $derived(buildDistanceIndex(points, anchor));

    const filtered = $derived(
        filterPoints(
            points,
            {
                query,
                categories,
                takebackTypes,
                city: null,
                anchor,
                radiusKm,
            },
            { haystack: haystackIndex, distanceKm: distanceIndex },
        ),
    );

    const sortedFiltered = $derived(
        sortByDistance(filtered, anchor, distanceIndex),
    );

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

    const pageCount = $derived(
        Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE)),
    );

    const pagedPoints = $derived(
        sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    );

    // Server ships city aggregates as compact tuples — rehydrate once into
    // the object form buildSuggestions expects. Reruns only on data change.
    const cityAggregates = $derived(data.cityAggregates.map(cityAggFromWire));

    const showResults = $derived(
        selectedItemId !== null ||
            query.trim().length > 0 ||
            categories.size > 0 ||
            takebackTypes.size > 0 ||
            anchor !== null,
    );

    // ── Unified suggestions: things first, then places ──
    // One input understands items ("laptop"), cities, postal codes,
    // operators and addresses — grouped like the yoga directory search.
    const suggestQ = $derived(showResults ? query : heroQuery);

    const itemSuggestions = $derived.by((): SearchBoxItem[] => {
        const q = suggestQ.trim();
        if (q.length < 2) return [];
        let matched = matchItems(q, 5);
        // Multi-word queries like "laptop kraków" won't match an item as a
        // whole — retry per token so the item part still surfaces.
        if (matched.length === 0) {
            const tokens = queryTokens(q).filter((t) => t.length >= 3);
            if (tokens.length >= 2) {
                const seen = new Set<string>();
                matched = tokens
                    .flatMap((t) => matchItems(t, 3))
                    .filter((it) => !seen.has(it.id) && !!seen.add(it.id))
                    .slice(0, 4);
            }
        }
        return matched.map((item) => ({
            key: `item:${item.id}`,
            icon: "item" as const,
            text: item.name,
            meta: CATEGORIES_BY_ID[item.categories[0]].label,
            group: "Rzeczy",
        }));
    });

    // "laptop kraków" → one suggestion that applies both: the item's
    // categories AND the city (yoga's city+style combo, recycled).
    const comboSuggestion = $derived.by((): SearchBoxItem | null => {
        const q = suggestQ.trim();
        if (q.length < 3) return null;
        const tokens = queryTokens(q);
        if (tokens.length < 2) return null;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].length < 3) continue;
            let best: { city: string; score: number; count: number } | null =
                null;
            for (const c of cityAggregates) {
                const s = cityTokenScore(normalize(c.city), tokens[i]);
                if (
                    s > 0 &&
                    (!best ||
                        s > best.score ||
                        (s === best.score && c.count > best.count))
                ) {
                    best = { city: c.city, score: s, count: c.count };
                }
            }
            if (!best) continue;
            const rest = tokens.filter((_, j) => j !== i).join(" ");
            const items = rest.length >= 2 ? matchItems(rest, 1) : [];
            if (items.length > 0) {
                return {
                    key: `itemcity:${items[0].id}:${best.city}`,
                    icon: "item" as const,
                    text: `${items[0].name} — ${best.city}`,
                    meta: `${best.count.toLocaleString("pl-PL")} punktów`,
                    group: "Rzeczy",
                };
            }
        }
        return null;
    });

    const suggestions = $derived([
        ...(comboSuggestion ? [comboSuggestion] : []),
        ...itemSuggestions,
        ...buildSuggestions(points, suggestQ, cityAggregates),
    ]);

    // The moment any filter is active the user expects results from the
    // whole country, not just the tiles they've panned across — pull the
    // rest of the dataset in the background (one-time, idempotent).
    $effect(() => {
        if (showResults) store.ensureAll();
    });

    // The map runs in one of two modes:
    //  - markers: the viewport's tiles are fully loaded and small enough to
    //    render as pins, so the clusterer's counts are exact;
    //  - aggregates: anything else (initial country view, un-fetched areas,
    //    >4k points in view) draws true-count circles computed from the city
    //    aggregates (unfiltered) or the complete filtered set — numbers that
    //    don't grow as tiles stream in. The densest metro tile holds ~2.1k
    //    points, so 4k keeps whole-city views in marker mode.
    const MAX_MAP_MARKERS = 4000;

    function pointsInView(
        pts: RecyclingPoint[],
        b: Bbox | null,
    ): RecyclingPoint[] {
        if (!b) return pts;
        const latPad = (b.north - b.south) * 0.25;
        const lngPad = (b.east - b.west) * 0.25;
        return pts.filter(
            (p) =>
                p.lat <= b.north + latPad &&
                p.lat >= b.south - latPad &&
                p.lng <= b.east + lngPad &&
                p.lng >= b.west - lngPad,
        );
    }

    const inView = $derived(pointsInView(sortedFiltered, mapBounds));
    const markerMode = $derived(
        !store.truncated && inView.length <= MAX_MAP_MARKERS,
    );
    const mapAggregates = $derived(
        markerMode
            ? null
            : showResults
              ? sortedFiltered.map((p) => ({
                    lat: p.lat,
                    lng: p.lng,
                    count: 1,
                }))
              : cityAggregates.map((c) => ({
                    lat: c.lat,
                    lng: c.lng,
                    count: c.count,
                })),
    );

    const totalCount = $derived(data.totalCount);
    const cityCount = $derived(cityAggregates.length);

    const topCities = $derived(
        [...cityAggregates].sort((a, b) => b.count - a.count).slice(0, 12),
    );

    const jsonLd = $derived([
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': 'https://recycling.kompi.pl/#website',
            url: 'https://recycling.kompi.pl/',
            name: 'recycling.kompi.pl',
            description:
                'Mapa punktów zbiórki zużytego sprzętu elektronicznego, baterii i świetlówek w Polsce.',
            inLanguage: 'pl-PL',
            publisher: { '@id': 'https://kompi.pl/#org' },
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://recycling.kompi.pl/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': 'https://kompi.pl/#org',
            name: 'kompi.pl',
            url: 'https://kompi.pl/',
            logo: 'https://recycling.kompi.pl/icon-maskable.svg',
            email: 'kontakt@kompi.pl',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Wyszukiwarka punktów zbiórki elektroodpadów',
            serviceType: 'E-waste recycling point directory',
            provider: { '@id': 'https://kompi.pl/#org' },
            areaServed: { '@type': 'Country', name: 'Poland' },
            audience: {
                '@type': 'Audience',
                audienceType: 'Mieszkańcy Polski oddający elektroodpady',
            },
            description: `Katalog ${totalCount.toLocaleString('pl-PL')} punktów zbiórki w ${cityCount.toLocaleString('pl-PL')} miastach: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia, leki, wielkogabaryty, tekstylia.`,
        },
    ]);

    // Reset to page 1 whenever the filter set changes.
    $effect(() => {
        void query;
        void categories;
        void takebackTypes;
        void anchor;
        void radiusKm;
        void selectedItemId;
        page = 1;
    });

    // Mirror filter state into the URL (debounced) so any view is shareable
    // and survives a reload. GPS anchors are deliberately not serialized —
    // a copied link must not leak the user's location.
    $effect(() => {
        const sp = new URLSearchParams();
        const q = query.trim();
        if (q) sp.set("q", q);
        if (categories.size > 0) sp.set("cat", [...categories].join(","));
        if (takebackTypes.size > 0)
            sp.set("tb", [...takebackTypes].join(","));
        if (selectedItemId) sp.set("item", selectedItemId);
        if (anchor && anchor.source === "address") {
            sp.set("lat", anchor.lat.toFixed(5));
            sp.set("lng", anchor.lng.toFixed(5));
            if (radiusKm !== null) sp.set("r", String(radiusKm));
            if (anchor.label) sp.set("loc", anchor.label);
        }
        const qs = sp.toString();
        const timer = setTimeout(() => {
            if (qs === window.location.search.replace(/^\?/, "")) return;
            replaceState(qs ? `?${qs}` : window.location.pathname, {});
        }, 300);
        return () => clearTimeout(timer);
    });

    // Once the map exists, apply state restored from the URL or chosen on
    // the landing: draw the anchor circle and pan to it, or pan to an
    // exactly-matching city.
    function handleMapReady() {
        if (anchor) {
            mapRef?.setAnchor(anchor.lat, anchor.lng, radiusKm ?? null);
            mapRef?.panTo(anchor.lat, anchor.lng, 13);
            return;
        }
        const q = query.trim().toLowerCase();
        if (!q) return;
        const agg = cityAggregates.find((c) => c.city.toLowerCase() === q);
        if (agg) mapRef?.panTo(agg.lat, agg.lng, 12);
    }

    // Whenever the anchor or radius changes, mirror it to the map (circle +
    // pan). Clearing the anchor wipes the on-map circle.
    $effect(() => {
        if (!mapRef) return;
        if (anchor) {
            mapRef.setAnchor(anchor.lat, anchor.lng, radiusKm ?? null);
        } else {
            mapRef.clearAnchor();
        }
    });

    // Hand keyboard/AT focus to the results overlay when it appears —
    // otherwise focus silently falls to <body> behind it.
    let wasShowingResults = false;
    $effect(() => {
        const showing = showResults;
        if (showing && !wasShowingResults && browser) {
            tick().then(() =>
                document.getElementById("results-top")?.focus(),
            );
        }
        wasShowingResults = showing;
    });

    function locateMe() {
        if (!("geolocation" in navigator)) {
            locateError = "Twoja przeglądarka nie obsługuje geolokalizacji.";
            return;
        }
        locating = true;
        locateError = null;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locating = false;
                const { latitude, longitude, accuracy } = pos.coords;
                mapRef?.setUserLocation(latitude, longitude, accuracy);
                anchor = {
                    lat: latitude,
                    lng: longitude,
                    label: "Twoja lokalizacja",
                    source: "gps",
                };
                if (radiusKm === null) radiusKm = DEFAULT_RADIUS_KM;
                mapRef?.panTo(latitude, longitude, 13);
            },
            (err) => {
                locating = false;
                if (err.code === err.PERMISSION_DENIED) {
                    locateError = "Dostęp do lokalizacji został zablokowany.";
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    locateError = "Nie udało się ustalić lokalizacji.";
                } else {
                    locateError = "Upłynął limit czasu lokalizowania.";
                }
            },
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        );
    }

    function handleBounds(b: Bbox) {
        mapBounds = b;
        store.fetchBbox(b);
    }

    /** Pan to a city when the map exists; otherwise commit it as the query —
     *  the map mounts, and handleMapReady pans to the exact-match centroid. */
    function gotoCity(cityName: string) {
        const agg = cityAggregates.find((c) => c.city === cityName);
        if (agg && mapRef) {
            // Pan to the city centroid; the map's idle event will trigger
            // a bbox fetch so the points for that city stream in.
            mapRef.panTo(agg.lat, agg.lng, 12);
            query = "";
        } else {
            query = cityName;
        }
    }

    async function handleSelect(item: { key: string; text: string }) {
        heroQuery = "";
        if (item.key.startsWith("itemcity:")) {
            const [, itemId, ...cityParts] = item.key.split(":");
            const it = ITEMS_BY_ID[itemId];
            query = "";
            if (it) pickItem(it);
            gotoCity(cityParts.join(":"));
            return;
        }
        if (item.key.startsWith("item:")) {
            const id = item.key.slice("item:".length);
            const it = ITEMS_BY_ID[id];
            // Clear the typed text — the item's categories take over as the
            // filter; leaving "laptop" as a haystack query would zero results.
            query = "";
            if (it) pickItem(it);
            return;
        }
        if (item.key.startsWith("city:")) {
            gotoCity(item.key.slice("city:".length));
            return;
        }
        if (item.key.startsWith("address:")) {
            const raw = item.key.slice("address:".length);
            geocoding = true;
            locateError = null;
            try {
                const result = await geocodeAddress(
                    raw,
                    data.googleMapsApiKey,
                );
                if (!result.ok) {
                    locateError =
                        result.reason === "not-found"
                            ? "Nie znaleziono adresu w Polsce."
                            : result.reason === "denied"
                              ? "Geokoder zwrócił błąd uwierzytelnienia."
                              : "Nie udało się ustalić lokalizacji adresu.";
                    return;
                }
                anchor = result.anchor;
                if (radiusKm === null) radiusKm = DEFAULT_RADIUS_KM;
                query = "";
                mapRef?.panTo(result.anchor.lat, result.anchor.lng, 13);
            } finally {
                geocoding = false;
            }
            return;
        }
        query = item.text;
    }

    /** Enter without an arrow-key selection — resolve like yoga: take the
     *  top suggestion when there is one, otherwise commit the raw text. */
    function handleSubmit(raw: string) {
        if (suggestions.length > 0) {
            void handleSelect(suggestions[0]);
            return;
        }
        heroQuery = "";
        query = raw;
    }

    function clearAnchor() {
        anchor = null;
        radiusKm = null;
    }
</script>

<svelte:head>
    <title
        >recycling.kompi.pl — gdzie oddać elektroodpady, baterie, oleje i opony</title
    >
    <meta
        name="description"
        content="Znajdź najbliższy punkt zbiórki: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia, leki, wielkogabaryty i tekstylia. Ponad 30 000 punktów w całej Polsce."
    />
    <meta
        name="keywords"
        content="punkty zbiórki elektroodpadów, recykling elektroniki, ZSEiE, zbiórka baterii, zużyty sprzęt AGD, świetlówki, PSZOK, mapa Polska, akumulatory, olej silnikowy, opony, przeterminowane leki, chemikalia, wielkogabaryty, tekstylia"
    />
    <link rel="canonical" href="https://recycling.kompi.pl/" />
    <link rel="alternate" hreflang="pl-PL" href="https://recycling.kompi.pl/" />
    <link rel="alternate" hreflang="x-default" href="https://recycling.kompi.pl/" />
    <meta
        property="og:title"
        content="recycling.kompi.pl — gdzie oddać elektroodpady, baterie, oleje i opony"
    />
    <meta
        property="og:description"
        content="Znajdź najbliższy punkt zbiórki: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia, leki i tekstylia. Ponad {totalCount.toLocaleString('pl-PL')} lokalizacji w {cityCount.toLocaleString('pl-PL')} miastach."
    />
    <meta property="og:url" content="https://recycling.kompi.pl/" />
    <meta
        name="twitter:title"
        content="recycling.kompi.pl — gdzie oddać elektroodpady, baterie, oleje i opony"
    />
    <meta
        name="twitter:description"
        content="Znajdź najbliższy punkt zbiórki: elektroodpady, baterie, akumulatory, oleje, opony, chemikalia i leki."
    />
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

{#if !showResults}
    <div class="landing">
        <p class="kicker">Katalog kompi.pl · recykling</p>
        <h1 class="hero-title">Gdzie oddać to,<br />czego nie potrzebujesz?</h1>
        <p class="sub">
            {totalCount.toLocaleString("pl-PL")} punktów zbiórki w
            {cityCount.toLocaleString("pl-PL")} miastach — elektroodpady,
            baterie, oleje, opony, leki i więcej.
        </p>

        <div class="hero-search">
            <SearchBox
                bind:query={heroQuery}
                results={suggestions}
                loading={geocoding}
                onselect={handleSelect}
                onsubmit={handleSubmit}
                placeholder="Np. laptop, baterie, Kraków, ul. Polna 5…"
                ariaLabel="Szukaj rzeczy, miasta lub adresu"
            >
                {#snippet trailing()}
                    <button
                        type="button"
                        class="locate-btn"
                        class:locate-btn--active={locating}
                        aria-label="Pokaż punkty w mojej okolicy"
                        title={locateError ?? "Pokaż punkty w mojej okolicy"}
                        disabled={locating}
                        onclick={locateMe}
                    >
                        {#if locating}
                            <svg class="locate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        {:else}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 2v3" />
                                <path d="M12 19v3" />
                                <path d="M2 12h3" />
                                <path d="M19 12h3" />
                            </svg>
                        {/if}
                    </button>
                {/snippet}
            </SearchBox>
        </div>

        {#if locateError}
            <p class="locate-error" role="status">{locateError}</p>
        {/if}

        <div class="chip-section">
            <p class="chip-label">Najczęściej oddawane</p>
            <div class="chip-scroll">
                {#each POPULAR_ITEMS as item (item.id)}
                    {@const cat = CATEGORIES_BY_ID[item.categories[0]]}
                    <button
                        type="button"
                        class="chip-pill"
                        style="--chip-color: var({cat.colorVar});"
                        onclick={() => pickItem(item)}
                    >
                        <span class="chip-dot" aria-hidden="true"></span>
                        <span class="chip-name">{item.name}</span>
                    </button>
                {/each}
            </div>
        </div>

        <div class="chip-section">
            <div class="chip-scroll">
                {#each topCities as c (c.city)}
                    <button
                        type="button"
                        class="chip-pill chip-pill--subtle"
                        onclick={() => gotoCity(c.city)}
                    >
                        <span class="chip-name">{c.city}</span>
                        <span class="chip-count"
                            >{c.count.toLocaleString("pl-PL")}</span
                        >
                    </button>
                {/each}
            </div>
        </div>

        <p class="edu-line">
            Nie wiesz, jak przygotować odpady?
            <a href="/poradnik">Przeczytaj poradnik →</a>
        </p>
    </div>
{/if}

{#if showResults}
<div class="map-app">
    <div class="map-layer" aria-label="Mapa punktów zbiórki">
        <RecyclingMap
            bind:this={mapRef}
            points={markerMode ? inView : []}
            aggregates={mapAggregates}
            apiKey={data.googleMapsApiKey}
            mapId={data.googleMapsMapId}
            bind:selectedSlug
            onbounds={handleBounds}
            onready={handleMapReady}
        />
    </div>

    {#if !markerMode}
        <div class="truncation-hint" role="status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/>
            </svg>
            <span>Przybliż, aby zobaczyć pojedyncze punkty</span>
        </div>
    {/if}

    <div class="controls" aria-label="Wyszukaj punkt zbiórki">
        <div class="left-col">
            <div class="brand-island" aria-label="recycling.kompi.pl">
                <a class="brand" href="/">
                    <img
                        src={KompiLogo}
                        alt="Kompi"
                        class="brand-logo"
                        width="100"
                        height="30"
                    />
                    <span class="brand-word">
                        <span class="brand-tag">recycling</span>
                    </span>
                </a>
                <div class="brand-stats" aria-live="polite">
                    <span
                        ><strong
                            >{totalCount.toLocaleString(
                                "pl-PL",
                            )}</strong
                        > punktów</span
                    >
                    <span class="brand-sep" aria-hidden="true">·</span>
                    <span
                        ><strong>{cityCount.toLocaleString("pl-PL")}</strong> miast</span
                    >
                </div>
                <button
                    type="button"
                    class="new-search"
                    onclick={() => {
                        clearItem();
                        query = "";
                        heroQuery = "";
                        takebackTypes = new Set();
                        anchor = null;
                        radiusKm = null;
                    }}
                >
                    ← Nowe wyszukiwanie
                </button>
            </div>

            <div class="takeback-island">
                <TakebackFilter bind:selected={takebackTypes} />
            </div>

            <div class="search-island">
                <SearchBox
                    bind:query
                    results={suggestions}
                    loading={geocoding}
                    onselect={handleSelect}
                    onsubmit={handleSubmit}
                >
                    {#snippet trailing()}
                        <button
                            type="button"
                            class="locate-btn"
                            class:locate-btn--active={locating}
                            aria-label="Pokaż moją lokalizację"
                            title={locateError ?? "Pokaż moją lokalizację"}
                            disabled={locating}
                            onclick={locateMe}
                        >
                            {#if locating}
                                <svg
                                    class="locate-spin"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            {:else}
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 2v3" />
                                    <path d="M12 19v3" />
                                    <path d="M2 12h3" />
                                    <path d="M19 12h3" />
                                </svg>
                            {/if}
                        </button>
                    {/snippet}
                </SearchBox>
            </div>

            {#if anchor}
                <div class="proximity-island">
                    <ProximityPill
                        {anchor}
                        bind:radiusKm
                        onclear={clearAnchor}
                    />
                </div>
            {/if}

            {#if showResults}
                <div class="results-island" aria-label="Wyniki">
                    <div class="results-head">
                        <div
                            class="results-head-line"
                            id="results-top"
                            tabindex="-1"
                        >
                            <strong
                                >{sortedFiltered.length.toLocaleString(
                                    "pl-PL",
                                )}</strong
                            >
                            <span class="results-noun">
                                {sortedFiltered.length === 1
                                    ? "wynik"
                                    : sortedFiltered.length % 10 >= 2 &&
                                        sortedFiltered.length % 10 <= 4 &&
                                        (sortedFiltered.length % 100 < 12 ||
                                            sortedFiltered.length % 100 > 14)
                                      ? "wyniki"
                                      : "wyników"}
                            </span>
                            {#if query.trim()}
                                <span class="results-q"
                                    >dla „{query.trim()}"</span
                                >
                            {/if}
                        </div>
                        {#if categories.size > 0 || takebackTypes.size > 0 || anchor !== null}
                            <button
                                type="button"
                                class="results-clear"
                                onclick={() => {
                                    clearItem();
                                    takebackTypes = new Set();
                                    anchor = null;
                                    radiusKm = null;
                                }}
                                aria-label="Wyczyść filtry"
                            >
                                Wyczyść filtry
                            </button>
                        {/if}
                    </div>
                    {#if selectedItem}
                        <div class="rules-slot">
                            <RulesBox item={selectedItem} />
                        </div>
                    {/if}
                    <div class="results-scroll">
                        {#if sortedFiltered.length === 0 && nearestFallback.length > 0}
                            <p class="fallback-note">
                                Brak punktów w promieniu {radiusKm} km.
                                Najbliższe punkty poza promieniem:
                            </p>
                            <PointList
                                points={nearestFallback}
                                {selectedSlug}
                                onhover={(slug) => (selectedSlug = slug)}
                                distanceKm={distanceIndex}
                            />
                            <button
                                type="button"
                                class="widen"
                                onclick={() =>
                                    (radiusKm = Math.min(
                                        100,
                                        (radiusKm ?? 10) * 2.5,
                                    ))}
                            >
                                Powiększ promień wyszukiwania
                            </button>
                        {:else}
                            <PointList
                                points={pagedPoints}
                                {selectedSlug}
                                onhover={(slug) => (selectedSlug = slug)}
                                distanceKm={distanceIndex}
                            />
                        {/if}
                    </div>
                    <Pagination
                        bind:page
                        {pageCount}
                        total={sortedFiltered.length}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            {/if}
        </div>

        <div class="chips-island">
            <CategoryFilter bind:selected={categories} />
        </div>
    </div>

    {#if locateError}
        <div class="toast" role="status">
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{locateError}</span>
            <button
                type="button"
                class="toast-close"
                aria-label="Zamknij"
                onclick={() => (locateError = null)}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <line x1="18" y1="6" x2="6" y2="18" /><line
                        x1="6"
                        y1="6"
                        x2="18"
                        y2="18"
                    />
                </svg>
            </button>
        </div>
    {/if}
</div>
{/if}

<style>
    /* ══ Landing — yoga-style: quiet, centered, one search ══ */
    .landing {
        flex: 1;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        padding: 9vh var(--kompi-gutter) 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .kicker {
        margin: 0 0 18px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--kompi-accent);
        font-weight: 600;
    }
    .hero-title {
        margin: 0 0 14px;
        font-size: clamp(2.2rem, 5.5vw, 3.8rem);
        font-weight: 400;
        line-height: 1.08;
        letter-spacing: -0.03em;
        color: var(--kompi-text);
    }
    .sub {
        margin: 0 0 36px;
        color: var(--kompi-text-3);
        font-size: 15px;
        max-width: 560px;
        line-height: 1.6;
    }
    .hero-search {
        width: 100%;
        max-width: 600px;
        position: relative;
        margin-bottom: 44px;
    }
    .locate-error {
        margin: -32px 0 32px;
        font-size: 13px;
        color: var(--kompi-danger);
    }

    /* ── Chip sections ── */
    .chip-section {
        width: 100%;
    }
    .chip-section + .chip-section {
        margin-top: 28px;
    }
    .chip-label {
        margin: 0 0 12px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--kompi-accent);
        font-weight: 600;
    }
    /* Mobile: horizontal scroll; desktop: centered wrap (yoga pattern). */
    .chip-scroll {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        margin: 0 calc(-1 * var(--kompi-gutter));
        padding: 2px var(--kompi-gutter);
    }
    .chip-scroll::-webkit-scrollbar {
        display: none;
    }
    @media (min-width: 721px) {
        .chip-scroll {
            flex-wrap: wrap;
            justify-content: center;
            overflow: visible;
            margin: 0;
            padding: 0;
        }
    }

    .chip-pill {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--kompi-surface);
        border: 1px solid var(--kompi-border);
        border-radius: 24px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .chip-pill:hover {
        border-color: var(--chip-color, var(--kompi-accent));
        box-shadow: var(--kompi-shadow-sm);
        transform: translateY(-1px);
    }
    .chip-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--chip-color);
        flex-shrink: 0;
    }
    .chip-name {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--kompi-text);
        white-space: nowrap;
    }
    .chip-count {
        font-size: 11px;
        color: var(--kompi-accent);
        font-variant-numeric: tabular-nums;
    }
    .chip-pill--subtle {
        background: transparent;
        border-color: color-mix(in srgb, var(--kompi-border) 60%, transparent);
        padding: 6px 12px;
        gap: 6px;
    }
    .chip-pill--subtle .chip-name {
        font-size: 12.5px;
        font-weight: 400;
        color: var(--kompi-text-3);
    }
    .chip-pill--subtle:hover {
        background: var(--kompi-surface);
        border-color: var(--kompi-border);
        box-shadow: none;
    }
    .chip-pill--subtle:hover .chip-name {
        color: var(--kompi-text);
    }

    .edu-line {
        margin: 52px 0 0;
        font-size: 14px;
        color: var(--kompi-text-3);
    }
    .edu-line a {
        font-weight: 600;
    }

    @media (max-height: 700px) {
        .landing {
            padding-top: 5vh;
        }
    }

    /* ══ Results — light islands over the map ══ */
    .map-app {
        position: fixed;
        inset: 0;
        z-index: 40;
        background: var(--kompi-bg);
    }

    .map-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
    }

    /* While the results overlay is mounted it covers the entire viewport,
       header and footer included (by design). Contain the page behind it:
       no phantom scroll, and the hidden chrome must not stay focusable. */
    :global(body:has(.map-app)) {
        overflow: hidden;
    }
    :global(body:has(.map-app) .site-header),
    :global(body:has(.map-app) .site-footer) {
        visibility: hidden;
    }

    .controls {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 24px;
        z-index: 10;
        display: grid;
        grid-template-columns: 400px minmax(0, 1fr);
        gap: 20px;
        pointer-events: none;
    }

    .left-col {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 0;
    }

    .brand-island {
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--kompi-space-3);
        padding: 12px 16px;
        background: var(--kompi-glass);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--kompi-glass-border);
        border-radius: 16px;
        box-shadow: var(--kompi-shadow-md);
    }
    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--kompi-text);
        text-decoration: none;
    }
    .brand:hover {
        text-decoration: none;
        color: var(--kompi-text);
    }
    .brand-logo {
        display: block;
        height: 30px;
        width: auto;
        object-fit: contain;
    }
    .brand-word {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
        border-left: 1px solid var(--kompi-border-strong);
        padding-left: 12px;
    }
    .brand-tag {
        font-size: 16px;
        color: var(--kompi-text-2);
        font-weight: 600;
        letter-spacing: 0.02em;
    }
    .brand-stats {
        font-size: 12px;
        color: var(--kompi-text-3);
        text-align: right;
        white-space: nowrap;
        display: flex;
        gap: 8px;
        align-items: baseline;
        flex-shrink: 0;
        padding: 6px 12px;
        background: var(--kompi-bg-subtle);
        border-radius: 20px;
    }
    .brand-stats strong {
        color: var(--kompi-text);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }
    .brand-sep {
        color: var(--kompi-border-strong);
    }
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

    /* SearchBox carries its own white capsule — the island is just a
       pointer-events wrapper. */
    .search-island {
        pointer-events: auto;
    }
    .search-island :global(.sb) {
        box-shadow: var(--kompi-shadow-md);
    }

    /* Sits between search and results — narrow, transparent, no card bg.
       Chips carry their own background. */
    .takeback-island {
        pointer-events: auto;
        padding: 0 4px;
    }

    /* Proximity pill — appears under the search box once an anchor is set. */
    .proximity-island {
        pointer-events: auto;
        display: flex;
        padding: 0 4px;
    }

    /* Floating hint when the current viewport hit the server-side bbox cap.
       Tells the user that what they see isn't the full set, without blocking
       interaction. */
    .truncation-hint {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 11;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: var(--kompi-glass-strong);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--kompi-glass-border);
        border-radius: 999px;
        color: var(--kompi-text-2);
        font-size: 12px;
        font-weight: 600;
        box-shadow: var(--kompi-shadow-md);
        pointer-events: none;
    }
    .truncation-hint svg {
        color: var(--kompi-warning);
        flex-shrink: 0;
    }

    .results-island {
        pointer-events: auto;
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--kompi-glass-strong);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--kompi-glass-border);
        border-radius: 16px;
        box-shadow: var(--kompi-shadow-md);
        overflow: hidden;
    }

    .results-head {
        padding: 14px 20px;
        border-bottom: 1px solid var(--kompi-border);
        font-size: 13px;
        color: var(--kompi-text-3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
    }
    .results-head-line {
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-width: 0;
    }
    /* Focus target for the landing→results morph — not an interactive
       element, so no visible focus ring needed. */
    #results-top {
        outline: none;
    }
    .results-head strong {
        color: var(--kompi-text);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }
    .results-noun {
        color: var(--kompi-text-3);
        font-weight: 500;
    }
    .results-q {
        color: var(--kompi-accent);
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        background: var(--kompi-accent-subtle);
        padding: 2px 8px;
        border-radius: 12px;
    }
    .results-clear {
        background: transparent;
        border: 0;
        color: var(--kompi-text-3);
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 12px;
        flex-shrink: 0;
        transition: all 0.2s ease;
    }
    .results-clear:hover {
        background: rgba(220, 38, 38, 0.08);
        color: var(--kompi-danger);
    }

    .rules-slot {
        padding: 12px 16px 0;
        flex-shrink: 0;
    }

    .results-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        scrollbar-width: thin;
        scrollbar-color: rgba(28, 38, 53, 0.2) transparent;
    }

    .fallback-note {
        margin: 0 0 10px;
        font-size: 13px;
        color: var(--kompi-warning);
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

    .results-scroll::-webkit-scrollbar {
        width: 6px;
    }
    .results-scroll::-webkit-scrollbar-track {
        background: transparent;
    }
    .results-scroll::-webkit-scrollbar-thumb {
        background-color: rgba(28, 38, 53, 0.2);
        border-radius: 10px;
    }

    .chips-island {
        pointer-events: auto;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
        align-self: start;
        padding: 4px 0;
        /* Soft fade on the right edge as an affordance for horizontal overflow. */
        mask-image: linear-gradient(
            to right,
            black 0,
            black calc(100% - 40px),
            transparent 100%
        );
        -webkit-mask-image: linear-gradient(
            to right,
            black 0,
            black calc(100% - 40px),
            transparent 100%
        );
    }
    .chips-island::-webkit-scrollbar {
        display: none;
    }

    .chips-island :global(.filters) {
        flex-wrap: nowrap;
        gap: 8px;
    }
    .chips-island :global(.chip) {
        white-space: nowrap;
    }

    .locate-btn {
        display: inline-grid;
        place-items: center;
        width: 36px;
        height: 36px;
        background: transparent;
        border: 0;
        border-radius: 10px;
        color: var(--kompi-text-3);
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s var(--kompi-ease);
    }
    .locate-btn:hover {
        background: var(--kompi-accent-subtle);
        color: var(--kompi-accent);
    }
    .locate-btn:active {
        transform: scale(0.95);
    }
    .locate-btn:disabled {
        cursor: default;
        color: var(--kompi-accent);
        opacity: 0.5;
    }
    .locate-spin {
        animation: locate-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes locate-spin {
        to {
            transform: rotate(360deg);
        }
    }

    .toast {
        position: absolute;
        top: 84px;
        right: 20px;
        z-index: 11;
        max-width: 400px;
        padding: 14px 16px;
        background: var(--kompi-glass-strong);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--kompi-glass-border);
        border-left: 4px solid var(--kompi-danger);
        border-radius: 16px;
        box-shadow: var(--kompi-shadow-lg);
        color: var(--kompi-text);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toast > svg {
        color: var(--kompi-danger);
        flex-shrink: 0;
    }
    .toast > span {
        flex: 1;
        min-width: 0;
        line-height: 1.5;
        font-weight: 500;
    }
    .toast-close {
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        background: var(--kompi-bg-subtle);
        border: 0;
        color: var(--kompi-text-3);
        border-radius: 50%;
        flex-shrink: 0;
        transition: all 0.2s var(--kompi-ease);
    }
    .toast-close:hover {
        background: rgba(220, 38, 38, 0.08);
        color: var(--kompi-danger);
    }
    @keyframes toast-in {
        from {
            opacity: 0;
            transform: translateY(-16px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* Subtle, staggered entrance for the floating islands. */
    .brand-island,
    .search-island,
    .chips-island,
    .results-island {
        animation: island-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .search-island {
        animation-delay: 0.08s;
    }
    .chips-island {
        animation-delay: 0.16s;
    }
    .results-island {
        animation-delay: 0.24s;
    }

    @keyframes island-in {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .brand-island,
        .search-island,
        .chips-island,
        .results-island,
        .toast {
            animation: none;
            transition: none;
        }
    }

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
            background: rgba(28, 38, 53, 0.2);
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
        .search-island {
            border-radius: 12px;
        }
        .results-island {
            border-radius: 16px 16px 0 0;
        }
        .truncation-hint {
            bottom: calc(48dvh + 12px);
        }
    }
</style>
