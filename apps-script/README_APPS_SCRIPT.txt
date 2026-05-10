SD COMAYAGUA · Conexión Google Sheets

1) Abra Apps Script.
2) Pegue el contenido de Code.gs.
3) Verifique que el SHEET_ID ya esté guardado en CONFIG.
4) Implemente como Aplicación web:
   - Ejecutar como: Yo
   - Quién tiene acceso: Cualquier usuario con el enlace
5) Copie la URL que termina en /exec y péguela en js/data.js, campo webAppUrl, solo si cambia su implementación.

La hoja esperada para productos es: productos_pos.
Columnas soportadas:
id, codigo, nombre, categoria, marca, precio, costo, stock, descripcion, imagen, activo, updatedAt, valor_venta_stock, inversion_stock, ganancia_unitaria, ganancia_proyectada, estado_stock, promos, notas, orden.
