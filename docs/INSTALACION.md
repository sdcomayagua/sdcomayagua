# Instalación paso a paso

## 1. Preparar la app

Puedes abrir `app.html` localmente para pruebas. Para uso real en celular, sube toda la carpeta a un hosting con HTTPS.

Opciones comunes:

- Netlify.
- Vercel.
- GitHub Pages.
- Hosting propio.

La PWA necesita HTTPS para instalarse correctamente en Android.

## 2. Preparar Google Sheets

Usa tu Google Sheet actual con este ID:

`1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY`

La hoja principal de productos debe llamarse `productos_pos` y debe conservar estas columnas principales:

`codigo, nombre, categoria, marca, precio, costo, stock, colores, imagen, galeria, descripcion, promos, activo, updatedAt, json`

## 3. Publicar Apps Script

Consulta `APPS_SCRIPT.md`.

## 4. Conectar app con Apps Script

1. Abre la app.
2. Entra a Configuración.
3. Pega la URL de Web App terminada en `/exec`.
4. Presiona **Guardar configuración**.
5. Presiona **Probar conexión**.

## 5. Probar flujo mínimo

1. Agrega un producto.
2. Entra al catálogo.
3. Agrégalo al carrito.
4. Crea cotización.
5. Crea venta.
6. Revisa que el stock se descuente.
7. Sincroniza.
