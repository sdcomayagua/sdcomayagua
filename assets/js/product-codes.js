(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_CODES=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const prefix=category=>String(category||'Otros').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70).replace(/-+$/,'')||'Otros';
 const key=category=>prefix(category).toLowerCase();
 function next(products,category){
  const p=prefix(category),start=(p+'-').toLowerCase();let max=0;
  for(const product of products||[]){const code=String(product.code||'');if(code.toLowerCase().startsWith(start)){const tail=code.slice(start.length);if(/^\d+$/.test(tail))max=Math.max(max,Number(tail));}}
  return p+'-'+String(max+1).padStart(3,'0');
 }
 return {prefix,key,next};
});
