<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';

  let { children } = $props();

  // Soft cross-fade between pages (yoga pattern); browsers without the
  // View Transitions API just navigate normally.
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<a href="#main" class="sr-only sr-only-focusable">Przejdź do treści</a>

<SiteHeader />

<main id="main">
  {@render children()}
</main>

<SiteFooter />

<style>
  main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    flex: 1;
  }
</style>
