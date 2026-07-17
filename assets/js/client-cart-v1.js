// SD COMAYAGUA · Carrito público para cotizar varios productos.
(() => {
  'use strict';

  const PUBLIC_CATALOG = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (!PUBLIC_CATALOG) return;

  const STORAGE_KEY = 'sd_comayagua_client_cart_v1';
  const DELIVERY_KEY = 'sd_comayagua_client_delivery_v1';
  const WHATSAPP_NUMBER = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
  const LOGO = 'assets/img/logo-round.png';
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const DELIVERY = {
    pickup: { label: 'Retiro en tienda', short: 'Sin costo de envío', shipping: 0 },
    local: { label: 'Domicilio Comayagua', short: 'Casco urbano', shipping: 40 },
    normal: { label: 'Envío normal nacional', short: 'Depósito o transferencia', shipping: 110 },
    cod: { label: 'Pagar al recibir', short: 'Incluye comisión de la empresa', shipping: 110, cod: true }
  };

  let cart = loadCart();
  let deliveryMode = localStorage.getItem(DELIVERY_KEY) || 'normal';
  if (!DELIVERY[deliveryMode]) deliveryMode = 'normal';
  let toastTimer = 0;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseMoney(value) {
    const cleaned = String(value || '')
      .replace(/[^0-9.,-]/g, '')
      .replace(/,/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseStock(value) {
    const text = String(value || '');
    const match = text.match(/\d+/);
    if (!match) return 999;
    const stock = Number(match[0]);
    return Number.isFinite(stock) ? Math.max(0, stock) : 999;
  }

  function formatMoney(value) {
    return `Lps.${money.format(Number(value) || 0)}`;
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && item.name && Number(item.price) >= 0)
        .map((item) => ({
          id: String(item.id || normalize(item.name)),
          code: String(item.code || ''),
          name: String(item.name),
          price: Number(item.price) || 0,
          qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
          maxStock: Math.max(0, Math.floor(Number(item.maxStock) || 999)),
          image: String(item.image || LOGO)
        }));
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(DELIVERY_KEY, deliveryMode);
  }

  function calculateCommission(base) {
    const raw = Number(base) * 0.10;
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Number.isInteger(raw) ? raw : Math.ceil(raw) + 1;
  }

  function totals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const option = DELIVERY[deliveryMode];
    const shipping = cart.length ? option.shipping : 0;
    const commission = cart.length && option.cod ? calculateCommission(subtotal + shipping) : 0;
    return { subtotal, shipping, commission, total: subtotal + shipping + commission };
  }

  function makeItemId(product) {
    return normalize(product.code || product.id || product.name) || `producto-${Date.now()}`;
  }

  function addToCart(product) {
    if (!product || !product.name || product.price < 0 || product.maxStock === 0) return;
    const id = makeItemId(product);
    const existing = cart.find((item) => item.id === id);

    if (existing) {
      if (existing.qty >= existing.maxStock) {
        showToast('Ya alcanzaste el stock disponible.');
        return;
      }
      existing.qty += 1;
      existing.price = product.price;
      existing.image = product.image || existing.image;
      existing.maxStock = product.maxStock;
    } else {
      cart.push({
        id,
        code: product.code || '',
        name: product.name,
        price: product.price,
        qty: 1,
        maxStock: product.maxStock || 999,
        image: product.image || LOGO
      });
    }

    saveCart();
    renderCart();
    showToast(`${product.name} agregado al carrito.`);
  }

  function removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    saveCart();
    renderCart();
  }

  function changeQty(id, delta) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    const next = Math.max(1, Math.min(item.maxStock || 999, item.qty + delta));
    if (next === item.qty && delta > 0) showToast('No hay más unidades disponibles.');
    item.qty = next;
    saveCart();
    renderCart();
  }

  function readCardProduct(card) {
    const name = qs('.store-card-name, .product-name, h3, h4', card)?.textContent?.trim() || '';
    const priceNode = qs('.gm-card-price, .store-card-price, .store-feature-price, .product-price', card);
    const price = parseMoney(priceNode?.textContent || '');
    const stockText = qs('.store-card-stock, .product-stock, .stock-text', card)?.textContent || '';
    const cardText = card.textContent || '';
    const unavailable = /agotado|sin stock|no disponible/i.test(cardText) || /(^|\D)0\s*(unidades?|disponibles?)/i.test(stockText);
    const image = qs('.store-card-photo img, .product-image img, img', card)?.src || LOGO;
    const code = card.dataset.code || card.dataset.productCode || '';
    const id = card.dataset.productId || card.dataset.id || code || normalize(name);

    return {
      id,
      code,
      name,
      price,
      maxStock: unavailable ? 0 : parseStock(stockText),
      image
    };
  }

  function readDetailProduct() {
    const name = qs('#detailName')?.textContent?.trim() || '';
    const codeText = qs('#detailCode')?.textContent?.trim() || '';
    const code = codeText === '-' ? '' : codeText;
    const price = parseMoney(qs('#detailPrice')?.textContent || '');
    const stockText = qs('#detailStock')?.textContent || '';
    const statusText = qs('#detailStatus')?.textContent || '';
    const unavailable = /agotado|sin stock|no disponible/i.test(`${stockText} ${statusText}`) || /^\s*0\b/.test(stockText);
    const image = qs('#detailImage img')?.src || LOGO;

    return {
      id: code || normalize(name),
      code,
      name,
      price,
      maxStock: unavailable ? 0 : parseStock(stockText),
      image
    };
  }

  function buildShopTip() {
    if (qs('#sdClientShopTip')) return;
    const toolbar = qs('#productos .toolbar');
    if (!toolbar) return;

    const tip = document.createElement('div');
    tip.id = 'sdClientShopTip';
    tip.className = 'sd-client-shop-tip';
    tip.innerHTML = `
      <span class="sd-client-shop-tip-icon" aria-hidden="true">🛒</span>
      <span><strong>Arma tu cotización:</strong> agrega varios productos y elige el tipo de envío al finalizar.</span>
    `;
    toolbar.insertAdjacentElement('beforebegin', tip);

    const introText = qs('.store-catalog-intro p');
    if (introText) introText.textContent = 'Elige tus productos, agrégalos al carrito y calcula el envío al final.';
  }

  function ensureCardButtons() {
    qsa('#productGrid .product-card.store-minimal-card').forEach((card) => {
      const copy = qs('.store-card-copy', card);
      if (!copy || qs('.sd-card-cart-btn', copy)) return;
      const product = readCardProduct(card);
      if (!product.name) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sd-card-cart-btn';
      button.disabled = product.maxStock === 0;
      button.innerHTML = product.maxStock === 0
        ? '<span aria-hidden="true">×</span><span>Agotado</span>'
        : '<span aria-hidden="true">🛒</span><span>Añadir al carrito</span>';
      button.setAttribute('aria-label', product.maxStock === 0 ? `${product.name} agotado` : `Añadir ${product.name} al carrito`);

      const stop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };
      button.addEventListener('pointerdown', stop, true);
      button.addEventListener('click', (event) => {
        stop(event);
        if (!button.disabled) addToCart(readCardProduct(card));
      }, true);
      copy.appendChild(button);
    });
  }

  function ensureDetailActions() {
    const info = qs('#detailDialog .detail-info');
    if (!info) return;
    let actions = qs('#sdClientDetailActions', info);
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'sdClientDetailActions';
      actions.className = 'sd-client-detail-actions';
      actions.innerHTML = `
        <button class="sd-detail-add-cart" type="button">🛒 Añadir al carrito</button>
        <button class="sd-detail-open-cart" type="button">Ver carrito</button>
      `;
      info.appendChild(actions);

      qs('.sd-detail-add-cart', actions)?.addEventListener('click', () => {
        const product = readDetailProduct();
        if (product.maxStock === 0) {
          showToast('Este producto está agotado.');
          return;
        }
        addToCart(product);
      });
      qs('.sd-detail-open-cart', actions)?.addEventListener('click', openCart);
    }

    const product = readDetailProduct();
    const add = qs('.sd-detail-add-cart', actions);
    if (add) {
      add.disabled = product.maxStock === 0;
      add.textContent = product.maxStock === 0 ? 'Producto agotado' : '🛒 Añadir al carrito';
    }
  }

  function createCartUi() {
    if (qs('#sdClientCartButton')) return;

    const fab = document.createElement('button');
    fab.id = 'sdClientCartButton';
    fab.className = 'sd-client-cart-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir carrito de cotización');
    fab.innerHTML = `
      <span class="sd-client-cart-fab-icon" aria-hidden="true">🛒</span>
      <span class="sd-client-cart-fab-label">Carrito</span>
      <span id="sdClientCartCount" class="sd-client-cart-count">0</span>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'sdClientCartBackdrop';
    backdrop.className = 'sd-cart-backdrop';

    const panel = document.createElement('aside');
    panel.id = 'sdClientCartPanel';
    panel.className = 'sd-client-cart-panel';
    panel.setAttribute('aria-label', 'Carrito de cotización');
    panel.innerHTML = `
      <header class="sd-cart-head">
        <div class="sd-cart-head-copy">
          <strong>Tu cotización</strong>
          <span>Productos, cantidades y envío</span>
        </div>
        <button class="sd-cart-close" type="button" data-cart-action="close" aria-label="Cerrar carrito">×</button>
      </header>
      <div class="sd-cart-scroll">
        <div id="sdCartItems"></div>
        <section class="sd-cart-delivery" aria-label="Tipo de entrega">
          <span class="sd-cart-delivery-title">¿Cómo deseas recibir el pedido?</span>
          <div class="sd-cart-delivery-options">
            ${Object.entries(DELIVERY).map(([key, option]) => `
              <label class="sd-cart-delivery-option">
                <input type="radio" name="sdDeliveryMode" value="${key}">
                <strong>${option.label}</strong>
                <span>${option.short}</span>
              </label>
            `).join('')}
          </div>
        </section>
      </div>
      <footer class="sd-cart-footer">
        <div id="sdCartTotals" class="sd-cart-totals"></div>
        <div class="sd-cart-actions">
          <button class="sd-cart-copy" type="button" data-cart-action="copy">Copiar cotización</button>
          <button class="sd-cart-whatsapp" type="button" data-cart-action="whatsapp">Cotizar por WhatsApp</button>
        </div>
        <button class="sd-cart-clear" type="button" data-cart-action="clear">Vaciar carrito</button>
      </footer>
    `;

    const toast = document.createElement('div');
    toast.id = 'sdCartToast';
    toast.className = 'sd-cart-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    document.body.append(fab, backdrop, panel, toast);

    fab.addEventListener('click', openCart);
    backdrop.addEventListener('click', closeCart);
    panel.addEventListener('click', handleCartClick);
    panel.addEventListener('change', (event) => {
      const input = event.target.closest('input[name="sdDeliveryMode"]');
      if (!input) return;
      deliveryMode = input.value;
      saveCart();
      renderCart();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCart();
    });
  }

  function openCart() {
    qs('#sdClientCartBackdrop')?.classList.add('open');
    qs('#sdClientCartPanel')?.classList.add('open');
    document.body.classList.add('sd-cart-open');
    renderCart();
  }

  function closeCart() {
    qs('#sdClientCartBackdrop')?.classList.remove('open');
    qs('#sdClientCartPanel')?.classList.remove('open');
    document.body.classList.remove('sd-cart-open');
  }

  function handleCartClick(event) {
    const actionNode = event.target.closest('[data-cart-action]');
    if (!actionNode) return;
    const action = actionNode.dataset.cartAction;
    const id = actionNode.dataset.itemId;

    if (action === 'close') closeCart();
    if (action === 'remove') removeItem(id);
    if (action === 'minus') changeQty(id, -1);
    if (action === 'plus') changeQty(id, 1);
    if (action === 'clear') {
      if (!cart.length || confirm('¿Deseas vaciar el carrito?')) {
        cart = [];
        saveCart();
        renderCart();
      }
    }
    if (action === 'copy') copyQuote();
    if (action === 'whatsapp') sendWhatsApp();
  }

  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const countNode = qs('#sdClientCartCount');
    if (countNode) countNode.textContent = String(count);

    const itemsNode = qs('#sdCartItems');
    if (itemsNode) {
      if (!cart.length) {
        itemsNode.innerHTML = `
          <div class="sd-cart-empty">
            <span class="sd-cart-empty-icon" aria-hidden="true">🛒</span>
            <strong>Tu carrito está vacío</strong>
            <p>Agrega productos para calcular cantidades, envío y total final.</p>
          </div>
        `;
      } else {
        itemsNode.innerHTML = `<div class="sd-cart-list">${cart.map((item) => `
          <article class="sd-cart-item">
            <div class="sd-cart-item-image"><img src="${escapeAttr(item.image || LOGO)}" alt="" onerror="this.src='${LOGO}'"></div>
            <div class="sd-cart-item-body">
              <div class="sd-cart-item-title-row">
                <span class="sd-cart-item-title">${escapeHtml(item.name)}</span>
                <button class="sd-cart-remove" type="button" data-cart-action="remove" data-item-id="${escapeAttr(item.id)}" aria-label="Eliminar ${escapeAttr(item.name)}">×</button>
              </div>
              <span class="sd-cart-item-meta">${formatMoney(item.price)} c/u${item.code ? ` · ${escapeHtml(item.code)}` : ''}</span>
              <div class="sd-cart-item-controls">
                <div class="sd-cart-qty" aria-label="Cantidad">
                  <button type="button" data-cart-action="minus" data-item-id="${escapeAttr(item.id)}" aria-label="Restar">−</button>
                  <span>${item.qty}</span>
                  <button type="button" data-cart-action="plus" data-item-id="${escapeAttr(item.id)}" aria-label="Sumar">+</button>
                </div>
                <strong class="sd-cart-item-subtotal">${formatMoney(item.price * item.qty)}</strong>
              </div>
            </div>
          </article>
        `).join('')}</div>`;
      }
    }

    qsa('input[name="sdDeliveryMode"]').forEach((input) => {
      input.checked = input.value === deliveryMode;
    });

    const result = totals();
    const totalsNode = qs('#sdCartTotals');
    if (totalsNode) {
      totalsNode.innerHTML = `
        <div class="sd-cart-total-row"><span>Total de productos</span><strong>${formatMoney(result.subtotal)}</strong></div>
        <div class="sd-cart-total-row"><span>Envío</span><strong>${formatMoney(result.shipping)}</strong></div>
        ${result.commission ? `<div class="sd-cart-total-row"><span>Comisión 10%</span><strong>${formatMoney(result.commission)}</strong></div>` : ''}
        <div class="sd-cart-total-row grand"><span>Total final</span><strong>${formatMoney(result.total)}</strong></div>
      `;
    }

    const disabled = !cart.length;
    qsa('[data-cart-action="copy"], [data-cart-action="whatsapp"], [data-cart-action="clear"]').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function buildQuoteText() {
    if (!cart.length) return '';
    const result = totals();
    const delivery = DELIVERY[deliveryMode];
    const lines = ['Hola, deseo cotizar los siguientes productos:', ''];

    cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`Cantidad: ${item.qty}`);
      lines.push(`Precio unitario: ${formatMoney(item.price)}`);
      lines.push(`Subtotal: ${formatMoney(item.price * item.qty)}`);
      lines.push('');
    });

    lines.push(`🛒 Total de productos: ${formatMoney(result.subtotal)}`);
    lines.push(`🚚 ${delivery.label}: ${formatMoney(result.shipping)}`);
    if (result.commission) lines.push(`💳 Comisión 10%: ${formatMoney(result.commission)}`);
    lines.push(`✅ Total final: ${formatMoney(result.total)}`);
    lines.push('');
    lines.push('¿Me confirma disponibilidad y los datos necesarios para realizar el pedido?');
    return lines.join('\n');
  }

  async function copyQuote() {
    const text = buildQuoteText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Cotización copiada.');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      showToast('Cotización copiada.');
    }
  }

  function sendWhatsApp() {
    const text = buildQuoteText();
    if (!text) return;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function showToast(message) {
    const node = qs('#sdCartToast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove('show'), 2300);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function sync() {
    buildShopTip();
    createCartUi();
    ensureCardButtons();
    ensureDetailActions();
    renderCart();
  }

  function boot() {
    sync();

    const grid = qs('#productGrid');
    if (grid) {
      new MutationObserver(() => requestAnimationFrame(sync)).observe(grid, { childList: true, subtree: true });
    }

    const detail = qs('#detailDialog');
    if (detail) {
      new MutationObserver(() => requestAnimationFrame(ensureDetailActions)).observe(detail, {
        attributes: true,
        attributeFilter: ['open'],
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    window.addEventListener('pageshow', sync);
    [150, 450, 900, 1600, 2800, 4500].forEach((delay) => setTimeout(sync, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
