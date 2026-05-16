import { state } from './state.js';
import { openProductForm, archiveProduct, duplicateProduct, adjustProductStock } from './products.js';
import { productStatus, formatMoney, escapeHtml, productMetrics, matchesProduct } from './utils.js';
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
  return `<div class="toolbar"><div class="searchbar"><input class="input" id="filterQuery" placeholder="Buscar por nombre, código, marca o categoría" value="${escapeHtml(state.filters.query)}"><select id="filterCategory"><option value="">Categoría</option>${categories.map(c=>`<option value="${escapeHtml(c)}" ${state.filters.category===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select><select id="filterBrand"><option value="">Marca</option>${brands.map(b=>`<option value="${escapeHtml(b)}" ${state.filters.brand===b?'selected':''}>${escapeHtml(b)}</option>`).join('')}</select><select id="filterStatus"><option value="todos">Todos</option><option value="disponibles" ${state.filters.status==='disponibles'?'selected':''}>Disponibles</option><option value="agotados" ${state.filters.status==='agotados'?'selected':''}>Agotados</option><option value="bajo_stock" ${state.filters.status==='bajo_stock'?'selected':''}>Bajo stock</option><option value="promo" ${state.filters.status==='promo'?'selected':''}>Con promoción</option></select><select id="filterSort"><option value="reciente" ${state.filters.sort==='reciente'?'selected':''}>Más reciente</option><option value="nombre" ${state.filters.sort==='nombre'?'selected':''}>Nombre</option><option value="precio" ${state.filters.sort==='precio'?'selected':''}>Precio</option><option value="stock" ${state.filters.sort==='stock'?'selected':''}>Stock</option></select></div><button class="btn primary" data-open-product>+ Producto</button></div>`;
}
export function renderInventoryView() {
  const rows = getFilteredProducts();
  const body = rows.length ? rows.map(p => {
    const st = productStatus(p, state.settings); const m = productMetrics(p);
    return `<tr><td><strong>${escapeHtml(p.codigo)}</strong><br><small>${escapeHtml(p.syncStatus || 'local')}</small></td><td>${escapeHtml(p.nombre)}</td><td>${escapeHtml(p.categoria)}</td><td>${escapeHtml(p.marca)}</td><td>${formatMoney(p.precio, state.settings)}</td><td>${formatMoney(p.costo, state.settings)}</td><td>${p.stock}</td><td><span class="badge ${st.className}">${st.label}</span></td><td>${formatMoney(m.gananciaProyectada, state.settings)}</td><td class="row-actions"><button class="mini-btn" data-edit-product="${escapeHtml(p.codigo)}">Editar</button><button class="mini-btn" data-duplicate-product="${escapeHtml(p.codigo)}">Duplicar</button><button class="mini-btn" data-stock-plus="${escapeHtml(p.codigo)}">+1</button><button class="mini-btn" data-stock-minus="${escapeHtml(p.codigo)}">-1</button><button class="mini-btn" data-archive-product="${escapeHtml(p.codigo)}">Desactivar</button></td></tr>`;
  }).join('') : `<tr><td colspan="10">No hay productos con estos filtros.</td></tr>`;
  return `<section>${renderFilters()}<div class="table-wrap"><table><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Marca</th><th>Precio</th><th>Costo</th><th>Stock</th><th>Estado</th><th>Ganancia proy.</th><th>Acciones</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
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
