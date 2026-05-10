/* SD COMAYAGUA · capa final de interacción visual + refinamiento extra */
(function(){
  'use strict';

  function $(s,root){return (root||document).querySelector(s);}
  function $$(s,root){return Array.from((root||document).querySelectorAll(s));}
  function addClass(){ if(document.body) document.body.classList.add('sdc-polished'); }
  function setVH(){ document.documentElement.style.setProperty('--sdc-real-vh', (window.innerHeight * 0.01) + 'px'); }
  function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function toast(msg){
    const t=$('#toast');
    if(!t) return;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t=setTimeout(function(){t.classList.remove('show');},2600);
  }
  function markSelectedCard(card){
    if(!card) return;
    card.classList.add('sdc-just-selected');
    clearTimeout(card._sdcSelectedTimer);
    card._sdcSelectedTimer=setTimeout(function(){card.classList.remove('sdc-just-selected');},1900);
  }
  function showQuoteNotice(name){
    setTimeout(function(){
      const notice=$('#cartNotice');
      if(notice){
        notice.classList.remove('hide');
        notice.innerHTML='<b>✓ Artículo seleccionado</b><span>'+escapeHtml(name || 'Producto agregado correctamente')+'</span>';
        clearTimeout(window.__sdcFinalQuoteNotice);
        window.__sdcFinalQuoteNotice=setTimeout(function(){notice.classList.add('hide');},3200);
      }
      toast('Artículo seleccionado para cotización.');
    },180);
  }
  function iconizeActions(){
    const map={
      cardClient:'👤', captureClean:'▣', quote:'🧾', sell:'🛒', catalog:'⌂', newProduct:'＋', quickSale:'⚡', quotes:'📋', clients:'☎', receipts:'▤', profit:'💰', backup:'⛨', lowStock:'⚠', noCost:'₵', moneyLock:'🔒'
    };
    $$('[data-action]').forEach(function(btn){
      const a=btn.dataset.action;
      if(map[a] && !btn.dataset.sdcIcon) btn.dataset.sdcIcon=map[a];
      if(a && !btn.getAttribute('aria-label')){
        const label=text(btn) || a;
        btn.setAttribute('aria-label', label);
      }
    });
  }
  function injectFlowGuide(){
    const app=$('#app');
    if(!app || app.classList.contains('login-wrap') || $('[data-sdc-enhance="flow"]', app)) return;
    const mode=$('.view-mode-panel', app);
    if(!mode) return;
    const html='<section class="sdc-flow-guide no-print" data-sdc-enhance="flow" aria-label="Flujo recomendado">'+
      '<button class="sdc-flow-step" type="button" data-sdc-flow="client"><b>1 · Cliente</b><span>Oculta costos</span></button>'+
      '<button class="sdc-flow-step" type="button" data-sdc-flow="search"><b>2 · Buscar</b><span>Encuentre rápido</span></button>'+
      '<button class="sdc-flow-step primary" type="button" data-sdc-flow="quote"><b>3 · Cotizar</b><span>Seleccione productos</span></button>'+
      '<button class="sdc-flow-step" type="button" data-sdc-flow="capture"><b>4 · Captura</b><span>Foto limpia</span></button>'+
    '</section>';
    mode.insertAdjacentHTML('afterend', html);
  }
  function updateDocItemsClass(){
    const pill=$('#selectedCountPill');
    let count=0;
    if(pill){
      const m=text(pill).match(/\d+/);
      count=m ? Number(m[0]) : 0;
    }
    document.body.classList.toggle('sdc-has-doc-items', count>0);
  }
  function polishModalAfterOpen(action){
    setTimeout(function(){
      updateDocItemsClass();
      if(action==='quote' || action==='quoteProduct'){
        const pick=$('#pickSearch');
        if(pick) pick.focus({preventScroll:true});
      }
    },280);
  }
  function runEnhancements(){
    addClass();
    iconizeActions();
    injectFlowGuide();
    updateDocItemsClass();
  }

  document.addEventListener('click',function(ev){
    const flow=ev.target.closest('[data-sdc-flow]');
    if(flow){
      ev.preventDefault();
      const a=flow.dataset.sdcFlow;
      if(a==='client') document.querySelector('[data-action="cardClient"]')?.click();
      if(a==='search'){
        const input=$('#searchInput');
        if(input){ input.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(function(){input.focus({preventScroll:true});},220); }
      }
      if(a==='quote') document.querySelector('[data-action="quote"]')?.click();
      if(a==='capture') document.querySelector('[data-action="captureClean"]')?.click();
      return;
    }

    const btn=ev.target.closest('[data-action]');
    if(!btn) return;
    const action=btn.dataset.action;
    if(action==='quoteProduct'){
      const card=btn.closest('.product-card');
      const name=text(card && card.querySelector('.product-title')) || 'Producto';
      markSelectedCard(card);
      showQuoteNotice(name);
      polishModalAfterOpen(action);
    }
    if(action==='quote') polishModalAfterOpen(action);
    if(action==='sell' || action==='sellProduct') polishModalAfterOpen(action);
    if(action==='cardClient') setTimeout(function(){toast('Vista cliente activada para preparar fotos y precios.');},120);
    if(action==='captureClean') setTimeout(function(){
      const active=document.body.classList.contains('capture-clean');
      toast(active ? 'Modo captura activo. Toque SALIR PARA VOLVER.' : 'Vista normal restaurada.');
    },160);
  },true);

  document.addEventListener('input',function(ev){
    if(ev.target && ev.target.id==='searchInput'){
      document.body.classList.add('sdc-searching');
      clearTimeout(document.body._sdcSearchingTimer);
      document.body._sdcSearchingTimer=setTimeout(function(){document.body.classList.remove('sdc-searching');},700);
    }
    if(ev.target && (ev.target.matches('[data-qty]') || ev.target.matches('[data-cqty-input]'))){
      setTimeout(updateDocItemsClass,80);
    }
  },true);

  document.addEventListener('click',function(ev){
    if(ev.target.closest('[data-inc],[data-dec],[data-rem],[data-additem]')) setTimeout(updateDocItemsClass,140);
  },true);

  window.addEventListener('scroll',function(){
    document.body.classList.toggle('sdc-pro-scrolled', window.scrollY>24);
  },{passive:true});

  const obs=new MutationObserver(function(){
    clearTimeout(obs._t);
    obs._t=setTimeout(runEnhancements,80);
  });
  function start(){
    addClass();
    setVH();
    runEnhancements();
    if(document.body) obs.observe(document.body,{childList:true,subtree:true});
  }
  window.addEventListener('resize',setVH,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(setVH,250);},{passive:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();

/* SDC HOTFIX COTIZAR V3: permite agregar tocando toda la tarjeta del producto. */
(function(){
  'use strict';
  function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function toast(msg){
    var t=document.querySelector('#toast');
    if(!t) return;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t=setTimeout(function(){t.classList.remove('show');},2400);
  }
  function mark(row){
    if(!row) return;
    row.classList.add('sdc-row-picked');
    clearTimeout(row._sdcPickTimer);
    row._sdcPickTimer=setTimeout(function(){row.classList.remove('sdc-row-picked');},1200);
  }
  document.addEventListener('click',function(ev){
    var row=ev.target.closest && ev.target.closest('.quote-body #pickerList .picker-item');
    if(!row) return;
    if(ev.target.closest('input,select,textarea,.chip')) return;
    var btn=row.querySelector('.add-pick-btn,[data-additem]');
    if(!btn) return;
    if(ev.target === btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    mark(row);
    btn.click();
    var name=text(row.querySelector('b')) || 'Producto';
    toast('✓ '+name+' agregado a la cotización.');
  },true);
})();
