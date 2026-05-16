// Recursos visuales SD COMAYAGUA: logo global e imágenes predeterminadas por categoría.
(function () {
  const VERSION = '1.3.0';
  const LOGO = `assets/logo-sdc.svg?v=${VERSION}`;
  const RECEIPT_LOGO = `assets/logo-sdc-receipt.svg?v=${VERSION}`;
  const GENERAL = 'assets/categorias/general.svg';

  const rules = [
    ['dedal', 'dedales'], ['guante', 'guantes'], ['gatillo', 'gatillo'], ['trigger', 'trigger'],
    ['gamer', 'gamer-movil'], ['gamepad', 'gamer'], ['control', 'gamer'],
    ['audifono', 'audifonos'], ['auricular', 'auriculares'], ['audio', 'audio'], ['tipo c', 'tipo-c'],
    ['adaptador', 'adaptador'], ['microsd', 'microsd'], ['micro sd', 'micro-sd'], ['memoria', 'memoria'], ['usb', 'memoria'],
    ['cable', 'cable'], ['cargador', 'cargador'], ['cooler', 'cooler'], ['enfriador', 'enfriador'],
    ['belleza', 'belleza'], ['cocina', 'cocina'], ['herramienta', 'herramientas'], ['hogar', 'hogar'],
    ['termo', 'termo'], ['zapato', 'zapatos'], ['secador', 'secador-zapatos'], ['limpieza', 'limpieza'],
    ['celular', 'celulares'], ['tecnologia', 'tecnologia'], ['accesorio', 'accesorios']
  ];

  const normalize = (value = '') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escapeHtml = (text = '') => String(text || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[c]));

  function categoryImage(product = {}) {
    const source = normalize(`${product.categoria || ''} ${product.nombre || ''}`);
    const found = rules.find(([keyword]) => source.includes(keyword));
    return `assets/categorias/${found ? found[1] : 'general'}.svg`;
  }

  function injectStyle() {
    if (document.getElementById('sdcAssetsStyle')) return;
    const style = document.createElement('style');
    style.id = 'sdcAssetsStyle';
    style.textContent = `
      .logo-mark{overflow:hidden;background:rgba(255,255,255,.06)!important;border:1px solid var(--line)!important;}
      .logo-mark img,.topbar-logo{width:100%;height:100%;object-fit:contain;display:block;padding:4px;}
      .topbar-brandline{display:flex;align-items:center;gap:14px;min-width:0;}
      .topbar-logo{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line);box-shadow:0 10px 24px rgba(0,0,0,.16);flex:0 0 auto;}
      .product-img img.default-product-img{object-fit:contain!important;padding:18px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.24));}
      .receipt-logo{width:74px;height:74px;object-fit:contain;display:block;margin:0 auto 8px;}
      .receipt-header{text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:10px;}
      .splash-logo{width:120px;height:120px;object-fit:contain;margin:0 auto 14px;display:block;filter:drop-shadow(0 18px 32px rgba(0,0,0,.28));}
      @media(max-width:620px){.topbar-brandline{gap:10px}.topbar-logo{width:42px;height:42px}}
    `;
    document.head.appendChild(style);
  }

  function applyLogo() {
    document.querySelectorAll('.logo-mark').forEach(node => {
      node.innerHTML = `<img src="${LOGO}" alt="Logo SD COMAYAGUA">`;
    });
    const titleBlock = document.querySelector('.topbar > div:not(.top-actions)');
    if (titleBlock && !titleBlock.classList.contains('topbar-brandline')) {
      titleBlock.classList.add('topbar-brandline');
      titleBlock.insertAdjacentHTML('afterbegin', `<img class="topbar-logo" src="${LOGO}" alt="Logo SD COMAYAGUA">`);
    }
  }

  function applyProductDefaults() {
    const state = window.SD_POS?.state;
    if (!state?.products) return;
    document.querySelectorAll('.product-card').forEach(card => {
      const code = card.dataset.code;
      const product = state.products.find(item => String(item.codigo) === String(code)) || {};
      const holder = card.querySelector('.product-img');
      if (!holder) return;
      const img = holder.querySelector('img');
      const fallback = categoryImage(product);
      if (!img) {
        holder.innerHTML = `<img class="default-product-img" src="${fallback}" alt="Imagen predeterminada para ${escapeHtml(product.nombre || 'producto')}" loading="lazy" onerror="this.onerror=null;this.src='${GENERAL}'">`;
        return;
      }
      img.onerror = function () {
        this.onerror = function () { this.onerror = null; this.src = GENERAL; };
        this.src = fallback;
        this.classList.add('default-product-img');
      };
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
    injectStyle();
    applyLogo();
    applyProductDefaults();
    applyReceiptLogo();
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
})();
