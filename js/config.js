export const APP_VERSION = '1.3.1';

export const DEFAULT_CONFIG = {
  storeName: 'SD COMAYAGUA',
  appName: 'SD COMAYAGUA POS',
  country: 'Honduras',
  currency: 'Lps.',
  whatsapp: '+504 3151-7755',
  normalShipping: 110,
  codShipping: 110,
  codCommissionRate: 0.06,
  lowStockLimit: 3,
  defaultTheme: 'dark',
  defaultAccent: 'blue',
  sheetId: '1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY',
  appsScriptUrl: '',
  sheets: {
    products: 'productos_pos',
    sales: 'ventas_pos',
    quotes: 'cotizaciones_pos',
    adjustments: 'ajustes_pos',
    logs: 'logs_pos',
    customers: 'CLIENTES',
  },
  backup: {
    autoBackup: true,
    maxSnapshots: 10,
  },
};

export const STORAGE_KEYS = {
  settings: 'sd_pos_settings',
  products: 'sd_pos_products',
  sales: 'sd_pos_sales',
  quotes: 'sd_pos_quotes',
  customers: 'sd_pos_customers',
  cart: 'sd_pos_cart',
  queue: 'sd_pos_pending_queue',
  lastSync: 'sd_pos_last_sync',
  syncLog: 'sd_pos_sync_log',
  backups: 'sd_pos_backups',
};

export const REQUIRED_PRODUCT_COLUMNS = [
  'codigo','nombre','categoria','marca','precio','costo','stock','colores','imagen','galeria','descripcion','promos','activo','updatedAt','json'
];

export const HEADER_ALIASES = {
  codigo: ['codigo','id','sku','code'],
  nombre: ['nombre','name','producto','title'],
  categoria: ['categoria','category','categorias'],
  marca: ['marca','brand'],
  precio: ['precio','price','venta','precio_venta'],
  costo: ['costo','cost','compra','costo_compra'],
  stock: ['stock','existencia','inventario','cantidad','qty'],
  colores: ['colores','colors','colorStock','stockColores','variantesColor'],
  imagen: ['imagen','image','foto','img'],
  galeria: ['galeria','gallery','imagenes','fotos'],
  descripcion: ['descripcion','description','detalle'],
  promos: ['promos','promociones','mayoreo','ofertas'],
  activo: ['activo','active','visible','estado','status'],
  updatedAt: ['updatedAt','updated_at','actualizado'],
  json: ['json','data'],
};

export const NAV_ITEMS = [
  { id:'home', label:'Inicio', icon:'⌂' },
  { id:'catalog', label:'Catálogo', icon:'▦' },
  { id:'inventory', label:'Inventario', icon:'▤' },
  { id:'cart', label:'Carrito', icon:'🛒' },
  { id:'quotes', label:'Cotizaciones', icon:'☰' },
  { id:'sales', label:'Ventas', icon:'₿' },
  { id:'customers', label:'Clientes', icon:'♡' },
  { id:'reports', label:'Reportes', icon:'↗' },
  { id:'sync', label:'Sincronización', icon:'↻' },
  { id:'settings', label:'Configuración', icon:'⚙' },
];
