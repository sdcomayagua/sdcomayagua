// ===== MODAL =====
const modal = document.getElementById("productModal");
const modalClose = document.getElementById("modalClose");
const modalMainImg = document.getElementById("modalMainImg");
const modalThumbs = document.getElementById("modalThumbs");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalVideos = document.getElementById("modalVideos");
const modalAddCart = document.getElementById("modalAddCart");
const modalBack = document.getElementById("modalBack");

let currentProduct = null;

function openProductModal(product) {
  currentProduct = product;

  modalMainImg.src = (product.images && product.images[0]) || "";
  modalTitle.textContent = product.name || "";
  modalPrice.textContent = formatPrice(product.price);

  modalThumbs.innerHTML = "";
  if (product.images && product.images.length) {
    product.images.slice(0, 5).forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.onclick = () => (modalMainImg.src = img);
      modalThumbs.appendChild(thumb);
    });
  }

  modalVideos.innerHTML = "";
  if (product.videos && product.videos.length) {
    product.videos.forEach(v => {
      const link = document.createElement("a");
      link.href = v;
      link.target = "_blank";
      link.textContent = "Ver video";
      link.style.display = "block";
      link.style.marginTop = "6px";
      modalVideos.appendChild(link);
    });
  }

  modal.classList.add("active");
}

modalClose.onclick = () => modal.classList.remove("active");
modalBack.onclick = () => modal.classList.remove("active");
modalAddCart.onclick = () => {
  if (currentProduct) addToCart(currentProduct);
  modal.classList.remove("active");
};
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.remove("active");
};

// ===== PRODUCTOS DEMO (luego los conectas a Sheets) =====
const productsData = [
  {
    id: 1,
    name: "Audífonos Gamer RGB",
    price: 499,
    images: [
      "https://via.placeholder.com/400x300?text=Audifono+1",
      "https://via.placeholder.com/400x300?text=Audifono+2",
    ],
    videos: [],
    category: "Audio",
    subcategory: "Gamer",
    subsubcategory: "",
    variant: "RGB",
    offer: true,
    stock: 5,
  },
  {
    id: 2,
    name: "Mouse Gamer",
    price: 350,
    images: [
      "https://via.placeholder.com/400x300?text=Mouse+1",
    ],
    videos: [],
    category: "Periféricos",
    subcategory: "Gamer",
    subsubcategory: "",
    variant: "Inalámbrico",
    offer: false,
    stock: 2,
  },
];

// ===== RENDER =====
function renderProductCard(product) {
  const safeProduct = encodeURIComponent(JSON.stringify(product));
  return `
    <div class="product-card">
      <img src="${(product.images && product.images[0]) || ''}"
           onclick='openProductModal(JSON.parse(decodeURIComponent("${safeProduct}")))' />
      <div class="product-name">${product.name || ""}</div>
      <div class="product-price">${formatPrice(product.price)}</div>
      <div class="product-buttons">
        <button class="btn btn-details"
          onclick='openProductModal(JSON.parse(decodeURIComponent("${safeProduct}")))'>
          Detalles
        </button>
        <button class="btn btn-add"
          onclick='addToCart(JSON.parse(decodeURIComponent("${safeProduct}")))'>
          Agregar
        </button>
      </div>
    </div>
  `;
}

function renderProducts(list) {
  const container = document.getElementById("products");
  container.innerHTML = list.map(renderProductCard).join("");
}

// ===== FILTROS BÁSICOS =====
function initFilters(products) {
  const catSel = document.getElementById("filterCategory");
  const subSel = document.getElementById("filterSubcategory");
  const subSubSel = document.getElementById("filterSubsubcategory");
  const varSel = document.getElementById("filterVariant");

  const categories = ["Todas", ...new Set(products.map(p => p.category).filter(Boolean))];
  const subcategories = ["Todas", ...new Set(products.map(p => p.subcategory).filter(Boolean))];
  const subsubcategories = ["Todas", ...new Set(products.map(p => p.subsubcategory).filter(Boolean))];
  const variants = ["Todas", ...new Set(products.map(p => p.variant).filter(Boolean))];

  catSel.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
  subSel.innerHTML = subcategories.map(c => `<option value="${c}">${c}</option>`).join("");
  subSubSel.innerHTML = subsubcategories.map(c => `<option value="${c}">${c}</option>`).join("");
  varSel.innerHTML = variants.map(c => `<option value="${c}">${c}</option>`).join("");

  function applyFilters() {
    const cat = catSel.value;
    const sub = subSel.value;
    const subsub = subSubSel.value;
    const vari = varSel.value;
    const search = document.getElementById("searchInput").value.toLowerCase();

    let filtered = [...products];

    if (cat !== "Todas") filtered = filtered.filter(p => p.category === cat);
    if (sub !== "Todas") filtered = filtered.filter(p => p.subcategory === sub);
    if (subsub !== "Todas") filtered = filtered.filter(p => p.subsubcategory === subsub);
    if (vari !== "Todas") filtered = filtered.filter(p => p.variant === vari);

    if (search) {
      filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(search) ||
        (p.category || "").toLowerCase().includes(search) ||
        (p.subcategory || "").toLowerCase().includes(search) ||
        (p.variant || "").toLowerCase().includes(search)
      );
    }

    renderProducts(filtered);
  }

  catSel.onchange = applyFilters;
  subSel.onchange = applyFilters;
  subSubSel.onchange = applyFilters;
  varSel.onchange = applyFilters;
  document.getElementById("searchInput").oninput = applyFilters;

  window.applyOfferFilter = function () {
    renderProducts(products.filter(p => p.offer));
  };

  window.applyLowStockFilter = function () {
    renderProducts(products.filter(p => p.stock > 0 && p.stock <= 3));
  };

  window.clearFilters = function () {
    catSel.value = "Todas";
    subSel.value = "Todas";
    subSubSel.value = "Todas";
    varSel.value = "Todas";
    document.getElementById("searchInput").value = "";
    renderProducts(products);
  };

  renderProducts(products);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  initFilters(productsData);
  renderCart();
});
