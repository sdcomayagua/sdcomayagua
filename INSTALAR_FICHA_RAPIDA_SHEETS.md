# FICHA RÁPIDA — agregar características desde Google Sheets

El inventario original **GAMER COMAYAGUA | Inventario WEB 2026 - GitHub Pages** ya tiene una pestaña **FICHA RAPIDA**. Permite pegar el nombre de un artículo existente y guardar sus características técnicas en la misma fila de `Productos`.

## Activación única (necesaria)

1. Abrí el Google Sheets original: https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit
2. Elegí **Extensiones → Apps Script**.
3. Tocá **+ → Secuencia de comandos** y llamá al archivo **FichaRapida**.
4. Copiá **todo el código** de [apps-script/FichaRapida.gs](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/FichaRapida.gs) y pegalo en ese archivo nuevo. Guardá. No borres el `Code.gs` ni el `EditorMovil.gs` existentes.
5. En el selector de funciones elegí **instalarFichaRapida** → **Ejecutar** → autorizá la solicitud de Google. Se crea el activador instalable que procesa los cambios de la hoja, incluidos los que requieren acceso a internet.
6. Regresá a **FICHA RAPIDA**. Pegá el nombre del artículo en **B3** y elegí en **B4** `CARGAR EXISTENTE`, `BUSCAR FICHA` o `GUARDAR EN INVENTARIO`. También podés pegar el **Código** del producto si dos productos tienen nombres idénticos.

No es necesario volver a publicar la implementación web para **instalar el editor de la hoja**. Si además necesitás actualizar la API de la tienda porque tenés un `Code.gs` viejo, guardá su versión actual y publicá **Nueva versión** en la implementación `/exec` existente.

## Cómo se usa

- **Pegar en B3** carga automáticamente lo que ya hay en `Productos`. El código e ID originales se muestran en D3 y D4. Si no se carga, elegí `CARGAR EXISTENTE`.
- **BUSCAR FICHA** propone datos encontrados de fabricantes y manuales, solo si el modelo coincide exactamente. Completa **campos vacíos** y enlaza hasta tres fuentes. **No guarda** automáticamente.
- Revisá medidas, peso, marca, versión y enlaces; borrá cualquier dato que no corresponda. Los vacíos se mantienen vacíos.
- **GUARDAR EN INVENTARIO** actualiza **únicamente** `Descripcion`, `Detalles` y `Revision` de la fila original, identificada por ID. No toca precio, costo, stock, promociones, imágenes, categoría ni formas de pago.
- Para cargar datos **manualmente**, no hace falta configurar ninguna API. Las características se guardan como JSON compatible con el catálogo.

## Búsqueda web: requisito extra

La búsqueda automática necesita que el `Code.gs` del **mismo proyecto de Apps Script** incluya `researchProduct_` y que la propiedad privada `PRODUCT_RESEARCH_API_KEY` tenga una clave de la **API de OpenAI** activa. Una suscripción de ChatGPT no crea automáticamente esa clave; puede haber cargos independientes por uso de la API.

Podés abrir https://platform.openai.com/api-keys para obtener una clave y revisar la facturación de API. Guardá la clave **solo** en **Configuración del proyecto → Propiedades de secuencia de comandos**. **No** la compartás por chat, ni la guardés en celdas de Sheets ni en GitHub.

Si la conexión no existe, **BUSCAR FICHA** mostrará el error correspondiente y conservará los datos que ya ingresaste. `CARGAR EXISTENTE` y `GUARDAR EN INVENTARIO` siguen disponibles.

## Sin clave de API

Podés pegar el nombre del producto en un chat con ChatGPT y pedir que investigue fuentes oficiales y actualice la fila correspondiente del Google Sheets conectado. Ese proceso es bajo solicitud y **no significa** que la búsqueda automática de Sheets esté habilitada.

## Precauciones

- No es posible deducir el peso, el tamaño o los voltajes de un artículo genérico solamente por su nombre. Si hay varias versiones, usá el modelo exacto de la caja.
- No se guarda una búsqueda ambigua. Si el estado indica `REVISAR`, confirmá el modelo antes de introducir manualmente su ficha.
- Los datos aparecerán en la tienda cuando su versión desplegada lea la columna `Detalles` de la hoja. GitHub Pages puede usar un respaldo antiguo: actualizá `Code.gs` y el respaldo si corresponde.
- El inventario completo y los costos deben seguir **privados**. No compartás la hoja de Productos públicamente.
