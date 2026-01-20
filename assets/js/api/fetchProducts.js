window.API = {
  async fetchProducts(){
    const res = await fetch("_data/products.json");
    if(!res.ok) throw new Error("No se pudo cargar products.json");
    return await res.json();
  }
};
