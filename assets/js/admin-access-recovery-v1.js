// SD COMAYAGUA · Recupera gestión de productos y evita que el menú lateral tape la navegación.
(() => {
  'use strict';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let scheduled = false;

  function isPublicCatalog() {
    return document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);
  }

  function ensurePrivateAdminMode() {
    if (isPublicCatalog() || !document.body) return;
    if (!document.body.dataset.mode) document.body.dataset.mode = 'admin';
    document.body.dataset.privateCatalog = 'true';
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
      if (action === 'add') clickOriginal('addProductBtn') || clickOriginal('addProductBtnTop');
      if (action === 'import') clickOriginal('importExcelBtn');
      if (action === 'categories') clickOriginal('categoryManagerBtn');
    });
  }

  function buildAdminTools() {
    if (isPublicCatalog()) return;
    const products = qs('#productos');
    const toolbar = qs('#productos .toolbar');
    if (!products || !toolbar) return;

    let tools = qs('#sdAdminCatalogTools');
    if (!tools) {
      tools = document.createElement('section');
      tools.id = 'sdAdminCatalogTools';
      tools.className = 'sd-admin-catalog-tools';
      tools.setAttribute('aria-label', 'Administración de productos');
      tools.innerHTML = `
        <div class="sd-admin-catalog-copy">
          <strong>Gestión del inventario</strong>
          <span>Agregue productos o edite precio, foto, descripción y stock.</span>
        </div>
        <div class="sd-admin-catalog-actions">
          <button class="sd-admin-tool-btn primary" type="button" data-sd-admin-tool="add">＋ Agregar producto</button>
          <button class="sd-admin-tool-btn" type="button" data-sd-admin-tool="import">📥 Importar Excel</button>
          <button class="sd-admin-tool-btn" type="button" data-sd-admin-tool="categories">🗂️ Categorías</button>
        </div>
      `;
      products.insertBefore(tools, toolbar);
    }

    tools.hidden = false;
    tools.style.setProperty('display', 'flex', 'important');
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
    if (!(card instanceof Element) || card.querySelector('.sd-card-edit-stock')) return;
    const storefrontView = card.querySelector(':scope > .store-card-view');
    if (!storefrontView) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sd-card-edit-stock';
    button.innerHTML = '<span aria-hidden="true">✏️</span><span>Editar / stock</span>';
    button.setAttribute('aria-label', 'Editar producto y cambiar stock');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const original = findAdminControl(card);
      if (original) {
        original.click();
        return;
      }

      const detail = card.querySelector('.product-open-detail, .detail-action, [data-action="detail"]');
      detail?.click();
      window.setTimeout(() => qs('#detailEditBtn')?.click(), 180);
    }, true);

    storefrontView.appendChild(button);
  }

  function recoverCardActions() {
    if (isPublicCatalog()) return;
    qsa('#productGrid .product-card.store-minimal-card').forEach(addCardEditButton);
  }

  function recoverDetailEdit() {
    if (isPublicCatalog()) return;
    const edit = qs('#detailEditBtn');
    if (!edit) return;
    edit.classList.add('sd-detail-admin-recovered');
    edit.textContent = '✏️ Editar producto y stock';
    edit.setAttribute('aria-label', 'Editar datos del producto y cambiar stock');
  }

  function sync() {
    scheduled = false;
    ensurePrivateAdminMode();
    updateDrawerTop();
    buildAdminTools();
    recoverCardActions();
    recoverDetailEdit();
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
    if (grid) {
      new MutationObserver(scheduleSync).observe(grid, { childList: true, subtree: true });
    }

    const dialog = qs('#detailDialog');
    if (dialog) {
      new MutationObserver(scheduleSync).observe(dialog, { attributes: true, attributeFilter: ['open'], childList: true, subtree: true });
    }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
