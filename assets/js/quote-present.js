/* Vista nativa de cotización: en iPhone se prepara primero el archivo y se comparte con otro toque. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
let active=null,blobUrl='',previousFocus=null,generation=0;
const escapeHtml=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 if($('gcQuoteOverlay'))return;
 const layer=document.createElement('div');layer.id='gcQuoteOverlay';layer.className='gc-q-overlay';layer.hidden=true;
 layer.innerHTML='<section class="gc-q-dialog" role="dialog" aria-modal="true" aria-labelledby="gcQuoteHeading"><header class="gc-q-head"><div><span class="gc-q-eyebrow">GAMER COMAYAGUA · COTIZACIÓN</span><h2 id="gcQuoteHeading">Compartir cotización</h2></div><button type="button" id="gcQuoteClose" aria-label="Cerrar cotización">×</button></header><div class="gc-q-main"><p id="gcQuoteStatus" role="status" aria-live="polite">Preparando…</p><div class="gc-q-photo"><img id="gcQuotePreview" alt="Cotización del producto para guardar en Fotos" hidden><div id="gcQuotePlaceholder" class="gc-q-placeholder"><span class="gc-q-spinner"></span><strong>Preparando tu imagen</strong><small>Incluye fotografía, precio y formas de pago.</small></div></div><div id="gcQuoteHelp" class="gc-q-help"><strong>¿Querés guardarla en Fotos?</strong><p>En iPhone, mantené presionada la imagen de arriba y elegí <b>Guardar en Fotos</b>. También podés abrirla en grande y mantenerla presionada.</p></div><a id="gcQuoteOriginal" target="_blank" rel="noopener" hidden>Ver imagen en pantalla completa</a></div><footer class="gc-q-actions"><button type="button" class="gc-q-primary" id="gcQuoteSend" disabled>Compartir foto · WhatsApp y más</button><div class="gc-q-secondary"><button type="button" id="gcQuoteSave" disabled>Descargar PNG</button><button type="button" id="gcQuoteCopy" disabled>Copiar enlace</button></div><small>La foto se comparte usando las aplicaciones disponibles en tu iPhone. No enviamos nada sin tu confirmación.</small></footer></section>';
 document.body.append(layer);
 $('gcQuoteClose').onclick=close;
 layer.addEventListener('click',event=>{if(event.target===layer)close();});
 layer.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
 $('gcQuoteSend').onclick=shareImage;
 $('gcQuoteSave').onclick=download;
 $('gcQuoteCopy').onclick=copyLink;
}
function revoke(){if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl='';active=null;}
function status(message,error=false){const el=$('gcQuoteStatus');el.textContent=message;el.classList.toggle('is-error',error);}
function close(){
 generation++;$('gcQuoteOverlay').hidden=true;
 $('gcQuotePreview').removeAttribute('src');$('gcQuotePreview').hidden=true;
 $('gcQuoteOriginal').hidden=true;$('gcQuoteOriginal').removeAttribute('href');
 revoke();document.body.classList.remove('gc-q-open');
 if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 previousFocus=null;
}
const fileName=p=>'Cotizacion-'+String(p.code||p.name||'producto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,64)+'.png';
async function open({product,source,settings={}}){
 init();generation++;const ticket=generation;
 revoke();previousFocus=document.activeElement;
 $('gcQuoteOverlay').hidden=false;document.body.classList.add('gc-q-open');
 $('gcQuoteHeading').textContent=product?.name||'Cotización de producto';
 $('gcQuotePreview').hidden=true;$('gcQuotePreview').removeAttribute('src');$('gcQuotePlaceholder').hidden=false;
 $('gcQuoteOriginal').hidden=true;$('gcQuoteSend').disabled=true;$('gcQuoteSave').disabled=true;$('gcQuoteCopy').disabled=true;
 status('Preparando una imagen de alta calidad…');$('gcQuoteClose').focus({preventScroll:true});
 try{
  if(!product?.id||!source)throw Error('Este producto todavía no tiene una fotografía disponible para cotizar.');
  if(!root.GC_PRODUCT_QUOTE?.render)throw Error('La herramienta de cotización no se cargó.');
  const canvas=await root.GC_PRODUCT_QUOTE.render(product,source,settings);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error('No se pudo crear el PNG.')),'image/png'));
  if(ticket!==generation)return;
  const filename=fileName(product),file=new File([blob],filename,{type:'image/png'});
  blobUrl=URL.createObjectURL(blob);active={file,blob,product};
  $('gcQuotePreview').src=blobUrl;$('gcQuotePreview').hidden=false;$('gcQuotePlaceholder').hidden=true;
  $('gcQuoteOriginal').href=blobUrl;$('gcQuoteOriginal').hidden=false;
  $('gcQuoteSend').disabled=false;$('gcQuoteSave').disabled=false;$('gcQuoteCopy').disabled=false;
  status('Lista para compartir o guardar en Fotos.');
 }catch(error){
  if(ticket!==generation)return;
  $('gcQuotePlaceholder').hidden=false;$('gcQuotePlaceholder').innerHTML='<strong>No se pudo generar una imagen con foto.</strong><small>Comprobá la fotografía principal del producto e intentá de nuevo.</small>';
  status(error.message||'No se pudo generar la cotización.',true);
 }
}
async function shareImage(){
 if(!active)return;
 const file=active.file;
 try{
  if(typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare({files:[file]}))){
   // iOS Safari puede descartar la imagen si se mezcla files con text/url.
   await navigator.share({files:[file]});
   return;
  }
  status('Tu navegador no permite compartir archivos. Mantené presionada la imagen para guardarla en Fotos y compartila desde allí.');
 }catch(error){
  if(error.name!=='AbortError')status('No se abrió el menú para compartir. Guardá la imagen en Fotos y enviála desde WhatsApp.',true);
 }
}
function download(){
 if(!active||!blobUrl)return;
 const a=document.createElement('a');a.href=blobUrl;a.download=active.file.name;a.rel='noopener';document.body.append(a);a.click();a.remove();
 status('Descarga solicitada. En iPhone, para tenerla en la galería mantené presionada la vista previa y elegí Guardar en Fotos.');
}
async function copyLink(){
 if(!active)return;
 const url=new URL('productos.html?producto='+encodeURIComponent(active.product.id),document.baseURI).href;
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
  else{const field=document.createElement('textarea');field.value=url;field.style.position='fixed';field.style.left='-9999px';document.body.append(field);field.select();if(!document.execCommand('copy'))throw Error('No se pudo copiar');field.remove();}
  status('Enlace del producto copiado. Podés pegarlo en WhatsApp o donde querás.');
 }catch{status('No se pudo copiar el enlace. Usá el botón Compartir de tu navegador.',true);}
}
root.GC_QUOTE_PRESENT={open,close,shareImage};
})(window);
