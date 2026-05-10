/* SD COMAYAGUA · HOTFIX UX para cotización, ventas y facturas */
(function(){
  'use strict';

  function $(sel, root){return (root||document).querySelector(sel);}
  function $$(sel, root){return Array.from((root||document).querySelectorAll(sel));}
  function txt(el){return (el && el.textContent || '').replace(/\s+/g,' ').trim();}
  function toast(msg){var t=$('#toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){t.classList.remove('show');},2600);}
  function isLocalDepartment(dep){return /^(Comayagua|La Paz)$/i.test(String(dep||'').trim());}
  function dispatchInput(el){
    if(!el) return;
    try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  }
  function setSelectValue(sel,value){
    if(!sel || !value) return false;
    var opt=Array.from(sel.options||[]).find(function(o){return o.value===value || o.textContent.trim()===value;});
    if(!opt) return false;
    if(sel.value!==opt.value){sel.value=opt.value; dispatchInput(sel); return true;}
    return false;
  }

  function addBodyClass(){ if(document.body) document.body.classList.add('sdc-ventas-hotfix'); }

  function insertSteps(){
    var body=$('.quote-body');
    if(!body || $('.sdc-modal-steps',body)) return;
    var anchor=$('.sdc-smart-docbar',body) || $('.quote-status',body);
    var steps=document.createElement('div');
    steps.className='sdc-modal-steps no-print';
    steps.innerHTML='<button type="button" data-sdc-jump="picker">Productos</button><button type="button" data-sdc-jump="current">Lista</button><button type="button" data-sdc-jump="data">Cliente/envío</button><button type="button" data-sdc-jump="preview">Factura</button>';
    if(anchor && anchor.parentNode) anchor.insertAdjacentElement('afterend',steps);
    else body.insertAdjacentElement('afterbegin',steps);
  }

  function sectionForJump(kind){
    if(kind==='picker') return $('.quote-body .picker-card');
    if(kind==='current') return $('.quote-body .current-card');
    if(kind==='data') return $('.quote-body .calc-card');
    if(kind==='preview') return $('.quote-body .preview-card');
    return null;
  }

  function scrollInsideModal(target){
    if(!target) return;
    try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){target.scrollIntoView();}
  }

  function deliveryHintText(){
    var dep=$('[data-k="department"]');
    var type=$('[data-k="shippingType"]');
    var company=$('[data-k="company"]');
    var local=isLocalDepartment(dep && dep.value);
    var cod=type && type.value==='COD';
    if(local){
      return 'Entrega local sugerida: Domicilio. ' + (cod?'Pagar al recibir usa envío Lps.100 + comisión.':'Envío normal usa Lps.110 si aplica según la entrega.');
    }
    return 'Entrega nacional sugerida: Forza, C807 o Cargo Expreso. ' + (company?'Empresa actual: '+company.value+'.':'Seleccione empresa de envío.');
  }

  function updateDeliveryHint(){
    var calc=$('.quote-body .calc-card');
    if(!calc) return;
    var hint=$('.sdc-delivery-hint',calc);
    if(!hint){
      hint=document.createElement('div');
      hint.className='sdc-delivery-hint no-print';
      calc.appendChild(hint);
    }
    hint.textContent=deliveryHintText();
  }

  function applyDeliverySuggestion(){
    var dep=$('[data-k="department"]');
    var company=$('[data-k="company"]');
    if(!dep || !company) return;
    var local=isLocalDepartment(dep.value);
    if(local){
      setSelectValue(company,'Domicilio');
    }else if(String(company.value||'').trim()==='Domicilio'){
      setSelectValue(company,'Forza');
    }
    updateDeliveryHint();
  }

  function markCurrentStep(){
    var body=$('.quote-body');
    var steps=$$('.sdc-modal-steps button',body);
    if(!body || !steps.length) return;
    var sections=[['picker',$('.picker-card',body)],['current',$('.current-card',body)],['data',$('.calc-card',body)],['preview',$('.preview-card',body)]].filter(function(x){return x[1];});
    var top=body.getBoundingClientRect().top;
    var best='picker', dist=99999;
    sections.forEach(function(pair){
      var d=Math.abs(pair[1].getBoundingClientRect().top - top - 60);
      if(d<dist){dist=d; best=pair[0];}
    });
    steps.forEach(function(btn){btn.classList.toggle('active',btn.dataset.sdcJump===best);});
  }

  function improveAccessibility(){
    $$('.quote-body input,.quote-body select,.quote-body textarea').forEach(function(el){
      if(!el.getAttribute('autocomplete')) el.setAttribute('autocomplete','off');
      if(el.matches('input[type="number"]')){el.setAttribute('inputmode','numeric'); el.setAttribute('pattern','[0-9]*');}
    });
    $$('.modal-actions.quote-actions .btn').forEach(function(btn){
      if(!btn.title) btn.title=txt(btn);
    });
  }

  function enhanceModal(){
    addBodyClass();
    if(!$('.quote-body')) return;
    insertSteps();
    applyDeliverySuggestion();
    improveAccessibility();
    markCurrentStep();
  }

  function printStyles(){
    return '@page{size:letter;margin:7mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#071625;font-family:Arial,Helvetica,sans-serif}.print-shell{width:100%;display:flex;justify-content:center;align-items:flex-start}.receipt-pro-v4{width:100%;max-width:7.45in;margin:0 auto;background:#f6fbff;color:#071625;border:1px solid #d8e7ef;border-radius:22px;overflow:hidden;box-shadow:none}.receipt-band-pro{background:linear-gradient(135deg,#03101d,#082742 60%,#0e5473);color:#eaffff;padding:12px 18px;display:flex;justify-content:space-between;gap:10px}.receipt-inner-pro{padding:14px;background:#f6fbff}.receipt-header-pro{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:15px;border-radius:20px;background:#061829;color:#fff}.receipt-brand-pro{display:flex;gap:12px;align-items:center;min-width:0}.doc-logo{width:60px;height:60px;border-radius:50%;object-fit:contain;background:#fff;padding:3px}.receipt-brand-pro small,.receipt-brand-pro h2,.receipt-brand-pro p,.receipt-brand-pro em{color:#fff;margin:0}.receipt-brand-pro h2{font-size:22px;line-height:1}.receipt-total-pro{border-radius:18px;background:linear-gradient(135deg,#3cf2c2,#20dfff);color:#04111d;padding:13px;text-align:right;min-width:145px}.receipt-total-pro span,.receipt-total-pro b{display:block;color:#04111d}.receipt-total-pro b{font-size:22px}.receipt-client-pro{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:11px 0}.receipt-client-pro article{background:#fff;border:1px solid #dbe9f1;border-radius:15px;padding:10px}.receipt-client-pro article.wide{grid-column:1/-1}.receipt-client-pro span,.receipt-process-pro span,.receipt-title-pro span{display:block;color:#5a7184;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:900}.receipt-client-pro b,.receipt-process-pro b,.receipt-title-pro b{color:#071625}.receipt-process-pro{display:grid;grid-template-columns:160px 1fr;gap:10px;border:1px solid #dbe9f1;border-radius:17px;background:#fff;padding:10px;margin-bottom:11px}.receipt-process-pro p{margin:0;color:#4d6375;font-size:12px;line-height:1.3}.receipt-products-pro{border:1px solid #dbe9f1;border-radius:17px;background:#fff;overflow:hidden;margin-bottom:11px}.receipt-title-pro{display:flex;justify-content:space-between;background:#071625;color:#fff;padding:11px 13px}.receipt-title-pro span,.receipt-title-pro b{color:#fff}.receipt-item-pro{display:grid;grid-template-columns:30px 48px 1fr auto;gap:9px;align-items:center;padding:9px 11px;border-top:1px solid #e5eef4}.receipt-item-index{width:30px;height:30px;border-radius:10px;background:#e8f7ff;color:#0a3857;display:grid;place-items:center;font-weight:900}.receipt-item-thumb{width:48px;height:48px;border-radius:13px;border:1px solid #dce9f1;object-fit:contain;background:#fff;padding:3px}.receipt-item-info b{display:block;color:#071625;font-size:12.5px;line-height:1.15}.receipt-item-info span{display:block;color:#5b7183;font-size:11px;line-height:1.25}.receipt-item-pro strong{color:#071625;font-size:12.5px;white-space:nowrap}.receipt-summary-pro{border:1px solid #dbe9f1;border-radius:17px;background:#fff;overflow:hidden;margin-bottom:11px}.receipt-summary-pro>div{display:flex;justify-content:space-between;gap:12px;padding:10px 13px;border-bottom:1px solid #e5eef4}.receipt-summary-pro .grand{background:linear-gradient(135deg,#3cf2c2,#20dfff);color:#04111d;border-bottom:0}.receipt-summary-pro .grand span,.receipt-summary-pro .grand b{color:#04111d;font-size:17px}.receipt-footer-pro{text-align:center;color:#446073;font-size:11.5px;line-height:1.3}.receipt-footer-pro b{display:block;color:#071625;margin-bottom:4px}img{max-width:100%;height:auto}.no-print,.modal-actions,.modal-head{display:none!important}@media print{.receipt-pro-v4{break-inside:avoid;page-break-inside:avoid}}';
  }

  function smartPrint(){
    var node=$('#printableDoc');
    if(!node){toast('No hay factura o cotización lista para imprimir.'); return;}
    var popup=window.open('','_blank');
    if(!popup){window.print(); return;}
    var base=location.href.replace(/[^\/]*$/,'');
    var title=(txt($('.receipt-band-pro span',node)) || 'Documento SD Comayagua');
    popup.document.open();
    popup.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+base+'"><title>'+title+'</title><style>'+printStyles()+'</style></head><body><div class="print-shell">'+node.outerHTML+'</div><script>setTimeout(function(){window.focus();window.print();},450);<\/script></body></html>');
    popup.document.close();
  }

  document.addEventListener('click',function(ev){
    var print=ev.target.closest && ev.target.closest('#printDoc');
    if(print){ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); smartPrint(); return;}
    var jump=ev.target.closest && ev.target.closest('[data-sdc-jump]');
    if(jump){ev.preventDefault(); scrollInsideModal(sectionForJump(jump.dataset.sdcJump)); markCurrentStep(); return;}
  },true);

  document.addEventListener('change',function(ev){
    if(ev.target && ev.target.matches('.quote-body [data-k="department"],.quote-body [data-k="municipality"],.quote-body [data-k="shippingType"],.quote-body [data-k="company"]')){
      setTimeout(applyDeliverySuggestion,90);
    }
  },true);

  document.addEventListener('input',function(ev){
    if(ev.target && ev.target.matches('.quote-body input,.quote-body select,.quote-body textarea')){
      setTimeout(function(){updateDeliveryHint(); markCurrentStep();},90);
    }
  },true);

  document.addEventListener('scroll',function(ev){
    if(ev.target && ev.target.classList && ev.target.classList.contains('quote-body')) markCurrentStep();
  },true);

  var obs=new MutationObserver(function(){clearTimeout(obs._t); obs._t=setTimeout(enhanceModal,80);});
  function start(){addBodyClass(); enhanceModal(); if(document.body) obs.observe(document.body,{childList:true,subtree:true}); setTimeout(enhanceModal,500);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
