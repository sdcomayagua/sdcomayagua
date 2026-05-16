const CACHE_NAME = 'sd-comayagua-pos-v1.2';
const ASSETS = [
  './', './index.html', './app.html', './manifest.json',
  './css/styles.css', './css/themes.css', './css/mobile.css', './css/print.css',
  './js/config.js', './js/app.js', './js/state.js', './js/data.js', './js/sheets.js', './js/sync.js', './js/products.js', './js/inventory.js', './js/cart.js', './js/quotes.js', './js/sales.js', './js/customers.js', './js/reports.js', './js/backup.js', './js/whatsapp.js', './js/receipts.js', './js/ui.js', './js/utils.js', './js/validators.js',
  './assets/icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const wantsHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (wantsHtml) {
    event.respondWith(
      fetch(req)
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
