<script lang="ts">
  let {
    page = $bindable(1),
    pageCount,
    total,
    pageSize,
    label = 'Paginacja wyników',
  }: {
    page?: number;
    pageCount: number;
    total: number;
    pageSize: number;
    label?: string;
  } = $props();

  const from = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
  const to = $derived(Math.min(page * pageSize, total));

  // Build a compact window: first, last, current ±1, with ellipses.
  const pages = $derived(buildPages(page, pageCount));

  function buildPages(p: number, n: number): (number | 'ellipsis')[] {
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const result: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, p - 1);
    const end = Math.min(n - 1, p + 1);
    if (start > 2) result.push('ellipsis');
    for (let i = start; i <= end; i++) result.push(i);
    if (end < n - 1) result.push('ellipsis');
    result.push(n);
    return result;
  }

  function goTo(p: number) {
    page = Math.max(1, Math.min(pageCount, p));
  }
</script>

{#if pageCount > 1}
  <nav class="pg" aria-label={label}>
    <span class="pg-info">
      <strong>{from.toLocaleString('pl-PL')}</strong>–<strong>{to.toLocaleString('pl-PL')}</strong>
      <span class="pg-of">z {total.toLocaleString('pl-PL')}</span>
    </span>

    <div class="pg-ctrl">
      <button
        type="button"
        class="pg-btn pg-edge"
        disabled={page <= 1}
        aria-label="Poprzednia strona"
        onclick={() => goTo(page - 1)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <ul class="pg-pages">
        {#each pages as p, i (i)}
          {#if p === 'ellipsis'}
            <li class="pg-ellipsis" aria-hidden="true">…</li>
          {:else}
            <li>
              <button
                type="button"
                class="pg-btn pg-num"
                class:pg-num--active={p === page}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Strona ${p}`}
                onclick={() => goTo(p)}
              >
                {p}
              </button>
            </li>
          {/if}
        {/each}
      </ul>

      <button
        type="button"
        class="pg-btn pg-edge"
        disabled={page >= pageCount}
        aria-label="Następna strona"
        onclick={() => goTo(page + 1)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
  </nav>
{:else if total > 0}
  <p class="pg-single">
    <strong>{total.toLocaleString('pl-PL')}</strong>
    {total === 1 ? 'wynik' : 'wyników'}
  </p>
{/if}

<style>
  .pg {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--kompi-space-3);
    padding: 10px var(--kompi-space-4);
    border-top: 1px solid var(--kompi-border);
    background: var(--kompi-surface);
    font-size: var(--kompi-text-xs);
    color: var(--kompi-text-3);
  }
  .pg-info strong {
    color: var(--kompi-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .pg-of {
    color: var(--kompi-text-3);
    margin-left: 2px;
  }

  .pg-ctrl {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .pg-pages {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2px;
  }
  .pg-btn {
    display: inline-grid;
    place-items: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    background: transparent;
    border: 0;
    border-radius: var(--kompi-radius-sm);
    color: var(--kompi-text-2);
    font-size: var(--kompi-text-xs);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    transition: background var(--kompi-dur-fast) var(--kompi-ease),
                color var(--kompi-dur-fast) var(--kompi-ease);
  }
  .pg-btn:hover:not(:disabled) {
    background: var(--kompi-bg);
    color: var(--kompi-text);
  }
  .pg-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .pg-num--active {
    background: var(--kompi-accent);
    color: white;
  }
  .pg-num--active:hover:not(:disabled) {
    background: var(--kompi-accent-hover);
    color: white;
  }
  .pg-ellipsis {
    color: var(--kompi-text-4);
    padding: 0 2px;
    user-select: none;
  }

  .pg-single {
    margin: 0;
    padding: 10px var(--kompi-space-4);
    border-top: 1px solid var(--kompi-border);
    background: var(--kompi-surface);
    font-size: var(--kompi-text-xs);
    color: var(--kompi-text-3);
  }
  .pg-single strong {
    color: var(--kompi-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    .pg {
      flex-direction: column;
      align-items: stretch;
      gap: var(--kompi-space-2);
    }
    .pg-info {
      text-align: center;
    }
    .pg-ctrl {
      justify-content: center;
    }
  }
</style>
