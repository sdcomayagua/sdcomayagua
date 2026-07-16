// SD COMAYAGUA · Ajustes finales de distribución y comportamiento.
(() => {
  'use strict';

  const STARTUP_TOAST = /SD COMAYAGUA\s+listo para trabajar/i;
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toastTimers = new WeakMap();

  function updateStickyHeaderHeight() {
    const header = qs('.app-header');
    if (!header) return;
    const height = Math.max(0, Math.ceil(header.getBoundingClientRect().height));
    document.documentElement.style.setProperty('--sd-header-height', `${height}px`);
  }

  function normalizeResultPill() {
    const pill = qs('.store-result-pill');
    if (!pill) return;

    let count = qs('#storeVisibleCount', pill);
    if (!count) {
      count = document.createElement('b');
      count.id = 'storeVisibleCount';
      count.textContent = '0';
    }

    let label = qs('.sd-result-label', pill);
    if (!label) {
      label = document.createElement('span');
      label.className = 'sd-result-label';
      label.textContent = 'productos';
    }

    if (pill.children.length !== 2 || pill.firstElementChild !== count || pill.lastElementChild !== label) {
      pill.replaceChildren(count, label);
    }
  }

  function restoreToastForNewMessage(node) {
    if (node.dataset.sdStartupToastHidden !== '1') return;
    node.dataset.sdStartupToastHidden = '0';
    node.hidden = false;
    node.removeAttribute('aria-hidden');
    node.style.removeProperty('display');
    node.style.removeProperty('opacity');
    node.style.removeProperty('visibility');
    node.style.removeProperty('transform');
  }

  function hideStartupToast(node) {
    if (!(node instanceof Element)) return;
    const text = (node.textContent || '').trim();

    if (!STARTUP_TOAST.test(text)) {
      restoreToastForNewMessage(node);
      return;
    }

    const previous = toastTimers.get(node);
    if (previous) window.clearTimeout(previous);

    const timer = window.setTimeout(() => {
      if (!STARTUP_TOAST.test((node.textContent || '').trim())) return;

      node.dataset.sdStartupToastHidden = '1';
      node.classList.remove('show', 'visible', 'open', 'active', 'is-visible');
      node.setAttribute('aria-hidden', 'true');
      node.style.setProperty('opacity', '0', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('transform', 'translateY(12px)', 'important');

      window.setTimeout(() => {
        if (node.dataset.sdStartupToastHidden === '1') {
          node.hidden = true;
          node.style.setProperty('display', 'none', 'important');
        }
      }, 260);
    }, 2600);

    toastTimers.set(node, timer);
  }

  function scanToasts(root = document) {
    const candidates = new Set();

    if (root instanceof Element && root.matches('#toast, .toast, [role="status"]')) {
      candidates.add(root);
    }

    qsa('#toast, .toast, [role="status"]', root).forEach((node) => candidates.add(node));
    candidates.forEach(hideStartupToast);
  }

  function centerDetailOnOpen() {
    const dialog = qs('#detailDialog');
    if (!dialog?.open) return;

    const card = qs('.detail-card', dialog);
    if (card && card.dataset.sdOpenedCentered !== '1') {
      card.dataset.sdOpenedCentered = '1';
      requestAnimationFrame(() => card.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    }
  }

  function resetDetailState() {
    const dialog = qs('#detailDialog');
    if (!dialog || dialog.open) return;
    const card = qs('.detail-card', dialog);
    if (card) delete card.dataset.sdOpenedCentered;
  }

  function sync() {
    updateStickyHeaderHeight();
    normalizeResultPill();
    scanToasts();
    centerDetailOnOpen();
    resetDetailState();
  }

  function boot() {
    sync();

    const header = qs('.app-header');
    if (header && 'ResizeObserver' in window) {
      new ResizeObserver(updateStickyHeaderHeight).observe(header);
    }

    const dialog = qs('#detailDialog');
    if (dialog) {
      new MutationObserver(sync).observe(dialog, {
        attributes: true,
        attributeFilter: ['open'],
        childList: true,
        subtree: true
      });
      dialog.addEventListener('close', resetDetailState);
      dialog.addEventListener('cancel', resetDetailState);
    }

    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scanToasts(node);
        });
        if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement;
          if (parent) scanToasts(parent.closest('#toast, .toast, [role="status"]') || parent);
        }
      });
      normalizeResultPill();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.addEventListener('resize', updateStickyHeaderHeight, { passive: true });
    window.addEventListener('pageshow', sync);

    [100, 350, 800, 1500, 2600, 4200].forEach((delay) => window.setTimeout(sync, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
