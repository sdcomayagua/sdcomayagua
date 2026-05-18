import { state } from './state.js';
import { parseNumber, productMetrics, productStatus, formatMoney, escapeHtml } from './utils.js';

export function getDashboardMetrics() {
  const active = state.products.filter(p => p.activo).length;
  const inactive = state.products.length - active;
  const agotados = state.products.filter(p => p.activo && parseNumber(p.stock) <= 0).length;
  const bajoStock = state.products.filter(p => productStatus(p, state.settings).label === 'Bajo stock').length;
  const stockTotal = state.products.reduce((s,p)=>s+parseNumber(p.stock),0);
  const totals = state.products.reduce((acc,p)=>{
    const m = productMetrics(p);
    acc.valor += m.valorVentaStock; acc.inversion += m.inversionStock; acc.ganancia += m.gananciaProyectada;
    return acc;
  }, { valor:0, inversion:0, ganancia:0 });
  const today = new Date().toISOString().slice(0,10);
  const salesToday = state.sales.filter(s => String(s.fecha).slice(0,10) === today);
  const salesTotal = state.sales.reduce((s,v)=>s+parseNumber(v.total),0);
  const quotesTotal = state.quotes.reduce((s,v)=>s+parseNumber(v.total),0);
  return { active, inactive, agotados, bajoStock, stockTotal, ...totals, salesToday: salesToday.length, salesTotal, quotesTotal, pending: state.pendingQueue.length };
}
export function renderHomeView() {
  const m = getDashboardMetrics();
  const cards = [
    { label:'Productos activos', value:m.active, icon:'🛍️' },
    { label:'Agotados', value:m.agotados, icon:'⚠️' },
    { label:'Bajo stock', value:m.bajoStock, icon:'📉' },
    { label:'Stock total', value:m.stockTotal, icon:'📦' },
    { label:'Valor inventario', value:formatMoney(m.valor, state.settings), icon:'💰' },
    { label:'Inversión', value:formatMoney(m.inversion, state.settings), icon:'🏷️' },
    { label:'Ganancia proyectada', value:formatMoney(m.ganancia, state.settings), icon:'📈' },
    { label:'Ventas de hoy', value:m.salesToday, icon:'🧾' }
  ];
  const recent = [...state.sales].slice(0,5).map(s=>`<tr><td><strong>${escapeHtml(s.venta_id)}</strong></td><td>${escapeHtml(s.cliente)}</td><td><strong>${formatMoney(s.total, state.settings)}</strong></td></tr>`).join('') || '<tr><td colspan="3">Sin ventas recientes.</td></tr>';
  return `
  <section class="sdc-home-hero">
    <article class="sdc-hero-card">
      <span class="sdc-hero-chip">Panel principal · ${escapeHtml(state.settings.storeName || 'SD COMAYAGUA')}</span>
      <h2>Control claro para inventario, catálogo y ventas.</h2>
      <p>Un inicio más visual para ver rápido qué productos necesitan atención, cuánto vale el inventario y qué acciones usar durante el día.</p>
      <div class="sdc-hero-actions">
        <button class="btn primary" data-open-product>+ Agregar producto</button>
        <button class="btn secondary" data-view-shortcut="catalog">Abrir catálogo</button>
        <button class="btn secondary" data-view-shortcut="cart">Nueva venta</button>
        <button class="btn ghost" data-sync-now>Sincronizar</button>
      </div>
    </article>
    <article class="sdc-health-card">
      <div>
        <h3>Estado rápido</h3>
        <p class="notice">La app sigue trabajando aunque no haya conexión; los cambios quedan pendientes hasta sincronizar.</p>
      </div>
      <div class="sdc-health-list">
        <div class="sdc-health-item"><span>Productos registrados</span><strong>${state.products.length}</strong></div>
        <div class="sdc-health-item"><span>Pendientes por subir</span><strong>${state.pendingQueue.length}</strong></div>
        <div class="sdc-health-item"><span>Ventas guardadas</span><strong>${state.sales.length}</strong></div>
        <div class="sdc-health-item"><span>Cotizaciones</span><strong>${state.quotes.length}</strong></div>
      </div>
    </article>
  </section>
  <section class="grid kpi-grid">${cards.map(item=>`<article class="card kpi" data-sdc-icon="${item.icon}"><span>${item.label}</span><strong>${item.value}</strong></article>`).join('')}</section>
  <section class="sdc-content-grid">
    <article class="card"><h2>Accesos rápidos</h2><p>Botones grandes para las tareas más usadas en mostrador.</p><div class="actions-row"><button class="btn primary" data-open-product>Agregar producto</button><button class="btn secondary" data-view-shortcut="inventory">Inventario</button><button class="btn secondary" data-view-shortcut="reports">Reportes</button><button class="btn ghost" data-view-shortcut="settings">Configuración</button></div></article>
    <article class="card"><h2>Ventas recientes</h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Total</th></tr></thead><tbody>${recent}</tbody></table></div></article>
  </section>`;
}

export function renderReportsView() {
  const m = getDashboardMetrics();
  const productsByCategory = Object.entries(state.products.reduce((acc,p)=>{ const k=p.categoria||'Sin categoría'; acc[k]=(acc[k]||0)+1; return acc; }, {}));
  const rows = productsByCategory.map(([cat,count])=>`<tr><td>${escapeHtml(cat)}</td><td>${count}</td></tr>`).join('') || '<tr><td colspan="2">Sin categorías.</td></tr>';
  return `<section class="grid kpi-grid"><article class="card kpi"><span>Total ventas</span><strong>${formatMoney(m.salesTotal, state.settings)}</strong></article><article class="card kpi"><span>Total cotizado</span><strong>${formatMoney(m.quotesTotal, state.settings)}</strong></article><article class="card kpi"><span>Inventario venta</span><strong>${formatMoney(m.valor, state.settings)}</strong></article><article class="card kpi"><span>Ganancia proyectada</span><strong>${formatMoney(m.ganancia, state.settings)}</strong></article></section><section class="card" style="margin-top:16px"><h2>Productos por categoría</h2><div class="table-wrap"><table><thead><tr><th>Categoría</th><th>Productos</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
