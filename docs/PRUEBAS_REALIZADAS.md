# Pruebas realizadas

## Verificado en archivos locales

- La estructura de carpetas fue creada correctamente.
- Los módulos JavaScript pasan validación de sintaxis con `node --check`.
- El `SHEET_ID` obligatorio se mantiene en `js/config.js` y `apps-script/Code.gs`.
- La plantilla Excel fue generada con hojas compatibles.
- Se revisó el dashboard principal de la plantilla.
- Se revisó que no existan errores de fórmula tipo `#REF!`, `#VALUE!`, `#DIV/0!`, `#NAME?` o `#N/A` en la plantilla generada.

## Funciones incluidas para prueba manual

- Crear producto.
- Editar producto.
- Duplicar producto.
- Desactivar producto.
- Ajustar stock.
- Agregar al carrito.
- Crear cotización.
- Registrar venta.
- Descontar stock general.
- Descontar stock por color.
- Generar recibo.
- Compartir por WhatsApp.
- Guardar cambios pendientes en localStorage.
- Sincronizar con Apps Script.
- Probar conexión con Google Sheets.

## Pendiente de verificar en tu entorno

No pude probar la conexión real con tu Google Sheet porque se necesita publicar el Apps Script como Web App y pegar la URL `/exec` en la app.

Después de publicar Apps Script, prueba:

1. `ping` desde Configuración.
2. Descargar productos desde Sheets.
3. Guardar producto nuevo.
4. Guardar venta.
5. Guardar cotización.
6. Revisar que aparezcan en las hojas correspondientes.


## Corrección v1.2.0
- Se corrigió la capa modal para que no quede una pantalla oscura/borrosa cuando no hay ventana abierta.
- Se agregó limpieza automática del modal al iniciar la app.
- Se actualizó el Service Worker a cache v1.2 con navegación network-first para evitar archivos viejos en GitHub Pages.
