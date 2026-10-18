# Centro de gestión de GAMER COMAYAGUA

El panel 45 reúne inventario, productos por completar, stock bajo, pedidos y envíos, interesados y publicaciones. Conserva los botones de búsqueda y las reglas actuales del carrito.

## Activación

1. Abrí tu [inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
2. Reemplazá únicamente **Code.gs** por [la versión actualizada](apps-script/Code.gs) y guardá. Si ya tenés la búsqueda con foto, **FichaGratis.gs no necesita cambiar en esta actualización**. Conservá los otros archivos, el PIN y las claves privadas.
3. Elegí **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Usá la implementación existente para mantener la misma URL `/exec` y la ejecución como propietario.
4. Abrí [ADMIN](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-catalog-45), recargá con **Ctrl + F5** e ingresá con tu PIN.

El servidor anuncia **GC-20261018-GESTION-V9**, gestión versión 1 y búsqueda versión 8. Si falta esta implementación, el panel permite revisar pendientes, ordenar fotos y preparar textos; muestra los pasos de activación al entrar a pedidos, interesados o la configuración del aviso de stock.

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
