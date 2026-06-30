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


Actualización: pie de página rediseñado en formato compacto y profesional.


## Entrega 42
- Exportación premium del catálogo para clientes.
- Portadas más elegantes para Comayagua y Honduras.
- Categorías con mejor diseño.
- Tarjetas de impresión más limpias.
- Vista especial pensada para clientes en la exportación del catálogo.


## Entrega 43
- Reordenado el diseño de las tarjetas de producto en celular.
- Botones más claros y mejor distribuidos en móvil.
- Mejor lectura de código, categoría, stock, costo y utilidad en pantallas pequeñas.


## Entrega 44
- Corregida la exportación de Honduras para que ya no aparezca la leyenda de diseño.
- Ajustadas las cajas de envío para mostrarse 2 por fila en la exportación.
- Reducida la posibilidad de cortes inferiores en la imagen exportada.


## Entrega 45
- Simplificada la portada del catálogo básico para clientes.
- Rediseñadas las tarjetas de exportación Comayagua para evitar cortes y mostrar envío/total más limpios.
- Ajustada la exportación en imagen/PDF de Comayagua para usar cajas laterales más compactas.


## Entrega 46
- Exportación más premium y compacta.
- Encabezados de exportación más finos.
- Tarjetas con mejor equilibrio entre imagen y texto.
- Catálogos exportados en 2 columnas para una lectura más elegante.
- Comayagua y Honduras con bloques de cobro más limpios y mejor distinguidos.


## Entrega 48
- Mejora visual en resumen móvil de productos.
- Selector de categoría más limpio y premium.
- Tarjetas de exportación (catálogo, Comayagua y Honduras) con estilo más moderno.
- Cotización en imagen con miniatura del producto y nombre más contenido.
- Más ajustes de espacio y legibilidad en vistas de impresión/exportación.


## Entrega 49
- Cotización descargable con nombre de archivo más limpio.
- Imagen de cotización con numeración más discreta y títulos ajustados para no invadir el precio.
- Exportación de catálogo, Comayagua y Honduras con tarjetas más altas y mejor espaciado.
- Cabeceras más compactas para evitar textos largos fuera de línea.


## Entrega 53
- Selector de categoría reemplazado por menú personalizado más limpio y centrado.
- Tarjetas de producto en celular rediseñadas con imagen más grande, datos más ordenados y botones más claros.
- Cotizaciones guardadas con verificación local y respaldo opcional en Firebase/Firestore (`cotizaciones`).
