<script lang="ts">
    import { CATEGORIES } from "$lib/categories";
    import { cityInPhrase } from "$lib/city-locative";
    import { page } from "$app/state";

    let { data } = $props();
    // "we Wrocławiu", "w Krakowie", fallback "w miejscowości X".
    const cityLoc = $derived(cityInPhrase(data.cityName));
    const canonical = $derived(
        `https://recycling.kompi.pl/miasto/${page.params.slug}`,
    );
    const mapHref = $derived(`/?q=${encodeURIComponent(data.cityName)}`);

    const catList = $derived(
        CATEGORIES.filter((c) => (data.catCounts[c.id] ?? 0) > 0).map(
            (c) => ({ ...c, count: data.catCounts[c.id] ?? 0 }),
        ),
    );

    const title = $derived(
        `Punkty zbiórki odpadów ${cityLoc} (${data.total}) — elektroodpady, baterie, oleje`,
    );
    const description = $derived(
        `${data.total} punktów zbiórki ${cityLoc}: ${catList
            .slice(0, 6)
            .map((c) => c.label.toLowerCase())
            .join(", ")}. Adresy, godziny otwarcia i mapa.`,
    );

    const jsonLd = $derived([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Mapa punktów zbiórki",
                    item: "https://recycling.kompi.pl/",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: data.cityName,
                    item: canonical,
                },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Punkty zbiórki odpadów ${cityLoc}`,
            numberOfItems: data.total,
            itemListElement: data.points.slice(0, 50).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `https://recycling.kompi.pl/punkt/${p.slug}`,
                name: p.name,
            })),
        },
    ]);
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<div class="wrap">
    <nav class="crumbs" aria-label="Ścieżka nawigacji">
        <a href="/">Mapa</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{data.cityName}</span>
    </nav>

    <p class="kicker">Katalog kompi.pl · recykling</p>
    <h1>Punkty zbiórki {cityLoc}</h1>
    <p class="sub">
        <strong>{data.total.toLocaleString("pl-PL")}</strong>
        {data.total === 1
            ? "punkt zbiórki"
            : data.total % 10 >= 2 &&
                data.total % 10 <= 4 &&
                (data.total % 100 < 12 || data.total % 100 > 14)
              ? "punkty zbiórki"
              : "punktów zbiórki"} odpadów problematycznych — elektroodpady,
        baterie, oleje, opony, leki i więcej.
    </p>

    <a class="map-cta" href={mapHref}>Pokaż na mapie →</a>

    {#if catList.length > 0}
        <ul class="cats" aria-label="Przyjmowane rodzaje odpadów">
            {#each catList as c (c.id)}
                <li style="--chip-color: var({c.colorVar});">
                    <span class="dot" aria-hidden="true"></span>
                    {c.label}
                    <span class="count">{c.count}</span>
                </li>
            {/each}
        </ul>
    {/if}

    <h2>Wszystkie punkty</h2>
    <ul class="points">
        {#each data.points as p (p.slug)}
            <li>
                <a href="/punkt/{p.slug}">
                    <span class="p-name">{p.name}</span>
                    <span class="p-addr"
                        >{p.address}{p.address ? ", " : ""}{p.postalCode}
                        {data.cityName}</span
                    >
                </a>
            </li>
        {/each}
    </ul>
    {#if data.truncated}
        <p class="more">
            Wyświetlono {data.points.length} z {data.total.toLocaleString(
                "pl-PL",
            )} punktów.
            <a href={mapHref}>Zobacz wszystkie na mapie →</a>
        </p>
    {/if}
</div>

<style>
    .wrap {
        max-width: 900px;
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
    .kicker {
        margin: 0 0 14px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--kompi-accent-text);
        font-weight: 600;
    }
    h1 {
        font-size: clamp(28px, 4.5vw, 40px);
        margin: 0 0 10px;
        letter-spacing: -0.025em;
        line-height: 1.12;
    }
    .sub {
        color: var(--kompi-text-3);
        font-size: 15px;
        max-width: 620px;
        margin: 0 0 20px;
        line-height: 1.6;
    }
    .sub strong {
        color: var(--kompi-text);
        font-variant-numeric: tabular-nums;
    }
    .map-cta {
        display: inline-block;
        padding: 12px 22px;
        background: var(--kompi-accent);
        color: #fff;
        font-weight: 600;
        border-radius: 12px;
        margin-bottom: 28px;
        box-shadow:
            0 1px 2px rgba(234, 106, 18, 0.2),
            0 4px 12px rgba(234, 106, 18, 0.15);
    }
    .map-cta:hover {
        background: var(--kompi-accent-hover);
        color: #fff;
        text-decoration: none;
    }
    .cats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        list-style: none;
        margin: 0 0 32px;
        padding: 0;
    }
    .cats li {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        font-size: 12.5px;
        font-weight: 500;
        color: var(--kompi-text-2);
        background: var(--kompi-surface);
        border: 1px solid var(--kompi-border);
        border-radius: 20px;
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--chip-color);
        flex-shrink: 0;
    }
    .count {
        font-size: 11px;
        color: var(--kompi-accent-text);
        font-variant-numeric: tabular-nums;
    }
    h2 {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--kompi-accent-text);
        margin: 0 0 12px;
    }
    .points {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 10px;
    }
    .points a {
        display: block;
        height: 100%;
        padding: 12px 16px;
        background: var(--kompi-surface);
        border: 1px solid var(--kompi-border);
        border-radius: 12px;
        color: var(--kompi-text);
        text-decoration: none;
        transition:
            border-color var(--kompi-dur-fast) var(--kompi-ease),
            box-shadow var(--kompi-dur-fast) var(--kompi-ease);
    }
    .points a:hover {
        border-color: var(--kompi-accent);
        box-shadow: var(--kompi-shadow-sm);
    }
    .p-name {
        display: block;
        font-weight: 600;
        font-size: 14px;
        line-height: 1.3;
        margin-bottom: 2px;
    }
    .p-addr {
        display: block;
        font-size: 12.5px;
        color: var(--kompi-text-3);
        line-height: 1.4;
    }
    .more {
        margin: 20px 0 0;
        font-size: 13px;
        color: var(--kompi-text-3);
    }
</style>
