import { state } from './state.js';
import { formatMoney, escapeHtml } from './utils.js';
import { buildWhatsAppMessage, openWhatsApp } from './whatsapp.js';

export function renderReceipt(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = JSON.parse(document.productos_json || '[]');
  const rows = items.map(i => `<tr><td>${escapeHtml(i.nombre)}${i.color ? '<br><small>' + escapeHtml(i.color) + '</small>' : ''}</td><td>${i.qty}</td><td>${formatMoney(i.precio, state.settings)}</td><td>${formatMoney(i.precio * i.qty - (i.discount||0), state.settings)}</td></tr>`).join('');
  const html = `<article class="receipt" id="receiptPrintArea">
    <h2>${escapeHtml(state.settings.storeName)}</h2>
    <p><strong>${type === 'venta' ? 'Recibo de venta' : 'Cotización'}</strong> · ${escapeHtml(id)}<br>Fecha: ${new Date(document.fecha).toLocaleString('es-HN')}<br>WhatsApp: ${escapeHtml(state.settings.whatsapp)}</p>
    <p>Cliente: <strong>${escapeHtml(document.cliente || '')}</strong><br>Teléfono: ${escapeHtml(document.telefono || '')}<br>Estado: ${escapeHtml(document.estado || '')}</p>
    <table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="margin-top:12px">
      ${line('Subtotal', document.subtotal)}${line('Envío', document.envio)}${line('Comisión COD', document.comision)}${line('Descuento', -document.descuento)}${line('Total', document.total, true)}
    </div>
    ${document.observaciones ? `<p><strong>Observaciones:</strong> ${escapeHtml(document.observaciones)}</p>` : ''}
    <p>Gracias por preferir ${escapeHtml(state.settings.storeName)}.</p>
  </article>
  <div class="form-actions no-print"><button class="btn ghost" onclick="window.print()">Imprimir / capturar</button><button class="btn primary" id="receiptWhatsappBtn">Enviar WhatsApp</button></div>`;
  setTimeout(() => documentBindWhatsApp(document, type), 0);
  return html;
}
function line(label, value, total=false) { return `<div class="summary-line ${total ? 'total' : ''}"><span>${label}</span><strong>${formatMoney(value, state.settings)}</strong></div>`; }
function documentBindWhatsApp(doc, type) {
  const btn = window.document.getElementById('receiptWhatsappBtn');
  if (btn) btn.onclick = () => openWhatsApp(buildWhatsAppMessage(doc, type), doc.telefono || state.settings.whatsapp);
}
