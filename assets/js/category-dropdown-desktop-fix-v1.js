// SD COMAYAGUA · Refuerzo del selector de categorías en PC estrecha.
(() => {
  'use strict';

  function syncState() {
    const select = document.getElementById('categoryFilter');
    const field = select?.closest('.select-field');
    const toolbar = select?.closest('.toolbar');
    if (!select || !field || !toolbar) return;

    const active = document.activeElement === select || field.matches(':focus-within');
    field.classList.toggle('sd-category-select-open', active);
    toolbar.classList.toggle('sd-category-toolbar-open', active);
  }

  function boot() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    ['focus', 'blur', 'change', 'click', 'pointerdown'].forEach((type) => {
      select.addEventListener(type, () => requestAnimationFrame(syncState));
    });

    document.addEventListener('pointerdown', (event) => {
      if (!event.target.closest?.('#categoryFilter, #productos .select-field')) {
        requestAnimationFrame(syncState);
      }
    }, true);

    window.addEventListener('resize', syncState, { passive: true });
    syncState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
