import { state } from './state.js';
import { formatMoney, escapeHtml } from './utils.js';

function number(value) {
  return Number(value || 0) || 0;
}

function codCommission(base) {
  const rate = number(state.settings.codCommissionRate || 0.06);
  const raw = Math.max(0, number(base)) * rate;
  if (raw <= 0) return 0;
  return Math.ceil(raw) + 1;
}

function cleanPhone(phone='') {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function parsePromoLines(text='') {
  return String(text || '')
    .split(/[|;,\n]+/)
    .map(part => {
      const match = part.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
      if (!match) return null;
      const qty = Number(match[1]);
      const total = Number(String(match[2]).replace(/,/g, '')) || 0;
      if (!qty || !total) return null;
      return `${qty} ${qty === 1 ? 'Par' : 'Pares'} - ${formatMoney(total, state.settings)}`;
    })
    .filter(Boolean);
}

function imageLine(product) {
  return product.imagen ? `\nFoto: ${product.imagen}` : '';
}

export function buildProductWhatsApp(product) {
  const promoLines = parsePromoLines(product.promos);
  const promoBlock = promoLines.length
    ? `\n\nPromociones por cantidad:\n${promoLines.map(line => `- ${line}`).join('\n')}`
    : '';
  return `Hola, me interesa este producto de ${state.settings.storeName}:\n\nProducto: ${product.nombre}\nCodigo: ${product.codigo}\nPrecio: ${formatMoney(product.precio, state.settings)}\nStock disponible: ${product.stock}${imageLine(product)}${promoBlock}\n\nEsta disponible para entrega?`;
}

function safeItems(document) {
  try { return JSON.parse(document.productos_json || '[]'); }
  catch (_) { return []; }
}

function correctedTotals(document) {
  const subtotal = number(document.subtotal);
  const descuento = number(document.descuento);
  const envio = number(document.envio);
  let comision = number(document.comision);
  const neto = Math.max(0, subtotal - descuento);

  // Si la cotizacion/venta ya trae comision, se recalcula con la regla correcta:
  // (subtotal - descuento + envio) x 6%, redondeado hacia arriba, + Lps. 1.
  if (comision > 0) {
    comision = codCommission(neto + envio);
  }

  const total = Math.max(0, neto + envio + comision);
  return { subtotal, descuento, envio, comision, total };
}

export function buildWhatsAppMessage(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = safeItems(document);
  const totals = correctedTotals(document);
  const title = type === 'venta' ? 'Pedido/Venta' : 'Cotizacion';
  const fecha = document.fecha ? new Date(document.fecha).toLocaleString('es-HN') : new Date().toLocaleString('es-HN');
  const lines = items.map((i, index) => {
    const qty = number(i.qty) || 1;
    const lineTotal = number(i.total || i.subtotal || (number(i.precio) * qty - number(i.discount)));
    return `${index + 1}. ${i.nombre || 'Producto'}${i.color ? ` (${i.color})` : ''}\n   Cantidad: ${qty}\n   Total: ${formatMoney(lineTotal, state.settings)}`;
  }).join('\n');

  return `${state.settings.storeName}\n\n${title}: ${id}\nFecha: ${fecha}\n\nCliente: ${document.cliente || ''}\nTelefono: ${document.telefono || ''}\n\nProductos:\n${lines}\n\nSubtotal: ${formatMoney(totals.subtotal, state.settings)}\nEnvio: ${formatMoney(totals.envio, state.settings)}\nComision: ${formatMoney(totals.comision, state.settings)}\nDescuento: ${formatMoney(totals.descuento, state.settings)}\n\nTotal a pagar: ${formatMoney(totals.total, state.settings)}\n\nEstado: ${document.estado || ''}\n\nGracias por preferirnos.`;
}

export function openWhatsApp(message, phone=state.settings.whatsapp) {
  const clean = cleanPhone(phone);
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function renderWhatsAppPreview(message) {
  return `<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre><div class="form-actions"><button class="btn primary" id="openWhatsAppPreview">Abrir WhatsApp</button></div>`;
}
