/* Exportar imágenes promocionales desde la sección existente Publicaciones. */
(function(){'use strict';const A=window.GC_ADMIN,C=window.GC,P=window.GC_PROMO_IMAGE,$=id=>document.getElementById(id);
if(!A||!C||!P||!$('mgViewPublish'))return;
const area=document.createElement('section');area.className='mg-promo-image';
area.innerHTML='<div class="mg-promo-image-head"><div><h3>Imagen promocional con marca de agua</h3><p>Usa la fotografía local del producto. Descargá para WhatsApp, Facebook o historias. No publica ni modifica el inventario.</p></div></div>'+
 '<div class="mg-promo-image-actions"><button type="button" class="btn outline" id="mgPromoFeed">Descargar publicación 4:5 (PNG)</button><button type="button" class="btn outline" id="mgPromoStory">Descargar historia 9:16 (PNG)</button></div>'+
 '<p id="mgPromoStatus" class="mg-promo-status" role="status" aria-live="polite">Elegí un producto para crear la imagen.</p>';
$('mgViewPublish').append(area);
let manifest=null,busy=false;
async function photoManifest(){
 if(manifest)return manifest;
 const response=await fetch('data/catalogo-fotos.json',{cache:'no-store'});
 if(!response.ok)throw Error('No se pudo comprobar la copia local de la foto.');
 manifest=await response.json();return manifest;
}
async function exportImage(format){
 if(busy)return;const product=A.products().find(p=>p.id===$('mgPubProduct').value);
 if(!product||!product.active||product.deletedAt){$('mgPromoStatus').textContent='Seleccioná un producto activo antes de descargar.';return;}
 busy=true;for(const button of [$('mgPromoFeed'),$('mgPromoStory')])button.disabled=true;
 $('mgPromoStatus').textContent='Preparando imagen y verificando fotografía…';
 try{
  const photos=await photoManifest(),local=P.photoFor(product,photos);
  if(!local)throw Error('Este producto aún no tiene una copia local de la foto principal. Sincronizá las fotografías del catálogo antes de generar su PNG.');
  const image=await P.loadPhoto(local),canvas=document.createElement('canvas');
  P.render(canvas,product,image,{format,price:C.money(C.unitPrice(product,1))});
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo exportar el PNG.')),'image/png'));
  const link=document.createElement('a'),object=URL.createObjectURL(blob);
  link.href=object;link.download=P.filename(product,format);document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(object),30000);
  $('mgPromoStatus').textContent='PNG descargado con marca de agua. Revisá el texto y la disponibilidad antes de publicarlo.';
 }catch(error){$('mgPromoStatus').textContent=String(error.message||'No se pudo crear la imagen.');}
 finally{busy=false;for(const button of [$('mgPromoFeed'),$('mgPromoStory')])button.disabled=false;}
}
$('mgPromoFeed').addEventListener('click',()=>exportImage('feed'));
$('mgPromoStory').addEventListener('click',()=>exportImage('story'));
$('mgPubProduct').addEventListener('change',()=>{$('mgPromoStatus').textContent='Fotografía y precio se tomarán del artículo seleccionado.';});
})();
