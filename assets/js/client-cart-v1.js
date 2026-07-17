// SD COMAYAGUA · Carrito público para cotizar varios productos.
(() => {
  'use strict';

  const IS_PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (!IS_PUBLIC) return;

  const CART_KEY = 'sd_comayagua_client_cart_v1';
  const DELIVERY_KEY = 'sd_comayagua_client_delivery_v1';
  const WHATSAPP = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
  const LOGO = 'assets/img/logo-round.png';
  const formatter = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const DELIVERY = {
    pickup: { label: 'Retiro en tienda', detail: 'Sin costo de envío', shipping: 0 },
    local: { label: 'Domicilio Comayagua', detail: 'Casco urbano', shipping: 40 },
    normal: { label: 'Envío normal nacional', detail: 'Depósito o transferencia', shipping: 110 },
    cod: { label: 'Pagar al recibir', detail: 'Incluye comisión de la empresa', shipping: 110, cod: true }
  };

  let cart = loadCart();
  let deliveryMode = localStorage.getItem(DELIVERY_KEY) || 'normal';
  if (!DELIVERY[deliveryMode]) deliveryMode = 'normal';
  let toastTimer = 0;
  let gridSyncQueued = false;

  function slug(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseMoney(value) {
    const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseStock(value) {
    const match = String(value || '').match(/\d+/);
    if (!match) return 999;
    const stock = Number(match[0]);
    return Number.isFinite(stock) ? Math.max(0, stock) : 999;
  }

  function money(value) {
    return `Lps.${formatter.format(Number(value) || 0)}`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter((item) => item?.name).map((item) => ({
        id: String(item.id || slug(item.name)),
        code: String(item.code || ''),
        name: String(item.name),
        price: Math.max(0, Number(item.price) || 0),
        qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
        maxStock: Math.max(0, Math.floor(Number(item.maxStock) || 999)),
        image: String(item.image || LOGO)
      }));
    } catch {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(DELIVERY_KEY, deliveryMode);
  }

  function commission(base) {
    const raw = Number(base) * 0.10;
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Number.isInteger(raw) ? raw : Math.ceil(raw) + 1;
  }

  function getTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const option = DELIVERY[deliveryMode];
    const shipping = cart.length ? option.shipping : 0;
    const fee = cart.length && option.cod ? commission(subtotal + shipping) : 0;
    return { subtotal, shipping, commission: fee, total: subtotal + shipping + fee };
  }

  function cardProduct(card) {
    const name = qs('.store-card-name, .product-name, h3, h4', card)?.textContent?.trim() || '';
    const price = parseMoney(qs('.gm-card-price, .store-card-price, .store-feature-price, .product-price', card)?.textContent);
    const stockText = qs('.store-card-stock, .product-stock, .stock-text', card)?.textContent || '';
    const unavailable = /agotado|sin stock|no disponible/i.test(`${card.textContent} ${stockText}`) || /(^|\D)0\s*(unidades?|disponibles?)/i.test(stockText);
    const code = card.dataset.code || card.dataset.productCode || '';
    return {
      id: card.dataset.productId || card.dataset.id || code || slug(name),
      code,
      name,
      price,
      maxStock: unavailable ? 0 : parseStock(stockText),
      image: qs('.store-card-photo img, .product-image img, img', card)?.src || LOGO
    };
  }

  function detailProduct() {
    const name = qs('#detailName')?.textContent?.trim() || '';
    const codeText = qs('#detailCode')?.textContent?.trim() || '';
    const code = codeText === '-' ? '' : codeText;
    const stockText = qs('#detailStock')?.textContent || '';
    const status = qs('#detailStatus')?.textContent || '';
    const unavailable = /agotado|sin stock|no disponible/i.test(`${stockText} ${status}`) || /^\s*0\b/.test(stockText);
    return {
      id: code || slug(name),
      code,
      name,
      price: parseMoney(qs('#detailPrice')?.textContent),
      maxStock: unavailable ? 0 : parseStock(stockText),
      image: qs('#detailImage img')?.src || LOGO
    };
  }

  function add(product) {
    if (!product?.name || product.maxStock === 0) return;
    const id = slug(product.code || product.id || product.name) || `producto-${Date.now()}`;
    const existing = cart.find((item) => item.id === id);

    if (existing) {
      if (existing.qty >= existing.maxStock) {
        notify('Ya alcanzaste el stock disponible.');
        return;
      }
      existing.qty += 1;
      existing.price = product.price;
      existing.image = product.image || existing.image;
      existing.maxStock = product.maxStock;
    } else {
      cart.push({ id, code: product.code || '', name: product.name, price: product.price, qty: 1, maxStock: product.maxStock || 999, image: product.image || LOGO });
    }

    persist();
    render();
    notify(`${product.name} agregado al carrito.`);
  }

  function updateQty(id, delta) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    const next = Math.max(1, Math.min(item.maxStock || 999, item.qty + delta));
    if (next === item.qty && delta > 0) notify('No hay más unidades disponibles.');
    item.qty = next;
    persist();
    render();
  }

  function buildTip() {
    if (qs('#sdClientShopTip')) return;
    const toolbar = qs('#productos .toolbar');
    if (!toolbar) return;
    const tip = document.createElement('div');
    tip.id = 'sdClientShopTip';
    tip.className = 'sd-client-shop-tip';
    tip.innerHTML = '<span class="sd-client-shop-tip-icon" aria-hidden="true">🛒</span><span><strong>Arma tu cotización:</strong> agrega varios productos y elige el tipo de envío al finalizar.</span>';
    toolbar.insertAdjacentElement('beforebegin', tip);
    const intro = qs('.store-catalog-intro p');
    if (intro) intro.textContent = 'Elige tus productos, agrégalos al carrito y calcula el envío al final.';
  }

  function stopCardEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function addCardButtons() {
    qsa('#productGrid .product-card.store-minimal-card').forEach((card) => {
      const copy = qs('.store-card-copy', card);
      if (!copy || qs('.sd-card-cart-btn', copy)) return;
      const product = cardProduct(card);
      if (!product.name) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sd-card-cart-btn';
      button.disabled = product.maxStock === 0;
      button.innerHTML = button.disabled ? '<span aria-hidden="true">×</span><span>Agotado</span>' : '<span aria-hidden="true">🛒</span><span>Añadir al carrito</span>';
      button.setAttribute('aria-label', button.disabled ? `${product.name} agotado` : `Añadir ${product.name} al carrito`);
      button.addEventListener('pointerdown', stopCardEvent, true);
      button.addEventListener('click', (event) => {
        stopCardEvent(event);
        if (!button.disabled) add(cardProduct(card));
      }, true);
      copy.appendChild(button);
    });
  }

  function addDetailActions() {
    const info = qs('#detailDialog .detail-info');
    if (!info) return;
    let actions = qs('#sdClientDetailActions', info);
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'sdClientDetailActions';
      actions.className = 'sd-client-detail-actions';
      actions.innerHTML = '<button class="sd-detail-add-cart" type="button">🛒 Añadir al carrito</button><button class="sd-detail-open-cart" type="button">Ver carrito</button>';
      info.appendChild(actions);
      qs('.sd-detail-add-cart', actions)?.addEventListener('click', () => {
        const product = detailProduct();
        if (product.maxStock === 0) return notify('Este producto está agotado.');
        add(product);
      });
      qs('.sd-detail-open-cart', actions)?.addEventListener('click', openCart);
    }

    const unavailable = detailProduct().maxStock === 0;
    const addButton = qs('.sd-detail-add-cart', actions);
    if (addButton) {
      if (addButton.disabled !== unavailable) addButton.disabled = unavailable;
      const label = unavailable ? 'Producto agotado' : '🛒 Añadir al carrito';
      if (addButton.textContent !== label) addButton.textContent = label;
    }
  }

  function createUi() {
    if (qs('#sdClientCartButton')) return;
    const button = document.createElement('button');
    button.id = 'sdClientCartButton';
    button.className = 'sd-client-cart-fab';
    button.type = 'button';
    button.setAttribute('aria-label', 'Abrir carrito de cotización');
    button.innerHTML = '<span class="sd-client-cart-fab-icon" aria-hidden="true">🛒</span><span class="sd-client-cart-fab-label">Carrito</span><span id="sdClientCartCount" class="sd-client-cart-count">0</span>';

    const backdrop = document.createElement('div');
    backdrop.id = 'sdClientCartBackdrop';
    backdrop.className = 'sd-cart-backdrop';

    const panel = document.createElement('aside');
    panel.id = 'sdClientCartPanel';
    panel.className = 'sd-client-cart-panel';
    panel.setAttribute('aria-label', 'Carrito de cotización');
    panel.innerHTML = `
      <header class="sd-cart-head">
        <div class="sd-cart-head-copy"><strong>Tu cotización</strong><span>Productos, cantidades y envío</span></div>
        <button class="sd-cart-close" type="button" data-cart-action="close" aria-label="Cerrar carrito">×</button>
      </header>
      <div class="sd-cart-scroll">
        <div id="sdCartItems"></div>
        <section class="sd-cart-delivery" aria-label="Tipo de entrega">
          <span class="sd-cart-delivery-title">¿Cómo deseas recibir el pedido?</span>
          <div class="sd-cart-delivery-options">
            ${Object.entries(DELIVERY).map(([key, option]) => `<label class="sd-cart-delivery-option"><input type="radio" name="sdDeliveryMode" value="${key}"><strong>${option.label}</strong><span>${option.detail}</span></label>`).join('')}
          </div>
        </section>
      </div>
      <footer class="sd-cart-footer">
        <div id="sdCartTotals" class="sd-cart-totals"></div>
        <div class="sd-cart-actions"><button class="sd-cart-copy" type="button" data-cart-action="copy">Copiar cotización</button><button class="sd-cart-whatsapp" type="button" data-cart-action="whatsapp">Cotizar por WhatsApp</button></div>
        <button class="sd-cart-clear" type="button" data-cart-action="clear">Vaciar carrito</button>
      </footer>`;

    const toast = document.createElement('div');
    toast.id = 'sdCartToast';
    toast.className = 'sd-cart-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(button, backdrop, panel, toast);

    button.addEventListener('click', openCart);
    backdrop.addEventListener('click', closeCart);
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('change', (event) => {
      const input = event.target.closest('input[name="sdDeliveryMode"]');
      if (!input) return;
      deliveryMode = input.value;
      persist();
      render();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCart();
    });
  }

  function openCart() {
    qs('#sdClientCartBackdrop')?.classList.add('open');
    qs('#sdClientCartPanel')?.classList.add('open');
    document.body.classList.add('sd-cart-open');
    render();
  }

  function closeCart() {
    qs('#sdClientCartBackdrop')?.classList.remove('open');
    qs('#sdClientCartPanel')?.classList.remove('open');
    document.body.classList.remove('sd-cart-open');
  }

  function onPanelClick(event) {
    const node = event.target.closest('[data-cart-action]');
    if (!node) return;
    const action = node.dataset.cartAction;
    const id = node.dataset.itemId;
    if (action === 'close') closeCart();
    if (action === 'remove') {
      cart = cart.filter((item) => item.id !== id);
      persist();
      render();
    }
    if (action === 'minus') updateQty(id, -1);
    if (action === 'plus') updateQty(id, 1);
    if (action === 'clear' && (!cart.length || confirm('¿Deseas vaciar el carrito?'))) {
      cart = [];
      persist();
      render();
    }
    if (action === 'copy') copyQuote();
    if (action === 'whatsapp') sendWhatsApp();
  }

  function render() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const countNode = qs('#sdClientCartCount');
    if (countNode) countNode.textContent = String(count);

    const itemsNode = qs('#sdCartItems');
    if (itemsNode) {
      itemsNode.innerHTML = cart.length ? `<div class="sd-cart-list">${cart.map((item) => `
        <article class="sd-cart-item">
          <div class="sd-cart-item-image"><img src="${escapeHtml(item.image || LOGO)}" alt="" onerror="this.src='${LOGO}'"></div>
          <div class="sd-cart-item-body">
            <div class="sd-cart-item-title-row"><span class="sd-cart-item-title">${escapeHtml(item.name)}</span><button class="sd-cart-remove" type="button" data-cart-action="remove" data-item-id="${escapeHtml(item.id)}" aria-label="Eliminar producto">×</button></div>
            <span class="sd-cart-item-meta">${money(item.price)} c/u${item.code ? ` · ${escapeHtml(item.code)}` : ''}</span>
            <div class="sd-cart-item-controls"><div class="sd-cart-qty"><button type="button" data-cart-action="minus" data-item-id="${escapeHtml(item.id)}">−</button><span>${item.qty}</span><button type="button" data-cart-action="plus" data-item-id="${escapeHtml(item.id)}">+</button></div><strong class="sd-cart-item-subtotal">${money(item.price * item.qty)}</strong></div>
          </div>
        </article>`).join('')}</div>` : '<div class="sd-cart-empty"><span class="sd-cart-empty-icon" aria-hidden="true">🛒</span><strong>Tu carrito está vacío</strong><p>Agrega productos para calcular cantidades, envío y total final.</p></div>';
    }

    qsa('input[name="sdDeliveryMode"]').forEach((input) => { input.checked = input.value === deliveryMode; });
    const result = getTotals();
    const totalsNode = qs('#sdCartTotals');
    if (totalsNode) totalsNode.innerHTML = `<div class="sd-cart-total-row"><span>Total de productos</span><strong>${money(result.subtotal)}</strong></div><div class="sd-cart-total-row"><span>Envío</span><strong>${money(result.shipping)}</strong></div>${result.commission ? `<div class="sd-cart-total-row"><span>Comisión 10%</span><strong>${money(result.commission)}</strong></div>` : ''}<div class="sd-cart-total-row grand"><span>Total final</span><strong>${money(result.total)}</strong></div>`;
    qsa('[data-cart-action="copy"], [data-cart-action="whatsapp"], [data-cart-action="clear"]').forEach((node) => { node.disabled = !cart.length; });
  }

  function quoteText() {
    if (!cart.length) return '';
    const result = getTotals();
    const lines = ['Hola, deseo cotizar los siguientes productos:', ''];
    cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`Cantidad: ${item.qty}`);
      lines.push(`Precio unitario: ${money(item.price)}`);
      lines.push(`Subtotal: ${money(item.price * item.qty)}`, '');
    });
    lines.push(`🛒 Total de productos: ${money(result.subtotal)}`);
    lines.push(`🚚 ${DELIVERY[deliveryMode].label}: ${money(result.shipping)}`);
    if (result.commission) lines.push(`💳 Comisión 10%: ${money(result.commission)}`);
    lines.push(`✅ Total final: ${money(result.total)}`, '', '¿Me confirma disponibilidad y los datos necesarios para realizar el pedido?');
    return lines.join('\n');
  }

  async function copyQuote() {
    const text = quoteText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    notify('Cotización copiada.');
  }

  function sendWhatsApp() {
    const text = quoteText();
    if (text) window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function notify(message) {
    const toast = qs('#sdCartToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function syncGrid() {
    if (gridSyncQueued) return;
    gridSyncQueued = true;
    requestAnimationFrame(() => {
      gridSyncQueued = false;
      addCardButtons();
    });
  }

  function syncAll() {
    buildTip();
    createUi();
    addCardButtons();
    addDetailActions();
    render();
  }

  function boot() {
    syncAll();
    const grid = qs('#productGrid');
    if (grid) new MutationObserver(syncGrid).observe(grid, { childList: true, subtree: true });
    const detail = qs('#detailDialog');
    if (detail) new MutationObserver(() => requestAnimationFrame(addDetailActions)).observe(detail, { attributes: true, attributeFilter: ['open'] });
    window.addEventListener('pageshow', syncAll);
    [150, 450, 900, 1600, 2800, 4500].forEach((delay) => setTimeout(syncAll, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
