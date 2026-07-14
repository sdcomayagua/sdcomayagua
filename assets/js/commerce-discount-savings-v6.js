// SD COMAYAGUA · Descuento real y ahorro entre envíos V6
(() => {
  'use strict';

  const INVENTORY_KEY = 'sd_comayagua_products';
  const MARKER_RE = /\[\[SD_PREVIOUS_PRICE_V1:([0-9]+(?:\.[0-9]+)?)\]\]/g;
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmt = (value) => `Lps.${money.format(Number(value || 0))}`;
  const num = (value) => {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function inventory() {
    try {
      const data = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function productByName(productName) {
    const target = norm(productName);
    return inventory().find((item) => norm(item?.name) === target) || null;
  }

  function previousPrice(product) {
    const source = String(product?.description || '');
    const matches = [...source.matchAll(MARKER_RE)];
    if (!matches.length) return 0;
    const value = Number(matches[matches.length - 1][1]);
    return Number.isFinite(value) ? value : 0;
  }

  function renderCard(card) {
    if (!card) return;
    const productName = card.querySelector('.product-name')?.textContent?.trim() || '';
    const product = productByName(productName);
    const current = Number(product?.price || 0) || num(card.querySelector('.product-price')?.textContent);
    if (!(current > 0)) return;
    const previous = previousPrice(product);
    const hasDiscount = previous > current;
    const signature = `${current}|${hasDiscount ? previous : 0}`;
    if (card.dataset.sdDiscountPriceV6 === signature && card.querySelector('.commerce-card-price')) return;

    card.querySelectorAll('.commerce-card-price').forEach((node) => node.remove());
    card.querySelectorAll('.product-meta,.product-private-grid,.product-stats').forEach((node) => node.style.setProperty('display', 'none', 'important'));
    card.querySelector('.product-price')?.style.setProperty('display', 'none', 'important');

    const box = document.createElement('div');
    box.className = `commerce-card-price ${hasDiscount ? 'has-offer has-discount' : 'single-price'}`;
    box.innerHTML = hasDiscount
      ? `<div class="commerce-card-price-before"><span>PRECIO ANTERIOR</span><del>${fmt(previous)}</del></div><div class="commerce-card-price-now"><span>AHORA</span><strong>${fmt(current)}</strong><small>Oferta actual</small></div>`
      : `<div class="commerce-card-price-now"><span>PRECIO</span><strong>${fmt(current)}</strong><small>precio actual</small></div>`;
    card.querySelector('.product-name')?.insertAdjacentElement('afterend', box);
    card.dataset.sdDiscountPriceV6 = signature;
  }

  function renderCards(root = document) {
    root.querySelectorAll?.('#productGrid .product-card').forEach(renderCard);
  }

  function updateSavings() {
    const normalNode = document.getElementById('detailShippingNormal');
    const receiveNode = document.getElementById('detailShippingReceive');
    const normalRow = document.querySelector('#detailDialog .shipping-row.normal');
    if (!normalNode || !receiveNode || !normalRow) return;

    const normal = num(normalNode.textContent);
    const receive = num(receiveNode.textContent);
    if (!(normal > 0 && receive >= normal)) return;
    const saving = Math.max(0, receive - normal);

    normalRow.querySelectorAll('*').forEach((node) => {
      if (node.classList?.contains('sd-shipping-savings-v6')) return;
      if (/ahorras/i.test(node.textContent || '') && !node.children.length) {
        node.style.setProperty('display', 'none', 'important');
      }
    });

    let line = normalRow.querySelector('.sd-shipping-savings-v6');
    if (!line) {
      line = document.createElement('small');
      line.className = 'sd-shipping-savings-v6';
      const copy = normalRow.querySelector('div') || normalRow;
      copy.appendChild(line);
    }
    const next = `💵 Ahorras: ${fmt(saving)} frente a pagar al recibir.`;
    if (line.textContent !== next) line.textContent = next;
  }

  function stripDiscountMarker() {
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
  }

  function init() {
    renderCards();
    updateSavings();

    const grid = document.getElementById('productGrid');
    if (grid) {
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          requestAnimationFrame(() => {
            if (node.matches('.product-card')) renderCard(node);
            renderCards(node);
          });
        }));
      }).observe(grid, { childList: true });
    }

    const dialog = document.getElementById('detailDialog');
    if (dialog) {
      let pending = false;
      new MutationObserver(() => {
        if (!dialog.open || pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          updateSavings();
          stripDiscountMarker();
        });
      }).observe(dialog, { attributes: true, attributeFilter: ['open'], childList: true, subtree: true, characterData: true });
    }

    window.addEventListener('storage', () => {
      setTimeout(renderCards, 80);
    });

    [500, 1200, 2400].forEach((delay) => setTimeout(() => {
      renderCards();
      updateSavings();
    }, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
