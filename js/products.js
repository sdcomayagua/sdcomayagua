import { state, updateProductInState, removeProductFromState, enqueueAction } from './state.js';
import { persistAll } from './data.js';
import { openModal, closeModal, toast, formToObject, confirmDialog } from './ui.js';
import { normalizeProduct, parseColorStock, serializeColorStock, sumColorStock, productStatus, formatMoney, escapeHtml, imageFallbackText, isImageUrl, defaultProductImage, defaultProductImageFallback, productMetrics, nowISO } from './utils.js';
import { validateProduct } from './validators.js';

export function generateProductCode(prefix='SDC') {
  const nums = state.products.map(p => String(p.codigo || '').match(/(\d+)$/)?.[1]).filter(Boolean).map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4,'0')}`;
}

export function openProductForm(product=null) {
  const tpl = document.getElementById('productFormTemplate');
  const node = tpl.content.cloneNode(true);
  const form = node.querySelector('form');
  if (product) fillProductForm(form, product);
  openModal(product ? 'Editar producto' : 'Agregar producto', node, { onOpen(root) {
    root.querySelector('[data-action="generate-code"]').addEventListener('click', () => { form.codigo.value = generateProductCode(); });
    root.querySelector('[data-action="recalc-stock"]').addEventListener('click', () => { form.stock.value = sumColorStock(form.colores.value); toast('Stock recalculado desde colores.', 'ok'); });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const saved = await saveProductFromForm(form);
      if (saved) closeModal();
    });
  }});
}

function fillProductForm(form, product) {
  const json = typeof product.json === 'object' ? product.json : {};
  Object.entries(product).forEach(([key, value]) => {
    if (form.elements[key]) {
      if (form.elements[key].type === 'checkbox') form.elements[key].checked = Boolean(value);
      else form.elements[key].value = typeof value === 'object' ? JSON.stringify(value) : value ?? '';
    }
  });
  form.previousCodigo.value = product.codigo || '';
  form.notas.value = json.notas || '';
}

export async function saveProductFromForm(form) {
  const raw = formToObject(form);
  const existing = state.products.find(p => p.codigo === raw.previousCodigo) || {};
  const product = normalizeProduct(raw, existing);
  const result = validateProduct(product, state.products, raw.previousCodigo);
  if (!result.ok) {
    toast(result.errors.join(' '), 'err', 5200);
    return false;
  }
  if (result.warnings.length) toast(result.warnings.join(' '), 'warn', 6200);
  if (raw.previousCodigo && raw.previousCodigo !== product.codigo) {
    const ok = await confirmDialog({ title:'Cambiar código', message:`Vas a cambiar el código ${raw.previousCodigo} por ${product.codigo}. ¿Continuar?`, confirmText:'Sí, cambiar' });
    if (!ok) return false;
    removeProductFromState(raw.previousCodigo);
  }
  product.syncStatus = navigator.onLine && state.settings.appsScriptUrl ? 'pendiente' : 'local';
  updateProductInState(product);
  enqueueAction({ type:'upsertProduct', payload:{ product, previousCodigo: raw.previousCodigo || product.codigo } });
  persistAll();
  toast('Producto guardado localmente. Se sincronizará con Google Sheets cuando sea posible.', 'ok');
  return true;
}

export async function archiveProduct(code) {
  const product = state.products.find(p => p.codigo === code);
  if (!product) return;
  const ok = await confirmDialog({ title:'Desactivar producto', message:`${product.nombre} dejará de aparecer en el catálogo, pero seguirá en inventario.`, confirmText:'Desactivar', danger:true });
  if (!ok) return;
  product.activo = false;
  product.updatedAt = nowISO();
  product.syncStatus = 'pendiente';
  updateProductInState(product);
  enqueueAction({ type:'setActive', payload:{ codigo: code, activo:false } });
  persistAll();
  toast('Producto desactivado.', 'ok');
}

export function duplicateProduct(code) {
  const product = state.products.find(p => p.codigo === code);
  if (!product) return;
  const copy = { ...product, codigo: generateProductCode(), nombre: `${product.nombre} copia`, updatedAt: nowISO(), syncStatus:'local' };
  updateProductInState(copy);
  persistAll();
  openProductForm(copy);
}

export function adjustProductStock(code, delta, color='') {
  const product = state.products.find(p => p.codigo === code);
  if (!product) return { ok:false, error:'Producto no encontrado.' };
  let nextStock = Number(product.stock) + Number(delta);
  if (nextStock < 0) return { ok:false, error:'El stock no puede quedar negativo.' };
  if (color) {
    const colors = parseColorStock(product.colores);
    const item = colors.find(c => c.color === color);
    if (!item) return { ok:false, error:'Color no encontrado.' };
    const nextColorStock = item.qty + Number(delta);
    if (nextColorStock < 0) return { ok:false, error:'El stock del color no puede quedar negativo.' };
    item.qty = nextColorStock;
    product.colores = serializeColorStock(colors);
  }
  product.stock = nextStock;
  product.updatedAt = nowISO();
  product.syncStatus = 'pendiente';
  updateProductInState(product);
  enqueueAction({ type:'updateStock', payload:{ codigo: code, stock: product.stock, colores: product.colores } });
  persistAll();
  return { ok:true };
}

export function renderProductCard(product) {
  const status = productStatus(product, state.settings);
  const metrics = productMetrics(product);
  const colors = parseColorStock(product.colores);
  const canSell = product.activo && Number(product.stock) > 0;
  const fallbackImg = defaultProductImage(product);
  const finalFallbackImg = defaultProductImageFallback();
  const img = product.imagen && isImageUrl(product.imagen)
    ? `<img src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}" loading="lazy" onerror="this.onerror=function(){this.onerror=null;this.src='${finalFallbackImg}';this.classList.add('default-product-img')};this.src='${escapeHtml(fallbackImg)}';this.classList.add('default-product-img');">`
    : `<img class="default-product-img" src="${escapeHtml(fallbackImg)}" alt="Imagen predeterminada para ${escapeHtml(product.nombre)}" loading="lazy" onerror="this.onerror=null;this.src='${finalFallbackImg}'">`;

  const meta = [
    ['Código', product.codigo || 'Sin código', ''],
    ['Categoría', product.categoria || 'Sin categoría', ''],
    ['Marca', product.marca || 'Genérica', ''],
    ['Stock', Number(product.stock || 0), 'stock']
  ].map(([label, value, extra]) => `
    <div class="meta-pill ${extra}">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
    </div>`).join('');

  const colorBlock = colors.length ? `
    <div class="color-stock">
      <span class="section-label">Variantes disponibles</span>
      <div class="color-list">
        ${colors.map(c => `<span class="color-chip"><span>${escapeHtml(c.color)}</span><strong>${c.qty}</strong></span>`).join('')}
      </div>
    </div>` : '';

  return `
    <article class="card product-card" data-code="${escapeHtml(product.codigo)}">
      <div class="product-img">${img}</div>
      <div class="product-body">
        <div class="product-title">
          <h3>${escapeHtml(product.nombre)}</h3>
          <span class="product-status ${status.className}">${status.label}</span>
        </div>
        <div class="product-meta">${meta}</div>
        ${colorBlock}
        <div class="price-row">
          <span class="price">${formatMoney(product.precio, state.settings)}</span>
          <span class="profit-text">Ganancia est.<br>${formatMoney(metrics.gananciaUnitaria, state.settings)}</span>
        </div>
        ${product.promos ? `<div class="notice product-promo">${escapeHtml(product.promos)}</div>` : ''}
        <div class="product-actions">
          <button class="btn primary" data-cart-add="${escapeHtml(product.codigo)}" ${canSell ? '' : 'disabled'}>Vender</button>
          <button class="btn secondary" data-quote-add="${escapeHtml(product.codigo)}" ${canSell ? '' : 'disabled'}>Cotizar</button>
          <button class="btn ghost span" data-whatsapp-product="${escapeHtml(product.codigo)}">WhatsApp</button>
        </div>
      </div>
    </article>`;
}
