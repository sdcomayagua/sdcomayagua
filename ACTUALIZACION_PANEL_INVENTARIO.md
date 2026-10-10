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
