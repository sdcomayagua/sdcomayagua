/* Mejora visual aislada: conserva eventos y cálculo originales del catálogo. */
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const detail=byId('detailContent'),cart=byId('cartLines');
  if(!detail||!cart)return;
  // Recibimos la ficha pública exacta y la configuración ya sincronizada desde site.js.
  let pricingContext=null;
  detail.addEventListener('gc:detail-pricing',event=>{
    pricingContext=event.detail||null;
    enhanceDetail();
  });
  function enhanceDetail(){
    const price=detail.querySelector('.detail-price-block');
    if(!price||price.querySelector('.gc-detail-payment-options'))return;
    const {product:p,settings:settings} = pricingContext||{};
    const C=window.GC;
    const inStock=!!(p&&p.active&&p.stock>0);
    const line=inStock&&C&&typeof C.quote==='function'?[{product:p,qty:1}]:[];
    const quotes=Object.create(null);
    if(line.length){
      for(const method of ['transfer','tigo','cod']){
        quotes[method]=C.quote(line,method,settings||window.GC_CONFIG||{},{mode:'national'});
      }
    }
    const money=n=>C?.money(n)||'';
    const national=quotes.transfer?.shipping;
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
      row.innerHTML='<span class="gc-shipping-icon" aria-hidden="true">↗</span><span class="gc-shipping-info"><strong>Envío nacional</strong><small></small></span>';
      row.querySelector('small').textContent=Number.isFinite(national)
        ?money(national)+' por envío nacional, incluido en los totales.'
        :'Se calcula al elegir la entrega.';
      price.appendChild(row);
    }
    const original=detail.querySelector('.detail-payment-note');
    const codAllowed=!!(quotes.cod?.codAllowed);
    const codInProduct=!!(p?.codAllowed);
    const available=inStock&&Object.keys(quotes).length===3;
    const amount=mode=>available?'<b class="gc-pay-amount">'+money(quotes[mode].total)+'</b>':'<b class="gc-pay-amount">—</b>';
    const options=document.createElement('section');
    options.className='gc-detail-payment-options';
    options.setAttribute('aria-label','Total por forma de pago para una unidad');
    options.innerHTML='<div class="gc-pay-options-heading"><strong>Formas de pago</strong><small>Totales para 1 unidad</small></div>'+
      '<div class="gc-pay-options-grid">'+
      '<div class="gc-pay-tile" data-payment-total="transfer"><span class="gc-pay-icon" aria-hidden="true">▤</span><strong>Transferencia</strong>'+
        amount('transfer')+'<small>'+(available?'Sin comisión':'Sin existencias')+'</small></div>'+
      '<div class="gc-pay-tile" data-payment-total="tigo"><span class="gc-pay-icon" aria-hidden="true">◉</span><strong>Tigo Money</strong>'+
        amount('tigo')+'<small>'+(available?'Comisión '+Math.round(quotes.tigo.rate*100)+'% incluida':'Sin existencias')+'</small></div>'+
      '<div class="gc-pay-tile'+(!codAllowed?' is-unavailable':'')+'" data-payment-total="cod"><span class="gc-pay-icon" aria-hidden="true">'+(codAllowed?'✓':'×')+'</span><strong>Pagar al recibir</strong>'+
        amount('cod')+
        (codAllowed
          ?'<small>Anticipo: '+money(quotes.cod.deposit)+'</small><small>Al recibir: '+money(quotes.cod.balance)+'</small>'
          :'<small>'+(inStock?(codInProduct?'No disponible con 1 unidad':'No disponible'):'Sin existencias')+'</small><small>'+(inStock?'Precio solo de referencia':'')+'</small>')+
        '</div>'+
      '</div><p class="gc-pay-options-help"></p>';
    const note=options.querySelector('.gc-pay-options-help');
    if(!inStock)note.textContent='Artículo sin existencias. Consultá disponibilidad antes de comprar.';
    else{
      const shipping=quotes.transfer.shipping===0?'envío gratis':'envío nacional de '+money(quotes.transfer.shipping);
      note.textContent='Totales por 1 unidad con '+shipping+'. Incluyen la comisión correspondiente. Otro tipo de entrega o más artículos pueden cambiar el importe.';
      if(!codAllowed&&codInProduct){
        const min=money(settings?.codMinimum??window.GC_CONFIG?.codMinimum??350);
        note.textContent+=' Para pagar al recibir se requiere un mínimo de '+min+' en productos.';
      }
    }
    price.appendChild(options);
    original?.remove();
    const quote=detail.querySelector('#detailQuote');
    if(quote){
      quote.setAttribute('aria-label','Ver y compartir cotización');
      quote.innerHTML='<span class="gc-action-glyph" aria-hidden="true">▧</span><span>cotización</span>';
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