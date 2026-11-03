#!/usr/bin/env python3
"""Copias de fotos públicas para que los catálogos se exporten sin bloqueos CORS."""
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DRIVE = re.compile(r"^https://drive\.google\.com/(?:thumbnail\?id=|file/d/)([A-Za-z0-9_-]{10,100})")
PHOTO_SIZE = 1600
MAX_BYTES = 4500000

def extension(data):
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "webp"
    raise ValueError("La respuesta no es una foto")

def gallery_sources(value):
    """Fotos adicionales tal como se guardan en Sheets (JSON, lista o CSV)."""
    if isinstance(value, list):
        values = value
    else:
        raw = str(value or "").strip()
        try:
            parsed = json.loads(raw)
            values = parsed if isinstance(parsed, list) else re.split(r"[\n,;|]", raw)
        except (ValueError, TypeError):
            values = re.split(r"[\n,;|]", raw)
    return [str(item).strip() for item in values if str(item).strip()][:10]


def sync(entries, root=ROOT, opener=urlopen):
    """Respalda las fotos públicas principales Y las galerías en el mismo dominio."""
    manifest = root / "data/catalogo-fotos.json"
    try:
        previous = json.loads(manifest.read_text(encoding="utf-8")).get("images", {})
    except (OSError, ValueError, TypeError):
        previous = {}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    images, jobs = {}, []

    def existing(info, source):
        return (
            isinstance(info, dict) and info.get("source") == source
            and re.fullmatch(r"assets/catalog/[a-f0-9]{24}\.(jpg|png|gif|webp)", str(info.get("path", "")))
            and (root / info["path"]).is_file()
        )

    for product in entries:
        if not product.get("active"):
            continue
        identity = str(product.get("id", ""))
        if not identity:
            continue
        old = previous.get(identity, {})
        if not isinstance(old, dict):
            old = {}
        main = str(product.get("image") or "").strip()
        main_match = DRIVE.match(main)
        record = {}
        if main_match:
            if existing(old, main):
                record = {key: old[key] for key in ("source", "path", "checked", "size") if key in old}
            if not record or record.get("checked") != today or record.get("size", 0) < PHOTO_SIZE:
                jobs.append((identity, main, main_match[1], "main"))
        old_gallery = old.get("gallery", []) if isinstance(old.get("gallery"), list) else []
        gallery = []
        seen = {main}
        for source in gallery_sources(product.get("gallery")):
            if source in seen:
                continue
            seen.add(source)
            match = DRIVE.match(source)
            if not match:
                continue
            former = next((item for item in old_gallery if existing(item, source)), None)
            if former:
                gallery.append({key: former[key] for key in ("source", "path", "checked", "size") if key in former})
            if not former or former.get("checked") != today or former.get("size", 0) < PHOTO_SIZE:
                jobs.append((identity, source, match[1], "gallery"))
        if gallery:
            record["gallery"] = gallery
        if record:
            images[identity] = record

    def download(job):
        identity, source, drive_id, kind = job
        try:
            request = Request(
                "https://drive.google.com/thumbnail?id=" + drive_id + "&sz=w" + str(PHOTO_SIZE),
                headers={"User-Agent": "GamerComayaguaCatalog/2.0"}
            )
            with opener(request, timeout=18) as response:
                data = response.read(MAX_BYTES + 1)
            if not data or len(data) > MAX_BYTES:
                raise ValueError("Foto fuera de tamaño")
            ext = extension(data)
            digest = hashlib.sha256(data).hexdigest()[:24]
            path = "assets/catalog/" + digest + "." + ext
            return identity, kind, {
                "source": source, "path": path, "checked": today, "size": PHOTO_SIZE
            }, data
        except Exception:
            return None

    (root / "assets/catalog").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(download, jobs):
            if not result:
                continue
            identity, kind, info, data = result
            target = root / info["path"]
            if not target.exists() or target.read_bytes() != data:
                target.write_bytes(data)
            record = images.setdefault(identity, {})
            if kind == "main":
                record.update(info)
            else:
                gallery = record.setdefault("gallery", [])
                gallery[:] = [old for old in gallery if old["source"] != info["source"]]
                gallery.append(info)
    serialized = json.dumps({"version": 2, "images": images}, ensure_ascii=False, indent=2) + "\n"
    if not manifest.exists() or manifest.read_text(encoding="utf-8") != serialized:
        manifest.write_text(serialized, encoding="utf-8")
    print("Fotos públicas listas para catálogo:", len(images), "· revisadas en este intento:", len(jobs))
    return images

if __name__ == "__main__":
    sync(json.loads((ROOT / "data/catalogo-respaldo.json").read_text(encoding="utf-8")))
