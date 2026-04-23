<script lang="ts">
  import type { Snippet } from 'svelte';

  export type SearchBoxItem = {
    key: string;
    icon: 'pin' | 'operator' | 'postal' | 'category' | 'city';
    text: string;
    meta?: string;
    group?: string;
  };

  let {
    query = $bindable(''),
    results = [] as SearchBoxItem[],
    loading = false,
    placeholder = 'Szukaj po mieście, ulicy, operatorze…',
    ariaLabel = 'Szukaj punktów zbiórki',
    onselect,
    oninput,
    onkeydown: onkeydownProp,
    onfocus: onfocusProp,
    onblur: onblurProp,
    trailing,
  }: {
    query?: string;
    results?: SearchBoxItem[];
    loading?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    onselect?: (item: SearchBoxItem, index: number) => void;
    oninput?: (e: Event) => void;
    onkeydown?: (e: KeyboardEvent) => void;
    onfocus?: () => void;
    onblur?: () => void;
    trailing?: Snippet;
  } = $props();

  let inputEl: HTMLInputElement | undefined = $state();
  let showDropdown = $state(false);
  let activeIndex = $state(-1);

  const isOpen = $derived(showDropdown && results.length > 0);

  function handleInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    activeIndex = -1;
    showDropdown = query.trim().length > 0;
    oninput?.(e);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) activeIndex = Math.min(activeIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < results.length) {
        onselect?.(results[activeIndex], activeIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      showDropdown = false;
    }
    onkeydownProp?.(e);
  }

  function handleFocus() {
    if (results.length > 0 && query.trim().length > 0) showDropdown = true;
    onfocusProp?.();
  }

  function handleBlur() {
    setTimeout(() => { showDropdown = false; }, 200);
    onblurProp?.();
  }

  function clearQuery() {
    query = '';
    showDropdown = false;
    inputEl?.focus();
  }

  $effect(() => {
    if (results.length > 0 && inputEl === document.activeElement && query.trim().length > 0) {
      showDropdown = true;
    }
  });

  $effect(() => {
    results;
    activeIndex = -1;
  });

  const ICONS = {
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
    operator: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01"/><path d="M9 13h.01"/><path d="M9 17h.01"/><path d="M15 9h.01"/><path d="M15 13h.01"/><path d="M15 17h.01"/>',
    postal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    category: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/>',
    city: '<path d="M3 21V9l6-4v16"/><path d="M9 21V5l6 4v12"/><path d="M15 21V9l6 4v8"/><path d="M3 21h18"/>',
  } as const;

  export function focus() { inputEl?.focus(); }
  export function close() { showDropdown = false; }
  export function open() { if (results.length > 0) showDropdown = true; }
</script>

<div class="sb" class:sb-open={isOpen}>
  <div class="sb-icon-wrap">
    {#if loading}
      <svg class="sb-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    {/if}
  </div>

  <input
    bind:this={inputEl}
    value={query}
    oninput={handleInput}
    onkeydown={handleKeydown}
    onfocus={handleFocus}
    onblur={handleBlur}
    class="sb-input"
    type="search"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={ariaLabel}
    aria-autocomplete="list"
    {placeholder}
  />

  {#if query}
    <button type="button" class="sb-clear" onclick={clearQuery} aria-label="Wyczyść">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  {/if}

  {#if trailing}
    <span class="sb-sep" aria-hidden="true"></span>
    {@render trailing()}
  {/if}

  {#if isOpen}
    <div class="sb-dropdown" role="listbox">
      {#each results as item, i (item.key)}
        {@const showGroup = item.group && (i === 0 || results[i - 1].group !== item.group)}
        {#if showGroup}
          <div class="sb-group">{item.group}</div>
        {/if}
        <button
          type="button"
          class="sb-item"
          class:sb-item--active={i === activeIndex}
          role="option"
          aria-selected={i === activeIndex}
          onmousedown={(e) => { e.preventDefault(); onselect?.(item, i); }}
        >
          <span class="sb-item-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              {@html ICONS[item.icon]}
            </svg>
          </span>
          <span class="sb-item-text">{item.text}</span>
          {#if item.meta}
            <span class="sb-item-meta">{item.meta}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sb-root {
    position: relative;
    width: 100%;
  }

  .sb {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px 16px;
    background: transparent;
    border-radius: 16px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .sb-icon {
    display: flex;
    color: var(--kompi-text-3);
    flex-shrink: 0;
    transition: color 0.2s ease;
  }
  .sb:focus-within .sb-icon {
    color: var(--kompi-accent);
  }
  .sb-spin {
    animation: sb-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes sb-spin { to { transform: rotate(360deg); } }

  .sb-input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    padding: 14px 0;
    font: inherit;
    font-size: 16px;
    font-weight: 500;
    color: var(--kompi-text);
    min-width: 0;
    letter-spacing: -0.01em;
  }
  .sb-input::placeholder {
    color: var(--kompi-text-4);
    font-weight: 400;
  }
  .sb-input::-webkit-search-cancel-button { display: none; }

  .sb-clear {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    background: rgba(0,0,0,0.03);
    border: 0;
    color: var(--kompi-text-3);
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 0.2s var(--kompi-ease);
  }
  .sb-clear:hover {
    color: var(--kompi-danger);
    background: rgba(185, 53, 33, 0.1);
    transform: rotate(90deg);
  }

  .sb-sep {
    width: 1px;
    height: 24px;
    background: rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  .sb-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04);
    z-index: 50;
    max-height: 50vh;
    overflow-y: auto;
    padding: 8px 0;
    animation: sb-drop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes sb-drop {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sb-group {
    font-family: var(--kompi-font-sans);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--kompi-text-4);
    font-weight: 700;
    padding: 12px 20px 6px;
  }

  .sb-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 20px;
    background: transparent;
    border: 0;
    text-align: left;
    font: inherit;
    font-size: 15px;
    color: var(--kompi-text);
    cursor: pointer;
    transition: all 0.2s var(--kompi-ease);
  }
  .sb-item:hover,
  .sb-item--active {
    background: rgba(31, 122, 79, 0.05);
    color: var(--kompi-accent-strong);
  }
  .sb-item--active {
    background: rgba(31, 122, 79, 0.1);
    font-weight: 600;
  }

  .sb-item-icon {
    flex-shrink: 0;
    color: var(--kompi-text-3);
    display: flex;
    transition: color 0.2s ease;
  }
  .sb-item:hover .sb-item-icon,
  .sb-item--active .sb-item-icon {
    color: var(--kompi-accent);
  }
  .sb-item-text {
    flex: 1;
    color: inherit;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .sb-item-meta {
    flex-shrink: 0;
    font-family: var(--kompi-font-sans);
    font-size: 12px;
    color: var(--kompi-text-3);
    letter-spacing: 0.02em;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    background: rgba(0,0,0,0.04);
    padding: 2px 8px;
    border-radius: 12px;
  }
</style>
