// Copia este archivo como firebase-config.js y pega tu configuración real.
window.SD_FIREBASE_CONFIG = {
  apiKey: 'TU_API_KEY',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:xxxxxxxxxxxxxxxx',

  // Opcional, pero necesario si usas Realtime Database.
  databaseURL: 'https://tu-proyecto-default-rtdb.firebaseio.com'
};

// Firestore: nombres de colecciones donde puede estar el catálogo.
window.SD_FIRESTORE_COLLECTION = 'productos';
window.SD_FIRESTORE_COLLECTIONS = ['productos', 'products', 'inventario', 'catalogo', 'items'];

// Realtime Database: rutas donde puede estar el catálogo.
window.SD_REALTIME_PRODUCTS_PATH = 'productos';
window.SD_REALTIME_PRODUCTS_PATHS = ['productos', 'products', 'inventario', 'catalogo', 'items'];

// PIN para desbloquear el modo administrador. Cámbialo por uno privado.
window.SD_ADMIN_PIN = "199311";
