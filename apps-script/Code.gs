/**
 * SD COMAYAGUA · Apps Script API para GitHub Pages
 * Hoja principal: productos_pos
 * Deploy recomendado: Implementar > Nueva implementación > Aplicación web > Ejecutar como: Yo > Acceso: Cualquier usuario con el enlace.
 */
const CONFIG = {
  SHEET_ID: '1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY',
  PRODUCTS_SHEET: 'productos_pos',
  SETTINGS_SHEET: 'ajustes_pos',
  LOGS_SHEET: 'logs_pos',
  // Seguridad: si este archivo se sube a GitHub público, quite esta clave y use Propiedades del script: ADMIN_KEY.
  ADMIN_KEY: '199311'
};

const PRODUCT_HEADERS = [
  'id','codigo','nombre','categoria','marca','precio','costo','stock','descripcion','imagen',
  'activo','updatedAt','valor_venta_stock','inversion_stock','ganancia_unitaria','ganancia_proyectada',
  'estado_stock','promos','notas','orden'
];

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || p.only || p.resource || 'products').toLowerCase();
  let out;
  try {
    if (action === 'ping') out = { ok: true, name: 'SDC Apps Script API', sheetId: getSheetId_(p), at: new Date().toISOString() };
    else if (['products','productos','catalog','catalogo'].indexOf(action) >= 0) out = getProducts_(p);
    else if (['settings','ajustes'].indexOf(action) >= 0) out = getSettings_(p);
    else if (['full','all','todo'].indexOf(action) >= 0) out = { ok: true, products: getProducts_(p).products, settings: getSettings_(p).settings, at: new Date().toISOString() };
    else out = { ok: false, error: 'Acción no soportada: ' + action };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return output_(out, p.callback);
}

function doPost(e) {
  let payload = {};
  try {
    payload = parsePayload_(e);
    assertAdmin_(payload);
    const action = String(payload.action || '').toLowerCase();
    let out;
    if (action === 'upsertproduct' || action === 'saveproduct' || action === 'updateproduct' || action === 'createproduct') out = upsertProduct_(payload.product || payload, payload);
    else if (action === 'setactive') out = setProductActive_(payload.codigo || payload.id, payload.active, payload);
    else out = { ok: false, error: 'Acción POST no soportada: ' + action };
    return output_(out);
  } catch (err) {
    return output_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function getProducts_(params) {
  params = params || {};
  const sh = getProductsSheet_(params);
  const values = sh.getDataRange().getValues();
  if (!values.length) return { ok: true, products: [], count: 0, sheet: sh.getName(), at: new Date().toISOString() };
  const headers = values[0].map(String);
  const includeInactive = String(params.includeInactive || '').toLowerCase() === 'true';
  const products = [];
  for (let i = 1; i < values.length; i++) {
    const obj = rowToObject_(headers, values[i]);
    if (!obj.nombre && !obj.codigo) continue;
    const active = String(obj.activo === undefined ? '1' : obj.activo).toLowerCase();
    if (!includeInactive && ['0','0.0','false','no','inactivo'].indexOf(active) >= 0) continue;
    products.push(normalizeProductOut_(obj));
  }
  return { ok: true, products, count: products.length, sheet: sh.getName(), sheetId: getSheetId_(params), at: new Date().toISOString() };
}

function getSettings_(params) {
  const ss = SpreadsheetApp.openById(getSheetId_(params));
  const sh = ss.getSheetByName(CONFIG.SETTINGS_SHEET);
  const settings = {};
  if (sh) {
    const values = sh.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const key = values[i][0];
      if (key) settings[String(key)] = values[i][1];
    }
  }
  return { ok: true, settings, at: new Date().toISOString() };
}

function upsertProduct_(product, params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getProductsSheet_(params);
    ensureProductHeaders_(sh);
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(String);
    const codigo = clean_(product.id || product.codigo || product.code || product.sku || nextCode_(values, headers));
    if (!codigo) throw new Error('Producto sin código.');
    let rowIndex = findProductRow_(values, headers, codigo);
    const oldObj = rowIndex > 0 ? rowToObject_(headers, values[rowIndex - 1]) : {};
    const newObj = productToSheetObject_(product, oldObj, codigo, rowIndex);
    const row = headers.map(h => newObj[h] !== undefined ? newObj[h] : '');
    if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
    else {
      sh.appendRow(row);
      rowIndex = sh.getLastRow();
    }
    appendLog_('upsertProduct', codigo, 'Producto guardado/actualizado', params);
    return { ok: true, codigo, row: rowIndex, product: normalizeProductOut_(newObj), at: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function setProductActive_(codigo, active, params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    codigo = clean_(codigo);
    if (!codigo) throw new Error('Falta código del producto.');
    const sh = getProductsSheet_(params);
    ensureProductHeaders_(sh);
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(String);
    const rowIndex = findProductRow_(values, headers, codigo);
    if (rowIndex <= 0) throw new Error('No encontré el producto ' + codigo);
    const activoCol = headers.indexOf('activo') + 1;
    const updatedCol = headers.indexOf('updatedAt') + 1;
    sh.getRange(rowIndex, activoCol).setValue(active === false || String(active).toLowerCase() === 'false' || String(active) === '0' ? 0 : 1);
    if (updatedCol > 0) sh.getRange(rowIndex, updatedCol).setValue(new Date().toISOString());
    appendLog_('setActive', codigo, 'Activo=' + active, params);
    return { ok: true, codigo, active, row: rowIndex, at: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function getProductsSheet_(params) {
  const ss = SpreadsheetApp.openById(getSheetId_(params));
  const name = clean_((params && params.productSheet) || CONFIG.PRODUCTS_SHEET);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  ensureProductHeaders_(sh);
  return sh;
}

function ensureProductHeaders_(sh) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
    return;
  }
  const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), PRODUCT_HEADERS.length)).getValues()[0].map(String);
  let changed = false;
  PRODUCT_HEADERS.forEach((h, i) => {
    if (!current[i]) { current[i] = h; changed = true; }
  });
  if (changed) sh.getRange(1, 1, 1, current.length).setValues([current]);
}

function normalizeProductOut_(obj) {
  return {
    id: clean_(obj.codigo || obj.id),
    codigo: clean_(obj.codigo || obj.id),
    nombre: clean_(obj.nombre),
    name: clean_(obj.nombre),
    categoria: clean_(obj.categoria || 'General'),
    categories: clean_(obj.categoria || 'General'),
    marca: clean_(obj.marca),
    brand: clean_(obj.marca),
    precio: num_(obj.precio),
    price: num_(obj.precio),
    costo: num_(obj.costo),
    cost: num_(obj.costo),
    stock: num_(obj.stock),
    descripcion: clean_(obj.descripcion),
    description: clean_(obj.descripcion),
    imagen: clean_(obj.imagen),
    image: clean_(obj.imagen),
    activo: obj.activo === '' || obj.activo === undefined ? 1 : obj.activo,
    active: !(['0','0.0','false','no','inactivo'].indexOf(String(obj.activo).toLowerCase()) >= 0),
    updatedAt: obj.updatedAt ? String(obj.updatedAt) : '',
    estado_stock: clean_(obj.estado_stock || estadoStock_(num_(obj.stock))),
    promos: clean_(obj.promos),
    notas: clean_(obj.notas),
    orden: obj.orden === undefined ? '' : obj.orden
  };
}

function productToSheetObject_(p, oldObj, codigo, rowIndex) {
  const price = num_(p.price !== undefined ? p.price : p.precio);
  const cost = num_(p.cost !== undefined ? p.cost : p.costo);
  const stock = num_(p.stock);
  const sheetId = clean_(oldObj.id || makeInternalId_(codigo, rowIndex));
  return {
    id: sheetId,
    codigo: codigo,
    nombre: clean_(p.name || p.nombre || oldObj.nombre || 'Producto sin nombre'),
    categoria: clean_(p.categories || p.categoria || oldObj.categoria || 'General'),
    marca: clean_(p.brand || p.marca || oldObj.marca || ''),
    precio: price,
    costo: cost,
    stock: stock,
    descripcion: clean_(p.description || p.descripcion || oldObj.descripcion || ''),
    imagen: clean_(p.image || p.imagen || oldObj.imagen || ''),
    activo: p.active === false || p.activo === false ? 0 : 1,
    updatedAt: new Date().toISOString(),
    valor_venta_stock: price * stock,
    inversion_stock: cost * stock,
    ganancia_unitaria: price - cost,
    ganancia_proyectada: (price - cost) * stock,
    estado_stock: estadoStock_(stock),
    promos: clean_(p.promos || p.promociones || oldObj.promos || ''),
    notas: clean_(p.notas || oldObj.notas || ''),
    orden: oldObj.orden !== undefined ? oldObj.orden : ''
  };
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { if (h) obj[String(h).trim()] = row[i]; });
  return obj;
}

function findProductRow_(values, headers, codigo) {
  const codeCol = headers.indexOf('codigo');
  const idCol = headers.indexOf('id');
  const target = clean_(codigo).toLowerCase();
  for (let i = 1; i < values.length; i++) {
    const c = codeCol >= 0 ? clean_(values[i][codeCol]).toLowerCase() : '';
    const id = idCol >= 0 ? clean_(values[i][idCol]).toLowerCase() : '';
    if (c === target || id === target) return i + 1;
  }
  return -1;
}

function nextCode_(values, headers) {
  const codeCol = headers.indexOf('codigo');
  let max = 0;
  for (let i = 1; i < values.length; i++) {
    const m = String(values[i][codeCol] || '').match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return 'SDC-' + String(max + 1).padStart(3, '0');
}

function makeInternalId_(codigo, rowIndex) {
  const n = String(codigo || '').match(/(\d+)$/);
  return 'prod-sdc-' + String(n ? Number(n[1]) : (rowIndex || Date.now())).padStart(3, '0');
}

function estadoStock_(stock) {
  stock = num_(stock);
  if (stock <= 0) return 'Agotado';
  if (stock <= 3) return 'Bajo stock';
  return 'Disponible';
}

function appendLog_(action, ref, message, params) {
  try {
    const ss = SpreadsheetApp.openById(getSheetId_(params));
    let sh = ss.getSheetByName(CONFIG.LOGS_SHEET);
    if (!sh) sh = ss.insertSheet(CONFIG.LOGS_SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(['fecha','accion','referencia','mensaje','usuario','origen']);
    sh.appendRow([new Date().toISOString(), action, ref, message, Session.getActiveUser().getEmail() || '', 'GitHub Pages']);
  } catch (err) {}
}

function parsePayload_(e) {
  const params = (e && e.parameter) || {};
  let body = {};
  if (e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); }
    catch (err) { body = {}; }
  }
  return Object.assign({}, params, body);
}

function assertAdmin_(payload) {
  const sent = clean_(payload.adminKey || payload.key || payload.accessKey);
  const real = clean_(PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || CONFIG.ADMIN_KEY);
  if (!real) throw new Error('ADMIN_KEY no configurada en Apps Script.');
  if (sent !== real) throw new Error('Clave administrativa incorrecta.');
}

function getSheetId_(params) {
  return clean_((params && params.sheetId) || CONFIG.SHEET_ID);
}

function output_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    const cb = String(callback).replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Math.round(v);
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}
