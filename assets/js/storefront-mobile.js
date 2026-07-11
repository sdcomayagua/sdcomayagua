(() => {
  'use strict';

  const ICONS = {
    all: '✦',
    dedales: '🎮',
    gatillos: '🎯',
    coolers: '❄️',
    cooler: '❄️',
    audio: '🎧',
    audifonos: '🎧',
    cargador: '⚡',
    celular: '📱',
    cable: '🔌',
    cocina: '🍳',
    belleza: '✨',
    automotriz: '🚗',
    gamer: '🕹️'
  };

  const state = {
    syncScheduled: false,
    drawerOpen: false,
    productObserver: null,
    categoryObserver: null
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const isPublicCatalog = () => document.body?.dataset.publicCatalog === 'true';

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function categoryIcon(category) {
    const normalized = normalize(category);
    const key = Object.keys(ICONS).find((name) => normalized.includes(name));
    return ICONS[key] || '◈';
  }

  function goSection(section) {
    const tab = qs(`.main-nav .nav-tab[data-section="${section}"]`);
    if (tab) {
      tab.click();
    } else {
      const target = qs(`#${section}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeDrawer();
  }

  function setCatalogSearch(value) {
    const search = qs('#searchInput');
    if (!search) return;
    search.value = value;
    search.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function selectCategory(value) {
    const select = qs('#categoryFilter');
    if (!select) return;
    const option = [...select.options].find((item) => item.value === value || item.textContent.trim() === value);
    if (!option) return;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    goSection('productos');
  }

  function buildHome() {
    const home = qs('#inicio');
    if (!home || home.dataset.storefrontReady === '1') return;

    home.dataset.storefrontReady = '1';
    home.innerHTML = `
      <div class="store-home">
        <form class="store-home-search" id="storeHomeSearchForm" role="search">
          <input id="storeHomeSearchInput" type="search" autocomplete="off" placeholder="Buscar productos..." aria-label="Buscar productos">
          <button type="submit" aria-label="Buscar">⌕</button>
        </form>

        <section class="store-hero" aria-label="Presentación de SD COMAYAGUA">
          <div class="store-hero-copy">
            <span class="store-hero-kicker">Accesorios gamer y tecnología</span>
            <h2>Todo para mejorar su experiencia de juego.</h2>
            <p>Explore productos disponibles, promociones y opciones de envío para toda Honduras.</p>
            <div class="store-hero-actions">
              <button class="store-hero-primary" type="button" data-store-go="productos">Ver catálogo</button>
              <button class="store-hero-secondary" type="button" data-store-go="${isPublicCatalog() ? 'productos' : 'cotizaciones'}">${isPublicCatalog() ? 'Consultar productos' : 'Crear cotización'}</button>
            </div>
          </div>
          <div class="store-hero-visual" aria-hidden="true">
            <div class="store-hero-orbit">
              <img class="store-hero-logo" src="assets/img/logo-round.png" alt="">
              <span class="store-floating-chip one">Envíos nacionales</span>
              <span class="store-floating-chip two">Pagar al recibir</span>
            </div>
          </div>
        </section>

        <div class="store-home-stats" aria-label="Resumen del catálogo">
          <div class="store-home-stat"><strong id="heroProducts">0</strong><span>Productos</span></div>
          <div class="store-home-stat"><strong id="heroUnits">0</strong><span>Unidades</span></div>
          <div class="store-home-stat"><strong id="heroAvailable">0</strong><span>Disponibles</span></div>
        </div>

        <section class="store-section" aria-labelledby="storeCategoriesTitle">
          <div class="store-section-head">
            <div><h3 id="storeCategoriesTitle">Busque por categoría</h3><p>Encuentre rápidamente lo que necesita.</p></div>
            <button class="store-section-link" type="button" data-store-go="productos">Ver todas</button>
          </div>
          <div id="storeCategoryStrip" class="store-category-strip" aria-label="Categorías"></div>
        </section>

        <section class="store-section" aria-labelledby="storeFeaturedTitle">
          <div class="store-section-head">
            <div><h3 id="storeFeaturedTitle">Productos destacados</h3><p>Toque un producto para conocer todos los detalles.</p></div>
            <button class="store-section-link" type="button" data-store-go="productos">Ver catálogo</button>
          </div>
          <div id="storeFeaturedGrid" class="store-featured-grid"></div>
        </section>

        <section class="store-section" aria-labelledby="storeServicesTitle">
          <div class="store-section-head"><div><h3 id="storeServicesTitle">Compra sencilla y segura</h3></div></div>
          <div class="store-services">
            <article class="store-service"><i>🚚</i><strong>Envío nacional</strong><span>Opciones de entrega disponibles para todos los departamentos de Honduras.</span></article>
            <article class="store-service"><i>📦</i><strong>Pagar al recibir</strong><span>Consulte el precio final y la comisión directamente en cada producto.</span></article>
            <article class="store-service"><i>💬</i><strong>Atención rápida</strong><span>Cotice y comparta productos por WhatsApp desde el detalle.</span></article>
          </div>
        </section>
      </div>
    `;

    const form = qs('#storeHomeSearchForm');
    const input = qs('#storeHomeSearchInput');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      goSection('productos');
      setCatalogSearch(input?.value || '');
      setTimeout(() => qs('#searchInput')?.focus(), 120);
    });

    qsa('[data-store-go]', home).forEach((button) => {
      button.addEventListener('click', () => goSection(button.dataset.storeGo));
    });
  }

  function buildHeaderTools() {
    const actions = qs('.header-actions');
    const menu = qs('#menuToggle');
    if (!actions || !menu || qs('#storeHeaderSearch')) return;

    const searchButton = document.createElement('button');
    searchButton.id = 'storeHeaderSearch';
    searchButton.className = 'store-header-action';
    searchButton.type = 'button';
    searchButton.setAttribute('aria-label', 'Buscar productos');
    searchButton.textContent = '⌕';
    searchButton.addEventListener('click', () => {
      goSection('productos');
      setTimeout(() => qs('#searchInput')?.focus(), 120);
    });
    actions.insertBefore(searchButton, menu);
  }

  function buildDrawer() {
    if (qs('#storeDrawer')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'storeDrawerBackdrop';
    backdrop.className = 'store-drawer-backdrop';

    const drawer = document.createElement('aside');
    drawer.id = 'storeDrawer';
    drawer.className = 'store-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <div class="store-drawer-head">
        <div class="store-drawer-brand">
          <img src="assets/img/logo-round.png" alt="Logo SD COMAYAGUA">
          <div><strong>SD COMAYAGUA</strong><small>Catálogo gamer y tecnología</small></div>
        </div>
        <button id="storeDrawerClose" class="store-drawer-close" type="button" aria-label="Cerrar menú">×</button>
      </div>
      <div class="store-drawer-scroll">
        <p class="store-drawer-title">Navegación</p>
        <div class="store-drawer-list" id="storeDrawerNavigation">
          <button class="store-drawer-item" type="button" data-drawer-section="inicio"><span>⌂</span><span>Inicio</span><span class="arrow">›</span></button>
          <button class="store-drawer-item" type="button" data-drawer-section="productos"><span>▦</span><span>Productos</span><span class="arrow">›</span></button>
          ${isPublicCatalog() ? '' : '<button class="store-drawer-item" type="button" data-drawer-section="cotizaciones"><span>▤</span><span>Cotizaciones</span><span class="arrow">›</span></button><button class="store-drawer-item" type="button" data-drawer-section="panel"><span>◫</span><span>Panel administrativo</span><span class="arrow">›</span></button>'}
        </div>
        <p class="store-drawer-title">Categorías</p>
        <div class="store-drawer-list" id="storeDrawerCategories"></div>
      </div>
      <div class="store-drawer-foot"><button type="button" data-drawer-section="productos">Explorar catálogo</button></div>
    `;

    document.body.append(backdrop, drawer);

    const menu = qs('#menuToggle');
    menu?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDrawer();
    }, true);

    qs('#storeDrawerClose')?.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (event) => {
      const sectionButton = event.target.closest('[data-drawer-section]');
      if (sectionButton) goSection(sectionButton.dataset.drawerSection);
      const categoryButton = event.target.closest('[data-drawer-category]');
      if (categoryButton) selectCategory(categoryButton.dataset.drawerCategory);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.drawerOpen) closeDrawer();
    });
  }

  function openDrawer() {
    const drawer = qs('#storeDrawer');
    const backdrop = qs('#storeDrawerBackdrop');
    if (!drawer || !backdrop) return;
    state.drawerOpen = true;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const drawer = qs('#storeDrawer');
    const backdrop = qs('#storeDrawerBackdrop');
    state.drawerOpen = false;
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.removeProperty('overflow');
  }

  function buildCatalogIntro() {
    const products = qs('#productos');
    const toolbar = qs('#productos .toolbar');
    if (!products || !toolbar || qs('#storeCatalogIntro')) return;

    const intro = document.createElement('div');
    intro.id = 'storeCatalogIntro';
    intro.className = 'store-catalog-intro';
    intro.innerHTML = `
      <div><h2>Productos</h2><p>Toque una tarjeta para ver precio, envío, promociones y acciones.</p></div>
      <span class="store-result-pill"><b id="storeVisibleCount">0</b>&nbsp; resultados</span>
    `;
    products.insertBefore(intro, toolbar);
  }

  function buildFooter() {
    const footer = qs('.app-footer');
    if (!footer || footer.dataset.storefrontReady === '1') return;
    footer.dataset.storefrontReady = '1';
    footer.innerHTML = `
      <div class="store-footer-modern">
        <div class="store-footer-brand">
          <img src="assets/img/logo-round.png" alt="Logo SD COMAYAGUA">
          <div><strong>SD COMAYAGUA</strong><span>Productos gamer, tecnología y atención personalizada.</span></div>
        </div>
        <div class="store-footer-details">
          <details><summary>Catálogo <span>⌄</span></summary><div>Explore categorías, productos disponibles y promociones desde cualquier teléfono.</div></details>
          <details><summary>Opciones de entrega <span>⌄</span></summary><div>Consulte envío normal y pagar al recibir dentro del detalle de cada producto.</div></details>
          <details><summary>Soporte <span>⌄</span></summary><div>Utilice los botones de Cotizar y WhatsApp para recibir atención sobre el producto seleccionado.</div></details>
        </div>
        <div class="store-footer-bottom">SD COMAYAGUA · Catálogo e inventario</div>
      </div>
    `;
  }

  function findDetailControl(card) {
    const direct = qs('.product-open-detail, .detail-action, [data-action="detail"], [data-product-action="detail"]', card);
    if (direct) return direct;
    return qsa('button, a, [role="button"]', card).find((control) => {
      const source = normalize(`${control.textContent} ${control.getAttribute('aria-label') || ''} ${control.getAttribute('title') || ''}`);
      return source.includes('ver producto') || source.includes('detalle');
    }) || null;
  }

  function extractCardData(card) {
    const nameNode = qs('.product-name, .product-title, [data-product-name], h3, h4', card);
    const media = qs('.product-media, [class*="product-media"]', card);
    const image = qs('img', media || card);
    const svg = qs('svg', media || card);
    const badge = qs('.stock-badge, [class*="stock-badge"]', card);
    const text = card.textContent || '';
    const stockMatch = text.match(/stock\s*:?\s*(\d+)/i) || text.match(/(\d+)\s*unidades?/i);
    const categoryNode = qs('.product-category, [data-product-category], .category-name', card);
    let category = categoryNode?.textContent?.trim() || card.dataset.category || '';
    if (!category) {
      const smalls = qsa('small, .mini-pill', card).map((node) => node.textContent.trim()).filter(Boolean);
      category = smalls.find((value) => !/promo|stock|disponible|agotado/i.test(value)) || 'Producto';
    }
    const status = badge?.textContent?.trim() || (/agotado/i.test(text) ? 'Agotado' : 'Disponible');
    return {
      name: nameNode?.textContent?.trim() || 'Producto',
      category,
      status,
      stock: stockMatch ? Number(stockMatch[1]) : null,
      image,
      svg
    };
  }

  function cloneVisual(data) {
    if (data.image) {
      const image = data.image.cloneNode(true);
      image.removeAttribute('style');
      image.loading = 'lazy';
      image.decoding = 'async';
      return image;
    }
    if (data.svg) return data.svg.cloneNode(true);
    const image = document.createElement('img');
    image.src = 'assets/img/logo-round.png';
    image.alt = '';
    return image;
  }

  function decorateProductCard(card) {
    if (!(card instanceof Element)) return;
    card.classList.add('store-minimal-card');

    let view = qs(':scope > .store-card-view', card);
    const data = extractCardData(card);

    if (!view) {
      view = document.createElement('div');
      view.className = 'store-card-view';
      view.innerHTML = `
        <div class="store-card-photo"><span class="store-card-status"></span></div>
        <div class="store-card-copy"><small class="store-card-category"></small><strong class="store-card-name"></strong><span class="store-card-stock"></span></div>
      `;
      card.appendChild(view);
    }

    const photo = qs('.store-card-photo', view);
    qsa('img, svg', photo).forEach((node) => node.remove());
    photo.appendChild(cloneVisual(data));

    const status = qs('.store-card-status', view);
    status.textContent = data.status;
    status.classList.toggle('out', /agotado|sin stock/i.test(data.status));
    qs('.store-card-category', view).textContent = data.category || 'Producto';
    qs('.store-card-name', view).textContent = data.name;
    qs('.store-card-stock', view).textContent = data.stock === null
      ? 'Toque para ver detalles'
      : `${data.stock} ${data.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`;

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Ver detalles de ${data.name}`);

    if (card.dataset.storeClickReady !== '1') {
      card.dataset.storeClickReady = '1';
      card.addEventListener('click', (event) => {
        if (event.target.closest('button, a, input, select, textarea')) return;
        findDetailControl(card)?.click();
      });
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        findDetailControl(card)?.click();
      });
    }
  }

  function buildFeatureCard(card) {
    const data = extractCardData(card);
    const article = document.createElement('article');
    article.className = 'store-feature-card';
    article.setAttribute('role', 'button');
    article.setAttribute('tabindex', '0');
    article.setAttribute('aria-label', `Ver ${data.name}`);

    const imageBox = document.createElement('div');
    imageBox.className = 'store-feature-image';
    imageBox.appendChild(cloneVisual(data));

    const copy = document.createElement('div');
    copy.className = 'store-feature-copy';
    const category = document.createElement('small');
    category.textContent = data.category || 'Producto';
    const name = document.createElement('strong');
    name.textContent = data.name;
    const stock = document.createElement('span');
    stock.className = 'store-feature-stock';
    stock.textContent = data.stock === null ? data.status : `${data.stock} disponibles`;
    copy.append(category, name, stock);
    article.append(imageBox, copy);

    const open = () => findDetailControl(card)?.click();
    article.addEventListener('click', open);
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    return article;
  }

  function syncProducts() {
    const cards = qsa('#productGrid .product-card');
    cards.forEach(decorateProductCard);

    const featured = qs('#storeFeaturedGrid');
    if (featured) {
      featured.replaceChildren(...cards.slice(0, 4).map(buildFeatureCard));
      if (!cards.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Los productos aparecerán aquí cuando termine la sincronización.';
        featured.appendChild(empty);
      }
    }
    syncCounters();
  }

  function getCategories() {
    const select = qs('#categoryFilter');
    if (!select) return [];
    return [...select.options]
      .map((option) => ({ value: option.value, label: option.textContent.trim() }))
      .filter((item) => item.value && item.value !== 'all' && item.label);
  }

  function syncCategories() {
    const categories = getCategories();
    const strip = qs('#storeCategoryStrip');
    const drawer = qs('#storeDrawerCategories');

    if (strip) {
      strip.replaceChildren();
      const allButton = createCategoryCard('all', 'Todas');
      strip.appendChild(allButton);
      categories.slice(0, 12).forEach((item) => strip.appendChild(createCategoryCard(item.value, item.label)));
    }

    if (drawer) {
      drawer.replaceChildren();
      categories.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'store-drawer-item';
        button.dataset.drawerCategory = item.value;
        button.innerHTML = `<span>${categoryIcon(item.label)}</span><span></span><span class="arrow">›</span>`;
        button.children[1].textContent = item.label;
        drawer.appendChild(button);
      });
    }
  }

  function createCategoryCard(value, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'store-category-card';
    button.dataset.categoryValue = value;
    const icon = document.createElement('span');
    icon.className = 'store-category-icon';
    icon.textContent = categoryIcon(label);
    const text = document.createElement('span');
    text.textContent = label;
    button.append(icon, text);
    button.addEventListener('click', () => selectCategory(value));
    return button;
  }

  function readCounter(id) {
    const value = qs(id)?.textContent?.trim();
    return value || '0';
  }

  function syncCounters() {
    const products = readCounter('#visibleCount');
    const units = readCounter('#unitCount');
    const available = readCounter('#availableCount');
    const targets = [
      ['#heroProducts', products],
      ['#heroUnits', units],
      ['#heroAvailable', available],
      ['#storeVisibleCount', products]
    ];
    targets.forEach(([selector, value]) => {
      const target = qs(selector);
      if (target) target.textContent = value;
    });
  }

  function scheduleSync() {
    if (state.syncScheduled) return;
    state.syncScheduled = true;
    requestAnimationFrame(() => {
      state.syncScheduled = false;
      syncProducts();
      syncCategories();
      syncCounters();
    });
  }

  function installObservers() {
    const grid = qs('#productGrid');
    if (grid && !state.productObserver) {
      state.productObserver = new MutationObserver(scheduleSync);
      state.productObserver.observe(grid, { childList: true, subtree: true, characterData: true });
    }

    const select = qs('#categoryFilter');
    if (select && !state.categoryObserver) {
      state.categoryObserver = new MutationObserver(syncCategories);
      state.categoryObserver.observe(select, { childList: true, subtree: true });
    }

    ['#visibleCount', '#unitCount', '#availableCount'].forEach((selector) => {
      const counter = qs(selector);
      if (counter) new MutationObserver(syncCounters).observe(counter, { childList: true, characterData: true, subtree: true });
    });
  }

  function markActiveNavigation() {
    qsa('.main-nav .nav-tab[data-section]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const section = tab.dataset.section;
        qsa('#storeDrawerNavigation [data-drawer-section]').forEach((item) => item.classList.toggle('active', item.dataset.drawerSection === section));
      });
    });
  }

  function boot() {
    document.documentElement.classList.add('storefront-v3');
    buildHome();
    buildHeaderTools();
    buildDrawer();
    buildCatalogIntro();
    buildFooter();
    markActiveNavigation();
    installObservers();
    scheduleSync();

    let attempts = 0;
    const warmup = window.setInterval(() => {
      scheduleSync();
      attempts += 1;
      if (attempts >= 16) window.clearInterval(warmup);
    }, 650);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
