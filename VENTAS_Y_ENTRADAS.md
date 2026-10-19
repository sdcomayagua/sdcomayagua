# Ventas, entradas y duplicados

ADMIN 48 agrega **Ventas**, **Entradas** y **Duplicados** al centro de gestión. Los movimientos requieren el servidor `GC-20261019-INVENTARIO-V10`, con `inventoryMovements: true` y `duplicateReview: true`. El panel comprueba esas capacidades antes de habilitar los guardados. Comprobar conexión vuelve a verificarlas sin cerrar sesión.

## Registrar una venta

1. Entrá en **Ventas → Registrar venta**. El cliente y el celular son opcionales para ventas de mostrador.
2. Elegí los productos y las cantidades. El precio sugerido usa la promoción o el descuento por cantidad; podés escribir el precio acordado.
3. Completá forma de pago, envío y dinero recibido. Para venta local, el envío empieza en cero. Para un envío, escribí el importe acordado. El total conserva las reglas del carrito y el redondeo adicional cuando hay fracción.
4. Revisá el resumen **Así quedará tu inventario**, marcá la confirmación y tocá **Confirmar venta y descontar**.

El servidor comprueba las existencias actuales y rechaza una cantidad insuficiente. Si otro navegador cambió la ficha o el stock, conserva tus campos y pide sincronizar para revisar nuevamente. Una venta confirmada descuenta unidades; un pedido de seguimiento o una cotización continúa sin descontarlas. Si la venta corresponde a un pedido, podés escribir su número como referencia. Registrá esa salida una sola vez.

## Recibir mercancía

En **Entradas → Registrar entrada**, elegí artículos, cantidades y costo unitario de compra. El resumen muestra el stock anterior y el nuevo, el costo del inventario y el importe de esta entrada.

Cada fila permite marcar **Actualizar el costo del inventario con este valor**. Marcada, guarda el último costo de compra; desmarcada, conserva el costo anterior. El precio de venta, las promociones, fotos y demás datos se conservan. Proveedor y factura son opcionales. Las entradas admiten artículos agotados u ocultos; recibir mercancía no los publica automáticamente.

## Guardados interrumpidos

Cada venta o entrada recibe un identificador único. El servidor guarda primero su intención en **GC_MOVIMIENTOS**, dentro del archivo ya existente **Gestión privada**, y después actualiza cada producto con una marca de ese movimiento. Si se pierde la respuesta, el panel conserva esa confirmación y bloquea sus campos para impedir reenviarla con otros datos.

Usá **Comprobar guardado** o **Reintentar confirmación**. El servidor reconoce las unidades ya aplicadas y completa las que falten. Si todavía no se había guardado, Comprobar guardado vuelve a habilitar los campos. Cerrar y volver a abrir la sección en la misma sesión conserva la confirmación pendiente. Si recargás la página, se conserva únicamente el identificador opaco durante la sesión; el botón comprueba el movimiento anterior antes de abrir uno nuevo. Los registros pendientes también aparecen en la lista con **Comprobar y completar**.

Los cambios directos en la hoja de cálculo durante una confirmación interrumpida pueden crear un conflicto. En ese caso el sistema se detiene y señala el artículo para revisar en la gestión privada; no intenta adivinar cuántas unidades aplicar. Las ventas confirmadas y las entradas son registros cerrados: esta versión no incorpora devoluciones ni anulación automática.

## Revisar duplicados

La comparación busca códigos iguales, nombres iguales sin diferencias de mayúsculas o tildes y nombres suficientemente parecidos. Son sugerencias para revisar: las variantes de modelo, color o presentación pueden ser productos distintos.

- **Ver / editar ficha** permite revisar fotos y características.
- **Mantener ambos** descarta ese par durante la sesión. **Volver a revisar todos** lo muestra nuevamente.
- **Conservar esta ficha** abre una confirmación con los dos productos y su stock. Al confirmar, oculta la otra copia en la tienda. Conserva sus datos y existencias por separado; no fusiona cantidades ni borra filas.
- **Incluir copias ocultas** permite revisar fichas ya ocultadas. Podés volver a publicarlas desde su editor habitual.

Si una ficha cambió desde la comparación, Google pide sincronizar antes de ocultarla. El producto elegido para conservar debe estar visible.

## Conexión con Google

Se conserva la URL de implementación, el PIN, las claves del buscador y el vínculo con la gestión privada. Solo cambia **Code.gs**; esta actualización no necesita reemplazar **FichaGratis.gs**, **EditorMovil.gs** ni **FichaRapida.gs**.

Para una instalación manual, reemplazá Code.gs en el mismo proyecto y publicá **Nueva versión** de la implementación existente. Publicar GitHub Pages actualiza los formularios; guardar el código sin implementar no actualiza el servidor de Google. [Abrir ADMIN 48](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-catalog-48).

Las listas se consultan por POST con PIN y tienen búsqueda y paginación. Clientes, proveedores, costos de compra, referencias, notas y movimientos permanecen fuera del catálogo público y del almacenamiento local del navegador. La única información nueva en Productos es su stock/costo actualizado y una marca de revisión sin datos personales.

## Verificación

`node tests/test-inventory.js` comprueba las reglas del carrito, precios y costos conservados, stock insuficiente, versiones concurrentes, reintentos, fallos entre artículos, conflictos externos y privacidad. `node tests/test-inventory-ui.js` usa Chromium y el servidor de Apps Script con hojas en memoria: venta con respuesta perdida, entrada desde móvil, costo opcional, comparación y ocultación de duplicados y compatibilidad con la conexión anterior. Las pruebas no registran ventas ni modifican existencias reales.
