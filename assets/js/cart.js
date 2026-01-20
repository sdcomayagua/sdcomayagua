window.Cart = (function(){
  let items = [];

  function load(){
    try{
      const raw = localStorage.getItem("sd_cart");
      if(raw) items = JSON.parse(raw);
    }catch(e){
      items = [];
    }
  }

  function save(){
    localStorage.setItem("sd_cart", JSON.stringify(items));
  }

  function add(product){
    const existing = items.find(i=>i.id===product.id);
    if(existing){
      existing.qty += 1;
    }else{
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      });
    }
    save();
  }

  function remove(id){
    items = items.filter(i=>i.id!==id);
    save();
  }

  function clear(){
    items = [];
    save();
  }

  function getItems(){
    return items;
  }

  function getTotal(){
    return items.reduce((sum,i)=>sum + i.price*i.qty,0);
  }

  load();

  return {add,remove,clear,getItems,getTotal};
})();
