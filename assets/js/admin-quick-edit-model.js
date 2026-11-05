/* Edición rápida segura: conserva campos y revisiones al usar saveProduct existente. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_QUICK_EDIT_MODEL=api;})(typeof self!=='undefined'?self:globalThis,function(){'use strict';
 function money(value){
  if(typeof value==='string'&&!/^\s*\d+(?:\.\d{1,2})?\s*$/.test(value))return NaN;
  const n=Number(value);return Number.isFinite(n)?n:NaN;
 }
 function validate(original,values){
  if(!original||!original.id||original.deletedAt)throw Error('Elegí un producto activo del inventario.');
  const price=money(values.price),stock=money(values.stock),promo=values.promoPrice===''?0:money(values.promoPrice);
  if(!Number.isFinite(price)||price<=0||price>1000000)throw Error('El precio debe ser mayor que cero.');
  if(!Number.isInteger(stock)||stock<0||stock>100000)throw Error('Las existencias deben ser un número entero válido.');
  if(!Number.isFinite(promo)||promo<0||promo>price)throw Error('La promoción debe ser cero o menor o igual al precio normal.');
  return {price,stock,promoPrice:promo>0?promo:''};
 }
 function payload(original,values){
  const changes=validate(original,values);
  const props=['id','revision','name','category','image','gallery','description','discounts','codAllowed','active','colors','promoText','details','bestSeller'];
  const next={};for(const key of props)if(Object.prototype.hasOwnProperty.call(original,key))next[key]=original[key];
  next.price=changes.price;next.stock=changes.stock;next.promoPrice=changes.promoPrice;next.cost='';
  // El servidor conserva el costo previo cuando recibe cadena vacía.
  if(!next.id||!next.name||!next.category)throw Error('Sincronizá la ficha antes de editarla.');
  return next;
 }
 function changed(old,update){return Number(old.price)!==Number(update.price)||Number(old.stock)!==Number(update.stock)||Number(old.promoPrice||0)!==Number(update.promoPrice||0);}
 return {validate,payload,changed};
});
