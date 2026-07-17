<script lang="ts">
  import '../app.css';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';

  let { children } = $props();
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
