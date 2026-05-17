import { state } from './state.js';
import { formatMoney, escapeHtml } from './utils.js';

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
  return product.imagen ? `\n🖼️ *Foto:* ${product.imagen}` : '';
}

export function buildProductWhatsApp(product) {
  const promoLines = parsePromoLines(product.promos);
  const promoBlock = promoLines.length
    ? `\n\n🎁 *Promociones por cantidad:*\n${promoLines.map(line => `• ${line}`).join('\n')}`
    : '';
  return `Hola, me interesa este producto de *${state.settings.storeName}*:\n\n📌 *Producto:* *${product.nombre}*\n🔖 *Código:* *${product.codigo}*\n💰 *Precio:* *${formatMoney(product.precio, state.settings)}*\n📦 *Stock disponible:* *${product.stock}*${imageLine(product)}${promoBlock}\n\n¿Está disponible para entrega?`;
}

export function buildWhatsAppMessage(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = JSON.parse(document.productos_json || '[]');
  const lines = items.map(i => `• *${i.nombre}*${i.color ? ` (${i.color})` : ''}\n  Cantidad: *${i.qty}*\n  Total: *${formatMoney(i.precio * i.qty - (i.discount || 0), state.settings)}*`).join('\n');
  return `🛍️ *${state.settings.storeName}*\n\n📄 *${type === 'venta' ? 'Pedido/Venta' : 'Cotización'}:* *${id}*\n📅 *Fecha:* *${new Date(document.fecha).toLocaleString('es-HN')}*\n\n👤 *Cliente:* *${document.cliente || ''}*\n📞 *Teléfono:* *${document.telefono || ''}*\n\n📦 *Productos:*\n${lines}\n\n💵 *Subtotal:* *${formatMoney(document.subtotal, state.settings)}*\n🚚 *Envío:* *${formatMoney(document.envio, state.settings)}*\n📦 *Comisión:* *${formatMoney(document.comision, state.settings)}*\n🏷️ *Descuento:* *${formatMoney(document.descuento, state.settings)}*\n\n✅ *Total a pagar:* *${formatMoney(document.total, state.settings)}*\n\n📌 *Estado:* *${document.estado}*\n\nGracias por preferirnos.`;
}

export function openWhatsApp(message, phone=state.settings.whatsapp) {
  const clean = String(phone || '').replace(/[^0-9]/g,'');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function renderWhatsAppPreview(message) {
  return `<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre><div class="form-actions"><button class="btn primary" id="openWhatsAppPreview">Abrir WhatsApp</button></div>`;
}
