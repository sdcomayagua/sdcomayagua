// Mantiene los totales de envío del index.html sincronizados con el subtotal dinámico.
(() => {
  'use strict';
  const PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(location.pathname);
  if (PUBLIC) return;

  const number = (value) => {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const format = (value) => `Lps.${Number(value || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function syncShipping() {
    const subtotal = number(document.getElementById('detailCommerceSubtotal')?.textContent);
    if (!subtotal) return;
    const normal = subtotal + 110;
    const receive = normal * 1.10;
    const normalNode = document.getElementById('detailShippingNormal');
    const receiveNode = document.getElementById('detailShippingReceive');
    if (normalNode) normalNode.textContent = format(normal);
    if (receiveNode) receiveNode.textContent = format(receive);
  }

  function init() {
    const subtotal = document.getElementById('detailCommerceSubtotal');
    if (subtotal) new MutationObserver(syncShipping).observe(subtotal, { childList: true, subtree: true, characterData: true });
    const dialog = document.getElementById('detailDialog');
    if (dialog) new MutationObserver(() => {
      if (dialog.open) setTimeout(syncShipping, 180);
    }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
