/* Centro de gestión. Los registros privados se consultan y guardan únicamente con PIN. */
(function(){'use strict';
const A=window.GC_ADMIN,C=window.GC,M=window.GC_MANAGEMENT,$=id=>document.getElementById(id);
if(!A||!M||!$('mgTabs'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=value=>/^https:\/\//i.test(value||'')||/^assets\/products\/[\w.-]+$/.test(value||'')?value:'assets/img/sin-foto.svg';
const uid=()=>window.crypto?.randomUUID?crypto.randomUUID():'gc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const ready=()=>A.features().management===true,products=()=>A.products().slice().sort(C.recentFirst);
const date=value=>{const n=new Date(value);return Number.isFinite(n.getTime())?n.toLocaleString('es-HN',{dateStyle:'medium',timeStyle:'short'}):'';};
const states={orders:{records:[],page:1,pages:1,total:0,ticket:0,loading:false},waitlist:{records:[],page:1,pages:1,total:0,ticket:0,loading:false}};
let view='inventory',threshold=3,summary=null,summaryPromise=null,summaryAgain=false,summaryTicket=0,catalogKey='',editing=null,saving=false,stockBusy=false,stockDirty=false,pubVariant=0;
const names={orders:'Order',waitlist:'Wait'};
function setupNotice(){
 const requires=['orders','waitlist','stock'].includes(view);
 $('mgConnection').hidden=ready()||!requires;
 if(!ready())$('mgConnection').innerHTML='Para guardar pedidos, interesados y el aviso compartido de stock, actualizá <b>Code.gs</b> y publicá <b>Nueva versión</b> en Google. <a href="https://github.com/sdcomayagua/sdcomayagua/blob/main/ACTIVAR_GESTION.md" target="_blank" rel="noopener noreferrer">Ver pasos ↗</a>';
 $('mgStockSettings').querySelector('button').disabled=!ready()||stockBusy;
 $('mgNewOrder').disabled=!ready();$('mgNewWait').disabled=!ready();
}
function overview(){
 const counts=M.counts(products(),threshold),items=[['pending',counts.pending,'Por completar','Revisar fichas'],['photos',counts.photos,'Sin foto','Preparar imágenes'],['stock',counts.low,'Stock bajo','Hasta '+threshold+' unidad'+(threshold===1?'':'es')],['orders',summary?.orders.open??'—','Pedidos abiertos','Preparar y entregar'],['waitlist',summary?.waitlist.pending??'—','Clientes esperando','Próxima reposición'],['ready',summary?.waitlist.ready??'—','Listos para avisar','Con existencias']];
 $('mgOverview').innerHTML=items.map(([key,count,label,help])=>`<button type="button" class="mg-metric" data-mg-metric="${key}" aria-label="${esc(label)}: ${count}"><strong>${count}</strong><span>${label}</span><small>${esc(help)}</small></button>`).join('');
 setupNotice();
}
async function refreshSummary(force=false){
 if(!ready())return;if(summaryPromise){if(force)summaryAgain=true;return summaryPromise;}
 const ticket=++summaryTicket;
 summaryPromise=(async()=>{try{const result=await A.request('operationsSummary');if(ticket!==summaryTicket)return;if(!result.orders||!result.waitlist||!Number.isInteger(result.lowStockThreshold))throw Error('Google devolvió un resumen incompleto. Actualizá Code.gs.');summary=result;const link=$('mgPrivateSheet');link.hidden=!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+\/edit$/.test(result.managementUrl||'');if(!link.hidden)link.href=result.managementUrl;threshold=result.lowStockThreshold;if(!stockDirty)$('mgThreshold').value=threshold;overview();if(view==='stock')stockList();}catch(error){$('mgConnection').hidden=false;$('mgConnection').textContent='No se pudo actualizar el resumen privado: '+error.message;}finally{summaryPromise=null;if(summaryAgain){summaryAgain=false;refreshSummary();}}})();
 return summaryPromise;
}
function activate(key){
 if(!['inventory','pending','stock','orders','waitlist','publish','sales','receipts','duplicates'].includes(key))return;
 view=key;document.querySelectorAll('[data-mg-view]').forEach(el=>el.hidden=el.dataset.mgView!==key);
 $('mgTabs').querySelectorAll('[data-mg-tab]').forEach(button=>{const selected=button.dataset.mgTab===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 setupNotice();if(key==='pending')pendingList();if(key==='stock')stockList();if(key==='publish')pubOptions();if(key==='orders'||key==='waitlist')loadKind(key,states[key].page);
 document.dispatchEvent(new CustomEvent('gc:management-view',{detail:{view:key}}));
}
function productCard(p,badges,extra=''){
 return `<article class="mg-product-card"><img src="${esc(image(M.photos(p)[0]))}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/img/sin-foto.svg'"><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(p.code||'Sin código')}${p.active?'':' · Oculto'}</p><div class="mg-badges">${badges}</div>${extra}<div class="mg-actions"><button class="btn outline small" type="button" data-mg-edit="${esc(p.id)}">Editar producto</button>${M.photos(p).length===1?`<button class="btn outline small" type="button" data-mg-reference="${esc(p.id)}">Buscar más fotos</button>`:''}</div></div></article>`;
}
function pendingList(){
 const filter=$('mgPendingFilter').value,query=$('mgPendingSearch').value;
 const list=products().filter(p=>C.matchesSearch([p.name,p.category,p.code].join(' '),query)&&(filter==='onephoto'?M.photos(p).length===1:filter==='all'?M.missing(p).length:M.missing(p).some(field=>field.key===filter)));
 $('mgPendingCount').textContent=list.length+' producto'+(list.length===1?'':'s')+' en esta revisión.';
 $('mgPendingList').innerHTML=list.map(p=>productCard(p,M.missing(p).map(field=>`<span class="mg-badge warning">Falta ${esc(field.label.toLowerCase())}</span>`).join('')||(filter==='onephoto'?'<span class="mg-badge">Una foto guardada</span>':''))).join('')||'<div class="mg-empty"><strong>Todo al día con este filtro</strong>Los nuevos productos aparecerán aquí si tienen datos pendientes.</div>';
}
function stockList(){
 const filter=$('mgStockFilter').value,query=$('mgStockSearch').value;
 const list=products().filter(p=>C.matchesSearch([p.name,p.code,p.category].join(' '),query)&&(filter==='out'?p.stock===0:filter==='all'?p.stock<=threshold:p.stock>0&&p.stock<=threshold)).sort((a,b)=>a.stock-b.stock);
 $('mgStockCount').textContent=list.length+' producto'+(list.length===1?'':'s')+' · Aviso configurado en '+threshold+' unidad'+(threshold===1?'':'es')+'.';
 $('mgStockList').innerHTML=list.map(p=>productCard(p,`<span class="mg-badge ${p.stock?'warning':'danger'}">${p.stock?'Reposición próxima':'Agotado'}</span>`,`<p><span class="mg-stock-value ${p.stock?'':'is-out'}">${p.stock}</span> unidad${p.stock===1?' disponible':'es disponibles'}</p>`)).join('')||'<div class="mg-empty"><strong>Sin productos en este estado</strong>Podés cambiar el filtro o el nivel de aviso.</div>';
}
function orderMessage(record){
 const payment={transfer:'Depósito / transferencia',tigo:'Tigo Money',cod:'Pagar al recibir'};
 return ['GAMER COMAYAGUA · PEDIDO '+record.number,'Hola, '+record.customer+'.',...record.items.map(i=>i.qty+' × '+i.name),'Estado: '+M.orderStates[record.status],'Forma de pago: '+payment[record.payment],'Total: '+C.money(record.total),'Recibido: '+C.money(record.paid),'Pendiente: '+C.money(record.balance),record.carrier?'Entrega: '+record.carrier:'',record.tracking?'Guía: '+record.tracking:'',record.city?'Destino: '+record.city:''].filter(Boolean).join('\n');
}
function waitMessage(record){const p=products().find(p=>p.id===record.productId);return p?.stock>0?'Hola, '+record.customer+'. Te escribimos de GAMER COMAYAGUA: ya tenemos existencias de '+p.name+'. Escribinos para confirmar la cantidad y coordinar tu pedido.':'Hola, '+record.customer+'. Te escribimos de GAMER COMAYAGUA para dar seguimiento a tu solicitud de '+record.productName+'.';}
function recordHTML(kind,record){
 const isOrder=kind==='orders',labels=isOrder?M.orderStates:M.waitStates,positive=isOrder?record.status==='delivered':record.status==='resolved',warning=record.status==='pending';
 const readyNow=!isOrder&&record.status==='pending'&&(products().find(p=>p.id===record.productId)?.stock||0)>0;
 const href=M.wa(record.phone,isOrder?orderMessage(record):waitMessage(record));
 return `<article class="mg-record" data-mg-record="${esc(record.id)}"><div class="mg-record-head"><div><h3>${esc(isOrder?record.number:record.productName)}</h3><small>Actualizado ${esc(date(record.updatedAt))}</small></div><span class="mg-badge ${positive?'success':warning?'warning':''}">${esc(labels[record.status]||record.status)}</span></div><div class="mg-record-name">${esc(record.customer)}</div><div class="mg-record-details"><span>${esc(record.phone)}</span>${record.city?`<span>${esc(record.city)}</span>`:''}${!isOrder?`<span>Solicita ${record.quantity} unidad${record.quantity===1?'':'es'}</span>`:''}${readyNow?'<span class="mg-badge success">Ya hay existencias · Listo para avisar</span>':''}</div>${isOrder?`<div class="mg-record-lines">${record.items.map(i=>`${i.qty} × ${esc(i.name)}`).join('<br>')}</div><div class="mg-record-totals"><span>Total<strong>${C.money(record.total)}</strong></span><span>Recibido<strong>${C.money(record.paid)}</strong></span><span>Saldo<strong>${C.money(record.balance)}</strong></span></div>${record.carrier||record.tracking?`<p class="mg-note">${esc(record.carrier)}${record.tracking?' · Guía: '+esc(record.tracking):''}</p>`:''}`:''}${record.notes?`<p class="mg-note">${esc(record.notes)}</p>`:''}<div class="mg-actions"><button type="button" class="btn outline small" data-mg-open="${esc(record.id)}" data-kind="${kind}">Editar ${isOrder?'pedido':'solicitud'}</button>${href?`<a class="btn outline small" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp ↗</a>`:''}${!isOrder&&record.status==='pending'?`<button type="button" class="btn outline small" data-mg-contacted="${esc(record.id)}">Marcar contactado</button>`:''}</div></article>`;
}
function renderRecords(kind){
 const state=states[kind],name=names[kind];
 $('mg'+name+'List').innerHTML=state.records.map(record=>recordHTML(kind,record)).join('')||`<div class="mg-empty"><strong>${kind==='orders'?'Todavía no hay pedidos en esta vista':'No hay solicitudes en esta vista'}</strong>${kind==='orders'?'Registrá el primer pedido para seguir su preparación y entrega.':'Anotá a los clientes que te consultan por productos agotados.'}</div>`;
 $('mg'+name+'Page').textContent='Página '+state.page+' de '+state.pages+' · '+state.total+' registros';
 $('mg'+name+'Prev').disabled=state.loading||state.page<=1;$('mg'+name+'Next').disabled=state.loading||state.page>=state.pages;
}
async function loadKind(kind,page=1){
 const state=states[kind],name=names[kind],message=$('mg'+name+'Message');
 if(!ready()){message.textContent='Activá el servidor actualizado para guardar y consultar esta sección.';renderRecords(kind);return;}
 const ticket=++state.ticket;state.loading=true;message.textContent='Sincronizando registros privados…';renderRecords(kind);
 try{const result=await A.request('operationsList',{kind,page,query:$('mg'+name+'Search').value,status:$('mg'+name+'Status').value});if(ticket!==state.ticket)return;if(!Array.isArray(result.records))throw Error('Google no devolvió una lista válida.');Object.assign(state,{records:result.records,page:result.page,pages:result.pages,total:result.total});message.textContent=result.total+' registro'+(result.total===1?' encontrado. ':'s encontrados. ')+(kind==='waitlist'?'Abrir WhatsApp no cambia el estado: marcalo como contactado cuando hayas enviado tu mensaje.':'Los datos de clientes y pedidos solo están disponibles con tu PIN.');}
 catch(error){if(ticket===state.ticket)message.textContent=error.message;}
 finally{if(ticket===state.ticket){state.loading=false;renderRecords(kind);}}
}
function input(label,name,value='',type='text',attrs=''){return `<label>${label}<input class="field" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;}
function select(label,name,value,options){return `<label>${label}<select class="field" name="${name}">${Object.entries(options).map(([key,text])=>`<option value="${esc(key)}" ${value===key?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function productOptions(selected='',extra){const list=products();if(selected&&!list.some(p=>p.id===selected)&&extra)list.push({id:selected,name:extra});return '<option value="">Elegí un producto</option>'+list.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)} · Stock ${p.stock??'—'}</option>`).join('');}
function field(name){return $('mgRecordForm').elements.namedItem(name);}
function readLines(){
 return [...$('mgOrderLines').querySelectorAll('[data-order-line]')].map((el,index)=>{
  const id=el.querySelector('[data-line-product]').value,p=products().find(p=>p.id===id),prior=editing.items.find(item=>item.productId===id)||{};
  return {productId:id,name:p?.name||prior.name||'',code:p?.code||prior.code||'',qty:Number(el.querySelector('[data-line-qty]').value),unitPrice:Number(el.querySelector('[data-line-price]').value),codAllowed:prior.codAllowed??p?.codAllowed??true,manual:el.dataset.manual==='true'};
 });
}
function renderLines(){
 $('mgOrderLines').innerHTML=editing.items.map((item,index)=>`<div class="mg-line" data-order-line="${index}" data-manual="${!!item.manual}"><label>Artículo<select class="field" data-line-product required aria-label="Artículo ${index+1}">${productOptions(item.productId,item.name)}</select></label><label>Cantidad<input class="field" type="number" min="1" max="100000" step="1" data-line-qty value="${item.qty||1}" required aria-label="Cantidad ${index+1}"></label><label>Precio unitario (L)<input class="field" type="number" min="0" max="100000000" step="0.01" data-line-price value="${item.unitPrice??0}" required aria-label="Precio ${index+1}"></label><button class="icon" type="button" data-line-remove="${index}" aria-label="Quitar artículo ${index+1}">×</button></div>`).join('');
 orderPreview();
}
function orderPreview(){
 if(!editing||editing.kind!=='orders')return;
 const items=readLines(),q=M.orderQuote(items,field('payment').value,{...A.settings(),...(editing.record.pricing||{}),shipping:Number(field('shipping').value)}),paid=Number(field('paid').value)||0;
 $('mgOrderSummary').innerHTML=[['Productos',q.subtotal],['Envío',q.shipping],['Comisión',q.fee],['Total',q.total],['Anticipo sugerido',q.deposit],['Saldo pendiente',q.total-paid]].map(([label,value])=>`<span>${label}<strong>${C.money(value)}</strong></span>`).join('')+(field('payment').value==='cod'&&!q.codAllowed?`<p>${esc(q.reasons.join(' '))}</p>`:'');
}
function openRecord(kind,record=null,requestedProduct=''){
 if(!ready()){setupNotice();A.toast('Actualizá Code.gs y publicá Nueva versión para activar el guardado.');return;}
 const saved=record||{},p=products().find(p=>p.id===requestedProduct);
 editing={kind,id:saved.id||uid(),version:saved.version||0,mutationId:uid(),trigger:document.activeElement,items:(saved.items||[]).map(item=>({...item,manual:true})),record:saved};
 $('mgEditorTitle').textContent=kind==='orders'?(record?'Editar pedido '+saved.number:'Registrar pedido'):(record?'Editar interesado':'Anotar interesado');
 $('mgEditorHint').textContent=kind==='orders'?'Guardá los artículos acordados y actualizá el envío cuando salga. No descuenta stock automáticamente.':'Anotá la solicitud. Abrir WhatsApp prepara un mensaje; vos decidís cuándo enviarlo.';
 let html='<div class="mg-form-grid">'+input('Nombre del cliente','customer',saved.customer||'','text','required minlength="2" maxlength="120" autocomplete="name"')+input('Celular · 8 dígitos o código de país','phone',saved.phone||'','tel','required maxlength="25" autocomplete="tel"')+input('Ciudad o municipio','city',saved.city||'','text','maxlength="160" autocomplete="address-level2"');
 if(kind==='orders'){
  html+=select('Estado','status',saved.status||'pending',M.orderStates)+'<label class="mg-full">Dirección y referencia<textarea class="field" name="address" rows="2" maxlength="600">'+esc(saved.address||'')+'</textarea></label><section class="mg-full"><h3>Artículos del pedido</h3><div id="mgOrderLines"></div><button class="btn outline small" id="mgAddLine" type="button">+ Agregar artículo</button><p class="mg-hint">El precio se sugiere según cantidad y promoción. Podés cambiarlo si acordaste otro precio con el cliente.</p></section>';
  html+=select('Forma de pago','payment',saved.payment||'transfer',{transfer:'Depósito / transferencia',tigo:'Tigo Money',cod:'Pagar al recibir'})+input('Envío acordado (L)','shipping',saved.shipping??A.settings().shipping??110,'number','required min="0" max="100000000" step="0.01"')+input('Dinero recibido hasta ahora (L)','paid',saved.paid??0,'number','required min="0" max="100000000" step="0.01"')+input('Empresa o modalidad de entrega','carrier',saved.carrier||'','text','maxlength="100" placeholder="Forza, C807, Cargo Expreso, entrega local…"')+input('Número de guía (si corresponde)','tracking',saved.tracking||'','text','maxlength="160"')+'<div class="mg-full mg-order-summary" id="mgOrderSummary" role="status" aria-live="polite"></div>';
 }else{
  html+=select('Estado','status',saved.status||'pending',M.waitStates)+`<label class="mg-full">Producto del catálogo<select class="field" name="productId">${productOptions(saved.productId||p?.id||'',saved.productName)}</select></label>`+input('Artículo solicitado · si no está en el catálogo','productName',saved.productName||p?.name||'','text','maxlength="180"')+input('Cantidad solicitada','quantity',saved.quantity||1,'number','min="1" max="100000" step="1" required');
 }
 html+='<label class="mg-full">Notas privadas<textarea class="field" name="notes" rows="3" maxlength="2000">'+esc(saved.notes||'')+'</textarea></label></div>';
 $('toast').style.display='none';
 $('mgRecordFields').innerHTML=html;$('mgRecordMessage').textContent='';$('mgSaveRecord').textContent=kind==='orders'?'Guardar pedido':'Guardar solicitud';
 if(kind==='orders'){if(!editing.items.length)editing.items=[{productId:'',qty:1,unitPrice:0,manual:false}];renderLines();}
 $('mgEditorOverlay').hidden=false;document.body.style.overflow='hidden';field('customer').focus({preventScroll:true});
}
function closeRecord(){if(saving)return;$('mgEditorOverlay').hidden=true;document.body.style.overflow='';const trigger=editing?.trigger;editing=null;trigger?.focus({preventScroll:true});}
async function saveRecord(event){
 event.preventDefault();if(!editing||saving||!ready())return;
 const record={id:editing.id};for(const key of ['customer','phone','city','status','notes'])record[key]=field(key).value;
 if(editing.kind==='orders'){
  record.items=readLines().map(({manual,...item})=>item);for(const key of ['address','payment','shipping','paid','carrier','tracking'])record[key]=field(key).value;
  const q=M.orderQuote(record.items,record.payment,{...A.settings(),...(editing.record.pricing||{}),shipping:Number(record.shipping)});
  if(record.payment==='cod'&&!q.codAllowed){$('mgRecordMessage').textContent=q.reasons.join(' ');return;}
 }else for(const key of ['productId','productName','quantity'])record[key]=field(key).value;
 const locked=[...$('mgRecordForm').querySelectorAll('input,select,textarea,button')].map(el=>[el,el.disabled]);locked.forEach(([el])=>el.disabled=true);
 saving=true;$('mgSaveRecord').disabled=true;$('mgRecordCancel').disabled=true;$('mgEditorClose').disabled=true;$('mgRecordMessage').textContent='Guardando en tu hoja privada…';
 const kind=editing.kind;
 try{const result=await A.request('operationsSave',{kind,record,expectedVersion:editing.version,mutationId:editing.mutationId});if(!result.record?.id)throw Error('Google no confirmó el registro. Conservá este formulario e intentá sincronizar.');saving=false;closeRecord();A.toast(kind==='orders'?'Pedido guardado.':'Solicitud guardada.');loadKind(kind,1);refreshSummary(true);}
 catch(error){$('mgRecordMessage').textContent=error.message;}
 finally{saving=false;locked.forEach(([el,disabled])=>el.disabled=disabled);$('mgSaveRecord').disabled=false;$('mgRecordCancel').disabled=false;$('mgEditorClose').disabled=false;}
}
function pubOptions(){
 const selected=$('mgPubProduct').value,list=products().filter(p=>C.matchesSearch([p.name,p.category,p.code].join(' '),$('mgPubSearch').value));
 $('mgPubProduct').innerHTML=list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')||'<option value="">No hay coincidencias</option>';
 if(list.some(p=>p.id===selected))$('mgPubProduct').value=selected;pubPreview();
}
function pubPreview(){
 const p=products().find(p=>p.id===$('mgPubProduct').value);$('mgPubGenerate').disabled=!p;$('mgPubAnother').disabled=!p;
 $('mgPubPreview').innerHTML=p?`<img src="${esc(image(M.photos(p)[0]))}" alt="${esc(p.name)}"><div><strong>${esc(p.name)}</strong><small>${C.money(C.unitPrice(p,1))} · ${p.stock?p.stock+' disponibles':'Agotado'}${p.active?'':' · Oculto en la tienda'}</small></div>`:'<span class="mg-count">Elegí un producto.</span>';
}
function generateText(another=false){
 const p=products().find(p=>p.id===$('mgPubProduct').value);if(!p)return;if(another)pubVariant++;else pubVariant=0;
 const link=new URL('productos.html',location.href);link.searchParams.set('producto',p.id);
 $('mgPubText').value=M.textFor(p,$('mgPubChannel').value,pubVariant,A.settings(),p.active?link.href:'');pubCount();
}
function pubCount(){$('mgPubLength').textContent=$('mgPubText').value.length+' caracteres · editable';$('mgPubCopy').disabled=!$('mgPubText').value.trim();}
async function copyText(){try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText($('mgPubText').value);else{$('mgPubText').focus();$('mgPubText').select();if(!document.execCommand('copy'))throw Error();}A.toast('Texto copiado. Revisalo en tu red social antes de publicar.');}catch(error){$('mgPubText').focus();$('mgPubText').select();A.toast('Seleccioné el texto para que lo copiés con Ctrl+C o Copiar.');}}
function onCatalog(){
 const key=JSON.stringify(A.products());if(key===catalogKey)return;catalogKey=key;overview();if(view==='pending')pendingList();if(view==='stock')stockList();pubOptions();if(view==='waitlist')renderRecords('waitlist');refreshSummary(true);
}
$('mgTabs').onclick=event=>{const button=event.target.closest('[data-mg-tab]');if(button)activate(button.dataset.mgTab);};
$('mgTabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const buttons=[...$('mgTabs').querySelectorAll('button')],at=buttons.indexOf(document.activeElement);if(at<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(at+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;activate(buttons[next].dataset.mgTab);buttons[next].focus();};
$('mgOverview').onclick=event=>{const button=event.target.closest('[data-mg-metric]');if(!button)return;const key=button.dataset.mgMetric;if(key==='photos'){$('mgPendingFilter').value='photo';activate('pending');}else if(key==='ready'){$('mgWaitStatus').value='ready';activate('waitlist');}else activate(key);};
for(const name of ['Pending','Stock']){$('mg'+name+'Search').oninput=name==='Pending'?pendingList:stockList;$('mg'+name+'Filter').onchange=name==='Pending'?pendingList:stockList;}
$('mgPendingPhotos').onclick=()=>$('bulkPhotos').click();
$('mgThreshold').oninput=()=>{stockDirty=true;};
$('mgStockSettings').onsubmit=async event=>{
 event.preventDefault();if(!ready()||stockBusy)return;const value=Number($('mgThreshold').value);stockBusy=true;$('mgThreshold').disabled=true;setupNotice();
 try{const out=await A.request('operationsSettings',{lowStockThreshold:value});threshold=out.lowStockThreshold;stockDirty=false;$('mgThreshold').value=threshold;summaryTicket++;overview();stockList();A.toast('Aviso de stock guardado.');refreshSummary(true);}
 catch(error){A.toast(error.message);}finally{stockBusy=false;$('mgThreshold').disabled=false;setupNotice();}
};
for(const kind of ['orders','waitlist']){const name=names[kind];$('mg'+name+'SearchForm').onsubmit=event=>{event.preventDefault();loadKind(kind,1);};$('mg'+name+'Status').onchange=()=>loadKind(kind,1);$('mg'+name+'Prev').onclick=()=>loadKind(kind,states[kind].page-1);$('mg'+name+'Next').onclick=()=>loadKind(kind,states[kind].page+1);}
$('mgOrdersReload').onclick=()=>{loadKind('orders',states.orders.page);refreshSummary(true);};$('mgWaitReload').onclick=()=>{loadKind('waitlist',states.waitlist.page);refreshSummary(true);};
$('mgNewOrder').onclick=()=>openRecord('orders');$('mgNewWait').onclick=()=>openRecord('waitlist');
$('adminPanel').addEventListener('click',async event=>{
 const edit=event.target.closest('[data-mg-edit]');if(edit){A.editProduct(edit.dataset.mgEdit);return;}
 const reference=event.target.closest('[data-mg-reference]');if(reference){window.GC_BULK?.openReference(reference.dataset.mgReference);return;}
 const open=event.target.closest('[data-mg-open]');if(open){const record=states[open.dataset.kind].records.find(r=>r.id===open.dataset.mgOpen);if(record)openRecord(open.dataset.kind,record);return;}
 const contact=event.target.closest('[data-mg-contacted]');if(contact){const record=states.waitlist.records.find(r=>r.id===contact.dataset.mgContacted);if(!record||contact.disabled)return;contact.disabled=true;try{await A.request('operationsSave',{kind:'waitlist',record:{...record,status:'contacted'},expectedVersion:record.version,mutationId:uid()});await loadKind('waitlist',states.waitlist.page);refreshSummary(true);}catch(error){contact.disabled=false;A.toast(error.message);}}
});
$('mgRecordForm').onsubmit=saveRecord;$('mgRecordCancel').onclick=closeRecord;$('mgEditorClose').onclick=closeRecord;$('mgEditorOverlay').onclick=event=>{if(event.target===$('mgEditorOverlay'))closeRecord();};
$('mgRecordForm').addEventListener('input',event=>{
 if(!editing)return;editing.mutationId=uid();const row=event.target.closest('[data-order-line]');
 if(row&&event.target.hasAttribute('data-line-price'))row.dataset.manual='true';
 if(row&&event.target.hasAttribute('data-line-qty')&&row.dataset.manual!=='true'){const p=products().find(p=>p.id===row.querySelector('[data-line-product]').value);if(p)row.querySelector('[data-line-price]').value=C.unitPrice(p,Number(event.target.value));}
 if(editing.kind==='orders')orderPreview();
});
$('mgRecordForm').addEventListener('change',event=>{
 if(!editing)return;editing.mutationId=uid();const row=event.target.closest('[data-order-line]');
 if(row&&event.target.hasAttribute('data-line-product')){const p=products().find(p=>p.id===event.target.value);row.dataset.manual='false';row.querySelector('[data-line-price]').value=p?C.unitPrice(p,Number(row.querySelector('[data-line-qty]').value)):0;editing.items=readLines();orderPreview();}
 if(event.target.name==='productId'){const p=products().find(p=>p.id===event.target.value);if(p)field('productName').value=p.name;}
});
$('mgRecordForm').addEventListener('click',event=>{
 if(!editing||saving)return;
 if(event.target.closest('#mgAddLine')){editing.items=readLines();if(editing.items.length>=40){A.toast('Máximo 40 artículos por pedido.');return;}editing.items.push({productId:'',qty:1,unitPrice:0,manual:false});editing.mutationId=uid();renderLines();}
 const remove=event.target.closest('[data-line-remove]');if(remove){editing.items=readLines();editing.items.splice(Number(remove.dataset.lineRemove),1);editing.mutationId=uid();renderLines();}
});
$('mgPubSearch').oninput=pubOptions;$('mgPubProduct').onchange=pubPreview;$('mgPubGenerate').onclick=()=>generateText();$('mgPubAnother').onclick=()=>generateText(true);$('mgPubText').oninput=pubCount;$('mgPubCopy').onclick=copyText;
$('mgEditorOverlay').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeRecord();}if(event.key==='Enter'&&event.target.tagName!=='TEXTAREA'&&event.target.tagName!=='BUTTON'){event.preventDefault();}});
// El editor mantiene el foco y evita que Escape cierre el formulario de productos del fondo.
 document.addEventListener('keydown',event=>{if($('mgEditorOverlay').hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeRecord();return;}if(event.key==='Tab'){const list=[...$('mgEditorOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.getClientRects().length),first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},true);
 document.addEventListener('gc:catalog',onCatalog);onCatalog();
})();
