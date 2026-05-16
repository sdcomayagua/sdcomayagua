import { parseNumber, parseColorStock, sumColorStock } from './utils.js';

export function validateProduct(product, products=[], previousCodigo='') {
  const errors = [];
  const warnings = [];
  if (!product.codigo) errors.push('El código es obligatorio.');
  if (!product.nombre) errors.push('El nombre es obligatorio.');
  if (parseNumber(product.precio) < 0) errors.push('El precio no puede ser negativo.');
  if (parseNumber(product.costo) < 0) errors.push('El costo no puede ser negativo.');
  if (parseNumber(product.stock) < 0) errors.push('El stock no puede ser negativo.');
  if (parseNumber(product.costo) > parseNumber(product.precio)) warnings.push('El costo es mayor que el precio. Revisa la ganancia.');
  if (!product.imagen) warnings.push('El producto no tiene imagen. Se mostrará un placeholder.');
  if (!product.categoria) warnings.push('El producto no tiene categoría.');
  const duplicate = products.find(p => String(p.codigo) === String(product.codigo) && String(p.codigo) !== String(previousCodigo || ''));
  if (duplicate) errors.push('Ya existe un producto con este código.');
  const colorItems = parseColorStock(product.colores);
  if (product.colores && !colorItems.length) warnings.push('No se pudo interpretar el formato de colores. Usa Negro=5; Azul=2.');
  const colorSum = sumColorStock(colorItems);
  if (colorSum > 0 && parseNumber(product.stock) !== colorSum) warnings.push(`El stock general (${product.stock}) no coincide con la suma de colores (${colorSum}).`);
  return { ok: errors.length === 0, errors, warnings };
}

export function validateCartForSale(cart) {
  const errors = [];
  if (!cart.items.length) errors.push('El carrito está vacío.');
  for (const item of cart.items) {
    if (parseNumber(item.qty) <= 0) errors.push(`Cantidad inválida para ${item.nombre}.`);
    if (parseNumber(item.qty) > parseNumber(item.availableStock)) errors.push(`No hay suficiente stock para ${item.nombre}.`);
    if (item.colorRequired && !item.color) errors.push(`Selecciona color para ${item.nombre}.`);
  }
  return { ok: errors.length === 0, errors };
}
