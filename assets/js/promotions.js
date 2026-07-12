// Promociones especiales SD COMAYAGUA.
// La lógica principal permanece en assets/js/app.js.
// Las capas visuales no interceptan Firebase, inventario ni cotizaciones.
(() => {
  const version = '20260712-client-commerce-fixes-v3';

  // Número global seguro: evita errores en todos los botones de WhatsApp.
  window.SD_WHATSAPP_NUMBER = window.SD_WHATSAPP_NUMBER || '50431517755';

  // cliente.html declara esta variable después de este archivo; la anticipamos
  // para que los botones públicos funcionen incluso si el módulo carga muy rápido.
  if (/\bcliente(?:\.html)?$/i.test(window.location.pathname)) {
    window.SD_PUBLIC_CLIENT_CATALOG = true;
  }

  if (!document.querySelector('link[data-sd-mobile-premium-v3]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `assets/css/mobile-premium-v3.css?v=${version}`;
    style.setAttribute('data-sd-mobile-premium-v3', 'true');
    document.head.appendChild(style);
  }

  if (!document.querySelector('link[data-sd-mobile-premium-v3-hotfix]')) {
    const hotfix = document.createElement('link');
    hotfix.rel = 'stylesheet';
    hotfix.href = `assets/css/mobile-premium-v3-hotfix.css?v=${version}`;
    hotfix.setAttribute('data-sd-mobile-premium-v3-hotfix', 'true');
    document.head.appendChild(hotfix);
  }

  if (!document.querySelector('link[data-sd-client-commerce-fixes]')) {
    const commerceStyle = document.createElement('link');
    commerceStyle.rel = 'stylesheet';
    commerceStyle.href = `assets/css/client-commerce-fixes-v1.css?v=${version}`;
    commerceStyle.setAttribute('data-sd-client-commerce-fixes', 'true');
    document.head.appendChild(commerceStyle);
  }

  if (!document.querySelector('script[data-sd-mobile-premium-v3]')) {
    const script = document.createElement('script');
    script.src = `assets/js/mobile-premium-v3.js?v=${version}`;
    script.defer = true;
    script.setAttribute('data-sd-mobile-premium-v3', 'true');
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-sd-client-commerce-fixes]')) {
    const commerceScript = document.createElement('script');
    commerceScript.src = `assets/js/client-commerce-fixes-v1.js?v=${version}`;
    commerceScript.defer = true;
    commerceScript.setAttribute('data-sd-client-commerce-fixes', 'true');
    document.head.appendChild(commerceScript);
  }
})();

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
