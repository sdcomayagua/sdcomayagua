# Actualizar el sistema sin perder datos

1. Exporta respaldo desde la app en Configuración.
2. Descarga una copia del Google Sheet.
3. Reemplaza archivos web nuevos, pero conserva tu `js/config.js` si ya tiene URL de Apps Script configurada.
4. Si actualizas Apps Script, crea una nueva implementación o edita la existente.
5. Copia la nueva URL `/exec` si Google te da una diferente.
6. Entra a Configuración y prueba conexión.
7. Sincroniza.

## Archivos que normalmente puedes editar

- `js/config.js`: datos del negocio y URL Apps Script.
- `css/themes.css`: colores y apariencia.
- `apps-script/Code.gs`: integración Google Sheets.

## Archivos que no conviene tocar sin respaldo

- `js/state.js`
- `js/sync.js`
- `js/sheets.js`
- columnas principales de `productos_pos`
