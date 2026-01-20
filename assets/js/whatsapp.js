window.WhatsApp = (function(){
  const PHONE = "+50431517755";

  function buildMessage(cartItems,total){
    let lines = [];
    lines.push("Hola, quiero hacer este pedido desde SDComayagua:");
    lines.push("");
    cartItems.forEach(i=>{
      lines.push(`• ${i.name} x${i.qty} – L. ${i.price * i.qty}`);
    });
    lines.push("");
    lines.push(`Total: L. ${total}`);
    return encodeURIComponent(lines.join("\n"));
  }

  function open(cartItems,total){
    const msg = buildMessage(cartItems,total);
    const url = `https://wa.me/${PHONE}?text=${msg}`;
    window.open(url,"_blank");
  }

  return {open};
})();
