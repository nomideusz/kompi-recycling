<script lang="ts">
  import { CATEGORIES } from '$lib/categories';
  import type { CategoryId } from '$lib/types';

  let {
    selected = $bindable<Set<CategoryId>>(new Set()),
  }: {
    selected?: Set<CategoryId>;
  } = $props();

  function toggle(id: CategoryId) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  }
</script>

<div class="filters" role="group" aria-label="Filtruj po kategorii odpadów">
  {#each CATEGORIES as cat (cat.id)}
    {@const isOn = selected.has(cat.id)}
    <button
      type="button"
      class="chip"
      class:on={isOn}
      aria-pressed={isOn}
      style="--chip-color: var({cat.colorVar});"
      onclick={() => toggle(cat.id)}
    >
      <span class="dot" aria-hidden="true"></span>
      <span class="label">{cat.label}</span>
      {#if isOn}
        <svg class="check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      {/if}
    </button>
  {/each}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kompi-space-2);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius-pill);
    color: var(--kompi-text-2);
    font-size: var(--kompi-text-sm);
    font-weight: 500;
    letter-spacing: -0.005em;
    transition: all var(--kompi-dur-fast) var(--kompi-ease);
  }
  .chip:hover {
    border-color: var(--chip-color);
    color: var(--kompi-text);
    background: var(--kompi-surface);
  }
  .chip.on {
    background: var(--chip-color);
    border-color: var(--chip-color);
    color: white;
    padding-right: 10px;
    box-shadow: var(--kompi-shadow-sm);
  }
  .chip.on .dot {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-color);
    transition: background var(--kompi-dur-fast) var(--kompi-ease);
  }
  .check {
    color: white;
  }
  .label {
    line-height: 1;
  }
</style>
