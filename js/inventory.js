import { state } from './state.js';
import { openProductForm, archiveProduct, duplicateProduct, adjustProductStock } from './products.js';
import { productStatus, formatMoney, escapeHtml, productMetrics, matchesProduct, defaultProductImage, defaultProductImageFallback, isImageUrl } from './utils.js';
import { toast } from './ui.js';

export function getFilteredProducts() {
  let rows = [...state.products].filter(p => matchesProduct(p, state.filters.query));
  if (state.filters.category) rows = rows.filter(p => p.categoria === state.filters.category);
  if (state.filters.brand) rows = rows.filter(p => p.marca === state.filters.brand);
  if (state.filters.status === 'disponibles') rows = rows.filter(p => p.activo && Number(p.stock) > 0);
  if (state.filters.status === 'agotados') rows = rows.filter(p => p.activo && Number(p.stock) <= 0);
  if (state.filters.status === 'bajo_stock') rows = rows.filter(p => productStatus(p, state.settings).label === 'Bajo stock');
  if (state.filters.status === 'promo') rows = rows.filter(p => p.promos);
  if (state.filters.sort === 'nombre') rows.sort((a,b)=>String(a.nombre).localeCompare(b.nombre,'es'));
  if (state.filters.sort === 'precio') rows.sort((a,b)=>Number(a.precio)-Number(b.precio));
  if (state.filters.sort === 'stock') rows.sort((a,b)=>Number(a.stock)-Number(b.stock));
  if (state.filters.sort === 'reciente') rows.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return rows;
}
export function renderFilters() {
  const categories = [...new Set(state.products.map(p=>p.categoria).filter(Boolean))].sort();
  const brands = [...new Set(state.products.map(p=>p.marca).filter(Boolean))].sort();
  const count = getFilteredProducts().length;
  return `
    <div class="catalog-toolbar">
      <div class="filter-top">
        <label class="filter-search">Buscar producto
          <input class="input" id="filterQuery" placeholder="Nombre, código, marca o categoría" value="${escapeHtml(state.filters.query)}">
        </label>
        <div class="catalog-actions">
          <div class="filter-summary"><span>Mostrando</span><strong>${count}</strong><span>productos</span></div>
          <button class="btn primary toolbar-add" data-open-product>+ Producto</button>
        </div>
      </div>
      <div class="filter-grid">
        <label class="filter-field">Categoría
          <select id="filterCategory"><option value="">Todas</option>${categories.map(c=>`<option value="${escapeHtml(c)}" ${state.filters.category===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select>
        </label>
        <label class="filter-field">Marca
          <select id="filterBrand"><option value="">Todas</option>${brands.map(b=>`<option value="${escapeHtml(b)}" ${state.filters.brand===b?'selected':''}>${escapeHtml(b)}</option>`).join('')}</select>
        </label>
        <label class="filter-field">Estado
          <select id="filterStatus"><option value="todos">Todos</option><option value="disponibles" ${state.filters.status==='disponibles'?'selected':''}>Disponibles</option><option value="agotados" ${state.filters.status==='agotados'?'selected':''}>Agotados</option><option value="bajo_stock" ${state.filters.status==='bajo_stock'?'selected':''}>Bajo stock</option><option value="promo" ${state.filters.status==='promo'?'selected':''}>Con promoción</option></select>
        </label>
        <label class="filter-field">Ordenar por
          <select id="filterSort"><option value="reciente" ${state.filters.sort==='reciente'?'selected':''}>Más reciente</option><option value="nombre" ${state.filters.sort==='nombre'?'selected':''}>Nombre</option><option value="precio" ${state.filters.sort==='precio'?'selected':''}>Precio</option><option value="stock" ${state.filters.sort==='stock'?'selected':''}>Stock</option></select>
        </label>
      </div>
    </div>`;
}
export function renderInventoryView() {
  const rows = getFilteredProducts();
  const cards = rows.length ? rows.map(p => {
    const st = productStatus(p, state.settings);
    const m = productMetrics(p);
    const fallbackImg = defaultProductImage(p);
    const finalFallbackImg = defaultProductImageFallback();
    const img = p.imagen && isImageUrl(p.imagen)
      ? `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" loading="lazy" onerror="this.onerror=function(){this.onerror=null;this.src='${finalFallbackImg}';this.classList.add('default-product-img')};this.src='${escapeHtml(fallbackImg)}';this.classList.add('default-product-img');">`
      : `<img class="default-product-img" src="${escapeHtml(fallbackImg)}" alt="Imagen de ${escapeHtml(p.nombre)}" loading="lazy" onerror="this.onerror=null;this.src='${finalFallbackImg}'">`;
    const canSell = p.activo && Number(p.stock) > 0;
    return `<article class="inventory-card inventory-card-v164" data-code="${escapeHtml(p.codigo)}">
      <div class="inventory-media">${img}</div>
      <div class="inventory-main">
        <div class="inventory-title-row"><h3>${escapeHtml(p.nombre)}</h3><span class="badge ${st.className}">${st.label}</span></div>
        <small class="inventory-code">${escapeHtml(p.codigo)} · ${escapeHtml(p.syncStatus || 'local')}</small>
        <div class="inventory-meta-two">
          <span><small>Categoría</small><strong>${escapeHtml(p.categoria || 'Sin categoría')}</strong></span>
          <span><small>Marca</small><strong>${escapeHtml(p.marca || 'Genérica')}</strong></span>
        </div>
      </div>
      <div class="inventory-numbers">
        <span><small>Precio</small><strong>${formatMoney(p.precio, state.settings)}</strong></span>
        <span><small>Costo</small><strong>${formatMoney(p.costo, state.settings)}</strong></span>
        <span><small>Stock</small><strong>${Number(p.stock || 0)}</strong></span>
        <span><small>Ganancia proy.</small><strong>${formatMoney(m.gananciaProyectada, state.settings)}</strong></span>
      </div>
      <div class="inventory-actions">
        <button class="mini-btn primary-soft" data-cart-add="${escapeHtml(p.codigo)}" ${canSell ? '' : 'disabled'}>🛒 Vender</button>
        <button class="mini-btn" data-edit-product="${escapeHtml(p.codigo)}">Datos</button>
        <button class="mini-btn" data-duplicate-product="${escapeHtml(p.codigo)}">Duplicar</button>
        <div class="stock-stepper" aria-label="Ajustar stock">
          <button class="mini-btn" data-stock-minus="${escapeHtml(p.codigo)}">−</button>
          <strong>Stock</strong>
          <button class="mini-btn" data-stock-plus="${escapeHtml(p.codigo)}">+</button>
        </div>
        <button class="mini-btn" data-archive-product="${escapeHtml(p.codigo)}" title="Ocultar del catálogo sin borrar del inventario">Ocultar</button>
      </div>
    </article>`;
  }).join('') : `<div class="empty">No hay productos con estos filtros.</div>`;
  return `<section class="inventory-view">${renderFilters()}<div class="inventory-list">${cards}</div></section>`;
}

export function bindInventoryEvents(root=document, rerender=()=>{}) {
  root.querySelector('#filterQuery')?.addEventListener('input', e => { state.filters.query = e.target.value; rerender(); });
  root.querySelector('#filterCategory')?.addEventListener('change', e => { state.filters.category = e.target.value; rerender(); });
  root.querySelector('#filterBrand')?.addEventListener('change', e => { state.filters.brand = e.target.value; rerender(); });
  root.querySelector('#filterStatus')?.addEventListener('change', e => { state.filters.status = e.target.value; rerender(); });
  root.querySelector('#filterSort')?.addEventListener('change', e => { state.filters.sort = e.target.value; rerender(); });
  root.querySelectorAll('[data-edit-product]').forEach(btn => btn.addEventListener('click', () => openProductForm(state.products.find(p => p.codigo === btn.dataset.editProduct))));
  root.querySelectorAll('[data-duplicate-product]').forEach(btn => btn.addEventListener('click', () => duplicateProduct(btn.dataset.duplicateProduct)));
  root.querySelectorAll('[data-archive-product]').forEach(btn => btn.addEventListener('click', () => archiveProduct(btn.dataset.archiveProduct)));
  root.querySelectorAll('[data-stock-plus]').forEach(btn => btn.addEventListener('click', () => { adjustProductStock(btn.dataset.stockPlus, 1); toast('Stock aumentado.', 'ok'); }));
  root.querySelectorAll('[data-stock-minus]').forEach(btn => btn.addEventListener('click', () => { const r=adjustProductStock(btn.dataset.stockMinus, -1); toast(r.ok?'Stock descontado.':r.error, r.ok?'ok':'err'); }));
}
