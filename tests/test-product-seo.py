import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('product_seo', root / 'scripts/build_product_pages.py')
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)
data = json.loads((root / 'data/catalogo-respaldo.json').read_text(encoding='utf-8'))
manifest = json.loads((root / 'data/catalogo-fotos.json').read_text(encoding='utf-8'))
with TemporaryDirectory() as temp:
    tmp = Path(temp)
    total = seo.generate(data, manifest, tmp/'producto', tmp/'sitemap.xml')
    expected = sum(bool(x.get('active') and x.get('id') and x.get('name')) for x in data)
    assert total == expected, f'{total} páginas generadas, {expected} esperadas'
    xml = (tmp/'sitemap.xml').read_text(encoding='utf-8')
    assert xml.count('<loc>') == total+4
    assert 'admin.html' not in xml
    assert 'cuentas.html' in xml
    for item in data:
        if not item.get('active'): continue
        page = (tmp/'producto'/seo.path_for(item)).read_text(encoding='utf-8')
        assert 'https://schema.org' in page
        assert 'priceCurrency' in page
        assert 'application/ld+json' in page
        assert 'canonical' in page
        assert 'Costo unitario' not in page and 'admin.html' not in page
    sample = {'id':'XSS-01','name':'<script>alert("h")</script>','description':'<img src=x onerror=alert(1)>','price':100,'promoPrice':0,'stock':2,'code':'SKU','category':'Adaptador','active':True}
    html = seo.page(sample, {'images':{}})
    assert '&lt;script&gt;' in html
    assert '&lt;img' in html
    assert '<script>alert("h")</script>' not in html
    assert 'https://schema.org/InStock' in html
    assert html.count('<script') == 1  # JSON-LD legítimo, nunca código arbitrario
print(f'PASS SEO: {expected} fichas estáticas, sitemap y escape contra XSS.')
