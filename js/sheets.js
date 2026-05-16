import { state } from './state.js';
import { safeJSONParse } from './utils.js';

export async function apiRequest(action, payload={}, options={}) {
  const url = state.settings.appsScriptUrl;
  if (!url) throw new Error('Primero pega la URL /exec del Apps Script en Configuración.');
  const body = { action, ...payload, sheetId: state.settings.sheetId };
  if (options.jsonp) return jsonpRequest(url, body);
  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || data.message || 'Apps Script respondió con error.');
    return data;
  } catch (error) {
    return jsonpRequest(url, body);
  }
}
function jsonpRequest(url, params) {
  return new Promise((resolve, reject) => {
    const cb = `sdPosCb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const qs = new URLSearchParams({ ...params, payload: JSON.stringify(params), callback: cb });
    const finalUrl = `${url}?${qs.toString()}`;
    const timer = setTimeout(() => { cleanup(); reject(new Error('Tiempo de espera agotado conectando con Google Sheets.')); }, 18000);
    window[cb] = (data) => {
      cleanup();
      if (!data?.ok) reject(new Error(data?.error || 'Error desconocido desde Apps Script.'));
      else resolve(data);
    };
    function cleanup() { clearTimeout(timer); delete window[cb]; script.remove(); }
    script.onerror = () => { cleanup(); reject(new Error('No se pudo conectar con Apps Script. Revisa la URL /exec y permisos.')); };
    script.src = finalUrl;
    document.body.appendChild(script);
  });
}
export const ping = () => apiRequest('ping');
export const getProducts = () => apiRequest('getProducts');
export const getSales = () => apiRequest('getSales');
export const getQuotes = () => apiRequest('getQuotes');
export const upsertProduct = (product, previousCodigo='') => apiRequest('upsertProduct', { product, previousCodigo });
export const saveSale = (sale) => apiRequest('saveSale', { sale });
export const saveQuote = (quote) => apiRequest('saveQuote', { quote });
export const updateStock = (payload) => apiRequest('updateStock', payload);
export const setActive = (codigo, activo) => apiRequest('setActive', { codigo, activo });

export function normalizeProductsFromSheet(rows=[]) {
  return rows.map(row => ({ ...row, precio:Number(row.precio || 0), costo:Number(row.costo || 0), stock:Number(row.stock || 0), activo: row.activo !== false && String(row.activo).toLowerCase() !== 'false', json: safeJSONParse(row.json, row.json || {}) }));
}
