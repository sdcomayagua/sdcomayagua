# Buscador de productos y envíos — actualización de octubre 2026

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
4. Conservá tus propiedades privadas del PIN y las claves `GC_FREE_TAVILY_API_KEY` y `GC_FREE_GEMINI_API_KEY`. Si todavía faltan, seguí [la guía de conexión](BUSCADOR_GRATIS_SIN_PAGOS.md). No pegues claves en GitHub ni en el formulario.
5. **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Editá la implementación existente para conservar la URL `/exec`. Conservá su acceso público y la ejecución como propietario; las operaciones administrativas siguen protegidas por PIN.
6. Abrí [ADMIN](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-catalog-43), recargá con **Ctrl + F5** e ingresá con tu PIN.

El servidor nuevo anuncia versión de búsqueda 7 y catálogo 2. El panel informa si falta activar la selección, las fotos o el relleno por lotes. Mientras tanto mantiene las fichas verificadas y las consultas exactas del servidor anterior.

El motor utiliza Tavily para buscar y leer páginas y Gemini para organizar la propuesta. El modelo predeterminado es `gemini-2.5-flash-lite`, configurable con la propiedad privada `GC_FREE_GEMINI_MODEL`. No activa facturación ni cambia automáticamente a otro proveedor; las cuotas y condiciones dependen de las cuentas configuradas.

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
