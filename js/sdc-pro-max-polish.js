/* SD COMAYAGUA · PRO MAX: mejoras progresivas de cotización y móvil */
(function(){
  'use strict';

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $$(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function cleanText(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function norm(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function toast(msg){
    var t = $('#toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ t.classList.remove('show'); }, 2400);
  }
  function addClass(){ if(document.body) document.body.classList.add('sdc-max-polished'); }

  function ensureSmartDocbar(){
    var body = $('.quote-body');
    if(!body) return null;
    var existing = $('.sdc-smart-docbar', body);
    if(existing) return existing;
    var status = $('.quote-status', body);
    var bar = document.createElement('div');
    bar.className = 'sdc-smart-docbar no-print';
    bar.setAttribute('data-empty','1');
    bar.innerHTML = '<div class="sdc-smart-docbar-main"><b>Sin productos seleccionados</b><span>Toque una tarjeta para agregar.</span></div><button type="button" class="primary sdc-mini-current">Ver lista</button><button type="button" class="sdc-mini-preview">Vista foto</button>';
    if(status && status.parentNode) status.insertAdjacentElement('afterend', bar);
    else body.insertAdjacentElement('afterbegin', bar);
    return bar;
  }

  function getSelectedMap(){
    var map = new Map();
    $$('.cart-row-v24,.cart-row').forEach(function(row){
      var name = cleanText($('.cart-info b', row) || $('b', row));
      if(!name) return;
      var qtyInput = $('input[data-qty]', row);
      var qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
      map.set(norm(name), qty);
    });
    return map;
  }

  function parseStock(row){
    var span = cleanText($('span', row));
    var m = span.match(/Stock\s+([\d.,]+)/i);
    if(!m) return null;
    return Number(String(m[1]).replace(/,/g,'')) || 0;
  }

  function enhancePickerRows(){
    var selected = getSelectedMap();
    $$('.quote-body #pickerList .picker-item').forEach(function(row){
      var name = cleanText($('b', row));
      var key = norm(name);
      var qty = selected.get(key) || 0;
      row.classList.toggle('sdc-picker-selected', qty > 0);
      if(qty > 0) row.setAttribute('data-picked-qty', String(qty));
      else row.removeAttribute('data-picked-qty');

      var stock = parseStock(row);
      row.classList.toggle('sdc-low-stock', stock !== null && stock > 0 && stock <= 3);
      row.classList.toggle('sdc-out-stock', stock !== null && stock <= 0);
      var btn = $('.add-pick-btn,[data-additem]', row);
      if(btn && stock !== null && stock <= 0){
        btn.disabled = true;
        btn.setAttribute('aria-disabled','true');
      }
      if(btn && stock !== null && stock > 0){
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
      }
    });
  }

  function updateSmartDocbar(){
    var bar = ensureSmartDocbar();
    if(!bar) return;
    var pill = cleanText($('#selectedCountPill')) || '0 artículos';
    var total = cleanText($('#totalsMini .summary-total b:last-child')) || 'Lps. 0';
    var countMatch = pill.match(/\d+/);
    var count = countMatch ? Number(countMatch[0]) : 0;
    var main = $('.sdc-smart-docbar-main', bar);
    if(main){
      if(count > 0){
        var selectedText = count === 1 ? '1 artículo seleccionado' : pill + ' seleccionados';
        main.innerHTML = '<b>' + selectedText + '</b><span>Total: ' + total + ' · Ver lista para revisar.</span>';
      }else{
        main.innerHTML = '<b>Sin productos seleccionados</b><span>Toque una tarjeta para agregarla a la cotización.</span>';
      }
    }
    bar.setAttribute('data-empty', count > 0 ? '0' : '1');
  }

  function improveInputs(){
    var pick = $('#pickSearch');
    if(pick){
      pick.setAttribute('enterkeyhint','search');
      pick.setAttribute('autocomplete','off');
      pick.setAttribute('spellcheck','false');
    }
    $$('input[data-qty],input[data-cqty-input]').forEach(function(input){
      input.setAttribute('inputmode','numeric');
      input.setAttribute('pattern','[0-9]*');
    });
  }

  function enhanceQuote(){
    addClass();
    if(!$('.quote-body')) return;
    ensureSmartDocbar();
    improveInputs();
    enhancePickerRows();
    updateSmartDocbar();
  }

  function scrollToSafe(target){
    if(!target) return;
    try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }
    catch(e){ target.scrollIntoView(); }
  }

  document.addEventListener('click', function(ev){
    var outRow = ev.target.closest && ev.target.closest('.quote-body #pickerList .picker-item.sdc-out-stock');
    if(outRow){
      ev.preventDefault();
      ev.stopPropagation();
      toast('Este producto aparece sin stock disponible.');
      return;
    }
    var listBtn = ev.target.closest && ev.target.closest('.sdc-mini-current');
    if(listBtn){
      ev.preventDefault();
      scrollToSafe($('.current-card'));
      return;
    }
    var previewBtn = ev.target.closest && ev.target.closest('.sdc-mini-preview');
    if(previewBtn){
      ev.preventDefault();
      scrollToSafe($('.preview-card'));
      return;
    }
  }, true);

  document.addEventListener('click', function(ev){
    if(ev.target.closest && ev.target.closest('.quote-body #pickerList .picker-item:not(.sdc-out-stock), [data-additem], [data-inc], [data-dec], [data-rem]')){
      setTimeout(enhanceQuote, 80);
      setTimeout(enhanceQuote, 260);
    }
  }, true);

  document.addEventListener('input', function(ev){
    if(ev.target && (ev.target.id === 'pickSearch' || ev.target.matches('input[data-qty],input[data-cqty-input],.bindDoc'))){
      setTimeout(enhanceQuote, 80);
    }
  }, true);

  var observer = new MutationObserver(function(){
    clearTimeout(observer._t);
    observer._t = setTimeout(enhanceQuote, 80);
  });

  function start(){
    addClass();
    enhanceQuote();
    if(document.body) observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    setTimeout(enhanceQuote, 450);
    setTimeout(enhanceQuote, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
