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
