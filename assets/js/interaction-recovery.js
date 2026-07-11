(() => {
  'use strict';

  const html = document.documentElement;

  function isAdminLocked() {
    return html.classList.contains('sd-admin-locked');
  }

  function releaseClosedLayers() {
    if (isAdminLocked()) return;

    const body = document.body;
    const drawer = document.getElementById('storeDrawer');
    const backdrop = document.getElementById('storeDrawerBackdrop');
    const drawerOpen = Boolean(drawer?.classList.contains('open'));

    if (!drawerOpen) {
      drawer?.classList.remove('open');
      drawer?.setAttribute('aria-hidden', 'true');
      backdrop?.classList.remove('open');
      backdrop?.setAttribute('aria-hidden', 'true');
      body?.style.removeProperty('overflow');
    }

    document.querySelectorAll('dialog:not([open])').forEach((dialog) => {
      dialog.setAttribute('aria-hidden', 'true');
    });

    const loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.style.pointerEvents = 'none';
      const styles = getComputedStyle(loading);
      const alreadyHidden = loading.hidden
        || loading.getAttribute('aria-hidden') === 'true'
        || styles.display === 'none'
        || styles.visibility === 'hidden'
        || Number.parseFloat(styles.opacity || '1') < 0.05;

      if (alreadyHidden) loading.classList.add('interaction-layer-released');
    }

    body?.removeAttribute('inert');
    document.querySelector('.app-main')?.removeAttribute('inert');
  }

  function installContextMenuRecovery() {
    window.addEventListener('contextmenu', (event) => {
      if (isAdminLocked()) return;
      // Detiene bloqueadores registrados posteriormente sin cancelar el menú nativo.
      event.stopImmediatePropagation();
    }, true);
  }

  function installLayerObserver() {
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(releaseClosedLayers);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'open', 'aria-hidden', 'style']
      });
    }
  }

  function boot() {
    installContextMenuRecovery();
    installLayerObserver();
    releaseClosedLayers();

    window.addEventListener('sd:admin-auth-ok', () => {
      window.setTimeout(releaseClosedLayers, 0);
      window.setTimeout(releaseClosedLayers, 250);
      window.setTimeout(releaseClosedLayers, 1200);
    });

    // Revisión corta durante el arranque para limpiar cualquier capa que quede obsoleta.
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
