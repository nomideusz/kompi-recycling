<script lang="ts">
  import { CATEGORIES_BY_ID } from '$lib/categories';
  import type { RecyclingPoint } from '$lib/types';

  let {
    point,
    selected = false,
    onhover,
  }: {
    point: RecyclingPoint;
    selected?: boolean;
    onhover?: (slug: string | null) => void;
  } = $props();
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
    {#if point.operator}
      <span class="operator">{point.operator}</span>
    {/if}
  </div>

  <p class="addr">
    <svg class="i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
    <span>{point.address}<span class="comma">, </span><span class="postal">{point.postalCode}</span> {point.city}</span>
  </p>

  {#if point.hours}
    <p class="hours">
      <svg class="i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
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
</article>

<style>
  .card {
    display: block;
    padding: var(--kompi-space-4);
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius);
    transition: border-color var(--kompi-dur-fast) var(--kompi-ease),
                box-shadow var(--kompi-dur-fast) var(--kompi-ease),
                transform var(--kompi-dur-fast) var(--kompi-ease);
    cursor: pointer;
    text-align: left;
    position: relative;
  }
  .card:hover,
  .card:focus-visible {
    border-color: var(--kompi-border-strong);
    box-shadow: var(--kompi-shadow-sm);
    outline: none;
  }
  .card.selected {
    border-color: var(--kompi-accent);
    box-shadow:
      0 0 0 1px var(--kompi-accent),
      0 2px 8px rgba(31, 122, 79, 0.12);
  }
  .card.selected::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 3px;
    background: var(--kompi-accent);
    border-radius: 0 2px 2px 0;
  }
  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--kompi-space-3);
    margin-bottom: var(--kompi-space-2);
  }
  h3 {
    margin: 0;
    font-size: var(--kompi-text-md);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  h3 a {
    color: var(--kompi-text);
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
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .addr,
  .hours {
    margin: 0 0 6px;
    font-size: var(--kompi-text-sm);
    color: var(--kompi-text-2);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .addr .i,
  .hours .i {
    color: var(--kompi-text-4);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .postal {
    font-variant-numeric: tabular-nums;
  }
  .hours {
    color: var(--kompi-text-3);
    font-family: var(--kompi-font-mono);
    font-size: var(--kompi-text-xs);
    margin-bottom: var(--kompi-space-3);
  }
  .cats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cats li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 500;
    color: var(--kompi-text-2);
    background: var(--kompi-bg);
    border-radius: var(--kompi-radius-pill);
    letter-spacing: -0.005em;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--chip-color);
  }
</style>
