(async function(){
  let products = [];
  let currentFilter = null;
  let selectedProduct = null;

  const grid = document.getElementById("productsGrid");
  const cartItemsDiv = document.getElementById("cartItems");
  const cartCountSpan = document.getElementById("cartCount");
  const cartTotalDiv = document.getElementById("cartTotal");
  const searchInput = document.getElementById("searchInput");

  const deptSelect = document.getElementById("departamentoSelect");
  const munSelect = document.getElementById("municipioSelect");
  const courierSelect = document.getElementById("courierSelect");
  const direccionInput = document.getElementById("direccionInput");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalMainImg = document.getElementById("modalMainImg");
  const modalThumbs = document.getElementById("modalThumbs");
  const modalDesc = document.getElementById("modalDesc");
  const modalAdd = document.getElementById("modalAdd");
  const modalConsult = document.getElementById("modalConsult");

  const confirmBackdrop = document.getElementById("confirmBackdrop");

  function filteredProducts(){
    const term = (searchInput.value || "").toLowerCase().trim();
    return products.filter(p=>{
      if(currentFilter === "ofertas" && !p.offer) return false;
      if(currentFilter === "pocos" && !(p.stock>0 && p.stock<=3)) return false;
      if(term){
        const text = (p.name + " " + p.short).toLowerCase();
        if(!text.includes(term)) return false;
      }
      return true;
    });
  }

  function renderProducts(){
    grid.innerHTML = "";
    const list = filteredProducts();
    if(!list.length){
      grid.innerHTML = "<p>No se encontraron productos.</p>";
      return;
    }
    list.forEach(p=>{
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        ${p.stock===0?'<div class="overlay-agotado"><span>AGOTADO</span></div>':''}
        <img src="${p.images[0]}" data-view="${p.id}" alt="${p.name}" />
        <h4>${p.name}</h4>
        <p>${p.short}</p>
        <div class="row">
          <div style="font-weight:700">${Utils.formatL(p.price)}</div>
          <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
            ${p.offer?'<div class="badge">Oferta</div>':''}
            ${p.stock>0
              ? `<button class="btn" data-add="${p.id}">Añadir</button>`
              : `<button class="btn ghost" data-consult="${p.id}">Consultar</button>`
            }
            <button class="btn ghost" data-view="${p.id}">Ver detalles</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function renderCart(){
    const items = Cart.getItems();
    cartItemsDiv.innerHTML = "";
    for(const id in items){
      const it = items[id];
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${it.image}" alt="${it.name}" />
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>${it.name}</strong>
              <div style="font-size:12px;color:#777">${Utils.formatL(it.price)}</div>
            </div>
            <div class="qty">
              <button data-dec="${id}">-</button>
              <div>${it.qty}</div>
              <button data-inc="${id}">+</button>
            </div>
          </div>
        </div>
      `;
      cartItemsDiv.appendChild(row);
    }
    cartCountSpan.textContent = Cart.getCount();
    const totals = Cart.totals(()=>Shipping.calcShipping());
    cartTotalDiv.textContent = `Total: ${Utils.formatL(totals.total)}`;
  }

  function openModal(product){
    selectedProduct = product;
    modalTitle.textContent = product.name;
    modalMainImg.src = product.images[0];
    modalDesc.textContent = product.short;
    modalThumbs.innerHTML = "";
    product.images.forEach((src,i)=>{
      const img = document.createElement("img");
      img.src = src;
      if(i===0) img.classList.add("active");
      img.addEventListener("click", ()=>{
        modalMainImg.src = src;
        modalThumbs.querySelectorAll("img").forEach(x=>x.classList.remove("active"));
        img.classList.add("active");
      });
      modalThumbs.appendChild(img);
    });
    modalAdd.style.display = product.stock>0 ? "inline-block" : "none";
    modalConsult.style.display = product.stock>0 ? "none" : "inline-block";
    modalBackdrop.style.display = "flex";
  }

  function closeModal(){
    modalBackdrop.style.display = "none";
    selectedProduct = null;
  }

  function openConfirm(){ confirmBackdrop.style.display = "flex"; }
  function closeConfirm(){ confirmBackdrop.style.display = "none"; }

  document.body.addEventListener("click", e=>{
    const t = e.target;

    if(t.matches("[data-view]")){
      const id = t.getAttribute("data-view");
      const p = products.find(x=>x.id===id);
      if(p) openModal(p);
    }

    if(t.matches("[data-add]")){
      const id = t.getAttribute("data-add");
      const p = products.find(x=>x.id===id);
      if(p){
        Cart.add(p,1);
        renderCart();
        openConfirm();
      }
    }

    if(t.matches("[data-consult]")){
      const id = t.getAttribute("data-consult");
      const p = products.find(x=>x.id===id);
      if(p) alert("Consulta de disponibilidad para: " + p.name);
    }

    if(t.id === "closeModal") closeModal();

    if(t.id === "modalAdd" && selectedProduct){
      Cart.add(selectedProduct,1);
      renderCart();
      closeModal();
      openConfirm();
    }

    if(t.id === "modalConsult" && selectedProduct){
      alert("Consulta de disponibilidad para: " + selectedProduct.name);
    }

    if(t.id === "cartToggle"){
      document.getElementById("cartPanel").scrollIntoView({behavior:"smooth"});
    }

    if(t.id === "goToCart"){
      closeConfirm();
      document.getElementById("cartPanel").scrollIntoView({behavior:"smooth"});
    }

    if(t.id === "continueShopping"){
      closeConfirm();
    }

    if(t.matches("[data-inc]")){
      Cart.changeQty(t.getAttribute("data-inc"),1);
      renderCart();
    }

    if(t.matches("[data-dec]")){
      Cart.changeQty(t.getAttribute("data-dec"),-1);
      renderCart();
    }

    if(t.id === "clearCart"){
      if(confirm("¿Vaciar carrito?")){
        Cart.clear();
        renderCart();
      }
    }

    if(t.id === "whatsappBtn"){
      WhatsApp.openWhatsApp();
    }

    if(t.id === "filterOfertas"){
      currentFilter = "ofertas";
      renderProducts();
    }

    if(t.id === "filterPocos"){
      currentFilter = "pocos";
      renderProducts();
    }

    if(t.id === "clearFilters"){
      currentFilter = null;
      searchInput.value = "";
      renderProducts();
    }
  });

  modalBackdrop.addEventListener("click", e=>{
    if(e.target === modalBackdrop) closeModal();
  });

  confirmBackdrop.addEventListener("click", e=>{
    if(e.target === confirmBackdrop) closeConfirm();
  });

  searchInput.addEventListener("input", ()=>{
    renderProducts();
  });

  deptSelect.addEventListener("change", e=>{
    Shipping.setDept(e.target.value);
    Shipping.populateMunicipios(munSelect, e.target.value);
    renderCart();
  });

  munSelect.addEventListener("change", e=>{
    Shipping.setMun(e.target.value);
    renderCart();
  });

  courierSelect.addEventListener("change", e=>{
    Shipping.setCourier(e.target.value);
    renderCart();
  });

  direccionInput.addEventListener("input", e=>{
    Shipping.setDireccion(e.target.value);
  });

  Shipping.populateDepartamentos(deptSelect);
  Shipping.populateCouriers(courierSelect);

  try{
    products = await API.fetchProducts();
    renderProducts();
    renderCart();
  }catch(e){
    console.error(e);
    grid.innerHTML = "<p>Error cargando productos.</p>";
  }
})();
