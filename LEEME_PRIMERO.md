# GAMER COMAYAGUA · Renovación 2026

Proyecto nuevo para publicar en **GitHub Pages**, diseñado para celulares y computadora, separado del proyecto histórico SD Comayagua/Firebase.

## YA EXISTE TU GOOGLE SHEETS (CREADO EN TU GOOGLE DRIVE)

**GAMER COMAYAGUA | Inventario WEB 2026 - GitHub Pages**

https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit

- Es una **copia independiente** del inventario principal: conserva los 58 registros encontrados, incluidos agotados, sin sobrescribir el original.
- Pestañas: `Productos`, `Configuracion`, `Cuentas`, `Guia`.
- `Productos!L:L` / `PagoAlRecibir`: `SI` o `NO` para cada artículo.
- Configuración actual: **envío L 110**, **mínimo COD L 350**, **mínimo 2 unidades**, **comisión COD 10 %**, **Tigo Money 7 %**.
- L 350 es una decisión provisional porque se solicitó “trescientos y pico”; editá `Configuracion!B4` si tu mínimo definitivo es otro.

## 1. ACTIVAR APPS SCRIPT (NECESARIO PARA AGREGAR / EDITAR PRODUCTOS)

1. Abrí el enlace de Google Sheets anterior.
2. En el menú: **Extensiones → Apps Script**.
3. Borrá el contenido del archivo `Código.gs` que se crea inicialmente y pegá **TODO** el código del archivo `apps-script/Code.gs` de este proyecto.
4. Guardá y seleccioná la función `configurarSistema`; hacé clic en **Ejecutar** y autorizá con tu cuenta. Este proceso crea un `ADMIN_TOKEN` secreto: copiá la clave desde **Registro de ejecución** y guardala en un lugar privado. **No la subás a GitHub, ni la pegues en config.js.**
5. Pulsá **Implementar → Nueva implementación → Tipo Aplicación web**. `Ejecutar como: Yo` y `Quién tiene acceso: Cualquiera` para permitir leer el catálogo y recibir solicitudes autenticadas.
6. Implementá y copiá la URL completa que termina en **`/exec`**.
7. Abrí `assets/js/config.js`, poné esa URL dentro de `apiUrl: 'https://script.google.com/macros/s/.../exec'` y guardá.
8. Cuando cambies el código de Apps Script, publicá una **nueva versión de la implementación**; modificar `Code.gs` sin actualizar el despliegue puede dejar activa la versión anterior.

**Seguridad:** Los visitantes pueden consultar el catálogo público, pero solo la persona que conozca el secreto de Apps Script puede hacer cambios. La clave se verifica en el servidor, no en archivos visibles de GitHub. El formulario de entrada no sustituye las reglas de protección del servidor, que están en `Code.gs`.

## 2. PUBLICAR EN GITHUB PAGES

1. En GitHub, creá un repositorio nuevo, por ejemplo `gamer-comayagua`.
2. Subí **todos los archivos y carpetas que están dentro de** `GAMER_COMAYAGUA_GITHUB_PAGES` (no el ZIP anterior de SD Comayagua).
3. Asegurate de que `index.html` queda en la **raíz**.
4. Abrí **Settings → Pages → Build and deployment**.
5. Elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guardá.
6. Cuando GitHub publique la página, entrá al URL del proyecto. Por ejemplo: `https://TU_USUARIO.github.io/gamer-comayagua/` (reemplazá `TU_USUARIO` con el nombre real; es solo un ejemplo).
7. Para agregar artículos abrí `/admin.html` desde tu página y pegá allí la clave privada de Apps Script.

No es necesario subir los 32 CSS + 28 JS del proyecto anterior. Esta versión contiene un CSS principal, un módulo de cálculo compartido y controladores separados para tienda y administración.

## 3. ADMINISTRAR DESDE CELULAR

- Entrá a `https://TU_USUARIO.github.io/gamer-comayagua/admin.html`.
- Ingresá `ADMIN_TOKEN`. La clave queda solo en la sesión de la pestaña (sessionStorage).
- **Nuevo producto** → nombre, categoría, precio, stock, `Pago al recibir: SI/NO`.
- Para añadir foto: seleccioná archivo de galería o tomá fotografía, tocá **Subir foto** y después **Guardar producto**. Hasta 2 MB, formatos JPG/PNG/WEBP/GIF. Google Drive debe permitir enlaces públicos de las fotos. Fotos grandes se comprimen previamente con tu móvil.
- Para editar existencias, precios o descuentos, tocá **Editar** en la lista.
- Al ocultar un producto no se elimina su registro: en Google Sheets queda `Activo = NO` y se puede reactivar cambiando a `SI` en Sheets.
- Las fotos pueden tardar en aparecer por caché de hasta 45 segundos. Recargá o tocá Sincronizar.

## 4. REGLAS ACTUALES DEL CARRITO

- `P` = subtotal de productos tras descuentos aplicables a cantidad.
- Envío fijo: `E = L 110`, sin cargo separado por empaque.
- **Transferencia/depósito:** total `P + E`, sin comisión.
- **Tigo Money:** comisión por defecto de `7 %` calculada sobre `P + E` (editable desde Configuracion). Se muestra el importe en lempiras y el total entero.
- **Pagar al recibir:** solo si `P ≥ L 350`, **al menos 2 unidades**, y **TODOS** los productos elegidos tienen `PagoAlRecibir = SI`. Comisión comercial por defecto `10 %` sobre `P + E`.
- **Anticipo por pagar al recibir: `envío + comisión final`**. Por ejemplo, productos L 800 + envío L 110 + comisión L 91 = total L 1,001, anticipo L 201 y saldo en efectivo L 800. El saldo es el subtotal de los productos después de descuentos.
- Cuando una suma da decimales, el total final se redondea internamente al entero siguiente y se agrega L 1 adicional; no se publica una línea adicional. Si el resultado ya es entero, no se agrega nada.
- Cotizaciones con folio distinto `GC-AAAAMMDD-HHMMSS-XXXXXX`. Descargar imprime un comprobante desde el navegador, que puede guardarse como PDF.
- El sistema crea **cotizaciones**, no procesa cobros ni reserva/descuenta stock automáticamente. Verificá disponibilidad al concretar la venta.

## 5. LOGO TEMPORAL / IDENTIDAD VISUAL

Por ahora el proyecto usa el logo provisional `assets/img/logo-provisional.svg`.

Para cambiarlo después, reemplazá ese archivo (manteniendo el mismo nombre) por tu logo SVG o modificá las referencias de `index.html` y `admin.html` para usar tu PNG. La tienda no requiere modificar cálculos ni Apps Script por cambiar el logo.

## 6. IMPORTANTÍSIMO SOBRE LAS FOTOS ANTIGUAS

En el ZIP recibido **no hay archivos `assets/products/*.webp`**, aunque sí hay rutas de ese tipo guardadas en la hoja de cálculo. Sin embargo, muchas filas del inventario apuntan a esas rutas. Por eso **no podemos restaurar fotografías de esos archivos solamente a partir del ZIP**. El proyecto utiliza un marcador limpio "Gamer Comayagua" cuando la foto no existe. La nueva versión admite esas rutas si colocás de nuevo las fotos dentro de la carpeta `assets/products/` con sus mismos nombres, y también admite fotos HTTPS subidas desde `admin.html` a Google Drive (una vez publicado Apps Script). Las imágenes existentes de Blogger no se incluyen automáticamente en el XML de la plantilla, porque son entradas independientes. Recuperá las fotos desde tu respaldo original o subilas nuevamente y quedarán asociadas en Sheets.

El archivo `FOTOS_PENDIENTES.csv` lista los 29 registros cuyas rutas de imagen apuntan a archivos locales que faltan. La carpeta `assets/products/` viene creada para recuperarlos. El `data/catalogo-respaldo.json` incluye una copia estática de emergencia de los 58 productos/stock/precios leídos de la hoja en esta actualización. **La fuente viva de verdad, una vez configurado el backend, es Google Sheets**.

## 7. CUENTAS BANCARIAS Y NUEVAS PÁGINAS

- `index.html`: portada y 8 productos disponibles de muestra.
- `productos.html`: catálogo completo, búsqueda y filtros.
- `cuentas.html`: sección independiente de transferencias, con copia de datos mediante un toque.

La web tiene página propia `cuentas.html` y botones individuales **Copiar titular, Copiar cuenta y Copiar identidad**. En la pestaña `Cuentas` escribí: `Banco`, `Titular`, `Cuenta`, `Identidad`, `Visible`. Marcá `SI` solo si querés que esos datos se muestren públicamente en el sitio. La hoja recibida solo tenía encabezados, sin números bancarios. **No inventamos cuentas ni identidades.** Hasta que las completés y publiqués Apps Script, la sección ofrecerá consulta por WhatsApp. Solo se mostrarán las filas con `Visible = SI`. **Ojo:** mostrar la identidad implica publicarla para cualquier visitante.

## 8. CAMBIOS Y SEGURIDAD

- No contiene claves antiguas de Firebase ni el PIN del ZIP previo.
- El ZIP anterior contenía una clave PIN dentro de un archivo público: **cambiala si todavía la utilizás en otro sitio**.
- Eliminados parches repetidos, cargas de librerías Excel que no necesita el cliente y conexiones Firebase innecesarias.
- Archivos claros y más fáciles de mantener; no se modificaron tu hoja original ni el repositorio de GitHub.
- Antes de darlo por publicado, probá la sincronización, subida de fotos y permisos después de implementar Apps Script. Estos pasos necesitan autorización desde tu cuenta y no es posible realizarlos solo entregando el ZIP.

### ¿Problemas para agregar productos?

1. Revisá `assets/js/config.js`: `apiUrl` debe contener la **URL /exec** real, no una URL del editor.
2. Asegurate de desplegar Apps Script con **ejecución como vos** y acceso **cualquiera**.
3. Ejecutá `configurarSistema` una vez y usá exactamente la clave generada.
4. Aceptá permisos de Sheets y Drive durante la autorización.
5. Revisá la consola del navegador y el historial de ejecuciones de Apps Script si el servidor no responde.

### Archivos principales

| Archivo | Función |
|---|---|
| `index.html` | Inicio, productos destacados y carrito |
| `productos.html` | Catálogo completo con filtros y búsqueda |
| `cuentas.html` | Cuentas y botones individuales de copia |
| `admin.html` | Panel de inventario móvil/PC |
| `assets/css/site.css` | Toda la apariencia |
| `assets/js/config.js` | URL Apps Script y preferencias públicas |
| `assets/js/core.js` | Cálculos de pagos y validación de modalidades |
| `assets/js/site.js` | Catálogo, filtros, carrito, recibo y WhatsApp |
| `assets/js/admin.js` | Altas, edición, fotos y control COD |
| `apps-script/Code.gs` | API y autenticación real en Google Sheets |
| `data/catalogo-respaldo.json` | Copia visual de emergencia, no cambia stock en tiempo real |
| `tests/test-cart.js` | Pruebas de cantidades, comisiones, mínimos y descuentos |

## 9. ACTUALIZAR GITHUB PAGES

La tienda publicada puede conservar archivos en caché: cargá los nuevos archivos y carpetas (incluidas páginas `productos.html` y `cuentas.html`), esperá a que termine la implementación de GitHub Pages y actualizá la página. No necesitás modificar Apps Script solo por cambiar cálculos del carrito o diseño de la web. **Si todavía estás en el paso 2, terminá primero Apps Script antes de dar por activa la sincronización, subida de fotos y bancos.**
