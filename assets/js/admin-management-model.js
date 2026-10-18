/* Funciones de gestión sin acceso a red ni datos de clientes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.GC_MANAGEMENT=factory(root.GC);})(typeof self!=='undefined'?self:globalThis,function(C){
 'use strict';
 const orderStates={pending:'Pendiente',confirmed:'Confirmado',sent:'Enviado',delivered:'Entregado',cancelled:'Cancelado'};
 const waitStates={pending:'Esperando',contacted:'Contactado',resolved:'Resuelto',cancelled:'Cancelado'};
 function photos(p){let raw=p.gallery||'';if(typeof raw==='string'){try{const array=JSON.parse(raw);if(Array.isArray(array))raw=array;}catch{}}return [...new Set([p.image,...(Array.isArray(raw)?raw:String(raw).split(/[\n,;|]/))].map(s=>String(s||'').trim()).filter(Boolean))].slice(0,10);}
 function missing(p){const fields=[];if(!photos(p).length)fields.push({key:'photo',label:'Foto'});if(!String(p.description||'').trim())fields.push({key:'description',label:'Descripción'});if(!String(p.category||'').trim()||/^(otros|producto)$/i.test(p.category))fields.push({key:'category',label:'Categoría'});if(!p.colors&&!Object.entries(p.details||{}).some(([key,value])=>!['references','weightUnit','measureUnit'].includes(key)&&String(value||'').trim()))fields.push({key:'details',label:'Características'});return fields;}
 function counts(products,threshold=3){return {pending:products.filter(p=>missing(p).length).length,photos:products.filter(p=>!photos(p).length).length,low:products.filter(p=>p.stock>0&&p.stock<=threshold).length,out:products.filter(p=>p.stock===0).length};}
 function phone(raw){let value=String(raw||'').replace(/\D/g,'').replace(/^00/,'');if(value.length===8)value='504'+value;return /^\d{10,15}$/.test(value)?value:'';}
 function wa(raw,text){const value=phone(raw);return value?'https://wa.me/'+value+'?text='+encodeURIComponent(text):'';}
 function orderQuote(items,mode,config){return C.quote(items.map(item=>({qty:item.qty,product:{name:item.name||'Producto',price:Number(item.unitPrice)||0,stock:Math.max(item.qty,1),active:true,codAllowed:item.codAllowed!==false}})),mode,config);}
 function textFor(p,channel,variant,config={},link=''){
  const price=C.money(C.unitPrice(p,1)),stock=p.stock>0,brand='GAMER COMAYAGUA';
  const features=[],labels={model:'Modelo',compatibility:'Compatibilidad',connection:'Conexión',power:'Potencia',voltage:'Voltaje',technology:'Tecnología',material:'Material',included:'Incluye'};
  if(p.colors)features.push('Color: '+p.colors);
  for(const [key,label] of Object.entries(labels))if(p.details?.[key])features.push(label+': '+p.details[key]);
  const description=String(p.description||'').trim().slice(0,650),shipping=C.money(config.shipping??110);
  const availability=stock?'Disponible · '+p.stock+' unidad'+(p.stock===1?'':'es'):'Agotado · consultá por reposición';
  const starts=['Conocé '+p.name,p.name+' en '+brand,'¿Buscás '+p.name+'?'];
  const lead=starts[Number(variant||0)%starts.length],facts=features.slice(0,channel==='whatsapp'?3:5),destination='Estamos en Comayagua. Envíos a toda Honduras desde '+shipping+'.';
  if(channel==='tiktok')return [lead+'.',description,...facts,stock?'Su precio es de '+price+'.':'Por ahora está agotado; podés consultar la próxima reposición.',destination,'Escribinos a '+brand+' para confirmar disponibilidad y compatibilidad.',link,'#GamerComayagua #Comayagua #Honduras'].filter(Boolean).join('\n\n');
  if(channel==='facebook')return [lead,'Precio: '+price,availability,description,facts.map(f=>'• '+f).join('\n'),destination,'Consultanos antes de pagar para confirmar disponibilidad y compatibilidad.',link].filter(Boolean).join('\n\n');
  return ['*'+lead+'*','*'+price+'*',availability,description.slice(0,330),facts.map(f=>'• '+f).join('\n'),destination,stock?'Escribinos para pedir el tuyo.':'Escribinos si querés que te anotemos para la próxima reposición.',link].filter(Boolean).join('\n\n');
 }
 return {photos,missing,counts,phone,wa,orderQuote,textFor,orderStates,waitStates};
});
