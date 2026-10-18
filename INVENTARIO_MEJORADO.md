# Inventario de GAMER COMAYAGUA

El archivo original conserva su ID, sus pestañas de datos y la conexión existente con Apps Script y la tienda. No se importa ni reemplaza con una copia de Excel.

- **PANEL** es la primera pestaña. Ofrece accesos a edición, ADMIN, vista de productos y tienda, además de contadores de existencias y datos por completar.
- **EDITOR MOVIL** conserva B3 para elegir un producto, B4 para guardar o crear, y B7:B20 para sus datos. Las categorías se pueden elegir de la lista o escribir.
- **FICHA RAPIDA** conserva sus campos y acciones. Las columnas internas permanecen disponibles para el script y se ocultan en la vista cotidiana.
- **Productos** mantiene todos los encabezados y su orden. El filtro abarca A:T y hasta la fila 1000. MasPedidos ofrece SI/NO. Los avisos distinguen agotados, existencias de 1 a 3 unidades y artículos ocultos.
- **VISTA PRODUCTOS** muestra precio, oferta, costo y stock juntos. Es una consulta automática; los cambios se hacen en los formularios o en Productos.
- Las consultas públicas, las listas del editor y las estimaciones del PANEL abarcan hasta la fila 1000. El catálogo público conserva su selección de columnas y excluye costos.
- Las estimaciones de venta y ganancia consideran una oferta individual válida. Son proyecciones del stock activo, sin envío, comisiones ni descuentos por cantidad; no representan ventas realizadas.
- La guía aclara que el mínimo de pago al recibir depende del monto. Las tarifas y las reglas comerciales se conservan en Configuracion.

Las validaciones SI/NO y las acciones de los formularios conservan los textos que esperan los scripts. La revisión verifica los valores de productos, los borradores de los formularios y las fórmulas del catálogo antes y después de los cambios.
