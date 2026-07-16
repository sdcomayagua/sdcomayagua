// SD COMAYAGUA · Mobile Premium V3
// Organiza filtros y carga las mejoras comerciales independientes.
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const FEATURE_VERSION = '20260716-receipt-clean-v10';

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

  let menuImageStyle = document.querySelector('link[data-sd-menu-image-tweak-v1]');
  if (!menuImageStyle) {
    menuImageStyle = document.createElement('link');
    menuImageStyle.rel = 'stylesheet';
    menuImageStyle.setAttribute('data-sd-menu-image-tweak-v1', 'true');
  }
  menuImageStyle.href = `assets/css/menu-image-tweak-v1.css?v=${FEATURE_VERSION}`;
  document.head.appendChild(menuImageStyle);

  let layoutFinalStyle = document.querySelector('link[data-sd-layout-final-fixes-v1]');
  if (!layoutFinalStyle) {
    layoutFinalStyle = document.createElement('link');
    layoutFinalStyle.rel = 'stylesheet';
    layoutFinalStyle.setAttribute('data-sd-layout-final-fixes-v1', 'true');
  }
  layoutFinalStyle.href = `assets/css/layout-final-fixes-v1.css?v=${FEATURE_VERSION}`;
  document.head.appendChild(layoutFinalStyle);

  if (!document.querySelector('script[data-sd-layout-final-fixes-v1]')) {
    const layoutFinalScript = document.createElement('script');
    layoutFinalScript.src = `assets/js/layout-final-fixes-v1.js?v=${FEATURE_VERSION}`;
    layoutFinalScript.async = false;
    layoutFinalScript.setAttribute('data-sd-layout-final-fixes-v1', 'true');
    document.head.appendChild(layoutFinalScript);
  }

  // Última capa: corrige el recorte real de fotografías y el texto del recibo.
  let catalogReceiptStyle = document.querySelector('link[data-sd-catalog-receipt-fixes-v2]');
  if (!catalogReceiptStyle) {
    catalogReceiptStyle = document.createElement('link');
    catalogReceiptStyle.rel = 'stylesheet';
    catalogReceiptStyle.setAttribute('data-sd-catalog-receipt-fixes-v2', 'true');
  }
  catalogReceiptStyle.href = `assets/css/catalog-receipt-fixes-v2.css?v=${FEATURE_VERSION}`;
  document.head.appendChild(catalogReceiptStyle);

  if (!document.querySelector('script[data-sd-catalog-receipt-fixes-v2]')) {
    const catalogReceiptScript = document.createElement('script');
    catalogReceiptScript.src = `assets/js/catalog-receipt-fixes-v2.js?v=${FEATURE_VERSION}`;
    catalogReceiptScript.async = false;
    catalogReceiptScript.setAttribute('data-sd-catalog-receipt-fixes-v2', 'true');
    document.head.appendChild(catalogReceiptScript);
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
