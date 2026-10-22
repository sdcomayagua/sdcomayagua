# Búsqueda por modelo y fotos de producto

El panel omite páginas que no coincidan con el modelo solicitado. Los códigos se buscan entre comillas; por ejemplo, `Hub USB KOS-9044` busca el código exacto `KOS-9044`. La marca y el modelo del formulario completan la consulta automática cuando existen. Los resultados de Google Colab, listas de embarques y modelos con otros números no se ofrecen como fichas.

El hub KOUVOLSEN KOS-9044 tiene una ficha parcial basada en la imagen del empaque enviada por el propietario. No depende de una respuesta de IA ni completa precios o existencias. El dueño revisa los datos propuestos antes de guardarlos.

Cuando una página de producto no entrega fotos mediante el extractor, `FichaGratis.gs` intenta recuperar su galería: Product JSON-LD, Open Graph e imágenes de carga diferida. Se excluyen logos, iconos y productos de otros modelos identificados. Si no hay fotos utilizables, el panel lo informa y permite consultar otra fuente; nunca rellena con resultados ajenos al modelo. Las búsquedas por foto conservan la comparación visual antes de ofrecer las coincidencias.

## Publicación

Los cambios del panel se publican con GitHub Pages. El servicio de Google requiere guardar los archivos actualizados `Code.gs` y `FichaGratis.gs` y publicar una nueva versión de la implementación existente, conservando su URL, propiedades privadas y configuración de acceso. El diagnóstico de esta versión es `GC-20261022-BUSQUEDA-V12`; la verificación privada incluye `exactProductSearch: true` y `photoHtmlFallback: true`.

## Verificación

- `node tests/test-product-search.js`: consultas exactas, resultados irrelevantes del caso KOS-9044, modelos parecidos, variantes, reintento limitado y galería HTML.
- `node tests/test-product-search-ui.js`: ficha del empaque KOS-9044, filtro incluso con un servidor anterior, selección por el ID original del resultado, copia de foto y valores comerciales intactos.
- `node tests/test-selected-research.js`, `node tests/test-reference-photos.js`, `node tests/test-bulk.js` y `node tests/test-free-research.js`: evidencia, selección, importación, fotos por referencia y búsquedas anteriores.
