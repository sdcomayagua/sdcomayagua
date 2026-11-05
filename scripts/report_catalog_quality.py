"""Informe de fichas y fotografías desde el catálogo público (sin datos privados)."""
import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def gallery(value):
    if isinstance(value, list):
        entries = value
    else:
        raw = str(value or '').strip()
        try:
            parsed = json.loads(raw)
            entries = parsed if isinstance(parsed, list) else re.split(r'[\n,;|]', raw)
        except (ValueError, TypeError):
            entries = re.split(r'[\n,;|]', raw)
    return [str(v).strip() for v in entries if str(v).strip()]

def source_valid(value):
    return bool(re.match(r'^(https://|assets/(catalog|products)/)', str(value or '').strip(), flags=re.I))

def local_copy_exists(product, mirrors):
    entry = mirrors.get(str(product.get('id', '')), {})
    if not isinstance(entry, dict):
        return False
    source = str(product.get('image', '')).strip()
    if not source:
        return False
    if entry.get('source') != source:
        return False
    path = str(entry.get('path', ''))
    return bool(re.fullmatch(r'assets/catalog/[a-f0-9]{24}\.(jpg|jpeg|png|webp|gif)', path, flags=re.I) and (ROOT / path).is_file())

def analyze(products, manifest):
    mirrors = manifest.get('images', {}) if isinstance(manifest, dict) else {}
    result = []
    for product in products:
        if not isinstance(product, dict) or product.get('active') is False:
            continue
        name = str(product.get('name', '')).strip()
        code = str(product.get('code', '')).strip()
        photo = str(product.get('image', '')).strip()
        images = [p for p in ([photo] + gallery(product.get('gallery'))) if source_valid(p)]
        desc = str(product.get('description', '')).strip()
        stock = product.get('stock', 0)
        price = product.get('price', 0)
        issues = []
        if not images:
            issues.append('SIN_FOTOGRAFIAS')
        elif not photo:
            issues.append('SIN_FOTO_PRINCIPAL')
        if len(images) == 1:
            issues.append('UNA_FOTOGRAFIA')
        if photo and 'drive.google.com/' in photo and not local_copy_exists(product, mirrors):
            issues.append('SIN_COPIA_LOCAL_DE_FOTO_PRINCIPAL')
        if not desc:
            issues.append('SIN_DESCRIPCION')
        elif len(desc) < 45:
            issues.append('DESCRIPCION_BREVE')
        if not str(product.get('category', '')).strip():
            issues.append('SIN_CATEGORIA')
        try:
            if float(price) <= 0:
                issues.append('PRECIO_NO_VALIDO')
        except (TypeError, ValueError):
            issues.append('PRECIO_NO_VALIDO')
        try:
            if float(stock) <= 0:
                issues.append('SIN_EXISTENCIAS')
        except (TypeError, ValueError):
            issues.append('EXISTENCIAS_INVALIDAS')
        priority = 'ALTA' if any(x in issues for x in ('SIN_FOTOGRAFIAS','PRECIO_NO_VALIDO','EXISTENCIAS_INVALIDAS')) else 'MEDIA' if any(x in issues for x in ('SIN_DESCRIPCION','SIN_FOTO_PRINCIPAL','SIN_COPIA_LOCAL_DE_FOTO_PRINCIPAL')) else 'BAJA' if issues else 'LISTO'
        result.append({'codigo':code,'producto':name,'categoria':str(product.get('category','')).strip(),
            'fotos':len(images),'prioridad':priority,'pendientes':' | '.join(issues)})
    rank={'ALTA':0,'MEDIA':1,'BAJA':2,'LISTO':3}
    return sorted(result,key=lambda x:(rank[x['prioridad']],x['producto'].casefold()))

def safe_cell(value):
    s=str(value)
    if re.match(r'^\s*[=+@-]',s):
        s="'"+s
    return s

def generate(csv_path,json_path):
    products=json.loads((ROOT/'data/catalogo-respaldo.json').read_text(encoding='utf-8'))
    manifest=json.loads((ROOT/'data/catalogo-fotos.json').read_text(encoding='utf-8'))
    rows=analyze(products,manifest)
    columns=['codigo','producto','categoria','fotos','prioridad','pendientes']
    csv_path=Path(csv_path);json_path=Path(json_path)
    csv_path.parent.mkdir(parents=True,exist_ok=True)
    json_path.parent.mkdir(parents=True,exist_ok=True)
    with csv_path.open('w',encoding='utf-8-sig',newline='') as file:
        writer=csv.writer(file);writer.writerow(['Código','Producto','Categoría','Número de fotos','Prioridad','Pendientes de revisión'])
        for row in rows:writer.writerow([safe_cell(row[k]) for k in columns])
    total=Counter(row['prioridad'] for row in rows)
    summary={'productos_activos':len(rows),'prioridad_alta':total['ALTA'],
        'prioridad_media':total['MEDIA'],'prioridad_baja':total['BAJA'],
        'sin_alertas':total['LISTO'],
        'advertencia':'Reporte orientativo generado del catálogo público. No contiene costos, cuentas ni datos de clientes; no modifica Google Sheets.'}
    json_path.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Auditoría pública: {summary['productos_activos']} productos; {summary['prioridad_alta']} alertas altas; {summary['prioridad_media']} medias.")
    return summary

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--csv',default='artifacts/calidad/catalogo.csv')
    parser.add_argument('--json',default='artifacts/calidad/resumen.json')
    args=parser.parse_args()
    generate(args.csv,args.json)
