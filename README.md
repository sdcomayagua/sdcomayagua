# SD COMAYAGUA - Dashboard POS Final Pro

Paquete completo para GitHub Pages + Google Sheets + Apps Script.

## Cambios importantes de esta versión

- Logo oficial SD COMAYAGUA aplicado.
- Encabezado limpio, sin textos largos que estorban.
- Sección **Agregar / editar productos** separada del catálogo.
- Tarjetas de productos rediseñadas para celular y laptop.
- Barra inferior móvil más compacta.
- Cotización visual tipo factura gamer.
- Exportación de cotización a:
  - Imprimir / Guardar PDF
  - Descargar imagen PNG
- Sincronización con Google Sheets.
- Plantilla `.xlsx` incluida.

## Archivos nuevos agregados

Sí se agregaron archivos nuevos:

```text
assets/css/print.css
assets/js/export.js
assets/img/logo-sdc-2026.png
```

Se mantienen y actualizan:

```text
assets/css/style.css
assets/js/app.js
apps-script/Code.gs
index.html
```

## Estructura

```text
sd-pos-dashboard-final-pro/
├── index.html
├── README.md
├── apps-script/
│   └── Code.gs
├── google-sheets/
│   └── plantilla_sd_comayagua_google_sheets_final_pro.xlsx
└── assets/
    ├── css/
    │   ├── style.css
    │   └── print.css
    ├── js/
    │   ├── app.js
    │   └── export.js
    └── img/
        ├── logo-sdc-2026.png
        └── placeholder.svg
```

---

# Paso a paso para instalar

## 1. Subir Google Sheets

1. Entre a Google Drive.
2. Suba el archivo:

```text
google-sheets/plantilla_sd_comayagua_google_sheets_final_pro.xlsx
```

3. Ábralo con Google Sheets.
4. Revise que existan estas hojas:

```text
productos_pos
facturas_pos
ajustes_pos
logs_pos
listas
```

5. Copie el ID del Google Sheet.

El ID está en la URL:

```text
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
```

Copie solo lo que está entre `/d/` y `/edit`.

---

## 2. Configurar Apps Script

1. En el Google Sheet, vaya a:

```text
Extensiones > Apps Script
```

2. Borre cualquier código que aparezca.
3. Pegue todo el contenido de:

```text
apps-script/Code.gs
```

4. Busque esta línea:

```javascript
const SHEET_ID = "PEGUE_AQUI_EL_ID_DE_SU_GOOGLE_SHEET";
```

5. Reemplace por su ID real:

```javascript
const SHEET_ID = "SU_ID_REAL_AQUI";
```

6. Guarde.

---

## 3. Ejecutar setup()

1. En Apps Script, seleccione la función:

```text
setup
```

2. Presione **Ejecutar**.
3. Autorice permisos.
4. Verifique que no salga error.

---

## 4. Implementar como Web App

1. Clic en **Implementar**.
2. Clic en **Nueva implementación**.
3. Tipo: **Aplicación web**.
4. Configure:

```text
Ejecutar como: Yo
Quién tiene acceso: Cualquier usuario con el enlace
```

5. Presione **Implementar**.
6. Copie la URL que termina en:

```text
/exec
```

---

## 5. Pegar URL en la página

Abra:

```text
assets/js/app.js
```

Busque:

```javascript
appsScriptUrl: "",
```

Pegue su URL de Apps Script:

```javascript
appsScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",
```

No cambie la clave si no la cambiará también en `Code.gs`:

```javascript
apiKey: "SDC_POS_2026",
```

En `Code.gs` debe coincidir con:

```javascript
const API_KEY = "SDC_POS_2026";
```

---

## 6. Probar antes de subir a GitHub

1. Abra `index.html`.
2. Toque **Sincronizar**.
3. Revise que carguen los productos.
4. Vaya a **Productos**.
5. Agregue un producto al POS.
6. Vaya a **POS / Cotización**.
7. Complete datos del cliente.
8. Toque **Guardar cotización**.
9. Toque **Actualizar vista**.
10. Pruebe:
    - **Imprimir / Guardar PDF**
    - **Descargar imagen**

---

## 7. Subir a GitHub Pages

Suba al repositorio estos archivos y carpetas:

```text
index.html
README.md
apps-script/
assets/
google-sheets/
```

La estructura debe quedar en la raíz del repositorio.

Luego:

1. Entre al repositorio en GitHub.
2. Vaya a:

```text
Settings > Pages
```

3. Source:

```text
Deploy from a branch
```

4. Branch:

```text
main
```

5. Folder:

```text
/root
```

6. Guarde.

---

## 8. Prueba final

En celular y laptop:

1. Abra la URL de GitHub Pages.
2. Toque **Sincronizar**.
3. Agregue un producto desde **Admin**.
4. Sincronice en el otro dispositivo.
5. Cree una cotización.
6. Guárdela.
7. Verifique en Google Sheets la hoja:

```text
facturas_pos
```

---

## Nota de seguridad

No suba contraseñas, cuentas bancarias completas, llaves privadas ni datos sensibles dentro del código.
La `apiKey` es una barrera básica, no seguridad bancaria.


---

## Corrección visual de botones gamer premium

Esta versión corrige los botones que se veían demasiado básicos o verdes.

Cambios:

- WhatsApp ya no domina en verde.
- Botones estilo metálico azul eléctrico / cian.
- Botones más compactos.
- Barra de navegación más gamer.
- Botón Descargar imagen con estilo plateado/cromado.
- Mejor visual en celular.
- Se mantiene la estructura de archivos.

No se agregaron archivos nuevos en esta corrección. Solo se actualizó:

```text
assets/css/style.css
```
