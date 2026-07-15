(() => {
  'use strict';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  let syncQueued = false;

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function extractPrice(card) {
    const priceNode = qs('.product-price, [data-product-price], .price', card);
    if (!priceNode) return '';

    const raw = cleanText(priceNode.textContent)
      .replace(/^precio\s*:?[\s-]*/i, '')
      .replace(/^venta\s*:?[\s-]*/i, '');

    const currencyMatch = raw.match(/(?:Lps?\.?|L)\s*[\d.,]+/i);
    return cleanText(currencyMatch?.[0] || raw);
  }

  function extractPromo(card) {
    const promoNode = qs('.promo-badges, .promo-mini-card, [data-promotion], .promotion-badge', card);
    const raw = cleanText(promoNode?.textContent);
    if (!raw || /sin promoci[oó]n/i.test(raw)) return '';
    return raw.length > 42 ? `${raw.slice(0, 39).trim()}…` : raw;
  }

  function createBottomRow(price, feature = false) {
    const row = document.createElement('div');
    row.className = feature ? 'gm-feature-bottom' : 'gm-card-bottom';

    const priceNode = document.createElement('strong');
    priceNode.className = feature ? 'gm-feature-price' : 'gm-card-price';
    priceNode.textContent = price || 'Ver precio';

    const action = document.createElement('span');
    action.className = feature ? 'gm-feature-cta' : 'gm-card-cta';
    action.setAttribute('aria-hidden', 'true');
    action.textContent = '›';

    row.append(priceNode, action);
    return row;
  }

  function decorateProductCard(card) {
    const view = qs(':scope > .store-card-view', card);
    const copy = qs('.store-card-copy', view || card);
    if (!view || !copy) return;

    const price = extractPrice(card);
    const promo = extractPromo(card);

    let promoLabel = qs(':scope > .gm-promo-label', copy);
    if (promo) {
      if (!promoLabel) {
        promoLabel = document.createElement('span');
        promoLabel.className = 'gm-promo-label';
        const bottom = qs(':scope > .gm-card-bottom', copy);
        copy.insertBefore(promoLabel, bottom || null);
      }
      if (promoLabel.textContent !== promo) promoLabel.textContent = promo;
    } else {
      promoLabel?.remove();
    }

    let bottom = qs(':scope > .gm-card-bottom', copy);
    if (!bottom) {
      bottom = createBottomRow(price, false);
      copy.appendChild(bottom);
    } else {
      const priceNode = qs('.gm-card-price', bottom);
      if (priceNode && priceNode.textContent !== (price || 'Ver precio')) {
        priceNode.textContent = price || 'Ver precio';
      }
    }

    qsa('img', view).forEach((image) => {
      image.loading = 'lazy';
      image.decoding = 'async';
    });
  }

  function decorateFeaturedCards() {
    const sourceCards = qsa('#productGrid .product-card');
    const featureCards = qsa('#storeFeaturedGrid .store-feature-card');

    featureCards.forEach((featureCard, index) => {
      const source = sourceCards[index];
      const copy = qs('.store-feature-copy', featureCard);
      if (!source || !copy) return;

      const price = extractPrice(source);
      let bottom = qs(':scope > .gm-feature-bottom', copy);
      if (!bottom) {
        bottom = createBottomRow(price, true);
        copy.appendChild(bottom);
      } else {
        const priceNode = qs('.gm-feature-price', bottom);
        if (priceNode && priceNode.textContent !== (price || 'Ver precio')) {
          priceNode.textContent = price || 'Ver precio';
        }
      }

      qsa('img', featureCard).forEach((image) => {
        image.loading = 'lazy';
        image.decoding = 'async';
      });
    });
  }

  function enhanceHero() {
    const actions = qs('.store-hero-actions');
    if (!actions || qs('.gm-hero-trust')) return;

    const trust = document.createElement('div');
    trust.className = 'gm-hero-trust';
    trust.innerHTML = [
      '<span>✓ Atención rápida</span>',
      '<span>✓ Envíos a Honduras</span>',
      '<span>✓ Pagar al recibir</span>'
    ].join('');
    actions.insertAdjacentElement('afterend', trust);
  }

  function improveAccessibility() {
    const drawer = qs('#storeDrawer');
    const toggle = qs('#menuToggle');
    if (drawer && toggle && toggle.dataset.gmAriaReady !== '1') {
      toggle.dataset.gmAriaReady = '1';
      const observer = new MutationObserver(() => {
        toggle.setAttribute('aria-expanded', drawer.classList.contains('open') ? 'true' : 'false');
      });
      observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    }

    qsa('.store-category-card, .store-feature-card, .product-card.store-minimal-card').forEach((item) => {
      if (!item.getAttribute('aria-label')) item.setAttribute('aria-label', 'Ver producto');
    });
  }

  function sync() {
    syncQueued = false;
    enhanceHero();
    qsa('#productGrid .product-card.store-minimal-card').forEach(decorateProductCard);
    decorateFeaturedCards();
    improveAccessibility();
    document.documentElement.classList.add('gm-ready');
  }

  function scheduleSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(sync);
  }

  function installObservers() {
    ['#productGrid', '#storeFeaturedGrid', '#inicio'].forEach((selector) => {
      const target = qs(selector);
      if (!target) return;
      new MutationObserver(scheduleSync).observe(target, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  function installScrollState() {
    const update = () => document.body?.classList.toggle('gm-scrolled', window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function boot() {
    installObservers();
    installScrollState();
    scheduleSync();

    let attempts = 0;
    const warmup = window.setInterval(() => {
      scheduleSync();
      attempts += 1;
      if (attempts >= 12) window.clearInterval(warmup);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
