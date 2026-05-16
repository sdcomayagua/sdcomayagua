import { state, setSales, enqueueAction } from './state.js';
import { persistAll } from './data.js';
import { clearCart, calculateCartTotals } from './cart.js';
import { adjustProductStock } from './products.js';
import { validateCartForSale } from './validators.js';
import { toast, openModal } from './ui.js';
import { uid, nowISO, escapeHtml, formatMoney } from './utils.js';
import { renderReceipt } from './receipts.js';

export function createSaleFromCart() {
  const validation = validateCartForSale(state.cart);
  if (!validation.ok) return toast(validation.errors.join(' '), 'err', 5200);
  const totals = calculateCartTotals();
  const sale = {
    venta_id: uid('VENTA'), fecha: nowISO(), cliente: state.cart.customer?.nombre || 'Cliente contado', telefono: state.cart.customer?.telefono || '',
    departamento: state.cart.customer?.departamento || '', municipio: state.cart.customer?.municipio || '', direccion: state.cart.customer?.direccion || '',
    tipo_entrega: state.cart.deliveryType, metodo_pago: state.cart.cod ? 'Pago contra entrega' : 'No definido', estado: 'Confirmada', observaciones: state.cart.notes || '',
    productos_json: JSON.stringify(state.cart.items), subtotal: totals.subtotal, descuento: totals.discount, envio: totals.shipping, comision: totals.commission, total: totals.total,
    syncStatus: 'pendiente'
  };
  for (const item of state.cart.items) {
    const res = adjustProductStock(item.codigo, -item.qty, item.color);
    if (!res.ok) return toast(res.error, 'err');
  }
  setSales([sale, ...state.sales]);
  enqueueAction({ type:'saveSale', payload:{ sale } });
  persistAll();
  clearCart();
  toast('Venta registrada y stock descontado localmente.', 'ok');
  openModal('Recibo de venta', renderReceipt(sale, 'venta'));
}

export function renderSalesView() {
  const rows = state.sales.length ? state.sales.map(s => `
    <tr><td>${escapeHtml(s.venta_id)}</td><td>${new Date(s.fecha).toLocaleString('es-HN')}</td><td>${escapeHtml(s.cliente)}</td><td>${escapeHtml(s.telefono)}</td><td><span class="badge ok">${escapeHtml(s.estado)}</span></td><td>${formatMoney(s.total, state.settings)}</td><td><button class="mini-btn" data-view-sale="${escapeHtml(s.venta_id)}">Recibo</button></td></tr>`).join('') : `<tr><td colspan="7">No hay ventas registradas.</td></tr>`;
  return `<section class="card"><div class="toolbar"><h2>Ventas</h2><span class="badge">${state.sales.length} ventas</span></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
export function bindSalesEvents(root=document) {
  root.querySelectorAll('[data-view-sale]').forEach(btn => btn.addEventListener('click', () => {
    const sale = state.sales.find(s => s.venta_id === btn.dataset.viewSale);
    if (sale) openModal('Recibo de venta', renderReceipt(sale, 'venta'));
  }));
}
