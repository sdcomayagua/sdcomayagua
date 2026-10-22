(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_PRODUCT_SEARCH=api;})(typeof window==='object'?window:this,function(){
/* SEARCH_MODEL_START */
 'use strict';
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[‐‑–—]/g,'-');
 const compact=value=>normalize(value).replace(/[^A-Z0-9]/g,'');
 const stop=new Set('A AL AND CON DE DEL EL EN FOR IN LA LAS LOS OF PARA POR THE TO UN UNA Y USB TYPE TIPO CABLE CABLES HUB ADAPTADOR ADAPTER ADAPTADORES ENFRIADOR COOLER PHONE DEDALES FINGER SLEEVE MOUSE RATON TECLADO KEYBOARD CARGADOR CHARGER AUDIFONOS AURICULARES HEADPHONES EARPHONES CONTROL CONTROLLER GAMEPAD GAMER GAMING KIT PRO PROFESIONAL ORIGINAL PRODUCT PRODUCTO CARACTERISTICAS ESPECIFICACIONES FICHA TECNICA HILO CELULAR MOVIL SMARTPHONE NEGRO NEGRA BLACK BLANCO BLANCA WHITE AZUL BLUE ROJO ROJA RED'.split(' '));
 const types=[['HUB','PUERTOS'],['ADAPTADOR','ADAPTER','OTG'],['CABLE'],['DEDALES','FINGER SLEEVE'],['ENFRIADOR','COOLER'],['MOUSE','RATON'],['TECLADO','KEYBOARD'],['CARGADOR','CHARGER'],['AUDIFONOS','AURICULARES','HEADPHONES','EARPHONES'],['CONTROL','CONTROLLER','GAMEPAD']];
 for(const word of ['GBPS','MBPS','KBPS','MAH','DPI','GHZ','MHZ','WATTS','VOLTS'])stop.add(word);
 function normalizedName(value){return normalize(value).replace(/\b([A-Z]{1,6})\s+(\d{2,6})\b/g,(all,prefix,number)=>stop.has(prefix)?all:prefix+'-'+number);}
 function models(value){
  const tokens=normalizedName(value).match(/[A-Z0-9]+(?:[-._][A-Z0-9]+)*/g)||[];
  const standard=/^(?:USB\d|TYPE\d|(?:PD|QC|DDR|HDMI|WIFI|BLUETOOTH)\d|V\d+$|\d+(?:W|V|A|MA|MAH|M|CM|MM|GB|TB|DPI|HZ|GHZ|MHZ|GBPS|MBPS|KBPS)$|\d+(?:IN|EN|X)\d+$|IN\d+$)/;
  return [...new Set(tokens.filter(token=>/[A-Z]/.test(token)&&/\d/.test(token)&&!standard.test(compact(token))))].slice(0,4);
 }
 function contains(value,token){
  const code=compact(token);if(!code)return false;
  const expression=code.split('').join('[\\s._-]*');return new RegExp('(?:^|[^A-Z0-9])'+expression+'(?=$|[^A-Z0-9])').test(normalize(value));
 }
 function query(name,category='',modelOnly=false){
  const text=normalizedName(name).replace(/["<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180),ids=models(text);
  if(modelOnly&&ids.length)return ids.map(id=>'"'+id+'"').join(' ');
  const keys=ids.map(compact),out=text.replace(/[A-Z0-9]+(?:[-._][A-Z0-9]+)*/g,word=>keys.includes(compact(word))?'"'+word+'"':word);
  return (out+(!ids.length&&category&&!contains(out,category)?' '+category:'')).slice(0,240);
 }
 function score(name,hit){
  if(!hit||typeof hit.url!=='string')return -1;
  const url=hit.url,title=String(hit.title||''),excerpt=String(hit.excerpt||hit.content||hit.raw_content||'').slice(0,6000),text=title+' '+url+' '+excerpt;
  if(/colab\.research\.google\.com|(?:^|\/)github\.com|kaggle\.com|gist\.github|\.ipynb(?:[?#]|$)/i.test(url)||/GOOGLE COLAB|EMBARCADORES|MANIFIESTO DE CARGA|IMPORTACIONES CALLAO|DICCIONARIO|DATASET|CORPUS LINGUISTICO/.test(normalize(title)))return -1;
  const ids=models(name),wantedTypes=types.filter(group=>group.some(word=>contains(name,word)));
  if(ids.length&&/\/(?:lista|collections|categories|category|categorias?|search|catalog)(?:\/|[?#]|$)/i.test(url)&&!ids.every(id=>contains(title,id)))return -1;
  const words=[...new Set((normalize(name).match(/[A-Z]{3,}/g)||[]).filter(word=>!stop.has(word)&&!ids.some(id=>compact(id).includes(word))))];
  if(ids.length){
   if(!ids.every(id=>contains(text,id)))return -1;
   const variants=normalize(name).match(/\b(?:PRO|PLUS|ULTRA|MAX|V\d+)\b/g)||[];if(!variants.every(word=>contains(text,word)))return -1;
   if(!words.every(word=>contains(text,word)))return -1;
   if(wantedTypes.length&&!wantedTypes.some(group=>group.some(word=>contains(text,word))))return -1;
   return 20+ids.filter(id=>contains(title+' '+url,id)).length*10;
  }
  const found=words.filter(word=>contains(text,word)).length,typeMatch=wantedTypes.some(group=>group.some(word=>contains(text,word)));
  if(wantedTypes.length&&!typeMatch||words.length&&found<Math.min(2,Math.ceil(words.length*.4))||!wantedTypes.length&&!words.length)return -1;
  return (typeMatch?4:0)+found*2;
 }
 function matches(name,hit){return score(name,hit)>=0;}
 return {models,query,matches,score,contains};
/* SEARCH_MODEL_END */
});
