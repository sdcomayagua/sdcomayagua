# Finanzas privadas desde la página

En ADMIN, abrí **Finanzas privadas**. Podés buscar por nombre o código y clasificar cada producto:

- **En tienda:** ya lo compraste. Su costo por las unidades disponibles cuenta como inversión.
- **Por encargo:** lo ofrecés y todavía tenés que comprarlo. Se muestra como compra pendiente.
- **Sin clasificar:** todavía no confirmaste de dónde sale. No se suma a ninguno de los dos importes.

Elegí una opción por producto o seleccioná varios y aplicá una clasificación en lote. La vista previa se actualiza al elegir; **Guardar clasificación** confirma los cambios en la hoja original. **Descartar** deshace la vista previa. No cambia precios ni existencias.

Los importes empiezan ocultos. Usá **Mostrar importes privados** cuando los necesités; se vuelven a ocultar al cambiar de sección o recargar. **Editar costo / ficha** abre el costo interno dentro de un apartado privado. Ese dato no se guarda en los borradores del navegador.

En la hoja original, la pestaña **FINANZAS** permite cambiar la misma clasificación en la columna Inventario. **Sincronizar** en la página vuelve a leerla. La relación usa el ID del producto, por lo que ordenar Productos no cambia a quién pertenece cada clasificación. Los productos nuevos se agregan como Sin clasificar al consultar Finanzas.

Los totales son parciales mientras existan productos sin clasificar o costos pendientes. Un costo vacío no equivale a un costo cero. La utilidad potencial es una estimación sobre el stock actual y el precio unitario vigente; no representa ventas realizadas ni descuenta envío, comisiones o descuentos por cantidad. Los productos eliminados no entran en los totales.

## Privacidad y mantenimiento

La hoja original debe permanecer **Restringida**. Ocultar una pestaña no sustituye los permisos de acceso. El catálogo de clientes recibe únicamente los campos públicos autorizados.

Hay dos implementaciones independientes del mismo proyecto de Apps Script:

| Conexión | Configuración | Acceso |
| --- | --- | --- |
| `apiUrl` | `GC_PUBLIC_READ_ONLY = false` | ADMIN: cuenta de Google y PIN existente |
| `publicApiUrl` | `GC_PUBLIC_READ_ONLY = true` | Clientes: solo catálogo, fotos y diagnóstico |

El catálogo público no sirve el panel HTML de Google y rechaza todas las acciones administrativas, incluso con un PIN válido. Cada implementación usa una versión inmutable. El código guardado en el editor y en `apps-script/Code.gs` conserva el modo privado (`false`).

Para actualizar el servidor privado, guardá el código privado y actualizá únicamente su implementación. Para actualizar el público, prepará una copia con la constante en `true`, publicá una nueva versión únicamente en la implementación pública y luego restaurá el código privado en el editor, sin volver a implementar el público. No publiques el código privado en la URL de clientes ni amplíes el acceso del servidor de ADMIN.

`assets/js/config.js` mantiene ambas URL separadas. `data/catalogo-api.url` apunta solo al catálogo de lectura. El respaldo automático usa esa API; no necesita compartir la hoja. `data/catalogo-csv.url` queda sin fuente para evitar consultas anónimas a la hoja privada.

Validación: `tests/test-finance.js` comprueba autenticación, cálculos, costos vacíos, conflictos, fórmulas y aislamiento del servidor público. `tests/test-finance-ui.js` verifica guardado, importes ocultos, edición de costo y pantallas de 1440, 390 y 320 píxeles. Las pruebas usan datos ficticios.
