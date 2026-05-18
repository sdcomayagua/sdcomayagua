# Recursos visuales agregados

Se integraron los recursos del archivo `assets.zip` en la app.

## Logo

Archivos usados:

- `assets/logo-sdc.png`: logo principal en pantalla de carga, barra lateral, barra superior y PWA.
- `assets/logo-sdc-2026.png`: recurso alternativo de marca.
- `assets/logo-sdc-receipt.png`: logo optimizado para recibos y cotizaciones.

## Imágenes predeterminadas de productos

La app ahora muestra automáticamente imágenes SVG por categoría cuando un producto no tiene imagen o cuando la URL de la imagen falla.

Ejemplos:

- Dedales: `assets/categorias/dedales.svg`
- Gamer: `assets/categorias/gamer-movil.svg`
- Audio: `assets/categorias/audio.svg`
- Cables: `assets/categorias/cable.svg`
- Cocina: `assets/categorias/cocina.svg`
- Tecnología: `assets/categorias/tecnologia.svg`
- General: `assets/categorias/general.svg`

No se cambiaron precios ni stock.

## Cómo usarlo

Cuando subas un producto sin imagen, deja el campo `imagen` vacío. El catálogo usará una imagen predeterminada según la categoría o nombre del producto.

Si escribes una URL de imagen y esa URL deja de funcionar, la app cambiará automáticamente a la imagen predeterminada.
