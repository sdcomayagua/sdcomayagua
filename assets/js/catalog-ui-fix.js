(() => {
  'use strict';

  const ACTION_RULES = [
    { pattern: /ver producto|detalle/, className: 'pro-card-detail' },
    { pattern: /whatsapp/, className: 'pro-card-whatsapp' },
    { pattern: /cotizar|cotizacion/, className: 'pro-card-quote' },
    { pattern: /vender|venta/, className: 'pro-card-sell' },
    { pattern: /duplicar/, className: 'pro-card-duplicate' },
    { pattern: /admin|editar/, className: 'pro-card-admin' }
  ];

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function classifyAction(control) {
    if (!control || control.dataset.proCardActionReady === '1') return;

    const source = [
      control.textContent,
      control.getAttribute('aria-label'),
      control.getAttribute('title'),
      control.dataset.action,
      control.className
    ].filter(Boolean).join(' ');

    const normalized = normalizeText(source);
    const match = ACTION_RULES.find((rule) => rule.pattern.test(normalized));

    if (match) {
      control.classList.add(match.className);
      control.dataset.proCardAction = match.className.replace('pro-card-', '');
    }

    control.dataset.proCardActionReady = '1';
  }

  function decorateCard(card) {
    if (!card) return;

    card.classList.add('pro-catalog-card');

    const actions = card.querySelector('.product-actions');
    if (actions) {
      actions.classList.add('pro-card-actions');
      actions.querySelectorAll('button, a, .btn').forEach(classifyAction);
    }

    card.querySelectorAll('.product-open-detail, .quote-action, .whatsapp-action, .sell-action').forEach(classifyAction);
  }

  function decorateCatalog(root = document) {
    root.querySelectorAll?.('.product-card').forEach(decorateCard);
  }

  function boot() {
    decorateCatalog();

    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid') || document.body;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('.product-card')) decorateCard(node);
          decorateCatalog(node);
        });
      });
    });

    observer.observe(grid, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
