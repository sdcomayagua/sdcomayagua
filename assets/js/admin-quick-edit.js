/* Editor rápido seguro para precio, promoción y stock. Solo se abre tras ingresar al Admin. */
(function(){'use strict';
const A=window.GC_ADMIN,M=window.GC_QUICK_EDIT_MODEL;if(!A||!M)return;
const $=id=>document.getElementById(id);
const overlay=document.createElement('div');overlay.className='overlay';overlay.id='gcQuickOverlay';overlay.hidden=true;
overlay.innerHTML='<section class="dialog gc-quick-dialog" role="dialog" aria-modal="true" aria-labelledby="gcQuickTitle">'+
 '<div class="dialog-head"><div><span class="eyebrow">Edición rápida · inventario</span><h2 id="gcQuickTitle">Actualizar producto</h2></div><button class="icon" type="button" id="gcQuickClose" aria-label="Cerrar">×</button></div>'+
 '<p class="gc-quick-product" id="gcQuickName"></p>'+
 '<form id="gcQuickForm" novalidate><div class="gc-quick-grid">'+
 '<label>Precio normal (L)<input class="field" name="price" type="number" step="0.01" min="0.01" required></label>'+
 '<label>Precio de promoción (L)<input class="field" name="promoPrice" type="number" step="0.01" min="0" placeholder="Sin promoción"></label>'+
 '<label>Existencias<input class="field" name="stock" type="number" step="1" min="0" required></label></div>'+
 '<p class="gc-quick-help">Se conservan fotos, descripciones, características y costos. Antes de guardar se comprueba la revisión del inventario para evitar sobrescribir cambios de otra sesión.</p>'+
 '<p class="gc-quick-note" id="gcQuickMessage" role="status" aria-live="polite"></p>'+
 '<div class="gc-quick-actions"><button class="btn outline" type="button" id="gcQuickCancel">Cancelar</button><button class="btn green" type="submit" id="gcQuickSave" disabled>Guardar cambios</button></div></form></section>';
document.body.appendChild(overlay);
let editing=null,trigger=null,saving=false;
const form=$('gcQuickForm'),controls=[...form.querySelectorAll('input')],button=$('gcQuickSave');
function values(){return {price:form.elements.namedItem('price').value,stock:form.elements.namedItem('stock').value,promoPrice:form.elements.namedItem('promoPrice').value};}
function sync(){
 if(!editing||saving)return;
 try{const next=M.validate(editing,values());button.disabled=!M.changed(editing,next);$('gcQuickMessage').textContent='';}
 catch(error){button.disabled=true;$('gcQuickMessage').textContent=error.message;}
}
function close(){
 if(saving)return;overlay.hidden=true;editing=null;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';if(trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;
}
function open(id,source){
 if($('adminPanel')?.classList.contains('hidden'))return;
 const p=A.products().find(item=>item.id===id&&!item.deletedAt);
 if(!p){A.toast('Sincronizá el inventario antes de editar este producto.');return;}
 editing=p;trigger=source;
 $('gcQuickName').textContent=[p.name,p.code].filter(Boolean).join(' · ');
 form.elements.namedItem('price').value=p.price;
 form.elements.namedItem('stock').value=p.stock;
 form.elements.namedItem('promoPrice').value=p.promoPrice>0?p.promoPrice:'';
 $('gcQuickMessage').textContent='';
 overlay.hidden=false;document.body.style.overflow='hidden';
 sync();form.elements.namedItem('price').focus({preventScroll:true});
}
async function submit(event){
 event.preventDefault();if(saving||!editing)return;
 let update;try{update=M.payload(editing,values());}catch(error){$('gcQuickMessage').textContent=error.message;return;}
 if(!M.changed(editing,update))return;
 saving=true;controls.forEach(control=>control.disabled=true);button.disabled=true;
 $('gcQuickCancel').disabled=true;$('gcQuickClose').disabled=true;
 $('gcQuickMessage').textContent='Guardando y comprobando en Google Sheets…';
 try{
  const saved=await A.request('saveProduct',{product:update});
  if(saved?.ok===false)throw Error(saved.error||'No se confirmó el guardado.');
  await A.reload();
  const verify=A.products().find(p=>p.id===editing.id);
  if(!verify||Number(verify.price)!==Number(update.price)||Number(verify.stock)!==Number(update.stock)||Number(verify.promoPrice||0)!==Number(update.promoPrice||0)){
   $('gcQuickMessage').textContent='No se pudo comprobar el guardado. Sincronizá antes de reintentar; no se enviarán cambios automáticamente.';return;
  }
  A.notify();editing=null;overlay.hidden=true;document.body.style.overflow='';A.toast('Precio, promoción y existencias guardados y comprobados.');
  if(trigger?.isConnected)trigger.focus({preventScroll:true});
 }catch(error){
  $('gcQuickMessage').textContent=String(error.message||'Error al guardar.')+' No vuelvas a guardar sin sincronizar la ficha.';
 }finally{
  saving=false;controls.forEach(control=>control.disabled=false);
  $('gcQuickCancel').disabled=false;$('gcQuickClose').disabled=false;
  button.disabled=true;
 }
}
document.addEventListener('click',event=>{
 const action=event.target.closest?.('[data-quick-edit]');if(action){event.preventDefault();open(action.dataset.quickEdit,action);}
});
controls.forEach(input=>input.addEventListener('input',sync));
form.addEventListener('submit',submit);
$('gcQuickClose').addEventListener('click',close);$('gcQuickCancel').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
overlay.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close();return;}
 if(e.key!=='Tab')return;
 const focusables=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>el.getClientRects().length);
 if(e.shiftKey&&document.activeElement===focusables[0]){e.preventDefault();focusables.at(-1).focus();}
 else if(!e.shiftKey&&document.activeElement===focusables.at(-1)){e.preventDefault();focusables[0].focus();}
});
})();
