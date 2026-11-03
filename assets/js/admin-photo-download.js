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
  wrap.innerHTML='<div><strong>Fotografías con marca de agua</strong><p>Descargá las fotos con marca de agua, ordenadas por artículo. Los originales no se modifican. Las fotos de Drive se descargan mediante copias locales cuando están sincronizadas; Apps Script se usa si hace falta.</p><a class="gc-photo-download-help" href="https://github.com/sdcomayagua/sdcomayagua/blob/main/docs/ACTIVAR_DESCARGAS_CON_MARCA.md" target="_blank" rel="noopener noreferrer">Cómo activar las descargas de Google Drive ↗</a></div><div class="gc-photo-download-actions"><button class="btn outline" id="gcDownloadAll" type="button">↓ Descargar todas las fotos</button><span id="gcPhotoDownloadStatus" role="status" aria-live="polite"></span></div>';
  launch.insertAdjacentElement('afterend',wrap);
  $('gcDownloadAll').addEventListener('click',()=>execute(async()=>{
    const list=products().filter(p=>D().sources(p).length);
    if(!list.length)throw Error('No hay imágenes registradas.');
    await D().all(list,A().settings(),(i,total,name)=>progress('Preparando '+i+' de '+total+' · '+name));
  }));
 }
 const rows=$('adminRows');
 function populate(){
  for(const row of rows.querySelectorAll('tr')){
   const edit=row.querySelector('[data-edit]');
   if(!edit||row.querySelector('[data-download-product]'))continue;
   const p=selected(edit.dataset.edit);
   if(!p||!D().sources(p).length)continue;
   const actions=row.querySelector('.admin-row-actions');
   if(!actions)continue;
   const button=document.createElement('button');
   button.type='button';button.className='btn small outline gc-download-product';
   button.dataset.downloadProduct=String(p.id);
   const count=D().sources(p).length;
   button.textContent=count===1?'↓ Descargar JPG':'↓ Descargar ZIP';
   button.title=count===1?'Guardar la única foto como JPG con marca de agua':'Guardar todas las fotos del artículo en un ZIP con marca de agua';
   button.setAttribute('aria-label',(count===1?'Descargar foto JPG de ':'Descargar fotos ZIP de ')+p.name);
   const del=actions.querySelector('[data-delete-product]');
   if(del)actions.insertBefore(button,del);else actions.appendChild(button);
  }
 }
 const observer=new MutationObserver(populate);
 observer.observe(rows,{childList:true});
 populate();
 document.addEventListener('gc:catalog',populate);
 rows.addEventListener('click',event=>{
  const button=event.target.closest('[data-download-product]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();
  execute(async()=>{
   const p=selected(button.dataset.downloadProduct);
   if(!p)throw Error('Producto no encontrado. Sincronizá el inventario.');
   await D().product(p,A().settings(),(i,total)=>progress('Preparando '+i+' de '+total+' fotos · '+p.name));
  },button);
 },true);
}
function rowMessage(button,message,error=false){
 if(!button)return;
 const actions=button.closest('.admin-row-actions');
 if(!actions)return;
 let note=actions.querySelector('.gc-photo-row-status');
 if(!note){
  note=document.createElement('p');
  note.className='gc-photo-row-status';
  note.setAttribute('role','status');note.setAttribute('aria-live','polite');
  actions.appendChild(note);
 }
 note.textContent=message;
 note.classList.toggle('is-error',error);
}
async function execute(task,button=null){
 if(busy)return;
 busy=true;
 const buttons=document.querySelectorAll('#gcDownloadAll,[data-download-product]');
 buttons.forEach(b=>b.disabled=true);
 progress('Generando fotografías con marca de agua…');
 rowMessage(button,'Preparando las fotos…');
 try{
  await task();
  progress('✓ Archivo preparado. Revisá tus descargas.');
  rowMessage(button,'✓ Archivo preparado con marca de agua.');
 }catch(error){
  const detail=String(error?.message||'Error al preparar fotografías.');
  progress('No se completó: '+detail);
  rowMessage(button,detail,true);
  // No mostrar un aviso flotante sobre los controles: el mensaje está junto al artículo.
 }finally{
  busy=false;
  buttons.forEach(b=>b.disabled=false);
 }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
