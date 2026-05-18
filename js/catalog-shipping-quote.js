// SD COMAYAGUA POS - Precio con envío y promociones visuales v1.4.1
(function () {
  const VERSION = '1.4.1';
  const PRODUCT_KEY = 'sd_pos_products';
  const SETTINGS_KEY = 'sd_pos_settings';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  };
  const n = value => Number(String(value ?? 0).replace(/,/g, '')) || 0;
  const esc = text => String(text ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[ch]));
  const products = () => window.SD_POS?.state?.products || read(PRODUCT_KEY, []);
  const settings = () => window.SD_POS?.state?.settings || read(SETTINGS_KEY, {});
  const currency = () => settings().currency || 'Lps.';
  const money = value => `${currency()} ${n(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function productByCode(code) {
    return products().find(p => String(p.codigo) === String(code));
  }

  function parseRules(text = '') {
    return String(text || '')
      .split(/[|;,\n]+/)
      .map(part => {
        const match = part.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
        if (!match) return null;
        const qty = parseInt(match[1], 10);
        const total = n(match[2]);
        return qty > 0 && total > 0 ? { qty, total } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.qty - b.qty);
  }

  function promoTotal(qty, unitPrice, promoText = '') {
    const amount = Math.max(1, Math.floor(n(qty) || 1));
    const unit = n(unitPrice);
    const base = amount * unit;
    const rules = parseRules(promoText);
    if (!rules.length) return { qty: amount, base, total: base, discount: 0, rules };

    const exact = rules.find(rule => rule.qty === amount);
    if (exact) return { qty: amount, base, total: exact.total, discount: Math.max(0, base - exact.total), rules };

    const best = Array(amount + 1).fill(Infinity);
    best[0] = 0;
    for (let i = 1; i <= amount; i++) {
      best[i] = best[i - 1] + unit;
      rules.forEach(rule => {
        if (rule.qty <= i) best[i] = Math.min(best[i], best[i - rule.qty] + rule.total);
      });
    }
    const total = Number.isFinite(best[amount]) ? Math.min(base, best[amount]) : base;
    return { qty: amount, base, total, discount: Math.max(0, base - total), rules };
  }

  function offerChips(text) {
    const rules = parseRules(text);
    if (!rules.length) return '';
    return `<span class="sdc-offers-title">Ofertas por cantidad</span><div class="sdc-offer-chips">${rules.slice(0, 12).map(rule => `<span class="sdc-offer-chip"><b>${rule.qty} x ${money(rule.total)}</b><small>${money(rule.total / rule.qty)} c/u</small></span>`).join('')}</div>`;
  }

  function enhancePromos() {
    document.querySelectorAll('.product-card').forEach(card => {
      const promo = card.querySelector('.product-promo');
      if (!promo || promo.dataset.enhancedPromo === '1') return;
      const raw = promo.textContent.trim();
      const html = offerChips(raw);
      if (!html) return;
      promo.dataset.enhancedPromo = '1';
      promo.dataset.rawPromo = raw;
      promo.classList.add('sdc-promo-enhanced');
      promo.innerHTML = html;
    });
  }

  function enhanceButtons() {
    document.querySelectorAll('.product-card[data-code]').forEach(card => {
      const code = card.dataset.code;
      const actions = card.querySelector('.product-actions');
      if (!actions || actions.querySelector('[data-shipping-quote]')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn secondary';
      btn.dataset.shippingQuote = code;
      btn.textContent = 'Con envío';
      const whatsapp = actions.querySelector('[data-whatsapp-product]');
      if (whatsapp) actions.insertBefore(btn, whatsapp);
      else actions.appendChild(btn);
    });
  }

  function productImage(product) {
    if (product?.imagen) return product.imagen;
    return 'assets/categorias/general.svg';
  }

  function shippingCalc(product, qty) {
    const set = settings();
    const promo = promoTotal(qty, product.precio, product.promos || '');
    const normalShipping = n(set.normalShipping || 0);
    const codShipping = n(set.codShipping || normalShipping || 0);
    const codCommissionRate = n(set.codCommissionRate || 0);
    const codCommission = promo.total * codCommissionRate;
    return {
      promo,
      normalShipping,
      codShipping,
      codCommission,
      normalTotal: promo.total + normalShipping,
      codTotal: promo.total + codShipping + codCommission,
    };
  }

  function messageText(product, qty, calc) {
    const lines = [
      `Producto: ${product.nombre}`,
      `Cantidad: ${qty}`,
      `Precio producto: ${money(calc.promo.total)}`,
      calc.promo.discount > 0 ? `Promo aplicada: ahorro ${money(calc.promo.discount)}` : '',
      `Con envío normal: ${money(calc.normalTotal)}`,
      `Pago al recibir/COD: ${money(calc.codTotal)}`
    ].filter(Boolean);
    return lines.join('\n');
  }

  function renderModal(product, qty = 1) {
    const calc = shippingCalc(product, qty);
    const msg = messageText(product, qty, calc);
    return `
      <section class="modal" role="dialog" aria-modal="true" aria-label="Precio con envío">
        <header class="modal-header">
          <h2>Precio con envío</h2>
          <button class="icon-btn" data-close-modal aria-label="Cerrar">×</button>
        </header>
        <div class="modal-body">
          <div class="sdc-ship-modal" data-ship-code="${esc(product.codigo)}">
            <div class="sdc-ship-hero">
              <img src="${esc(productImage(product))}" alt="${esc(product.nombre)}" onerror="this.onerror=null;this.src='assets/categorias/general.svg'">
              <div>
                <h3>${esc(product.nombre)}</h3>
                <p>${esc(product.codigo || '')} · Disponible: ${n(product.stock)}</p>
              </div>
            </div>
            <div class="sdc-ship-qty">
              <label>Cantidad
                <input type="number" min="1" max="${Math.max(1, n(product.stock))}" value="${qty}" data-ship-qty>
              </label>
              <button class="btn primary" type="button" data-ship-refresh>Calcular</button>
            </div>
            <div class="sdc-ship-results">
              <div class="sdc-ship-row"><span>Producto</span><strong>${money(calc.promo.total)}</strong></div>
              ${calc.promo.discount > 0 ? `<div class="sdc-ship-row"><span>Ahorro promo</span><strong>${money(calc.promo.discount)}</strong></div>` : ''}
              <div class="sdc-ship-row"><span>Envío normal</span><strong>${money(calc.normalShipping)}</strong></div>
              <div class="sdc-ship-row total-normal"><span>Total envío normal</span><strong>${money(calc.normalTotal)}</strong></div>
              <div class="sdc-ship-row"><span>Envío pago al recibir</span><strong>${money(calc.codShipping)}</strong></div>
              ${calc.codCommission > 0 ? `<div class="sdc-ship-row"><span>Comisión COD</span><strong>${money(calc.codCommission)}</strong></div>` : ''}
              <div class="sdc-ship-row total-cod"><span>Total pago al recibir</span><strong>${money(calc.codTotal)}</strong></div>
            </div>
            ${calc.promo.rules.length ? `<div class="sdc-offers-panel">${offerChips(product.promos || '')}</div>` : ''}
            <div class="sdc-copy-box" data-copy-text>${esc(msg)}</div>
            <div class="sdc-ship-actions">
              <button class="btn primary" type="button" data-copy-shipping>Copiar datos</button>
              <button class="btn secondary" type="button" data-add-ship-cart>Agregar al carrito</button>
              <button class="btn ghost span" type="button" data-close-modal>Cerrar</button>
            </div>
          </div>
        </div>
      </section>`;
  }

  function openShipping(code, qty = 1) {
    const product = productByCode(code);
    const root = document.getElementById('modalRoot');
    if (!product || !root) return;
    root.hidden = false;
    root.innerHTML = renderModal(product, qty);
  }

  function closeModal() {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    root.hidden = true;
    root.innerHTML = '';
  }

  function addToCart(code) {
    const btn = document.querySelector(`[data-cart-add="${CSS.escape(code)}"]`);
    if (btn) btn.click();
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  document.addEventListener('click', event => {
    const ship = event.target.closest('[data-shipping-quote]');
    if (ship) {
      event.preventDefault();
      event.stopPropagation();
      return openShipping(ship.dataset.shippingQuote, 1);
    }

    if (event.target.closest('[data-close-modal]')) return closeModal();

    const refresh = event.target.closest('[data-ship-refresh]');
    if (refresh) {
      const box = refresh.closest('[data-ship-code]');
      const qty = Math.max(1, n(box?.querySelector('[data-ship-qty]')?.value || 1));
      return openShipping(box.dataset.shipCode, qty);
    }

    const add = event.target.closest('[data-add-ship-cart]');
    if (add) {
      const box = add.closest('[data-ship-code]');
      const code = box?.dataset.shipCode;
      const qty = Math.max(1, n(box?.querySelector('[data-ship-qty]')?.value || 1));
      closeModal();
      for (let i = 0; i < qty; i++) addToCart(code);
      return;
    }

    const copy = event.target.closest('[data-copy-shipping]');
    if (copy) {
      const text = copy.closest('[data-ship-code]')?.querySelector('[data-copy-text]')?.textContent || '';
      copyText(text).then(() => {
        copy.textContent = 'Copiado';
        setTimeout(() => copy.textContent = 'Copiar datos', 1400);
      });
    }
  }, true);

  let scheduled = false;
  function run() {
    enhancePromos();
    enhanceButtons();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; run(); });
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
