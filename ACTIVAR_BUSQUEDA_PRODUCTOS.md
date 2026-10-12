# Completar fichas de productos desde la web

El panel tiene el botón **Buscar ficha**. Escribís marca y modelo, buscás y revisás una propuesta con descripción, características y enlaces a las fuentes. **Completar campos vacíos** lleva la propuesta al formulario; **Guardar producto** la publica en tu inventario.

La función necesita una conexión privada a la API de OpenAI y una nueva versión de tu Google Apps Script. Subir los archivos a GitHub actualiza el panel, pero no modifica el proyecto de Google ni configura una clave.

## Activación, una sola vez

1. Creá una clave de proyecto en [OpenAI API](https://platform.openai.com/api-keys) y verificá que tu cuenta de API tenga facturación y acceso a Responses con búsqueda web. Esta conexión utiliza facturación de API por uso; no utiliza tu sesión de ChatGPT.
2. Abrí [tu inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
3. Reemplazá todo **Code.gs** con [el archivo completo actualizado](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs) y guardá. El código conserva el PIN y la hoja actuales; agrega la columna `Detalles` al final de Productos cuando sea necesaria para guardar una ficha.
4. En **Configuración del proyecto → Propiedades de secuencia de comandos**, agregá **PRODUCT_RESEARCH_API_KEY** y pegá tu clave de API como valor. Conservá las propiedades existentes de tu PIN. No pegues la clave en Google Sheets, en el formulario de productos, en GitHub ni en este chat.
5. Entrá en **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Usá la implementación web existente para conservar la misma URL `/exec` y sus opciones actuales de ejecución y acceso.
6. Recargá [el panel](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-specs-35), ingresá tu PIN y abrí un producto. El botón **Buscar ficha** se habilita cuando el servidor anuncia que la conexión está configurada.

El modelo predeterminado es `gpt-4.1-mini`. La propiedad opcional **PRODUCT_RESEARCH_MODEL** permite usar otro modelo compatible con Responses, `web_search` y salidas estructuradas. Consultá la documentación antes de cambiarlo.

## Qué completa

- Descripción propia y breve, modelo, marca, material, compatibilidad y tecnología.
- Peso y unidad; medidas con unidad o tamaño completo cuando los ejes no están identificados.
- Voltaje de entrada, corriente, potencia, conexión y accesorios incluidos, cuando la fuente los confirme.
- Referencias de la ficha técnica, visibles en las características del producto.

La búsqueda usa documentación del fabricante o manuales oficiales. Cada dato debe estar respaldado por una URL obtenida durante la búsqueda. Los datos desconocidos quedan vacíos. Si el nombre tiene varias variantes, la propuesta pide precisar el modelo y no completa una ficha de otra versión.

No reemplaza campos que ya llenaste. Tampoco decide precio, stock, costo, descuentos, fotos ni formas de pago. Las propuestas no se guardan ni se publican hasta que uses los botones del formulario.

**Ejemplo MEMO:** la página oficial encontrada corresponde a **CX16**, no confirma la denominación **CXD16 Pro 2026**. Revisá la caja y la etiqueta antes de usar sus cifras de peso, potencia o tamaño para tu artículo:
https://www.memo-develop.com/phone-cooler/semiconductor-cooling-phone-cooler/memo-cx16-universal-magnetic-mobile-cooling.html

## Uso y comprobación

1. Buscá un producto con marca y modelo exactos. Revisá que las fuentes sean del mismo modelo.
2. Comprobá la propuesta. Si se muestra **Modelo por confirmar**, corregí o precisá el nombre según la etiqueta y volvé a buscar.
3. Tocá **Completar campos vacíos**, revisá las unidades y luego **Guardar producto**.
4. Abrí la ficha en la tienda y verificá descripción, características y fuentes.

Las búsquedas se ejecutan al tocar el botón; escribir letras en el nombre no inicia llamadas de API. Las propuestas del mismo nombre, categoría y modelo de IA se reutilizan durante 30 minutos para reducir consultas repetidas. Solo se admite una búsqueda en curso por tienda.

Si faltan saldo, permisos o conexión, el panel explica el problema y conserva lo que escribiste. La función se probó con respuestas simuladas; la primera búsqueda real debe verificarse después de configurar tu cuenta y desplegar Apps Script.

Documentación de referencia: [búsqueda web](https://developers.openai.com/api/docs/guides/tools-web-search), [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs), [modelo](https://developers.openai.com/api/docs/models/gpt-4.1-mini) y [precios vigentes](https://developers.openai.com/api/docs/pricing).
