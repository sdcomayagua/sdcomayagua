# Reparar el acceso del panel (GitHub Pages + Google Apps Script)

## Causa
El panel en GitHub Pages usa la URL `/exec` configurada en `assets/js/config.js`. Un navegador sin sesión de Google debe poder solicitar `?action=health&callback=gcConnection`. Si Google exige iniciar sesión, el panel no puede recibir la respuesta, aunque el PIN sea correcto. Publicar código en GitHub **no cambia** los permisos de Apps Script.

## Reparación en Google (solo la cuenta dueña puede hacerlo)
1. Abrí tu hoja de inventario desde el botón del panel. Elegí **Extensiones → Apps Script**. Verificá que sea el proyecto conectado a esa hoja.
2. Verificá que estés en el proyecto Apps Script que realmente usa el panel. No hace falta reemplazar el código solo para cambiar el permiso de acceso. Si querés utilizar el diagnóstico JSON legible actualizado, copiá el `apps-script/Code.gs` del repositorio, guardá y publicá una nueva versión. **Los archivos del repositorio no se sincronizan automáticamente con Apps Script**.
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, asegurate de tener `ADMIN_PIN` con tu PIN secreto de seis números; el código también admite `ADMIN_TOKEN`. **No subas este número a GitHub ni lo pegues en el código.**
4. Elegí **Implementar → Administrar implementaciones**, seleccioná la implementación de tipo **Aplicación web** que corresponde a la URL existente y tocá **Editar** (lápiz).
5. Seleccioná **Ejecutar como: Yo (propietario de la implementación)** y **Quién tiene acceso: Cualquier persona** (también personas sin iniciar sesión). No elijas una opción que exija cuenta Google. Si aparece la selección de versión, elegí **Nueva versión** y luego **Implementar**. Autorizá los permisos solicitados con tu cuenta de propietario.
6. Copiá la URL final que termine en `/exec`. Si editaste la implementación original, normalmente conserva la URL. Si cambió, reemplazá solo `apiUrl` en `assets/js/config.js`, guardá en GitHub y esperá que Pages publique.
7. En una ventana de incógnito (sin sesión Google), abrí la URL `/exec?action=health&callback=gcConnection`. Debe mostrar texto como `gcConnection({"ok":true,"version":"...","pinConfigurado":true});`, **sin pedir iniciar sesión**. Si actualizaste `Code.gs`, también podés probar `/exec?action=health`, que devuelve JSON legible. Si falta `pinConfigurado`, configurá la propiedad privada. Si muestra HTML de login o una página de error, aún no está bien implementada.
8. Volvé al panel de GitHub Pages, recargá (Ctrl+F5), tocá **Comprobar otra vez** e ingresá tu PIN.

## Importante
- No hagas pública la hoja de Google Sheets ni compartas sus permisos para arreglar el panel. Solo hacé pública la ejecución de la **aplicación web**. Las operaciones administrativas siguen comprobando el PIN en el servidor.
- No compartas el PIN, tokens ni claves de acceso en GitHub.
- Si tu organización Google Workspace no ofrece acceso anónimo, su administrador puede restringir implementaciones públicas. En ese caso la corrección depende de la política de Workspace o de usar un proyecto con permisos compatibles.
- Si en incógnito funciona `/exec?action=health&callback=gcConnection` pero guardar falla, revisá la implementación de `doPost` y las autorizaciones de Sheets/Drive. El catálogo se puede seguir actualizando directamente desde la hoja.
- Los archivos `apps-script/*.gs` del repositorio son una copia del código: publicar cambios en GitHub **no los ejecuta en Google**; es necesario guardar y desplegar una nueva versión en Apps Script.

Referencia oficial: https://developers.google.com/apps-script/guides/web
