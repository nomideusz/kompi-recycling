<footer class="site-footer">
  <div class="inner">
    <p class="about">
      recycling.kompi.pl — niekomercyjna mapa punktów zbiórki odpadów
      problematycznych w Polsce. Dane pochodzą m.in. z Google Places oraz
      wykazów gminnych i są aktualizowane automatycznie.
    </p>
    <nav aria-label="Stopka">
      <a href="/">Mapa</a>
      <a href="/poradnik">Poradnik</a>
      <a href="mailto:kontakt@kompi.pl">kontakt@kompi.pl</a>
    </nav>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--kompi-border);
    background: var(--kompi-bg-subtle);
    margin-top: auto;
  }
  .inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 20px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }
  .about {
    margin: 0;
    font-size: 13px;
    color: var(--kompi-text-3);
    max-width: 560px;
    line-height: 1.6;
  }
  nav {
    display: flex;
    gap: 18px;
    font-size: 13px;
  }
  nav a {
    color: var(--kompi-text-2);
    font-weight: 600;
  }
</style>
