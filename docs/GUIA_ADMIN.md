# Guía de administración · Gamer Comayagua

Estas guías reúnen las instrucciones de conexión, inventario y funciones del panel. El código y los datos de la tienda conservan sus rutas.

## Índice

- [ACTIVAR BUSQUEDA PRODUCTOS](#activar-busqueda-productos)
- [ACTIVAR GESTION](#activar-gestion)
- [ACTUALIZACION PANEL INVENTARIO](#actualizacion-panel-inventario)
- [BUSCADOR GRATIS SIN PAGOS](#buscador-gratis-sin-pagos)
- [BUSCADOR MODELOS Y FOTOS](#buscador-modelos-y-fotos)
- [CODIGOS Y FOTOS](#codigos-y-fotos)
- [FINANZAS PRIVADAS](#finanzas-privadas)
- [INSTALAR FICHA RAPIDA SHEETS](#instalar-ficha-rapida-sheets)
- [INVENTARIO MEJORADO](#inventario-mejorado)
- [MEJORAS CELULAR Y PC](#mejoras-celular-y-pc)
- [MEJORAS PANEL Y BORRADORES](#mejoras-panel-y-borradores)
- [OFERTAS DESDE LA PAGINA](#ofertas-desde-la-pagina)
- [SOLUCION ACCESO GOOGLE](#solucion-acceso-google)
- [VENTAS Y ENTRADAS](#ventas-y-entradas)

## ACTIVAR BUSQUEDA PRODUCTOS

# Buscador de productos y envíos — actualización de octubre 2026

El nuevo **Centro de gestión** (pendientes, stock, pedidos, interesados y publicaciones) se activa con [estos pasos](#activar-gestion). Si ya tenés la búsqueda con foto, esta actualización de gestión requiere cambiar solo Code.gs.

## Lo que cambia

- TikTok, YouTube, Facebook, Instagram y páginas de videos se excluyen. Si una página bloquea la lectura completa, se conserva el fragmento que ya contiene atributos.
- Buscá por nombre o modelo. Se muestran resultados con título, fragmento y enlace.
- Tocá **Usar este resultado** en el producto correcto. El servidor lee esa página y busca coincidencias del mismo producto.
- También admite artículos genéricos sin modelo de fabricante, como un adaptador OTG. Para estos, los datos técnicos provienen de la fuente que elegiste.
- Completa los campos vacíos de descripción, categoría, color y características confirmadas. Las fotos se ofrecen aparte con **Copiar al producto**. El botón importa la imagen a tu alojamiento para no depender de un enlace externo que pueda bloquearse.
- **Buscar fotos en la web**, dentro de Fotos del producto, permite elegir una página y copiar imágenes aunque no exista ficha técnica. No completa ni reemplaza las características. Si ya tenés una foto principal, las copias se agregan a la galería.
- Una propuesta nueva válida reemplaza la propuesta anterior y conserva los campos escritos a mano. Cambiar el texto de búsqueda o el nombre ya no borra los campos completados. No se guarda nada hasta tocar **Guardar y actualizar tienda**.
- Precio, costo, existencias, SKU, promociones, descuentos y condiciones de pago son decisiones del negocio y se mantienen.
- Las medidas, potencias u otros datos ausentes no se inventan ni se copian de artículos simplemente parecidos.

## Activar en el servidor existente

GitHub Pages y Google Apps Script se publican por separado. Actualizar GitHub no modifica el servidor de Google.

1. Abrí tu [inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
2. Reemplazá el contenido de **Code.gs** por [apps-script/Code.gs](apps-script/Code.gs).
3. Reemplazá **FichaGratis.gs** por [apps-script/FichaGratis.gs](apps-script/FichaGratis.gs). Si no existe, crealo con ese nombre. No dupliqués las funciones de Code.gs ni borres EditorMovil.gs o FichaRapida.gs.
4. Conservá tus propiedades privadas del PIN y las claves `GC_FREE_TAVILY_API_KEY` y `GC_FREE_GEMINI_API_KEY`. Si todavía faltan, seguí [la guía de conexión](#buscador-gratis-sin-pagos). No pegues claves en GitHub ni en el formulario.
5. **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Editá la implementación existente para conservar la URL `/exec`. Conservá su acceso público y la ejecución como propietario; las operaciones administrativas siguen protegidas por PIN.
6. Abrí [ADMIN](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-catalog-47) e ingresá con tu PIN. Si tenías abierta la ventana de búsqueda, tocá **Comprobar activación**: ya no hace falta salir del producto para reconocer la nueva versión.

El servidor nuevo anuncia versión de búsqueda 8 y catálogo 2. El panel informa si falta activar la selección, las fotos, el relleno por lotes o la búsqueda con referencia. Mientras tanto mantiene las funciones compatibles del servidor anterior.

### Si «Buscar con mi foto» no pasa del aviso de activación

Ese aviso significa que la versión de Google consultada no confirma la función; la búsqueda todavía no comenzó. Verificá **FichaGratis.gs además de Code.gs**, dentro del mismo proyecto. Después de guardarlos, publicá **Nueva versión** desde el lápiz de la implementación existente. Guardar archivos sin publicar no cambia la versión que usa la tienda.

Al abrir **Buscar con mi foto**, el panel vuelve a comprobar una activación que antes faltaba. También podés tocar **Comprobar activación** sin cerrar la ventana: si Google ya confirma la función, continúa la búsqueda de ese producto conservando el texto escrito. Si sigue faltando, muestra los pasos y enlaces a ambos archivos; si falla la conexión, permite reintentar. La comprobación no copia ni guarda imágenes; revisá las propuestas antes de aprobarlas.

El motor utiliza Tavily para buscar y leer páginas y Gemini para organizar la propuesta. El modelo predeterminado es `gemini-3.5-flash-lite`, configurable con la propiedad privada `GC_FREE_GEMINI_MODEL`. No activa facturación ni cambia automáticamente a otro proveedor; las cuotas y condiciones dependen de las cuentas configuradas.

### Si Gemini devuelve HTTP 404

El 404 indica que el modelo consultado no está disponible para esa cuenta o versión de la API. No debe confundirse con una clave incorrecta (401/403) ni con una cuota agotada (429). Google limita el acceso a los modelos 2.5 en proyectos nuevos: [documentación oficial](https://ai.google.dev/gemini-api/docs/deprecations/).

En el proyecto propietario podés ejecutar **actualizarModeloBuscador**. Primero prueba una respuesta JSON con `gemini-3.5-flash-lite`; solo cuando responde correctamente actualiza `GC_FREE_GEMINI_MODEL`. Conserva el PIN y las claves privadas y no activa facturación. Si la prueba falla, conserva el modelo anterior. La propiedad se consulta en cada búsqueda: actualizarla surte efecto en la implementación existente sin tener que copiar archivos nuevamente. El nuevo manejo de errores se incluye al publicar una nueva versión del código.

## Comprobar sin alterar el inventario

1. Abrí un producto genérico como el adaptador OTG y tocá **Buscar ficha**.
2. Elegí una coincidencia, revisá la descripción y los campos resaltados en verde.
3. Probá elegir otro resultado: solo se reemplazan propuestas cuando la nueva fuente devuelve información confirmada. Cambiar la consulta conserva los campos para poder guardarlos.
4. Revisá modelo, conectores, color, unidades y fuente. Agregá fotos solo si corresponden a tu artículo.
5. Guardá y comprobá **Ver ficha en tienda**. Los costos siguen siendo privados.

## Rellenar fotos e información de forma masiva

Los botones **Rellenar fotos** y **Rellenar información** aparecen encima de la lista de productos de ADMIN.

1. Marcá los artículos que querés consultar. **Seleccionar visibles** permite incluir todos los del filtro actual; podés desmarcar cualquiera. La selección no guarda cambios.
2. Tocá **Buscar propuestas**. Se procesa un artículo por solicitud, con avance y opción de detener después del actual. Las propuestas se conservan en esta ventana mientras seguís revisando.
3. En **Fotos**, elegí las imágenes por artículo. **Buscar más fotos** consulta otras opciones y conserva las que ya elegiste, incluso si son de páginas distintas. **Elegir primera foto de cada artículo** es opcional; podés revisar y cambiar esas selecciones.
4. En **Información**, compará la fuente y elegí qué campos completar en cada artículo. Solo se ofrecen campos vacíos con evidencia. Podés desmarcar campos o el artículo completo. **Comparar otra fuente** y **Volver a buscar** actualizan un solo artículo.
5. Marcá los artículos que aprobás o usá **Marcar propuestas listas**. Tocá **Guardar seleccionados** para aplicar el lote revisado.

El guardado vuelve a leer el inventario y escribe únicamente descripción, color, características o fotos aprobadas. Conserva precios, promociones, costos, stock, descuentos y condiciones comerciales, incluidos los cambios que se hagan mientras revisás. Las fotos nuevas se agregan a la galería; una imagen principal existente se conserva, salvo que marques **Usar la primera foto elegida como principal** en ese artículo. La foto anterior queda en la galería. Máximo diez fotos por artículo.

Después de guardar un artículo, **Preparar de nuevo** permite consultar otra propuesta para ese mismo artículo.

Si falla una fuente o una foto, los demás artículos pueden continuar. Al reintentar se omiten los artículos guardados y se reutilizan las fotos ya copiadas. Si se agota una cuota o Google deja de responder, el lote se detiene y muestra el motivo. No cambia de proveedor ni activa un servicio de pago.

Las propuestas y las copias preparadas se guardan temporalmente hasta seis horas; la caché de Google puede vencer antes. Si una propuesta ya no está disponible, volvé a buscar ese artículo y revisalo nuevamente. La ventana de revisión se conserva al cerrarla y volver a abrirla en esta misma página; recargar la página descarta esa revisión pendiente.

Para activar estas funciones actualizá **Code.gs y FichaGratis.gs** con los pasos anteriores. No hay un tercer archivo que instalar en Apps Script.

## Buscar otras fotos usando la imagen que ya subiste

1. Guardá el producto con su nombre y al menos una foto real. En la fila del inventario o en **Editar → Fotos del producto**, tocá **Buscar con mi foto**.
2. El servidor lee los bytes de tu foto con Gemini para identificar textos y rasgos visibles. Busca imágenes reales con Tavily y compara cada candidata con la referencia: modelo, variante, color, botones, conectores y forma. No genera ni modifica fotografías.
3. Se ofrecen únicamente las coincidencias visuales de confianza alta. Las imágenes de otro modelo, las dudosas y las duplicadas se descartan. La comparación automática puede equivocarse: revisá las imágenes antes de copiarlas; una apariencia parecida no garantiza identidad exacta.
4. En **Cuántas querés copiar**, elegí la cantidad y tocá **Elegir hasta N fotos** o marcá las imágenes manualmente. Podés quitar cualquiera y combinar imágenes de búsquedas distintas, hasta el espacio disponible (diez fotos en total).
5. **Buscar más fotos** cambia la consulta y los sitios, omite las fotos vistas en esta revisión y conserva las elegidas. No vuelve a completar con las anteriores si no encuentra coincidencias nuevas. Si hay varias fotos propias, podés elegir otra como referencia; ese cambio requiere revisar nuevamente la selección.
6. Desde el inventario, **Guardar seleccionados** agrega las fotos aprobadas y conserva la principal. Desde el editor, **Copiar al formulario** agrega las fotos a la ficha abierta: cerrá la revisión y tocá **Guardar y actualizar tienda** para publicarlas. Conserva la descripción y los demás cambios que estés preparando.

En **Rellenar fotos** también podés marcar **Usar mi foto como referencia** para los artículos elegidos que ya tengan una. El filtro **Con una sola foto** ayuda a encontrar los que necesitan más vistas. La opción se puede usar por artículo sin aplicarla a todo el lote.

Se usan las mismas claves privadas de Gemini y Tavily. La referencia se envía a Gemini para compararla; esta modalidad consume más consultas que una búsqueda solo por nombre. Los errores de cuota se muestran y detienen el lote. Si cambiás el nombre o quitás la referencia antes de copiar, volvé a buscar con los datos actuales.

Esta mejora requiere **reemplazar nuevamente Code.gs y FichaGratis.gs y publicar Nueva versión** de la implementación existente. El panel 44 funciona con el servidor anterior para las tareas que ya estaban activadas; el botón de referencia muestra los pasos de actualización hasta que Google anuncie la nueva función.

## Envíos

La página **Pagos y envíos** incluye una calculadora que comparte las reglas del carrito: tarifa de envío, mínimo por importe, comisiones y anticipo. Los importes se actualizan desde Configuracion cuando responde Google. Los datos opcionales de destino se incluyen en la cotización de WhatsApp y en su impresión.

Se conserva el anticipo vigente de **envío + comisión**, con el valor de los productos en efectivo al recibir. Cuando hay fracción, el total sube al siguiente entero y se suma L 1 adicional: L 374.50 → L 376. Los totales que ya son enteros se conservan; el ajuste queda integrado al total. La tarifa actual de respaldo es L 110 y el mínimo para pagar al recibir es L 350 en productos, sujeto a permisos por artículo.

## Más recientes y Más pedidos

- El catálogo abre en **Más recientes**. Los registros nuevos guardan fecha de creación; los antiguos usan su posición de registro como respaldo, sin inventar fechas.
- En ADMIN cada fila tiene **☆ Más pedidos**. Tocala para marcar o quitar el producto; se guarda únicamente esa selección y conserva precio, costo y existencias.
- Las marcas se almacenan en `Productos!MasPedidos` y se muestran en una franja compacta arriba del catálogo y en el filtro **Más pedidos**. La categoría original del producto se conserva.
- Code.gs agrega las columnas `MasPedidos` y `FechaCreacion` al final cuando se necesitan. No hay que mover columnas ni editar fórmulas.
- La tienda y el sincronizador dan prioridad al catálogo completo del servidor nuevo. Una lectura vieja de la pestaña pública no reemplaza sus características, fotos ni marcas.
- Al ingresar con PIN, el servidor agrega **MasPedidos** y **FechaCreacion** a las columnas Q:R de **CATALOGO PUBLICO WEB**, con búsqueda por ID. Conserva su QUERY y verifica los encabezados antes de escribir. Así las estrellas también llegan por la hoja pública cuando Google bloquea el acceso anónimo de `/exec`.
- El panel incluye filtros **Sin foto**, **Más pedidos** y **Agotados**, con contadores de fotos pendientes y estrellas.

### Si el panel muestra la estrella y la tienda aparece vacía

La lectura antigua del catálogo público no incluía las marcas, y la tienda descartaba el canal POST cuando la hoja respondía. Esta versión consulta POST aunque la hoja responda y conserva las marcas del respaldo si falta la columna pública. El enfriador MEMO CX16 PRO marcado en la captura está incluido en el respaldo.

Después de desplegar esta versión de Code.gs, ingresá al panel una vez para habilitar las dos columnas públicas. El sincronizador también las conserva en la copia de GitHub Pages; no hace falta compartir la pestaña privada Productos ni mover sus columnas.

Para estas funciones reemplazá **los dos archivos del paso 2 y 3** y publicá una nueva versión. El PIN, las claves y la URL `/exec` se conservan.


## ACTIVAR GESTION

# Centro de gestión de GAMER COMAYAGUA

El panel 48 reúne inventario, productos por completar, stock bajo, pedidos y envíos, interesados y publicaciones. Conserva los botones de búsqueda y las reglas actuales del carrito.

## Activación

1. Abrí tu [inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
2. Reemplazá únicamente **Code.gs** por [la versión actualizada](apps-script/Code.gs) y guardá. Si ya tenés la búsqueda con foto, **FichaGratis.gs no necesita cambiar en esta actualización**. Conservá los otros archivos, el PIN y las claves privadas.
3. Elegí **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Usá la implementación existente para mantener la misma URL `/exec` y la ejecución como propietario.
4. Abrí [ADMIN](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-catalog-48), recargá con **Ctrl + F5** e ingresá con tu PIN.

El servidor anuncia **GC-20261019-INVENTARIO-V10**, gestión versión 2 y búsqueda versión 8. Si falta esta implementación, el panel permite revisar pendientes, ordenar fotos y preparar textos; muestra los pasos de activación al entrar a pedidos, interesados o la configuración del aviso de stock.

Al guardar el primer pedido o interesado, el servidor crea automáticamente en tu Drive el archivo **GAMER COMAYAGUA · Gestión privada**, con acceso restringido. Los pedidos se guardan en **GC_PEDIDOS** y las solicitudes en **GC_INTERESADOS**, fuera del archivo que alimenta el catálogo público. Después aparece **Abrir gestión privada** en ADMIN. No hace falta crear ni compartir pestañas manualmente.

La propiedad privada `GC_MANAGEMENT_SHEET_ID` conserva el vínculo con ese archivo entre actualizaciones. Conservála junto con el PIN y las claves. El archivo de gestión se mantiene restringido y no se publica en la web. El servidor comprueba su acceso general antes de consultar o guardar registros. Si Google solicita permisos adicionales al propietario, autorizalos desde tu propio proyecto de Apps Script y volvé a probar.

## Productos por completar

La vista **Por completar** reúne artículos sin foto, descripción, categoría definida o características. Los filtros permiten revisar cada caso por separado. **Con una sola foto** facilita encontrar productos para usar **Buscar más fotos**. Los botones abren el editor del artículo o el buscador por referencia que ya tenés.

Las características siguen siendo opcionales: la lista ayuda a revisar la calidad de las fichas, no obliga a inventar información. **Rellenar fotos por lotes** abre la revisión masiva existente.

## Ordenar la galería

En **Editar → Fotos del producto**, usá **Arrastrar** para mover una foto con ratón o con el dedo. También podés tocar las flechas bajo cada imagen o enfocar el control y usar las flechas del teclado, Inicio y Fin. La primera foto es la principal; las demás mantienen el orden que elegiste.

Los movimientos cambian el formulario. Tocá **Guardar y actualizar tienda** para publicarlos. Se conserva el límite de diez fotos y el contenido de cada imagen.

## Stock bajo

El aviso inicial aparece cuando quedan **tres unidades o menos**, excluyendo agotados. Podés guardar otro nivel desde esta vista. El nivel se comparte entre tus navegadores mediante el servidor; cero deja únicamente la revisión de agotados en su filtro correspondiente.

Los filtros muestran **Stock bajo**, **Agotados** o ambos. Los artículos ocultos se identifican para que también puedas revisar su reposición. Los avisos son visuales en ADMIN: no envían mensajes ni modifican existencias.

## Pedidos y envíos

1. Tocá **Registrar pedido** y completá nombre y celular. Agregá ciudad y dirección cuando correspondan.
2. Elegí los artículos y cantidades. El precio unitario se sugiere con la promoción o descuento por cantidad; podés ajustar el precio acordado.
3. Elegí la forma de pago, el envío y cuánto dinero recibiste realmente. El panel muestra productos, comisión, total, anticipo sugerido y saldo pendiente.
4. Guardá el pedido como **Pendiente**, **Confirmado**, **Enviado**, **Entregado** o **Cancelado**. Para marcarlo enviado, indicá empresa o **Entrega local**. La guía es opcional cuando el servicio no utiliza una.
5. Buscá por cliente, celular, número de pedido o guía. **Abrir WhatsApp** prepara un resumen para ese cliente; vos revisás y enviás el mensaje en WhatsApp.

El cálculo usa las mismas reglas que el carrito: envío configurable (respaldo L 110), mínimo por importe y permisos por producto para pagar al recibir, comisiones configuradas y redondeo al siguiente entero más L 1 únicamente cuando hay fracción. Se registra el dinero recibido, no se lo da por pagado al cambiar de estado. Cada pedido conserva las tarifas con las que se creó para que una actualización posterior de la tienda no cambie sus importes al editar una guía.

**Registrar o cambiar el estado de un pedido no descuenta ni repone stock automáticamente.** Actualizá el inventario cuando confirmés la salida o devolución del producto. Las notas del pedido son privadas y no se incluyen en el mensaje de WhatsApp.

Los reintentos reutilizan el identificador del pedido para evitar duplicarlo si se pierde una respuesta. Si el registro cambió en otro navegador, el servidor conserva la versión actual y te pide sincronizar; el formulario mantiene tus datos hasta que decidás cerrar o corregir.

## Interesados en productos agotados

**Anotar interesado** guarda nombre, celular, ciudad, producto, cantidad y notas. También admite un artículo que todavía no existe en el catálogo. Evita duplicar una solicitud pendiente para el mismo número y artículo, aunque el número se escriba con espacios o con `+504`.

El filtro **Listos para avisar** muestra solicitudes pendientes cuando el producto vuelve a tener stock. **Abrir WhatsApp** prepara el mensaje; no marca al cliente como contactado por abrirlo. Usá **Marcar contactado** después de enviar tu mensaje. Desde Editar podés marcar la solicitud resuelta o cancelada.

Los pedidos e interesados tienen búsqueda, filtros y paginación; no se recorta silenciosamente el historial a los últimos registros. No se guardan datos de clientes en el almacenamiento local del navegador ni se incluyen en el catálogo público.

## Publicaciones

Elegí un producto y **WhatsApp**, **Facebook / Marketplace** o **TikTok**. **Preparar texto** usa el nombre, precio por unidad, características escritas, existencias, envío configurado y enlace público del producto. **Otra versión** cambia la presentación sin inventar características.

El texto queda editable. Cambiar la red o el producto no borra lo que escribiste: tocá Preparar texto cuando quieras generar otro borrador. **Copiar texto** lo pasa al portapapeles; si el navegador no lo permite, lo selecciona para copiar manualmente.

No consulta un servicio de IA, no consume cuotas de búsqueda, no publica automáticamente y no incluye costos internos. Los artículos agotados se identifican como agotados. Revisá disponibilidad y redacción antes de publicarlo.

## Verificación técnica

Las pruebas de servidor usan hojas en memoria y un PIN ficticio. Comprueban privacidad, archivo separado restringido, versiones concurrentes, reintentos sin duplicados, cálculos iguales al carrito, conservación del inventario, interesados, reposición, filtros y páginas. Las pruebas de navegador cubren las seis mejoras, el arrastre nativo y táctil, teclado, copia de texto, formularios, reintentos y móvil. Las pruebas no crean archivos ni escriben en tus cuentas de Google.

## Ventas, entradas y duplicados

La versión 48 agrega tres secciones. Consultá [Ventas y entradas](#ventas-y-entradas) para registrar salidas con descuento de stock, recibir mercancía con costo opcional y comparar posibles duplicados. Los pedidos anteriores mantienen su seguimiento independiente: una venta se confirma expresamente en Ventas.


## ACTUALIZACION PANEL INVENTARIO

# Actualización del panel de inventario — octubre 2026

## Ya aplicado
- GitHub Pages: panel con campos Precio, Precio promoción, Costo, Stock, Colores y Texto de promoción.
- El panel consulta primero el catálogo por POST autenticado (acción `adminCatalog`); si la implementación antigua no reconoce la acción, muestra temporalmente el respaldo público SIN COSTOS. No presenta el respaldo como sincronización en tiempo real.
- `apps-script/Code.gs`: funciones privadas de lectura/guardado por encabezados; `apps-script/EditorMovil.gs`: edición por encabezados.
- Actualización de `data/catalogo-respaldo.json` desde la pestaña CATALOGO PUBLICO WEB; el archivo público no contiene costos ni información bancaria.
- Hoja **VISTA PRODUCTOS** (de consulta) en Google Sheets: Precio → Precio Promoción → Costo → Stock.

## Paso pendiente: publicar en Apps Script
Los archivos `.gs` de GitHub no modifican automáticamente el proyecto de Google.

1. Abrí tu hoja de inventario → Extensiones → Apps Script.
2. Reemplazá el contenido del archivo Code.gs por el archivo completo de GitHub:
   https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs
3. Reemplazá el contenido del archivo EditorMovil.gs por el de:
   https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/EditorMovil.gs
4. Guardá el proyecto. Entrá a Implementar → Administrar implementaciones → editá la implementación web actual → Nueva versión → Implementar.
5. Conservá **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona** en la implementación web. El PIN sigue en Script Properties: no lo subas a GitHub.
6. Actualizá el panel (Ctrl+F5). El estado debe indicar **Inventario actualizado desde Google Sheets.** Verificá que tenga 58 registros (56 activos en el respaldo al 10 de octubre de 2026).

## Último paso: mover la columna real con seguridad
No muevas la columna P de **Productos** hasta haber publicado **ambos** archivos `.gs`, porque el código viejo escribe posiciones fijas y podría mezclar Precio, Costo y Stock. La vista ya muestra el orden solicitado sin modificar la base.

Después de desplegar el código nuevo, podés solicitar que se mueva la columna original usando Google Sheets, o hacerlo manualmente:
- En la pestaña Productos, desplazá **PrecioPromocion** de P a F, a la derecha de Precio.
- Confirmá: A ID, B Codigo, C Nombre, D Categoria, E Precio, F PrecioPromocion, G Costo, H Stock, I Imagen, J Galeria, K Descripcion, L Descuentos, M PagoAlRecibir, N Activo, O Revision, P Colores, Q PromocionTexto.
- Actualizá el QUERY de **CATALOGO PUBLICO WEB** a:
  `=QUERY(Productos!A1:Q501;"select A,B,C,D,E,H,I,J,K,L,M,N,P,F,Q where A is not null";1)`
- Actualizá la fórmula de A1 en **VISTA PRODUCTOS** a:
  `=QUERY(Productos!A1:Q501;"select A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q where A is not null label F 'Precio Promoción'";1)`
- Confirmá que los nombres de productos, precio, precio promoción, costo y stock siguen asociados correctamente. Probá cambiar un producto en EDITOR MOVIL y volver a cargarlo.

Los QUERY contienen letras literales y **no se ajustan automáticamente** al mover columnas; es imprescindible actualizar ambas fórmulas. Las fórmulas normales de Sheets que referencian celdas suelen reajustarse al mover columnas.

## Prueba de funcionamiento
- Login con el PIN.
- Panel indica lectura desde Google Sheets en lugar de respaldo.
- Editá solo un producto de prueba y verificá stock, precio, promoción y costo en Productos.
- Confirmá que el precio promocional aparece en tienda, pero el costo **no** aparece público.

**Importante:** no publiques toda la hoja Productos ni abras los permisos del archivo privado. El catálogo público es una pestaña separada sin costos.


## BUSCADOR GRATIS SIN PAGOS

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
- Para la selección nueva actualizá **Code.gs y FichaGratis.gs**, y publicá una nueva versión de la implementación existente. La guía [ACTIVAR_BUSQUEDA_PRODUCTOS.md](#activar-busqueda-productos) explica la comprobación.
- El modelo se puede cambiar con `GC_FREE_GEMINI_MODEL`. No hace falta configurar esa propiedad para usar el predeterminado.
- No cambia precios, costos, stock, descuentos ni reglas de pago. Ofrece fotos para agregar manualmente, sin sustituir las existentes.
- Guarda solo al tocar **Guardar y actualizar tienda** o **GUARDAR EN INVENTARIO** en Sheets. Revisá la variante y las fuentes antes de publicar.
- Si una página no permite lectura completa, puede usar su fragmento e informa la limitación. Lo que no se confirma queda vacío.

Los planes gratuitos tienen límites y condiciones de uso. Comprobá el plan de tus cuentas antes de crear claves; el código no modifica la facturación de esos proveedores.


## BUSCADOR MODELOS Y FOTOS

# Búsqueda por modelo y fotos de producto

El panel omite páginas que no coincidan con el modelo solicitado. Los códigos se buscan entre comillas; por ejemplo, `Hub USB KOS-9044` busca el código exacto `KOS-9044`. La marca y el modelo del formulario completan la consulta automática cuando existen. Los resultados de Google Colab, listas de embarques y modelos con otros números no se ofrecen como fichas.

El hub KOUVOLSEN KOS-9044 tiene una ficha parcial basada en la imagen del empaque enviada por el propietario. No depende de una respuesta de IA ni completa precios o existencias. El dueño revisa los datos propuestos antes de guardarlos.

Cuando una página de producto no entrega fotos mediante el extractor, `FichaGratis.gs` intenta recuperar su galería: Product JSON-LD, Open Graph e imágenes de carga diferida. Se excluyen logos, iconos y productos de otros modelos identificados. Si no hay fotos utilizables, el panel lo informa y permite consultar otra fuente; nunca rellena con resultados ajenos al modelo. Las búsquedas por foto conservan la comparación visual antes de ofrecer las coincidencias.

## Publicación

Los cambios del panel se publican con GitHub Pages. El servicio de Google requiere guardar los archivos actualizados `Code.gs` y `FichaGratis.gs` y publicar una nueva versión de la implementación existente, conservando su URL, propiedades privadas y configuración de acceso. El diagnóstico de esta versión es `GC-20261022-BUSQUEDA-V12`; la verificación privada incluye `exactProductSearch: true` y `photoHtmlFallback: true`.

## Verificación

- `node tests/test-product-search.js`: consultas exactas, resultados irrelevantes del caso KOS-9044, modelos parecidos, variantes, reintento limitado y galería HTML.
- `node tests/test-product-search-ui.js`: ficha del empaque KOS-9044, filtro incluso con un servidor anterior, selección por el ID original del resultado, copia de foto y valores comerciales intactos.
- `node tests/test-selected-research.js`, `node tests/test-reference-photos.js`, `node tests/test-bulk.js` y `node tests/test-free-research.js`: evidencia, selección, importación, fotos por referencia y búsquedas anteriores.


## CODIGOS Y FOTOS

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


## FINANZAS PRIVADAS

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


## INSTALAR FICHA RAPIDA SHEETS

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


## INVENTARIO MEJORADO

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


## MEJORAS CELULAR Y PC

# Interfaz 49 · Celular y PC

Esta actualización cambia los archivos de la página publicados en GitHub Pages. No cambia Apps Script, hojas de cálculo, PIN, claves ni tarifas. Se puede publicar sin iniciar sesión en Google.

## ADMIN

- Accesos directos para buscar productos, revisar fotos, existencias y preparar publicaciones.
- Selector para cambiar de sección, también en celular. El resumen de pendientes se abre cuando lo necesitás.
- Búsqueda por nombre, categoría, código, marca, modelo, compatibilidad, conexión, color y otros datos escritos en la ficha. **Ctrl / ⌘ + K** lleva al buscador cuando no hay otro formulario abierto.
- Filtros para disponibles, agotados, stock de 1 a 3, ocultos, sin foto y Más pedidos; orden por recientes, nombre, menor stock o precio. El contador indica cuántos productos estás viendo.
- Fotos pequeñas, código visible y etiquetas de stock en la lista. Las acciones se organizan en dos columnas; en celular las filas son tarjetas completas.
- El resumen de disponibles, agotados y pago al recibir cuenta solo productos visibles en la tienda.
- El editor pide confirmar antes de descartar cambios. Cancelar conserva la ficha abierta; guardar correctamente la cierra sin esa pregunta. El teclado mantiene el foco dentro del editor.
- La búsqueda dentro de pedidos, ventas y entradas filtra los artículos sin borrar la selección ni las cantidades. En ventas, **Recibí el total** y **Recibí el anticipo sugerido** permiten completar el importe recibido cuando corresponda. El cálculo sigue usando las reglas existentes.

## Catálogo para clientes

**Solo disponibles** permite filtrar los productos agotados. El buscador reconoce marca y modelo guardados en las características. La barra de búsqueda sigue accesible al desplazarse y se coloca debajo del encabezado según su tamaño real.

Compartir el catálogo conserva búsqueda, categoría, orden y disponibilidad. El enlace recrea esos filtros al abrirse. Cuando no hay resultados, **Ver todo el catálogo** limpia la selección.

## Funciones que requieren Google

Esta actualización no activa capacidades nuevas en una implementación anterior de Apps Script. Ventas y entradas conservan la comprobación existente y se señalan como pendientes si Google todavía no anuncia su activación. La búsqueda de fotos también depende de la configuración del buscador. El nuevo diseño conserva los datos y el acceso con PIN que ya utiliza ADMIN.

## Verificación

La prueba `tests/test-experience-ui.js` usa Chromium con Sheets en memoria y datos ficticios. Comprueba filtros, búsqueda por marca/modelo, navegación, protección de fichas sin guardar, teclado, selección de artículos, cobros sugeridos, enlaces compartidos y pantallas de 320, 390, 844, 1280 y 1440 píxeles. También se verifican los flujos anteriores de productos, fotos, pedidos, ventas, entradas y duplicados. Las pruebas no necesitan credenciales de Google ni cambian el inventario real.


## MEJORAS PANEL Y BORRADORES

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


## OFERTAS DESDE LA PAGINA

# Ofertas desde la página

Entrá a [Admin → Ofertas](https://sdcomayagua.github.io/sdcomayagua/admin.html?seccion=ofertas&v=gc-offers-75) con tu PIN habitual. También hay un acceso rápido **Activar ofertas**. Todo se hace en la página; Google Sheets se actualiza automáticamente.

## Todos los productos

1. Escribí el porcentaje (de 0 a 99, con hasta dos decimales).
2. Elegí **Oferta** o **Solo hoy** y tocá **Revisar precios**.
3. Revisá el precio normal, el precio final exacto y el ahorro de cada producto.
4. Tocá **Activar oferta general** y esperá la confirmación.

Se aplica a los productos publicados actualmente, incluidos los agotados. Las ofertas individuales se conservan, salvo que marques expresamente **Reemplazar también las ofertas individuales**. Los productos nuevos se configuran después de agregarlos.

**Quitar oferta general** prepara una vista previa para devolver esos productos a su precio normal. Confirmá para publicarlo. También podés escribir 0. Las ofertas individuales se conservan.

## Por producto

Buscá y elegí el artículo. Podés escribir un precio final en lempiras enteros (por ejemplo, **160**, sin calcular el porcentaje) o un porcentaje. La vista previa muestra el precio final y el ahorro. Elegí el texto y tocá **Guardar oferta individual**.

La oferta se guarda hasta que la cambies o la quites. El texto **Solo hoy** no programa un vencimiento automático. Un precio individual tiene prioridad sobre los próximos descuentos generales.

Para quitarlo, usá **Quitar esta oferta** o **Quitar** en la lista. Vuelve el precio normal y desaparece el texto promocional. La oferta no se vuelve a activar sola.

## Guardado y precios

Los precios normales se conservan. Los descuentos se calculan desde ese precio y el resultado queda en lempiras enteros: las fracciones menores que .60 bajan al entero; desde .60 suben al siguiente lempira. Por ejemplo, L 200.52 queda en L 200 y L 200.89 queda en L 201. Un descuento de 16% sobre L 190 da L 159.60 y se guarda como **L 160**. También podés escribir L 160 directamente. Los descuentos no se acumulan unos sobre otros. Las promociones anteriores con centavos usan esta misma regla en el precio que ve y cotiza el cliente. Tienda, ficha, carrito, WhatsApp y catálogo usan la promoción guardada. Los descuentos por cantidad existentes siguen aplicando cuando sean más convenientes.

El guardado utiliza la conexión privada actual. No hace falta entrar a Sheets para usar esta sección. Si el servidor admite `saveOffers`, guarda el lote junto; en las implementaciones anteriores guarda cada producto con `saveProduct`, conservando revisión, costo y existencias. La página muestra el progreso y verifica respuestas perdidas. Un conflicto detiene el guardado y muestra cuántos artículos se confirmaron; sincronizá, revisá y completá los que falten.

Los datos privados y el PIN no se agregan al catálogo público ni a los archivos de este repositorio. Las pruebas usan hojas y productos simulados.


## SOLUCION ACCESO GOOGLE

# Reparar el acceso del panel (GitHub Pages + Google Apps Script)

## Causa
El panel en GitHub Pages usa la URL `/exec` configurada en `assets/js/config.js`. Un navegador sin sesión de Google debe poder solicitar `?action=health&callback=gcConnection`. Si Google exige iniciar sesión, el panel no puede recibir la respuesta, aunque el PIN sea correcto. Publicar código en GitHub **no cambia** los permisos de Apps Script.

## Reparación en Google (solo la cuenta dueña puede hacerlo)
1. Abrí tu hoja de inventario desde el botón del panel. Elegí **Extensiones → Apps Script**. Verificá que sea el proyecto conectado a esa hoja.
2. Verificá que estés en el proyecto Apps Script que realmente usa el panel. No hace falta reemplazar el código solo para cambiar el permiso de acceso. Si querés utilizar el diagnóstico JSON legible actualizado, copiá el `apps-script/Code.gs` del repositorio, guardá y publicá una nueva versión. **Los archivos del repositorio no se sincronizan automáticamente con Apps Script**.
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, asegurate de tener `ADMIN_PIN` con tu PIN secreto de seis números; el código también admite `ADMIN_TOKEN`. **No subas este número a GitHub ni lo pegues en el código.**
4. Elegí **Implementar → Administrar implementaciones**, seleccioná la implementación de tipo **Aplicación web** que corresponde a la URL existente y tocá **Editar** (lápiz).
5. Seleccioná **Ejecutar como: Yo (propietario de la implementación)** y **Quién tiene acceso: Cualquier persona** (también personas sin iniciar sesión). No elijas una opción que exija cuenta Google. Si aparece la selección de versión, elegí **Nueva versión** y luego **Implementar**. Autorizá los permisos solicitados con tu cuenta de propietario.
6. Copiá la URL final que termine en `/exec`. Si editaste la implementación original, normalmente conserva la URL. Si cambió, reemplazá solo `apiUrl` en `assets/js/config.js`, guardá en GitHub y esperá que Pages publique.
7. En una ventana de incógnito (sin sesión Google), abrí la URL `/exec?action=health&callback=gcConnection`. Debe mostrar texto como `gcConnection({"ok":true,"version":"...","pinConfigurado":true});`, **sin pedir iniciar sesión**. Si actualizaste `Code.gs`, también podés probar `/exec?action=health`, que devuelve JSON legible. Si falta `pinConfigurado`, configurá la propiedad privada. Si muestra HTML de login o una página de error, aún no está bien implementada.
8. Volvé al panel de GitHub Pages, recargá (Ctrl+F5), tocá **Comprobar otra vez** e ingresá tu PIN.

## Importante
- No hagas pública la hoja de Google Sheets ni compartas sus permisos para arreglar el panel. Solo hacé pública la ejecución de la **aplicación web**. Las operaciones administrativas siguen comprobando el PIN en el servidor.
- No compartas el PIN, tokens ni claves de acceso en GitHub.
- Si tu organización Google Workspace no ofrece acceso anónimo, su administrador puede restringir implementaciones públicas. En ese caso la corrección depende de la política de Workspace o de usar un proyecto con permisos compatibles.
- Si en incógnito funciona `/exec?action=health&callback=gcConnection` pero guardar falla, revisá la implementación de `doPost` y las autorizaciones de Sheets/Drive. El catálogo se puede seguir actualizando directamente desde la hoja.
- Los archivos `apps-script/*.gs` del repositorio son una copia del código: publicar cambios en GitHub **no los ejecuta en Google**; es necesario guardar y desplegar una nueva versión en Apps Script.

Referencia oficial: https://developers.google.com/apps-script/guides/web


## VENTAS Y ENTRADAS

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
