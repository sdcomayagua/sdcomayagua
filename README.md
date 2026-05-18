# SD COMAYAGUA POS

Sistema web/PWA para inventario, catálogo, cotizaciones y ventas de **SD COMAYAGUA**.

Incluye:

- App web responsive y mobile first.
- Inventario con productos, variantes por color, stock, costos y precios.
- Carrito, ventas, cotizaciones, recibos y WhatsApp.
- Modo offline con localStorage y cola de sincronización.
- Google Apps Script listo para pegar y publicar como Web App.
- Plantilla Excel compatible con Google Sheets.
- Documentación de instalación y mantenimiento.

## Archivo principal

Abre `app.html` en un navegador moderno. Para instalación PWA, publica la carpeta en un servidor HTTPS o en un hosting estático.

## Configuración importante

El Sheet ID obligatorio ya está configurado en `js/config.js` y en `apps-script/Code.gs`:

`1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY`

No lo cambies si deseas mantener compatibilidad con tu Google Sheet actual.

## Flujo básico

1. Abre la app.
2. Entra a Configuración.
3. Pega la URL `/exec` de Apps Script.
4. Presiona **Probar conexión**.
5. Carga productos o descarga desde Sheets.
6. Vende o cotiza desde el catálogo.
7. Sincroniza cambios pendientes.

## Versión

Versión actual: `1.0.0`


## Catálogo v1.1

Se importaron 47 productos desde el archivo `1CATALOGO - 2026 - SDC - inventario.xlsx`.
Los precios y stock fueron conservados. Las marcas vacías fueron generadas automáticamente.
Ver detalles en `docs/CATALOGO_IMPORTADO.md`.


## v1.6.4
- Inicio más limpio, sin textos de relleno ni botones duplicados.
- Acciones principales en la parte superior.
- Tarjetas de estado clicables para ir a inventario, sincronización, ventas y cotizaciones.
- Catálogo móvil compacto: una fila por producto con imagen, nombre, estado, stock, precio y botón de carrito.
- Inventario rediseñado en tarjetas con categoría/marca compactas, botón de venta y controles +/− lado a lado.
- Carrito con stepper táctil para cambiar cantidades sin usar flechas nativas del input.
