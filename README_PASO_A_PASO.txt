SD COMAYAGUA · POS MÓVIL V21 FULL PRO
=====================================

CAMBIOS APLICADOS
-----------------
1. Factura/PDF rediseñada:
   - Vista más limpia y menos cargada.
   - Encabezado compacto.
   - Datos del cliente en bloques claros.
   - Tabla de productos más ligera.
   - Total final más elegante.
   - CSS especial para imprimir/PDF en una sola hoja A4 cuando la venta no tiene demasiados productos.

2. Catálogo de productos mejorado:
   - Se agregó selector de vista: 1 producto por fila o 2 productos por fila.
   - Tarjetas más limpias.
   - El precio ya no se sale de la casilla.
   - Se ocultó costo/ganancia en la tarjeta principal para que no se vea cargado.
   - Costo y ganancia siguen disponibles para administración y cálculos internos.

3. Móvil mejorado:
   - Márgenes laterales más ajustados.
   - Menos riesgo de desbordes horizontales.
   - Botones y tarjetas más compactas.
   - Header más limpio.

4. Archivos faltantes incluidos:
   - js/config.js
   - js/demo-data.js
   - js/api.js
   - js/hn-data.js
   - assets/logo-sdc-2026.png
   - assets/no-image.svg

5. Configuración respetada:
   - No se cambió el Apps Script URL oficial.
   - No se cambió el WhatsApp oficial.
   - No se tocó el flujo de Sheets, solo se agregó el archivo api.js que faltaba en el ZIP.

CÓMO SUBIR A GITHUB PAGES
-------------------------
1. Descomprimir este ZIP.
2. Subir todos los archivos y carpetas al repositorio de GitHub Pages.
3. Mantener esta estructura:
   - index.html
   - css/app.css
   - js/app.js
   - js/config.js
   - js/demo-data.js
   - js/api.js
   - js/hn-data.js
   - assets/logo-sdc-2026.png
   - assets/no-image.svg

IMPORTANTE
----------
Si ya tiene productos reales en Google Sheets, la app intentará cargarlos desde Apps Script.
Si Sheets falla o tarda, se mostrarán productos demo/locales para que la página no quede vacía.

Para PDF:
- Entre al POS.
- Agregue productos y datos del cliente.
- Presione "Imprimir / PDF".
- Guarde como PDF desde el navegador.

Para imagen:
- Presione "Imagen HD".
- La factura se descargará como PNG limpio para enviar al cliente.
