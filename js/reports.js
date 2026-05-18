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
    { label:'Productos activos', value:m.active, icon:'🛍️', view:'inventory' },
    { label:'Agotados', value:m.agotados, icon:'⚠️', view:'inventory', status:'agotados' },
    { label:'Bajo stock', value:m.bajoStock, icon:'📉', view:'inventory', status:'bajo_stock' },
    { label:'Stock total', value:m.stockTotal, icon:'📦', view:'inventory' },
    { label:'Valor inventario', value:formatMoney(m.valor, state.settings), icon:'💰', view:'reports' },
    { label:'Inversión', value:formatMoney(m.inversion, state.settings), icon:'🏷️', view:'reports' },
    { label:'Ganancia proyectada', value:formatMoney(m.ganancia, state.settings), icon:'📈', view:'reports' },
    { label:'Ventas de hoy', value:m.salesToday, icon:'🧾', view:'sales' }
  ];
  const recent = [...state.sales].slice(0,5).map(s=>`<tr><td><strong>${escapeHtml(s.venta_id)}</strong></td><td>${escapeHtml(s.cliente)}</td><td><strong>${formatMoney(s.total, state.settings)}</strong></td></tr>`).join('') || '<tr><td colspan="3">Sin ventas recientes.</td></tr>';
  const statusCards = [
    { label:'Productos', value:state.products.length, helper:'Editar catálogo', view:'inventory', icon:'📦' },
    { label:'Pendientes', value:state.pendingQueue.length, helper:'Revisar sincronización', view:'sync', icon:'☁️' },
    { label:'Ventas', value:state.sales.length, helper:'Historial guardado', view:'sales', icon:'💵' },
    { label:'Cotizaciones', value:state.quotes.length, helper:'Seguimiento', view:'quotes', icon:'🧾' }
  ];
  return `
  <section class="sdc-home-clean sdc-home-elite">
    <article class="sdc-summary-card sdc-command-card">
      <div class="sdc-summary-head sdc-command-head">
        <span class="sdc-section-kicker">Resumen</span>
        <h2>Operación de tienda</h2>
      </div>
      <div class="sdc-command-total">
        <span>Inventario a precio de venta</span>
        <strong>${formatMoney(m.valor, state.settings)}</strong>
      </div>
      <div class="sdc-health-list sdc-health-clicks sdc-health-premium">
        ${statusCards.map(item=>`<button class="sdc-health-item" type="button" data-view-shortcut="${item.view}"><span><b>${item.icon}</b> ${item.label}<small>${item.helper}</small></span><strong>${item.value}</strong></button>`).join('')}
      </div>
    </article>
    <article class="sdc-task-card sdc-priority-card">
      <span class="sdc-section-kicker">Prioridad</span>
      <div class="sdc-priority-stack">
        <button type="button" data-view-shortcut="sync" class="sdc-priority-row"><span><b>☁️</b>Pendientes por subir</span><strong>${m.pending}</strong></button>
        <button type="button" data-view-shortcut="inventory" data-filter-status="agotados" class="sdc-priority-row"><span><b>⚠️</b>Agotados</span><strong>${m.agotados}</strong></button>
        <button type="button" data-view-shortcut="inventory" data-filter-status="bajo_stock" class="sdc-priority-row"><span><b>📉</b>Bajo stock</span><strong>${m.bajoStock}</strong></button>
      </div>
      <div class="sdc-task-grid sdc-task-grid-compact">
        <button class="sdc-task-btn" type="button" data-open-product><b>＋</b><span>Producto</span><small>Agregar</small></button>
        <button class="sdc-task-btn" type="button" data-view-shortcut="settings"><b>⚙️</b><span>Ajustes</span><small>Sistema</small></button>
      </div>
    </article>
  </section>
  <section class="grid kpi-grid sdc-kpi-grid-premium">${cards.map(item=>`<button class="card kpi sdc-kpi-button" type="button" data-view-shortcut="${item.view}" ${item.status ? `data-filter-status="${item.status}"` : ''} data-sdc-icon="${item.icon}"><span>${item.label}</span><strong>${item.value}</strong></button>`).join('')}</section>
  <section class="sdc-content-grid sdc-content-grid--balanced sdc-desktop-panels">
    <article class="card"><h2>Ventas recientes</h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>Cliente</th><th>Total</th></tr></thead><tbody>${recent}</tbody></table></div></article>
    <article class="card sdc-next-actions"><h2>Accesos de gestión</h2><div class="sdc-check-list"><button type="button" data-view-shortcut="inventory"><span>Editar inventario</span><strong>→</strong></button><button type="button" data-view-shortcut="reports"><span>Ver reportes</span><strong>→</strong></button><button type="button" data-view-shortcut="settings"><span>Configuración</span><strong>→</strong></button></div></article>
  </section>`;
}

export function renderReportsView() {
  const m = getDashboardMetrics();
  const productsByCategory = Object.entries(state.products.reduce((acc,p)=>{ const k=p.categoria||'Sin categoría'; acc[k]=(acc[k]||0)+1; return acc; }, {}));
  const rows = productsByCategory.map(([cat,count])=>`<tr><td>${escapeHtml(cat)}</td><td>${count}</td></tr>`).join('') || '<tr><td colspan="2">Sin categorías.</td></tr>';
  return `<section class="grid kpi-grid"><article class="card kpi"><span>Total ventas</span><strong>${formatMoney(m.salesTotal, state.settings)}</strong></article><article class="card kpi"><span>Total cotizado</span><strong>${formatMoney(m.quotesTotal, state.settings)}</strong></article><article class="card kpi"><span>Inventario venta</span><strong>${formatMoney(m.valor, state.settings)}</strong></article><article class="card kpi"><span>Ganancia proyectada</span><strong>${formatMoney(m.ganancia, state.settings)}</strong></article></section><section class="card" style="margin-top:16px"><h2>Productos por categoría</h2><div class="table-wrap"><table><thead><tr><th>Categoría</th><th>Productos</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
