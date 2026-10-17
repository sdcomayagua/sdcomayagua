/* Selección, búsqueda y revisión por lotes. Cada solicitud procesa un solo artículo. */
(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,$=id=>document.getElementById(id);
if(!A||!$('bulkOverlay'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fallback='assets/img/sin-foto.svg',states=new Map();let state=null,trigger=null;
const gallery=p=>[...new Set([p.image,...A.parseGallery(p.gallery)].filter(Boolean))];
const currentProducts=()=>A.products().slice().sort(C.recentFirst);
const capable=()=>A.features().bulkResearch===true&&A.features().productResearchSelection===true;
const rows=()=>state?[...state.rows.values()].filter(row=>state.selected.has(row.id)):[];
const eligible=row=>!row.saved&&!row.dirty&&row.data&&(state.mode==='photos'?row.photos.size>0:row.fields.size>0);
const toSave=()=>rows().filter(row=>row.approved&&eligible(row));
function newRow(p){return {id:p.id,name:p.name,category:p.category,query:p.details?.brand&&p.details?.model?p.details.brand+' '+p.details.model:p.name,data:null,fields:new Set(),photos:new Map(),useFirstAsMain:false,approved:false,saved:false,dirty:false,error:'',status:'Pendiente'};}
function visibleProducts(){
 const q=$('bulkSearch').value.trim(),scope=$('bulkScope').value;
 return currentProducts().filter(p=>C.matchesSearch([p.name,p.category,p.code].join(' '),q)&&(scope==='pending'?(state.mode==='photos'?!gallery(p).length:!p.description.trim()):scope==='active'?p.active:true));
}
function picker(){
 if(!state)return;
 $('bulkPicker').innerHTML=visibleProducts().map(p=>`<label class="bulk-pick"><input type="checkbox" data-bulk-pick="${esc(p.id)}" ${state.selected.has(p.id)?'checked':''} ${state.running?'disabled':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${gallery(p).length?'Con foto':'Sin foto'}${p.active?'':' · Oculto'}</small></span></label>`).join('')||'<p class="bulk-empty">No hay artículos con este filtro.</p>';
 controls();
}
function controls(){
 if(!state)return;
 const count=state.selected.size,busy=state.running,ready=toSave().length;
 $('bulkPickedCount').textContent='('+count+' seleccionados)';
 $('bulkSelectedCount').textContent=count+' artículo'+(count===1?' seleccionado':'s seleccionados');
 $('bulkReadyCount').textContent=ready+' artículo'+(ready===1?' listo':'s listos')+' para guardar';
 $('bulkSave').disabled=busy||!ready||!capable();
 $('bulkSearchSelected').disabled=busy||!count||!capable();
 $('bulkStop').hidden=!busy;$('bulkStop').disabled=state.stop;
 $('bulkStop').textContent=state.stop?'Se detendrá al terminar el actual':'Detener después del actual';
 $('bulkSetup').hidden=capable();
 $('bulkSelectAll').disabled=busy;$('bulkSelectNone').disabled=busy;
 $('bulkScope').disabled=busy;$('bulkPicker').querySelectorAll('input').forEach(el=>el.disabled=busy);
 $('bulkFirstPhotos').hidden=state.mode!=='photos';$('bulkFirstPhotos').disabled=busy;
 $('bulkSelectReady').disabled=busy;$('bulkClearReady').disabled=busy;
 $('bulkStatus').textContent=state.message;
 $('bulkProgress').hidden=!state.total;$('bulkProgress').max=state.total||1;$('bulkProgress').value=state.done;
 $('bulkResults').querySelectorAll('[data-row-search],[data-more-photos],[data-bulk-source],[data-bulk-query]').forEach(el=>{const row=state.rows.get(el.closest('[data-bulk-row]').dataset.bulkRow);el.disabled=busy||!row||(row.saved&&!el.hasAttribute('data-row-search'));});
 $('bulkResults').querySelectorAll('[data-bulk-approve],[data-bulk-field],[data-bulk-photo],[data-remove-chosen],[data-photo-main]').forEach(el=>{
  const row=state.rows.get(el.closest('[data-bulk-row]').dataset.bulkRow);
  el.disabled=state.saving||!row||row.saved||(el.hasAttribute('data-bulk-approve')&&!eligible(row));
 });
}
function chosenHTML(row){
 return row.photos.size?`<strong>${row.photos.size} foto${row.photos.size===1?' elegida':'s elegidas'}</strong><div class="bulk-chosen-list">${[...row.photos].map(([url,photo])=>`<div class="bulk-chosen-photo"><img src="${esc(url)}" alt="Foto elegida" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><button type="button" data-remove-chosen="${esc(url)}" ${row.saved?'disabled':''}>Quitar</button></div>`).join('')}</div>`:'';
}
function rowHTML(row){
 const data=row.data,busy=state.running,photoMode=state.mode==='photos';
 const source=data?.source&&C.researchPage(data.source.url)?`<a href="${esc(data.source.url)}" target="_blank" rel="noopener noreferrer">Consultar fuente: ${esc(data.source.title||data.source.url)} ↗</a>`:'';
 const sources=data?.candidates?.length?`<label class="bulk-source">Comparar otra fuente<select class="field" data-bulk-source ${busy||row.saved?'disabled':''}>${data.candidates.map(candidate=>`<option value="${esc(candidate.id)}" ${String(candidate.id)===String(data.candidateId)?'selected':''}>${esc(candidate.title||candidate.url)}</option>`).join('')}</select>${source}</label>`:'';
 const fields=data&&!photoMode?`<p class="bulk-item-help">Marcá los campos que querés completar. Solo se ofrecen datos vacíos con una fuente; los demás se conservan.</p><div class="bulk-field-list">${data.fields.map(field=>`<label class="bulk-field ${field.key==='description'?'is-description':''}"><input type="checkbox" data-bulk-field="${esc(field.key)}" ${row.fields.has(field.key)?'checked':''} ${row.saved?'disabled':''}><span><strong>${esc(field.label)}</strong><span class="bulk-value">${esc(field.value)}${field.unit?' '+esc(field.unit):''}</span></span></label>`).join('')||'<p class="bulk-empty">Esta fuente no aportó campos vacíos confirmados. Podés comparar otro resultado.</p>'}</div>`:'';
 const photos=data&&photoMode?`<p class="bulk-item-help">${data.broader?'Coincidencias de la web: compará modelo, variante y color.':'Elegí las fotos que corresponden a tu artículo.'} ${data.photoCapacity} espacio${data.photoCapacity===1?'':'s'} disponible${data.photoCapacity===1?'':'s'} en la galería.</p><div class="bulk-photo-grid">${data.images.map((url,i)=>`<label class="bulk-photo-choice"><input type="checkbox" data-bulk-photo="${i}" ${row.photos.has(url)?'checked':''} ${row.saved?'disabled':''}><img src="${esc(url)}" alt="Propuesta de foto ${i+1} para ${esc(row.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><span>Foto ${i+1}</span></label>`).join('')||'<p class="bulk-empty">No hay fotos nuevas en esta búsqueda. Probá Buscar más u otro nombre.</p>'}</div><div class="bulk-photos-chosen">${chosenHTML(row)}</div><label class="bulk-main-choice"><input type="checkbox" data-photo-main ${row.useFirstAsMain?'checked':''} ${row.saved?'disabled':''}>Usar la primera foto elegida como principal</label><div class="bulk-item-photo-actions"><button class="btn small outline" type="button" data-more-photos ${busy||row.saved?'disabled':''}>Buscar más fotos</button><small>Las fotos elegidas se conservan al buscar más.</small></div>`:'';
 return `<article class="bulk-item ${row.approved&&eligible(row)?'is-approved':''} ${row.saved?'is-saved':''}" data-bulk-row="${esc(row.id)}"><div class="bulk-item-head"><label class="bulk-approve"><input type="checkbox" data-bulk-approve ${row.approved?'checked':''} ${!eligible(row)||row.saved?'disabled':''}><span><h4>${esc(row.name)}</h4><small>${esc(row.category)} · Marcar para guardar</small></span></label><span class="bulk-item-state">${esc(row.status)}</span></div>${row.error?`<p class="bulk-item-error">${esc(row.error)}</p>`:''}<div class="bulk-item-query"><input class="field" data-bulk-query value="${esc(row.query)}" aria-label="Nombre o modelo para buscar: ${esc(row.name)}" maxlength="180" ${busy||row.saved?'disabled':''}><button type="button" class="btn small outline" data-row-search ${busy?'disabled':''}>${row.saved?'Preparar de nuevo':data?'Volver a buscar':'Buscar este artículo'}</button></div>${sources}${fields}${photos}</article>`;
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
function open(mode){
 if(!states.has(mode))states.set(mode,{mode,selected:new Set(),rows:new Map(),running:false,saving:false,stop:false,total:0,done:0,message:'Seleccioná los artículos que querés completar.'});
 state=states.get(mode);trigger=document.activeElement;
 const ids=new Set(A.products().map(p=>p.id));for(const id of state.selected)if(!ids.has(id))state.selected.delete(id);
 $('bulkTitle').textContent=mode==='photos'?'Rellenar fotos de forma masiva':'Rellenar información';
 $('bulkHelp').textContent=mode==='photos'?'Seleccioná varios artículos y buscá sus fotos en un solo lote. Podés pedir más opciones y elegir cuáles copiar.':'Seleccioná los artículos y buscá sus fichas en un solo lote. Elegí por artículo y por campo lo que querés completar.';
 $('bulkScope').options[1].textContent=mode==='photos'?'Sin foto':'Sin descripción';
 $('bulkScope').value='all';$('bulkSearch').value='';
 $('bulkPickerPanel').open=!state.rows.size;
 $('bulkOverlay').hidden=false;document.body.style.overflow='hidden';
 picker();renderResults();$('bulkClose').focus({preventScroll:true});
}
function close(){
 if(state?.running){state.stop=true;state.closeWhenDone=true;state.message='Terminando el artículo actual antes de cerrar…';controls();return;}
 $('bulkOverlay').hidden=true;document.body.style.overflow='';trigger?.focus({preventScroll:true});
}
async function prepare(row,options={}){
 if(row.saved){row.photos.clear();row.fields.clear();row.useFirstAsMain=false;row.approved=false;}
 row.error='';row.saved=false;row.status=options.more?'Buscando más fotos…':'Buscando propuesta…';
 if(state.mode==='info')row.approved=false;
 renderRow(row);
 const query=row.query;
 try{
  const data=await A.request('researchBulkItem',{id:row.id,mode:state.mode,query,...((options.more||options.source!==undefined)&&row.data?{previousProposalId:row.data.proposalId}:{}),...(options.more?{more:true}:{}),...(options.source!==undefined?{candidateId:options.source}:{})});
  if(!data.proposalId||!Array.isArray(data.images)||!Array.isArray(data.fields))throw Error('Google devolvió una propuesta incompleta. Actualizá los dos archivos del buscador.');
  row.data=data;row.fields=new Set(data.fields.map(field=>field.key));row.dirty=row.query!==query;
  row.status=state.mode==='photos'?(data.images.length?'Fotos para revisar':'Sin fotos nuevas'):(data.fields.length?'Información para revisar':'Sin campos nuevos');
  if(state.mode==='info'||!row.photos.size)row.approved=false;
 }catch(error){row.error=error.message;row.status='Reintentar búsqueda';throw error;}
 finally{renderRow(row);}
}
async function searchSelected(){
 if(state.running||!capable())return;
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
   try{await prepare(row);}catch(error){failed++;if(/cuota|agotad|límite|HTTP 429|Google no respondió|tardó demasiado|buscando otra/i.test(error.message))state.stop=true;}
   state.done++;controls();
  }
 }finally{
  state.running=false;state.message=(state.stop?'Búsqueda detenida. ':'Búsqueda terminada. ')+state.done+' de '+state.total+' artículos consultados'+(failed?' · '+failed+' por reintentar.':'.')+' Revisá las propuestas antes de guardar.';
  picker();renderResults();if(state.closeWhenDone)close();
 }
}
async function searchOne(row,options){
 if(state.running||!capable())return;
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
    let req={id:row.id};
    if(state.mode==='photos'){
     const selected=[...row.photos.values()];
     for(let i=0;i<selected.length;i++){
      state.message=`Artículo ${state.done+1} de ${state.total} · Copiando foto ${i+1} de ${selected.length}: ${row.name}`;controls();
      await A.request('importBulkResearchImage',{proposalId:selected[i].proposalId,imageIndex:selected[i].imageIndex});
     }
     req.useFirstAsMain=row.useFirstAsMain;req.photos=selected.map(({proposalId,imageIndex})=>({proposalId,imageIndex}));
    }else req={...req,proposalId:row.data.proposalId,fields:[...row.fields]};
    state.message=`Guardando ${state.done+1} de ${state.total}: ${row.name}`;controls();
    const result=await A.request('applyBulkResearch',req);
    row.saved=true;row.approved=false;saved++;
    row.status=state.mode==='photos'?(result.addedPhotos?result.addedPhotos+' fotos guardadas':'Fotos ya guardadas'):(result.appliedFields?.length?result.appliedFields.length+' campos guardados':'Datos existentes conservados');
   }catch(error){row.error=error.message;row.status='Guardado pendiente';failed++;if(/cuota|agotad|límite|HTTP 429|Google no respondió|tardó demasiado/i.test(error.message))state.stop=true;}
   state.done++;renderRow(row);
  }
  if(saved){state.message='Actualizando el inventario con los artículos guardados…';controls();await A.reload();A.notify();}
 }finally{
  state.running=false;state.saving=false;
  state.message=(state.stop?'Proceso detenido. ':'Proceso terminado. ')+saved+' artículo'+(saved===1?' guardado':'s guardados')+(failed?' · '+failed+' por reintentar.':'.')+' Los artículos sin marcar se conservaron.';
  picker();renderResults();if(state.closeWhenDone)close();
 }
}
$('bulkPhotos').onclick=()=>open('photos');$('bulkInfo').onclick=()=>open('info');
$('bulkClose').onclick=close;$('bulkOverlay').onclick=event=>{if(event.target===$('bulkOverlay'))close();};
$('bulkSearch').oninput=picker;$('bulkScope').onchange=picker;
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
 if(input.hasAttribute('data-bulk-approve'))row.approved=input.checked;
 if(input.hasAttribute('data-photo-main'))row.useFirstAsMain=input.checked;
 if(input.hasAttribute('data-bulk-field')){input.checked?row.fields.add(input.dataset.bulkField):row.fields.delete(input.dataset.bulkField);row.approved=row.fields.size>0;}
 if(input.hasAttribute('data-bulk-photo')){
  const index=Number(input.dataset.bulkPhoto),url=row.data.images[index];
  if(input.checked){
   if(row.photos.size>=row.data.photoCapacity){input.checked=false;A.toast('No hay espacio para más fotos en este artículo.');return;}
   row.photos.set(url,{url,proposalId:row.data.proposalId,imageIndex:index});
  }else row.photos.delete(url);
  row.approved=row.photos.size>0;
 }
 syncChoices(row);
});
$('bulkResults').addEventListener('click',event=>{
 const item=event.target.closest('[data-bulk-row]');if(!item)return;const row=state.rows.get(item.dataset.bulkRow);
 if(event.target.closest('[data-row-search]'))searchOne(row,{});
 if(event.target.closest('[data-more-photos]'))searchOne(row,{more:true});
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
