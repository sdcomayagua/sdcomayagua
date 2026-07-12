// SD COMAYAGUA · Client Commerce Fixes V1
// Correcciones puntuales para menú móvil, WhatsApp, categorías y promociones.
(() => {
  'use strict';

  const PUBLIC_CATALOG = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || document.body?.dataset?.publicCatalog === 'true';
  const INVENTORY_KEY = 'sd_comayagua_products';

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getWhatsAppPhone() {
    const configured = window.SD_WHATSAPP_NUMBER;
    return String(configured || '50431517755').replace(/\D/g, '');
  }

  function openWhatsApp(text) {
    const message = String(text || '').trim();
    if (!message) return;
    const url = `https://wa.me/${getWhatsAppPhone()}?text=${encodeURIComponent(message)}`;
    // En la vista pública es más confiable navegar directamente en móvil.
    if (PUBLIC_CATALOG || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = url;
      return;
    }
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) window.location.href = url;
  }

  function buildDetailWhatsAppText() {
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const price = document.getElementById('detailPrice')?.textContent?.trim() || '';
    const status = document.getElementById('detailStatus')?.textContent?.trim() || '';
    const normal = document.getElementById('detailShippingNormal')?.textContent?.trim() || '';
    const receive = document.getElementById('detailShippingReceive')?.textContent?.trim() || '';
    const promo = document.querySelector('#detailDescription .detail-promo-box')?.textContent?.replace(/\s+/g, ' ')?.trim() || '';

    return [
      '🛍️ *SD COMAYAGUA*',
      '',
      `📦 *Producto:* ${name}`,
      price ? `💵 *Precio:* ${price}` : '',
      status ? `✅ *Estado:* ${status}` : '',
      promo ? `🏷️ *Promoción:* ${promo.replace(/^Promoción activa\s*/i, '')}` : '',
      '',
      normal ? `🚚 *Envío normal:* ${normal}` : '',
      receive ? `📬 *Pagar al recibir:* ${receive}` : '',
      '',
      'Hola, deseo comprar este producto. ¿Me confirma disponibilidad?'
    ].filter(Boolean).join('\n');
  }

  function buildQuoteWhatsAppText() {
    const preview = document.getElementById('quotePreview');
    const cleanPreview = preview?.innerText?.replace(/\n{3,}/g, '\n\n')?.trim() || '';
    return [
      '🧾 *SD COMAYAGUA*',
      '*Pedido desde el catálogo*',
      '',
      cleanPreview || 'Deseo realizar esta compra.',
      '',
      'Hola, deseo confirmar este pedido. ¿Me ayuda con el proceso de compra?'
    ].join('\n');
  }

  function interceptPublicWhatsApp(event) {
    if (!PUBLIC_CATALOG) return;

    const detailButton = event.target.closest?.('#detailWhatsappEmojiBtn, #detailWhatsappFormalBtn, #detailWhatsappCommercialBtn, #detailWhatsappCleanBtn');
    if (detailButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWhatsApp(buildDetailWhatsAppText());
      return;
    }

    const buyButton = event.target.closest?.('#whatsappQuoteBtn');
    if (buyButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWhatsApp(buildQuoteWhatsAppText());
    }
  }

  function readInventory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function categoryIcon(category) {
    const value = normalizeText(category);
    if (/dedal|gamer|juego|free|fire|cod|pubg|game/.test(value)) return '🎮';
    if (/cargador|carga|cable|usb|tipo c|type c|iphone|lightning/.test(value)) return '🔌';
    if (/audio|audifono|auricular|bocina|parlante|speaker|microfono/.test(value)) return '🎧';
    if (/celular|telefono|phone|movil|smartphone/.test(value)) return '📱';
    if (/protector|vidrio|mica|funda|case|estuche/.test(value)) return '🛡️';
    if (/reloj|watch|smartwatch/.test(value)) return '⌚';
    if (/soporte|base|holder|tripode/.test(value)) return '📌';
    if (/luz|led|lampara|aro/.test(value)) return '💡';
    if (/memoria|almacenamiento/.test(value)) return '💾';
    if (/hogar|cocina|belleza|automotriz/.test(value)) return '📦';
    return '📦';
  }

  function renderCategoryRail() {
    const select = document.getElementById('categoryFilter');
    const rail = document.getElementById('quickFilters');
    if (!select || !rail) return;

    const categories = [...select.options]
      .map((option) => ({ value: option.value, label: option.textContent.trim() }))
      .filter((option) => option.value && option.value !== 'all');

    if (!categories.length) return;

    const inventory = readInventory();
    const counts = new Map();
    inventory.forEach((product) => {
      const category = String(product?.category || 'General').trim() || 'General';
      if (PUBLIC_CATALOG && Number(product?.stock || 0) <= 0) return;
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    const active = select.value || 'all';
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0) || inventory.length;
    const items = [{ value: 'all', label: 'Todas', count: total, icon: '🛍️' }, ...categories.map((category) => ({
      ...category,
      count: counts.get(category.value) || 0,
      icon: categoryIcon(category.label)
    }))];

    rail.classList.add('commerce-category-rail');
    rail.setAttribute('aria-label', 'Categorías del catálogo');
    rail.innerHTML = items.map((item) => `
      <button class="quick-filter-btn client-category-chip ${active === item.value ? 'active' : ''}" type="button" data-commerce-category="${escapeHtml(item.value)}">
        <span class="client-category-icon" aria-hidden="true">${item.icon}</span>
        <span class="client-category-text">
          <strong>${escapeHtml(item.label)}</strong>
          <small>${Number(item.count || 0)} producto${Number(item.count || 0) === 1 ? '' : 's'}</small>
        </span>
      </button>
    `).join('');
  }

  function handleCategoryClick(event) {
    const button = event.target.closest?.('[data-commerce-category]');
    if (!button) return;
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    select.value = button.dataset.commerceCategory || 'all';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    renderCategoryRail();
  }

  function formatTierAmount(raw) {
    const normalized = String(raw || '').replace(/,/g, '');
    const number = Number(normalized);
    if (!Number.isFinite(number)) return raw;
    return `Lps.${number.toFixed(2)}`;
  }

  function enhancePromotionBox() {
    document.querySelectorAll('.detail-promo-box:not([data-commerce-enhanced])').forEach((box) => {
      box.setAttribute('data-commerce-enhanced', 'true');
      const paragraph = box.querySelector('p');
      const text = paragraph?.textContent?.replace(/\s+/g, ' ')?.trim() || '';
      const tierMatches = [...text.matchAll(/(\d+)\+\s*Lps?\.?\s*([0-9.,]+)/gi)];

      if (tierMatches.length >= 2) {
        const label = text.split(':')[0]?.trim() || 'Precio por cantidad';
        box.innerHTML = `
          <div class="commerce-promo-heading">
            <span aria-hidden="true">🏷️</span>
            <div><strong>Oferta por cantidad</strong><small>${escapeHtml(label)}</small></div>
          </div>
          <div class="commerce-tier-grid">
            ${tierMatches.map((match) => `
              <div class="commerce-tier-card">
                <span>Desde ${escapeHtml(match[1])}</span>
                <strong>${escapeHtml(formatTierAmount(match[2]))}</strong>
                <small>cada par</small>
              </div>
            `).join('')}
          </div>
        `;
        return;
      }

      box.innerHTML = `
        <div class="commerce-promo-heading">
          <span aria-hidden="true">🎁</span>
          <div><strong>Promoción activa</strong><small>${escapeHtml(text || 'Consulta los beneficios disponibles.')}</small></div>
        </div>
      `;
    });
  }

  function syncMenuState() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('menuToggle');
    if (!nav || !toggle) return;
    const open = nav.classList.contains('open');
    document.body.classList.toggle('mobile-menu-dock-open', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  function patchReceiptSavingsSpacing() {
    if (!window.CanvasRenderingContext2D) return;
    const proto = window.CanvasRenderingContext2D.prototype;
    if (proto.__sdSavingsSpacingPatched) return;
    const originalFillText = proto.fillText;
    proto.fillText = function patchedFillText(text, x, y, maxWidth) {
      const value = String(text || '');
      const adjustedY = this?.canvas?.width === 900 && /^●\s*Ahorras/i.test(value) ? y + 10 : y;
      if (arguments.length >= 4) return originalFillText.call(this, text, x, adjustedY, maxWidth);
      return originalFillText.call(this, text, x, adjustedY);
    };
    proto.__sdSavingsSpacingPatched = true;
  }

  function init() {
    document.addEventListener('click', interceptPublicWhatsApp, true);
    document.addEventListener('click', handleCategoryClick, true);

    const select = document.getElementById('categoryFilter');
    if (select) {
      select.addEventListener('change', () => requestAnimationFrame(renderCategoryRail));
      const selectObserver = new MutationObserver(() => requestAnimationFrame(renderCategoryRail));
      selectObserver.observe(select, { childList: true });
    }

    const detailDescription = document.getElementById('detailDescription');
    if (detailDescription) {
      const promoObserver = new MutationObserver(() => requestAnimationFrame(enhancePromotionBox));
      promoObserver.observe(detailDescription, { childList: true, subtree: true });
    }

    const nav = document.getElementById('mainNav');
    if (nav) {
      const navObserver = new MutationObserver(syncMenuState);
      navObserver.observe(nav, { attributes: true, attributeFilter: ['class'] });
    }

    patchReceiptSavingsSpacing();
    syncMenuState();
    enhancePromotionBox();
    renderCategoryRail();
    setTimeout(renderCategoryRail, 700);
    setTimeout(renderCategoryRail, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
