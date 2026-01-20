const subcategoriesByCategory = {
  "Artículos Gamer":[
    "Artículos Gamer para Celular",
    "Artículos Gamer para Laptop"
  ],
  "Tecnología":[
    "Cables",
    "Audio",
    "Cargadores",
    "Smart Devices"
  ],
  "Accesorios":[
    "Accesorios para Celular",
    "Accesorios para Laptop",
    "Accesorios Universales"
  ]
};

const subsubBySubcategory = {
  "Artículos Gamer para Celular":["Dedales","Gamepads","Triggers","Coolers","Accesorios Gamer"],
  "Artículos Gamer para Laptop":["Mouse Gamer","Teclados Mecánicos","Audífonos Gamer","Alfombrillas XL","Coolers para Laptop"],

  "Cables":["Cables para Celular","Cables para Laptop"],
  "Audio":["Bocinas","Audífonos In-Ear","Audífonos Over-Ear","Micrófonos"],
  "Cargadores":["Cargadores Rápidos","Cargadores de Pared","Power Banks"],
  "Smart Devices":["Lámparas LED","Smartwatch","Smart Plugs"],

  "Accesorios para Celular":["Soportes","Anillos 360°","Protectores","Limpiadores"],
  "Accesorios para Laptop":["Hubs USB","Bases","Adaptadores"],
  "Accesorios Universales":["Lámparas LED","Organizadores","Kits de limpieza"]
};

function populateSelect(select, values, placeholder){
  select.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = placeholder || "Elige...";
  select.appendChild(opt);

  (values || []).forEach(v=>{
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

function generateId(category, subcategory, subsubcategory){
  const prefix =
    (category?.[0] || "x") +
    (subcategory?.[0] || "x") +
    (subsubcategory?.[0] || "x");

  const rand = Math.floor(Math.random()*900 + 100);
  return (prefix + rand).toLowerCase();
}

window.addEventListener("DOMContentLoaded", ()=>{

  const categorySelect = document.getElementById("categorySelect");
  const subcategorySelect = document.getElementById("subcategorySelect");
  const subsubcategorySelect = document.getElementById("subsubcategorySelect");

  const nameInput = document.getElementById("nameInput");
  const priceInput = document.getElementById("priceInput");
  const stockInput = document.getElementById("stockInput");
  const variantInput = document.getElementById("variantInput");
  const imagesInput = document.getElementById("imagesInput");
  const shortInput = document.getElementById("shortInput");
  const longInput = document.getElementById("longInput");
  const offerInput = document.getElementById("offerInput");

  const previewCard = document.getElementById("previewCard");
  const previewMeta = document.getElementById("previewMeta");
  const previewShort = document.getElementById("previewShort");
  const previewLong = document.getElementById("previewLong");

  const csvOutput = document.getElementById("csvOutput");
  const generateBtn = document.getElementById("generateBtn");

  categorySelect.addEventListener("change", e=>{
    const cat = e.target.value;
    populateSelect(subcategorySelect, subcategoriesByCategory[cat] || [], "Elige subcategoría...");
    populateSelect(subsubcategorySelect, [], "Elige sub-subcategoría...");
    updatePreview();
  });

  subcategorySelect.addEventListener("change", e=>{
    const sub = e.target.value;
    populateSelect(subsubcategorySelect, subsubBySubcategory[sub] || [], "Elige sub-subcategoría...");
    updatePreview();
  });

  function updatePreview(){
    const name = nameInput.value || "Nombre del producto";
    const price = priceInput.value || "0";
    const stock = stockInput.value || "0";

    const cat = categorySelect.value || "Sin categoría";
    const sub = subcategorySelect.value || "Sin subcategoría";
    const subsub = subsubcategorySelect.value || "Sin sub-subcategoría";
    const variant = variantInput.value || "Sin variante";

    const short = shortInput.value || "";
    const long = longInput.value || "";

    previewCard.querySelector(".preview-title").textContent = name;
    previewMeta.textContent = `${cat} › ${sub} › ${subsub} (${variant}) – L. ${price} – Stock: ${stock}`;
    previewShort.textContent = short;
    previewLong.textContent = long;
  }

  [
    nameInput, priceInput, stockInput, variantInput,
    shortInput, longInput, categorySelect, subcategorySelect, subsubcategorySelect
  ].forEach(el=>{
    el.addEventListener("input", updatePreview);
    el.addEventListener("change", updatePreview);
  });

  generateBtn.addEventListener("click", ()=>{

    const category = categorySelect.value.trim();
    const subcategory = subcategorySelect.value.trim();
    const subsubcategory = subsubcategorySelect.value.trim();

    const variant = variantInput.value.trim();
    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    const stock = stockInput.value.trim();
    const images = imagesInput.value.trim();
    const short = shortInput.value.trim();
    const longDesc = longInput.value.trim();
    const offer = offerInput.checked ? "TRUE" : "FALSE";

    if(!name || !price || !stock || !category || !subcategory || !subsubcategory){
      alert("Completa al menos: nombre, precio, stock, categoría, subcategoría y sub-subcategoría.");
      return;
    }

    const id = generateId(category, subcategory, subsubcategory);

    const csvLine = [
      id,
      category,
      subcategory,
      subsubcategory,
      variant,
      name,
      price,
      stock,
      `"${images}"`,
      `"${short}"`,
      `"${longDesc}"`,
      offer
    ].join(",");

    csvOutput.value = csvLine;
    updatePreview();
  });

  updatePreview();
});
