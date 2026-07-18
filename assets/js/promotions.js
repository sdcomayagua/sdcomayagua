// Promociones especiales SD COMAYAGUA.
// La lógica principal permanece en assets/js/app.js.
// Las capas visuales no interceptan Firebase, inventario ni cotizaciones.
(() => {
  const version = '20260717-comayagua-zones-v17';

  window.SD_WHATSAPP_NUMBER = window.SD_WHATSAPP_NUMBER || '50431517755';

  if (/\bcliente(?:\.html)?$/i.test(window.location.pathname)) {
    window.SD_PUBLIC_CLIENT_CATALOG = true;
  }

  const publicCatalog = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /cliente(?:\.html)?$/i.test(window.location.pathname);

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

  if (!document.querySelector('link[data-sd-menu-image-tweak-v1]')) {
    const finalStyle = document.createElement('link');
    finalStyle.rel = 'stylesheet';
    finalStyle.href = `assets/css/menu-image-tweak-v1.css?v=${version}`;
    finalStyle.setAttribute('data-sd-menu-image-tweak-v1', 'true');
    document.head.appendChild(finalStyle);
  }

  if (publicCatalog && !document.querySelector('link[data-sd-client-remote-zones-v1]')) {
    const remoteStyle = document.createElement('link');
    remoteStyle.rel = 'stylesheet';
    remoteStyle.href = `assets/css/client-remote-zones-v1.css?v=${version}`;
    remoteStyle.setAttribute('data-sd-client-remote-zones-v1', 'true');
    document.head.appendChild(remoteStyle);
  }

  if (!document.querySelector('script[data-sd-mobile-premium-v3]')) {
    const script = document.createElement('script');
    script.src = `assets/js/mobile-premium-v3.js?v=${version}`;
    script.async = false;
    script.setAttribute('data-sd-mobile-premium-v3', 'true');
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-sd-whatsapp-order-v2]')) {
    const orderScript = document.createElement('script');
    orderScript.src = `assets/js/whatsapp-order-message-v2.js?v=${version}`;
    orderScript.async = false;
    orderScript.setAttribute('data-sd-whatsapp-order-v2', 'true');
    document.head.appendChild(orderScript);
  }

  if (!document.querySelector('script[data-sd-client-commerce-fixes]')) {
    const commerceScript = document.createElement('script');
    commerceScript.src = `assets/js/client-commerce-fixes-v1.js?v=${version}`;
    commerceScript.async = false;
    commerceScript.setAttribute('data-sd-client-commerce-fixes', 'true');
    document.head.appendChild(commerceScript);
  }

  if (!document.querySelector('script[data-sd-receipt-clean-v3]')) {
    const receiptScript = document.createElement('script');
    receiptScript.src = `assets/js/catalog-receipt-fixes-v2.js?v=${version}`;
    receiptScript.async = false;
    receiptScript.setAttribute('data-sd-receipt-clean-v3', 'true');
    document.head.appendChild(receiptScript);
  }

  if (publicCatalog && !document.querySelector('script[data-sd-client-remote-zones-v1]')) {
    const remoteScript = document.createElement('script');
    remoteScript.src = `assets/js/client-remote-zones-v1.js?v=${version}`;
    remoteScript.async = false;
    remoteScript.setAttribute('data-sd-client-remote-zones-v1', 'true');
    document.head.appendChild(remoteScript);
  }

  let categoryStyle = document.querySelector('link[data-sd-category-dropdown-desktop-fix-v1]');
  if (!categoryStyle) {
    categoryStyle = document.createElement('link');
    categoryStyle.rel = 'stylesheet';
    categoryStyle.setAttribute('data-sd-category-dropdown-desktop-fix-v1', 'true');
  }
  categoryStyle.href = `assets/css/category-dropdown-desktop-fix-v1.css?v=${version}`;
  document.head.appendChild(categoryStyle);

  if (!document.querySelector('script[data-sd-category-dropdown-desktop-fix-v1]')) {
    const categoryScript = document.createElement('script');
    categoryScript.src = `assets/js/category-dropdown-desktop-fix-v1.js?v=${version}`;
    categoryScript.async = false;
    categoryScript.setAttribute('data-sd-category-dropdown-desktop-fix-v1', 'true');
    document.head.appendChild(categoryScript);
  }

  const loadAdminRecovery = () => {
    let recoveryStyle = document.querySelector('link[data-sd-admin-access-recovery-v1]');
    if (!recoveryStyle) {
      recoveryStyle = document.createElement('link');
      recoveryStyle.rel = 'stylesheet';
      recoveryStyle.setAttribute('data-sd-admin-access-recovery-v1', 'true');
    }
    recoveryStyle.href = `assets/css/admin-access-recovery-v1.css?v=${version}`;
    document.head.appendChild(recoveryStyle);

    if (!document.querySelector('script[data-sd-admin-access-recovery-v1]')) {
      const recoveryScript = document.createElement('script');
      recoveryScript.src = `assets/js/admin-access-recovery-v1.js?v=${version}`;
      recoveryScript.async = false;
      recoveryScript.setAttribute('data-sd-admin-access-recovery-v1', 'true');
      document.head.appendChild(recoveryScript);
    }
  };

  if (document.readyState === 'complete') {
    window.setTimeout(loadAdminRecovery, 0);
  } else {
    window.addEventListener('load', loadAdminRecovery, { once: true });
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
