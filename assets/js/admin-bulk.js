/* Selección, búsqueda y revisión por lotes. Cada solicitud procesa un solo artículo. */
(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,$=id=>document.getElementById(id);
if(!A||!$('bulkOverlay'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fallback='assets/img/sin-foto.svg',states=new Map();let state=null,trigger=null;
const gallery=p=>[...new Set([p.image,...A.parseGallery(p.gallery)].filter(Boolean))];
const currentProducts=()=>A.products().slice().sort(C.recentFirst);
const capable=()=>A.features().bulkResearch===true&&A.features().productResearchSelection===true;
const referenceCapable=()=>A.features().referencePhotoSearch===true;
const rows=()=>state?[...state.rows.values()].filter(row=>state.selected.has(row.id)):[];
const eligible=row=>!row.saved&&!row.dirty&&row.data&&(state.mode==='photos'?row.photos.size>0&&row.photos.size<=row.limit:row.fields.size>0);
const toSave=()=>rows().filter(row=>row.approved&&eligible(row));
function newRow(p){return {id:p.id,name:p.name,category:p.category,query:p.details?.brand&&p.details?.model?p.details.brand+' '+p.details.model:p.name,data:null,fields:new Set(),photos:new Map(),useReference:state?.useReference&&gallery(p).length>0,referenceIndex:0,limit:Math.min(3,10-gallery(p).length),useFirstAsMain:false,approved:false,saved:false,dirty:false,error:'',status:'Pendiente'};}
function visibleProducts(){
 const q=$('bulkSearch').value.trim(),scope=$('bulkScope').value;
 return currentProducts().filter(p=>(!state.singleId||p.id===state.singleId)&&C.matchesSearch([p.name,p.category,p.code].join(' '),q)&&(scope==='pending'?(state.mode==='photos'?!gallery(p).length:!p.description.trim()):scope==='active'?p.active:scope==='onephoto'?gallery(p).length===1:true));
}
function picker(){
 if(!state)return;
 $('bulkPicker').innerHTML=visibleProducts().map(p=>`<label class="bulk-pick"><input type="checkbox" data-bulk-pick="${esc(p.id)}" ${state.selected.has(p.id)?'checked':''} ${state.running?'disabled':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${gallery(p).length?'Con foto':'Sin foto'}${p.active?'':' · Oculto'}</small></span></label>`).join('')||'<p class="bulk-empty">No hay artículos con este filtro.</p>';
 controls();
}
function controls(){
 if(!state)return;
 const count=state.selected.size,busy=state.running||state.checking,ready=toSave().length;
 $('bulkPickedCount').textContent='('+count+' seleccionados)';
 $('bulkSelectedCount').textContent=count+' artículo'+(count===1?' seleccionado':'s seleccionados');
 $('bulkReadyCount').textContent=ready+' artículo'+(ready===1?' listo':'s listos')+' para guardar';
 const needsReference=state.useReference||rows().some(row=>row.useReference),available=capable()&&(!needsReference||referenceCapable());
 $('bulkSave').disabled=busy||!ready||!available;
 $('bulkSearchSelected').disabled=busy||!count||!available;
 $('bulkSave').textContent=state.editorId?'Copiar al formulario':'Guardar seleccionados';
 $('bulkPickerPanel').hidden=!!state.singleId;
 $('bulkOverlay').querySelector('.bulk-search-bar').hidden=!!state.singleId;
 $('bulkOverlay').querySelector('.bulk-review-heading').hidden=!!state.singleId;
 $('bulkStop').hidden=!state.running;$('bulkStop').disabled=state.stop;
 $('bulkStop').textContent=state.stop?'Se detendrá al terminar el actual':'Detener después del actual';
 $('bulkSetup').hidden=available;
 $('bulkSetupReason').textContent=capable()&&needsReference&&!referenceCapable()?'Google todavía no confirma la búsqueda con tu foto. Revisá especialmente FichaGratis.gs y publicá una nueva versión con los dos archivos actualizados.':A.features().bulkResearch===true&&!capable()?'Google no confirma la configuración del buscador. Revisá que existan las claves privadas de Tavily y Gemini en Propiedades de secuencia de comandos y que los dos archivos estén actualizados.':'La implementación de Google que usa esta página todavía no confirma el buscador por lotes. Actualizá los dos archivos y publicá una nueva versión.';
 $('bulkCheckActivation').disabled=busy;$('bulkCheckActivation').textContent=state.checking?'Comprobando Google…':'Comprobar activación';
 $('bulkReferenceOption').hidden=state.mode!=='photos'||!!state.singleId;$('bulkUseReference').disabled=busy;$('bulkUseReference').checked=!!state.useReference;
 $('bulkSelectAll').disabled=busy;$('bulkSelectNone').disabled=busy;
 $('bulkScope').disabled=busy;$('bulkPicker').querySelectorAll('input').forEach(el=>el.disabled=busy);
 $('bulkFirstPhotos').hidden=state.mode!=='photos';$('bulkFirstPhotos').disabled=busy;
 $('bulkSelectReady').disabled=busy;$('bulkClearReady').disabled=busy;
 $('bulkStatus').textContent=state.message;
 $('bulkProgress').hidden=!state.total||!!state.singleId&&!busy;$('bulkProgress').max=state.total||1;$('bulkProgress').value=state.done;
 $('bulkResults').querySelectorAll('[data-row-search],[data-more-photos],[data-bulk-source],[data-bulk-query],[data-reference-search],[data-reference-index],[data-photo-count],[data-choose-photos]').forEach(el=>{
  const row=state.rows.get(el.closest('[data-bulk-row]').dataset.bulkRow),referenceAction=el.matches('[data-reference-search],[data-reference-index]'),searchAction=el.matches('[data-row-search],[data-more-photos],[data-bulk-source]');
  el.disabled=busy||!row||(referenceAction&&(!capable()||!referenceCapable()))||(searchAction&&(!capable()||row?.useReference&&!referenceCapable()))||(row.saved&&!el.hasAttribute('data-row-search')&&!el.hasAttribute('data-reference-search'))||row?.data?.photoCapacity===0&&(el.hasAttribute('data-photo-count')||el.hasAttribute('data-choose-photos'));
 });
 $('bulkResults').querySelectorAll('[data-bulk-approve],[data-bulk-field],[data-bulk-photo],[data-remove-chosen],[data-photo-main]').forEach(el=>{
  const row=state.rows.get(el.closest('[data-bulk-row]').dataset.bulkRow);
  el.disabled=state.saving||state.checking||!row||row.saved||(el.hasAttribute('data-bulk-approve')&&!eligible(row));
 });
}
function chosenHTML(row){
 return row.photos.size?`<strong>${row.photos.size} de ${row.limit} fotos elegidas</strong><div class="bulk-chosen-list">${[...row.photos].map(([url,photo])=>`<div class="bulk-chosen-photo"><img src="${esc(url)}" alt="Foto elegida" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><button type="button" data-remove-chosen="${esc(url)}" ${row.saved?'disabled':''}>Quitar</button></div>`).join('')}</div>`:'';
}
function referenceHTML(row){
 const product=A.products().find(p=>p.id===row.id),images=product?gallery(product):[];
 if(!images.length)return '<p class="bulk-item-help">Subí y guardá una foto para buscar usando una referencia visual.</p>';
 return `<div class="bulk-reference"><img src="${esc(images[row.referenceIndex]||images[0])}" alt="Tu foto de referencia" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><div><strong>${row.useReference?'Foto que se usará como referencia':'¿Querés otras fotos de este mismo producto?'}</strong>${images.length>1?`<label>Foto de referencia<select class="field" data-reference-index aria-label="Foto de referencia de ${esc(row.name)}">${images.map((url,i)=>`<option value="${i}" ${i===row.referenceIndex?'selected':''}>${i===0?'Principal':'Foto '+(i+1)}</option>`).join('')}</select></label>`:'<p>Se usará tu foto principal para comparar las coincidencias.</p>'}<button type="button" class="btn small outline" data-reference-search>Buscar con mi foto</button>${row.data?.reference?`<p class="bulk-identity">Identificación visual: ${esc(row.data.reference.identity)}</p>`:''}</div></div>`;
}
function photoHTML(row){
 const data=row.data;if(!data)return '';
 const capacity=data.photoCapacity,countOptions=Array.from({length:capacity},(_,i)=>`<option value="${i+1}" ${row.limit===i+1?'selected':''}>${i+1} foto${i?'s':''}</option>`).join('');
 return `<p class="bulk-item-help">${esc(data.notice||'Elegí las fotos que corresponden a tu artículo.')} ${capacity} espacios disponibles en la galería.</p><div class="bulk-photo-tools"><label>Cuántas querés copiar<select class="field" data-photo-count ${capacity?'':'disabled'} aria-label="Cantidad de fotos de ${esc(row.name)}">${countOptions||'<option>Sin espacio</option>'}</select></label><button class="btn small outline" type="button" data-choose-photos ${capacity?'':'disabled'}>Elegir hasta ${row.limit} fotos</button><small>Podés cambiar las fotos marcadas antes de copiar.</small></div><div class="bulk-photo-grid">${data.images.map((url,i)=>{const match=data.photoMatches?.find(item=>item.url===url);return `<label class="bulk-photo-choice"><input type="checkbox" data-bulk-photo="${i}" ${row.photos.has(url)?'checked':''} ${row.saved?'disabled':''}><img src="${esc(url)}" alt="Propuesta de foto ${i+1} para ${esc(row.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><span>${match?'Coincidencia visual':'Foto '+(i+1)}</span><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ampliar imagen ↗</a>${match?`<small class="bulk-match-reason">${esc(match.reason)}</small>`:''}</label>`;}).join('')||'<p class="bulk-empty">No hay fotos nuevas confirmadas en esta búsqueda. Probá Buscar más fotos u otra referencia.</p>'}</div><div class="bulk-photos-chosen">${chosenHTML(row)}</div>${state.editorId?'':`<label class="bulk-main-choice"><input type="checkbox" data-photo-main ${row.useFirstAsMain?'checked':''} ${row.saved?'disabled':''}>Usar la primera foto elegida como principal</label>`}<div class="bulk-item-photo-actions"><button class="btn small outline" type="button" data-more-photos>Buscar más fotos</button><small>Se omiten las anteriores y se conservan tus elegidas.</small></div>`;
}
function rowHTML(row){
 const data=row.data,busy=state.running||state.checking,photoMode=state.mode==='photos';
 const source=data?.source&&C.researchPage(data.source.url)?`<a href="${esc(data.source.url)}" target="_blank" rel="noopener noreferrer">Consultar fuente: ${esc(data.source.title||data.source.url)} ↗</a>`:'';
 const sources=data?.candidates?.length?`<label class="bulk-source">Comparar otra fuente<select class="field" data-bulk-source ${busy||row.saved?'disabled':''}>${data.candidates.map(candidate=>`<option value="${esc(candidate.id)}" ${String(candidate.id)===String(data.candidateId)?'selected':''}>${esc(candidate.title||candidate.url)}</option>`).join('')}</select>${source}</label>`:'';
 const fields=data&&!photoMode?`<p class="bulk-item-help">Marcá los campos que querés completar. Solo se ofrecen datos vacíos con una fuente; los demás se conservan.</p><div class="bulk-field-list">${data.fields.map(field=>`<label class="bulk-field ${field.key==='description'?'is-description':''}"><input type="checkbox" data-bulk-field="${esc(field.key)}" ${row.fields.has(field.key)?'checked':''} ${row.saved?'disabled':''}><span><strong>${esc(field.label)}</strong><span class="bulk-value">${esc(field.value)}${field.unit?' '+esc(field.unit):''}</span></span></label>`).join('')||'<p class="bulk-empty">Esta fuente no aportó campos vacíos confirmados. Podés comparar otro resultado.</p>'}</div>`:'';
 const photos=photoMode?referenceHTML(row)+photoHTML(row):'';
 return `<article class="bulk-item ${row.approved&&eligible(row)?'is-approved':''} ${row.saved?'is-saved':''}" data-bulk-row="${esc(row.id)}"><div class="bulk-item-head"><label class="bulk-approve"><input type="checkbox" data-bulk-approve ${row.approved?'checked':''} ${!eligible(row)||row.saved?'disabled':''}><span><h4>${esc(row.name)}</h4><small>${esc(row.category)} · Marcar para guardar</small></span></label><span class="bulk-item-state">${esc(!data&&(!capable()||row.useReference&&!referenceCapable())?'Falta activar en Google':row.status)}</span></div>${row.error?`<p class="bulk-item-error">${esc(row.error)}</p>`:''}<div class="bulk-item-query"><input class="field" data-bulk-query value="${esc(row.query)}" aria-label="Nombre o modelo para buscar: ${esc(row.name)}" maxlength="180" ${busy||row.saved?'disabled':''}><button type="button" class="btn small outline" data-row-search ${photoMode&&data&&!row.saved?'hidden':''} ${busy?'disabled':''}>${row.saved?'Preparar de nuevo':data?(photoMode?'Buscar otras fotos':'Volver a buscar'):'Buscar este artículo'}</button></div>${sources}${fields}${photos}</article>`;
}
function renderResults(){
 const list=rows();$('bulkReview').hidden=!list.length;
 $('bulkResults').innerHTML=list.map(rowHTML).join('');controls();
}
function element(row){return [...$('bulkResults').querySelectorAll('[data-bulk-row]')].find(el=>el.dataset.bulkRow===row.id);}
function renderRow(row){
 const el=element(row);if(el)el.outerHTML=rowHTML(row);else renderResults();controls();
}
function syncChoices(row){
 const el=element(row);if(!el)return;
 const approved=el.querySelector('[data-bulk-approve]');approved.checked=row.approved;
 el.classList.toggle('is-approved',row.approved&&eligible(row));
 el.querySelectorAll('[data-bulk-photo]').forEach(input=>input.checked=row.photos.has(row.data.images[Number(input.dataset.bulkPhoto)]));
 const chosen=el.querySelector('.bulk-photos-chosen');if(chosen)chosen.innerHTML=chosenHTML(row);
 controls();
}
function open(mode,options={}){
 const key=options.key||mode;
 if(!states.has(key))states.set(key,{mode,singleId:options.singleId||'',editorId:options.editorId||'',useReference:false,selected:new Set(),rows:new Map(),running:false,saving:false,checking:false,stop:false,total:0,done:0,message:'Seleccioná los artículos que querés completar.'});
 state=states.get(key);trigger=document.activeElement;
 const ids=new Set(A.products().map(p=>p.id));for(const id of state.selected)if(!ids.has(id))state.selected.delete(id);
 $('bulkTitle').textContent=mode==='photos'?'Rellenar fotos de forma masiva':'Rellenar información';
 $('bulkHelp').textContent=mode==='photos'?'Seleccioná varios artículos y buscá sus fotos en un solo lote. Podés pedir más opciones y elegir cuáles copiar.':'Seleccioná los artículos y buscá sus fichas en un solo lote. Elegí por artículo y por campo lo que querés completar.';
 $('bulkScope').options[1].textContent=mode==='photos'?'Sin foto':'Sin descripción';
 $('bulkScope').options[3].hidden=mode!=='photos';
 $('bulkScope').value='all';$('bulkSearch').value='';
 $('bulkPickerPanel').open=!state.rows.size;
 $('bulkOverlay').hidden=false;document.body.style.overflow='hidden';
 picker();renderResults();$('bulkClose').focus({preventScroll:true});
}
function openReference(id,editor=false){
 const product=A.products().find(p=>p.id===id),draft=editor?A.editorPhotos():null;
 if(!product||!gallery(product).length){A.toast('Subí y guardá primero una foto de este producto para usarla como referencia.');return;}
 if(editor&&(draft.pending||draft.name!==product.name||!gallery(product).includes(draft.images[0]))){A.toast('Guardá primero el nombre y la foto actual del producto; después usalos como referencia.');return;}
 open('photos',{key:(editor?'editor:':'reference:')+id,singleId:id,editorId:editor?id:''});
 state.selected=new Set([id]);state.useReference=true;
 if(!state.rows.has(id))state.rows.set(id,newRow(product));
 const row=state.rows.get(id);row.useReference=true;
 if(editor)row.referenceIndex=gallery(product).indexOf(draft.images[0]);
 $('bulkTitle').textContent='Buscar con mi foto';
 $('bulkHelp').textContent=editor?'Buscá otras fotos del mismo producto. Las que elijás se copian al formulario para que las revisés antes de guardar.':'Compará otras fotos con la que ya tenés. Elegí la cantidad y guardá solo las coincidencias que aprobés.';
 $('bulkPickerPanel').open=false;picker();renderResults();
 if(capable()&&referenceCapable())searchOne(row,{more:!!row.data});
 else checkActivation();
}
async function checkActivation(){
 if(!state||state.running||state.checking)return;
 const current=state;
 current.checking=true;current.message='Comprobando la versión activa en Google…';controls();
 let ready=false;
 try{
  await A.refreshFeatures();
  if(state!==current||$('bulkOverlay').hidden)return;
  const needsReference=current.useReference||rows().some(row=>row.useReference);
  ready=capable()&&(!needsReference||referenceCapable());
  current.message=ready?'Activación confirmada. Ya podés buscar propuestas y revisar cuáles guardar.':'Google todavía no confirma la activación. Seguí los pasos de arriba y después tocá Comprobar activación.';
 }catch(error){
  current.message='No se pudo comprobar la activación: '+error.message+' Podés reintentar desde este botón.';
 }finally{
  current.checking=false;
  if(state===current&&!$('bulkOverlay').hidden){
   renderResults();
   const row=current.singleId&&current.rows.get(current.singleId);
   if(ready&&row&&!row.saved)await searchOne(row,{more:!!row.data});
  }
 }
}
function close(){
 if(state?.running){state.stop=true;state.closeWhenDone=true;state.message='Terminando el artículo actual antes de cerrar…';controls();return;}
 $('bulkOverlay').hidden=true;document.body.style.overflow=$('formOverlay')&&!$('formOverlay').hidden?'hidden':'';trigger?.focus({preventScroll:true});
}
async function prepare(row,options={}){
 if(row.saved){row.photos.clear();row.fields.clear();row.useFirstAsMain=false;row.approved=false;}
 row.error='';row.saved=false;row.status=options.more?'Buscando más fotos…':'Buscando propuesta…';
 if(state.mode==='info')row.approved=false;
 renderRow(row);
 const query=row.query;
 try{
  const data=await A.request('researchBulkItem',{id:row.id,mode:state.mode,query,...(row.useReference?{useReference:true,referenceIndex:row.referenceIndex}:{}),...((state.mode==='photos'||options.source!==undefined)&&row.data?{previousProposalId:row.data.proposalId}:{}),...(options.more?{more:true}:{}),...(options.source!==undefined?{candidateId:options.source}:{})});
  if(!data.proposalId||!Array.isArray(data.images)||!Array.isArray(data.fields))throw Error('Google devolvió una propuesta incompleta. Actualizá los dos archivos del buscador.');
  if(state.editorId)data.photoCapacity=Math.min(data.photoCapacity,10-A.editorPhotos().images.length);
  row.limit=Math.min(row.limit||3,data.photoCapacity||0);
  row.data=data;row.fields=new Set(data.fields.map(field=>field.key));row.dirty=row.query!==query;
  row.status=state.mode==='photos'?(data.images.length?(data.reference?'Coincidencias visuales':'Fotos para revisar'):'Sin fotos nuevas'):(data.fields.length?'Información para revisar':'Sin campos nuevos');
  if(state.mode==='info'||!row.photos.size)row.approved=false;
 }catch(error){
  if(/propuesta venció|resultados vencieron/i.test(error.message)){row.data=null;row.photos.clear();row.fields.clear();row.approved=false;}
  row.error=error.message;row.status='Reintentar búsqueda';throw error;
 }
 finally{renderRow(row);}
}
async function searchSelected(){
 if(state.running||state.checking||!capable())return;
 const ids=[...state.selected];
 for(const id of ids)if(!state.rows.has(id)){const p=A.products().find(p=>p.id===id);if(p)state.rows.set(id,newRow(p));}
 const queue=rows().filter(row=>!row.saved&&(!row.data||row.error||row.dirty));
 if(!queue.length){A.toast('Ya hay propuestas listas. Revisalas o tocá Volver a buscar en un artículo.');return;}
 state.running=true;state.stop=false;state.closeWhenDone=false;state.total=queue.length;state.done=0;
 $('bulkPickerPanel').open=false;picker();renderResults();let failed=0;
 try{
  for(const row of queue){
   if(state.stop)break;
   state.message=`Buscando ${state.done+1} de ${state.total}: ${row.name}`;controls();
   try{await prepare(row);}catch(error){failed++;if(/cuota|agotad|límite|HTTP 429|HTTP 404|clave privada|Google no respondió|tardó demasiado|buscando otra/i.test(error.message))state.stop=true;}
   state.done++;controls();
  }
 }finally{
  state.running=false;state.message=(state.stop?'Búsqueda detenida. ':'Búsqueda terminada. ')+state.done+' de '+state.total+' artículos consultados'+(failed?' · '+failed+' por reintentar.':'.')+' Revisá las propuestas antes de guardar.';
  picker();renderResults();if(state.closeWhenDone)close();
 }
}
async function searchOne(row,options){
 if(state.running||state.checking||!capable())return;
 if(row.useReference&&!referenceCapable()){state.message='Actualizá los dos archivos del buscador y publicá Nueva versión en Google para usar tu foto.';controls();return;}
 state.running=true;state.stop=false;state.closeWhenDone=false;state.total=1;state.done=0;
 state.message='Buscando opciones para '+row.name+'…';controls();
 try{await prepare(row,options);state.message='Propuesta actualizada. Revisá este artículo antes de guardar.';}catch(error){state.message=error.message;}
 finally{state.running=false;state.done=1;renderResults();if(state.closeWhenDone)close();}
}
async function saveSelected(){
 const queue=toSave();if(state.running||!queue.length||!capable())return;
 state.running=true;state.saving=true;state.stop=false;state.closeWhenDone=false;state.total=queue.length;state.done=0;let saved=0,failed=0;
 picker();controls();
 try{
  for(const row of queue){
   if(state.stop)break;
   row.error='';row.status='Guardando…';renderRow(row);
   try{
    let req={id:row.id},copied=[];
    if(state.mode==='photos'){
     const selected=[...row.photos.values()];
     for(let i=0;i<selected.length;i++){
      state.message=`Artículo ${state.done+1} de ${state.total} · Copiando foto ${i+1} de ${selected.length}: ${row.name}`;controls();
      const photo=await A.request('importBulkResearchImage',{proposalId:selected[i].proposalId,imageIndex:selected[i].imageIndex});
      if(!/^https:\/\//i.test(photo.url||''))throw Error('Google no devolvió una foto copiada. Reintentá este artículo.');
      copied.push(photo.url);
     }
     req.useFirstAsMain=row.useFirstAsMain;req.photos=selected.map(({proposalId,imageIndex})=>({proposalId,imageIndex}));
    }else req={...req,proposalId:row.data.proposalId,fields:[...row.fields]};
    state.message=`Guardando ${state.done+1} de ${state.total}: ${row.name}`;controls();
    const result=state.editorId?(A.appendEditorPhotos(state.editorId,copied),{addedPhotos:copied.length}):await A.request('applyBulkResearch',req);
    row.saved=true;row.approved=false;saved++;
    row.status=state.editorId?'Fotos copiadas al formulario':state.mode==='photos'?(result.addedPhotos?result.addedPhotos+' fotos guardadas':'Fotos ya guardadas'):(result.appliedFields?.length?result.appliedFields.length+' campos guardados':'Datos existentes conservados');
   }catch(error){row.error=error.message;row.status='Guardado pendiente';failed++;if(/cuota|agotad|límite|HTTP 429|Google no respondió|tardó demasiado/i.test(error.message))state.stop=true;}
   state.done++;renderRow(row);
  }
  if(saved&&!state.editorId){state.message='Actualizando el inventario con los artículos guardados…';controls();await A.reload();A.notify();}
 }finally{
  state.running=false;state.saving=false;
  state.message=state.editorId&&saved?'Fotos copiadas al formulario. Cerrá esta ventana, revisalas y tocá Guardar y actualizar tienda.':(state.stop?'Proceso detenido. ':'Proceso terminado. ')+saved+' artículo'+(saved===1?' guardado':'s guardados')+(failed?' · '+failed+' por reintentar.':'.')+' Los artículos sin marcar se conservaron.';
  picker();renderResults();if(state.closeWhenDone)close();
 }
}
$('bulkPhotos').onclick=()=>open('photos');$('bulkInfo').onclick=()=>open('info');
window.GC_BULK={openReference};
$('bulkCheckActivation').onclick=checkActivation;
$('bulkClose').onclick=close;$('bulkOverlay').onclick=event=>{if(event.target===$('bulkOverlay'))close();};
$('bulkSearch').oninput=picker;$('bulkScope').onchange=picker;
$('bulkUseReference').onchange=()=>{
 state.useReference=$('bulkUseReference').checked;
 for(const row of rows()){
  const product=A.products().find(p=>p.id===row.id),use=state.useReference&&product&&gallery(product).length>0;
  if(row.useReference!==use){row.useReference=use;row.photos.clear();row.approved=false;row.dirty=true;row.saved=false;row.status='Pendiente';}
 }
 renderResults();
};
$('bulkSelectAll').onclick=()=>{for(const p of visibleProducts())state.selected.add(p.id);picker();renderResults();};
$('bulkSelectNone').onclick=()=>{state.selected.clear();picker();renderResults();};
$('bulkPicker').onchange=event=>{const id=event.target.dataset.bulkPick;if(!id)return;event.target.checked?state.selected.add(id):state.selected.delete(id);controls();renderResults();};
$('bulkSearchSelected').onclick=searchSelected;$('bulkSave').onclick=saveSelected;
$('bulkStop').onclick=()=>{state.stop=true;state.message='Se detendrá al terminar el artículo actual. Las propuestas y lo guardado se conservan.';controls();};
$('bulkSelectReady').onclick=()=>{for(const row of rows())if(eligible(row))row.approved=true;renderResults();};
$('bulkClearReady').onclick=()=>{for(const row of rows())row.approved=false;renderResults();};
$('bulkFirstPhotos').onclick=()=>{
 for(const row of rows())if(!row.saved&&!row.dirty&&row.data?.images.length&&row.data.photoCapacity>0){const url=row.data.images[0];if(!row.photos.size)row.photos.set(url,{url,proposalId:row.data.proposalId,imageIndex:0});row.approved=true;}
 renderResults();
};
$('bulkResults').addEventListener('input',event=>{
 if(!event.target.hasAttribute('data-bulk-query'))return;
 const row=state.rows.get(event.target.closest('[data-bulk-row]').dataset.bulkRow);row.query=event.target.value;row.dirty=row.query!==row.data?.query;row.approved=false;syncChoices(row);
});
$('bulkResults').addEventListener('change',event=>{
 const item=event.target.closest('[data-bulk-row]');if(!item)return;const row=state.rows.get(item.dataset.bulkRow),input=event.target;
 if(input.hasAttribute('data-bulk-source')){searchOne(row,{source:input.value});return;}
 if(input.hasAttribute('data-reference-index')){row.referenceIndex=Number(input.value);row.useReference=true;row.photos.clear();row.approved=false;row.dirty=true;searchOne(row,{});return;}
 if(input.hasAttribute('data-photo-count')){
  row.limit=Number(input.value);while(row.photos.size>row.limit)row.photos.delete([...row.photos.keys()].at(-1));
  row.approved=row.photos.size>0;renderRow(row);return;
 }
 if(input.hasAttribute('data-bulk-approve'))row.approved=input.checked;
 if(input.hasAttribute('data-photo-main'))row.useFirstAsMain=input.checked;
 if(input.hasAttribute('data-bulk-field')){input.checked?row.fields.add(input.dataset.bulkField):row.fields.delete(input.dataset.bulkField);row.approved=row.fields.size>0;}
 if(input.hasAttribute('data-bulk-photo')){
  const index=Number(input.dataset.bulkPhoto),url=row.data.images[index];
  if(input.checked){
   if(row.photos.size>=Math.min(row.limit,row.data.photoCapacity)){input.checked=false;A.toast('Ya elegiste '+row.limit+' fotos. Cambiá la cantidad o quitá una de las marcadas.');return;}
   row.photos.set(url,{url,proposalId:row.data.proposalId,imageIndex:index});
  }else row.photos.delete(url);
  row.approved=row.photos.size>0;
 }
 syncChoices(row);
});
$('bulkResults').addEventListener('click',event=>{
 const item=event.target.closest('[data-bulk-row]');if(!item)return;const row=state.rows.get(item.dataset.bulkRow);
 if(event.target.closest('[data-row-search]'))searchOne(row,{more:state.mode==='photos'&&!!row.data});
 if(event.target.closest('[data-more-photos]'))searchOne(row,{more:true});
 if(event.target.closest('[data-reference-search]')){if(!row.useReference){row.photos.clear();row.approved=false;}row.useReference=true;searchOne(row,{more:!!row.data?.reference});}
 if(event.target.closest('[data-choose-photos]')){
  for(let i=0;i<row.data.images.length&&row.photos.size<row.limit;i++){const url=row.data.images[i];if(!row.photos.has(url))row.photos.set(url,{url,proposalId:row.data.proposalId,imageIndex:i});}
  row.approved=row.photos.size>0;syncChoices(row);
 }
 const remove=event.target.closest('[data-remove-chosen]');if(remove){row.photos.delete(remove.dataset.removeChosen);row.approved=row.photos.size>0;syncChoices(row);}
});
document.addEventListener('keydown',event=>{
 if($('bulkOverlay').hidden)return;
 if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
 if(event.key==='Tab'){
  const items=[...$('bulkOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],summary')].filter(el=>el.getClientRects().length);
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
},true);
})();
