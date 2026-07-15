// SD COMAYAGUA · Mobile Premium V3
// Organiza filtros y carga las mejoras comerciales independientes.
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const FEATURE_VERSION = '20260715-requested-fixes-v2';

  if (!document.querySelector('link[data-sd-product-gallery-commerce]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `assets/css/product-gallery-commerce-v1.css?v=${FEATURE_VERSION}`;
    style.setAttribute('data-sd-product-gallery-commerce', 'true');
    document.head.appendChild(style);
  }

  if (!document.querySelector('link[data-sd-product-gallery-commerce-final]')) {
    const finalStyle = document.createElement('link');
    finalStyle.rel = 'stylesheet';
    finalStyle.href = `assets/css/product-gallery-commerce-final.css?v=${FEATURE_VERSION}`;
    finalStyle.setAttribute('data-sd-product-gallery-commerce-final', 'true');
    document.head.appendChild(finalStyle);
  }

  if (!document.querySelector('link[data-sd-commerce-corrections-v5]')) {
    const correctionStyle = document.createElement('link');
    correctionStyle.rel = 'stylesheet';
    correctionStyle.href = `assets/css/commerce-corrections-v3.css?v=${FEATURE_VERSION}`;
    correctionStyle.setAttribute('data-sd-commerce-corrections-v5', 'true');
    document.head.appendChild(correctionStyle);
  }

  if (!document.querySelector('link[data-sd-commerce-price-shipping-v5]')) {
    const priceShippingStyle = document.createElement('link');
    priceShippingStyle.rel = 'stylesheet';
    priceShippingStyle.href = `assets/css/commerce-price-shipping-hotfix-v5.css?v=${FEATURE_VERSION}`;
    priceShippingStyle.setAttribute('data-sd-commerce-price-shipping-v5', 'true');
    document.head.appendChild(priceShippingStyle);
  }

  if (!document.querySelector('link[data-sd-commerce-discount-savings-v6]')) {
    const discountStyle = document.createElement('link');
    discountStyle.rel = 'stylesheet';
    discountStyle.href = `assets/css/commerce-discount-savings-v6.css?v=${FEATURE_VERSION}`;
    discountStyle.setAttribute('data-sd-commerce-discount-savings-v6', 'true');
    document.head.appendChild(discountStyle);
  }

  if (!document.querySelector('script[data-sd-product-gallery-commerce]')) {
    const script = document.createElement('script');
    script.src = `assets/js/product-gallery-commerce-v1.js?v=${FEATURE_VERSION}`;
    script.async = false;
    script.setAttribute('data-sd-product-gallery-commerce', 'true');
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-sd-commerce-corrections-v5]')) {
    const correctionScript = document.createElement('script');
    correctionScript.src = `assets/js/commerce-corrections-v5.js?v=${FEATURE_VERSION}`;
    correctionScript.async = false;
    correctionScript.setAttribute('data-sd-commerce-corrections-v5', 'true');
    document.head.appendChild(correctionScript);
  }

  if (!document.querySelector('script[data-sd-product-discount-v1]')) {
    const discountEditorScript = document.createElement('script');
    discountEditorScript.src = `assets/js/product-discount-v1.js?v=${FEATURE_VERSION}`;
    discountEditorScript.async = false;
    discountEditorScript.setAttribute('data-sd-product-discount-v1', 'true');
    document.head.appendChild(discountEditorScript);
  }

  if (!document.querySelector('script[data-sd-commerce-discount-savings-v6]')) {
    const discountScript = document.createElement('script');
    discountScript.src = `assets/js/commerce-discount-savings-v6.js?v=${FEATURE_VERSION}`;
    discountScript.async = false;
    discountScript.setAttribute('data-sd-commerce-discount-savings-v6', 'true');
    document.head.appendChild(discountScript);
  }

  // Capa final: se agrega después de las hojas comerciales para que
  // las correcciones solicitadas no sean anuladas por reglas anteriores.
  if (!document.querySelector('link[data-sd-mobile-requested-fixes-v2]')) {
    const requestedStyle = document.createElement('link');
    requestedStyle.rel = 'stylesheet';
    requestedStyle.href = `assets/css/mobile-requested-fixes-v2.css?v=${FEATURE_VERSION}`;
    requestedStyle.setAttribute('data-sd-mobile-requested-fixes-v2', 'true');
    document.head.appendChild(requestedStyle);
  }

  if (!document.querySelector('script[data-sd-mobile-requested-fixes-v2]')) {
    const requestedScript = document.createElement('script');
    requestedScript.src = `assets/js/mobile-requested-fixes-v2.js?v=${FEATURE_VERSION}`;
    requestedScript.async = false;
    requestedScript.setAttribute('data-sd-mobile-requested-fixes-v2', 'true');
    document.head.appendChild(requestedScript);
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
