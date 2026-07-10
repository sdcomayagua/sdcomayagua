(() => {
  'use strict';

  const NAV_ICONS = {
    inicio: '⌂',
    panel: '▦',
    cotizaciones: '▤',
    productos: '◫'
  };

  const ACTION_LABELS = {
    whatsappQuoteBtn: ['💬', 'Enviar por WhatsApp'],
    saveQuoteBtn: ['✓', 'Guardar cotización'],
    downloadQuoteBtn: ['↓', 'Descargar cotización'],
    downloadReceiptBtn: ['▣', 'Descargar recibo'],
    copyQuoteBtn: ['⧉', 'Copiar texto'],
    sellQuoteBtn: ['$', 'Vender y descontar stock']
  };

  function decorateNavigation() {
    document.querySelectorAll('.main-nav .nav-tab[data-section]').forEach((button) => {
      if (button.dataset.proNavReady === '1') return;
      const section = button.dataset.section || '';
      const label = button.textContent.trim();
      button.textContent = '';

      const icon = document.createElement('span');
      icon.className = 'pro-nav-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = NAV_ICONS[section] || '•';

      const text = document.createElement('span');
      text.className = 'pro-nav-label';
      text.textContent = label;

      button.append(icon, text);
      button.dataset.proNavReady = '1';
    });
  }

  function decorateQuoteDialog() {
    const dialog = document.getElementById('quoteDialog');
    if (!dialog) return;

    dialog.classList.add('pro-quote-dialog');
    const label = dialog.querySelector('.dialog-head .section-label');
    const title = dialog.querySelector('#quoteProductName');
    const hint = dialog.querySelector('.quote-hint');

    if (label) label.textContent = 'Cotización profesional';
    if (title && !title.dataset.proTitleReady) {
      title.dataset.proTitleReady = '1';
      if (!title.textContent.trim() || /cotizar productos|factura/i.test(title.textContent)) {
        title.textContent = 'Crear cotización';
      }
    }
    if (hint) {
      hint.textContent = 'Ajusta cantidades, añade productos y revisa la presentación final antes de guardar o enviar.';
    }

    Object.entries(ACTION_LABELS).forEach(([id, config]) => {
      const button = document.getElementById(id);
      if (!button || button.dataset.proLabelReady === '1') return;
      const [iconText, labelText] = config;
      button.textContent = '';
      const icon = document.createElement('span');
      icon.className = 'pro-action-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = iconText;
      const text = document.createElement('span');
      text.textContent = labelText;
      button.append(icon, text);
      button.dataset.proLabelReady = '1';
    });
  }

  function upgradeInvoice(root) {
    if (!root) return;
    const paper = root.querySelector('.invoice-paper');
    const head = root.querySelector('.invoice-head');
    const brand = root.querySelector('.invoice-brand-line');
    const logo = root.querySelector('.invoice-logo-image');
    if (!paper || !head || !brand || !logo) return;

    paper.classList.add('invoice-paper-pro');

    if (!logo.parentElement?.classList.contains('invoice-logo-shell')) {
      const shell = document.createElement('span');
      shell.className = 'invoice-logo-shell';
      logo.before(shell);
      shell.appendChild(logo);
    }

    logo.width = 50;
    logo.height = 50;
    logo.loading = 'eager';
    logo.decoding = 'async';
    logo.removeAttribute('style');

    const brandCopy = [...brand.children].find((child) => child.tagName === 'DIV');
    if (brandCopy) {
      brandCopy.classList.add('invoice-brand-copy');
      if (!brandCopy.querySelector('.invoice-kicker')) {
        const kicker = document.createElement('span');
        kicker.className = 'invoice-kicker';
        kicker.textContent = 'Tienda gamer y tecnología';
        brandCopy.prepend(kicker);
      }
    }

    const meta = [...head.children].find((child) => child.tagName === 'SMALL');
    if (meta) {
      meta.classList.add('invoice-meta');
      const spans = meta.querySelectorAll('span');
      if (spans[0]) spans[0].classList.add('invoice-meta-number');
      if (spans[1]) spans[1].classList.add('invoice-meta-date');
    }

    root.querySelectorAll('.invoice-product-thumb img').forEach((image) => {
      image.loading = 'eager';
      image.decoding = 'async';
    });
  }

  function observeInvoice() {
    const preview = document.getElementById('quotePreview');
    if (!preview) return;
    upgradeInvoice(preview);

    const observer = new MutationObserver(() => upgradeInvoice(preview));
    observer.observe(preview, { childList: true, subtree: true });
  }

  function syncDialogState() {
    const hasOpenDialog = [...document.querySelectorAll('dialog')].some((dialog) => dialog.open);
    document.body?.classList.toggle('pro-ui-open-dialog', hasOpenDialog);
  }

  function observeDialogs() {
    const observer = new MutationObserver(syncDialogState);
    document.querySelectorAll('dialog').forEach((dialog) => {
      observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    });
    syncDialogState();
  }

  function boot() {
    document.documentElement.classList.add('pro-ui-ready');
    decorateNavigation();
    decorateQuoteDialog();
    observeInvoice();
    observeDialogs();

    const bodyObserver = new MutationObserver(() => {
      decorateNavigation();
      decorateQuoteDialog();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
