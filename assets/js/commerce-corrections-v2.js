// SD COMAYAGUA · Correcciones comerciales V2
// Repara precios dinámicos, ubicación del cliente, tarjetas y avisos.
(() => {
  'use strict';

  const PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(window.location.pathname);
  const LOCAL_FEE = 35;
  const NATIONAL_FEE = 110;
  const COD_RATE = 0.10;
  const INVENTORY_KEY = 'sd_comayagua_products';
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const state = {
    quantity: 1,
    stock: 1,
    basePrice: 0,
    lastCardPrice: 0,
    lastCardName: '',
    location: PUBLIC ? '' : 'national',
    syncing: false
  };

  function parseMoney(value) {
    const normalized = String(value || '')
      .replace(/[^0-9.,-]/g, '')
      .replace(/,/g, '');
    const parsed = Number(normalized);
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

  function readInventory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function inventoryPriceByName(name) {
    const target = normalizeText(name);
    if (!target) return 0;
    const product = readInventory().find((item) => normalizeText(item?.name) === target);
    return Number(product?.price || 0);
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

  function matchingTierRule(name) {
    const haystack = normalizeText(name);
    return (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : []).find((rule) => {
      if (rule?.type !== 'tier_price' || !Array.isArray(rule.tiers)) return false;
      const match = rule.match || {};
      const all = !match.all?.length || match.all.every((token) => haystack.includes(normalizeText(token)));
      const any = !match.any?.length || match.any.some((token) => haystack.includes(normalizeText(token)));
      const excluded = match.exclude?.some((token) => haystack.includes(normalizeText(token)));
      return all && any && !excluded;
    });
  }

  function detailPromotionTiers() {
    const tiers = [];
    const description = document.getElementById('detailDescription');

    description?.querySelectorAll('.commerce-tier-card').forEach((card) => {
      const minimum = Number(card.querySelector('span')?.textContent?.match(/\d+/)?.[0]);
      const price = parseMoney(card.querySelector('strong')?.textContent);
      if (Number.isFinite(minimum) && price > 0) tiers.push({ min: minimum, price });
    });

    const raw = description?.textContent || '';
    [...raw.matchAll(/(\d+)\+\s*Lps?\.?\s*([0-9.,]+)/gi)].forEach((match) => {
      tiers.push({ min: Number(match[1]), price: parseMoney(match[2]) });
    });

    if (!tiers.length) {
      const rule = matchingTierRule(detailName());
      rule?.tiers?.forEach((tier) => tiers.push({ min: Number(tier.minQty), price: Number(tier.price) }));
    }

    tiers.push({ min: 1, price: state.basePrice });
    const unique = new Map();
    tiers
      .filter((tier) => Number.isFinite(tier.min) && Number.isFinite(tier.price) && tier.price > 0)
      .forEach((tier) => unique.set(tier.min, tier));
    return [...unique.values()].sort((a, b) => a.min - b.min);
  }

  function calculatePricing() {
    let unitPrice = state.basePrice;
    detailPromotionTiers().forEach((tier) => {
      if (state.quantity >= tier.min) unitPrice = tier.price;
    });

    const subtotal = unitPrice * state.quantity;
    const regularSubtotal = state.basePrice * state.quantity;
    const saving = Math.max(0, regularSubtotal - subtotal);
    const localTotal = subtotal + LOCAL_FEE;
    const nationalNormal = subtotal + NATIONAL_FEE;
    const nationalReceive = nationalNormal * (1 + COD_RATE);

    return {
      unitPrice,
      subtotal,
      saving,
      localTotal,
      nationalNormal,
      nationalReceive
    };
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function ensureLocationSelector() {
    if (!PUBLIC) return;
    const quantityRow = document.querySelector('#detailCommercePanel .detail-commerce-quantity-row');
    if (!quantityRow || document.getElementById('detailLocationSelector')) return;

    const selector = document.createElement('section');
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
      <p id="detailLocationHint" class="detail-location-hint">Selecciona Sí o No para continuar.</p>
    `;
    quantityRow.insertAdjacentElement('afterend', selector);
  }

  function renderLocationState() {
    if (!PUBLIC) return;
    document.querySelectorAll('[data-detail-location]').forEach((button) => {
      const active = button.dataset.detailLocation === state.location;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const hint = document.getElementById('detailLocationHint');
    if (hint) {
      hint.textContent = state.location === 'local'
        ? 'Entrega en Comayagua: Lps.35.00.'
        : state.location === 'national'
          ? 'Envío nacional disponible: normal o pagar al recibir.'
          : 'Selecciona Sí o No para continuar.';
    }
  }

  function renderShipping(pricing) {
    const normalRow = document.querySelector('#detailDialog .shipping-row.normal');
    const receiveRow = document.querySelector('#detailDialog .shipping-row.receive');
    const normalLabel = normalRow?.querySelector('span');
    const normalNote = normalRow?.querySelector('small');
    const receiveLabel = receiveRow?.querySelector('span');
    const receiveNote = receiveRow?.querySelector('small');

    if (PUBLIC && !state.location) {
      if (normalLabel) normalLabel.textContent = 'Selecciona tu ubicación';
      if (normalNote) normalNote.textContent = 'Indica si vives en Comayagua para mostrar el total correcto.';
      setText('detailShippingNormal', '—');
      if (receiveRow) receiveRow.hidden = true;
      return;
    }

    if (PUBLIC && state.location === 'local') {
      if (normalLabel) normalLabel.textContent = 'Entrega en Comayagua';
      if (normalNote) normalNote.textContent = 'Servicio a domicilio: Lps.35.00.';
      setText('detailShippingNormal', formatMoney(pricing.localTotal));
      if (receiveRow) receiveRow.hidden = true;
      return;
    }

    if (normalLabel) normalLabel.textContent = 'Envío normal';
    if (normalNote) normalNote.textContent = 'Depósito o transferencia antes de enviar el paquete. Envío: Lps.110.00.';
    setText('detailShippingNormal', formatMoney(pricing.nationalNormal));

    if (receiveRow) receiveRow.hidden = false;
    if (receiveLabel) receiveLabel.textContent = 'Pagar al recibir';
    if (receiveNote) receiveNote.textContent = 'Producto + Lps.110.00 de envío, más 10% sobre ese resultado.';
    setText('detailShippingReceive', formatMoney(pricing.nationalReceive));
  }

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
      renderShipping(pricing);

      const buy = document.getElementById('detailDirectBuyBtn');
      if (buy) {
        buy.disabled = PUBLIC && !state.location;
        buy.textContent = PUBLIC && !state.location ? 'Selecciona tu ubicación' : 'Comprar por WhatsApp';
      }
    } finally {
      state.syncing = false;
    }
  }

  function syncDetail(resetQuantity = false) {
    const dialog = document.getElementById('detailDialog');
    if (!dialog?.open) return;

    const price = readDetailBasePrice();
    if (price > 0) state.basePrice = price;
    state.stock = Math.max(1, Number(String(document.getElementById('detailStock')?.textContent || '1').replace(/\D/g, '')) || 1);
    if (resetQuantity) {
      state.quantity = 1;
      state.location = PUBLIC ? '' : 'national';
    }
    renderCommerce();
  }

  function setQuantity(next) {
    state.quantity = Math.max(1, Math.min(state.stock, Number(next) || 1));
    renderCommerce();
  }

  function sendDirectOrder() {
    if (PUBLIC && !state.location) return;
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

    lines.push('', '*ENTREGA*', divider);
    if (PUBLIC && state.location === 'local') {
      lines.push(
        '*Ubicación:* Comayagua',
        `*Servicio a domicilio:* ${formatMoney(LOCAL_FEE)}`,
        `*Total final:* ${formatMoney(pricing.localTotal)}`
      );
    } else {
      lines.push(
        '*Ubicación:* Fuera de Comayagua',
        `1. *Envío normal:* ${formatMoney(pricing.nationalNormal)}`,
        '   Depósito o transferencia antes de enviar.',
        `2. *Pagar al recibir:* ${formatMoney(pricing.nationalReceive)}`,
        '   Incluye Lps.110.00 de envío y 10% sobre producto + envío.'
      );
    }

    lines.push('', '*Deseo confirmar esta compra.*', 'Quedo pendiente de las instrucciones para el pago y el envío.');
    const phone = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function cardBasePrice(card) {
    const existing = parseMoney(card.querySelector('.product-price')?.textContent);
    if (existing > 0) return existing;
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    return inventoryPriceByName(name);
  }

  function bestTierPrice(name, basePrice) {
    const rule = matchingTierRule(name);
    const prices = rule?.tiers?.map((tier) => Number(tier.price)).filter((value) => Number.isFinite(value) && value > 0) || [];
    return prices.length ? Math.min(basePrice, ...prices) : basePrice;
  }

  function normalizeCard(card) {
    if (!card || card.dataset.commercePriceV2 === 'true') return;
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    const basePrice = cardBasePrice(card);
    if (!basePrice) return;

    card.dataset.commercePriceV2 = 'true';
    card.querySelectorAll('.product-meta, .product-private-grid, .product-stats').forEach((element) => {
      element.hidden = true;
      element.style.setProperty('display', 'none', 'important');
    });

    const originalPrice = card.querySelector('.product-price');
    if (originalPrice) originalPrice.style.setProperty('display', 'none', 'important');

    const bestPrice = bestTierPrice(name, basePrice);
    const priceBox = document.createElement('div');
    priceBox.className = `commerce-card-price ${bestPrice < basePrice ? 'has-offer' : 'single-price'}`;
    priceBox.innerHTML = bestPrice < basePrice
      ? `<div class="commerce-card-price-before"><span>ANTES</span><del>${formatMoney(basePrice)}</del></div><div class="commerce-card-price-now"><span>AHORA</span><strong>Desde ${formatMoney(bestPrice)}</strong></div>`
      : `<div class="commerce-card-price-now"><span>PRECIO</span><strong>${formatMoney(basePrice)}</strong></div>`;

    const content = card.querySelector('.product-content') || card;
    const productName = card.querySelector('.product-name');
    if (productName) productName.insertAdjacentElement('afterend', priceBox);
    else content.appendChild(priceBox);
  }

  function normalizeCards(root = document) {
    root.querySelectorAll?.('#productGrid .product-card').forEach(normalizeCard);
  }

  function scheduleToastRemoval(toast) {
    if (!toast || toast.dataset.autoRemoveV2 === 'true') return;
    toast.dataset.autoRemoveV2 = 'true';
    window.setTimeout(() => toast.remove(), 2400);
  }

  function cleanExistingToasts() {
    document.querySelectorAll('.toast').forEach(scheduleToastRemoval);
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
      state.location = location.dataset.detailLocation || '';
      renderCommerce();
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
        [30, 120, 260, 520, 850].forEach((delay, index) => {
          window.setTimeout(() => syncDetail(index === 0), delay);
        });
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    const price = document.getElementById('detailPrice');
    if (price) {
      new MutationObserver(() => {
        if (document.getElementById('detailDialog')?.open) syncDetail(false);
      }).observe(price, { childList: true, subtree: true, characterData: true });
    }

    const grid = document.getElementById('productGrid');
    if (grid) {
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (node.matches('.product-card')) normalizeCard(node);
            normalizeCards(node);
          });
        });
      }).observe(grid, { childList: true, subtree: true });
    }

    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('.toast')) scheduleToastRemoval(node);
          node.querySelectorAll?.('.toast').forEach(scheduleToastRemoval);
        });
      });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    normalizeCards();
    cleanExistingToasts();
    initObservers();
    document.addEventListener('click', handleCaptureClick, true);
    window.setTimeout(normalizeCards, 700);
    window.setTimeout(normalizeCards, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
