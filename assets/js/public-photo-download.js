/* Botón accesible de descarga protegida en la ficha de producto, también en celular. */
(function(){'use strict';
let currentId='',active=false;
const D=()=>window.GC_PHOTO_DOWNLOAD;
const detail=document.getElementById('detailContent');if(!detail)return;
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-detail],[data-requested-product]');
 if(trigger)currentId=String(trigger.dataset.detail||trigger.dataset.requestedProduct||'');
},true);
const params=new URLSearchParams(location.search);currentId=currentId||params.get('producto')||'';
function enhance(){
 if(!detail.querySelector('#detailPhoto')||detail.querySelector('#gcDownloadVisiblePhoto'))return;
 const actions=detail.querySelector('.detail-secondary-actions')||detail.querySelector('.detail-buttons');
 if(!actions)return;
 const button=document.createElement('button');button.id='gcDownloadVisiblePhoto';button.className='btn outline gc-download-photo';button.type='button';
 button.innerHTML='<span aria-hidden="true">↓</span><span>Descargar foto</span>';
 button.title='Descargar la foto visible con la marca de agua de Gamer Comayagua';
 actions.appendChild(button);
 const status=document.createElement('p');status.className='gc-photo-download-status';status.id='gcPublicPhotoStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 actions.insertAdjacentElement('afterend',status);
 button.addEventListener('click',async()=>{
  if(active||!D())return;
  const img=detail.querySelector('#detailPhoto'),name=detail.querySelector('#detailTitle')?.textContent||'Producto';
  if(!img||!img.src||/sin-foto\.svg/i.test(img.src)){status.textContent='Este artículo no tiene una foto disponible.';return;}
  const photoIndex=Array.from(detail.querySelectorAll('[data-photo-index]')).findIndex(e=>e.getAttribute('aria-pressed')==='true');
  const index=Math.max(0,photoIndex);
  button.disabled=true;active=true;status.textContent='Preparando foto con marca de agua…';
  try{
   await D().one({id:currentId,name,code:detail.querySelector('.detail-code span')?.textContent||'',image:img.src},img.src,index,window.GC_WATERMARK?.get());
   status.textContent='✓ Foto con marca de agua lista para guardar.';
  }catch(error){status.textContent=error.message;}
  finally{active=false;button.disabled=false;}
 });
}
const observer=new MutationObserver(enhance);observer.observe(detail,{childList:true});enhance();
})();
