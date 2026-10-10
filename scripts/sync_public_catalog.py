#!/usr/bin/env python3
"""Sincroniza solo campos públicos desde Apps Script; CSV publicado es alternativa."""
import csv
import io
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/"data/catalogo-csv.url"

SOURCE_API=ROOT/"data/catalogo-api.url"
ALLOWED_DETAILS={"weight","weightUnit","width","height","length","measureUnit","size","material","model","compatibility"}

def details_public(raw):
    if not raw:return {}
    try:
        value=json.loads(raw) if isinstance(raw,str) else raw
    except (ValueError,TypeError):
        return {}
    if not isinstance(value,dict):return {}
    clean={}
    for k,v in value.items():
        if k not in ALLOWED_DETAILS or v is None:continue
        if k in {"weight","width","height","length"}:
            try:
                n=float(str(v).replace(",","."))
                if 0<n<1000000:clean[k]=n
            except ValueError:
                pass
        elif k in {"weightUnit","measureUnit"}:
            if str(v) in (("kg","lb","g") if k=="weightUnit" else ("cm","mm","m","in")):clean[k]=str(v)
        else:
            if str(v).strip():clean[k]=str(v).strip()[:200]
    if "weight" not in clean:clean.pop("weightUnit",None)
    if not any(k in clean for k in ("width","height","length")):clean.pop("measureUnit",None)
    return clean

def from_csv():
    if not SOURCE.exists():print("Waiting for public CSV link");return None
    url=SOURCE.read_text(encoding="utf8").strip()
    if not url or url.startswith("#"):print("Waiting for published public-only CSV");return None
    p=urlparse(url)
    if p.scheme!="https" or p.hostname!="docs.google.com" or "/pub?" not in url or "single=true" not in url or "output=csv" not in url:
        raise ValueError("Requires a published single-tab Google Sheets CSV URL")
    with urlopen(Request(url,headers={"User-Agent":"GamerComayaguaSync/1.0"}),timeout=30) as result:
        content=result.read(2000001)
    if len(content)>2000000:raise ValueError("CSV too large")
    text=content.decode("utf-8-sig")
    if text.lstrip().lower().startswith("<!doctype") or "<html" in text[:512].lower():
        raise ValueError("Published URL returned HTML rather than CSV")
    reader=csv.DictReader(io.StringIO(text))
    names=reader.fieldnames or []
    if names!=HEADERS or RESTRICTED.intersection(h.lower() for h in names):
        raise ValueError("Wrong columns or forbidden private information")
    entries=[]
    for r in reader:
        if not r["ID"] or not r["Nombre"]:continue
        q=number(r["Stock"])
        if not isinstance(q,int):raise ValueError("Stock must be whole units")
        entries.append({"id":r["ID"].strip(),"code":r["Codigo"].strip(),"name":r["Nombre"].strip(),
        "category":r["Categoria"].strip(),"price":number(r["Precio"]),"stock":q,"image":r["Imagen"].strip(),
        "gallery":gallery(r["Galeria"]),"description":(r["Descripcion"] or "").strip(),
        "discounts":(r["Descuentos"] or "").strip(),"codAllowed":yes(r["PagoAlRecibir"]),
        "active":yes(r["Activo"]),"colors":(r["Colores"] or "").strip(),
        "promoPrice":number(r["PrecioPromocion"]),"promoText":(r["PromocionTexto"] or "").strip(),
        "details":details_public(r["Detalles"])})
    return entries

def main():
    api_file=SOURCE_API.read_text(encoding="utf8").strip() if SOURCE_API.exists() else ""
    api_url=next((line.strip() for line in api_file.splitlines() if line.strip() and not line.strip().startswith("#")),"")
    if api_url:
        entries=from_api(api_url)
        source_type="api"
    else:
        entries=from_csv()
        source_type="csv"
    if entries is None:return
    if OUTPUT.exists() and source_type=="api":
        # La API oculta artículos desactivados: conservarlos solo en el respaldo
        # del administrador (nunca se muestran como activos al comprador).
        previous=json.loads(OUTPUT.read_text(encoding="utf8"))
        previous_by_id={p["id"]:p for p in previous}
        # Nunca sustituir características nuevas por una API de Google antigua
        # que aún no publica el campo Detalles.
        regressions=[p["id"] for p in entries
            if previous_by_id.get(p["id"],{}).get("details") and not p.get("details")]
        if regressions:
            raise ValueError("La API devolvió fichas sin características ya guardadas. Revisar implementación de Apps Script: "+",".join(regressions[:3]))
        active_ids={item["id"] for item in entries}
        disappeared=[p for p in previous if p.get("active") and p["id"] not in active_ids]
        if len(disappeared)>max(5,int(len(previous)*.15)):
            raise ValueError("Desaparecieron demasiados productos activos en la API: abortado")
        entries += [{**p,"active":False} for p in previous if p["id"] not in active_ids]
        "codAllowed":yes(p.get("codAllowed",True)),"active":yes(p.get("active",True)),
            "colors":str(p.get("colors") or "").strip(),
            "promoPrice":number(p.get("promoPrice",0)),
            "promoText":str(p.get("promoText") or "").strip(),
            "details":details_public(p.get("details",{}))})
    if len(entries)<40:raise ValueError("La API devolvió demasiados pocos productos; no se actualizó el respaldo")
    return entries

OUTPUT=ROOT/"data/catalogo-respaldo.json"
INITIAL=ROOT/"data/catalogo-inicial.js"
HEADERS=["ID","Codigo","Nombre","Categoria","Precio","Stock","Imagen","Galeria","Descripcion","Descuentos","PagoAlRecibir","Activo","Colores","PrecioPromocion","PromocionTexto","Detalles"]
RESTRICTED={"costo","cost","ganancia","inversion","identidad","cuenta"}

def number(value):
    v=str(value or "").strip().replace("Lps.","").replace("L","").replace(" ","")
    if not v:return 0
    if "," in v and "." in v:v=v.replace(",","")
    elif "," in v:v=v.replace(",",".") if len(v.split(",")[-1])<=2 else v.replace(",","")
    n=float(v)
    if n<0 or n>1000000000:raise ValueError("Number outside allowed range")
    return int(n) if n.is_integer() else n

def yes(x):
    return str(x).strip().lower() in ("si","sí","true","1","yes")

def gallery(x):
    v=str(x or "").strip()
    if not v or v=="[]":return ""
    if v.startswith("["):
        obj=json.loads(v)
        if not isinstance(obj,list):raise ValueError("Invalid gallery")
        return ",".join(str(x).strip() for x in obj if x)
    return v

def main():
    if not SOURCE.exists():print("Waiting for public CSV link");return
    url=SOURCE.read_text(encoding="utf8").strip()
    if not url or url.startswith("#"):print("Waiting for published public-only CSV");return
    p=urlparse(url)
    if p.scheme!="https" or p.hostname!="docs.google.com" or "/pub?" not in url or "single=true" not in url or "output=csv" not in url:
        raise ValueError("Requires a published single-tab Google Sheets CSV URL")
    with urlopen(Request(url,headers={"User-Agent":"GamerComayaguaSync/1.0"}),timeout=30) as result:
        content=result.read(2000001)
    if len(content)>2000000:raise ValueError("CSV too large")
    text=content.decode("utf-8-sig")
    if text.lstrip().lower().startswith("<!doctype") or "<html" in text[:512].lower():
        raise ValueError("Published URL returned HTML rather than CSV")
    reader=csv.DictReader(io.StringIO(text))
    names=reader.fieldnames or []
    if names!=HEADERS or RESTRICTED.intersection(h.lower() for h in names):
        raise ValueError("Wrong columns or forbidden private information")
    entries=[]
    for r in reader:
        if not r["ID"] or not r["Nombre"]:continue
        q=number(r["Stock"])
        if not isinstance(q,int):raise ValueError("Stock must be whole units")
        entries.append({"id":r["ID"].strip(),"code":r["Codigo"].strip(),"name":r["Nombre"].strip(),
        "category":r["Categoria"].strip(),"price":number(r["Precio"]),"stock":q,"image":r["Imagen"].strip(),
        "gallery":gallery(r["Galeria"]),"description":(r["Descripcion"] or "").strip(),
        "discounts":(r["Descuentos"] or "").strip(),"codAllowed":yes(r["PagoAlRecibir"]),
        "active":yes(r["Activo"]),"colors":(r["Colores"] or "").strip(),
        "promoPrice":number(r["PrecioPromocion"]),"promoText":(r["PromocionTexto"] or "").strip(),
        "details":json.loads(r["Detalles"]) if (r["Detalles"] or "").strip().startswith("{") else {}})
    if len(entries)<40 or len({e["id"] for e in entries})!=len(entries):raise ValueError("CSV incomplete or duplicate products")
    if OUTPUT.exists():
        previous=json.loads(OUTPUT.read_text(encoding="utf8"))
        overlap=len({p["id"] for p in previous}.intersection(e["id"] for e in entries))
        if overlap < int(len(previous)*.75):raise ValueError("Wrong CSV product IDs")
    result=json.dumps(entries,ensure_ascii=False,indent=2)+"\n"
    if not OUTPUT.exists() or result!=OUTPUT.read_text(encoding="utf8"):
        OUTPUT.write_text(result,encoding="utf8")
        print(f"Updated {len(entries)} public products")
    else:print("No changes")
    # Mantener al día la copia que dibuja el catálogo antes de conectar con Google.
    initial="/* Catálogo público sin información privada. */\nwindow.GC_CATALOGO_INICIAL="+json.dumps(entries,ensure_ascii=False,separators=(",",":"))+";\n"
    if not INITIAL.exists() or INITIAL.read_text(encoding="utf8")!=initial:
        INITIAL.write_text(initial,encoding="utf8")
        print("Updated immediate catalog bootstrap")

if __name__=="__main__":
    main()
