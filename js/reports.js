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
    ['Productos activos', m.active], ['Agotados', m.agotados], ['Bajo stock', m.bajoStock], ['Stock total', m.stockTotal],
    ['Valor inventario', formatMoney(m.valor, state.settings)], ['Inversión', formatMoney(m.inversion, state.settings)], ['Ganancia proyectada', formatMoney(m.ganancia, state.settings)], ['Ventas de hoy', m.salesToday]
  ];
  const recent = [...state.sales].slice(0,5).map(s=>`<tr><td>${escapeHtml(s.venta_id)}</td><td>${escapeHtml(s.cliente)}</td><td>${formatMoney(s.total, state.settings)}</td></tr>`).join('') || '<tr><td colspan="3">Sin ventas recientes.</td></tr>';
  return `<section class="grid kpi-grid">${cards.map(([label,value])=>`<article class="card kpi"><span>${label}</span><strong>${value}</strong></article>`).join('')}</section>
  <section class="grid" style="grid-template-columns: minmax(0,1fr) minmax(0,1fr); margin-top:16px">
    <article class="card"><h2>Accesos rápidos</h2><div class="actions-row"><button class="btn primary" data-open-product>Agregar producto</button><button class="btn secondary" data-view-shortcut="catalog">Abrir catálogo</button><button class="btn secondary" data-view-shortcut="cart">Nueva venta</button><button class="btn ghost" data-sync-now>Sincronizar</button></div></article>
    <article class="card"><h2>Estado del sistema</h2><p>Productos: ${state.products.length} · Pendientes de subir: ${state.pendingQueue.length} · Ventas: ${state.sales.length} · Cotizaciones: ${state.quotes.length}</p><p class="notice">La app puede trabajar localmente aunque Google Sheets no responda. Los cambios pendientes se suben después.</p></article>
    <article class="card" style="grid-column:1/-1"><h2>Ventas recientes</h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Total</th></tr></thead><tbody>${recent}</tbody></table></div></article>
  </section>`;
}
export function renderReportsView() {
  const m = getDashboardMetrics();
  const productsByCategory = Object.entries(state.products.reduce((acc,p)=>{ const k=p.categoria||'Sin categoría'; acc[k]=(acc[k]||0)+1; return acc; }, {}));
  const rows = productsByCategory.map(([cat,count])=>`<tr><td>${escapeHtml(cat)}</td><td>${count}</td></tr>`).join('') || '<tr><td colspan="2">Sin categorías.</td></tr>';
  return `<section class="grid kpi-grid"><article class="card kpi"><span>Total ventas</span><strong>${formatMoney(m.salesTotal, state.settings)}</strong></article><article class="card kpi"><span>Total cotizado</span><strong>${formatMoney(m.quotesTotal, state.settings)}</strong></article><article class="card kpi"><span>Inventario venta</span><strong>${formatMoney(m.valor, state.settings)}</strong></article><article class="card kpi"><span>Ganancia proyectada</span><strong>${formatMoney(m.ganancia, state.settings)}</strong></article></section><section class="card" style="margin-top:16px"><h2>Productos por categoría</h2><div class="table-wrap"><table><thead><tr><th>Categoría</th><th>Productos</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
