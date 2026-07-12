// Promociones y presentación final de SD COMAYAGUA.
// La lógica del sistema permanece exclusivamente en assets/js/app.js.
(() => {
  const version = '20260712-final-ui-1';
  const dataName = 'sd-final-ui';

  if (!document.querySelector(`link[data-${dataName}]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `assets/css/final-ui.css?v=${version}`;
    link.setAttribute(`data-${dataName}`, 'true');
    document.head.appendChild(link);
  }

  // Solo reemplaza textos estáticos. No intercepta clics ni modifica la lógica.
  const applyDirectCopy = () => {
    const publicCatalog = document.body?.dataset.publicCatalog === 'true';
    const setText = (selector, text) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = text;
    };

    setText('#loadingText', 'Preparando productos.');
    setText('.brand-copy .eyebrow', publicCatalog ? 'Catálogo' : 'Panel privado');
    setText('.brand-copy p:last-child', publicCatalog
      ? 'PRODUCTOS DISPONIBLES'
      : 'PRODUCTOS · COTIZACIONES · INVENTARIO');

    const hero = document.querySelector('#inicio .hero-card');
    if (hero) {
      setText('#inicio .section-label', 'SD COMAYAGUA');
      setText('#inicio .hero-card h2', publicCatalog
        ? 'Productos disponibles.'
        : 'Productos, cotizaciones e inventario.');
      setText('#inicio .hero-text', publicCatalog
        ? 'Envíos a toda Honduras.'
        : 'Rápido. Claro. Listo.');

      const heroLink = hero.querySelector('.hero-actions a');
      const heroButtons = hero.querySelectorAll('.hero-actions button');
      if (heroLink) {
        heroLink.textContent = publicCatalog ? 'Catálogo' : 'Vista para clientes';
        if (publicCatalog) heroLink.hidden = true;
      }
      if (heroButtons[0]) heroButtons[0].textContent = 'Productos';
      if (heroButtons[1]) {
        heroButtons[1].textContent = 'Inventario';
        if (publicCatalog) heroButtons[1].hidden = true;
      }
    }

    setText('#panel .section-label', 'Panel');
    setText('#panel .section-head h2', 'Inventario');
    setText('#panel .section-head > div > p:last-child', 'Resumen general.');

    setText('#quoteDialog .section-label', 'Cotización');
    setText('#quoteProductName', 'Factura / cotización');
    setText('#quoteDialog .quote-hint', 'Productos, cantidades y entrega.');

    setText('#whatsappPreviewDialog .form-help', 'Edita el mensaje antes de enviarlo.');

    const notice = document.querySelector('#productos .client-catalog-notice');
    if (notice) notice.hidden = true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDirectCopy, { once: true });
  } else {
    applyDirectCopy();
  }
})();

// Promociones especiales SD COMAYAGUA.
// Las promociones manuales creadas desde Admin se guardan dentro del producto.
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
