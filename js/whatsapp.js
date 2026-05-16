import { state } from './state.js';
import { formatMoney, escapeHtml } from './utils.js';

export function buildProductWhatsApp(product) {
  return `Hola, me interesa este producto de ${state.settings.storeName}:\n\n*${product.nombre}*\nCódigo: ${product.codigo}\nPrecio: ${formatMoney(product.precio, state.settings)}\nStock: ${product.stock}\n${product.promos ? 'Promo: ' + product.promos + '\n' : ''}\n¿Está disponible?`;
}
export function buildWhatsAppMessage(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = JSON.parse(document.productos_json || '[]');
  const lines = items.map(i => `• ${i.nombre}${i.color ? ' (' + i.color + ')' : ''} x${i.qty} - ${formatMoney(i.precio * i.qty - (i.discount||0), state.settings)}`).join('\n');
  return `*${state.settings.storeName}*\n${type === 'venta' ? 'Pedido/Venta' : 'Cotización'}: ${id}\nFecha: ${new Date(document.fecha).toLocaleString('es-HN')}\n\nCliente: ${document.cliente || ''}\nTeléfono: ${document.telefono || ''}\n\n${lines}\n\nSubtotal: ${formatMoney(document.subtotal, state.settings)}\nEnvío: ${formatMoney(document.envio, state.settings)}\nComisión: ${formatMoney(document.comision, state.settings)}\nDescuento: ${formatMoney(document.descuento, state.settings)}\n*Total: ${formatMoney(document.total, state.settings)}*\n\nEstado: ${document.estado}\nGracias por preferirnos.`;
}
export function openWhatsApp(message, phone=state.settings.whatsapp) {
  const clean = String(phone || '').replace(/[^0-9]/g,'');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
export function renderWhatsAppPreview(message) {
  return `<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre><div class="form-actions"><button class="btn primary" id="openWhatsAppPreview">Abrir WhatsApp</button></div>`;
}
