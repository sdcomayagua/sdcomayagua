// SD COMAYAGUA POS - cargador visual seguro v1.3.7
(function () {
  const VERSION = '1.3.7';
  const LOGO = `assets/logo-sdc.svg?v=${VERSION}`;
  const RECEIPT_LOGO = `assets/logo-sdc-receipt.svg?v=${VERSION}`;

  const cssFiles = [
    'css/mobile-fix.css',
    'css/final-polish.css',
    'css/catalog-mode.css',
    'css/mobile-redesign.css'
  ];
  const jsFiles = [
    'js/document-actions.js',
    'js/catalog-mode.js'
  ];

  function loadCss(path) {
    if ([...document.styleSheets].some(s => s.href && s.href.includes(path))) return;
    if (document.querySelector(`link[href*="${path}"]`)) return;
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
      @media(max-width:620px){.topbar{position:static!important;top:auto!important}.topbar .btn[data-open-product],.top-actions .btn[data-open-product]{display:none!important}.topbar-logo{width:42px;height:42px}.view-root{overflow-x:hidden!important}.status-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important}.card{max-width:calc(100vw - 28px)!important}}
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
