// SD COMAYAGUA POS - Service Worker v1.4.0
const CACHE_NAME = 'sd-comayagua-pos-v1.4.0';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './css/styles.css',
  './css/themes.css',
  './css/mobile.css',
  './css/catalog-polish.css',
  './css/mobile-fix.css',
  './css/final-polish.css',
  './css/catalog-mode.css',
  './css/mobile-redesign.css',
  './css/mobile-ultimate.css',
  './css/mobile-final-v140.css',
  './css/print.css',
  './js/config.js',
  './js/app.js',
  './js/assets-enhancer.js',
  './js/state.js',
  './js/data.js',
  './js/sheets.js',
  './js/sync.js',
  './js/products.js',
  './js/inventory.js',
  './js/cart.js',
  './js/quotes.js',
  './js/sales.js',
  './js/customers.js',
  './js/reports.js',
  './js/backup.js',
  './js/whatsapp.js',
  './js/receipts.js',
  './js/ui.js',
  './js/utils.js',
  './js/validators.js',
  './js/document-actions.js',
  './js/catalog-mode.js',
  './js/catalog-admin-cards.js',
  './assets/categorias/general.svg',
  './assets/icons/icon.svg',
  './assets/logo-sdc-receipt.svg',
  './assets/logo-sdc.svg',
  './assets/placeholders/product.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS.map(path => `${path}?v=${CACHE_NAME}`).concat(CORE_ASSETS)))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isLocalAsset = url.origin === location.origin;
  const isFreshAsset = isLocalAsset && /\.(html|css|js|json|svg|png|webp)$/i.test(url.pathname);

  if (isFreshAsset) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./app.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match('./app.html')))
  );
});
