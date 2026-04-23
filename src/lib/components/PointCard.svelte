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
    padding: 16px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    text-align: left;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
  .card:hover,
  .card:focus-visible {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(31, 122, 79, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px) scale(1.01);
    outline: none;
    z-index: 1;
  }
  .card.selected {
    background: #ffffff;
    border-color: var(--kompi-accent);
    box-shadow:
      0 0 0 1px var(--kompi-accent),
      0 8px 32px rgba(31, 122, 79, 0.15);
    transform: scale(1.02);
    z-index: 2;
  }
  .card.selected::before {
    content: '';
    position: absolute;
    left: 0;
    top: 16px;
    bottom: 16px;
    width: 4px;
    background: linear-gradient(to bottom, var(--kompi-accent-hover), var(--kompi-accent));
    border-radius: 0 4px 4px 0;
  }
  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
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
    background: rgba(0,0,0,0.03);
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
    background: rgba(0,0,0,0.02);
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
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(0,0,0,0.05);
    border-radius: 20px;
    letter-spacing: -0.005em;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .card:hover .cats li {
    border-color: rgba(0,0,0,0.08);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-color);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
</style>
