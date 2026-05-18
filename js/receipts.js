import { state } from './state.js';
import { formatMoney, escapeHtml } from './utils.js';
import { buildWhatsAppMessage, buildWhatsAppMessagePart, openWhatsApp } from './whatsapp.js';

export function renderReceipt(document, type='venta') {
  const id = document.venta_id || document.cotizacion_id || 'SIN-ID';
  const items = JSON.parse(document.productos_json || '[]');
  const rows = items.map(i => `<tr><td>${escapeHtml(i.nombre)}${i.color ? '<br><small>' + escapeHtml(i.color) + '</small>' : ''}</td><td>${i.qty}</td><td>${formatMoney(i.precio, state.settings)}</td><td>${formatMoney(i.precio * i.qty - (i.discount||0), state.settings)}</td></tr>`).join('');
  const html = `<article class="receipt" id="receiptPrintArea">
    <div class="receipt-header"><img class="receipt-logo" src="assets/logo-sdc-receipt.svg" alt="Logo SD COMAYAGUA"><h2>${escapeHtml(state.settings.storeName)}</h2></div>
    <p><strong>${type === 'venta' ? 'Recibo de venta' : 'Cotización'}</strong> · ${escapeHtml(id)}<br>Fecha: ${new Date(document.fecha).toLocaleString('es-HN')}<br>WhatsApp: ${escapeHtml(state.settings.whatsapp)}</p>
    <p>Cliente: <strong>${escapeHtml(document.cliente || '')}</strong><br>Teléfono: ${escapeHtml(document.telefono || '')}<br>Estado: ${escapeHtml(document.estado || '')}</p>
    <table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="margin-top:12px">
      ${line('Subtotal', document.subtotal)}${line('Envío', document.envio)}${line('Comisión COD', document.comision)}${line('Descuento', -document.descuento)}${line('Total', document.total, true)}
    </div>
    ${document.observaciones ? `<p><strong>Observaciones:</strong> ${escapeHtml(document.observaciones)}</p>` : ''}
    <p>Gracias por preferir ${escapeHtml(state.settings.storeName)}.</p>
  </article>
  <div class="form-actions no-print sdc-whatsapp-actions">
    <button class="btn ghost" onclick="window.print()">Imprimir / capturar</button>
    <button class="btn primary" id="receiptWhatsappPart1Btn">WhatsApp Parte 1</button>
    <button class="btn primary" id="receiptWhatsappPart2Btn">WhatsApp Parte 2</button>
    <button class="btn secondary" id="receiptWhatsappBtn">WhatsApp completo</button>
  </div>`;
  setTimeout(() => documentBindWhatsApp(document, type), 0);
  return html;
}
function line(label, value, total=false) { return `<div class="summary-line ${total ? 'total' : ''}"><span>${label}</span><strong>${formatMoney(value, state.settings)}</strong></div>`; }
function documentBindWhatsApp(doc, type) {
  const phone = doc.telefono || state.settings.whatsapp;
  const part1 = window.document.getElementById('receiptWhatsappPart1Btn');
  const part2 = window.document.getElementById('receiptWhatsappPart2Btn');
  const full = window.document.getElementById('receiptWhatsappBtn');
  if (part1) part1.onclick = () => openWhatsApp(buildWhatsAppMessagePart(doc, type, '1'), phone);
  if (part2) part2.onclick = () => openWhatsApp(buildWhatsAppMessagePart(doc, type, '2'), phone);
  if (full) full.onclick = () => openWhatsApp(buildWhatsAppMessage(doc, type), phone);
}
