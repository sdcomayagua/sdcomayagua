"""Páginas estáticas SEO de artículos activos, desde el catálogo PÚBLICO.
No lee costos, clientes, finanzas, DNI, PIN ni cuentas.
"""
from __future__ import annotations
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://sdcomayagua.github.io/sdcomayagua/'
ALLOWED_IMG = re.compile(r'^assets/catalog/[0-9a-f]{24}\.(webp|jpg|jpeg|png|gif)$', re.I)
ID_SAFE = re.compile(r'^[a-zA-Z0-9_-]{1,90}$')

def path_for(product):
    value = str(product.get('id', '')).strip()
    return (value if ID_SAFE.fullmatch(value) else hashlib.sha256(value.encode()).hexdigest()[:24]) + '.html'

def text(value, limit=190):
    return re.sub(r'\s+', ' ', str(value or '')).strip()[:limit]

def photo_for(product, manifest):
    entry = (manifest.get('images') or {}).get(product['id'], {})
    original = text(product.get('image', ''), 2000)
    if isinstance(entry, dict) and entry.get('source') == original:
        local = entry.get('path', '')
        if isinstance(local, str) and ALLOWED_IMG.fullmatch(local) and (ROOT / local).is_file():
            return DOMAIN + local
    return DOMAIN + 'assets/img/logo-rojo.webp'

def page(product, manifest):
    name = text(product.get('name', ''), 150)
    category = text(product.get('category', ''), 100)
    description = text(product.get('description', ''), 280)
    if not description:
        description = 'Consultá disponibilidad, detalles y precio de este artículo en Gamer Comayagua.'
    title = name + ' | Gamer Comayagua'
    url = DOMAIN + 'producto/' + path_for(product)
    link = DOMAIN + 'productos.html?producto=' + quote(str(product['id']))
    image = photo_for(product, manifest)
    stock = int(float(product.get('stock') or 0))
    price = float(product.get('price') or 0)
    promo = float(product.get('promoPrice') or 0)
    price = promo if 0 < promo <= price else price
    price_text = 'L ' + ('{:,.2f}'.format(price)).rstrip('0').rstrip('.')
    available = stock > 0
    availability = 'https://schema.org/InStock' if available else 'https://schema.org/OutOfStock'
    schema = {'@context':'https://schema.org','@type':'Product','name':name,'description':description,
      'image':[image],'sku':text(product.get('code',''),100),
      'offers':{'@type':'Offer','url':link,'priceCurrency':'HNL','price':str(price),
                'availability':availability,'itemCondition':'https://schema.org/NewCondition',
                'seller':{'@type':'Organization','name':'Gamer Comayagua'}}}
    ld = json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')
    e = lambda v: html.escape(str(v), quote=True)
    status = 'Disponible · confirmá existencias' if available else 'Agotado · consultá por reposición'
    button = 'Ver disponibilidad y comprar' if available else 'Consultar reposición'
    return f'''<!doctype html>
<html lang="es-HN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="product">
<meta property="og:locale" content="es_HN">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:image" content="{e(image)}">
<script type="application/ld+json">{ld}</script>
<title>{e(title)}</title>
<link rel="icon" href="../assets/img/logo-rojo.webp" type="image/webp">
<style>
:root{{color-scheme:light}}*{{box-sizing:border-box}}body{{margin:0;font:16px/1.6 system-ui,Arial,sans-serif;background:#f4f7fb;color:#19344e}}.wrap{{max-width:1060px;margin:auto;padding:20px}}header{{background:#fff;border-bottom:1px solid #dce5ee}}header .wrap{{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}}a{{color:#145da4}}header a{{font-weight:750;text-decoration:none}}main{{margin:34px auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:35px;align-items:center}}img{{width:100%;max-height:550px;object-fit:contain;background:#fff;border:1px solid #e0e6ed;border-radius:18px;padding:18px}}.copy{{background:#fff;border:1px solid #e0e6ed;border-radius:18px;padding:clamp(18px,4vw,32px)}}.category{{color:#51748d;font-size:13px;font-weight:800;text-transform:uppercase}}h1{{font-size:clamp(26px,3.8vw,44px);line-height:1.15;margin:8px 0 20px}}.price{{font-size:30px;font-weight:850;color:#173c60;margin:0}}.status{{font-size:14px;color:#56748c}}.btn{{display:block;text-align:center;background:#f22f45;color:white;border-radius:11px;text-decoration:none;padding:15px 12px;font-weight:800;margin-top:25px}}.fine{{color:#6b7d90;font-size:12px}}@media(max-width:720px){{main{{grid-template-columns:1fr;gap:16px;margin:14px auto}}.wrap{{padding:14px}}}}
</style>
</head>
<body><header><div class="wrap"><a href="../index.html">GAMER COMAYAGUA</a><nav><a href="../productos.html">Productos</a> · <a href="../pagos.html">Pagos y envíos</a></nav></div></header>
<main class="wrap"><img src="{e(image)}" alt="{e(name)}" loading="eager">
<section class="copy"><p class="category">{e(category)}</p><h1>{e(name)}</h1><p class="price">{e(price_text)}</p><p class="status">{e(status)}</p><p>{e(description)}</p><a class="btn" href="{e(link)}">{e(button)}</a><p class="fine">Precios y existencias sujetos a confirmación. Pedidos atendidos por WhatsApp en Honduras.</p></section></main>
</body></html>
'''

def generate(products,manifest,directory, sitemap):
    directory.mkdir(parents=True,exist_ok=True)
    actual=set()
    for p in products:
        if not p.get('active') or not p.get('id') or not p.get('name'):
            continue
        target=directory / path_for(p)
        target.write_text(page(p,manifest),encoding='utf-8')
        actual.add(target.name)
    for old in directory.glob('*.html'):
        if old.name not in actual:old.unlink()
    links=[DOMAIN,DOMAIN+'productos.html',DOMAIN+'pagos.html',DOMAIN+'cuentas.html']+[
        DOMAIN+'producto/'+name for name in sorted(actual)]
    doc='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(
        '<url><loc>'+html.escape(url,quote=True)+'</loc></url>\n' for url in links)+'</urlset>\n'
    sitemap.write_text(doc,encoding='utf-8')
    return len(actual)

if __name__ == '__main__':
    products=json.loads((ROOT/'data/catalogo-respaldo.json').read_text(encoding='utf-8'))
    manifest=json.loads((ROOT/'data/catalogo-fotos.json').read_text(encoding='utf-8'))
    count=generate(products,manifest,ROOT/'producto',ROOT/'sitemap.xml')
    print(f'PASS: {count} páginas de producto estáticas públicas y sitemap generado.')
