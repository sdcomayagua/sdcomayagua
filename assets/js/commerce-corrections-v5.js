// SD COMAYAGUA · Corrección comercial estable V5
(() => {
  'use strict';

  const PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(location.pathname);
  const LOCAL = 35;
  const NATIONAL = 110;
  const RATE = 0.10;
  const GALLERY = '[[SD_GALLERY_V1:';
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const state = {
    qty: 1,
    stock: 1,
    price: 0,
    cardPrice: 0,
    cardName: '',
    location: PUBLIC ? '' : 'national',
    delivery: PUBLIC ? '' : 'normal'
  };

  const fmt = (value) => `Lps.${money.format(Number(value || 0))}`;
  const num = (value) => {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const name = () => document.getElementById('detailName')?.textContent?.trim() || state.cardName || 'Producto';
  const dedales = (value = name()) => /dedal/i.test(value);
  const unit = () => dedales() ? (state.qty === 1 ? 'par' : 'pares') : (state.qty === 1 ? 'unidad' : 'unidades');

  function inventory() {
    try {
      const data = JSON.parse(localStorage.getItem('sd_comayagua_products') || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function inventoryPrice(productName) {
    const target = norm(productName);
    return Number(inventory().find((item) => norm(item?.name) === target)?.price || 0);
  }

  function matches(promoRule, productName) {
    const text = norm(productName);
    const match = promoRule?.match || {};
    return (!match.all?.length || match.all.every((token) => text.includes(norm(token))))
      && (!match.any?.length || match.any.some((token) => text.includes(norm(token))))
      && !match.exclude?.some((token) => text.includes(norm(token)));
  }

  function rule(type, productName = name()) {
    return (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : [])
      .find((item) => item?.type === type && matches(item, productName));
  }

  function basePrice() {
    return num(document.getElementById('detailPrice')?.textContent) || state.cardPrice || inventoryPrice(name());
  }

  function roundedReceiveTotal(normalTotal) {
    const raw = Math.round(Number(normalTotal || 0) * (1 + RATE) * 100) / 100;
    return Number.isInteger(raw) ? raw : Math.ceil(raw) + 1;
  }

  function pricing() {
    let unitPrice = state.price;
    const tiers = rule('tier_price')?.tiers || [];
    tiers.forEach((tier) => {
      if (state.qty >= Number(tier.minQty)) unitPrice = Number(tier.price);
    });
    const subtotal = unitPrice * state.qty;
    const saving = Math.max(0, state.price * state.qty - subtotal);
    const localTotal = subtotal + LOCAL;
    const normal = subtotal + NATIONAL;
    const receive = roundedReceiveTotal(normal);
    return { unitPrice, subtotal, saving, localTotal, normal, receive };
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function removeGalleryMarker() {
    const root = document.getElementById('detailDescription');
    if (!root || !root.textContent?.includes(GALLERY)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let text = '';
    while (walker.nextNode()) {
      nodes.push({ node: walker.currentNode, start: text.length });
      text += walker.currentNode.nodeValue || '';
    }
    const start = text.indexOf(GALLERY);
    if (start < 0 || !nodes.length) return;
    const close = text.indexOf(']]', start + GALLERY.length);
    const end = close >= 0 ? close + 2 : text.length;
    const locate = (offset) => {
      const entry = [...nodes].reverse().find((item) => item.start <= offset) || nodes[0];
      return { node: entry.node, offset: Math.min(offset - entry.start, String(entry.node.nodeValue || '').length) };
    };
    const a = locate(start);
    const b = locate(end);
    const range = document.createRange();
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
    range.deleteContents();
    root.querySelectorAll('p,div,span').forEach((node) => {
      if (!node.textContent?.trim() && !node.children.length) node.remove();
    });
  }

  function enforcePromotion() {
    const root = document.getElementById('detailDescription');
    if (!root) return;
    const tier = rule('tier_price');
    const gift = rule('gift');
    const selected = tier || gift;
    const key = selected?.id || 'none';
    const existing = [...root.querySelectorAll('.detail-promo-box')].find((box) => box.dataset.sdRule === key);
    if (root.dataset.sdPromotionKey === key && (key === 'none' || existing)) return;
    root.querySelectorAll('.detail-promo-box').forEach((box) => box.remove());
    root.dataset.sdPromotionKey = key;
    if (!selected) return;
    const box = document.createElement('div');
    box.className = 'detail-promo-box';
    box.dataset.commerceEnhanced = 'true';
    box.dataset.sdRule = key;
    if (tier) {
      box.innerHTML = `<div class="commerce-promo-heading"><span>🏷️</span><div><strong>Oferta por cantidad</strong><small>${esc(tier.label)}</small></div></div><div class="commerce-tier-grid">${tier.tiers.map((item) => `<div class="commerce-tier-card"><span>Desde ${Number(item.minQty)}</span><strong>${fmt(item.price)}</strong><small>${dedales() ? 'cada par' : 'cada unidad'}</small></div>`).join('')}</div>`;
    } else {
      const plural = gift.giftUnitPlural || 'unidades';
      const detail = (gift.gifts || []).map((item) => `${item.minQty}+ compra: ${item.giftQty} ${plural} gratis`).join(' · ');
      box.innerHTML = `<div class="commerce-promo-heading"><span>🎁</span><div><strong>Promoción activa</strong><small>${esc(gift.label || '')}</small></div></div><p class="commerce-gift-summary">${esc(detail)}.</p>`;
    }
    root.prepend(box);
  }

  function ensureSelectors() {
    if (!PUBLIC) return;
    const row = document.querySelector('#detailCommercePanel .detail-commerce-quantity-row');
    if (!row) return;
    if (!document.getElementById('detailLocationSelector')) {
      const locationBox = document.createElement('section');
      locationBox.id = 'detailLocationSelector';
      locationBox.className = 'detail-location-selector';
      locationBox.innerHTML = `<div class="detail-location-copy"><strong>¿Vives en Comayagua?</strong><small>Selecciona tu ubicación para calcular el envío.</small></div><div class="detail-location-options"><button type="button" data-detail-location="local">Sí</button><button type="button" data-detail-location="national">No</button></div><p id="detailLocationHint" class="detail-location-hint">Selecciona Sí o No para continuar.</p>`;
      row.insertAdjacentElement('afterend', locationBox);
    }
    if (!document.getElementById('detailDeliverySelector')) {
      const delivery = document.createElement('section');
      delivery.id = 'detailDeliverySelector';
      delivery.className = 'detail-delivery-selector';
      delivery.hidden = true;
      document.getElementById('detailLocationSelector').insertAdjacentElement('afterend', delivery);
    }
  }

  function renderSelectors(p) {
    if (!PUBLIC) return;
    ensureSelectors();
    document.querySelectorAll('[data-detail-location]').forEach((button) => {
      const active = button.dataset.detailLocation === state.location;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const hint = document.getElementById('detailLocationHint');
    const delivery = document.getElementById('detailDeliverySelector');
    if (!state.location) {
      if (hint) hint.textContent = 'Selecciona Sí o No para continuar.';
      if (delivery) delivery.hidden = true;
      return;
    }
    delivery.hidden = false;
    if (state.location === 'local') {
      state.delivery = 'local';
      if (hint) hint.innerHTML = '<strong>Solo casco urbano de Comayagua.</strong> Fuera del casco urbano, el envío se cotiza por separado.';
      delivery.innerHTML = `<div class="detail-local-delivery-summary"><div><span>Entrega en casco urbano</span><small>Subtotal ${fmt(p.subtotal)} + envío ${fmt(LOCAL)}</small></div><strong>${fmt(p.localTotal)}</strong></div>`;
      return;
    }
    if (hint) hint.textContent = 'Ahora selecciona Envío normal o Pagar al recibir.';
    delivery.innerHTML = `<div class="detail-delivery-copy"><strong>Elige el tipo de envío</strong><small>Los totales cambian automáticamente con la cantidad.</small></div><div class="detail-delivery-options"><button type="button" data-detail-delivery="normal" class="${state.delivery === 'normal' ? 'active' : ''}"><span>ENVÍO NORMAL</span><strong>${fmt(p.normal)}</strong><small>Subtotal ${fmt(p.subtotal)} + envío ${fmt(NATIONAL)}.</small></button><button type="button" data-detail-delivery="receive" class="${state.delivery === 'receive' ? 'active' : ''}"><span>PAGAR AL RECIBIR</span><strong>${fmt(p.receive)}</strong><small>Subtotal + envío, más 10%. Total redondeado.</small></button></div>`;
  }

  function render() {
    const price = basePrice();
    if (price > 0) state.price = price;
    if (!state.price) return;
    const p = pricing();
    setText('detailQuantityValue', state.qty);
    setText('detailCommerceUnitLabel', unit());
    setText('detailCommerceUnitPrice', fmt(p.unitPrice));
    setText('detailCommerceSubtotal', fmt(p.subtotal));
    setText('detailCommerceSaving', fmt(p.saving));
    const save = document.getElementById('detailCommerceSavingRow');
    if (save) save.hidden = p.saving <= 0;
    const minus = document.getElementById('detailQuantityMinus');
    const plus = document.getElementById('detailQuantityPlus');
    if (minus) minus.disabled = state.qty <= 1;
    if (plus) plus.disabled = state.qty >= state.stock;

    renderSelectors(p);

    const shipping = document.querySelector('#detailDialog .detail-shipping');
    if (PUBLIC && shipping) shipping.hidden = true;
    if (!PUBLIC) {
      if (shipping) shipping.hidden = false;
      setText('detailShippingNormal', fmt(p.normal));
      setText('detailShippingReceive', fmt(p.receive));
    }

    const buy = document.getElementById('detailDirectBuyBtn');
    if (!buy) return;
    if (!PUBLIC) {
      buy.disabled = false;
      buy.textContent = 'Cotizar';
      return;
    }
    const incomplete = !state.location || (state.location === 'national' && !state.delivery);
    buy.disabled = incomplete;
    buy.textContent = !state.location
      ? 'Selecciona tu ubicación'
      : state.location === 'national' && !state.delivery
        ? 'Selecciona el tipo de envío'
        : 'Comprar por WhatsApp';
  }

  function sync(reset = false) {
    if (!document.getElementById('detailDialog')?.open) return;
    state.price = basePrice() || state.price;
    state.stock = Math.max(1, Number(String(document.getElementById('detailStock')?.textContent || '1').replace(/\D/g, '')) || 1);
    if (reset) {
      state.qty = 1;
      state.location = PUBLIC ? '' : 'national';
      state.delivery = PUBLIC ? '' : 'normal';
      document.getElementById('detailDescription')?.removeAttribute('data-sd-promotion-key');
    }
    enforcePromotion();
    render();
  }

  function send() {
    if (!PUBLIC || !state.location || (state.location === 'national' && !state.delivery)) return;
    const p = pricing();
    const lines = ['*SD COMAYAGUA*', '*COMPRA DESDE EL CATÁLOGO*', '━━━━━━━━━━━━', '', `*Producto:* ${name()}`, `*Cantidad:* ${state.qty} ${unit()}`, `*Precio por ${dedales() ? 'par' : 'unidad'}:* ${fmt(p.unitPrice)}`, `*Subtotal:* ${fmt(p.subtotal)}`];
    if (p.saving > 0) lines.push(`*Ahorro por promoción:* ${fmt(p.saving)}`);
    lines.push('', '*ENTREGA SELECCIONADA*', '━━━━━━━━━━━━');
    if (state.location === 'local') {
      lines.push('*Ubicación:* Casco urbano de Comayagua', `*Envío local:* ${fmt(LOCAL)}`, `*Total final:* ${fmt(p.localTotal)}`, 'Aplica únicamente dentro del casco urbano.');
    } else if (state.delivery === 'receive') {
      lines.push('*Ubicación:* Fuera de Comayagua', '*Modalidad:* Pagar al recibir', `*Envío:* ${fmt(NATIONAL)}`, `*Total final:* ${fmt(p.receive)}`, 'Producto + envío, más 10%. Total redondeado sin fracciones.');
    } else {
      lines.push('*Ubicación:* Fuera de Comayagua', '*Modalidad:* Envío normal', `*Envío:* ${fmt(NATIONAL)}`, `*Total final:* ${fmt(p.normal)}`, 'Pago antes de enviar.');
    }
    lines.push('', '*Deseo confirmar esta compra.*');
    const phone = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
    location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function cardPrice(card) {
    return num(card.querySelector('.product-price')?.textContent) || inventoryPrice(card.querySelector('.product-name')?.textContent);
  }

  function normalizeCard(card) {
    if (!card) return;
    const productName = card.querySelector('.product-name')?.textContent?.trim() || '';
    const base = cardPrice(card);
    if (!base) return;
    const tiers = rule('tier_price', productName)?.tiers || [];
    const offer = tiers
      .map((item) => ({ min: Number(item.minQty), price: Number(item.price) }))
      .filter((item) => item.price > 0 && item.price < base)
      .sort((a, b) => a.price - b.price)[0] || null;
    const signature = `${base}|${offer ? `${offer.min}:${offer.price}` : 'regular'}`;
    if (card.dataset.commercePriceV5 === signature && card.querySelector('.commerce-card-price')) return;
    card.querySelectorAll('.commerce-card-price').forEach((node) => node.remove());
    card.querySelectorAll('.product-meta,.product-private-grid,.product-stats').forEach((node) => node.style.setProperty('display', 'none', 'important'));
    card.querySelector('.product-price')?.style.setProperty('display', 'none', 'important');
    const box = document.createElement('div');
    box.className = `commerce-card-price ${offer ? 'has-offer' : 'single-price'}`;
    box.innerHTML = offer
      ? `<div class="commerce-card-price-before"><span>ANTES</span><del>${fmt(base)}</del></div><div class="commerce-card-price-now"><span>AHORA</span><strong>${fmt(offer.price)}</strong><small>desde ${offer.min} ${dedales(productName) ? 'pares' : 'unidades'}</small></div>`
      : `<div class="commerce-card-price-now"><span>PRECIO</span><strong>${fmt(base)}</strong><small>precio actual</small></div>`;
    card.querySelector('.product-name')?.insertAdjacentElement('afterend', box);
    card.dataset.commercePriceV5 = signature;
  }

  function normalizeCards() {
    document.querySelectorAll('#productGrid .product-card').forEach(normalizeCard);
  }

  function click(event) {
    const card = event.target.closest?.('#productGrid .product-card');
    if (card) {
      state.cardName = card.querySelector('.product-name')?.textContent?.trim() || '';
      state.cardPrice = cardPrice(card);
    }
    if (event.target.closest?.('#detailQuantityMinus')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.qty = Math.max(1, state.qty - 1);
      render();
      return;
    }
    if (event.target.closest?.('#detailQuantityPlus')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.qty = Math.min(state.stock, state.qty + 1);
      render();
      return;
    }
    const locationButton = event.target.closest?.('[data-detail-location]');
    if (locationButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.location = locationButton.dataset.detailLocation;
      state.delivery = state.location === 'local' ? 'local' : '';
      render();
      return;
    }
    const deliveryButton = event.target.closest?.('[data-detail-delivery]');
    if (deliveryButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.delivery = deliveryButton.dataset.detailDelivery;
      render();
      return;
    }
    if (event.target.closest?.('#detailDirectBuyBtn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (PUBLIC) send();
      else document.getElementById('detailQuoteBtn')?.click();
    }
  }

  function init() {
    normalizeCards();
    window.addEventListener('click', click, true);
    const dialog = document.getElementById('detailDialog');
    if (dialog) new MutationObserver(() => {
      if (!dialog.open) return;
      setTimeout(() => sync(true), 35);
      [150, 350, 700].forEach((delay) => setTimeout(() => {
        removeGalleryMarker();
        sync(false);
      }, delay));
    }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    const description = document.getElementById('detailDescription');
    if (description) new MutationObserver(() => {
      if (description.textContent?.includes(GALLERY)) setTimeout(removeGalleryMarker, 145);
    }).observe(description, { childList: true, subtree: true, characterData: true });
    const grid = document.getElementById('productGrid');
    if (grid) new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('.product-card')) normalizeCard(node);
      node.querySelectorAll?.('.product-card').forEach(normalizeCard);
    }))).observe(grid, { childList: true });
    new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      const toasts = node.matches('.toast') ? [node] : [...node.querySelectorAll?.('.toast') || []];
      toasts.forEach((toast) => setTimeout(() => toast.remove(), 2300));
    }))).observe(document.body, { childList: true, subtree: true });
    setTimeout(normalizeCards, 700);
    setTimeout(normalizeCards, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
