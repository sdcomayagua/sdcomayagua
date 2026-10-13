# FICHA RÁPIDA — agregar características desde Google Sheets

El inventario original **GAMER COMAYAGUA | Inventario WEB 2026 - GitHub Pages** ya tiene una pestaña **FICHA RAPIDA**. Permite pegar el nombre de un artículo existente y guardar sus características técnicas en la misma fila de `Productos`.

## Activación única (necesaria)

1. Abrí el Google Sheets original: https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit
2. Elegí **Extensiones → Apps Script**.
3. Tocá **+ → Secuencia de comandos** y llamá al archivo **FichaRapida**.
4. Copiá **todo el código** de [apps-script/FichaRapida.gs](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/FichaRapida.gs) y pegalo en ese archivo nuevo. Guardá. No borres el `Code.gs` ni el `EditorMovil.gs` existentes.
5. En el selector de funciones elegí **instalarFichaRapida** → **Ejecutar**. Si Google ya autorizó el proyecto, es normal que no vuelva a preguntar permisos. La nueva versión de `FichaRapida.gs` activa la **búsqueda al pegar el nombre**.
6. Para habilitar búsquedas, comprobá que el mismo proyecto tenga la versión actualizada de [`Code.gs`](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs), que contiene `researchProduct_`. Si no la tiene, primero guardá una copia de tu código y actualizalo sin cambiar tus propiedades privadas/PIN.
7. En [OpenAI Platform → API keys](https://platform.openai.com/api-keys), creá una clave de un proyecto de API con saldo. La API se factura **por uso**, separadamente de ChatGPT Plus. Configurá avisos y límites de gasto del proyecto.
8. En Apps Script, abrí **Configuración del proyecto (engranaje) → Propiedades de secuencia de comandos → Añadir propiedad**. Nombre: `PRODUCT_RESEARCH_API_KEY`. Valor: tu clave secreta. **Guardar propiedades**. No guardés la clave en GitHub, las celdas de Sheets, ni en un chat.
9. Ejecutá `comprobarConexionFichaRapida` en Apps Script: escribe el estado en `FICHA RAPIDA!B5` **sin llamar a OpenAI ni generar cargos**.
10. Regresá a **FICHA RAPIDA**. Pegá el nombre de un producto existente y específico en **B3**. La búsqueda se intentará automáticamente si ya está todo configurado; los datos encontrados se proponen sin reemplazar los valores existentes. En **B4** están `BUSCAR FICHA` (reintentar), `CARGAR EXISTENTE`, `GUARDAR EN INVENTARIO` y `LIMPIAR`.

No es necesario volver a publicar la implementación web para **instalar el editor de la hoja**. Si además necesitás actualizar la API de la tienda porque tenés un `Code.gs` viejo, guardá su versión actual y publicá **Nueva versión** en la implementación `/exec` existente.

## Cómo se usa

- **Pegar en B3** carga lo que ya hay en `Productos` y, si la conexión está activada, intenta automáticamente una consulta al fabricante. El código e ID originales se muestran en D3 y D4. No escribe datos investigados en el inventario hasta que apruebes con `GUARDAR EN INVENTARIO`.
- **BUSCAR FICHA** permite repetir una búsqueda manualmente. Solo completa **campos vacíos** y enlaza hasta tres fuentes. Un caché evita volver a cobrar la misma consulta automática durante las próximas seis horas, salvo que elijas BUSCAR FICHA manualmente.
- Revisá medidas, peso, marca, versión y enlaces; borrá cualquier dato que no corresponda. Los vacíos se mantienen vacíos.
- **GUARDAR EN INVENTARIO** actualiza **únicamente** `Descripcion`, `Detalles` y `Revision` de la fila original, identificada por ID. No toca precio, costo, stock, promociones, imágenes, categoría ni formas de pago.
- Para cargar datos **manualmente**, no hace falta configurar ninguna API. Las características se guardan como JSON compatible con el catálogo.

## Búsqueda web: requisito extra

La búsqueda automática necesita que el `Code.gs` del **mismo proyecto de Apps Script** incluya `researchProduct_` y que la propiedad privada `PRODUCT_RESEARCH_API_KEY` tenga una clave de la **API de OpenAI** activa. La consulta se realiza automáticamente al pegar el nombre en B3; si querés desactivar la búsqueda automática sin perder la manual, añadí la propiedad privada `FICHA_RAPIDA_BUSQUEDA_AUTOMATICA` con valor `NO`. Una suscripción de ChatGPT no crea automáticamente esa clave; puede haber cargos independientes por uso de la API.

Podés abrir https://platform.openai.com/api-keys para obtener una clave y revisar la facturación de API. Guardá la clave **solo** en **Configuración del proyecto → Propiedades de secuencia de comandos**. **No** la compartás por chat, ni la guardés en celdas de Sheets ni en GitHub.

Si la conexión no existe, al pegar el nombre se cargarán los datos guardados y la hoja explicará qué falta; **BUSCAR FICHA** mostrará el error correspondiente y conservará los datos que ya ingresaste. `CARGAR EXISTENTE` y `GUARDAR EN INVENTARIO` siguen disponibles.

## Sin clave de API

Podés pegar el nombre del producto en un chat con ChatGPT y pedir que investigue fuentes oficiales y actualice la fila correspondiente del Google Sheets conectado. Ese proceso es bajo solicitud y **no significa** que la búsqueda automática de Sheets esté habilitada.

## Precauciones

- No es posible deducir el peso, el tamaño o los voltajes de un artículo genérico solamente por su nombre. Si hay varias versiones, usá el modelo exacto de la caja.
- No se guarda una búsqueda ambigua. Si el estado indica `REVISAR`, confirmá el modelo antes de introducir manualmente su ficha.
- Los datos aparecerán en la tienda cuando su versión desplegada lea la columna `Detalles` de la hoja. GitHub Pages puede usar un respaldo antiguo: actualizá `Code.gs` y el respaldo si corresponde.
- El inventario completo y los costos deben seguir **privados**. No compartás la hoja de Productos públicamente.
