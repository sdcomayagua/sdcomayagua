// SD COMAYAGUA · Mobile Premium V3
// Este módulo solo organiza filtros y textos estáticos.
// No intercepta tarjetas, cotizaciones, ventas, Firebase ni descargas.
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';

  function initMobilePremium() {
    document.documentElement.dataset.mobileUi = 'premium-v3';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = 'Buscar productos';

    const publicLink = document.querySelector('.client-public-link');
    if (publicLink) {
      publicLink.textContent = 'Vista para clientes';
      publicLink.setAttribute('aria-label', 'Abrir vista para clientes');
    }

    const notice = document.querySelector('#productos .client-catalog-notice');
    if (notice) notice.hidden = true;

    const toolbar = document.querySelector('#productos .toolbar');
    if (!toolbar || toolbar.querySelector('#mobileFilterToggle')) return;

    const button = document.createElement('button');
    button.id = 'mobileFilterToggle';
    button.className = 'mobile-filter-toggle';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'categoryFilter quickFilters');
    button.innerHTML = '<span>Filtros y vista</span><span class="mobile-filter-chevron" aria-hidden="true">⌄</span>';

    const searchField = toolbar.querySelector('.search-field');
    if (searchField) searchField.insertAdjacentElement('afterend', button);
    else toolbar.prepend(button);

    if (window.matchMedia(MOBILE_QUERY).matches) {
      toolbar.classList.add('mobile-filters-collapsed');
    }

    button.addEventListener('click', () => {
      const collapsed = toolbar.classList.toggle('mobile-filters-collapsed');
      button.setAttribute('aria-expanded', String(!collapsed));
    });

    window.matchMedia(MOBILE_QUERY).addEventListener?.('change', (event) => {
      if (!event.matches) {
        toolbar.classList.remove('mobile-filters-collapsed');
        button.setAttribute('aria-expanded', 'true');
      } else {
        toolbar.classList.add('mobile-filters-collapsed');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobilePremium, { once: true });
  } else {
    initMobilePremium();
  }
})();
