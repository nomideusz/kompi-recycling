<script lang="ts">
  import { page } from '$app/state';
  import KompiLogo from '$lib/images/logo/logo-kompi-white.png';

  const path = $derived(page.url.pathname);
</script>

<header class="site-header">
  <div class="inner">
    <a class="brand" href="/">
      <img src={KompiLogo} alt="Kompi" width="100" height="30" />
      <span class="tag">recycling</span>
    </a>
    <nav aria-label="Nawigacja główna">
      <a href="/" aria-current={path === '/' ? 'page' : undefined}>Mapa</a>
      <a
        href="/poradnik"
        aria-current={path.startsWith('/poradnik') ? 'page' : undefined}
        >Poradnik</a
      >
    </nav>
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--kompi-border);
    background: var(--kompi-bg);
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .brand img {
    display: block;
    height: 26px;
    width: auto;
  }
  .tag {
    font-size: 14px;
    font-weight: 600;
    color: var(--kompi-text-2);
    border-left: 1px solid var(--kompi-border-strong);
    padding-left: 10px;
  }
  nav {
    display: flex;
    gap: 4px;
  }
  nav a {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--kompi-text-2);
    text-decoration: none;
  }
  nav a:hover {
    color: var(--kompi-text);
    background: rgba(255, 255, 255, 0.06);
    text-decoration: none;
  }
  nav a[aria-current='page'] {
    color: var(--kompi-accent);
    background: var(--kompi-accent-subtle);
  }
</style>
