/* Sesión temporal del ADMIN. El servidor sigue validando el PIN en cada petición. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_ADMIN_SESSION=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const TTL=5*60*1000,KEY='gc_admin_session_v1';
 function create({storage,now=Date.now,ttl=TTL,key=KEY}={}){
  let memory=null,memoryOnly=false;
  function clear(){memory=null;try{storage?.removeItem(key);}catch{}}
  function read(){
   let record=memory;
   if(!memoryOnly){
    let raw;try{raw=storage?.getItem(key);}catch{memoryOnly=true;}
    if(!memoryOnly&&storage){if(raw==null)record=null;else{try{record=JSON.parse(raw);}catch{clear();return null;}}}
   }
   if(!record||!/^\d{6}$/.test(record.token)||!Number.isFinite(record.expiresAt)||record.expiresAt<=now()||record.expiresAt>now()+ttl){clear();return null;}
   memory=record;return {...record};
  }
  function start(token){
   if(!/^\d{6}$/.test(String(token))){clear();return null;}
   memory={token:String(token),expiresAt:now()+ttl};
   try{storage?.setItem(key,JSON.stringify(memory));memoryOnly=!storage;}catch{memoryOnly=true;}
   return {...memory};
  }
  function touch(){const record=read();return record?start(record.token):null;}
  return {read,start,touch,clear,ttl,key};
 }
 return {create,TTL,KEY};
});
