// Acciones extras para editar/cancelar ventas y cotizaciones sin cambiar la base principal.
(function () {
  const KEYS = {
    products: 'sd_pos_products',
    sales: 'sd_pos_sales',
    quotes: 'sd_pos_quotes',
    cart: 'sd_pos_cart',
    queue: 'sd_pos_pending_queue'
  };

  const money = value => Number(value || 0).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' }).replace('HNL', 'Lps.');
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const safeItems = doc => {
    try { return JSON.parse(doc.productos_json || '[]'); }
    catch (_) { return []; }
  };
  const makeQueue = (type, payload) => {
    const q = read(KEYS.queue, []);
    q.push({ id: `Q-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, createdAt: new Date().toISOString(), attempts: 0, type, payload });
    write(KEYS.queue, q);
    if (window.SD_POS?.state) window.SD_POS.state.pendingQueue = q;
  };

  function parseColors(text = '') {
    return String(text || '').split(/[;,]/).map(part => {
      const pieces = part.split(/=|:/);
      if (pieces.length < 2) return null;
      return { color: pieces[0].trim(), qty: Number(pieces[1]) || 0 };
    }).filter(Boolean);
  }
  function serializeColors(colors) {
    return colors.map(c => `${c.color}=${Math.max(0, Number(c.qty) || 0)}`).join('; ');
  }
  function restoreStock(items) {
    const products = read(KEYS.products, window.SD_POS?.state?.products || []);
    items.forEach(item => {
      const p = products.find(x => String(x.codigo) === String(item.codigo));
      if (!p) return;
      p.stock = Number(p.stock || 0) + Number(item.qty || 0);
      if (item.color) {
        const colors = parseColors(p.colores);
        const row = colors.find(c => String(c.color) === String(item.color));
        if (row) row.qty += Number(item.qty || 0);
        p.colores = serializeColors(colors);
      }
      p.updatedAt = new Date().toISOString();
      p.syncStatus = 'pendiente';
    });
    write(KEYS.products, products);
    if (window.SD_POS?.state) window.SD_POS.state.products = products;
  }
  function loadToCart(doc, kind) {
    const items = safeItems(doc);
    if (!items.length) return alert('Este documento no tiene productos para editar.');
    const cart = {
      items,
      discount: Number(doc.descuento || 0),
      deliveryType: Number(doc.envio || 0) > 0 ? 'envio_normal' : 'sin_envio',
      cod: Number(doc.comision || 0) > 0,
      customer: { nombre: doc.cliente || '', telefono: doc.telefono || '' },
      notes: `${kind === 'sale' ? 'Editando venta' : 'Editando cotización'} ${doc.venta_id || doc.cotizacion_id}. ${doc.observaciones || ''}`.trim()
    };
    write(KEYS.cart, cart);
    if (window.SD_POS?.state) window.SD_POS.state.cart = cart;
    window.SD_POS?.navigate?.('cart');
  }
  function cancelQuote(id) {
    const quotes = read(KEYS.quotes, window.SD_POS?.state?.quotes || []);
    const q = quotes.find(x => String(x.cotizacion_id) === String(id));
    if (!q) return;
    if (!confirm('¿Cancelar esta cotización?')) return;
    q.estado = 'Cancelada';
    q.syncStatus = 'pendiente';
    write(KEYS.quotes, quotes);
    if (window.SD_POS?.state) window.SD_POS.state.quotes = quotes;
    makeQueue('saveQuote', { quote: q });
    window.SD_POS?.navigate?.('quotes');
  }
  function editQuote(id) {
    const quotes = read(KEYS.quotes, window.SD_POS?.state?.quotes || []);
    const q = quotes.find(x => String(x.cotizacion_id) === String(id));
    if (!q) return;
    q.estado = 'En edición';
    q.syncStatus = 'pendiente';
    write(KEYS.quotes, quotes);
    makeQueue('saveQuote', { quote: q });
    loadToCart(q, 'quote');
  }
  function cancelSale(id) {
    const sales = read(KEYS.sales, window.SD_POS?.state?.sales || []);
    const s = sales.find(x => String(x.venta_id) === String(id));
    if (!s) return;
    if (String(s.estado).toLowerCase() === 'cancelada') return alert('Esta venta ya está cancelada.');
    if (!confirm('¿Cancelar esta venta y devolver el stock al inventario?')) return;
    restoreStock(safeItems(s));
    s.estado = 'Cancelada';
    s.observaciones = `${s.observaciones || ''} | Venta cancelada y stock devuelto`.trim();
    s.syncStatus = 'pendiente';
    write(KEYS.sales, sales);
    if (window.SD_POS?.state) window.SD_POS.state.sales = sales;
    makeQueue('saveSale', { sale: s });
    window.SD_POS?.navigate?.('sales');
  }
  function editSale(id) {
    const sales = read(KEYS.sales, window.SD_POS?.state?.sales || []);
    const s = sales.find(x => String(x.venta_id) === String(id));
    if (!s) return;
    if (String(s.estado).toLowerCase() !== 'cancelada') {
      if (!confirm('Para editar una venta se devolverá el stock y la venta quedará en edición. ¿Continuar?')) return;
      restoreStock(safeItems(s));
      s.estado = 'En edición';
      s.syncStatus = 'pendiente';
      write(KEYS.sales, sales);
      makeQueue('saveSale', { sale: s });
    }
    loadToCart(s, 'sale');
  }

  function enhanceRows() {
    const title = document.getElementById('viewTitle')?.textContent || '';
    document.querySelectorAll('[data-view-quote]').forEach(btn => {
      const cell = btn.closest('td');
      const id = btn.dataset.viewQuote;
      if (!cell || cell.dataset.enhanced === '1') return;
      cell.dataset.enhanced = '1';
      cell.insertAdjacentHTML('beforeend', `<button class="mini-btn" data-edit-quote-extra="${id}">Editar</button><button class="mini-btn danger-mini" data-cancel-quote-extra="${id}">Cancelar</button>`);
    });
    document.querySelectorAll('[data-view-sale]').forEach(btn => {
      const cell = btn.closest('td');
      const id = btn.dataset.viewSale;
      if (!cell || cell.dataset.enhanced === '1') return;
      cell.dataset.enhanced = '1';
      cell.insertAdjacentHTML('beforeend', `<button class="mini-btn" data-edit-sale-extra="${id}">Editar</button><button class="mini-btn danger-mini" data-cancel-sale-extra="${id}">Cancelar</button>`);
    });
  }

  document.addEventListener('click', event => {
    const qEdit = event.target.closest('[data-edit-quote-extra]');
    if (qEdit) return editQuote(qEdit.dataset.editQuoteExtra);
    const qCancel = event.target.closest('[data-cancel-quote-extra]');
    if (qCancel) return cancelQuote(qCancel.dataset.cancelQuoteExtra);
    const sEdit = event.target.closest('[data-edit-sale-extra]');
    if (sEdit) return editSale(sEdit.dataset.editSaleExtra);
    const sCancel = event.target.closest('[data-cancel-sale-extra]');
    if (sCancel) return cancelSale(sCancel.dataset.cancelSaleExtra);
  });

  setInterval(enhanceRows, 700);
  window.addEventListener('load', enhanceRows);
})();
