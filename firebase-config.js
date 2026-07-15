// SD COMAYAGUA - Configuración Firebase
// Proyecto conectado con los datos que compartiste.

window.SD_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDenfEHylza_0JVHDprJL7Z4tjzlbpXb_c",
  authDomain: "sdcomayagua-746c6.firebaseapp.com",
  projectId: "sdcomayagua-746c6",
  storageBucket: "sdcomayagua-746c6.firebasestorage.app",
  messagingSenderId: "375047857881",
  appId: "1:375047857881:web:15fc0ed10bcec0538300c8",
  measurementId: "G-R3TL0ZCNDX",

  // Sirve si tu catálogo viejo está guardado en Realtime Database.
  // Si tu base tiene otro URL, cámbialo aquí.
  databaseURL: "https://sdcomayagua-746c6-default-rtdb.firebaseio.com"
};

// El sistema ahora intenta varias colecciones comunes de Firestore.
// Puedes poner primero el nombre exacto si sabes dónde están tus productos.
window.SD_FIRESTORE_COLLECTION = "productos";
window.SD_FIRESTORE_COLLECTIONS = [
  "productos",
  "products",
  "inventario",
  "catalogo",
  "catalogoProductos",
  "productos_catalogo",
  "items"
];

// También intenta estos caminos en Realtime Database.
window.SD_REALTIME_PRODUCTS_PATH = "productos";
window.SD_REALTIME_PRODUCTS_PATHS = [
  "productos",
  "products",
  "inventario",
  "catalogo",
  "catalogoProductos",
  "items"
];

// PIN para desbloquear el modo administrador. Cámbialo por uno privado.
window.SD_ADMIN_PIN = "199311";

/*
 * Cargador de la experiencia Storefront 2026.
 * Se mantiene aquí para activar la misma interfaz en index.html y cliente.html
 * sin duplicar código ni alterar la lógica principal de app.js.
 */
(() => {
  'use strict';

  const VERSION = '20260715-genial-1';

  function addStyle(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `${href}?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function loadScript(id, src) {
    return new Promise((resolve, reject) => {
      const current = document.getElementById(id);
      if (current) {
        if (current.dataset.loaded === 'true') resolve();
        else current.addEventListener('load', resolve, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = `${src}?v=${VERSION}`;
      script.async = false;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.body.appendChild(script);
    });
  }

  async function startStorefront() {
    try {
      await loadScript('sd-storefront-mobile-js', 'assets/js/storefront-mobile.js');
      await loadScript('sd-genial-mobile-js', 'assets/js/genial-mobile.js');
    } catch (error) {
      console.warn('No fue posible cargar la mejora visual móvil.', error);
    }
  }

  addStyle('sd-storefront-mobile-css', 'assets/css/storefront-mobile.css');
  addStyle('sd-genial-mobile-css', 'assets/css/genial-mobile.css');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.setTimeout(startStorefront, 0);
    }, { once: true });
  } else {
    startStorefront();
  }
})();
