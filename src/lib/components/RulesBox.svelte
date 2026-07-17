<script lang="ts">
  import type { WasteItem } from '$lib/items';
  import type { CategoryId } from '$lib/types';

  let { item }: { item: WasteItem } = $props();

  const PSZOK_ONLY: ReadonlySet<CategoryId> = new Set([
    'car_battery',
    'oil',
    'tires',
    'chemicals',
    'meds',
    'bulky',
    'textiles',
  ]);
  const pszokOnly = $derived(item.categories.every((c) => PSZOK_ONLY.has(c)));
</script>

<aside class="rules" aria-label="Zasady oddawania: {item.name}">
  <h2>Jak oddać: {item.name}</h2>
  {#if item.rules}
    <p class="txt">{item.rules}</p>
  {/if}
  {#if pszokOnly}
    <p class="caveat">
      PSZOK-i przyjmują odpady od mieszkańców swojej gminy, a limity mogą się
      różnić — najlepiej zadzwoń przed wizytą.
    </p>
  {/if}
  {#if item.guideSlug}
    <a class="more" href="/poradnik/{item.guideSlug}">Pełny poradnik →</a>
  {/if}
</aside>

<style>
  .rules {
    padding: 14px 16px;
    background: var(--kompi-accent-subtle);
    border: 1px solid var(--kompi-accent-muted);
    border-radius: 12px;
    margin-bottom: 12px;
  }
  h2 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--kompi-accent);
  }
  .txt {
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--kompi-text-2);
  }
  .caveat {
    margin: 0 0 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--kompi-text-3);
  }
  .more {
    font-size: 13px;
    font-weight: 700;
    color: var(--kompi-accent);
  }
</style>
