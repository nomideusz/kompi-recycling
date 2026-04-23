<script lang="ts">
    import RecyclingMap from "$lib/components/RecyclingMap.svelte";
    import CategoryFilter from "$lib/components/CategoryFilter.svelte";
    import TakebackFilter from "$lib/components/TakebackFilter.svelte";
    import SearchBox from "$lib/components/SearchBox.svelte";
    import PointList from "$lib/components/PointList.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import ProximityPill from "$lib/components/ProximityPill.svelte";
    import {
        buildDistanceIndex,
        buildHaystackIndex,
        buildSuggestions,
        filterPoints,
        sortByDistance,
    } from "$lib/search";
    import { geocodeAddress, type Anchor } from "$lib/distance";
    import { fromWire } from "$lib/wire";
    import { PointStore, type Bbox } from "$lib/pointStore.svelte";
    import type { CategoryId, TakebackType } from "$lib/types";

    let { data } = $props();

    // Initial bbox the SSR payload was filtered against — so the store
    // doesn't refetch the country view on first idle.
    const POLAND_BBOX: Bbox = {
        north: 55.5,
        south: 49.0,
        east: 24.5,
        west: 14.0,
    };

    const store = new PointStore();
    store.seed(
        data.initialPoints.map(fromWire),
        data.totalCount,
        POLAND_BBOX,
        data.initialTruncated,
    );

    let query = $state("");
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

    const DEFAULT_RADIUS_KM = 10;

    import KompiLogo from "$lib/images/logo/logo-kompi-white.png";

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

    const pageCount = $derived(
        Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE)),
    );

    const pagedPoints = $derived(
        sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    );

    const suggestions = $derived(
        buildSuggestions(points, query, data.cityAggregates),
    );

    const showResults = $derived(
        query.trim().length > 0 ||
            categories.size > 0 ||
            takebackTypes.size > 0 ||
            anchor !== null,
    );

    const totalCount = $derived(data.totalCount);
    const cityCount = $derived(data.cityAggregates.length);

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
            description: `Katalog ${totalCount.toLocaleString('pl-PL')} punktów zbiórki w ${cityCount.toLocaleString('pl-PL')} miastach: ZSEiE, baterie, akumulatory, świetlówki.`,
        },
    ]);

    // Reset to page 1 whenever the filter set changes.
    $effect(() => {
        void query;
        void categories;
        void takebackTypes;
        void anchor;
        void radiusKm;
        page = 1;
    });

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
        store.fetchBbox(b);
    }

    async function handleSelect(item: { key: string; text: string }) {
        if (item.key.startsWith("city:")) {
            const cityName = item.key.slice("city:".length);
            const agg = data.cityAggregates.find((c) => c.city === cityName);
            if (agg) {
                // Pan to the city centroid; the map's idle event will trigger
                // a bbox fetch so the points for that city stream in.
                mapRef?.panTo(agg.lat, agg.lng, 12);
                query = "";
            } else {
                query = cityName;
            }
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

    function clearAnchor() {
        anchor = null;
        radiusKm = null;
    }
</script>

<svelte:head>
    <title
        >recycling.kompi.pl — mapa punktów zbiórki elektroodpadów w Polsce</title
    >
    <meta
        name="description"
        content="Mapa punktów zbiórki zużytego sprzętu elektronicznego (ZSEiE), baterii, akumulatorów i świetlówek w Polsce. Znajdź najbliższy punkt."
    />
    <meta
        name="keywords"
        content="punkty zbiórki elektroodpadów, recykling elektroniki, ZSEiE, zbiórka baterii, zużyty sprzęt AGD, świetlówki, PSZOK, mapa Polska"
    />
    <link rel="canonical" href="https://recycling.kompi.pl/" />
    <link rel="alternate" hreflang="pl-PL" href="https://recycling.kompi.pl/" />
    <link rel="alternate" hreflang="x-default" href="https://recycling.kompi.pl/" />
    <meta
        property="og:title"
        content="recycling.kompi.pl — mapa punktów zbiórki elektroodpadów w Polsce"
    />
    <meta
        property="og:description"
        content="Znajdź najbliższy punkt zbiórki zużytego sprzętu, baterii i świetlówek. Ponad {totalCount.toLocaleString('pl-PL')} lokalizacji w {cityCount.toLocaleString('pl-PL')} miastach."
    />
    <meta property="og:url" content="https://recycling.kompi.pl/" />
    <meta
        name="twitter:title"
        content="recycling.kompi.pl — mapa punktów zbiórki elektroodpadów"
    />
    <meta
        name="twitter:description"
        content="Znajdź najbliższy punkt zbiórki zużytego sprzętu, baterii i świetlówek w Polsce."
    />
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<div class="map-app">
    <div class="map-layer" aria-label="Mapa punktów zbiórki">
        <RecyclingMap
            bind:this={mapRef}
            points={sortedFiltered}
            apiKey={data.googleMapsApiKey}
            mapId={data.googleMapsMapId}
            bind:selectedSlug
            onbounds={handleBounds}
        />
    </div>

    {#if store.truncated}
        <div class="truncation-hint" role="status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/>
            </svg>
            <span>Przybliż, aby zobaczyć wszystkie punkty w tym obszarze</span>
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
                        <div class="results-head-line">
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
                                    categories = new Set();
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
                    <div class="results-scroll">
                        <PointList
                            points={pagedPoints}
                            {selectedSlug}
                            onhover={(slug) => (selectedSlug = slug)}
                        />
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

<style>
    .map-app {
        position: absolute;
        inset: 0;
    }

    .map-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
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
        gap: 16px;
        min-height: 0;
    }

    /* Glassmorphism utility for islands */
    .island-glass {
        background: rgba(24, 24, 27, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .brand-island {
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--kompi-space-3);
        padding: 12px 16px;
        background: rgba(24, 24, 27, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.04);
        transition:
            transform 0.2s var(--kompi-ease),
            box-shadow 0.2s var(--kompi-ease);
    }
    .brand-island:hover {
        transform: translateY(-1px);
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04);
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
        background: rgba(0, 0, 0, 0.03);
        border-radius: 20px;
    }
    .brand-stats strong {
        color: var(--kompi-text);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }
    .brand-sep {
        color: var(--kompi-border-strong);
        opacity: 0.5;
    }

    .search-island {
        pointer-events: auto;
        background: rgba(24, 24, 27, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.04);
        transition:
            transform 0.2s var(--kompi-ease),
            box-shadow 0.2s var(--kompi-ease);
    }
    .search-island:focus-within {
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 0 0 2px var(--kompi-accent-muted);
        transform: translateY(-1px);
    }

    /* Sits between search and results — narrow, transparent, no card bg.
       Chips carry their own translucent background. */
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
        background: rgba(24, 24, 27, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        color: var(--kompi-text-2);
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
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
        background: rgba(24, 24, 27, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.04);
        overflow: hidden;
    }

    .results-head {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        font-size: 13px;
        color: var(--kompi-text-3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
        background: linear-gradient(
            to bottom,
            rgba(24, 24, 27, 0.9),
            rgba(18, 18, 23, 0.6)
        );
    }
    .results-head-line {
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-width: 0;
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
        background: rgba(185, 53, 33, 0.1);
        color: var(--kompi-danger);
    }

    .results-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    }

    .results-scroll::-webkit-scrollbar {
        width: 6px;
    }
    .results-scroll::-webkit-scrollbar-track {
        background: transparent;
    }
    .results-scroll::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(24, 24, 27, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }
    .chips-island :global(.chip:hover) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .locate-btn {
        display: inline-grid;
        place-items: center;
        width: 36px;
        height: 36px;
        background: transparent;
        border: 0;
        border-radius: 10px;
        color: var(--kompi-text-2);
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s var(--kompi-ease);
    }
    .locate-btn:hover {
        background: var(--kompi-accent-subtle);
        color: var(--kompi-accent);
        transform: scale(1.05);
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
        background: rgba(24, 24, 27, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid var(--kompi-danger);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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
        background: rgba(0, 0, 0, 0.03);
        border: 0;
        color: var(--kompi-text-3);
        border-radius: 50%;
        flex-shrink: 0;
        transition: all 0.2s var(--kompi-ease);
    }
    .toast-close:hover {
        background: rgba(185, 53, 33, 0.1);
        color: var(--kompi-danger);
        transform: rotate(90deg);
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
            bottom: 12px;
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
        }
        .chips-island {
            align-self: stretch;
            order: 2;
        }
        .left-col {
            order: 1;
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
            bottom: 20px;
            left: 12px;
            right: 12px;
            max-width: none;
        }
        .brand-island,
        .search-island,
        .results-island {
            border-radius: 12px;
        }
    }
</style>
