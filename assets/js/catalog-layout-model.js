/* Auto-diseño para catálogos: sin huecos, sin alterar el modo manual. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_CATALOG_LAYOUT=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function rows(count){
  const n=Math.max(0,Math.min(12,Math.floor(Number(count)||0)));
  if(!n)return [];
  const r=n<=4?1:n<=8?2:3;
  const base=Math.floor(n/r),remainder=n%r;
  return Array.from({length:r},(_,i)=>base+(i<remainder?1:0));
 }
 function pages(items){
  const count=items.length;if(!count)return [];
  const pageCount=Math.ceil(count/12),base=Math.floor(count/pageCount),extra=count%pageCount;
  let start=0;
  return Array.from({length:pageCount},(_,i)=>{const n=base+(i<extra?1:0),out=items.slice(start,start+n);start+=n;return out;});
 }
 function position(index,counts){
  let start=0;
  for(let row=0;row<counts.length;row++){
   if(index<start+counts[row])return {row,column:index-start,columns:counts[row]};
   start+=counts[row];
  }
  return null;
 }
 return {rows,pages,position};
});
