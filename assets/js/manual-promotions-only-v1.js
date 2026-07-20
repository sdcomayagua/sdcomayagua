// SD COMAYAGUA · Promociones controladas manualmente por producto.
(() => {
  'use strict';

  const MIGRATION_KEY = 'sd_manual_promotions_only_v1';
  const RELOAD_KEY = 'sd_manual_promotions_reload_v1';
  const PRODUCTS_KEY = 'sd_comayagua_products';
  const PUBLIC = document.body?.dataset.publicCatalog === 'true' || /cliente(?:\.html)?$/i.test(location.pathname);

  function parsePromotion(value) {
    if (!value) return { original: value, parsed: null, wasString: false };
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return { original: value, parsed: null, wasString: true };
      try {
        return { original: value, parsed: JSON.parse(text), wasString: true };
      } catch {
        return { original: value, parsed: null, wasString: true };
      }
    }
    return { original: value, parsed: value, wasString: false };
  }

  function isGiftRule(rule) {
    if (!rule || typeof rule !== 'object') return false;
    const type = String(rule.type || '').toLowerCase().trim();
    return type === 'gift'
      || type === 'regalo'
      || Array.isArray(rule.gifts)
      || Boolean(rule.giftProductId || rule.giftCode || rule.giftMatch);
  }

  function cleanPromotion(value) {
    const info = parsePromotion(value);
    const parsed = info.parsed;
    if (!parsed) return { changed: false, value: info.original };

    const sourceRules = Array.isArray(parsed) ? parsed : [parsed];
    const kept = sourceRules.filter((rule) => !isGiftRule(rule));
    const changed = kept.length !== sourceRules.length;
    if (!changed) return { changed: false, value: info.original };

    let cleaned = null;
    if (kept.length === 1) cleaned = kept[0];
    if (kept.length > 1) cleaned = kept;
    if (info.wasString) cleaned = cleaned ? JSON.stringify(cleaned) : '';
    return { changed: true, value: cleaned };
  }

  function cleanProduct(product) {
    if (!product || typeof product !== 'object') return { changed: false, product };
    const result = cleanPromotion(product.promotion ?? product.promo ?? product.promocion ?? product['promoción']);
    if (!result.changed) return { changed: false, product };

    const copy = { ...product, promotion: result.value || null, updatedAt: new Date().toISOString() };
    delete copy.promo;
    delete copy.promocion;
    delete copy['promoción'];
    return { changed: true, product: copy };
  }

  function migrateLocalProducts() {
    let changed = false;
    for (const storage of [localStorage, sessionStorage]) {
      try {
        const raw = storage.getItem(PRODUCTS_KEY);
        if (!raw) continue;
        const products = JSON.parse(raw);
        if (!Array.isArray(products)) continue;
        const cleaned = products.map((product) => {
          const result = cleanProduct(product);
          changed ||= result.changed;
          return result.product;
        });
        if (changed) storage.setItem(PRODUCTS_KEY, JSON.stringify(cleaned));
      } catch (error) {
        console.warn('No se pudieron limpiar promociones locales.', error);
      }
    }
    return changed;
  }

  function configureEditor() {
    const editor = document.getElementById('productPromotionEditor');
    if (!editor) return;

    const giftCard = editor.querySelector('[data-promo-card="gift"]');
    if (giftCard) {
      giftCard.hidden = true;
      giftCard.setAttribute('aria-hidden', 'true');
    }

    const title = editor.querySelector('.promotion-editor-head h4');
    if (title) title.textContent = 'Descuentos manuales por cantidad';

    const intro = editor.querySelector('.promotion-editor-head small');
    if (intro) intro.textContent = 'Tú decides en cada producto desde qué cantidad cambia el precio por unidad.';

    const help = editor.querySelector('.promo-editor-help');
    if (help) help.textContent = 'Solo se aplican los descuentos que guardes aquí. Los regalos se agregan manualmente al preparar una cotización.';

    const tierLabel = editor.querySelector('[data-promo-card="tier"] .promo-main-toggle span');
    if (tierLabel) tierLabel.textContent = 'Activar descuento por cantidad';

    const giftToggle = document.getElementById('promoGiftEnabled');
    if (giftToggle?.checked) {
      giftToggle.checked = false;
      giftToggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (giftToggle) giftToggle.disabled = true;

    editor.querySelectorAll('#promoGiftBody input, #promoGiftBody select, #promoGiftBody button').forEach((control) => {
      control.disabled = true;
    });
  }

  function forceGiftDisabledBeforeSave() {
    const giftToggle = document.getElementById('promoGiftEnabled');
    if (!giftToggle) return;
    giftToggle.checked = false;
    giftToggle.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function migrateFirestore(app, firestoreModule) {
    const db = firestoreModule.getFirestore(app);
    const names = [...new Set([
      ...(Array.isArray(window.SD_FIRESTORE_COLLECTIONS) ? window.SD_FIRESTORE_COLLECTIONS : []),
      window.SD_FIRESTORE_COLLECTION,
      'productos', 'products', 'inventario', 'catalogo', 'catalogoProductos', 'productos_catalogo', 'items'
    ].filter(Boolean))];

    for (const name of names) {
      let snapshot;
      try {
        snapshot = await firestoreModule.getDocs(
          firestoreModule.query(firestoreModule.collection(db, name), firestoreModule.limit(800))
        );
      } catch {
        continue;
      }
      if (snapshot.empty) continue;

      let changed = 0;
      const writes = [];
      snapshot.docs.forEach((document) => {
        const result = cleanProduct({ ...document.data(), id: document.id });
        if (!result.changed) return;
        changed += 1;
        writes.push(firestoreModule.setDoc(document.ref, {
          promotion: result.product.promotion,
          updatedAt: result.product.updatedAt
        }, { merge: true }));
      });
      await Promise.all(writes);
      return changed;
    }
    return 0;
  }

  async function migrateRealtime(app, databaseModule) {
    if (!databaseModule) return 0;
    const db = databaseModule.getDatabase(app);
    const paths = [...new Set([
      ...(Array.isArray(window.SD_REALTIME_PRODUCTS_PATHS) ? window.SD_REALTIME_PRODUCTS_PATHS : []),
      window.SD_REALTIME_PRODUCTS_PATH,
      'productos', 'products', 'inventario', 'catalogo', 'catalogoProductos', 'items'
    ].filter(Boolean))];

    for (const path of paths) {
      let snapshot;
      try {
        snapshot = await databaseModule.get(databaseModule.ref(db, path));
      } catch {
        continue;
      }
      if (!snapshot.exists()) continue;
      const value = snapshot.val();
      if (!value || typeof value !== 'object') continue;

      const updates = {};
      let changed = 0;
      Object.entries(value).forEach(([id, product]) => {
        const result = cleanProduct(product);
        if (!result.changed) return;
        changed += 1;
        updates[`${path}/${id}/promotion`] = result.product.promotion;
        updates[`${path}/${id}/updatedAt`] = result.product.updatedAt;
      });
      if (changed) await databaseModule.update(databaseModule.ref(db), updates);
      return changed;
    }
    return 0;
  }

  async function migrateCloudProducts() {
    if (PUBLIC || sessionStorage.getItem(MIGRATION_KEY) === '1') return;
    const config = window.SD_FIREBASE_CONFIG;
    if (!config?.apiKey || !config?.projectId) return;

    try {
      const [appModule, firestoreModule, databaseModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js').catch(() => null)
      ]);

      const existing = appModule.getApps().find((item) => item.options?.projectId === config.projectId);
      const app = existing || appModule.initializeApp(config, 'sd-manual-promotions-migration');
      let changed = await migrateFirestore(app, firestoreModule);
      if (!changed) changed = await migrateRealtime(app, databaseModule);

      sessionStorage.setItem(MIGRATION_KEY, '1');
      migrateLocalProducts();

      if (changed > 0 && sessionStorage.getItem(RELOAD_KEY) !== '1') {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.setTimeout(() => location.reload(), 450);
      }
    } catch (error) {
      console.warn('No se pudo completar la limpieza de regalos automáticos en Firebase.', error);
    }
  }

  function startCloudMigration() {
    if (PUBLIC) return;
    window.setTimeout(migrateCloudProducts, 1400);
  }

  // Se ejecuta antes de que app.js lea los productos locales.
  migrateLocalProducts();

  function boot() {
    configureEditor();
    document.getElementById('productForm')?.addEventListener('submit', forceGiftDisabledBeforeSave, true);

    const dialog = document.getElementById('productDialog');
    if (dialog) {
      new MutationObserver(() => {
        if (!dialog.open) return;
        [0, 120, 320].forEach((delay) => window.setTimeout(configureEditor, delay));
      }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    if (document.body?.classList.contains('admin-auth-ok')) startCloudMigration();
    window.addEventListener('sd:admin-auth-ok', startCloudMigration);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
