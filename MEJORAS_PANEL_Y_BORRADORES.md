# Panel de inventario · V14

El editor tiene accesos a Datos, Fotos, Detalles y Revisar. La vista previa reúne nombre, imagen, precio, promoción y existencias y señala datos pendientes y artículos con el mismo modelo.

Los cambios de cada producto se conservan como borrador en este navegador, hasta 10 borradores por inventario y durante 7 días. Al abrir nuevamente la misma ficha, se puede recuperar o descartar el borrador. La recuperación conserva campos que hayan cambiado entretanto en el inventario. Las medidas y sus unidades se recuperan juntas. El costo pendiente se omite cuando cambió la revisión del producto. Un guardado satisfactorio elimina su borrador.

Los archivos locales pendientes se eligen de nuevo después de recargar; se conservan los textos y enlaces, no los archivos ni el PIN. Si el navegador no permite conservar borradores, el editor lo indica. Cerrar sesión sigue exigiendo el PIN para volver al panel.

Las fotos se pueden arrastrar a su sección o pegar con Ctrl+V. El límite de 10 incluye la principal, la galería y las pendientes. Los formatos y tamaños se revisan antes de agregarlas. Las acciones de revisión y selección de fotos no publican productos.

La comprobación de conexión intenta GET y POST en paralelo y acepta la primera respuesta válida. El POST de diagnóstico devuelve únicamente versión, esquema y si existe un PIN válido; no consulta inventario, costos ni claves y no exige enviar el PIN. Las operaciones administrativas conservan su autenticación.

## Publicación

Actualizar `Code.gs` en el proyecto existente y crear una nueva versión de la implementación actual para conservar su URL y acceso. Versión del diagnóstico: `GC-20261022-PANEL-V14`. `FichaGratis.gs` y `EditorMovil.gs` no necesitan cambios para esta actualización.

## Verificación

`test-editor-tools-ui.js` prueba el diagnóstico con GET bloqueado, ausencia de PIN en diagnóstico y borradores, recuperación sin reemplazar cambios recientes, limpieza al guardar, vista previa, duplicados, pegado, arrastre y límite total de fotos. Comprueba también que el botón Guardar siga visible a 360 y 390 píxeles. Los datos y Google se simulan en este navegador de prueba.

La integración continua ejecuta además las pruebas existentes del inventario, búsqueda, carrito y editor, junto con las verificaciones de JavaScript y Apps Script.

## Acceso desde Google

El botón «Abrir panel desde Google» ofrece el mismo formulario mediante HtmlService. Los datos se consultan con `google.script.run` y el mismo enrutador y PIN de siempre. El panel solicita su HTML público a GitHub Pages; no envía datos privados a GitHub. Se conservan la URL de implementación y el requisito de cuenta Google. No se amplían sus permisos.

Los borradores se conservan por origen: el de GitHub y el del panel de Google son independientes. Al usar el panel de Google, conviene continuar la edición allí hasta guardar.
