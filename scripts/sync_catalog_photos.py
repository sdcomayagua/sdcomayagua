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

def sync(entries, root=ROOT, opener=urlopen):
    manifest = root / "data/catalogo-fotos.json"
    try:
        previous = json.loads(manifest.read_text(encoding="utf-8")).get("images", {})
    except (OSError, ValueError, TypeError):
        previous = {}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    images, jobs = {}, []
    for product in entries:
        if not product.get("active"):
            continue
        source = str(product.get("image") or "")
        match = DRIVE.match(source)
        if not match:
            continue
        old = previous.get(str(product["id"]), {})
        safe = re.fullmatch(r"assets/catalog/[a-f0-9]{24}\.(jpg|png|gif|webp)", str(old.get("path", "")))
        if old.get("source") == source and safe and (root / old["path"]).is_file():
            images[str(product["id"])] = old
            if old.get("checked") == today and old.get("size", 0) >= PHOTO_SIZE:
                continue
        jobs.append((str(product["id"]), source, match[1]))

    def download(job):
        identity, source, drive_id = job
        try:
            request = Request("https://drive.google.com/thumbnail?id=" + drive_id + "&sz=w" + str(PHOTO_SIZE), headers={"User-Agent": "GamerComayaguaCatalog/2.0"})
            with opener(request, timeout=18) as response:
                data = response.read(MAX_BYTES + 1)
            if not data or len(data) > MAX_BYTES:
                raise ValueError("Foto fuera de tamaño")
            ext = extension(data)
            digest = hashlib.sha256(data).hexdigest()[:24]
            path = "assets/catalog/" + digest + "." + ext
            return identity, {"source": source, "path": path, "checked": today, "size": PHOTO_SIZE}, data
        except Exception:
            return None

    (root / "assets/catalog").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(download, jobs):
            if result:
                identity, info, data = result
                target = root / info["path"]
                if not target.exists() or target.read_bytes() != data:
                    target.write_bytes(data)
                images[identity] = info
    serialized = json.dumps({"version": 1, "images": images}, ensure_ascii=False, indent=2) + "\n"
    if not manifest.exists() or manifest.read_text(encoding="utf-8") != serialized:
        manifest.write_text(serialized, encoding="utf-8")
    print("Fotos públicas listas para catálogo:", len(images), "· revisadas en este intento:", len(jobs))
    return images

if __name__ == "__main__":
    sync(json.loads((ROOT / "data/catalogo-respaldo.json").read_text(encoding="utf-8")))
