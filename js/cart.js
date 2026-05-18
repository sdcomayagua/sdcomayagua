import { state, setCart } from './state.js';
import { persistAll } from './data.js';
import { toast } from './ui.js';
import { parseNumber, parseColorStock, formatMoney, escapeHtml, uid } from './utils.js';

export function addToCart(code, mode='sale') {
  const product = state.products.find(p => p.codigo === code);
  if (!product) return toast('Producto no encontrado.', 'err');
  if (!product.activo || parseNumber(product.stock) <= 0) return toast('Este producto no está disponible.', 'warn');
  const colors = parseColorStock(product.colores);
  const firstColor = colors.find(c => c.qty > 0)?.color || '';
  const existing = state.cart.items.find(i => i.codigo === code && (!colors.length || i.color === firstColor));
  if (existing) {
    const max = getAvailableStock(product, existing.color);
    if (existing.qty + 1 > max) return toast('No hay más stock disponible para ese producto/color.', 'warn');
    existing.qty += 1;
  } else {
    state.cart.items.push({
      lineId: uid('LINE'),
      codigo: product.codigo,
      nombre: product.nombre,
      precio: parseNumber(product.precio),
      costo: parseNumber(product.costo),
      qty: 1,
      color: firstColor,
      colorRequired: colors.length > 0,
      availableStock: getAvailableStock(product, firstColor),
      discount: 0,
      mode,
    });
  }
  setCart({ items: [...state.cart.items] });
  persistAll();
  toast('Producto agregado al carrito.', 'ok');
}

export function removeFromCart(lineId) {
  setCart({ items: state.cart.items.filter(i => i.lineId !== lineId) });
  persistAll();
}

export function updateCartLine(lineId, patch) {
  const item = state.cart.items.find(i => i.lineId === lineId);
  if (!item) return;
  if ('color' in patch) {
    const product = state.products.find(p => p.codigo === item.codigo);
    item.color = patch.color;
    item.availableStock = getAvailableStock(product, item.color);
    if (item.qty > item.availableStock) item.qty = item.availableStock;
  }
  if ('qty' in patch) item.qty = Math.max(1, Math.min(parseNumber(patch.qty, 1), parseNumber(item.availableStock, 1)));
  if ('discount' in patch) item.discount = Math.max(0, parseNumber(patch.discount));
  setCart({ items: [...state.cart.items] });
  persistAll();
}

export function updateCartOptions(patch) {
  setCart(patch);
  persistAll();
}

export function clearCart() {
  setCart({ items: [], discount: 0, customer: {}, notes: '', cod: false, deliveryType: 'envio_normal' });
  persistAll();
}

export function getAvailableStock(product, color='') {
  if (!product) return 0;
  const colors = parseColorStock(product.colores);
  if (colors.length && color) return parseNumber(colors.find(c => c.color === color)?.qty, 0);
  return parseNumber(product.stock);
}

export function parsePromoRules(text='') {
  return String(text || '')
    .split(/[|;,\n]+/)
    .map(part => {
      const match = part.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
      if (!match) return null;
      const qty = parseInt(match[1], 10);
      const total = parseNumber(String(match[2]).replace(/,/g, ''));
      if (!qty || total <= 0) return null;
      return { qty, total };
    })
    .filter(Boolean)
    .sort((a, b) => a.qty - b.qty);
}

export function calculatePromoPrice(qty, unitPrice, promoText='') {
  const amount = Math.max(1, Math.floor(parseNumber(qty, 1)));
  const unit = parseNumber(unitPrice);
  const base = amount * unit;
  const rules = parsePromoRules(promoText);
  if (!rules.length) return { total: base, base, discount: 0, applied: null, rules };

  const exact = rules.find(rule => rule.qty === amount);
  if (exact) return { total: exact.total, base, discount: Math.max(0, base - exact.total), applied: exact, rules };

  const best = Array(amount + 1).fill(Infinity);
  const combo = Array(amount + 1).fill(null);
  best[0] = 0;

  for (let current = 1; current <= amount; current++) {
    const unitTotal = best[current - 1] + unit;
    if (unitTotal < best[current]) {
      best[current] = unitTotal;
      combo[current] = { qty: 1, total: unit, previous: current - 1, unit: true };
    }
    rules.forEach(rule => {
      if (rule.qty <= current && best[current - rule.qty] + rule.total < best[current]) {
        best[current] = best[current - rule.qty] + rule.total;
        combo[current] = { ...rule, previous: current - rule.qty };
      }
    });
  }

  const total = Number.isFinite(best[amount]) ? Math.min(base, best[amount]) : base;
  return { total, base, discount: Math.max(0, base - total), applied: combo[amount], rules };
}

function getLinePricing(item) {
  const product = state.products.find(p => p.codigo === item.codigo);
  const promo = calculatePromoPrice(item.qty, item.precio, product?.promos || '');
  const manualDiscount = parseNumber(item.discount);
  return {
    ...promo,
    total: Math.max(0, promo.total - manualDiscount),
    promoDiscount: promo.discount,
    manualDiscount,
    product,
  };
}

function calculateCodCommission(base, config=state.settings) {
  const rate = parseNumber(config.codCommissionRate || 0.06);
  const raw = Math.max(0, parseNumber(base)) * rate;
  if (raw <= 0) return 0;
  return Math.ceil(raw) + 1;
}

export function calculateCartTotals(cart=state.cart, config=state.settings) {
  const subtotal = cart.items.reduce((sum, item) => {
    const product = state.products.find(p => p.codigo === item.codigo);
    const promo = calculatePromoPrice(item.qty, item.precio, product?.promos || '');
    return sum + Math.max(0, promo.total - parseNumber(item.discount));
  }, 0);
  const discount = parseNumber(cart.discount);
  const netProducts = Math.max(0, subtotal - discount);
  const shipping = cart.deliveryType === 'sin_envio' || cart.deliveryType === 'entrega_local' ? 0 : (cart.cod ? config.codShipping : config.normalShipping);
  const commissionBase = netProducts + shipping;
  const commission = cart.cod ? calculateCodCommission(commissionBase, config) : 0;
  const total = Math.max(0, netProducts + shipping + commission);
  const cost = cart.items.reduce((sum, item) => sum + item.qty * parseNumber(item.costo), 0);
  return { subtotal, discount, shipping, commission, total, cost, estimatedProfit: total - shipping - commission - cost };
}

export function renderCartView() {
  const totals = calculateCartTotals();
  const lines = state.cart.items.length ? state.cart.items.map(renderCartLine).join('') : '<div class="empty">El carrito está vacío. Agrega productos desde el catálogo o inventario.</div>';
  return `
  <section class="cart-layout">
    <div class="card">
      <div class="toolbar"><h2>Carrito</h2><button class="btn ghost" data-clear-cart>Limpiar</button></div>
      <div class="cart-list">${lines}</div>
    </div>
    <aside class="card">
      <h2>Resumen</h2>
      <label>Cliente <input id="cartCustomerName" value="${escapeHtml(state.cart.customer?.nombre || '')}" placeholder="Nombre del cliente"></label><br>
      <label>Teléfono <input id="cartCustomerPhone" value="${escapeHtml(state.cart.customer?.telefono || '')}" placeholder="504... o +504..."></label><br>
      <label>Tipo de entrega
        <select id="deliveryType">
          <option value="envio_normal" ${state.cart.deliveryType === 'envio_normal' ? 'selected' : ''}>Envío normal</option>
          <option value="entrega_local" ${state.cart.deliveryType === 'entrega_local' ? 'selected' : ''}>Entrega local</option>
          <option value="sin_envio" ${state.cart.deliveryType === 'sin_envio' ? 'selected' : ''}>Sin envío</option>
        </select>
      </label><br>
      <label class="switch-row"><input id="codToggle" type="checkbox" ${state.cart.cod ? 'checked' : ''}> Pago contra entrega / COD</label><br>
      <label>Descuento general <input id="cartDiscount" type="number" min="0" value="${state.cart.discount || 0}"></label><br>
      <label>Observaciones <textarea id="cartNotes" rows="3">${escapeHtml(state.cart.notes || '')}</textarea></label>
      <div style="margin-top:14px">
        ${summaryLine('Subtotal', totals.subtotal)}
        ${summaryLine('Descuento', -totals.discount)}
        ${summaryLine('Envío', totals.shipping)}
        ${summaryLine('Comisión COD', totals.commission)}
        ${summaryLine('Total', totals.total, true)}
      </div>
      <div class="form-actions">
        <button class="btn secondary" data-save-quote>Crear cotización</button>
        <button class="btn primary" data-save-sale>Registrar venta</button>
        <button class="btn ghost sdc-cancel-cart-btn" type="button" data-cancel-cart>Cancelar carrito</button>
      </div>
    </aside>
  </section>`;
}

function summaryLine(label, value, total=false) {
  return `<div class="summary-line ${total ? 'total' : ''}"><span>${label}</span><strong>${formatMoney(value, state.settings)}</strong></div>`;
}

function promoHint(pricing) {
  if (!pricing.rules.length) return '';
  const rules = pricing.rules.slice(0, 10).map(rule => `
    <span class="sdc-offer-chip">
      <b>${rule.qty} x ${formatMoney(rule.total, state.settings)}</b>
      <small>${formatMoney(rule.total / rule.qty, state.settings)} c/u</small>
    </span>`).join('');
  const saved = pricing.promoDiscount > 0 ? `<strong class="sdc-promo-saved">Ahorro ${formatMoney(pricing.promoDiscount, state.settings)}</strong>` : '';
  return `<div class="sdc-offers-panel"><span class="sdc-offers-title">Ofertas por cantidad</span><div class="sdc-offer-chips">${rules}</div>${saved}</div>`;
}

function renderCartLine(item) {
  const product = state.products.find(p => p.codigo === item.codigo);
  const colors = parseColorStock(product?.colores || '');
  const colorSelect = colors.length ? `<select data-cart-color="${item.lineId}">${colors.map(c=>`<option value="${escapeHtml(c.color)}" ${c.color === item.color ? 'selected' : ''} ${c.qty <= 0 ? 'disabled' : ''}>${escapeHtml(c.color)} (${c.qty})</option>`).join('')}</select>` : '';
  const pricing = getLinePricing(item);
  const priceNote = pricing.promoDiscount > 0
    ? `<small class="sdc-line-note">Normal ${formatMoney(pricing.base, state.settings)} · Promo ${formatMoney(pricing.total, state.settings)}</small>`
    : `<small class="sdc-line-note">${formatMoney(item.precio, state.settings)} c/u</small>`;
  return `<div class="cart-line">
    <div><strong>${escapeHtml(item.nombre)}</strong><br><small style="color:var(--muted)">${escapeHtml(item.codigo)} ${item.color ? '· ' + escapeHtml(item.color) : ''}</small></div>
    <div class="cart-controls">
      ${colorSelect}
      <input type="number" min="1" max="${item.availableStock}" value="${item.qty}" data-cart-qty="${item.lineId}" aria-label="Cantidad">
      <span>${formatMoney(pricing.total, state.settings)}${priceNote}</span>
      <button class="mini-btn" data-remove-cart="${item.lineId}">Quitar</button>
    </div>
    ${promoHint(pricing)}
  </div>`;
}

export function bindCartEvents(root=document) {
  root.querySelectorAll('[data-remove-cart]').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.removeCart)));
  root.querySelectorAll('[data-cart-qty]').forEach(input => input.addEventListener('change', () => updateCartLine(input.dataset.cartQty, { qty: input.value })));
  root.querySelectorAll('[data-cart-color]').forEach(select => select.addEventListener('change', () => updateCartLine(select.dataset.cartColor, { color: select.value })));
  root.querySelector('[data-clear-cart]')?.addEventListener('click', clearCart);
  root.querySelector('[data-cancel-cart]')?.addEventListener('click', clearCart);
  root.querySelector('#deliveryType')?.addEventListener('change', e => updateCartOptions({ deliveryType: e.target.value }));
  root.querySelector('#codToggle')?.addEventListener('change', e => updateCartOptions({ cod: e.target.checked }));
  root.querySelector('#cartDiscount')?.addEventListener('change', e => updateCartOptions({ discount: parseNumber(e.target.value) }));
  root.querySelector('#cartNotes')?.addEventListener('change', e => updateCartOptions({ notes: e.target.value }));
  root.querySelector('#cartCustomerName')?.addEventListener('change', e => updateCartOptions({ customer: { ...state.cart.customer, nombre: e.target.value } }));
  root.querySelector('#cartCustomerPhone')?.addEventListener('change', e => updateCartOptions({ customer: { ...state.cart.customer, telefono: e.target.value } }));
}
