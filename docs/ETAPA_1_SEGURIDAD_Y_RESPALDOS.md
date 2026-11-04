# Gamer Comayagua · Etapa 1 — Seguridad y confianza

**Entorno de trabajo:** `desarrollo-4-etapas-2026-11-04`.  
**Producción:** `main` de GitHub Pages y el inventario original de Google Sheets.  
**Estado:** pruebas y revisión antes de fusionar.

## Punto de restauración verificado (4 de noviembre de 2026)

- Rama GitHub inmutable por convención: `respaldo-2026-11-04-antes-4-etapas`.
- Commit exacto de origen: `90b9cc3f0cc4e1f7baf38671ac3d1e96872f934d`.
- Inventario: copia privada nativa de Google Sheets creada en la carpeta de respaldos del propietario. **14 pestañas** verificadas. El ID privado de la copia no se publica en este repositorio.
- Fotografías: copias de los **102 IDs de Drive distintos** referenciados en la hoja original, comprobadas en la carpeta privada de respaldos. **No** reemplazan las fotos originales ni sus permisos. Algunas copias duplicadas también están presentes.
- Limitación: no hay respaldo independiente verificado de la **versión desplegada** del proyecto Google Apps Script; el repositorio incluye los archivos fuente `apps-script/*.gs`, que podrían no coincidir con la versión activa.

## Primeros cambios de esta etapa

1. **Auditoría de fichas:** filtros de fotos faltantes, una sola foto, texto genérico o ausente, características técnicas, categorías imprecisas, precios/promociones y stock.
2. **Exportación CSV:** reporte descargable solo dentro del Admin autenticado. Omite costos, datos de clientes, credenciales y neutraliza fórmulas de hoja de cálculo.
3. **Comunicaciones del Admin:** verificar el origen **y** la ventana del iframe que devuelve cada respuesta de Apps Script, sin modificar el protocolo del servidor.
4. **Pruebas:** CI comprueba el modelo independiente y el Admin en escritorio/celular.

## Riesgos pendientes de seguridad

**No desactivar permisos ni tocar Apps Script sin verificar la ruta de lectura de la tienda.** En la última comprobación, el Google Sheet original estaba compartido como `anyone: writer`. Debe retirarse ese permiso, preferentemente sustituyéndolo por acceso restringido a las personas autorizadas. Verificar previamente la API pública de solo lectura y el respaldo local de GitHub Pages.

**PIN en el navegador:** la sesión actual de 10 minutos almacena temporalmente el PIN. La solución definitiva requiere que Apps Script emita un **identificador de sesión aleatorio**, ligado al servidor, con caducidad de 10 minutos e invalidación al cerrar sesión. No reemplazar de inmediato el protocolo cliente hasta haber versionado, publicado y probado el servidor; de lo contrario se bloquearía el administrador.

**Fotografías:** las copias del repositorio permiten mejorar la descarga y los catálogos, pero todavía falta inspeccionar fotos y corregir descripciones manualmente. La auditoría no inventa fotografías, precios ni especificaciones.

## Restauración segura

- **Código:** crear una rama temporal desde `respaldo-2026-11-04-antes-4-etapas`, comparar los cambios, probar y abrir una PR de reversión. Nunca forzar `main` si los datos públicos ya cambiaron.
- **Inventario:** abrir la copia privada en Drive y comparar fecha, IDs, categorías y pestañas. Restaurar celdas específicas o duplicar a un libro nuevo; **no** sobrescribir automáticamente el original ni reemplazar Apps Script vinculado sin reconciliar altas recientes.
- **Fotos:** restaurar por ID desde la carpeta privada solo si se perdió un original, comprobando su dueño y permisos. No transformar la carpeta de respaldo en una carpeta pública.
- **Apps Script:** confirmar el número de implementación activo y guardar una copia de la versión actual antes de cualquier actualización.

Este documento es operativo; no contiene PIN, tokens, contraseñas ni URLs de respaldos privados.
