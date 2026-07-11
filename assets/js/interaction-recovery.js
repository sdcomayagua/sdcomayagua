(() => {
  'use strict';

  const html = document.documentElement;

  function isAdminLocked() {
    return html.classList.contains('sd-admin-locked');
  }

  function setAttributeIfNeeded(element, name, value) {
    if (element && element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  function releaseClosedLayers() {
    if (isAdminLocked()) return;

    const body = document.body;
    const drawer = document.getElementById('storeDrawer');
    const backdrop = document.getElementById('storeDrawerBackdrop');
    const drawerOpen = Boolean(drawer?.classList.contains('open'));

    if (!drawerOpen) {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
      setAttributeIfNeeded(drawer, 'aria-hidden', 'true');
      setAttributeIfNeeded(backdrop, 'aria-hidden', 'true');

      if (body?.style.overflow === 'hidden') {
        body.style.removeProperty('overflow');
      }
    }

    const loading = document.getElementById('loadingOverlay');
    if (loading && loading.style.pointerEvents !== 'none') {
      loading.style.pointerEvents = 'none';
    }

    body?.removeAttribute('inert');
    document.querySelector('.app-main')?.removeAttribute('inert');
  }

  function installContextMenuRecovery() {
    window.addEventListener('contextmenu', (event) => {
      if (isAdminLocked()) return;
      // Impide que bloqueadores posteriores cancelen el menú nativo.
      // No se llama preventDefault(), por lo que el clic derecho sigue funcionando.
      event.stopImmediatePropagation();
    }, true);
  }

  function installAuthObserver() {
    const observer = new MutationObserver(() => {
      if (!isAdminLocked()) window.requestAnimationFrame(releaseClosedLayers);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function boot() {
    installContextMenuRecovery();
    installAuthObserver();
    releaseClosedLayers();

    window.addEventListener('sd:admin-auth-ok', () => {
      window.setTimeout(releaseClosedLayers, 0);
      window.setTimeout(releaseClosedLayers, 250);
      window.setTimeout(releaseClosedLayers, 1200);
    });

    // Revisión corta durante el arranque, sin observar cada cambio interno del DOM.
    let checks = 0;
    const timer = window.setInterval(() => {
      releaseClosedLayers();
      checks += 1;
      if (checks >= 12) window.clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
