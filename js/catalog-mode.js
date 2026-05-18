// SD COMAYAGUA POS - Modo catálogo Cliente/Admin v1.3.5
(function () {
  const MODE_KEY = 'sd_pos_catalog_mode';
  const PRODUCT_KEY = 'sd_pos_products';
  const CART_KEY = 'sd_pos_cart';
  const DEFAULT_MODE = localStorage.getItem(MODE_KEY) || 'client';
  document.body.dataset.catalogMode = DEFAULT_MODE;

  const number = value => Number(value || 0) || 0;
  const money = value => `${(window.SD_POS?.state?.settings?.currency || 'Lps.')} ${number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const escapeHtml = text => String(text ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[ch]));
  const products = () => window.SD_POS?.state?.products || safeRead(PRODUCT_KEY, []);
  const safeRead = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  };
  const safeWrite = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function parseColors(text = '') {
    return String(text || '').split(/[;,]/).map(part => {
      const pieces = part.split(/=|:/);
      if (pieces.length < 2) return null;
      return { color: pieces[0].trim(), qty: number(pieces[1]) };
    }).filter(Boolean);
  }

  function currentMode() {
    return document.body.dataset.catalogMode || 'client';
  }

  function setMode(mode) {
    document.body.dataset.catalogMode = mode;
    localStorage.setItem(MODE_KEY, mode);
    enhanceCatalog(true);
  }

  function activeProducts() {
    return products().filter(p => p.activo !== false);
  }

  function totals() {
    const rows = activeProducts();
    return rows.reduce((acc, p) => {
      const stock = number(p.stock);
      const precio = number(p.precio);
      const costo = number(p.costo);
      acc.productos += 1;
      acc.stock += stock;
      acc.venta += stock * precio;
      acc.inversion += stock * costo;
      acc.ganancia += stock * (precio - costo);
      return acc;
    }, { productos: 0, stock: 0, venta: 0, inversion: 0, ganancia: 0 });
  }

  function switchHtml() {
    const mode = currentMode();
    return `
      <section class="sdc-catalog-switch" data-catalog-switch>
        <div class="sdc-catalog-switch-text">
          <strong>${mode === 'admin' ? 'Vista Admin' : 'Vista Cliente'}</strong>
          <span>${mode === 'admin' ? 'Muestra inversión, costo y ganancia.' : 'Solo muestra foto, nombre, precio y disponibilidad.'}</span>
        </div>
        <div class="sdc-catalog-tabs">
          <button type="button" class="${mode === 'client' ? 'active' : ''}" data-catalog-mode="client">Cliente</button>
          <button type="button" class="${mode === 'admin' ? 'active' : ''}" data-catalog-mode="admin">Admin</button>
        </div>
      </section>`;
  }

  function adminSummaryHtml() {
    if (currentMode() !== 'admin') return '';
    const t = totals();
    return `
      <section class="admin-summary" data-admin-summary>
        <article class="admin-metric"><small>Productos</small><strong>${t.productos}</strong></article>
        <article class="admin-metric"><small>Stock total</small><strong>${t.stock}</strong></article>
        <article class="admin-metric"><small>Venta total</small><strong>${money(t.venta)}</strong></article>
        <article class="admin-metric"><small>Inversión</small><strong>${money(t.inversion)}</strong></article>
        <article class="admin-metric"><small>Ganancia</small><strong>${money(t.ganancia)}</strong></article>
      </section>`;
  }

  function enhanceCatalog(force = false) {
    const viewTitle = document.getElementById('viewTitle')?.textContent || '';
    const root = document.getElementById('viewRoot');
    if (!root || !/cat[aá]logo/i.test(viewTitle)) return;

    document.body.dataset.catalogMode = currentMode();

    let switchNode = root.querySelector('[data-catalog-switch]');
    if (!switchNode) {
      root.insertAdjacentHTML('afterbegin', switchHtml());
    } else if (force) {
      switchNode.outerHTML = switchHtml();
    }

    const oldSummary = root.querySelector('[data-admin-summary]');
    if (oldSummary) oldSummary.remove();
    if (currentMode() === 'admin') {
      const sw = root.querySelector('[data-catalog-switch]');
      sw?.insertAdjacentHTML('afterend', adminSummaryHtml());
    }

    root.querySelectorAll('.product-card').forEach(card => {
      if (card.dataset.catalogModeReady === '1') return;
      card.dataset.catalogModeReady = '1';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.title = currentMode() === 'admin' ? 'Tocar para ver detalle admin' : 'Tocar para ver detalle del producto';
    });
  }

  function productByCode(code) {
    return products().find(p => String(p.codigo) === String(code));
  }

  function fallbackImage(product) {
    return product.imagen || 'assets/categorias/general.svg';
  }

  function detailHtml(product) {
    const mode = currentMode();
    const stock = number(product.stock);
    const precio = number(product.precio);
    const costo = number(product.costo);
    const gananciaUnidad = precio - costo;
    const ventaTotal = precio * stock;
    const inversionTotal = costo * stock;
    const gananciaTotal = gananciaUnidad * stock;
    const colors = parseColors(product.colores);
    const colorText = colors.length ? colors.map(c => `${escapeHtml(c.color)}: ${c.qty}`).join(' · ') : `Disponible: ${stock}`;
    return `
      <div class="sdc-product-modal">
        <img class="sdc-product-modal-img" src="${escapeHtml(fallbackImage(product))}" alt="${escapeHtml(product.nombre)}" onerror="this.onerror=null;this.src='assets/categorias/general.svg'">
        <div>
          <h3>${escapeHtml(product.nombre)}</h3>
          <p style="color:var(--muted);margin:.35rem 0 0">${escapeHtml(product.categoria || 'Sin categoría')} · ${escapeHtml(product.marca || 'Genérica')}</p>
        </div>
        <div class="sdc-modal-grid">
          <div class="sdc-info-box"><small>Precio</small><strong>${money(precio)}</strong></div>
          <div class="sdc-info-box"><small>Disponible</small><strong>${stock}</strong></div>
          <div class="sdc-info-box"><small>Variantes</small><strong>${colorText}</strong></div>
          ${mode === 'admin' ? `
            <div class="sdc-info-box"><small>Costo unidad</small><strong>${money(costo)}</strong></div>
            <div class="sdc-info-box"><small>Ganancia unidad</small><strong>${money(gananciaUnidad)}</strong></div>
            <div class="sdc-info-box"><small>Venta total</small><strong>${money(ventaTotal)}</strong></div>
            <div class="sdc-info-box"><small>Inversión total</small><strong>${money(inversionTotal)}</strong></div>
            <div class="sdc-info-box"><small>Ganancia total</small><strong>${money(gananciaTotal)}</strong></div>
          ` : ''}
        </div>
        ${product.descripcion ? `<p style="color:var(--muted);line-height:1.45">${escapeHtml(product.descripcion)}</p>` : ''}
        <div class="sdc-modal-actions">
          <button class="btn primary" data-cart-add-modal="${escapeHtml(product.codigo)}">Agregar +</button>
          <button class="btn secondary" data-quote-add-modal="${escapeHtml(product.codigo)}">Cotizar</button>
          <button class="btn ghost span" data-close-modal>Cerrar</button>
        </div>
      </div>`;
  }

  function openProductDetail(code) {
    const product = productByCode(code);
    const modalRoot = document.getElementById('modalRoot');
    if (!product || !modalRoot) return;
    modalRoot.hidden = false;
    modalRoot.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-label="Detalle de producto">
        <header class="modal-header">
          <h2>${currentMode() === 'admin' ? 'Admin · Producto' : 'Producto'}</h2>
          <button class="icon-btn" data-close-modal aria-label="Cerrar">×</button>
        </header>
        <div class="modal-body">${detailHtml(product)}</div>
      </section>`;
  }

  function addToCartQuick(code, mode = 'sale') {
    const api = window.SD_POS;
    const btn = document.querySelector(`[data-cart-add="${CSS.escape(code)}"]`);
    if (btn) {
      btn.click();
      return;
    }
    const product = productByCode(code);
    if (!product) return;
    const colors = parseColors(product.colores);
    const firstColor = colors.find(c => c.qty > 0)?.color || '';
    const cart = safeRead(CART_KEY, { items: [], discount: 0, deliveryType: 'envio_normal', cod: false, customer: {}, notes: '' });
    cart.items = cart.items || [];
    const existing = cart.items.find(i => String(i.codigo) === String(code) && String(i.color || '') === String(firstColor || ''));
    if (existing) existing.qty += 1;
    else cart.items.push({ lineId: `LINE-${Date.now()}`, codigo: product.codigo, nombre: product.nombre, precio: number(product.precio), costo: number(product.costo), qty: 1, color: firstColor, colorRequired: colors.length > 0, availableStock: firstColor ? number(colors.find(c => c.color === firstColor)?.qty) : number(product.stock), discount: 0, mode });
    safeWrite(CART_KEY, cart);
    if (api?.state) api.state.cart = cart;
    api?.navigate?.('cart');
  }

  document.addEventListener('click', event => {
    const modeBtn = event.target.closest('[data-catalog-mode]');
    if (modeBtn) return setMode(modeBtn.dataset.catalogMode);

    const close = event.target.closest('[data-close-modal]');
    if (close) {
      const modalRoot = document.getElementById('modalRoot');
      if (modalRoot) { modalRoot.hidden = true; modalRoot.innerHTML = ''; }
      return;
    }

    const addModal = event.target.closest('[data-cart-add-modal]');
    if (addModal) return addToCartQuick(addModal.dataset.cartAddModal, 'sale');
    const quoteModal = event.target.closest('[data-quote-add-modal]');
    if (quoteModal) return addToCartQuick(quoteModal.dataset.quoteAddModal, 'quote');

    const card = event.target.closest('.product-card');
    if (!card || event.target.closest('button, input, select, textarea, a')) return;
    openProductDetail(card.dataset.code);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (event.target.closest?.('button,a,input,select,textarea,label,[role="button"] .btn')) return;
    const card = event.target.closest?.('.product-card');
    if (card) openProductDetail(card.dataset.code);
  });

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; enhanceCatalog(); });
  }

  window.addEventListener('load', enhanceCatalog);
  document.addEventListener('DOMContentLoaded', enhanceCatalog);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
