// Carga las capas visuales sin modificar la lógica principal del sistema.
(() => {
  const loadStylesheet = (href, dataName) => {
    if (document.querySelector(`link[data-${dataName}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(`data-${dataName}`, 'true');
    document.head.appendChild(link);
  };

  const loadScript = (src, dataName) => {
    if (document.querySelector(`script[data-${dataName}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(`data-${dataName}`, 'true');
    document.head.appendChild(script);
  };

  const version = '20260710i';

  loadStylesheet(`assets/css/premium-ui.css?v=${version}`, 'sd-premium-ui');
  loadStylesheet(`assets/css/pro-restructure.css?v=${version}`, 'sd-pro-restructure');
  loadStylesheet(`assets/css/product-card-polish.css?v=${version}`, 'sd-product-card-polish');
  loadStylesheet(`assets/css/storefront-mobile.css?v=${version}`, 'sd-storefront-mobile');
  loadStylesheet(`assets/css/storefront-access.css?v=${version}`, 'sd-storefront-access');
  loadStylesheet(`assets/css/interaction-recovery.css?v=${version}`, 'sd-interaction-recovery');

  // Este módulo se carga desde el inicio porque también limpia capas invisibles
  // que podrían interferir con el acceso o con la página ya autorizada.
  loadScript(`assets/js/interaction-recovery.js?v=${version}`, 'sd-interaction-recovery');

  let uiLoaded = false;

  const loadInterfaceScripts = () => {
    if (uiLoaded) return;
    uiLoaded = true;

    loadScript(`assets/js/pro-ui.js?v=${version}`, 'sd-pro-ui');
    loadScript(`assets/js/catalog-ui-fix.js?v=${version}`, 'sd-catalog-ui-fix');
    loadScript(`assets/js/storefront-mobile.js?v=${version}`, 'sd-storefront-mobile');
    loadScript(`assets/js/storefront-admin-tools.js?v=${version}`, 'sd-storefront-admin-tools');
  };

  const adminGateIsActive = document.documentElement.classList.contains('sd-admin-locked');

  if (adminGateIsActive) {
    window.addEventListener('sd:admin-auth-ok', loadInterfaceScripts, { once: true });

    // Respaldo: si el acceso ya fue validado antes de registrar el evento,
    // carga la interfaz al detectar que la clase de bloqueo desapareció.
    const authObserver = new MutationObserver(() => {
      if (document.documentElement.classList.contains('sd-admin-locked')) return;
      authObserver.disconnect();
      loadInterfaceScripts();
    });

    authObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  } else {
    loadInterfaceScripts();
  }
})();

// Promociones especiales SD COMAYAGUA
// Edita este archivo para promociones GENERALES sin tocar app.js.
// Las promociones manuales que agregues desde el Admin se guardan dentro del producto
// en Firebase/localStorage y usan este mismo formato de reglas.
// Tipos disponibles:
// - tier_price: precio por cantidad.
// - gift: regalos por cantidad comprada.

window.SD_PROMOTIONS = [
  {
    id: 'dedales-v1-mayoreo',
    type: 'tier_price',
    badge: 'PROMO MAYOREO',
    label: 'Dedales V1 por cantidad',
    match: {
      all: ['dedales', 'v1'],
      exclude: ['v3', 'memo', 'hilo de plata']
    },
    unitLabel: 'par',
    tiers: [
      { minQty: 1, price: 25 },
      { minQty: 6, price: 24 },
      { minQty: 10, price: 23 },
      { minQty: 12, price: 22 },
      { minQty: 16, price: 21 },
      { minQty: 20, price: 20 }
    ]
  },
  {
    id: 'dedales-v3-memo-regalo-v1',
    type: 'gift',
    badge: 'REGALO DEDALES V1',
    label: 'Regalo por compra de Dedales V3 MEMO',
    match: {
      all: ['dedales'],
      any: ['v3', 'memo', 'hilo de plata']
    },
    giftName: 'Dedales V1',
    giftUnitLabel: 'par',
    giftUnitPlural: 'pares',
    giftMatch: {
      all: ['dedales', 'v1'],
      exclude: ['v3', 'memo', 'hilo de plata']
    },
    gifts: [
      { minQty: 2, giftQty: 2 },
      { minQty: 3, giftQty: 3 },
      { minQty: 5, giftQty: 4 }
    ]
  }
];
