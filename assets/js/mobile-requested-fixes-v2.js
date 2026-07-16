// SD COMAYAGUA · Correcciones finales para catálogo, detalle y envíos.
(() => {
  'use strict';

  const RECEIVE_TEXT = 'Se paga al recibir. Sale un poco más caro que el normal, porque la empresa de envío cobra 10% adicional por manejar dinero.';
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let queued = false;

  function forceCompactCards() {
    const grid = qs('#productGrid');
    if (grid) {
      grid.style.setProperty('align-items', 'start', 'important');
      grid.style.setProperty('align-content', 'start', 'important');
      grid.style.setProperty('grid-auto-rows', 'max-content', 'important');
    }

    qsa('#productGrid .product-card.store-minimal-card').forEach((card) => {
      card.style.setProperty('height', 'auto', 'important');
      card.style.setProperty('min-height', '0', 'important');
      card.style.setProperty('max-height', 'none', 'important');
      card.style.setProperty('align-self', 'start', 'important');
      card.style.setProperty('content-visibility', 'visible', 'important');
      card.style.setProperty('contain', 'none', 'important');

      const view = qs(':scope > .store-card-view', card);
      if (view) {
        view.style.setProperty('height', 'auto', 'important');
        view.style.setProperty('min-height', '0', 'important');
        view.style.setProperty('max-height', 'none', 'important');
        view.style.setProperty('align-content', 'start', 'important');
      }

      const copy = qs('.store-card-copy', card);
      if (copy) {
        copy.style.setProperty('height', 'auto', 'important');
        copy.style.setProperty('min-height', '0', 'important');
        copy.style.setProperty('max-height', 'none', 'important');
      }
    });
  }

  function releaseMobileToolbar() {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    const toolbar = qs('#productos .toolbar');
    if (!toolbar) return;

    toolbar.style.setProperty('position', 'relative', 'important');
    toolbar.style.setProperty('top', 'auto', 'important');
    toolbar.style.setProperty('left', 'auto', 'important');
    toolbar.style.setProperty('right', 'auto', 'important');
    toolbar.style.setProperty('bottom', 'auto', 'important');
    toolbar.style.setProperty('inset', 'auto', 'important');
    toolbar.style.setProperty('transform', 'none', 'important');
  }

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
    forceCompactCards();
    releaseMobileToolbar();
    updateShippingText();
    updateDetailState();
  }

  function scheduleSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    const grid = qs('#productGrid');
    if (grid) {
      new MutationObserver(scheduleSync).observe(grid, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

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
    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('pageshow', scheduleSync);
    scheduleSync();

    [100, 300, 700, 1200, 2000, 3200, 5000].forEach((delay) => {
      window.setTimeout(scheduleSync, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
