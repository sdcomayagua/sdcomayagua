/* Ofertas persistentes: el precio normal siempre se conserva. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.GC_OFFERS=factory(root.GC);})(typeof self!=='undefined'?self:globalThis,function(C){
 'use strict';
 const round=value=>Math.round((Number(value)+Number.EPSILON)*100)/100;
 function amount(value){const text=String(value??'').trim().replace(',','.');if(!text||!/^\d+(?:\.\d{1,2})?$/.test(text))throw Error('Escribí un número con hasta dos decimales.');const n=Number(text);if(!Number.isFinite(n))throw Error('Escribí un número válido.');return n;}
 function percent(value){const n=amount(value);if(n<0||n>99)throw Error('El descuento debe estar entre 0 y 99%.');return n;}
 const active=p=>Number(p.promoPrice)>0&&Number(p.promoPrice)<Number(p.price);
 function general(p){if(!active(p))return null;const match=String(p.promoText||'').match(/^(Oferta|Solo hoy) · (\d+(?:\.\d{1,2})?)% en todos los productos$/);return match?{label:match[1],percent:Number(match[2])}:null;}
 function label(value){return value==='Solo hoy'?'Solo hoy':'Oferta';}
 function discounted(price,value){const rate=percent(value),n=C.roundOfferPrice(Number(price)*(100-rate)/100);if(rate>0&&(n<=0||n>=Number(price)))throw Error('Ese porcentaje no produce un precio entero menor válido para este producto. Probá otro porcentaje o escribí el precio final.');return n;}
 function change(p,price,text){return {id:String(p.id),basePrice:Number(p.price),expectedRevision:p.revision,previousPrice:Number(p.promoPrice)||0,previousText:String(p.promoText||''),promoPrice:round(price),promoText:String(text||'')};}
 const same=(p,item)=>(Number(p.promoPrice)||0)===item.promoPrice&&String(p.promoText||'')===item.promoText;
 function check(p,item){if(!p||p.deletedAt||Number(p.price)!==item.basePrice||item.expectedRevision!==undefined&&String(p.revision)!==String(item.expectedRevision)||(Number(p.promoPrice)||0)!==item.previousPrice||String(p.promoText||'')!==item.previousText)throw Error('Un producto cambió desde la vista previa. Sincronizá y revisá los precios otra vez.');}
 function globalPlan(products,value,text='Oferta',replaceIndividual=false){
  const rate=percent(value),changes=[],skipped=[];
  for(const p of products){
   if(p.active===false||p.deletedAt||Number(p.price)<=0)continue;
   if(active(p)&&!general(p)&&!replaceIndividual){skipped.push(p.id);continue;}
   if(rate===0&&!general(p))continue;
   const item=change(p,rate?discounted(p.price,rate):0,rate?label(text)+' · '+rate+'% en todos los productos':'');
   if(!same(p,item))changes.push(item);
  }
  return {changes,skipped,percent:rate};
 }
 function individual(p,mode,value,text='Oferta'){
  if(!p||p.deletedAt||Number(p.price)<=0)throw Error('Elegí un producto con precio normal mayor que cero.');
  const n=mode==='percent'?percent(value):amount(value);
  if(n===0)return change(p,0,'');
  const price=mode==='percent'?discounted(p.price,n):C.roundOfferPrice(n);
  if(price<=0||price>=Number(p.price))throw Error('El precio de oferta debe ser mayor que cero y menor que el precio normal.');
  return change(p,price,label(text));
 }
 function clearGeneral(products){return {changes:products.filter(p=>general(p)).map(p=>change(p,0,'')),skipped:[],percent:0};}
 function clear(p){return change(p,0,'');}
 function payload(p,item){check(p,item);return {...p,cost:'',promoPrice:item.promoPrice,promoText:item.promoText};}
 return {round,amount,percent,active,general,same,check,discounted,globalPlan,individual,clearGeneral,clear,payload};
});
