// SD COMAYAGUA · Correcciones finales para catálogo, detalle y envíos.
(() => {
  'use strict';

  const RECEIVE_TEXT = 'Se paga al recibir. Sale un poco más caro que el normal, porque la empresa de envío cobra 10% adicional por manejar dinero.';
  const FALLBACK_IMAGE = 'assets/img/logo-round.png';
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let queued = false;

  function protectImage(image) {
    if (!(image instanceof HTMLImageElement)) return;

    const useFallback = () => {
      if (image.dataset.sdFallbackApplied === '1') {
        image.style.setProperty('display', 'none', 'important');
        image.closest('.store-card-photo, .store-feature-image')?.classList.add('sd-missing-image');
        return;
      }

      image.dataset.sdFallbackApplied = '1';
      image.classList.add('sd-image-fallback');
      image.alt = '';
      image.src = FALLBACK_IMAGE;
    };

    if (image.dataset.sdImageGuard !== '1') {
      image.dataset.sdImageGuard = '1';
      image.addEventListener('error', useFallback);
    }

    image.loading = 'lazy';
    image.decoding = 'async';

    if (image.complete && image.naturalWidth === 0) useFallback();
  }

  function normalizeStatus(card) {
    const status = qs('.store-card-status', card);
    if (!status) return;

    const raw = String(status.textContent || '').toLowerCase();
    const out = status.classList.contains('out') || /agotado|sin stock|no disponible/.test(raw);
    const label = out ? 'AGOTADO' : 'EN STOCK';

    if (status.textContent.trim() !== label) status.textContent = label;
    status.classList.toggle('out', out);
    status.setAttribute('aria-label', out ? 'Producto agotado' : 'Producto en stock');
    status.title = out ? 'Producto agotado' : 'Producto en stock';
  }

  function normalizeMedia(root = document) {
    qsa('.store-card-photo img, .store-feature-image img', root).forEach(protectImage);
    qsa('#productGrid .product-card.store-minimal-card', root).forEach(normalizeStatus);
  }

  function hideLegacyCardContent(card) {
    if (!(card instanceof Element)) return;

    const views = qsa(':scope > .store-card-view', card);
    if (!views.length) return;

    const view = views[0];
    views.slice(1).forEach((duplicate) => duplicate.remove());

    Array.from(card.children).forEach((child) => {
      if (child === view) return;

      child.dataset.sdLegacyCardContent = 'true';
      child.setAttribute('aria-hidden', 'true');
      child.style.setProperty('display', 'none', 'important');
      child.style.setProperty('visibility', 'hidden', 'important');
      child.style.setProperty('height', '0', 'important');
      child.style.setProperty('min-height', '0', 'important');
      child.style.setProperty('max-height', '0', 'important');
      child.style.setProperty('margin', '0', 'important');
      child.style.setProperty('padding', '0', 'important');
      child.style.setProperty('overflow', 'hidden', 'important');
      child.style.setProperty('border', '0', 'important');
    });

    const copy = qs('.store-card-copy', view);
    if (copy) {
      const bottoms = qsa(':scope > .gm-card-bottom', copy);
      bottoms.slice(1).forEach((duplicate) => duplicate.remove());

      const promos = qsa(':scope > .gm-promo-label', copy);
      promos.slice(1).forEach((duplicate) => duplicate.remove());

      qsa('.gm-card-cta', copy).forEach((arrow) => arrow.remove());
    }

    normalizeStatus(card);
    qsa('.store-card-photo img', view).forEach(protectImage);
    card.dataset.sdUnifiedCard = 'true';
  }

  function normalizeCards() {
    const grid = qs('#productGrid');
    if (grid) {
      grid.style.setProperty('align-items', 'stretch', 'important');
      grid.style.setProperty('align-content', 'start', 'important');
      grid.style.setProperty('grid-auto-rows', '1fr', 'important');
    }

    qsa('#productGrid .product-card.store-minimal-card').forEach((card) => {
      hideLegacyCardContent(card);
      card.style.setProperty('align-self', 'stretch', 'important');
      card.style.setProperty('content-visibility', 'visible', 'important');
      card.style.setProperty('contain', 'none', 'important');
    });

    qsa('#storeFeaturedGrid .gm-feature-cta').forEach((arrow) => arrow.remove());
    normalizeMedia();
  }

  function moveDetailActionsToEnd() {
    const card = qs('#detailDialog .detail-card');
    const layout = qs('#detailDialog .detail-layout');
    const actions = qs('#detailDialog .detail-actions');
    if (!card || !layout || !actions) return;

    if (actions.parentElement !== card || actions.previousElementSibling !== layout) {
      layout.insertAdjacentElement('afterend', actions);
    }

    actions.classList.add('sd-detail-actions-final');
    actions.style.setProperty('position', 'static', 'important');
    actions.style.setProperty('inset', 'auto', 'important');
    actions.style.setProperty('transform', 'none', 'important');
    actions.style.setProperty('width', 'auto', 'important');
    actions.style.setProperty('max-width', 'none', 'important');
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
    normalizeCards();
    moveDetailActionsToEnd();
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

    const featured = qs('#storeFeaturedGrid');
    if (featured) {
      new MutationObserver(scheduleSync).observe(featured, {
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
