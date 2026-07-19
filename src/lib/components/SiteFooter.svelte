<footer class="site-footer">
  <div class="inner">
    <div class="col about-col">
      <p class="brand-line">recycling<span class="dot">.</span>kompi.pl</p>
      <p class="about">
        Niekomercyjna mapa punktów zbiórki odpadów problematycznych w Polsce.
        Dane pochodzą m.in. z Google Places oraz wykazów gminnych i są
        aktualizowane automatycznie.
      </p>
    </div>
    <nav class="col" aria-label="Stopka — nawigacja">
      <p class="col-label">Serwis</p>
      <a href="/">Mapa punktów</a>
      <a href="/poradnik">Poradnik recyklingu</a>
    </nav>
    <nav class="col" aria-label="Stopka — kompi.pl">
      <p class="col-label">kompi.pl</p>
      <a href="https://kompi.pl" rel="noopener">Sklep kompi.pl</a>
      <a href="mailto:kontakt@kompi.pl">kontakt@kompi.pl</a>
    </nav>
  </div>
  <div class="legal">
    <p>Katalog recyklingu — część rodziny kompi.pl</p>
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
    padding: 32px 20px 24px;
    display: flex;
    justify-content: space-between;
    gap: 32px;
    flex-wrap: wrap;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .about-col {
    max-width: 420px;
  }
  .brand-line {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--kompi-text);
    letter-spacing: -0.01em;
  }
  .brand-line .dot {
    color: var(--kompi-accent);
  }
  .about {
    margin: 0;
    font-size: 13px;
    color: var(--kompi-text-3);
    line-height: 1.6;
  }
  .col-label {
    margin: 0 0 2px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--kompi-accent);
    font-weight: 600;
  }
  .col a {
    font-size: 13px;
    color: var(--kompi-text-2);
    font-weight: 500;
  }
  .col a:hover {
    color: var(--kompi-accent);
  }
  .legal {
    border-top: 1px solid var(--kompi-border);
  }
  .legal p {
    max-width: 1100px;
    margin: 0 auto;
    padding: 12px 20px;
    font-size: 12px;
    color: var(--kompi-text-4);
  }
</style>
