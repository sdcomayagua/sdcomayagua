(function(){
  const KEY = 'sdc_control_ventas_v90';
  const BACKUP_KEY = 'sdc_backups_v90';
  function safeJSON(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function uid(prefix='SDC'){return `${prefix}-${Date.now().toString().slice(-7)}${Math.floor(Math.random()*90+10)}`}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function textField(v,fallback=''){
    if(Array.isArray(v)) return v.map(x=>String(x||'').trim()).filter(Boolean).join(', ') || fallback;
    if(v && typeof v==='object') return Object.values(v).map(x=>String(x||'').trim()).filter(Boolean).join(', ') || fallback;
    return String(v ?? fallback);
  }
  function defaultState(){return {version:92,unlocked:false,products:clone(window.SDC_DEFAULT_PRODUCTS||[]),sales:[],quotes:[],clients:[],closings:[],expenses:[],lastReceipt:null,lastQuote:null,settings:clone(window.SDC_CONFIG||{})}}
  function normalizeProduct(p,i=0){
    const categories = p.categories || p.category || p.categoria || p.etiquetas || 'General';
    const image = p.image || p.imagen || p.imagenes || p.foto || p.fotos || (Array.isArray(p.images)&&p.images[0]) || '';
    const gallery = p.gallery || p.galeria || p.imagenes_extra || p.fotos_extra || p.images || '';
    return {
      id:textField(p.id||p.codigo||`SDC-${String(i+1).padStart(3,'0')}`),
      name:textField(p.name||p.nombre||'Producto sin nombre','Producto sin nombre'),
      categories:textField(categories,'General').replace(/^\[object Object\]$/i,'General'),
      price:Number(p.price??p.precio??p.precio_venta??0)||0,
      cost:Number(p.cost??p.costo??p.costo_compra??0)||0,
      stock:Number(p.stock??p.existencia??0)||0,
      image:textField(image,''),
      gallery:Array.isArray(gallery)?gallery.map(x=>textField(x,'')).filter(Boolean).join('\n'):textField(gallery,''),
      description:textField(p.description||p.descripcion||''),
      promos:textField(p.promos||p.promociones||p.preciosCantidad||p.precios_cantidad||p.mayoreo||p.ofertas||'')
    }
  }
  function normalizeState(s){
    const d = defaultState();
    const out = Object.assign(d, s||{});
    out.products = (out.products||[]).map(normalizeProduct);
    out.sales = Array.isArray(out.sales)?out.sales:[];
    out.quotes = Array.isArray(out.quotes)?out.quotes:[];
    out.clients = Array.isArray(out.clients)?out.clients:[];
    out.closings = Array.isArray(out.closings)?out.closings:[];
    out.expenses = Array.isArray(out.expenses)?out.expenses:[];
    out.settings = Object.assign({}, window.SDC_CONFIG||{}, out.settings||{});
    return out;
  }
  function load(){return normalizeState(safeJSON(localStorage.getItem(KEY), null) || defaultState())}
  function save(state){localStorage.setItem(KEY, JSON.stringify(normalizeState(state)));return state}
  function saveBackup(state,label='Backup manual'){
    const backups = safeJSON(localStorage.getItem(BACKUP_KEY),'[]') || [];
    backups.unshift({id:uid('BK'),label,date:new Date().toISOString(),state:normalizeState(state)});
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0,20)));
    return backups[0];
  }
  function listBackups(){return safeJSON(localStorage.getItem(BACKUP_KEY),'[]') || []}
  function restoreBackup(id){const b=listBackups().find(x=>x.id===id); if(!b) return null; save(b.state); return normalizeState(b.state)}
  function exportData(state){return JSON.stringify(normalizeState(state),null,2)}
  function importData(json){const s=normalizeState(safeJSON(json,null)); if(!s) throw new Error('Archivo no válido'); save(s); return s}
  window.SDCStore={KEY,load,save,saveBackup,listBackups,restoreBackup,exportData,importData,uid,normalizeProduct,normalizeState,clone};
})();
