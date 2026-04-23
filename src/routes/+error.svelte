<script lang="ts">
  import { page } from '$app/state';
  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? 'Coś poszło nie tak.');
</script>

<svelte:head>
  <title>{status === 404 ? 'Nie znaleziono' : 'Błąd'} — recycling.kompi.pl</title>
</svelte:head>

<div class="wrap">
  <div class="card">
    <div class="code" aria-hidden="true">{status}</div>
    <h1>
      {#if status === 404}
        Strona nie została znaleziona
      {:else}
        Coś poszło nie tak
      {/if}
    </h1>
    <p class="msg">{message}</p>
    <a class="btn" href="/">← Wróć do mapy</a>
  </div>
</div>

<style>
  .wrap {
    flex: 1;
    display: grid;
    place-items: center;
    padding: var(--kompi-space-8) var(--kompi-gutter);
  }
  .card {
    width: 100%;
    max-width: 480px;
    background: var(--kompi-surface);
    border: 1px solid var(--kompi-border);
    border-radius: var(--kompi-radius-lg);
    padding: var(--kompi-space-8);
    text-align: center;
    box-shadow: var(--kompi-shadow);
  }
  .code {
    font-family: var(--kompi-font-mono);
    font-size: 64px;
    font-weight: 700;
    color: var(--kompi-accent);
    letter-spacing: -0.03em;
    margin-bottom: var(--kompi-space-2);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  h1 {
    font-size: var(--kompi-text-xl);
    font-weight: 600;
    letter-spacing: -0.015em;
    margin: 0 0 var(--kompi-space-3);
  }
  .msg {
    color: var(--kompi-text-2);
    margin: 0 0 var(--kompi-space-6);
    font-size: var(--kompi-text-base);
  }
  .btn {
    display: inline-block;
    padding: 10px 18px;
    background: var(--kompi-accent);
    color: white;
    border-radius: var(--kompi-radius);
    font-weight: 500;
  }
  .btn:hover {
    background: var(--kompi-accent-hover);
    color: white;
    text-decoration: none;
  }
</style>
