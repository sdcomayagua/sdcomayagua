window.API = window.API || {};

window.API.fetchProducts = async function () {
  try {
    const res = await fetch("_data/products.json");
    if (!res.ok) {
      console.error("Error al cargar products.json:", res.status);
      return [];
    }

    const data = await res.json();

    // Asegurar que siempre sea un array
    if (!Array.isArray(data)) {
      console.error("El archivo products.json no contiene un array válido.");
      return [];
    }

    return data;

  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};
