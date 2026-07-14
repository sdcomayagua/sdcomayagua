// SD COMAYAGUA · Precio anterior opcional V1
// Guarda el precio anterior dentro de la descripción mediante un marcador oculto.
(() => {
  'use strict';

  const TOKEN = 'SD_PREVIOUS_PRICE_V1';
  const MARKER_RE = /\[\[SD_PREVIOUS_PRICE_V1:([0-9]+(?:\.[0-9]+)?)\]\]/g;

  function parse(text) {
    const source = String(text || '');
    const matches = [...source.matchAll(MARKER_RE)];
    const previousPrice = matches.length ? Number(matches[matches.length - 1][1]) : 0;
    return {
      previousPrice: Number.isFinite(previousPrice) ? previousPrice : 0,
      description: source.replace(MARKER_RE, '').replace(/\n{3,}/g, '\n\n').trim()
    };
  }

  function serialize(description, previousPrice, currentPrice) {
    const clean = parse(description).description;
    const previous = Number(previousPrice || 0);
    const current = Number(currentPrice || 0);
    if (!(previous > current && current >= 0)) return clean;
    const marker = `[[${TOKEN}:${previous.toFixed(2)}]]`;
    return clean ? `${clean}\n\n${marker}` : marker;
  }

  function ensureField() {
    const priceInput = document.getElementById('productPrice');
    if (!priceInput || document.getElementById('productPreviousPrice')) return;
    const priceLabel = priceInput.closest('label');
    if (!priceLabel) return;

    const field = document.createElement('label');
    field.className = 'product-previous-price-field admin-only';
    field.innerHTML = `Precio anterior <span class="discount-optional-label">Opcional</span>
      <input id="productPreviousPrice" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Ej. 350">
      <small>Solo úsalo para mostrar un descuento real. Debe ser mayor que el precio actual.</small>`;
    priceLabel.insertAdjacentElement('afterend', field);
  }

  function loadField() {
    ensureField();
    const description = document.getElementById('productDescription');
    const input = document.getElementById('productPreviousPrice');
    if (!description || !input) return;
    const parsed = parse(description.value);
    description.value = parsed.description;
    input.value = parsed.previousPrice > 0 ? String(parsed.previousPrice) : '';
  }

  function prepareSave() {
    const description = document.getElementById('productDescription');
    const current = document.getElementById('productPrice');
    const previous = document.getElementById('productPreviousPrice');
    if (!description || !current || !previous) return;
    description.value = serialize(description.value, previous.value, current.value);
  }

  function stripVisibleMarker() {
    const root = document.getElementById('detailDescription');
    if (!root || !root.textContent?.includes('[[SD_PREVIOUS_PRICE_V1:')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const current = String(node.nodeValue || '');
      const cleaned = current.replace(MARKER_RE, '').replace(/\n{3,}/g, '\n\n');
      if (cleaned !== current) node.nodeValue = cleaned;
    });
    root.querySelectorAll('p,div,span').forEach((node) => {
      if (!node.textContent?.trim() && !node.children.length) node.remove();
    });
  }

  function init() {
    ensureField();
    document.getElementById('productForm')?.addEventListener('submit', prepareSave, true);

    const productDialog = document.getElementById('productDialog');
    if (productDialog) {
      new MutationObserver(() => {
        if (!productDialog.open) return;
        setTimeout(loadField, 130);
        setTimeout(loadField, 360);
      }).observe(productDialog, { attributes: true, attributeFilter: ['open'] });
    }

    const detailDialog = document.getElementById('detailDialog');
    if (detailDialog) {
      new MutationObserver(() => {
        if (!detailDialog.open) return;
        [80, 220, 500].forEach((delay) => setTimeout(stripVisibleMarker, delay));
      }).observe(detailDialog, { attributes: true, attributeFilter: ['open'] });
    }

    const detailDescription = document.getElementById('detailDescription');
    if (detailDescription) {
      new MutationObserver(() => {
        if (detailDescription.textContent?.includes('[[SD_PREVIOUS_PRICE_V1:')) {
          setTimeout(stripVisibleMarker, 80);
        }
      }).observe(detailDescription, { childList: true, subtree: true, characterData: true });
    }
  }

  window.SD_PRODUCT_DISCOUNT = { parse };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
