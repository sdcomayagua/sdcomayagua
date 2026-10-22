(function(){
'use strict';
const A=window.GC_ADMIN,M=window.GC_PHOTO_MODEL,K=window.GC_CODES,$=id=>document.getElementById(id);
if(!A||!M||!K||!$('photoIntakeOpen'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readerAssets=new URL('assets/vendor/tesseract/',document.baseURI).href;
const state={rows:[],epoch:0,reading:false,saving:false,trigger:null};
let library,worker,workerHandle,ocrChain=Promise.resolve(),progress=()=>{},editorEpoch=0,ocrGeneration=0;
const overlay=document.createElement('div');overlay.id='photoIntakeOverlay';overlay.className='overlay';overlay.hidden=true;
overlay.innerHTML=`<section class="dialog pi-dialog" role="dialog" aria-modal="true" aria-labelledby="photoIntakeTitle"><div class="dialog-head"><div class="pi-heading"><h2 id="photoIntakeTitle">Crear productos desde fotos</h2><p>Elegí fotos · revisá los datos · guardá en tu inventario</p></div><button type="button" class="icon" id="piClose" aria-label="Cerrar carga de productos">×</button></div><div class="pi-body"><div class="pi-chooser" id="piDrop"><h3>La caja tiene los datos. Empezá por una foto.</h3><p>Podés seleccionar varias imágenes o arrastrarlas aquí desde tu computadora.</p><div class="row"><button class="btn" type="button" id="piPick">Elegir fotos</button><button class="btn outline" type="button" id="piCamera">Tomar foto</button></div><div class="pi-mode"><label for="piMode">Estas imágenes son de</label><select class="field" id="piMode"><option value="separate">Varios productos: una ficha por foto</option><option value="group">Un producto: todas a su galería</option></select></div><small>Lee el texto de la foto en tu dispositivo. No necesita claves ni suscripciones.<br>Se completan solo los datos legibles. Precio y existencias se revisan antes de publicar.</small><input type="file" class="hidden-input" id="piFiles" accept="image/jpeg,image/png,image/webp" multiple><input type="file" class="hidden-input" id="piCameraFile" accept="image/*" capture="environment"></div><div class="pi-summary"><p id="piSummary" role="status" aria-live="polite">Todavía no elegiste imágenes.</p><button class="btn outline small" type="button" id="piStop" hidden>Omitir lectura pendiente</button></div><p id="piGlobal" class="pi-global" role="status" aria-live="polite"></p><datalist id="piCategories"></datalist><div id="piRows"><p class="pi-empty">Cada producto tendrá su foto, categoría y código automático.</p></div></div><div class="pi-footer"><p>Las fichas se guardan como borradores. Activá «Mostrar en tienda» solo después de revisar precio, existencias y condiciones.</p><button class="btn" type="button" id="piSave" disabled>Guardar seleccionados</button></div></section>`;
document.body.appendChild(overlay);
const categories=()=>[...new Set([...A.products().map(p=>p.category),'Dedales','KIT GAMER','Cables USB-C','Adaptador','Audio','Otros'].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
function updateSummary(){
 const total=state.rows.length,selected=state.rows.filter(r=>r.selected&&!r.saved).length,saved=state.rows.filter(r=>r.saved).length;
 $('piSummary').textContent=total?`${total} ${total===1?'ficha':'fichas'} · ${selected} por guardar${saved?' · '+saved+' guardadas':''}${state.reading?' · leyendo fotos…':''}`:'Todavía no elegiste imágenes.';
 $('piSave').disabled=!selected||state.reading||state.saving;
 $('piSave').textContent=state.saving?'Guardando…':selected?'Guardar '+selected+' '+(selected===1?'seleccionado':'seleccionados'):'Guardar seleccionados';
 for(const id of ['piPick','piCamera','piMode','piClose'])$(id).disabled=state.saving;
 $('piStop').hidden=!state.reading;
}
function updateCodes(){
 const simulated=[...A.products()];
 for(const row of state.rows){if(row.saved)continue;row.code=row.category?K.next(simulated,row.category):'';if(row.code)simulated.push({id:row.id,code:row.code,category:row.category});const tag=$('piRows').querySelector(`[data-pi-row="${row.id}"] .pi-code`);if(tag)tag.textContent=row.code||'Elegí una categoría para asignar código';}
}
const specLabels={brand:'Marca',model:'Modelo',power:'Potencia',current:'Corriente',connection:'Conexión',length:'Largo',measureUnit:'Unidad (cm, m, mm)',size:'Tamaño / puertos',material:'Material',technology:'Tecnología',included:'Incluye'};
function card(row){
 const locked=row.saved||state.saving;
 const notes=row.notes.filter(n=>!(row.stock!==''&&/^Existencias pendientes/i.test(n))&&!(row.price!==''&&/^Precio de venta pendiente/i.test(n)));
 const input=(key,label,type='text',extra='')=>`<label class="${key==='name'?'pi-name':''}">${label}<input class="field" data-pi-field="${key}" value="${esc(row[key]??'')}" type="${type}" ${extra} ${locked?'disabled':''}></label>`;
 return `<article class="pi-card ${row.saved?'is-saved':''}" data-pi-row="${row.id}"><div class="pi-image"><img src="${esc(row.preview)}" alt="Foto de ${esc(row.name||'producto por revisar')}"><p>${esc(row.files[0].name)}${row.files.length>1?' · '+row.files.length+' fotos':''}</p>${row.saved?'':`<button class="btn outline small" data-pi-add type="button">+ Más fotos</button><input class="hidden-input" data-pi-extra type="file" accept="image/jpeg,image/png,image/webp" multiple>`}</div><div><div class="pi-card-top"><div><label><input type="checkbox" data-pi-select ${row.selected?'checked':''} ${locked?'disabled':''}>${row.saved?'Guardado en inventario':'Revisar producto'}</label><p class="pi-state ${row.error?'pi-error':''}" role="status">${esc(row.status)}</p></div>${row.saved?'<span class="pi-draft">'+(row.active?'Visible':'Borrador')+'</span>':'<button class="icon" data-pi-remove type="button" aria-label="Quitar esta ficha">×</button>'}</div><span class="pi-code">${esc(row.code||'Elegí una categoría para asignar código')}</span><div class="pi-fields">${input('name','Nombre del producto','text','maxlength="180"')}${input('category','Categoría','text','list="piCategories" maxlength="120"')}${input('price','Precio de venta (L)','number','min="0" step="0.01" placeholder="Pendiente"')}${input('stock','Existencias','number','min="0" step="1" placeholder="Pendiente"')}<label class="full">Descripción<textarea class="field" data-pi-field="description" rows="3" maxlength="5000" ${locked?'disabled':''}>${esc(row.description)}</textarea></label><div class="pi-checks"><label><input type="checkbox" data-pi-field="codAllowed" ${row.codAllowed?'checked':''} ${locked?'disabled':''}>Permitir pago al recibir</label><label><input type="checkbox" data-pi-field="active" ${row.active?'checked':''} ${locked?'disabled':''}>Mostrar en tienda</label></div></div>${notes.length?'<p class="pi-notes">'+notes.map(esc).join(' · ')+'</p>':''}<details class="pi-specs"><summary>Datos de la caja y texto leído</summary><div class="pi-fields">${Object.entries(specLabels).map(([key,label])=>`<label>${label}<input class="field" data-pi-spec="${key}" value="${esc(row.details[key]??'')}" ${locked?'disabled':''}></label>`).join('')}</div><label class="pi-field-hint">Texto detectado<textarea class="field pi-ocr" data-pi-ocr readonly rows="5">${esc(row.text)}</textarea></label></details><div class="pi-actions">${row.saved?`<button class="btn outline small" type="button" data-pi-edit>Abrir ficha completa</button>`:`<button class="btn outline small" type="button" data-pi-read>Volver a leer foto</button><span class="pi-field-hint">El código definitivo se confirma al guardar.</span>`}</div></div></article>`;
}
function render(){
 $('piCategories').innerHTML=categories().map(c=>'<option value="'+esc(c)+'"></option>').join('');updateCodes();
 $('piRows').innerHTML=state.rows.map(card).join('')||'<p class="pi-empty">Elegí una foto clara de cada producto para empezar.</p>';updateSummary();
}
function setStatus(row,text,error=false){row.status=text;row.error=error;const el=$('piRows').querySelector(`[data-pi-row="${row.id}"] .pi-state`);if(el){el.textContent=text;el.classList.toggle('pi-error',error);}}
async function loadLibrary(){
 if(window.Tesseract?.createWorker)return window.Tesseract;
 if(!library)library=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src=readerAssets+'tesseract.min.js';s.crossOrigin='anonymous';
  const timer=setTimeout(()=>{s.remove();reject(Error('La lectura automática no pudo cargarse. Podés completar los datos manualmente y guardar las fotos.'));},30000);
  s.onload=()=>{clearTimeout(timer);window.Tesseract?.createWorker?resolve(window.Tesseract):reject(Error('No se pudo iniciar la lectura de imágenes.'));};
  s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('No se pudo descargar el lector. Revisá tu conexión o completá los datos manualmente.'));};document.head.appendChild(s);
 }).catch(error=>{library=null;throw error;});
 return library;
}
async function getWorker(){
 if(!worker)worker=(async()=>{
  const T=await loadLibrary();let expired=false;
  const pending=T.createWorker('eng',1,{workerPath:readerAssets+'worker.min.js',corePath:readerAssets+'tesseract-core-lstm.wasm.js',langPath:readerAssets,gzip:true,logger:info=>{if(info.status==='recognizing text')progress('Leyendo texto · '+Math.round((info.progress||0)*100)+'%');else progress('Preparando lector · la primera carga puede tardar…');}});
  let timer;
  try{const w=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('La preparación tardó demasiado. Reintentá la lectura o completá la ficha manualmente.'));},60000);})]);workerHandle=w;await w.setParameters({tessedit_pageseg_mode:'11'});return w;}
  catch(error){if(expired)pending.then(w=>w.terminate()).catch(()=>{});throw error;}finally{clearTimeout(timer);}
 })().catch(error=>{worker=null;throw error;});
 return worker;
}
function recognize(file,onProgress){
 const generation=ocrGeneration;
 const task=ocrChain.catch(()=>{}).then(async()=>{
  if(generation!==ocrGeneration)throw Error('Lectura cancelada.');
  progress=onProgress;onProgress('Preparando lectura de la caja…');const w=await getWorker();if(generation!==ocrGeneration)throw Error('Lectura cancelada.');let timer;
  try{return await Promise.race([w.recognize(file),new Promise((_,reject)=>{timer=setTimeout(()=>{w.terminate();worker=null;workerHandle=null;reject(Error('No se pudo completar la lectura. Podés escribir los datos manualmente.'));},70000);})]);}finally{clearTimeout(timer);progress=()=>{};}
 });ocrChain=task;return task;
}
function stopReading(){
 state.epoch++;ocrGeneration++;state.reading=false;if(workerHandle){workerHandle.terminate();workerHandle=null;worker=null;}
 for(const row of state.rows)if(!row.saved&&/Leyendo|Preparando|En cola/.test(row.status))setStatus(row,'Lectura omitida. Podés completar los campos manualmente.');updateSummary();
}
async function readRow(row,epoch){
 try{
  const result=await recognize(row.files[0],message=>{if(epoch===state.epoch)setStatus(row,message);});
  if(epoch!==state.epoch||!state.rows.includes(row))return;
  const draft=M.parse(result.data?.text||'',row.files[0].name,categories());
  row.text=draft.text;row.notes=draft.notes;
  for(const key of ['name','category','description'])if(!row[key]||key==='name'&&row[key]===M.filenameName(row.files[0].name))row[key]=draft[key];
  if(row.price==='')row.price=draft.price??'';
  if(!row.manuallyChanged.has('codAllowed'))row.codAllowed=draft.codAllowed;
  for(const [key,value] of Object.entries(draft.details))if(!row.details[key])row.details[key]=value;
  if(draft.freeShipping)row.active=false;
  row.status=draft.confidence==='empty'?'No se pudo leer suficiente texto. Completá la ficha manualmente.':'Lectura lista. Revisá nombre, categoría y datos de la caja.';row.error=false;render();
 }catch(error){if(epoch===state.epoch&&state.rows.includes(row))setStatus(row,error.message,true);}
}
function validFiles(list){
 const files=Array.from(list||[]),accepted=files.filter(f=>/^image\/(jpeg|png|webp)$/i.test(f.type)&&f.size<=30*1024*1024);
 if(accepted.length<files.length)$('piGlobal').textContent='Algunas fotos no se agregaron. Usá JPG, PNG o WEBP de hasta 30 MB.';
 return accepted;
}
async function addFiles(list){
 if(state.saving||state.reading){A.toast('Esperá a que termine la lectura actual o tocá Omitir lectura.');return;}
 const files=validFiles(list).filter(f=>!state.rows.some(r=>r.files.some(old=>old.name===f.name&&old.size===f.size&&old.lastModified===f.lastModified)));
 const groups=$('piMode').value==='group'?[files.slice(0,10)]:files.map(f=>[f]);const newRows=[];
 for(const group of groups){if(!group.length)continue;if(state.rows.filter(r=>!r.saved).length>=20){A.toast('Podés revisar hasta 20 productos por carga. Guardalos antes de agregar más.');break;}
  const row={id:crypto.randomUUID(),files:group,preview:URL.createObjectURL(group[0]),selected:true,saved:false,uploaded:[],manuallyChanged:new Set(),name:M.filenameName(group[0].name),category:'',price:'',stock:'',description:'',codAllowed:true,active:false,details:{},notes:[],text:'',status:'En cola para leer la foto',code:''};state.rows.push(row);newRows.push(row);
 }
 if(!newRows.length)return;const epoch=++state.epoch;state.reading=true;render();
 for(const row of newRows){if(epoch!==state.epoch)break;await readRow(row,epoch);}
 if(epoch===state.epoch)state.reading=false;updateSummary();
}
function open(){state.trigger=document.activeElement;overlay.hidden=false;document.body.style.overflow='hidden';$('piGlobal').textContent='';render();$('piPick').focus();}
function close(force=false){
 if(state.saving)return;
 stopReading();overlay.hidden=true;document.body.style.overflow='';state.trigger?.focus();
}
function filePayload(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({mime:blob.type,base64:String(r.result).split(',')[1]});r.onerror=()=>reject(Error('No se pudo leer esta foto.'));r.readAsDataURL(blob);});}
async function saveRows(){
 if(state.saving||state.reading)return;const selected=state.rows.filter(r=>r.selected&&!r.saved);if(!selected.length)return;
 for(const row of selected){
  if(row.name.trim().length<3||!row.category.trim()){setStatus(row,'Completá el nombre y elegí una categoría antes de guardar.',true);$('piRows').querySelector(`[data-pi-row="${row.id}"]`).scrollIntoView({block:'center'});return;}
  if(row.price!==''&&(!Number.isFinite(Number(row.price))||Number(row.price)<0)||row.stock!==''&&(!Number.isInteger(Number(row.stock))||Number(row.stock)<0)){setStatus(row,'Revisá el precio y las existencias: no se permiten valores negativos ni stock con decimales.',true);return;}
  if(row.active&&(row.price===''||Number(row.price)<=0||row.stock==='')){setStatus(row,'Para mostrarlo en la tienda, confirmá un precio mayor que cero y las existencias.',true);return;}
 }
 state.saving=true;render();let completed=0,inventory;
 try{
  const fresh=await A.request('adminCatalog');if(!Array.isArray(fresh.products))throw Error('No se pudo comprobar el inventario. Sincronizá antes de guardar.');inventory=[...fresh.products];
  for(const row of selected){
   const previous=inventory.find(p=>p.id===row.id);
   if(previous){row.saved=true;row.code=previous.code;row.status='Guardado confirmado. No se volvió a crear.';completed++;continue;}
   try{
    for(let i=row.uploaded.length;i<row.files.length;i++){
     setStatus(row,'Subiendo foto '+(i+1)+' de '+row.files.length+'…');const blob=await A.preparePhoto(row.files[i]);
     const out=await A.request('uploadImage',{file:await filePayload(blob)});if(!/^https:\/\//i.test(out.url||''))throw Error('Google no devolvió el enlace de la foto.');row.uploaded.push(out.url);
    }
    row.code=K.next(inventory,row.category);setStatus(row,'Guardando '+row.code+'…');
    const product={id:row.id,code:row.code,name:row.name.trim(),category:row.category.trim(),price:row.price===''?0:Number(row.price),promoPrice:'',cost:'',stock:row.stock===''?0:Number(row.stock),image:row.uploaded[0],gallery:row.uploaded.slice(1).join(', ')||'[]',description:row.description,discounts:'',colors:'',promoText:'',codAllowed:row.codAllowed,active:row.active,details:window.GC.cleanDetails(row.details)};
    const out=await A.request('saveProduct',{product});row.code=out.code||row.code;row.saved=true;row.status=row.active?'Guardado y visible en la tienda.':'Borrador guardado. Completá y activá su ficha cuando esté listo.';row.error=false;completed++;inventory.push({...product,code:row.code});
   }catch(error){
    // El mismo ID sobrevive a reintentos; primero se comprueba un guardado de respuesta perdida.
    try{const check=await A.request('adminCatalog'),found=check.products?.find(p=>p.id===row.id);if(found){row.saved=true;row.code=found.code;row.status='Guardado comprobado en inventario.';row.error=false;completed++;inventory=check.products;continue;}}catch(_){}
    setStatus(row,error.message+' Las fotos subidas se conservan para reintentar.',true);break;
   }
  }
  A.notify();await A.reload();$('piGlobal').textContent=completed+' '+(completed===1?'ficha guardada.':'fichas guardadas.')+' '+(selected.length>completed?'Revisá los pendientes antes de reintentar.':'Podés abrirlas para completar la revisión.');
 }catch(error){$('piGlobal').textContent=error.message;}
 finally{state.saving=false;render();}
}
async function readEditor(auto=false){
 const f=$('productForm'),file=A.selectedPhotos()[0];if(!file){A.toast('Elegí primero una foto de la caja desde tu galería o cámara.');return;}
 if(A.editorPhotos().busy)return;const epoch=++editorEpoch,id=f.elements.namedItem('id').value,button=$('readPackageBtn'),status=$('packageReadStatus');button.disabled=true;
 try{
  const output=await recognize(file,message=>{if(epoch===editorEpoch)status.textContent=message;});
  if(epoch!==editorEpoch||$('formOverlay').hidden||A.editorPhotos().busy||f.elements.namedItem('id').value!==id||!A.selectedPhotos().includes(file))return;
  const draft=M.parse(output.data?.text||'',file.name,categories());let count=0;
  const values={name:draft.name,category:draft.category,description:draft.description,...draft.details};
  for(const [key,value] of Object.entries(values)){const field=f.elements.namedItem(key);if(value&&field&&!String(field.value||'').trim()){field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));count++;}}
  if(!id&&draft.price!==null&&(!f.elements.namedItem('price').value||Number(f.elements.namedItem('price').value)===0)){f.elements.namedItem('price').value=draft.price;count++;}
  if(draft.details.length)f.elements.namedItem('measureUnit').value=draft.details.measureUnit;
  if(!id&&!draft.codAllowed)f.elements.namedItem('codAllowed').value='NO';
  if(!id)f.elements.namedItem('active').value='NO';
  if(Object.keys(draft.details).length)$('technicalEditor').open=true;
  A.updateEditorCode();status.textContent=count?count+' campos vacíos completados. Revisalos antes de guardar.'+(!id?' Se guardará como borrador hasta que activés Mostrar en tienda.':''):'No hay campos vacíos con datos legibles. Podés completar la ficha manualmente.';
 }catch(error){if(epoch===editorEpoch)status.textContent=error.message;}
 finally{if(epoch===editorEpoch)button.disabled=false;}
}
$('photoIntakeOpen').onclick=open;$('piClose').onclick=()=>close();$('piSave').onclick=saveRows;$('piStop').onclick=stopReading;
$('piPick').onclick=()=>$('piFiles').click();$('piCamera').onclick=()=>$('piCameraFile').click();
for(const id of ['piFiles','piCameraFile'])$(id).onchange=event=>{addFiles(event.target.files);event.target.value='';};
const drop=$('piDrop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');addFiles(e.dataTransfer.files);});
$('piRows').addEventListener('input',event=>{
 const el=event.target,row=state.rows.find(r=>r.id===el.closest('[data-pi-row]')?.dataset.piRow);if(!row||row.saved||state.saving)return;
 if(el.dataset.piField){const key=el.dataset.piField;row[key]=el.type==='checkbox'?el.checked:el.value;row.manuallyChanged.add(key);if(key==='category')updateCodes();}
 if(el.dataset.piSpec)row.details[el.dataset.piSpec]=el.value;
 if(el.hasAttribute('data-pi-select'))row.selected=el.checked;updateSummary();
});
$('piRows').addEventListener('change',event=>{
 const el=event.target;if(!el.hasAttribute('data-pi-extra'))return;const row=state.rows.find(r=>r.id===el.closest('[data-pi-row]')?.dataset.piRow);if(!row||row.saved||state.saving)return;
 row.files.push(...validFiles(el.files).slice(0,10-row.files.length));el.value='';render();
});
$('piRows').addEventListener('click',async event=>{
 const button=event.target.closest('button'),row=state.rows.find(r=>r.id===button?.closest('[data-pi-row]')?.dataset.piRow);if(!row||state.saving)return;
 if(button.hasAttribute('data-pi-remove')){URL.revokeObjectURL(row.preview);state.rows=state.rows.filter(r=>r!==row);render();}
 if(button.hasAttribute('data-pi-add'))button.closest('[data-pi-row]').querySelector('[data-pi-extra]').click();
 if(button.hasAttribute('data-pi-edit')){close(true);A.editProduct(row.id);}
 if(button.hasAttribute('data-pi-read')){if(state.reading){A.toast('Esperá a que termine la lectura actual.');return;}const epoch=++state.epoch;state.reading=true;updateSummary();await readRow(row,epoch);if(epoch===state.epoch)state.reading=false;updateSummary();}
});
overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
document.addEventListener('keydown',event=>{
 if(overlay.hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
 if(event.key!=='Tab')return;const focusable=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,summary')].filter(el=>el.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
},true);
window.addEventListener('beforeunload',event=>{if(state.rows.some(r=>!r.saved)){event.preventDefault();event.returnValue='';}});
$('readPackageBtn').onclick=()=>readEditor(false);
document.addEventListener('gc:photos-selected',()=>{const f=$('productForm');if(!f.elements.namedItem('id').value&&!f.elements.namedItem('name').value.trim())readEditor(true);});
let autoOpened=false;
document.addEventListener('gc:catalog',()=>{if(!autoOpened&&new URL(location.href).searchParams.get('fotos')==='1'){autoOpened=true;open();}else if(!overlay.hidden&&!state.saving)render();});
window.GC_PHOTOS={open};
})();
