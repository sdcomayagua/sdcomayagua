import { state, setProducts, dequeueAction, replaceQueueItem, addSyncLog, notify } from './state.js';
import { persistAll } from './data.js';
import { toast } from './ui.js';
import * as sheets from './sheets.js';
import { nowISO } from './utils.js';

export async function testConnection() {
  try {
    const data = await sheets.ping();
    toast(`Conexión correcta con Google Sheets. Versión ${data.version || 'actual'}.`, 'ok');
    addSyncLog({ type:'ping', ok:true, message:data.message || 'Conexión correcta' });
    persistAll();
    return true;
  } catch (error) {
    toast(error.message, 'err', 6200);
    addSyncLog({ type:'ping', ok:false, error:error.message });
    persistAll();
    return false;
  }
}

export async function pullProductsFromSheets() {
  try {
    state.status.syncing = true; notify('syncing');
    const data = await sheets.getProducts();
    const remote = sheets.normalizeProductsFromSheet(data.products || []);
    const merged = remote.map(p => ({ ...p, syncStatus:'sheets' }));
    for (const local of state.products) {
      const existsRemote = remote.some(p => p.codigo === local.codigo);
      if (!existsRemote && local.syncStatus !== 'sheets') merged.push(local);
    }
    setProducts(merged);
    state.lastSync = nowISO();
    addSyncLog({ type:'pullProducts', ok:true, message:`${remote.length} productos descargados.` });
    persistAll();
    toast('Productos descargados desde Google Sheets.', 'ok');
  } catch (error) {
    addSyncLog({ type:'pullProducts', ok:false, error:error.message });
    toast(error.message, 'err', 6200);
  } finally {
    state.status.syncing = false; notify('syncing'); persistAll();
  }
}

export async function pushPendingQueue() {
  if (!state.pendingQueue.length) return toast('No hay cambios pendientes.', 'ok');
  let okCount = 0;
  state.status.syncing = true; notify('syncing');
  for (const item of [...state.pendingQueue]) {
    try {
      replaceQueueItem(item.id, { attempts: (item.attempts || 0) + 1, lastAttempt: nowISO() });
      if (item.type === 'upsertProduct') await sheets.upsertProduct(item.payload.product, item.payload.previousCodigo);
      else if (item.type === 'saveSale') await sheets.saveSale(item.payload.sale);
      else if (item.type === 'saveQuote') await sheets.saveQuote(item.payload.quote);
      else if (item.type === 'updateStock') await sheets.updateStock(item.payload);
      else if (item.type === 'setActive') await sheets.setActive(item.payload.codigo, item.payload.activo);
      dequeueAction(item.id);
      okCount += 1;
    } catch (error) {
      replaceQueueItem(item.id, { error: error.message });
      addSyncLog({ type:item.type, ok:false, error:error.message });
    }
  }
  state.lastSync = okCount ? nowISO() : state.lastSync;
  state.status.syncing = false; notify('syncing'); persistAll();
  if (okCount) toast(`${okCount} cambio(s) sincronizados correctamente.`, 'ok');
  if (state.pendingQueue.length) toast(`${state.pendingQueue.length} cambio(s) siguen pendientes.`, 'warn');
}
export async function syncNow() {
  if (!state.status.online) return toast('No hay conexión. Los datos quedan guardados localmente.', 'warn');
  await pushPendingQueue();
  if (!state.pendingQueue.length) await pullProductsFromSheets();
}
export function renderSyncView() {
  const logs = state.syncLog.slice(0,12).map(l => `<tr><td>${new Date(l.date).toLocaleString('es-HN')}</td><td>${l.type}</td><td>${l.ok ? '<span class="badge ok">OK</span>' : '<span class="badge err">Error</span>'}</td><td>${l.message || l.error || ''}</td></tr>`).join('') || '<tr><td colspan="4">Sin eventos de sincronización.</td></tr>';
  const queue = state.pendingQueue.map(q => `<tr><td>${q.type}</td><td>${new Date(q.createdAt).toLocaleString('es-HN')}</td><td>${q.attempts || 0}</td><td>${q.error || 'Pendiente'}</td></tr>`).join('') || '<tr><td colspan="4">No hay cambios pendientes.</td></tr>';
  return `<section class="grid" style="grid-template-columns: minmax(0,1fr) minmax(0,1fr)"><article class="card"><h2>Sincronización</h2><p>Estado: ${state.status.online ? 'En línea' : 'Sin conexión'} · Pendientes: ${state.pendingQueue.length}</p><div class="actions-row"><button class="btn primary" data-sync-now>Sincronizar ahora</button><button class="btn secondary" data-pull-products>Descargar productos</button><button class="btn ghost" data-test-connection>Probar conexión</button></div></article><article class="card"><h2>Regla anti “éxito falso”</h2><p class="notice">Si Google Sheets no confirma una operación, la app la marca como pendiente o error. El formulario no borra datos en fallos.</p></article><article class="card"><h2>Cola pendiente</h2><div class="table-wrap"><table><thead><tr><th>Acción</th><th>Fecha</th><th>Intentos</th><th>Estado</th></tr></thead><tbody>${queue}</tbody></table></div></article><article class="card"><h2>Errores y eventos</h2><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>OK</th><th>Mensaje</th></tr></thead><tbody>${logs}</tbody></table></div></article></section>`;
}
export function bindSyncEvents(root=document) {
  root.querySelectorAll('[data-sync-now]').forEach(btn => btn.addEventListener('click', syncNow));
  root.querySelectorAll('[data-pull-products]').forEach(btn => btn.addEventListener('click', pullProductsFromSheets));
  root.querySelectorAll('[data-test-connection]').forEach(btn => btn.addEventListener('click', testConnection));
}
