(() => {
  'use strict';

  const ACTIONS = [
    ['＋', 'Agregar producto', 'addProductBtn'],
    ['▤', 'Nueva cotización', 'newQuoteBtn'],
    ['↻', 'Sincronizar productos', 'syncBtn'],
    ['▦', 'Administrar categorías', 'categoryManagerBtn'],
    ['⇩', 'Importar Excel', 'importExcelBtn'],
    ['⇧', 'Exportar Excel', 'exportExcelBtn'],
    ['◫', 'Crear respaldo', 'backupBtn'],
    ['◎', 'Revisar imágenes', 'imageAuditBtn'],
    ['≋', 'Revisar repetidos', 'duplicateReviewBtn']
  ];

  function addAdminTools() {
    if (document.body?.dataset.publicCatalog === 'true') return true;
    const scroll = document.querySelector('#storeDrawer .store-drawer-scroll');
    if (!scroll) return false;
    if (document.getElementById('storeAdminDrawerTools')) return true;

    const title = document.createElement('p');
    title.className = 'store-drawer-title';
    title.textContent = 'Administración';

    const note = document.createElement('p');
    note.className = 'store-admin-drawer-note';
    note.textContent = 'Accesos rápidos para administrar el inventario sin recargar la pantalla de productos.';

    const list = document.createElement('div');
    list.id = 'storeAdminDrawerTools';
    list.className = 'store-drawer-list';

    ACTIONS.forEach(([icon, label, targetId]) => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'store-drawer-item store-admin-action';
      button.dataset.storeControl = targetId;
      button.innerHTML = `<span>${icon}</span><span></span><span class="arrow">›</span>`;
      button.children[1].textContent = label;
      list.appendChild(button);
    });

    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-store-control]');
      if (!button) return;
      const control = document.getElementById(button.dataset.storeControl);
      document.getElementById('storeDrawerClose')?.click();
      window.setTimeout(() => control?.click(), 80);
    });

    scroll.append(title, note, list);
    return true;
  }

  function boot() {
    if (addAdminTools()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (addAdminTools() || attempts > 30) window.clearInterval(timer);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
