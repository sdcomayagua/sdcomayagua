// SD COMAYAGUA POS - Admin por producto v1.3.8
(function () {
  const PRODUCT_KEY = 'sd_pos_products';
  const CURRENCY = () => window.SD_POS?.state?.settings?.currency || 'Lps.';
  const money = value => `${CURRENCY()} ${Number(value || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const readProducts = () => {
    if (window.SD_POS?.state?.products?.length) return window.SD_POS.state.products;
    try { return JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]'); }
    catch (_) { return []; }
  };

  function productByCode(code) {
    return readProducts().find(p => String(p.codigo) === String(code));
  }

  function isCatalog() {
    return /cat[aá]logo/i.test(document.getElementById('viewTitle')?.textContent || '');
  }

  function adminHtml(product) {
    const stock = Number(product.stock || 0);
    const precio = Number(product.precio || 0);
    const costo = Number(product.costo || 0);
    const ventaTotal = precio * stock;
    const inversion = costo * stock;
    const ganancia = ventaTotal - inversion;
    return `
      <div class="sdc-admin-card-info" data-admin-product-info>
        <div><small>Costo/u</small><strong>${money(costo)}</strong></div>
        <div><small>Invertido</small><strong>${money(inversion)}</strong></div>
        <div><small>Venta total</small><strong>${money(ventaTotal)}</strong></div>
        <div><small>Ganancia</small><strong>${money(ganancia)}</strong></div>
      </div>`;
  }

  function apply() {
    if (!isCatalog()) return;
    document.querySelectorAll('[data-admin-summary]').forEach(node => node.remove());
    document.querySelectorAll('.admin-summary').forEach(node => node.remove());

    const isAdmin = document.body.dataset.catalogMode === 'admin';
    document.querySelectorAll('.product-card').forEach(card => {
      const old = card.querySelector('[data-admin-product-info]');
      if (!isAdmin) {
        if (old) old.remove();
        return;
      }
      if (old) return;
      const product = productByCode(card.dataset.code);
      if (!product) return;
      const target = card.querySelector('.price-row') || card.querySelector('.product-body');
      if (!target) return;
      target.insertAdjacentHTML('afterend', adminHtml(product));
    });
  }

  function injectStyle() {
    if (document.getElementById('sdcAdminCardInfoStyle')) return;
    const style = document.createElement('style');
    style.id = 'sdcAdminCardInfoStyle';
    style.textContent = `
      [data-admin-summary], .admin-summary { display:none!important; }
      .sdc-admin-card-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2px}
      .sdc-admin-card-info>div{border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:9px;background:rgba(2,6,23,.34)}
      .sdc-admin-card-info small{display:block;color:var(--muted);font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
      .sdc-admin-card-info strong{display:block;color:var(--text);font-size:.82rem;line-height:1.16;word-break:break-word}
      @media(max-width:620px){body[data-catalog-mode="admin"] .product-grid{grid-template-columns:1fr!important}.sdc-admin-card-info{grid-template-columns:repeat(2,minmax(0,1fr))}.sdc-admin-card-info strong{font-size:.78rem}}
    `;
    document.head.appendChild(style);
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      injectStyle();
      apply();
    });
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-catalog-mode]')) setTimeout(schedule, 60);
  });
  window.addEventListener('load', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
