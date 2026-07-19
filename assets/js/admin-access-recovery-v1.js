// SD COMAYAGUA · Recupera gestión de productos y acciones privadas.
(() => {
  'use strict';

  const PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (PUBLIC) return;

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let scheduled = false;

  function ensureFinalStyle() {
    let style = qs('link[data-sd-private-product-admin-final-v1]');
    if (!style) {
      style = document.createElement('link');
      style.rel = 'stylesheet';
      style.setAttribute('data-sd-private-product-admin-final-v1', 'true');
    }
    style.href = 'assets/css/private-product-admin-final-v1.css?v=20260719-private-admin-v18';
    document.head.appendChild(style);
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function forceVisible(node, display = 'inline-flex') {
    if (!(node instanceof HTMLElement)) return;
    node.hidden = false;
    node.removeAttribute('hidden');
    node.removeAttribute('aria-hidden');
    node.style.setProperty('display', display, 'important');
    node.style.setProperty('visibility', 'visible', 'important');
    node.style.setProperty('opacity', '1', 'important');
    node.style.setProperty('pointer-events', 'auto', 'important');
    node.style.setProperty('height', 'auto', 'important');
    node.style.setProperty('max-height', 'none', 'important');
    node.style.setProperty('overflow', 'visible', 'important');
  }

  function ensurePrivateMode() {
    if (!document.body) return;
    document.body.dataset.privateCatalog = 'true';
  }

  function updateDrawerTop() {
    if (matchMedia('(max-width: 760px)').matches) {
      document.documentElement.style.removeProperty('--sd-drawer-top');
      return;
    }

    const header = qs('.app-header');
    const nav = qs('#mainNav.main-nav, .main-nav');
    const headerBottom = header?.getBoundingClientRect().bottom || 0;
    const navRect = nav?.getBoundingClientRect();
    const navVisible = nav && getComputedStyle(nav).display !== 'none' && (navRect?.height || 0) > 0;
    const bottom = Math.ceil(Math.max(headerBottom, navVisible ? navRect.bottom : 0) + 8);
    document.documentElement.style.setProperty('--sd-drawer-top', `${Math.max(88, bottom)}px`);
  }

  function clickOriginal(id) {
    const control = qs(`#${id}`);
    if (!control) return false;
    control.click();
    return true;
  }

  function bindAdminTools(tools) {
    if (!tools || tools.dataset.sdAdminToolsBound === '1') return;
    tools.dataset.sdAdminToolsBound = '1';
    tools.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sd-admin-tool]');
      if (!button) return;
      const action = button.dataset.sdAdminTool;
      if (action === 'add') clickOriginal('addProductBtn') || clickOriginal('addProductBtnTop') || clickOriginal('floatingAddBtn');
      if (action === 'import') clickOriginal('importExcelBtn');
      if (action === 'export') clickOriginal('exportExcelBtn');
      if (action === 'categories') clickOriginal('categoryManagerBtn');
    });
  }

  function buildAdminTools() {
    const products = qs('#productos');
    const toolbar = qs('#productos .toolbar');
    if (!products || !toolbar) return;

    let tools = qs('#sdAdminCatalogTools');
    if (!tools) {
      tools = document.createElement('section');
      tools.id = 'sdAdminCatalogTools';
      tools.className = 'sd-admin-catalog-tools';
      tools.setAttribute('aria-label', 'Administración de productos');
      products.insertBefore(tools, toolbar);
    }

    if (!tools.dataset.sdAdminMarkupReady) {
      tools.innerHTML = `
        <div class="sd-admin-catalog-copy">
          <strong>Gestión del inventario</strong>
          <span>Agregue o edite productos, fotos, promociones y stock.</span>
        </div>
        <div class="sd-admin-catalog-actions">
          <button class="sd-admin-tool-btn primary" type="button" data-sd-admin-tool="add">＋ Agregar producto</button>
          <button class="sd-admin-tool-btn icon-only import" type="button" data-sd-admin-tool="import" aria-label="Importar Excel" title="Importar Excel">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/></svg>
          </button>
          <button class="sd-admin-tool-btn icon-only export" type="button" data-sd-admin-tool="export" aria-label="Exportar Excel" title="Exportar Excel">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M5 10v8.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V10"/></svg>
          </button>
          <button class="sd-admin-tool-btn categories" type="button" data-sd-admin-tool="categories">🗂️ Categorías</button>
        </div>`;
      tools.dataset.sdAdminMarkupReady = '1';
    }

    forceVisible(tools, 'flex');
    bindAdminTools(tools);
  }

  function findAdminControl(card) {
    const controls = qsa('button, a, [role="button"]', card).filter((control) => !control.classList.contains('sd-card-edit-stock'));
    return controls.find((control) => {
      const source = normalize([
        control.textContent,
        control.getAttribute('aria-label'),
        control.getAttribute('title'),
        control.dataset.action,
        control.dataset.proCardAction,
        control.className
      ].filter(Boolean).join(' '));
      return source.includes('editar') || source.includes('admin');
    }) || null;
  }

  function addCardEditButton(card) {
    if (!(card instanceof Element)) return;
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

        const original = findAdminControl(card);
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

  function recoverCardActions() {
    qsa('#productGrid .product-card.store-minimal-card').forEach(addCardEditButton);
  }

  function recoverDetailActions() {
    const dialog = qs('#detailDialog');
    const card = qs('.detail-card', dialog || document);
    const layout = qs('.detail-layout', card || document);
    const actions = qs('.detail-actions', card || document);
    if (!dialog || !card || !layout || !actions) return;

    if (actions.parentElement !== card || actions.previousElementSibling !== layout) {
      layout.insertAdjacentElement('afterend', actions);
    }

    actions.classList.add('sd-detail-actions-final', 'sd-private-admin-actions');
    forceVisible(actions, 'grid');

    const sell = qs('#detailSellBtn');
    const quote = qs('#detailQuoteBtn');
    const duplicate = qs('#detailDuplicateBtn');
    const edit = qs('#detailEditBtn');

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

  function sync() {
    scheduled = false;
    ensureFinalStyle();
    ensurePrivateMode();
    updateDrawerTop();
    buildAdminTools();
    recoverCardActions();
    recoverDetailActions();
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  function boot() {
    sync();

    const drawer = qs('#storeDrawer');
    const menu = qs('#menuToggle');
    menu?.addEventListener('click', () => requestAnimationFrame(updateDrawerTop), true);
    drawer?.addEventListener('transitionstart', updateDrawerTop);

    const grid = qs('#productGrid');
    if (grid) new MutationObserver(scheduleSync).observe(grid, { childList: true, subtree: true });

    const dialog = qs('#detailDialog');
    if (dialog) new MutationObserver(scheduleSync).observe(dialog, {
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
      subtree: true
    });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updateDrawerTop);
      const header = qs('.app-header');
      const nav = qs('#mainNav.main-nav, .main-nav');
      if (header) observer.observe(header);
      if (nav) observer.observe(nav);
    }

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('pageshow', scheduleSync);
    document.addEventListener('click', scheduleSync, true);
    [100, 250, 500, 900, 1500, 2400, 3600, 5200].forEach((delay) => setTimeout(scheduleSync, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
