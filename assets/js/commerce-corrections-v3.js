// SD COMAYAGUA · Correcciones comerciales V3
// Limpia la galería oculta, corrige promociones, precios y selección de envío.
(() => {
  'use strict';

  const PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(window.location.pathname);
  const LOCAL_FEE = 35;
  const NATIONAL_FEE = 110;
  const COD_RATE = 0.10;
  const INVENTORY_KEY = 'sd_comayagua_products';
  const GALLERY_PREFIX = '[[SD_GALLERY_V1:';
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const state = {
    quantity: 1,
    stock: 1,
    basePrice: 0,
    lastCardPrice: 0,
    lastCardName: '',
    location: PUBLIC ? '' : 'national',
    deliveryMode: PUBLIC ? '' : 'normal',
    syncing: false
  };

  function parseMoney(value) {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatMoney(value) {
    return `Lps.${money.format(Number(value || 0))}`;
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readInventory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function inventoryProductByName(name) {
    const target = normalizeText(name);
    if (!target) return null;
    return readInventory().find((item) => normalizeText(item?.name) === target) || null;
  }

  function inventoryPriceByName(name) {
    return Number(inventoryProductByName(name)?.price || 0);
  }

  function detailName() {
    return document.getElementById('detailName')?.textContent?.trim() || state.lastCardName || 'Producto';
  }

  function isDedales(name = detailName()) {
    return /dedal/i.test(String(name || ''));
  }

  function unitLabel(quantity = state.quantity) {
    if (isDedales()) return quantity === 1 ? 'par' : 'pares';
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  function readDetailBasePrice() {
    const detailValue = parseMoney(document.getElementById('detailPrice')?.textContent);
    if (detailValue > 0) return detailValue;
    if (state.lastCardPrice > 0) return state.lastCardPrice;
    return inventoryPriceByName(detailName());
  }

  function ruleMatches(rule, name) {
    const haystack = normalizeText(name);
    const match = rule?.match || {};
    const all = !match.all?.length || match.all.every((token) => haystack.includes(normalizeText(token)));
    const any = !match.any?.length || match.any.some((token) => haystack.includes(normalizeText(token)));
    const excluded = match.exclude?.some((token) => haystack.includes(normalizeText(token)));
    return all && any && !excluded;
  }

  function matchingRule(type, name = detailName()) {
    return (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : []).find((rule) => {
      if (rule?.type !== type) return false;
      return ruleMatches(rule, name);
    });
  }

  function promotionTiers() {
    const rule = matchingRule('tier_price');
    const tiers = [{ min: 1, price: state.basePrice }];
    rule?.tiers?.forEach((tier) => {
      const min = Number(tier.minQty);
      const price = Number(tier.price);
      if (Number.isFinite(min) && Number.isFinite(price) && min > 0 && price > 0) tiers.push({ min, price });
    });
    const unique = new Map();
    tiers.forEach((tier) => unique.set(tier.min, tier));
    return [...unique.values()].sort((a, b) => a.min - b.min);
  }

  function calculatePricing() {
    let unitPrice = state.basePrice;
    promotionTiers().forEach((tier) => {
      if (state.quantity >= tier.min) unitPrice = tier.price;
    });

    const subtotal = unitPrice * state.quantity;
    const regularSubtotal = state.basePrice * state.quantity;
    const saving = Math.max(0, regularSubtotal - subtotal);
    const localTotal = subtotal + LOCAL_FEE;
    const nationalNormal = subtotal + NATIONAL_FEE;
    const nationalReceive = nationalNormal * (1 + COD_RATE);

    return { unitPrice, subtotal, saving, localTotal, nationalNormal, nationalReceive };
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  /* ---------------- LIMPIEZA DEL MARCADOR DE GALERÍA ---------------- */
  function locateTextPosition(nodes, absoluteOffset) {
    let traversed = 0;
    for (const node of nodes) {
      const length = String(node.nodeValue || '').length;
      if (absoluteOffset <= traversed + length) {
        return { node, offset: Math.max(0, absoluteOffset - traversed) };
      }
      traversed += length;
    }
    const last = nodes[nodes.length - 1];
    return last ? { node: last, offset: String(last.nodeValue || '').length } : null;
  }

  function removeGalleryMarkerFromElement(element) {
    if (!element || !element.textContent?.includes(GALLERY_PREFIX)) return false;
    let changed = false;

    for (let pass = 0; pass < 6; pass += 1) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let combined = '';
      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
        combined += walker.currentNode.nodeValue || '';
      }

      const start = combined.indexOf(GALLERY_PREFIX);
      if (start < 0 || !nodes.length) break;
      const closing = combined.indexOf(']]', start + GALLERY_PREFIX.length);
      const end = closing >= 0 ? closing + 2 : combined.length;
      const startPosition = locateTextPosition(nodes, start);
      const endPosition = locateTextPosition(nodes, end);
      if (!startPosition || !endPosition) break;

      const range = document.createRange();
      range.setStart(startPosition.node, startPosition.offset);
      range.setEnd(endPosition.node, endPosition.offset);
      range.deleteContents();
      changed = true;
    }

    element.querySelectorAll('p, div, span').forEach((node) => {
      if (!node.textContent?.trim() && !node.children.length) node.remove();
    });
    return changed;
  }

  function scheduleGalleryCleanup(delay = 150) {
    window.setTimeout(() => {
      removeGalleryMarkerFromElement(document.getElementById('detailDescription'));
    }, delay);
  }

  /* ---------------- PROMOCIÓN CORRECTA POR PRODUCTO ---------------- */
  function buildTierPromotion(rule) {
    const unit = isDedales() ? 'cada par' : 'cada unidad';
    return `
      <div class="commerce-promo-heading">
        <span aria-hidden="true">🏷️</span>
        <div><strong>Oferta por cantidad</strong><small>${escapeHtml(rule.label || 'Precio especial por cantidad')}</small></div>
      </div>
      <div class="commerce-tier-grid">
        ${rule.tiers.map((tier) => `
          <div class="commerce-tier-card">
            <span>Desde ${Number(tier.minQty)}</span>
            <strong>${formatMoney(Number(tier.price))}</strong>
            <small>${unit}</small>
          </div>
        `).join('')}
      </div>`;
  }

  function buildGiftPromotion(rule) {
    const plural = rule.giftUnitPlural || 'unidades';
    const details = (rule.gifts || [])
      .map((gift) => `${Number(gift.minQty)}+ compra: ${Number(gift.giftQty)} ${plural} gratis`)
      .join(' · ');
    return `
      <div class="commerce-promo-heading">
        <span aria-hidden="true">🎁</span>
        <div><strong>Promoción activa</strong><small>${escapeHtml(rule.label || details || 'Regalo disponible')}</small></div>
      </div>
      ${details ? `<p class="commerce-gift-summary">${escapeHtml(details)}.</p>` : ''}`;
  }

  function enforceCorrectPromotion() {
    const description = document.getElementById('detailDescription');
    if (!description) return;

    const tierRule = matchingRule('tier_price');
    const giftRule = matchingRule('gift');
    const rule = tierRule || giftRule || null;
    const key = rule?.id || 'none';
    const existingCorrect = description.querySelector(`.detail-promo-box[data-sd-rule="${CSS.escape(key)}"]`);
    if (description.dataset.sdPromotionKey === key && (key === 'none' || existingCorrect)) return;

    description.querySelectorAll('.detail-promo-box').forEach((box) => box.remove());
    description.dataset.sdPromotionKey = key;
    if (!rule) return;

    const box = document.createElement('div');
    box.className = 'detail-promo-box';
    box.dataset.commerceEnhanced = 'true';
    box.dataset.sdRule = key;
    box.innerHTML = tierRule ? buildTierPromotion(tierRule) : buildGiftPromotion(giftRule);
    description.prepend(box);
  }

  /* ---------------- UBICACIÓN Y TIPO DE ENVÍO ---------------- */
  function ensureLocationSelector() {
    if (!PUBLIC) return;
    const quantityRow = document.querySelector('#detailCommercePanel .detail-commerce-quantity-row');
    if (!quantityRow) return;

    let selector = document.getElementById('detailLocationSelector');
    if (!selector) {
      selector = document.createElement('section');
      selector.id = 'detailLocationSelector';
      selector.className = 'detail-location-selector';
      selector.innerHTML = `
        <div class="detail-location-copy">
          <strong>¿Vives en Comayagua?</strong>
          <small>Selecciona tu ubicación para calcular el envío.</small>
        </div>
        <div class="detail-location-options" role="group" aria-label="Ubicación de entrega">
          <button type="button" data-detail-location="local" aria-pressed="false">Sí</button>
          <button type="button" data-detail-location="national" aria-pressed="false">No</button>
        </div>
        <p id="detailLocationHint" class="detail-location-hint">Selecciona Sí o No para continuar.</p>`;
      quantityRow.insertAdjacentElement('afterend', selector);
    }

    if (!document.getElementById('detailDeliverySelector')) {
      const delivery = document.createElement('section');
      delivery.id = 'detailDeliverySelector';
      delivery.className = 'detail-delivery-selector';
      delivery.hidden = true;
      selector.insertAdjacentElement('afterend', delivery);
    }
  }

  function renderLocationState() {
    if (!PUBLIC) return;
    document.querySelectorAll('[data-detail-location]').forEach((button) => {
      const active = button.dataset.detailLocation === state.location;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const hint = document.getElementById('detailLocationHint');
    if (!hint) return;
    if (state.location === 'local') {
      hint.innerHTML = '<strong>Solo casco urbano de Comayagua.</strong> Para aldeas, municipios cercanos o zonas fuera del casco urbano, el envío se cotiza por separado.';
    } else if (state.location === 'national') {
      hint.textContent = 'Ahora selecciona Envío normal o Pagar al recibir.';
    } else {
      hint.textContent = 'Selecciona Sí o No para continuar.';
    }
  }

  function renderDeliverySelector(pricing) {
    if (!PUBLIC) return;
    const panel = document.getElementById('detailDeliverySelector');
    if (!panel) return;

    if (!state.location) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }

    panel.hidden = false;
    if (state.location === 'local') {
      state.deliveryMode = 'local';
      panel.innerHTML = `
        <div class="detail-local-delivery-summary">
          <div><span>Entrega en casco urbano</span><small>Envío: ${formatMoney(LOCAL_FEE)}</small></div>
          <strong>${formatMoney(pricing.localTotal)}</strong>
        </div>`;
      return;
    }

    panel.innerHTML = `
      <div class="detail-delivery-copy">
        <strong>Elige el tipo de envío</strong>
        <small>El total ya incluye el producto y el envío.</small>
      </div>
      <div class="detail-delivery-options" role="group" aria-label="Tipo de envío nacional">
        <button type="button" data-detail-delivery="normal" class="${state.deliveryMode === 'normal' ? 'active' : ''}" aria-pressed="${state.deliveryMode === 'normal'}">
          <span>ENVÍO NORMAL</span>
          <strong>${formatMoney(pricing.nationalNormal)}</strong>
          <small>Depósito o transferencia antes de enviar.</small>
        </button>
        <button type="button" data-detail-delivery="receive" class="${state.deliveryMode === 'receive' ? 'active' : ''}" aria-pressed="${state.deliveryMode === 'receive'}">
          <span>PAGAR AL RECIBIR</span>
          <strong>${formatMoney(pricing.nationalReceive)}</strong>
          <small>Producto + envío de Lps.110.00, más 10%.</small>
        </button>
      </div>`;
  }

  function renderOriginalShipping(pricing) {
    const shipping = document.querySelector('#detailDialog .detail-shipping');
    if (PUBLIC) {
      if (shipping) shipping.hidden = true;
      return;
    }
    if (shipping) shipping.hidden = false;
    setText('detailShippingNormal', formatMoney(pricing.nationalNormal));
    setText('detailShippingReceive', formatMoney(pricing.nationalReceive));
  }

  /* ---------------- PANEL DE CANTIDAD Y TOTALES ---------------- */
  function renderCommerce() {
    if (state.syncing) return;
    state.syncing = true;
    try {
      const latestPrice = readDetailBasePrice();
      if (latestPrice > 0) state.basePrice = latestPrice;
      if (state.basePrice <= 0) return;

      const pricing = calculatePricing();
      setText('detailQuantityValue', String(state.quantity));
      setText('detailCommerceUnitLabel', unitLabel());
      setText('detailCommerceUnitPrice', formatMoney(pricing.unitPrice));
      setText('detailCommerceSubtotal', formatMoney(pricing.subtotal));
      setText('detailCommerceSaving', formatMoney(pricing.saving));

      const savingRow = document.getElementById('detailCommerceSavingRow');
      if (savingRow) savingRow.hidden = pricing.saving <= 0;

      const minus = document.getElementById('detailQuantityMinus');
      const plus = document.getElementById('detailQuantityPlus');
      if (minus) minus.disabled = state.quantity <= 1;
      if (plus) plus.disabled = state.quantity >= state.stock;

      ensureLocationSelector();
      renderLocationState();
      renderDeliverySelector(pricing);
      renderOriginalShipping(pricing);

      const incomplete = PUBLIC && (!state.location || (state.location === 'national' && !state.deliveryMode));
      const buy = document.getElementById('detailDirectBuyBtn');
      if (buy) {
        buy.disabled = incomplete;
        buy.textContent = !state.location
          ? 'Selecciona tu ubicación'
          : state.location === 'national' && !state.deliveryMode
            ? 'Selecciona el tipo de envío'
            : 'Comprar por WhatsApp';
      }
    } finally {
      state.syncing = false;
    }
  }

  function syncDetail(reset = false) {
    const dialog = document.getElementById('detailDialog');
    if (!dialog?.open) return;

    const price = readDetailBasePrice();
    if (price > 0) state.basePrice = price;
    state.stock = Math.max(1, Number(String(document.getElementById('detailStock')?.textContent || '1').replace(/\D/g, '')) || 1);
    if (reset) {
      state.quantity = 1;
      state.location = PUBLIC ? '' : 'national';
      state.deliveryMode = PUBLIC ? '' : 'normal';
      document.getElementById('detailDescription')?.removeAttribute('data-sd-promotion-key');
    }

    enforceCorrectPromotion();
    renderCommerce();
  }

  function setQuantity(next) {
    state.quantity = Math.max(1, Math.min(state.stock, Number(next) || 1));
    renderCommerce();
  }

  function setLocation(location) {
    state.location = location;
    state.deliveryMode = location === 'local' ? 'local' : '';
    renderCommerce();
  }

  function setDeliveryMode(mode) {
    if (state.location !== 'national') return;
    state.deliveryMode = mode;
    renderCommerce();
  }

  function sendDirectOrder() {
    if (PUBLIC && (!state.location || (state.location === 'national' && !state.deliveryMode))) return;
    const pricing = calculatePricing();
    const name = detailName();
    const divider = '━━━━━━━━━━━━';
    const lines = [
      '*SD COMAYAGUA*',
      '*COMPRA DESDE EL CATÁLOGO*',
      divider,
      '',
      `*Producto:* ${name}`,
      `*Cantidad:* ${state.quantity} ${unitLabel()}`,
      `*Precio por ${isDedales(name) ? 'par' : 'unidad'}:* ${formatMoney(pricing.unitPrice)}`,
      `*Subtotal:* ${formatMoney(pricing.subtotal)}`
    ];

    if (pricing.saving > 0) lines.push(`*Ahorro por promoción:* ${formatMoney(pricing.saving)}`);
    lines.push('', '*ENTREGA SELECCIONADA*', divider);

    if (PUBLIC && state.location === 'local') {
      lines.push(
        '*Ubicación:* Casco urbano de Comayagua',
        `*Envío local:* ${formatMoney(LOCAL_FEE)}`,
        `*Total final:* ${formatMoney(pricing.localTotal)}`,
        'Este precio aplica únicamente dentro del casco urbano.'
      );
    } else if (state.deliveryMode === 'receive') {
      lines.push(
        '*Ubicación:* Fuera de Comayagua',
        '*Modalidad:* Pagar al recibir',
        `*Envío:* ${formatMoney(NATIONAL_FEE)}`,
        `*Total final:* ${formatMoney(pricing.nationalReceive)}`,
        'El total corresponde a producto + envío, más 10%.'
      );
    } else {
      lines.push(
        '*Ubicación:* Fuera de Comayagua',
        '*Modalidad:* Envío normal',
        `*Envío:* ${formatMoney(NATIONAL_FEE)}`,
        `*Total final:* ${formatMoney(pricing.nationalNormal)}`,
        'Pago por depósito o transferencia antes de enviar.'
      );
    }

    lines.push('', '*Deseo confirmar esta compra.*', 'Quedo pendiente de las instrucciones para el pago y el envío.');
    const phone = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  /* ---------------- TARJETAS DEL CATÁLOGO ---------------- */
  function cardBasePrice(card) {
    const original = parseMoney(card.querySelector('.product-price')?.textContent);
    if (original > 0) return original;
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    return inventoryPriceByName(name);
  }

  function bestTierOffer(name, basePrice) {
    const rule = (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : []).find((item) => item?.type === 'tier_price' && ruleMatches(item, name));
    const tiers = rule?.tiers
      ?.map((tier) => ({ min: Number(tier.minQty), price: Number(tier.price) }))
      .filter((tier) => Number.isFinite(tier.min) && Number.isFinite(tier.price) && tier.min > 0 && tier.price > 0) || [];
    const offer = tiers.sort((a, b) => a.price - b.price || b.min - a.min)[0];
    return offer && offer.price < basePrice ? offer : null;
  }

  function normalizeCard(card) {
    if (!card) return;
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    const basePrice = cardBasePrice(card);
    if (!basePrice) return;

    card.querySelectorAll('.commerce-card-price').forEach((element) => element.remove());
    card.querySelectorAll('.product-meta, .product-private-grid, .product-stats').forEach((element) => {
      element.hidden = true;
      element.style.setProperty('display', 'none', 'important');
    });

    const originalPrice = card.querySelector('.product-price');
    if (originalPrice) originalPrice.style.setProperty('display', 'none', 'important');

    const offer = bestTierOffer(name, basePrice);
    const priceBox = document.createElement('div');
    priceBox.className = `commerce-card-price ${offer ? 'has-offer' : 'single-price'}`;
    priceBox.innerHTML = offer
      ? `<div class="commerce-card-price-before"><span>ANTES</span><del>${formatMoney(basePrice)}</del></div><div class="commerce-card-price-now"><span>AHORA</span><strong>${formatMoney(offer.price)}</strong><small>desde ${offer.min} ${isDedales(name) ? 'pares' : 'unidades'}</small></div>`
      : `<div class="commerce-card-price-now"><span>PRECIO</span><strong>${formatMoney(basePrice)}</strong><small>precio actual</small></div>`;

    const productName = card.querySelector('.product-name');
    if (productName) productName.insertAdjacentElement('afterend', priceBox);
    else (card.querySelector('.product-content') || card).appendChild(priceBox);
    card.dataset.commercePriceV3 = 'true';
  }

  function normalizeCards(root = document) {
    root.querySelectorAll?.('#productGrid .product-card').forEach(normalizeCard);
  }

  /* ---------------- EVENTOS Y OBSERVADORES ---------------- */
  function scheduleToastRemoval(toast) {
    if (!toast || toast.dataset.autoRemoveV3 === 'true') return;
    toast.dataset.autoRemoveV3 = 'true';
    window.setTimeout(() => toast.remove(), 2300);
  }

  function handleCaptureClick(event) {
    const card = event.target.closest?.('#productGrid .product-card');
    if (card) {
      state.lastCardName = card.querySelector('.product-name')?.textContent?.trim() || '';
      state.lastCardPrice = cardBasePrice(card);
    }

    const minus = event.target.closest?.('#detailQuantityMinus');
    if (minus) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setQuantity(state.quantity - 1);
      return;
    }

    const plus = event.target.closest?.('#detailQuantityPlus');
    if (plus) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setQuantity(state.quantity + 1);
      return;
    }

    const location = event.target.closest?.('[data-detail-location]');
    if (location) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setLocation(location.dataset.detailLocation || '');
      return;
    }

    const delivery = event.target.closest?.('[data-detail-delivery]');
    if (delivery) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setDeliveryMode(delivery.dataset.detailDelivery || '');
      return;
    }

    const buy = event.target.closest?.('#detailDirectBuyBtn');
    if (buy) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendDirectOrder();
    }
  }

  function initObservers() {
    const dialog = document.getElementById('detailDialog');
    if (dialog) {
      new MutationObserver(() => {
        if (!dialog.open) return;
        window.setTimeout(() => syncDetail(true), 35);
        [150, 340, 700].forEach((delay) => {
          window.setTimeout(() => {
            scheduleGalleryCleanup(0);
            syncDetail(false);
          }, delay);
        });
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    const description = document.getElementById('detailDescription');
    if (description) {
      let cleanupTimer = 0;
      new MutationObserver(() => {
        if (!description.textContent?.includes(GALLERY_PREFIX)) return;
        window.clearTimeout(cleanupTimer);
        cleanupTimer = window.setTimeout(() => removeGalleryMarkerFromElement(description), 145);
      }).observe(description, { childList: true, subtree: true, characterData: true });
    }

    const price = document.getElementById('detailPrice');
    if (price) {
      new MutationObserver(() => {
        if (document.getElementById('detailDialog')?.open) renderCommerce();
      }).observe(price, { childList: true, subtree: true, characterData: true });
    }

    const grid = document.getElementById('productGrid');
    if (grid) {
      let gridTimer = 0;
      new MutationObserver(() => {
        window.clearTimeout(gridTimer);
        gridTimer = window.setTimeout(() => normalizeCards(grid), 35);
      }).observe(grid, { childList: true, subtree: true });
    }

    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches('.toast')) scheduleToastRemoval(node);
        node.querySelectorAll?.('.toast').forEach(scheduleToastRemoval);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    normalizeCards();
    document.querySelectorAll('.toast').forEach(scheduleToastRemoval);
    initObservers();
    window.addEventListener('click', handleCaptureClick, true);
    window.setTimeout(normalizeCards, 700);
    window.setTimeout(normalizeCards, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
