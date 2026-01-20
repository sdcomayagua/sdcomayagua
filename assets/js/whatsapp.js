window.WhatsApp = (function(){
  function buildMessage(){
    const items = Cart.getItems();
    const ship = Shipping.getState();
    const totals = Cart.totals(()=>Shipping.calcShipping());

    const lines = [];
    lines.push(`Nuevo pedido desde ${CONFIG.storeName} (${CONFIG.storeShort})`);
    lines.push("");
    lines.push("Productos:");
    for(const id in items){
      const it = items[id];
      lines.push(`- ${it.name} x${it.qty} = L. ${(it.price*it.qty).toFixed(2)}`);
    }
    lines.push("");
    lines.push(`Subtotal: L. ${totals.subtotal.toFixed(2)}`);
    lines.push(`Envío (${ship.courier || "N/A"}): L. ${totals.shipping.toFixed(2)}`);
    lines.push(`Total: L. ${totals.total.toFixed(2)}`);
    lines.push("");
    lines.push(`Departamento: ${ship.dept || "No indicado"}`);
    lines.push(`Municipio: ${ship.mun || "No indicado"}`);
    lines.push(`Dirección: ${ship.direccion || "No indicada"}`);
    lines.push("");
    lines.push("Por favor confirmar disponibilidad y hora de entrega.");

    return encodeURIComponent(lines.join("\n"));
  }

  function openWhatsApp(){
    if(!Object.keys(Cart.getItems()).length){
      alert("El carrito está vacío");
      return;
    }
    const msg = buildMessage();
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;
    window.open(url, "_blank");
  }

  return { openWhatsApp };
})();
