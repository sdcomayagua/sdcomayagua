import { state, setQuotes, enqueueAction } from './state.js';
import { persistAll } from './data.js';
import { clearCart, calculateCartTotals } from './cart.js';
import { validateCartForSale } from './validators.js';
import { toast, openModal } from './ui.js';
import { uid, nowISO, escapeHtml, formatMoney } from './utils.js';
import { renderReceipt } from './receipts.js';
import { buildWhatsAppMessage, openWhatsApp } from './whatsapp.js';

export function createQuoteFromCart() {
  const validation = validateCartForSale(state.cart);
  if (!validation.ok) return toast(validation.errors.join(' '), 'err', 5200);
  const totals = calculateCartTotals();
  const quote = {
    cotizacion_id: uid('COT'), fecha: nowISO(), cliente: state.cart.customer?.nombre || 'Cliente', telefono: state.cart.customer?.telefono || '',
    estado: 'Nueva', observaciones: state.cart.notes || '', productos_json: JSON.stringify(state.cart.items), subtotal: totals.subtotal, descuento: totals.discount, envio: totals.shipping, comision: totals.commission, total: totals.total, syncStatus:'pendiente'
  };
  setQuotes([quote, ...state.quotes]);
  enqueueAction({ type:'saveQuote', payload:{ quote } });
  persistAll();
  clearCart();
  toast('Cotización guardada. No se descontó stock.', 'ok');
  openModal('Cotización', renderReceipt(quote, 'cotizacion'));
}
export function renderQuotesView() {
  const rows = state.quotes.length ? state.quotes.map(q => `
    <tr><td>${escapeHtml(q.cotizacion_id)}</td><td>${new Date(q.fecha).toLocaleString('es-HN')}</td><td>${escapeHtml(q.cliente)}</td><td>${escapeHtml(q.telefono)}</td><td><span class="badge">${escapeHtml(q.estado)}</span></td><td>${formatMoney(q.total, state.settings)}</td><td class="row-actions"><button class="mini-btn" data-view-quote="${escapeHtml(q.cotizacion_id)}">Ver</button><button class="mini-btn" data-whatsapp-quote="${escapeHtml(q.cotizacion_id)}">WhatsApp</button></td></tr>`).join('') : `<tr><td colspan="7">No hay cotizaciones registradas.</td></tr>`;
  return `<section class="card"><div class="toolbar"><h2>Cotizaciones</h2><span class="badge">${state.quotes.length} cotizaciones</span></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
export function bindQuotesEvents(root=document) {
  root.querySelectorAll('[data-view-quote]').forEach(btn => btn.addEventListener('click', () => {
    const quote = state.quotes.find(q => q.cotizacion_id === btn.dataset.viewQuote);
    if (quote) openModal('Cotización', renderReceipt(quote, 'cotizacion'));
  }));
  root.querySelectorAll('[data-whatsapp-quote]').forEach(btn => btn.addEventListener('click', () => {
    const quote = state.quotes.find(q => q.cotizacion_id === btn.dataset.whatsappQuote);
    if (quote) openWhatsApp(buildWhatsAppMessage(quote, 'cotizacion'));
  }));
}
