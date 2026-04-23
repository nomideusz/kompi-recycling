<script lang="ts">
  import type { RecyclingPoint } from '$lib/types';
  import PointCard from './PointCard.svelte';

  let {
    points,
    selectedSlug = null,
    onhover,
  }: {
    points: RecyclingPoint[];
    selectedSlug?: string | null;
    onhover?: (slug: string | null) => void;
  } = $props();

  let listEl: HTMLUListElement | undefined = $state();

  $effect(() => {
    if (!selectedSlug || !listEl) return;
    const target = listEl.querySelector<HTMLLIElement>(
      `li[data-slug="${selectedSlug}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
</script>

{#if points.length === 0}
  <p class="empty">Brak punktów pasujących do wybranych filtrów.</p>
{:else}
  <ul class="list" bind:this={listEl}>
    {#each points as p (p.slug)}
      <li data-slug={p.slug}>
        <PointCard
          point={p}
          selected={p.slug === selectedSlug}
          {onhover}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .list {
    display: grid;
    gap: var(--kompi-space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .empty {
    padding: var(--kompi-space-6);
    text-align: center;
    color: var(--kompi-text-3);
    background: var(--kompi-surface);
    border: 1px dashed var(--kompi-border);
    border-radius: var(--kompi-radius);
  }
</style>
