# Completar fichas de productos desde la web

El panel tiene el botón **Buscar ficha**. Escribís la marca y el modelo de la caja en **Marca y modelo para buscar**. La búsqueda completa automáticamente los campos vacíos y muestra las fuentes. Revisás los datos y tocás **Guardar y actualizar tienda**, que queda visible al pie del editor. El nombre de venta se conserva.

## Corrección de la búsqueda existente

Si ya configuraste la clave, **conservála**. Para activar el procesamiento corregido de búsquedas nuevas, reemplazá **Code.gs** por [la versión actualizada](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs), guardá y publicá una **nueva versión de la implementación existente**. Conservá la URL `/exec`, el PIN y las propiedades privadas.

El **MEMO CX16** tiene una ficha del fabricante ya verificada que funciona desde el panel sin otra consulta de API. No se aplica automáticamente a nombres con una variante diferente. La tienda consulta directamente **CATALOGO PUBLICO WEB**, por lo que un fallo de lectura de Apps Script no la obliga a mostrar un inventario antiguo. El respaldo de GitHub también conserva las características eléctricas y las fuentes.

La función necesita una conexión privada a la API de OpenAI y una nueva versión de tu Google Apps Script. Subir los archivos a GitHub actualiza el panel, pero no modifica el proyecto de Google ni configura una clave.

## Activación, una sola vez

1. Creá una clave de proyecto en [OpenAI API](https://platform.openai.com/api-keys) y verificá que tu cuenta de API tenga facturación y acceso a Responses con búsqueda web. Esta conexión utiliza facturación de API por uso; no utiliza tu sesión de ChatGPT.
2. Abrí [tu inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
3. Reemplazá todo **Code.gs** con [el archivo completo actualizado](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs) y guardá. El código conserva el PIN y la hoja actuales; agrega la columna `Detalles` al final de Productos cuando sea necesaria para guardar una ficha.
4. En **Configuración del proyecto → Propiedades de secuencia de comandos**, agregá **PRODUCT_RESEARCH_API_KEY** y pegá tu clave de API como valor. Conservá las propiedades existentes de tu PIN. No pegues la clave en Google Sheets, en el formulario de productos, en GitHub ni en este chat.
5. Entrá en **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Usá la implementación web existente para conservar la misma URL `/exec` y sus opciones actuales de ejecución y acceso.
6. Recargá [el panel](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-research-36), ingresá tu PIN y abrí un producto. Las fichas verificadas están disponibles; las búsquedas nuevas necesitan que el servidor anuncie la conexión configurada.

El modelo predeterminado es `gpt-4.1-mini`. La propiedad opcional **PRODUCT_RESEARCH_MODEL** permite usar otro modelo compatible con Responses, `web_search` y salidas estructuradas. Consultá la documentación antes de cambiarlo.

## Qué completa

- Descripción propia y breve, modelo, marca, material, compatibilidad y tecnología.
- Peso y unidad; medidas con unidad o tamaño completo cuando los ejes no están identificados.
- Voltaje de entrada, corriente, potencia, conexión y accesorios incluidos, cuando la fuente los confirme.
- Referencias de la ficha técnica, visibles en las características del producto.

La búsqueda usa documentación del fabricante o manuales oficiales. Cada dato debe estar respaldado por una URL obtenida durante la búsqueda. Los datos desconocidos quedan vacíos. Si el nombre tiene varias variantes, la propuesta pide precisar el modelo y no completa una ficha de otra versión.

No reemplaza campos que ya llenaste. Tampoco decide precio, stock, costo, descuentos, fotos ni formas de pago. Los datos completados no se guardan hasta que tocás **Guardar y actualizar tienda**.

**Ejemplo MEMO:** la página oficial encontrada corresponde a **CX16**, no confirma la denominación **CXD16 Pro 2026**. Revisá la caja y la etiqueta antes de usar sus cifras de peso, potencia o tamaño para tu artículo:
https://www.memo-develop.com/phone-cooler/semiconductor-cooling-phone-cooler/memo-cx16-universal-magnetic-mobile-cooling.html

## Uso y comprobación

1. Buscá un producto con marca y modelo exactos. Revisá que las fuentes sean del mismo modelo.
2. Si se muestra **Modelo por confirmar**, precisá el modelo de búsqueda según la etiqueta y volvé a buscar.
3. Revisá los campos completados y sus unidades; tocá **Guardar y actualizar tienda**.
4. El panel comprueba lo guardado y muestra **Ver ficha en tienda** para abrir directamente el producto.

Las búsquedas se ejecutan al tocar el botón; escribir letras en el nombre no inicia llamadas de API. Las propuestas del mismo nombre, categoría y modelo de IA se reutilizan durante 30 minutos para reducir consultas repetidas. Solo se admite una búsqueda en curso por tienda.

Si faltan saldo, permisos o conexión, el panel explica el problema y conserva lo que escribiste. Las búsquedas nuevas separan la consulta web con citas de la extracción de datos estructurados. Sus pruebas usan respuestas simuladas; la conexión privada de tu servidor debe comprobarse después de desplegar el Code.gs corregido.

Documentación de referencia: [búsqueda web](https://developers.openai.com/api/docs/guides/tools-web-search), [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs), [modelo](https://developers.openai.com/api/docs/models/gpt-4.1-mini) y [precios vigentes](https://developers.openai.com/api/docs/pricing).
