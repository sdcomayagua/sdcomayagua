(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,$=id=>document.getElementById(id);if(!A)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=null,saving=false,trigger=null;
document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="productDeleteOverlay" hidden><section class="dialog product-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="productDeleteTitle" aria-describedby="productDeleteHelp"><div class="dialog-head"><h2 id="productDeleteTitle">Eliminar producto</h2><button type="button" class="icon" id="productDeleteClose" aria-label="Cerrar confirmación">×</button></div><div class="product-delete-summary" id="productDeleteSummary"></div><p id="productDeleteHelp">Se quitará del inventario y del catálogo público. Podés recuperarlo desde <strong>Papelera</strong>. Sus fotos y su historial se conservan.</p><p id="productDeleteError" class="warning" role="alert" hidden></p><div class="product-delete-actions"><button type="button" class="btn outline" id="productDeleteCancel">Cancelar</button><button type="button" class="btn red" id="productDeleteConfirm">Eliminar producto</button></div></section></div>`);
function close(){if(saving)return;$('productDeleteOverlay').hidden=true;selected=null;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';if(trigger?.isConnected)trigger.focus();}
function show(id,button){
 selected=A.products().find(p=>p.id===id);if(!selected||!A.features().productTrash)return;
 trigger=button;$('productDeleteSummary').innerHTML=`<strong>${esc(selected.name)}</strong><span>${esc(selected.category)} · ${esc(selected.code)}</span><small>${selected.stock} ${selected.stock===1?'unidad':'unidades'} · ${C.money(selected.price)}</small>`;
 $('productDeleteError').hidden=true;$('productDeleteConfirm').textContent='Eliminar producto';$('productDeleteOverlay').hidden=false;document.body.style.overflow='hidden';$('productDeleteCancel').focus();
}
async function change(product,operation,button){
 if(saving||!product)return;saving=true;button.disabled=true;
 if(operation==='delete'){$('productDeleteCancel').disabled=true;$('productDeleteClose').disabled=true;button.textContent='Eliminando…';}
 try{
  const result=await A.request(operation==='delete'?'deleteProduct':'restoreProduct',{id:product.id,expectedRevision:product.revision,...(operation==='delete'?{confirmed:true}:{})});
  A.applyProductState(product,result);A.notify();saving=false;close();A.toast(operation==='delete'?'Producto eliminado. Podés recuperarlo en Papelera.':'Producto restaurado.');await A.reload();
 }catch(error){
  if(operation==='delete'){$('productDeleteError').hidden=false;$('productDeleteError').textContent=error.message;}else A.toast(error.message);
 }finally{saving=false;button.disabled=false;$('productDeleteCancel').disabled=false;$('productDeleteClose').disabled=false;if(operation==='delete')button.textContent='Eliminar producto';}
}
$('adminRows').addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;if(button.dataset.deleteProduct)show(button.dataset.deleteProduct,button);if(button.dataset.restoreProduct)change(A.trash().find(p=>p.id===button.dataset.restoreProduct),'restore',button);});
$('productDeleteConfirm').onclick=()=>change(selected,'delete',$('productDeleteConfirm'));
$('productDeleteCancel').onclick=close;$('productDeleteClose').onclick=close;
$('productDeleteOverlay').onclick=event=>{if(event.target===$('productDeleteOverlay'))close();};
$('productDeleteOverlay').addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();close();}
 if(event.key==='Tab'){const controls=[...$('productDeleteOverlay').querySelectorAll('button:not(:disabled)')],first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
})();
