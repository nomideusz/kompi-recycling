<script lang="ts">
  import { POPULAR_ITEMS, type WasteItem } from '$lib/items';
  import { CATEGORIES_BY_ID } from '$lib/categories';

  let { onpick }: { onpick: (item: WasteItem) => void } = $props();
</script>

<div class="tiles" role="group" aria-label="Popularne rzeczy do oddania">
  {#each POPULAR_ITEMS as item (item.id)}
    {@const cat = CATEGORIES_BY_ID[item.categories[0]]}
    <button
      type="button"
      class="tile"
      style="--tile-color: var({cat.colorVar});"
      onclick={() => onpick(item)}
    >
      <span class="name">{item.name}</span>
      <span class="cat">{cat.label}</span>
    </button>
  {/each}
</div>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--kompi-border);
    border-left: 3px solid var(--tile-color);
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s var(--kompi-ease);
  }
  .tile:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--tile-color);
    transform: translateY(-2px);
  }
  .name {
    font-size: 14px;
    font-weight: 700;
    color: var(--kompi-text);
    line-height: 1.25;
  }
  .cat {
    font-size: 11px;
    color: var(--kompi-text-3);
  }
</style>
