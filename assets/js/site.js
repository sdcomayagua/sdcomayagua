
(function(){'use strict';
const C=window.GC,config=window.GC_CONFIG,$=id=>document.getElementById(id);
const imgFallback='assets/img/sin-foto.svg',page=document.body.dataset.page||'inicio';
let products=[],settings={...config},banks=[],cart={},currentId='',visible=24,latest=null,currentQuoteId='';
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
function cleanItems(){for(const [id,n] of Object.entries(cart)){const p=products.find(x=>x.id===id);if(!p||!p.active||p.stock<=0)delete cart[id];else cart[id]=Math.min(Math.max(1,Number(n)||1),p.stock)}try{sessionStorage.setItem('gc_cart',JSON.stringify(cart))}catch{};if($('cartCount'))$('cartCount').textContent=Object.values(cart).reduce((a,b)=>a+b,0);}
function items(){cleanItems();return Object.entries(cart).map(([id,qty])=>({product:products.find(x=>x.id===id),qty:Number(qty)})).filter(x=>x.product)}
function renderCategories(){if(!$('category'))return;const cats=[...new Set(products.filter(p=>p.active).map(p=>p.category))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));const selection=$('category').value;$('category').innerHTML='<option value="">Todas las categorías</option>'+cats.map(x=>`<option value="${escapeAttr(x)}">${safe(x)}</option>`).join('');$('category').value=cats.includes(selection)?selection:'';}
function card(p){
 const offer=C.unitPrice(p,1),reduced=offer<p.price;
 const amount=reduced?`<div class="product-price is-promo"><span class="price-previous">Antes <s>${C.money(p.price)}</s></span><span class="price-line"><strong class="price-current">${C.money(offer)}</strong><span class="offer-badge">Oferta</span></span></div>`:`<div class="product-price"><strong class="price-current">${C.money(p.price)}</strong></div>`;
 return `<article class="product ${p.stock?'':'out'}"><div class="photo"><button type="button" class="photo-open" data-detail="${escapeAttr(p.id)}" aria-label="Ver detalles de ${escapeAttr(p.name)}"><img loading="lazy" decoding="async" src="${escapeAttr(pic(p))}" onerror="this.onerror=null;this.src='${imgFallback}';this.closest('.photo').classList.add('missing-photo')" alt="${safe(p.name)}"></button><span class="tag ${p.stock?'':'out'}">${p.stock?'En stock':'Agotado'}</span></div><div class="product-body"><div class="category">${safe(p.category)}</div><h3>${safe(p.name)}</h3>${amount}${p.promoText?`<div class="promo-note">${safe(p.promoText)}</div>`:''}<div class="stock">${p.stock?`${p.stock} disponible${p.stock===1?'':'s'}`:'Sin existencias'}</div><div class="product-actions"><button type="button" class="btn" data-add="${escapeAttr(p.id)}" ${!p.stock?'disabled':''}>${p.stock?'+ Agregar':'Agotado'}</button><button type="button" class="btn outline" data-detail="${escapeAttr(p.id)}">Detalles</button></div></div></article>`;
}
function render(){
 if(!$('productGrid'))return;
 let list=products.filter(p=>p.active);
 if(page==='inicio'){
   list=list.filter(p=>p.stock>0).slice(0,8);
   if($('resultsCount'))$('resultsCount').textContent='Una selección de nuestros productos disponibles';
   $('productGrid').innerHTML=list.map(card).join('')||'<div class="empty">Pronto tendremos novedades.</div>';
   return;
 }
 const t=$('search')?.value.trim().toLowerCase()||'',cat=$('category')?.value||'',sort=$('sort')?.value||'featured';
 if(t)list=list.filter(p=>[p.name,p.category,p.code,p.description].join(' ').toLowerCase().includes(t));
 if(cat)list=list.filter(p=>p.category===cat);
 if(sort==='priceAsc')list.sort((a,b)=>C.unitPrice(a,1)-C.unitPrice(b,1));
 else if(sort==='priceDesc')list.sort((a,b)=>C.unitPrice(b,1)-C.unitPrice(a,1));
 else if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es'));
 else list.sort((a,b)=>(b.stock>0)-(a.stock>0));
 if($('resultsCount'))$('resultsCount').textContent=`${list.length} productos`;
 $('productGrid').innerHTML=list.slice(0,visible).map(card).join('')||'<div class="empty">No se encontraron productos.</div>';
 $('showMore')?.classList.toggle('hidden',list.length<=visible);
}
function open(id){
 const p=products.find(x=>x.id===id);if(!p)return;currentId=id;
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
 feature('Compatibilidad',specs.compatibility||'');
 const technical=specRows.length?`<section class="gc-product-specifications"><h4>Características</h4><dl>${specRows.join('')}</dl></section>`:'';
 const promotion=p.promoText?`<div class="promo-note">${safe(p.promoText)}</div>`:'';
 $('detailContent').innerHTML=`<div class="detail"><div class="detail-media"><div class="detail-main"><img id="detailPhoto" src="${escapeAttr(normalize(images[0]))}" alt="${safe(p.name)}"></div>${images.length>1?`<div class="detail-thumbs">${images.map((u,i)=>`<button type="button" class="detail-thumb ${i===0?'active':''}" data-photo="${escapeAttr(normalize(u))}"><img src="${escapeAttr(normalize(u))}" alt="Foto ${i+1}"></button>`).join('')}</div>`:''}</div><div><div class="category">${safe(p.category)}</div><h3 id="detailTitle">${safe(p.name)}</h3>${amount}${promotion}${detailText}${technical}<p>${p.stock?`<b>Existencias:</b> ${p.stock}`:'Sin existencias actualmente'}</p><div class="${p.codAllowed?'info':'warning'}">${p.codAllowed?'Este producto admite pago al recibir si el carrito reúne todas las condiciones.':'Este producto no admite pago al recibir. Podés pagar por transferencia o Tigo Money.'}</div><div class="detail-buttons"><button class="btn" id="detailAdd" type="button" ${p.stock?'':'disabled'}>Agregar al carrito</button><button class="btn outline" id="detailWA" type="button">Preguntar por WhatsApp</button></div></div></div>`;
 $('detailPhoto').onerror=function(){this.onerror=null;this.src=imgFallback};
 $('detailContent').querySelectorAll('.detail-thumb').forEach(btn=>btn.addEventListener('click',()=>{const src=btn.dataset.photo;$('detailPhoto').src=src;$('detailContent').querySelectorAll('.detail-thumb').forEach(x=>x.classList.remove('active'));btn.classList.add('active')}));
 $('detailAdd').onclick=()=>{add(id);close('detailOverlay')};
 $('detailWA').onclick=()=>window.open('https://wa.me/'+config.whatsapp+'?text='+encodeURIComponent('Hola Gamer Comayagua, quiero consultar por '+p.name),'_blank','noopener');
 $('detailOverlay').hidden=false;document.body.style.overflow='hidden';
}
function add(id){const p=products.find(x=>x.id===id);if(!p||p.stock<=0)return toast('Producto agotado');if((cart[id]||0)>=p.stock)return toast('No hay más unidades disponibles');cart[id]=(cart[id]||0)+1;cleanItems();toast('Producto agregado al carrito');}
function close(overlay){const el=$(overlay);if(!el)return;el.hidden=true;document.body.style.overflow='';}
function cartOpen(){$('toast').style.display='none';$('cartOverlay').hidden=false;document.body.style.overflow='hidden';cartRender();}
function cartRender(){const rows=items();$('cartLines').innerHTML=rows.length?rows.map(({product:p,qty})=>`<div class="cart-line"><img src="${escapeAttr(pic(p))}" onerror="this.onerror=null;this.src='${imgFallback}'" alt=""><div><strong>${safe(p.name)}</strong><p>${C.money(C.unitPrice(p,qty))} × ${qty}</p><strong>${C.money(qty*C.unitPrice(p,qty))}</strong></div><div class="actions"><button data-qty="${escapeAttr(p.id)}" data-step="-1" title="Restar">−</button><b>${qty}</b><button data-qty="${escapeAttr(p.id)}" data-step="1" title="Sumar">+</button><button data-remove="${escapeAttr(p.id)}" title="Eliminar">×</button></div></div>`).join(''):'<div class="empty">El carrito está vacío.</div>';$('checkoutControls').classList.toggle('hidden',!rows.length);calc();}
function calc(){const selection=document.querySelector('[name=payMethod]:checked')?.value||'transfer',q=C.quote(items(),selection,settings);latest=q;const n=$('deniedNotice');n.classList.toggle('hidden',!(selection==='cod'&&!q.codAllowed));n.textContent=q.reasons.join(' ');const showFee=(q.mode==='cod'||q.mode==='tigo');$('checkoutTotals').innerHTML=`<div class="totals"><div class="total-row"><span>Productos</span><strong>${C.money(q.subtotal)}</strong></div><div class="total-row"><span>Envío</span><strong>${C.money(q.shipping)}</strong></div>${showFee?`<div class="total-row"><span>${q.mode==='cod'?'Comisión por pagar al recibir':'Comisión de Tigo Money'}</span><strong>${C.money(q.fee)}</strong></div>`:''}<div class="total-row big"><span>Total</span><strong>${C.money(q.total)}</strong></div>${q.mode==='cod'?`<div class="payment-split"><div class="deposit-row"><span>Anticipo</span><strong>${C.money(q.deposit)}</strong><small>Envío + comisión</small></div><div class="cash-row"><span>Al recibir</span><strong>${C.money(q.balance)}</strong><small>En efectivo</small></div></div>`:''}</div>`;if($('codDepositHelp'))$('codDepositHelp').hidden=selection!=='cod';$('sendQuote').disabled=selection==='cod'&&!q.codAllowed;$('printQuote').disabled=selection==='cod'&&!q.codAllowed;}
function prepareQuote(){calc();if(!latest.valid.length){toast('Agregá productos');return null}if(latest.mode==='cod'&&!latest.codAllowed){toast('Pago al recibir no disponible para esta compra');return null}currentQuoteId=C.number();return {id:currentQuoteId,text:C.waMessage(items(),latest,currentQuoteId),q:latest};}
function waQuote(){const q=prepareQuote();if(!q)return;window.open('https://wa.me/'+String(settings.whatsapp||config.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent(q.text),'_blank','noopener');}
function printQuote(){
 const prepared=prepareQuote();if(!prepared)return;
 const q=prepared.q,uid=prepared.id,entries=items(),labels={transfer:'Transferencia / depósito',tigo:'Tigo Money',cod:'Pagar al recibir'};
 const rows=entries.map(({product:p,qty},i)=>`<tr><td><span class="sku">${String(i+1).padStart(2,'0')}</span> ${safe(p.name)}</td><td>${qty}</td><td>${C.money(C.unitPrice(p,qty))}</td><td class="right">${C.money(qty*C.unitPrice(p,qty))}</td></tr>`).join('');
 const line=(name,val,highlight=false)=>`<div class="sumrow ${highlight?'highlight':''}"><span>${safe(name)}</span><b>${C.money(val)}</b></div>`;
 const fees=q.mode==='tigo'?line('Comisión Tigo Money',q.fee):q.mode==='cod'?line('Comisión pago al recibir',q.fee):'';
 const balances=q.mode==='cod'?line('ANTICIPO A DEPOSITAR',q.deposit)+line('SALDO EN EFECTIVO AL RECIBIR',q.balance):'';
 const date=new Date().toLocaleString('es-HN',{dateStyle:'full',timeStyle:'short'});
 const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${uid} - Gamer Comayagua</title><style>@page{size:A4;margin:17mm}*{box-sizing:border-box}body{max-width:850px;margin:25px auto;padding:0 20px;color:#172b46;font:14px/1.55 Arial,sans-serif}header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;border-bottom:4px solid #1269d9;padding-bottom:24px}.name{font-weight:900;color:#1068d7;font-size:27px;line-height:1.1;letter-spacing:-1px}header p{margin:7px 0;color:#667b92}.flag{font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#4875a9}.meta{text-align:right}.folio{font-size:18px;font-weight:800;color:#122842}.intro{display:flex;justify-content:space-between;gap:20px;padding:26px 0}h2{margin:0 0 10px;font-size:19px}table{width:100%;border-collapse:collapse}thead th{background:#e9f1fb;color:#244267;text-align:left;font-size:12px;padding:12px 10px}tbody td{border-bottom:1px solid #e3eaf2;padding:12px 10px}tbody td:nth-child(2),tbody td:nth-child(3){white-space:nowrap}.right{text-align:right;white-space:nowrap}.sku{font-size:11px;color:#8aa0b8;padding-right:4px}.bottom{display:flex;justify-content:flex-end;margin-top:24px}.totals{width:min(370px,100%);background:#f3f7fc;border-radius:12px;padding:15px 19px}.sumrow{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px solid #dee8f3}.sumrow:last-child{border-bottom:0}.sumrow.highlight{font-size:18px;font-weight:850;color:#075bc1;border-top:2px solid #a5c6ef;padding-top:12px}.footer{border-top:1px solid #cddceb;margin-top:48px;padding-top:14px;font-size:12px;color:#667b92}.stamp{margin-top:18px;color:#466b9b;font-size:12px}.print{position:fixed;top:10px;right:10px;background:#146fe3;color:white;border:0;border-radius:9px;font-weight:bold;padding:10px 16px;cursor:pointer}@media print{body{margin:0;padding:0}.print{display:none}}</style></head><body><button class="print" onclick="window.print()">Imprimir / Guardar PDF</button><header><div><div class="name">GAMER COMAYAGUA</div><p>Comayagua · Envíos a toda Honduras</p><p>WhatsApp: +504 3151-7755</p></div><div class="meta"><div class="flag">Cotización</div><div class="folio">${uid}</div><p>${safe(date)}</p></div></header><div class="intro"><div><div class="flag">Detalles del pedido</div><h2>Cotización de productos</h2><span>Confirmación de inventario por WhatsApp</span></div><div><div class="flag">Modalidad</div><strong>${safe(labels[q.mode])}</strong></div></div><table><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th class="right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="bottom"><div class="totals">${line('Subtotal productos',q.subtotal)}${line('Envío nacional',q.shipping)}${fees}${line('TOTAL A PAGAR',q.total,true)}${balances}</div></div><div class="footer"><b>Importante:</b> esta cotización no representa confirmación de pago ni reserva automática. Los productos se confirman según existencias.<div class="stamp">GAMER COMAYAGUA · Gracias por elegirnos</div></div><script>window.addEventListener('load',()=>window.print());<\/script></body></html>`;
 const w=window.open('','_blank');if(!w){toast('Permití ventanas emergentes para imprimir');return}w.document.write(html);w.document.close();
}
function handlePublic(data){if(!data||data.ok===false||!Array.isArray(data.products))throw Error(data?.error||'Respuesta no válida');products=data.products.map(C.cleanProduct).filter(p=>p.id&&p.name);settings={...settings,...data.settings};if(Array.isArray(data.banks)&&data.banks.length)banks=data.banks;renderCategories();render();cleanItems();renderBanks();if($('syncStatus')){$('syncStatus').textContent=`✓ ${products.length} productos sincronizados desde Google Sheets`;$('syncStatus').style.color='#0f9f6a';}}
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
async function loadBanksFromSheet(){
 if(!$('bankAccounts'))return;
 try{const fresh=await banksFromSheet();banks=fresh;renderBanks();}
 catch(err){console.warn('Cuentas bancarias: revisar publicación del Sheet o Apps Script',err);if(!banks.length)renderBanks();}
}
function jsonp(url){return new Promise((resolve,reject)=>{const callback='gcPublic_'+Date.now()+'_'+Math.floor(Math.random()*9999);const script=document.createElement('script');let timeout=setTimeout(()=>done(Error('Tiempo de espera agotado')),13000);function done(err,data){clearTimeout(timeout);delete window[callback];script.remove();err?reject(err):resolve(data)}window[callback]=d=>done(null,d);script.onerror=()=>done(Error('Sin conexión con Apps Script'));script.src=url+(url.includes('?')?'&':'?')+'action=public&callback='+callback+'&t='+Date.now();document.head.appendChild(script)})}
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
   if($('syncStatus'))$('syncStatus').textContent='Catálogo disponible. Comprobando actualizaciones…';
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
  if($('syncStatus'))$('syncStatus').textContent='Catálogo de respaldo cargado. Comprobando actualización en Google Sheets…';
 }catch(error){
  console.warn('Respaldo no disponible:',error);
  if($('syncStatus'))$('syncStatus').textContent='No se pudo cargar el respaldo; verificando catálogo en línea…';
 }
 if(!url){
  if($('syncStatus'))$('syncStatus').textContent=localReady?'Catálogo de respaldo: confirmá existencias por WhatsApp.':'No hay conexión configurada con Google Sheets.';
  return;
 }
 try{
  handlePublic(await jsonp(url));
 }catch(error){
  console.warn('Consulta pública GET no disponible; probando POST:',error);
  try{
   handlePublic(await catalogByPost(url));
  }catch(postError){
   console.warn('Sin conexión en tiempo real; se mantiene respaldo local:',postError);
   if($('syncStatus'))$('syncStatus').textContent=localReady?'Catálogo de respaldo · Confirmá precio y existencias por WhatsApp.':'⚠ No se pudo conectar el catálogo. Intentá actualizar la página.';
   if(!localReady){products=[];render();}
  }
 }
}
function binds(){
 if($('year'))$('year').textContent=new Date().getFullYear();
 if($('waHero'))$('waHero').href='https://wa.me/'+config.whatsapp+'?text='+encodeURIComponent('Hola, quiero información sobre sus productos.');
 $('search')?.addEventListener('input',()=>{visible=24;render()});
 $('category')?.addEventListener('change',()=>{visible=24;render()});
 $('sort')?.addEventListener('change',render);
 $('showMore')?.addEventListener('click',()=>{visible+=24;render()});
 $('openCart')?.addEventListener('click',cartOpen);$('mobileCart')?.addEventListener('click',cartOpen);
 $('productGrid')?.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.add)add(t.dataset.add);if(t.dataset.detail)open(t.dataset.detail)});
 $('cartLines')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.remove){delete cart[b.dataset.remove];cartRender()}else if(b.dataset.qty){const id=b.dataset.qty,p=products.find(x=>x.id===id);cart[id]=Math.min(p.stock,(cart[id]||0)+Number(b.dataset.step));if(cart[id]<=0)delete cart[id];cartRender()}});
 document.querySelectorAll('[name=payMethod]').forEach(e=>e.addEventListener('change',calc));
 $('sendQuote')?.addEventListener('click',waQuote);$('printQuote')?.addEventListener('click',printQuote);$('clearCart')?.addEventListener('click',()=>{cart={};cartRender()});
 document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>close(x.closest('.overlay').id));
 document.querySelectorAll('.overlay').forEach(x=>x.onclick=e=>{if(e.target===x)close(x.id)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close('detailOverlay');close('cartOverlay')}});
 const onBankCopy=async b=>{if(!b)return;const ok=await copyText(b.dataset.copy);toast(ok?b.dataset.label+' copiado al portapapeles':'No se pudo copiar. Mantené presionado el dato para copiarlo.');if(ok){const button=b.matches('button')?b:b.querySelector('button');if(button){button.textContent='✓ Copiado';setTimeout(()=>{if(button.isConnected)button.textContent='Copiar'},2000)}}};
 $('bankAccounts')?.addEventListener('click',e=>onBankCopy(e.target.closest('[data-copy]')));
 $('bankAccounts')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.bank-copy-row')){e.preventDefault();onBankCopy(e.target)}});
 try{cart=JSON.parse(sessionStorage.getItem('gc_cart')||'{}')||{}}catch{cart={}};
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
