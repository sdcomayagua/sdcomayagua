// SD COMAYAGUA · Recuperación final de acciones administrativas del producto.
(() => {
  'use strict';

  const IS_PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (IS_PUBLIC) return;

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let queued = false;

  function forceVisible(node) {
    if (!(node instanceof HTMLElement)) return;
    node.hidden = false;
    node.removeAttribute('hidden');
    node.removeAttribute('aria-hidden');
    node.style.setProperty('display', 'inline-flex', 'important');
    node.style.setProperty('visibility', 'visible', 'important');
    node.style.setProperty('opacity', '1', 'important');
    node.style.setProperty('pointer-events', 'auto', 'important');
    node.style.setProperty('height', 'auto', 'important');
    node.style.setProperty('max-height', 'none', 'important');
    node.style.setProperty('overflow', 'visible', 'important');
  }

  function restoreDetailActions() {
    const dialog = qs('#detailDialog');
    const card = qs('.detail-card', dialog || document);
    const layout = qs('.detail-layout', card || document);
    const actions = qs('.detail-actions', card || document);
    if (!dialog || !card || !layout || !actions) return;

    if (actions.parentElement !== card || actions.previousElementSibling !== layout) {
      layout.insertAdjacentElement('afterend', actions);
    }

    actions.classList.add('sd-detail-actions-final', 'sd-private-admin-actions');
    actions.hidden = false;
    actions.removeAttribute('aria-hidden');
    actions.style.setProperty('display', 'grid', 'important');
    actions.style.setProperty('visibility', 'visible', 'important');
    actions.style.setProperty('opacity', '1', 'important');

    const sell = qs('#detailSellBtn', actions) || qs('#detailSellBtn');
    const quote = qs('#detailQuoteBtn', actions) || qs('#detailQuoteBtn');
    const duplicate = qs('#detailDuplicateBtn', actions) || qs('#detailDuplicateBtn');
    const edit = qs('#detailEditBtn', actions) || qs('#detailEditBtn');

    [sell, quote, duplicate, edit].forEach((node) => {
      if (node && node.parentElement !== actions) actions.appendChild(node);
      forceVisible(node);
    });

    if (sell) {
      sell.textContent = '🛒 Vender';
      sell.setAttribute('aria-label', 'Registrar venta de este producto');
      sell.classList.add('sd-private-primary-action');
    }

    if (duplicate) {
      duplicate.textContent = '📑 Duplicar producto';
      duplicate.setAttribute('aria-label', 'Duplicar este producto');
      duplicate.classList.add('sd-private-duplicate-action');
    }

    if (edit) {
      edit.textContent = '✏️ Editar producto, fotos y stock';
      edit.setAttribute('aria-label', 'Editar producto, fotografías, precio, stock, descripción y promociones');
      edit.setAttribute('title', 'Editar fotografías, precio, stock, descripción y promociones');
      edit.classList.add('sd-detail-admin-recovered', 'sd-private-edit-action');
    }
  }

  function findOriginalAdminControl(card) {
    return qsa('button, a, [role="button"]', card).find((control) => {
      if (control.classList.contains('sd-card-edit-stock')) return false;
      const source = [
        control.textContent,
        control.getAttribute('aria-label'),
        control.getAttribute('title'),
        control.dataset.action,
        control.dataset.proCardAction,
        control.className
      ].filter(Boolean).join(' ').toLowerCase();
      return source.includes('editar') || source.includes('admin');
    }) || null;
  }

  function restoreCardEdit(card) {
    if (!(card instanceof HTMLElement)) return;
    const view = qs(':scope > .store-card-view', card);
    if (!view) return;

    let button = qs(':scope > .sd-card-edit-stock', view);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'sd-card-edit-stock sd-card-edit-final';
      button.innerHTML = '<span aria-hidden="true">✏️</span><span>Editar</span>';
      button.setAttribute('aria-label', 'Editar producto, fotografías, promociones y stock');
      button.setAttribute('title', 'Editar producto y stock');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const original = findOriginalAdminControl(card);
        if (original) {
          original.click();
          return;
        }

        const detail = qs('.product-open-detail, .detail-action, [data-action="detail"]', card);
        detail?.click();
        window.setTimeout(() => qs('#detailEditBtn')?.click(), 220);
      }, true);
      view.appendChild(button);
    }

    forceVisible(button);
  }

  function restoreCatalogAdmin() {
    const tools = qs('#sdAdminCatalogTools');
    if (tools) {
      tools.hidden = false;
      tools.removeAttribute('aria-hidden');
      tools.style.setProperty('display', 'flex', 'important');
      tools.style.setProperty('visibility', 'visible', 'important');
      tools.style.setProperty('opacity', '1', 'important');
    }

    qsa('#productGrid .product-card.store-minimal-card').forEach(restoreCardEdit);
  }

  function sync() {
    queued = false;
    document.body?.setAttribute('data-private-catalog', 'true');
    restoreCatalogAdmin();
    restoreDetailActions();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    sync();

    const grid = qs('#productGrid');
    if (grid) new MutationObserver(schedule).observe(grid, { childList: true, subtree: true });

    const dialog = qs('#detailDialog');
    if (dialog) {
      new MutationObserver(schedule).observe(dialog, {
        attributes: true,
        attributeFilter: ['open'],
        childList: true,
        subtree: true
      });
      dialog.addEventListener('close', schedule);
    }

    document.addEventListener('click', schedule, true);
    window.addEventListener('pageshow', schedule);
    [100, 250, 500, 900, 1500, 2500, 4000, 6000].forEach((delay) => setTimeout(schedule, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
