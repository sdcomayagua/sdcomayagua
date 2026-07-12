// SD COMAYAGUA · Galería de productos y compra directa V1
// Guarda hasta cinco URLs dentro del mismo producto mediante un marcador oculto
// en la descripción. Reutiliza el cargador original, Firebase y los respaldos.
(() => {
  'use strict';

  const MAX_IMAGES = 5;
  const TOKEN = 'SD_GALLERY_V1';
  const MARKER_RE = /\[\[SD_GALLERY_V1:([^\]]+)\]\]/g;
  const PUBLIC = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(window.location.pathname);
  const SHIPPING = 110;
  const COD_RATE = 0.10;
  const state = {
    images: [],
    detailImages: [],
    detailIndex: 0,
    quantity: 1,
    basePrice: 0,
    stock: 1,
    promoText: '',
    uploadBusy: false
  };
  const money = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function unique(values = []) {
    const seen = new Set();
    return values.map((value) => String(value || '').trim()).filter((value) => value && !seen.has(value) && seen.add(value)).slice(0, MAX_IMAGES);
  }

  function escapeAttr(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function imageHtml(url, alt) {
    return `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt || 'Producto')}" loading="lazy" decoding="async">`;
  }

  function encodeImages(images) {
    return encodeURIComponent(JSON.stringify(unique(images)));
  }

  function decodeImages(value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(String(value || '')));
      return Array.isArray(parsed) ? unique(parsed) : [];
    } catch {
      return [];
    }
  }

  function parseDescription(text) {
    const source = String(text || '');
    const images = [...source.matchAll(MARKER_RE)].flatMap((match) => decodeImages(match[1]));
    return {
      images: unique(images),
      description: source.replace(MARKER_RE, '').replace(/\n{3,}/g, '\n\n').trim()
    };
  }

  function serializeDescription(description, images) {
    const clean = parseDescription(description).description;
    const list = unique(images);
    if (!list.length) return clean;
    const marker = `[[${TOKEN}:${encodeImages(list)}]]`;
    return clean ? `${clean}\n\n${marker}` : marker;
  }

  function parseMoney(value) {
    const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatMoney(value) {
    return `Lps.${money.format(Number(value || 0))}`;
  }

  function codTotal(normalTotal) {
    const raw = Number(normalTotal || 0) * (1 + COD_RATE);
    return Number.isInteger(raw) ? raw : Math.ceil(raw) + 1;
  }

  function dedales(name) {
    return /dedal/i.test(String(name || ''));
  }

  function unitLabel(name, quantity) {
    if (dedales(name)) return quantity === 1 ? 'par' : 'pares';
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  /* ---------------- EDITOR 1-5 IMÁGENES ---------------- */
  function ensureEditor() {
    const imageField = document.querySelector('#productForm .image-upload-field');
    if (!imageField || document.getElementById('productGalleryEditor')) return;

    const editor = document.createElement('section');
    editor.id = 'productGalleryEditor';
    editor.className = 'product-gallery-editor full-field';
    editor.innerHTML = `
      <div class="product-gallery-editor-head">
        <div><strong>Galería del producto</strong><small>Agrega entre 1 y 5 fotografías. Solo la portada aparece en la cuadrícula.</small></div>
        <span id="productGalleryCount" class="product-gallery-count">0/${MAX_IMAGES}</span>
      </div>
      <button id="productGalleryUploadBtn" class="btn btn-secondary product-gallery-upload" type="button">+ Agregar imágenes</button>
      <input id="productGalleryFiles" type="file" accept="image/*" multiple hidden>
      <div id="productGalleryStatus" class="product-gallery-status" aria-live="polite"></div>
      <div id="productGalleryThumbs" class="product-gallery-editor-thumbs"></div>
    `;
    imageField.insertAdjacentElement('afterend', editor);

    document.getElementById('productGalleryUploadBtn')?.addEventListener('click', () => {
      if (state.uploadBusy) return;
      if (state.images.length >= MAX_IMAGES) return setStatus('Ya tienes el máximo de 5 imágenes.', 'warning');
      document.getElementById('productGalleryFiles')?.click();
    });

    document.getElementById('productGalleryFiles')?.addEventListener('change', async (event) => {
      const files = [...(event.target.files || [])].filter((file) => file.type.startsWith('image/'));
      event.target.value = '';
      if (!files.length) return;
      await uploadFiles(files.slice(0, MAX_IMAGES - state.images.length));
    });

    editor.addEventListener('click', (event) => {
      const coverButton = event.target.closest('[data-gallery-cover]');
      if (coverButton) {
        const index = Number(coverButton.dataset.galleryCover);
        if (Number.isInteger(index) && state.images[index]) {
          const [selected] = state.images.splice(index, 1);
          state.images.unshift(selected);
          syncCover();
          renderEditor();
        }
        return;
      }
      const removeButton = event.target.closest('[data-gallery-remove]');
      if (removeButton) {
        const index = Number(removeButton.dataset.galleryRemove);
        if (Number.isInteger(index) && state.images[index]) {
          state.images.splice(index, 1);
          syncCover();
          renderEditor();
        }
      }
    });

    document.getElementById('productImage')?.addEventListener('change', (event) => {
      const url = String(event.target.value || '').trim();
      if (!url) return;
      if (!state.images.length) state.images = [url];
      else state.images[0] = url;
      state.images = unique(state.images);
      renderEditor();
    });
  }

  function setStatus(message, type = '') {
    const status = document.getElementById('productGalleryStatus');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.type = type;
  }

  function syncCover() {
    const input = document.getElementById('productImage');
    if (!input) return;
    const next = state.images[0] || '';
    if (input.value !== next) {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function renderEditor() {
    const thumbs = document.getElementById('productGalleryThumbs');
    const count = document.getElementById('productGalleryCount');
    const button = document.getElementById('productGalleryUploadBtn');
    if (!thumbs || !count) return;
    count.textContent = `${state.images.length}/${MAX_IMAGES}`;
    if (button) {
      button.disabled = state.uploadBusy || state.images.length >= MAX_IMAGES;
      button.textContent = state.uploadBusy ? 'Subiendo imágenes...' : state.images.length >= MAX_IMAGES ? 'Galería completa' : '+ Agregar imágenes';
    }
    if (!state.images.length) {
      thumbs.innerHTML = '<p class="product-gallery-empty">No has agregado fotografías. Puedes guardar el producto así o subir hasta cinco.</p>';
      return;
    }
    thumbs.innerHTML = state.images.map((url, index) => `
      <article class="product-gallery-editor-item ${index === 0 ? 'is-cover' : ''}">
        <button type="button" class="product-gallery-editor-preview" data-gallery-cover="${index}" aria-label="Usar imagen ${index + 1} como portada">${imageHtml(url, `Imagen ${index + 1}`)}</button>
        <div class="product-gallery-editor-item-actions">
          <button type="button" class="gallery-cover-btn" data-gallery-cover="${index}">${index === 0 ? 'Portada' : 'Usar de portada'}</button>
          <button type="button" class="gallery-remove-btn" data-gallery-remove="${index}" aria-label="Eliminar imagen ${index + 1}">×</button>
        </div>
      </article>`).join('');
  }

  async function uploadFiles(files) {
    const nativeInput = document.getElementById('productImageFile');
    const urlInput = document.getElementById('productImage');
    if (!nativeInput || !urlInput) return setStatus('No se encontró el cargador de imágenes.', 'error');
    const existingImages = [...state.images];
    state.uploadBusy = true;
    renderEditor();
    const uploaded = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setStatus(`Subiendo ${index + 1} de ${files.length}: ${file.name}`);
        try {
          uploaded.push(await uploadWithOriginalHandler(nativeInput, urlInput, file));
        } catch {
          uploaded.push(await optimizedDataUrl(file));
        }
      }
      state.images = unique([...existingImages, ...uploaded]);
      syncCover();
      setStatus(`${uploaded.length} imagen${uploaded.length === 1 ? '' : 'es'} agregada${uploaded.length === 1 ? '' : 's'}.`, 'success');
    } catch {
      setStatus('No se pudieron agregar todas las imágenes.', 'error');
    } finally {
      state.uploadBusy = false;
      renderEditor();
    }
  }

  function uploadWithOriginalHandler(nativeInput, urlInput, file) {
    return new Promise((resolve, reject) => {
      if (typeof DataTransfer === 'undefined') return reject(new Error('Sin DataTransfer'));
      const before = urlInput.value.trim();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      nativeInput.value = '';
      nativeInput.files = transfer.files;
      nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
      const started = Date.now();
      const timer = window.setInterval(() => {
        const current = urlInput.value.trim();
        const status = document.getElementById('imageUploadStatus')?.textContent || '';
        if (current && current !== before) {
          window.clearInterval(timer);
          return resolve(current);
        }
        if (/error|no se pudo|falló/i.test(status) || Date.now() - started > 45000) {
          window.clearInterval(timer);
          reject(new Error('Carga agotada'));
        }
      }, 250);
    });
  }

  function optimizedDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Lectura fallida'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Imagen inválida'));
        image.onload = () => {
          const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', .76));
        };
        image.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function loadEditor() {
    const descriptionInput = document.getElementById('productDescription');
    const cover = document.getElementById('productImage')?.value?.trim() || '';
    const parsed = parseDescription(descriptionInput?.value || '');
    state.images = unique([cover, ...parsed.images]);
    if (descriptionInput) descriptionInput.value = parsed.description;
    setStatus('');
    renderEditor();
  }

  function prepareSave() {
    const descriptionInput = document.getElementById('productDescription');
    const imageInput = document.getElementById('productImage');
    if (!descriptionInput || !imageInput) return;
    const manualCover = imageInput.value.trim();
    if (manualCover && state.images[0] !== manualCover) state.images = unique([manualCover, ...state.images]);
    imageInput.value = state.images[0] || manualCover || '';
    descriptionInput.value = serializeDescription(descriptionInput.value, state.images);
  }

  /* ---------------- GALERÍA DE DETALLE ---------------- */
  function stripMarker(element) {
    if (!element) return [];
    const parsed = parseDescription(element.textContent || '');
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const current = String(node.nodeValue || '');
      const cleaned = current.replace(MARKER_RE, '').replace(/\n{3,}/g, '\n\n');
      if (cleaned !== current) node.nodeValue = cleaned;
    });
    return parsed.images;
  }

  function ensureLightbox() {
    if (document.getElementById('productGalleryLightbox')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'productGalleryLightbox';
    dialog.className = 'product-gallery-lightbox';
    dialog.innerHTML = `<div class="product-gallery-lightbox-shell">
      <button class="product-gallery-lightbox-close" type="button" aria-label="Cerrar">×</button>
      <button class="product-gallery-lightbox-arrow prev" type="button" aria-label="Imagen anterior">‹</button>
      <img id="productGalleryLightboxImage" alt="Imagen ampliada del producto">
      <button class="product-gallery-lightbox-arrow next" type="button" aria-label="Imagen siguiente">›</button>
      <span id="productGalleryLightboxCounter" class="product-gallery-lightbox-counter"></span>
    </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.product-gallery-lightbox-close')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('.prev')?.addEventListener('click', () => changeImage(-1, true));
    dialog.querySelector('.next')?.addEventListener('click', () => changeImage(1, true));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  function enhanceDetail() {
    const dialog = document.getElementById('detailDialog');
    const host = document.getElementById('detailImage');
    const description = document.getElementById('detailDescription');
    if (!dialog?.open || !host || !description) return;
    state.promoText = description.textContent?.replace(/\s+/g, ' ').trim() || '';
    const markerImages = stripMarker(description);
    const existing = host.querySelector('img')?.src || '';
    state.detailImages = unique([existing, ...markerImages]);
    state.detailIndex = 0;
    state.quantity = 1;
    state.basePrice = parseMoney(document.getElementById('detailPrice')?.textContent);
    state.stock = Math.max(1, Number(String(document.getElementById('detailStock')?.textContent || '1').replace(/\D/g, '')) || 1);
    renderDetailGallery();
    ensureCommercePanel();
    updateCommerce();
    window.setTimeout(updateCommerce, 220);
  }

  function renderDetailGallery() {
    const host = document.getElementById('detailImage');
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    if (!host || !state.detailImages.length) return;
    state.detailIndex = Math.min(state.detailIndex, state.detailImages.length - 1);
    const current = state.detailIndex;
    const images = state.detailImages;
    host.classList.add('detail-gallery-host');
    host.innerHTML = `<div class="detail-gallery-stage">
      <button class="detail-gallery-main" type="button" aria-label="Ampliar imagen">${imageHtml(images[current], name)}</button>
      ${images.length > 1 ? `<button class="detail-gallery-arrow prev" type="button" aria-label="Imagen anterior">‹</button><button class="detail-gallery-arrow next" type="button" aria-label="Imagen siguiente">›</button><span class="detail-gallery-counter">${current + 1}/${images.length}</span>` : ''}
    </div>${images.length > 1 ? `<div class="detail-gallery-thumbs">${images.map((url, index) => `<button class="detail-gallery-thumb ${index === current ? 'active' : ''}" type="button" data-detail-gallery-index="${index}" aria-label="Ver imagen ${index + 1}">${imageHtml(url, `${name}, imagen ${index + 1}`)}</button>`).join('')}</div>` : ''}`;
    host.querySelector('.detail-gallery-main')?.addEventListener('click', openLightbox);
    host.querySelector('.detail-gallery-arrow.prev')?.addEventListener('click', () => changeImage(-1));
    host.querySelector('.detail-gallery-arrow.next')?.addEventListener('click', () => changeImage(1));
    host.querySelectorAll('[data-detail-gallery-index]').forEach((button) => button.addEventListener('click', () => {
      state.detailIndex = Number(button.dataset.detailGalleryIndex) || 0;
      renderDetailGallery();
    }));
  }

  function changeImage(delta, updateModal = false) {
    if (!state.detailImages.length) return;
    state.detailIndex = (state.detailIndex + delta + state.detailImages.length) % state.detailImages.length;
    renderDetailGallery();
    if (updateModal || document.getElementById('productGalleryLightbox')?.open) updateLightbox();
  }

  function openLightbox() {
    ensureLightbox();
    updateLightbox();
    const dialog = document.getElementById('productGalleryLightbox');
    if (!dialog.open) dialog.showModal();
  }

  function updateLightbox() {
    const dialog = document.getElementById('productGalleryLightbox');
    const image = document.getElementById('productGalleryLightboxImage');
    const counter = document.getElementById('productGalleryLightboxCounter');
    if (!dialog || !image || !counter) return;
    image.src = state.detailImages[state.detailIndex] || '';
    image.alt = `${document.getElementById('detailName')?.textContent?.trim() || 'Producto'}, imagen ${state.detailIndex + 1}`;
    counter.textContent = `${state.detailIndex + 1} de ${state.detailImages.length}`;
    dialog.classList.toggle('single-image', state.detailImages.length <= 1);
  }

  /* ---------------- CANTIDAD, PRECIOS Y WHATSAPP ---------------- */
  function ensureCommercePanel() {
    const shipping = document.querySelector('#detailDialog .detail-shipping');
    if (!shipping || document.getElementById('detailCommercePanel')) return;
    const panel = document.createElement('section');
    panel.id = 'detailCommercePanel';
    panel.className = 'detail-commerce-panel';
    panel.innerHTML = `<div class="detail-commerce-quantity-row">
      <div><span>Cantidad</span><small id="detailCommerceUnitLabel">unidades</small></div>
      <div class="detail-commerce-stepper"><button id="detailQuantityMinus" type="button">−</button><strong id="detailQuantityValue">1</strong><button id="detailQuantityPlus" type="button">+</button></div>
    </div><div class="detail-commerce-totals">
      <div><span>Precio por unidad</span><strong id="detailCommerceUnitPrice">Lps.0.00</strong></div>
      <div><span>Subtotal</span><strong id="detailCommerceSubtotal">Lps.0.00</strong></div>
      <div id="detailCommerceSavingRow" hidden><span>Ahorro por promoción</span><strong id="detailCommerceSaving">Lps.0.00</strong></div>
    </div><button id="detailDirectBuyBtn" class="btn btn-success detail-direct-buy" type="button">Comprar por WhatsApp</button>`;
    shipping.insertAdjacentElement('beforebegin', panel);
    panel.querySelector('#detailQuantityMinus')?.addEventListener('click', () => setQuantity(state.quantity - 1));
    panel.querySelector('#detailQuantityPlus')?.addEventListener('click', () => setQuantity(state.quantity + 1));
    panel.querySelector('#detailDirectBuyBtn')?.addEventListener('click', sendDirectOrder);
  }

  function promotionTiers() {
    const tiers = [];
    document.querySelectorAll('#detailDescription .commerce-tier-card').forEach((card) => {
      const min = Number(card.querySelector('span')?.textContent?.match(/\d+/)?.[0]);
      const price = parseMoney(card.querySelector('strong')?.textContent);
      if (Number.isFinite(min) && price > 0) tiers.push({ min, price });
    });
    [...String(state.promoText || '').matchAll(/(\d+)\+\s*Lps?\.?\s*([0-9.,]+)/gi)].forEach((match) => tiers.push({ min: Number(match[1]), price: parseMoney(match[2]) }));
    if (!tiers.length) {
      const haystack = `${document.getElementById('detailName')?.textContent || ''} ${document.getElementById('detailCategory')?.textContent || ''}`.toLowerCase();
      (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : []).forEach((rule) => {
        if (rule?.type !== 'tier_price' || !Array.isArray(rule.tiers)) return;
        const match = rule.match || {};
        const all = !match.all?.length || match.all.every((token) => haystack.includes(String(token).toLowerCase()));
        const any = !match.any?.length || match.any.some((token) => haystack.includes(String(token).toLowerCase()));
        const excluded = match.exclude?.some((token) => haystack.includes(String(token).toLowerCase()));
        if (all && any && !excluded) rule.tiers.forEach((tier) => tiers.push({ min: Number(tier.minQty), price: Number(tier.price) }));
      });
    }
    tiers.push({ min: 1, price: state.basePrice });
    const deduped = new Map();
    tiers.filter((tier) => Number.isFinite(tier.min) && Number.isFinite(tier.price) && tier.price >= 0).forEach((tier) => deduped.set(tier.min, tier));
    return [...deduped.values()].sort((a, b) => a.min - b.min);
  }

  function pricing() {
    let unitPrice = state.basePrice;
    promotionTiers().forEach((tier) => { if (state.quantity >= tier.min) unitPrice = tier.price; });
    const subtotal = unitPrice * state.quantity;
    const saving = Math.max(0, state.basePrice * state.quantity - subtotal);
    const normal = subtotal + SHIPPING;
    return { unitPrice, subtotal, saving, normal, receive: codTotal(normal) };
  }

  function setQuantity(value) {
    state.quantity = Math.max(1, Math.min(state.stock, Number(value) || 1));
    updateCommerce();
  }

  function updateCommerce() {
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const result = pricing();
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    set('detailQuantityValue', String(state.quantity));
    set('detailCommerceUnitLabel', unitLabel(name, state.quantity));
    set('detailCommerceUnitPrice', formatMoney(result.unitPrice));
    set('detailCommerceSubtotal', formatMoney(result.subtotal));
    set('detailCommerceSaving', formatMoney(result.saving));
    const savingRow = document.getElementById('detailCommerceSavingRow');
    if (savingRow) savingRow.hidden = result.saving <= 0;
    const minus = document.getElementById('detailQuantityMinus');
    const plus = document.getElementById('detailQuantityPlus');
    if (minus) minus.disabled = state.quantity <= 1;
    if (plus) plus.disabled = state.quantity >= state.stock;
    set('detailShippingNormal', formatMoney(result.normal));
    set('detailShippingReceive', formatMoney(result.receive));
  }

  function sendDirectOrder() {
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const result = pricing();
    const divider = '━━━━━━━━━━━━';
    const lines = ['*SD COMAYAGUA*', '*COMPRA DESDE EL CATÁLOGO*', divider, '', `*Producto:* ${name}`, `*Cantidad:* ${state.quantity} ${unitLabel(name, state.quantity)}`, `*Precio por ${dedales(name) ? 'par' : 'unidad'}:* ${formatMoney(result.unitPrice)}`, `*Subtotal:* ${formatMoney(result.subtotal)}`];
    if (result.saving > 0) lines.push(`*Ahorro por promoción:* ${formatMoney(result.saving)}`);
    lines.push('', '*OPCIONES DE ENVÍO*', divider, `1. *Envío normal:* ${formatMoney(result.normal)}`, '   Depósito o transferencia antes de enviar.', `2. *Pagar al recibir:* ${formatMoney(result.receive)}`, '   Incluye comisión del 10%.', '', '*Deseo confirmar esta compra.*', 'Quedo pendiente de las instrucciones para el pago y el envío.');
    const phone = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function normalizeCards() {
    document.querySelectorAll('#productGrid .product-card').forEach((card) => {
      const badge = card.querySelector('.stock-badge');
      if (!badge || badge.classList.contains('out')) return;
      if (badge.textContent.trim() !== 'DISPONIBLE') badge.textContent = 'DISPONIBLE';
      if (badge.classList.contains('low')) badge.classList.remove('low');
    });
  }

  function observers() {
    const productDialog = document.getElementById('productDialog');
    if (productDialog) new MutationObserver(() => { if (productDialog.open) setTimeout(loadEditor, 40); }).observe(productDialog, { attributes: true, attributeFilter: ['open'] });
    const detailDialog = document.getElementById('detailDialog');
    if (detailDialog) new MutationObserver(() => { if (detailDialog.open) setTimeout(enhanceDetail, 70); }).observe(detailDialog, { attributes: true, attributeFilter: ['open'] });
    const grid = document.getElementById('productGrid');
    if (grid) {
      let pending = false;
      new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => { pending = false; normalizeCards(); });
      }).observe(grid, { childList: true, subtree: true });
    }
  }

  function init() {
    ensureEditor();
    ensureLightbox();
    observers();
    normalizeCards();
    document.getElementById('productForm')?.addEventListener('submit', prepareSave, true);
    document.addEventListener('keydown', (event) => {
      const lightbox = document.getElementById('productGalleryLightbox');
      if (!lightbox?.open) return;
      if (event.key === 'ArrowLeft') changeImage(-1, true);
      if (event.key === 'ArrowRight') changeImage(1, true);
      if (event.key === 'Escape') lightbox.close();
    });
    if (PUBLIC) document.body.classList.add('direct-customer-commerce');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
