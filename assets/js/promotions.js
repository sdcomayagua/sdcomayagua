// Promociones SD COMAYAGUA.
// Desde esta versión no existen regalos ni descuentos generales automáticos.
// Cada descuento por cantidad se configura manualmente dentro de su producto.
window.SD_PROMOTIONS = [];
window.SD_PROMOTIONS_MANUAL_ONLY = true;

(() => {
  'use strict';

  const version = '20260720-manual-promotions-v21';

  window.SD_WHATSAPP_NUMBER = window.SD_WHATSAPP_NUMBER || '50431517755';

  if (/\bcliente(?:\.html)?$/i.test(window.location.pathname)) {
    window.SD_PUBLIC_CLIENT_CATALOG = true;
  }

  const publicCatalog = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /cliente(?:\.html)?$/i.test(window.location.pathname);

  function addStyle(attribute, href) {
    let style = document.querySelector(`link[${attribute}]`);
    if (!style) {
      style = document.createElement('link');
      style.rel = 'stylesheet';
      style.setAttribute(attribute, 'true');
    }
    style.href = `${href}?v=${version}`;
    document.head.appendChild(style);
  }

  function addScript(attribute, src) {
    if (document.querySelector(`script[${attribute}]`)) return;
    const script = document.createElement('script');
    script.src = `${src}?v=${version}`;
    script.async = false;
    script.setAttribute(attribute, 'true');
    document.head.appendChild(script);
  }

  // Se carga primero para limpiar promociones de regalo antes de usar el catálogo.
  addStyle('data-sd-manual-promotions-only-v1', 'assets/css/manual-promotions-only-v1.css');
  addScript('data-sd-manual-promotions-only-v1', 'assets/js/manual-promotions-only-v1.js');

  addStyle('data-sd-mobile-premium-v3', 'assets/css/mobile-premium-v3.css');
  addStyle('data-sd-mobile-premium-v3-hotfix', 'assets/css/mobile-premium-v3-hotfix.css');
  addStyle('data-sd-client-commerce-fixes', 'assets/css/client-commerce-fixes-v1.css');
  addStyle('data-sd-menu-image-tweak-v1', 'assets/css/menu-image-tweak-v1.css');

  if (publicCatalog) {
    addStyle('data-sd-client-remote-zones-v1', 'assets/css/client-remote-zones-v1.css');
  }

  addScript('data-sd-mobile-premium-v3', 'assets/js/mobile-premium-v3.js');
  addScript('data-sd-whatsapp-order-v2', 'assets/js/whatsapp-order-message-v2.js');
  addScript('data-sd-client-commerce-fixes', 'assets/js/client-commerce-fixes-v1.js');
  addScript('data-sd-receipt-clean-v3', 'assets/js/catalog-receipt-fixes-v2.js');

  if (publicCatalog) {
    addScript('data-sd-client-remote-zones-v1', 'assets/js/client-remote-zones-v1.js');
  }

  addStyle('data-sd-category-dropdown-desktop-fix-v1', 'assets/css/category-dropdown-desktop-fix-v1.css');
  addScript('data-sd-category-dropdown-desktop-fix-v1', 'assets/js/category-dropdown-desktop-fix-v1.js');

  const loadAdminRecovery = () => {
    if (publicCatalog) return;
    addStyle('data-sd-admin-access-recovery-v1', 'assets/css/admin-access-recovery-v1.css');
    addScript('data-sd-admin-access-recovery-v1', 'assets/js/admin-access-recovery-v1.js');
  };

  if (document.readyState === 'complete') {
    window.setTimeout(loadAdminRecovery, 0);
  } else {
    window.addEventListener('load', loadAdminRecovery, { once: true });
  }
})();
