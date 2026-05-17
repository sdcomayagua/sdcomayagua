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
  return product.imagen ? `\n[Foto] ${product.imagen}` : '';
}

export function buildProductWhatsApp(product) {
  const promoLines = parsePromoLines(product.promos);
  const promoBlock = promoLines.length
    ? `\n\n*Promociones por cantidad*\n${promoLines.map(line => `- ${line}`).join('\n')}`
    : '';
  return `*${state.settings.storeName}*\n\n[Producto solicitado]\n- Nombre: ${product.nombre}\n- Codigo: ${product.codigo}\n- Precio: ${formatMoney(product.precio, state.settings)}\n- Stock disponible: ${product.stock}${imageLine(product)}${promoBlock}\n\nEsta disponible para entrega?`;
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

  if (comision > 0) {
    comision = codCommission(neto + envio);
  }

  const total = Math.max(0, neto + envio + comision);
  return { subtotal, descuento, envio, comision, total, envioMasComision: envio + comision };
}

function customerBlock(document) {
  const rows = [];
  rows.push(`- Nombre: ${document.cliente || 'Cliente'}`);
  if (document.telefono) rows.push(`- Telefono: ${document.telefono}`);
  const location = [document.departamento, document.municipio].filter(Boolean).join(' / ');
  if (location) rows.push(`- Ubicacion: ${location}`);
  if (document.direccion) rows.push(`- Direccion: ${document.direccion}`);
  return rows.join('\n');
}

function deliveryMode(document, totals) {
  if (totals.comision > 0) return 'Pagar al recibir / COD';
  if (totals.envio > 0) return 'Envio normal';
  return 'Sin envio';
}

function titleText(type) {
  return type === 'venta' ? 'PEDIDO / VENTA' : 'COTIZACION';
}

function productLines(items) {
  return items.map((i, index) => {
    const qty = number(i.qty) || 1;
    const unit = number(i.precio);
    const lineTotal = number(i.total || i.subtotal || (unit * qty - number(i.discount)));
    return `${index + 1}) *${i.nombre || 'Producto'}*${i.color ? ` (${i.color})` : ''}\n   - Cantidad: ${qty}\n   - Precio: ${formatMoney(unit, state.settings)} c/u\n   - Total: ${formatMoney(lineTotal, state.settings)}`;
  }).join('\n\n');
}

function partOne(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = safeItems(document);
  const totals = correctedTotals(document);
  const fecha = document.fecha ? new Date(document.fecha).toLocaleString('es-HN') : new Date().toLocaleString('es-HN');

  return `*${titleText(type)} - ${state.settings.storeName}*\n` +
    `*PARTE 1 de 2: Datos y productos*\n\n` +
    `[Codigo] ${id}\n` +
    `[Fecha] ${fecha}\n` +
    `[Estado] ${document.estado || ''}\n\n` +
    `*CLIENTE*\n${customerBlock(document)}\n\n` +
    `*PRODUCTOS*\n${productLines(items) || '- Sin productos'}\n\n` +
    `*ENTREGA*\n` +
    `- Modalidad: ${deliveryMode(document, totals)}\n` +
    `- Envio: ${formatMoney(totals.envio, state.settings)}\n\n` +
    `[OK] En el siguiente mensaje te envio el resumen final de pago.`;
}

function partTwo(document, type='venta') {
  const totals = correctedTotals(document);
  const codNote = totals.comision > 0
    ? `\n\n*NOTA SOBRE COMISION*\nComision calculada sobre producto + envio al 6%, redondeada hacia arriba.`
    : '';

  return `*RESUMEN DE PAGO - ${state.settings.storeName}*\n` +
    `*PARTE 2 de 2: Total final*\n\n` +
    `[Productos] *${formatMoney(totals.subtotal, state.settings)}*\n` +
    `[Envio] *${formatMoney(totals.envio, state.settings)}*\n` +
    `[Comision COD] *${formatMoney(totals.comision, state.settings)}*\n` +
    `[Descuento] *${formatMoney(totals.descuento, state.settings)}*\n\n` +
    `*TOTAL A PAGAR: ${formatMoney(totals.total, state.settings)}*` +
    `${codNote}\n\n` +
    `------------------------------\n\n` +
    `*IMPORTANTE*\n\n` +
    `Cotizacion pendiente de confirmacion.\n` +
    `No aparta producto.\n` +
    `Antes de pagar, confirme disponibilidad, entrega y total final.\n\n` +
    `------------------------------\n\n` +
    `*${state.settings.storeName}*\n` +
    `WhatsApp: ${state.settings.whatsapp || ''}`;
}

export function buildWhatsAppMessagePart(document, type='venta', part='full') {
  if (part === '1' || part === 1 || part === 'parte1') return partOne(document, type);
  if (part === '2' || part === 2 || part === 'parte2') return partTwo(document, type);
  return `${partOne(document, type)}\n\n------------------------------\n\n${partTwo(document, type)}`;
}

export function buildWhatsAppMessage(document, type='venta') {
  return buildWhatsAppMessagePart(document, type, 'full');
}

export function openWhatsApp(message, phone=state.settings.whatsapp) {
  const clean = cleanPhone(phone);
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function renderWhatsAppPreview(message) {
  return `<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre><div class="form-actions"><button class="btn primary" id="openWhatsAppPreview">Abrir WhatsApp</button></div>`;
}
