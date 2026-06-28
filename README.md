# SD COMAYAGUA

Proyecto listo para GitHub Pages: catálogo, inventario, ventas, cotizaciones y administración privada.

## Qué incluye

- Catálogo responsive para celular, tablet y computadora.
- Firebase conectado con lectura automática del catálogo.
- Actualización en vivo: si editas, vendes, borras o cambias stock, los cambios se reflejan sin tocar actualizar.
- Soporte para Firestore y Realtime Database.
- Tarjetas con nombre, precio, stock, categoría y estado.
- Modal de detalle, vender y cotizar.
- Factura/cotización visual con número de cotización.
- Descarga de cotización como imagen PNG.
- Envío nacional y modo local con precio de envío editable.
- Subida de foto desde galería.
- Exportar inventario a Excel con descarga reforzada y respaldo CSV si el lector de Excel no carga.
- Importar inventario desde Excel o CSV guardando directamente en Firebase.
- Campos privados de administración: costo, precio de venta, utilidad.
- Panel con alerta de bajo stock y productos más vendidos.
- Bloqueo de modo administrador con PIN.

## Firebase

El archivo `firebase-config.js` ya trae tu configuración Firebase.

El sistema busca productos en estas colecciones/rutas comunes:

- `productos`
- `products`
- `inventario`
- `catalogo`
- `catalogoProductos`
- `productos_catalogo`
- `items`

Cuando encuentra el catálogo, activa escucha en vivo para que los cambios se actualicen automáticamente.

## PIN de administrador

En `firebase-config.js` puedes cambiar el PIN:

```js
window.SD_ADMIN_PIN = "199311";
```

Este PIN protege la interfaz de administración en la página. Para seguridad completa, también debes revisar las reglas de Firebase, porque una página pública en GitHub Pages no puede proteger Firebase por sí sola.

## Exportar e importar inventario

En modo administrador aparecen los botones:

- **Exportar Excel**
- **Importar Excel**

La importación ahora guarda los cambios directamente en Firebase. Al subir un archivo, el sistema te pregunta si quieres:

- **Reemplazar todo el inventario** con el archivo: útil para borrar repetidos que quitaste en Excel.
- **Solo actualizar/agregar**: conserva productos que no vengan en el archivo.

Los productos se comparan por `ID` o `Código`. Si el código no existe, se agrega como nuevo.

Columnas recomendadas para Excel:

- `Codigo`
- `Nombre`
- `Categoria`
- `Costo`
- `PrecioVenta`
- `Stock`
- `Imagen`
- `Descripcion`
- `Id` opcional

## Subir a GitHub Pages

Sube todo el contenido de esta carpeta al repositorio:

- `index.html`
- `firebase-config.js`
- `firebase-config.example.js`
- `assets/`
- `data/`
- `README.md`

No subas solo el archivo ZIP. Debes subir los archivos descomprimidos.



## Actualización de impresión

- Se corrigió la portada de impresión para que el logo cargue antes de abrir la ventana de imprimir.
- El logo de la portada va incrustado para evitar que salga el círculo vacío.
- Los nombres de versión solo se usan en la carpeta/ZIP de entrega, no dentro de la página.


## Corrección Excel

- Exportar Excel ahora genera un archivo `.xlsx` real con columnas separadas y encabezados ordenados.
- Si una foto fue subida desde galería y está guardada como dato interno, en Excel aparece como `FOTO_SUBIDA_DESDE_GALERIA` para evitar columnas enormes. Al importar de vuelta, si el producto conserva su Id o código, la página mantiene la imagen existente.
- Si el navegador tuviera que usar CSV como respaldo, ahora lo crea con separador compatible con Excel en español.


## Mejoras de administración agregadas

- Detector de productos repetidos por código o nombre parecido.
- Revisión de imágenes: productos sin foto, fotos pesadas guardadas como respaldo o enlaces extraños.
- Administrador de categorías para renombrar o unir categorías repetidas.
- Importación inteligente desde Excel/CSV con vista previa antes de guardar en Firebase.
- Botón Crear respaldo para descargar respaldo JSON y Excel con fecha/número único.
- Pantalla de carga mientras conecta Firebase o importa datos.
- Panel de ganancias más completo: inversión, venta posible, utilidad posible, margen promedio y utilidad baja.
- Bloqueo visual reforzado: costos, importación, exportación y herramientas privadas solo aparecen después del PIN.
