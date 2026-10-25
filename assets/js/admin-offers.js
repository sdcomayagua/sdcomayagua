/* Admin → Ofertas. Guarda en la misma conexión autenticada del inventario. */
(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,O=window.GC_OFFERS,$=id=>document.getElementById(id);
if(!A||!O||!$('mgViewOffers'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plan=null,saving=false,selected='',catalogKey='';
const products=()=>A.products().filter(p=>!p.deletedAt).slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
const current=()=>products().find(p=>p.id===$('ofProduct').value);
function status(text,error=false){$('ofStatus').textContent=text;$('ofStatus').classList.toggle('is-error',error);}
function setMode(value){plan=null;$('ofGlobalForm').hidden=value!=='all';$('ofIndividualForm').hidden=value!=='individual';document.querySelectorAll('[data-of-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ofMode===value)));renderPreview();renderTable();}
function productOptions(){
 const query=$('ofProductSearch').value,old=selected||$('ofProduct').value,list=products().filter(p=>C.matchesSearch(C.productSearchText(p),query));
 $('ofProduct').innerHTML='<option value="">Elegí un producto</option>'+list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.code||p.category)}${p.active===false?' · Oculto':''}</option>`).join('');
 if(list.some(p=>p.id===old))$('ofProduct').value=old;
 else if(list.length===1)$('ofProduct').value=list[0].id;
 selected=$('ofProduct').value;individualPreview();
}
function individualPreview(){
 const p=current(),box=$('ofIndividualPreview');
 $('ofIndividualRemove').disabled=saving||!p||!O.active(p);$('ofIndividualSave').disabled=saving||!p;
 $('ofValueLabel').textContent=$('ofPriceMode').value==='percent'?'Descuento (%)':'Precio de oferta (L)';
 $('ofIndividualValue').max=$('ofPriceMode').value==='percent'?'99':String(p?.price||100000000);
 if(!p){box.className='of-price-preview';box.textContent='Elegí un producto para ver su precio final.';return;}
 try{
  const item=O.individual(p,$('ofPriceMode').value,$('ofIndividualValue').value,$('ofIndividualLabel').value),price=C.unitPrice({...p,promoPrice:item.promoPrice},1),savingAmount=O.round(p.price-price);
  box.className='of-price-preview';box.innerHTML=`<div><small>${item.promoPrice?'El cliente pagará por unidad':'Precio normal al quitar la oferta'}</small><strong>${C.money(price)}</strong>${item.promoPrice?`<s>${C.money(p.price)}</s>`:''}</div><span class="of-saving">${savingAmount?'Ahorra '+C.money(savingAmount):'Sin descuento'}</span>`;
 }catch(error){box.className='of-price-preview is-invalid';box.textContent=error.message;$('ofIndividualSave').disabled=true;}
}
function renderPreview(){
 $('ofPreview').hidden=!plan;
 if(!plan)return;
 const count=plan.changes.length;
 $('ofPreviewTitle').textContent=plan.percent?'Vista previa · '+plan.percent+'% de descuento':'Vista previa · Quitar oferta general';
 $('ofPreviewHelp').textContent=count+' producto'+(count===1?' cambiará':'s cambiarán')+'. '+(plan.skipped.length?plan.skipped.length+' precio'+(plan.skipped.length===1?' individual se conserva. ':'s individuales se conservan. '):'')+'Revisá los precios de la lista y confirmá para publicarlos.';
 $('ofConfirm').disabled=saving||!count;$('ofConfirm').textContent=plan.percent?'Activar oferta general':'Confirmar y quitar oferta general';
}
function renderTable(){
 const all=products(),changes=new Map((plan?.changes||[]).map(item=>[item.id,item])),query=$('ofSearch').value,filter=$('ofFilter').value;
 const list=all.filter(p=>C.matchesSearch(C.productSearchText(p),query)&&(filter==='offers'?O.active(p):filter==='general'?O.general(p):filter==='individual'?O.active(p)&&!O.general(p):true));
 $('ofActiveCount').textContent=all.filter(O.active).length;$('ofGeneralCount').textContent=all.filter(O.general).length;$('ofIndividualCount').textContent=all.filter(p=>O.active(p)&&!O.general(p)).length;
 $('ofResultCount').textContent=list.length+' producto'+(list.length===1?'':'s')+(plan?' · Los importes marcados como vista previa todavía no están publicados.':'.');
 $('ofRows').innerHTML=list.map(p=>{
  const item=changes.get(p.id),view=item?{...p,promoPrice:item.promoPrice,promoText:item.promoText}:p,offer=O.active(view),price=C.unitPrice(view,1),kind=O.general(view),savingAmount=O.round(p.price-price);
  const badge=kind?'General · '+kind.label+' · '+kind.percent+'%':'Individual · '+(view.promoText||'Oferta');
  return `<tr><td><strong>${esc(p.name)}</strong><small>${esc(p.code||'Sin código')} · ${esc(p.category)}${p.active===false?' · Oculto':''}</small>${item?'<span class="of-tag preview">Vista previa</span>':offer?`<span class="of-tag ${kind?'general':''}">${esc(badge)}</span>`:''}</td><td data-label="Precio normal" class="of-normal">${C.money(p.price)}</td><td data-label="Precio final"><span class="of-final">${C.money(price)}</span></td><td data-label="Ahorro">${savingAmount>0?C.money(savingAmount):'—'}</td><td><div class="of-row-actions"><button class="btn outline small" type="button" data-of-edit="${esc(p.id)}" ${saving?'disabled':''}>${O.active(p)?'Cambiar':'Poner oferta'}</button>${O.active(p)?`<button class="btn outline small of-danger" type="button" data-of-remove="${esc(p.id)}" ${saving?'disabled':''}>Quitar</button>`:''}</div></td></tr>`;
 }).join('')||'<tr><td colspan="5" class="of-empty">No hay productos con este filtro.</td></tr>';
}
function render(){productOptions();renderPreview();renderTable();}
function edit(id){
 selected=id;$('ofProductSearch').value='';setMode('individual');productOptions();const p=current();if(!p)return;
 $('ofPriceMode').value='price';$('ofIndividualValue').value=O.active(p)?p.promoPrice:'';$('ofIndividualLabel').value=String(p.promoText||'').startsWith('Solo hoy')?'Solo hoy':'Oferta';individualPreview();
 $('ofIndividualForm').scrollIntoView({block:'start',behavior:'instant'});$('ofIndividualValue').focus({preventScroll:true});
}
function lock(value){
 saving=value;for(const el of $('mgViewOffers').querySelectorAll('input,select,button'))el.disabled=value;
 $('mgViewOffers').setAttribute('aria-busy',String(value));
 if(!value){individualPreview();renderPreview();renderTable();}
}
async function privateProducts(){const data=await A.request('adminCatalog');if(!Array.isArray(data.products)||data.source&&data.source!=='privado')throw Error('No se pudo leer el inventario privado. Sincronizá antes de cambiar ofertas.');return data.products;}
async function publish(changes){
 if(saving)return;
 if(!changes.length){status('Los productos ya tienen esos precios.');return;}
 lock(true);let confirmed=0,attempted=false,failed='';
 try{
  status('Comprobando precios y guardando ofertas en la tienda…');
  const fresh=await privateProducts(),map=new Map(fresh.map(p=>[String(p.id),p]));
  changes.forEach(item=>O.check(map.get(item.id),item));
  if(A.features().offers===true){
   attempted=true;const result=await A.request('saveOffers',{changes});
   if(!Array.isArray(result.updated)||result.updated.length!==changes.length||changes.some(item=>!result.updated.some(p=>p.id===item.id&&O.same(p,item))))throw Error('Google no confirmó todas las ofertas. Sincronizá y revisá la lista.');
   confirmed=result.updated.length;
  }else{
   // La conexión actual ya guarda promociones; no requiere abrir ni reinstalar Sheets.
   for(const item of changes){
    status('Guardando '+(confirmed+1)+' de '+changes.length+'… Mantené esta página abierta hasta terminar.');attempted=true;
    try{const result=await A.request('saveProduct',{product:O.payload(map.get(item.id),item)});if(String(result.id)!==item.id)throw Error('Google no confirmó el producto.');}
    catch(error){
     // Una respuesta perdida no implica que la escritura haya fallado.
     const actual=await privateProducts().catch(()=>[]),saved=actual.find(p=>String(p.id)===item.id);
     if(!saved||!O.same(saved,item))throw error;
    }
    confirmed++;
   }
  }
 }catch(error){failed=error.message;}
 finally{
  if(attempted){
   A.notify();const synced=await A.reload();
   if(synced){
    confirmed=changes.filter(item=>A.products().some(p=>p.id===item.id&&p.price===item.basePrice&&O.same(p,item))).length;
    if(confirmed===changes.length)failed='';
    else if(!failed)failed='No se confirmaron todos los precios guardados. Sincronizá y revisá las ofertas.';
   }else if(!failed)failed='Guardado en Google, pero no se pudo actualizar la lectura. Sincronizá para comprobar los precios.';
  }
  plan=null;lock(false);render();
  if(failed)status((confirmed?confirmed+' de '+changes.length+' productos confirmados. ':'')+failed+' Podés volver a revisar y guardar los que falten.',true);
  else{status('✓ '+confirmed+' producto'+(confirmed===1?' actualizado.':'s actualizados.')+' Las ofertas quedan guardadas hasta que las quites.');A.toast('Ofertas actualizadas en la tienda.');}
 }
}
$('ofGlobalForm').onsubmit=event=>{event.preventDefault();if(saving)return;try{plan=O.globalPlan(products(),$('ofPercent').value,$('ofGlobalLabel').value,$('ofReplaceIndividual').checked);renderPreview();renderTable();status(plan.changes.length?'La vista previa está lista. Todavía no se han cambiado los precios.':'No hay cambios pendientes con ese porcentaje.');}catch(error){status(error.message,true);}};
$('ofClearGeneral').onclick=()=>{if(saving)return;plan=O.clearGeneral(products());renderPreview();renderTable();status(plan.changes.length?'Revisá la lista y confirmá para devolver estos productos a su precio normal.':'No hay ofertas generales activas.');};
$('ofConfirm').onclick=()=>{if(plan)publish(plan.changes);};$('ofCancelPreview').onclick=()=>{plan=null;renderPreview();renderTable();status('Vista previa cerrada.');};
$('ofGlobalForm').addEventListener('input',()=>{if(plan){plan=null;renderPreview();renderTable();}});
$('ofIndividualForm').onsubmit=event=>{event.preventDefault();try{const item=O.individual(current(),$('ofPriceMode').value,$('ofIndividualValue').value,$('ofIndividualLabel').value);publish(O.same(current(),item)?[]:[item]);}catch(error){status(error.message,true);}};
$('ofIndividualForm').addEventListener('input',event=>{if(event.target.id==='ofProductSearch')productOptions();else individualPreview();});
$('ofProduct').onchange=()=>{selected=$('ofProduct').value;const p=current();$('ofPriceMode').value='price';$('ofIndividualValue').value=O.active(p||{})?p.promoPrice:'';$('ofIndividualLabel').value=String(p?.promoText||'').startsWith('Solo hoy')?'Solo hoy':'Oferta';individualPreview();};
$('ofPriceMode').onchange=()=>{$('ofIndividualValue').value='';individualPreview();};
$('ofIndividualRemove').onclick=()=>{const p=current();if(p)publish([O.clear(p)]);};
$('ofRows').onclick=event=>{const button=event.target.closest('button');if(!button||saving)return;if(button.dataset.ofEdit)edit(button.dataset.ofEdit);if(button.dataset.ofRemove){const p=products().find(p=>p.id===button.dataset.ofRemove);if(p)publish([O.clear(p)]);}};
for(const button of document.querySelectorAll('[data-of-mode]'))button.onclick=()=>{if(!saving)setMode(button.dataset.ofMode);};
$('ofSearch').oninput=renderTable;$('ofFilter').onchange=renderTable;
$('ofReload').onclick=async()=>{if(saving)return;plan=null;lock(true);status('Sincronizando ofertas…');const ok=await A.reload();lock(false);render();status(ok?'✓ Precios y ofertas actualizados.':'No se pudo confirmar la lectura actual. Reintentá la sincronización.',!ok);};
document.addEventListener('gc:catalog',()=>{const key=JSON.stringify(A.products());if(key===catalogKey)return;catalogKey=key;if(!saving)plan=null;render();});
document.addEventListener('gc:management-view',event=>{if(event.detail.view==='offers')render();});
window.addEventListener('beforeunload',event=>{if(saving){event.preventDefault();event.returnValue='';}});
render();
})();
