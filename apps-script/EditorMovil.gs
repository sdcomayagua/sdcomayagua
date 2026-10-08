/**
 * GAMER COMAYAGUA · EDITOR MÓVIL
 * Una sola instalación: ejecutar instalarEditorMovil() UNA VEZ en Apps Script.
 * Trabaja DENTRO del Google Sheets existente; no necesita /exec, ni web app, ni PIN.
 * NO publicar esta hoja con permisos de edición a terceros.
 */
const GC_MOBILE_SPREADSHEET='1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0';
const GC_MOBILE_EDITOR='EDITOR MOVIL';
const GC_MOBILE_PRODUCTS='Productos';

function instalarEditorMovil(){
  const ss=SpreadsheetApp.openById(GC_MOBILE_SPREADSHEET);
  if(!ss.getSheetByName(GC_MOBILE_EDITOR)) throw Error('No existe la pestaña EDITOR MOVIL.');
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='gcMobileOnEdit').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('gcMobileOnEdit').forSpreadsheet(ss).onEdit().create();
  const sh=ss.getSheetByName(GC_MOBILE_EDITOR);
  sh.getRange('B5').setValue('Editor activo. Seleccioná un producto.');
  return 'Editor móvil instalado correctamente.';
}

function gcMobileOnEdit(e){
 if(!e||!e.range)return;
 const sh=e.range.getSheet();
 if(sh.getName()!==GC_MOBILE_EDITOR||e.range.getColumn()!==2)return;
 if(e.range.getRow()!==3&&e.range.getRow()!==4)return;
 const lock=LockService.getDocumentLock()||LockService.getScriptLock();
 if(!lock.tryLock(5000))return;
 try{
  if(e.range.getRow()===3)gcMobileLoad_(sh);
  else {
   const action=String(e.value||'').trim().toUpperCase();
   if(action==='NUEVO') gcMobileNew_(sh);
   else if(action==='RECARGAR') gcMobileLoad_(sh);
   else if(action==='GUARDAR') gcMobileSave_(sh);
   sh.getRange('B4').setValue('Elegí una acción');
  }
 }catch(err){sh.getRange('B5').setValue('ERROR: '+String(err.message||err).slice(0,180));}
 finally{lock.releaseLock();}
}

function gcMobileSource_(){
 const ss=SpreadsheetApp.openById(GC_MOBILE_SPREADSHEET);
 const sh=ss.getSheetByName(GC_MOBILE_PRODUCTS);
 if(!sh)throw Error('No existe Productos');
 return sh;
}

function gcMobileFind_(sh,key){
 const data=gcMobileSource_().getDataRange().getValues();
 const needle=String(key||'').trim();
 let index=-1;
 for(let i=1;i<data.length;i++){
  const row=data[i], label=String(row[2]||'')+' · '+String(row[1]||'');
  if(label===needle||String(row[0])===needle){index=i;break;}
 }
 if(index<1)throw Error('Producto no encontrado. Volvé a seleccionarlo de la lista.');
 return {row:index+1,values:data[index]};
}

function gcMobileNew_(sh){
 sh.getRange('B3').setValue('NUEVO PRODUCTO');
 sh.getRange('D3:D4').clearContent();
 sh.getRange('B7:B20').clearContent();
 sh.getRange('B19:B20').setValues([['SI'],['SI']]);
 sh.getRange('B5').setValue('Nuevo producto: completá nombre, categoría, precio y stock. Luego seleccioná GUARDAR.');
}

function gcMobileLoad_(sh){
 const selected=String(sh.getRange('B3').getDisplayValue()||'').trim();
 if(!selected||selected==='Seleccioná un producto...'||selected==='NUEVO PRODUCTO'){
   sh.getRange('B5').setValue('Seleccioná un producto de la lista.');return;
 }
 const src=gcMobileFind_(sh,selected),v=src.values;
 const form=[
  v[2]||'',v[3]||'',v[4]||'',v[15]||'',v[5]||'',v[6]||0,
  v[14]||'',v[9]||'',v[16]||'',v[10]||'',v[7]||'',v[8]||'',
  v[11]||'SI',v[12]||'SI'
 ];
 sh.getRange('B7:B20').setValues(form.map(x=>[x]));
 sh.getRange('D3').setValue(String(v[0]));
 sh.getRange('D4').setValue('EDICION');
 sh.getRange('B5').setValue('Editando: '+String(v[2]).slice(0,80)+'. Elegí GUARDAR al terminar.');
}

function gcMobileNumber_(v){
 if(typeof v==='number')return Number.isFinite(v)?v:0;
 let s=String(v||'').trim().replace(/[L $]/g,'');
 if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');
 else if(s.includes(','))s=s.replace(',','.');
 return Number(s);
}
function gcMobileSave_(sh){
 const values=sh.getRange('B7:B20').getValues().map(r=>r[0]);
 const [name,category,price,promoPrice,cost,stock,colors,description,promoText,discounts,image,gallery,cod,active]=values;
 const title=String(name||'').trim(),cat=String(category||'').trim();
 const p=gcMobileNumber_(price),promo=String(promoPrice).trim()===''?'':gcMobileNumber_(promoPrice);
 const n=gcMobileNumber_(stock);
 if(!title||!cat)throw Error('Nombre y categoría son obligatorios.');
 if(!Number.isFinite(p)||p<0||String(price).trim()==='')throw Error('Ingresá un precio válido.');
 if(!Number.isInteger(n)||n<0)throw Error('Stock debe ser un entero desde cero.');
 if(promo!==''&&(!Number.isFinite(promo)||promo<=0||promo>p))throw Error('El precio promocional debe ser mayor que cero y no superar el precio normal.');
 const source=gcMobileSource_();
 const id=String(sh.getRange('D3').getDisplayValue()||'').trim();
 let row,record;
 if(id){
   const found=gcMobileFind_(sh,id);row=found.row;record=found.values.slice();
 }else{
   row=Math.max(2,source.getLastRow()+1);
   record=Array(17).fill('');
   record[0]=Utilities.getUuid();
   record[1]='GC-'+Utilities.formatDate(new Date(),'America/Tegucigalpa','yyMMdd-HHmmss');
 }
 while(record.length<17)record.push('');
 record[2]=title;record[3]=cat;record[4]=p;
 if(String(cost).trim()!=='')record[5]=gcMobileNumber_(cost);
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
 try{CacheService.getScriptCache().remove('public_catalog_v4')}catch(_){}
 sh.getRange('D3').setValue(String(record[0]));
 sh.getRange('D4').setValue('EDICION');
 sh.getRange('B3').setValue(title+' · '+String(record[1]));
 sh.getRange('B5').setValue('✓ Guardado: '+title+' (fila '+row+').');
}
