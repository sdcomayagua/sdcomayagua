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
