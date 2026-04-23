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
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 999px;
    color: var(--kompi-text-2);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--chip-color);
    color: var(--kompi-text);
    background: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  .chip.on {
    background: var(--chip-color);
    border-color: var(--chip-color);
    color: white;
    padding-right: 14px;
    box-shadow: 0 4px 16px var(--chip-color);
    transform: translateY(-1px);
  }
  .chip.on:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px var(--chip-color);
  }
  .chip.on .dot {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--chip-color);
    transition: all 0.2s var(--kompi-ease);
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .check {
    color: white;
    animation: check-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes check-in {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
  .label {
    line-height: 1;
  }
</style>
