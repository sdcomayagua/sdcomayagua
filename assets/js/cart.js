window.Cart = (function(){
  const state = { items: Utils.loadCart() };

  function getItems(){ return state.items; }
  function getCount(){ return Object.values(state.items).reduce((s,i)=>s+i.qty,0); }

  function add(product, qty=1){
    if(product.stock === 0) return;
    if(!state.items[product.id]){
      state.items[product.id] = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        qty: 0
      };
    }
    state.items[product.id].qty += qty;
    Utils.saveCart(state.items);
  }

  function changeQty(id, delta){
    if(!state.items[id]) return;
    state.items[id].qty += delta;
    if(state.items[id].qty <= 0) delete state.items[id];
    Utils.saveCart(state.items);
  }

  function clear(){
    state.items = {};
    Utils.saveCart(state.items);
  }

  function totals(shippingCalculator){
    let subtotal = 0;
    for(const id in state.items){
      const it = state.items[id];
      subtotal += it.price * it.qty;
    }
    const shipping = shippingCalculator ? shippingCalculator(subtotal) : 0;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  return { getItems, getCount, add, changeQty, clear, totals };
})();
