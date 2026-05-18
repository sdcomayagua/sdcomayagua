import { state, setCustomers } from './state.js';
import { persistAll } from './data.js';
import { uid, nowISO, escapeHtml } from './utils.js';
import { openModal, closeModal, toast, formToObject } from './ui.js';

export function openCustomerForm(customer=null) {
  const html = `<form id="customerForm" class="form-grid">
    <input type="hidden" name="cliente_id" value="${escapeHtml(customer?.cliente_id || '')}">
    <label>Nombre <input name="nombre" required value="${escapeHtml(customer?.nombre || '')}"></label>
    <label>Teléfono <input name="telefono" value="${escapeHtml(customer?.telefono || '')}"></label>
    <label>Departamento <input name="departamento" value="${escapeHtml(customer?.departamento || '')}"></label>
    <label>Municipio <input name="municipio" value="${escapeHtml(customer?.municipio || '')}"></label>
    <label class="span-2">Dirección <textarea name="direccion" rows="2">${escapeHtml(customer?.direccion || '')}</textarea></label>
    <label class="span-2">Referencia <textarea name="referencia" rows="2">${escapeHtml(customer?.referencia || '')}</textarea></label>
    <label class="span-2">Notas <textarea name="notas" rows="2">${escapeHtml(customer?.notas || '')}</textarea></label>
    <div class="form-actions span-2"><button type="button" class="btn ghost" data-close-modal>Cancelar</button><button class="btn primary">Guardar cliente</button></div>
  </form>`;
  openModal(customer ? 'Editar cliente' : 'Agregar cliente', html, { onOpen(root) {
    root.querySelector('#customerForm').addEventListener('submit', e => {
      e.preventDefault();
      const data = formToObject(e.currentTarget);
      if (!data.nombre) return toast('El nombre del cliente es obligatorio.', 'err');
      const cliente = { ...data, cliente_id: data.cliente_id || uid('CLI'), fecha_creacion: customer?.fecha_creacion || nowISO(), ultima_compra: customer?.ultima_compra || '' };
      const idx = state.customers.findIndex(c => c.cliente_id === cliente.cliente_id);
      const list = [...state.customers];
      if (idx >= 0) list.splice(idx, 1, cliente); else list.unshift(cliente);
      setCustomers(list); persistAll(); closeModal(); toast('Cliente guardado.', 'ok');
    });
  }});
}
export function renderCustomersView() {
  const rows = state.customers.length ? state.customers.map(c => `<tr><td>${escapeHtml(c.nombre)}</td><td>${escapeHtml(c.telefono)}</td><td>${escapeHtml(c.departamento)}</td><td>${escapeHtml(c.municipio)}</td><td>${escapeHtml(c.direccion)}</td><td><button class="mini-btn" data-edit-customer="${c.cliente_id}">Editar</button></td></tr>`).join('') : `<tr><td colspan="6">No hay clientes guardados.</td></tr>`;
  return `<section class="card"><div class="toolbar"><h2>Clientes</h2><button class="btn primary" data-new-customer>+ Cliente</button></div><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Departamento</th><th>Municipio</th><th>Dirección</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
export function bindCustomerEvents(root=document) {
  root.querySelector('[data-new-customer]')?.addEventListener('click', () => openCustomerForm());
  root.querySelectorAll('[data-edit-customer]').forEach(btn => btn.addEventListener('click', () => openCustomerForm(state.customers.find(c => c.cliente_id === btn.dataset.editCustomer))));
}
