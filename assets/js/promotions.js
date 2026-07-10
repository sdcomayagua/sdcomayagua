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

  loadStylesheet('assets/css/premium-ui.css?v=20260710', 'sd-premium-ui');
  loadStylesheet('assets/css/pro-restructure.css?v=20260710', 'sd-pro-restructure');

  if (!document.querySelector('script[data-sd-pro-ui]')) {
    const script = document.createElement('script');
    script.src = 'assets/js/pro-ui.js?v=20260710';
    script.async = false;
    script.dataset.sdProUi = 'true';
    document.head.appendChild(script);
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
