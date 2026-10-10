#!/usr/bin/env python3
"""Sync ONLY the separately published public CSV tab to the website backup."""
import csv
import io
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/"data/catalogo-csv.url"
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
