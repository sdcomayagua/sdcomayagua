window.API = window.API || {};

window.API.fetchProducts = async function(){
  const res = await fetch("_data/products.json");
  const data = await res.json();
  return data;
};
