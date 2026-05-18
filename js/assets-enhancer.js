// SD COMAYAGUA POS - cargador visual seguro v1.4.8
(function () {
  const VERSION = '1.6.5';
  const LOGO = `assets/logo-sdc.svg?v=${VERSION}`;
  const RECEIPT_LOGO = `assets/logo-sdc-receipt.svg?v=${VERSION}`;

  const cssFiles = [
    'css/mobile-fix.css',
    'css/final-polish.css',
    'css/catalog-mode.css',
    'css/mobile-redesign.css',
    'css/mobile-ultimate.css',
    'css/mobile-final-v140.css',
    'css/catalog-shipping-v141.css',
    'css/stock-states-v143.css',
    'css/shipping-modal-polish-v144.css',
    'css/catalog-inventory-polish-v145.css',
    'css/product-promo-editor-v146.css',
    'css/product-image-upload-v147.css',
    'css/mobile-ui-fix-v148.css',
    'css/sdc-ui-redesign-v163.css',
    'css/sdc-ui-redesign-v164.css',
    'css/sdc-ui-redesign-v165.css'
  ];
  const jsFiles = [
    'js/document-actions.js',
    'js/catalog-mode.js',
    'js/catalog-admin-cards.js',
    'js/catalog-shipping-quote.js',
    'js/shipping-polish-v142.js',
    'js/stock-states-v143.js',
    'js/catalog-admin-tools-v145.js',
    'js/product-promo-editor-v146.js',
    'js/product-image-upload-v147.js'
  ];

  function loadCss(path) {
    const existing = document.querySelector(`link[href*="${path}"]`);
    if (existing) {
      if (path.includes('sdc-ui-redesign-v165.css')) document.head.appendChild(existing);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${path}?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function loadScript(path) {
    if (document.querySelector(`script[src*="${path}"]`)) return;
    const script = document.createElement('script');
    script.src = `${path}?v=${VERSION}`;
    script.defer = true;
    document.body.appendChild(script);
  }

  function injectAssets() {
    cssFiles.forEach(loadCss);
    jsFiles.forEach(loadScript);
  }

  function injectBaseStyle() {
    if (document.getElementById('sdcAssetsStyle')) return;
    const style = document.createElement('style');
    style.id = 'sdcAssetsStyle';
    style.textContent = `
      html,body{max-width:100%;overflow-x:hidden!important;}
      .logo-mark{overflow:hidden;background:rgba(255,255,255,.06)!important;border:1px solid var(--line)!important;}
      .logo-mark img,.topbar-logo{width:100%;height:100%;object-fit:contain;display:block;padding:4px;}
      .topbar-brandline{display:flex;align-items:center;gap:14px;min-width:0;}
      .topbar-logo{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line);box-shadow:0 10px 24px rgba(0,0,0,.16);flex:0 0 auto;}
      .product-img img.default-product-img{object-fit:contain!important;padding:18px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.24));}
      .receipt-logo{width:74px;height:74px;object-fit:contain;display:block;margin:0 auto 8px;}
      .receipt-header{text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:10px;}
      body[data-catalog-mode="client"] .meta-pill.stock{display:grid!important;grid-template-columns:minmax(0,1fr) max-content!important;align-items:center!important;column-gap:10px!important;min-width:0!important;overflow:hidden!important;}
      body[data-catalog-mode="client"] .meta-pill.stock small{display:block!important;min-width:0!important;margin:0!important;font-size:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}
      body[data-catalog-mode="client"] .meta-pill.stock small::before{content:'Stock'!important;display:block!important;font-size:.64rem!important;line-height:1!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:var(--muted)!important;white-space:nowrap!important;}
      body[data-catalog-mode="client"] .meta-pill.stock strong{justify-self:end!important;min-width:2.2em!important;text-align:right!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important;color:#16a34a!important;}
      @media(max-width:360px){body[data-catalog-mode="client"] .meta-pill.stock{column-gap:7px!important;padding-left:8px!important;padding-right:8px!important;}body[data-catalog-mode="client"] .meta-pill.stock small::before{content:'Cant.'!important;font-size:.60rem!important;}body[data-catalog-mode="client"] .meta-pill.stock strong{min-width:1.9em!important;font-size:.86rem!important;}}
      @media(max-width:620px){.topbar .btn[data-open-product],.top-actions .btn[data-open-product]{display:inline-flex!important}.view-root{overflow-x:hidden!important}.card{max-width:100%!important}}
    `;
    document.head.appendChild(style);
  }

  function applyLogo() {
    document.querySelectorAll('.logo-mark').forEach(node => {
      if (node.querySelector('img')) return;
      node.innerHTML = `<img src="${LOGO}" alt="Logo SD COMAYAGUA">`;
    });
    document.querySelectorAll('.topbar-logo').forEach(img => {
      if (!img.src.includes('assets/logo-sdc.svg')) img.src = LOGO;
    });
  }

  function applyReceiptLogo() {
    document.querySelectorAll('.receipt').forEach(receipt => {
      if (receipt.querySelector('.receipt-logo')) return;
      const h2 = receipt.querySelector('h2');
      if (!h2) return;
      const header = document.createElement('div');
      header.className = 'receipt-header';
      header.innerHTML = `<img class="receipt-logo" src="${RECEIPT_LOGO}" alt="Logo SD COMAYAGUA">`;
      h2.before(header);
      header.appendChild(h2);
    });
  }

  function run() {
    injectAssets();
    injectBaseStyle();
    applyLogo();
    applyReceiptLogo();
  }

  let scheduled = false;
  function scheduleRun() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(scheduleRun).observe(document.documentElement, { childList: true, subtree: true });
})();