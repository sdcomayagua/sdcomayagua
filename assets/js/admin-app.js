/* Gamer Comayagua · Admin App móvil. Reutiliza PIN y API del panel original. */
(function(){'use strict';
const $=id=>document.getElementById(id), A=()=>window.GC_ADMIN,C=()=>window.GC;
const sections=[['inventory','Inventario','▦'],['offers','Ofertas','%'],['sales','Ventas','▤'],['orders','Pedidos','◇'],['finance','Finanzas','◫'],['receipts','Entradas','↧'],['stock','Stock','◷'],['pending','Pendientes','!'],['duplicates','Duplicados','⊞'],['waitlist','Interesados','♡'],['publish','Publicaciones','✎']];
const quickSections=sections.slice(0,4),extraSections=sections.slice(4);
let current='inventory',editorStep='data',prepared=null,preparedUrl=null;
function clearBlob(){if(preparedUrl)URL.revokeObjectURL(preparedUrl);prepared=null;preparedUrl=null}
const money=n=>C().money(n);
function create(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function navButton([key,name,icon],place){
 const btn=create('button','app-nav-button');btn.type='button';btn.dataset.appSection=key;btn.setAttribute('aria-label',name);
 btn.innerHTML='<span class="app-nav-icon" aria-hidden="true">'+icon+'</span><span class="app-nav-text">'+name+'</span>';
 place.append(btn);
}
function setupNavigation(){
 const panel=$('adminPanel'),top=create('section','app-overview');top.id='appOverview';
 top.innerHTML='<div class="app-welcome"><span class="app-overline">TU TIENDA · ADMINISTRACIÓN</span><h1 id="appPageHeading">Mis productos</h1><p id="appPageHint">Buscá, cambiá precios y administrá tus productos fácilmente.</p><p class="app-session-note" id="appSessionNote" aria-live="polite"></p></div><div class="app-overview-actions"><button type="button" id="appCreate" class="btn">+ Agregar producto</button><button type="button" id="appRefresh" class="btn outline">↻ Actualizar</button><details class="app-quick-extras" id="appQuickExtras"><summary>Más acciones</summary><div><button type="button" id="appPhotos" class="btn outline">▧ Agregar desde fotos</button><button type="button" id="appKit" class="btn outline">+ Armar kit</button></div></details></div>';
 panel.prepend(top);
 const nav=create('nav','app-main-nav');nav.id='appMainNav';nav.setAttribute('aria-label','Módulos de administración');
 quickSections.forEach(s=>navButton(s,nav));const advancedToggle=create('button','app-nav-button app-advanced-toggle','☷ Más herramientas');advancedToggle.id='appAdvancedToggle';advancedToggle.type='button';advancedToggle.setAttribute('aria-expanded','false');nav.append(advancedToggle);top.after(nav);
 const advanced=create('nav','app-advanced-nav');advanced.id='appAdvancedNav';advanced.hidden=true;advanced.setAttribute('aria-label','Herramientas avanzadas');extraSections.forEach(s=>navButton(s,advanced));nav.after(advanced);
 advancedToggle.onclick=()=>{advanced.hidden=!advanced.hidden;advancedToggle.setAttribute('aria-expanded',String(!advanced.hidden))};
 const bottom=create('nav','app-bottom-nav');bottom.id='appBottomNav';bottom.setAttribute('aria-label','Navegación del administrador');
 quickSections.forEach(s=>navButton(s,bottom));
 const more=create('button','app-nav-button');more.type='button';more.id='appMoreToggle';more.innerHTML='<span class="app-nav-icon" aria-hidden="true">☷</span><span class="app-nav-text">Más</span>';bottom.append(more);
 const drawer=create('aside','app-more-drawer');drawer.id='appMoreDrawer';drawer.hidden=true;drawer.innerHTML='<div class="app-more-head"><strong>Otras funciones</strong><button id="appMoreClose" type="button" aria-label="Cerrar menú">×</button></div><div class="app-more-list"></div>';
 extraSections.forEach(s=>navButton(s,drawer.querySelector('.app-more-list')));
 panel.append(bottom,drawer);
 const onNav=e=>{const b=e.target.closest('[data-app-section]');if(b)go(b.dataset.appSection);};
 nav.addEventListener('click',onNav);advanced.addEventListener('click',onNav);bottom.addEventListener('click',onNav);drawer.addEventListener('click',onNav);
 $('appRefresh').onclick=()=>$('refresh').click();$('appCreate').onclick=()=>$('createNew').click();$('appKit').onclick=()=>$('gcKitOpen').click();$('appPhotos').onclick=()=>$('photoIntakeOpen').click();
 more.onclick=()=>{drawer.hidden=!drawer.hidden;more.setAttribute('aria-expanded',String(!drawer.hidden))};
 $('appMoreClose').onclick=()=>{drawer.hidden=true;more.setAttribute('aria-expanded','false')};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer.hidden=true});
 const saved=new URLSearchParams(location.search).get('seccion');go(sections.some(s=>s[0]===saved)?saved:'inventory',false);
}
function go(key,scroll=true){
 if(!sections.some(s=>s[0]===key))return;
 current=key;
 const btn=$('mgTabs')?.querySelector('[data-mg-tab="'+key+'"]');btn?.click();
 const name=sections.find(s=>s[0]===key)[1];$('appPageHeading').textContent=key==='inventory'?'Mis productos':name;
 const help={inventory:'Buscá tus artículos, cambiá precios o compartí una cotización.',offers:'Prepará promociones sin modificar otras partes de la tienda.',sales:'Registrá lo que vendiste.',orders:'Revisá los pedidos y su entrega.',finance:'Tus costos y ganancias, solo para vos.',receipts:'Anotá la mercancía que recibiste.',stock:'Revisá lo que hace falta reponer.',pending:'Completá los productos pendientes.',duplicates:'Revisá artículos repetidos.',waitlist:'Consultá clientes interesados.',publish:'Prepará una publicación para redes sociales.'};
 $('appPageHint').textContent=help[key]||'Herramientas de tu negocio.';
 if(extraSections.some(s=>s[0]===key)){$('appAdvancedNav').hidden=false;$('appAdvancedToggle').setAttribute('aria-expanded','true')}else{$('appAdvancedNav').hidden=true;$('appAdvancedToggle').setAttribute('aria-expanded','false')}
 document.querySelectorAll('[data-app-section]').forEach(b=>{b.classList.toggle('active',b.dataset.appSection===key);b.setAttribute('aria-current',b.dataset.appSection===key?'page':'false')});
 $('appMoreDrawer').hidden=true;
 if(scroll)window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function photoSource(p){let gal=p.gallery;try{gal=JSON.parse(gal)}catch{};return p.image||(Array.isArray(gal)?gal[0]:String(gal||'').split(/[\n,;|]/)[0])||'';}
function paymentSummary(p){
 const holder=create('div','app-product-prices');
 const qty=[{product:p,qty:1}],sets=A().settings();
 for(const [mode,title] of [['transfer','Depósito'],['tigo','Tigo Money'],['cod','Pagar al recibir']]){
  const line=create('div','app-product-price-line');
  let value='—',detail='';
  try{const q=C().quote(qty,mode,sets);
   if(mode==='cod'&&!q.codAllowed){value='No disponible';}
   else {value=money(q.total);detail=mode==='tigo'?'Comisión '+money(q.fee):mode==='cod'?'Anticipo '+money(q.deposit):q.shipping===0?'Envío gratis':'Envío '+money(q.shipping);}
  }catch{value='Consultar';}
  const t=create('span','app-price-type',title),v=create('strong','',value);line.append(t,v);
  if(detail)line.append(create('small','',detail));holder.append(line);
 }
 return holder;
}
function enhanceRows(){
 const list=$('adminRows');if(!list)return;
 for(const row of list.querySelectorAll('tr')){
  if(row.dataset.appEnhanced)return;const edit=row.querySelector('[data-edit]');if(!edit)continue;
  const id=edit.dataset.edit,p=A()?.products().find(x=>x.id===id);if(!p)continue;
  row.dataset.appEnhanced='true';
  const actions=row.querySelector('.admin-row-actions');if(!actions)continue;
  const priceTd=row.querySelector('td[data-label="Precio"]');const paymentDetails=create('details','app-payment-details');paymentDetails.innerHTML='<summary>Ver precios con envío y comisiones</summary>';paymentDetails.append(paymentSummary(p));priceTd?.append(paymentDetails);
  const share=create('button','btn app-share-quote','▧ Cotizar / WhatsApp');share.type='button';share.dataset.appQuote=id;share.disabled=!p.active||p.stock<=0;actions.prepend(share);
  const more=create('button','btn outline app-row-more','⋯ Más opciones');more.type='button';more.setAttribute('aria-expanded','false');
  more.onclick=()=>{const val=row.classList.toggle('app-actions-open');more.setAttribute('aria-expanded',String(val))};
  actions.append(more);
 }
}
function setShareStatus(message,failed=false){const el=$('appQuoteStatus');el.textContent=message;el.classList.toggle('error',failed)}
function setupShareDialog(){
 const overlay=create('div','app-share-overlay');overlay.id='appQuoteOverlay';overlay.hidden=true;
 overlay.innerHTML='<section class="app-share-dialog" role="dialog" aria-modal="true" aria-labelledby="appQuoteTitle"><header><div><span class="app-overline">COTIZACIÓN LISTA PARA COMPARTIR</span><h2 id="appQuoteTitle">Preparar cotización</h2></div><button type="button" id="appQuoteClose" aria-label="Cerrar">×</button></header><div class="app-share-body"><p id="appQuoteStatus" role="status" aria-live="polite"></p><img id="appQuoteImage" alt="Vista previa de la cotización" hidden><p class="app-share-tip">En celular tocá Compartir y elegí WhatsApp para enviar la imagen. En computadora podés descargarla y adjuntarla.</p></div><footer><button type="button" class="btn outline" id="appQuoteDownload" disabled>↓ Descargar PNG</button><button type="button" class="btn" id="appQuoteShare" disabled>Compartir archivo</button></footer></section>';
 document.body.append(overlay);
 $('appQuoteClose').onclick=()=>{overlay.hidden=true;clearBlob();$('appQuoteImage').hidden=true};
 overlay.addEventListener('click',e=>{if(e.target===overlay)$('appQuoteClose').click()});
 $('appQuoteDownload').onclick=()=>{
  if(!prepared)return;const link=document.createElement('a');link.href=preparedUrl;link.download=prepared.name;document.body.append(link);link.click();link.remove();
 };
 $('appQuoteShare').onclick=()=>{
  if(!prepared)return;
  if(navigator.share&&navigator.canShare?.({files:[prepared]})){
   navigator.share({files:[prepared],title:'Cotización Gamer Comayagua',text:'Cotización del producto · Gamer Comayagua'}).catch(e=>{if(e.name!=='AbortError')setShareStatus('No se pudo abrir compartir. Descargá el PNG y adjuntalo en WhatsApp.',true)});
  }else{setShareStatus('Este navegador no permite enviar imágenes directamente. Descargá el PNG y adjuntalo en WhatsApp.');$('appQuoteDownload').click();}
 };
}
async function openQuote(id){
 const p=A()?.products().find(x=>x.id===id);
 if(!p)return;
 if(window.GC_QUOTE_PRESENT?.open){window.GC_QUOTE_PRESENT.open({product:p,source:photoSource(p),settings:A().settings()});return;}
 clearBlob();$('appQuoteOverlay').hidden=false;$('appQuoteTitle').textContent=p.name;$('appQuoteImage').hidden=true;
 $('appQuoteDownload').disabled=true;$('appQuoteShare').disabled=true;
 setShareStatus('Comprobando fotografía y preparando la cotización…');
 try{
  const source=photoSource(p);if(!source)throw Error('Este producto no tiene foto. Subí la imagen antes de cotizar.');
  // Si Drive no permite el lienzo, se usa la copia autenticada de adminPhotoData.
  await window.GC_PHOTO_DOWNLOAD.photoBlob(p,source,0,window.GC_WATERMARK?.get?.());
  const canvas=await window.GC_PRODUCT_QUOTE.render(p,source,A().settings());
  const blob=await new Promise((ok,fail)=>canvas.toBlob(b=>b?ok(b):fail(Error('No se pudo crear el PNG')),'image/png'));
  const basename=String(p.code||p.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'-').slice(0,65);
  prepared=new File([blob],'Cotizacion-'+basename+'.png',{type:'image/png'});
  preparedUrl=URL.createObjectURL(blob);$('appQuoteImage').src=preparedUrl;$('appQuoteImage').hidden=false;
  $('appQuoteDownload').disabled=false;$('appQuoteShare').disabled=false;
  setShareStatus('Fotografía confirmada. Cotización lista con depósito, Tigo Money y pagar al recibir.');
 }catch(err){setShareStatus(err.message||'No se pudo preparar la cotización.',true);}
}
function setupEditor(){
 const form=$('productForm'),grid=form.querySelector('.form-grid');
 const startPanel=create('section','app-photo-start');startPanel.id='appPhotoStart';
 startPanel.innerHTML='<span class="app-photo-kicker">PASO 1 · FOTOGRAFÍA DEL PRODUCTO</span><h3>Empezá con una foto de la caja</h3><p>Buscá en tu galería o usá la cámara del iPhone. Elegí una foto del artículo. Si el análisis reconoce el producto, vas a ver un nombre propuesto para revisar; no se inventarán marcas ni modelos.</p><div class="app-photo-start-buttons"><button type="button" id="appPhotoGallery">▧ Mi galería</button><button type="button" id="appPhotoCamera">◎ Tomar foto</button><button type="button" id="appPhotoRead">⌕ Leer nombre y modelo</button><button type="button" id="appPhotoFind">↗ Buscar con mi foto</button></div><p class="app-photo-note">El precio, stock y disponibilidad los confirmás vos antes de publicar.</p>';
 grid.insertBefore(startPanel,grid.querySelector('[name=image]').closest('label'));
 const direct=Array.from(grid.children);
 const photoKeys=new Set(['image','gallery']);
 const detailsKeys=new Set(['discounts','colors','promoText','description']);
 const reviewKeys=new Set(['active']);
 for(const node of direct){
  const key=node.matches('label')?node.querySelector('[name]')?.name:'';
  let step=photoKeys.has(key)||node.id==='productPhotoDrop'||node.id==='appPhotoStart'?'photos':
    detailsKeys.has(key)||node.id==='technicalEditor'||node.classList.contains('gc-research')?'details':
    reviewKeys.has(key)?'review':'data';
  node.dataset.appStep=step;
 }
 $('editorReview').dataset.appStep='review';
 const nav=form.querySelector('.editor-jump');
 const footer=$('productSaveActions');
 const next=create('button','btn app-next','Siguiente →');next.type='button';next.id='appEditorNext';
 const prev=create('button','btn outline app-prev','← Atrás');prev.type='button';prev.id='appEditorPrev';
 footer.prepend(prev,next);
 $('appPhotoGallery').onclick=()=>$('pickGalleryBtn').click();
 $('appPhotoCamera').onclick=()=>$('pickCameraBtn').click();
 $('appPhotoRead').onclick=()=>$('readPackageBtn').click();
 $('appPhotoFind').onclick=()=>$('findReferencePhotosBtn').click();
 const steps=['data','photos','details','review'];
 const wizard=()=>form.elements.namedItem('id').value?steps:['photos','data','details','review'];
 function show(step,doFocus=false){
  editorStep=steps.includes(step)?step:wizard()[0];
  const order=wizard();
  form.dataset.appNewProduct=form.elements.namedItem('id').value?'false':'true';
  form.dataset.appCurrentStep=editorStep;
  grid.querySelectorAll('[data-app-step]').forEach(e=>{e.hidden=e.dataset.appStep!==editorStep});
  $('editorReview').hidden=editorStep!=='review';if(editorStep==='review')$('editorReview').open=true;
  nav.querySelectorAll('[data-editor-section]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.editorSection===editorStep));b.setAttribute('aria-current',b.dataset.editorSection===editorStep?'step':'false')});
  prev.hidden=editorStep===order[0];next.hidden=editorStep==='review';
  next.textContent=editorStep==='photos'&&!form.elements.namedItem('id').value?'Continuar con datos →':'Siguiente →';
  $('saveBtn').hidden=editorStep!=='review';
  if(doFocus){const body=$('productEditorBody');body.scrollTop=0;const focus=grid.querySelector('[data-app-step="'+editorStep+'"] input:not([type=hidden]),[data-app-step="'+editorStep+'"] textarea');focus?.focus({preventScroll:true});}
 }
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-editor-section]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();show(b.dataset.editorSection,true)},true);
 next.onclick=()=>{const order=wizard();show(order[Math.min(3,order.indexOf(editorStep)+1)],true);};
 prev.onclick=()=>{const order=wizard();show(order[Math.max(0,order.indexOf(editorStep)-1)],true);};
 form.addEventListener('invalid',e=>{const step=e.target.closest('[data-app-step]')?.dataset.appStep||'data';show(step);},true);
 document.addEventListener('gc:editor-opened',()=>{
  const features=A()?.features?.()||{},note=$('appPhotoStart').querySelector('.app-photo-note');
  note.textContent=features.photoVision===true
   ?'Reconocimiento visual disponible: la foto se analiza con Gemini desde tu conexión privada. Confirmá siempre el resultado antes de guardar.'
   :'Lectura de letras disponible. El reconocimiento visual del artículo requiere la versión actualizada de Apps Script y la conexión privada de Gemini.';
  show(form.elements.namedItem('id').value?'data':'photos');
 });
 const obs=new MutationObserver(()=>{if(!$('formOverlay').hidden&&!form.dataset.appShown){form.dataset.appShown='1';show(form.elements.namedItem('id').value?'data':'photos')}else if($('formOverlay').hidden){delete form.dataset.appShown}});
 obs.observe($('formOverlay'),{attributes:true,attributeFilter:['hidden']});
 show('data');
}
function setup(){
 if(!$('adminPanel')||!A())return;
 setupNavigation();setupShareDialog();setupEditor();
 const sessionNote=$('appSessionNote');
 document.addEventListener('gc:admin-session',e=>{if(sessionNote)sessionNote.textContent=e.detail?.remembered?'✓ Acceso recordado en este navegador':'Acceso protegido por PIN'});
 if(sessionNote)sessionNote.textContent='Acceso protegido por PIN';
 const rows=$('adminRows'),observer=new MutationObserver(enhanceRows);observer.observe(rows,{childList:true});enhanceRows();
 rows.addEventListener('click',e=>{const b=e.target.closest('[data-app-quote]');if(b){e.preventDefault();openQuote(b.dataset.appQuote)}});
 document.addEventListener('gc:catalog',enhanceRows);
 window.GC_ADMIN_APP={go,enhanceRows};
}
document.addEventListener('DOMContentLoaded',setup);
})();
