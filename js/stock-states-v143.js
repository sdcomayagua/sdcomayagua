// SD COMAYAGUA POS - estados visuales automáticos de stock v1.4.3
(function(){
  function applyStockStates(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const status=card.querySelector('.product-status');
      if(!status) return;
      const isEmpty=status.classList.contains('err') || /agotado/i.test(status.textContent||'');
      const isLow=status.classList.contains('warn') || /bajo|pocas/i.test(status.textContent||'');
      const isOk=status.classList.contains('ok') || /disponible/i.test(status.textContent||'');

      card.classList.toggle('sdc-stock-empty', isEmpty);
      card.classList.toggle('sdc-stock-low', !isEmpty && isLow);
      card.classList.toggle('sdc-stock-good', !isEmpty && !isLow && isOk);

      const shipBtn=card.querySelector('[data-shipping-quote]');
      if(shipBtn){
        if(isEmpty){
          shipBtn.disabled=true;
          shipBtn.setAttribute('aria-disabled','true');
          shipBtn.title='Producto agotado';
        }else{
          shipBtn.disabled=false;
          shipBtn.removeAttribute('aria-disabled');
          shipBtn.removeAttribute('title');
        }
      }

      const addBtn=card.querySelector('[data-cart-add]');
      if(addBtn && isEmpty){
        addBtn.disabled=true;
        addBtn.setAttribute('aria-disabled','true');
        addBtn.title='Producto agotado';
      }
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;applyStockStates();});
  }

  document.addEventListener('DOMContentLoaded', applyStockStates);
  window.addEventListener('load', applyStockStates);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
