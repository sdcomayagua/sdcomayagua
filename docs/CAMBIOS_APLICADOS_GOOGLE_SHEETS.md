# Cambios aplicados / recomendados para Google Sheets

## Compatibilidad

No se cambió el Sheet ID obligatorio:

`1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY`

No se renombraron las hojas principales.
No se modificó el orden de las columnas principales de `productos_pos`.

## CAMBIOS OPCIONALES PARA GOOGLE SHEETS

### HOJA: productos_pos

Columnas principales conservadas:

`codigo, nombre, categoria, marca, precio, costo, stock, colores, imagen, galeria, descripcion, promos, activo, updatedAt, json`

Columnas opcionales agregadas al final en la plantilla actualizada:

- inversion_stock
- ganancia_unitaria
- ganancia_proyectada
- estado_stock
- notas
- orden
- fecha_actualizacion
- galeria_extra
- observaciones
- proveedor
- ubicacion
- fecha_creacion
- ultima_venta
- bajo_stock_minimo
- destacado
- etiquetas
- precio_mayoreo
- cantidad_mayoreo

Estas columnas son opcionales. La app funciona aunque no existan. Si no existen, los datos extra se conservan dentro de `json`.

### Fórmulas sugeridas

- `inversion_stock`: `=costo*stock`
- `ganancia_unitaria`: `=precio-costo`
- `ganancia_proyectada`: `=(precio-costo)*stock`
- `estado_stock`: agotado, bajo stock o disponible según stock.

### HOJAS OPCIONALES

- CLIENTES
- RESPALDOS
- HISTORIAL_CAMBIOS
- ERRORES_SYNC
- PROVEEDORES
- CONFIGURACION

### Cómo aplicar sin dañar la plantilla actual

1. Haz una copia de seguridad del Google Sheet.
2. Agrega columnas nuevas solo al final.
3. No borres fórmulas existentes.
4. No renombres hojas principales.
5. Prueba `ping` desde Apps Script.
6. Descarga productos desde la app.
7. Registra un producto de prueba.

### Cómo revertir

1. Elimina solamente las columnas opcionales agregadas al final.
2. Elimina hojas opcionales si no las usarás.
3. Conserva siempre las columnas principales de `productos_pos`.
