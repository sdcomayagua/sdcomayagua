# Google Apps Script

## Archivo

El código está en:

`apps-script/Code.gs`

## Cómo publicarlo

1. Abre tu Google Sheet.
2. Ve a **Extensiones > Apps Script**.
3. Borra el código de ejemplo.
4. Pega todo el contenido de `Code.gs`.
5. Guarda el proyecto con un nombre como `SD COMAYAGUA POS`.
6. Haz clic en **Implementar > Nueva implementación**.
7. Tipo: **Aplicación web**.
8. Ejecutar como: **Tú**.
9. Quién tiene acceso: **Cualquier usuario con el enlace**.
10. Copia la URL terminada en `/exec`.
11. Pégala en la app, en Configuración.

## Acciones soportadas

- `ping`
- `getProducts`
- `getProduct`
- `upsertProduct`
- `patchProduct`
- `setActive`
- `updateStock`
- `batchUpdateStock`
- `saveSale`
- `saveQuote`
- `getSales`
- `getQuotes`
- `getDashboard`
- `syncInventory`
- `backup`
- `logEvent`

## Prueba rápida

Abre en el navegador:

`TU_URL_EXEC?action=ping`

Debe responder algo similar a:

```json
{"ok":true,"version":"1.0.0","message":"Conexión correcta"}
```
