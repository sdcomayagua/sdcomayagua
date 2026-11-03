/* Herramientas de descarga en el inventario administrativo. */
(function(){'use strict';
const $=id=>document.getElementById(id),D=()=>window.GC_PHOTO_DOWNLOAD,A=()=>window.GC_ADMIN;
let busy=false;
function products(){return A()?.products?.()||[];}
function selected(id){return products().find(p=>String(p.id)===String(id));}
function progress(message){let el=$('gcPhotoDownloadStatus');if(el)el.textContent=message;}
function init(){
 if(!$('adminRows')||!A()||!D())return;
 const filters=$('adminRows').closest('.box'),launch=filters?.querySelector('.bulk-launch');
 if(launch&&!$('gcPhotoDownloadTools')){
  const wrap=document.createElement('section');wrap.id='gcPhotoDownloadTools';wrap.className='gc-photo-download-tools';
  wrap.innerHTML='<div><strong>Fotografías con marca de agua</strong><p>Descargá las fotos con marca de agua, ordenadas por artículo. Los originales no se modifican. Para imágenes de Google Drive, la versión actual de Apps Script debe estar publicada.</p><a class="gc-photo-download-help" href="docs/ACTIVAR_DESCARGAS_CON_MARCA.md" target="_blank" rel="noopener noreferrer">Cómo activar las descargas de Google Drive ↗</a></div><div class="gc-photo-download-actions"><button class="btn outline" id="gcDownloadAll" type="button">↓ Descargar todas las fotos</button><span id="gcPhotoDownloadStatus" role="status" aria-live="polite"></span></div>';
  launch.insertAdjacentElement('afterend',wrap);
  $('gcDownloadAll').addEventListener('click',()=>execute(async()=>{
    const list=products().filter(p=>D().sources(p).length);
    if(!list.length)throw Error('No hay imágenes registradas.');
    await D().all(list,A().settings(),(i,total,name)=>progress('Preparando '+i+' de '+total+' · '+name));
  }));
 }
 const rows=$('adminRows'),observer=new MutationObserver(()=>{for(const row of rows.querySelectorAll('tr')){
  const edit=row.querySelector('[data-edit]');if(!edit||row.querySelector('[data-download-product]'))continue;
  const p=selected(edit.dataset.edit);if(!p||!D().sources(p).length)continue;
  const actions=row.querySelector('.admin-row-actions');if(!actions)continue;
  const button=document.createElement('button');button.type='button';button.className='btn small outline gc-download-product';button.dataset.downloadProduct=String(p.id);button.textContent='↓ Descargar por artículo';button.title='Descargar todas las fotos de este producto con marca de agua';
  actions.appendChild(button);
 }});
 observer.observe(rows,{childList:true}); // render reemplaza las filas completas.
 // Se ejecuta después de que se obtiene el catálogo; también cubre las filas iniciales.
 const populate=()=>{for(const row of rows.querySelectorAll('tr')){const edit=row.querySelector('[data-edit]');if(!edit||row.querySelector('[data-download-product]'))continue;const p=selected(edit.dataset.edit);if(!p||!D().sources(p).length)continue;const target=row.querySelector('.admin-row-actions');if(!target)continue;const button=document.createElement('button');button.type='button';button.className='btn small outline gc-download-product';button.dataset.downloadProduct=String(p.id);button.textContent='↓ Descargar por artículo';target.appendChild(button);}};
 // Compatibilidad con navegadores sin carga inmediata.
 populate();document.addEventListener('gc:catalog',populate);
 rows.addEventListener('click',event=>{
  const button=event.target.closest('[data-download-product]');if(!button)return;
  event.preventDefault();event.stopPropagation();
  execute(async()=>{const p=selected(button.dataset.downloadProduct);if(!p)throw Error('Producto no encontrado. Sincronizá el inventario.');
   await D().product(p,A().settings(),(i,total)=>progress('Preparando '+i+' de '+total+' fotos · '+p.name));});
 },true);
}
async function execute(task){
 if(busy)return;
 busy=true;const buttons=document.querySelectorAll('#gcDownloadAll,[data-download-product]');buttons.forEach(b=>b.disabled=true);
 progress('Generando las fotografías protegidas…');
 try{await task();progress('✓ Descarga preparada. Revisá tus descargas.');}
 catch(error){progress('No se completó: '+error.message);A()?.toast?.('No se pudo descargar. Revisá el mensaje y la guía en Fotografías con marca de agua.');}
 finally{busy=false;buttons.forEach(b=>b.disabled=false);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
