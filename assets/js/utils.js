window.Utils = {
  formatL(value){
    return "L. " + Number(value).toFixed(2);
  },
  saveCart(cart){
    localStorage.setItem("cart_v1", JSON.stringify(cart));
  },
  loadCart(){
    try{
      return JSON.parse(localStorage.getItem("cart_v1") || "{}");
    }catch(e){
      return {};
    }
  }
};
