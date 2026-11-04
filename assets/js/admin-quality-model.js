/* Reglas de calidad: sin redes, sin PIN, sin costos en el informe exportado. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_QUALITY_MODEL=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const checks=[
  {key:'no-photo',label:'Sin fotografías',level:'high'},
  {key:'main-photo',label:'Sin foto principal',level:'medium'},
  {key:'one-photo',label:'Solo una fotografía',level:'low'},
  {key:'no-description',label:'Sin descripción',level:'medium'},
  {key:'generic-description',label:'Descripción muy genérica',level:'medium'},
  {key:'no-category',label:'Categoría sin definir',level:'medium'},
  {key:'no-details',label:'Sin características técnicas',level:'low'},
  {key:'no-price',label:'Precio inválido o pendiente',level:'high'},
  {key:'invalid-offer',label:'Promoción mayor o igual al precio',level:'high'},
  {key:'below-cost',label:'Precio menor al costo registrado',level:'high'},
  {key:'out-of-stock',label:'Agotado',level:'low'},
  {key:'negative-stock',label:'Existencias inválidas',level:'high'},
  {key:'no-code',label:'Código faltante',level:'medium'},
  {key:'duplicate-code',label:'Código repetido',level:'high'}
 ];
 const glossary=Object.fromEntries(checks.map(item=>[item.key,item]));
 const first=v=>String(v??'').trim();
 function photos(p){
  let raw=p.gallery||'';
  if(typeof raw==='string')try{const j=JSON.parse(raw);if(Array.isArray(j))raw=j;}catch(e){}
  const extras=Array.isArray(raw)?raw:String(raw).split(/[\n,;|]/);
  return [...new Set([p.image,...extras].map(first).filter(v=>/^https:\/\//i.test(v)||/^assets\/(?:catalog|products)\/[\w.-]+$/i.test(v)))].slice(0,10);
 }
 function details(p){
  const data=p.details&&typeof p.details==='object'?p.details:{};
  return !!first(p.colors)||Object.entries(data).some(([key,value])=>!['references','weightUnit','measureUnit'].includes(key)&&first(value));
 }
 function analyze(products){
  const list=Array.isArray(products)?products.filter(p=>p&&!p.deletedAt&&p.active!==false):[];
  const codeCount=new Map();
  for(const p of list){const code=first(p.code).toLowerCase();if(code)codeCount.set(code,(codeCount.get(code)||0)+1);}
  return list.map(p=>{
   const codes=[],images=photos(p),price=Number(p.price),stock=Number(p.stock),
    promo=Number(p.promoPrice)||0,desc=first(p.description),code=first(p.code).toLowerCase();
   if(!images.length)codes.push('no-photo');
   else if(!first(p.image))codes.push('main-photo');
   if(images.length===1)codes.push('one-photo');
   if(!desc)codes.push('no-description');
   else if(desc.length<55||/Producto disponible en Gamer Comayagua\. Ideal para clientes que buscan buena calidad/i.test(desc))codes.push('generic-description');
   if(!first(p.category)||/^(otros?|productos?)$/i.test(first(p.category)))codes.push('no-category');
   if(!details(p))codes.push('no-details');
   if(!Number.isFinite(price)||price<=0)codes.push('no-price');
   if(promo>0&&!(promo<price))codes.push('invalid-offer');
   if(p.costKnown===true&&Number(p.cost)>0&&price>0&&price<Number(p.cost))codes.push('below-cost');
   if(!Number.isInteger(stock)||stock<0)codes.push('negative-stock');
   else if(stock===0)codes.push('out-of-stock');
   if(!code)codes.push('no-code');
   else if(codeCount.get(code)>1)codes.push('duplicate-code');
   const issues=codes.map(key=>glossary[key]);
   return {id:first(p.id),code:first(p.code),name:first(p.name)||'Producto sin nombre',category:first(p.category),
    price:Number.isFinite(price)?price:0,stock:Number.isFinite(stock)?stock:0,images:images.length,issues,
    high:issues.filter(i=>i.level==='high').length,medium:issues.filter(i=>i.level==='medium').length,
    priority:issues.some(i=>i.level==='high')?'high':issues.some(i=>i.level==='medium')?'medium':issues.length?'low':'ok'};
  });
 }
 function summary(rows){
  const total=rows.length;
  const count=key=>rows.filter(r=>r.issues.some(i=>i.key===key)).length;
  return {total,good:rows.filter(r=>!r.issues.length).length,high:rows.filter(r=>r.high>0).length,
   missingPhotos:count('no-photo'),singlePhoto:count('one-photo'),descriptions:count('no-description')+count('generic-description'),
   prices:rows.filter(r=>r.issues.some(i=>['no-price','invalid-offer','below-cost'].includes(i.key))).length,
   out:count('out-of-stock')};
 }
 function filter(rows,{key='all',query=''}={}){
  const term=first(query).toLocaleLowerCase('es');
  return rows.filter(r=>(key==='all'?r.issues.length:key==='high'?r.high>0:key==='photo'?r.issues.some(i=>['no-photo','main-photo','one-photo'].includes(i.key)):key==='description'?r.issues.some(i=>['no-description','generic-description','no-details'].includes(i.key)):key==='price'?r.issues.some(i=>['no-price','invalid-offer','below-cost'].includes(i.key)):key==='stock'?r.issues.some(i=>['out-of-stock','negative-stock'].includes(i.key)):key==='ok'?!r.issues.length:r.issues.some(i=>i.key===key))&&(!term||[r.name,r.code,r.category].join(' ').toLocaleLowerCase('es').includes(term)))
   .sort((a,b)=>b.high-a.high||b.medium-a.medium||a.name.localeCompare(b.name,'es'));
 }
 function csv(rows){
  // Prefijar fórmulas peligrosas para prevenir ejecuciones al abrir CSV en Excel/Sheets.
  const safe=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const columns=[['Código','code'],['Producto','name'],['Categoría','category'],['Precio público','price'],['Existencias','stock'],['Cantidad de fotos','images'],['Prioridad','priority']];
  const data=[columns.map(([title])=>safe(title)).join(','),'\n'];
  for(const r of rows){data.push([...columns.map(([,key])=>safe(r[key])),safe(r.issues.map(i=>i.label).join(' | '))].join(',')+'\r\n');}
  return '\uFEFF'+columns.map(([title])=>safe(title)).concat(safe('Pendientes de revisión')).join(',')+'\r\n'+data.slice(2).join('');
 }
 return {checks,photos,analyze,summary,filter,csv};
});
