/* Borradores locales, revisión de la ficha y entrada directa de fotografías. */
(function(){
'use strict';
const A=window.GC_ADMIN,C=window.GC,$=id=>document.getElementById(id),form=$('productForm'),overlay=$('formOverlay');
if(!A||!form||!$('editorDraftNotice'))return;
const fields=['name','category','price','promoPrice','cost','stock','codAllowed','image','gallery','discounts','colors','promoText','description','active','weight','weightUnit','width','height','length','measureUnit','size','material','model','compatibility','brand','voltage','current','power','connection','technology','included','researchReferences'];
const groups=[['price','promoPrice'],['weight','weightUnit'],['width','height','length','measureUnit'],['image','gallery'],['name','brand','model']];
const scope=(String(window.GC_CONFIG?.spreadsheetUrl||'').match(/\/d\/([\w-]+)/)||[])[1]||'catalogo';
const storageKey='gc_editor_drafts_v1:'+scope,expiry=7*24*60*60*1000;
const value=key=>String(form.elements.namedItem(key)?.value??'');
const snapshot=()=>Object.fromEntries(fields.map(key=>[key,value(key)]));
let active=null,timer,offer=null,saved=false,pendingHint='';
function drafts(){
 const raw=JSON.parse(localStorage.getItem(storageKey)||'{}'),now=Date.now(),out={};
 for(const [key,draft] of Object.entries(raw))if(draft?.version===1&&draft.updated>now-expiry&&draft.updated<=now+60000&&draft.before&&draft.patch&&typeof draft.before==='object'&&typeof draft.patch==='object')out[key]=draft;
 return out;
}
function write(all){
 const bounded=Object.fromEntries(Object.entries(all).sort((a,b)=>b[1].updated-a[1].updated).slice(0,10));
 if(Object.keys(bounded).length)localStorage.setItem(storageKey,JSON.stringify(bounded));else localStorage.removeItem(storageKey);
}
function message(text){$('editorDraftStatus').textContent=text;}
function persist(){
 clearTimeout(timer);
 if(!active||saved||value('id')!==active.id)return;
 if(offer){message('Hay un borrador anterior. Recuperalo o descartalo antes de continuar.');return;}
 try{
  const now=snapshot(),patch=Object.fromEntries(fields.filter(key=>now[key]!==active.before[key]).map(key=>[key,now[key]]));
  const pending=A.selectedPhotos().map(file=>file.name).slice(0,10),all=drafts();
  if(!Object.keys(patch).length&&!pending.length){delete all[active.key];write(all);message(pendingHint||'Los cambios se publican al guardar.');return;}
  all[active.key]={version:1,updated:Date.now(),revision:active.revision,before:active.before,patch,pending};write(all);
  message('Borrador conservado en este navegador.'+(pending.length?' Volvé a elegir las fotos pendientes si recargás.':''));
 }catch(error){message('No se pudo conservar el borrador. Mantené esta ficha abierta hasta guardar.');}
}
function queue(){if(!active||overlay.hidden)return;review();clearTimeout(timer);timer=setTimeout(persist,450);}
function start(){
 clearTimeout(timer);saved=false;pendingHint='';const id=value('id');active={id,key:id||'nuevo',revision:form.dataset.revision||'',before:snapshot()};offer=null;
 $('editorDraftNotice').hidden=true;message('Los cambios se publican al guardar.');
 document.querySelectorAll('[data-editor-section]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.editorSection==='data')));
 $('editorReview').open=false;
 try{
  offer=drafts()[active.key]||null;
  if(offer){
   const time=new Intl.DateTimeFormat('es-HN',{dateStyle:'short',timeStyle:'short'}).format(new Date(offer.updated));
   $('editorDraftMessage').textContent='Tenés una edición sin guardar del '+time+'. Podés recuperar sus cambios antes de continuar.';
   $('editorDraftNotice').hidden=false;message('Borrador disponible para recuperar.');
  }
 }catch(error){message('Los borradores no están disponibles en este navegador. Guardá antes de cerrar.');}
 review();
}
function removeDraft(){try{const all=drafts();delete all[active.key];write(all);return true;}catch(error){message('No se pudo quitar el borrador de este navegador.');return false;}}
$('editorDraftRestore').onclick=()=>{
 if(!active||!offer||A.editorPhotos().busy)return;
 const draft=offer,current=snapshot(),blocked=new Set();let count=0,skipped=0;
 if(draft.revision!==active.revision)blocked.add('cost');
 for(const group of groups)if(group.some(key=>current[key]!==String(draft.before[key]??'')))group.forEach(key=>blocked.add(key));
 for(const key of fields){
  if(!Object.prototype.hasOwnProperty.call(draft.patch,key))continue;
  const next=draft.patch[key];
  if(typeof next!=='string'||next.length>20000||blocked.has(key)||current[key]!==String(draft.before[key]??'')){skipped++;continue;}
  const field=form.elements.namedItem(key);field.value=next;field.dispatchEvent(new Event('input',{bubbles:true}));count++;
 }
 pendingHint=Array.isArray(draft.pending)&&draft.pending.length?'Volvé a elegir '+draft.pending.length+' fotos pendientes; los archivos se seleccionan nuevamente al recargar.':'';
 offer=null;$('editorDraftNotice').hidden=true;
 A.updateEditorCode();$('productImage').dispatchEvent(new Event('input',{bubbles:true}));
 if(fields.some(key=>['model','brand','weight','width','height','length','connection'].includes(key)&&value(key)))$('technicalEditor').open=true;
 $('formMessage').textContent=count+' campos recuperados.'+(skipped?' Se conservaron '+skipped+' campos que cambiaron desde ese borrador.':'')+(pendingHint?' '+pendingHint:'');
 persist();review();
};
$('editorDraftDiscard').onclick=()=>{if(!active||A.editorPhotos().busy||!removeDraft())return;offer=null;$('editorDraftNotice').hidden=true;pendingHint='';persist();};
const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function review(){
 if(overlay.hidden)return;
 const photos=A.editorPhotos(),pending=A.selectedPhotos(),count=photos.images.length+pending.length,price=Number(value('price')),promo=Number(value('promoPrice')),stock=Number(value('stock')),visible=value('active')==='SI';
 $('editorPhotoCount').textContent=count+'/10';
 $('editorPreviewName').textContent=value('name').trim()||'Nombre del producto';
 $('editorPreviewCategory').textContent=[value('category'),value('code')].filter(Boolean).join(' · ')||'Categoría pendiente';
 $('editorPreviewPrice').textContent='L '+(Number.isFinite(price)?price:0).toLocaleString('es-HN',{maximumFractionDigits:2})+(promo>0?' · Promoción L '+promo.toLocaleString('es-HN',{maximumFractionDigits:2}):'');
 $('editorPreviewStock').textContent=(visible?'Visible en tienda':'Oculto / borrador')+' · '+(Number.isFinite(stock)?stock:0)+' unidades';
 $('editorPreviewSpecs').textContent=['brand','model','connection'].map(value).filter(Boolean).join(' · ');
 const source=photos.images[0]||document.querySelector('#pendingPreview img')?.src||'assets/img/sin-foto.svg';
 const image=$('editorPreviewImage');if(image.getAttribute('src')!==source)image.src=source;image.onerror=()=>{image.onerror=null;image.src='assets/img/sin-foto.svg';};
 const checklist=[
  [value('name').trim().length>=3&&!!value('category').trim(),'Nombre y categoría completos','Completá el nombre y la categoría.'],
  [Number.isFinite(price)&&price>=0&&(!visible||price>0)&&(!value('promoPrice')||promo>0&&promo<=price),'Precio y promoción revisados','Revisá el precio de venta y la promoción.'],
  [value('stock')!==''&&Number.isInteger(stock)&&stock>=0,'Existencias revisadas','Las existencias deben ser un número entero desde cero.'],
  [count>0&&count<=10,count+' '+(count===1?'foto lista':'fotos listas')+(pending.length?' ('+pending.length+' por subir)':''),count>10?'La ficha admite hasta 10 fotos.':'Agregá al menos una foto para presentar el producto.'],
  [!!value('description').trim(),'Descripción completada','Podés agregar una descripción para tus clientes.']
 ];
 const list=$('editorChecklist');list.replaceChildren();for(const [ok,yes,no] of checklist){const item=document.createElement('li');item.className=ok?'is-ready':'is-pending';item.textContent=(ok?'✓ ':'• ')+(ok?yes:no);list.appendChild(item);}
 $('editorReviewState').textContent=visible?(stock===0?'Agotado':'Visible al guardar'):'Borrador';
 const name=normalize(value('name')),model=normalize(value('model')),brand=normalize(value('brand'));
 const duplicates=A.products().filter(product=>product.id!==value('id')&&(name&&normalize(product.name)===name||model&&normalize(product.details?.model)===model&&normalize(product.category)===normalize(value('category'))&&(!brand||!product.details?.brand||normalize(product.details.brand)===brand))).slice(0,3);
 $('editorDuplicateHint').hidden=!duplicates.length;$('editorDuplicateHint').textContent=duplicates.length?'Revisá si ya lo tenés: '+duplicates.map(product=>product.name+' ('+product.code+')').join(', ')+'.':'';
}
document.addEventListener('gc:editor-open',start);
document.addEventListener('gc:editor-change',queue);
document.addEventListener('gc:editor-close',()=>{persist();active=null;offer=null;clearTimeout(timer);});
document.addEventListener('gc:editor-saved',()=>{saved=true;clearTimeout(timer);if(active)removeDraft();});
for(const type of ['input','change'])form.addEventListener(type,queue);
document.addEventListener('gc:photos-selected',queue);
window.addEventListener('pagehide',persist);window.addEventListener('beforeunload',persist);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
form.querySelector('.editor-jump').onclick=event=>{
 const button=event.target.closest('[data-editor-section]');if(!button)return;
 const key=button.dataset.editorSection,target={data:form.elements.namedItem('name'),photos:$('productPhotoDrop'),details:$('technicalEditor'),review:$('editorReview')}[key];
 if(key==='details'||key==='review')target.open=true;
 form.querySelectorAll('[data-editor-section]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 target.scrollIntoView({block:'start',behavior:'instant'});if(key==='data'||key==='photos')target.focus({preventScroll:true});review();
};
const drop=$('productPhotoDrop');
drop.addEventListener('dragover',event=>{if(!Array.from(event.dataTransfer?.types||[]).includes('Files'))return;event.preventDefault();if(!A.editorPhotos().busy)drop.classList.add('is-dragging');});
drop.addEventListener('dragleave',event=>{if(!drop.contains(event.relatedTarget))drop.classList.remove('is-dragging');});
drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('is-dragging');if(!A.editorPhotos().busy)A.addPhotos(event.dataTransfer?.files);});
document.addEventListener('paste',event=>{
 if(overlay.hidden||!overlay.contains(event.target)||A.editorPhotos().busy||!$('bulkOverlay').hidden||($('photoIntakeOverlay')&&!$('photoIntakeOverlay').hidden))return;
 const files=Array.from(event.clipboardData?.files||[]).filter(file=>file.type.startsWith('image/'));if(!files.length)return;event.preventDefault();A.addPhotos(files);
});
document.addEventListener('keydown',event=>{if(!overlay.hidden&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(!A.editorPhotos().busy)form.requestSubmit();}});
})();
