# Activar las descargas protegidas de Gamer Comayagua

Las mejoras de GitHub Pages ya están en la rama `main`, pero **Google Apps Script no se actualiza automáticamente** al modificar GitHub.

## Antes de comenzar
- Iniciá sesión con la cuenta propietaria de la hoja de inventario.
- Abrí la hoja: https://docs.google.com/spreadsheets/d/1ReprTmtpBpoxIps-c5O-0quUmYgdHSePGIpB2Ey-rQ0/edit
- Entrá en **Extensiones → Apps Script**, en el proyecto ya conectado con la tienda.
- **No creés una implementación nueva** ni borres los archivos auxiliares (`FichaGratis.gs`, `EditorMovil.gs`, etc.). Conservá los permisos y propiedades del proyecto.

## Actualizar el archivo
1. En el repositorio abrí [apps-script/Code.gs](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs).
2. Copiá el contenido completo y reemplazá **solo** `Code.gs` del proyecto correcto de Apps Script.
3. Guardá. No pongás el PIN en el código: debe permanecer en las propiedades privadas del proyecto.
4. En **Implementar → Administrar implementaciones**, seleccioná la implementación actual de administración que termina en `/exec`.
5. Tocá **Editar** (lápiz), seleccioná **Nueva versión** y luego **Implementar**. Esto actualiza la versión sin cambiar la URL que usa GitHub Pages.
6. Si administrás una implementación **separada, de solo lectura**, comprobá que su código y la constante `GC_PUBLIC_READ_ONLY = true` sigan correspondiendo a esa implementación; nunca copiés la versión privada al endpoint público sin revisar sus permisos.

## Comprobar
1. Abrí https://sdcomayagua.github.io/sdcomayagua/admin.html e ingresá con tu PIN.
2. Sincronizá y buscá un artículo con varias fotografías de Drive.
3. Probá **Descargar por artículo**: el ZIP debe incluir JPG con la marca de agua configurada.
4. En https://sdcomayagua.github.io/sdcomayagua/productos.html, abrí la ficha de un producto y probá **Descargar foto**.
5. Si aparece un error de permisos, verificá que la implementación **existente** apunte a la última versión y que el proyecto sea el que controla el endpoint privado.

## Seguridad de Google Sheets
Los conectores autorizados de ChatGPT utilizan los permisos de tu cuenta. No es necesario dejar la hoja con **cualquier persona con el enlace: editor**.
En **Compartir → Acceso general**, cambiá a **Restringido** y conservá el acceso de tu cuenta propietaria y de colaboradores explícitos.

## Comportamiento de las fotografías
- Las originales no se modifican.
- Las imágenes descargadas desde los botones nuevos llevan la marca al generar el JPG.
- Si otra persona usa un enlace directo al original, todavía podría obtener una versión sin marca. Para una protección más completa, los medios publicados deberán ser copias ya marcadas y los originales mantenerse privados.
- El exportador ZIP pone límites de memoria. Si el catálogo es muy grande, usá la descarga por artículo.

**Importante:** no pegues en GitHub contraseñas, PIN ni credenciales privadas de Google.
