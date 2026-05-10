(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  let state = SDCStore.load();
  const app = $('#app'), modalRoot = $('#modalRoot'), toastEl = $('#toast');
  let currentView = 'catalog';
  let filter = {q:'',cat:'Todos'};
  let quote = emptyQuote();
  let saleDraft = null;
  const LOGO_SRC = 'assets/logo-sdc-2026.png';
  const SDC_VERSION_LABEL = 'PRO ESTABLE';

  function hydrateState(){
    state.clients = Array.isArray(state.clients)?state.clients:[];
    state.closings = Array.isArray(state.closings)?state.closings:[];
    state.expenses = Array.isArray(state.expenses)?state.expenses:[];
    state.sales = Array.isArray(state.sales)?state.sales:[];
    state.quotes = Array.isArray(state.quotes)?state.quotes:[];
    state.settings = state.settings || {};
    if(state.settings.lowStockLimit===undefined) state.settings.lowStockLimit=3;
    if(state.settings.moneyLocked===undefined) state.settings.moneyLocked=false;
    if(state.settings.captureClean===undefined) state.settings.captureClean=false;
    if(!state.settings.sheetId) state.settings.sheetId=(window.SDC_CONFIG&&window.SDC_CONFIG.sheetId)||'1ISLGulvbwZuTYhI0pyuLiIq0Ntl_x5y0K0Um1gOb32U';
    if(!state.settings.productSheet) state.settings.productSheet=(window.SDC_CONFIG&&window.SDC_CONFIG.productSheet)||'productos_pos';
    if(!state.settings.webAppUrl) state.settings.webAppUrl=(window.SDC_CONFIG&&window.SDC_CONFIG.webAppUrl)||'';
    if(state.settings.autoSheetSync===undefined) state.settings.autoSheetSync=(window.SDC_CONFIG&&window.SDC_CONFIG.autoSheetSync)!==false;
  }
  hydrateState();

  function money(n){return `${state.settings.currency||'Lps.'} ${Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}`}
  function moneyPrivate(n){return state.settings.moneyLocked?'Oculto':money(n)}
  function num(n){return Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}
  function nowHN(){return new Date().toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}
  function cleanPhone(p){return String(p||'').replace(/\D/g,'').replace(/^5040?/,'504')}
  function isMobileDevice(){return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')}
  function pad2(n){return String(n).padStart(2,'0')}
  function fileStamp(){const d=new Date(); return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`}
  function slugFile(s,fallback='sd-comayagua'){return String(s||fallback).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||fallback}
  function clientLabel(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); const client=String(doc?.client||'').trim(); return slugFile(phone||client||doc?.id||'cliente')}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}
  function save(){hydrateState(); SDCStore.save(state);}
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function parseTags(str){
    if(Array.isArray(str)) return str.flatMap(parseTags);
    if(str && typeof str==='object') return parseTags(str.categories || str.category || str.categoria || str.etiquetas || str.tags || '');
    return String(str||'').split(/[;,|/]+/).map(x=>x.trim()).filter(x=>x && x.toLowerCase()!=='[object object]');
  }
  function inferTagsFromProduct(p){
    const hay=[p?.name,p?.nombre,p?.id,p?.codigo,p?.description,p?.descripcion].join(' ').toLowerCase();
    const tags=[];
    const add=(t)=>{if(!tags.some(x=>x.toLowerCase()===t.toLowerCase())) tags.push(t)};
    if(/dedal/.test(hay)) add('Dedales');
    if(/gatillo|trigger/.test(hay)) add('Gatillos');
    if(/enfriador|cooler|radiador/.test(hay)) add('Enfriadores');
    if(/guante/.test(hay)) add('Guantes');
    if(/aud[ií]fono|qkz|auricular|audio/.test(hay)) add('Audio');
    if(/tipo\s*c|usb\s*c/.test(hay)) add('Tipo C');
    if(/micro\s*sd|microsd|memoria/.test(hay)) add('MicroSD');
    if(/secador|zapato/.test(hay)) add('Hogar');
    if(/termo|stanley/.test(hay)) add('Termos');
    if(/gamer|juego|celular|m[óo]vil|memo/.test(hay)) add('Gamer Móvil');
    return tags;
  }
  function productTags(p){
    const direct=parseTags(p?.categories || p?.category || p?.categoria || p?.etiquetas || p?.tags);
    const tags=direct.length?direct:inferTagsFromProduct(p);
    return tags.length?tags:['General'];
  }
  function categoryText(p){return productTags(p).join(', ')}
  function firstTag(p){return productTags(p)[0]||'General'}
  function allCategories(){
    const cats=Array.from(new Set(state.products.flatMap(p=>productTags(p)).filter(Boolean)));
    return ['Todos',...cats.sort((a,b)=>a.localeCompare(b,'es'))];
  }
  function catSlug(str){return String(str||'categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'categoria'}
  function categoryImage(cat){const c=String(cat||'General').toLowerCase(); if(c==='todos')return 'assets/categorias/todas.svg'; return `assets/categorias/${catSlug(cat)}.svg`}
  function categoryCount(cat){if(cat==='Todos')return state.products.length; const t=String(cat).toLowerCase(); return state.products.filter(p=>productTags(p).some(x=>x.toLowerCase()===t)).length}

  function placeholderFor(p){const tags=productTags(p).join(' ').toLowerCase(); if(tags.includes('gamer')||tags.includes('dedal')||tags.includes('gatillo'))return SDC_PLACEHOLDERS.gamer; if(tags.includes('tec')||tags.includes('celular')||tags.includes('audio')||tags.includes('cable'))return SDC_PLACEHOLDERS.tecnologia; if(tags.includes('hogar')||tags.includes('cocina'))return SDC_PLACEHOLDERS.hogar; return SDC_PLACEHOLDERS.default}
  function captureFallbackImage(){return (window.SDC_PLACEHOLDERS && (SDC_PLACEHOLDERS.gamer||SDC_PLACEHOLDERS.default)) || LOGO_SRC}
  function galleryOf(p){const g=String(p.gallery||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean); const list=[p.image,...g].filter(Boolean); return Array.from(new Set(list))}
  function productImage(p){return galleryOf(p)[0] || placeholderFor(p)}
  function onImgError(img,p){img.onerror=null; img.src=placeholderFor(p||{});}
  function productById(id){return state.products.find(p=>p.id===id)}
  function nextCode(){let max=0; state.products.forEach(p=>{const m=String(p.id).match(/(\d+)$/); if(m) max=Math.max(max,Number(m[1]))}); return `SDC-${String(max+1).padStart(3,'0')}`}
  function emptyQuote(){return {id:'COT-'+Date.now(),items:[],client:'',phone:'',department:'Comayagua',municipality:'Comayagua',reference:'',shippingType:'Normal',company:'Forza',shipping:110,cod:false,discount:0,date:new Date().toISOString(),saved:false}}
  function emptySale(){return {...emptyQuote(), id:'SDC-'+Date.now().toString().slice(-10), kind:'receipt'}}
  function itemProductRef(it){return productById(it?.id)||it||{}}
  function itemTotal(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    if(p && (p.promos || p.price!==undefined)) return productItemsTotal(p,qty);
    return qty*Number(it?.price||0);
  }
  function itemEffectiveUnit(it){const qty=Math.max(1,Number(it?.qty)||1); return itemTotal(it)/qty}
  function itemPromoApplied(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    return promoTotalForQty(p,qty)!==null && itemTotal(it)!==(qty*Number(it?.price||p?.price||0));
  }
  function calc(doc){const products=(doc.items||[]).reduce((a,it)=>a+itemTotal(it),0); const shipping=Number(doc.shipping||0); const discount=Number(doc.discount||0); const base=Math.max(0,products+shipping); const commission=doc.cod?Math.round(base*((state.settings.codPercent||6)/100)):0; const delivery=shipping+commission; const total=Math.max(0,products+delivery-discount); return {products,shipping,commission,delivery,discount,total}}
  function promoTiers(p){
    return parsePromoRows(p?.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0).sort((a,b)=>a.qty-b.qty);
  }
  function promoTotalForQty(p,qty){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return null;
    const exact=rows.find(r=>r.qty===qty);
    if(exact) return exact.price;
    const tier=[...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return null;
    const unit=tier.price/tier.qty;
    return Math.round(qty*unit);
  }
  function promoLabelForQty(p,qty){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return '';
    const exact=rows.find(r=>r.qty===qty);
    const tier=exact || [...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return '';
    const unit=tier.price/tier.qty;
    return `Oferta aplicada: ${money(unit)} c/u desde ${num(tier.qty)} unidades`;
  }
  function productItemsTotal(p,qty=1){
    qty=Math.max(1,Number(qty)||1);
    const promo=promoTotalForQty(p,qty);
    return promo!==null?promo:qty*Number(p?.price||0);
  }
  function productNormalTotalQty(p,qty=1){return productItemsTotal(p,qty)+110}
  function productCodTotalQty(p,qty=1){const base=productItemsTotal(p,qty)+100; return Math.round(base*(1+((state.settings.codPercent||6)/100)))}
  function productNormalTotal(p){return productNormalTotalQty(p,1)}
  function productCodTotal(p){return productCodTotalQty(p,1)}
  function promoRowsForCustomer(p){
    const basePrice=Number(p.price||0);
    const rows=parsePromoRows(p.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0);
    const hasPromos=String(p.promos||'').trim().length>0;
    if(hasPromos && basePrice>0 && !rows.some(r=>r.qty===1)) rows.unshift({qty:1,price:basePrice});
    const unique=new Map();
    rows.sort((a,b)=>a.qty-b.qty).forEach(r=>unique.set(r.qty,r));
    return Array.from(unique.values()).slice(0,14);
  }
  function promoPublicHTML(p){
    return '';
  }
  function promoWhatsAppLines(p){
    const rows=promoRowsForCustomer(p);
    if(!String(p.promos||'').trim() || !rows.length) return '';
    return rows.map(r=>`• ${num(r.qty)} ${r.qty===1?'unidad':'unidades'}: Producto ${money(r.price)} | Envío Normal ${money(r.price+110)} | Pagar al Recibir ${money(Math.round((r.price+100)*(1+((state.settings.codPercent||6)/100))))}`).join('\n');
  }
  function setView(v){currentView=v; render(); window.scrollTo({top:0,behavior:'smooth'});}
  function getSheetApiUrl(){return String(state.settings.webAppUrl || (window.SDC_CONFIG&&window.SDC_CONFIG.webAppUrl) || '').trim()}
  function getSheetId(){return String(state.settings.sheetId || (window.SDC_CONFIG&&window.SDC_CONFIG.sheetId) || '1ISLGulvbwZuTYhI0pyuLiIq0Ntl_x5y0K0Um1gOb32U').trim()}
  function getProductSheetName(){return String(state.settings.productSheet || (window.SDC_CONFIG&&window.SDC_CONFIG.productSheet) || 'productos_pos').trim()}
  function normalizeSheetRemoteProduct(row,i=0){
    const p=SDCStore.normalizeProduct({
      id: row.codigo || row.id || row.code || row.sku || `SDC-${String(i+1).padStart(3,'0')}`,
      name: row.nombre || row.name || row.producto || 'Producto sin nombre',
      categories: row.categoria || row.categorias || row.category || row.categories || 'General',
      brand: row.marca || row.brand || '',
      price: row.precio ?? row.price ?? row.precio_venta ?? 0,
      cost: row.costo ?? row.cost ?? row.costo_compra ?? 0,
      stock: row.stock ?? row.existencia ?? row.inventario ?? 0,
      image: row.imagen || row.image || row.foto || '',
      gallery: row.galeria || row.gallery || row.imagenes || '',
      description: row.descripcion || row.description || row.detalle || '',
      promos: row.promos || row.promociones || row.mayoreo || row.ofertas || '',
      active: !(row.active===false || row.activo===false || String(row.active??row.activo??'1').trim()==='0'),
      updatedAt: row.updatedAt || row.updated_at || row.fecha_actualizacion || ''
    },i);
    return p.active===false?null:p;
  }
  function sheetJsonp(params){
    return new Promise((resolve,reject)=>{
      const base=getSheetApiUrl();
      if(!base) return reject(new Error('No hay URL /exec de Apps Script configurada.'));
      const cb='sdcSheetCb_'+Date.now()+'_'+Math.floor(Math.random()*9999);
      const url=new URL(base);
      Object.entries({...params,callback:cb,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup(); reject(new Error('Tiempo agotado conectando con Google Sheets.'));},12000);
      function cleanup(){clearTimeout(timer); delete window[cb]; script.remove();}
      window[cb]=(data)=>{cleanup(); resolve(data)};
      script.onerror=()=>{cleanup(); reject(new Error('No se pudo cargar la respuesta de Apps Script.'))};
      script.src=url.toString(); document.head.appendChild(script);
    });
  }
  async function sheetGet(params={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    const url=new URL(base);
    Object.entries({...params,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
    try{
      const res=await fetch(url.toString(),{method:'GET',cache:'no-store',redirect:'follow'});
      const txt=await res.text();
      const data=JSON.parse(txt);
      return data;
    }catch(err){
      return sheetJsonp(params);
    }
  }
  async function sheetPost(payload={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    const body={sheetId:getSheetId(),productSheet:getProductSheetName(),adminKey:state.settings.accessKey||'',...payload};
    const res=await fetch(base,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
    const txt=await res.text();
    let data; try{data=JSON.parse(txt)}catch(e){throw new Error('Apps Script no devolvió JSON válido.')}
    if(!data.ok) throw new Error(data.error||'No se pudo guardar en Google Sheets.');
    return data;
  }
  async function syncProductsFromSheets(opts={}){
    const silent=!!opts.silent;
    if(!getSheetApiUrl()){
      if(!silent) toast('Falta configurar la URL /exec de Apps Script.');
      return false;
    }
    try{
      if(!silent) toast('Conectando con Google Sheets...');
      const data=await sheetGet({action:'products',only:'productos',sheetId:getSheetId(),productSheet:getProductSheetName()});
      if(!data || data.ok===false) throw new Error(data?.error||'Apps Script respondió con error.');
      const raw=data.products || data.productos || data.rows || [];
      const products=raw.map(normalizeSheetRemoteProduct).filter(Boolean);
      if(!products.length) throw new Error('No encontré productos activos en la hoja productos_pos.');
      state.products=products;
      state.settings.lastSheetSync=new Date().toISOString();
      state.settings.sheetId=getSheetId();
      save();
      if(!silent){render(); toast(`${products.length} productos sincronizados desde Google Sheets.`)}
      return true;
    }catch(err){
      if(!silent) toast('No se pudo sincronizar: '+(err.message||err));
      return false;
    }
  }
  async function syncLocal(){
    hydrateState();
    if(getSheetApiUrl()){
      const ok=await syncProductsFromSheets({silent:false});
      if(ok) return;
    }
    state=SDCStore.load(); hydrateState(); state.unlocked=true; save(); applyAppearance(); render(); toast('Sincronizado con los datos guardados en este dispositivo.');
  }
  function bootSheetSync(){
    if(!state.unlocked || !state.settings.autoSheetSync || !getSheetApiUrl()) return;
    const key='sdc_sheet_sync_boot_'+getSheetId();
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,'1');
    setTimeout(()=>syncProductsFromSheets({silent:true}),450);
  }
  async function saveProductToSheets(product){
    if(!getSheetApiUrl()) return false;
    await sheetPost({action:'upsertProduct',product});
    return true;
  }
  async function archiveProductInSheets(productId){
    if(!getSheetApiUrl()) return false;
    await sheetPost({action:'setActive',codigo:productId,active:false});
    return true;
  }
  function currentAppearance(){return ['turbo','pro-gamer','pro'].includes(state.settings.appearance)?'turbo':'gamer'}
  function applyAppearance(){const mode=currentAppearance(); document.body.classList.toggle('pro-mode',false); document.body.classList.toggle('turbo-mode',mode==='turbo'); document.body.classList.toggle('gamer-mode',mode==='gamer'); document.body.classList.toggle('capture-clean',!!state.settings.captureClean); document.body.classList.toggle('money-locked',!!state.settings.moneyLocked);}
  function toggleAppearance(){state.settings.appearance=currentAppearance()==='gamer'?'turbo':'gamer'; save(); applyAppearance(); render(); toast(currentAppearance()==='turbo'?'Pro Gamer activado.':'Gamer normal activado.');}

  function render(){
    applyAppearance();
    if(!state.unlocked){renderLogin();return}
    app.className='app';
    app.innerHTML = `${topbar()}${hero()}${quickPanel()}${cardModePanel()}${searchPanel()}${categoryGallery()}${inventoryHTML()}${bottomNav()}`;
    bindMain();
    // V25: conectar controles de cantidad en la vista Cliente desde la primera carga del catálogo.
    bindProductCards();
  }
  function renderLogin(){
    app.className='login-wrap';
    app.innerHTML=`<section class="login-card">
      <img class="login-logo" src="${LOGO_SRC}" alt="Logo SD Comayagua">
      <h1 class="login-title">SDC VENTAS</h1>
      <div class="pill login-pill"><span class="dot"></span> Acceso administrativo</div>
      <div class="form-box">
        <label class="label" for="keyInput">Clave de acceso</label>
        <input id="keyInput" class="input" type="password" inputmode="numeric" placeholder="Ingresa tu clave" autocomplete="current-password">
        <button id="loginBtn" class="btn full" style="margin-top:14px">Entrar al panel</button>
      </div>
    </section>`;
    $('#loginBtn').onclick=unlock; $('#keyInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
  }
  function unlock(){ if($('#keyInput').value.trim()===(state.settings.accessKey||'199311')){state.unlocked=true;save();render();bootSheetSync();toast('Acceso autorizado.')} else toast('Clave incorrecta.'); }
  function topbar(){const turbo=currentAppearance()==='turbo'; return `<header class="topbar"><img class="top-logo" src="${LOGO_SRC}" alt="SD"><div class="top-title"><h1>SD COMAYAGUA</h1><p>Ventas · inventario · cotizaciones</p></div><div class="spacer"></div><button class="btn small ghost aspect-btn" data-action="theme">${turbo?'Normal':'Pro'}</button><button class="btn small ghost sync-btn" data-action="sync">Sheets</button><button class="btn small secondary" data-action="lock">Salir</button></header>`}
  function hero(){
    const st=stats();
    return `<section class="hero" id="inicio">
      <div class="private-hero-head private-hero-head--no-logo"><div><div class="pill"><span class="dot"></span> Panel administrativo</div><h2>Centro de ventas</h2><p>Inventario, cotizaciones, caja y contenido para WhatsApp en un solo lugar.</p></div></div>
      <div class="stats">
        <div class="stat"><b>${num(st.count)}</b><span>Productos</span></div><div class="stat"><b>${num(st.stock)}</b><span>Stock total</span></div>
        <div class="stat"><b>${moneyPrivate(st.value)}</b><span>Valor venta</span></div><div class="stat"><b>${moneyPrivate(st.invested)}</b><span>Invertido</span></div>
        <div class="stat"><b>${moneyPrivate(st.profit)}</b><span>Ganancia</span></div>
      </div>
    </section>`
  }
  function stats(){let count=state.products.length,stock=0,value=0,invested=0; state.products.forEach(p=>{stock+=+p.stock||0; value+=(+p.stock||0)*(+p.price||0); invested+=(+p.stock||0)*(+p.cost||0)}); return {count,stock,value,invested,profit:value-invested}}
  function cardView(){return state.settings.cardView==='client'?'client':'admin'}
  function setCardView(view){state.settings.cardView=view==='client'?'client':'admin'; save(); render(); toast(state.settings.cardView==='client'?'Vista cliente activada: se ocultan costos y ganancias.':'Vista admin activada: inversión y ganancias visibles.');}
  function clientQty(id){const map=state.settings.clientQtyMap||{}; return Math.max(1,Number(map[id])||1)}
  function setClientQty(id,qty){
    state.settings.clientQtyMap=state.settings.clientQtyMap||{};
    const clean=Math.max(1,Math.min(999,Number(qty)||1));
    state.settings.clientQtyMap[id]=clean;
    save();
    updateClientCardTotals(id);
  }
  function updateClientCardTotals(id){
    const p=productById(id); if(!p)return;
    const qty=clientQty(id);
    const card=Array.from(document.querySelectorAll('article.product-card')).find(x=>x.dataset.id===id);
    if(!card)return;
    const inp=card.querySelector(`[data-cqty-input]`);
    if(inp && document.activeElement!==inp) inp.value=qty;
    const productTotal=productItemsTotal(p,qty), normalTotal=productNormalTotalQty(p,qty), codTotal=productCodTotalQty(p,qty);
    const set=(key,value)=>{const el=card.querySelector(`[data-client-total="${key}"]`); if(el) el.textContent=value;};
    set('qty', promoTotalForQty(p,qty)!==null?`Total · ${num(qty)} · oferta`: `Total · ${num(qty)}`);
    set('product', money(productTotal));
    set('normal', money(normalTotal));
    set('cod', money(codTotal));
    const offer=card.querySelector('[data-client-total="offer"]');
    if(offer){ const label=promoLabelForQty(p,qty); offer.textContent=label?`🎁 ${label}`:''; offer.style.display=label?'block':'none'; }
  }
  function quickPanel(){
    const low=state.products.filter(p=>Number(p.stock)>0 && Number(p.stock)<=Number(state.settings.lowStockLimit||3)).length;
    const nocost=state.products.filter(p=>Number(p.cost)<=0).length;
    const st=stats();
    const lowMargin=state.products.filter(p=>Number(p.price||0)>0 && (Number(p.price||0)-Number(p.cost||0))>0 && (Number(p.price||0)-Number(p.cost||0))<10).length;
    return `<section class="quick no-print quick-v22 quick-private quick-panel">
      <div class="quick-grid" aria-label="Acciones rápidas del panel">
        <button class="quick-btn" data-action="cardClient"><b>Cliente</b><small>Foto/texto limpio</small></button>
        <button class="quick-btn" data-action="captureClean"><b>Captura</b><small>Solo lo necesario</small></button>
        <button class="quick-btn" data-action="quote"><b>Cotizar</b><small>Agregar y calcular</small></button>
        <button class="quick-btn" data-action="sell"><b>Vender</b><small>Venta real</small></button>
        <button class="quick-btn" data-action="catalog"><b>Catálogo</b><small>Ver productos</small></button>
        <button class="quick-btn" data-action="newProduct"><b>Producto</b><small>Agregar nuevo</small></button>
        <button class="quick-btn" data-action="quickSale"><b>Rápida</b><small>Sin tantos pasos</small></button>
        <button class="quick-btn" data-action="quotes"><b>Guardadas</b><small>Cotizaciones</small></button>
        <button class="quick-btn" data-action="clients"><b>Clientes</b><small>Agenda</small></button>
        <button class="quick-btn" data-action="receipts"><b>Caja</b><small>Ventas</small></button>
        <button class="quick-btn" data-action="profit"><b>Ganancia</b><small>Control interno</small></button>
        <button class="quick-btn" data-action="backup"><b>Respaldo</b><small>Copia segura</small></button>
      </div>
    </section>
    <section class="alert-row no-print">
      <div class="alert-grid">
        <div class="alert-card"><div><b>${low} bajo stock</b><span>Revisa reposición.</span></div><button class="btn small secondary" data-action="lowStock">Ver</button></div>
        <div class="alert-card"><div><b>${nocost} sin costo</b><span>Agrega costo para ganancia real.</span></div><button class="btn small secondary" data-action="noCost">Revisar</button></div>
        <div class="alert-card"><div><b>${lowMargin} ganancia baja</b><span>Menos de Lps. 10 por unidad.</span></div><button class="btn small secondary" data-action="profit">Detalle</button></div>
        <div class="alert-card"><div><b>Ganancia</b><span>${money(st.profit)} estimado.</span></div><button class="btn small secondary" data-action="profit">Detalle</button></div>
        <div class="alert-card"><div><b>${state.settings.moneyLocked?'Ganancias ocultas':'Ganancias visibles'}</b><span>Protege costos y utilidad.</span></div><button class="btn small secondary" data-action="moneyLock">${state.settings.moneyLocked?'Mostrar':'Ocultar'}</button></div>
      </div>
    </section>`
  }
  function cardModePanel(){
    const mode=cardView();
    const captureActive=!!state.settings.captureClean;
    return `<section class="view-mode-panel no-print"><div class="view-mode-copy"><b>Modo de trabajo</b><span>${captureActive?'Modo captura activo. Toque SALIR para volver a la vista normal.':(mode==='admin'?'Admin: costos, inversión y ganancia visibles en el panel.':'Cliente: precio, descripción y totales listos para enviar.')}</span></div><div class="view-mode-buttons"><button class="${mode==='admin'&&!captureActive?'active':''}" data-action="cardAdmin">ADMIN</button><button class="${mode==='client'&&!captureActive?'active':''}" data-action="cardClient">CLIENTE</button><button class="${captureActive?'active capture-live':''}" data-action="captureClean">${captureActive?'SALIR':'CAPTURA'}</button></div></section>`
  }

  function searchPanel(){
    return `<section class="search-panel v10-search clean-search no-print" id="searchPanel"><div class="search-title"><b>Buscar rápido</b><span>Para preparar foto, texto o venta</span></div><div class="searchbar"><span class="icon">⌕</span><input id="searchInput" placeholder="Producto, código, categoría o detalle" value="${escapeHtml(filter.q)}" autocomplete="off" inputmode="search"></div></section>`}
  function categoryGallery(){
    const cats=allCategories();
    return `<section class="category-gallery no-print" id="categoriesBlock"><div class="category-head"><div><h2>CATEGORÍAS</h2><p>Filtro rápido para encontrar el producto antes de compartirlo.</p></div><span>${cats.length-1} categorías</span></div><div class="category-grid">${cats.map(c=>`<button class="category-card ${filter.cat===c?'active':''}" data-catcard="${escapeHtml(c)}"><img src="${escapeHtml(categoryImage(c))}" alt="${escapeHtml(c)}" onerror="this.onerror=null;this.src='assets/categorias/categoria.svg'"><b>${escapeHtml(c)}</b><small>${categoryCount(c)} productos</small></button>`).join('')}</div></section>`
  }
  function refreshCategoryUI(){
    $$('.chip').forEach(x=>x.classList.toggle('active',x.dataset.cat===filter.cat));
    $$('.cat-mini').forEach(x=>x.classList.toggle('active',x.dataset.minicat===filter.cat));
    $$('.category-card').forEach(x=>x.classList.toggle('active',x.dataset.catcard===filter.cat));
  }
  function bindProductCards(){
    document.querySelectorAll('#inventario [data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});
    document.querySelectorAll('#inventario [data-cqty-minus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyMinus,clientQty(btn.dataset.cqtyMinus)-1)})});
    document.querySelectorAll('#inventario [data-cqty-plus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyPlus,clientQty(btn.dataset.cqtyPlus)+1)})});
    document.querySelectorAll('#inventario [data-cqty-input]').forEach(inp=>{if(inp.dataset.bound)return; inp.dataset.bound=1; const update=()=>setClientQty(inp.dataset.cqtyInput,inp.value); inp.addEventListener('input',update); inp.addEventListener('change',update); inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()})});
  }
  function renderInventoryOnly(){
    const inv=$('#inventario'); if(!inv){render();return}
    const list=filteredProducts();
    const count=inv.querySelector('.count-pill');
    const content=inv.querySelector('.inventory-content');
    if(count) count.textContent=`${list.length} resultados`;
    if(content){
      content.innerHTML=list.length?`<div class="grid">${list.map(productCard).join('')}</div>`:`<div class="empty-state">No encontré productos con esa búsqueda o etiqueta.</div>`;
    }else{
      inv.innerHTML=`<div class="section-head"><h2>INVENTARIO</h2><span class="count-pill">${list.length} resultados</span></div><div class="inventory-content">${list.length?`<div class="grid">${list.map(productCard).join('')}</div>`:`<div class="empty-state">No encontré productos con esa búsqueda o etiqueta.</div>`}</div>`;
    }
    bindProductCards();
    refreshCategoryUI();
  }
  function applyCategory(cat){const y=window.scrollY; filter.cat=cat||'Todos'; renderInventoryOnly(); requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));}

  function filteredProducts(){
    const q=filter.q.trim().toLowerCase();
    return state.products.filter(p=>{
      const tags=productTags(p);
      const inCat=filter.cat==='Todos'||tags.some(t=>t.toLowerCase()===filter.cat.toLowerCase());
      const hay=[p.name,p.id,categoryText(p),p.description,p.category,p.categoria,p.etiquetas].join(' ').toLowerCase();
      return inCat && (!q || hay.includes(q));
    })
  }
  function inventoryHTML(){const list=filteredProducts(); return `<section id="inventario"><div class="section-head"><h2>INVENTARIO</h2><span class="count-pill">${list.length} resultados</span></div><div class="inventory-content">${list.length?`<div class="grid">${list.map(productCard).join('')}</div>`:`<div class="empty-state">No encontré productos con esa búsqueda o etiqueta.</div>`}</div></section>`}
  function productCard(p){
    const tags=productTags(p); const low=Number(p.stock)>0&&Number(p.stock)<=Number(state.settings.lowStockLimit||3); const sold=Number(p.stock)<=0;
    const stock=Number(p.stock)||0, price=Number(p.price)||0, cost=Number(p.cost)||0, profitUnit=price-cost, invested=stock*cost, saleValue=stock*price, profitTotal=stock*profitUnit, lowProfit=price>0&&profitUnit>0&&profitUnit<10;
    const percent=Math.max(5,Math.min(100,stock/20*100));
    const mode=cardView(); const qty=clientQty(p.id); const productTotal=productItemsTotal(p,qty); const normalTotal=productNormalTotalQty(p,qty); const codTotal=productCodTotalQty(p,qty);
    const promoBadge=promoTiers(p).length?`<div class="offer-mini-badge">🎁 Ofertas configuradas por cantidad</div>`:'';
    const appliedOffer=promoLabelForQty(p,qty);
    const adminView=`${promoBadge}<div class="metrics admin-metrics"><div class="metric"><span>Stock</span><b>${num(stock)} disponibles</b></div><div class="metric"><span>Invertido</span><b>${cost>0?moneyPrivate(invested):'Sin costo'}</b></div><div class="metric"><span>Ganancia C/U</span><b>${moneyPrivate(profitUnit)}</b></div><div class="metric profit-total ${lowProfit?'low-profit':''}"><span>Ganancia Total</span><b>${moneyPrivate(profitTotal)}</b></div></div>${lowProfit?'<div class="profit-warning">⚠ Ganancia baja por unidad. Revise precio o costo.</div>':''}<div class="admin-total-line"><span>Si vende todo el stock</span><b>${moneyPrivate(saleValue)}</b></div><div class="stock-line"><i style="width:${percent}%"></i></div><div class="card-actions"><button class="btn secondary quote" data-action="quoteProduct" data-id="${escapeHtml(p.id)}">Cotizar</button><button class="btn" data-action="sellProduct" data-id="${escapeHtml(p.id)}">Vender</button><button class="btn secondary" data-action="viewProduct" data-id="${escapeHtml(p.id)}">Ver</button><button class="btn secondary" data-action="marketingProduct" data-id="${escapeHtml(p.id)}">Textos</button><button class="btn ghost" data-action="editProduct" data-id="${escapeHtml(p.id)}">Editar</button></div>`;
    const clientView=`<div class="client-card-panel"><p class="client-description">${escapeHtml(p.description||'Producto disponible para entrega. Consulte disponibilidad antes de confirmar su pedido.')}</p><div class="client-qty-card"><span>Cantidad consultada</span><div class="inline-qty"><button data-cqty-minus="${escapeHtml(p.id)}">−</button><input data-cqty-input="${escapeHtml(p.id)}" type="number" min="1" inputmode="numeric" value="${qty}"><button data-cqty-plus="${escapeHtml(p.id)}">+</button></div></div><div class="client-totals-card"><div><span data-client-total="qty">${promoTotalForQty(p,qty)!==null?`Total · ${num(qty)} · oferta`:`Total · ${num(qty)}`}</span><b data-client-total="product">${money(productTotal)}</b></div><div><span>Normal</span><b data-client-total="normal">${money(normalTotal)}</b><small>Prod. + 110</small></div><div><span>Recibir + 6%</span><b data-client-total="cod">${money(codTotal)}</b><small>Prod. + 100 + com.</small></div></div>${appliedOffer?`<div class="client-offer-line" data-client-total="offer">🎁 ${escapeHtml(appliedOffer)}</div>`:''}</div><div class="card-actions client-actions client-actions-v23"><button class="btn secondary quote" data-action="quoteProduct" data-id="${escapeHtml(p.id)}">Cotizar</button><button class="btn" data-action="waProduct" data-id="${escapeHtml(p.id)}">WhatsApp</button><button class="btn secondary" data-action="viewProduct" data-id="${escapeHtml(p.id)}">Foto</button></div>`;
    return `<article class="product-card ${mode==='client'?'client-view':'admin-view'}" data-id="${escapeHtml(p.id)}"><div class="product-top"><div class="tag-stack"><span class="tag-pill">${escapeHtml(tags[0]||'General')}</span>${tags.length>1?`<span class="tag-pill">+${tags.length-1}</span>`:''}</div><span class="code-pill">${escapeHtml(p.id)}</span></div>
      <div class="product-media"><img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${low?'low':''}"><span class="dot" style="background:#031018;box-shadow:none"></span>${sold?'Agotado':low?'Bajo stock':'Disponible'}</span><b class="price-badge">${money(price)}</b></div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3>${mode==='client'?clientView:adminView}</article>`
  }
  function bottomNav(){return `<nav class="bottom-nav no-print"><button class="nav-btn ${currentView==='catalog'?'active':''}" data-action="catalog"><i>⌂</i><span>Catálogo</span></button><button class="nav-btn" data-action="sell"><i>🛒</i><span>Vender</span></button><button class="nav-btn" data-action="receipts"><i>▤</i><span>Caja</span></button><button class="nav-btn" data-action="newProduct"><i>＋</i><span>Producto</span></button><button class="nav-btn ${currentView==='quote'?'active':''}" data-action="quote"><i>▧</i><span>Cotizar</span></button></nav>`}

  function bindMain(){
    $('[data-action="lock"]')?.addEventListener('click',()=>{state.unlocked=false;save();render()});
    const search=$('#searchInput');
    if(search){
      let raf=0;
      const run=()=>{raf=0; const y=window.scrollY; renderInventoryOnly(); requestAnimationFrame(()=>{ if(document.activeElement===search){ search.focus({preventScroll:true}); window.scrollTo({top:y,left:0,behavior:'auto'}); } });};
      search.addEventListener('focus',()=>document.body.classList.add('search-active'));
      search.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('search-active'),160));
      search.addEventListener('input',e=>{filter.q=e.target.value; if(!raf) raf=requestAnimationFrame(run);});
    }
    $$('.chip').forEach(b=>b.onclick=()=>applyCategory(b.dataset.cat));
    $$('.cat-mini').forEach(b=>b.onclick=()=>applyCategory(b.dataset.minicat));
    $$('.category-card').forEach(b=>b.onclick=()=>applyCategory(b.dataset.catcard));
    document.querySelectorAll('[data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});
  }
  function mainAction(e){
    const a=e.currentTarget.dataset.action, id=e.currentTarget.dataset.id;
    if(a==='catalog') return setView('catalog');
    if(a==='sell') return openSale();
    if(a==='quote') return openQuote();
    if(a==='newProduct') return openProductEditor();
    if(a==='editProduct') return openProductEditor(id);
    if(a==='viewProduct') return openProductDetails(id);
    if(a==='sellProduct') return openSale(id);
    if(a==='quoteProduct') return openQuote(id);
    if(a==='backup') return openBackup();
    if(a==='sync') return syncLocal();
    if(a==='theme') return toggleAppearance();
    if(a==='cardAdmin') return setCardView('admin');
    if(a==='cardClient') return setCardView('client');
    if(a==='waProduct'){const p=productById(id); if(p)return sendProductWhatsApp(p,clientQty(id));}
    if(a==='profit') return openProfit();
    if(a==='receipts') return openReceipts();
    if(a==='quotes') return openSavedQuotes();
    if(a==='clients') return openClients();
    if(a==='dailyClose') return openDailyClose();
    if(a==='marketingProduct') return openMarketingText(id);
    if(a==='quickSale') return openQuickSale();
    if(a==='expenses') return openExpenses();
    if(a==='moneyLock') return toggleMoneyLock();
    if(a==='captureClean') return toggleCaptureClean();
    if(a==='exportAll') return exportAllCSV();

    if(a==='lowStock'){filter.cat='Todos'; filter.q=''; render(); setTimeout(()=>{state.products.filter(p=>+p.stock>0&&+p.stock<=3).length?toast('Productos de bajo stock marcados con etiqueta amarilla.'):toast('No hay productos en bajo stock.')},50)}
    if(a==='noCost'){filter.cat='Todos'; filter.q='Sin costo'; render(); openNoCost();}
  }

  function openModal(html,wide=false){
    document.body.classList.add('modal-open');
    document.documentElement.scrollLeft=0; document.body.scrollLeft=0;
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}">${html}</section></div>`;
    const m=$('.modal',modalRoot); if(m){m.scrollLeft=0; m.scrollTop=0;}
    $('.close',modalRoot)?.addEventListener('click',closeModal);
    modalRoot.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  }
  function closeModal(){document.body.classList.remove('modal-open'); modalRoot.innerHTML=''}

  function splitGallery(prod){
    const p=SDCStore.normalizeProduct(prod||{},state.products.length);
    const urls=[p.image,...String(p.gallery||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean);
    return urls.length?urls:[''];
  }
  function parsePromoRows(text){
    const rows=String(text||'').split(/[\n|;]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const clean=line.replace(/lps\.?|hnl|lempiras?|total|paquete|pares?|unidades?|uds?\.?/ig,'').replace(/,/g,'.').trim();
      const m=clean.match(/^(\d+)\s*(?:[=:]|-|→|a)\s*(\d+(?:\.\d+)?)$/i);
      return m?{qty:m[1],price:m[2]}:{qty:'',price:''};
    }).filter(r=>r.qty||r.price);
    return rows.length?rows:[{qty:'',price:''}];
  }
  function productForm(p={}){
    const prod=SDCStore.normalizeProduct(p,state.products.length); if(!p.id) prod.id=nextCode();
    return `<div class="modal-head"><h3>${p.id?'Editar':'Nuevo'} producto</h3><button class="close">×</button></div><div class="modal-body product-editor"><div class="card-box"><h4>Información básica</h4><div class="modal-grid"><label><span class="label">Nombre del producto</span><input id="pName" class="input" value="${escapeHtml(prod.name)}"></label><label><span class="label">Código</span><input id="pId" class="input" value="${escapeHtml(prod.id)}"></label><label class="span2"><span class="label">Categorías / etiquetas</span><input id="pCats" class="input" value="${escapeHtml(prod.categories)}" placeholder="Ejemplo: Dedales, Gamer Móvil"></label><label><span class="label">Costo compra</span><input id="pCost" class="input" type="number" value="${prod.cost}"></label><label><span class="label">Precio venta</span><input id="pPrice" class="input" type="number" value="${prod.price}"></label><label><span class="label">Stock</span><input id="pStock" class="input" type="number" value="${prod.stock}"></label><div class="span2"><span class="label">Imágenes del producto</span><div id="imageRows" class="image-rows"></div><button class="btn secondary full add-line" id="addImageRow" type="button">+ Añadir imagen</button><small class="hint">La primera imagen será la principal. Puedes agregar imagen 2, imagen 3, imagen 4 y las que necesites.</small></div><div class="span2 promo-editor-box"><span class="label">Ofertas por cantidad</span><div class="promo-help"><b>Regla clara:</b> Cantidad mínima + precio total del paquete. Ejemplo: 20 pares a Lps.20 c/u = Cantidad 20 y Total 400.</div><div id="promoRows" class="promo-rows"></div><button class="btn secondary full add-line" id="addPromoRow" type="button">+ Agregar oferta</button><small class="hint">El sistema aplica la mejor oferta automáticamente en cotización, WhatsApp, factura y caja.</small></div><label class="span2"><span class="label">Descripción / beneficios / incluye</span><textarea id="pDesc" class="textarea">${escapeHtml(prod.description)}</textarea></label></div><div class="chips">${['Gamer Móvil','Dedales','Gatillos','Tecnología','Celulares','Audio','Cables','Hogar','Cocina'].map(c=>`<button class="chip" data-addcat="${c}">${c}</button>`).join('')}</div></div><div class="modal-actions product-form-actions"><button class="btn" id="saveProduct">Guardar producto</button>${p.id?`<button class="btn secondary" id="duplicateProduct">Duplicar</button><button class="btn danger" id="deleteProduct">Eliminar</button>`:''}</div></div>`
  }
  function openProductEditor(id){
    const p=id?productById(id):{}; const prod=SDCStore.normalizeProduct(p||{},state.products.length);
    let imageRows=splitGallery(prod); let promoRows=parsePromoRows(prod.promos);
    openModal(productForm(p),true);
    function drawImages(){
      $('#imageRows',modalRoot).innerHTML=imageRows.map((url,i)=>`<div class="mini-row image-row"><span class="row-index">Imagen ${i+1}</span><input class="input pImageUrl" value="${escapeHtml(url)}" placeholder="https://..."><button class="btn small ghost" data-delimage="${i}" type="button">×</button></div>`).join('');
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>inp.oninput=()=>{imageRows[i]=inp.value});
      $$('[data-delimage]',modalRoot).forEach(b=>b.onclick=()=>{if(imageRows.length>1)imageRows.splice(+b.dataset.delimage,1);else imageRows[0]='';drawImages()});
    }
    function drawPromos(){
      $('#promoRows',modalRoot).innerHTML=promoRows.map((r,i)=>{const q=Number(r.qty)||0, pr=Number(r.price)||0, unit=q&&pr?money(pr/q):'—'; return `<div class="mini-row promo-row promo-row-v26"><span class="row-index">Oferta ${i+1}</span><label><small>Cantidad mínima</small><input class="input pPromoQty" inputmode="numeric" type="number" value="${escapeHtml(r.qty)}" placeholder="20"></label><label><small>Total paquete</small><input class="input pPromoPrice" inputmode="numeric" type="number" value="${escapeHtml(r.price)}" placeholder="400"></label><span class="promo-unit-preview">${unit} c/u</span><button class="btn small ghost" data-delpromo="${i}" type="button">×</button></div>`}).join('');
      $$('.promo-row',modalRoot).forEach((row,i)=>{ $('.pPromoQty',row).oninput=e=>promoRows[i].qty=e.target.value; $('.pPromoPrice',row).oninput=e=>promoRows[i].price=e.target.value; });
      $$('[data-delpromo]',modalRoot).forEach(b=>b.onclick=()=>{if(promoRows.length>1)promoRows.splice(+b.dataset.delpromo,1);else promoRows[0]={qty:'',price:''};drawPromos()});
    }
    drawImages(); drawPromos();
    $('#addImageRow').onclick=()=>{imageRows.push('');drawImages(); setTimeout(()=>$$('.pImageUrl',modalRoot).at(-1)?.focus(),30)};
    $('#addPromoRow').onclick=()=>{promoRows.push({qty:'',price:''});drawPromos(); setTimeout(()=>$$('.pPromoQty',modalRoot).at(-1)?.focus(),30)};
    $$('[data-addcat]',modalRoot).forEach(b=>b.onclick=()=>{const inp=$('#pCats'); const tags=parseTags(inp.value); if(!tags.some(t=>t.toLowerCase()===b.dataset.addcat.toLowerCase())) tags.push(b.dataset.addcat); inp.value=tags.join(', ')});
    $('#saveProduct').onclick=async()=>{
      const images=$$('.pImageUrl',modalRoot).map(inp=>inp.value.trim()).filter(Boolean);
      const promos=$$('.promo-row',modalRoot).map(row=>{const q=$('.pPromoQty',row).value.trim(); const pr=$('.pPromoPrice',row).value.trim(); return q&&pr?`${q}=${pr}`:''}).filter(Boolean).join('\n');
      const np={id:$('#pId').value.trim()||nextCode(),name:$('#pName').value.trim()||'Producto sin nombre',categories:$('#pCats').value.trim()||'General',cost:+$('#pCost').value||0,price:+$('#pPrice').value||0,stock:+$('#pStock').value||0,image:images[0]||'',gallery:images.slice(1).join('\n'),promos,description:$('#pDesc').value.trim(),active:true};
      const ix=state.products.findIndex(x=>x.id===id); if(ix>=0)state.products[ix]=np; else state.products.push(np); save(); SDCStore.saveBackup(state,'Producto guardado');
      let remoteOk=false;
      try{remoteOk=await saveProductToSheets(np)}catch(err){console.warn('Sheets save failed',err)}
      closeModal(); render(); toast(remoteOk?'Producto guardado en Google Sheets.':'Producto guardado localmente. Revisa conexión con Sheets.');
    };
    $('#duplicateProduct')&&( $('#duplicateProduct').onclick=async()=>{const cp={...prod,id:nextCode(),name:(prod.name||'Producto')+' copia',active:true}; state.products.push(cp); save(); let remoteOk=false; try{remoteOk=await saveProductToSheets(cp)}catch(err){console.warn('Sheets duplicate failed',err)} closeModal(); render(); toast(remoteOk?'Producto duplicado en Google Sheets.':'Producto duplicado localmente.');});
    $('#deleteProduct')&&( $('#deleteProduct').onclick=async()=>{if(confirm('¿Eliminar este producto?')){state.products=state.products.filter(x=>x.id!==id);save(); let remoteOk=false; try{remoteOk=await archiveProductInSheets(id)}catch(err){console.warn('Sheets archive failed',err)} closeModal();render();toast(remoteOk?'Producto ocultado en Google Sheets.':'Producto eliminado localmente.')}})
  }

  function openProductDetails(id){
    const p=productById(id); if(!p)return; const imgs=galleryOf(p); const safeImgs=imgs.length?imgs:[productImage(p)];
    const promos=String(p.promos||'').trim();
    let shareQty=1;
    const unitsLabel=()=>`${num(shareQty)} ${shareQty===1?'unidad':'unidades'}`;
    const promoUsed=()=>promoTotalForQty(p,shareQty)!==null;
    function cardHTML(){
      const productTotal=productItemsTotal(p,shareQty);
      const normalTotal=productNormalTotalQty(p,shareQty);
      const codTotal=productCodTotalQty(p,shareQty);
      const realShareImg=(galleryOf(p)[0]||'').trim();
      const shareMedia=realShareImg?`<img id="detailMainImage" src="${escapeHtml(realShareImg)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.onerror=null;this.closest('.product-share-media').innerHTML='<div class=\"share-fallback-media\"><div class=\"share-fallback-icon\">✚</div><strong>PRODUCTO</strong><span>SD COMAYAGUA</span></div><b class=\"price-badge share-main-price\">${money(unitPrice(p))}</b>'">`:`<div class="share-fallback-media"><div class="share-fallback-icon">✚</div><strong>PRODUCTO</strong><span>SD COMAYAGUA</span></div>`;
      return `<div class="product-share-card product-share-card-v15" id="productShareCard"><div class="share-brand"><span class="share-brand-left"><img class="share-brand-logo" src="${LOGO_SRC}" alt="SD"><span>SD COMAYAGUA</span></span><b>Disponible</b></div><div class="product-share-media">${shareMedia}<b class="price-badge share-main-price">${money(p.price)}</b></div><h2>${escapeHtml(p.name)}</h2><p class="share-description">${escapeHtml(p.description||'Producto disponible para entrega. Consulte disponibilidad antes de confirmar su pedido.')}</p><div class="share-qty-line"><span>Cantidad consultada</span><b id="shareQtyText">${unitsLabel()} · ${money(productTotal)}${promoUsed()?' · promo aplicada':''}</b></div><div class="public-metrics public-metrics-v15"><div><span>Producto</span><b id="metricProduct">${money(productTotal)}</b></div><div><span>Envío normal</span><b id="metricNormal">${money(normalTotal)}</b></div><div><span>Al recibir + 6%</span><b id="metricCod">${money(codTotal)}</b></div></div><div class="process-row"><div class="process-card"><b>Envío Normal</b><span>Deposita, transfiere o paga por Tigo Money: producto + Lps. 110.</span></div><div class="process-card"><b>Pagar al Recibir</b><span>Producto + Lps. 100 de envío + 6% de comisión. Total redondeado en lempiras.</span></div></div><div class="share-footer">SD COMAYAGUA · WhatsApp +504 3151-7755</div></div>`
    }
    openModal(`<div class="modal-head"><h3>Producto</h3><button class="close">×</button></div><div class="modal-body"><div id="shareCardMount">${cardHTML()}</div><div class="client-quote-panel no-print"><div><b>Precio rápido para cliente</b><span>Cambia la cantidad antes de descargar, compartir o enviar por WhatsApp.</span></div><div class="qty-presets"><button data-setqty="1">1</button><button data-setqty="2">2</button><button data-setqty="3">3</button><button data-setqty="5">5</button><button data-setqty="10">10</button><button data-setqty="12">12</button></div><div class="qty-control"><button id="detailQtyMinus">−</button><input id="detailQtyInput" type="number" min="1" value="1" inputmode="numeric"><button id="detailQtyPlus">+</button></div></div><div class="thumb-row">${safeImgs.map((img,i)=>`<button class="thumb ${i===0?'active':''}" data-product-img="${escapeHtml(img)}"><img src="${escapeHtml(img)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"></button>`).join('')}</div><div class="modal-actions product-actions product-actions-grid no-print"><button class="btn secondary prod-action" id="downloadProductPhoto"><span class="ico">▣</span><b>Imagen</b><small>Descargar</small></button><button class="btn prod-action" id="shareProductPhoto"><span class="ico">↗</span><b>Foto</b><small>Compartir</small></button><button class="btn secondary prod-action" id="waProductText"><span class="ico">✎</span><b>Texto</b><small>WhatsApp</small></button><button class="btn prod-action" data-action="sellProduct" data-id="${escapeHtml(id)}"><span class="ico">🛒</span><b>Vender</b><small>Venta real</small></button><button class="btn secondary prod-action" data-action="quoteProduct" data-id="${escapeHtml(id)}"><span class="ico">🧾</span><b>Cotizar</b><small>Precio total</small></button><button class="btn secondary prod-action" data-action="marketingProduct" data-id="${escapeHtml(id)}"><span class="ico">#</span><b>Textos</b><small>Marketplace</small></button><button class="btn ghost prod-action" data-action="editProduct" data-id="${escapeHtml(id)}"><span class="ico">✦</span><b>Editar</b><small>Producto</small></button></div></div>`);
    function refreshShareCard(){
      const currentImg=$('#detailMainImage',modalRoot)?.src || '';
      $('#shareCardMount',modalRoot).innerHTML=cardHTML();
      const img=$('#detailMainImage',modalRoot); if(img && currentImg) img.src=currentImg;
      const input=$('#detailQtyInput',modalRoot); if(input) input.value=shareQty;
    }
    function setQty(v){shareQty=Math.max(1,Math.min(999,Number(v)||1)); refreshShareCard();}
    $$('[data-setqty]',modalRoot).forEach(b=>b.onclick=()=>setQty(b.dataset.setqty));
    $('#detailQtyMinus').onclick=()=>setQty(shareQty-1);
    $('#detailQtyPlus').onclick=()=>setQty(shareQty+1);
    $('#detailQtyInput').oninput=e=>setQty(e.target.value);
    $$('[data-product-img]',modalRoot).forEach(b=>b.onclick=()=>{ $('#detailMainImage',modalRoot).src=b.dataset.productImg; $$('[data-product-img]',modalRoot).forEach(x=>x.classList.toggle('active',x===b)); });
    $('#downloadProductPhoto').onclick=()=>downloadProductPhoto(p);
    $('#shareProductPhoto').onclick=()=>shareProductPhoto(p,shareQty);
    $('#waProductText').onclick=()=>sendProductWhatsApp(p,shareQty);
    $$('[data-action]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();mainAction({currentTarget:b})});
  }
  function productWhatsAppText(p,qty=1){
    qty=Math.max(1,Number(qty)||1);
    const productTotal=productItemsTotal(p,qty);
    const unit=productTotal/qty;
    const promoNote=promoTotalForQty(p,qty)!==null?`\n\u{1F381} *${promoLabelForQty(p,qty)||'Promoción aplicada por cantidad.'}*`:'';
    const moreQtyNote=String(p.promos||'').trim()?`\n\n\u{1F381} *¿Desea varias unidades?*\nPodemos preparar una cotización completa con el paquete exacto y un solo envío.`:'';
    return `\u{1F6CD}\uFE0F *PRODUCTO DISPONIBLE - SD COMAYAGUA*\n\n\u{1F4CC} *Producto:* ${p.name}\n\u{1F522} *Cantidad consultada:* ${num(qty)} ${qty===1?'unidad':'unidades'}\n\u{1F4B0} *Solo producto:* ${money(productTotal)}${qty>1?` (${money(unit)} c/u)`:''}${promoNote}\n\n\u{1F69A} *Envío Normal:* ${money(productNormalTotalQty(p,qty))}\nIncluye producto + *Lps. 110* de envío. Pago por depósito, transferencia o Tigo Money.\n\n\u{1F4E6} *Pagar al Recibir:* ${money(productCodTotalQty(p,qty))}\nIncluye producto + *Lps. 100* de envío + comisión del *6%*.\n\n\u{1F4DD} *Descripción:*\n${p.description||'Producto disponible para entrega.'}${moreQtyNote}\n\n\u{2705} Podemos agregar más productos y preparar una sola cotización para que pague claro.\n\n\u{1F4F2} *WhatsApp SD COMAYAGUA:* +504 3151-7755`;
  }

  function askClientPhone(initial=''){
    const typed=prompt('Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:', initial||'');
    if(typed===null) return null;
    return typed.trim();
  }
  async function productCardToBlob(){
    const el=$('#productShareCard',modalRoot);
    const blob=await captureNodeToBlob(el,'#07111f');
    if(!blob) toast('No se pudo generar la imagen. Revisa si la foto del producto terminó de cargar.');
    return blob;
  }

  async function downloadProductPhoto(p){const blob=await productCardToBlob(); if(!blob)return; const ref=prompt('Nombre o número del cliente para guardar esta imagen. Puedes dejarlo vacío:', state.settings.lastClientFileRef||''); if(ref===null)return; state.settings.lastClientFileRef=ref.trim(); save(); const label=slugFile(ref||p.name||p.id||'producto'); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`producto-${label}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('Imagen del producto descargada con nombre único.');}
  async function shareProductPhoto(p,qty=1){const blob=await productCardToBlob(); const text=productWhatsAppText(p,qty); const ref=prompt('Número o nombre del cliente para nombrar la imagen. Déjalo vacío si solo quieres compartir:', state.settings.lastClientFileRef||''); if(ref===null)return; state.settings.lastClientFileRef=ref.trim(); save(); const filename=`producto-${slugFile(ref||p.name||p.id||'producto')}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`; if(blob && navigator.canShare){const file=new File([blob],filename,{type:'image/png'}); if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text,title:'Producto SD Comayagua'}); toast('Selecciona WhatsApp y el chat del cliente. La foto y el texto van juntos.'); return}catch(e){if(e && e.name==='AbortError')return;}}} if(blob){const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);} toast('Se descargó la imagen para compartir.');}
  function sendProductWhatsApp(p,qty=1){const phone=askClientPhone(); if(phone===null)return; openWhatsApp(phone,productWhatsAppText(p,qty));}

  function quoteModalHTML(isSale=false){
    const doc=isSale?saleDraft:quote; const editingSale=isSale && !!doc.editingId; const title=isSale?(editingSale?'Editar factura':'Venta / factura real'):'Cotización previa';
    const currentTitle=isSale?'Factura actual':'Cotización actual';
    return `<div class="modal-head quote-head"><h3>${title}</h3><button class="close">×</button></div><div class="modal-body quote-body"><div class="pill quote-status"><span class="dot"></span>${isSale?(editingSale?'Editando factura guardada':'Factura y registro'):'Preventa / información'}</div><div class="modal-grid quote-grid" style="margin-top:14px"><div class="card-box span2 picker-card"><div class="picker-head-compact"><div><b>Seleccionar producto</b><small>Toque un artículo y se agregará a la ${isSale?'factura':'cotización'}.</small></div><span class="found-pill">${state.products.length} encontrados</span></div><div class="searchbar"><span class="icon">⌕</span><input id="pickSearch" placeholder="Buscar por nombre, categoría o código..."></div><div class="chips" id="pickChips">${allCategories().map(c=>`<button class="chip ${c==='Todos'?'active':''}" data-pickcat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div><div id="pickerList" class="picker-list"></div></div><div class="card-box calc-card"><h4>Datos para calcular</h4>${fieldsHTML(doc)}</div><div class="card-box current-card"><div class="current-card-head"><h4 id="currentDocTitle">${currentTitle}</h4><span class="selected-count-pill" id="selectedCountPill">0 artículos</span></div><div id="cartNotice" class="cart-notice hide"><b>✓ Artículo seleccionado</b><span>Producto agregado correctamente.</span></div><div id="cartList" class="cart-list"></div><div id="totalsMini"></div></div><div class="span2 preview-card"><div id="docPreview">${docCard(doc,isSale)}</div></div></div><div class="modal-actions quote-actions premium-actions compact-actions"><button class="btn secondary" id="downloadDoc"><b>Imagen</b><small>Descargar</small></button><button class="btn secondary" id="shortReceipt"><b>Recibo corto</b><small>Imagen rápida</small></button><button class="btn secondary" id="waText"><b>Texto</b><small>Al número</small></button><button class="btn" id="waPhoto"><b>Foto + texto</b><small>Compartir</small></button>${!isSale?'<button class="btn" id="sendCompleteQuote"><b>Enviar completa</b><small>Imagen + texto</small></button><button class="btn ghost" id="saveQuote"><b>Guardar</b><small>Cotización</small></button><button class="btn secondary" id="openQuotes"><b>Guardadas</b><small>Ver lista</small></button><button class="btn secondary" id="openClientsFromDoc"><b>Clientes</b><small>Agenda</small></button><button class="btn main-wide" id="toSale"><b>Pasar a factura</b><small>Venta real</small></button>':`<button class="btn main-wide" id="finishSale"><b>${editingSale?'Guardar':'Finalizar'}</b><small>${editingSale?'Cambios':'Venta'}</small></button><button class="btn secondary" id="printDoc"><b>PDF</b><small>Imprimir</small></button>`}</div></div>`
  }
  function fieldsHTML(doc){
    const type=doc.shippingType || (doc.cod?'COD':'Normal');
    return `<div class="modal-grid"><label><span class="label">Cliente opcional</span><input class="input bindDoc" data-k="client" value="${escapeHtml(doc.client)}"></label><label><span class="label">Teléfono cliente / WhatsApp</span><input class="input bindDoc" data-k="phone" inputmode="tel" value="${escapeHtml(doc.phone)}" placeholder="Sin +504 también funciona"></label><label><span class="label">Departamento</span><select class="select bindDoc" data-k="department">${SDC_DEPARTMENTS.map(d=>`<option ${doc.department===d?'selected':''}>${d}</option>`).join('')}</select></label><label><span class="label">Municipio</span><select class="select bindDoc" data-k="municipality"></select></label><label class="span2"><span class="label">Referencia / barrio / colonia</span><input class="input bindDoc" data-k="reference" value="${escapeHtml(doc.reference)}"></label><label><span class="label">Tipo de cobro / envío</span><select class="select bindDoc" data-k="shippingType"><option value="Normal" ${type!=='COD'?'selected':''}>Envío Normal: depósito o Tigo Money</option><option value="COD" ${type==='COD'?'selected':''}>Pagar al Recibir: Lps.100 + comisión</option></select></label><label><span class="label">Empresa / entrega</span><select class="select bindDoc" data-k="company"><option>Domicilio</option><option>Forza</option><option>C807</option><option>Cargo Expreso</option><option>Bus local</option></select></label><label><span class="label">Estado</span><select class="select bindDoc" data-k="status"><option>Cotizado</option><option>Esperando respuesta</option><option>Cliente interesado</option><option>Pendiente de pago</option><option>Vendido</option><option>Pagar al recibir</option><option>Cancelado</option></select></label><label><span class="label">Envío Lps.</span><input class="input bindDoc" data-k="shipping" type="number" value="${doc.shipping}"></label><label><span class="label">Descuento Lps.</span><input class="input bindDoc" data-k="discount" type="number" value="${doc.discount}"></label></div>`
  }
  function bindDocFields(isSale){
    const doc=isSale?saleDraft:quote; if(!doc.shippingType) doc.shippingType=doc.cod?'COD':'Normal';
    const mun=$('[data-k="municipality"]',modalRoot);
    function fillMun(){const dep=$('[data-k="department"]',modalRoot).value; const list=SDC_MUNICIPALITIES[dep]||[]; mun.innerHTML=list.map(m=>`<option ${doc.municipality===m?'selected':''}>${m}</option>`).join('')+'<option>Otro municipio</option>'; if(!list.includes(doc.municipality)) mun.value=list[0]||'Otro municipio'; doc.department=dep; doc.municipality=mun.value}
    function applyShippingType(force=false){const sel=$('[data-k="shippingType"]',modalRoot); if(!sel)return; doc.shippingType=sel.value; if(doc.shippingType==='COD'){doc.cod=true; if(force || !doc.shipping || Number(doc.shipping)===110) doc.shipping=100;} else {doc.cod=false; if(force || !doc.shipping || Number(doc.shipping)===100) doc.shipping=110;} const ship=$('[data-k="shipping"]',modalRoot); if(ship) ship.value=doc.shipping;}
    fillMun(); $('[data-k="company"]',modalRoot).value=doc.company||'Forza'; if($('[data-k="status"]',modalRoot)) $('[data-k="status"]',modalRoot).value=doc.status||'Cotizado'; $('[data-k="shippingType"]',modalRoot).value=doc.shippingType; applyShippingType(false);
    $$('.bindDoc',modalRoot).forEach(el=>el.oninput=el.onchange=()=>{let v=el.value; if(el.dataset.k==='shipping'||el.dataset.k==='discount')v=+v||0; doc[el.dataset.k]=v; if(el.dataset.k==='phone') autoFillClientByPhone(doc,isSale); if(el.dataset.k==='department')fillMun(); if(el.dataset.k==='shippingType')applyShippingType(true); refreshQuoteUI(isSale);});
  }

  function renderPicker(isSale){ const list=$('#pickerList',modalRoot); let q='',cat='Todos'; function draw(){const term=q.toLowerCase(); const items=state.products.filter(p=>(cat==='Todos'||productTags(p).some(t=>t.toLowerCase()===cat.toLowerCase())) && (!term||[p.name,p.id,categoryText(p),p.category,p.categoria,p.etiquetas].join(' ').toLowerCase().includes(term))); list.innerHTML=items.map(p=>`<div class="picker-item"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(p.price)} · Stock ${num(p.stock)} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small add-pick-btn" type="button" data-additem="${escapeHtml(p.id)}">Seleccionar</button></div>`).join('')||'<div class="empty-state">Sin productos.</div>'; $$('[data-additem]',list).forEach(b=>b.onclick=()=>addDocItem(b.dataset.additem,isSale,b)); }
    $('#pickSearch',modalRoot).oninput=e=>{q=e.target.value;draw()}; $$('[data-pickcat]',modalRoot).forEach(b=>b.onclick=()=>{cat=b.dataset.pickcat;$$('[data-pickcat]',modalRoot).forEach(x=>x.classList.toggle('active',x===b));draw()}); draw(); }
  function addDocItem(id,isSale,triggerBtn=null){
    const p=productById(id); if(!p)return;
    const doc=isSale?saleDraft:quote;
    const found=doc.items.find(x=>x.id===id);
    if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,image:productImage(p)});
    refreshQuoteUI(isSale);
    const qty=found?found.qty:1;
    const notice=$('#cartNotice',modalRoot);
    if(notice){notice.classList.remove('hide'); notice.innerHTML=`<b>✓ Artículo seleccionado</b><span>${escapeHtml(p.name)} · cantidad ${num(qty)}</span>`; clearTimeout(window.__sdcCartNoticeTimer); window.__sdcCartNoticeTimer=setTimeout(()=>notice.classList.add('hide'),3000);}
    if(triggerBtn){
      const card=triggerBtn.closest('.picker-item');
      if(card){
        card.classList.add('is-selected');
        clearTimeout(card._pickedTimer);
        card._pickedTimer=setTimeout(()=>card.classList.remove('is-selected'),1400);
      }
      const original=triggerBtn.dataset.originalLabel || triggerBtn.textContent;
      triggerBtn.dataset.originalLabel=original;
      triggerBtn.textContent='✓ Seleccionado';
      triggerBtn.disabled=true;
      clearTimeout(triggerBtn._pickedTimer);
      triggerBtn._pickedTimer=setTimeout(()=>{triggerBtn.disabled=false; triggerBtn.textContent=original;},950);
    }
    const cart=$('#cartList',modalRoot); if(cart) cart.scrollIntoView({behavior:'smooth',block:'nearest'});
    toast(`${p.name} agregado a ${isSale?'factura':'cotización'}.`);
  }
  function cartItemHTML(it,i){
    const qty=Math.max(1,Number(it.qty)||1);
    const total=itemTotal(it);
    const unit=total/qty;
    const p=itemProductRef(it);
    const promo=promoTotalForQty(p,qty)!==null;
    const promoTxt=promo?`<small class="promo-applied">${escapeHtml(promoLabelForQty(p,qty)||'Oferta aplicada')}</small>`:'';
    return `<div class="cart-row cart-row-v24"><div class="cart-info"><b>${escapeHtml(it.name)}</b><span>${money(unit)} c/u · Total ${money(total)}</span>${promoTxt}</div><div class="qtybox"><button data-dec="${i}">−</button><input data-qty="${i}" type="number" value="${qty}"><button data-inc="${i}">+</button></div><button class="btn small danger remove-item" data-rem="${i}">Quitar</button></div>`;
  }
  function refreshQuoteUI(isSale){ const doc=isSale?saleDraft:quote; $('#cartList',modalRoot).innerHTML=doc.items.length?doc.items.map((it,i)=>cartItemHTML(it,i)).join(''):'<div class="empty-state">Agrega productos para calcular.</div>'; const c=calc(doc); $('#totalsMini',modalRoot).innerHTML=`<div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión</b><b>${money(c.commission)}</b></div><div class="summary-total"><b>Total</b><b>${money(c.total)}</b></div></div>`; $('#docPreview',modalRoot).innerHTML=docCard(doc,isSale); const itemsCount=(doc.items||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0); const pill=$('#selectedCountPill',modalRoot); if(pill) pill.textContent=`${num(itemsCount)} ${itemsCount===1?'artículo':'artículos'}`; const title=$('#currentDocTitle',modalRoot); if(title) title.textContent=`${isSale?'Factura':'Cotización'} actual`; $$('[data-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.items[+b.dataset.inc].qty++;refreshQuoteUI(isSale)}); $$('[data-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.items[+b.dataset.dec]; it.qty=Math.max(1,it.qty-1);refreshQuoteUI(isSale)}); $$('[data-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.items.splice(+b.dataset.rem,1);refreshQuoteUI(isSale)}); $$('[data-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.items[+inp.dataset.qty].qty=Math.max(1,+inp.value||1);refreshQuoteUI(isSale)}); }
  function openQuote(id){currentView='quote'; if(!quote.items.length) quote=emptyQuote(); if(id)addDocItemTo(quote,id); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); }
  function openSale(id,fromDoc=null){saleDraft=fromDoc?SDCStore.clone(fromDoc):emptySale(); saleDraft.id='SDC-'+Date.now().toString().slice(-10); saleDraft.kind='receipt'; saleDraft.status=saleDraft.cod?'Pagar al recibir':'Vendido'; delete saleDraft.saved; delete saleDraft.editingId; if(id)addDocItemTo(saleDraft,id); openModal(quoteModalHTML(true),true); bindQuoteCommon(true); }
  function addDocItemTo(doc,id){const p=productById(id); if(!p)return; const found=doc.items.find(x=>x.id===id); if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,image:productImage(p)});}
  function bindQuoteCommon(isSale){
    renderPicker(isSale); bindDocFields(isSale); refreshQuoteUI(isSale);
    $('#downloadDoc').onclick=()=>downloadDocImage(isSale?'recibo':'cotizacion');
    $('#shortReceipt')&&($('#shortReceipt').onclick=()=>openShortReceipt(isSale));
    $('#waText').onclick=()=>sendWhatsAppText(isSale);
    $('#waPhoto').onclick=()=>shareDocPhoto(isSale);
    $('#sendCompleteQuote')&&($('#sendCompleteQuote').onclick=sendCompleteQuote);
    $('#openClientsFromDoc')&&($('#openClientsFromDoc').onclick=()=>openClients(isSale?'sale':'quote'));
    $('#printDoc')&&($('#printDoc').onclick=printDocumentCard);
    $('#saveQuote')&&($('#saveQuote').onclick=saveCurrentQuote);
    $('#openQuotes')&&($('#openQuotes').onclick=openSavedQuotes);
    $('#toSale')&&($('#toSale').onclick=()=>{if(!quote.items.length)return toast('Agrega productos antes de pasar a venta.'); closeModal(); openSale(null,quote)});
    $('#finishSale')&&($('#finishSale').onclick=finishSale);
  }
  function saveCurrentQuote(){
    if(!quote.items.length)return toast('Agrega productos antes de guardar.');
    quote.date=new Date().toISOString(); quote.saved=true;
    const clean=SDCStore.clone(quote); delete clean.editingId; clean.kind='quote'; clean.total=calc(clean).total;
    const key=quote.editingId||quote.id;
    const ix=state.quotes.findIndex(q=>q.id===key || q.id===clean.id);
    if(ix>=0) state.quotes[ix]=clean; else state.quotes.unshift(clean);
    quote=SDCStore.clone(clean); quote.editingId=clean.id; state.lastQuote=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    save(); SDCStore.saveBackup(state,'Cotización guardada');
    toast(ix>=0?'Cotización actualizada.':'Cotización guardada.');
  }
  function docCard(doc,isSale){
    const c=calc(doc);
    const code=doc.id||'SDC';
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,Number(it.qty)||1),0);
    const titleText=isSale?'RECIBO DE COMPRA':'COTIZACIÓN PARA CLIENTE';
    const statusText=isSale?'Venta registrada':'Cotización vigente';
    const productTitle=isSale?'Productos vendidos':'Productos cotizados';
    const paymentTitle=doc.cod?'Pagar al recibir':'Envío normal';
    const process=doc.cod?'Productos + Lps. 100 de envío + comisión del 6%. Total redondeado en lempiras.':'Productos + Lps. 110 de envío. Pago por depósito, transferencia o Tigo Money.';
    const clientName=String(doc.client||'').trim()||'Cliente no registrado';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const location=[doc.department,doc.municipality].filter(Boolean).join(' / ')||'No seleccionada';
    const delivery=String(doc.company||'').trim()||'No seleccionada';
    const rows=(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      const realImg=(galleryOf(p)[0]||it.image||'').trim();
      const thumb=realImg?`<img class="receipt-item-thumb" src="${escapeHtml(realImg)}" alt="${escapeHtml(it.name)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'receipt-item-thumb receipt-thumb-fallback',textContent:'SD'}))">`:`<div class="receipt-item-thumb receipt-thumb-fallback">${escapeHtml((it.name||'SD').slice(0,2).toUpperCase())}</div>`;
      return `<div class="receipt-item-pro has-thumb">
        <div class="receipt-item-index">${i+1}</div>
        ${thumb}
        <div class="receipt-item-info">
          <b>${escapeHtml(it.name)}</b>
          <span>${num(qty)} ${qty===1?'unidad':'unidades'} · ${money(unit)} c/u${promo?' · Oferta aplicada':''}</span>
        </div>
        <strong>${money(total)}</strong>
      </div>`;
    }).join('')||'<div class="receipt-empty-pro">Sin productos agregados</div>';
    const commissionRow=(doc.cod||c.commission>0)?`<div><span>Comisión pagar al recibir</span><b>${money(c.commission)}</b></div>`:'';
    const discountRow=c.discount>0?`<div><span>Descuento</span><b>- ${money(c.discount)}</b></div>`:'';
    const note=isSale?'Gracias por comprar en SD Comayagua.':'Cotización pendiente de aprobación. Antes de pagar, confirme disponibilidad, entrega y total final.';
    return `<div class="doc-wrap compact-doc doc-v21 doc-v23 receipt-pro-v4" id="printableDoc">
      <div class="receipt-band-pro"><span>${titleText}</span><b>${statusText}</b></div>
      <div class="receipt-inner-pro">
        <header class="receipt-header-pro">
          <div class="receipt-brand-pro">
            <img class="doc-logo" src="${LOGO_SRC}" alt="Logo SD Comayagua">
            <div>
              <small>SD COMAYAGUA</small>
              <h2>${isSale?'Recibo de compra':'Cotización'}</h2>
              <p>${date}</p>
              <em>${escapeHtml(code)}</em>
            </div>
          </div>
          <div class="receipt-total-pro">
            <span>Total a pagar</span>
            <b>${money(c.total)}</b>
          </div>
        </header>

        <section class="receipt-client-pro">
          <article class="wide"><span>Cliente</span><b>${escapeHtml(clientName)}</b></article>
          <article><span>Teléfono</span><b>${escapeHtml(phone)}</b></article>
          <article><span>Ubicación</span><b>${escapeHtml(location)}</b></article>
          <article><span>Entrega</span><b>${escapeHtml(delivery)}</b></article>
          <article><span>Pago</span><b>${paymentTitle}</b></article>
          ${doc.reference?`<article class="wide"><span>Referencia</span><b>${escapeHtml(doc.reference)}</b></article>`:''}
        </section>

        <section class="receipt-process-pro">
          <div><span>Proceso de pago</span><b>${paymentTitle}</b></div>
          <p>${process}</p>
        </section>

        <section class="receipt-products-pro">
          <div class="receipt-title-pro"><span>${productTitle}</span><b>${itemCount} ${itemCount===1?'artículo':'artículos'}</b></div>
          ${rows}
        </section>

        <section class="receipt-summary-pro">
          <div><span>Subtotal productos</span><b>${money(c.products)}</b></div>
          <div><span>Envío</span><b>${money(c.shipping)}</b></div>
          ${commissionRow}
          ${discountRow}
          <div class="grand"><span>Total a pagar</span><b>${money(c.total)}</b></div>
        </section>

        <footer class="receipt-footer-pro">
          <b>${note}</b>
          <span>WhatsApp: +504 3151-7755</span>
        </footer>
      </div>
    </div>`
  }

  function whatsappText(doc,isSale){
    const c=calc(doc);
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const shippingTitle=doc.cod?'Pagar al recibir':'Envío normal';
    const shippingProcess=doc.cod?'• Producto + Lps. 100 de envío + comisión del 6%.':'• Producto + Lps. 110 de envío. Pago por depósito, transferencia o Tigo Money.';
    const productLines=(doc.items||[]).length?(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      return `${i+1}️⃣ *${it.name}*\n   • Cantidad: ${num(qty)}\n   • Precio: ${money(unit)} c/u\n   • Total: ${money(total)}${promo?`\n   • 🎁 Oferta aplicada`:''}`;
    }).join('\n\n'):'Sin productos agregados.';
    const commissionLine=(doc.cod||c.commission>0)?`\n• *Comisión por pagar al recibir:* ${money(c.commission)}`:'';
    const discountLine=c.discount>0?`\n• *Descuento aplicado:* - ${money(c.discount)}`:'';
    const referenceLine=String(doc.reference||'').trim()?`\n• *Referencia:* ${doc.reference}`:'';
    const client=String(doc.client||'').trim()||'Cliente no registrado';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const title=isSale?'🧾 *RECIBO SD COMAYAGUA*':'📋 *COTIZACIÓN SD COMAYAGUA*';
    return `${title}\n\n🆔 *Código:* ${doc.id}\n📅 *Fecha:* ${date}\n\n👤 *DATOS DEL CLIENTE*\n• *Cliente:* ${client}\n• *Teléfono:* ${phone}\n• *Departamento:* ${doc.department||'No seleccionado'}\n• *Municipio:* ${doc.municipality||'No seleccionado'}${referenceLine}\n\n🛍️ *PRODUCTOS*\n${productLines}\n\n🚚 *ENVÍO Y PAGO*\n• *Modalidad:* ${shippingTitle}\n• *Empresa / entrega:* ${doc.company||'No seleccionada'}\n• *Envío:* ${money(c.shipping)}${commissionLine}\n• *Total envío:* ${money(c.delivery)}\n${shippingProcess}\n\n💰 *RESUMEN*\n• *Productos:* ${money(c.products)}${discountLine}\n✅ *TOTAL A PAGAR:* ${money(c.total)}\n\nℹ️ *Importante:* cotización pendiente de aprobación. Antes de pagar, confirme disponibilidad, entrega y total final.\n\n🏪 *SD COMAYAGUA*\n📲 *WhatsApp:* +504 3151-7755`;
  }

  function waPhone(phone){const p=cleanPhone(phone); return p? (p.length===8?'504'+p:p) : ''}
  function waWebUrl(phone,text){const p=waPhone(phone); return p?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`}
  function waAppUrl(phone,text){const p=waPhone(phone); return `whatsapp://send?${p?`phone=${p}&`:''}text=${encodeURIComponent(text)}`}
  function openWhatsApp(phone,text){
    if(isMobileDevice()){
      window.location.href=waAppUrl(phone,text);
    }else{
      window.open(waWebUrl(phone,text),'_blank');
    }
  }
  function currentDoc(isSale){return isSale?saleDraft:quote}
  function chooseWaPhone(doc){
    const storeLast=cleanPhone(state.settings.whatsappNumber||'').slice(-8);
    const current=cleanPhone(doc.phone||'').slice(-8);
    if(!current || current===storeLast){
      const typed=prompt('Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:', current===storeLast?'':(doc.phone||''));
      if(typed===null) return null;
      doc.phone=typed.trim();
      refreshQuoteUI(doc.kind==='receipt' || doc===saleDraft);
    }
    return doc.phone||'';
  }
  function sendWhatsAppText(isSale){const doc=currentDoc(isSale); if(!doc.items.length)return toast('Agrega productos primero.'); const c=calc(doc); if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.'); const phone=chooseWaPhone(doc); if(phone===null)return; save(); openWhatsApp(phone,whatsappText(doc,isSale));}
  async function docToBlob(){
    const el=$('#printableDoc',modalRoot);
    const blob=await captureNodeToBlob(el,'#eaf5f9');
    if(!blob) toast('No se pudo generar la imagen del documento. Verifique que las miniaturas hayan cargado o use el botón PDF.');
    return blob;
  }


  function printDocumentCard(){
    const node=$('#printableDoc',modalRoot);
    if(!node){toast('No hay documento listo para imprimir.');return;}
    const popup=window.open('','_blank');
    if(!popup){
      document.body.classList.add('sdc-print-direct');
      setTimeout(()=>{window.print(); setTimeout(()=>document.body.classList.remove('sdc-print-direct'),700);},100);
      return;
    }
    const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documento SD Comayagua</title><style>
      @page{size:letter;margin:8mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#071625;font-family:Arial,Helvetica,sans-serif}.print-wrap{width:100%;display:flex;justify-content:center;align-items:flex-start;padding:0}.compact-doc,.quote-doc,.receipt-doc{width:100%;max-width:760px;margin:0 auto;background:#fff!important;color:#071625!important;border-radius:22px;overflow:hidden}.doc-top,.doc-header,.receipt-head{background:#071625!important;color:#fff!important;padding:18px 24px;display:flex;justify-content:space-between;gap:12px}.doc-card,.doc-info,.doc-total,.doc-section,.doc-foot,.doc-payment,.doc-box,.doc-customer,.doc-delivery,.doc-pay{border:1px solid #dceaf2;border-radius:18px;margin:14px 20px;padding:16px;background:#fff;color:#071625}.doc-card{display:flex;align-items:center;gap:16px}.doc-total,.doc-grand{background:linear-gradient(135deg,#2ff0bb,#28caf5)!important;color:#071625!important}.doc-products{margin:14px 20px;border:1px solid #dceaf2;border-radius:18px;overflow:hidden}.doc-products-title,.doc-products-head{background:#071625!important;color:#fff!important;padding:14px 18px;display:flex;justify-content:space-between}.receipt-item-v15,.receipt-item-pro{display:grid;grid-template-columns:42px 54px 1fr auto;gap:12px;align-items:center;padding:14px 18px;border-top:1px solid #e7f1f6}.receipt-num,.receipt-item-index,.receipt-item-thumb{width:42px;height:42px;border-radius:12px;background:#eaf8ff;display:grid;place-items:center;font-weight:900}.receipt-item-thumb{object-fit:cover}.receipt-thumb-fallback{font-size:14px}.totals,.doc-totals{margin:14px 20px;border:1px solid #dceaf2;border-radius:18px;overflow:hidden}.totals>div,.doc-totals>div{display:flex;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e7f1f6}.totals .grand,.doc-totals .grand{background:#071625!important;color:#52ffcc!important;border-bottom:0}img{max-width:100%;height:auto}p{margin:0}.no-print,.modal-actions{display:none!important}</style></head><body><div class="print-wrap">${node.outerHTML}</div><script>setTimeout(()=>{window.focus();window.print();},350);</script></body></html>`;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  async function downloadDocImage(name='documento'){
    const doc=name==='recibo'?saleDraft:quote;
    const blob=await docToBlob();
    if(!blob)return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${name}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc?.id||'sdc')}.png`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast('Imagen descargada con nombre único.');
  }
  async function copyTextSafe(text){
    try{await navigator.clipboard?.writeText(text); return true;}catch(e){return false;}
  }
  async function copyImageSafe(blob){
    try{
      if(navigator.clipboard && window.ClipboardItem && blob){
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        return true;
      }
    }catch(e){}
    return false;
  }
  function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
  async function waitForImages(root,timeout=12000){
    const el=root||document;
    const imgs=Array.from(el.querySelectorAll('img'));
    if(!imgs.length)return;
    await Promise.all(imgs.map(img=>new Promise(resolve=>{
      if(img.complete && img.naturalWidth>0)return resolve();
      const done=()=>{clearTimeout(timer); img.removeEventListener('load',done); img.removeEventListener('error',done); resolve();};
      const timer=setTimeout(done,timeout);
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      try{img.setAttribute('crossorigin','anonymous');}catch(e){}
    })));
    await sleep(80);
  }
  async function captureNodeToBlob(el,backgroundColor){
    if(!el)return null;
    if(!window.html2canvas){window.print();return null}
    await waitForImages(el);
    try{
      const exportScale=isMobileDevice()?2:2.35;
      const canvas=await html2canvas(el,{backgroundColor,scale:exportScale,useCORS:true,allowTaint:false,imageTimeout:15000,removeContainer:true,scrollX:0,scrollY:0,windowWidth:document.documentElement.clientWidth,onclone:(doc)=>{
        doc.body.classList.add('capture-exporting','capture-v7-stable');
        doc.querySelectorAll('img').forEach(img=>{
          try{
            img.setAttribute('crossorigin','anonymous');
            img.setAttribute('referrerpolicy','no-referrer');
            img.loading='eager';
            img.decoding='sync';
            img.style.background='transparent';
            const src=(img.getAttribute('src')||'').trim();
            if(!src || src==='undefined' || src==='null'){
              img.setAttribute('src', img.classList.contains('share-brand-logo') ? LOGO_SRC : captureFallbackImage());
            }
          }catch(e){}
        });
      }});
      return await new Promise(res=>canvas.toBlob(res,'image/png',.98));
    }catch(err){
      console.error(err);
      return null;
    }
  }

  async function shareDocPhoto(isSale){
    const doc=currentDoc(isSale);
    if(!doc.items.length)return toast('Agrega productos primero.');
    const c=calc(doc);
    if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.');
    save();
    const blob=await docToBlob();
    const text=whatsappText(doc,isSale);
    const filename=`${isSale?'recibo':'cotizacion'}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc.id||'sdc')}.png`;
    if(blob && navigator.canShare){
      const file=new File([blob],filename,{type:'image/png'});
      if(navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],text,title:isSale?'Recibo SD Comayagua':'Cotización SD Comayagua'});
          toast('Selecciona WhatsApp. Se compartió la imagen con el mensaje.');
          return;
        }catch(e){
          if(e && e.name==='AbortError')return;
        }
      }
    }
    const copiedImage=blob?await copyImageSafe(blob):false;
    await copyTextSafe(text);
    if(!copiedImage && blob){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=filename;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    }
    const phone=chooseWaPhone(doc);
    if(phone!==null) openWhatsApp(phone,text);
    toast(copiedImage?'WhatsApp se abrió con el texto. La imagen quedó copiada; pégala en el chat si no aparece automáticamente.':'Se descargó la imagen y se abrió WhatsApp con el texto. Adjunta la imagen descargada si el navegador no la envía solo.');
  }

  function finishSale(){
    if(!saleDraft.items.length)return toast('Agrega productos primero.');
    const editingId=saleDraft.editingId||'';
    const previous=editingId?state.sales.find(x=>x.id===editingId):null;
    const prevQty=new Map();
    (previous?.items||[]).forEach(it=>prevQty.set(it.id,(prevQty.get(it.id)||0)+(+it.qty||0)));
    for(const it of saleDraft.items||[]){
      const p=productById(it.id);
      const diff=(+it.qty||0)-(prevQty.get(it.id)||0);
      if(p && diff>Number(p.stock||0)){toast(`Stock insuficiente para ${p.name}. Disponible: ${num(p.stock)}.`); return;}
      if(p && Number(p.price||0)-Number(p.cost||0)<0){toast(`Revisá ${p.name}: el costo es mayor que el precio.`); return;}
    }
    const c=calc(saleDraft);
    saleDraft.date=new Date().toISOString();
    saleDraft.total=c.total;
    const newQty=new Map();
    (saleDraft.items||[]).forEach(it=>newQty.set(it.id,(newQty.get(it.id)||0)+(+it.qty||0)));
    const ids=new Set([...prevQty.keys(),...newQty.keys()]);
    ids.forEach(id=>{
      const p=productById(id); if(!p)return;
      const diff=(newQty.get(id)||0)-(prevQty.get(id)||0);
      p.stock=Math.max(0,(+p.stock||0)-diff);
    });
    saleDraft.date=new Date().toISOString(); saleDraft.kind='receipt'; saleDraft.total=c.total; const clean=SDCStore.clone(saleDraft); delete clean.editingId;
    if(previous){
      const ix=state.sales.findIndex(x=>x.id===editingId);
      if(ix>=0) state.sales[ix]=clean;
    }else{
      state.sales.unshift(clean);
    }
    state.lastReceipt=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    SDCStore.saveBackup(state,previous?'Factura editada':'Venta registrada');
    save(); if($('#cartList',modalRoot)) refreshQuoteUI(true); render(); toast(previous?'Factura actualizada sin duplicarla.':'Venta finalizada y recibo guardado.');
  }

  function normalizeImportHeader(h){
    return String(h||'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  }
  function importCleanValue(v){
    if(v===undefined||v===null) return '';
    return String(v).replace(/^\uFEFF/,'').trim();
  }
  function parseImportNumber(v){
    let s=importCleanValue(v).replace(/lps\.?|hnl|lempiras?/ig,'').replace(/\s+/g,'');
    if(!s) return 0;
    s=s.replace(/[^0-9,.-]/g,'');
    if(s.includes(',') && s.includes('.')) s=s.replace(/,/g,'');
    else if(s.includes(',') && !s.includes('.')){
      const parts=s.split(',');
      s=(parts.length===2 && parts[1].length===3)?parts.join(''):s.replace(',', '.');
    }
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  function csvEscape(v){
    const s=String(v??'');
    return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }
  function detectDelimiter(text){
    const sample=String(text||'').split(/\r?\n/).find(x=>x.trim())||'';
    const count=(ch)=>{let c=0,q=false; for(let i=0;i<sample.length;i++){const a=sample[i]; if(a==='"'){ if(q&&sample[i+1]==='"')i++; else q=!q;} else if(!q && a===ch)c++; } return c;};
    const opts=[',',';','\t'].map(ch=>({ch,n:count(ch)})).sort((a,b)=>b.n-a.n);
    return opts[0].n?opts[0].ch:',';
  }
  function parseCSVText(text){
    text=String(text||'').replace(/^\uFEFF/,'');
    const delim=detectDelimiter(text);
    const rows=[]; let row=[], cell='', q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){
        if(q && text[i+1]==='"'){cell+='"'; i++;}
        else q=!q;
      } else if(ch===delim && !q){row.push(cell); cell='';}
      else if((ch==='\n'||ch==='\r') && !q){
        if(ch==='\r' && text[i+1]==='\n') i++;
        row.push(cell); cell='';
        if(row.some(x=>String(x).trim()!=='')) rows.push(row);
        row=[];
      } else cell+=ch;
    }
    row.push(cell);
    if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    if(!rows.length) return [];
    const headers=rows.shift().map(h=>importCleanValue(h));
    return rows.map(r=>{const o={}; headers.forEach((h,i)=>o[h]=r[i]??''); return o;});
  }
  function splitImportImages(v){
    const raw=importCleanValue(v);
    if(!raw) return [];
    return raw.split(/\s*(?:\r?\n|\||;)\s*/).map(x=>x.trim()).filter(Boolean);
  }
  function normalizeImportPromos(v){
    const raw=importCleanValue(v);
    if(!raw) return '';
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const m=part.match(/(\d+)\s*(?:=|:|x|X|-|a|por|par|pares|unidad|unidades)?\s*[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i);
      if(!m) return '';
      return `${Number(m[1])}=${parseImportNumber(m[2])}`;
    }).filter(Boolean).join('\n');
  }
  function importRowToProduct(row,i){
    const n={}; Object.keys(row||{}).forEach(k=>n[normalizeImportHeader(k)]=row[k]);
    const val=(keys)=>{for(const k of keys){const nk=normalizeImportHeader(k); if(n[nk]!==undefined && importCleanValue(n[nk])!=='') return importCleanValue(n[nk]);} return '';};
    const images=splitImportImages(val(['imagenes','imagen','foto','fotos','image','images','galeria','gallery','urlimagen','linkimagen']));
    const p={
      id:val(['codigo','cod','id','sku','code']) || `SDC-${String(i+1).padStart(3,'0')}`,
      name:val(['nombre','producto','name','title','articulo','item']) || 'Producto sin nombre',
      categories:val(['categoria','categorias','category','categories','etiquetas','tags']) || 'General',
      price:parseImportNumber(val(['precio','precioventa','precioactual','venta','price'])),
      cost:parseImportNumber(val(['costo','cost','costocompra','preciocompra','compra'])),
      stock:parseImportNumber(val(['stock','existencia','cantidad','inventario','disponible'])),
      image:images[0]||'',
      gallery:images.slice(1).join('\n'),
      promos:normalizeImportPromos(val(['promos','promociones','precioscantidad','preciosporcantidad','mayoreo','ofertas','promo'])),
      description:val(['descripcion','description','beneficios','detalle','incluye','info'])
    };
    return SDCStore.normalizeProduct(p,i);
  }
  async function readRowsFromProductFile(file){
    const name=(file.name||'').toLowerCase();
    if(name.endsWith('.csv') || file.type.includes('csv') || file.type.startsWith('text/')){
      const txt=await file.text();
      return parseCSVText(txt);
    }
    if(name.endsWith('.xlsx') || name.endsWith('.xls')){
      if(!window.XLSX) throw new Error('La librería XLSX no cargó. Revisa internet o usa CSV.');
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const first=wb.SheetNames[0];
      if(!first) return [];
      return XLSX.utils.sheet_to_json(wb.Sheets[first],{defval:'',raw:false});
    }
    throw new Error('Formato no soportado. Usa .csv o .xlsx');
  }
  function importProducts(products,mode){
    if(!products.length) throw new Error('No encontré productos válidos.');
    SDCStore.saveBackup(state,'Antes de importar productos');
    if(mode==='replace'){
      state.products=products;
    }else{
      const byId=new Map(state.products.map((p,i)=>[String(p.id).trim().toLowerCase(),i]));
      products.forEach(p=>{
        const key=String(p.id||'').trim().toLowerCase();
        if(key && byId.has(key)) state.products[byId.get(key)]={...state.products[byId.get(key)],...p};
        else state.products.push(p);
      });
    }
    state.products=state.products.map(SDCStore.normalizeProduct);
    save(); SDCStore.saveBackup(state,`Importados ${products.length} productos`);
  }
  async function handleProductImportFile(file){
    try{
      $('#importProductsStatus',modalRoot).innerHTML='Leyendo archivo...';
      const rows=await readRowsFromProductFile(file);
      const products=rows.map(importRowToProduct).filter(p=>p.name && p.name!=='Producto sin nombre');
      if(!products.length) throw new Error('El archivo no tiene filas de productos.');
      const mode=$('#importProductsMode',modalRoot)?.value||'merge';
      const msg=`Encontré ${products.length} productos en ${file.name}.\n\n${mode==='replace'?'REEMPLAZARÁ todo el catálogo actual.':'Actualizará por código y agregará los nuevos.'}\n\n¿Importar ahora?`;
      if(!confirm(msg)){ $('#importProductsStatus',modalRoot).innerHTML='Importación cancelada.'; return; }
      importProducts(products,mode);
      closeModal(); render(); toast(`${products.length} productos importados correctamente.`);
    }catch(err){
      console.error(err);
      $('#importProductsStatus',modalRoot).innerHTML=`No se pudo importar: ${escapeHtml(err.message||err)}`;
      toast('No se pudo importar el archivo.');
    }
  }
  function exportProductsCSV(){
    const headers=['codigo','nombre','categoria','precio','costo','stock','imagenes','promos','descripcion'];
    const rows=state.products.map(p=>{
      const imgs=[p.image,...String(p.gallery||'').split(/\n+/).filter(Boolean)].join(' | ');
      return [p.id,p.name,p.categories,p.price,p.cost,p.stock,imgs,String(p.promos||'').replace(/\n+/g,' | '),p.description].map(csvEscape).join(',');
    });
    const blob=new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='productos-sd-comayagua.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function downloadProductTemplateCSV(){
    const csv='codigo,nombre,categoria,precio,costo,stock,imagenes,promos,descripcion\nSDC-001,Producto ejemplo,Gamer Móvil,350,110,5,https://link-imagen.jpg,"1:350 | 2:690",Descripción del producto';
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='plantilla-productos-sdc.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function openBackup(){
    openModal(`<div class="modal-head"><h3>Respaldo único</h3><button class="close">×</button></div><div class="modal-body backup-v22"><div class="card-box backup-main"><h4>RESPALDO COMPLETO</h4><p>Una sola opción clara: guarda productos, ventas, cotizaciones, clientes, cierre de caja y configuración.</p><div class="modal-actions import-actions" style="position:static"><button class="btn full" id="exportBackup">Descargar respaldo completo</button><label class="btn secondary full">Restaurar respaldo<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn ghost full" id="manualBackup">Crear copia local automática</button><button class="btn secondary full" data-action="exportAll">Exportar ventas/clientes CSV</button></div></div><details class="card-box"><summary>Herramientas de productos CSV / Excel</summary><p style="color:#b8c8d8">Esto no es respaldo; solo sirve para importar o exportar catálogo de productos.</p><label><span class="label">Modo de importación</span><select class="select" id="importProductsMode"><option value="merge">Actualizar por código y agregar nuevos</option><option value="replace">Reemplazar todo el catálogo</option></select></label><div class="modal-actions import-actions" style="position:static"><label class="btn secondary full">Importar .CSV o .XLSX<input id="importProductsFile" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label><button class="btn ghost" id="exportProductsCsv">Exportar productos CSV</button><button class="btn ghost" id="downloadTemplateCsv">Plantilla CSV</button></div><div id="importProductsStatus" class="import-status">Usa columnas: código, nombre, categoría, precio, costo, stock, imágenes, promos y descripción.</div></details><div class="card-box"><h4>Copias locales</h4><div id="backupList"></div></div></div>`,true);
    function draw(){const b=SDCStore.listBackups(); $('#backupList').innerHTML=b.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.label)}</b><br><span>${new Date(x.date).toLocaleString('es-HN')}</span></div><button class="btn small secondary" data-restore="${x.id}">Restaurar</button></div>`).join('')||'<div class="empty-state">Sin copias locales.</div>'; $$('[data-restore]',modalRoot).forEach(btn=>btn.onclick=()=>{state=SDCStore.restoreBackup(btn.dataset.restore)||state; hydrateState(); closeModal(); render(); toast('Respaldo restaurado.')}); }
    draw();
    $('#exportProductsCsv').onclick=exportProductsCSV;
    $('#downloadTemplateCsv').onclick=downloadProductTemplateCSV;
    $('#importProductsFile').onchange=e=>{const f=e.target.files[0]; if(f) handleProductImportFile(f); e.target.value='';};
    $('#exportBackup').onclick=()=>{hydrateState(); const blob=new Blob([SDCStore.exportData(state)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`respaldo-sd-comayagua-${fileStamp()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
    $('#manualBackup').onclick=()=>{SDCStore.saveBackup(state,'Respaldo completo');draw();toast('Copia local guardada.')};
    $$('[data-action="exportAll"]',modalRoot).forEach(b=>b.onclick=exportAllCSV);
    $('#importBackup').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=SDCStore.importData(r.result);hydrateState();closeModal();render();toast('Respaldo importado.')}catch(err){toast('No se pudo importar.')}}; r.readAsText(f)};
  }

  function quoteSummaryText(q){
    const date=new Date(q.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});
    const products=(q.items||[]).map(x=>x.name).slice(0,2).join(', ')||'Sin productos';
    const more=(q.items||[]).length>2?` +${(q.items||[]).length-2}`:'';
    return `${date} · ${products}${more}`;
  }
  function statusOptions(selected='Cotizado'){
    return ['Cotizado','Esperando respuesta','Cliente interesado','Pendiente de pago','Vendido','Cancelado'].map(x=>`<option ${selected===x?'selected':''}>${x}</option>`).join('');
  }
  function reminderText(q){
    return `Hola, buen día. Le escribimos de SD COMAYAGUA para confirmar si desea continuar con la cotización ${q.id||''}.\n\nTotal cotizado: ${money(calc(q).total)}\nProducto(s): ${(q.items||[]).map(i=>i.name).join(', ')||'productos consultados'}\n\nSi desea continuar, con gusto le confirmamos disponibilidad y entrega.`;
  }
  function openSavedQuotes(){
    let q='';
    openModal(`<div class="modal-head"><h3>Cotizaciones guardadas</h3><button class="close">×</button></div><div class="modal-body saved-quotes-body"><div class="card-box saved-quotes-head"><b>Buscar cotización</b><span>Busca por cliente, teléfono, código, producto o estado. Puedes recordar al cliente o pasarla a venta.</span><div class="searchbar"><span class="icon">⌕</span><input id="quoteSearch" placeholder="Nombre, teléfono, código, estado o producto..."></div></div><div id="savedQuotesList" class="saved-quotes-list"></div></div>`,true);
    function draw(){
      const term=q.toLowerCase().trim();
      const list=(state.quotes||[]).filter(x=>{
        const hay=[x.id,x.client,x.phone,x.department,x.municipality,x.company,x.status,(x.items||[]).map(i=>i.name).join(' ')].join(' ').toLowerCase();
        return !term || hay.includes(term);
      });
      $('#savedQuotesList',modalRoot).innerHTML=list.map(x=>{const c=calc(x); return `<div class="saved-quote-card"><div class="saved-quote-main"><b>${escapeHtml(x.client||'Cliente sin nombre')}</b><span>${escapeHtml(x.phone||'Sin teléfono')} · ${escapeHtml(x.id||'COT')}</span><small>${escapeHtml(quoteSummaryText(x))}</small></div><div class="saved-quote-total"><span>Total</span><b>${money(c.total)}</b></div><label class="quote-status-inline"><span>Estado</span><select data-qstatus="${escapeHtml(x.id)}">${statusOptions(x.status||'Cotizado')}</select></label><div class="saved-quote-actions"><button class="btn small secondary" data-openquote="${escapeHtml(x.id)}">Abrir</button><button class="btn small" data-salequote="${escapeHtml(x.id)}">Pasar a venta</button><button class="btn small ghost" data-remindquote="${escapeHtml(x.id)}">Recordar</button><button class="btn small ghost" data-waquote="${escapeHtml(x.id)}">WhatsApp</button><button class="btn small danger" data-delquote="${escapeHtml(x.id)}">Borrar</button></div></div>`}).join('')||'<div class="empty-state">Todavía no hay cotizaciones guardadas.</div>';
      $$('[data-qstatus]',modalRoot).forEach(sel=>sel.onchange=()=>{const x=state.quotes.find(y=>y.id===sel.dataset.qstatus); if(x){x.status=sel.value; save(); toast('Estado actualizado.')}});
      $$('[data-openquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.openquote); if(!x)return; quote=SDCStore.clone(x); quote.editingId=x.id; openModal(quoteModalHTML(false),true); bindQuoteCommon(false); toast('Cotización abierta para modificar.');});
      $$('[data-salequote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.salequote); if(!x)return; closeModal(); openSale(null,x); toast('Cotización pasada a venta.');});
      $$('[data-waquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.waquote); if(!x)return; quote=SDCStore.clone(x); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); sendWhatsAppText(false);});
      $$('[data-remindquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.remindquote); if(!x)return; openWhatsApp(x.phone||'',reminderText(x));});
      $$('[data-delquote]',modalRoot).forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar esta cotización guardada?'))return; state.quotes=state.quotes.filter(x=>x.id!==b.dataset.delquote); save(); draw(); toast('Cotización borrada.');});
    }
    $('#quoteSearch',modalRoot).oninput=e=>{q=e.target.value;draw()}; draw();
  }

  function openProfit(){
    const rows=state.products.map(p=>({p,profit:(+p.price||0)-(+p.cost||0),total:((+p.price||0)-(+p.cost||0))*(+p.stock||0)}));
    openModal(`<div class="modal-head"><h3>Ganancias</h3><button class="close">×</button></div><div class="modal-body"><div class="empty-state">Alerta: productos con ganancia muy baja aparecen marcados para revisar precio o costo.</div><table class="profit-table"><thead><tr><th>Producto</th><th>C/U</th><th>Stock</th><th>Total</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.profit>0&&r.profit<10?'low-profit-row':''}"><td>${escapeHtml(r.p.name)}</td><td>${money(r.profit)}</td><td>${num(r.p.stock)}</td><td>${money(r.total)}</td></tr>`).join('')}</tbody></table></div>`,true)
  }
  function saleProfit(s){return (s.items||[]).reduce((a,it)=>a+(itemTotal(it)-(Number(it.cost||0)*Number(it.qty||0))),0)}
  function isTodayISO(date){const d=new Date(date||Date.now()), n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
  function openReceipts(){
    const sales=state.sales||[]; const today=sales.filter(s=>isTodayISO(s.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0); const profit=today.reduce((a,s)=>a+saleProfit(s),0); const expenses=(state.expenses||[]).filter(x=>isTodayISO(x.date)).reduce((a,x)=>a+(+x.amount||0),0); const net=profit-expenses; const pending=sales.filter(s=>/pendiente|recibir/i.test(s.status||s.paymentStatus||'')).reduce((a,s)=>a+(s.total||calc(s).total),0);
    openModal(`<div class="modal-head"><h3>Caja / recibos</h3><button class="close">×</button></div><div class="modal-body receipts-v22"><div class="cash-stats"><div><span>Vendido hoy</span><b>${money(total)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos hoy</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Ventas hoy</span><b>${num(today.length)}</b></div><div><span>Pendiente</span><b>${money(pending)}</b></div></div><div class="modal-actions" style="position:static"><button class="btn" data-action="dailyClose">Cierre del día</button><button class="btn secondary" data-action="expenses">Registrar gasto</button></div><div class="cart-list">${sales.map(s=>`<div class="cart-row"><div><b>${escapeHtml(s.client||'Cliente')}</b><br><span>${escapeHtml(s.id)} · ${money(s.total||calc(s).total)} · ${escapeHtml(s.status||s.paymentStatus||'Venta')}</span></div><button class="btn small secondary" data-openreceipt="${s.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todavía no hay ventas registradas.</div>'}</div></div>`,true);
    $$('[data-action="dailyClose"]',modalRoot).forEach(b=>b.onclick=openDailyClose);
    $$('[data-openreceipt]',modalRoot).forEach(b=>b.onclick=()=>{const s=state.sales.find(x=>x.id===b.dataset.openreceipt); if(s){saleDraft=SDCStore.clone(s); saleDraft.editingId=s.id; openModal(quoteModalHTML(true),true); bindQuoteCommon(true); toast('Puedes editar esta factura y guardar cambios.')}});
  }
  function openDailyClose(){
    const today=(state.sales||[]).filter(s=>isTodayISO(s.date));
    const todayExpenses=(state.expenses||[]).filter(x=>isTodayISO(x.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0);
    const products=today.reduce((a,s)=>a+calc(s).products,0);
    const delivery=today.reduce((a,s)=>a+calc(s).delivery,0);
    const profit=today.reduce((a,s)=>a+saleProfit(s),0);
    const expenses=todayExpenses.reduce((a,x)=>a+(+x.amount||0),0);
    const net=profit-expenses;
    const codTotal=today.filter(s=>s.cod).reduce((a,s)=>a+(s.total||calc(s).total),0);
    const normalTotal=total-codTotal;
    const txt=`CIERRE DEL DÍA - SD COMAYAGUA\nFecha: ${nowHN()}\nVentas: ${today.length}\nProductos vendidos: ${money(products)}\nEnvío/comisión: ${money(delivery)}\nTotal vendido: ${money(total)}\nNormal/prepago: ${money(normalTotal)}\nPagar al recibir: ${money(codTotal)}\nGastos del día: ${money(expenses)}\nGanancia bruta estimada: ${money(profit)}\nGANANCIA NETA: ${money(net)}\n\nGastos:\n${todayExpenses.map(x=>`- ${x.name}: ${money(x.amount)}`).join('\n')||'- Sin gastos registrados'}`;
    openModal(`<div class="modal-head"><h3>Cierre del día</h3><button class="close">×</button></div><div class="modal-body daily-close-v26"><div class="cash-stats"><div><span>Ventas</span><b>${num(today.length)}</b></div><div><span>Total vendido</span><b>${money(total)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Al recibir</span><b>${money(codTotal)}</b></div></div><textarea class="textarea" id="closeText">${escapeHtml(txt)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="saveClose">Guardar cierre</button><button class="btn secondary" id="copyClose">Copiar resumen</button><button class="btn ghost" id="openExpensesFromClose">Gastos</button></div></div>`,true);
    $('#copyClose').onclick=()=>{navigator.clipboard?.writeText($('#closeText').value); toast('Resumen copiado.');};
    $('#openExpensesFromClose').onclick=openExpenses;
    $('#saveClose').onclick=()=>{state.closings.unshift({id:'CIERRE-'+Date.now(),date:new Date().toISOString(),total,profit,expenses,net,count:today.length,text:$('#closeText').value}); save(); SDCStore.saveBackup(state,'Cierre del día'); toast('Cierre guardado.');};
  }

  function clientKeyFromDoc(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); return phone || slugFile(doc?.client||'cliente');}
  function saveClientFromDoc(doc){
    hydrateState();
    const has=String(doc?.client||doc?.phone||doc?.reference||'').trim(); if(!has)return;
    const key=clientKeyFromDoc(doc); const c=calc(doc); const ix=state.clients.findIndex(x=>x.key===key || (x.phone&&cleanPhone(x.phone).slice(-8)===cleanPhone(doc.phone).slice(-8)));
    const item={key,name:doc.client||'Cliente',phone:doc.phone||'',department:doc.department||'',municipality:doc.municipality||'',reference:doc.reference||'',company:doc.company||'',lastTotal:c.total,lastDate:new Date().toISOString(),notes:''};
    if(ix>=0) state.clients[ix]={...state.clients[ix],...item}; else state.clients.unshift(item);
  }
  function applyClientToDoc(client,kind){
    const doc=kind==='sale'?saleDraft:quote; if(!doc)return;
    doc.client=client.name||''; doc.phone=client.phone||''; doc.department=client.department||'Comayagua'; doc.municipality=client.municipality||'Comayagua'; doc.reference=client.reference||''; doc.company=client.company||doc.company||'Forza';
    openModal(quoteModalHTML(kind==='sale'),true); bindQuoteCommon(kind==='sale'); toast('Cliente cargado en la cotización.');
  }
  function openClients(kind=null){
    hydrateState(); let q='';
    openModal(`<div class="modal-head"><h3>Clientes guardados</h3><button class="close">×</button></div><div class="modal-body clients-v22"><div class="card-box"><b>Agenda de clientes</b><span>Se llena automáticamente al guardar cotizaciones o ventas.</span><div class="searchbar"><span class="icon">⌕</span><input id="clientSearch" placeholder="Buscar nombre, teléfono, municipio o referencia..."></div></div><div id="clientsList"></div></div>`,true);
    function draw(){const term=q.toLowerCase().trim(); const list=(state.clients||[]).filter(c=>!term || [c.name,c.phone,c.department,c.municipality,c.reference,c.company].join(' ').toLowerCase().includes(term)); $('#clientsList').innerHTML=list.map(c=>`<div class="client-card-v22"><div><b>${escapeHtml(c.name||'Cliente')}</b><span>${escapeHtml(c.phone||'Sin teléfono')} · ${escapeHtml([c.department,c.municipality].filter(Boolean).join(' / ')||'Sin ubicación')}</span><small>${escapeHtml(c.reference||'Sin referencia')} · Último total ${money(c.lastTotal||0)}</small></div><div class="client-actions-v22">${kind?`<button class="btn small" data-useclient="${escapeHtml(c.key)}">Usar</button>`:''}<button class="btn small secondary" data-remindclient="${escapeHtml(c.key)}">WhatsApp</button><button class="btn small danger" data-delclient="${escapeHtml(c.key)}">Borrar</button></div></div>`).join('')||'<div class="empty-state">Aún no hay clientes guardados.</div>'; $$('[data-useclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.useclient); if(c)applyClientToDoc(c,kind)}); $$('[data-remindclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.remindclient); if(c)openWhatsApp(c.phone||'',`Hola ${c.name||''}, le saluda SD COMAYAGUA. ¿Desea que le ayudemos con algún producto o cotización?`)}); $$('[data-delclient]').forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar este cliente guardado?'))return; state.clients=state.clients.filter(x=>x.key!==b.dataset.delclient); save(); draw();});}
    $('#clientSearch').oninput=e=>{q=e.target.value;draw()}; draw();
  }
  function marketplaceText(p){
    const title=`${p.name} - Disponible en Comayagua`;
    return `FACEBOOK MARKETPLACE\nTítulo: ${title}\nPrecio: ${money(p.price)}\nEstado: Nuevo\nCategoría sugerida: ${firstTag(p)}\n\nDescripción:\n${p.description||'Producto disponible para entrega inmediata.'}\n\nEnvíos en Comayagua y Honduras por C807, Forza y Cargo Expreso. Envío Normal Lps. 110. Pagar al Recibir: Lps. 100 + comisión del 6%.\n\nEtiquetas Facebook:\nComayagua, Honduras, tienda online, envío a domicilio, SD Comayagua, productos gamer, accesorios para celular\n\nINSTAGRAM:\n${p.name} disponible 🔥\nPrecio: ${money(p.price)}\nConsulta por WhatsApp +504 3151-7755\n\n#Comayagua #Honduras #SDComayagua #TiendaOnline #GamerHonduras #AccesoriosCelular #EnviosHonduras`;
  }
  function catalogText(p){
    return `WHATSAPP CATÁLOGO\nNombre: ${p.name}\nPrecio: ${money(p.price)}\nPrecio de oferta: ${money(p.price)}\nCódigo: ${p.id}\nPaís de origen: Honduras\n\nDescripción:\n${p.description||'Producto disponible en SD Comayagua.'}\n\nEnvío Normal: Lps. 110. Pagar al Recibir: Lps. 100 + comisión del 6%. WhatsApp: +504 3151-7755`;
  }
  function openMarketingText(id){
    const p=productById(id); if(!p)return;
    const text=`${marketplaceText(p)}\n\n------------------------------\n\n${catalogText(p)}`;
    openModal(`<div class="modal-head"><h3>Textos para vender</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box"><h4>${escapeHtml(p.name)}</h4><p style="color:#b8c8d8">Texto listo para Marketplace, Instagram y WhatsApp Catálogo.</p><textarea class="textarea" id="marketingText" style="min-height:360px">${escapeHtml(text)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="copyMarketing">Copiar todo</button><button class="btn secondary" id="waMarketing">Enviar WhatsApp</button></div></div></div>`,true);
    $('#copyMarketing').onclick=()=>{navigator.clipboard?.writeText($('#marketingText').value); toast('Texto copiado.');};
    $('#waMarketing').onclick=()=>openWhatsApp('', $('#marketingText').value);
  }
  async function sendCompleteQuote(){
    if(!quote.items.length)return toast('Agrega productos primero.');
    saveCurrentQuote();
    await shareDocPhoto(false);
  }

  function toggleCaptureClean(){
    state.settings.captureClean=!state.settings.captureClean;
    if(state.settings.captureClean) state.settings.cardView='client';
    save(); applyAppearance(); render(); toast(state.settings.captureClean?'Modo captura activado. Toque SALIR o CAPTURA para volver a la vista normal.':'Captura desactivada. Ya volvió a la vista normal.');
  }

  function toggleMoneyLock(){
    if(state.settings.moneyLocked){
      const pin=prompt('Ingresa la clave para mostrar ganancias:');
      if(pin!==(state.settings.accessKey||'199311')) return toast('Clave incorrecta.');
      state.settings.moneyLocked=false;
    }else{
      state.settings.moneyLocked=true;
    }
    save(); applyAppearance(); render(); toast(state.settings.moneyLocked?'Ganancias ocultas.':'Ganancias visibles.');
  }
  function autoFillClientByPhone(doc,isSale){
    const p=cleanPhone(doc.phone||'').slice(-8); if(p.length<8 || doc.__clientAutofilled===p) return;
    const c=(state.clients||[]).find(x=>cleanPhone(x.phone||'').slice(-8)===p);
    if(!c) return;
    doc.__clientAutofilled=p;
    doc.client=doc.client||c.name||''; doc.department=c.department||doc.department; doc.municipality=c.municipality||doc.municipality; doc.reference=doc.reference||c.reference||''; doc.company=c.company||doc.company;
    toast('Cliente frecuente cargado automáticamente.');
  }
  function openQuickSale(){
    const doc=emptySale(); saleDraft=doc;
    openModal(`<div class="modal-head"><h3>Venta rápida</h3><button class="close">×</button></div><div class="modal-body quick-sale-v26"><div class="card-box"><b>Venta rápida desde celular</b><span>Producto, cantidad y tipo de envío. Los datos del cliente son opcionales.</span><div class="searchbar"><span class="icon">⌕</span><input id="quickSearch" placeholder="Buscar producto..."></div><div id="quickList" class="picker-list"></div></div><div class="card-box"><label><span class="label">Cantidad</span><input id="quickQty" class="input" type="number" inputmode="numeric" value="1" min="1"></label><label><span class="label">Tipo de cobro</span><select id="quickType" class="select"><option value="Normal">Envío Normal Lps.110</option><option value="COD">Pagar al Recibir Lps.100 + 6%</option></select></label><label><span class="label">Teléfono cliente opcional</span><input id="quickPhone" class="input" inputmode="tel" placeholder="31517755"></label><label><span class="label">Cliente opcional</span><input id="quickClient" class="input" placeholder="Nombre"></label><div id="quickSummary" class="summary"></div><button class="btn full" id="quickFinish">Registrar venta rápida</button></div></div>`,true);
    let selected=null, q='';
    function drawList(){const term=q.toLowerCase(); const list=state.products.filter(p=>!term||[p.name,p.id,categoryText(p)].join(' ').toLowerCase().includes(term)).slice(0,30); $('#quickList').innerHTML=list.map(p=>`<div class="picker-item ${selected===p.id?'active':''}"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(p.price)} · Stock ${num(p.stock)}</span></div><button class="btn small" data-qselect="${escapeHtml(p.id)}">Elegir</button></div>`).join(''); $$('[data-qselect]',modalRoot).forEach(b=>b.onclick=()=>{selected=b.dataset.qselect; drawList(); drawSummary();});}
    function drawSummary(){const p=productById(selected); const qty=Math.max(1,+($('#quickQty')?.value||1)); if(!p){$('#quickSummary').innerHTML='<div class="empty-state">Elegí un producto.</div>';return;} const products=productItemsTotal(p,qty); const cod=$('#quickType').value==='COD'; const shipping=cod?100:110; const total=cod?Math.round((products+shipping)*(1+((state.settings.codPercent||6)/100))):products+shipping; const offer=promoLabelForQty(p,qty); $('#quickSummary').innerHTML=`<div class="summary-row"><b>Producto</b><b>${money(products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(shipping)}</b></div>${offer?`<div class="promo-applied-v26">🎁 ${escapeHtml(offer)}</div>`:''}<div class="summary-total"><b>Total</b><b>${money(total)}</b></div>`;}
    $('#quickSearch').oninput=e=>{q=e.target.value;drawList()}; $('#quickQty').oninput=drawSummary; $('#quickType').onchange=drawSummary; drawList(); drawSummary();
    $('#quickFinish').onclick=()=>{const p=productById(selected); if(!p)return toast('Elegí un producto.'); const qty=Math.max(1,+$('#quickQty').value||1); saleDraft=emptySale(); saleDraft.client=$('#quickClient').value.trim(); saleDraft.phone=$('#quickPhone').value.trim(); saleDraft.shippingType=$('#quickType').value; saleDraft.cod=saleDraft.shippingType==='COD'; saleDraft.shipping=saleDraft.cod?100:110; saleDraft.status=saleDraft.cod?'Pagar al recibir':'Vendido'; saleDraft.items=[{id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty,image:productImage(p)}]; finishSale(); closeModal(); render();};
  }
  function openExpenses(){
    hydrateState(); let today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); const total=today.reduce((a,x)=>a+(+x.amount||0),0);
    openModal(`<div class="modal-head"><h3>Gastos del negocio</h3><button class="close">×</button></div><div class="modal-body expenses-v26"><div class="cash-stats"><div><span>Gastos hoy</span><b>${money(total)}</b></div><div><span>Registros</span><b>${num(today.length)}</b></div></div><div class="card-box"><label><span class="label">Concepto</span><input id="expenseName" class="input" placeholder="Empaque, transporte, publicidad..."></label><label><span class="label">Monto Lps.</span><input id="expenseAmount" class="input" type="number" inputmode="numeric" placeholder="0"></label><button class="btn full" id="saveExpense">Guardar gasto</button></div><div class="cart-list" id="expenseList"></div></div>`,true);
    function draw(){today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); $('#expenseList').innerHTML=today.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.name)}</b><br><span>${new Date(x.date).toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})} · ${money(x.amount)}</span></div><button class="btn small danger" data-delexp="${x.id}">Borrar</button></div>`).join('')||'<div class="empty-state">Sin gastos hoy.</div>'; $$('[data-delexp]',modalRoot).forEach(b=>b.onclick=()=>{state.expenses=state.expenses.filter(x=>x.id!==b.dataset.delexp); save(); draw();});}
    $('#saveExpense').onclick=()=>{const name=$('#expenseName').value.trim()||'Gasto'; const amount=+$('#expenseAmount').value||0; if(amount<=0)return toast('Escribe el monto del gasto.'); state.expenses.unshift({id:'GASTO-'+Date.now(),name,amount,date:new Date().toISOString()}); save(); toast('Gasto guardado.'); openExpenses();}; draw();
  }
  function openShortReceipt(isSale){
    const doc=currentDoc(isSale); const c=calc(doc);
    const lines=(doc.items||[]).map(it=>{const qty=Math.max(1,+it.qty||1); return `<div><span>${escapeHtml(it.name)} x${num(qty)}</span><b>${money(itemTotal(it))}</b></div>`}).join('');
    openModal(`<div class="modal-head"><h3>Recibo corto</h3><button class="close">×</button></div><div class="modal-body"><div class="short-receipt" id="shortReceiptCard"><h2>SD COMAYAGUA</h2><p>${escapeHtml(doc.client||'Cliente')} · ${nowHN()}</p>${lines}<hr><div><span>Productos</span><b>${money(c.products)}</b></div><div><span>Envío</span><b>${money(c.shipping)}</b></div>${c.commission?`<div><span>Comisión</span><b>${money(c.commission)}</b></div>`:''}<div class="grand"><span>Total</span><b>${money(c.total)}</b></div><small>WhatsApp +504 3151-7755</small></div><div class="modal-actions" style="position:static"><button class="btn" id="copyShortReceipt">Copiar texto</button></div></div>`,true);
    $('#copyShortReceipt').onclick=()=>{
      const body=[
        'SD COMAYAGUA',
        `Cliente: ${doc.client||'Cliente'}`,
        ...(doc.items||[]).map(it=>`${it.name} x${it.qty}: ${money(itemTotal(it))}`),
        `Envío: ${money(c.shipping)}`,
        `Comisión: ${money(c.commission)}`,
        `TOTAL: ${money(c.total)}`,
        'WhatsApp +504 3151-7755'
      ].join('\n');
      navigator.clipboard?.writeText(body); toast('Recibo corto copiado.');
    };
  }
  function csvBlobDownload(filename,content){const blob=new Blob([content],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function exportAllCSV(){
    const lines=['tipo,id,fecha,cliente,telefono,estado,total,productos'];
    (state.sales||[]).forEach(s=>lines.push(['venta',s.id,s.date,s.client,s.phone,s.status||'',calc(s).total,(s.items||[]).map(i=>`${i.name} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.quotes||[]).forEach(q=>lines.push(['cotizacion',q.id,q.date,q.client,q.phone,q.status||'',calc(q).total,(q.items||[]).map(i=>`${i.name} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.clients||[]).forEach(c=>lines.push(['cliente',c.key,c.lastDate,c.name,c.phone,c.municipality,c.lastTotal,c.reference].map(csvEscape).join(',')));
    csvBlobDownload(`ventas-clientes-sdc-${fileStamp()}.csv`,lines.join('\n'));
  }

  function openNoCost(){openModal(`<div class="modal-head"><h3>Productos sin costo</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.products.filter(p=>+p.cost<=0).map(p=>`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)}</span></div><button class="btn small secondary" data-editcost="${p.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todo tiene costo registrado.</div>'}</div></div>`,true); $$('[data-editcost]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editcost)})}

  window.addEventListener('storage',e=>{if(e.key===SDCStore.KEY){state=SDCStore.load(); hydrateState(); render(); toast('Datos actualizados.')}});
  $('#goTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  window.addEventListener('scroll',()=>$('#goTop').style.display=scrollY>320?'block':'none');
  applyAppearance();
  render();
  bootSheetSync();
  requestAnimationFrame(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); } });
  setTimeout(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){} }, 250);
})();
