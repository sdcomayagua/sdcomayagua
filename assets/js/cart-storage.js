/* Carrito persistente. Guarda exclusivamente IDs y cantidades: nunca datos personales. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_CART_STORAGE=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const KEY='gc_cart_v2',OLD_KEY='gc_cart',LIFE=7*24*60*60*1000,MAX_ITEMS=80,MAX_QTY=999;
 function clean(raw){
  const result=Object.create(null);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
  for(const [id,qty] of Object.entries(raw).slice(0,MAX_ITEMS)){
   if(!/^[A-Za-z0-9_.-]{1,160}$/.test(id)||id==='__proto__'||id==='constructor'||id==='prototype')continue;
   const n=Number(qty);
   if(Number.isInteger(n)&&n>=1&&n<=MAX_QTY)result[id]=n;
  }
  return result;
 }
 function create({storage,fallback,now=Date.now}={}){
  const get=(store,key)=>{try{return store?.getItem(key)}catch{return null}};
  const put=(store,key,value)=>{try{store?.setItem(key,value);return store?.getItem(key)===value}catch{return false}};
  const del=(store,key)=>{try{store?.removeItem(key)}catch{}};
  function read(){
   const saved=get(storage,KEY);
   if(saved!==null&&saved!==undefined){
    try{
     const record=JSON.parse(saved);
     if(record?.version===2&&Number.isFinite(record.savedAt)&&record.savedAt<=now()&&now()-record.savedAt<LIFE){
      return clean(record.items);
     }
    }catch(error){}
    del(storage,KEY);
   }
   const legacy=get(fallback,OLD_KEY);
   if(legacy){
    try{const items=clean(JSON.parse(legacy));save(items);del(fallback,OLD_KEY);return items;}catch(error){del(fallback,OLD_KEY);}
   }
   return clean({});
  }
  function save(items){
   const value=clean(items);
   const serialized=JSON.stringify({version:2,savedAt:now(),items:value});
   if(!put(storage,KEY,serialized))put(fallback,KEY,serialized);
   del(fallback,OLD_KEY);
   return value;
  }
  function clear(){del(storage,KEY);del(fallback,KEY);del(fallback,OLD_KEY);}
  return {read,save,clear,KEY,ttl:LIFE};
 }
 return {create,clean,KEY,LIFE};
});
