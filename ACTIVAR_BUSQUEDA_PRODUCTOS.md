# Buscador de productos y envíos — actualización de octubre 2026

## Lo que cambia

- Buscá por nombre o modelo. Se muestran resultados con título, fragmento y enlace.
- Tocá **Usar este resultado** en el producto correcto. El servidor lee esa página y busca coincidencias del mismo producto.
- También admite artículos genéricos sin modelo de fabricante, como un adaptador OTG. Para estos, los datos técnicos provienen de la fuente que elegiste.
- Completa los campos vacíos de descripción, categoría, color y características confirmadas. Las fotos se ofrecen aparte con **Agregar foto**.
- Cambiar de resultado retira la propuesta anterior y conserva lo que modificaste a mano, incluidas sus unidades. No guarda nada hasta tocar **Guardar y actualizar tienda**.
- Precio, costo, existencias, SKU, promociones, descuentos y condiciones de pago son decisiones del negocio y se mantienen.
- Las medidas, potencias u otros datos ausentes no se inventan ni se copian de artículos simplemente parecidos.

## Activar en el servidor existente

GitHub Pages y Google Apps Script se publican por separado. Actualizar GitHub no modifica el servidor de Google.

1. Abrí tu [inventario](https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit) → **Extensiones → Apps Script**.
2. Reemplazá el contenido de **Code.gs** por [apps-script/Code.gs](apps-script/Code.gs).
3. Reemplazá **FichaGratis.gs** por [apps-script/FichaGratis.gs](apps-script/FichaGratis.gs). Si no existe, crealo con ese nombre. No dupliqués las funciones de Code.gs ni borres EditorMovil.gs o FichaRapida.gs.
4. Conservá tus propiedades privadas del PIN y las claves `GC_FREE_TAVILY_API_KEY` y `GC_FREE_GEMINI_API_KEY`. Si todavía faltan, seguí [la guía de conexión](BUSCADOR_GRATIS_SIN_PAGOS.md). No pegues claves en GitHub ni en el formulario.
5. **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Editá la implementación existente para conservar la URL `/exec`. Conservá su acceso público y la ejecución como propietario; las operaciones administrativas siguen protegidas por PIN.
6. Abrí [ADMIN](https://sdcomayagua.github.io/sdcomayagua/admin.html?v=gc-store-40), recargá con **Ctrl + F5** e ingresá con tu PIN.

El servidor nuevo anuncia versión de búsqueda 4. El panel informa si falta activar la selección. Mientras tanto mantiene las fichas verificadas y las consultas exactas del servidor anterior.

El motor utiliza Tavily para buscar y leer páginas y Gemini para organizar la propuesta. El modelo predeterminado es `gemini-2.5-flash-lite`, configurable con la propiedad privada `GC_FREE_GEMINI_MODEL`. No activa facturación ni cambia automáticamente a otro proveedor; las cuotas y condiciones dependen de las cuentas configuradas.

## Comprobar sin alterar el inventario

1. Abrí un producto genérico como el adaptador OTG y tocá **Buscar ficha**.
2. Elegí una coincidencia, revisá la descripción y los campos resaltados en verde.
3. Probá elegir otro resultado: los datos propuestos anteriormente deben retirarse; los escritos a mano se conservan.
4. Revisá modelo, conectores, color, unidades y fuente. Agregá fotos solo si corresponden a tu artículo.
5. Guardá y comprobá **Ver ficha en tienda**. Los costos siguen siendo privados.

## Envíos

La página **Pagos y envíos** incluye una calculadora que comparte las reglas del carrito: tarifa de envío, mínimo por importe, comisiones y anticipo. Los importes se actualizan desde Configuracion cuando responde Google. Los datos opcionales de destino se incluyen en la cotización de WhatsApp y en su impresión.

Se conserva el anticipo vigente de **envío + comisión**, con el valor de los productos en efectivo al recibir. Cuando hay fracción, el total sube al siguiente entero y se suma L 1 adicional: L 374.50 → L 376. Los totales que ya son enteros se conservan; el ajuste queda integrado al total. La tarifa actual de respaldo es L 110 y el mínimo para pagar al recibir es L 350 en productos, sujeto a permisos por artículo.
