# BUSCADOR GRATIS · GAMER COMAYAGUA

Esta versión permite investigar fichas técnicas en `ADMIN` y en la pestaña `FICHA RAPIDA` **sin usar OpenAI API**, siempre que tus cuentas estén en los **planes gratuitos** de Tavily y Google AI Studio. Cuando se agota una cuota gratuita, la búsqueda falla y no se completa una ficha; **no hay cambio automático a un proveedor de pago**.

## 1. Crear dos claves GRATUITAS, sin tarjetas

1. Entrá en **https://app.tavily.com/** y registrate en el plan **Researcher Free**. Según Tavily (https://www.tavily.com/pricing), incluye **1,000 créditos por mes**, sin tarjeta. Copiá su API key en privado.
2. Entrá en **https://aistudio.google.com/api-keys** con Google y creá una clave para un proyecto que aparezca en **Free Tier**. **No activés facturación ni selecciones un plan de pago**. Usamos solo el modelo `gemini-3.5-flash-lite` para organizar resultados de Tavily. Su tier gratuito está sujeto a límites y disponibilidad geográfica.
3. No compartás las claves en chats, capturas, GitHub, Google Sheets o páginas públicas. El nombre del producto y fragmentos públicos de resultados se envían a ambos servicios. El tier gratuito de Gemini puede utilizar datos enviados para mejorar sus productos; no se envían costos, inventario ni datos bancarios.

**IMPORTANTE SI YA TENÉS UNA CLAVE DE OPENAI:** La versión anterior de `Code.gs` podía llamar a la API facturable. Para evitar futuros cobros, primero dejá de presionar `Buscar ficha` hasta actualizar el servidor y considerá **eliminar la propiedad `PRODUCT_RESEARCH_API_KEY`**. La versión nueva usa GRATIS por defecto; OpenAI únicamente se usa si cambiás expresamente la propiedad `PRODUCT_RESEARCH_PROVIDER` a `OPENAI` (no lo hagás si no querés pagar).

## 2. Guardar las claves PRIVADAS en Apps Script

En **Google Sheets original → Extensiones → Apps Script → engranaje Configuración del proyecto → Propiedades de secuencia de comandos**, creá estas dos propiedades:

| Propiedad | Valor (secreto; pegar solo en Apps Script) |
| --- | --- |
| `GC_FREE_TAVILY_API_KEY` | Tu clave del plan gratuito Tavily |
| `GC_FREE_GEMINI_API_KEY` | Tu clave del proyecto gratuito Google AI Studio |
| `PRODUCT_RESEARCH_PROVIDER` | `GRATIS` (opcional; es el predeterminado) |

Guardá. Conservá las demás propiedades del PIN, salvo `PRODUCT_RESEARCH_API_KEY` si querés eliminar cualquier dependencia de OpenAI API.

## 3. Pegar tres archivos en el MISMO proyecto de Apps Script

1. [Code.gs (actualizado)](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs): hacé primero una copia de seguridad del archivo actual; pegá la versión completa dentro de tu **Código.gs** existente, sin duplicar `doPost`.
2. [FichaGratis.gs (NUEVO)](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/FichaGratis.gs): creá este archivo dentro del proyecto y pegá su contenido.
3. [FichaRapida.gs (actualizado)](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/FichaRapida.gs): reemplazá el contenido del archivo de la pestaña `FICHA RAPIDA`.

**NO BORRES** `EditorMovil.gs`. Nunca pegues las claves dentro del código.

En Apps Script ejecutá **`instalarFichaRapida`** (crea/recrea su activador), luego **`comprobarConexionFichaRapida`**, que **no consume cuota** y escribe el estado en `FICHA RAPIDA!B5`.

## 4. Actualizar el panel de GitHub Pages

**Implementar → Administrar implementaciones → editar la implementación web EXISTENTE → Nueva versión → Implementar**. Conservá la URL terminada en `/exec`. No creés otra. La versión nueva del servidor tendrá el motor gratuito.

Abrí https://sdcomayagua.github.io/sdcomayagua/admin.html y recargá con **Ctrl + F5**. Entrá con tu PIN y probá **Buscar ficha** con marca y modelo exactos. Alternativamente, pegá el nombre del artículo existente en la pestaña `FICHA RAPIDA!B3` y verificá su propuesta en las celdas.

## Cómo trabaja

En ADMIN la búsqueda muestra coincidencias para elegir. **Usar este resultado** lee esa página y busca el mismo modelo en otras fuentes. Los productos genéricos pueden completarse desde la fuente elegida. Las fichas de FICHA RAPIDA conservan el modo de coincidencia oficial exacta.

- Usa consultas básicas de Tavily y Gemini sin Google Search integrado. Las cuentas y sus cuotas se administran en cada proveedor.
- Para la selección nueva actualizá **Code.gs y FichaGratis.gs**, y publicá una nueva versión de la implementación existente. La guía [ACTIVAR_BUSQUEDA_PRODUCTOS.md](ACTIVAR_BUSQUEDA_PRODUCTOS.md) explica la comprobación.
- El modelo se puede cambiar con `GC_FREE_GEMINI_MODEL`. No hace falta configurar esa propiedad para usar el predeterminado.
- No cambia precios, costos, stock, descuentos ni reglas de pago. Ofrece fotos para agregar manualmente, sin sustituir las existentes.
- Guarda solo al tocar **Guardar y actualizar tienda** o **GUARDAR EN INVENTARIO** en Sheets. Revisá la variante y las fuentes antes de publicar.
- Si una página no permite lectura completa, puede usar su fragmento e informa la limitación. Lo que no se confirma queda vacío.

Los planes gratuitos tienen límites y condiciones de uso. Comprobá el plan de tus cuentas antes de crear claves; el código no modifica la facturación de esos proveedores.
