(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,F=window.GC_FINANCE,$=id=>document.getElementById(id);if(!A||!F||!$('mgViewFinance'))return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records=[],loaded=false,revealed=false,busy=false,dirty=new Map(),selected=new Set();
const status=(text,error=false)=>{$('fnStatus').textContent=text;$('fnStatus').classList.toggle('is-error',error);};
const amount=value=>!revealed?'••••':value===null?'Falta costo':C.money(value);
function render(){
 const rows=records.map(p=>F.row({...p,inventoryType:dirty.get(p.id)||p.inventoryType})),summary=F.summary(rows),filter=$('fnFilter').value,query=$('fnSearch').value;
 $('fnReveal').textContent=revealed?'Ocultar importes':'Mostrar importes privados';$('fnReveal').setAttribute('aria-pressed',String(revealed));
 $('fnSummary').innerHTML=[['Inversión confirmada',amount(summary.invested),'Solo productos comprados en tienda'],['Compra pendiente',amount(summary.toBuy),'Productos que ofrecés por encargo'],['En tienda',summary.owned,summary.ownedUnits+' unidades compradas'],['Por encargo',summary.ordered,summary.orderedUnits+' unidades ofrecidas'],['Sin clasificar',summary.unclassified,'Pendientes de indicar su origen'],['Costos por completar',summary.missingCost,'Artículos clasificados con unidades y sin costo']].map(([label,value,hint])=>`<article><span>${label}</span><strong>${esc(value)}</strong><small>${esc(hint)}</small></article>`).join('');
 const list=rows.filter(p=>C.matchesSearch([p.name,p.code,p.category].join(' '),query)&&(!filter||p.inventoryType===filter));
 $('fnCount').textContent=list.length+' productos · '+dirty.size+' cambios sin guardar';
 $('fnRows').innerHTML=list.map(p=>`<tr><td><label class="fn-pick"><input type="checkbox" data-fn-select="${esc(p.id)}" aria-label="Seleccionar ${esc(p.name)}" ${selected.has(p.id)?'checked':''} ${busy?'disabled':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.code)} · ${p.stock} unidades${p.active?'':' · Oculto en la tienda'}</small></span></label></td><td data-label="Inventario"><select class="field" data-fn-type="${esc(p.id)}" aria-label="Clasificación de ${esc(p.name)}" ${busy?'disabled':''}>${F.types.map(t=>`<option ${p.inventoryType===t?'selected':''}>${t}</option>`).join('')}</select>${dirty.has(p.id)?'<small class="fn-pending">Pendiente de guardar</small>':''}</td><td data-label="Costo unitario">${amount(p.cost)}</td><td data-label="Inversión">${amount(p.invested)}</td><td data-label="Compra pendiente">${amount(p.toBuy)}</td><td data-label="Utilidad potencial">${amount(p.potentialProfit)}</td><td><button class="btn outline small" type="button" data-fn-cost="${esc(p.id)}" ${busy?'disabled':''}>Editar costo / ficha</button></td></tr>`).join('')||'<tr><td colspan="7">No hay productos con este filtro.</td></tr>';
 $('fnSave').disabled=busy||!dirty.size;$('fnDiscard').disabled=busy||!dirty.size;$('fnApply').disabled=busy||!selected.size;$('fnSelectAll').disabled=busy||!list.length;$('fnSelection').textContent=selected.size+' seleccionados';$('fnSelectAll').checked=!!list.length&&list.every(p=>selected.has(p.id));
 $('fnBulkType').disabled=busy;$('fnReload').disabled=busy;$('fnReveal').disabled=busy;$('fnNote').textContent=dirty.size?'La vista previa incluye tus cambios. Guardá para actualizar la hoja privada.':(summary.unclassified||summary.missingCost?'Totales parciales: '+summary.unclassified+' productos sin clasificar y '+summary.missingCost+' costos pendientes. ':'')+'La inversión cuenta solo productos en tienda. Los importes son estimaciones del stock actual; excluyen envío, comisiones y descuentos por cantidad. No son ventas realizadas.';
}
async function load(){
 if(busy)return;if(dirty.size){status('Guardá o descartá los cambios pendientes antes de sincronizar.',true);return;}
 busy=true;render();status('Consultando tus finanzas privadas…');
 try{const result=await A.request('financeCatalog');if(result.source!=='privado'||!Array.isArray(result.products))throw Error('Google no confirmó una lectura privada.');records=result.products;loaded=true;selected.clear();status('✓ Finanzas actualizadas. La clasificación no se muestra a los clientes.');}
 catch(error){status(error.message,true);}finally{busy=false;render();}
}
function change(id,type){const p=records.find(p=>p.id===id);if(!p)return;if(F.type(p.inventoryType)===type)dirty.delete(id);else dirty.set(id,type);}
$('fnRows').addEventListener('change',event=>{if(busy)return;const el=event.target;if(el.dataset.fnType){change(el.dataset.fnType,el.value);render();}if(el.dataset.fnSelect){el.checked?selected.add(el.dataset.fnSelect):selected.delete(el.dataset.fnSelect);render();}});
$('fnRows').addEventListener('click',async event=>{const b=event.target.closest('[data-fn-cost]');if(!b||busy)return;b.disabled=true;const ok=await A.reload();if(!ok||!A.products().some(p=>p.id===b.dataset.fnCost)){status('No se pudo comprobar la ficha privada. Sincronizá antes de editar el costo.',true);b.disabled=false;return;}A.editProduct(b.dataset.fnCost);const field=$('productForm').elements.namedItem('cost');field.closest('details').open=true;field.focus({preventScroll:true});});
$('fnSelectAll').onchange=()=>{const filter=$('fnFilter').value,query=$('fnSearch').value;records.filter(p=>C.matchesSearch([p.name,p.code,p.category].join(' '),query)&&(!filter||(dirty.get(p.id)||F.type(p.inventoryType))===filter)).forEach(p=>$('fnSelectAll').checked?selected.add(p.id):selected.delete(p.id));render();};
$('fnApply').onclick=()=>{for(const id of selected)change(id,$('fnBulkType').value);render();status('Clasificación preparada. Guardá para confirmarla.');};
$('fnDiscard').onclick=()=>{dirty.clear();render();status('Cambios descartados.');};
$('fnReveal').onclick=()=>{revealed=!revealed;render();};$('fnSearch').oninput=render;$('fnFilter').onchange=render;$('fnReload').onclick=load;
$('fnSave').onclick=async()=>{
 if(busy||!dirty.size)return;const changes=[...dirty].map(([id,inventoryType])=>{const p=records.find(p=>p.id===id);return {id,inventoryType,expectedType:F.type(p.inventoryType),expectedRevision:p.financeRevision||''};});busy=true;render();status('Guardando la clasificación privada…');
 try{const result=await A.request('saveFinance',{changes});if(!Array.isArray(result.updated)||changes.some(c=>!result.updated.some(p=>p.id===c.id&&p.inventoryType===c.inventoryType)))throw Error('No se confirmaron todas las clasificaciones. Sincronizá antes de reintentar.');for(const p of result.updated){const record=records.find(r=>r.id===p.id);Object.assign(record,p);}dirty.clear();selected.clear();status('✓ Clasificación guardada. Los precios y las existencias no cambian.');A.toast('Finanzas privadas actualizadas.');}
 catch(error){status(error.message,true);}finally{busy=false;render();}
};
document.addEventListener('gc:management-view',event=>{revealed=false;if(event.detail.view==='finance'&&!loaded)load();else render();});
document.addEventListener('gc:catalog',()=>{if(!busy&&!dirty.size){loaded=false;if(!$('mgViewFinance').hidden&&!$('adminPanel').classList.contains('hidden'))load();}});
window.addEventListener('beforeunload',event=>{if(dirty.size||busy){event.preventDefault();event.returnValue='';}});
render();
})();
