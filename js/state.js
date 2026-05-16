import { DEFAULT_CONFIG } from './config.js';
import { deepClone } from './utils.js';

const listeners = new Set();

export const state = {
  settings: deepClone(DEFAULT_CONFIG),
  products: [],
  sales: [],
  quotes: [],
  customers: [],
  cart: {
    items: [],
    discount: 0,
    deliveryType: 'envio_normal',
    cod: false,
    customer: {},
    notes: '',
  },
  pendingQueue: [],
  syncLog: [],
  lastSync: '',
  status: {
    online: navigator.onLine,
    syncing: false,
    lastError: '',
    activeView: 'home',
  },
  filters: {
    query: '',
    category: '',
    brand: '',
    status: 'todos',
    sort: 'reciente',
    view: 'grid',
  },
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notify(reason='state') {
  listeners.forEach(fn => fn(state, reason));
}
export function patchState(patch={}, reason='patch') {
  Object.assign(state, patch);
  notify(reason);
}
export function setProducts(products=[]) { state.products = products; notify('products'); }
export function setSales(sales=[]) { state.sales = sales; notify('sales'); }
export function setQuotes(quotes=[]) { state.quotes = quotes; notify('quotes'); }
export function setCustomers(customers=[]) { state.customers = customers; notify('customers'); }
export function setCart(cart) { state.cart = { ...state.cart, ...cart }; notify('cart'); }
export function setSettings(settings) { state.settings = { ...state.settings, ...settings }; notify('settings'); }
export function setPendingQueue(queue=[]) { state.pendingQueue = queue; notify('queue'); }
export function addSyncLog(entry) {
  state.syncLog = [{ id: Date.now(), date: new Date().toISOString(), ...entry }, ...state.syncLog].slice(0, 50);
  notify('syncLog');
}
export function getProductByCode(code) {
  return state.products.find(p => String(p.codigo) === String(code));
}
export function updateProductInState(product) {
  const idx = state.products.findIndex(p => String(p.codigo) === String(product.codigo));
  if (idx >= 0) state.products.splice(idx, 1, product);
  else state.products.unshift(product);
  notify('products');
}
export function removeProductFromState(code) {
  state.products = state.products.filter(p => String(p.codigo) !== String(code));
  notify('products');
}
export function enqueueAction(action) {
  state.pendingQueue.push({ id: `Q-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, createdAt: new Date().toISOString(), attempts: 0, ...action });
  notify('queue');
}
export function dequeueAction(id) {
  state.pendingQueue = state.pendingQueue.filter(item => item.id !== id);
  notify('queue');
}
export function replaceQueueItem(id, patch) {
  const item = state.pendingQueue.find(q => q.id === id);
  if (item) Object.assign(item, patch);
  notify('queue');
}

window.addEventListener('online', () => { state.status.online = true; notify('network'); });
window.addEventListener('offline', () => { state.status.online = false; notify('network'); });
