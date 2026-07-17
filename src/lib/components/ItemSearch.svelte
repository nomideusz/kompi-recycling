<script lang="ts">
  import { matchItems, type WasteItem } from '$lib/items';
  import { CATEGORIES_BY_ID } from '$lib/categories';

  let {
    onpick,
    onfreetext,
    placeholder = 'np. akumulator, olej silnikowy, laptop…',
  }: {
    onpick: (item: WasteItem) => void;
    onfreetext?: (query: string) => void;
    placeholder?: string;
  } = $props();

  let query = $state('');
  let open = $state(false);
  let active = $state(-1);
  let inputEl: HTMLInputElement | undefined = $state();

  const results = $derived(matchItems(query, 7));

  function pick(item: WasteItem) {
    onpick(item);
    query = '';
    open = false;
    active = -1;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open = true;
      active = Math.min(active + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && results[active]) pick(results[active]);
      else if (results.length > 0) pick(results[0]);
      else if (query.trim() && onfreetext) {
        onfreetext(query.trim());
        query = '';
        open = false;
      }
    } else if (e.key === 'Escape') {
      open = false;
      active = -1;
    }
  }
</script>

<div class="item-search">
  <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
  <input
    bind:this={inputEl}
    bind:value={query}
    type="text"
    role="combobox"
    aria-expanded={open && results.length > 0}
    aria-controls="item-search-listbox"
    aria-activedescendant={active >= 0 ? `item-opt-${active}` : undefined}
    aria-label="Co chcesz oddać?"
    autocomplete="off"
    {placeholder}
    oninput={() => {
      open = true;
      active = -1;
    }}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    {onkeydown}
  />
  {#if open && results.length > 0}
    <ul class="listbox" id="item-search-listbox" role="listbox">
      {#each results as item, i (item.id)}
        {@const cat = CATEGORIES_BY_ID[item.categories[0]]}
        <li
          id="item-opt-{i}"
          role="option"
          aria-selected={i === active}
          class:active={i === active}
        >
          <button
            type="button"
            onmousedown={(e) => {
              e.preventDefault();
              pick(item);
            }}
            onmouseenter={() => (active = i)}
          >
            <span class="dot" style="background: var({cat.colorVar});" aria-hidden="true"></span>
            <span class="name">{item.name}</span>
            <span class="cat">{cat.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .item-search {
    position: relative;
  }
  .icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--kompi-text-4);
    pointer-events: none;
  }
  input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    font-size: 16px;
    color: var(--kompi-text);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--kompi-border-strong);
    border-radius: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  input:focus {
    border-color: var(--kompi-accent);
    box-shadow: 0 0 0 3px var(--kompi-accent-muted);
  }
  input::placeholder {
    color: var(--kompi-text-4);
  }
  .listbox {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 30;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--kompi-bg-subtle);
    border: 1px solid var(--kompi-border-strong);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    max-height: 320px;
    overflow-y: auto;
  }
  .listbox button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: 0;
    border-radius: 10px;
    color: var(--kompi-text);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  li.active button,
  .listbox button:hover {
    background: var(--kompi-accent-subtle);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .name {
    font-weight: 600;
    flex: 1;
  }
  .cat {
    font-size: 12px;
    color: var(--kompi-text-3);
  }
</style>
