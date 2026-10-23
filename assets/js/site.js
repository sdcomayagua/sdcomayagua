
(function(){'use strict';
const C=window.GC,config=window.GC_CONFIG,$=id=>document.getElementById(id);
const imgFallback='assets/img/sin-foto.svg',page=document.body.dataset.page||'inicio';
let products=[],settings={...config},banks=[],cart={},currentId='',visible=24,latest=null,currentQuoteId='';
let banksRequest=null,banksStatus='idle',detailTrigger=null;
let checkoutDelivery={mode:'national',amount:'',note:''};
let onlineRequest=null,lastOnlineCheck=0,linkedProductOpened=false,pendingOnlineRefresh=false;
const bestSellersCategory='__mas_pedidos__';
const initialParams=new URLSearchParams(location.search),linkedProductId=initialParams.get('producto');
let requestedCategory=initialParams.get('coleccion')==='mas-pedidos'?bestSellersCategory:(initialParams.get('categoria')||'').slice(0,120);
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const toast=msg=>{const el=$('toast');el.textContent=msg;el.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.display='none',3500)};
const escapeAttr=s=>safe(s);
function galleryOf(p){
 const urls=[];
 const add=u=>{u=String(u||'').trim();if(u&&!urls.includes(u))urls.push(u)};
 add(p.image);
 let raw=String(p.gallery||'').trim();
 try{const parsed=JSON.parse(raw);if(Array.isArray(parsed))raw=parsed.join('\n')}catch{}
 raw.split(/[\n,;|]/).map(x=>x.trim()).filter(Boolean).forEach(u=>{if(/^https:\/\//.test(u)||/^assets\/products\/[\w.-]+$/.test(u))add(u)});
 return urls.slice(0,10);
}
function normalize(url){
 const src=String(url||'').trim();
 if(/^https:\/\//i.test(src)){
   const m=src.match(/drive\.google\.com\/(?:file\/d\/|thumbnail\?id=)([A-Za-z0-9_-]+)/i);
   if(m)return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(m[1])+'&sz=w1200';
   return src;
 }
 if(/^(?:assets\/products\/)[\w.-]+$/i.test(src))return src;
 return imgFallback;
}
const pic=p=>normalize(galleryOf(p)[0]);
function cleanItems(){for(const [id,n] of Object.entries(cart)){const p=products.find(x=>x.id===id);if(!p||!p.active||p.stock<=0)delete cart[id];else cart[id]=Math.min(Math.max(1,Number(n)||1),p.stock)}try{sessionStorage.setItem('gc_cart',JSON.stringify(cart))}catch{};const count=Object.values(cart).reduce((a,b)=>a+b,0);if(!count)resetDeliveryChoice();if($('cartCount'))$('cartCount').textContent=count;document.querySelectorAll('[data-cart-count]').forEach(el=>{el.textContent=count;el.hidden=count===0});if($('mobileCart'))$('mobileCart').setAttribute('aria-label',count?`Abrir carrito, ${count} producto${count===1?'':'s'}`:'Abrir carrito');}
function items(){cleanItems();return Object.entries(cart).map(([id,qty])=>({product:products.find(x=>x.id===id),qty:Number(qty)})).filter(x=>x.product)}
function renderCategories(){if(!$('category'))return;const cats=[...new Set(products.filter(p=>p.active).map(p=>p.category))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));const choices=[bestSellersCategory,...cats];const selection=$('category').value||requestedCategory;$('category').innerHTML='<option value="">Categorías</option><option value="__mas_pedidos__">Más pedidos</option>'+cats.map(x=>`<option value="${escapeAttr(x)}">${safe(x)}</option>`).join('');$('category').value=choices.includes(selection)?selection:'';if(choices.includes(requestedCategory))requestedCategory='';renderCategoryShortcuts();}
function renderCategoryShortcuts(){
 const target=$('categoryShortcuts');if(!target)return;
 const counts=new Map();
 products.filter(p=>p.active&&p.category).forEach(p=>counts.set(p.category,(counts.get(p.category)||0)+1));
 const popular=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).slice(0,5).map(([name])=>name);
 target.innerHTML=['',...(products.some(p=>p.active&&p.bestSeller)?[bestSellersCategory]:[]),...popular].map(category=>`<button type="button" class="category-shortcut" data-category="${escapeAttr(category)}" aria-pressed="${category===($('category')?.value||'')}">${safe(category===bestSellersCategory?'Más pedidos':category||'Todos')}</button>`).join('');
}
function updateCategoryShortcuts(){
 const category=$('category')?.value||'';
 $('categoryShortcuts')?.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
 if($('catalogHeading'))$('catalogHeading').textContent=$('search')?.value.trim()?'Resultados de búsqueda':category===bestSellersCategory?'Más pedidos':category||'Todos los productos';
 if($('clearFilters'))$('clearFilters').hidden=!($('search')?.value.trim()||category||$('sort')?.value!=='newest'||$('onlyAvailable')?.checked);
 if($('shareCategory'))$('shareCategory').textContent=category?'Compartir categoría':'Compartir catálogo';
}
function catalogUrl(productId='',category=''){
 const url=new URL('productos.html',document.baseURI);
 if(productId)url.searchParams.set('producto',productId);
 else if(category===bestSellersCategory)url.searchParams.set('coleccion','mas-pedidos');
 else if(category)url.searchParams.set('categoria',category);
 return url.href;
}
function filteredCatalogUrl(){const url=new URL(catalogUrl('',$('category')?.value||''));const query=$('search')?.value.trim();if(query)url.searchParams.set('buscar',query);if($('sort')&&$('sort').value!=='newest')url.searchParams.set('orden',$('sort').value);if($('onlyAvailable')?.checked)url.searchParams.set('disponibles','1');return url.href;}
async function shareCatalogLink(title,url){
 try{if(typeof navigator.share==='function'){await navigator.share({title,url});return;}}catch(error){if(error.name==='AbortError')return;}
 const copied=await copyText(url);
 toast(copied?'Enlace copiado. Ya podés compartirlo.':'No se pudo copiar el enlace. Intentá desde otro navegador.');
}
function syncFilterUrl(){
 if(!$('search')||!$('category'))return;
 const url=new URL(location.href);
 for(const [key,value] of [['buscar',$('search').value.trim()],['categoria',$('category').value===bestSellersCategory?'':$('category').value],['orden',$('sort')?.value==='newest'?'':$('sort')?.value||''],['disponibles',$('onlyAvailable')?.checked?'1':'']]){
  if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
 }
 if($('category').value===bestSellersCategory)url.searchParams.set('coleccion','mas-pedidos');else url.searchParams.delete('coleccion');
 url.searchParams.delete('producto');url.searchParams.delete('v');
 try{history.replaceState(null,'',url)}catch{};
}
function filtersChanged(){requestedCategory='';visible=24;syncFilterUrl();render();}
function resetFilters(){
 if(!$('search')||!$('category'))return;
 $('search').value='';$('category').value='';if($('sort'))$('sort').value='newest';
 if($('onlyAvailable'))$('onlyAvailable').checked=false;
 filtersChanged();$('search').focus({preventScroll:true});
}
function card(p){
 const offer=C.unitPrice(p,1),reduced=offer<p.price;
 const price=value=>`<span class="price-currency">L</span> ${safe(C.money(value).slice(2))}`;
 const amount=reduced?`<div class="product-price is-promo"><span class="price-previous">Antes <s>${C.money(p.price)}</s></span><span class="price-line"><strong class="price-current">${price(offer)}</strong><span class="offer-badge">Oferta</span></span></div>`:`<div class="product-price"><strong class="price-current">${price(p.price)}</strong></div>`;
 const zoom='<span class="photo-inspect" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M10 7v6M7 10h6"/></svg></span>';
 const cartIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01M14 7v6M11 10h6"/></svg>';
 return `<article class="product ${p.stock?'':'out'}">
  <div class="photo"><button type="button" class="photo-open" data-detail="${escapeAttr(p.id)}" aria-label="Ver detalles de ${escapeAttr(p.name)}"><img loading="lazy" decoding="async" src="${escapeAttr(pic(p))}" onerror="this.onerror=null;this.src='${imgFallback}';this.closest('.photo').classList.add('missing-photo')" alt="${safe(p.name)}">${zoom}</button><span class="tag ${p.stock?'':'out'}">${p.stock?'En stock':'Agotado'}</span></div>
  <div class="product-body"><div class="category">${safe(p.category)}</div><h3><button type="button" class="product-name" data-detail="${escapeAttr(p.id)}" aria-label="Ver detalles de ${escapeAttr(p.name)}">${safe(p.name)}</button></h3>${amount}${p.promoText?`<div class="promo-note">${safe(p.promoText)}</div>`:''}<div class="stock">${p.stock?`${p.stock} disponible${p.stock===1?'':'s'}`:'Sin existencias'}</div><div class="product-actions"><button type="button" class="btn" data-add="${escapeAttr(p.id)}" aria-label="${p.stock?'Agregar':'Agotado'}: ${escapeAttr(p.name)}" ${!p.stock?'disabled':''}>${p.stock?cartIcon+'<span>Agregar</span>':'Agotado'}</button></div></div>
 </article>`;
}
function renderBestSellers(){
 const section=$('bestSellersSection'),list=$('bestSellersList');if(!section||!list)return;
 const selected=products.filter(p=>p.active&&p.bestSeller).sort(C.recentFirst).slice(0,10);
 section.hidden=!selected.length;
 list.innerHTML=selected.map(p=>`<button type="button" class="requested-product ${p.stock?'':'out'}" data-requested-product="${escapeAttr(p.id)}"><img src="${escapeAttr(pic(p))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${imgFallback}'"><span><strong>${safe(p.name)}</strong><small>${C.money(C.unitPrice(p,1))}${p.stock?'':' · Agotado'}</small></span></button>`).join('');
}
function render(){
 if(!$('productGrid'))return;
 renderBestSellers();
 let list=products.filter(p=>p.active);
 if(page==='inicio'){
   list=list.filter(p=>p.stock>0).slice(0,8);
   if($('resultsCount'))$('resultsCount').textContent='Una selección de nuestros productos disponibles';
   $('productGrid').innerHTML=list.map(card).join('')||'<div class="empty">Pronto tendremos novedades.</div>';
   return;
 }
 const t=$('search')?.value.trim().toLowerCase()||'',cat=$('category')?.value||'',sort=$('sort')?.value||'newest';
 if(t)list=list.filter(p=>C.matchesSearch(C.productSearchText(p),t));
 if($('onlyAvailable')?.checked)list=list.filter(p=>p.stock>0);
 if(cat)list=list.filter(p=>cat===bestSellersCategory?p.bestSeller:p.category===cat);
 if(sort==='priceAsc')list.sort((a,b)=>C.unitPrice(a,1)-C.unitPrice(b,1));
 else if(sort==='priceDesc')list.sort((a,b)=>C.unitPrice(b,1)-C.unitPrice(a,1));
 else if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es'));
 else if(sort==='available')list.sort((a,b)=>(b.stock>0)-(a.stock>0)||C.recentFirst(a,b));
 else list.sort(C.recentFirst);
 if($('resultsCount'))$('resultsCount').textContent=`${list.length} ${list.length===1?'producto':'productos'}`;
 updateCategoryShortcuts();
 $('productGrid').innerHTML=list.slice(0,visible).map(card).join('')||'<div class="empty catalog-empty"><strong>No encontramos productos con esos filtros.</strong><p>Probá con nombre, marca, modelo o código.</p><button type="button" class="btn outline" data-reset-filters>Ver todo el catálogo</button></div>';
 $('showMore')?.classList.toggle('hidden',list.length<=visible);
}
function open(id){
 const p=products.find(x=>x.id===id);if(!p)return;currentId=id;
 detailTrigger=document.activeElement;
 const images=galleryOf(p).length?galleryOf(p):[imgFallback];
 const unit=C.unitPrice(p,1),reduced=unit<p.price;
 const amount=reduced?`<div class="product-price detail-price is-promo"><span class="price-previous">Antes <s>${C.money(p.price)}</s></span><span class="price-line"><strong class="price-current">${C.money(unit)}</strong><span class="offer-badge">Oferta</span></span></div>`:`<div class="product-price detail-price"><strong class="price-current">${C.money(unit)}</strong></div>`;
 const detailText=String(p.description||'').trim()
   ?`<section class="gc-product-description"><h4>Descripción del producto</h4><p>${safe(p.description.trim())}</p></section>`:'';
 const specs=C.cleanDetails(p.details);
 const specRows=[];
 const feature=(label,value)=>{if(value!==''&&value!==undefined&&value!==null)specRows.push(`<div class="gc-spec-row"><dt>${safe(label)}</dt><dd>${safe(value)}</dd></div>`);};
 if(p.colors?.trim())feature('Color',p.colors.trim());
 if(specs.weight)feature('Peso',specs.weight+' '+(specs.weightUnit||'kg'));
 const measureUnit=specs.measureUnit||'cm';
 if(specs.width)feature('Ancho',specs.width+' '+measureUnit);
 if(specs.height)feature('Alto',specs.height+' '+measureUnit);
 if(specs.length)feature('Largo',specs.length+' '+measureUnit);
 feature('Tamaño',specs.size||'');
 feature('Material',specs.material||'');
 feature('Modelo',specs.model||'');
 feature('Marca',specs.brand||'');
 feature('Voltaje de entrada',specs.voltage||'');
 feature('Corriente de entrada',specs.current||'');
 feature('Potencia',specs.power||'');
 feature('Conexión',specs.connection||'');
 feature('Tecnología',specs.technology||'');
 feature('Incluye',specs.included||'');
 feature('Compatibilidad',specs.compatibility||'');
 const references=specs.references?.length?`<div class="detail-references"><span>Ficha técnica consultada</span>${specs.references.map(ref=>`<a href="${escapeAttr(ref.url)}" target="_blank" rel="noopener noreferrer">${safe(ref.title)} ↗</a>`).join('')}</div>`:'';
 const technical=specRows.length||references?`<section class="gc-product-specifications"><h4>${specRows.length?'Características':'Fuente de la descripción'}</h4>${specRows.length?`<dl>${specRows.join('')}</dl>`:''}${references}</section>`:'';
 const promotion=p.promoText?`<div class="promo-note">${safe(p.promoText)}</div>`:'';
 const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';
 const navigation=images.length>1?`<button class="detail-gallery-arrow previous" type="button" data-gallery-step="-1" aria-label="Ver foto anterior">${arrow}</button><button class="detail-gallery-arrow next" type="button" data-gallery-step="1" aria-label="Ver foto siguiente">${arrow}</button>`:'';
 const thumbs=images.length>1?`<div class="detail-gallery-meta"><span>Fotos del producto</span><span id="detailPhotoCount" aria-live="polite" aria-atomic="true">1 de ${images.length}</span></div><div class="detail-thumbs" role="group" aria-label="Elegir foto del producto">${images.map((u,i)=>`<button type="button" class="detail-thumb ${i===0?'active':''}" data-photo-index="${i}" aria-pressed="${i===0}" aria-label="Ver foto ${i+1} de ${images.length}"><img loading="lazy" decoding="async" src="${escapeAttr(normalize(u))}" alt="" onerror="this.onerror=null;this.src='${imgFallback}'"></button>`).join('')}</div>`:'';
 const paymentNote=p.codAllowed?`<strong>Admite pago al recibir</strong><span>Compra mínima de ${C.money(settings.codMinimum??config.codMinimum)} en productos elegibles.</span>`:'<strong>Transferencia o Tigo Money</strong><span>Este producto no admite pago al recibir.</span>';
 const extra=detailText||technical?`<div class="detail-extra ${detailText&&technical?'has-both':''}">${detailText}${technical}</div>`:'';
 const cartIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01M14 7v6M11 10h6"/></svg>';
 $('detailContent').innerHTML=`<div class="detail"><div class="detail-media"><div class="detail-main"><img id="detailPhoto" src="${escapeAttr(normalize(images[0]))}" alt="${safe(p.name)} — Foto 1 de ${images.length}">${navigation}</div>${thumbs}</div><div class="detail-info"><div class="detail-topline"><div class="category">${safe(p.category)}</div><span class="detail-stock ${p.stock?'':'sold-out'}">${p.stock?`${p.stock} disponible${p.stock===1?'':'s'}`:'Agotado'}</span></div><h3 id="detailTitle">${safe(p.name)}</h3>${amount}${promotion}<div class="detail-payment-note"><span class="detail-payment-symbol" aria-hidden="true">${p.codAllowed?'✓':'i'}</span><div>${paymentNote}</div></div><div class="detail-buttons"><button class="btn" id="detailAdd" type="button" ${p.stock?'':'disabled'}>${cartIcon}<span>${p.stock?'Agregar al carrito':'Sin existencias'}</span></button><button class="btn outline" id="detailWA" type="button">Consultar por WhatsApp</button></div><button class="detail-share" id="detailShare" type="button">Compartir este producto ↗</button></div>${extra}</div>`;
 const photo=$('detailPhoto'),media=$('detailContent').querySelector('.detail-media');
 const photoFallback=()=>{photo.onerror=()=>{photo.onerror=null;photo.src=imgFallback}};
 photoFallback();
 let photoIndex=0;
 const showPhoto=index=>{
  photoIndex=(index+images.length)%images.length;
  photoFallback();photo.src=normalize(images[photoIndex]);photo.alt=`${p.name} — Foto ${photoIndex+1} de ${images.length}`;
  if($('detailPhotoCount'))$('detailPhotoCount').textContent=`${photoIndex+1} de ${images.length}`;
  media.querySelectorAll('.detail-thumb').forEach((button,i)=>{button.classList.toggle('active',i===photoIndex);button.setAttribute('aria-pressed',String(i===photoIndex))});
  const strip=media.querySelector('.detail-thumbs'),selected=strip?.children[photoIndex];
  if(selected){const a=selected.getBoundingClientRect(),b=strip.getBoundingClientRect();if(a.left<b.left)strip.scrollLeft+=a.left-b.left-3;else if(a.right>b.right)strip.scrollLeft+=a.right-b.right+3;}
 };
 media.querySelectorAll('.detail-thumb').forEach(button=>button.addEventListener('click',()=>showPhoto(Number(button.dataset.photoIndex))));
 media.querySelectorAll('[data-gallery-step]').forEach(button=>button.addEventListener('click',()=>showPhoto(photoIndex+Number(button.dataset.galleryStep))));
 media.addEventListener('keydown',event=>{if(images.length>1&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();showPhoto(photoIndex+(event.key==='ArrowRight'?1:-1))}});
 $('detailAdd').onclick=()=>{add(id);close('detailOverlay')};
 $('detailWA').onclick=()=>window.open('https://wa.me/'+config.whatsapp+'?text='+encodeURIComponent('Hola Gamer Comayagua, quiero consultar por '+p.name),'_blank','noopener');
 $('detailShare').onclick=()=>shareCatalogLink(p.name+' | Gamer Comayagua',catalogUrl(p.id));
 $('detailOverlay').hidden=false;$('detailContent').scrollTop=0;document.body.style.overflow='hidden';
 $('detailOverlay').querySelector('[data-close]').focus({preventScroll:true});
}
function add(id){const p=products.find(x=>x.id===id);if(!p||p.stock<=0)return toast('Producto agotado');if((cart[id]||0)>=p.stock)return toast('No hay más unidades disponibles');cart[id]=(cart[id]||0)+1;cleanItems();toast('Producto agregado al carrito');}
function close(overlay){const el=$(overlay);if(!el||el.hidden)return;el.hidden=true;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';if(overlay==='detailOverlay'&&detailTrigger?.isConnected){detailTrigger.focus({preventScroll:true});detailTrigger=null;}}
function cartOpen(){$('toast').style.display='none';$('cartOverlay').hidden=false;document.body.style.overflow='hidden';cartRender();}
function cartRender(){const rows=items();$('cartLines').innerHTML=rows.length?rows.map(({product:p,qty})=>`<div class="cart-line"><img src="${escapeAttr(pic(p))}" onerror="this.onerror=null;this.src='${imgFallback}'" alt=""><div><strong>${safe(p.name)}</strong><p>${C.money(C.unitPrice(p,qty))} × ${qty}</p><strong>${C.money(qty*C.unitPrice(p,qty))}</strong></div><div class="actions"><button data-qty="${escapeAttr(p.id)}" data-step="-1" title="Restar" aria-label="Restar una unidad de ${escapeAttr(p.name)}">−</button><b>${qty}</b><button data-qty="${escapeAttr(p.id)}" data-step="1" title="Sumar" aria-label="Sumar una unidad de ${escapeAttr(p.name)}" ${qty>=p.stock?'disabled':''}>+</button><button data-remove="${escapeAttr(p.id)}" title="Eliminar" aria-label="Eliminar ${escapeAttr(p.name)}">×</button></div></div>`).join(''):'<div class="empty">El carrito está vacío.</div>';$('checkoutControls').classList.toggle('hidden',!rows.length);calc();}
function calc(){
 const selection=document.querySelector('[name=payMethod]:checked')?.value||'transfer';
 const q=C.quote(items(),selection,settings,checkoutDelivery);latest=q;renderDeliveryChoice(q.delivery);
 const n=$('deniedNotice');n.classList.toggle('hidden',!(selection==='cod'&&!q.codAllowed));n.textContent=q.reasons.join(' ');
 const showFee=q.mode==='cod'||q.mode==='tigo',pickup=q.delivery.mode==='pickup';
 $('checkoutTotals').innerHTML=q.delivery.valid?`<div class="totals"><div class="total-row"><span>Productos</span><strong>${C.money(q.subtotal)}</strong></div><div class="total-row"><span>${safe(q.delivery.label)}</span><strong>${C.money(q.shipping)}</strong></div>${showFee?`<div class="total-row"><span>${q.mode==='cod'?'Comisión por pagar al recibir':'Comisión de Tigo Money'}</span><strong>${C.money(q.fee)}</strong></div>`:''}<div class="total-row big"><span>Total</span><strong>${C.money(q.total)}</strong></div>${q.mode==='cod'?`<div class="payment-split"><div class="deposit-row"><span>Anticipo a depositar</span><strong>${C.money(q.deposit)}</strong><small>${q.shipping?'Envío + comisión':'Comisión'}</small></div><div class="cash-row"><span>${pickup?'Al retirar':'Al recibir'}</span><strong>${C.money(q.balance)}</strong><small>En efectivo</small></div></div>`:''}</div>`:'<p class="payment-helper">Completá el costo de envío para calcular el total de esta cotización.</p>';
 if($('codDepositHelp')){$('codDepositHelp').hidden=selection!=='cod';$('codDepositHelp').textContent=pickup?'Depositá el anticipo y pagá el saldo al retirar en tienda.':'Depositá el anticipo y pagá el saldo al recibir tu pedido.';}
 const disabled=!q.delivery.valid||(selection==='cod'&&!q.codAllowed);$('sendQuote').disabled=disabled;$('printQuote').disabled=disabled;
 renderPaymentDetails();renderCodAvailability(q);
}
function resetDeliveryChoice(){
 checkoutDelivery={mode:'national',amount:'',note:''};try{sessionStorage.removeItem('gc_delivery')}catch{}
}
function deliveryChanged(){
 checkoutDelivery={mode:document.querySelector('[name=deliveryMethod]:checked')?.value||'national',amount:$('deliveryAmount')?.value||'',note:($('deliveryNote')?.value||'').slice(0,120)};
 try{sessionStorage.setItem('gc_delivery',JSON.stringify(checkoutDelivery))}catch{}
 calc();
}
function renderDeliveryChoice(option){
 if(!$('deliveryOptions'))return;
 document.querySelectorAll('[name=deliveryMethod]').forEach(input=>input.checked=input.value===checkoutDelivery.mode);
 if($('deliveryAmount').value!==String(checkoutDelivery.amount))$('deliveryAmount').value=checkoutDelivery.amount;
 if($('deliveryNote').value!==checkoutDelivery.note)$('deliveryNote').value=checkoutDelivery.note;
 $('deliveryLocalFields').hidden=checkoutDelivery.mode!=='local';$('deliveryAmount').disabled=checkoutDelivery.mode!=='local';
 $('deliveryFreeFields').hidden=checkoutDelivery.mode!=='free';$('deliveryNote').disabled=checkoutDelivery.mode!=='free';
 $('deliveryNationalPrice').textContent=C.money(settings.shipping??config.shipping);
 $('deliveryError').hidden=option.valid;$('deliveryError').textContent=option.error;
 $('deliveryAmount').setAttribute('aria-invalid',String(!option.valid&&checkoutDelivery.mode==='local'));
}
function deliveryOptionsForm(){
 const host=$('checkoutControls');if(!host||$('deliveryOptions'))return;
 host.insertAdjacentHTML('afterbegin',`<fieldset class="delivery-options" id="deliveryOptions"><legend>Entrega y envío</legend><p class="delivery-intro">Elegí cómo se entregará este pedido.</p><div class="delivery-methods"><label class="delivery-method"><input type="radio" name="deliveryMethod" value="national" checked><span><strong>Envío nacional</strong><small id="deliveryNationalPrice">${C.money(settings.shipping??config.shipping)}</small></span></label><label class="delivery-method"><input type="radio" name="deliveryMethod" value="local"><span><strong>Comayagua</strong><small>Costo acordado</small></span></label><label class="delivery-method"><input type="radio" name="deliveryMethod" value="pickup"><span><strong>Retiro en tienda</strong><small>Sin costo de envío</small></span></label><label class="delivery-method"><input type="radio" name="deliveryMethod" value="free"><span><strong>Envío gratis</strong><small>Acordado con la tienda</small></span></label></div><div class="delivery-extra" id="deliveryLocalFields" hidden><label for="deliveryAmount">Costo de envío en Comayagua (L)</label><input class="field" id="deliveryAmount" type="number" min="0" max="1000000" step="1" inputmode="numeric" placeholder="Escribí el costo acordado" aria-describedby="deliveryAmountHelp deliveryError" disabled><small id="deliveryAmountHelp">Podés ingresar 0 para una entrega sin costo.</small></div><div class="delivery-extra" id="deliveryFreeFields" hidden><label for="deliveryNote">Motivo del envío gratis <span>(opcional)</span></label><input class="field" id="deliveryNote" maxlength="120" placeholder="Compra grande, entrega en mi ruta…" aria-describedby="deliveryFreeHelp" disabled><small id="deliveryFreeHelp">El envío gratis se confirma con la tienda.</small></div><p class="delivery-error" id="deliveryError" role="alert" hidden></p></fieldset>`);
 host.querySelectorAll('[name=deliveryMethod]').forEach(input=>input.addEventListener('change',deliveryChanged));
 $('deliveryAmount').addEventListener('input',deliveryChanged);$('deliveryNote').addEventListener('input',deliveryChanged);
}
function renderPaymentTerms(){
 if($('codMinimumNote'))$('codMinimumNote').textContent=`Mínimo ${C.money(settings.codMinimum??config.codMinimum)} en productos`;
 document.querySelectorAll('[data-shipping-price]').forEach(el=>el.textContent=C.money(settings.shipping??config.shipping));
 renderShippingEstimate();
}
function renderShippingEstimate(){
 const target=$('shippingEstimate');if(!target)return;
 const input=$('estimateSubtotal'),value=Number(input.value);
 if(!Number.isFinite(value)||value<=0||value>1000000){target.textContent='Ingresá un importe de productos mayor que cero.';return;}
 const mode=$('estimateMethod').value;
 const q=C.quote([{product:{name:'Productos del ejemplo',price:value,stock:1,active:true,codAllowed:true},qty:1}],mode,settings);
 const line=(label,amount)=>`<div class="estimate-row"><span>${label}</span><strong>${C.money(amount)}</strong></div>`;
 target.innerHTML=line('Productos',q.subtotal)+line('Envío con empaque',q.shipping)+((mode==='cod'||mode==='tigo')?line(mode==='tigo'?'Comisión Tigo Money':'Comisión por pagar al recibir',q.fee):'')+`<div class="estimate-total"><span>Total de la compra</span><strong>${C.money(q.total)}</strong></div>`+(mode==='cod'?q.codAllowed?`<div class="estimate-split"><div><span>Depositás antes del envío</span><strong>${C.money(q.deposit)}</strong><small>Envío + comisión</small></div><div><span>Pagás al recibir</span><strong>${C.money(q.balance)}</strong><small>En efectivo</small></div></div>`:`<p class="warning">${safe(q.reasons.join(' '))}</p>`:'<p class="estimate-note">Pago completo antes de despachar el pedido.</p>');
}
function deliveryData(){
 const data={};for(const key of ['name','phone','department','city','address'])data[key]=String($('delivery_'+key)?.value||'').trim().slice(0,key==='address'?350:120);
 return data;
}
function shippingForm(){
 const host=document.querySelector('.order-products');if(!host||$('deliveryFields'))return;
 const field=(key,label,autocomplete,placeholder)=>`<label>${label}<input class="field" id="delivery_${key}" maxlength="120" autocomplete="${autocomplete}" placeholder="${placeholder}" ${key==='phone'?'type="tel" inputmode="tel"':''}></label>`;
 host.insertAdjacentHTML('beforeend',`<details class="delivery-fields" id="deliveryFields"><summary>Datos del cliente o entrega <span>Opcional</span></summary><p>Agregalos para incluirlos en tu cotización de WhatsApp.</p><div>${field('name','Nombre','shipping name','Quien recibe el paquete')}${field('phone','Celular','shipping tel','Ej. 9999-9999')}${field('department','Departamento','shipping address-level1','Ej. Comayagua')}${field('city','Municipio / ciudad','shipping address-level2','Lugar de entrega')}<label class="delivery-address">Dirección y referencia<textarea class="field" id="delivery_address" maxlength="350" autocomplete="shipping street-address" placeholder="Barrio, colonia, casa y punto de referencia"></textarea></label></div></details>`);
}
function renderCodAvailability(q){
 const el=$('codAvailability');if(!el)return;
 el.hidden=!q.units;el.classList.toggle('cod-pending',!q.codAllowed);
 if(el.hidden)return;
 const min=C.num(settings.codMinimum??config.codMinimum),remaining=Math.max(0,min-q.subtotal);
 if(q.codAllowed){el.innerHTML=`<span class="cod-check" aria-hidden="true">✓</span><div><strong>Pago al recibir disponible</strong><small>Tu pedido cumple el mínimo de ${C.money(min)} en productos.</small></div>`;return;}
 const restricted=q.valid.some(line=>!line.product.codAllowed);
 if(restricted){
  el.innerHTML='<div><strong>Este pedido requiere pago anticipado</strong><small>Incluye productos que no admiten pago al recibir. Podés elegir transferencia o Tigo Money.</small></div>';
 }else if(remaining>0){
  el.innerHTML=`<div><strong>Te faltan ${C.money(remaining)} para pagar al recibir</strong><small>El mínimo es ${C.money(min)} en productos, después de descuentos.</small><progress max="${min}" value="${Math.min(q.subtotal,min)}" aria-label="Avance hacia la compra mínima para pagar al recibir"></progress></div>`;
 }else el.innerHTML='<div><strong>Revisá las existencias de tu pedido</strong><small>Hay productos sin cantidad suficiente para esta modalidad.</small></div>';
}
function renderPaymentDetails(){
 const target=$('tigoPaymentDetails');
 if(!target)return;
 const selected=document.querySelector('[name=payMethod]:checked')?.value==='tigo';
 target.hidden=!selected;
 document.querySelector('#checkoutControls .bank-cart-link')?.classList.toggle('hidden',selected);
 if(!selected)return;
 const account=banks.find(x=>{
  const name=String(x.bank||'').toLowerCase().replace(/[^a-z]/g,'');
  return C.yes(x.visible)&&String(x.account||'').trim()&&(name==='tigo'||name.includes('tigomoney'));
 });
 const heading='<div class="tigo-payment-head"><svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 18h2"/></svg><strong>Tigo Money</strong></div>';
 if(account){
  const row=(label,value,number=false)=>!String(value||'').trim()?'':`<div class="tigo-payment-row ${number?'tigo-number':''}"><dt>${safe(label)}</dt><dd><strong>${safe(value)}</strong><button type="button" class="tigo-copy" data-copy="${escapeAttr(value)}" data-label="${escapeAttr(label)}" aria-label="Copiar ${escapeAttr(label)}">Copiar</button></dd></div>`;
  target.innerHTML=heading+`<dl class="tigo-payment-data">${row('Nombre del titular',account.owner)}${row('Número de Tigo Money',account.account,true)}${row('Número de identidad',account.identity)}</dl>`;
  return;
 }
 if(banksStatus==='idle')loadBanksFromSheet();
 if(banksStatus==='loading'){
  target.innerHTML=heading+'<p class="tigo-payment-message">Consultando datos de Tigo Money…</p>';
 }else{
  const phone=String(settings.whatsapp||config.whatsapp).replace(/\D/g,'');
  target.innerHTML=heading+'<p class="tigo-payment-message">Los datos de Tigo Money no están disponibles. Confirmalos antes de pagar.</p>'+`<a class="tigo-contact" href="https://wa.me/${phone}?text=${encodeURIComponent('Hola Gamer Comayagua, necesito el nombre, número e identidad para pagar con Tigo Money.')}" target="_blank" rel="noopener">Solicitar datos por WhatsApp →</a>`;
 }
}
function prepareQuote(){calc();if(!latest.delivery.valid){toast(latest.delivery.error);$('deliveryAmount')?.focus();return null}if(!latest.valid.length){toast('Agregá productos');return null}if(latest.mode==='cod'&&!latest.codAllowed){toast('Pago al recibir no disponible para esta compra');return null}currentQuoteId=C.number();return {id:currentQuoteId,text:C.waMessage(items(),latest,currentQuoteId,deliveryData()),q:latest};}
function waQuote(){const q=prepareQuote();if(!q)return;window.open('https://wa.me/'+String(settings.whatsapp||config.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent(q.text),'_blank','noopener');}
function printQuote(){
 const prepared=prepareQuote();if(!prepared)return;
 const q=prepared.q,uid=prepared.id,entries=items(),labels={transfer:'Transferencia / depósito',tigo:'Tigo Money',cod:'Pagar al recibir'};
 const rows=entries.map(({product:p,qty},i)=>`<tr><td><span class="sku">${String(i+1).padStart(2,'0')}</span> ${safe(p.name)}</td><td>${qty}</td><td>${C.money(C.unitPrice(p,qty))}</td><td class="right">${C.money(qty*C.unitPrice(p,qty))}</td></tr>`).join('');
 const line=(name,val,highlight=false)=>`<div class="sumrow ${highlight?'highlight':''}"><span>${safe(name)}</span><b>${C.money(val)}</b></div>`;
 const fees=q.mode==='tigo'?line('Comisión Tigo Money',q.fee):q.mode==='cod'?line('Comisión pago al recibir',q.fee):'';
 const balances=q.mode==='cod'?line('ANTICIPO A DEPOSITAR',q.deposit)+line(q.delivery.mode==='pickup'?'SALDO EN EFECTIVO AL RETIRAR':'SALDO EN EFECTIVO AL RECIBIR',q.balance):'';
 const destination=deliveryData(),deliveryRows=[['name','Nombre'],['phone','Celular'],['department','Departamento'],['city','Municipio / ciudad'],['address','Dirección']].filter(([key])=>destination[key]).map(([key,label])=>`<p><b>${label}:</b> ${safe(destination[key])}</p>`).join('');
 const deliverySection=`<section class="quote-delivery"><h3>Entrega del pedido</h3><p><b>Modalidad:</b> ${safe(q.delivery.label)}</p>${q.delivery.note?`<p><b>Motivo del envío gratis:</b> ${safe(q.delivery.note)}</p>`:''}${deliveryRows}</section>`;
 const date=new Date().toLocaleString('es-HN',{dateStyle:'full',timeStyle:'short'});
 const logo=safe(new URL(config.logo,document.baseURI).href);
 const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${uid} - Gamer Comayagua</title><style>@page{size:A4;margin:17mm}*{box-sizing:border-box}body{max-width:850px;margin:25px auto;padding:0 20px;color:#172b46;font:14px/1.55 Arial,sans-serif}header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;border-bottom:4px solid #1269d9;padding-bottom:24px}.quote-brand{display:flex;align-items:center;gap:16px}.quote-logo{width:92px;height:92px;object-fit:contain;flex:none}.name{font-weight:900;color:#1068d7;font-size:27px;line-height:1.1;letter-spacing:-1px}header p{margin:7px 0;color:#667b92}.flag{font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#4875a9}.meta{text-align:right}.folio{font-size:18px;font-weight:800;color:#122842}.intro{display:flex;justify-content:space-between;gap:20px;padding:26px 0}h2{margin:0 0 10px;font-size:19px}table{width:100%;border-collapse:collapse}thead th{background:#e9f1fb;color:#244267;text-align:left;font-size:12px;padding:12px 10px}tbody td{border-bottom:1px solid #e3eaf2;padding:12px 10px}tbody td:nth-child(2),tbody td:nth-child(3){white-space:nowrap}.right{text-align:right;white-space:nowrap}.sku{font-size:11px;color:#8aa0b8;padding-right:4px}.bottom{display:flex;justify-content:flex-end;margin-top:24px}.totals{width:min(370px,100%);background:#f3f7fc;border-radius:12px;padding:15px 19px}.sumrow{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px solid #dee8f3}.sumrow:last-child{border-bottom:0}.sumrow.highlight{font-size:18px;font-weight:850;color:#075bc1;border-top:2px solid #a5c6ef;padding-top:12px}.quote-delivery{font-size:12px;border:1px solid #dce4ed;border-radius:8px;padding:10px 14px;margin:15px 0;break-inside:avoid}.quote-delivery h3{margin:0 0 8px;font-size:13px}.quote-delivery p{margin:4px 0;overflow-wrap:anywhere}.footer{border-top:1px solid #cddceb;margin-top:48px;padding-top:14px;font-size:12px;color:#667b92}.stamp{margin-top:18px;color:#466b9b;font-size:12px}.print{position:fixed;top:10px;right:10px;background:#146fe3;color:white;border:0;border-radius:9px;font-weight:bold;padding:10px 16px;cursor:pointer}@media screen and (max-width:600px){body{margin:0;padding:20px 16px}header{flex-wrap:wrap}.quote-brand{width:100%;gap:12px}.quote-brand>div{min-width:0}.quote-logo{width:72px;height:72px}.name{font-size:23px;letter-spacing:-.5px}.meta{width:100%;text-align:left;border-top:1px solid #e3eaf2;padding-top:12px}.folio{font-size:15px;overflow-wrap:anywhere}.intro{flex-wrap:wrap;gap:14px}thead th,tbody td{padding:10px 6px;font-size:12px}.print{position:static;margin-bottom:18px}}@media print{body{margin:0;padding:0}.print{display:none}}</style></head><body><button class="print" onclick="window.print()">Imprimir / Guardar PDF</button><header><div class="quote-brand"><img class="quote-logo" src="${logo}" width="92" height="92" alt="Gamer Comayagua, guacamaya roja"><div><div class="name">GAMER COMAYAGUA</div><p>Comayagua · Envíos a toda Honduras</p><p>WhatsApp: +504 3151-7755</p></div></div><div class="meta"><div class="flag">Cotización</div><div class="folio">${uid}</div><p>${safe(date)}</p></div></header><div class="intro"><div><div class="flag">Detalles del pedido</div><h2>Cotización de productos</h2><span>Confirmación de inventario por WhatsApp</span></div><div><div class="flag">Modalidad</div><strong>${safe(labels[q.mode])}</strong></div></div><table><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th class="right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>${deliverySection}<div class="bottom"><div class="totals">${line('Subtotal productos',q.subtotal)}${line(q.delivery.label,q.shipping)}${fees}${line('TOTAL A PAGAR',q.total,true)}${balances}</div></div><div class="footer"><b>Importante:</b> esta cotización no representa confirmación de pago ni reserva automática. Los productos se confirman según existencias.<div class="stamp">GAMER COMAYAGUA · Gracias por elegirnos</div></div><script>window.addEventListener('load',()=>window.print());<\/script></body></html>`;
 const w=window.open('','_blank');if(!w){toast('Permití ventanas emergentes para imprimir');return}w.document.write(html);w.document.close();
}
function handlePublic(data){
 if(!data||data.ok===false||!Array.isArray(data.products))throw Error(data?.error||'Respuesta no válida');
 products=data.products.map(C.cleanProduct).filter(p=>p.id&&p.name);settings={...settings,...data.settings};
 if(Array.isArray(data.banks)&&data.banks.length)banks=data.banks;
 renderPaymentTerms();renderCategories();render();cleanItems();renderBanks();renderPaymentDetails();
 if($('cartOverlay')&&!$('cartOverlay').hidden)cartRender();
 if($('syncStatus')){$('syncStatus').textContent='Catálogo actualizado';$('syncStatus').style.color='#6f7f92';}
 openLinkedProduct();
}

function openLinkedProduct(){
 if(!linkedProductOpened&&linkedProductId&&$('detailOverlay')&&products.some(p=>p.id===linkedProductId&&p.active)){
  linkedProductOpened=true;open(linkedProductId);
 }
}

/** Lee exclusivamente CATALOGO PUBLICO WEB, con encabezados públicos comprobados. */
function catalogFromSheet(){
 return new Promise((resolve,reject)=>{
  const id=String(config.spreadsheetUrl||'').match(/\/spreadsheets\/d\/([\w-]+)/)?.[1],gid=config.publicCatalogGid;
  if(!id||!Number.isInteger(gid))return reject(Error('No hay pestaña pública configurada'));
  const headers=['ID','Codigo','Nombre','Categoria','Precio','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Colores','PrecioPromocion','PromocionTexto','Detalles'];
  const callback='gcCatalogSheet_'+Date.now()+'_'+Math.floor(Math.random()*100000),script=document.createElement('script');
  let ended=false;
  const finish=(error,data)=>{if(ended)return;ended=true;clearTimeout(timer);delete window[callback];script.remove();error?reject(error):resolve(data)};
  const timer=setTimeout(()=>finish(Error('La hoja pública no respondió')),12000);
  window[callback]=data=>{
   try{
    if(data?.status!=='ok'||!Array.isArray(data.table?.rows)||!Array.isArray(data.table?.cols))throw Error('Catálogo público no disponible');
    const labels=data.table.cols.map(column=>column.label),extra=['MasPedidos','FechaCreacion'];
    if(labels.length<headers.length||labels.some((label,i)=>label!==(headers.concat(extra))[i]))throw Error('Encabezados del catálogo público no válidos');
    const rows=data.table.rows.map(row=>Object.fromEntries(labels.map((header,i)=>[header,row.c?.[i]?.v??''])));
    const hasMarks=labels.includes('MasPedidos'),hasDates=labels.includes('FechaCreacion');
    finish(null,{ok:true,...(hasMarks&&hasDates?{catalogSchemaVersion:2}:{}),products:rows.map((row,i)=>{
     const product=C.cleanProduct(row,i);
     if(!hasMarks)delete product.bestSeller;
     if(!hasDates)delete product.createdAt;
     return product;
    })});
   }catch(error){finish(error)}
  };
  script.onerror=()=>finish(Error('Sin acceso al catálogo público'));
  script.onload=()=>{if(!ended)finish(Error('Google no devolvió el catálogo público'))};
  const query='select * where A is not null limit 500';
  script.src='https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?gid='+gid+'&headers=1&tq='+encodeURIComponent(query)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+callback)+'&t='+Date.now();
  document.head.appendChild(script);
 });
}

function refreshOnlineCatalog(force=false){
 if(onlineRequest){if(force)pendingOnlineRefresh=true;return onlineRequest;}
 lastOnlineCheck=Date.now();
 onlineRequest=(async()=>{
  let sheetData=null,apiData=null,ready=false;
  const sheetTask=catalogFromSheet().then(data=>{sheetData=data;handlePublic(C.mergeCatalog(sheetData,apiData||{products}));ready=true});
  const apiTask=(async()=>{
   const url=String(config.apiUrl||'').trim();if(!url)return;
   let data;try{data=await jsonp(url)}catch(error){
    data=await catalogByPost(url);
   }
   apiData=data;handlePublic(sheetData?C.mergeCatalog(sheetData,apiData):data);ready=true;
  })();
  await Promise.allSettled([sheetTask,apiTask]);
  if(!ready&&$('syncStatus'))$('syncStatus').textContent=products.length?'Confirmá precio y existencias por WhatsApp.':'No se pudo actualizar el catálogo. Recargá la página.';
  return ready;
 })().finally(()=>{onlineRequest=null;if(pendingOnlineRefresh){pendingOnlineRefresh=false;refreshOnlineCatalog();}});
 return onlineRequest;
}
function renderBanks(){if(!$('bankAccounts'))return;const published=banks.filter(x=>C.yes(x.visible)&&String(x.account||'').trim());const copyRow=(label,value)=>!String(value||'').trim()?'':`<div class="bank-copy-row" role="button" tabindex="0" data-copy="${escapeAttr(value)}" data-label="${escapeAttr(label)}" aria-label="Copiar ${escapeAttr(label)}"><div><small>${safe(label)}</small><strong>${safe(value)}</strong></div><button type="button" class="copy-btn" data-copy="${escapeAttr(value)}" data-label="${escapeAttr(label)}" aria-label="Copiar ${escapeAttr(label)}">Copiar</button></div>`;$('bankAccounts').innerHTML=published.length?published.map(x=>`<article class="bank-card"><div class="bank-card-head"><div class="bank-symbol">▣</div><div><div class="eyebrow">Cuenta para depósitos</div><h3>${safe(x.bank||'Banco')}</h3></div></div>${copyRow('Nombre del titular',x.owner)}${copyRow('Número de cuenta',x.account)}${copyRow('Número de identidad',x.identity)}</article>`).join(''):`<div class="bank-empty"><div class="bank-symbol">▣</div><h3>Cuentas no disponibles en este momento</h3><p>Solicitá por WhatsApp los datos para transferir y confirmalos antes de pagar.</p><a class="btn outline" href="https://wa.me/${String(settings.whatsapp||config.whatsapp).replace(/\D/g,'')}?text=${encodeURIComponent('Hola Gamer Comayagua, necesito los datos para depositar mi pedido.')}" target="_blank" rel="noopener">Solicitar datos por WhatsApp</a></div>`;}
async function copyText(value){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}}catch{}const input=document.createElement('textarea');input.value=value;input.setAttribute('readonly','');input.style.cssText='position:fixed;top:-1000px;left:-1000px';document.body.append(input);input.select();let ok=false;try{ok=document.execCommand('copy')}catch{}input.remove();return ok;}

/* Respaldo bancario dinámico: consulta SOLO la pestaña Cuentas. Nunca incrusta
   números de cuenta o identidad dentro de este repositorio público. */
function banksFromSheet(){
 return new Promise((resolve,reject)=>{
  const url=String(config.spreadsheetUrl||'');
  const match=url.match(/\/spreadsheets\/d\/([\w-]+)/);
  if(!match)return reject(Error('No hay Google Sheets configurado'));
  const cb='gcBankSheet_'+Date.now()+'_'+Math.floor(Math.random()*100000);
  const script=document.createElement('script');
  let ended=false;
  const finish=(err,result)=>{if(ended)return;ended=true;clearTimeout(timer);try{delete window[cb]}catch{}script.remove();err?reject(err):resolve(result)};
  const timer=setTimeout(()=>finish(Error('Tiempo agotado consultando cuentas')),11000);
  window[cb]=result=>{
   try{
    if(result?.status&&result.status!=='ok')throw Error('No se pudo consultar la pestaña Cuentas');
    const cells=result?.table?.rows;
    if(!Array.isArray(cells))throw Error('Tabla de cuentas no disponible');
    const str=c=>c?.f!=null?String(c.f):c?.v!=null?String(c.v):'';
    const resultBanks=cells.map(row=>{
     const r=row?.c||[];
     return {bank:str(r[0]),owner:str(r[1]),account:str(r[2]),identity:str(r[3]),visible:str(r[4])};
    }).filter(x=>C.yes(x.visible)&&x.account.trim());
    finish(null,resultBanks);
   }catch(error){finish(error)}
  };
  script.onerror=()=>finish(Error('Sin acceso de lectura a Google Sheets'));
  const query='out:json;responseHandler:'+cb;
  script.src='https://docs.google.com/spreadsheets/d/'+match[1]+'/gviz/tq?gid=523704562&tqx='+encodeURIComponent(query)+'&t='+Date.now();
  document.head.appendChild(script);
 });
}
function loadBanksFromSheet(){
 if(!$('bankAccounts')&&!$('tigoPaymentDetails'))return;
 if(banksRequest)return banksRequest;
 banksStatus='loading';
 banksRequest=(async()=>{
  try{banks=await banksFromSheet();banksStatus='ready';renderBanks();}
  catch(err){banksStatus='failed';console.warn('Cuentas bancarias: revisar publicación del Sheet o Apps Script',err);if(!banks.length)renderBanks();}
  finally{renderPaymentDetails();}
 })();
 return banksRequest;
}
function jsonp(url){return new Promise((resolve,reject)=>{const callback='gcPublic_'+Date.now()+'_'+Math.floor(Math.random()*9999);const script=document.createElement('script');let ended=false,timeout=setTimeout(()=>done(Error('Tiempo de espera agotado')),13000);function done(err,data){if(ended)return;ended=true;clearTimeout(timeout);delete window[callback];script.remove();err?reject(err):resolve(data)}window[callback]=d=>d?.ok===false?done(Error(d.error||'Sin respuesta del catálogo')):done(null,d);script.onerror=()=>done(Error('Sin conexión con Apps Script'));script.onload=()=>{if(!ended)done(Error('Google no devolvió el catálogo'))};script.src=url+(url.includes('?')?'&':'?')+'action=public&callback='+callback+'&t='+Date.now();document.head.appendChild(script)})}
/**
 * Lectura alternativa: algunas implementaciones de Google permiten POST
 * aunque el navegador bloquee la consulta JSONP GET.
 * Solo pide el catálogo PÚBLICO, nunca datos administrativos.
 */
function catalogByPost(url){
 return new Promise((resolve,reject)=>{
  const requestId='pub_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe'),form=document.createElement('form');
  let done=false,timer;
  function finish(err,payload){
   if(done)return;done=true;clearTimeout(timer);
   window.removeEventListener('message',receive);
   frame.remove();form.remove();err?reject(err):resolve(payload);
  }
  function receive(ev){
   const allowed=ev.origin==='null'||/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/i.test(ev.origin);
   if(!allowed)return;
   const data=ev.data;
   if(!data||data.__gcResponse!==true||data.requestId!==requestId)return;
   if(!data.ok)return finish(Error(data.error||'Sin respuesta del catálogo'));
   if(!Array.isArray(data.products))return finish(Error('Respuesta de catálogo incompleta'));
   finish(null,data);
  }
  frame.name='gc_catalog_'+requestId;
  frame.style.cssText='position:absolute;width:0;height:0;visibility:hidden;border:0';
  document.body.appendChild(frame);
  window.addEventListener('message',receive);
  form.action=url;form.method='POST';form.target=frame.name;form.style.display='none';
  const input=document.createElement('input');input.type='hidden';input.name='payload';
  input.value=JSON.stringify({requestId,action:'publicCatalog'});
  form.appendChild(input);document.body.appendChild(form);
  timer=setTimeout(()=>finish(Error('Google no respondió a la consulta pública')),16000);
  try{form.submit()}catch(err){finish(err)}
 });
}
async function load(){
 const url=String(config.apiUrl||'').trim();
 let localReady=false;
 if($('bankAccounts'))loadBanksFromSheet();
 // Render inmediato a partir de un respaldo JS local. Si fetch o Google
 // quedan pendientes, el cliente sigue viendo los productos y puede navegar.
 const initial=window.GC_CATALOGO_INICIAL;
 if(Array.isArray(initial)&&initial.length){
  try{
   products=initial.map(C.cleanProduct).filter(p=>p.id&&p.name);
   renderCategories();render();cleanItems();renderBanks();
   localReady=true;
   if($('syncStatus'))$('syncStatus').textContent='Actualizando catálogo…';
  }catch(error){
   console.warn('No se pudo dibujar el catálogo inicial:',error);
  }
 }
 // Refrescar después con JSON local y, por último, con Google Sheets.
 try{
  const controller=typeof AbortController==='function'?new AbortController():null;
  const stop=controller?setTimeout(()=>controller.abort(),7000):null;
  let data;
  try{
   const response=await fetch('data/catalogo-respaldo.json?actualizado='+Date.now(),{cache:'no-store',...(controller?{signal:controller.signal}:{})});
   if(!response.ok)throw Error('No se pudo abrir el respaldo del catálogo');
   data=await response.json();
  }finally{if(stop!==null)clearTimeout(stop)}
  if(!Array.isArray(data))throw Error('El respaldo tiene un formato inválido');
  products=data.map(C.cleanProduct).filter(p=>p.id&&p.name);
  renderCategories();render();cleanItems();renderBanks();
  localReady=true;
  if($('syncStatus'))$('syncStatus').textContent='Actualizando catálogo…';
 }catch(error){
  console.warn('Respaldo no disponible:',error);
  if($('syncStatus'))$('syncStatus').textContent='No se pudo cargar el respaldo; verificando catálogo en línea…';
 }
 if(!url&&!Number.isInteger(config.publicCatalogGid)){
  if($('syncStatus'))$('syncStatus').textContent=localReady?'Confirmá precio y existencias por WhatsApp.':'No hay conexión configurada con Google Sheets.';
  return;
 }
 await refreshOnlineCatalog();
 openLinkedProduct();
}
function binds(){
 const header=document.querySelector('.header');
 if(header){const measure=()=>document.documentElement.style.setProperty('--catalog-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');measure();if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);else window.addEventListener('resize',measure);}
 shippingForm();deliveryOptionsForm();
 $('estimateSubtotal')?.addEventListener('input',renderShippingEstimate);$('estimateMethod')?.addEventListener('change',renderShippingEstimate);
 const refreshWhenVisible=()=>{if(document.visibilityState==='visible'&&Date.now()-lastOnlineCheck>30000)refreshOnlineCatalog();};
 document.addEventListener('visibilitychange',refreshWhenVisible);
 window.addEventListener('focus',refreshWhenVisible);
 window.addEventListener('storage',event=>{if(event.key==='gc_catalog_revision')refreshOnlineCatalog(true);});
 renderPaymentTerms();
 if($('year'))$('year').textContent=new Date().getFullYear();
 if($('waHero'))$('waHero').href='https://wa.me/'+config.whatsapp+'?text='+encodeURIComponent('Hola, quiero información sobre sus productos.');
 if($('search'))$('search').value=(initialParams.get('buscar')||'').slice(0,180);
 if($('onlyAvailable'))$('onlyAvailable').checked=initialParams.get('disponibles')==='1';
 if($('sort')&&['newest','available','priceAsc','priceDesc','name'].includes(initialParams.get('orden')))$('sort').value=initialParams.get('orden');
 $('search')?.addEventListener('input',filtersChanged);
 $('clearFilters')?.addEventListener('click',resetFilters);
 $('shareCategory')?.addEventListener('click',()=>shareCatalogLink(($('category')?.value===bestSellersCategory?'Más pedidos':$('category')?.value||'Catálogo')+' | Gamer Comayagua',filteredCatalogUrl()));
 $('onlyAvailable')?.addEventListener('change',filtersChanged);
 $('category')?.addEventListener('change',filtersChanged);
 $('bestSellersList')?.addEventListener('click',event=>{const b=event.target.closest('[data-requested-product]');if(b)open(b.dataset.requestedProduct);});
 $('viewBestSellers')?.addEventListener('click',()=>{$('category').value=bestSellersCategory;filtersChanged();$('catalogHeading').scrollIntoView({block:'start',behavior:'smooth'});});
 $('categoryShortcuts')?.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button||!$('category'))return;$('category').value=button.dataset.category;filtersChanged()});
 $('sort')?.addEventListener('change',filtersChanged);
 $('showMore')?.addEventListener('click',()=>{visible+=24;render()});
 $('openCart')?.addEventListener('click',cartOpen);$('mobileCart')?.addEventListener('click',cartOpen);
 $('productGrid')?.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.hasAttribute('data-reset-filters'))resetFilters();if(t.dataset.add)add(t.dataset.add);if(t.dataset.detail)open(t.dataset.detail)});
 document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&$('search')&&!document.querySelector('.overlay:not([hidden])')){event.preventDefault();$('search').focus();$('search').select();}});
 $('cartLines')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.remove){delete cart[b.dataset.remove];cartRender()}else if(b.dataset.qty){const id=b.dataset.qty,p=products.find(x=>x.id===id);cart[id]=Math.min(p.stock,(cart[id]||0)+Number(b.dataset.step));if(cart[id]<=0)delete cart[id];cartRender()}});
 document.querySelectorAll('[name=payMethod]').forEach(e=>e.addEventListener('change',calc));
 $('sendQuote')?.addEventListener('click',waQuote);$('printQuote')?.addEventListener('click',printQuote);$('clearCart')?.addEventListener('click',()=>{cart={};cartRender()});
 document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>close(x.closest('.overlay').id));
 document.querySelectorAll('.overlay').forEach(x=>x.onclick=e=>{if(e.target===x)close(x.id)});
 $('detailOverlay')?.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...$('detailOverlay').querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close('detailOverlay');close('cartOverlay')}});
 const onBankCopy=async b=>{if(!b)return;const ok=await copyText(b.dataset.copy);toast(ok?b.dataset.label+' copiado al portapapeles':'No se pudo copiar. Mantené presionado el dato para copiarlo.');if(ok){const button=b.matches('button')?b:b.querySelector('button');if(button){button.textContent='✓ Copiado';setTimeout(()=>{if(button.isConnected)button.textContent='Copiar'},2000)}}};
 $('bankAccounts')?.addEventListener('click',e=>onBankCopy(e.target.closest('[data-copy]')));
 $('tigoPaymentDetails')?.addEventListener('click',e=>onBankCopy(e.target.closest('[data-copy]')));
 $('bankAccounts')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.bank-copy-row')){e.preventDefault();onBankCopy(e.target)}});
 try{cart=JSON.parse(sessionStorage.getItem('gc_cart')||'{}')||{}}catch{cart={}};
 try{const saved=JSON.parse(sessionStorage.getItem('gc_delivery')||'null');if(Object.keys(cart).length&&saved&&typeof saved==='object'&&['national','local','pickup','free'].includes(saved.mode)){checkoutDelivery={mode:saved.mode,amount:typeof saved.amount==='string'||typeof saved.amount==='number'?String(saved.amount).slice(0,20):'',note:String(saved.note||'').slice(0,120)};}}catch{}

}
try{
 binds();
 load().catch(error=>{
  console.error('No se pudo completar la carga del catálogo:',error);
  if($('syncStatus'))$('syncStatus').textContent='No se pudo actualizar el catálogo. Recargá la página para reintentar.';
  if($('resultsCount')&&$('resultsCount').textContent.includes('Cargando'))$('resultsCount').textContent='Catálogo temporalmente no disponible';
 });
}catch(error){
 console.error('Error al iniciar catálogo:',error);
 if($('syncStatus'))$('syncStatus').textContent='El catálogo no pudo iniciarse. Recargá la página.';
 if($('resultsCount'))$('resultsCount').textContent='No se pudieron mostrar los productos';
}
})();

