# Google Sheets

## Hojas compatibles

La app mantiene compatibilidad con estas hojas:

- productos_pos
- cotizaciones_pos
- ventas_pos
- ajustes_pos
- logs_pos
- listas_pos
- resumen_pos
- CONTROL_POS
- DASHBOARD_POS
- CATALOGO_VISTA
- SUBIR_PRODUCTO

También puede usar hojas opcionales si existen:

- CONFIGURACION
- CLIENTES
- RESPALDOS
- HISTORIAL_CAMBIOS
- ERRORES_SYNC
- PROVEEDORES

## Columnas principales de productos

No mover, eliminar ni renombrar:

1. codigo
2. nombre
3. categoria
4. marca
5. precio
6. costo
7. stock
8. colores
9. imagen
10. galeria
11. descripcion
12. promos
13. activo
14. updatedAt
15. json

## Regla para cambios nuevos

Toda columna nueva debe agregarse al final. Si no deseas tocar la plantilla, guarda datos extra dentro del campo `json`.

## Formato de colores

Formato recomendado:

`Negro=5; Rojo=3; Azul=2`

La app también intenta entender:

- `Negro:5, Rojo:3`
- `Negro 5; Rojo 3`
