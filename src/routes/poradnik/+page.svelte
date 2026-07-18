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
        background: var(--kompi-surface);
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
