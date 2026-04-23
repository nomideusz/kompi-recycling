<script lang="ts">
  import type { Anchor } from '$lib/distance';

  let {
    anchor,
    radiusKm = $bindable<number | null>(null),
    onclear,
  }: {
    anchor: Anchor;
    radiusKm?: number | null;
    onclear?: () => void;
  } = $props();

  const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

  let menuOpen = $state(false);
  let rootEl: HTMLDivElement | undefined = $state();

  function pick(km: number) {
    radiusKm = km;
    menuOpen = false;
  }

  function clearRadius() {
    radiusKm = null;
    menuOpen = false;
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function onDocClick(e: MouseEvent) {
    if (!menuOpen) return;
    if (rootEl && !rootEl.contains(e.target as Node)) menuOpen = false;
  }
</script>

<svelte:window onclick={onDocClick} />

<div bind:this={rootEl} class="pill-root">
  <div class="pill" role="group" aria-label="Filtr odległości">
    <span class="pill-icon" aria-hidden="true">
      {#if anchor.source === 'gps'}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      {/if}
    </span>
    <span class="pill-label" title={anchor.label}>{anchor.label}</span>
    <button
      type="button"
      class="pill-radius"
      aria-haspopup="listbox"
      aria-expanded={menuOpen}
      onclick={toggleMenu}
    >
      {radiusKm ? `${radiusKm} km` : 'Cały kraj'}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <button
      type="button"
      class="pill-close"
      aria-label="Wyczyść lokalizację"
      onclick={onclear}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  {#if menuOpen}
    <div class="menu" role="listbox" aria-label="Promień">
      {#each RADIUS_OPTIONS as km (km)}
        <button
          type="button"
          class="menu-item"
          class:on={radiusKm === km}
          role="option"
          aria-selected={radiusKm === km}
          onclick={() => pick(km)}
        >
          {km} km
        </button>
      {/each}
      <button
        type="button"
        class="menu-item"
        class:on={radiusKm === null}
        role="option"
        aria-selected={radiusKm === null}
        onclick={clearRadius}
      >
        Cały kraj
      </button>
    </div>
  {/if}
</div>

<style>
  .pill-root {
    position: relative;
    pointer-events: auto;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 6px 6px 12px;
    background: rgba(24, 24, 27, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    color: var(--kompi-text-2);
    font-size: 12px;
    font-weight: 600;
    max-width: 100%;
  }
  .pill-icon {
    display: inline-flex;
    color: var(--kompi-accent);
  }
  .pill-label {
    flex: 1;
    min-width: 0;
    color: var(--kompi-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }
  .pill-radius {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--kompi-text);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-variant-numeric: tabular-nums;
  }
  .pill-radius:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--kompi-accent);
  }
  .pill-close {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.25);
    border: 0;
    color: var(--kompi-text-3);
    border-radius: 50%;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pill-close:hover {
    background: rgba(185, 53, 33, 0.25);
    color: var(--kompi-danger);
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 140px;
    background: rgba(24, 24, 27, 0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    z-index: 30;
    display: grid;
    gap: 2px;
    animation: menu-in 0.15s ease;
  }
  @keyframes menu-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .menu-item {
    text-align: left;
    padding: 7px 12px;
    background: transparent;
    border: 0;
    color: var(--kompi-text-2);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .menu-item:hover {
    background: rgba(57, 255, 20, 0.08);
    color: var(--kompi-text);
  }
  .menu-item.on {
    background: var(--kompi-accent-subtle);
    color: var(--kompi-accent);
    font-weight: 700;
  }
</style>
