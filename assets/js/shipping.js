window.Shipping = (function(){
  function calculate(total){
    if(total===0) return 0;
    if(total>=1500) return 0;
    return 120;
  }
  return {calculate};
})();
