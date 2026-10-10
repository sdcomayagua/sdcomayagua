#!/usr/bin/env python3
"""Actualiza exclusivamente el catálogo público; nunca obtiene ni publica costos."""
import csv
import io
import json
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCE_API = ROOT / "data/catalogo-api.url"
SOURCE_CSV = ROOT / "data/catalogo-csv.url"
OUTPUT = ROOT / "data/catalogo-respaldo.json"
INITIAL = ROOT / "data/catalogo-inicial.js"
HEADERS = [
    "ID", "Codigo", "Nombre", "Categoria", "Precio", "Stock", "Imagen",
    "Galeria", "Descripcion", "Descuentos", "PagoAlRecibir", "Activo",
    "Colores", "PrecioPromocion", "PromocionTexto", "Detalles",
]
DETAIL_KEYS = {
    "weight", "weightUnit", "width", "height", "length", "measureUnit",
    "size", "material", "model", "compatibility",
}
PRIVATE_FIELDS = {"costo", "cost", "ganancia", "inversion", "identidad", "cuenta"}

def number(value):
    source = str(value if value is not None else "").strip()
    if not source:
        return 0
    source = source.replace("Lps.", "").replace("L", "").replace(" ", "")
    if "," in source and "." in source:
        source = source.replace(",", "")
    elif "," in source:
        source = source.replace(",", ".") if len(source.split(",")[-1]) <= 2 else source.replace(",", "")
    amount = float(source)
    if not (0 <= amount <= 1000000000):
        raise ValueError("Precio o cantidad fuera de límites")
    return int(amount) if amount.is_integer() else amount

def yes(value):
    return str(value).strip().lower() in {"si", "sí", "true", "1", "yes"}

def gallery(value):
    if isinstance(value, list):
        return ",".join(str(v).strip() for v in value if v)
    raw = str(value or "").strip()
    if not raw or raw == "[]":
        return ""
    if raw.startswith("["):
        obj = json.loads(raw)
        if not isinstance(obj, list):
            raise ValueError("Galería inválida")
        return ",".join(str(v).strip() for v in obj if v)
    return raw

def details_public(raw):
    if not raw:
        return {}
    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except (ValueError, TypeError):
        return {}
    if not isinstance(data, dict):
        return {}
    result = {}
    for key, value in data.items():
        if key not in DETAIL_KEYS or value is None:
            continue
        if key in {"weight", "width", "height", "length"}:
            try:
                amount = float(str(value).replace(",", "."))
                if 0 < amount < 1000000:
                    result[key] = amount
            except ValueError:
                pass
        elif key in {"weightUnit", "measureUnit"}:
            allowed = ("kg", "lb", "g") if key == "weightUnit" else ("cm", "mm", "m", "in")
            if str(value) in allowed:
                result[key] = str(value)
        else:
            if str(value).strip():
                result[key] = str(value).strip()[:200]
    if "weight" not in result:
        result.pop("weightUnit", None)
    if not any(k in result for k in ("width", "height", "length")):
        result.pop("measureUnit", None)
    return result

def source_url(file):
    if not file.exists():
        return ""
    return next((line.strip() for line in file.read_text(encoding="utf-8").splitlines()
                 if line.strip() and not line.strip().startswith("#")), "")

def fetch_api(url):
    endpoint = urlsplit(url)
    if (endpoint.scheme != "https" or endpoint.hostname != "script.google.com"
            or not endpoint.path.startswith("/macros/s/") or not endpoint.path.endswith("/exec")):
        raise ValueError("Solo se admite una URL pública de Apps Script terminada en /exec")
    params = dict(parse_qsl(endpoint.query))
    params["action"] = "public"
    endpoint_url = urlunsplit((endpoint.scheme, endpoint.netloc, endpoint.path, urlencode(params), ""))
    with urlopen(Request(endpoint_url, headers={
        "User-Agent": "GamerComayaguaSync/2.0", "Accept": "application/json",
    }), timeout=40) as response:
        data = response.read(3000001)
    if len(data) > 3000000:
        raise ValueError("Respuesta de catálogo demasiado grande")
    try:
        response = json.loads(data.decode("utf-8-sig"))
    except (ValueError, UnicodeError) as exc:
        raise ValueError("Apps Script no devolvió JSON: revisar acceso público de /exec") from exc
    if not isinstance(response, dict) or response.get("ok") is not True or not isinstance(response.get("products"), list):
        raise ValueError("Respuesta inválida del catálogo público")
    entries = []
    for p in response["products"]:
        if not isinstance(p, dict) or not p.get("id") or not p.get("name"):
            continue
        stock = number(p.get("stock", 0))
        if not isinstance(stock, int):
            raise ValueError("El stock debe ser entero")
        entries.append({
            "id": str(p["id"]).strip(),
            "code": str(p.get("code") or "").strip(),
            "name": str(p["name"]).strip(),
            "category": str(p.get("category") or "Otros").strip(),
            "price": number(p.get("price", 0)),
            "stock": stock,
            "image": str(p.get("image") or "").strip(),
            "gallery": gallery(p.get("gallery", "")),
            "description": str(p.get("description") or "").strip(),
            "discounts": str(p.get("discounts") or "").strip(),
            "codAllowed": yes(p.get("codAllowed", True)),
            "active": yes(p.get("active", True)),
            "colors": str(p.get("colors") or "").strip(),
            "promoPrice": number(p.get("promoPrice", 0)),
            "promoText": str(p.get("promoText") or "").strip(),
            "details": details_public(p.get("details", {})),
        })
    return entries

def fetch_csv(url):
    parsed = urlparse(url)
    if (parsed.scheme != "https" or parsed.hostname != "docs.google.com"
            or "/pub?" not in url or "single=true" not in url or "output=csv" not in url):
        raise ValueError("El CSV debe publicar una única pestaña sin datos privados")
    with urlopen(Request(url, headers={"User-Agent": "GamerComayaguaSync/2.0"}), timeout=30) as response:
        data = response.read(3000001)
    if len(data) > 3000000:
        raise ValueError("Archivo CSV demasiado grande")
    decoded = data.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    if reader.fieldnames != HEADERS or any(k.lower() in PRIVATE_FIELDS for k in reader.fieldnames or []):
        raise ValueError("El CSV no contiene las columnas públicas esperadas")
    entries = []
    for r in reader:
        if not r["ID"] or not r["Nombre"]:
            continue
        stock = number(r["Stock"])
        if not isinstance(stock, int):
            raise ValueError("El stock debe ser entero")
        entries.append({
            "id": r["ID"].strip(), "code": r["Codigo"].strip(),
            "name": r["Nombre"].strip(), "category": r["Categoria"].strip(),
            "price": number(r["Precio"]), "stock": stock,
            "image": r["Imagen"].strip(), "gallery": gallery(r["Galeria"]),
            "description": (r["Descripcion"] or "").strip(),
            "discounts": (r["Descuentos"] or "").strip(),
            "codAllowed": yes(r["PagoAlRecibir"]), "active": yes(r["Activo"]),
            "colors": (r["Colores"] or "").strip(),
            "promoPrice": number(r["PrecioPromocion"]),
            "promoText": (r["PromocionTexto"] or "").strip(),
            "details": details_public(r["Detalles"]),
        })
    return entries

def main():
    api = source_url(SOURCE_API)
    csv_url = source_url(SOURCE_CSV)
    if not api and not csv_url:
        print("Sin fuente pública configurada; se conservan los archivos existentes")
        return
    from_public_api = bool(api)
    entries = fetch_api(api) if from_public_api else fetch_csv(csv_url)
    if len(entries) < 40 or len({e["id"] for e in entries}) != len(entries):
        raise ValueError("Catálogo incompleto o con productos duplicados: no se escribe ningún archivo")
    if OUTPUT.exists():
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
        old = {p["id"]: p for p in previous}
        overlap = sum(1 for p in entries if p["id"] in old)
        if overlap < int(len(previous) * .75):
            raise ValueError("Identificadores de producto inesperados: se conserva la copia anterior")
        if from_public_api:
            # La API solo publica artículos activos. Conservar los inactivos
            # para el respaldo del panel y marcarlos ocultos para la tienda.
            regressions = [p["id"] for p in entries if old.get(p["id"], {}).get("details") and not p.get("details")]
            if regressions:
                raise ValueError("Apps Script devolvió características antiguas, sincronización cancelada: "
                                 + ",".join(regressions[:3]))
            now = {p["id"] for p in entries}
            missing = [p for p in previous if p.get("active") and p["id"] not in now]
            if len(missing) > max(5, int(len(previous) * .15)):
                raise ValueError("Desaparecieron demasiados productos activos: revisión manual necesaria")
            entries.extend([{**p, "active": False} for p in previous if p["id"] not in now])
    serialized = json.dumps(entries, ensure_ascii=False, indent=2) + "\n"
    if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != serialized:
        OUTPUT.write_text(serialized, encoding="utf-8")
        print("Catálogo público actualizado:", len(entries), "productos")
    else:
        print("Catálogo público sin cambios")
    initial = ("/* Solo catálogo público; sin costos ni datos de administración. */\n"
               "window.GC_CATALOGO_INICIAL="
               + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n")
    if not INITIAL.exists() or INITIAL.read_text(encoding="utf-8") != initial:
        INITIAL.write_text(initial, encoding="utf-8")
        print("Copia de inicio actualizada")

if __name__ == "__main__":
    main()
