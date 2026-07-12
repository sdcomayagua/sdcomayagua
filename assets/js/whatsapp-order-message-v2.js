// SD COMAYAGUA · Mensaje profesional de pedido por WhatsApp
(() => {
  'use strict';

  const IS_PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(window.location.pathname);
  if (!IS_PUBLIC) return;

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function moneyNumber(value) {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatMoney(value) {
    return `Lps.${Number(value || 0).toFixed(2)}`;
  }

  function phoneNumber() {
    return String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
  }

  function readOrderHeader(paper) {
    const spans = [...paper.querySelectorAll('.invoice-head small span')];
    const order = clean(spans[0]?.textContent).replace(/^No\.\s*/i, '');
    const date = clean(spans[1]?.textContent);
    return { order, date };
  }

  function readOrderItems(paper) {
    return [...paper.querySelectorAll('.invoice-item-row')].map((row, index) => {
      const rawName = clean(row.querySelector('.invoice-item-copy strong')?.textContent);
      const name = rawName.replace(/^\d+\.\s*/, '') || `Producto ${index + 1}`;
      const details = clean(row.querySelector('.invoice-item-copy > span')?.textContent);
      const subtotal = clean(row.querySelector(':scope > b')?.textContent);
      const promo = clean(row.querySelector('.invoice-promo-note')?.textContent);
      const gifts = [...row.querySelectorAll('.invoice-gift-note')].map((node) => clean(node.textContent)).filter(Boolean);
      const quantityMatch = details.match(/(\d+)\s+(unidad(?:es)?|par(?:es)?)/i);
      const unitPriceMatch = details.match(/(L(?:ps)?\.?\s*[0-9.,]+)\s*c\/u/i);
      const savingMatch = promo.match(/ahorro\s+(.+)$/i);
      const quantityNumber = quantityMatch ? Number(quantityMatch[1]) : 0;
      const quantityLabel = /dedal/i.test(name)
        ? (quantityNumber === 1 ? 'par' : 'pares')
        : (quantityMatch?.[2] || 'unidades');

      return {
        name,
        quantity: quantityMatch ? `${quantityNumber} ${quantityLabel}` : details.split('·')[0]?.trim() || '',
        unitPrice: unitPriceMatch ? clean(unitPriceMatch[1]).replace(/^L\s*/i, 'Lps.') : '',
        subtotal,
        promotion: promo ? 'Precio especial por cantidad aplicado' : '',
        saving: savingMatch ? clean(savingMatch[1]) : '',
        gifts
      };
    });
  }

  function readShipping(paper) {
    const normal = paper.querySelector('.invoice-option.normal');
    const receive = paper.querySelector('.invoice-option.receive');
    const local = paper.querySelector('.invoice-local-total');

    if (local) {
      const rows = [...local.querySelectorAll(':scope > div')].map((row) => ({
        label: clean(row.querySelector('span')?.textContent),
        amount: clean(row.querySelector('strong')?.textContent)
      }));
      return { mode: 'local', rows };
    }

    return {
      mode: 'ship',
      normal: normal ? {
        amount: clean(normal.querySelector('strong')?.textContent),
        saving: clean(normal.querySelector('.shipping-save')?.textContent).replace(/^Ahorras:\s*/i, '')
      } : null,
      receive: receive ? {
        amount: clean(receive.querySelector('strong')?.textContent)
      } : null
    };
  }

  function buildOrderMessage() {
    const paper = document.querySelector('#quotePreview .invoice-paper');
    if (!paper) {
      return [
        '*SD COMAYAGUA*',
        '*PEDIDO DESDE EL CATÁLOGO*',
        '',
        'Deseo confirmar mi pedido y continuar con la compra.'
      ].join('\n');
    }

    const divider = '━━━━━━━━━━━━';
    const header = readOrderHeader(paper);
    const items = readOrderItems(paper);
    const shipping = readShipping(paper);
    const productsTotal = items.reduce((sum, item) => sum + moneyNumber(item.subtotal), 0);
    const lines = [
      '*SD COMAYAGUA*',
      '*PEDIDO DESDE EL CATÁLOGO*',
      divider
    ];

    if (header.order) lines.push(`*No. de pedido:* ${header.order}`);
    if (header.date) lines.push(`*Fecha:* ${header.date}`);
    lines.push('', '*PRODUCTOS*', divider, '');

    items.forEach((item, index) => {
      lines.push(`${index + 1}. *${item.name}*`);
      if (item.quantity) lines.push(`Cantidad: *${item.quantity}*`);
      if (item.unitPrice) lines.push(`Precio por unidad: *${item.unitPrice}*`);
      if (item.subtotal) lines.push(`Subtotal: *${item.subtotal}*`);
      if (item.promotion) lines.push(`Promoción: ${item.promotion}`);
      if (item.saving) lines.push(`Ahorro por promoción: *${item.saving}*`);
      item.gifts.forEach((gift) => lines.push(`Regalo: ${gift.replace(/^🎁\s*/, '')}`));
      lines.push('');
    });

    lines.push(`*TOTAL DE PRODUCTOS: ${formatMoney(productsTotal)}*`, '');

    if (shipping.mode === 'local') {
      lines.push('*ENTREGA LOCAL*', divider);
      shipping.rows.forEach((row) => {
        if (row.label && row.amount) lines.push(`${row.label}: *${row.amount}*`);
      });
    } else {
      lines.push('*OPCIONES DE ENVÍO*', divider);
      if (shipping.normal?.amount) {
        lines.push(
          '1. *Envío normal - recomendado*',
          `Total con envío: *${shipping.normal.amount}*`,
          'Pago por depósito o transferencia antes de enviar.'
        );
        if (shipping.normal.saving) lines.push(`Ahorro frente a pagar al recibir: *${shipping.normal.saving}*`);
        lines.push('');
      }
      if (shipping.receive?.amount) {
        lines.push(
          '2. *Pagar al recibir*',
          `Total a pagar: *${shipping.receive.amount}*`,
          'El pago se realiza al recibir el paquete e incluye comisión del 10%.'
        );
      }
    }

    lines.push(
      '',
      divider,
      '*Deseo confirmar este pedido y continuar con la compra.*',
      'Quedo pendiente de las instrucciones para el pago y el envío.'
    );

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function sendOrder(event) {
    const button = event.target.closest?.('#whatsappQuoteBtn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const url = `https://wa.me/${phoneNumber()}?text=${encodeURIComponent(buildOrderMessage())}`;
    window.location.href = url;
  }

  document.addEventListener('click', sendOrder, true);
  window.SD_BUILD_ORDER_WHATSAPP_V2 = buildOrderMessage;
})();
