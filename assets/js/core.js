/** Lógica pura reutilizada por la tienda, administración y tests. Sin dependencias. */
(function(root, factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const money=n=>'L '+Math.round(Number(n)||0).toLocaleString('es-HN');
 function num(v){
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  let s=String(v??'').replace(/[^\d,.\-]/g,'');if(!s)return 0;
  const dot=s.lastIndexOf('.'), comma=s.lastIndexOf(',');
  if(comma>=0&&dot>=0) s=comma>dot?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(comma>=0) s=/,\d{1,2}$/.test(s)?s.replace(',','.'):s.replace(/,/g,'');
  else if(dot>=0&&/\.\d{3}$/.test(s)) s=s.replace(/\./g,'');
  return Number(s)||0;
 }
 const yes=v=>v===true||['si','sí','true','1','yes'].includes(String(v??'').trim().toLowerCase());
 function cleanProduct(p){
  return {id:String(p.id||p.ID||p.Codigo||'').trim(),code:String(p.code||p.Codigo||'').trim(),name:String(p.name||p.Nombre||'').trim(),category:String(p.category||p.Categoria||'Otros').trim(),price:num(p.price??p.Precio),stock:Math.max(0,Math.floor(num(p.stock??p.Stock))),image:String(p.image||p.Imagen||'').trim(),gallery:p.gallery||p.Galeria||'',description:String(p.description||p.Descripcion||''),discounts:String(p.discounts||p.Descuentos||''),colors:String(p.colors||p.Colores||'').trim(),promoPrice:num(p.promoPrice??p.PrecioPromocion),promoText:String(p.promoText||p.PromocionTexto||'').trim(),codAllowed:yes(p.codAllowed??p.PagoAlRecibir??'SI'),active:yes(p.active??p.Activo??'SI')};
 }
 function tiers(str){return String(str||'').split(/[,;|]/).map(x=>x.trim()).map(x=>{const m=x.match(/^(\d+)\s*:\s*([\d.,]+)$/);return m?{min:+m[1],price:num(m[2])}:null}).filter(Boolean).sort((a,b)=>a.min-b.min);}
 function unitPrice(p,qty){let x=num(p.price),promo=num(p.promoPrice);if(promo>0&&promo<=x)x=promo;for(const t of tiers(p.discounts))if(qty>=t.min)x=Math.min(x,t.price);return x;}
 function integerTotal(v){const rounded=Math.round(v*100)/100;return Math.abs(rounded-Math.round(rounded))<1e-8?Math.round(rounded):Math.ceil(rounded)+1;}
 function quote(items,mode,config={}){
  const shipping=num(config.shipping??110),min=num(config.codMinimum??350),unitsMin=Math.max(2,num(config.codMinimumUnits??2)),codRate=num(config.codRate??.1),tigoRate=num(config.tigoRate??.07);
  const valid=items.filter(i=>i.product&&i.qty>0&&i.product.active&&i.product.stock>0);
  const subtotal=valid.reduce((v,i)=>v+unitPrice(i.product,i.qty)*i.qty,0);
  const qty=valid.reduce((v,i)=>v+i.qty,0),violations=[];
  if(qty<unitsMin) violations.push(`Se requieren al menos ${unitsMin} unidades para pagar al recibir.`);
  if(subtotal<min)violations.push(`La compra mínima para pagar al recibir es ${money(min)} en productos.`);
  const forbidden=valid.filter(i=>!i.product.codAllowed).map(i=>i.product.name);
  if(forbidden.length)violations.push('Estos productos no permiten pago al recibir: '+forbidden.join(', ')+'.');
  if(!qty) violations.push('Agregá productos al carrito.');
  if(valid.some(i=>i.qty>i.product.stock))violations.push('Hay productos sin existencias suficientes.');
  const codAllowed=violations.length===0;const base=subtotal+(qty?shipping:0);
  const rate=mode==='cod'?codRate:mode==='tigo'?tigoRate:0;
  const total=integerTotal(base*(1+rate));const fee=total-base;
  return {valid,subtotal,units:qty,shipping:qty?shipping:0,base,fee,total,deposit:mode==='cod'?shipping+fee:total,balance:mode==='cod'?subtotal:0,mode,codAllowed,reasons:violations};
 }
 function number(){const d=new Date();const z=x=>String(x).padStart(2,'0');let s='';if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);s=(a[0]%1000000).toString().padStart(6,'0')}else s=Math.floor(Math.random()*1000000).toString().padStart(6,'0');return `GC-${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}-${s}`;}
 function waMessage(items,q,id){
  const names={transfer:'Depósito / transferencia',tigo:'Tigo Money',cod:'Pagar al recibir'};
  const lines=[`*GAMER COMAYAGUA - COTIZACIÓN*`,`Número: *${id}*`,'','*PRODUCTOS*'];
  items.forEach(i=>lines.push(`• ${i.product.name}\n  ${i.qty} × ${money(unitPrice(i.product,i.qty))} = *${money(i.qty*unitPrice(i.product,i.qty))}*`));
  lines.push('',`Productos: ${money(q.subtotal)}`,`Envío: ${money(q.shipping)}`,`Forma de pago: ${names[q.mode]||q.mode}`);
  if(q.mode==='cod'||q.mode==='tigo')lines.push(`${q.mode==='tigo'?'Comisión de Tigo Money':'Comisión por pagar al recibir'}: ${money(q.fee)}`);
  lines.push(`*TOTAL: ${money(q.total)}*`);
  if(q.mode==='cod')lines.push(`*ANTICIPO A DEPOSITAR (envío + comisión): ${money(q.deposit)}*`,`*SALDO EN EFECTIVO AL RECIBIR: ${money(q.balance)}*`);
  lines.push('','Solicito confirmar disponibilidad y datos de pago.');return lines.join('\n');
 }
 return {num,yes,cleanProduct,tiers,unitPrice,integerTotal,quote,money,number,waMessage};
});
