(function(){
  let products = [];

  const filters = {
    category:"",
    subcategory:"",
    subsubcategory:"",
    variant:"",
    offer:false,
    lowStock:false,
    search:""
  };

  const searchInput = document.getElementById("searchInput");
  const productsGrid = document.getElementById("productsGrid");
  const productsCount = document.getElementById("productsCount");

  const cartPanel = document.getElementById("cartPanel");
  const cartToggle = document.getElementById("cartToggle");
  const closeCart = document.getElementById("closeCart");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartCountEl = document.getElementById("cartCount");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const categorySelect = document.getElementById("filterCategory");
  const subcategorySelect = document.getElementById("filterSubcategory");
  const subsubcategorySelect = document.getElementById("filterSubsubcategory");
  const variantSelect = document.getElementById("filterVariant");

  const filterOfferBtn = document.getElementById("filterOffer");
  const filterLowStockBtn = document.getElementById("filterLowStock");
  const clearAllFiltersBtn = document.getElementById("clearAllFilters");

  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");
  const closeModalBtn = document.getElementById("closeModal");

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  function uniqueValues(field){
    return [...new Set(products.map(p=>p[field]).filter(Boolean))];
  }

  function populateFilterSelect(select, values){
    select.innerHTML = '<option value="">Todas</option>';
    values.forEach(v=>{
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  function filteredProducts(){
    return products.filter(p=>{
      if(filters.category && p.category !== filters.category) return false;
      if(filters.subcategory && p.subcategory !== filters.subcategory) return false;
      if(filters.subsubcategory && p.subsubcategory !== filters.subsubcategory) return false;
      if(filters.variant && p.variant !== filters.variant) return false;
      if(filters.offer && !p.offer) return false;
      if(filters.lowStock && !(p.stock>0 && p.stock<=3)) return false;

      if(filters.search){
        const text = (p.name + " " + (p.short||"") + " " + (p.long_description||"")).toLowerCase();
        if(!text.includes(filters.search)) return false;
      }

      return true;
    });
  }

  function renderProducts(){
    const list = filteredProducts();
    productsGrid.innerHTML = "";

    list.forEach(p=>{
      const card = document.createElement("article");
      card.className = "product-card";

      const img = document.createElement("img");
      img.className = "product-image";
      const firstImg = (p.images && p.images[0]) || (typeof p.images==="string" ? p.images.split("|")[0] : "");
      img.src = firstImg || "";
      img.alt = p.name;

      const name = document.createElement("div");
      name.className = "product-name";
      name.textContent = p.name;

      const meta = document.createElement("div");
      meta.className = "product-meta";
      meta.textContent = `${p.category} › ${p.subcategory || ""}`;

      const price = document.createElement("div");
      price.className = "product-price";
      price.textContent = `L. ${p.price}`;

      const actions = document.createElement("div");
      actions.className = "product-actions";

      const btnDetails = document.createElement("button");
      btnDetails.className = "btn-secondary";
      btnDetails.textContent = "Detalles";
      btnDetails.addEventListener("click",()=>openProductModal(p));

      const btnAdd = document.createElement("button");
      btnAdd.className = "btn-primary";
      btnAdd.textContent = "Agregar";
      btnAdd.addEventListener("click",()=>{
        Cart.add(p);
        renderCart();
      });

      actions.appendChild(btnDetails);
      actions.appendChild(btnAdd);

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(price);
      card.appendChild(actions);

      productsGrid.appendChild(card);
    });

    productsCount.textContent = `${list.length} producto(s)`;
  }

  function renderCart(){
    const items = Cart.getItems();
    cartItemsEl.innerHTML = "";

    items.forEach(i=>{
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <span>${i.name} x${i.qty}</span>
        <span>L. ${i.price * i.qty}</span>
      `;
      cartItemsEl.appendChild(row);
    });

    const total = Cart.getTotal();
    cartTotalEl.textContent = `L. ${total}`;
    cartCountEl.textContent = items.reduce((s,i)=>s+i.qty,0);
  }

  function openProductModal(p){
    modalContent.innerHTML = `
      <h3>${p.name}</h3>
      <p style="font-size:12px;color:var(--text-soft);margin:4px 0;">
        ${p.category || ""} › ${p.subcategory || ""} › ${p.subsubcategory || ""} (${p.variant || ""})
      </p>
      <p style="margin:6px 0;font-size:13px;">${p.short || ""}</p>
      <p style="margin:6px 0;font-size:12px;color:var(--text-soft);">${p.long_description || ""}</p>
      <p style="margin:6px 0;font-weight:600;">L. ${p.price}</p>
    `;
    modal.classList.remove("hidden");
  }

  function closeModal(){
    modal.classList.add("hidden");
  }

  function toggleCart(){
    if(window.innerWidth<=900){
      cartPanel.classList.toggle("open");
    }
  }

  function initTheme(){
    const saved = localStorage.getItem("sd_theme");
    const root = document.documentElement;

    if(saved==="dark"){
      root.setAttribute("data-theme","dark");
      themeIcon.textContent = "☀️";
    }else{
      root.setAttribute("data-theme","light");
      themeIcon.textContent = "🌙";
    }
  }

  function toggleTheme(){
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") || "light";
    const next = current==="light" ? "dark" : "light";

    root.setAttribute("data-theme",next);
    localStorage.setItem("sd_theme",next);

    themeIcon.textContent = next==="dark" ? "☀️" : "🌙";
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    initTheme();

    try{
      products = await API.fetchProducts();

      populateFilterSelect(categorySelect, uniqueValues("category"));
      populateFilterSelect(subcategorySelect, uniqueValues("subcategory"));
      populateFilterSelect(subsubcategorySelect, uniqueValues("subsubcategory"));
      populateFilterSelect(variantSelect, uniqueValues("variant"));

      renderProducts();
      renderCart();
    }catch(e){
      console.error(e);
    }

    searchInput.addEventListener("input", e=>{
      filters.search = e.target.value.toLowerCase().trim();
      renderProducts();
    });

    categorySelect.addEventListener("change", e=>{
      filters.category = e.target.value;
      renderProducts();
    });

    subcategorySelect.addEventListener("change", e=>{
      filters.subcategory = e.target.value;
      renderProducts();
    });

    subsubcategorySelect.addEventListener("change", e=>{
      filters.subsubcategory = e.target.value;
      renderProducts();
    });

    variantSelect.addEventListener("change", e=>{
      filters.variant = e.target.value;
      renderProducts();
    });

    filterOfferBtn.addEventListener("click", ()=>{
      filters.offer = !filters.offer;
      renderProducts();
    });

    filterLowStockBtn.addEventListener("click", ()=>{
      filters.lowStock = !filters.lowStock;
      renderProducts();
    });

    clearAllFiltersBtn.addEventListener("click", ()=>{
      filters.category = "";
      filters.subcategory = "";
      filters.subsubcategory = "";
      filters.variant = "";
      filters.offer = false;
      filters.lowStock = false;
      filters.search = "";

      searchInput.value = "";
      categorySelect.value = "";
      subcategorySelect.value = "";
      subsubcategorySelect.value = "";
      variantSelect.value = "";

      renderProducts();
    });

    cartToggle.addEventListener("click", toggleCart);
    closeCart.addEventListener("click", toggleCart);

    checkoutBtn.addEventListener("click", ()=>{
      const items = Cart.getItems();
      const total = Cart.getTotal();
      if(!items.length) return;
      WhatsApp.open(items,total);
    });

    modal.addEventListener("click", e=>{
      if(e.target.classList.contains("modal-backdrop")) closeModal();
    });

    closeModalBtn.addEventListener("click", closeModal);

    themeToggle.addEventListener("click", toggleTheme);
  });
})();
