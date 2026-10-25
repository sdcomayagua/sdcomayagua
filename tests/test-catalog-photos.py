import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("photos", Path(__file__).resolve().parents[1] / "scripts/sync_catalog_photos.py")
photos = importlib.util.module_from_spec(spec)
spec.loader.exec_module(photos)

class PhotosTest(unittest.TestCase):
    def test_public_photos_and_reuse(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            calls = []
            def fetch(request, timeout):
                calls.append(request.full_url)
                return io.BytesIO(b"\xff\xd8\xffPUBLIC-PHOTO")
            source = "https://drive.google.com/thumbnail?id=PUBLIC_DRIVE_PHOTO&sz=w1200"
            rows = [{"id": "A", "active": True, "image": source, "cost": 999}, {"id": "B", "active": False, "image": source}, {"id": "C", "active": True, "image": "https://private.example/photo"}]
            result = photos.sync(rows, root, fetch)
            self.assertEqual(list(result), ["A"])
            self.assertEqual(len(calls), 1)
            self.assertTrue((root / result["A"]["path"]).is_file())
            self.assertNotIn("999", (root / "data/catalogo-fotos.json").read_text())
            photos.sync(rows, root, fetch)
            self.assertEqual(len(calls), 1)
            rows[0]["image"] = source.replace("PUBLIC_DRIVE_PHOTO", "OTHER_DRIVE_PHOTO")
            photos.sync(rows, root, fetch)
            self.assertEqual(len(calls), 2)
            self.assertEqual(calls[-1], "https://drive.google.com/thumbnail?id=OTHER_DRIVE_PHOTO&sz=w1600")
            self.assertEqual(result['A']['size'], 1600)

    def test_failure_never_saves_html_or_large_responses(self):
        for payload in [b"<html>Iniciar sesion</html>", b"\xff\xd8\xff" + b"x" * photos.MAX_BYTES]:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root / "data").mkdir()
                result = photos.sync([{"id": "A", "active": True, "image": "https://drive.google.com/thumbnail?id=PUBLIC_DRIVE_PHOTO"}], root, lambda *args, **kwargs: io.BytesIO(payload))
                self.assertEqual(result, {})
                self.assertEqual(list((root / "assets/catalog").iterdir()), [])

    def test_upgrades_old_photos_and_preserves_previous_on_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            rows = [{'id': 'A', 'active': True, 'image': 'https://drive.google.com/thumbnail?id=PUBLIC_DRIVE_PHOTO'}]
            calls = []
            def fetch(request, timeout):
                calls.append(request.full_url)
                return io.BytesIO(b'\xff\xd8\xffPUBLIC-PHOTO')
            first = photos.sync(rows, root, fetch)
            first['A'].pop('size')
            (root / 'data/catalogo-fotos.json').write_text(json.dumps({'images': first}))
            def failed(*args, **kwargs):
                raise OSError('Sin conexion')
            self.assertEqual(photos.sync(rows, root, failed)['A']['path'], first['A']['path'])
            upgraded = photos.sync(rows, root, fetch)
            self.assertEqual(upgraded['A']['size'], 1600)
            self.assertEqual(len(calls), 2)

if __name__ == "__main__":
    unittest.main()
