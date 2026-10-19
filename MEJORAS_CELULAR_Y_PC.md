# Interfaz 49 · Celular y PC

Esta actualización cambia los archivos de la página publicados en GitHub Pages. No cambia Apps Script, hojas de cálculo, PIN, claves ni tarifas. Se puede publicar sin iniciar sesión en Google.

## ADMIN

- Accesos directos para buscar productos, revisar fotos, existencias y preparar publicaciones.
- Selector para cambiar de sección, también en celular. El resumen de pendientes se abre cuando lo necesitás.
- Búsqueda por nombre, categoría, código, marca, modelo, compatibilidad, conexión, color y otros datos escritos en la ficha. **Ctrl / ⌘ + K** lleva al buscador cuando no hay otro formulario abierto.
- Filtros para disponibles, agotados, stock de 1 a 3, ocultos, sin foto y Más pedidos; orden por recientes, nombre, menor stock o precio. El contador indica cuántos productos estás viendo.
- Fotos pequeñas, código visible y etiquetas de stock en la lista. Las acciones se organizan en dos columnas; en celular las filas son tarjetas completas.
- El resumen de disponibles, agotados y pago al recibir cuenta solo productos visibles en la tienda.
- El editor pide confirmar antes de descartar cambios. Cancelar conserva la ficha abierta; guardar correctamente la cierra sin esa pregunta. El teclado mantiene el foco dentro del editor.
- La búsqueda dentro de pedidos, ventas y entradas filtra los artículos sin borrar la selección ni las cantidades. En ventas, **Recibí el total** y **Recibí el anticipo sugerido** permiten completar el importe recibido cuando corresponda. El cálculo sigue usando las reglas existentes.

## Catálogo para clientes

**Solo disponibles** permite filtrar los productos agotados. El buscador reconoce marca y modelo guardados en las características. La barra de búsqueda sigue accesible al desplazarse y se coloca debajo del encabezado según su tamaño real.

Compartir el catálogo conserva búsqueda, categoría, orden y disponibilidad. El enlace recrea esos filtros al abrirse. Cuando no hay resultados, **Ver todo el catálogo** limpia la selección.

## Funciones que requieren Google

Esta actualización no activa capacidades nuevas en una implementación anterior de Apps Script. Ventas y entradas conservan la comprobación existente y se señalan como pendientes si Google todavía no anuncia su activación. La búsqueda de fotos también depende de la configuración del buscador. El nuevo diseño conserva los datos y el acceso con PIN que ya utiliza ADMIN.

## Verificación

La prueba `tests/test-experience-ui.js` usa Chromium con Sheets en memoria y datos ficticios. Comprueba filtros, búsqueda por marca/modelo, navegación, protección de fichas sin guardar, teclado, selección de artículos, cobros sugeridos, enlaces compartidos y pantallas de 320, 390, 844, 1280 y 1440 píxeles. También se verifican los flujos anteriores de productos, fotos, pedidos, ventas, entradas y duplicados. Las pruebas no necesitan credenciales de Google ni cambian el inventario real.
