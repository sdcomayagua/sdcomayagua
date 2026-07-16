// SD COMAYAGUA · Texto limpio para Pagar al recibir.
(() => {
  'use strict';

  const INVOICE_TEXT = 'Se paga al recibir. La empresa cobra 10% por el servicio. Cálculo: productos + Lps.110 de envío, más 10%.';
  const CANVAS_LINES = [
    { text: 'Pago al recibir.', font: '800 14px Arial, sans-serif', color: '#475569' },
    { text: 'La empresa cobra 10% por el servicio.', font: '700 12px Arial, sans-serif', color: '#64748b' },
    { text: 'Cálculo: productos + Lps.110, más 10%.', font: '900 12px Arial, sans-serif', color: '#c2410c' }
  ];

  function updateInvoiceText(root = document) {
    root.querySelectorAll?.('.invoice-option.receive small').forEach((node) => {
      if (node.textContent.trim() !== INVOICE_TEXT) node.textContent = INVOICE_TEXT;
    });
  }

  function patchQuoteCanvas() {
    if (!window.CanvasRenderingContext2D) return;
    const proto = window.CanvasRenderingContext2D.prototype;
    if (proto.__sdReceiveTextPatchedV3) return;

    const previousFillText = proto.fillText;
    proto.fillText = function sdReceiveTextFillText(text, x, y, maxWidth) {
      const value = String(text || '').trim();
      const isQuoteCanvas = this?.canvas?.width === 900;

      if (isQuoteCanvas && this.__sdSkipOldReceiveLineV3 > 0) {
        this.__sdSkipOldReceiveLineV3 -= 1;
        return;
      }

      if (isQuoteCanvas && /^Se paga al recibir\./i.test(value)) {
        this.save();
        CANVAS_LINES.forEach((line, index) => {
          this.fillStyle = line.color;
          this.font = line.font;
          previousFillText.call(this, line.text, x, y + index * 18);
        });
        this.restore();

        // El generador original divide la nota anterior en dos líneas.
        // Se reemplaza la primera y se descarta la segunda.
        this.__sdSkipOldReceiveLineV3 = 1;
        return;
      }

      if (arguments.length >= 4) return previousFillText.call(this, text, x, y, maxWidth);
      return previousFillText.call(this, text, x, y);
    };

    proto.__sdReceiveTextPatchedV3 = true;
  }

  function boot() {
    patchQuoteCanvas();
    updateInvoiceText();

    const preview = document.getElementById('quotePreview');
    if (preview) {
      new MutationObserver(() => updateInvoiceText(preview)).observe(preview, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    [200, 700, 1500, 2800].forEach((delay) => {
      window.setTimeout(() => updateInvoiceText(), delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
