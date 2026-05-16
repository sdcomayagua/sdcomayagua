import { APP_VERSION } from './config.js';
import { state, subscribe, notify, setSettings } from './state.js';
import { initializeData, persistAll, applySavedTheme } from './data.js';
import { renderNav, renderStatusStrip, setViewTitle, setSheetIdLabel, updateDatalists, toast } from './ui.js';
import { openProductForm, renderProductCard } from './products.js';
import { addToCart, renderCartView, bindCartEvents } from './cart.js';
import { createSaleFromCart, renderSalesView, bindSalesEvents } from './sales.js';
import { createQuoteFromCart, renderQuotesView, bindQuotesEvents } from './quotes.js';
import { renderCustomersView, bindCustomerEvents } from './customers.js';
import { renderHomeView, renderReportsView } from './reports.js';
import { renderSyncView, bindSyncEvents, syncNow, testConnection } from './sync.js';
import { bindBackupEvents } from './backup.js';
import { renderInventoryView, bindInventoryEvents, getFilteredProducts, renderFilters } from './inventory.js';
import { buildProductWhatsApp, openWhatsApp } from './whatsapp.js';
import { escapeHtml } from './utils.js';

const root = document.getElementById('viewRoot');
const titles = {
  home:'Inicio', catalog:'Catálogo', inventory:'Inventario', cart:'Carrito', quotes:'Cotizaciones', sales:'Ventas', customers:'Clientes', reports:'Reportes', sync:'Sincronización', settings:'Configuración'
};

initializeData();
boot();

function boot() {
  setSheetIdLabel();
  render();
  subscribe((_, reason) => {
    persistAll();
    renderStatusStrip();
    setSheetIdLabel();
    updateDatalists();
    if (['products','cart','sales','quotes','customers','settings','queue','network','syncing'].includes(reason)) {
      renderCurrentView();
    }
  });
  document.addEventListener('click', handleGlobalClick);
  document.getElementById('syncBtn').addEventListener('click', syncNow);
  document.getElementById('themeToggle').addEventListener('click', cycleTheme);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
function render() {
  renderNav(state.status.activeView);
  renderStatusStrip();
  updateDatalists();
  renderCurrentView();
}
function handleGlobalClick(event) {
  const viewBtn = event.target.closest('[data-view]');
  if (viewBtn) return navigate(viewBtn.dataset.view);
  const openProduct = event.target.closest('[data-open-product]');
  if (openProduct) return openProductForm();
  const shortcut = event.target.closest('[data-view-shortcut]');
  if (shortcut) return navigate(shortcut.dataset.viewShortcut);
}
function navigate(view) {
  state.status.activeView = view;
  renderNav(view);
  renderCurrentView();
  root.focus();
}
function renderCurrentView() {
  const view = state.status.activeView;
  setViewTitle(titles[view] || 'SD COMAYAGUA POS');
  if (view === 'home') root.innerHTML = renderHomeView();
  if (view === 'catalog') root.innerHTML = renderCatalogView();
  if (view === 'inventory') root.innerHTML = renderInventoryView();
  if (view === 'cart') root.innerHTML = renderCartView();
  if (view === 'quotes') root.innerHTML = renderQuotesView();
  if (view === 'sales') root.innerHTML = renderSalesView();
  if (view === 'customers') root.innerHTML = renderCustomersView();
  if (view === 'reports') root.innerHTML = renderReportsView();
  if (view === 'sync') root.innerHTML = renderSyncView();
  if (view === 'settings') root.innerHTML = renderSettingsView();
  bindViewEvents(view);
}
function bindViewEvents(view) {
  bindCommonProductButtons(root);
  bindSyncEvents(root);
  if (view === 'inventory') bindInventoryEvents(root, renderCurrentView);
  if (view === 'catalog') bindCatalogEvents(root);
  if (view === 'cart') {
    bindCartEvents(root);
    root.querySelector('[data-save-sale]')?.addEventListener('click', createSaleFromCart);
    root.querySelector('[data-save-quote]')?.addEventListener('click', createQuoteFromCart);
  }
  if (view === 'sales') bindSalesEvents(root);
  if (view === 'quotes') bindQuotesEvents(root);
  if (view === 'customers') bindCustomerEvents(root);
  if (view === 'settings') bindSettingsEvents(root);
}
function bindCommonProductButtons(container) {
  container.querySelectorAll('[data-cart-add]').forEach(btn => btn.addEventListener('click', () => { addToCart(btn.dataset.cartAdd, 'sale'); navigate('cart'); }));
  container.querySelectorAll('[data-quote-add]').forEach(btn => btn.addEventListener('click', () => { addToCart(btn.dataset.quoteAdd, 'quote'); navigate('cart'); }));
  container.querySelectorAll('[data-whatsapp-product]').forEach(btn => btn.addEventListener('click', () => {
    const product = state.products.find(p => p.codigo === btn.dataset.whatsappProduct);
    if (product) openWhatsApp(buildProductWhatsApp(product));
  }));
}
function renderCatalogView() {
  const products = getFilteredProducts().filter(p => p.activo);
  return `${renderFilters()}${products.length ? `<section class="product-grid">${products.map(renderProductCard).join('')}</section>` : '<div class="empty">No hay productos activos con estos filtros.</div>'}`;
}
function bindCatalogEvents(root) {
  bindInventoryEvents(root, renderCurrentView);
}
function cycleTheme() {
  const order = ['dark','light','black'];
  const nextTheme = order[(order.indexOf(state.settings.defaultTheme || 'dark') + 1) % order.length];
  setSettings({ ...state.settings, defaultTheme: nextTheme });
  applySavedTheme(state.settings);
  persistAll();
  toast(`Tema cambiado a ${nextTheme}.`, 'ok');
}
function renderSettingsView() {
  return `<section class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
    <article class="card"><h2>Configuración general</h2><form id="settingsForm" class="form-grid">
      <label>Nombre tienda <input name="storeName" value="${escapeHtml(state.settings.storeName)}"></label>
      <label>WhatsApp <input name="whatsapp" value="${escapeHtml(state.settings.whatsapp)}"></label>
      <label>Moneda <input name="currency" value="${escapeHtml(state.settings.currency)}"></label>
      <label>Envío normal <input name="normalShipping" type="number" value="${state.settings.normalShipping}"></label>
      <label>Envío COD <input name="codShipping" type="number" value="${state.settings.codShipping}"></label>
      <label>Comisión COD <input name="codCommissionRate" type="number" step="0.01" value="${state.settings.codCommissionRate}"></label>
      <label class="span-2">Sheet ID <input name="sheetId" value="${escapeHtml(state.settings.sheetId)}" readonly></label>
      <label class="span-2">URL Apps Script /exec <input name="appsScriptUrl" value="${escapeHtml(state.settings.appsScriptUrl)}" placeholder="https://script.google.com/macros/s/.../exec"></label>
      <label>Tema <select name="defaultTheme"><option value="dark" ${state.settings.defaultTheme==='dark'?'selected':''}>Oscuro</option><option value="light" ${state.settings.defaultTheme==='light'?'selected':''}>Claro</option><option value="black" ${state.settings.defaultTheme==='black'?'selected':''}>Negro</option></select></label>
      <label>Color <select name="defaultAccent"><option value="blue" ${state.settings.defaultAccent==='blue'?'selected':''}>Azul</option><option value="red" ${state.settings.defaultAccent==='red'?'selected':''}>Rojo</option><option value="black" ${state.settings.defaultAccent==='black'?'selected':''}>Negro</option></select></label>
      <div class="form-actions span-2"><button class="btn primary">Guardar configuración</button><button type="button" class="btn ghost" data-test-connection>Probar conexión</button></div>
    </form></article>
    <article class="card"><h2>Respaldos e importación</h2><p>Versión actual: ${APP_VERSION}</p><div class="actions-row"><button class="btn primary" data-export-backup>Exportar respaldo</button><button class="btn secondary" data-export-products-json>Productos JSON</button><button class="btn secondary" data-export-products-csv>Productos CSV</button><label class="btn ghost">Importar respaldo<input hidden type="file" accept="application/json" data-import-backup></label><label class="btn ghost">Importar productos<input hidden type="file" accept="application/json" data-import-products-json></label><button class="btn danger" data-clear-cache>Limpiar caché</button></div><p class="notice">La app guarda productos, carrito, ventas, cotizaciones y cola pendiente en localStorage.</p></article>
  </section>`;
}
function bindSettingsEvents(root) {
  root.querySelector('#settingsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const next = { ...state.settings, ...data, normalShipping:Number(data.normalShipping), codShipping:Number(data.codShipping), codCommissionRate:Number(data.codCommissionRate) };
    setSettings(next); applySavedTheme(next); persistAll(); toast('Configuración guardada.', 'ok');
  });
  bindBackupEvents(root);
  root.querySelector('[data-test-connection]')?.addEventListener('click', testConnection);
}
window.SD_POS = { state, navigate, syncNow, openProductForm };
