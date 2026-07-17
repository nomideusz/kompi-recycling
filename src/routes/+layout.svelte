<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';

  let { children } = $props();

  // Home page is an absolute-positioned map app; inner pages are scrollable.
  const isMapPage = $derived(page.url.pathname === '/');
</script>

<a href="#main" class="sr-only sr-only-focusable">Przejdź do treści</a>

<SiteHeader />

<main id="main" class:map={isMapPage}>
  {@render children()}
</main>

<SiteFooter />

<style>
  main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
  }
  main.map {
    position: fixed;
    inset: 0;
    overflow: hidden;
    min-height: 0;
  }
</style>
