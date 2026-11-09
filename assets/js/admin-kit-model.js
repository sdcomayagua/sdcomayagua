/* Modelo de kits: no altera artículos de origen ni sus precios/stock. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_KIT_MODEL=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const round=value=>Math.round((Number(value)||0)*100)/100;
function assemble(products,draft){
 const list=Array.isArray(products)?products:[],items=Array.isArray(draft.items)?draft.items:[];
 if(items.length<2||items.length>12)throw Error('Elegí entre 2 y 12 productos para armar el kit.');
 const seen=new Set();
 const contents=items.map(item=>{
  const p=list.find(p=>String(p.id)===String(item.id));
  if(!p||!p.active)throw Error('Uno de los productos no está disponible.');
  if(seen.has(p.id))throw Error('No se puede repetir un mismo producto en dos filas.');
  seen.add(p.id);
  const qty=Number(item.qty||1),price=Number(item.price);
  if(!Number.isInteger(qty)||qty<1||qty>20)throw Error('La cantidad por producto debe ser de 1 a 20.');
  if(!Number.isFinite(price)||price<0||price>1000000)throw Error('Revisá los precios individuales.');
  return {id:p.id,code:p.code,name:p.name,qty,price:round(price),stock:p.stock,image:p.image,codAllowed:p.codAllowed};
 });
 const sum=round(contents.reduce((acc,item)=>acc+item.qty*item.price,0));
 const final=draft.finalPrice==null||String(draft.finalPrice).trim()===''?sum:Number(draft.finalPrice);
 if(!Number.isFinite(final)||final<=0||final>10000000)throw Error('El precio final del kit debe ser mayor que cero.');
 const name=String(draft.name||'').trim();
 if(name.length<3||name.length>180)throw Error('Escribí un nombre de kit de 3 a 180 caracteres.');
 const stock=Math.max(0,Math.min(...contents.map(item=>Math.floor(item.stock/item.qty))));
 const images=[...new Set(contents.map(item=>String(item.image||'').trim()).filter(Boolean))];
 const codAllowed=draft.codAllowed!==false&&contents.every(x=>x.codAllowed);
 const description=['El kit incluye:',...contents.map(item=>'• '+item.qty+' × '+item.name+' — '+item.price.toFixed(2)+' L c/u'),'Total de artículos: L '+sum.toFixed(2),'Precio del kit: L '+round(final).toFixed(2)].join('\n');
 return {id:'',code:'',name,category:String(draft.category||'KIT PERSONALIZADO').trim().slice(0,75)||'KIT PERSONALIZADO',price:round(Math.max(sum,final)),promoPrice:final<sum?round(final):'',promoText:final<sum?'Promoción del kit':'',stock,description,discounts:draft.freeShipping?'ENVIOGRATIS':'ENVIOCOSTO',codAllowed,active:draft.active!==false,image:images[0]||'',gallery:images.slice(1,10).join(', '),colors:'',details:{},cost:'',components:contents,totalIndividual:sum,finalPrice:round(final)};
}
return {assemble};
});
