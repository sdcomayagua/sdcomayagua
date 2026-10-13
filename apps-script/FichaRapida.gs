/**
 * GAMER COMAYAGUA — FICHA RAPIDA para el inventario original.
 *
 * INSTALACIÓN UNA SOLA VEZ:
 * 1. Google Sheets > Extensiones > Apps Script > archivo nuevo FichaRapida.gs.
 * 2. Pegá este código y guardá. Conservá Code.gs, EditorMovil.gs y tu PIN.
 * 3. Ejecutá instalarFichaRapida y autorizá los permisos de Google.
 * 4. En la hoja FICHA RAPIDA pegá el nombre en B3; elegí una acción en B4.
 *
 * Al pegar el nombre en B3 se intenta investigar automáticamente (solo si
 * la API está configurada). También puede usarse B4 > BUSCAR FICHA.
 * Para buscar GRATIS: Code.gs + FichaGratis.gs, y claves gratuitas
 * GC_FREE_TAVILY_API_KEY y GC_FREE_GEMINI_API_KEY en Script Properties.
 * CARGAR y GUARDAR funcionan sin esas claves.
 * Nunca se modifican precios, costo, fotos, stock ni datos bancarios.
 */
const GC_QUICK_TAB = 'FICHA RAPIDA';
const GC_QUICK_BOOK = '1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0';
const GC_QUICK_NAMES = ['weight','weightUnit','width','height','length','measureUnit','size','material','model','brand','voltage','current','power','connection','technology','compatibility','included'];

function instalarFichaRapida() {
  const ss=SpreadsheetApp.openById(GC_QUICK_BOOK);
  const editor=ss.getSheetByName(GC_QUICK_TAB);
  if(!editor)throw Error('No existe la pestaña FICHA RAPIDA.');
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='gcQuickOnEdit')
    .forEach(t=>ScriptApp.deleteTrigger(t));
  // La búsqueda necesita un activador instalable, pues usa servicios autorizados.
  ScriptApp.newTrigger('gcQuickOnEdit').forSpreadsheet(ss).onEdit().create();
  editor.getRange('B4').setValue('Seleccioná una acción');
  editor.getRange('B5').setValue('✓ Editor activo. Pegá un nombre exacto en B3 y elegí una acción en B4.');
  return 'FICHA RAPIDA instalada correctamente.';
}

function gcQuickOnEdit(e) {
  if(!e||!e.range||e.range.getColumn()!==2)return;
  const sh=e.range.getSheet(),r=e.range.getRow();
  if(sh.getName()!==GC_QUICK_TAB||(r!==3&&r!==4))return;
  // No ejecutamos búsquedas por escribir cada letra: son explícitas para evitar cobros.
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(30000)) {
    sh.getRange('B5').setValue('Otra acción continúa en proceso. Esperá un momento y reintentá.');
    return;
  }
  try {
    if(r===3) {
      gcQuickLoad_(sh);
      gcQuickMaybeAutoSearch_(sh,e);
      return;
    }
    const action=String(sh.getRange('B4').getDisplayValue()||'').trim().toUpperCase();
    if(action==='BUSCAR FICHA')gcQuickSearch_(sh);
    else if(action==='GUARDAR EN INVENTARIO')gcQuickSave_(sh);
    else if(action==='CARGAR EXISTENTE')gcQuickLoad_(sh);
    else if(action==='LIMPIAR')gcQuickReset_(sh,true);
  }catch(err){
    sh.getRange('B5').setValue('⚠ '+String(err&&err.message||err).slice(0,340));
  }finally{
    if(r===4)sh.getRange('B4').setValue('Seleccioná una acción');
    lock.releaseLock();
  }
}

function gcQuickProductSheet_() {
  const s=SpreadsheetApp.openById(GC_QUICK_BOOK).getSheetByName('Productos');
  if(!s)throw Error('No se encontró la pestaña Productos del inventario.');
  return s;
}

function gcQuickFind_(name) {
  const source=gcQuickProductSheet_();
  const all=source.getDataRange().getValues();
  const h=(all.shift()||[]).map(x=>String(x||'').trim());
  const p={};h.forEach((x,i)=>{if(x)p[x]=i;});
  ['ID','Codigo','Nombre','Descripcion','Detalles','Revision'].forEach(k=>{
    if(p[k]===undefined)throw Error('Falta la columna '+k+' de Productos.');
  });
  const exact=x=>String(x||'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
  const requested=exact(name),matches=[];
  for(let i=0;i<all.length;i++){
    const row=all[i],n=exact(row[p.Nombre]),code=exact(row[p.Codigo]);
    if(!n)continue;
    if(requested===n||requested===code||requested===n+' · '+code)
      matches.push({source,rowNumber:i+2,row,columns:p});
  }
  if(matches.length>1)throw Error('Hay varios artículos con ese nombre. Pegá el código único (ej.: SD-055) en B3.');
  return matches[0]||null;
}

function gcQuickToArray_(description,details) {
  const d=details&&typeof details==='object'&&!Array.isArray(details)?details:{};
  const refs=Array.isArray(d.references)?d.references:[];
  const map={8:description,9:d.weight,10:d.weightUnit,11:d.width,12:d.height,
    13:d.length,14:d.measureUnit,15:d.size,16:d.material,17:d.model,
    18:d.brand,19:d.voltage,20:d.current,21:d.power,22:d.connection,
    23:d.technology,24:d.compatibility,25:d.included,
    26:refs[0]&&refs[0].url,27:refs[1]&&refs[1].url,28:refs[2]&&refs[2].url,
    29:'',30:'MANUAL'};
  return Array.from({length:23},(_,i)=>[map[i+8]==null?'':map[i+8]]);
}

function gcQuickReadDetails_(raw) {
  try {
    const parsed=typeof raw==='string'?JSON.parse(raw||'{}'):raw;
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch(err){return {};}
}

function gcQuickReset_(sh,withName) {
  sh.getRange('B8:B30').clearContent();
  sh.getRange('D3:D4').clearContent();
  if(withName)sh.getRange('B3').clearContent();
  sh.getRange('B5').setValue('Formulario limpio. Pegá otro nombre exacto en B3.');
}

function gcQuickLoad_(sh) {
  const name=String(sh.getRange('B3').getDisplayValue()||'').trim();
  sh.getRange('B8:B30').clearContent();
  sh.getRange('D3:D4').clearContent();
  if(!name){sh.getRange('B5').setValue('Pegá el nombre del producto en B3.');return;}
  const found=gcQuickFind_(name);
  if(!found){
    sh.getRange('B5').setValue('Este nombre no está en Productos. Podés buscar la ficha, pero para guardar primero creá el producto en el inventario.');
    return;
  }
  const v=k=>found.row[found.columns[k]];
  sh.getRange('D3:D4').setValues([[String(v('ID')||'')],[String(v('Codigo')||'')]]);
  sh.getRange('B8:B30').setValues(gcQuickToArray_(v('Descripcion'),gcQuickReadDetails_(v('Detalles'))));
  sh.getRange('B5').setValue('✓ Producto existente: '+String(v('Nombre'))+' ('+String(v('Codigo'))+'). Podés buscar o modificar y guardar la ficha.');
}

/**
 * Investiga automáticamente SOLO cuando se pega/confirma el nombre en B3.
 * No toca los campos ya rellenos, ni publica nada. Requiere clave privada.
 * Usa una pausa de hasta 6 horas por producto para evitar cobros duplicados.
 * Para repetir una búsqueda manualmente: B4 > BUSCAR FICHA.
 */
function gcQuickMaybeAutoSearch_(sh,e) {
  if(e.range.getNumRows()!==1||e.range.getNumColumns()!==1)return;
  const name=String(sh.getRange('B3').getDisplayValue()||'').trim();
  if(name.length<3)return;
  const props=PropertiesService.getScriptProperties();
  const setting=String(props.getProperty('FICHA_RAPIDA_BUSQUEDA_AUTOMATICA')||'SI').trim().toUpperCase();
  if(['NO','FALSE','0'].includes(setting))return;
  const isFree=String(props.getProperty('PRODUCT_RESEARCH_PROVIDER')||'GRATIS').trim().toUpperCase()!=='OPENAI';
  const ready=isFree
    ? !!(String(props.getProperty('GC_FREE_TAVILY_API_KEY')||'').trim()&&String(props.getProperty('GC_FREE_GEMINI_API_KEY')||'').trim())
    : !!String(props.getProperty('PRODUCT_RESEARCH_API_KEY')||'').trim();
  if(!ready) {
    sh.getRange('B5').setValue('✓ Producto cargado. Para investigar gratis configurá GC_FREE_TAVILY_API_KEY y GC_FREE_GEMINI_API_KEY en Apps Script.');
    return;
  }
  if(typeof researchProduct_!=='function') {
    sh.getRange('B5').setValue('✓ Producto cargado. Falta instalar Code.gs actualizado para habilitar la investigación automática.');
    return;
  }
  const record=gcQuickFind_(name);
  if(!record) {
    sh.getRange('B5').setValue('El nombre no corresponde todavía a un producto del inventario. Crealo en ADMIN y volvé a pegarlo para buscar su ficha.');
    return;
  }
  // No consultar cuando nombre no cambió ni al pegar rangos grandes.
  if(String(e.oldValue??'').trim()===name)return;
  const md5=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,name.toLowerCase());
  const hash=md5.map(n=>('0'+((n+256)%256).toString(16)).slice(-2)).join('');
  const cache=CacheService.getScriptCache(),id='gc_quick_auto_'+hash;
  if(cache.get(id)) {
    sh.getRange('B5').setValue('✓ Ficha cargada. La búsqueda automática ya se hizo recientemente; para repetirla elegí BUSCAR FICHA en B4.');
    return;
  }
  gcQuickSearch_(sh);
  // Un resultado ambiguo también se considera una búsqueda, para no gastar varias veces.
  cache.put(id,'1',21600);
}

function gcQuickSearch_(sh) {
  const name=String(sh.getRange('B3').getDisplayValue()||'').trim();
  if(name.length<3)throw Error('Primero pegá la marca y modelo del producto en B3.');
  if(typeof researchProduct_!=='function')
    throw Error('Falta el Code.gs actualizado. Podés agregar datos manualmente y GUARDAR sin búsqueda.');
  const found=gcQuickFind_(name);
  const category=found&&found.columns.Categoria!==undefined?String(found.row[found.columns.Categoria]||''):'';
  sh.getRange('B5').setValue('Buscando fuentes oficiales para '+name+'…');
  SpreadsheetApp.flush();
  const response=researchProduct_(name,category);
  const result=response&&response.research;
  if(!response||!response.ok||!result)throw Error('La búsqueda no devolvió una ficha válida.');
  if(String(sh.getRange('B3').getDisplayValue()||'').trim()!==name)
    throw Error('Cambiaste el producto durante la búsqueda. Volvé a buscar para evitar mezclar fichas.');
  if(result.match!=='exact'){
    const notes=Array.isArray(result.notes)?result.notes.join(' · '):'';
    sh.getRange('B29').setValue(notes||'Confirmá la marca, el modelo y la versión de la caja.');
    sh.getRange('B30').setValue('REVISAR');
    sh.getRange('B5').setValue('⚠ El nombre no identifica exactamente un modelo. No se insertaron datos de otra variante.');
    return;
  }
  const current=sh.getRange('B8:B30').getValues().map(r=>r[0]);
  const proposed=gcQuickToArray_(result.description||'',result.details||{}).map(r=>r[0]);
  let added=0;
  for(let i=0;i<21;i++){
    if(String(current[i]==null?'':current[i]).trim()===''&&String(proposed[i]==null?'':proposed[i]).trim()!==''){
      current[i]=proposed[i];added++;
    }
  }
  current[21]=Array.isArray(result.notes)?result.notes.join(' · ').slice(0,1000):'';
  current[22]='EXACTA';
  sh.getRange('B8:B30').setValues(current.map(v=>[v]));
  sh.getRange('B5').setValue('✓ Ficha propuesta ('+added+' campos nuevos). Revisá modelo, unidades y URLs; después elegí GUARDAR EN INVENTARIO.');
}

function gcQuickSave_(sh) {
  const name=String(sh.getRange('B3').getDisplayValue()||'').trim();
  const found=gcQuickFind_(name);
  if(!found)throw Error('No existe este producto. Crealo primero en EDITOR MOVIL o en el panel ADMIN.');
  const id=String(sh.getRange('D3').getDisplayValue()||'').trim();
  const realId=String(found.row[found.columns.ID]||'').trim();
  if(!id||id!==realId)throw Error('La selección cambió. Elegí CARGAR EXISTENTE antes de guardar.');
  const values=sh.getRange('B8:B30').getValues().map(r=>r[0]);
  const details={};
  const at={weight:9,weightUnit:10,width:11,height:12,length:13,measureUnit:14,
    size:15,material:16,model:17,brand:18,voltage:19,current:20,power:21,
    connection:22,technology:23,compatibility:24,included:25};
  const normalizeNumber=(raw,key)=>{
    const v=String(raw==null?'':raw).trim();
    if(!v)return;
    const n=Number(v.replace(',','.'));
    if(!Number.isFinite(n)||n<=0||n>=1000000)throw Error('Valor numérico inválido en '+key+'.');
    details[key]=n;
  };
  ['weight','width','height','length'].forEach(k=>normalizeNumber(values[at[k]-8],k));
  for(const key of Object.keys(at)){
    if(['weight','width','height','length'].includes(key))continue;
    const v=String(values[at[key]-8]??'').trim();
    if(v)details[key]=v.slice(0,200);
  }
  if(details.weight&&!['g','kg','lb'].includes(details.weightUnit))
    throw Error('Elegí la unidad del peso (g, kg o lb).');
  if((details.width||details.height||details.length)&&!['mm','cm','m','in'].includes(details.measureUnit))
    throw Error('Elegí la unidad para ancho, alto y largo.');
  if(!details.weight)delete details.weightUnit;
  if(!details.width&&!details.height&&!details.length)delete details.measureUnit;
  const refs=[];
  for(let row=26;row<=28;row++){
    const url=String(values[row-8]||'').trim();
    if(!url)continue;
    if(!/^https?:\/\/[a-z0-9][a-z0-9.-]+(?:[/?#][^\s]*)?$/i.test(url)||url.length>800)
      throw Error('Revisá el enlace en B'+row+'. Debe ser una URL válida.');
    if(!refs.some(x=>x.url===url))refs.push({url,title:'Ficha técnica / fuente consultada'});
  }
  if(refs.length){
    // Conservá otras fuentes previas cuando los tres enlaces visibles no cambiaron.
    const old=gcQuickReadDetails_(found.row[found.columns.Detalles]);
    const original=Array.isArray(old.references)?old.references:[];
    const unchanged=refs.every((ref,i)=>original[i]&&original[i].url===ref.url);
    if(unchanged&&original.length>refs.length)
      original.slice(refs.length,5).forEach(ref=>{if(ref&&ref.url&&!refs.some(x=>x.url===ref.url))refs.push(ref);});
    details.references=refs.slice(0,5);
  }
  // No guardar información encontrada de un modelo ambiguo.
  if(String(values[22]||'').toUpperCase()==='REVISAR')
    throw Error('El modelo quedó pendiente de confirmar. Corregí la ficha y cambiá coincidencia a MANUAL para guardar.');
  const description=String(values[0]||'').trim().slice(0,5000);
  const source=found.source,p=found.columns;
  const guard=String(source.getRange(found.rowNumber,p.ID+1).getDisplayValue()||'');
  if(guard!==realId)throw Error('Cambió el orden del inventario. Volvé a cargar el producto.');
  // Solo estas tres columnas: descripción, JSON de características y revisión.
  source.getRange(found.rowNumber,p.Descripcion+1).setValue(description);
  source.getRange(found.rowNumber,p.Detalles+1).setValue(JSON.stringify(details));
  source.getRange(found.rowNumber,p.Revision+1).setValue('ficha-rapida-'+new Date().toISOString());
  try {
    const cache=CacheService.getScriptCache();
    ['public_catalog_v7','public_catalog_v6','public_catalog_v5','public_catalog_v4'].forEach(key=>cache.remove(key));
  }catch(e){}
  sh.getRange('B5').setValue('✓ Ficha guardada en Productos para '+String(found.row[p.Nombre])+'. Verificá la tienda tras actualizar la página.');
}

/**
 * Diagnóstico gratuito: NO envía solicitudes a OpenAI y nunca muestra la clave.
 * Ejecutá esta función después de agregar la propiedad privada.
 */
function comprobarConexionFichaRapida() {
  const properties=PropertiesService.getScriptProperties();
  const freeMode=String(properties.getProperty('PRODUCT_RESEARCH_PROVIDER')||'GRATIS').toUpperCase()!=='OPENAI';
  const keyConfigured=freeMode?
    !!(String(properties.getProperty('GC_FREE_TAVILY_API_KEY')||'').trim()&&String(properties.getProperty('GC_FREE_GEMINI_API_KEY')||'').trim()):
    !!String(properties.getProperty('PRODUCT_RESEARCH_API_KEY')||'').trim();
  const researchInstalled=typeof researchProduct_==='function';
  const active=ScriptApp.getProjectTriggers()
    .some(t=>t.getHandlerFunction()==='gcQuickOnEdit');
  let message='';
  if(!active)message='⚠ Falta ejecutar instalarFichaRapida para activar el disparador.';
  else if(!researchInstalled)message='⚠ La búsqueda no está en Código.gs. Actualizá ese archivo sin borrar tu PIN.';
  else if(freeMode&&typeof gcFreeResearch_!=='function')message='⚠ Falta pegar FichaGratis.gs en el mismo proyecto de Apps Script.';
  else if(!keyConfigured)message=freeMode?'⚠ Para buscar gratis agregá GC_FREE_TAVILY_API_KEY y GC_FREE_GEMINI_API_KEY en las propiedades privadas.':'⚠ Falta PRODUCT_RESEARCH_API_KEY para el modo OPENAI.';
  else message='✓ Configuración lista para probar. Pegá el nombre de un producto existente en B3. La búsqueda puede generar cargos de API.';
  const sh=SpreadsheetApp.openById(GC_QUICK_BOOK).getSheetByName(GC_QUICK_TAB);
  if(sh)sh.getRange('B5').setValue(message);
  Logger.log(message);
  return message;
}

/** Prueba sin buscar en internet ni modificar Productos. */
function probarFichaRapida() {
  const sh=SpreadsheetApp.openById(GC_QUICK_BOOK).getSheetByName(GC_QUICK_TAB);
  if(!sh)throw Error('No existe FICHA RAPIDA.');
  return 'Correcto: '+sh.getName()+'.';
}
