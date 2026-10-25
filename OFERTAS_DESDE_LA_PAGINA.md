# Ofertas desde la página

Entrá a [Admin → Ofertas](https://sdcomayagua.github.io/sdcomayagua/admin.html?seccion=ofertas&v=gc-offers-74) con tu PIN habitual. También hay un acceso rápido **Activar ofertas**. Todo se hace en la página; Google Sheets se actualiza automáticamente.

## Todos los productos

1. Escribí el porcentaje (de 0 a 99, con hasta dos decimales).
2. Elegí **Oferta** o **Solo hoy** y tocá **Revisar precios**.
3. Revisá el precio normal, el precio final exacto y el ahorro de cada producto.
4. Tocá **Activar oferta general** y esperá la confirmación.

Se aplica a los productos publicados actualmente, incluidos los agotados. Las ofertas individuales se conservan, salvo que marques expresamente **Reemplazar también las ofertas individuales**. Los productos nuevos se configuran después de agregarlos.

**Quitar oferta general** prepara una vista previa para devolver esos productos a su precio normal. Confirmá para publicarlo. También podés escribir 0. Las ofertas individuales se conservan.

## Por producto

Buscá y elegí el artículo. Podés escribir un precio exacto en lempiras (por ejemplo, **170**) o un porcentaje. La vista previa muestra el precio final y el ahorro. Elegí el texto y tocá **Guardar oferta individual**.

La oferta se guarda hasta que la cambies o la quites. El texto **Solo hoy** no programa un vencimiento automático. Un precio individual tiene prioridad sobre los próximos descuentos generales.

Para quitarlo, usá **Quitar esta oferta** o **Quitar** en la lista. Vuelve el precio normal y desaparece el texto promocional. La oferta no se vuelve a activar sola.

## Guardado y precios

Los precios normales se conservan. Los descuentos se calculan desde ese precio y se redondean a dos decimales; no se acumulan unos sobre otros. Tienda, ficha, carrito, WhatsApp y catálogo usan la promoción guardada. Los descuentos por cantidad existentes siguen aplicando cuando sean más convenientes.

El guardado utiliza la conexión privada actual. No hace falta entrar a Sheets para usar esta sección. Si el servidor admite `saveOffers`, guarda el lote junto; en las implementaciones anteriores guarda cada producto con `saveProduct`, conservando revisión, costo y existencias. La página muestra el progreso y verifica respuestas perdidas. Un conflicto detiene el guardado y muestra cuántos artículos se confirmaron; sincronizá, revisá y completá los que falten.

Los datos privados y el PIN no se agregan al catálogo público ni a los archivos de este repositorio. Las pruebas usan hojas y productos simulados.
