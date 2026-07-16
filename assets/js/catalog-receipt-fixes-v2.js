// SD COMAYAGUA · Corrección final del texto de Pagar al recibir.
(() => {
  'use strict';

  const RECEIVE_TEXT = 'Se paga al recibir. La empresa cobra 10% por usar este servicio, se multiplica por el valor total del producto + Lps.110 del envío.';
  const CANVAS_LINES = [
    'Se paga al recibir.',
    'La empresa cobra 10% por usar este servicio,',
    'se multiplica por el valor total del producto',
    '+ Lps.110 del envío.'
  ];

  function updateInvoiceText(root = document) {
    root.querySelectorAll?.('.invoice-option.receive small').forEach((node) => {
      if (node.textContent.trim() !== RECEIVE_TEXT) node.textContent = RECEIVE_TEXT;
    });
  }

  function patchQuoteCanvas() {
    if (!window.CanvasRenderingContext2D) return;
    const proto = window.CanvasRenderingContext2D.prototype;
    if (proto.__sdReceiveTextPatchedV2) return;

    const previousFillText = proto.fillText;
    proto.fillText = function sdReceiveTextFillText(text, x, y, maxWidth) {
      const value = String(text || '').trim();
      const isQuoteCanvas = this?.canvas?.width === 900;

      if (isQuoteCanvas && this.__sdSkipOldReceiveLineV2 > 0) {
        this.__sdSkipOldReceiveLineV2 -= 1;
        return;
      }

      if (isQuoteCanvas && /^Se paga al recibir\./i.test(value)) {
        this.save();
        this.fillStyle = '#64748b';
        this.font = '800 14px Arial, sans-serif';
        CANVAS_LINES.forEach((line, index) => {
          previousFillText.call(this, line, x, y + index * 17);
        });
        this.restore();

        // El generador original dibuja la nota vieja en dos líneas.
        // La primera se sustituye arriba y la segunda se descarta.
        this.__sdSkipOldReceiveLineV2 = 1;
        return;
      }

      if (arguments.length >= 4) return previousFillText.call(this, text, x, y, maxWidth);
      return previousFillText.call(this, text, x, y);
    };

    proto.__sdReceiveTextPatchedV2 = true;
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
