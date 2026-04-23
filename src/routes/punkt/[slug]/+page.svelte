<script lang="ts">
  import { CATEGORIES_BY_ID } from '$lib/categories';

  let { data } = $props();
  const p = $derived(data.point);

  const mapsUrl = $derived(
    `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
  );
  const directionsUrl = $derived(
    `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
  );
  const canonicalUrl = $derived(`https://recycling.kompi.pl/punkt/${p.slug}`);
  const description = $derived(
    `Punkt zbiórki elektroodpadów ${p.name}, ${p.address}, ${p.city}. Operator: ${p.operator || '—'}.`,
  );

  const acceptList = $derived(
    p.categories
      .map((id) => CATEGORIES_BY_ID[id]?.label)
      .filter(Boolean)
      .join(', '),
  );

  const jsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.address,
      addressLocality: p.city,
      postalCode: p.postalCode,
      addressCountry: 'PL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: p.lat,
      longitude: p.lng,
    },
    telephone: p.phone ?? undefined,
    url: p.website ?? canonicalUrl,
    openingHours: p.hours || undefined,
    description,
  });
</script>

<svelte:head>
  <title>{p.name} — {p.city} — recycling.kompi.pl</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content="{p.name} — {p.city}" />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="place" />
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<div class="topbar">
  <div class="topbar-inner">
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
      <span class="brand-word">recycling<span class="tld">.kompi.pl</span></span>
    </a>
    <a class="back" href="/">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      Wróć do mapy
    </a>
  </div>
</div>

<div class="container">
 <article class="inner">
  <nav class="crumbs" aria-label="Ścieżka nawigacji">
    <a href="/">Mapa</a>
    <span aria-hidden="true">›</span>
    <span>{p.city}</span>
    <span aria-hidden="true">›</span>
    <span aria-current="page">{p.name}</span>
  </nav>

  <header class="hero">
    <h1>{p.name}</h1>
    <div class="meta">
      {#if p.operator}
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/>
          </svg>
          {p.operator}
        </span>
      {/if}
      <span class="meta-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {p.city}
      </span>
    </div>
  </header>

  <div class="actions">
    <a class="btn btn-primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      Wyznacz trasę
    </a>
    {#if p.phone}
      <a class="btn" href="tel:{p.phone.replace(/\s+/g, '')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        {p.phone}
      </a>
    {/if}
    {#if p.website}
      <a class="btn" href={p.website} target="_blank" rel="noopener noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Strona operatora
      </a>
    {/if}
  </div>

  <div class="grid">
    <section class="details">
      <div class="panel">
        <h2>Adres</h2>
        <p class="addr">
          {p.address}<br />
          <span class="postal">{p.postalCode}</span> {p.city}
        </p>
        <a class="map-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
          Otwórz w Google Maps
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
          </svg>
        </a>
      </div>

      <div class="panel">
        <h2>Godziny otwarcia</h2>
        <p class="hours">{p.hours || 'Brak danych — skontaktuj się z operatorem.'}</p>
      </div>

      {#if p.notes}
        <div class="panel panel-note">
          <h2>Uwagi</h2>
          <p class="notes">{p.notes}</p>
        </div>
      {/if}
    </section>

    <aside class="accepts">
      <h2>Przyjmowane odpady</h2>
      <ul>
        {#each p.categories as id (id)}
          {@const cat = CATEGORIES_BY_ID[id]}
          <li style="--chip-color: var({cat.colorVar});">
            <span class="dot" aria-hidden="true"></span>
            <div>
              <strong>{cat.label}</strong>
              <span>{cat.description}</span>
            </div>
          </li>
        {/each}
      </ul>
      {#if acceptList}
        <p class="sr-only">Przyjmowane odpady: {acceptList}.</p>
      {/if}
    </aside>
  </div>

  <footer class="foot">
    <p class="disclaimer">
      Dane kontaktowe i godziny otwarcia potwierdź u operatora przed wizytą.
    </p>
    <p class="report">
      Zauważyłeś nieaktualne dane?
      <a href="mailto:kontakt@kompi.pl?subject=Błędne%20dane%20-%20{encodeURIComponent(p.name)}&body=Slug:%20{p.slug}%0AMiasto:%20{encodeURIComponent(p.city)}%0A%0AOpis%20błędu:">
        Zgłoś błąd →
      </a>
    </p>
  </footer>
 </article>
</div>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--kompi-surface);
    border-bottom: 1px solid var(--kompi-border);
    backdrop-filter: saturate(180%) blur(8px);
  }
  .topbar-inner {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--kompi-space-4);
    padding: 10px var(--kompi-gutter);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--kompi-text);
    text-decoration: none;
  }
  .brand:hover { text-decoration: none; }
  .brand-mark {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    background: var(--kompi-accent);
    color: white;
    border-radius: var(--kompi-radius-sm);
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  }
  .brand-word {
    font-size: var(--kompi-text-md);
    font-weight: 700;
    letter-spacing: -0.015em;
  }
  .tld {
    color: var(--kompi-accent);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--kompi-text-sm);
    font-weight: 500;
    color: var(--kompi-text-2);
    padding: 6px 10px;
    border-radius: var(--kompi-radius-sm);
    transition: background var(--kompi-dur-fast) var(--kompi-ease),
                color var(--kompi-dur-fast) var(--kompi-ease);
  }
  .back:hover {
    background: var(--kompi-bg);
    color: var(--kompi-accent);
    text-decoration: none;
  }

  .container {
    flex: 1;
    padding: var(--kompi-space-10) var(--kompi-gutter) var(--kompi-space-12);
  }
  .inner {
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
  }
  .crumbs {
    display: flex;
    gap: var(--kompi-space-2);
    font-size: var(--kompi-text-sm);
    color: var(--kompi-text-3);
    margin-bottom: var(--kompi-space-6);
    flex-wrap: wrap;
  }
  .crumbs a {
    color: var(--kompi-text-2);
  }

  .hero {
    margin-bottom: var(--kompi-space-6);
  }
  h1 {
    font-size: clamp(28px, 4vw, var(--kompi-text-3xl));
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0 0 var(--kompi-space-3);
    line-height: 1.15;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kompi-space-4);
    color: var(--kompi-text-2);
    font-size: var(--kompi-text-base);
  }
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .meta-item svg {
    color: var(--kompi-text-4);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kompi-space-2);
    margin-bottom: var(--kompi-space-10);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--kompi-space-2);
    padding: 10px 16px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    color: var(--kompi-text);
    font-size: var(--kompi-text-sm);
    font-weight: 500;
    text-decoration: none;
    transition: border-color var(--kompi-dur-fast) var(--kompi-ease),
                background var(--kompi-dur-fast) var(--kompi-ease),
                transform var(--kompi-dur-fast) var(--kompi-ease);
    box-shadow: var(--kompi-shadow-xs);
  }
  .btn:hover {
    border-color: var(--kompi-border-strong);
    color: var(--kompi-text);
    text-decoration: none;
    background: var(--kompi-surface);
    transform: translateY(-1px);
    box-shadow: var(--kompi-shadow-sm);
  }
  .btn-primary {
    background: var(--kompi-accent);
    border-color: var(--kompi-accent);
    color: white;
    box-shadow: 0 1px 2px rgba(18, 74, 46, 0.2), 0 4px 12px rgba(18, 74, 46, 0.15);
  }
  .btn-primary:hover {
    background: var(--kompi-accent-hover);
    border-color: var(--kompi-accent-hover);
    color: white;
    box-shadow: 0 2px 4px rgba(18, 74, 46, 0.2), 0 8px 20px rgba(18, 74, 46, 0.2);
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: var(--kompi-space-6);
  }
  @media (max-width: 720px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .details {
    display: grid;
    gap: var(--kompi-space-4);
    align-content: start;
  }
  .panel {
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    padding: var(--kompi-space-5);
    box-shadow: var(--kompi-shadow-xs);
  }
  .panel-note {
    background: var(--kompi-accent-subtle);
    border-color: var(--kompi-accent-muted);
  }

  h2 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--kompi-text-3);
    margin: 0 0 10px;
  }

  .addr,
  .hours,
  .notes {
    margin: 0;
    color: var(--kompi-text);
    font-size: var(--kompi-text-md);
    line-height: 1.5;
  }
  .postal {
    font-variant-numeric: tabular-nums;
  }
  .hours {
    font-family: var(--kompi-font-mono);
    font-size: var(--kompi-text-base);
    letter-spacing: -0.005em;
  }
  .notes {
    color: var(--kompi-text-2);
    font-size: var(--kompi-text-base);
  }
  .map-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--kompi-space-3);
    font-size: var(--kompi-text-sm);
    font-weight: 500;
  }

  .accepts {
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    padding: var(--kompi-space-5);
    box-shadow: var(--kompi-shadow-xs);
    align-self: start;
  }
  .accepts h2 {
    margin-top: 0;
  }
  .accepts ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--kompi-space-3);
  }
  .accepts li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .accepts .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--chip-color);
    margin-top: 6px;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--chip-color) 15%, transparent);
  }
  .accepts strong {
    display: block;
    color: var(--kompi-text);
    font-size: var(--kompi-text-base);
    font-weight: 600;
    margin-bottom: 1px;
  }
  .accepts span {
    color: var(--kompi-text-3);
    font-size: var(--kompi-text-sm);
    line-height: 1.4;
  }

  .foot {
    margin: var(--kompi-space-12) 0 0;
    padding-top: var(--kompi-space-5);
    border-top: 1px solid var(--kompi-border);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--kompi-space-3);
    font-size: var(--kompi-text-sm);
  }
  .disclaimer,
  .report {
    margin: 0;
    color: var(--kompi-text-3);
  }
</style>
