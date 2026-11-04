# Gamer Comayagua · Activar sesiones seguras de 10 minutos

La actualización de **GitHub Pages no publica Google Apps Script**. Este cambio no elimina el acceso al Admin hasta que el propietario publique la versión correspondiente de `apps-script/Code.gs`.

## Qué se ha preparado

- El PIN privado se valida en Apps Script al iniciar sesión.
- El servidor devuelve un token aleatorio `gc_...` que dura **10 minutos sin solicitudes válidas**. Se guarda el token en el navegador, **no el PIN**.
- La aplicación renueva el acceso mientras se utiliza y envía comprobaciones periódicas; al salir conserva los minutos restantes.
- Cerrar sesión revoca la sesión en la caché del servidor y borra la copia local. Una caída de red puede impedir la revocación remota, pero la copia local se elimina y el token remoto expira a más tardar 10 minutos después de la última petición autorizada.
- El cambio de PIN invalida las sesiones antiguas.
- Las versiones antiguas del servidor continúan funcionando mediante el PIN de seis dígitos. Esto es temporal para evitar bloquear a los administradores durante la migración.

## Activación segura (proyecto privado; no el endpoint público)

1. Comprobá que existe el respaldo previo en Google Drive y la rama de GitHub `respaldo-2026-11-04-antes-4-etapas`.
2. En la hoja original, entrá a **Extensiones → Apps Script** y verificá que corresponde al proyecto que administra la URL privada `/exec` guardada en `assets/js/config.js`.
3. Antes de cambiar código, guardá **una copia del proyecto desplegado actual** o identificá su número de versión en **Implementar → Administrar implementaciones**. El código de GitHub no prueba cuál versión está publicada.
4. Actualizá únicamente el archivo **Code.gs** de ese proyecto privado con [la versión de GitHub](https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs). Conservá los otros archivos y las propiedades privadas del proyecto.
5. Seleccioná **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Editá la implementación **existente**, sin crear otra URL ni cambiar su identidad o los permisos.
6. En el navegador de la tienda, recargá Admin con Ctrl + F5 y entrá con tu PIN una vez.
7. Comprobá que podés salir a Productos, volver al Admin antes de 10 minutos y seguir editando sin volver a ingresar el PIN.
8. Verificá que al cerrar sesión no se restablezca el acceso, incluso si actualizás la página.

Para confirmar la migración sin revelar credenciales: abrí Herramientas de desarrollador → Aplicación → Almacenamiento local. La entrada `gc_admin_session_v1` debe contener un token que **empiece por `gc_`**, y no tu PIN de seis dígitos. No copies ni compartas el token.

## Protección más estricta (opcional después de comprobar todo)

En las propiedades privadas de Apps Script, podés establecer `GC_REQUIRE_SESSION=SI`. Así, el servidor deja de aceptar el PIN como credencial para operaciones ordinarias: únicamente lo acepta para iniciar sesión (`verify`). **No actives esta opción antes de confirmar que el nuevo código y el Admin de GitHub están desplegados y funcionando.**

## Si hay problemas

- No borres la implementación ni edites el proyecto público de solo lectura.
- Restaurá la versión anterior desde **Administrar implementaciones → Editar → Versión anterior** y recargá la tienda.
- Si el acceso falla después de 10 minutos, ingresá el PIN. El token no debe durar indefinidamente.
- La seguridad de la hoja es **independiente**: si la hoja original todavía permite `anyone:writer`, revocá ese permiso en **Compartir → Acceso general**. La conexión de Google Drive actualmente disponible no admite revocar permisos desde este chat.

## Qué no cambia

No se modifican productos, fotos, pedidos, precios, costos, datos bancarios ni el PIN almacenado en las propiedades privadas. El cliente web y el servidor fueron diseñados para admitir la transición, pero **no debemos dar por activas las sesiones de servidor hasta completar el despliegue de Apps Script y probarlo de verdad**.
