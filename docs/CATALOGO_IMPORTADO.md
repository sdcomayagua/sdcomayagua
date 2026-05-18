# Catálogo importado

Archivo fuente: `1CATALOGO - 2026 - SDC - inventario.xlsx`

Actualización aplicada:
- Productos importados: 47
- Productos activos: 45
- Productos inactivos conservados: 2
- Stock total conservado: 328
- Valor inventario según precio x stock: Lps. 32,415
- Marcas generadas automáticamente: 29
- Productos sin imagen marcada: 28

## Reglas aplicadas

1. No se cambiaron precios.
2. No se cambió stock.
3. Las marcas vacías se completaron automáticamente según nombre y categoría.
4. Donde faltaba imagen se dejó vacío en la app para que use el placeholder visual.
5. Donde faltaba galería se dejó como `Sin galería` en la plantilla y vacío en la app.
6. Donde faltaban promociones se agregó `Sin promoción` en la plantilla.
7. Donde faltaban colores se generó `General=stock` para mantener compatibilidad con inventario por variante sin cambiar el stock principal.
8. Los datos extra se guardaron dentro de `json` para no romper la plantilla actual.

## Archivos actualizados

- `js/data.js`
- `backups/productos_ejemplo.json`
- `backups/productos_ejemplo.csv`
- `SD_COMAYAGUA_PLANTILLA_CATALOGO_ACTUALIZADA.xlsx`
- Hoja `productos_pos`
- Hoja `CATALOGO_VISTA`
- Hoja `listas_pos`
- Hoja `resumen_pos`
- Hoja `DASHBOARD_POS`

## Nota para usar en Google Sheets

Sube o copia la hoja `productos_pos` de la plantilla actualizada al Google Sheet real si deseas reemplazar el inventario actual.
No cambies el `SHEET_ID`; se mantiene el mismo dentro del sistema.
