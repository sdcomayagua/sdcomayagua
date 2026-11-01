# Gamer Comayagua

Tienda y administración conectadas a Google Sheets.

- [Catálogo](https://sdcomayagua.github.io/sdcomayagua/productos.html)
- [Administración](https://sdcomayagua.github.io/sdcomayagua/admin.html)
- [Guía de conexión y funciones](docs/GUIA_ADMIN.md)

## Organización

- Las cinco páginas HTML conservan sus direcciones para mantener enlaces compartidos.
- `assets/`: estilos, funciones e imágenes utilizados por la tienda y el Admin.
- `data/`: catálogo público de respaldo y configuración de la sincronización.
- `apps-script/`: servidor de Google, con validación del PIN y datos privados.
- `scripts/` y `.github/workflows/`: sincronización y verificaciones automáticas.
- `tests/`: pruebas del inventario, pagos, búsquedas y administración.

## Acceso al Admin

El PIN se valida en Google. El acceso se conserva durante cinco minutos de inactividad en el mismo navegador; volver a la tienda, recargar o regresar antes del vencimiento permite recuperar la sesión. Cerrar sesión la elimina de inmediato. Las operaciones privadas siguen exigiendo el PIN en el servidor.

## Verificación

```sh
node tests/test-admin-session.js
node tests/test-api.js
node tests/test-cart.js
python3 tests/test-sync.py
```

GitHub Actions ejecuta además las pruebas de edición y navegación. Las cuentas se consultan en la conexión pública de Google; sus números y documentos no se guardan en el código.
