/**
 * GAMER COMAYAGUA · API para Google Sheets + GitHub Pages
 * No colocar claves privadas aquí ni en GitHub. El PIN se almacena
 * ÚNICAMENTE en Propiedades de secuencia de comandos (Script Properties).
 * Proyecto propietario de la hoja:
 * https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit
 */
const GC_SHEET_ID = '1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0';
const GC_TAB_PRODUCTS = 'Productos';
const GC_TAB_SETTINGS = 'Configuracion';
const GC_TAB_BANKS = 'Cuentas';
const GC_PRODUCT_COLUMNS = ['ID','Codigo','Nombre','Categoria','Precio','Costo','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Revision'];

/** Ejecutar una sola vez. La clave NUEVA se imprime en Registro de ejecución. */
function configurarSistema() {
  const ss = book_();
  let sheet = ss.getSheetByName(GC_TAB_PRODUCTS);
  if (!sheet) sheet = ss.insertSheet(GC_TAB_PRODUCTS);
  if (sheet.getLastRow() === 0) sheet.appendRow(GC_PRODUCT_COLUMNS);
  let conf = ss.getSheetByName(GC_TAB_SETTINGS);
  if (!conf) { conf = ss.insertSheet(GC_TAB_SETTINGS); conf.appendRow(['Clave','Valor','Descripcion']); }
  let banks = ss.getSheetByName(GC_TAB_BANKS);
  if (!banks) { banks = ss.insertSheet(GC_TAB_BANKS); banks.appendRow(['Banco','Titular','Cuenta','Identidad','Visible']); }
  const props = PropertiesService.getScriptProperties();
  const pin = props.getProperty('ADMIN_PIN') || props.getProperty('ADMIN_TOKEN');
  Logger.log(pin ? 'Clave privada configurada en propiedades.' : 'Configurá ADMIN_PIN o ADMIN_TOKEN en Propiedades de secuencia de comandos.');
  Logger.log('HOJA: ' + ss.getUrl());
  return 'Sistema configurado. Se acepta ADMIN_PIN o ADMIN_TOKEN guardado en Propiedades de secuencia de comandos.';
}
function doGet(e) {
  const args = (e && e.parameter) || {};
  const name = String(args.callback || '');
  if (name && !/^[A-Za-z_$][\w$]{0,90}$/.test(name)) return ContentService.createTextOutput('Callback inválido').setMimeType(ContentService.MimeType.TEXT);
  let result;
  try {
    if(String(args.action||'') === 'health') {
      const props=PropertiesService.getScriptProperties();
      const pin=String(props.getProperty('ADMIN_PIN') || props.getProperty('ADMIN_TOKEN') || '');
      result={ok:true,version:'GC-20261008-PIN-V6',pinConfigurado:/^\d{6}$/.test(pin)};
    } else result = {ok:true, ...publicPayload_()};
  } catch (err) {
    result = {ok:false, error:safeError_(err)};
  }
  const data = JSON.stringify(result).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  // Sin callback devuelve JSON legible para probar /exec en modo incógnito.
  // Con callback conserva JSONP para la tienda y el panel en GitHub Pages.
  return ContentService.createTextOutput(name ? name + '(' + data + ');' : data)
    .setMimeType(name ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.TEXT);
}

/** POST de formulario enviado dentro de un iframe: evita los problemas CORS de Apps Script. */
function doPost(e) {
  let requestId = '';
  let result;
  try {
    const raw = e && e.parameter ? e.parameter.payload : '';
    if (!raw || raw.length > 4200000) throw Error('La solicitud está vacía o es demasiado grande.');
    const req = JSON.parse(raw);
    requestId = String(req.requestId || '');
    assertAdmin_(req.token);
    if (req.action === 'verify') result = {ok:true,message:'Acceso autorizado'};
    else if (req.action === 'saveProduct') result = saveProduct_(req.product || {});
    else if (req.action === 'disableProduct') result = disableProduct_(req.id);
    else if (req.action === 'uploadImage') result = uploadImage_(req.file || {});
    else throw Error('Operación no reconocida.');
  } catch (err) { result = {ok:false,error:safeError_(err)}; }
  const message = JSON.stringify({__gcResponse:true,requestId,...result})
    .replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  // Apps Script encierra HtmlService en un iframe adicional.
  // Reintentamos el mensaje a la ventana principal para evitar que se pierda.
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>(function(){' +
    'var answer=' + message + ';' +
    'function deliver(){' +
      'try{window.top.postMessage(answer,"*");}catch(e){}' +
      'try{window.parent.postMessage(answer,"*");}catch(e){}' +
    '}' +
    'deliver();setTimeout(deliver,200);setTimeout(deliver,800);' +
    '})();</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function book_(){return SpreadsheetApp.openById(GC_SHEET_ID);}
function safeError_(err){return String((err&&err.message)||err||'Error desconocido').slice(0,380);}
function assertAdmin_(candidate){
  // ADMIN_PIN es una propiedad privada: nunca incluir su valor en GitHub.
  const props=PropertiesService.getScriptProperties();
  const pin=String(props.getProperty('ADMIN_PIN') || props.getProperty('ADMIN_TOKEN') || '');
  if(!/^\d{6}$/.test(pin)) throw Error('No hay PIN válido. Configurá ADMIN_PIN o ADMIN_TOKEN con seis dígitos en Propiedades de Apps Script.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const now=Date.now();
    const blocked=Number(props.getProperty('ADMIN_BLOCK_UNTIL')||0);
    if(blocked>now) throw Error('Demasiados intentos. Esperá 10 minutos.');
    const from=Number(props.getProperty('ADMIN_FAIL_STARTED')||0);
    const count=from && now-from<600000 ? Number(props.getProperty('ADMIN_FAIL_COUNT')||0):0;
    const provided=String(candidate==null?'':candidate).trim();
    if(provided!==pin){
      const next=count+1;
      props.setProperty('ADMIN_FAIL_STARTED',String(count?from:now));
      props.setProperty('ADMIN_FAIL_COUNT',String(next));
      if(next>=8){
        props.setProperty('ADMIN_BLOCK_UNTIL',String(now+600000));
        props.deleteProperty('ADMIN_FAIL_COUNT');props.deleteProperty('ADMIN_FAIL_STARTED');
        throw Error('Demasiados intentos. Esperá 10 minutos.');
      }
      throw Error('Clave de administración incorrecta.');
    }
    props.deleteProperty('ADMIN_BLOCK_UNTIL');
    props.deleteProperty('ADMIN_FAIL_COUNT');
    props.deleteProperty('ADMIN_FAIL_STARTED');
  } finally {lock.releaseLock();}
}
function yes_(x){return /^(sí|si|true|1|yes)$/i.test(String(x==null?'':x).trim());}
function money_(v){
  if(typeof v==='number')return isFinite(v)?v:0;
  let s=String(v||'').replace(/[^\d,.-]/g,'');
  const dot=s.lastIndexOf('.'), comma=s.lastIndexOf(',');
  if(comma>=0&&dot>=0)s=comma>dot?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(comma>=0)s=/,\d{1,2}$/.test(s)?s.replace(',','.'):s.replace(/,/g,'');
  else if(dot>=0&&/\.\d{3}$/.test(s))s=s.replace(/\./g,'');
  return Number(s)||0;
}
function rate_(v,def){if(v===''||v==null)return def;const n=money_(v);return /%/.test(String(v))||n>1?n/100:n;}
function cfg_(){
  const sheet=book_().getSheetByName(GC_TAB_SETTINGS),raw={};
  if(sheet&&sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,2).getDisplayValues().forEach(row=>{raw[row[0]]=row[1]});
  return {brand:String(raw.brand||'Gamer Comayagua'),shipping:money_(raw.shipping||110),codMinimum:money_(raw.codMin||350),codMinimumUnits:Math.max(2,Math.floor(money_(raw.codMinUnits||2))),codRate:rate_(raw.codRate,.1),tigoRate:rate_(raw.tigoRate,.07),whatsapp:String(raw.whatsapp||'50431517755').replace(/\D/g,'')};
}
function publicPayload_(){
  const cache=CacheService.getScriptCache();const cached=cache.get('public_catalog_v5');if(cached)return JSON.parse(cached);
  const ss=book_(),sheet=ss.getSheetByName(GC_TAB_PRODUCTS);if(!sheet)throw Error('No existe la pestaña Productos.');
  const vals=sheet.getDataRange().getDisplayValues();const headers=vals.shift()||[];const idx=k=>headers.indexOf(k);
  const value=(row,k)=>idx(k)>=0?row[idx(k)]:'';
  const products=vals.filter(r=>r.some(c=>String(c).trim())).map(r=>({
    id:String(value(r,'ID')),code:String(value(r,'Codigo')),name:String(value(r,'Nombre')),
    category:String(value(r,'Categoria')||'Otros'),price:money_(value(r,'Precio')),
    stock:Math.max(0,Math.floor(money_(value(r,'Stock')))),image:String(value(r,'Imagen')),
    gallery:String(value(r,'Galeria')),description:String(value(r,'Descripcion')),
    discounts:String(value(r,'Descuentos')),colors:String(value(r,'Colores')),
    promoPrice:money_(value(r,'PrecioPromocion')),promoText:String(value(r,'PromocionTexto')),
    codAllowed:yes_(value(r,'PagoAlRecibir')),active:yes_(value(r,'Activo'))
  })).filter(p=>p.id&&p.name&&p.active);
  const bankSheet=ss.getSheetByName(GC_TAB_BANKS);const banks=[];
  if(bankSheet&&bankSheet.getLastRow()>1){bankSheet.getRange(2,1,bankSheet.getLastRow()-1,5).getDisplayValues().forEach(r=>{
    if(yes_(r[4])&&r[2])banks.push({bank:r[0],owner:r[1],account:r[2],identity:r[3],visible:true});
  });}
  const result={products,settings:cfg_(),banks,updatedAt:new Date().toISOString()};
  const out=JSON.stringify(result);if(out.length<90000)cache.put('public_catalog_v5',out,45);
  return result;
}
function saveProduct_(p){
  if(!p || typeof p!=='object')throw Error('Producto inválido.');
  const name=String(p.name||'').trim(),category=String(p.category||'Otros').trim();
  if(name.length<3||name.length>180)throw Error('Escribí un nombre válido.');
  const price=money_(p.price),stock=money_(p.stock);
  if(price<0||stock<0||stock>100000||!Number.isInteger(stock))throw Error('Precio o existencias inválidas.');
  const img=String(p.image||'').trim();
  if(img&&!/^https:\/\//i.test(img)&&!/^assets\/products\/[\w.-]+$/.test(img))throw Error('La imagen debe ser URL HTTPS o una ruta existente.');
  const id=String(p.id||Utilities.getUuid()).trim();const lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
    const s=book_().getSheetByName(GC_TAB_PRODUCTS);const rows=s.getDataRange().getValues();let position=-1;
    for(let i=1;i<rows.length;i++)if(String(rows[i][0])===id){position=i+1;break;}
    const old=position>0?rows[position-1]:[];
    const cost=p.cost===''||p.cost==null?(old[5]??0):money_(p.cost);
    const row=[id,String(p.code||old[1]||'').trim(),name,category,price,cost,stock,img,
      String(p.gallery||old[8]||''),String(p.description||'').slice(0,5000),String(p.discounts||'').slice(0,200),
      p.codAllowed?'SI':'NO',p.active===false?'NO':'SI','edit-'+new Date().toISOString()];
    if(position>0)s.getRange(position,1,1,row.length).setValues([row]);else s.appendRow(row);
    CacheService.getScriptCache().remove('public_catalog_v4');return {ok:true,id,message:position>0?'Producto actualizado':'Producto agregado'};
  } finally {lock.releaseLock();}
}
function disableProduct_(id){
  const s=book_().getSheetByName(GC_TAB_PRODUCTS);const values=s.getDataRange().getValues();
  for(let i=1;i<values.length;i++)if(String(values[i][0])===String(id)){
    s.getRange(i+1,13).setValue('NO');CacheService.getScriptCache().remove('public_catalog_v4');return {ok:true,message:'Producto ocultado, sin borrarlo de la hoja.'};
  }
  throw Error('Producto no encontrado.');
}
function uploadImage_(f){
  const mime=String(f.mime||'');if(!/^image\/(png|jpeg|webp|gif)$/i.test(mime))throw Error('Solo JPG, PNG, WEBP o GIF.');
  const base64=String(f.base64||'');if(!base64||base64.length>2900000)throw Error('Foto muy grande. Usá una de hasta 2 MB.');
  const bytes=Utilities.base64Decode(base64);if(bytes.length>2200000)throw Error('Foto supera 2 MB.');
  const name='GC_'+new Date().toISOString().replace(/\W/g,'')+'_'+Utilities.getUuid().slice(0,8)+'.'+(mime.split('/')[1]==='jpeg'?'jpg':mime.split('/')[1]);
  const it=DriveApp.getFoldersByName('GAMER_COMAYAGUA_FOTOS_PUBLICAS');
  const folder=it.hasNext()?it.next():DriveApp.createFolder('GAMER_COMAYAGUA_FOTOS_PUBLICAS');
  const file=folder.createFile(Utilities.newBlob(bytes,mime,name));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); }
  catch(err){file.setTrashed(true);throw Error('Google Drive no permite compartir esta foto públicamente. Revisá los permisos de tu cuenta.');}
  return {ok:true,url:'https://drive.google.com/thumbnail?id='+file.getId()+'&sz=w1200',message:'Foto subida. Guardá el producto para usarla.'};
}
