<script lang="ts">
  import RecyclingMap from '$lib/components/RecyclingMap.svelte';
  import CategoryFilter from '$lib/components/CategoryFilter.svelte';
  import SearchBox from '$lib/components/SearchBox.svelte';
  import PointList from '$lib/components/PointList.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { buildSuggestions, filterPoints } from '$lib/search';
  import type { CategoryId } from '$lib/types';

  let { data } = $props();

  let query = $state('');
  let categories = $state<Set<CategoryId>>(new Set());
  let selectedSlug = $state<string | null>(null);
  let mapRef: RecyclingMap | undefined = $state();
  let locating = $state(false);
  let locateError = $state<string | null>(null);
  let page = $state(1);

  const PAGE_SIZE = 20;

  const filtered = $derived(
    filterPoints(data.points, { query, categories, city: null }),
  );

  const pageCount = $derived(
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );

  const pagedPoints = $derived(
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );

  const suggestions = $derived(buildSuggestions(data.points, query));

  const showResults = $derived(
    query.trim().length > 0 || categories.size > 0,
  );

  const cityCount = $derived(new Set(data.points.map((p) => p.city)).size);

  // Reset to page 1 whenever the filter set changes.
  $effect(() => {
    void query;
    void categories;
    page = 1;
  });

  function locateMe() {
    if (!('geolocation' in navigator)) {
      locateError = 'Twoja przeglądarka nie obsługuje geolokalizacji.';
      return;
    }
    locating = true;
    locateError = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating = false;
        const { latitude, longitude, accuracy } = pos.coords;
        mapRef?.setUserLocation(latitude, longitude, accuracy);
        mapRef?.panTo(latitude, longitude, 13);
      },
      (err) => {
        locating = false;
        if (err.code === err.PERMISSION_DENIED) {
          locateError = 'Dostęp do lokalizacji został zablokowany.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          locateError = 'Nie udało się ustalić lokalizacji.';
        } else {
          locateError = 'Upłynął limit czasu lokalizowania.';
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }
</script>

<svelte:head>
  <title>recycling.kompi.pl — mapa punktów zbiórki elektroodpadów w Polsce</title>
  <meta
    name="description"
    content="Mapa punktów zbiórki zużytego sprzętu elektronicznego (ZSEiE), baterii, akumulatorów i świetlówek w Polsce. Znajdź najbliższy punkt."
  />
  <link rel="canonical" href="https://recycling.kompi.pl/" />
  <meta property="og:title" content="recycling.kompi.pl — mapa punktów zbiórki elektroodpadów w Polsce" />
  <meta property="og:description" content="Znajdź najbliższy punkt zbiórki zużytego sprzętu, baterii i świetlówek." />
  <meta property="og:url" content="https://recycling.kompi.pl/" />
</svelte:head>

<div class="map-app">
  <div class="map-layer" aria-label="Mapa punktów zbiórki">
    <RecyclingMap
      bind:this={mapRef}
      points={filtered}
      apiKey={data.googleMapsApiKey}
      mapId={data.googleMapsMapId}
      bind:selectedSlug
    />
  </div>

  <div class="controls" aria-label="Wyszukaj punkt zbiórki">
    <div class="left-col">
      <div class="brand-island" aria-label="recycling.kompi.pl">
        <a class="brand" href="/">
          <span class="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
              <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
              <path d="m14 16-3 3 3 3"/>
              <path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
              <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
              <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
            </svg>
          </span>
          <span class="brand-word">
            <span class="brand-name">recycling<span class="brand-tld">.kompi.pl</span></span>
            <span class="brand-tag">mapa elektroodpadów</span>
          </span>
        </a>
        <div class="brand-stats" aria-live="polite">
          <span><strong>{data.points.length.toLocaleString('pl-PL')}</strong> punktów</span>
          <span class="brand-sep" aria-hidden="true">·</span>
          <span><strong>{cityCount.toLocaleString('pl-PL')}</strong> miast</span>
        </div>
      </div>

      <div class="search-island">
        <SearchBox
          bind:query
          results={suggestions}
          onselect={(item) => {
            query = item.text;
          }}
        >
          {#snippet trailing()}
            <button
              type="button"
              class="locate-btn"
              class:locate-btn--active={locating}
              aria-label="Pokaż moją lokalizację"
              title={locateError ?? 'Pokaż moją lokalizację'}
              disabled={locating}
              onclick={locateMe}
            >
              {#if locating}
                <svg class="locate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              {:else}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3"/>
                  <path d="M12 19v3"/>
                  <path d="M2 12h3"/>
                  <path d="M19 12h3"/>
                </svg>
              {/if}
            </button>
          {/snippet}
        </SearchBox>
      </div>

      {#if showResults}
        <div class="results-island" aria-label="Wyniki">
          <div class="results-head">
            <div class="results-head-line">
              <strong>{filtered.length.toLocaleString('pl-PL')}</strong>
              <span class="results-noun">
                {filtered.length === 1
                  ? 'wynik'
                  : filtered.length % 10 >= 2 && filtered.length % 10 <= 4 && (filtered.length % 100 < 12 || filtered.length % 100 > 14)
                    ? 'wyniki'
                    : 'wyników'}
              </span>
              {#if query.trim()}
                <span class="results-q">dla „{query.trim()}"</span>
              {/if}
            </div>
            {#if categories.size > 0}
              <button
                type="button"
                class="results-clear"
                onclick={() => (categories = new Set())}
                aria-label="Wyczyść filtry kategorii"
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
            total={filtered.length}
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{locateError}</span>
      <button type="button" class="toast-close" aria-label="Zamknij" onclick={() => (locateError = null)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    z-index: 10;
    display: grid;
    grid-template-columns: 380px minmax(0, 1fr);
    gap: var(--kompi-space-3);
    pointer-events: none;
  }

  .left-col {
    display: flex;
    flex-direction: column;
    gap: var(--kompi-space-3);
    min-height: 0;
  }

  .brand-island {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--kompi-space-3);
    padding: 10px 14px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    box-shadow: var(--kompi-shadow);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--kompi-text);
    text-decoration: none;
  }
  .brand:hover {
    text-decoration: none;
    color: var(--kompi-text);
  }
  .brand-mark {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    background: var(--kompi-accent);
    color: white;
    border-radius: var(--kompi-radius-sm);
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
    flex-shrink: 0;
  }
  .brand-word {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .brand-name {
    font-weight: 700;
    font-size: var(--kompi-text-md);
    letter-spacing: -0.015em;
    color: var(--kompi-text);
  }
  .brand-tld {
    color: var(--kompi-accent);
    font-weight: 600;
  }
  .brand-tag {
    font-size: 11px;
    color: var(--kompi-text-3);
    font-weight: 500;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .brand-stats {
    font-size: var(--kompi-text-xs);
    color: var(--kompi-text-3);
    text-align: right;
    white-space: nowrap;
    display: flex;
    gap: 6px;
    align-items: baseline;
    flex-shrink: 0;
  }
  .brand-stats strong {
    color: var(--kompi-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .brand-sep {
    color: var(--kompi-border-strong);
  }

  .search-island {
    pointer-events: auto;
    border-radius: var(--kompi-radius);
    box-shadow: var(--kompi-shadow);
  }

  .results-island {
    pointer-events: auto;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    box-shadow: var(--kompi-shadow);
    overflow: hidden;
  }

  .results-head {
    padding: 12px var(--kompi-space-4);
    border-bottom: 1px solid var(--kompi-border);
    font-size: var(--kompi-text-sm);
    color: var(--kompi-text-3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--kompi-space-3);
    flex-shrink: 0;
    background: linear-gradient(
      to bottom,
      var(--kompi-surface),
      var(--kompi-bg-subtle)
    );
  }
  .results-head-line {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
  }
  .results-head strong {
    color: var(--kompi-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .results-noun {
    color: var(--kompi-text-3);
  }
  .results-q {
    color: var(--kompi-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .results-clear {
    background: transparent;
    border: 0;
    color: var(--kompi-accent);
    font-size: var(--kompi-text-xs);
    font-weight: 500;
    padding: 2px 6px;
    border-radius: var(--kompi-radius-sm);
    flex-shrink: 0;
  }
  .results-clear:hover {
    background: var(--kompi-accent-muted);
    color: var(--kompi-accent-hover);
  }

  .results-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--kompi-space-3);
    scrollbar-gutter: stable;
  }

  .chips-island {
    pointer-events: auto;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    align-self: start;
    padding: var(--kompi-space-1) 0;
    /* Soft fade on the right edge as an affordance for horizontal overflow. */
    mask-image: linear-gradient(
      to right,
      black 0,
      black calc(100% - 32px),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      black 0,
      black calc(100% - 32px),
      transparent 100%
    );
  }
  .chips-island::-webkit-scrollbar { display: none; }

  .chips-island :global(.filters) {
    flex-wrap: nowrap;
  }
  .chips-island :global(.chip) {
    white-space: nowrap;
    box-shadow: var(--kompi-shadow-sm);
  }

  .locate-btn {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 0;
    border-radius: var(--kompi-radius-sm);
    color: var(--kompi-text-2);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--kompi-dur-fast) var(--kompi-ease),
                color var(--kompi-dur-fast) var(--kompi-ease);
  }
  .locate-btn:hover {
    background: var(--kompi-bg);
    color: var(--kompi-accent);
  }
  .locate-btn:disabled {
    cursor: default;
    color: var(--kompi-accent);
  }
  .locate-spin {
    animation: locate-spin 0.8s linear infinite;
  }
  @keyframes locate-spin { to { transform: rotate(360deg); } }

  .toast {
    position: absolute;
    top: 76px;
    right: 16px;
    z-index: 11;
    max-width: 380px;
    padding: 10px 12px 10px 14px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-left: 3px solid var(--kompi-danger);
    border-radius: var(--kompi-radius);
    box-shadow: var(--kompi-shadow-md);
    color: var(--kompi-text);
    font-size: var(--kompi-text-sm);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toast-in 0.28s var(--kompi-ease);
  }
  .toast > svg {
    color: var(--kompi-danger);
    flex-shrink: 0;
  }
  .toast > span {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .toast-close {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: 0;
    color: var(--kompi-text-3);
    border-radius: var(--kompi-radius-sm);
    flex-shrink: 0;
    transition: background var(--kompi-dur-fast) var(--kompi-ease),
                color var(--kompi-dur-fast) var(--kompi-ease);
  }
  .toast-close:hover {
    background: var(--kompi-bg);
    color: var(--kompi-text);
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Subtle, staggered entrance for the floating islands. */
  .brand-island,
  .search-island,
  .chips-island,
  .results-island {
    animation: island-in 0.4s var(--kompi-ease) both;
  }
  .search-island  { animation-delay: 0.04s; }
  .chips-island   { animation-delay: 0.08s; }
  .results-island { animation-delay: 0.12s; }
  @keyframes island-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .brand-island,
    .search-island,
    .chips-island,
    .results-island,
    .toast {
      animation: none;
    }
  }

  @media (max-width: 720px) {
    .controls {
      top: 8px;
      left: 8px;
      right: 8px;
      bottom: 8px;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--kompi-space-2);
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
    }
    .toast {
      top: auto;
      bottom: 16px;
      left: 8px;
      right: 8px;
      max-width: none;
    }
  }
</style>
