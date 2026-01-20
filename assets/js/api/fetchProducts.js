window.API = window.API || {};

window.API.fetchProducts = async function () {
  try {
    const res = await fetch("https://opensheet.elk.sh/1aEH4P7T8vLLk0I9pU8AicyeQ8lnBnHp18AhU74X484U/catalogo");
    if (!res.ok) {
      console.error("Error al cargar el catálogo desde Google Sheets:", res.status);
      return [];
    }

    const data = await res.json();

    // Convertir campos numéricos y booleanos
    return data.map(p => ({
      ...p,
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      offer: String(p.offer || "").toUpperCase() === "TRUE",
      images: p.images?.split("|") || []
    }));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};
