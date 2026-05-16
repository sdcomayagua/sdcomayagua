# Errores comunes

## La app dice que falta la URL de Apps Script

Entra a Configuración y pega la URL terminada en `/exec`.

## Google Sheets no responde

Revisa:

- Que la implementación sea Web App.
- Que esté publicada para cualquier usuario con el enlace.
- Que estés usando la URL `/exec`, no `/dev`.
- Que el Sheet ID sea correcto.

## Se guardó localmente pero no en Sheets

Eso es normal si no hay conexión o Apps Script falló. Entra a Sincronización y revisa la cola pendiente.

## No puedo vender un color

Revisa que el producto tenga stock en ese color. Ejemplo válido:

`Negro=5; Azul=2`

## El dashboard no muestra datos

Verifica que las columnas principales existan y que las ventas tengan total numérico.

## La app no instala como PWA

Debe estar servida por HTTPS. Abrir archivos locales no siempre permite instalación PWA completa.
