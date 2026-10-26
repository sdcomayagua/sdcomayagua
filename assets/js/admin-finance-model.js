/* Cálculos privados. No se carga en las páginas de clientes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.GC_FINANCE=factory(root.GC);})(typeof self!=='undefined'?self:globalThis,function(C){
 'use strict';
 const types=['En tienda','Por encargo','Sin clasificar'];
 const type=value=>types.includes(value)?value:'Sin clasificar';
 const round=value=>Math.round((value+Number.EPSILON)*100)/100;
 function row(p){
  const inventoryType=type(p.inventoryType),stock=Math.max(0,Number(p.stock)||0),costKnown=p.costKnown===true,cost=costKnown?Number(p.cost):null,price=C.unitPrice(p,1),classified=inventoryType!=='Sin clasificar';
  return {...p,inventoryType,stock,cost,costKnown,priceNow:price,invested:inventoryType==='En tienda'?(costKnown?round(stock*cost):null):0,toBuy:inventoryType==='Por encargo'?(costKnown?round(stock*cost):null):0,potentialProfit:classified&&costKnown?round((price-cost)*stock):null};
 }
 function summary(products){
  const list=products.filter(p=>!p.deletedAt).map(row),out={count:list.length,owned:0,ordered:0,unclassified:0,missingCost:0,invested:0,toBuy:0,potentialProfit:0,ownedUnits:0,orderedUnits:0};
  for(const p of list){if(p.inventoryType==='En tienda'){out.owned++;out.ownedUnits+=p.stock;out.invested+=p.invested||0;}else if(p.inventoryType==='Por encargo'){out.ordered++;out.orderedUnits+=p.stock;out.toBuy+=p.toBuy||0;}else out.unclassified++;if(!p.costKnown&&p.stock>0&&p.inventoryType!=='Sin clasificar')out.missingCost++;if(p.potentialProfit!==null)out.potentialProfit+=p.potentialProfit;}
  for(const key of ['invested','toBuy','potentialProfit'])out[key]=round(out[key]);return out;
 }
 return {types,type,row,summary};
});
