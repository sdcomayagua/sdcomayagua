"""Regresiones de privacidad y conservación de fichas en el respaldo público."""
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts import sync_public_catalog as sync


class CatalogSyncTests(unittest.TestCase):
    def test_extended_details_survive_sync_without_private_fields(self):
        details = sync.details_public({
            "weight": 72, "weightUnit": "g", "voltage": "5 V", "current": "2 A",
            "power": "Placa: 10 W", "brand": "MEMO", "connection": "USB-C",
            "technology": "TEC", "included": "Cable", "cost": 123,
            "references": [
                {"url": "https://maker.example/cx16", "title": "Ficha oficial"},
                {"url": "javascript:alert(1)", "title": "No publicar"},
            ],
        })
        self.assertEqual(details["voltage"], "5 V")
        self.assertEqual(details["power"], "Placa: 10 W")
        self.assertEqual(details["weightUnit"], "g")
        self.assertEqual(details["references"], [{"url": "https://maker.example/cx16", "title": "Ficha oficial"}])
        self.assertNotIn("cost", details)

    def test_private_sheet_url_is_rejected_before_reading(self):
        with patch.object(sync, "urlopen") as read:
            with self.assertRaises(ValueError):
                sync.fetch_csv("https://docs.google.com/spreadsheets/d/example/gviz/tq?gid=22296678&headers=1&tqx=out:csv")
            read.assert_not_called()

    def test_private_headers_are_rejected(self):
        body = io.BytesIO(b"ID,Codigo,Nombre,Costo\np1,SKU,Producto,123\n")
        with patch.object(sync, "urlopen", return_value=body):
            with self.assertRaisesRegex(ValueError, "columnas p.blicas"):
                sync.fetch_csv("https://docs.google.com/spreadsheets/d/example/gviz/tq?gid=87012030&headers=1&tqx=out:csv")


if __name__ == "__main__":
    unittest.main()
