# GAMER COMAYAGUA — V2 · 08-10-2026

Sitio para GitHub Pages con tres páginas: Inicio, Productos y Cuentas.

## Actualización de una tienda ya publicada

**Usá el ZIP SOLO_ACTUALIZACION**: no sobreescribe `assets/js/config.js` ni `apps-script/Code.gs` ni `admin.html`, y conserva la URL de Apps Script que hayas pegado.

1. Hacé copia del repositorio de GitHub actual.
2. Descomprimí el ZIP de actualización y subí cada archivo a su misma ruta del repositorio (carpetas incluidas). Si GitHub Pages ya está configurado no hay que crearlo otra vez.
3. No borres `assets/js/config.js` de tu repositorio. Debe seguir con tu URL `/exec` si ya la configuraste.
4. Esperá a que termine GitHub Pages. Abrí la página y actualizá (recarga fuerte si hace falta).
5. La página `cuentas.html` lee la pestaña `Cuentas` de la hoja, siempre que tengas Apps Script configurado. Completá Banco, Titular, Cuenta, Identidad y Visible=SI en cada fila a mostrar.
6. Las fotos originales `assets/products/*.webp` **no venían en el ZIP original**. La lista `FOTOS_PENDIENTES.csv` indica los nombres de los archivos pendientes. Subilos exactamente a `assets/products/` o cambialos por URLs subidas a Drive desde el panel.

## Reglas del anticipo

- Total = productos + L110 de envío + comisión de pagar al recibir.
- Anticipo a depositar = L110 de envío + comisión final.
- Saldo en efectivo al recibir = subtotal de productos después de descuentos.
- Mínimo actual: L350 en productos y dos unidades; todos los artículos deben permitir pago al recibir.
- Cuando los cálculos tengan decimales, el total se lleva al entero siguiente y añade L1 adicional internamente; la comisión mostrada es la diferencia entre total y productos+envío.

**Pruebas**: ejecutá `node tests/test-cart.js` y `node tests/test-api.js` en la copia completa. La subida real de fotos y el permiso para editar no se verifican hasta autorizar Apps Script desde la cuenta administradora.
