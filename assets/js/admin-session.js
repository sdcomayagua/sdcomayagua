/* Sesión breve del ADMIN. El PIN sigue validándose en el servidor en cada petición. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GC_ADMIN_SESSION=factory();})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const TTL=10*60*1000,KEY='gc_admin_session_v1';
 const validToken=value=>/^(?:\d{6}|gc_[0-9a-f]{64})$/i.test(String(value||''));
 function create({storage,fallbackStorage,now=Date.now,ttl=TTL,key=KEY}={}){
  let memory=null,memoryOnly=false,usedStorage=null;
  const stores=[storage,fallbackStorage].filter((item,i,all)=>item&&all.indexOf(item)===i);
  function clear(){
   memory=null;usedStorage=null;
   for(const target of stores)try{target.removeItem(key);}catch(error){}
  }
  function read(){
   let record=memory;
   if(!memoryOnly){
    let found=false;
    for(const target of stores){
     let raw;
     try{raw=target.getItem(key);}catch(error){continue;}
     if(raw===null)continue;
     found=true;usedStorage=target;
     try{record=JSON.parse(raw);}catch(error){clear();return null;}
     break;
    }
    if(!found&&stores.length)record=null;
   }
   if(!record||!validToken(record.token)||!Number.isFinite(record.expiresAt)||record.expiresAt<=now()||record.expiresAt>now()+ttl){
    clear();return null;
   }
   memory=record;return {...record};
  }
  function start(token){
   if(!validToken(token)){clear();return null;}
   memory={token:String(token),expiresAt:now()+ttl};
   memoryOnly=true;usedStorage=null;
   for(const target of stores){
    try{
     target.setItem(key,JSON.stringify(memory));
     if(target.getItem(key)!==JSON.stringify(memory))continue;
     usedStorage=target;memoryOnly=false;break;
    }catch(error){}
   }
   if(usedStorage){
    for(const target of stores)if(target!==usedStorage)try{target.removeItem(key);}catch(error){}
   }
   return {...memory};
  }
  function touch(){const record=read();return record?start(record.token):null;}
  return {read,start,touch,clear,ttl,key,persisted:()=>!memoryOnly&&!!usedStorage};
 }
 return {create,TTL,KEY,validToken};
});
