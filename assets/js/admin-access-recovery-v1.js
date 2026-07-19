// SD COMAYAGUA · Recupera gestión de productos y acciones privadas.
(() => {
  'use strict';

  const PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  if (PUBLIC) return;

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let scheduled = false;
  let initialViewRestored = false;

  function ensureFinalStyle() {
    let style = qs('link[data-sd-private-product-admin-final-v1]');
    if (!style) {
      style = document.createElement('link');
      style.rel = 'stylesheet';
      style.setAttribute('data-sd-private-product-admin-final-v1', 'true');
    }
    style.href = 'assets/css/private-product-admin-final-v1.css?v=20260719-private-admin-v19';
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

  function activateAdminMode() {
    const adminMode = qs('.mode-btn[data-mode="admin"]');
    if (!adminMode) return false;
    if (!adminMode.classList.contains('active')) adminMode.click();
    document.body.dataset.mode = 'admin';
    return true;
  }

  function activateQuickFilter(filter) {
    const button = qs(`.quick-filter-btn[data-quick-filter="${filter}"]`);
    if (!button) return false;
    if (!button.classList.contains('active')) button.click();
    return true;
  }

  function restoreInitialPrivateView() {
    if (initialViewRestored) return;
    const grid = qs('#productGrid');
    const adminMode = qs('.mode-btn[data-mode="admin"]');
    const allFilter = qs('.quick-filter-btn[data-quick-filter="all"]');
    if (!grid || !adminMode || !allFilter) return;

    activateAdminMode();
    activateQuickFilter('all');
    initialViewRestored = true;
  }

  function showOutOfStockProducts() {
    activateAdminMode();
    activateQuickFilter('out');
    qs('[data-section="productos"]')?.click();
    window.setTimeout(() => qs('#productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function showAllProducts() {
    activateAdminMode();
    activateQuickFilter('all');
    qs('[data-section="productos"]')?.click();
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
      if (action === 'all') showAllProducts();
      if (action === 'out') showOutOfStockProducts();
    });
  }

  function updateOutCount(tools) {
    const count = qs('#outCount')?.textContent?.trim() || '0';
    const badge = qs('[data-sd-out-count]', tools);
    if (badge && badge.textContent !== count) badge.textContent = count;
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
          <button class="sd-admin-tool-btn compact-all" type="button" data-sd-admin-tool="all" title="Ver todos los productos" aria-label="Ver todos los productos">Todos</button>
          <button class="sd-admin-tool-btn out-stock" type="button" data-sd-admin-tool="out" title="Ver productos agotados">
            <span aria-hidden="true">⛔</span><span class="sd-out-label">Agotados</span><b data-sd-out-count>0</b>
          </button>
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
    updateOutCount(tools);
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

  function isOutOfStock(card) {
    const status = qs('.store-card-status, .stock-badge', card);
    const stock = qs('.store-card-stock, .product-stock, [data-stock]', card);
    const text = normalize(`${status?.textContent || ''} ${stock?.textContent || ''}`);
    return status?.classList.contains('out') || /agotado|sin stock|0 unidades|0 disponible/.test(text);
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

    const out = isOutOfStock(card);
    button.classList.toggle('is-restock', out);
    button.innerHTML = out
      ? '<span aria-hidden="true">📦</span><span>Reponer stock</span>'
      : '<span aria-hidden="true">✏️</span><span>Editar</span>';
    button.setAttribute('aria-label', out
      ? 'Reponer stock y editar producto agotado'
      : 'Editar producto, fotografías, promociones y stock');
    button.setAttribute('title', out ? 'Reponer stock' : 'Editar producto y stock');

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
    const status = normalize(qs('#detailStatus')?.textContent || '');
    const out = /agotado|sin stock/.test(status) || Number(String(qs('#detailStock')?.textContent || '').replace(/\D/g, '')) === 0;

    [sell, quote, duplicate, edit].forEach((node) => {
      if (node && node.parentElement !== actions) actions.appendChild(node);
      forceVisible(node);
    });

    if (sell) {
      sell.textContent = '🛒 Vender';
      sell.setAttribute('aria-label', 'Registrar venta de este producto');
      sell.classList.add('sd-private-primary-action');
      sell.disabled = out;
    }

    if (duplicate) {
      duplicate.textContent = '📑 Duplicar producto';
      duplicate.setAttribute('aria-label', 'Duplicar este producto');
      duplicate.classList.add('sd-private-duplicate-action');
    }

    if (edit) {
      edit.textContent = out ? '📦 Reponer stock y editar' : '✏️ Editar producto, fotos y stock';
      edit.setAttribute('aria-label', out
        ? 'Reponer stock y editar producto agotado'
        : 'Editar producto, fotografías, precio, stock, descripción y promociones');
      edit.setAttribute('title', out ? 'Reponer stock' : 'Editar fotografías, precio, stock, descripción y promociones');
      edit.classList.add('sd-detail-admin-recovered', 'sd-private-edit-action');
      edit.classList.toggle('is-restock', out);
    }
  }

  function sync() {
    scheduled = false;
    ensureFinalStyle();
    ensurePrivateMode();
    updateDrawerTop();
    restoreInitialPrivateView();
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

    const outCount = qs('#outCount');
    if (outCount) new MutationObserver(scheduleSync).observe(outCount, { childList: true, characterData: true, subtree: true });

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
