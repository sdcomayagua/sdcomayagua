// ===========================
// MODAL DE DETALLES COMPLETO
// ===========================

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

// ABRIR MODAL
function openProductModal(product) {
  currentProduct = product;

  modalMainImg.src = (product.images && product.images[0]) || "";
  modalTitle.textContent = product.name || "";
  modalPrice.textContent = "L " + (product.price || 0);

  // Miniaturas
  modalThumbs.innerHTML = "";
  if (product.images && product.images.length) {
    product.images.slice(0, 5).forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.onclick = () => (modalMainImg.src = img);
      modalThumbs.appendChild(thumb);
    });
  }

  // Videos opcionales
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

// CERRAR MODAL
modalClose.onclick = () => modal.classList.remove("active");
modalBack.onclick = () => modal.classList.remove("active");

modalAddCart.onclick = () => {
  if (currentProduct) addToCart(currentProduct);
  modal.classList.remove("active");
};

// Cerrar tocando afuera
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.remove("active");
};

// ===========================
// RENDER DE PRODUCTOS
// ===========================
function renderProductCard(product) {
  const safeProduct = encodeURIComponent(JSON.stringify(product));

  return `
    <div class="product-card">

      <img src="${(product.images && product.images[0]) || ''}" 
           onclick='openProductModal(JSON.parse(decodeURIComponent("${safeProduct}")))' />

      <div class="product-name">${product.name || ""}</div>
      <div class="product-price">L ${product.price || 0}</div>

      <div class="product-buttons">
        <button class="btn btn-details" onclick='openProductModal(JSON.parse(decodeURIComponent("${safeProduct}")))'>
          Detalles
        </button>
        <button class="btn btn-add" onclick='addToCart(JSON.parse(decodeURIComponent("${safeProduct}")))'>
          Agregar
        </button>
      </div>

    </div>
  `;
}