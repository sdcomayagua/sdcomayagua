(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');
  const toastEl = $('#toast');
  const LS = 'sdc_pos_dashboard_v1';
  const CONFIG_LS = 'sdc_pos_dashboard_config_v2';
  const LOGO = 'assets/logo-sdc-2026.png';
  const NO_IMG = 'assets/no-image.svg';
  const SDC_HN_FALLBACK = {
    'Atlántida': ['La Ceiba','El Porvenir','Esparta','Jutiapa','La Masica','San Francisco','Tela','Arizona'],
    'Colón': ['Trujillo','Balfate','Iriona','Limón','Sabá','Santa Fe','Santa Rosa de Aguán','Sonaguera','Tocoa','Bonito Oriental'],
    'Comayagua': ['Comayagua','Ajuterique','El Rosario','Esquías','Humuya','La Libertad','Lamaní','La Trinidad','Lejamaní','Meámbar','Minas de Oro','Ojos de Agua','San Jerónimo','San José de Comayagua','San José del Potrero','San Luis','San Sebastián','Siguatepeque','Villa de San Antonio','Las Lajas','Taulabé'],
    'Copán': ['Santa Rosa de Copán','Cabañas','Concepción','Copán Ruinas','Corquín','Cucuyagua','Dolores','Dulce Nombre','El Paraíso','Florida','La Jigua','La Unión','Nueva Arcadia','San Agustín','San Antonio','San Jerónimo','San José','San Juan de Opoa','San Nicolás','San Pedro','Santa Rita','Trinidad de Copán','Veracruz'],
    'Cortés': ['San Pedro Sula','Choloma','Omoa','Pimienta','Potrerillos','Puerto Cortés','San Antonio de Cortés','San Francisco de Yojoa','San Manuel','Santa Cruz de Yojoa','Villanueva','La Lima'],
    'Choluteca': ['Choluteca','Apacilagua','Concepción de María','Duyure','El Corpus','El Triunfo','Marcovia','Morolica','Namasigüe','Orocuina','Pespire','San Antonio de Flores','San Isidro','San José','San Marcos de Colón','Santa Ana de Yusguare'],
    'El Paraíso': ['Yuscarán','Alauca','Danlí','El Paraíso','Güinope','Jacaleapa','Liure','Morocelí','Oropolí','Potrerillos','San Antonio de Flores','San Lucas','San Matías','Soledad','Teupasenti','Texiguat','Vado Ancho','Yauyupe','Trojes'],
    'Francisco Morazán': ['Distrito Central','Alubarén','Cedros','Curarén','El Porvenir','Guaimaca','La Libertad','La Venta','Lepaterique','Maraita','Marale','Nueva Armenia','Ojojona','Orica','Reitoca','Sabanagrande','San Antonio de Oriente','San Buenaventura','San Ignacio','San Juan de Flores','San Miguelito','Santa Ana','Santa Lucía','Talanga','Tatumbla','Valle de Ángeles','Villa de San Francisco','Vallecillo'],
    'Gracias a Dios': ['Puerto Lempira','Brus Laguna','Ahuas','Juan Francisco Bulnes','Ramón Villeda Morales','Wampusirpe'],
    'Intibucá': ['La Esperanza','Camasca','Colomoncagua','Concepción','Dolores','Intibucá','Jesús de Otoro','Magdalena','Masaguara','San Antonio','San Isidro','San Juan','San Marcos de la Sierra','San Miguel Guancapla','Santa Lucía','Yamaranguila','San Francisco de Opalaca'],
    'Islas de la Bahía': ['Roatán','Guanaja','José Santos Guardiola','Utila'],
    'La Paz': ['La Paz','Aguanqueterique','Cabañas','Cane','Chinacla','Guajiquiro','Lauterique','Marcala','Mercedes de Oriente','Opatoro','San Antonio del Norte','San José','San Juan','San Pedro de Tutule','Santa Ana','Santa Elena','Santa María','Santiago de Puringla','Yarula'],
    'Lempira': ['Gracias','Belén','Candelaria','Cololaca','Erandique','Gualcince','Guarita','La Campa','La Iguala','Las Flores','La Unión','La Virtud','Lepaera','Mapulaca','Piraera','San Andrés','San Francisco','San Juan Guarita','San Manuel Colohete','San Rafael','San Sebastián','Santa Cruz','Talgua','Tambla','Tomalá','Valladolid','Virginia','San Marcos de Caiquín'],
    'Ocotepeque': ['Nueva Ocotepeque','Belén Gualcho','Concepción','Dolores Merendón','Fraternidad','La Encarnación','La Labor','Lucerna','Mercedes','San Fernando','San Francisco del Valle','San Jorge','San Marcos','Santa Fe','Sensenti','Sinuapa'],
    'Olancho': ['Juticalpa','Campamento','Catacamas','Concordia','Dulce Nombre de Culmí','El Rosario','Esquipulas del Norte','Gualaco','Guarizama','Guata','Guayape','Jano','La Unión','Mangulile','Manto','Salamá','San Esteban','San Francisco de Becerra','San Francisco de la Paz','Santa María del Real','Silca','Yocón','Patuca'],
    'Santa Bárbara': ['Santa Bárbara','Arada','Atima','Azacualpa','Ceguaca','San José de las Colinas','Concepción del Norte','Concepción del Sur','Chinda','El Níspero','Gualala','Ilama','Macuelizo','Naranjito','Nuevo Celilac','Petoa','Protección','Quimistán','San Francisco de Ojuera','San Luis','San Marcos','San Nicolás','San Pedro Zacapa','Santa Rita','San Vicente Centenario','Trinidad','Las Vegas','Nueva Frontera'],
    'Valle': ['Nacaome','Alianza','Amapala','Aramecina','Caridad','Goascorán','Langue','San Francisco de Coray','San Lorenzo'],
    'Yoro': ['Yoro','Arenal','El Negrito','El Progreso','Jocón','Morazán','Olanchito','Santa Rita','Sulaco','Victoria','Yorito']
  };
  const HN_LOCATIONS = { ...SDC_HN_FALLBACK, ...(window.SDC_HN_LOCATIONS || {}) };
  const DEPARTMENTS = Object.keys(HN_LOCATIONS);
  const DEFAULT_DEPARTMENT = DEPARTMENTS.includes('Comayagua') ? 'Comayagua' : (DEPARTMENTS[0] || '');
  const DEFAULT_MUNICIPALITY = (HN_LOCATIONS[DEFAULT_DEPARTMENT] || [DEFAULT_DEPARTMENT])[0] || '';
  const OFFICIAL_CONFIG = {
    storeName: 'SD COMAYAGUA',
    storeFullName: 'Soluciones Digitales Comayagua',
    whatsappNumber: '50431517755',
    currency: 'Lps.',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzZKAqIR_u-rmcdDUodffpLtZb5zFXOXms8MEcbN0zkfvXhEUe_MQE49dyAtDzaTkWY/exec',
    apiKey: 'SDC_POS_2026',
    normalShipping: 110,
    cashOnDeliveryShipping: 100,
    cashOnDeliveryCommission: 0.06,
    localShipping: 0,
    lowStockLimit: 5
  };
  const emptyProductDraft = () => ({ id:'', codigo:'', nombre:'', categoria:'', marca:'', precio:'', costo:'', stock:'', descripcion:'', imagen:'', activo:true, promos:'', notas:'' });

  const defaultState = () => ({
    view:'dashboard',
    mode:'pro',
    config:mergeConfigLayers(window.SDC_CONFIG),
    products:(window.SDC_DEMO_PRODUCTS || []).map(normalizeProduct),
    invoices:[],
    clients:[],
    filter:{ q:'', category:'Todos', status:'Todos' },
    productPickQ:'',
    productViewMode:'two',
    showProductForm:false,
    productDraft:emptyProductDraft(),
    cart:[],
    customer:{ nombre:'', telefono:'', departamento:DEFAULT_DEPARTMENT, municipio:DEFAULT_DEPARTMENT === 'Comayagua' ? 'Comayagua' : DEFAULT_MUNICIPALITY, direccion:'', referencia:'' },
    shippingType:'normal',
    discount:0,
    editingInvoiceId:'',
    invoiceTheme:'pro',
    productLoad:{ status:'local', message:'Productos locales listos.', count:0, updatedAt:'' }
  });

  let state = load();
  let bootSyncDone = false;
  window.SDC_CONFIG = { ...(window.SDC_CONFIG || {}), ...state.config };
  persistConfig();
  ensureCustomerLocation();
  applyMode();
  render();
  setTimeout(bootProducts, 280);

  function load(){
    try{
      const saved = JSON.parse(localStorage.getItem(LS) || 'null');
      const base = defaultState();
      const out = saved ? { ...base, ...saved } : base;
      out.config = mergeConfigLayers(window.SDC_CONFIG, saved?.config || {}, readStoredConfig());
      out.products = Array.isArray(out.products) && out.products.length ? out.products.map(normalizeProduct) : base.products;
      out.invoices = Array.isArray(out.invoices) ? out.invoices : [];
      out.clients = Array.isArray(out.clients) ? out.clients : [];
      out.cart = Array.isArray(out.cart) ? out.cart : [];
      out.productLoad = { ...base.productLoad, ...(saved?.productLoad || {}) };
      out.productLoad.count = Array.isArray(out.products) ? out.products.length : 0;
      out.customer = { ...base.customer, ...(saved?.customer || {}) };
      out.filter = { ...base.filter, ...(saved?.filter || {}) };
      out.productPickQ = String(saved?.productPickQ || '');
      out.productViewMode = saved?.productViewMode === 'one' ? 'one' : 'two';
      if (!String(out.config.appsScriptUrl || '').trim() && String(window.SDC_CONFIG.appsScriptUrl || '').trim()) out.config.appsScriptUrl = window.SDC_CONFIG.appsScriptUrl;
      if (!String(out.config.apiKey || '').trim() && String(window.SDC_CONFIG.apiKey || '').trim()) out.config.apiKey = window.SDC_CONFIG.apiKey;
      out.showProductForm = Boolean(saved?.showProductForm);
      out.productDraft = { ...emptyProductDraft(), ...(saved?.productDraft || {}) };
      out.mode = 'pro';
      out.invoiceTheme = 'pro';
      return out;
    }catch(e){ return defaultState(); }
  }
  function readStoredConfig(){
    try{ return JSON.parse(localStorage.getItem(CONFIG_LS) || '{}') || {}; }catch(e){ return {}; }
  }
  function configHasValue(v){ return v !== undefined && v !== null && String(v).trim() !== ''; }
  function mergeConfigLayers(...layers){
    const out = { ...OFFICIAL_CONFIG };
    layers.filter(Boolean).forEach(layer => {
      ['storeName','storeFullName','whatsappNumber','currency','appsScriptUrl','apiKey'].forEach(key => {
        if (configHasValue(layer[key])) out[key] = layer[key];
      });
      ['normalShipping','cashOnDeliveryShipping','cashOnDeliveryCommission','localShipping','lowStockLimit'].forEach(key => {
        if (configHasValue(layer[key]) && Number.isFinite(Number(layer[key]))) out[key] = Number(layer[key]);
      });
    });
    out.appsScriptUrl = normalizeAppsScriptUrl(out.appsScriptUrl);
    out.whatsappNumber = cleanPhone(out.whatsappNumber);
    out.currency = out.currency || 'Lps.';
    out.storeName = out.storeName || 'SD COMAYAGUA';
    out.storeFullName = out.storeFullName || 'Soluciones Digitales Comayagua';
    out.lowStockLimit = n(out.lowStockLimit) || 5;
    return out;
  }
  function restoreOfficialConfig(){
    state.config = mergeConfigLayers(OFFICIAL_CONFIG);
    window.SDC_CONFIG = { ...(window.SDC_CONFIG || {}), ...state.config };
    persistConfig();
    save();
    render();
    toast('Datos oficiales de SD COMAYAGUA restaurados.');
  }
  function persistConfig(){
    try{
      const safeConfig = {
        appsScriptUrl: String(state.config?.appsScriptUrl || '').trim(),
        apiKey: String(state.config?.apiKey || '').trim(),
        whatsappNumber: cleanPhone(state.config?.whatsappNumber || ''),
        normalShipping: n(state.config?.normalShipping),
        cashOnDeliveryShipping: n(state.config?.cashOnDeliveryShipping),
        cashOnDeliveryCommission: n(state.config?.cashOnDeliveryCommission),
        localShipping: n(state.config?.localShipping),
        lowStockLimit: n(state.config?.lowStockLimit) || 5,
        currency: state.config?.currency || 'Lps.',
        storeName: state.config?.storeName || 'SD COMAYAGUA',
        storeFullName: state.config?.storeFullName || 'Soluciones Digitales Comayagua'
      };
      localStorage.setItem(CONFIG_LS, JSON.stringify(safeConfig));
    }catch(e){ console.warn('No se pudo guardar configuración aislada', e); }
  }
  function save(){
    persistConfig();
    try{ localStorage.setItem(LS, JSON.stringify(state)); }
    catch(e){ console.warn('No se pudo guardar todo el estado local', e); }
  }
  function normalizeAppsScriptUrl(value){
    let url = String(value || '').trim();
    if (!url) return '';
    url = url.replace(/\s+/g, '');
    if (/^script\.google\.com/i.test(url)) url = 'https://' + url;
    return url;
  }
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2600); }
  function n(v){ const x = Number(v || 0); return Number.isFinite(x) ? x : 0; }
  function money(v){ return `${state.config.currency || 'Lps.'} ${Math.round(n(v)).toLocaleString('es-HN')}`; }
  function cleanPhone(v){ return String(v || '').replace(/\D/g,'').replace(/^5040?/,'504'); }
  function uid(prefix){ return `${prefix}-${Date.now().toString().slice(-8)}${Math.floor(Math.random()*90+10)}`; }
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function today(){ return new Date().toLocaleString('es-HN', { day:'2-digit', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' }); }
  function iso(){ return new Date().toISOString(); }
  function applyMode(){ state.mode = 'pro'; state.invoiceTheme = 'pro'; document.body.classList.remove('mode-gamer'); document.body.classList.add('mode-pro'); }

  function productSourceLabel(){
    const load = state.productLoad || {};
    const count = Array.isArray(state.products) ? state.products.filter(p => p.activo !== false).length : 0;
    const status = load.status || 'local';
    const labels = { synced:'Sincronizado', local:'Local', demo:'Demo', error:'Local / revisar conexión', loading:'Cargando' };
    return {
      status,
      label:labels[status] || 'Local',
      message:load.message || 'Productos listos.',
      count,
      updatedAt:load.updatedAt || ''
    };
  }
  function setProductLoad(status, message){
    state.productLoad = { status, message, count:Array.isArray(state.products) ? state.products.length : 0, updatedAt:iso() };
  }
  function demoProducts(){ return (window.SDC_DEMO_PRODUCTS || []).map(normalizeProduct); }
  function ensureProductsFallback(message = 'Mostrando productos demo/locales para que la página no quede vacía.'){
    if (!Array.isArray(state.products) || !state.products.length) {
      state.products = demoProducts();
      setProductLoad('demo', message);
    }
  }
  function friendlySyncError(err){
    const raw = String(err?.message || err || '').trim();
    if (!raw) return 'No se pudo sincronizar con Apps Script.';
    if (/Cannot call SpreadsheetApp.openById|Unexpected error.*openById|No item with the given ID|Document is missing/i.test(raw)) {
      return 'Apps Script no puede abrir la hoja. Revise que Code.gs tenga el SHEET_ID correcto y vuelva a desplegar.';
    }
    if (/PEGA_AQUI|invalid id|ID de hoja|Spreadsheet/i.test(raw)) {
      return 'El SHEET_ID del Apps Script no está correcto. Pegue el ID real de Google Sheets en Code.gs.';
    }
    if (/HTML|Sign in|Iniciar sesión|Cualquier usuario|permiso|permission|access/i.test(raw)) {
      return 'Apps Script no está público o no está desplegado como Web App. Use acceso: Cualquier usuario.';
    }
    if (/JSON válido|JSON valido/i.test(raw)) {
      return raw;
    }
    return raw.length > 180 ? raw.slice(0, 180) + '…' : raw;
  }
  function pick(obj, keys, fallback = ''){
    if (!obj || typeof obj !== 'object') return fallback;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== '' && obj[key] != null) return obj[key];
    }
    const wanted = keys.map(k => String(k).toLowerCase().replace(/[\s_.-]/g,''));
    for (const [k,v] of Object.entries(obj)) {
      const clean = String(k).toLowerCase().replace(/[\s_.-]/g,'');
      if (wanted.includes(clean) && v !== '' && v != null) return v;
    }
    return fallback;
  }
  function productHasMeaning(p){
    if (!p) return false;
    const name = pick(p, ['nombre','name','producto','titulo','title','descripcion_producto','nombre_producto']);
    const code = pick(p, ['codigo','code','sku','id']);
    const price = pick(p, ['precio','price','precio_venta','venta','precio normal','precio_normal']);
    return Boolean(String(name || '').trim() || String(code || '').trim() || String(price || '').trim());
  }
  function parseBoolActive(v){
    const raw = String(v ?? '').trim().toLowerCase();
    if (!raw) return true;
    if (['false','falso','no','0','inactivo','oculto'].includes(raw)) return false;
    return true;
  }
  function normalizeImageUrl(url){
    let out = String(url || '').trim();
    const drive = out.match(/drive\.google\.com\/file\/d\/([^/]+)/) || out.match(/[?&]id=([^&]+)/);
    if (drive && drive[1]) out = `https://drive.google.com/uc?export=view&id=${drive[1]}`;
    return out;
  }
  function extractProductArray(payload){
    const d = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
    const pools = [
      d?.products, d?.productos, d?.productos_pos, d?.items, d?.catalogo, d?.catalog,
      d?.data?.products, d?.data?.productos, d?.result?.products, d?.result?.productos
    ];
    return pools.find(Array.isArray) || [];
  }
  function applyRemotePayload(payload, options = {}){
    const productsRaw = extractProductArray(payload).filter(productHasMeaning);
    const changed = { products:0, invoices:0, clients:0, settings:false };
    if (productsRaw.length) {
      const normalized = productsRaw.map(normalizeProduct).filter(productHasMeaning);
      if (normalized.length) {
        state.products = normalized;
        changed.products = normalized.length;
        setProductLoad('synced', `${normalized.length} productos cargados desde Google Sheets.`);
      }
    }
    const settings = payload?.settings || payload?.ajustes || payload?.data?.settings;
    if (settings && typeof settings === 'object') {
      const safeSettings = { ...settings };
      if (safeSettings.whatsapp && !safeSettings.whatsappNumber) safeSettings.whatsappNumber = safeSettings.whatsapp;
      if (safeSettings.moneda && !safeSettings.currency) safeSettings.currency = safeSettings.moneda;
      state.config = { ...state.config, ...safeSettings, appsScriptUrl:state.config.appsScriptUrl, apiKey:state.config.apiKey };
      window.SDC_CONFIG = { ...window.SDC_CONFIG, ...state.config };
      changed.settings = true;
    }
    const inv = payload?.invoices || payload?.facturas || payload?.data?.invoices;
    if (Array.isArray(inv)) { state.invoices = mergeInvoices(state.invoices, inv.map(fromSheetInvoice)); changed.invoices = inv.length; }
    const clients = payload?.clients || payload?.clientes || payload?.data?.clients;
    if (Array.isArray(clients)) { state.clients = mergeClients(state.clients, clients); changed.clients = clients.length; }
    if (!changed.products && !options.silent) setProductLoad('error', 'Sheets respondió, pero no encontré productos válidos. Se mantienen los productos locales.');
    return changed;
  }
  async function bootProducts(){
    if (bootSyncDone) return;
    bootSyncDone = true;
    if (!Array.isArray(state.products) || !state.products.length) {
      state.products = demoProducts();
      setProductLoad('demo', 'No había productos guardados. Mostrando productos demo/locales.');
      save(); render();
    }
    if (!window.SDCApi || !SDCApi.ready()) {
      if (!state.productLoad?.updatedAt) { setProductLoad('local', 'Productos locales listos. Configure Apps Script para sincronizar Sheets.'); save(); render(); }
      return;
    }
    setProductLoad('loading', 'Cargando productos desde Google Sheets…');
    save(); render();
    try{
      let data = await SDCApi.get('all');
      let changed = applyRemotePayload(data, { silent:true });
      if (!changed.products) {
        data = await SDCApi.get('products');
        changed = applyRemotePayload(data, { silent:true });
      }
      if (changed.products) { save(); render(); toast(`${changed.products} productos cargados.`); }
      else { setProductLoad('error', 'Sheets no devolvió productos válidos. Se mantienen los productos locales.'); save(); render(); toast('No encontré productos en Sheets. Mostrando locales.'); }
    }catch(e){
      console.error(e);
      ensureProductsFallback('No se pudo conectar con Sheets. Mostrando productos demo/locales.');
      setProductLoad('error', `${friendlySyncError(e)} Se mantienen productos locales/demo.`);
      save(); render(); toast('No cargó Sheets. Se muestran productos locales/demo.');
    }
  }

  function normalizeProduct(p, i = 0){
    p = p || {};
    const rawId = pick(p, ['id','ID','codigo','code','sku'], `prod-${i+1}`);
    const rawCode = pick(p, ['codigo','code','sku','id'], `SDC-${String(i+1).padStart(3,'0')}`);
    const rawName = pick(p, ['nombre','name','producto','titulo','title','nombre_producto','descripcion_producto'], 'Producto sin nombre');
    const rawCategory = pick(p, ['categoria','category','categoría','categories','rubro','tipo'], 'General');
    const rawBrand = pick(p, ['marca','brand','variante','version','versión'], '');
    const stock = n(pick(p, ['stock','existencia','cantidad','inventario','unidades'], 0));
    const price = n(pick(p, ['precio','price','precio_venta','venta','precio normal','precio_normal','valor'], 0));
    const cost = n(pick(p, ['costo','cost','costo_compra','compra','invertido'], 0));
    const image = normalizeImageUrl(pick(p, ['imagen','image','img','foto','photo','url_imagen','imagen_url','image_url','thumbnail'], ''));
    const active = parseBoolActive(pick(p, ['activo','active','visible','mostrar','estado'], true));
    return {
      id:String(rawId || `prod-${i+1}`).trim(),
      codigo:String(rawCode || rawId || `SDC-${String(i+1).padStart(3,'0')}`).trim(),
      nombre:String(rawName || 'Producto sin nombre').trim(),
      categoria:String(rawCategory || 'General').trim(),
      marca:String(rawBrand || '').trim(),
      precio:price,
      costo:cost,
      stock:stock,
      descripcion:String(pick(p, ['descripcion','description','detalle','detalles','notas','observacion'], '') || '').trim(),
      imagen:image,
      activo:active,
      updatedAt:p.updatedAt || p.actualizado || p.fecha || iso(),
      valor_venta_stock:price * stock,
      inversion_stock:cost * stock,
      ganancia_unitaria:price - cost,
      ganancia_proyectada:(price - cost) * stock,
      estado_stock:stock <= 0 ? 'Agotado' : stock <= n((window.SDC_CONFIG && window.SDC_CONFIG.lowStockLimit) || 5) ? 'Bajo stock' : 'Disponible',
      promos:String(pick(p, ['promos','ofertas','ofertas_json','promociones'], '') || '').trim(),
      notas:String(pick(p, ['notas','nota','observaciones'], '') || '').trim()
    };
  }

  function categories(){
    return ['Todos', ...Array.from(new Set(state.products.filter(p => p.activo).map(p => p.categoria || 'General'))).sort((a,b) => a.localeCompare(b,'es'))];
  }
  function departmentOptions(){ return DEPARTMENTS.length ? DEPARTMENTS : ['Comayagua']; }
  function municipalityOptions(dept = state.customer.departamento){ return HN_LOCATIONS[dept] || ['Comayagua']; }
  function ensureCustomerLocation(){
    const deps = departmentOptions();
    if (!deps.includes(state.customer.departamento)) state.customer.departamento = DEFAULT_DEPARTMENT || deps[0];
    const munis = municipalityOptions(state.customer.departamento);
    if (!munis.includes(state.customer.municipio)) state.customer.municipio = munis[0] || '';
  }

  function filteredProducts(){
    const q = state.filter.q.toLowerCase().trim();
    return state.products.filter(p => {
      if (!p.activo) return false;
      const hay = [p.codigo,p.nombre,p.categoria,p.marca,p.descripcion].join(' ').toLowerCase();
      const okQ = !q || hay.includes(q);
      const okC = state.filter.category === 'Todos' || p.categoria === state.filter.category;
      const okS = state.filter.status === 'Todos' || p.estado_stock === state.filter.status;
      return okQ && okC && okS;
    });
  }

  function pickerProducts(){
    const q = String(state.productPickQ || '').toLowerCase().trim();
    return state.products
      .filter(p => p.activo && n(p.stock) > 0)
      .filter(p => {
        if (!q) return true;
        return [p.codigo,p.nombre,p.categoria,p.marca].join(' ').toLowerCase().includes(q);
      })
      .slice(0, 8);
  }
  function quickProductResults(){
    const items = pickerProducts();
    if (!items.length) return '<div class="empty compact-empty">No encontré productos disponibles.</div>';
    return items.map(p => `<button type="button" class="quick-product" data-quick-add="${esc(p.id)}"><img src="${esc(p.imagen || NO_IMG)}" onerror="this.src=\'${NO_IMG}\'" alt=""><span><b>${esc(p.nombre)}</b><small>${esc(p.codigo)} · ${money(p.precio)} · Stock ${p.stock}</small></span><strong>+</strong></button>`).join('');
  }

  function itemPrice(product, qty){
    const promo = promoTotal(product.promos, qty);
    return promo !== null ? promo : n(product.precio) * qty;
  }
  function promoTotal(raw, qty){
    const rows = String(raw || '').split(/[|,;\n]+/).map(x => x.trim()).filter(Boolean);
    let exact = null;
    rows.forEach(row => {
      const m = row.match(/(\d+)\s*(?:=|:|por|-)?\s*(\d+(?:[.,]\d+)?)/);
      if (m && Number(m[1]) === Number(qty)) exact = Number(String(m[2]).replace(',','.'));
    });
    return exact;
  }

  function calcCart(cart = state.cart){
    if (!cart || !cart.length) return { subtotal:0, envio:0, comision:0, descuento:0, total:0, cost:0, profit:0 };
    const subtotal = cart.reduce((sum,it) => sum + itemPrice(it, n(it.qty) || 1), 0);
    const type = state.shippingType;
    let envio = 0;
    if (type === 'normal') envio = n(state.config.normalShipping);
    if (type === 'cod') envio = n(state.config.cashOnDeliveryShipping);
    if (type === 'local') envio = n(state.config.localShipping);
    const baseComision = subtotal + envio;
    const comision = type === 'cod' ? Math.round(baseComision * n(state.config.cashOnDeliveryCommission)) : 0;
    const descuento = Math.max(0, n(state.discount));
    const total = Math.max(0, subtotal + envio + comision - descuento);
    const cost = cart.reduce((sum,it) => sum + (n(it.costo) * (n(it.qty) || 1)), 0);
    return { subtotal, envio, comision, descuento, total, cost, profit: subtotal - cost };
  }

  function shippingTypeLabel(type = state.shippingType){
    if (type === 'cod') return 'Pagar al Recibir';
    if (type === 'local') return 'Entrega local';
    return 'Envío Normal';
  }

  function orderReadiness(doc = null){
    const customer = doc?.customer || state.customer || {};
    const items = doc?.items || state.cart || [];
    const totals = doc?.totals || calcCart(items);
    const checks = [
      { key:'items', label:'Productos', ok:items.length > 0, detail:items.length ? `${items.length} ítem${items.length===1?'':'s'}` : 'Agregue productos' },
      { key:'name', label:'Cliente', ok:Boolean(String(customer.nombre || '').trim()), detail:String(customer.nombre || '').trim() || 'Falta nombre' },
      { key:'phone', label:'Teléfono', ok:cleanPhone(customer.telefono).length >= 8, detail:customer.telefono || 'Falta teléfono' },
      { key:'dest', label:'Destino', ok:Boolean(String(customer.departamento || '').trim() && String(customer.municipio || '').trim()), detail:[customer.municipio, customer.departamento].filter(Boolean).join(', ') || 'Falta destino' },
      { key:'addr', label:'Dirección', ok:Boolean(shortAddress(customer)), detail:shortAddress(customer) || 'Falta dirección' },
      { key:'total', label:'Total', ok:n(totals.total) > 0, detail:money(totals.total) }
    ];
    const done = checks.filter(x => x.ok).length;
    const missing = checks.filter(x => !x.ok).map(x => x.label);
    return { ok:missing.length === 0, progress:Math.round((done / checks.length) * 100), missing, checks };
  }

  function readinessCard(ready = orderReadiness()){
    const title = ready.ok ? 'Pedido listo para enviar' : 'Revise antes de enviar';
    const subtitle = ready.ok ? 'La cotización ya tiene los datos principales para WhatsApp o factura.' : `Falta completar: ${ready.missing.join(', ')}`;
    return `<div class="order-readiness ${ready.ok ? 'is-ready' : 'is-pending'} no-print">
      <div class="readiness-top">
        <div><span>${ready.ok ? '✓ Control de calidad' : '⚠ Control de calidad'}</span><b>${esc(title)}</b><small>${esc(subtitle)}</small></div>
        <strong>${ready.progress}%</strong>
      </div>
      <div class="readiness-meter"><i style="width:${ready.progress}%"></i></div>
      <div class="readiness-list">${ready.checks.map(x => `<div class="readiness-pill ${x.ok ? 'ok' : 'pending'}"><em>${x.ok ? '✓' : '•'}</em><span><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></span></div>`).join('')}</div>
    </div>`;
  }

  function shortAddress(customer = state.customer){
    return [customer.direccion, customer.referencia].filter(Boolean).join(' · ');
  }

  function dashboardStats(){
    const active = state.products.filter(p => p.activo);
    const stock = active.reduce((a,p) => a + n(p.stock), 0);
    const value = active.reduce((a,p) => a + n(p.precio) * n(p.stock), 0);
    const invested = active.reduce((a,p) => a + n(p.costo) * n(p.stock), 0);
    const realProfit = state.invoices.filter(x => isSaleStatus(x.status)).reduce((a,x) => a + n(x.totals?.profit), 0);
    const out = active.filter(p => n(p.stock) <= 0).length;
    const low = active.filter(p => n(p.stock) > 0 && n(p.stock) <= n(state.config.lowStockLimit)).length;
    return { total:active.length, stock, value, invested, projected:value - invested, realProfit, out, low };
  }

  function render(){
    applyMode();
    app.className = 'app';
    app.innerHTML = `${topbar()}${nav()}${sectionDashboard()}${sectionProducts()}${sectionPos()}${sectionInvoices()}${sectionClients()}${sectionConfig()}`;
    bind();
  }

  function topbar(){
    return `<header class="topbar no-print">
      <div class="brand-card">
        <img class="logo" src="${LOGO}" alt="SD COMAYAGUA">
        <div class="brand-title"><b>${esc(state.config.storeName)}</b><span>${esc(state.config.storeFullName)}</span></div>
      </div>
      <div class="top-actions">
        <button class="icon-btn" data-action="sync" title="Sincronizar con Sheets">↻</button>
      </div>
    </header>`;
  }
  function nav(){
    const items = [
      ['dashboard','⌂','Inicio'], ['products','▦','Productos'], ['pos','🛒','POS'],
      ['invoices','▤','Facturas'], ['clients','☑','Envíos'], ['config','⚙','Ajustes']
    ];
    return `<nav class="nav no-print">${items.map(([id,ico,label]) => `<button class="${state.view===id?'active':''}" data-view="${id}"><i>${ico}</i><span>${label}</span></button>`).join('')}</nav>`;
  }
  function activateClass(view){ return state.view === view ? 'active' : ''; }

  function isSaleStatus(status){
    return ['venta','factura'].includes(String(status || '').toLowerCase());
  }
  function sectionDashboard(){
    const s = dashboardStats();
    return `<section class="section ${activateClass('dashboard')}" id="dashboard">
      <div class="hero hero-clean">
        <span class="hero-badge"><i class="dot"></i> Panel privado SDC</span>
        <h1>POS móvil</h1>
        <p>Venta rápida, inventario y factura limpia para enviar por WhatsApp.</p>
        <div class="hero-actions">
          <button class="btn" data-view="pos">Nueva cotización</button>
          <button class="btn secondary" data-view="products">Ver inventario</button>
        </div>
      </div>
      <div class="mobile-command-center no-print">
        <button class="command-card primary" data-view="pos"><span>Vender ahora</span><b>Nueva cotización</b><small>Total, envío y WhatsApp</small></button>
        <button class="command-card" data-view="products"><span>Inventario</span><b>${s.total} productos</b><small>${s.low} bajo stock · ${s.out} agotados</small></button>
        <button class="command-card" data-view="invoices"><span>Historial</span><b>${state.invoices.length} registros</b><small>Editar, imagen o WhatsApp</small></button>
      </div>
      <div class="kpi-grid">
        ${kpi('Productos activos', s.total, 'Artículos visibles')}
        ${kpi('Stock total', s.stock, 'Unidades disponibles')}
        ${kpi('Valor de venta', money(s.value), 'Precio × stock')}
        ${kpi('Invertido', money(s.invested), 'Costo × stock')}
        ${kpi('Ganancia proyectada', money(s.projected), 'Venta - inversión', 'good')}
        ${kpi('Ganancia real', money(s.realProfit), 'Ventas guardadas', 'good')}
        ${kpi('Agotados', s.out, 'Necesitan reposición', s.out ? 'danger' : '')}
        ${kpi('Bajo stock', s.low, `Límite: ${state.config.lowStockLimit}`, s.low ? 'warn' : '')}
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2>Acciones rápidas</h2><p>Accesos pensados para vender rápido sin saturar la parte superior del inventario.</p></div></div>
        <div class="button-row">
          <button class="btn" data-view="pos">Nueva venta / cotización</button>
          <button class="btn secondary" data-action="new-product-draft">Agregar producto</button>
          <button class="btn secondary" data-view="invoices">Historial</button>
          <button class="btn ghost" data-action="sync">Sincronizar Sheets</button>
        </div>
      </div>
    </section>`;
  }
  function kpi(label, value, sub, cls=''){ return `<div class="kpi ${cls}"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(sub)}</small></div>`; }

  function productLoadCard(){
    const src = productSourceLabel();
    const cls = src.status === 'synced' ? 'ok' : src.status === 'error' ? 'warn' : src.status === 'loading' ? 'loading' : 'local';
    return `<div class="product-load-card ${cls} no-print">
      <div><span>${esc(src.label)}</span><b>${esc(src.count)} productos disponibles</b><small>${esc(src.message)}</small></div>
      <div class="product-load-actions">
        <button class="btn small secondary" data-action="force-sync-products">Cargar Sheets</button>
        <button class="btn small ghost" data-action="load-demo-products">Usar demo</button>
      </div>
    </div>`;
  }

  function sectionProducts(){
    const list = filteredProducts();
    return `<section class="section ${activateClass('products')}" id="products">
      ${productDraftForm()}
      <div class="panel">
        <div class="panel-head">
          <div><h2>Inventario móvil</h2><p>Tarjetas limpias para celular, con precio, stock y acciones rápidas sin saturar la pantalla.</p></div>
          <div class="product-view-tools no-print">
            <div class="view-toggle" aria-label="Vista de productos">
              <button class="${state.productViewMode === 'one' ? 'active' : ''}" data-grid-mode="one" type="button">1 por fila</button>
              <button class="${state.productViewMode !== 'one' ? 'active' : ''}" data-grid-mode="two" type="button">2 por fila</button>
            </div>
            <button class="btn small" data-action="toggle-product-form">${state.showProductForm ? 'Cerrar editor' : 'Agregar producto'}</button>
          </div>
        </div>
        ${productLoadCard()}
        <div class="inventory-mobile-summary no-print">
          <span>${list.length} visibles</span><span>${state.products.filter(p=>p.activo && n(p.stock)>0).length} disponibles</span><span>${state.products.filter(p=>p.activo && n(p.stock)<=n(state.config.lowStockLimit)).length} revisar</span>
        </div>
        <div class="search-line">
          <input class="input" id="searchProduct" placeholder="Buscar producto, código, marca o categoría..." value="${esc(state.filter.q)}">
          <select class="select" id="filterCategory">${categories().map(c => `<option ${state.filter.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
          <select class="select" id="filterStatus">${['Todos','Disponible','Bajo stock','Agotado'].map(c => `<option ${state.filter.status===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
        </div>
        <div class="chips no-scrollbar">${categories().map(c => `<button class="chip ${state.filter.category===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <div class="product-grid product-grid-${state.productViewMode === 'one' ? 'one' : 'two'}">${list.length ? list.map(productCard).join('') : '<div class="empty">No hay productos con ese filtro.</div>'}</div>
      </div>
    </section>`;
  }
  function productDraftForm(){
    if (!state.showProductForm) return '';
    const d = state.productDraft || emptyProductDraft();
    const cats = categories().filter(c => c !== 'Todos');
    const title = d.id ? 'Editar producto' : 'Agregar producto';
    return `<div class="product-editor">
      <div class="panel-head"><div><h2>${title}</h2><p>Puede pegar un link o subir una imagen desde el celular. Si Apps Script está conectado, se sube a Drive y queda el link guardado.</p></div></div>
      <div class="editor-grid">
        <div>
          <div class="image-upload-box">
            <img src="${esc(d.imagen || NO_IMG)}" alt="Vista previa" onerror="this.src='${NO_IMG}'">
          </div>
          <label class="upload-btn"><input id="prodFile" type="file" accept="image/*">Subir imagen</label>
          <p class="muted small-note">Recomendado: foto cuadrada o bien centrada. La app la optimiza antes de guardarla.</p>
        </div>
        <div class="row two">
          ${draftField('Código','draftCodigo',d.codigo)}
          ${draftField('Nombre','draftNombre',d.nombre)}
          <label class="field"><span>Categoría</span><input class="input" id="draftCategoria" list="catList" value="${esc(d.categoria)}"><datalist id="catList">${cats.map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist></label>
          ${draftField('Marca','draftMarca',d.marca)}
          ${draftField('Precio venta Lps.','draftPrecio',d.precio,'number')}
          ${draftField('Costo compra Lps.','draftCosto',d.costo,'number')}
          ${draftField('Stock','draftStock',d.stock,'number')}
          <label class="field"><span>Activo</span><select class="select" id="draftActivo"><option value="true" ${d.activo!==false?'selected':''}>Sí, mostrar</option><option value="false" ${d.activo===false?'selected':''}>No, ocultar</option></select></label>
          <label class="field" style="grid-column:1/-1"><span>Imagen / link</span><input class="input" id="draftImagen" value="${esc(d.imagen)}" placeholder="https://... o se llena al subir imagen"></label>
          <label class="field" style="grid-column:1/-1"><span>Promos opcional</span><input class="input" id="draftPromos" value="${esc(d.promos)}" placeholder="1=25 | 2=50 | 3=69"></label>
          <label class="field" style="grid-column:1/-1"><span>Descripción</span><textarea class="textarea" id="draftDescripcion">${esc(d.descripcion)}</textarea></label>
        </div>
      </div>
      <div class="button-row" style="margin-top:12px">
        <button class="btn" data-action="save-product">Guardar producto</button>
        <button class="btn secondary" data-action="new-product-draft">Limpiar editor</button>
        <button class="btn ghost" data-action="toggle-product-form">Cerrar</button>
      </div>
    </div>`;
  }
  function draftField(label,id,value,type='text'){ return `<label class="field"><span>${esc(label)}</span><input class="input" id="${id}" type="${type}" value="${esc(value)}"></label>`; }
  function productCard(p){
    const img = p.imagen || NO_IMG;
    const stock = n(p.stock);
    const stockLabel = stock <= 0 ? 'Agotado' : stock <= n(state.config.lowStockLimit) ? `Bajo stock · ${stock}` : `Disponible · ${stock}`;
    const stockClass = stock <= 0 ? 'out' : stock <= n(state.config.lowStockLimit) ? 'low' : 'ok';
    const version = p.version || p.variante || p.marca || '';
    return `<article class="product-card product-card-v5 ${stock<=0?'is-out':''}">
      <button class="product-img-btn product-photo-square" data-open-img="${esc(img)}" title="Ver foto completa">
        <img crossorigin="anonymous" src="${esc(img)}" alt="${esc(p.nombre)}" onerror="this.src='${NO_IMG}'">
      </button>
      <div class="product-info-v5">
        <div class="product-topline"><span class="product-code-pill">${esc(p.codigo)}</span><span class="stock-pill ${stockClass}">${esc(stockLabel)}</span></div>
        <h3 class="product-title-v5">${esc(p.nombre)}</h3>
        <div class="product-meta-clean">
          <span>${esc(p.categoria || 'General')}</span>${version ? `<span>${esc(version)}</span>` : ''}
        </div>
        <div class="product-price-line"><span>Precio</span><b>${money(p.precio)}</b></div>
        <div class="product-actions-v5">
          <button class="btn small" data-add="${esc(p.id)}" ${stock<=0?'disabled':''}>Vender</button>
          <button class="btn small secondary" data-edit-product="${esc(p.id)}">Editar</button>
        </div>
      </div>
    </article>`;
  }


  function sectionPos(){
    const c = calcCart();
    const ready = orderReadiness();
    return `<section class="section pos-section ${activateClass('pos')}" id="pos">
      <div class="panel">
        <div class="panel-head pos-head"><div><h2>POS móvil</h2></div><span class="tag">${state.cart.length} ítem${state.cart.length===1?'':'s'}</span></div>
        <div class="pos-mobile-dock no-print">
          <div><span>Total final</span><b>${money(c.total)}</b><small>${ready.ok ? 'Listo para enviar' : 'Falta: ' + ready.missing.slice(0,2).join(', ')}</small></div>
          <button class="btn small" data-action="open-wa">WhatsApp</button>
        </div>
        <div class="pos-layout">
          <div class="panel subpanel" style="margin:0">
            <div class="panel-head compact-head"><div><h2>1. Agregar productos</h2></div></div>
            <div class="quick-picker">
              <input class="input" id="quickProductSearch" placeholder="Buscar producto para agregar…" value="${esc(state.productPickQ || '')}" autocomplete="off">
              <div class="quick-product-results no-scrollbar" id="quickProductResults">${quickProductResults()}</div>
            </div>
            <div class="cart-list" style="margin-top:12px">${state.cart.length ? state.cart.map(cartItem).join('') : '<div class="empty">El carrito está vacío.</div>'}</div>
          </div>
          <div class="panel subpanel" style="margin:0">
            <div class="panel-head compact-head"><div><h2>2. Cliente, envío y total</h2></div></div>
            ${customerForm()}
            <div class="summary" style="margin-top:14px">
              <div class="summary-row"><b>Total productos</b><b>${money(c.subtotal)}</b></div>
              <div class="summary-row"><b>Envío</b><b>${money(c.envio)}</b></div>
              <div class="summary-row"><b>Comisión Pagar al Recibir</b><b>${money(c.comision)}</b></div>
              <div class="summary-row"><b>Descuento</b><b>${money(c.descuento)}</b></div>
              <div class="summary-total"><b>Total final</b><b>${money(c.total)}</b></div>
            </div>
            ${readinessCard(ready)}
            <div class="button-row" style="margin-top:14px">
              <button class="btn secondary" data-action="save-quote">Guardar cotización</button>
              <button class="btn" data-action="finish-invoice">Guardar venta</button>
            </div>
            <div class="button-row" style="margin-top:9px">
              <button class="btn ghost" data-action="copy-wa">Copiar WhatsApp</button>
              <button class="btn ghost" data-action="open-wa">Abrir WhatsApp</button>
            </div>
          </div>
          <div class="receipt-side print-target">${receiptThemeControls()}${receiptPreview()}</div>
        </div>
        <div class="button-row no-print" style="margin-top:12px">
          <button class="btn secondary" data-action="print-receipt">Imprimir / PDF</button>
          <button class="btn secondary" data-action="download-image">Imagen HD</button>
          <button class="btn secondary" data-action="share-image">Compartir imagen</button>
          <button class="btn danger" data-action="clear-cart">Limpiar carrito</button>
        </div>
      </div>
    </section>`;
  }
  function customerForm(){
    ensureCustomerLocation();
    const deps = departmentOptions();
    const munis = municipalityOptions(state.customer.departamento);
    return `<div class="row two">
      ${field('Nombre del cliente','custNombre',state.customer.nombre,'text')}
      ${field('Teléfono','custTelefono',state.customer.telefono,'tel')}
      <label class="field"><span>Departamento</span><select class="select" id="custDepartamento">${deps.map(d => `<option value="${esc(d)}" ${state.customer.departamento===d?'selected':''}>${esc(d)}</option>`).join('')}</select></label>
      <label class="field"><span>Municipio</span><select class="select" id="custMunicipio">${munis.map(m => `<option value="${esc(m)}" ${state.customer.municipio===m?'selected':''}>${esc(m)}</option>`).join('')}</select></label>
      <label class="field"><span>Tipo de envío</span><select class="select" id="shippingType">
        <option value="normal" ${state.shippingType==='normal'?'selected':''}>Envío Normal · ${money(state.config.normalShipping)}</option>
        <option value="cod" ${state.shippingType==='cod'?'selected':''}>Pagar al Recibir · envío ${money(state.config.cashOnDeliveryShipping)} + comisión</option>
        <option value="local" ${state.shippingType==='local'?'selected':''}>Entrega local · ${money(state.config.localShipping)}</option>
      </select></label>
      <label class="field"><span>Descuento Lps.</span><input class="input" id="discount" type="number" inputmode="numeric" value="${esc(state.discount)}"></label>
      <label class="field" style="grid-column:1/-1"><span>Dirección</span><textarea class="textarea" id="custDireccion">${esc(state.customer.direccion)}</textarea></label>
      <label class="field" style="grid-column:1/-1"><span>Referencia / notas</span><textarea class="textarea" id="custReferencia">${esc(state.customer.referencia)}</textarea></label>
    </div>`;
  }
  function field(label,id,value,type='text'){ return `<label class="field"><span>${esc(label)}</span><input class="input" id="${id}" type="${type}" value="${esc(value)}"></label>`; }
  function configStatusCard(){
    const url = String(state.config.appsScriptUrl || '').trim();
    const isReady = /^https:\/\/script\.google\.com\/macros\/s\//.test(url);
    const clean = url ? url.replace(/^https?:\/\//,'').replace(/\?.*$/,'') : 'No hay URL guardada';
    const msg = isReady ? 'Configuración oficial cargada y guardada en este dispositivo.' : 'La app debe traer los datos oficiales llenos. Use Restaurar datos SD si ve campos vacíos.';
    return `<div class="config-status ${isReady ? 'ok' : 'pending'}">
      <div><span>${isReady ? '✓ Conexión configurada' : '• Configuración pendiente'}</span><b>${esc(clean)}</b><small>${esc(msg)}</small></div>
      <strong>${isReady ? 'Guardado' : 'Falta URL'}</strong>
    </div>`;
  }
  function cartItem(it, i){
    return `<div class="cart-item">
      <div><b>${esc(it.nombre)}</b><span>${esc(it.codigo)} · ${money(it.precio)} c/u · Total ${money(itemPrice(it, it.qty))}</span></div>
      <div class="qty"><button data-dec="${i}" title="Restar">−</button><input data-qty="${i}" value="${it.qty}" inputmode="numeric"><button data-inc="${i}" title="Sumar">+</button><button data-remove="${i}" title="Quitar">×</button></div>
    </div>`;
  }
  function receiptThemeControls(){
    return '';
  }
  function receiptPreview(){
    const c = calcCart();
    const editingDoc = state.invoices.find(x => x.id === state.editingInvoiceId);
    const title = editingDoc ? (isSaleStatus(editingDoc.status) ? 'FACTURA' : 'COTIZACIÓN') : 'COTIZACIÓN';
    const code = editingDoc?.code || state.editingInvoiceId || 'PREVIA';
    const dest = [state.customer.municipio,state.customer.departamento].filter(Boolean).join(', ') || 'Pendiente';
    const address = shortAddress(state.customer) || 'Pendiente de confirmar';
    const productRows = state.cart.length ? state.cart.map((it, idx) => {
      const code = it.codigo || `PROD-${idx + 1}`;
      return `<div class="sdc-simple-row">
        <div class="sdc-simple-num">${idx + 1}</div>
        <div class="sdc-simple-product"><b>${esc(it.nombre)}</b><small>${esc(code)}</small></div>
        <div class="sdc-simple-qty">${it.qty}</div>
        <div class="sdc-simple-money">${money(it.precio)}</div>
        <div class="sdc-simple-money strong">${money(itemPrice(it,it.qty))}</div>
      </div>`;
    }).join('') : `<div class="sdc-simple-empty">Agregue productos para generar una cotización lista para WhatsApp.</div>`;
    const commissionRow = c.comision ? `<div><span>Comisión Pagar al Recibir</span><b>${money(c.comision)}</b></div>` : '';
    const discountRow = c.descuento ? `<div><span>Descuento</span><b>− ${money(c.descuento)}</b></div>` : '';
    return `<div class="invoice-preview sdc-receipt-v16 sdc-receipt-simple invoice-pro invoice-clean-v21" id="receiptCard">
      <header class="sdc-simple-header">
        <div class="sdc-simple-brand">
          <img src="${LOGO}" alt="SD COMAYAGUA">
          <div>
            <h3>SD COMAYAGUA</h3>
            <p>Soluciones Digitales Comayagua</p>
            <small>WhatsApp +504 3151-7755</small>
          </div>
        </div>
        <div class="sdc-simple-doc">
          <span>${esc(title)}</span>
          <b>${esc(code)}</b>
          <small>${today()}</small>
        </div>
      </header>

      <section class="sdc-simple-info-grid compact">
        <div><span>Cliente</span><b>${esc(state.customer.nombre || 'Cliente pendiente')}</b></div>
        <div><span>Teléfono</span><b>${esc(state.customer.telefono || 'Pendiente')}</b></div>
        <div><span>Destino</span><b>${esc(dest)}</b></div>
        <div><span>Envío</span><b>${esc(shippingTypeLabel())}</b></div>
        <div class="wide"><span>Dirección / referencia</span><b>${esc(address)}</b></div>
      </section>

      <section class="sdc-simple-products">
        <div class="sdc-simple-section-title"><span>Detalle</span><b>${state.cart.length} producto${state.cart.length===1?'':'s'}</b></div>
        <div class="sdc-simple-table">
          <div class="sdc-simple-row sdc-simple-head"><div>#</div><div>Producto</div><div>Cant.</div><div>Precio</div><div>Total</div></div>
          ${productRows}
        </div>
      </section>

      <section class="sdc-simple-summary clean-summary">
        <aside class="sdc-simple-notes">
          <b>Nota</b>
          <p>Precios sujetos a disponibilidad y confirmación de stock.</p>
          <p>Gracias por preferirnos. Conserve este comprobante.</p>
        </aside>
        <aside class="sdc-simple-totals">
          <div><span>Total productos</span><b>${money(c.subtotal)}</b></div>
          <div><span>Envío</span><b>${money(c.envio)}</b></div>
          ${commissionRow}
          ${discountRow}
          <div class="grand"><span>Total final</span><b>${money(c.total)}</b></div>
        </aside>
      </section>
    </div>`;
  }

  function sectionInvoices(){
    const list = [...state.invoices].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return `<section class="section ${activateClass('invoices')}" id="invoices">
      <div class="panel"><div class="panel-head"><div><h2>Ventas / Cotizaciones</h2><p>Guardado básico en localStorage y sincronización opcional con Sheets.</p></div><span class="tag">${list.length}</span></div>
      <div class="list">${list.length ? list.map(invoiceCard).join('') : '<div class="empty">Todavía no hay facturas o cotizaciones guardadas.</div>'}</div></div>
    </section>`;
  }
  function invoiceCard(x){
    const canConvert = !isSaleStatus(x.status);
    const statusClass = isSaleStatus(x.status) ? 'sale' : 'quote';
    return `<div class="list-card invoice-list-card"><div class="list-main"><div><b>${esc(x.code)} · ${esc(x.customer?.nombre || 'Cliente')}</b><span><em class="status-badge ${statusClass}">${esc(x.status)}</em> · ${new Date(x.createdAt).toLocaleString('es-HN')}</span><br><small>${(x.items||[]).map(i=>`${i.nombre} x${i.qty}`).join(' · ')}</small></div><div class="right"><b>${money(x.totals?.total)}</b><small>${esc(x.customer?.telefono || '')}</small></div></div><div class="button-row invoice-actions" style="margin-top:10px"><button class="btn small secondary" data-edit-invoice="${esc(x.id)}">Editar / imagen</button><button class="btn small ghost" data-wa-invoice="${esc(x.id)}">WhatsApp</button>${canConvert ? `<button class="btn small" data-convert-sale="${esc(x.id)}">Convertir a venta</button>` : ''}<button class="btn small danger" data-delete-invoice="${esc(x.id)}">Borrar</button></div></div>`;
  }
  function sectionClients(){
    const clients = buildClients();
    return `<section class="section ${activateClass('clients')}" id="clients">
      <div class="panel"><div class="panel-head"><div><h2>Clientes / Envíos</h2><p>Agenda básica generada desde cotizaciones y facturas.</p></div><span class="tag">${clients.length}</span></div>
      <div class="list">${clients.length ? clients.map(clientCard).join('') : '<div class="empty">Cuando guarde cotizaciones o facturas, aquí aparecerán los clientes.</div>'}</div></div>
    </section>`;
  }
  function buildClients(){
    const map = new Map();
    [...state.clients, ...state.invoices.map(x => ({ ...(x.customer||{}), ultimo_total:x.totals?.total, updatedAt:x.updatedAt || x.createdAt }))].forEach(c => {
      const key = cleanPhone(c.telefono) || String(c.nombre || '').toLowerCase();
      if (!key) return;
      map.set(key, { ...(map.get(key)||{}), ...c });
    });
    return [...map.values()].sort((a,b) => String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }
  function clientCard(c){
    return `<div class="list-card"><div class="list-main"><div><b>${esc(c.nombre || 'Cliente')}</b><span>${esc(c.telefono || 'Sin teléfono')}</span><br><small>${esc([c.municipio,c.departamento].filter(Boolean).join(', '))} · ${esc(c.direccion || '')}</small></div><div class="right"><b>${money(c.ultimo_total || 0)}</b><small>Último total</small></div></div></div>`;
  }

  function sectionConfig(){
    return `<section class="section ${activateClass('config')}" id="config">
      <div class="panel"><div class="panel-head"><div><h2>Ajustes</h2><p>Conexión con Google Sheets, WhatsApp y reglas de envío.</p></div></div>
        <div class="row two">
          ${field('URL Apps Script /exec','cfgUrl',state.config.appsScriptUrl)}
          ${field('API Key','cfgKey',state.config.apiKey)}
          ${field('WhatsApp sin +','cfgWhatsapp',state.config.whatsappNumber)}
          ${field('Límite bajo stock','cfgLow',state.config.lowStockLimit,'number')}
          ${field('Envío Normal Lps.','cfgNormal',state.config.normalShipping,'number')}
          ${field('Pagar al Recibir envío base Lps.','cfgCodShip',state.config.cashOnDeliveryShipping,'number')}
          ${field('Comisión Pagar al Recibir decimal','cfgCodCom',state.config.cashOnDeliveryCommission,'number')}
          ${field('Entrega local Lps.','cfgLocal',state.config.localShipping,'number')}
        </div>
        ${configStatusCard()}
        <div class="button-row" style="margin-top:14px">
          <button class="btn" data-action="save-config">Guardar configuración</button>
          <button class="btn secondary" data-action="sync">Probar y sincronizar</button>
          <button class="btn ghost" data-action="test-connection">Diagnóstico URL</button>
          <button class="btn ghost" data-action="restore-official-config">Restaurar datos SD</button>
          <button class="btn ghost" data-action="export-json">Exportar respaldo JSON</button>
          <button class="btn danger" data-action="reset-demo">Reiniciar datos locales</button>
        </div>
        <div class="panel" style="margin-bottom:0"><b>Hojas que usa esta versión</b><p class="muted">productos_pos, facturas_pos, ajustes_pos, clientes_envios, logs_pos y Dashboard_POS.</p></div>
      </div>
    </section>`;
  }

  function bind(){
    $$('[data-view]').forEach(b => b.onclick = () => { state.view = b.dataset.view; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); });
    $$('[data-action="sync"]').forEach(b => b.onclick = syncFromSheets);
    const search = $('#searchProduct'); if(search) search.oninput = e => { state.filter.q = e.target.value; save(); render(); $('#searchProduct')?.focus(); };
    const cat = $('#filterCategory'); if(cat) cat.onchange = e => { state.filter.category = e.target.value; save(); render(); };
    const st = $('#filterStatus'); if(st) st.onchange = e => { state.filter.status = e.target.value; save(); render(); };
    $$('[data-cat]').forEach(b => b.onclick = () => { state.filter.category = b.dataset.cat; save(); render(); });
    $$('[data-grid-mode]').forEach(b => b.onclick = () => { state.productViewMode = b.dataset.gridMode === 'one' ? 'one' : 'two'; save(); render(); });
    $$('[data-add]').forEach(b => b.onclick = () => { addToCart(b.dataset.add); state.view = 'pos'; save(); render(); toast('Producto agregado al POS.'); });
    const quickSearch = $('#quickProductSearch');
    const quickList = $('#quickProductResults');
    if (quickSearch) quickSearch.oninput = e => { state.productPickQ = e.target.value; save(); if (quickList) quickList.innerHTML = quickProductResults(); };
    if (quickList) quickList.onclick = e => { const b = e.target.closest('[data-quick-add]'); if(!b) return; addToCart(b.dataset.quickAdd); state.productPickQ = ''; save(); render(); toast('Producto agregado al carrito.'); };
    $$('[data-inc]').forEach(b => b.onclick = () => { state.cart[+b.dataset.inc].qty++; save(); render(); });
    $$('[data-dec]').forEach(b => b.onclick = () => { const it = state.cart[+b.dataset.dec]; it.qty = Math.max(1, n(it.qty)-1); save(); render(); });
    $$('[data-remove]').forEach(b => b.onclick = () => { state.cart.splice(+b.dataset.remove,1); save(); render(); });
    $$('[data-qty]').forEach(inp => inp.oninput = () => { state.cart[+inp.dataset.qty].qty = Math.max(1, n(inp.value)); save(); render(); });
    bindProductForm();
    bindCustomerInputs();
    bindConfigInputs();
    bindActions();
  }

  function bindCustomerInputs(){
    const textMap = { custNombre:'nombre', custTelefono:'telefono', custDireccion:'direccion', custReferencia:'referencia' };
    Object.entries(textMap).forEach(([id,key]) => { const el = $('#'+id); if(el) el.oninput = e => { state.customer[key] = e.target.value; save(); softRefreshReceipt(); }; });
    const dep = $('#custDepartamento'); if(dep) dep.onchange = e => { state.customer.departamento = e.target.value; state.customer.municipio = municipalityOptions(e.target.value)[0] || ''; save(); render(); };
    const muni = $('#custMunicipio'); if(muni) muni.onchange = e => { state.customer.municipio = e.target.value; save(); softRefreshReceipt(); };
    const ship = $('#shippingType'); if(ship) ship.onchange = e => { state.shippingType = e.target.value; save(); render(); };
    const discount = $('#discount'); if(discount) discount.oninput = e => { state.discount = n(e.target.value); save(); render(); };
  }
  function bindConfigInputs(){
    const ids = ['cfgUrl','cfgKey','cfgWhatsapp','cfgLow','cfgNormal','cfgCodShip','cfgCodCom','cfgLocal'];
    let timer;
    ids.forEach(id => {
      const el = $('#'+id);
      if(!el) return;
      const handler = () => {
        saveConfig({ silent:true, rerender:false });
        clearTimeout(timer);
        timer = setTimeout(() => {
          const status = $('.config-status');
          if (status) status.outerHTML = configStatusCard();
        }, 160);
      };
      el.oninput = handler;
      el.onchange = handler;
      el.onblur = () => saveConfig({ silent:false, rerender:false });
    });
  }
  function bindProductForm(){
    if (!state.showProductForm) return;
    const map = {
      draftCodigo:'codigo', draftNombre:'nombre', draftCategoria:'categoria', draftMarca:'marca', draftPrecio:'precio', draftCosto:'costo', draftStock:'stock', draftImagen:'imagen', draftPromos:'promos', draftDescripcion:'descripcion'
    };
    Object.entries(map).forEach(([id,key]) => { const el = $('#'+id); if(el) el.oninput = e => { state.productDraft[key] = e.target.value; save(); }; });
    const activo = $('#draftActivo'); if(activo) activo.onchange = e => { state.productDraft.activo = e.target.value === 'true'; save(); };
    const file = $('#prodFile'); if(file) file.onchange = handleProductImageFile;
  }
  function softRefreshReceipt(){ const target = $('#receiptCard'); if(target) target.outerHTML = receiptPreview(); }
  function bindActions(){
    const action = (name, fn) => $$(`[data-action="${name}"]`).forEach(b => b.onclick = fn);
    action('save-config', saveConfig);
    action('restore-official-config', restoreOfficialConfig);
    action('test-connection', testConnection);
    action('save-quote', () => saveDocument('Cotización'));
    action('finish-invoice', () => saveDocument('Venta'));
    action('copy-wa', async () => { await navigator.clipboard?.writeText(whatsappText()); toast('Mensaje copiado para WhatsApp.'); });
    action('open-wa', () => openWhatsApp(whatsappText()));
    action('print-receipt', () => window.print());
    action('download-image', downloadReceiptImage);
    action('share-image', shareReceiptImage);
    action('clear-cart', () => { state.cart=[]; state.discount=0; state.editingInvoiceId=''; save(); render(); toast('Carrito limpio.'); });
    action('toggle-product-form', () => { state.showProductForm = !state.showProductForm; if(state.showProductForm && !state.productDraft) state.productDraft = emptyProductDraft(); save(); render(); });
    action('new-product-draft', () => { state.productDraft = emptyProductDraft(); state.showProductForm = true; save(); render(); });
    action('force-sync-products', () => { bootSyncDone = false; bootProducts(); });
    action('load-demo-products', () => { state.products = demoProducts(); state.filter = { q:'', category:'Todos', status:'Todos' }; setProductLoad('demo', 'Productos demo/locales cargados correctamente.'); save(); render(); toast('Productos demo cargados.'); });
    action('save-product', saveProduct);
    $$('[data-open-img]').forEach(b => b.onclick = () => openProductImage(b.dataset.openImg));
    $$('[data-edit-product]').forEach(b => b.onclick = () => editProduct(b.dataset.editProduct));
    action('export-json', exportJSON);
    action('reset-demo', () => { if(confirm('¿Reiniciar datos locales de esta app?')){ const savedCfg = readStoredConfig(); localStorage.removeItem(LS); state=defaultState(); state.config = mergeConfigLayers(savedCfg); state.products = demoProducts(); setProductLoad('demo','Datos reiniciados. Productos demo/locales listos.'); window.SDC_CONFIG = { ...(window.SDC_CONFIG || {}), ...state.config }; save(); render(); toast('Datos locales reiniciados. La configuración oficial se conservó.'); }});
    $$('[data-edit-invoice]').forEach(b => b.onclick = () => editInvoice(b.dataset.editInvoice));
    $$('[data-delete-invoice]').forEach(b => b.onclick = () => deleteInvoice(b.dataset.deleteInvoice));
    $$('[data-convert-sale]').forEach(b => b.onclick = () => convertToSale(b.dataset.convertSale));
    $$('[data-wa-invoice]').forEach(b => b.onclick = () => { const inv = state.invoices.find(x => x.id === b.dataset.waInvoice); if(inv) openWhatsApp(whatsappText(inv)); });
  }

  function addToCart(id){
    const p = state.products.find(x => x.id === id);
    if (!p || p.stock <= 0) return toast('Producto no disponible.');
    const existing = state.cart.find(x => x.id === p.id);
    if (existing) existing.qty += 1;
    else state.cart.push({ ...p, qty:1 });
  }
  function openProductImage(src){
    if (!src || src === NO_IMG) return toast('Este producto no tiene imagen cargada.');
    const w = window.open('', '_blank');
    if (!w) return toast('El navegador bloqueó la vista de imagen.');
    w.document.write(`<title>Foto producto</title><body style="margin:0;background:#061325;display:grid;place-items:center;min-height:100vh"><img src="${esc(src)}" style="max-width:100%;max-height:100vh;object-fit:contain;background:#fff"></body>`);
  }
  function editProduct(id){
    const p = state.products.find(x => x.id === id); if(!p) return;
    state.productDraft = { ...emptyProductDraft(), ...p };
    state.showProductForm = true;
    state.view = 'products';
    save(); render();
    setTimeout(() => $('.product-editor')?.scrollIntoView({behavior:'smooth', block:'start'}), 80);
  }
  async function saveProduct(){
    readProductDraftFromForm();
    const d = { ...emptyProductDraft(), ...state.productDraft };
    if (!String(d.nombre || '').trim()) return toast('Escriba el nombre del producto.');
    const product = normalizeProduct({
      ...d,
      id:d.id || `prod-sdc-${Date.now()}`,
      codigo:d.codigo || `SDC-${String(state.products.length + 1).padStart(3,'0')}`,
      precio:n(d.precio), costo:n(d.costo), stock:n(d.stock), activo:d.activo !== false && String(d.activo) !== 'false'
    }, state.products.length);
    const ix = state.products.findIndex(x => x.id === product.id);
    if (ix >= 0) state.products[ix] = product; else state.products.unshift(product);
    state.productDraft = emptyProductDraft();
    state.showProductForm = false;
    save(); render(); toast('Producto guardado.');
    if (SDCApi.ready()) {
      try { await SDCApi.post('upsertProduct', { product:toSheetProduct(product) }); toast('Producto guardado y sincronizado.'); }
      catch(e){ console.error(e); toast('Producto local guardado. No se pudo sincronizar Sheets.'); }
    }
  }
  function readProductDraftFromForm(){
    if (!state.productDraft) state.productDraft = emptyProductDraft();
    const map = { draftCodigo:'codigo', draftNombre:'nombre', draftCategoria:'categoria', draftMarca:'marca', draftPrecio:'precio', draftCosto:'costo', draftStock:'stock', draftImagen:'imagen', draftPromos:'promos', draftDescripcion:'descripcion' };
    Object.entries(map).forEach(([id,key]) => { const el = $('#'+id); if(el) state.productDraft[key] = el.value; });
    const activo = $('#draftActivo'); if(activo) state.productDraft.activo = activo.value === 'true';
  }
  function toSheetProduct(p){
    return { id:p.id, codigo:p.codigo, nombre:p.nombre, categoria:p.categoria, marca:p.marca, precio:p.precio, costo:p.costo, stock:p.stock, descripcion:p.descripcion, imagen:p.imagen, activo:p.activo, promos:p.promos, notas:p.notas || '' };
  }
  async function handleProductImageFile(e){
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try{
      toast('Procesando imagen...');
      const dataUrl = await optimizeImage(file);
      let imageValue = dataUrl;
      if (SDCApi.ready()) {
        try{
          const data = await SDCApi.post('uploadImage', { fileName:file.name || `producto-${Date.now()}.jpg`, mimeType:'image/jpeg', data:dataUrl.split(',')[1] });
          if (data.url) imageValue = data.url;
        }catch(err){ console.warn(err); toast('No se pudo subir a Drive. Quedará guardada localmente.'); }
      }
      state.productDraft.imagen = imageValue;
      save(); render(); toast(SDCApi.ready() && /^https?:/.test(imageValue) ? 'Imagen subida a Drive.' : 'Imagen agregada localmente.');
    }catch(err){ console.error(err); toast('No se pudo leer la imagen.'); }
  }
  function optimizeImage(file){
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const size = 1200;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,size,size);
          const scale = Math.min(size / img.width, size / img.height);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, Math.round((size-w)/2), Math.round((size-h)/2), w, h);
          resolve(canvas.toDataURL('image/jpeg', .88));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function snapshot(status){
    const totals = calcCart();
    const id = state.editingInvoiceId || uid(isSaleStatus(status) ? 'VEN' : 'COT');
    return {
      id,
      code:id,
      status,
      createdAt: state.invoices.find(x => x.id === id)?.createdAt || iso(),
      updatedAt: iso(),
      customer:{ ...state.customer },
      shippingType:state.shippingType,
      items: state.cart.map(x => ({ id:x.id, codigo:x.codigo, nombre:x.nombre, categoria:x.categoria || '', marca:x.marca || '', precio:n(x.precio), costo:n(x.costo), qty:n(x.qty)||1, imagen:x.imagen || '', promos:x.promos || '' })),
      totals
    };
  }
  function applyStockDelta(previous, doc){
    const oldItems = isSaleStatus(previous?.status) ? (previous.items || []) : [];
    const oldMap = new Map(oldItems.map(it => [it.id, n(it.qty)]));
    const newItems = isSaleStatus(doc?.status) ? (doc.items || []) : [];
    const newMap = new Map(newItems.map(it => [it.id, n(it.qty)]));
    const ids = new Set([...oldMap.keys(), ...newMap.keys()]);
    ids.forEach(id => {
      const delta = (newMap.get(id) || 0) - (oldMap.get(id) || 0);
      if (!delta) return;
      const p = state.products.find(x => x.id === id);
      if (p) p.stock = Math.max(0, n(p.stock) - delta);
    });
    state.products = state.products.map(normalizeProduct);
  }
  function stockShortage(previous, doc){
    if (!isSaleStatus(doc?.status)) return '';
    const oldItems = isSaleStatus(previous?.status) ? (previous.items || []) : [];
    const oldMap = new Map(oldItems.map(it => [it.id, n(it.qty)]));
    const newMap = new Map((doc.items || []).map(it => [it.id, n(it.qty)]));
    for (const [id, newQty] of newMap.entries()) {
      const extraNeeded = newQty - (oldMap.get(id) || 0);
      if (extraNeeded <= 0) continue;
      const p = state.products.find(x => x.id === id);
      if (p && extraNeeded > n(p.stock)) return `${p.nombre}: pide ${extraNeeded} más y solo hay ${n(p.stock)} disponibles.`;
    }
    return '';
  }
  async function saveDocument(status){
    if (!state.cart.length) return toast('Agregue productos primero.');
    const doc = snapshot(status);
    const previous = state.invoices.find(x => x.id === doc.id);
    const shortage = stockShortage(previous, doc);
    if (shortage) return toast('Stock insuficiente. ' + shortage);
    const ix = state.invoices.findIndex(x => x.id === doc.id);
    if (ix >= 0) state.invoices[ix] = doc; else state.invoices.unshift(doc);
    saveClient(doc);
    applyStockDelta(previous, doc);

    state.editingInvoiceId = doc.id;
    save(); render(); toast(isSaleStatus(status) ? 'Venta guardada y stock descontado.' : 'Cotización guardada.');
    if (SDCApi.ready()) {
      try { await SDCApi.post('saveInvoice', { invoice: toSheetInvoice(doc) }); } catch(e){ toast('Guardado local listo. Sheets no respondió.'); }
    }
  }
  async function convertToSale(id){
    const previous = state.invoices.find(x => x.id === id);
    if (!previous) return toast('No encontré esa cotización.');
    if (isSaleStatus(previous.status)) return toast('Este registro ya está como venta.');
    const doc = { ...previous, status:'Venta', updatedAt:iso(), totals:{ ...previous.totals } };
    const shortage = stockShortage(previous, doc);
    if (shortage) return toast('Stock insuficiente. ' + shortage);
    const ix = state.invoices.findIndex(x => x.id === id);
    if (ix >= 0) state.invoices[ix] = doc;
    applyStockDelta(previous, doc);
    saveClient(doc);
    save(); render(); toast('Cotización pasada a venta. Stock descontado.');
    if (SDCApi.ready()) {
      try { await SDCApi.post('saveInvoice', { invoice: toSheetInvoice(doc) }); } catch(e){ toast('Venta local lista. Sheets no respondió.'); }
    }
  }

  function saveClient(doc){
    const key = cleanPhone(doc.customer.telefono) || doc.customer.nombre.toLowerCase();
    if (!key) return;
    const client = { id:key, createdAt:iso(), updatedAt:iso(), ...doc.customer, ultimo_total:doc.totals.total };
    const ix = state.clients.findIndex(x => x.id === key);
    if (ix >= 0) state.clients[ix] = { ...state.clients[ix], ...client }; else state.clients.unshift(client);
  }
  function toSheetInvoice(doc){
    return {
      id:doc.id, code:doc.code, createdAt:doc.createdAt, updatedAt:doc.updatedAt, status:doc.status,
      cliente:doc.customer.nombre, telefono:doc.customer.telefono, departamento:doc.customer.departamento, municipio:doc.customer.municipio, direccion:doc.customer.direccion,
      tipo_envio:doc.shippingType, items_json:JSON.stringify(doc.items), totals_json:JSON.stringify(doc.totals), subtotal:doc.totals.subtotal,
      envio:doc.totals.envio, comision:doc.totals.comision, descuento:doc.totals.descuento, total:doc.totals.total
    };
  }
  function editInvoice(id){
    const x = state.invoices.find(v => v.id === id); if(!x) return;
    state.cart = (x.items || []).map(it => normalizeProduct({ ...it, stock:999, precio:it.precio, costo:it.costo, nombre:it.nombre, codigo:it.codigo, imagen:it.imagen })).map(it => ({...it, qty:(x.items.find(k=>k.id===it.id)?.qty || 1)}));
    state.customer = { ...state.customer, ...(x.customer || {}) };
    state.shippingType = x.shippingType || 'normal';
    state.discount = x.totals?.descuento || 0;
    state.editingInvoiceId = x.id;
    state.view = 'pos';
    save(); render(); toast('Registro cargado para editar o generar imagen.');
  }
  function deleteInvoice(id){
    const doc = state.invoices.find(x => x.id === id);
    if(!doc) return;
    const msg = isSaleStatus(doc.status) ? '¿Borrar esta venta y devolver el stock local?' : '¿Borrar este registro local?';
    if(!confirm(msg)) return;
    if (isSaleStatus(doc.status)) applyStockDelta(doc, null);
    state.invoices = state.invoices.filter(x => x.id !== id);
    save(); render(); toast(isSaleStatus(doc.status) ? 'Venta borrada y stock devuelto localmente.' : 'Registro borrado localmente.');
  }

  function whatsappText(doc = snapshot('Cotización')){
    const c = doc.totals || calcCart(doc.items || []);
    const typeLabel = shippingTypeLabel(doc.shippingType);
    const lines = [
      `Hola 😊 Le compartimos su ${isSaleStatus(doc.status) ? 'factura' : 'cotización'} de SD COMAYAGUA.`,
      '',
      `Código: ${doc.code}`,
      `Cliente: ${doc.customer?.nombre || 'Pendiente'}`,
      `Teléfono: ${doc.customer?.telefono || 'Pendiente'}`,
      `Destino: ${[doc.customer?.municipio, doc.customer?.departamento].filter(Boolean).join(', ') || 'Pendiente'}`,
      `Dirección: ${shortAddress(doc.customer || {}) || 'Pendiente'}`,
      '',
      'Productos:'
    ];
    (doc.items || state.cart).forEach(it => lines.push(`• ${it.nombre} x${it.qty}: ${money(itemPrice(it, it.qty))}`));
    lines.push('', `Total productos: ${money(c.subtotal)}`, `Envío (${typeLabel}): ${money(c.envio)}`);
    if (c.comision) lines.push(`Comisión por Pagar al Recibir: ${money(c.comision)}`);
    if (c.descuento) lines.push(`Descuento: -${money(c.descuento)}`);
    lines.push(`TOTAL FINAL: ${money(c.total)}`, '', 'Gracias por preferir SD COMAYAGUA. Quedamos atentos para confirmar disponibilidad y datos de envío.');
    return lines.join('\n');
  }
  function openWhatsApp(text){
    const phone = cleanPhone(state.customer.telefono) || cleanPhone(state.config.whatsappNumber);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  async function receiptBlob(){
    const source = $('#receiptCard');
    if (!source) throw new Error('No hay factura visible.');
    if (!window.html2canvas) throw new Error('html2canvas no cargó.');
    const bg = '#ffffff';
    const host = document.createElement('div');
    host.id = 'receiptExportHost';
    host.style.cssText = 'position:fixed;left:-18000px;top:0;width:1280px;padding:0;background:'+bg+';z-index:-1;';
    const clone = source.cloneNode(true);
    clone.classList.add('export-capture');
    clone.style.width = '1080px';
    clone.style.maxWidth = '1080px';
    clone.style.margin = '28px auto';
    host.appendChild(clone);
    document.body.appendChild(host);
    try{
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 120));
      const canvas = await html2canvas(clone, { scale:2.5, backgroundColor:bg, useCORS:true, allowTaint:false, logging:false, windowWidth:1280 });
      return await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
    } finally { host.remove(); }
  }

  async function downloadReceiptImage(){
    try{
      const blob = await receiptBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sdc-claro-simple-pro-${state.editingInvoiceId || 'cotizacion'}-${Date.now()}.png`; 
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Imagen descargada.');
    }catch(e){ console.error(e); window.print(); toast('No se pudo descargar imagen. Use Imprimir/PDF.'); }
  }
  async function shareReceiptImage(){
    try{
      const blob = await receiptBlob();
      const file = new File([blob], `sdc-claro-simple-pro-${state.editingInvoiceId || 'cotizacion'}.png`, { type:'image/png' });
      if (navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({ files:[file], title:'Factura SD COMAYAGUA', text:'Le compartimos su factura de SD COMAYAGUA.' });
        toast('Lista para compartir.');
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        openWhatsApp(whatsappText());
        toast('Se descargó la imagen y se abrió WhatsApp para enviar el texto.');
      }
    }catch(e){ console.error(e); openWhatsApp(whatsappText()); toast('No se pudo compartir imagen. Se abrió WhatsApp con el texto.'); }
  }

  function getVal(id){ return $('#'+id)?.value ?? ''; }
  function saveConfig(options = {}){
    const { silent = false, rerender = true } = options;
    state.config.appsScriptUrl = normalizeAppsScriptUrl(getVal('cfgUrl'));
    state.config.apiKey = String(getVal('cfgKey')).trim();
    state.config.whatsappNumber = cleanPhone(getVal('cfgWhatsapp'));
    state.config.lowStockLimit = n(getVal('cfgLow')) || 5;
    state.config.normalShipping = n(getVal('cfgNormal'));
    state.config.cashOnDeliveryShipping = n(getVal('cfgCodShip'));
    state.config.cashOnDeliveryCommission = n(getVal('cfgCodCom'));
    state.config.localShipping = n(getVal('cfgLocal'));
    state.products = state.products.map(normalizeProduct);
    window.SDC_CONFIG = { ...window.SDC_CONFIG, ...state.config };
    persistConfig();
    save();
    if (rerender) render();
    if (!silent) toast(state.config.appsScriptUrl ? 'Configuración guardada en este dispositivo.' : 'Configuración guardada. Falta URL de Apps Script.');
  }
  async function testConnection(){
    saveConfigIfVisible();
    if (!window.SDCApi || !SDCApi.ready()) return toast('URL /exec inválida. Pegue el enlace completo de Apps Script.');
    try{
      toast('Probando URL de Apps Script...');
      const data = await SDCApi.test();
      const msg = data?.message || 'Apps Script respondió correctamente.';
      setProductLoad(state.productLoad?.status || 'local', `Diagnóstico correcto: ${msg}`);
      save(); render(); toast('Diagnóstico correcto. URL responde JSON.');
    }catch(e){
      console.error(e);
      setProductLoad('error', `Diagnóstico: ${friendlySyncError(e)}`);
      save(); render(); toast('Diagnóstico falló. Revise el mensaje en Productos.');
    }
  }
  async function syncFromSheets(){
    saveConfigIfVisible();
    if (!window.SDCApi || !SDCApi.ready()) return toast('Pegue primero la URL /exec de Apps Script en Ajustes.');
    try{
      setProductLoad('loading', 'Sincronizando con Google Sheets…');
      save(); render(); toast('Sincronizando con Google Sheets...');
      let data = await SDCApi.get('all');
      let changed = applyRemotePayload(data, { silent:true });
      if (!changed.products) {
        data = await SDCApi.get('products');
        const more = applyRemotePayload(data, { silent:true });
        changed = { ...changed, products:more.products || changed.products, invoices:more.invoices || changed.invoices, clients:more.clients || changed.clients, settings:changed.settings || more.settings };
      }
      if (!changed.products) {
        ensureProductsFallback('Sheets no devolvió productos. Mostrando productos demo/locales.');
        setProductLoad('error', 'Sheets respondió, pero no devolvió productos válidos. Se mantienen productos locales/demo.');
      }
      state.products = state.products.map(normalizeProduct);
      save(); render();
      toast(changed.products ? `Sincronización completa: ${changed.products} productos.` : 'Sincronización sin productos. Revise la hoja productos_pos.');
    }catch(e){
      console.error(e);
      ensureProductsFallback('No se pudo sincronizar. Mostrando productos demo/locales.');
      setProductLoad('error', `${friendlySyncError(e)} Se mantienen productos locales/demo.`);
      save(); render(); toast('No se pudo sincronizar. Revise el diagnóstico en Productos/Ajustes.');
    }
  }
  function saveConfigIfVisible(){ if($('#cfgUrl')) saveConfig({ silent:true, rerender:false }); }
  function mergeInvoices(local, remote){ const map = new Map(); [...remote, ...local].forEach(x => x?.id && map.set(x.id, x)); return [...map.values()]; }
  function mergeClients(local, remote){ const map = new Map(); [...remote, ...local].forEach(x => { const key=x.id || cleanPhone(x.telefono) || x.nombre; if(key) map.set(key,x); }); return [...map.values()]; }
  function fromSheetInvoice(x){
    let items=[], totals={}; try{ items=JSON.parse(x.items_json||'[]'); }catch(e){} try{ totals=JSON.parse(x.totals_json||'{}'); }catch(e){}
    return { id:x.id, code:x.code||x.id, createdAt:x.createdAt, updatedAt:x.updatedAt, status:x.status||'Cotización', customer:{ nombre:x.cliente, telefono:x.telefono, departamento:x.departamento, municipio:x.municipio, direccion:x.direccion }, shippingType:x.tipo_envio, items, totals:{ subtotal:n(x.subtotal), envio:n(x.envio), comision:n(x.comision), descuento:n(x.descuento), total:n(x.total), ...totals } };
  }
  function exportJSON(){
    const blob = new Blob([JSON.stringify(state,null,2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `respaldo-sdc-pos-${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
})();
