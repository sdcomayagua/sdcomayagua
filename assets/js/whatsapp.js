function openWhatsAppWithCart() {
  const number = "+50431517755";
  const message = encodeURIComponent("Hola, quiero finalizar mi compra en SD Comayagua.");
  window.open(`https://wa.me/${number}?text=${message}`, "_blank");
}
