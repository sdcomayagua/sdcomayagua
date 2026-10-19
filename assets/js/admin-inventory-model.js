/* Comparación de fichas y vista previa de existencias; sin red ni datos de clientes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_INVENTORY=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function duplicates(products){
  const prepared=products.filter(p=>p.id&&p.name).map(p=>({p,name:normalize(p.name),code:normalize(p.code),words:new Set(normalize(p.name).split(' ').filter(word=>word.length>1&&!['de','con','para','por','del','el','la','los','las','un','una'].includes(word)))})),pairs=[];
  for(let i=0;i<prepared.length;i++)for(let j=i+1;j<prepared.length;j++){
   const a=prepared[i],b=prepared[j];if(!a.p.active&&!b.p.active)continue;let reason='',score=0;
   if(a.code&&a.code===b.code){reason='Mismo código / SKU';score=100;}
   else if(a.name&&a.name===b.name){reason='Mismo nombre';score=95;}
   else if(a.words.size>=3&&b.words.size>=3){const shared=[...a.words].filter(word=>b.words.has(word)).length,union=new Set([...a.words,...b.words]).size,similarity=shared/union;if(similarity>=.75){reason='Nombres parecidos · revisá modelo, color y presentación';score=Math.round(similarity*90);}}
   if(reason)pairs.push({key:[a.p.id,b.p.id].sort().join('|'),a:a.p,b:b.p,reason,score});
  }
  return pairs.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 }
 function stockPreview(stock,qty,kind){const n=Number(stock),q=Number(qty),after=n+(kind==='sale'?-q:q);return {before:n,after,valid:Number.isInteger(n)&&Number.isInteger(q)&&q>0&&after>=0&&after<=100000};}
 return {normalize,duplicates,stockPreview};
});
