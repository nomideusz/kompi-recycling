<script lang="ts">
  import { TAKEBACKS } from '$lib/takebacks';
  import type { TakebackType } from '$lib/types';

  let {
    selected = $bindable<Set<TakebackType>>(new Set()),
  }: {
    selected?: Set<TakebackType>;
  } = $props();

  function toggle(id: TakebackType) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  }
</script>

<div class="filters" role="group" aria-label="Filtruj po sposobie zwrotu">
  {#each TAKEBACKS as tb (tb.id)}
    {@const isOn = selected.has(tb.id)}
    <button
      type="button"
      class="chip"
      class:on={isOn}
      aria-pressed={isOn}
      title={tb.description}
      style="--tb-color: var(--kompi-tb-{tb.id});"
      onclick={() => toggle(tb.id)}
    >
      <span class="dot" aria-hidden="true"></span>
      <span class="label">{tb.label}</span>
    </button>
  {/each}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: var(--kompi-glass, var(--kompi-surface));
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--kompi-border);
    border-radius: 6px;
    color: var(--kompi-text-3);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--tb-color);
    color: var(--kompi-text-2);
    background: var(--kompi-surface);
  }
  .chip.on {
    background: color-mix(in srgb, var(--tb-color) 12%, var(--kompi-surface));
    border-color: var(--tb-color);
    color: var(--kompi-text);
    box-shadow: inset 0 0 0 1px var(--tb-color);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tb-color);
  }
  .label {
    line-height: 1;
  }
</style>
