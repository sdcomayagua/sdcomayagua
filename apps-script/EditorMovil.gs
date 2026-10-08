/**
 * GAMER COMAYAGUA • EDITOR MÓVIL v2
 * Pegá este archivo en Extensiones > Apps Script de TU Google Sheets.
 * NO hay que implementar aplicación web ni configurar PIN.
 * onEdit se ejecuta automáticamente cuando este proyecto está vinculado a la hoja.
 * La hoja sigue privada bajo los permisos de tu cuenta Google.
 */
const GC_MOBILE_SPREADSHEET='1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0';
const GC_MOBILE_EDITOR='EDITOR MOVIL';
const GC_MOBILE_PRODUCTS='Productos';

/** Activación automática cuando el script está vinculado al archivo de Sheets. */
function onEdit(e){ gcMobileOnEdit(e); }

/** Alternativa para proyectos independientes: ejecutar una sola vez. */
function instalarEditorMovil(){
  const ss=SpreadsheetApp.openById(GC_MOBILE_SPREADSHEET);
  const editor=ss.getSheetByName(GC_MOBILE_EDITOR);
  if(!editor)throw Error('No existe la pestaña EDITOR MOVIL.');
  ScriptApp.getProjectTriggers()
    .filter(t=>t.getHandlerFunction()==='gcMobileOnEdit')
    .forEach(t=>ScriptApp.deleteTrigger(t));
  // Si el proyecto está vinculado al archivo, onEdit funcionará sin instalación.
  // Para proyectos independientes, crear un activador instalado.
  const active=SpreadsheetApp.getActiveSpreadsheet();
  if(!active || active.getId()!==GC_MOBILE_SPREADSHEET){
    ScriptApp.newTrigger('gcMobileOnEdit').forSpreadsheet(ss).onEdit().create();
  }
  editor.getRange('B5').setValue('✓ Editor listo. Elegí un producto para cargar sus datos.');
  return 'Editor listo.';
}

function gcMobileOnEdit(e){
  if(!e||!e.range)return;
  const sh=e.range.getSheet();
  if(sh.getName()!==GC_MOBILE_EDITOR || e.range.getColumn()!==2)return;
  const row=e.range.getRow();
  if(row!==3 && row!==4)return;
  const lock=LockService.getDocumentLock()||LockService.getScriptLock();
  if(!lock.tryLock(7000))return;
  try{
    const ss=e.source||sh.getParent();
    if(row===3){
      // Ignorar cambios antiguos si se seleccionó otra opción entretanto.
      if(String(sh.getRange('B3').getDisplayValue())!==String(e.value||''))return;
      gcMobileLoad_(sh,ss);
      return;
    }
    const action=String(e.value||'').trim().toUpperCase();
    // Evita guardar dos veces si hay un activador antiguo y uno nuevo.
    if(String(sh.getRange('B4').getDisplayValue()).trim().toUpperCase()!==action)return;
    if(action==='NUEVO PRODUCTO'||action==='NUEVO')gcMobileNew_(sh);
    else if(action==='GUARDAR CAMBIOS'||action==='GUARDAR')gcMobileSave_(sh,ss);
    sh.getRange('B4').setValue('Seleccioná una acción');
  }catch(err){
    sh.getRange('B4').setValue('Seleccioná una acción');
    sh.getRange('B5').setValue('⚠ '+String(err.message||err).slice(0,160));
  }finally{lock.releaseLock();}
}

function gcMobileSource_(ss){
  const spreadsheet=ss||SpreadsheetApp.getActiveSpreadsheet();
  if(!spreadsheet)throw Error('Abrí el editor desde el Google Sheets original.');
  const products=spreadsheet.getSheetByName(GC_MOBILE_PRODUCTS);
  if(!products)throw Error('No existe la pestaña Productos.');
  return products;
}

function gcMobileFind_(products,needle){
  const all=products.getDataRange().getValues();
  const label=String(needle||'').trim();
  for(let i=1;i<all.length;i++){
    const r=all[i],name=String(r[2]||'').trim(),code=String(r[1]||'').trim();
    if(label===name+' · '+code||label===String(r[0]||''))
      return {index:i+1,values:r};
  }
  throw Error('Producto no encontrado. Seleccionalo nuevamente.');
}

function gcMobileNew_(sh){
  sh.getRange('B3').setValue('NUEVO PRODUCTO');
  sh.getRange('D3:D4').clearContent();
  sh.getRange('B7:B20').clearContent();
  sh.getRange('B19:B20').setValues([['SI'],['SI']]);
  sh.getRange('D4').setValue('NUEVO');
  sh.getRange('B5').setValue('Nuevo producto. Escribí nombre, categoría, precio y stock, luego elegí GUARDAR CAMBIOS.');
}

function gcMobileLoad_(sh,ss){
  const key=String(sh.getRange('B3').getDisplayValue()||'').trim();
  if(!key||key==='Seleccioná un producto...'||key==='NUEVO PRODUCTO'){
    sh.getRange('B5').setValue('Elegí un producto arriba.');return;
  }
  const record=gcMobileFind_(gcMobileSource_(ss),key);
  const v=record.values;
  sh.getRange('B7:B20').setValues([
    [v[2]||''],[v[3]||''],[v[4]==null?'':v[4]],
    [v[15]==null?'':v[15]],[v[5]==null?'':v[5]],[v[6]==null?'':v[6]],
    [v[14]||''],[v[9]||''],[v[16]||''],[v[10]||''],
    [v[7]||''],[v[8]==='[]'?'':(v[8]||'')],
    [String(v[11]||'SI').toUpperCase()],[String(v[12]||'SI').toUpperCase()]
  ]);
  sh.getRange('D3').setValue(String(v[0]||''));
  sh.getRange('D4').setValue('EDICION');
  sh.getRange('B4').setValue('Seleccioná una acción');
  sh.getRange('B5').setValue('✓ '+v[2]+' cargado. Modificá lo necesario y elegí GUARDAR CAMBIOS.');
}

function gcMobileNumber_(v){
  if(typeof v==='number')return Number.isFinite(v)?v:NaN;
  let s=String(v==null?'':v).trim().replace(/[L $]/gi,'');
  if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');
  else if(s.includes(','))s=s.replace(',','.');
  return s?Number(s):NaN;
}

function gcMobileSave_(sh,ss){
  const raw=sh.getRange('B7:B20').getValues().map(x=>x[0]);
  const [name,category,price,promoPrice,cost,stock,colors,description,promoText,discounts,image,gallery,cod,active]=raw;
  const title=String(name||'').trim(),cat=String(category||'').trim();
  const p=gcMobileNumber_(price);
  const promo=String(promoPrice==null?'':promoPrice).trim()===''?'':gcMobileNumber_(promoPrice);
  const n=gcMobileNumber_(stock);
  if(!title||!cat)throw Error('Nombre y categoría son obligatorios.');
  if(!Number.isFinite(p)||p<0)throw Error('Ingresá un precio válido.');
  if(!Number.isInteger(n)||n<0)throw Error('El stock debe ser un número entero desde cero.');
  if(promo!==''&&(!Number.isFinite(promo)||promo<=0||promo>p))
    throw Error('El precio promocional debe ser mayor que cero y no superar el precio normal.');
  const source=gcMobileSource_(ss);
  const id=String(sh.getRange('D3').getDisplayValue()||'').trim();
  const status=String(sh.getRange('D4').getDisplayValue()||'').trim();
  let row,record;
  if(status==='EDICION'){
    if(!id)throw Error('Seleccioná el producto nuevamente.');
    const found=gcMobileFind_(source,id);
    row=found.index;record=found.values.slice();
    const selected=String(sh.getRange('B3').getDisplayValue()||'').trim();
    if(selected!==String(record[2])+' · '+String(record[1]))
      throw Error('Cambiaste la selección. Esperá a que cargue el nuevo producto.');
  }else if(status==='NUEVO'){
    row=Math.max(2,source.getLastRow()+1);
    record=Array(17).fill('');
    record[0]=Utilities.getUuid();
    record[1]='GC-'+Utilities.getUuid().slice(0,8).toUpperCase();
  }else{
    throw Error('Antes de guardar, seleccioná un producto o elegí NUEVO PRODUCTO.');
  }
  while(record.length<17)record.push('');
  record[2]=title;
  record[3]=cat;
  record[4]=p;
  if(String(cost==null?'':cost).trim()!==''){
    const cp=gcMobileNumber_(cost);
    if(!Number.isFinite(cp)||cp<0)throw Error('Costo inválido.');
    record[5]=cp;
  }else if(status==='NUEVO')record[5]='';
  record[6]=n;
  record[7]=String(image||'').trim();
  record[8]=String(gallery||'').trim();
  record[9]=String(description||'').trim().slice(0,5000);
  record[10]=String(discounts||'').trim().slice(0,250);
  record[11]=String(cod).toUpperCase()==='NO'?'NO':'SI';
  record[12]=String(active).toUpperCase()==='NO'?'NO':'SI';
  record[13]='editor-movil-'+new Date().toISOString();
  record[14]=String(colors||'').trim().slice(0,500);
  record[15]=promo;
  record[16]=String(promoText||'').trim().slice(0,250);
  source.getRange(row,1,1,17).setValues([record]);
  try{CacheService.getScriptCache().remove('public_catalog_v5')}catch(_){}
  try{CacheService.getScriptCache().remove('public_catalog_v4')}catch(_){}
  sh.getRange('D3').setValue(String(record[0]));
  sh.getRange('D4').setValue('EDICION');
  sh.getRange('B3').setValue(title+' · '+String(record[1]));
  sh.getRange('B5').setValue('✓ Producto guardado correctamente: '+title+'.');
}

/** Prueba manual sin cambiar la selección ni guardar ningún producto. */
function probarEditorMovil(){
  const ss=SpreadsheetApp.getActiveSpreadsheet()||SpreadsheetApp.openById(GC_MOBILE_SPREADSHEET);
  const sh=ss.getSheetByName(GC_MOBILE_EDITOR);
  gcMobileLoad_(sh,ss);
}
