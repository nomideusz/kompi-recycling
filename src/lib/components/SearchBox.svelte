<script lang="ts">
  import type { Snippet } from 'svelte';

  export type SearchBoxItem = {
    key: string;
    icon: 'pin' | 'operator' | 'postal' | 'category' | 'city' | 'item';
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
    onsubmit,
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
    /** Enter pressed without an arrow-key selection — resolve the raw query. */
    onsubmit?: (query: string) => void;
    oninput?: (e: Event) => void;
    onkeydown?: (e: KeyboardEvent) => void;
    onfocus?: () => void;
    onblur?: () => void;
    trailing?: Snippet;
  } = $props();

  const uid = $props.id();

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
      } else if (query.trim()) {
        onsubmit?.(query.trim());
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
    item: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
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
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={isOpen}
    aria-controls="{uid}-listbox"
    aria-activedescendant={activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined}
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
    <div class="sb-dropdown" role="listbox" id="{uid}-listbox">
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
          id="{uid}-opt-{i}"
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
  /* Yoga-style pill: self-contained white capsule that opens into a
     connected dropdown (capsule top + squared seam + rounded bottom). */
  .sb {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 20px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: 64px;
    box-shadow: var(--kompi-shadow-sm);
    transition:
      border-color 0.2s ease,
      border-radius 0.2s ease,
      box-shadow 0.2s ease;
  }
  .sb:focus-within {
    border-color: var(--kompi-accent);
    box-shadow: 0 12px 40px var(--kompi-accent-subtle), var(--kompi-shadow-md);
  }
  .sb.sb-open {
    border-radius: 22px 22px 0 0;
    border-bottom-color: var(--kompi-border);
  }

  .sb-icon-wrap {
    display: flex;
    color: var(--kompi-text-4);
    flex-shrink: 0;
    transition: color 0.2s ease;
  }
  .sb:focus-within .sb-icon-wrap {
    color: var(--kompi-accent-text);
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
    padding: 12px 0;
    font: inherit;
    font-size: 16px;
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
    width: 30px;
    height: 30px;
    background: var(--kompi-bg-subtle);
    border: 0;
    color: var(--kompi-text-3);
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 0.2s var(--kompi-ease);
  }
  .sb-clear:hover {
    color: var(--kompi-danger);
    background: rgba(220, 38, 38, 0.08);
  }

  .sb-sep {
    width: 1px;
    height: 24px;
    background: var(--kompi-border);
    flex-shrink: 0;
  }

  .sb-dropdown {
    position: absolute;
    top: 100%;
    left: -1px;
    right: -1px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-accent);
    border-top: 1px solid var(--kompi-border);
    border-radius: 0 0 22px 22px;
    box-shadow: var(--kompi-shadow-lg);
    z-index: 50;
    max-height: 50vh;
    overflow-y: auto;
    padding: 4px 0 8px;
  }

  .sb-group {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--kompi-text-4);
    font-weight: 600;
    padding: 12px 22px 5px;
  }

  .sb-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 9px 22px;
    background: transparent;
    border: 0;
    text-align: left;
    font: inherit;
    font-size: 15px;
    color: var(--kompi-text);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .sb-item:hover,
  .sb-item--active {
    background: var(--kompi-bg-subtle);
  }

  .sb-item-icon {
    flex-shrink: 0;
    color: var(--kompi-text-4);
    display: flex;
    transition: color 0.2s ease;
  }
  .sb-item:hover .sb-item-icon,
  .sb-item--active .sb-item-icon {
    color: var(--kompi-accent-text);
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
    font-size: 12px;
    color: var(--kompi-text-3);
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 720px) {
    .sb {
      border-radius: 40px;
      padding: 2px 16px;
    }
    .sb.sb-open {
      border-radius: 18px 18px 0 0;
    }
    .sb-dropdown {
      border-radius: 0 0 18px 18px;
    }
    /* Comfortable thumb targets on touch. */
    .sb-clear {
      width: 36px;
      height: 36px;
    }
    .sb-item {
      padding: 12px 20px;
    }
  }
</style>
