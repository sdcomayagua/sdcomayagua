// SD COMAYAGUA · Zonas de entrega de Comayagua para el carrito público.
(() => {
  'use strict';

  const IS_PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (!IS_PUBLIC) return;

  const CART_KEY = 'sd_comayagua_client_cart_v1';
  const ACTIVE_KEY = 'sd_comayagua_remote_delivery_active_v1';
  const ZONE_KEY = 'sd_comayagua_remote_delivery_zone_v1';
  const WHATSAPP = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
  const formatter = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const ZONES = [
    { id: 'ajuterique', label: 'Ajuterique', price: 80 },
    { id: 'lejamani', label: 'Lejamaní', price: 85 },
    { id: 'villa-san-antonio', label: 'Villa de San Antonio', price: 80 },
    { id: 'flores', label: 'Flores', price: 70 },
    { id: 'la-paz', label: 'La Paz', price: 110 },
    { id: 'el-pajonal', label: 'El Pajonal', price: 50 },
    { id: 'el-sifon', label: 'El Sifón', price: 50 },
    { id: 'jarin', label: 'Jarín', price: 40 },
    { id: 'los-mangos', label: 'Los Mangos', price: null }
  ];

  let remoteActive = localStorage.getItem(ACTIVE_KEY) === '1';
  let selectedZoneId = localStorage.getItem(ZONE_KEY) || '';
  let syncQueued = false;
  let observer = null;

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

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function setHtml(node, value) {
    if (node && node.innerHTML !== value) node.innerHTML = value;
  }

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value.filter((item) => item?.name) : [];
    } catch {
      return [];
    }
  }

  function selectedZone() {
    return ZONES.find((zone) => zone.id === selectedZoneId) || null;
  }

  function subtotal() {
    return readCart().reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1), 0);
  }

  function persist() {
    localStorage.setItem(ACTIVE_KEY, remoteActive ? '1' : '0');
    if (selectedZoneId) localStorage.setItem(ZONE_KEY, selectedZoneId);
    else localStorage.removeItem(ZONE_KEY);
  }

  function notify(message) {
    const toast = qs('#sdCartToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(Number(toast.dataset.remoteTimer || 0));
    toast.dataset.remoteTimer = String(window.setTimeout(() => toast.classList.remove('show'), 2300));
  }

  function markStandardOptions(options) {
    qsa('label.sd-cart-delivery-option', options).forEach((label) => {
      const input = qs('input[name="sdDeliveryMode"]', label);
      if (!input) return;
      label.classList.add(`sd-delivery-${input.value}`);

      if (input.value === 'local') {
        setText(qs('strong', label), 'Casco urbano');
        setText(qs('span', label), 'Comayagua · Lps.40');
      }
    });
  }

  function createRemoteOption(options) {
    let card = qs('#sdRemoteZoneOption', options);
    if (card) return card;

    card = document.createElement('section');
    card.id = 'sdRemoteZoneOption';
    card.className = 'sd-remote-zone-option';
    card.innerHTML = `
      <button class="sd-remote-zone-toggle" type="button" data-remote-action="activate" aria-expanded="false">
        <span class="sd-remote-zone-toggle-copy">
          <strong>Zonas alejadas</strong>
          <small id="sdRemoteZoneSummary">Elegir sector · precio varía</small>
        </span>
        <span class="sd-remote-zone-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="sd-remote-zone-picker" hidden>
        <label for="sdRemoteZoneSelect">Sector o municipio</label>
        <select id="sdRemoteZoneSelect">
          <option value="">Seleccionar zona</option>
          ${ZONES.map((zone) => `<option value="${zone.id}">${escapeHtml(zone.label)} — ${zone.price == null ? 'precio por definir' : money(zone.price)}</option>`).join('')}
        </select>
        <div id="sdRemoteZonePrice" class="sd-remote-zone-price">Selecciona una zona para calcular el envío.</div>
      </div>
    `;

    const localLabel = qs('.sd-delivery-local', options);
    if (localLabel) localLabel.insertAdjacentElement('afterend', card);
    else options.prepend(card);

    qs('[data-remote-action="activate"]', card)?.addEventListener('click', () => {
      remoteActive = true;
      persist();
      sync();
      qs('#sdRemoteZoneSelect', card)?.focus({ preventScroll: true });
    });

    qs('#sdRemoteZoneSelect', card)?.addEventListener('change', (event) => {
      selectedZoneId = event.target.value;
      remoteActive = true;
      persist();
      sync();
    });

    return card;
  }

  function updateRemoteOption(card) {
    const zone = selectedZone();
    const select = qs('#sdRemoteZoneSelect', card);
    const summary = qs('#sdRemoteZoneSummary', card);
    const price = qs('#sdRemoteZonePrice', card);
    const picker = qs('.sd-remote-zone-picker', card);
    const toggle = qs('.sd-remote-zone-toggle', card);

    if (select && select.value !== selectedZoneId) select.value = selectedZoneId;
    card.classList.toggle('selected', remoteActive);
    if (picker) picker.hidden = !remoteActive;
    if (toggle?.getAttribute('aria-expanded') !== String(remoteActive)) {
      toggle.setAttribute('aria-expanded', String(remoteActive));
    }

    if (!zone) {
      setText(summary, 'Elegir sector · precio varía');
      setText(price, 'Selecciona una zona para calcular el envío.');
      return;
    }

    if (zone.price == null) {
      setText(summary, `${zone.label} · precio por definir`);
      setHtml(price, `<strong>${escapeHtml(zone.label)}</strong><span>El precio del envío se confirma por WhatsApp.</span>`);
    } else {
      setText(summary, `${zone.label} · ${money(zone.price)}`);
      setHtml(price, `<strong>${escapeHtml(zone.label)}</strong><span>Envío: ${money(zone.price)}</span>`);
    }
  }

  function uncheckStandardDelivery() {
    if (!remoteActive) return;
    qsa('#sdClientCartPanel input[name="sdDeliveryMode"]').forEach((input) => {
      if (input.checked) input.checked = false;
    });
  }

  function renderRemoteTotals() {
    if (!remoteActive) return;
    const totals = qs('#sdCartTotals');
    if (!totals) return;

    const zone = selectedZone();
    const productSubtotal = subtotal();
    const shippingKnown = Boolean(zone && zone.price != null);
    const shipping = shippingKnown ? Number(zone.price) : 0;
    const signature = `${selectedZoneId}|${productSubtotal}|${shippingKnown ? shipping : 'pending'}`;

    if (totals.dataset.sdRemoteSignature === signature && qs('.sd-remote-total-summary', totals)) return;

    totals.dataset.sdRemoteSignature = signature;
    totals.innerHTML = `
      <div class="sd-remote-total-summary">
        <div class="sd-cart-total-row"><span>Total de productos</span><strong>${money(productSubtotal)}</strong></div>
        <div class="sd-cart-total-row"><span>Envío${zone ? ` · ${escapeHtml(zone.label)}` : ''}</span><strong>${zone ? (shippingKnown ? money(shipping) : 'Por definir') : 'Seleccionar zona'}</strong></div>
        <div class="sd-cart-total-row grand"><span>${shippingKnown ? 'Total final' : 'Total parcial'}</span><strong>${money(productSubtotal + shipping)}</strong></div>
        ${zone && !shippingKnown ? '<small class="sd-remote-total-note">El total final se confirma cuando se defina el precio del envío.</small>' : ''}
      </div>
    `;
  }

  function buildRemoteQuote() {
    const zone = selectedZone();
    const cart = readCart();
    if (!zone || !cart.length) return '';

    const productSubtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1), 0);
    const shippingKnown = zone.price != null;
    const shipping = shippingKnown ? Number(zone.price) : 0;
    const lines = ['Hola, deseo cotizar los siguientes productos:', ''];

    cart.forEach((item, index) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const unitPrice = Number(item.price) || 0;
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`Cantidad: ${qty}`);
      lines.push(`Precio unitario: ${money(unitPrice)}`);
      lines.push(`Subtotal: ${money(unitPrice * qty)}`, '');
    });

    lines.push(`🛒 Total de productos: ${money(productSubtotal)}`);
    lines.push(`📍 Entrega: zona alejada de Comayagua — ${zone.label}`);
    lines.push(`🚚 Envío: ${shippingKnown ? money(shipping) : 'precio por definir'}`);

    if (shippingKnown) {
      lines.push(`✅ Total final: ${money(productSubtotal + shipping)}`);
    } else {
      lines.push(`✅ Total parcial: ${money(productSubtotal)}`);
      lines.push('El total final queda pendiente hasta confirmar el precio del envío.');
    }

    lines.push('', '¿Me confirma disponibilidad y los datos necesarios para realizar el pedido?');
    return lines.join('\n');
  }

  async function copyRemoteQuote() {
    const text = buildRemoteQuote();
    if (!text) {
      notify(selectedZone() ? 'Agrega productos al carrito.' : 'Selecciona la zona de entrega.');
      return;
    }

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

  function sendRemoteWhatsApp() {
    const text = buildRemoteQuote();
    if (!text) {
      notify(selectedZone() ? 'Agrega productos al carrito.' : 'Selecciona la zona de entrega.');
      return;
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function bindPanel(panel) {
    if (panel.dataset.sdRemoteZonesBound === '1') return;
    panel.dataset.sdRemoteZonesBound = '1';

    panel.addEventListener('change', (event) => {
      const standard = event.target.closest('input[name="sdDeliveryMode"]');
      if (!standard) return;
      remoteActive = false;
      persist();
      scheduleSync();
    }, true);

    panel.addEventListener('click', (event) => {
      if (!remoteActive) return;
      const action = event.target.closest('[data-cart-action="copy"], [data-cart-action="whatsapp"]');
      if (!action) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (action.dataset.cartAction === 'copy') copyRemoteQuote();
      if (action.dataset.cartAction === 'whatsapp') sendRemoteWhatsApp();
    }, true);
  }

  function observe() {
    if (!observer) return;
    observer.disconnect();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function sync() {
    syncQueued = false;
    observer?.disconnect();

    try {
      const panel = qs('#sdClientCartPanel');
      if (!panel) return;

      bindPanel(panel);
      const options = qs('.sd-cart-delivery-options', panel);
      if (!options) return;

      markStandardOptions(options);
      const card = createRemoteOption(options);
      updateRemoteOption(card);
      uncheckStandardDelivery();
      renderRemoteTotals();
    } finally {
      observe();
    }
  }

  function scheduleSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    observer = new MutationObserver(scheduleSync);
    sync();
    observe();
    window.addEventListener('pageshow', scheduleSync);
    [100, 300, 700, 1200, 2200, 3800].forEach((delay) => setTimeout(scheduleSync, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
