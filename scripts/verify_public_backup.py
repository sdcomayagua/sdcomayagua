"""Comprueba que el respaldo público no incluya datos privados de la tienda."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {
    "bestSeller", "createdAt", "catalogOrder", "id", "code", "name",
    "category", "price", "stock", "image", "gallery", "description",
    "discounts", "codAllowed", "active", "colors", "promoPrice",
    "promoText", "details"
}
DETAILS = {
    "length", "size", "model", "brand", "connection", "measureUnit",
    "references", "power", "current", "material", "technology",
    "weight", "compatibility", "voltage", "weightUnit", "included",
    "width", "height"
}
BLOCKED = {"pin", "password", "token", "secret", "cost", "costo", "identidad", "cuenta", "account", "profit", "ganancia", "phone", "telefono", "cliente", "customer", "email", "address", "direccion"}

def validate(data):
    if not isinstance(data, list) or not data:
        raise ValueError("Catálogo público vacío o inválido.")
    for index, product in enumerate(data):
        if not isinstance(product, dict):
            raise ValueError(f"Registro {index} inválido.")
        keys = set(product)
        if keys - ALLOWED or {k.lower() for k in keys} & BLOCKED:
            raise ValueError(f"Campos no públicos en el registro {index}: {sorted(keys - ALLOWED)}")
        details = product.get("details") or {}
        if not isinstance(details, dict) or set(details) - DETAILS:
            raise ValueError(f"Detalles no públicos en registro {index}")
    return len(data)

if __name__ == "__main__":
    file = ROOT / "data" / "catalogo-respaldo.json"
    amount = validate(json.loads(file.read_text(encoding="utf-8")))
    print(f"PASS: {amount} productos del catálogo público sin campos privados.")
