/* Ventas, entradas y comparación de duplicados. Todo guardado pasa por el PIN de ADMIN. */
(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,M=window.GC_MANAGEMENT,I=window.GC_INVENTORY,$=id=>document.getElementById(id);
if(!A||!I||!$('ivForm'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),catalog=()=>A.products(),ready=()=>A.features().inventoryMovements===true;
const names={sale:'Sales',receipt:'Receipts'},drafts={},lists={sale:{page:1,pages:1,ticket:0},receipt:{page:1,pages:1,ticket:0}},dismissed=new Set();
// Solo identificadores opacos para comprobar una respuesta perdida tras recargar.
let pendingIds={};try{const saved=JSON.parse(sessionStorage.getItem('gc_pending_movements')||'{}');for(const kind of ['sale','receipt'])if(/^[a-z0-9-]{8,80}$/i.test(saved[kind]||''))pendingIds[kind]=saved[kind];}catch{}
function pending(kind,id){if(id)pendingIds[kind]=id;else delete pendingIds[kind];try{sessionStorage.setItem('gc_pending_movements',JSON.stringify(pendingIds));}catch{}}
let view='',draft=null,busy=false,trigger=null;
const field=name=>$('ivForm').elements.namedItem(name);
const date=value=>new Date(value).toLocaleString('es-HN',{dateStyle:'medium',timeStyle:'short'});
const image=p=>{const url=M.photos(p)[0]||'';return /^https:\/\//i.test(url)||/^assets\/products\/[\w.-]+$/.test(url)?url:'assets/img/sin-foto.svg';};
function setup(){for(const [kind,name] of Object.entries(names)){$('ivSetup'+name).hidden=ready();$('ivNew'+name).disabled=!ready();$('ivNew'+name).textContent=pendingIds[kind]?'Comprobar confirmación pendiente':'+ Registrar '+(kind==='sale'?'venta':'entrada');}}
function options(selected){return '<option value="">Elegí un producto</option>'+catalog().filter(p=>(draft.kind==='receipt'||p.active||p.id===selected)&&(p.id===selected||C.matchesSearch(C.productSearchText(p),draft.search||''))).slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)} · ${p.stock} disponibles${p.active?'':' · Oculto'}</option>`).join('');}
function input(label,name,value='',attrs=''){return `<label>${label}<input class="field" name="${name}" value="${esc(value)}" ${attrs}></label>`;}
function readItems(){return [...$('ivLines').querySelectorAll('[data-iv-line]')].map(row=>({productId:row.querySelector('[data-iv-product]').value,qty:Number(row.querySelector('[data-iv-qty]').value),amount:Number(row.querySelector('[data-iv-amount]').value),updateCost:!!row.querySelector('[data-iv-cost]')?.checked,manual:row.dataset.manual==='true'}));}
function renderLines(){
 const sale=draft.kind==='sale';
 $('ivLines').innerHTML=draft.items.map((item,index)=>`<div class="iv-line" data-iv-line="${index}" data-manual="${!!item.manual}"><label>Producto<select class="field" data-iv-product required aria-label="Producto ${index+1}">${options(item.productId)}</select></label><label>Cantidad<input class="field" type="number" min="1" max="100000" step="1" data-iv-qty value="${item.qty}" required aria-label="Unidades ${index+1}"></label><label>${sale?'Precio de venta':'Costo de compra'} unitario (L)<input class="field" type="number" min="0" max="100000000" step="0.01" data-iv-amount value="${item.amount}" required aria-label="Importe ${index+1}"></label><button class="icon" type="button" data-iv-remove="${index}" aria-label="Quitar producto ${index+1}">×</button>${sale?'':`<label class="iv-inline iv-cost-choice"><input type="checkbox" data-iv-cost ${item.updateCost?'checked':''}>Actualizar el costo del inventario con este valor</label>`}</div>`).join('');
 preview();
}
function preview(){
 if(!draft||draft.kind==='duplicate')return;
 const lines=readItems(),sale=draft.kind==='sale',seen=new Set();let valid=!!lines.length;
 $('ivStockPreview').innerHTML=lines.map(line=>{
  const p=catalog().find(p=>p.id===line.productId);if(!p){valid=false;return '';}
  const next=I.stockPreview(p.stock,line.qty,draft.kind),repeated=seen.has(p.id);seen.add(p.id);valid=valid&&next.valid&&!repeated;
  return `<div class="iv-stock-item ${!next.valid||repeated?'is-invalid':''}"><strong>${esc(p.name)}</strong><span>${p.stock} → <b>${next.after}</b> unidades${repeated?' · Repetido':!next.valid?' · Revisá la cantidad':''}</span>${!sale?`<small>Costo en inventario: ${C.money(p.cost)} → ${C.money(line.updateCost?line.amount:p.cost)}</small>`:''}</div>`;
 }).join('')||'<p class="mg-hint">Elegí los productos para ver cómo quedará el stock.</p>';
 if(sale){
  const q=M.orderQuote(lines.map(line=>({...line,unitPrice:line.amount,codAllowed:catalog().find(p=>p.id===line.productId)?.codAllowed})),field('payment').value,{...A.settings(),shipping:Number(field('shipping').value)}),paid=Number(field('paid').value)||0;
  $('ivTotals').innerHTML=[['Productos',q.subtotal],['Envío',q.shipping],['Comisión',q.fee],['Total',q.total],['Recibido',paid],['Saldo pendiente',q.total-paid]].map(([label,value])=>`<span>${label}<strong>${C.money(value)}</strong></span>`).join('')+(field('payment').value==='cod'&&!q.codAllowed?`<p>${esc(q.reasons.join(' '))}</p>`:'');
  if($('ivPaidDeposit'))$('ivPaidDeposit').hidden=field('payment').value!=='cod';
  valid=valid&&paid<=q.total&&(field('payment').value!=='cod'||q.codAllowed);
 }else{$('ivTotals').innerHTML='<span>Costo de esta entrada<strong>'+C.money(lines.reduce((sum,line)=>sum+line.amount*line.qty,0))+'</strong></span>';}
 $('ivSave').disabled=busy||(!draft.frozen&&!valid);
}
async function show(kind){
 if(!ready())return;
 if(pendingIds[kind]&&!drafts[kind]){const button=$('ivNew'+names[kind]);button.disabled=true;try{const result=await A.request('inventoryMovementStatus',{id:pendingIds[kind]});if(result.found&&result.record?.status==='completed'){pending(kind);A.notify();await A.reload();load(kind,1);A.toast('Google confirmó el movimiento anterior. El stock ya está actualizado.');return;}if(result.found)throw Error('El movimiento anterior sigue pendiente. Comprobalo en la lista antes de registrar otro.');pending(kind);}catch(error){A.toast(error.message);return;}finally{setup();}}
 trigger=document.activeElement;draft=drafts[kind]||(drafts[kind]={id:uid(),kind,items:[{productId:'',qty:1,amount:0,updateCost:true,manual:false}],values:{},frozen:false});
 const sale=kind==='sale',v=draft.values;
 $('ivTitle').textContent=sale?'Registrar venta':'Registrar entrada de mercancía';$('ivHint').textContent=sale?'Revisá cantidades y total. Al confirmar se descuentan las unidades.':'Las unidades recibidas se suman al guardar. El precio de venta se conserva.';
 let html='<div class="mg-form-grid"><label class="mg-full admin-picker-label">Encontrar artículo<input class="field" id="ivProductSearch" type="search" maxlength="180" placeholder="Nombre, marca, modelo o código…" value="'+esc(draft.search||'')+'"></label>';
 if(sale)html+=input('Cliente (opcional)','customer',v.customer||'','maxlength="120" placeholder="Venta de mostrador"')+input('Celular (opcional)','phone',v.phone||'','type="tel" maxlength="25"');
 else html+=input('Proveedor (opcional)','supplier',v.supplier||'','maxlength="160"');
 html+=input(sale?'Referencia / número de pedido (opcional)':'Factura / referencia (opcional)','reference',v.reference||'','maxlength="160"')+'<section class="mg-full"><h3>Artículos</h3><div id="ivLines"></div><div class="mg-actions"><button class="btn outline small" id="ivAdd" type="button">+ Agregar producto</button><button class="btn outline small" id="ivRefreshProducts" type="button">Sincronizar productos</button></div></section>';
 if(sale)html+='<label>Forma de pago<select class="field" name="payment"><option value="transfer">Efectivo / transferencia</option><option value="tigo">Tigo Money</option><option value="cod">Pagar al recibir</option></select></label>'+input('Envío acordado (L)','shipping',v.shipping??0,'type="number" min="0" max="100000000" step="0.01" required')+input('Dinero recibido (L)','paid',v.paid??0,'type="number" min="0" max="100000000" step="0.01" required')+'<div class="iv-paid-actions"><button class="btn outline small" type="button" id="ivPaidFull">Recibí el total</button><button class="btn outline small" type="button" id="ivPaidDeposit" hidden>Recibí el anticipo sugerido</button></div><p class="mg-hint">Para venta local, dejá el envío en cero. Para un envío, escribí el importe acordado; la tarifa de la tienda es '+C.money(A.settings().shipping??110)+'.</p>';
 html+='<label class="mg-full">Notas privadas (opcional)<textarea class="field" name="notes" maxlength="1200" rows="2">'+esc(v.notes||'')+'</textarea></label><section class="mg-full"><h3>Así quedará tu inventario</h3><div id="ivStockPreview" class="iv-stock-preview" aria-live="polite"></div><div id="ivTotals" class="mg-order-summary" role="status"></div><label class="iv-inline iv-confirm"><input name="confirmed" type="checkbox" required>Revisé los artículos y las cantidades; quiero '+(sale?'registrar esta venta y descontar las unidades.':'sumar estas unidades al inventario.')+'</label></section></div>';
 $('toast').style.display='none';$('ivFields').innerHTML=html;if(sale)field('payment').value=v.payment||'transfer';$('ivMessage').textContent=draft.frozen?'Hay una confirmación pendiente. Comprobá el guardado o reintentá sin cambiar los datos.':'';
 $('ivSave').textContent=draft.frozen?'Reintentar confirmación':sale?'Confirmar venta y descontar':'Confirmar entrada';$('ivCheck').hidden=!draft.frozen;$('ivOverlay').hidden=false;document.body.style.overflow='hidden';renderLines();lockFields(draft.frozen);$('ivTitle').setAttribute('tabindex','-1');$('ivTitle').focus();
}
function remember(){if(!draft||draft.kind==='duplicate'||draft.frozen)return;draft.items=readItems();draft.values=Object.fromEntries(new FormData($('ivForm')));}
function close(){if(busy)return;remember();$('ivOverlay').hidden=true;document.body.style.overflow='';draft=null;trigger?.focus();setup();}
function lockFields(locked){$('ivFields').querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=locked);$('ivCheck').hidden=!locked;}
function payload(){const sale=draft.kind==='sale';return {id:draft.id,kind:draft.kind,...draft.values,items:draft.items.map(item=>{const p=catalog().find(p=>p.id===item.productId);return {productId:item.productId,qty:item.qty,expectedStock:p?.stock,expectedRevision:p?.revision??'',...(sale?{unitPrice:item.amount}:{unitCost:item.amount,updateCost:item.updateCost})};})};}
async function completed(record){const kind=draft?.kind||record.kind;pending(kind);delete drafts[kind];if(draft)draft.frozen=false;busy=false;close();A.notify();const synced=await A.reload();A.toast((kind==='sale'?'Venta registrada y stock descontado.':'Entrada registrada y stock actualizado.')+(synced?'':' Tocá Sincronizar para comprobar el catálogo.'));load(kind,1);}
async function save(event){
 event.preventDefault();if(!draft||busy)return;if(draft.kind==='duplicate'){await resolveDuplicate();return;}
 if(!draft.frozen){remember();draft.payload=payload();draft.frozen=true;pending(draft.kind,draft.id);}
 busy=true;lockFields(true);$('ivSave').disabled=true;$('ivCheck').disabled=true;$('ivCancel').disabled=true;$('ivClose').disabled=true;$('ivMessage').textContent='Confirmando y actualizando el inventario…';
 try{const result=await A.request('inventoryMovementSave',{record:draft.payload});
  if(result.accepted&&result.record?.status==='completed'){await completed(result.record);return;}
  if(result.accepted===false&&!result.pending){pending(draft.kind);draft.frozen=false;lockFields(false);$('ivSave').textContent=draft.kind==='sale'?'Confirmar venta y descontar':'Confirmar entrada';$('ivMessage').textContent=result.error||'Revisá los datos antes de confirmar.';preview();}
  else throw Error(result.error||'Google no confirmó el guardado.');
 }catch(error){$('ivMessage').textContent=error.message+' Conservé esta confirmación. Usá Comprobar guardado antes de registrar otra.';$('ivSave').textContent='Reintentar confirmación';}
 finally{busy=false;$('ivSave').disabled=false;$('ivCheck').disabled=false;$('ivCancel').disabled=false;$('ivClose').disabled=false;setup();}
}
async function check(){
 if(!draft||busy)return;busy=true;$('ivCheck').disabled=true;$('ivSave').disabled=true;
 try{const result=await A.request('inventoryMovementStatus',{id:draft.id});if(result.found&&result.record?.status==='completed'){await completed(result.record);return;}if(!result.found){pending(draft.kind);draft.frozen=false;lockFields(false);$('ivSave').textContent=draft.kind==='sale'?'Confirmar venta y descontar':'Confirmar entrada';$('ivMessage').textContent='Google confirmó que todavía no se guardó. Podés revisar los datos y confirmar.';preview();}else $('ivMessage').textContent='La confirmación sigue pendiente. Reintentá con este mismo formulario.';}
 catch(error){$('ivMessage').textContent=error.message;}
 finally{busy=false;$('ivCheck').disabled=false;$('ivSave').disabled=false;}
}
async function load(kind,page=1){
 const name=names[kind],state=lists[kind],ticket=++state.ticket;setup();if(!ready()){$('ivMessage'+name).textContent='Google todavía no habilitó esta sección.';return;}
 $('ivMessage'+name).textContent='Consultando '+(kind==='sale'?'ventas':'entradas')+'…';
 try{const result=await A.request('inventoryMovementList',{kind,page,query:$('ivQuery'+name).value});if(ticket!==state.ticket)return;if(!Array.isArray(result.records))throw Error('Google no devolvió los movimientos.');state.page=result.page;state.pages=result.pages;
  $('ivList'+name).innerHTML=result.records.map(record=>`<article class="mg-record"><div class="mg-record-head"><div><h3>${esc(kind==='sale'?record.customer:record.supplier||'Entrada de mercancía')}</h3><small>${esc(date(record.createdAt))}${record.reference?' · '+esc(record.reference):''}</small></div><span class="mg-badge ${record.status==='completed'?'success':'warning'}">${record.status==='completed'?'Confirmado':'Por completar'}</span></div><div class="mg-record-lines">${record.items.map(item=>`${item.qty} × ${esc(item.name)}<small>Stock ${item.beforeStock} → ${item.afterStock}${kind==='receipt'?' · Costo de compra '+C.money(item.unitCost):' · '+C.money(item.unitPrice)+' c/u'}</small>`).join('<br>')}</div><div class="mg-record-totals"><span>${kind==='sale'?'Total de venta':'Costo de compra'}<strong>${C.money(record.total)}</strong></span>${kind==='sale'?`<span>Recibido<strong>${C.money(record.paid)}</strong></span><span>Saldo<strong>${C.money(record.balance)}</strong></span>`:''}</div>${record.status!=='completed'?`<button class="btn outline small" type="button" data-iv-resume="${esc(record.id)}" data-kind="${kind}">Comprobar y completar</button>`:''}</article>`).join('')||'<div class="mg-empty"><strong>Sin movimientos en esta vista</strong>Registrá '+(kind==='sale'?'tu primera venta':'la mercancía que recibiste')+' con el botón de arriba.</div>';
  $('ivMessage'+name).textContent=result.total+' registro'+(result.total===1?'':'s')+' · Los datos se guardan en tu gestión privada.';$('ivPage'+name).textContent='Página '+state.page+' de '+state.pages;$('ivPrev'+name).disabled=state.page<=1;$('ivNext'+name).disabled=state.page>=state.pages;
 }catch(error){if(ticket===state.ticket)$('ivMessage'+name).textContent=error.message;}
}
function duplicates(){
 const query=$('ivDuplicateSearch').value,include=$('ivIncludeHidden').checked,pairs=I.duplicates(catalog()).filter(pair=>!dismissed.has(pair.key)&&(include||pair.a.active&&pair.b.active)&&C.matchesSearch([pair.a.name,pair.a.code,pair.b.name,pair.b.code].join(' '),query));
 $('ivDuplicateCount').textContent=pairs.length+' comparación'+(pairs.length===1?'':'es')+' pendiente'+(pairs.length===1?'':'s')+'. Son posibles coincidencias: revisá cada variante.';
 const card=(p,other)=>`<article class="iv-compare-product"><img src="${esc(image(p))}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/img/sin-foto.svg'"><div><h3>${esc(p.name)}</h3><p>${esc(p.code||'Sin código')} · ${esc(p.category)}</p><div class="mg-badges"><span class="mg-badge">${p.stock} unidades</span><span class="mg-badge">${C.money(C.unitPrice(p,1))}</span><span class="mg-badge ${p.active?'success':''}">${p.active?'Visible':'Oculto'}</span></div><p>${esc([p.details?.brand,p.details?.model,p.colors,p.details?.size].filter(Boolean).join(' · '))}</p><div class="mg-actions"><button class="btn outline small" type="button" data-iv-edit="${esc(p.id)}">Ver / editar ficha</button>${p.active&&other.active?`<button class="btn small" type="button" data-iv-keep="${esc(p.id)}" data-iv-hide="${esc(other.id)}" ${A.features().duplicateReview===true?'':'disabled'}>Conservar esta ficha</button>`:''}</div></div></article>`;
 $('ivDuplicateList').innerHTML=pairs.map(pair=>`<section class="iv-compare"><div class="iv-compare-heading"><span class="mg-badge warning">${esc(pair.reason)}</span><button class="btn outline small" type="button" data-iv-dismiss="${esc(pair.key)}">Mantener ambos</button></div><div class="iv-compare-grid">${card(pair.a,pair.b)}${card(pair.b,pair.a)}</div></section>`).join('')||'<div class="mg-empty"><strong>No hay coincidencias pendientes con este filtro</strong>Podés incluir fichas ocultas o volver a revisar todos los pares.</div>';
}
function openDuplicate(keepId,hideId){
 const keep=catalog().find(p=>p.id===keepId),hide=catalog().find(p=>p.id===hideId);if(!keep||!hide)return;trigger=document.activeElement;draft={kind:'duplicate',keep:{...keep},hide:{...hide}};
 $('toast').style.display='none';$('ivTitle').textContent='Revisar la copia que vas a ocultar';$('ivHint').textContent='Las fotos, precios y existencias de cada ficha se conservan.';
 $('ivFields').innerHTML=`<div class="iv-resolution"><p><strong>Conservar visible:</strong> ${esc(keep.name)} · ${esc(keep.code)} · ${keep.stock} unidades.</p><p><strong>Ocultar:</strong> ${esc(hide.name)} · ${esc(hide.code)} · ${hide.stock} unidades.</p><p class="notice">El stock de la copia queda en esa ficha; no se suma al otro producto. Si son unidades distintas, mantené ambas fichas o revisá primero las existencias.</p><label class="iv-inline iv-confirm"><input type="checkbox" name="confirmed" required>Revisé el modelo y el stock. Quiero ocultar esta copia.</label></div>`;
 $('ivSave').textContent='Ocultar la copia elegida';$('ivSave').disabled=false;$('ivCheck').hidden=true;$('ivMessage').textContent='';$('ivOverlay').hidden=false;document.body.style.overflow='hidden';$('ivCancel').focus();
}
async function resolveDuplicate(){
 busy=true;$('ivSave').disabled=true;
 try{await A.request('inventoryResolveDuplicate',{keepId:draft.keep.id,hideId:draft.hide.id,keep:{revision:draft.keep.revision??'',stock:draft.keep.stock},hide:{revision:draft.hide.revision??'',stock:draft.hide.stock}});busy=false;close();A.notify();await A.reload();duplicates();A.toast('Copia ocultada. Sus datos y existencias se conservaron.');}
 catch(error){$('ivMessage').textContent=error.message;}finally{busy=false;$('ivSave').disabled=false;}
}
document.addEventListener('gc:management-view',event=>{view=event.detail.view;setup();if(view==='sales')load('sale');if(view==='receipts')load('receipt');if(view==='duplicates')duplicates();});
document.addEventListener('gc:catalog',()=>{setup();if(view==='duplicates')duplicates();if(draft&&!draft.frozen&&draft.kind!=='duplicate')preview();});
for(const [kind,name] of Object.entries(names)){$('ivNew'+name).onclick=()=>show(kind);$('ivSearch'+name).onsubmit=event=>{event.preventDefault();load(kind,1);};$('ivPrev'+name).onclick=()=>load(kind,lists[kind].page-1);$('ivNext'+name).onclick=()=>load(kind,lists[kind].page+1);}
$('ivDuplicateSearch').oninput=duplicates;$('ivIncludeHidden').onchange=duplicates;$('ivResetDuplicates').onclick=()=>{dismissed.clear();duplicates();};
$('adminPanel').addEventListener('click',async event=>{
 const reload=event.target.closest('[data-iv-reload]');if(reload){await A.reload();load(reload.dataset.ivReload,1);}
 const edit=event.target.closest('[data-iv-edit]');if(edit)A.editProduct(edit.dataset.ivEdit);
 const dismiss=event.target.closest('[data-iv-dismiss]');if(dismiss){dismissed.add(dismiss.dataset.ivDismiss);duplicates();}
 const keep=event.target.closest('[data-iv-keep]');if(keep)openDuplicate(keep.dataset.ivKeep,keep.dataset.ivHide);
 const check=event.target.closest('[data-iv-check]');if(check){check.disabled=true;try{await A.refreshFeatures();setup();if(ready())load(view==='sales'?'sale':'receipt');else A.toast('Google todavía usa la versión anterior.');}catch(error){A.toast(error.message);}finally{check.disabled=false;}}
 const resume=event.target.closest('[data-iv-resume]');if(resume){resume.disabled=true;try{await A.request('inventoryMovementStatus',{id:resume.dataset.ivResume});await A.reload();load(resume.dataset.kind,1);}catch(error){A.toast(error.message);}finally{resume.disabled=false;}}
});
$('ivForm').onsubmit=save;$('ivCheck').onclick=check;$('ivCancel').onclick=close;$('ivClose').onclick=close;$('ivOverlay').onclick=event=>{if(event.target===$('ivOverlay'))close();};
$('ivForm').addEventListener('input',event=>{if(!draft||draft.kind==='duplicate'||draft.frozen)return;if(event.target.id==='ivProductSearch'){draft.search=event.target.value;$('ivLines').querySelectorAll('[data-iv-product]').forEach(select=>{const selected=select.value;select.innerHTML=options(selected);});return;}const row=event.target.closest('[data-iv-line]');if(row&&event.target.hasAttribute('data-iv-amount'))row.dataset.manual='true';if(row&&event.target.hasAttribute('data-iv-qty')&&draft.kind==='sale'&&row.dataset.manual!=='true'){const p=catalog().find(p=>p.id===row.querySelector('[data-iv-product]').value);if(p)row.querySelector('[data-iv-amount]').value=C.unitPrice(p,Number(event.target.value));}preview();});
$('ivForm').addEventListener('change',event=>{if(!draft||draft.kind==='duplicate'||draft.frozen)return;const row=event.target.closest('[data-iv-line]');if(row&&event.target.hasAttribute('data-iv-product')){const p=catalog().find(p=>p.id===event.target.value);row.querySelector('[data-iv-amount]').value=p?(draft.kind==='sale'?C.unitPrice(p,Number(row.querySelector('[data-iv-qty]').value)):p.cost||0):0;row.dataset.manual='false';}preview();});
$('ivForm').addEventListener('click',async event=>{
 if(!draft||draft.kind==='duplicate'||draft.frozen||busy)return;
 if(event.target.closest('#ivPaidFull')||event.target.closest('#ivPaidDeposit')){const q=M.orderQuote(readItems().map(line=>({...line,unitPrice:line.amount,codAllowed:catalog().find(p=>p.id===line.productId)?.codAllowed})),field('payment').value,{...A.settings(),shipping:Number(field('shipping').value)});field('paid').value=event.target.closest('#ivPaidFull')?q.total:q.deposit;preview();}
 if(event.target.closest('#ivAdd')){draft.items=readItems();if(draft.items.length>=20){A.toast('Máximo 20 artículos por movimiento.');return;}draft.items.push({productId:'',qty:1,amount:0,updateCost:true,manual:false});renderLines();}
 const remove=event.target.closest('[data-iv-remove]');if(remove){draft.items=readItems();draft.items.splice(Number(remove.dataset.ivRemove),1);renderLines();}
 if(event.target.closest('#ivRefreshProducts')){busy=true;event.target.disabled=true;remember();try{await A.reload();renderLines();$('ivMessage').textContent='Revisá las cantidades con el stock actualizado antes de confirmar.';}finally{busy=false;event.target.disabled=false;preview();}}
});
document.addEventListener('keydown',event=>{if($('ivOverlay').hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}if(event.key==='Enter'&&event.target.tagName!=='TEXTAREA'&&event.target.tagName!=='BUTTON'){event.preventDefault();event.stopImmediatePropagation();}if(event.key==='Tab'){const list=[...$('ivOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el=>el.getClientRects().length),first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},true);
setup();
})();
