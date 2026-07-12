// SD COMAYAGUA · Mobile Premium V3
// Organiza filtros y carga las mejoras comerciales independientes.
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const FEATURE_VERSION = '20260712-gallery-commerce-v1';

  if (!document.querySelector('link[data-sd-product-gallery-commerce]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `assets/css/product-gallery-commerce-v1.css?v=${FEATURE_VERSION}`;
    style.setAttribute('data-sd-product-gallery-commerce', 'true');
    document.head.appendChild(style);
  }

  if (!document.querySelector('script[data-sd-product-gallery-commerce]')) {
    const script = document.createElement('script');
    script.src = `assets/js/product-gallery-commerce-v1.js?v=${FEATURE_VERSION}`;
    script.async = false;
    script.setAttribute('data-sd-product-gallery-commerce', 'true');
    document.head.appendChild(script);
  }

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
