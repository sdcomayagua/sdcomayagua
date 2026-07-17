// SD COMAYAGUA · Corrige precios como Lps.25.00 en el carrito público.
(() => {
  'use strict';

  const IS_PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (!IS_PUBLIC) return;

  const CART_KEY = 'sd_comayagua_client_cart_v1';
  const MIGRATION_KEY = 'sd_cart_price_migration_v1';
  const LOGO = 'assets/img/logo-round.png';
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let queued = false;
  let migrationChecked = false;

  function slug(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parsePrice(value) {
    const matches = String(value || '').match(/-?\d[\d.,]*/g);
    if (!matches?.length) return 0;

    let token = matches[matches.length - 1];
    const lastDot = token.lastIndexOf('.');
    const lastComma = token.lastIndexOf(',');

    if (lastDot >= 0 && lastComma >= 0) {
      if (lastDot > lastComma) token = token.replace(/,/g, '');
      else token = token.replace(/\./g, '').replace(',', '.');
    } else if (lastComma >= 0) {
      const decimals = token.length - lastComma - 1;
      token = decimals > 0 && decimals <= 2 ? token.replace(',', '.') : token.replace(/,/g, '');
    } else if ((token.match(/\./g) || []).length > 1) {
      const parts = token.split('.');
      const decimals = parts.pop();
      token = `${parts.join('')}.${decimals}`;
    }

    const parsed = Number(token);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function ensureStyle() {
    if (qs('#sdCartPriceFixStyle')) return;
    const style = document.createElement('style');
    style.id = 'sdCartPriceFixStyle';
    style.textContent = '.sd-cart-source-price::before{content:"Lps.";}';
    document.head.appendChild(style);
  }

  function normalizePriceNode(node) {
    if (!(node instanceof Element)) return 0;
    const price = parsePrice(node.textContent);
    if (!(price > 0)) return 0;

    const formatted = formatter.format(price);
    node.dataset.sdCartCorrectPrice = String(price);
    node.classList.add('sd-cart-source-price');
    if (node.textContent.trim() !== formatted) node.textContent = formatted;
    return price;
  }

  function normalizeSourcePrices() {
    qsa('#productGrid .gm-card-price, #productGrid .store-card-price, #productGrid .store-feature-price, #productGrid .product-price, #detailPrice')
      .forEach(normalizePriceNode);
  }

  function readCatalogProducts() {
    return qsa('#productGrid .product-card.store-minimal-card').map((card) => {
      const name = qs('.store-card-name, .product-name, h3, h4', card)?.textContent?.trim() || '';
      const priceNode = qs('.gm-card-price, .store-card-price, .store-feature-price, .product-price', card);
      const code = String(card.dataset.code || card.dataset.productCode || '').trim();
      const id = slug(card.dataset.productId || card.dataset.id || code || name);
      return {
        id,
        code: slug(code),
        nameKey: slug(name),
        price: priceNode ? (Number(priceNode.dataset.sdCartCorrectPrice) || parsePrice(priceNode.textContent)) : 0,
        image: qs('.store-card-photo img, .product-image img, img', card)?.src || LOGO
      };
    }).filter((item) => item.nameKey && item.price > 0);
  }

  function migrateStoredCart() {
    const catalog = readCatalogProducts();
    if (!catalog.length) return false;

    let stored;
    try {
      stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return false;
    }
    if (!Array.isArray(stored) || !stored.length) return false;

    let changed = false;
    stored.forEach((item) => {
      const itemId = slug(item.id);
      const itemCode = slug(item.code);
      const itemName = slug(item.name);
      const product = catalog.find((entry) =>
        (itemCode && entry.code === itemCode) ||
        (itemId && entry.id === itemId) ||
        (itemName && entry.nameKey === itemName)
      );
      if (!product) return;

      if (Math.abs((Number(item.price) || 0) - product.price) > 0.001) {
        item.price = product.price;
        changed = true;
      }
      if (product.image && item.image !== product.image) {
        item.image = product.image;
        changed = true;
      }
    });

    if (!changed) return false;
    localStorage.setItem(CART_KEY, JSON.stringify(stored));
    return true;
  }

  function sync() {
    queued = false;
    ensureStyle();
    normalizeSourcePrices();

    if (!migrationChecked) {
      const migrated = migrateStoredCart();
      if (migrated) {
        migrationChecked = true;
        if (sessionStorage.getItem(MIGRATION_KEY) !== 'done') {
          sessionStorage.setItem(MIGRATION_KEY, 'done');
          location.reload();
          return;
        }
      } else if (qsa('#productGrid .product-card.store-minimal-card').length) {
        migrationChecked = true;
        sessionStorage.removeItem(MIGRATION_KEY);
      }
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    sync();
    const grid = qs('#productGrid');
    if (grid) new MutationObserver(schedule).observe(grid, { childList: true, subtree: true, characterData: true });
    const detail = qs('#detailDialog');
    if (detail) new MutationObserver(schedule).observe(detail, { attributes: true, attributeFilter: ['open'], childList: true, subtree: true, characterData: true });
    window.addEventListener('pageshow', schedule);
    [100, 300, 700, 1200, 2000, 3500].forEach((delay) => setTimeout(schedule, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
