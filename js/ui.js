import { NAV_ITEMS } from './config.js';
import { state } from './state.js';
import { formatDate, escapeHtml } from './utils.js';

let activeToast = null;
let activeToastTimer = null;
export function toast(message, type='ok', timeout=2200) {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  if (activeToast) activeToast.remove();
  if (activeToastTimer) clearTimeout(activeToastTimer);
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  root.innerHTML = '';
  root.appendChild(node);
  activeToast = node;
  activeToastTimer = setTimeout(() => {
    node.remove();
    if (activeToast === node) activeToast = null;
  }, timeout);
}

export function openModal(title, body, options={}) {
  const root = document.getElementById('modalRoot');
  root.removeAttribute('hidden');
  root.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <header class="modal-header">
        <h2>${escapeHtml(title)}</h2>
        <button class="icon-btn" data-close-modal aria-label="Cerrar">×</button>
      </header>
      <div class="modal-body"></div>
    </section>`;
  const bodyNode = root.querySelector('.modal-body');
  if (typeof body === 'string') bodyNode.innerHTML = body;
  else bodyNode.appendChild(body);
  root.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeModal));
  root.addEventListener('click', handleModalBackdrop, { once: true });
  if (options.onOpen) options.onOpen(root);
  return root;
}
export function closeModal() {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  root.setAttribute('hidden', '');
}
export function resetModalLayer() {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  root.innerHTML = '';
  root.setAttribute('hidden', '');
}
function handleModalBackdrop(event) {
  if (event.target?.id === 'modalRoot') closeModal();
}

export function confirmDialog({ title='Confirmar', message='', confirmText='Confirmar', danger=false }={}) {
  return new Promise(resolve => {
    const html = `
      <p>${escapeHtml(message)}</p>
      <div class="form-actions">
        <button class="btn ghost" data-close-modal>Cancelar</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" id="confirmAction">${escapeHtml(confirmText)}</button>
      </div>`;
    openModal(title, html, { onOpen(root) {
      root.querySelector('#confirmAction').addEventListener('click', () => { closeModal(); resolve(true); });
      root.querySelector('[data-close-modal]').addEventListener('click', () => resolve(false), { once:true });
    }});
  });
}
export function renderNav(active='home') {
  const render = (rootId, maxItems=null) => {
    const root = document.getElementById(rootId);
    const items = maxItems ? NAV_ITEMS.slice(0, maxItems) : NAV_ITEMS;
    root.innerHTML = items.map(item => `<button class="nav-link ${item.id === active ? 'active' : ''}" data-view="${item.id}"><span>${item.icon}</span><span>${item.label}</span></button>`).join('');
  };
  render('desktopNav');
  render('mobileNav', 5);
}
export function renderStatusStrip() {
  const el = document.getElementById('statusStrip');
  const pending = state.pendingQueue.length;
  const dotClass = state.status.online ? 'ok' : 'err';
  el.innerHTML = `
    <button class="status-pill status-pill-action" type="button" data-view-shortcut="sync"><span><span class="dot ${dotClass}"></span> ${state.status.online ? 'En línea' : 'Sin conexión'}</span><strong>${state.status.syncing ? 'Sincronizando' : 'Listo'}</strong></button>
    <button class="status-pill status-pill-action" type="button" data-view-shortcut="sync"><span>Cambios pendientes</span><strong>${pending}</strong></button>
    <button class="status-pill status-pill-action" type="button" data-view-shortcut="sync"><span>Última sincronización</span><strong>${formatDate(state.lastSync)}</strong></button>
    <button class="status-pill status-pill-action" type="button" data-view-shortcut="inventory"><span>Productos cargados</span><strong>${state.products.length}</strong></button>`;
}
export function setViewTitle(title) {
  document.getElementById('viewTitle').textContent = title;
}
export function setSheetIdLabel() {
  const el = document.getElementById('sheetIdLabel');
  if (el) el.textContent = state.settings.sheetId;
}
export function updateDatalists() {
  const cats = [...new Set(state.products.map(p => p.categoria).filter(Boolean))].sort();
  const brands = [...new Set(state.products.map(p => p.marca).filter(Boolean))].sort();
  document.getElementById('categoriasList').innerHTML = cats.map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
  document.getElementById('marcasList').innerHTML = brands.map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
}
export function renderEmpty(message='No hay datos para mostrar.', action='') {
  return `<div class="empty"><strong>${escapeHtml(message)}</strong>${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;
}
export function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type="checkbox"]').forEach(input => { data[input.name] = input.checked; });
  return data;
}