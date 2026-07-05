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
- `Promoción` opcional, para conservar promociones manuales en formato JSON
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


Actualización entrega 60:
- Texto del selector premium más oscuro/negro para mejor lectura.
- Opción seleccionada con letras blancas para contraste.
- Opciones no seleccionadas con letras oscuras y más legibles.


Actualización entrega 61:
- Botones de acciones de cotización reorganizados en 2 columnas.
- Orden más limpio: Copiar / Descargar, WhatsApp / Guardar.
- Cancelar queda abajo ocupando el ancho completo para no desordenar el bloque.


Actualización entrega 62:
- Botón Guardar cotización corregido con acción directa.
- Guardado reforzado en localStorage/sessionStorage y respaldo IndexedDB.
- Al guardar, abre la sección Cotizaciones para confirmar que quedó guardada.
- Botones WhatsApp y Guardar cotización más llamativos, manteniendo 2 por fila.


Actualización entrega 63:
- Corregido el listado de Cotizaciones guardadas.
- El problema era que la sección esperaba un contador que ya no existía en el HTML, por eso guardaba pero no mostraba la lista.
- Después de guardar, vuelve a renderizar la lista de cotizaciones de inmediato.


## Entrega 64 - Promociones automáticas

- Se agregó `assets/js/promotions.js` para manejar promociones sin tocar el inventario.
- Dedales V1 ahora calcula precio por cantidad: 1+ Lps.25, 6+ Lps.24, 10+ Lps.23, 12+ Lps.22, 16+ Lps.21 y 20+ Lps.20 por par.
- Dedales V3 MEMO / Hilo de Plata mantiene su precio normal y muestra regalos automáticos de Dedales V1: comprando 2 lleva 2 pares gratis, comprando 3 lleva 3 pares gratis y comprando 5 o más lleva 4 pares gratis.
- Los productos sin promoción no muestran oferta ni descuento.
- Las promociones salen en tarjetas, detalle, cotización visual, texto de WhatsApp, imagen descargable y registro de venta.

## Entrega 65 - Regalos manuales y editor de promociones

- En la cotización se agregó el botón **+ Agregar regalo** debajo de **+ Agregar otro producto**.
- Los regalos se eligen desde el catálogo, salen como **GRATIS** y no suman al total de productos ni al envío.
- Puedes agregar varias unidades del mismo regalo o agregar diferentes regalos en una misma cotización.
- En el administrador, al editar un producto, ahora aparece un panel de **Promociones manuales**.
- Desde ese panel puedes activar precio especial por cantidad, regalo automático por compra o bloquear promociones para un producto específico.
- Las promociones manuales se guardan dentro del producto en Firebase/localStorage usando el mismo formato de reglas de `assets/js/promotions.js`.
- `assets/js/promotions.js` queda como archivo de promociones generales; las promociones manuales del admin tienen prioridad sobre las reglas generales.

## Mejora 2026-07-05: ventas, ganancias, recibos y catálogo cliente

Se agregaron estas funciones sobre la versión con promociones y regalos:

- Botón para convertir una cotización en venta y descontar stock automáticamente.
- Descuento de stock también para regalos manuales y regalos automáticos cuando existan en inventario.
- Cálculo de ganancia estimada por cotización, restando costo de productos y costo de regalos.
- Nuevas tarjetas en el panel: vendido, ganancia de ventas y ganancia de hoy.
- Recibo descargable como imagen, usando el mismo diseño limpio de la cotización pero con título de recibo.
- Vista de catálogo para cliente más limpia, sin costos internos y con botones rápidos de Cotizar y WhatsApp.
- Etiquetas visuales de PROMO y REGALO en los productos que tienen promociones activas.

Nota: las ventas y cotizaciones se guardan en el navegador, como ya funcionaba la sección de cotizaciones. Los productos y stock siguen sincronizando con Firebase cuando está configurado.


## Ajuste catálogo cliente limpio
- En `cliente.html` se quitó el aviso interno “Catálogo para cliente”.
- Se ocultaron los botones de estilos de WhatsApp: Con emojis, Formal, Comercial y Corto y limpio.
- La barra inferior de filtros ahora muestra categorías del catálogo, no bajo stock ni filtros internos.
- El cliente puede buscar por producto/categoría y tocar una categoría rápida para filtrar.

## Acceso con PIN en index.html

- `index.html` ahora pide PIN antes de mostrar el panel privado.
- PIN configurado: `199311`.
- El acceso se mantiene activo solo mientras la pestaña esté abierta.
- El botón **Bloquear** vuelve a pedir el PIN.
- `cliente.html` queda libre para clientes y no pide PIN.

Nota: al ser GitHub Pages / página estática, esta protección evita el acceso casual desde la interfaz. No reemplaza un sistema de usuarios con servidor, pero sirve para ocultar el administrador a clientes o personas que abran la página por accidente.
