window.Shipping = (function(){

  // Cálculo simple de envío:
  // - Si el total es 0 → envío 0
  // - Si el total es mayor o igual a 1500 → envío gratis
  // - Si el total es menor a 1500 → envío L.120

  function calculate(total){
    if(total === 0) return 0;
    if(total >= 1500) return 0;
    return 120;
  }

  return { calculate };

})();
