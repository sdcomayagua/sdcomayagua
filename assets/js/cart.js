let cart = [];

function addToCart(product) {
  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(p => p.id !== id);
  renderCart();
}

function toggleCart() {
  const panel = document.getElementById("cartPanel");
  panel.classList.toggle("active");
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");

  let total = 0;
  let count = 0;

  cartItems.innerHTML = cart
    .map(item => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      count += item.qty;
      return `
        <div class="cart-item">
          <span>${item.name} x${item.qty}</span>
          <span>L ${subtotal}</span>
        </div>
      `;
    })
    .join("");

  cartTotal.textContent = total.toFixed(2);
  cartCount.textContent = count;
}

function checkout() {
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }
  alert("Aquí iría el flujo de checkout / WhatsApp.");
}
