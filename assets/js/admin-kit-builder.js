/* Creador de kits integrado al Admin privado. */
(function(){'use strict';
const $=id=>document.getElementById(id),C=window.GC,M=window.GC_KIT_MODEL;
const escape=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let chosen=[],origin=null,busy=false;
function available(){try{return window.GC_ADMIN_KITS?.list()||[]}catch{return []}}
function item(id){return available().find(p=>String(p.id)===String(id))}
function selectedRows(){return chosen.map(x=>({...x,product:item(x.id)})).filter(x=>x.product)}
function message(value){$('gcKitMessage').textContent=value||''}
function money(value){return C.money(value)}
function display(){
 const rows=selectedRows();
 const host=$('gcKitSelected'),choices=$('gcKitChoices');
 host.innerHTML=rows.length?rows.map(x=>'<div class="gc-kit-selected-row" data-kit-selected="'+escape(x.id)+'"><div class="gc-kit-selected-title"><strong>'+escape(x.product.name)+'</strong><small>'+escape(x.product.code||x.product.category)+'</small></div><label>Unidades<input type="number" class="field" data-kit-qty="'+escape(x.id)+'" min="1" max="20" step="1" value="'+x.qty+'"></label><label>Precio por unidad (L)<input type="number" class="field" data-kit-price="'+escape(x.id)+'" min="0" max="1000000" step="0.01" value="'+x.price+'"></label><button class="btn outline small" type="button" data-kit-remove="'+escape(x.id)+'" aria-label="Quitar '+escape(x.product.name)+'">Quitar</button></div>').join(''):'<p class="muted">Elegí al menos dos productos en la lista para empezar.</p>';
 const q=$('gcKitSearch').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),selected=new Set(chosen.map(x=>x.id));
 choices.replaceChildren(...available().filter(p=>p.active&&!selected.has(p.id)&&[p.name,p.code,p.category].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q)).slice(0,80).map(p=>{
  const button=document.createElement('button');button.type='button';button.className='gc-kit-choice';button.dataset.kitAdd=p.id;
  const image=document.createElement('img');image.src=p.image||'assets/img/sin-foto.svg';image.alt='';image.loading='lazy';image.onerror=()=>image.src='assets/img/sin-foto.svg';
  const details=document.createElement('span');details.textContent=p.name+' · '+money(C.unitPrice(p,1))+(p.stock?' · '+p.stock+' disponibles':' · Agotado');
  button.append(image,details);return button;
 }));
 const total=rows.reduce((sum,r)=>sum+r.qty*r.price,0);
 $('gcKitSum').textContent=money(total);
 const stock=rows.length?Math.min(...rows.map(r=>Math.floor(r.product.stock/r.qty))):0;
 $('gcKitStock').textContent=stock+' kit'+(stock===1?'':'s')+' posibles según existencias actuales';
 const override=Number($('gcKitFinal').value),final=$('gcKitFinal').value===''?total:override;
 $('gcKitTotal').textContent=money(Number.isFinite(final)?final:0);
 $('gcKitSave').disabled=busy||rows.length<2||!Number.isFinite(final)||final<=0;
}
function open(){
 try{window.GC_ADMIN_KITS.list()}catch(error){message(error.message);return}
 origin=document.activeElement;chosen=[];busy=false;$('gcKitSearch').value='';$('gcKitName').value='';$('gcKitFinal').value='';$('gcKitCategory').value='KIT PERSONALIZADO';$('gcKitShipping').checked=false;$('gcKitCOD').checked=true;$('gcKitActive').checked=true;
 $('gcKitOverlay').hidden=false;document.body.style.overflow='hidden';message('');display();$('gcKitSearch').focus();
}
function close(){
 if(busy)return;$('gcKitOverlay').hidden=true;document.body.style.overflow='';origin?.focus?.();
}
function draft(){
 return {name:$('gcKitName').value.trim(),category:$('gcKitCategory').value.trim(),finalPrice:$('gcKitFinal').value,freeShipping:$('gcKitShipping').checked,codAllowed:$('gcKitCOD').checked,active:$('gcKitActive').checked,items:chosen.map(x=>({id:x.id,qty:x.qty,price:x.price}))};
}
async function publish(){
 if(busy)return;busy=true;$('gcKitSave').disabled=true;message('Verificando productos y guardando el kit en Google Sheets…');
 try{
  const result=await window.GC_ADMIN_KITS.publish(draft());
  message('✓ Kit creado y guardado en el inventario: '+(result.code||result.id)+'. Ya aparece como un solo producto.');
  chosen=[];display();
 }catch(error){message(error.message||'No se pudo guardar el kit.');}
 finally{busy=false;display();}
}
// Publicación segura: usa el mismo canal autenticado del panel de administración.
window.GC_ADMIN_KITS={
 list(){
  if(!window.GC_ADMIN||document.getElementById('adminPanel')?.classList.contains('hidden'))throw Error('Ingresá al Admin para armar kits.');
  return window.GC_ADMIN.products().filter(p=>p.active);
 },
 async publish(draft){
  if(!window.GC_ADMIN||document.getElementById('adminPanel')?.classList.contains('hidden'))throw Error('Tu sesión de Admin no está abierta.');
  const fresh=await window.GC_ADMIN.request('adminCatalog');
  if(!Array.isArray(fresh.products))throw Error('No se pudo confirmar el inventario en Google Sheets.');
  const list=fresh.products.map(window.GC.cleanProduct),assembled=M.assemble(list,draft);
  const {components,totalIndividual,finalPrice,...payload}=assembled;
  const saved=await window.GC_ADMIN.request('saveProduct',{product:payload});
  await window.GC_ADMIN.reload();
  return saved;
 }
};
document.addEventListener('DOMContentLoaded',()=>{
 if(!$('gcKitOpen'))return;
 $('gcKitOpen').onclick=open;
 $('gcKitClose').onclick=close;$('gcKitCancel').onclick=close;
 $('gcKitOverlay').onclick=e=>{if(e.target===$('gcKitOverlay'))close();};
 $('gcKitOverlay').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
 $('gcKitSearch').oninput=display;
 $('gcKitChoices').onclick=e=>{const b=e.target.closest('[data-kit-add]');if(!b||chosen.length>=12)return;const p=item(b.dataset.kitAdd);if(!p)return;chosen.push({id:p.id,price:C.unitPrice(p,1),qty:1});display();};
 $('gcKitSelected').onclick=e=>{const b=e.target.closest('[data-kit-remove]');if(!b)return;chosen=chosen.filter(x=>x.id!==b.dataset.kitRemove);display();};
 $('gcKitSelected').onchange=e=>{const price=e.target.closest('[data-kit-price]'),qty=e.target.closest('[data-kit-qty]');if(price){const x=chosen.find(x=>x.id===price.dataset.kitPrice);if(x)x.price=Number(price.value);}if(qty){const x=chosen.find(x=>x.id===qty.dataset.kitQty);if(x)x.qty=Math.max(1,Math.min(20,Math.floor(Number(qty.value)||1)));}display();};
 $('gcKitFinal').oninput=display;
 $('gcKitSave').onclick=publish;
 document.addEventListener('gc:admin-locked',()=>{$('gcKitOverlay').hidden=true;chosen=[];});
});
})();
