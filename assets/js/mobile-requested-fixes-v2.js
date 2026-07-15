// SD COMAYAGUA · Correcciones solicitadas para la experiencia móvil.
(() => {
  'use strict';

  const RECEIVE_TEXT = 'Se paga al recibir. Sale un poco más caro que el normal, porque la empresa de envío cobra 10% adicional por manejar dinero.';
  const qs = (selector, root = document) => root.querySelector(selector);
  let queued = false;

  function updateShippingText() {
    const note = qs('#detailShippingReceiveNote');
    if (note && note.textContent.trim() !== RECEIVE_TEXT) {
      note.textContent = RECEIVE_TEXT;
    }

    const saving = qs('#detailDialog .shipping-row.normal .sd-shipping-savings-v6');
    if (saving) saving.classList.add('sd-shipping-savings-spaced');
  }

  function updateDetailState() {
    const dialog = qs('#detailDialog');
    document.body?.classList.toggle('sd-detail-dialog-open', Boolean(dialog?.open));
  }

  function sync() {
    queued = false;
    updateShippingText();
    updateDetailState();
  }

  function scheduleSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    const dialog = qs('#detailDialog');
    if (dialog) {
      new MutationObserver(scheduleSync).observe(dialog, {
        attributes: true,
        attributeFilter: ['open'],
        childList: true,
        subtree: true,
        characterData: true
      });

      dialog.addEventListener('close', scheduleSync);
      dialog.addEventListener('cancel', scheduleSync);
    }

    document.addEventListener('click', scheduleSync, true);
    scheduleSync();

    [300, 800, 1600, 2800].forEach((delay) => {
      window.setTimeout(scheduleSync, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
