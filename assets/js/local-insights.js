/* Métricas PRIVADAS DEL DISPOSITIVO, no globales, sin cookies ni solicitudes externas.
   Solo agrega contadores por fecha e ID de producto. No registra DNI, teléfonos ni clientes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_LOCAL_INSIGHTS=api.createBrowser(root);})(typeof self!=='undefined'?self:globalThis,function(){'use strict';
const KEY='gc_insights_local_v1',TYPES=new Set(['visit','product','cart','whatsapp']),KEEP_DAYS=30;
const day=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function create({storage,session,now=()=>new Date()}={}){
 const get=()=>{try{const parsed=JSON.parse(storage?.getItem(KEY)||'null');return parsed&&typeof parsed==='object'&&Array.isArray(parsed.days)?parsed:{days:[]};}catch{return {days:[]};}};
 const put=value=>{try{storage?.setItem(KEY,JSON.stringify(value));return true;}catch{return false;}};
 function prune(data){
  const current=new Date(now().getTime());current.setDate(current.getDate()-KEEP_DAYS+1);
  const cutoff=day(current);
  data.days=(data.days||[]).filter(row=>typeof row?.day==='string'&&row.day>=cutoff&&row.day<=day(now())).slice(-KEEP_DAYS);
  return data;
 }
 function record(type,id=''){
  if(!TYPES.has(type))return false;
  id=String(id||'').trim();
  if(type!=='visit'&&!/^[a-z0-9_-]{1,90}$/i.test(id))return false;
  const date=day(now()),data=prune(get()),row=data.days.find(x=>x.day===date)||{day:date,counts:{},items:{}};
  if(!data.days.includes(row))data.days.push(row);
  if(type==='visit'){
   const key='gc_insights_visited_'+date;
   try{if(session?.getItem(key))return false;session?.setItem(key,'1');}catch{}
   row.counts.visit=Math.min(100000,(Number(row.counts.visit)||0)+1);
  }else{
   row.counts[type]=Math.min(100000,(Number(row.counts[type])||0)+1);
   row.items[type]??={};row.items[type][id]=Math.min(100000,(Number(row.items[type][id])||0)+1);
  }
  return put(data);
 }
 function summary(){
  const data=prune(get()),totals={visit:0,product:0,cart:0,whatsapp:0},items={};
  for(const row of data.days){for(const type of TYPES){
   totals[type]+=Math.max(0,Number(row.counts?.[type])||0);
   if(type!=='visit')for(const [id,value] of Object.entries(row.items?.[type]||{})){
    if(!/^[a-z0-9_-]{1,90}$/i.test(id))continue;
    items[id]??={product:0,cart:0,whatsapp:0};
    items[id][type]+=Math.max(0,Number(value)||0);
   }
  }}
  const top=Object.entries(items).map(([id,counts])=>({id,...counts})).sort((a,b)=>(b.product*1+b.cart*3+b.whatsapp*5)-(a.product*1+a.cart*3+a.whatsapp*5)).slice(0,12);
  return {days:KEEP_DAYS,totals,top,scope:'solo-este-navegador'};
 }
 const clear=()=>{try{storage?.removeItem(KEY);return true;}catch{return false;}};
 return {record,summary,clear,key:KEY};
}
function createBrowser(root){
 let storage=null,session=null;
 try{storage=root.localStorage;}catch{}
 try{session=root.sessionStorage;}catch{}
 return create({storage,session});
}
return {create,createBrowser};
});
