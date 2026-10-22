# Códigos por categoría y productos desde fotos

El inventario original conserva sus identificadores internos, precios, costos y existencias. Los códigos visibles usan la categoría y un consecutivo: `Dedales-001`, `Dedales-002`, `Mouse-001`. Las categorías con varias palabras usan guiones, por ejemplo `KIT-GAMER-001`.

La pestaña **CATEGORIAS** muestra los prefijos, el último número, el siguiente código y el número de productos. **HISTORIAL CODIGOS**, oculta para mantener el panel sencillo, conserva la correspondencia con los códigos anteriores.

## Cargar productos desde imágenes

1. Abrí **FOTOS Y ADMINISTRACIÓN** desde el panel de Google Sheets e ingresá tu PIN habitual.
2. Tocá **Crear desde fotos** y elegí las imágenes o usá la cámara.
3. Elegí una ficha por imagen, o una sola ficha con varias fotos del mismo producto.
4. Revisá el nombre, categoría, precio y los datos legibles del empaque. Podés editar todos los campos propuestos.
5. Tocá **Guardar seleccionados**. Las fotos se optimizan, se suben y se asocian a cada producto. Las fichas quedan como borradores salvo que marques **Mostrar en tienda** con precio y existencias confirmados.

También podés usar **Nuevo producto**, seleccionar una foto de la caja y dejar que complete los campos vacíos, o tocar **Leer datos de la foto**. La lectura no reemplaza campos que ya completaste. Usa Tesseract.js en el navegador, servido desde la propia tienda y sin claves de API; la primera carga del lector requiere Internet y puede tardar. El texto pequeño, borroso, inclinado u oculto puede quedar pendiente de revisión. Los números sueltos no se interpretan como precio, ni las cantidades impresas en un empaque se usan como stock de la tienda.

El lector amplía distintas zonas del empaque y prueba contraste para letras claras sobre fondos de color. La opción de una ficha con varias fotos lee también las imágenes de la parte posterior. Si quedan etiquetas pendientes, tocá **Enfocar texto de la caja**, arrastrá sobre el texto y elegí **Leer zona seleccionada**; podés girar la vista de lectura. Los valores contradictorios quedan pendientes y los reintentos conservan los campos que hayas corregido a mano. Si solo se detectan letras sueltas, el panel informa que no identificó datos fiables.

Los reintentos conservan el ID de cada ficha y las fotos que ya terminaron de subir. Antes de repetir un guardado cuya respuesta se perdió, el panel comprueba si ya existe ese ID.

## Actualización del proyecto de Apps Script

Los archivos de este repositorio y el código ejecutado en Google Apps Script son versiones independientes. Subir un cambio a GitHub no cambia automáticamente una implementación `/exec` ya publicada.

Para activar la asignación protegida por bloqueo en el servidor y los cambios hechos directamente en Sheets:

1. En el proyecto que atiende la URL `/exec` actual, reemplazá **Code.gs** y **EditorMovil.gs** con los archivos de `apps-script/` de este repositorio. Conservá **FichaGratis.gs**, **FichaRapida.gs**, los otros archivos y las propiedades privadas existentes. No vuelvas a crear ni cambiar el PIN.
2. Guardá. Si el proyecto es independiente del archivo de Sheets, ejecutá **instalarEditorMovil** una vez para que su activador atienda tanto el editor móvil como la pestaña Productos. Si ya existía ese activador en el mismo proyecto, continuará usando el archivo actualizado.
3. Entrá en **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**, conservando la misma implementación, URL `/exec` y configuración de acceso.
4. El diagnóstico público mostrará `GC-20261022-CATEGORIAS-V11` y el panel confirmará `categoryCodes: true` tras volver a conectarse.

El servidor calcula el código dentro del mismo bloqueo que guarda el producto. No acepta un código arbitrario del navegador. Editar un artículo conserva su código; cambiar de categoría asigna el siguiente de esa categoría y conserva el ID interno. El contador conserva los números ya utilizados y no vuelve a asignarlos después de borrar una ficha. Se admite el pegado de varias filas en Productos; cada fila debe tener nombre y categoría.

El panel incluye compatibilidad con la implementación anterior para proponer códigos por categoría. La protección ante guardados simultáneos y la automatización de cambios directos en Sheets necesitan la versión de Apps Script indicada arriba.

## Imágenes recibidas

Se prepararon 13 productos como borradores a partir de las imágenes recibidas: ocho kits Mobilador, audífonos, un cargador VOLTRAX, un hub y dos cables KOUVOLSEN. La foto del cable ArgomTech de 65 W / 3 m se agregó al producto existente. Los precios no legibles y todas las existencias nuevas quedan pendientes de confirmar. El precio del Mobilador V3 no se distingue por completo y no se completó por suposición.

Los kits muestran envío gratis en las imágenes. Se mantienen como borradores para revisar esa condición comercial antes de activarlos; la tarifa general de envío existente no se cambió en esta actualización.

## Verificación

- `node tests/test-category-codes.js`: códigos asignados en servidor, edición, cambios de categoría, ID estable, contador permanente, pegado múltiple y lectura del empaque.
- `node tests/test-photo-intake-ui.js`: creación desde fotos, extracción al editor, borradores, guardado parcial, reintentos y vista móvil/PC con OCR y servidor simulados.
- `node tests/test-photo-recognition.js`: fragmentos de lecturas reales, nombres de marca, modelos, medidas, texto ilegible y atributos contradictorios.
- `node tests/test-photo-reader-ui.js`: enfoque y giro, lectura de varias fotos, correcciones manuales, cancelación y nueva lectura, y presentación móvil con OCR simulado.
- Lectura real en navegador comprobada con las fotos originales KOUVOLSEN del hub KOS-9044, cable X176 y cable X36. En el formulario se verificaron marca KOUVOLSEN, modelo X176, conexión C-C y 60 W; los datos restantes siguen sujetos a revisión.
- Se conservan las pruebas existentes del catálogo, carrito, inventario y buscador.
