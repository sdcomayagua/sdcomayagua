// SD COMAYAGUA · Galería de productos y compra directa V1
// Añade de 1 a 5 imágenes reutilizando el cargador existente de app.js.
// La galería se guarda dentro del mismo producto mediante un marcador oculto
// en la descripción, por lo que también viaja con Firebase y los respaldos.
(() => {
  'use strict';

  const MAX_IMAGES = 5;
  const GALLERY_TOKEN = 'SD_GALLERY_V1';
  const GALLERY_RE = /\[\[SD_GALLERY_V1:([^\]]+)\]\]/g;
  const PUBLIC_CATALOG = Boolean(window.SD_PUBLIC_CLIENT_CATALOG) || /\bcliente(?:\.html)?$/i.test(window.location.pathname);
  const SHIPPING_FEE = 110;
  const COD_RATE = 0.10;

  const galleryState = {
    images: [],
    detailImages: [],
    detailIndex: 0,
    quantity: 1,
    basePrice: 0,
    stock: 1,
    promoText: '',
    uploadBusy: false
  };

  const money = new Intl.NumberFormat('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function uniqueUrls(values = []) {
    const seen = new Set();
    return values
      .map((value) => String(value || '').trim())
      .filter((value) => value && !seen.has(value) && seen.add(value))
      .slice(0, MAX_IMAGES);
  }

  function encodeGallery(images) {
    return encodeURIComponent(JSON.stringify(uniqueUrls(images)));
  }

  function decodeGallery(value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(String(value || '')));
      return Array.isArray(parsed) ? uniqueUrls(parsed) : [];
    } catch {
      return [];
    }
  }

  function extractGallery(text) {
    const source = String(text || '');
    const matches = [...source.matchAll(GALLERY_RE)];
    const images = matches.flatMap((match) => decodeGallery(match[1]));
    return {
      images: uniqueUrls(images),
      cleanText: source.replace(GALLERY_RE, '').replace(/\n{3,}/g, '\n\n').trim()
    };
  }

  function descriptionWithGallery(description, images) {
    const clean = extractGallery(description).cleanText;
    const list = uniqueUrls(images);
    if (!list.length) return clean;
    const marker = `[[${GALLERY_TOKEN}:${encodeGallery(list)}]]`;
    return clean ? `${clean}\n\n${marker}` : marker;
  }

  function formatMoney(value) {
    return `Lps.${money.format(Number(value || 0))}`;
  }

  function parseMoney(value) {
    const normalized = String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function safeCodTotal(base) {
    const raw = Number(base || 0) * (1 + COD_RATE);
    return Number.isInteger(raw) ? raw : Math.ceil(raw) + 1;
  }

  function isDedales(name) {
    return /dedal/i.test(String(name || ''));
  }

  function quantityLabel(name, quantity) {
    if (isDedales(name)) return quantity === 1 ? 'par' : 'pares';
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  function imageMarkup(url, alt = 'Producto') {
    return `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async">`;
  }

  function escapeAttribute(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function ensureGalleryEditor() {
    const imageField = document.querySelector('#productForm .image-upload-field');
    if (!imageField || document.getElementById('productGalleryEditor')) return;

    const editor = document.createElement('section');
    editor.id = 'productGalleryEditor';
    editor.className = 'product-gallery-editor full-field';
    editor.innerHTML = `
      <div class="product-gallery-editor-head">
        <div>
          <strong>Galería del producto</strong>
          <small>Sube de 1 a 5 fotografías. No es obligatorio completar las cinco.</small>
        </div>
        <span id="productGalleryCount" class="product-gallery-count">0/${MAX_IMAGES}</span>
      </div>
      <button id="productGalleryUploadBtn" class="btn btn-secondary product-gallery-upload" type="button">
        + Agregar imágenes
      </button>
      <input id="productGalleryFiles" type="file" accept="image/*" multiple hidden>
      <div id="productGalleryStatus" class="product-gallery-status" aria-live="polite"></div>
      <div id="productGalleryThumbs" class="product-gallery-editor-thumbs"></div>
    `;
    imageField.insertAdjacentElement('afterend', editor);

    document.getElementById('productGalleryUploadBtn')?.addEventListener('click', () => {
      if (galleryState.uploadBusy) return;
      const remaining = MAX_IMAGES - galleryState.images.length;
      if (remaining <= 0) {
        setGalleryStatus('Ya tienes el máximo de 5 imágenes.', 'warning');
        return;
      }
      document.getElementById('productGalleryFiles')?.click();
    });

    document.getElementById('productGalleryFiles')?.addEventListener('change', async (event) => {
      const files = [...(event.target.files || [])].filter((file) => file.type.startsWith('image/'));
      event.target.value = '';
      if (!files.length) return;
      const remaining = MAX_IMAGES - galleryState.images.length;
      await uploadGalleryFiles(files.slice(0, remaining));
    });

    editor.addEventListener('click', (event) => {
      const cover = event.target.closest('[data-gallery-cover]');
      if (cover) {
        const index = Number(cover.dataset.galleryCover);
        if (Number.isInteger(index) && galleryState.images[index]) {
          const [selected] = galleryState.images.splice(index, 1);
          galleryState.images.unshift(selected);
          syncCoverInput();
          renderGalleryEditor();
        }
        return;
      }

      const remove = event.target.closest('[data-gallery-remove]');
      if (remove) {
        const index = Number(remove.dataset.galleryRemove);
        if (Number.isInteger(index) && galleryState.images[index]) {
          galleryState.images.splice(index, 1);
          syncCoverInput();
          renderGalleryEditor();
        }
      }
    });

    const imageUrlInput = document.getElementById('productImage');
    imageUrlInput?.addEventListener('change', () => {
      const url = imageUrlInput.value.trim();
      if (!url) return;
      if (!galleryState.images.length) galleryState.images = [url];
      else galleryState.images[0] = url;
      galleryState.images = uniqueUrls(galleryState.images);
      renderGalleryEditor();
    });
  }

  function setGalleryStatus(message, type = '') {
    const status = document.getElementById('productGalleryStatus');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.type = type;
  }

  function syncCoverInput() {
    const input = document.getElementById('productImage');
    if (!input) return;
    input.value = galleryState.images[0] || '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderGalleryEditor() {
    const thumbs = document.getElementById('productGalleryThumbs');
    const count = document.getElementById('productGalleryCount');
    const uploadBtn = document.getElementById('productGalleryUploadBtn');
    if (!thumbs || !count) return;

    count.textContent = `${galleryState.images.length}/${MAX_IMAGES}`;
    if (uploadBtn) {
      uploadBtn.disabled = galleryState.uploadBusy || galleryState.images.length >= MAX_IMAGES;
      uploadBtn.textContent = galleryState.uploadBusy
        ? 'Subiendo imágenes...'
        : galleryState.images.length >= MAX_IMAGES
          ? 'Galería completa'
          : '+ Agregar imágenes';
    }

    if (!galleryState.images.length) {
      thumbs.innerHTML = '<p class="product-gallery-empty">Todavía no hay imágenes. Puedes guardar el producto sin fotografía o agregar hasta cinco.</p>';
      return;
    }

    thumbs.innerHTML = galleryState.images.map((url, index) => `
      <article class="product-gallery-editor-item ${index === 0 ? 'is-cover' : ''}">
        <button type="button" class="product-gallery-editor-preview" data-gallery-cover="${index}" aria-label="Usar imagen ${index + 1} como portada">
          ${imageMarkup(url, `Imagen ${index + 1}`)}
        </button>
        <div class="product-gallery-editor-item-actions">
          <button type="button" class="gallery-cover-btn" data-gallery-cover="${index}">${index === 0 ? 'Portada' : 'Usar de portada'}</button>
          <button type="button" class="gallery-remove-btn" data-gallery-remove="${index}" aria-label="Eliminar imagen ${index + 1}">×</button>
        </div>
      </article>
    `).join('');
  }

  async function uploadGalleryFiles(files) {
    const nativeInput = document.getElementById('productImageFile');
    const urlInput = document.getElementById('productImage');
    if (!nativeInput || !urlInput) {
      setGalleryStatus('No se encontró el cargador de imágenes.', 'error');
      return;
    }

    galleryState.uploadBusy = true;
    renderGalleryEditor();
    const uploaded = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setGalleryStatus(`Subiendo ${index + 1} de ${files.length}: ${file.name}`);
        let url = '';
        try {
          url = await uploadThroughNativeHandler(nativeInput, urlInput, file);
        } catch {
          url = await fileToOptimizedDataUrl(file);
        }
        if (url) uploaded.push(url);
      }

      galleryState.images = uniqueUrls([...galleryState.images, ...uploaded]);
      if (uploaded.length) {
        syncCoverInput();
        setGalleryStatus(`${uploaded.length} imagen${uploaded.length === 1 ? '' : 'es'} agregada${uploaded.length === 1 ? '' : 's'} correctamente.`, 'success');
      } else {
        setGalleryStatus('No se pudo agregar ninguna imagen.', 'error');
      }
    } finally {
      galleryState.uploadBusy = false;
      renderGalleryEditor();
    }
  }

  function uploadThroughNativeHandler(nativeInput, urlInput, file) {
    return new Promise((resolve, reject) => {
      if (typeof DataTransfer === 'undefined') {
        reject(new Error('DataTransfer no disponible'));
        return;
      }

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
        const failed = /error|no se pudo|falló/i.test(status);
        if (current && current !== before) {
          window.clearInterval(timer);
          resolve(current);
          return;
        }
        if (failed || Date.now() - started > 45000) {
          window.clearInterval(timer);
          reject(new Error('Carga agotada'));
        }
      }, 250);
    });
  }

  function fileToOptimizedDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Imagen inválida'));
        image.onload = () => {
          const maxSide = 1000;
          const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
          const width = Math.max(1, Math.round(image.naturalWidth * scale));
          const height = Math.max(1, Math.round(image.naturalHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.76));
        };
        image.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function loadGalleryEditorFromForm() {
    const description = document.getElementById('productDescription')?.value || '';
    const cover = document.getElementById('productImage')?.value?.trim() || '';
    const parsed = extractGallery(description);
    galleryState.images = uniqueUrls([cover, ...parsed.images]);
    if (document.getElementById('productDescription')) {
      document.getElementById('productDescription').value = parsed.cleanText;
    }
    setGalleryStatus('');
    renderGalleryEditor();
  }

  function prepareGalleryBeforeSave() {
    const description = document.getElementById('productDescription');
    const imageInput = document.getElementById('productImage');
    if (!description || !imageInput) return;

    const manualCover = imageInput.value.trim();
    if (manualCover && galleryState.images[0] !== manualCover) {
      galleryState.images = uniqueUrls([manualCover, ...galleryState.images]);
    }
    imageInput.value = galleryState.images[0] || manualCover || '';
    description.value = descriptionWithGallery(description.value, galleryState.images);
  }

  function stripGalleryMarkerFromElement(element) {
    if (!element) return [];
    const allText = element.textContent || '';
    const parsed = extractGallery(allText);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = String(node.nodeValue || '').replace(GALLERY_RE, '').replace(/\n{3,}/g, '\n\n');
    });
    return parsed.images;
  }

  function ensureLightbox() {
    if (document.getElementById('productGalleryLightbox')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'productGalleryLightbox';
    dialog.className = 'product-gallery-lightbox';
    dialog.innerHTML = `
      <div class="product-gallery-lightbox-shell">
        <button class="product-gallery-lightbox-close" type="button" aria-label="Cerrar">×</button>
        <button class="product-gallery-lightbox-arrow prev" type="button" aria-label="Imagen anterior">‹</button>
        <img id="productGalleryLightboxImage" alt="Imagen ampliada del producto">
        <button class="product-gallery-lightbox-arrow next" type="button" aria-label="Imagen siguiente">›</button>
        <span id="productGalleryLightboxCounter" class="product-gallery-lightbox-counter"></span>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector('.product-gallery-lightbox-close')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('.product-gallery-lightbox-arrow.prev')?.addEventListener('click', () => changeDetailImage(-1, true));
    dialog.querySelector('.product-gallery-lightbox-arrow.next')?.addEventListener('click', () => changeDetailImage(1, true));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function enhanceDetail() {
    const dialog = document.getElementById('detailDialog');
    if (!dialog?.open) return;
    const detailImage = document.getElementById('detailImage');
    const description = document.getElementById('detailDescription');
    if (!detailImage || !description) return;

    galleryState.promoText = description.textContent?.replace(/\s+/g, ' ').trim() || '';
    const markerImages = stripGalleryMarkerFromElement(description);
    const existingImage = detailImage.querySelector('img')?.src || '';
    galleryState.detailImages = uniqueUrls([existingImage, ...markerImages]);
    galleryState.detailIndex = 0;
    galleryState.quantity = 1;
    galleryState.basePrice = parseMoney(document.getElementById('detailPrice')?.textContent);
    galleryState.stock = Math.max(1, Number(String(document.getElementById('detailStock')?.textContent || '1').replace(/\D/g, '')) || 1);

    renderDetailGallery();
    ensureQuantityPanel();
    updateDetailCommerce();
  }

  function renderDetailGallery() {
    const host = document.getElementById('detailImage');
    if (!host) return;
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const images = galleryState.detailImages;
    if (!images.length) return;

    const current = Math.min(galleryState.detailIndex, images.length - 1);
    galleryState.detailIndex = current;
    host.classList.add('detail-gallery-host');
    host.innerHTML = `
      <div class="detail-gallery-stage">
        <button class="detail-gallery-main" type="button" aria-label="Ampliar imagen">
          ${imageMarkup(images[current], name)}
        </button>
        ${images.length > 1 ? `
          <button class="detail-gallery-arrow prev" type="button" aria-label="Imagen anterior">‹</button>
          <button class="detail-gallery-arrow next" type="button" aria-label="Imagen siguiente">›</button>
          <span class="detail-gallery-counter">${current + 1}/${images.length}</span>
        ` : ''}
      </div>
      ${images.length > 1 ? `
        <div class="detail-gallery-thumbs" aria-label="Miniaturas del producto">
          ${images.map((url, index) => `
            <button class="detail-gallery-thumb ${index === current ? 'active' : ''}" type="button" data-detail-gallery-index="${index}" aria-label="Ver imagen ${index + 1}">
              ${imageMarkup(url, `${name}, imagen ${index + 1}`)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    host.querySelector('.detail-gallery-main')?.addEventListener('click', openLightbox);
    host.querySelector('.detail-gallery-arrow.prev')?.addEventListener('click', () => changeDetailImage(-1));
    host.querySelector('.detail-gallery-arrow.next')?.addEventListener('click', () => changeDetailImage(1));
    host.querySelectorAll('[data-detail-gallery-index]').forEach((button) => {
      button.addEventListener('click', () => {
        galleryState.detailIndex = Number(button.dataset.detailGalleryIndex) || 0;
        renderDetailGallery();
      });
    });
  }

  function changeDetailImage(delta, lightboxOnly = false) {
    const length = galleryState.detailImages.length;
    if (!length) return;
    galleryState.detailIndex = (galleryState.detailIndex + delta + length) % length;
    renderDetailGallery();
    if (lightboxOnly || document.getElementById('productGalleryLightbox')?.open) updateLightbox();
  }

  function openLightbox() {
    ensureLightbox();
    const dialog = document.getElementById('productGalleryLightbox');
    updateLightbox();
    if (!dialog.open) dialog.showModal();
  }

  function updateLightbox() {
    const image = document.getElementById('productGalleryLightboxImage');
    const counter = document.getElementById('productGalleryLightboxCounter');
    const dialog = document.getElementById('productGalleryLightbox');
    if (!image || !counter || !dialog) return;
    image.src = galleryState.detailImages[galleryState.detailIndex] || '';
    image.alt = `${document.getElementById('detailName')?.textContent?.trim() || 'Producto'}, imagen ${galleryState.detailIndex + 1}`;
    counter.textContent = `${galleryState.detailIndex + 1} de ${galleryState.detailImages.length}`;
    dialog.classList.toggle('single-image', galleryState.detailImages.length <= 1);
  }

  function ensureQuantityPanel() {
    const detailInfo = document.querySelector('#detailDialog .detail-info');
    const shipping = document.querySelector('#detailDialog .detail-shipping');
    if (!detailInfo || !shipping) return;

    let panel = document.getElementById('detailCommercePanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'detailCommercePanel';
      panel.className = 'detail-commerce-panel';
      panel.innerHTML = `
        <div class="detail-commerce-quantity-row">
          <div>
            <span>Cantidad</span>
            <small id="detailCommerceUnitLabel">unidades</small>
          </div>
          <div class="detail-commerce-stepper" role="group" aria-label="Seleccionar cantidad">
            <button id="detailQuantityMinus" type="button" aria-label="Restar cantidad">−</button>
            <strong id="detailQuantityValue">1</strong>
            <button id="detailQuantityPlus" type="button" aria-label="Sumar cantidad">+</button>
          </div>
        </div>
        <div class="detail-commerce-totals">
          <div><span>Precio por unidad</span><strong id="detailCommerceUnitPrice">Lps.0.00</strong></div>
          <div><span>Subtotal</span><strong id="detailCommerceSubtotal">Lps.0.00</strong></div>
          <div id="detailCommerceSavingRow" hidden><span>Ahorro por promoción</span><strong id="detailCommerceSaving">Lps.0.00</strong></div>
        </div>
        <button id="detailDirectBuyBtn" class="btn btn-success detail-direct-buy" type="button">Comprar por WhatsApp</button>
      `;
      shipping.insertAdjacentElement('beforebegin', panel);

      panel.querySelector('#detailQuantityMinus')?.addEventListener('click', () => setDetailQuantity(galleryState.quantity - 1));
      panel.querySelector('#detailQuantityPlus')?.addEventListener('click', () => setDetailQuantity(galleryState.quantity + 1));
      panel.querySelector('#detailDirectBuyBtn')?.addEventListener('click', sendDirectProductOrder);
    }
  }

  function parsePromotionTiers() {
    const tiers = [];
    const text = galleryState.promoText || document.getElementById('detailDescription')?.textContent || '';
    [...String(text).matchAll(/(\d+)\+\s*Lps?\.?\s*([0-9.,]+)/gi)].forEach((match) => {
      tiers.push({ min: Number(match[1]), price: parseMoney(match[2]) });
    });

    if (!tiers.length) {
      const name = document.getElementById('detailName')?.textContent || '';
      const category = document.getElementById('detailCategory')?.textContent || '';
      const haystack = `${name} ${category}`.toLowerCase();
      (Array.isArray(window.SD_PROMOTIONS) ? window.SD_PROMOTIONS : []).forEach((rule) => {
        if (rule?.type !== 'tier_price' || !Array.isArray(rule.tiers)) return;
        const match = rule.match || {};
        const all = !match.all?.length || match.all.every((token) => haystack.includes(String(token).toLowerCase()));
        const any = !match.any?.length || match.any.some((token) => haystack.includes(String(token).toLowerCase()));
        const excluded = match.exclude?.some((token) => haystack.includes(String(token).toLowerCase()));
        if (all && any && !excluded) {
          rule.tiers.forEach((tier) => tiers.push({ min: Number(tier.minQty), price: Number(tier.price) }));
        }
      });
    }

    if (!tiers.some((tier) => tier.min === 1)) tiers.push({ min: 1, price: galleryState.basePrice });
    return tiers
      .filter((tier) => Number.isFinite(tier.min) && Number.isFinite(tier.price))
      .sort((a, b) => a.min - b.min);
  }

  function detailPricing() {
    const tiers = parsePromotionTiers();
    let unitPrice = galleryState.basePrice;
    tiers.forEach((tier) => {
      if (galleryState.quantity >= tier.min) unitPrice = tier.price;
    });
    const subtotal = unitPrice * galleryState.quantity;
    const baseSubtotal = galleryState.basePrice * galleryState.quantity;
    const saving = Math.max(0, baseSubtotal - subtotal);
    const normal = subtotal + SHIPPING_FEE;
    const receive = safeCodTotal(normal);
    return { unitPrice, subtotal, baseSubtotal, saving, normal, receive };
  }

  function setDetailQuantity(value) {
    galleryState.quantity = Math.max(1, Math.min(galleryState.stock, Number(value) || 1));
    updateDetailCommerce();
  }

  function updateDetailCommerce() {
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const pricing = detailPricing();
    const quantity = galleryState.quantity;
    const label = quantityLabel(name, quantity);

    const value = document.getElementById('detailQuantityValue');
    const unitLabel = document.getElementById('detailCommerceUnitLabel');
    const unitPrice = document.getElementById('detailCommerceUnitPrice');
    const subtotal = document.getElementById('detailCommerceSubtotal');
    const savingRow = document.getElementById('detailCommerceSavingRow');
    const saving = document.getElementById('detailCommerceSaving');
    const minus = document.getElementById('detailQuantityMinus');
    const plus = document.getElementById('detailQuantityPlus');

    if (value) value.textContent = String(quantity);
    if (unitLabel) unitLabel.textContent = label;
    if (unitPrice) unitPrice.textContent = formatMoney(pricing.unitPrice);
    if (subtotal) subtotal.textContent = formatMoney(pricing.subtotal);
    if (savingRow) savingRow.hidden = pricing.saving <= 0;
    if (saving) saving.textContent = formatMoney(pricing.saving);
    if (minus) minus.disabled = quantity <= 1;
    if (plus) plus.disabled = quantity >= galleryState.stock;

    const normal = document.getElementById('detailShippingNormal');
    const receive = document.getElementById('detailShippingReceive');
    if (normal) normal.textContent = formatMoney(pricing.normal);
    if (receive) receive.textContent = formatMoney(pricing.receive);
  }

  function sendDirectProductOrder() {
    const name = document.getElementById('detailName')?.textContent?.trim() || 'Producto';
    const pricing = detailPricing();
    const quantity = galleryState.quantity;
    const label = quantityLabel(name, quantity);
    const divider = '━━━━━━━━━━━━';
    const lines = [
      '*SD COMAYAGUA*',
      '*COMPRA DESDE EL CATÁLOGO*',
      divider,
      '',
      `*Producto:* ${name}`,
      `*Cantidad:* ${quantity} ${label}`,
      `*Precio por ${isDedales(name) ? 'par' : 'unidad'}:* ${formatMoney(pricing.unitPrice)}`,
      `*Subtotal:* ${formatMoney(pricing.subtotal)}`
    ];

    if (pricing.saving > 0) lines.push(`*Ahorro por promoción:* ${formatMoney(pricing.saving)}`);

    lines.push(
      '',
      '*OPCIONES DE ENVÍO*',
      divider,
      `1. *Envío normal:* ${formatMoney(pricing.normal)}`,
      '   Depósito o transferencia antes de enviar.',
      `2. *Pagar al recibir:* ${formatMoney(pricing.receive)}`,
      '   Incluye comisión del 10%.',
      '',
      '*Deseo confirmar esta compra.*',
      'Quedo pendiente de las instrucciones para el pago y el envío.'
    );

    const phone = String(window.SD_WHATSAPP_NUMBER || '50431517755').replace(/\D/g, '');
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function normalizeProductCards() {
    document.querySelectorAll('#productGrid .product-card').forEach((card) => {
      const badge = card.querySelector('.stock-badge');
      if (badge && !badge.classList.contains('out')) {
        badge.textContent = 'DISPONIBLE';
        badge.classList.remove('low');
      }
    });
  }

  function initObservers() {
    const productDialog = document.getElementById('productDialog');
    if (productDialog) {
      new MutationObserver(() => {
        if (productDialog.open) window.setTimeout(loadGalleryEditorFromForm, 40);
      }).observe(productDialog, { attributes: true, attributeFilter: ['open'] });
    }

    const detailDialog = document.getElementById('detailDialog');
    if (detailDialog) {
      new MutationObserver(() => {
        if (detailDialog.open) window.setTimeout(enhanceDetail, 60);
      }).observe(detailDialog, { attributes: true, attributeFilter: ['open'] });
    }

    const detailDescription = document.getElementById('detailDescription');
    if (detailDescription) {
      let scheduled = false;
      new MutationObserver(() => {
        if (!detailDialog?.open || scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          galleryState.promoText = detailDescription.textContent?.replace(/\s+/g, ' ').trim() || galleryState.promoText;
          stripGalleryMarkerFromElement(detailDescription);
          if (document.getElementById('detailCommercePanel')) updateDetailCommerce();
        });
      }).observe(detailDescription, { childList: true, subtree: true, characterData: true });
    }

    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
      let scheduled = false;
      new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          normalizeProductCards();
        });
      }).observe(productGrid, { childList: true, subtree: true });
    }
  }

  function init() {
    ensureGalleryEditor();
    ensureLightbox();
    initObservers();
    normalizeProductCards();

    document.getElementById('productForm')?.addEventListener('submit', prepareGalleryBeforeSave, true);
    document.addEventListener('keydown', (event) => {
      const lightbox = document.getElementById('productGalleryLightbox');
      if (!lightbox?.open) return;
      if (event.key === 'ArrowLeft') changeDetailImage(-1, true);
      if (event.key === 'ArrowRight') changeDetailImage(1, true);
      if (event.key === 'Escape') lightbox.close();
    });

    if (PUBLIC_CATALOG) document.body.classList.add('direct-customer-commerce');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
