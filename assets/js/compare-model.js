/* Comparador público. Sin acceso al Admin ni almacenamiento de datos personales. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_COMPARE=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const MAX=3;
 function toggle(ids,id){
  const list=[...new Set((Array.isArray(ids)?ids:[]).map(String))].slice(0,MAX);
  id=String(id||'');
  if(!id)return {ids:list,limit:false};
  if(list.includes(id))return {ids:list.filter(x=>x!==id),limit:false};
  if(list.length>=MAX)return {ids:list,limit:true};
  return {ids:[...list,id],limit:false};
 }
 function fields(products,unitPrice,money){
  const list=(Array.isArray(products)?products:[]).slice(0,MAX);
  const get=(p,key)=>p.details&&typeof p.details==='object'?String(p.details[key]||'').trim():'';
  return [
   ['Precio',list.map(p=>money(unitPrice(p,1)))],
   ['Existencias',list.map(p=>Number(p.stock)>0?String(p.stock)+' disponibles':'Agotado')],
   ['Categoría',list.map(p=>p.category||'No indicada')],
   ['Marca',list.map(p=>get(p,'brand')||'No indicada')],
   ['Modelo',list.map(p=>get(p,'model')||'No indicado')],
   ['Compatibilidad',list.map(p=>get(p,'compatibility')||'Por confirmar')],
   ['Conexión',list.map(p=>get(p,'connection')||'No indicada')],
   ['Material',list.map(p=>get(p,'material')||'No indicado')],
   ['Potencia',list.map(p=>get(p,'power')||'No indicada')],
   ['Colores',list.map(p=>p.colors||'No indicados')]
  ];
 }
 return {MAX,toggle,fields};
});
