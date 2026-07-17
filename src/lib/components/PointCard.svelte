<script lang="ts">
    import { CATEGORIES_BY_ID } from "$lib/categories";
    import { TAKEBACKS_BY_ID } from "$lib/takebacks";
    import type { RecyclingPoint } from "$lib/types";

    let {
        point,
        selected = false,
        onhover,
        distanceKm,
    }: {
        point: RecyclingPoint;
        selected?: boolean;
        onhover?: (slug: string | null) => void;
        distanceKm?: number;
    } = $props();

    const distLabel = $derived(
        distanceKm === undefined
            ? null
            : distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m`
              : `${distanceKm.toFixed(1).replace('.', ',')} km`,
    );
</script>

<article
    class="card"
    class:selected
    onmouseenter={() => onhover?.(point.slug)}
    onmouseleave={() => onhover?.(null)}
    onfocusin={() => onhover?.(point.slug)}
    onfocusout={() => onhover?.(null)}
>
    <div class="card-head">
        <h3>
            <a href="/punkt/{point.slug}">{point.name}</a>
        </h3>
        {#if distLabel}
            <span class="dist">{distLabel}</span>
        {/if}
        {#if point.operator}
            <span class="operator">{point.operator}</span>
        {/if}
    </div>

    {#if TAKEBACKS_BY_ID[point.takebackType]}
        {@const tb = TAKEBACKS_BY_ID[point.takebackType]}
        <span
            class="takeback"
            style="--tb-color: var(--kompi-tb-{tb.id});"
            title={tb.description}
        >
            <span class="tb-dot" aria-hidden="true"></span>
            {tb.label}
        </span>
    {/if}

    <p class="addr">
        <svg
            class="i"
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
        <span
            >{point.address}<span class="comma">, </span><span class="postal"
                >{point.postalCode}</span
            >
            {point.city}</span
        >
    </p>

    {#if point.hours}
        <p class="hours">
            <svg
                class="i"
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{point.hours}</span>
        </p>
    {/if}

    {#if point.categories.length > 0}
        <ul class="cats">
            {#each point.categories as id (id)}
                {@const cat = CATEGORIES_BY_ID[id]}
                <li style="--chip-color: var({cat.colorVar});">
                    <span class="dot" aria-hidden="true"></span>
                    {cat.label}
                </li>
            {/each}
        </ul>
    {/if}

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
</article>

<style>
    .card {
        display: block;
        padding: 16px;
        background: rgba(24, 24, 27, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        text-align: left;
        position: relative;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .card:hover,
    .card:focus-visible {
        background: rgba(34, 34, 38, 0.95);
        border-color: rgba(249, 126, 33, 0.2);
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(-2px) scale(1.01);
        outline: none;
        z-index: 1;
    }
    .card.selected {
        background: var(--kompi-surface-raised);
        border-color: var(--kompi-accent);
        box-shadow:
            0 0 0 1px var(--kompi-accent),
            0 4px 20px rgba(249, 126, 33, 0.15);
        transform: scale(1.01);
        z-index: 2;
    }
    .card-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
    }
    .takeback {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 8px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 600;
        color: var(--kompi-text-2);
        background: color-mix(
            in srgb,
            var(--tb-color) 14%,
            rgba(24, 24, 27, 0.4)
        );
        border: 1px solid color-mix(in srgb, var(--tb-color) 35%, transparent);
        border-radius: 6px;
    }
    .tb-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tb-color);
        box-shadow: 0 0 4px var(--tb-color);
    }
    h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.3;
    }
    h3 a {
        color: var(--kompi-text);
        transition: color 0.2s ease;
    }
    h3 a:hover {
        color: var(--kompi-accent);
        text-decoration: none;
    }
    .operator {
        font-size: 11px;
        color: var(--kompi-text-3);
        flex-shrink: 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.06);
        padding: 2px 6px;
        border-radius: 6px;
    }
    .addr,
    .hours {
        margin: 0 0 6px;
        font-size: 13px;
        color: var(--kompi-text-2);
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }
    .addr .i,
    .hours .i {
        color: var(--kompi-text-4);
        flex-shrink: 0;
        margin-top: 2px;
    }
    .postal {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }
    .hours {
        color: var(--kompi-text-3);
        font-family: var(--kompi-font-mono);
        font-size: 12px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-flex;
    }
    .cats {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .cats li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 600;
        color: var(--kompi-text-2);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        letter-spacing: -0.005em;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .card:hover .cats li {
        border-color: rgba(255, 255, 255, 0.14);
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--chip-color);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
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
</style>
