/* Mejora visual aislada: conserva eventos y cálculo originales del catálogo. */
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const detail=byId('detailContent'),cart=byId('cartLines');
  if(!detail||!cart)return;
  function enhanceDetail(){
    const price=detail.querySelector('.detail-price-block');
    if(!price||price.querySelector('.gc-detail-payment-options'))return;
    const free=price.querySelector('.gc-detail-shipping');
    if(free){
      free.classList.add('gc-shipping-refreshed');
      const title=free.querySelector('strong');
      if(title)title.textContent='Envío gratis incluido';
      const value=free.querySelector('span');
      if(value)value.textContent='Envío nacional · L 0';
    }else{
      const row=document.createElement('div');
      row.className='gc-shipping-refreshed gc-shipping-standard';
      row.setAttribute('role','note');
      row.innerHTML='<span class="gc-shipping-icon" aria-hidden="true">↗</span><span class="gc-shipping-info"><strong>Envío a toda Honduras</strong><small>El costo final se calcula según la entrega al cotizar.</small></span>';
      price.appendChild(row);
    }
    const original=detail.querySelector('.detail-payment-note');
    const codEnabled=(original?.querySelector('strong')?.textContent||'').trim()==='Pago al recibir';
    const condition=original?.querySelector('span:not(.detail-payment-symbol)')?.textContent?.trim()||'';
    const options=document.createElement('section');
    options.className='gc-detail-payment-options';
    options.setAttribute('aria-label','Formas de pago');
    options.innerHTML='<div class="gc-pay-options-heading"><strong>Formas de pago</strong><small>Seleccioná una en tu carrito</small></div>'+
      '<div class="gc-pay-options-grid">'+
      '<div class="gc-pay-tile"><span class="gc-pay-icon" aria-hidden="true">▤</span><strong>Depósito</strong><small>Transferencia</small></div>'+
      '<div class="gc-pay-tile"><span class="gc-pay-icon" aria-hidden="true">◉</span><strong>Tigo Money</strong><small>Con comisión</small></div>'+
      '<div class="gc-pay-tile'+(codEnabled?'':' is-unavailable')+'"><span class="gc-pay-icon" aria-hidden="true">'+(codEnabled?'✓':'×')+'</span><strong>Pagar al recibir</strong><small>'+(codEnabled?'Disponible con condiciones':'No disponible')+'</small></div>'+
      '</div><p class="gc-pay-options-help"></p>';
    options.querySelector('.gc-pay-options-help').textContent=codEnabled
      ?(condition||'Sujeto a las condiciones del carrito.')+' Comisiones y totales en tu cotización.'
      :'Este producto requiere pago anticipado. Comisiones y totales en tu cotización.';
    price.appendChild(options);
    original?.remove();
    const quote=detail.querySelector('#detailQuote');
    if(quote){
      quote.setAttribute('aria-label','Ver y compartir cotización');
      quote.innerHTML='<span class="gc-action-glyph" aria-hidden="true">▧</span><span>Cotización</span>';
    }
  }
  function enhanceCart(){
    cart.querySelectorAll('.cart-line').forEach(row=>{
      if(row.querySelector('.gc-quantity-group'))return;
      const actions=row.querySelector('.actions');
      const minus=actions?.querySelector('button[data-step="-1"]');
      const plus=actions?.querySelector('button[data-step="1"]');
      const number=actions?.querySelector('b');
      const remove=actions?.querySelector('button[data-remove]');
      if(!minus||!plus||!number||!remove)return;
      const control=document.createElement('span');
      control.className='gc-quantity-group';
      control.setAttribute('role','group');
      control.setAttribute('aria-label','Cambiar cantidad');
      actions.insertBefore(control,minus);
      control.append(minus,number,plus);
      row.classList.add('gc-cart-line-refreshed');
      const copy=row.querySelector('div:not(.actions)');
      if(copy)copy.classList.add('gc-cart-line-description');
      const subtotal=copy?.querySelector('strong:last-child');
      if(subtotal)subtotal.classList.add('gc-cart-line-subtotal');
    });
    const empty=cart.querySelector('.empty');
    if(empty&&!empty.classList.contains('gc-cart-empty')){
      empty.classList.add('gc-cart-empty');
      empty.innerHTML='<span class="gc-empty-symbol" aria-hidden="true">▤</span><strong>Tu carrito está vacío</strong><p>Agregá tus artículos favoritos para preparar tu pedido.</p><button type="button" class="gc-empty-browse">Ver productos</button>';
      empty.querySelector('button')?.addEventListener('click',()=>byId('cartOverlay')?.querySelector('[data-close]')?.click());
    }
  }
  new MutationObserver(enhanceDetail).observe(detail,{childList:true,subtree:true});
  new MutationObserver(enhanceCart).observe(cart,{childList:true,subtree:true});
  enhanceDetail();enhanceCart();
})();