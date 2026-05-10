SD COMAYAGUA · Corrección V2 Cotización / Ventas / Facturas
Fecha: 2026-05-10

Cambios aplicados según las capturas:

1. Modal de Cotización/Ventas
- La barra “1 artículo seleccionado” ya NO queda pegada encima de la factura.
- Corrección de texto: “1 artículo seleccionado” / “2 artículos seleccionados”.
- El botón “Vista foto” se ocultó en móvil para no recargar el espacio.
- La lista, datos de cliente/envío y vista previa tienen orden estable.
- “Quitar” queda más compacto y no ocupa una franja exagerada.

2. Facturas / Cotizaciones
- Los botones de acciones ya no quedan flotando encima del documento.
- Se quitó el título cortado “Acciones rápidas”.
- Botones más limpios, centrados y responsivos.
- En móvil los botones principales ocupan toda la fila para evitar cortes.
- La vista previa se centra y no se sale del contenedor.

3. Productos / editor
- Se agregó más espacio inferior para que el menú de navegación no tape el editor.
- Fotos de productos forzadas a formato 1:1, con object-fit: contain y fondo limpio.
- Mejor encuadre para evitar que se miren cortadas o confusas.

4. Caché
- Se actualizaron los parámetros ?v= en index.html para obligar al navegador a cargar la nueva versión.

Archivos modificados:
- index.html
- css/sdc-ventas-hotfix.css
- js/sdc-pro-max-polish.js

Recomendación al subir:
1. Reemplace todos los archivos en GitHub Pages.
2. Espere 1-3 minutos.
3. Abra la página en Chrome y recargue fuerte: ⋮ > Historial / datos o abra en incógnito.
4. Si sigue viendo lo viejo, agregue al final de la URL: ?v=2
