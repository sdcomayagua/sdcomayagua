import { DEFAULT_CONFIG } from './config.js';

export const nowISO = () => new Date().toISOString();
export const uid = (prefix='ID') => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
export const normalizeText = (value='') => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const parseNumber = (value, fallback=0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const cleaned = String(value ?? '').replace(/,/g,'.').replace(/[^0-9.-]/g,'');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
};
export const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const v = normalizeText(value);
  if (['false','no','0','inactivo','oculto','cancelado'].includes(v)) return false;
  return true;
};
export const clamp = (n, min=0, max=Infinity) => Math.min(Math.max(parseNumber(n), min), max);
export const formatMoney = (value, config=DEFAULT_CONFIG) => `${config.currency} ${parseNumber(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatDate = (iso) => iso ? new Date(iso).toLocaleString('es-HN', { dateStyle:'medium', timeStyle:'short' }) : 'Nunca';
export const safeJSONParse = (value, fallback={}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};
export const safeJSONStringify = (value) => {
  try { return JSON.stringify(value ?? {}, null, 0); } catch { return '{}'; }
};
export const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
export const escapeHtml = (text='') => String(text ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
export const isImageUrl = (url='') => /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(String(url).trim()) || /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(String(url).trim()) || /^https?:\/\//i.test(String(url).trim());

export function parseColorStock(text='') {
  const raw = String(text ?? '').trim();
  if (!raw) return [];
  return raw.split(/[;,\n]+/).map(part => part.trim()).filter(Boolean).map(part => {
    const match = part.match(/^(.+?)(?:\s*[=:]\s*|\s+)(-?\d+(?:[.,]\d+)?)$/);
    if (!match) return null;
    return { color: match[1].trim(), qty: Math.max(0, Math.floor(parseNumber(match[2]))) };
  }).filter(Boolean);
}
export function serializeColorStock(items=[]) {
  return (items || []).filter(i => i.color).map(i => `${i.color.trim()}=${Math.max(0, Math.floor(parseNumber(i.qty)))}`).join('; ');
}
export function sumColorStock(textOrItems='') {
  const items = Array.isArray(textOrItems) ? textOrItems : parseColorStock(textOrItems);
  return items.reduce((sum, item) => sum + Math.max(0, Math.floor(parseNumber(item.qty))), 0);
}
export function productStatus(product, config=DEFAULT_CONFIG) {
  if (!parseBoolean(product.activo)) return { label:'Inactivo', className:'muted' };
  const stock = parseNumber(product.stock);
  const limit = parseNumber(safeJSONParse(product.json).bajo_stock_minimo, config.lowStockLimit);
  if (stock <= 0) return { label:'Agotado', className:'err' };
  if (stock <= limit) return { label:'Bajo stock', className:'warn' };
  return { label:'Disponible', className:'ok' };
}
export function normalizeProduct(input={}, existing={}) {
  const extra = { ...safeJSONParse(existing.json), ...safeJSONParse(input.json) };
  if (input.notas) extra.notas = input.notas;
  const colores = String(input.colores ?? existing.colores ?? '').trim();
  const colorSum = sumColorStock(colores);
  const stockInput = input.stock ?? existing.stock ?? 0;
  const stock = colorSum > 0 && (stockInput === '' || stockInput === undefined || stockInput === null) ? colorSum : Math.max(0, Math.floor(parseNumber(stockInput)));
  return {
    codigo: String(input.codigo ?? existing.codigo ?? '').trim(),
    nombre: String(input.nombre ?? existing.nombre ?? '').trim(),
    categoria: String(input.categoria ?? existing.categoria ?? '').trim(),
    marca: String(input.marca ?? existing.marca ?? '').trim(),
    precio: parseNumber(input.precio ?? existing.precio),
    costo: parseNumber(input.costo ?? existing.costo),
    stock,
    colores: serializeColorStock(parseColorStock(colores)) || colores,
    imagen: String(input.imagen ?? existing.imagen ?? '').trim(),
    galeria: String(input.galeria ?? existing.galeria ?? '').trim(),
    descripcion: String(input.descripcion ?? existing.descripcion ?? '').trim(),
    promos: String(input.promos ?? existing.promos ?? '').trim(),
    activo: parseBoolean(input.activo ?? existing.activo ?? true),
    updatedAt: nowISO(),
    json: extra,
    syncStatus: input.syncStatus ?? existing.syncStatus ?? 'local',
  };
}
export function productMetrics(product) {
  const precio = parseNumber(product.precio);
  const costo = parseNumber(product.costo);
  const stock = parseNumber(product.stock);
  const gananciaUnitaria = precio - costo;
  return {
    gananciaUnitaria,
    inversionStock: costo * stock,
    valorVentaStock: precio * stock,
    gananciaProyectada: gananciaUnitaria * stock,
  };
}
export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
}
export function toCSV(rows, columns) {
  const header = columns.join(',');
  const body = rows.map(row => columns.map(col => csvEscape(typeof row[col] === 'object' ? safeJSONStringify(row[col]) : row[col])).join(',')).join('\n');
  return `${header}\n${body}`;
}
export function downloadText(filename, text, mime='text/plain;charset=utf-8') {
  const blob = new Blob([text], { type:mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export function imageFallbackText(product) {
  return (product?.nombre || 'SD').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
export function slugifyAsset(value='') {
  return normalizeText(value).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
export function defaultProductImage(product={}) {
  const source = normalizeText(`${product.categoria || ''} ${product.nombre || ''}`);
  const direct = slugifyAsset(product.categoria || product.nombre || 'general');
  const keywordMap = [
    ['dedal', 'dedales'], ['guante', 'guantes'], ['gatillo', 'gatillo'], ['trigger', 'trigger'],
    ['gamer', 'gamer-movil'], ['gamepad', 'gamer'], ['control', 'gamer'],
    ['audifono', 'audifonos'], ['auricular', 'auriculares'], ['audio', 'audio'], ['tipo c', 'tipo-c'],
    ['adaptador', 'adaptador'], ['microsd', 'microsd'], ['micro sd', 'micro-sd'], ['memoria', 'memoria'], ['usb', 'memoria'],
    ['cable', 'cable'], ['cargador', 'cargador'], ['cooler', 'cooler'], ['enfriador', 'enfriador'],
    ['belleza', 'belleza'], ['cocina', 'cocina'], ['herramienta', 'herramientas'], ['hogar', 'hogar'],
    ['termo', 'termo'], ['zapato', 'zapatos'], ['secador', 'secador-zapatos'], ['limpieza', 'limpieza'],
    ['celular', 'celulares'], ['tecnologia', 'tecnologia'], ['accesorio', 'accesorios']
  ];
  const match = keywordMap.find(([keyword]) => source.includes(keyword));
  const file = match ? match[1] : direct || 'general';
  return `assets/categorias/${file}.svg`;
}
export function defaultProductImageFallback() {
  return 'assets/categorias/general.svg';
}
export function uniqueList(items) {
  return [...new Set((items || []).map(v => String(v ?? '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
}
export function matchesProduct(product, query='') {
  const q = normalizeText(query);
  if (!q) return true;
  return ['codigo','nombre','categoria','marca','descripcion','promos'].some(key => normalizeText(product[key]).includes(q));
}