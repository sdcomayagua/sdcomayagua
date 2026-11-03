/* Descargas de imágenes con marca de agua integrada: nunca se entrega una copia sin marca por error. */
(function(root){'use strict';
const MAX_SIDE=1600,MAX_FILES=500,MAX_BYTES=180*1024*1024;
const encoder=new TextEncoder();
const safeName=value=>String(value||'producto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,65)||'producto';
function sources(product){
 const out=[],add=url=>{url=String(url||'').trim();if((/^https:\/\//i.test(url)||/^assets\/products\/[\w.-]+$/i.test(url))&&!out.includes(url))out.push(url);};
 add(product?.image);
 let gallery=product?.gallery||'';
 if(Array.isArray(gallery))gallery.forEach(add);
 else{
  try{const parsed=JSON.parse(String(gallery));if(Array.isArray(parsed)){parsed.forEach(add);return out.slice(0,10);}}catch(error){}
  String(gallery).split(/[\n,;|]/).forEach(add);
 }
 return out.slice(0,10);
}
function sourceUrl(url){
 const match=String(url).match(/drive\.google\.com\/(?:file\/d\/|thumbnail\?id=)([A-Za-z0-9_-]+)/i);
 return match?'https://drive.google.com/thumbnail?id='+encodeURIComponent(match[1])+'&sz=w1600':url;
}
/* Las copias del catálogo se sirven desde GitHub Pages, sin bloqueo CORS.
 * El sincronizador actualiza también la galería; no tocamos originales de Drive.
 */
let mirrorsRequest=null;
function photoKey(source){
 const match=String(source||'').match(/drive\.google\.com\/(?:file\/d\/|thumbnail\?id=)([A-Za-z0-9_-]+)/i);
 return match?'drive:'+match[1]:String(source||'').trim();
}
async function localCopy(product,source){
 if(!product?.id||typeof fetch!=='function')return '';
 if(!mirrorsRequest){
  mirrorsRequest=fetch('data/catalogo-fotos.json',{cache:'no-cache'})
   .then(response=>response.ok?response.json():null)
   .catch(()=>null);
 }
 const data=await mirrorsRequest,entry=data?.images?.[String(product.id)];
 if(!entry)return '';
 const items=[entry,...(Array.isArray(entry.gallery)?entry.gallery:[])];
 const key=photoKey(source);
 const matched=items.find(item=>item&&photoKey(item.source)===key);
 return matched&&/^assets\/catalog\/[a-f0-9]{24}\.(?:jpg|jpeg|png|gif|webp)$/i.test(matched.path||'')?matched.path:'';
}
function loadImage(url){
 return new Promise((resolve,reject)=>{
  const photo=new Image();let finished=false;
  const timer=setTimeout(()=>finish(Error('La imagen tardó demasiado en responder.')),12000);
  function finish(error){if(finished)return;finished=true;clearTimeout(timer);photo.onload=null;photo.onerror=null;error?reject(error):resolve(photo);}
  photo.crossOrigin='anonymous';photo.onload=()=>photo.naturalWidth?finish():finish(Error('Imagen vacía.'));photo.onerror=()=>finish(Error('El servidor de la fotografía bloquea las descargas seguras.'));photo.src=url;
 });
}
function catalogPhoto(id){
 const url=window.GC_CONFIG?.publicApiUrl||window.GC_CONFIG?.apiUrl;
 if(!url||!id||!/^[\w-]{1,180}$/.test(id))return Promise.reject(Error('No hay copia pública disponible.'));
 return new Promise((resolve,reject)=>{
  const callback='gcPhotoDl'+Math.random().toString(36).slice(2),script=document.createElement('script');
  let done=false;const timer=setTimeout(()=>finish(Error('La copia pública no respondió.')),14000);
  function finish(err,data){if(done)return;done=true;clearTimeout(timer);delete window[callback];script.remove();err?reject(err):resolve(data);}
  window[callback]=result=>{
   const found=result?.images?.find(item=>item.id===id&&/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(item.data||''));
   finish(found?null:Error('No se encontró una copia pública de esa foto.'),found?.data);
  };
  const join=url.includes('?')?'&':'?';
  script.onerror=()=>finish(Error('No se pudo consultar la foto pública.'));
  script.src=url+join+'action=catalogPhotos&ids='+encodeURIComponent(id)+'&callback='+callback;
  document.head.appendChild(script);
 });
}
async function imageFor(product,source,index){
 // Primera opción: copia local de GitHub Pages, sin necesidad de Apps Script.
 const mirror=await localCopy(product,source);
 if(mirror){
  try{return await loadImage(mirror);}
  catch(error){/* La copia puede estar sincronizándose: se intenta el servidor. */}
 }

 // Google Drive deja visualizar imágenes en <img>, pero no siempre permite leerlas
 // desde un canvas. En Admin priorizamos el canal autenticado de Apps Script.
 const drive=/^https:\/\/drive\.google\.com\//i.test(source);
 const admin=typeof window.GC_ADMIN?.request==='function';
 let serverError=null,publicError=null;
 if(drive&&admin&&product?.id){
  try{
   const response=await window.GC_ADMIN.request('adminPhotoData',{id:String(product.id),index});
   if(!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(response?.data||''))throw Error('Google no devolvió la imagen de este artículo.');
   return await loadImage(response.data);
  }catch(error){serverError=error;}
 }
 try{return await loadImage(sourceUrl(source));}catch(error){if(!serverError)serverError=error;}
 if(index===0&&product?.id){
  try{return await loadImage(await catalogPhoto(String(product.id)));}
  catch(error){publicError=error;}
 }
 if(drive&&admin){
  const detail=String(serverError?.message||'');
  if(/operaci[oó]n no reconocida|unknown action|not implemented/i.test(detail)){
   throw Error('La función de fotos todavía no está activada en Google Apps Script. Publicá una nueva versión del archivo Code.gs en la implementación existente (/exec). Consultá la guía de activación que aparece en este panel.');
  }
  if(/pin|sesión|autorizad|acceso|credencial/i.test(detail)){
   throw Error('Google rechazó el acceso a la foto. Cerrá sesión, ingresá de nuevo con tu PIN y probá otra vez. Si continúa, verificá la implementación de Apps Script.');
  }
  throw Error('Google Drive no entregó una copia descargable de "'+String(product?.name||'este producto')+'" (foto '+(index+1)+'). '+(detail?'Detalle: '+detail+' ':'')+'Verificá que Code.gs esté actualizado y publicado como nueva versión de /exec.');
 }
 if(drive){
  throw Error('Esta fotografía está alojada en Google Drive y el servidor público no entregó una copia con acceso de descarga.'+(publicError?' Revisá la conexión de Google Apps Script.':''));
 }
 throw Error('No se puede generar la foto '+(index+1)+' de "'+String(product?.name||'este producto')+'": su servidor bloquea la creación de una imagen con marca de agua.');
}
function paint(image,settings){
 const ratio=Math.min(1,MAX_SIDE/Math.max(image.naturalWidth,image.naturalHeight));
 const width=Math.max(1,Math.round(image.naturalWidth*ratio)),height=Math.max(1,Math.round(image.naturalHeight*ratio));
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Este navegador no admite edición de fotografías.');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
 const W=root.GC_WATERMARK,o=W?.options(settings||W.get()||{});
 if(o?.watermarkEnabled&&o.watermarkText&&o.watermarkOpacity>0&&o.watermarkFontSize>0&&o.watermarkCount>0){
  const font=W.fonts[o.watermarkFont],marks=W.positions(o.watermarkCount),size=o.watermarkFontSize*width/1000;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
  ctx.globalAlpha=o.watermarkOpacity;ctx.globalCompositeOperation='difference';
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=font.weight+' '+size+'px '+font.css;
  const measured=ctx.measureText(o.watermarkText).width;
  for(const [u,v] of marks){
   ctx.save();ctx.translate(width*u/1000,height*v/1000);ctx.rotate(-27*Math.PI/180);
   if(measured>width*.75&&measured>0)ctx.scale(width*.75/measured,1);
   ctx.fillText(o.watermarkText,0,0);ctx.restore();
  }
  ctx.restore();
 }
 return canvas;
}
async function photoBlob(product,source,index,settings){
 const img=await imageFor(product,source,index);
 const canvas=paint(img,settings);
 return await new Promise((resolve,reject)=>{
  try{canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo generar una foto protegida.')),'image/jpeg',.9);}
  catch(error){reject(Error('La foto no autoriza generar una imagen descargable con marca.'));}
 });
}
function save(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.rel='noopener';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function one(product,source,index=0,settings){
 const blob=await photoBlob(product,source,index,settings);
 save(blob,safeName(product.code||product.name)+'-foto-'+String(index+1).padStart(2,'0')+'-GAMER-COMAYAGUA.jpg');
 return true;
}
/* ZIP sin dependencias externas; imágenes JPEG ya comprimidas, por ello usa STORE. */
const table=(()=>{const arr=new Uint32Array(256);for(let n=0;n<256;n++){let v=n;for(let k=0;k<8;k++)v=v&1?(v>>>1)^0xEDB88320:v>>>1;arr[n]=v>>>0;}return arr;})();
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function zip(entries){
 const segments=[],central=[];let offset=0;
 const u16=(v,arr)=>{arr.push(v&255,(v>>>8)&255);},u32=(v,arr)=>{u16(v,arr);u16(v>>>16,arr);};
 for(const entry of entries){
  const name=encoder.encode(entry.name),data=entry.bytes,checksum=crc(data),local=[];
  u32(0x04034b50,local);u16(20,local);u16(0x0800,local);u16(0,local);u16(0,local);u16(0,local);
  u32(checksum,local);u32(data.length,local);u32(data.length,local);u16(name.length,local);u16(0,local);
  segments.push(new Uint8Array(local),name,data);
  const directory=[];u32(0x02014b50,directory);u16(20,directory);u16(20,directory);u16(0x0800,directory);u16(0,directory);u16(0,directory);u16(0,directory);
  u32(checksum,directory);u32(data.length,directory);u32(data.length,directory);u16(name.length,directory);u16(0,directory);u16(0,directory);u16(0,directory);u16(0,directory);u32(0,directory);u32(offset,directory);
  central.push(new Uint8Array(directory),name);
  offset+=local.length+name.length+data.length;
 }
 let centralLength=0;for(const part of central)centralLength+=part.length;
 const end=[];u32(0x06054b50,end);u16(0,end);u16(0,end);u16(entries.length,end);u16(entries.length,end);u32(centralLength,end);u32(offset,end);u16(0,end);
 return new Blob([...segments,...central,new Uint8Array(end)],{type:'application/zip'});
}
async function group(products,settings,onProgress){
 const items=[];
 for(const product of products){const photos=sources(product);for(let index=0;index<photos.length;index++)items.push({product,source:photos[index],index});}
 if(!items.length)throw Error('No hay fotografías disponibles para descargar.');
 if(items.length>MAX_FILES)throw Error('Hay más de '+MAX_FILES+' fotos. Descargá los artículos en grupos más pequeños.');
 const entries=[],taken=new Map();let total=0;
 for(let i=0;i<items.length;i++){
  const {product,source,index}=items[i],folder=safeName(product.code||product.name),key=folder.toLowerCase(),number=taken.get(key)||0;
  taken.set(key,number+1);
  const blob=await photoBlob(product,source,index,settings),bytes=new Uint8Array(await blob.arrayBuffer());
  total+=bytes.length;if(total>MAX_BYTES)throw Error('Las fotos superan 180 MB. Descargá por artículo para evitar que el celular se quede sin memoria.');
  entries.push({name:folder+'/'+String(index+1).padStart(2,'0')+'-GAMER-COMAYAGUA'+(number&&index===0?'-'+number:'')+'.jpg',bytes});
  onProgress?.(i+1,items.length,product.name);
 }
 return zip(entries);
}
async function product(product,settings,onProgress){
 const photos=sources(product);
 if(!photos.length)throw Error('Este artículo no tiene fotografías para descargar.');
 if(photos.length===1){
  // Una foto se guarda directamente en JPG; no hacemos ZIP innecesarios.
  await one(product,photos[0],0,settings);
  onProgress?.(1,1,product.name);
  return true;
 }
 const blob=await group([product],settings,onProgress);
 save(blob,safeName(product.code||product.name)+'-fotos-GAMER-COMAYAGUA.zip');
 return true;
}
async function all(products,settings,onProgress){const available=products.filter(p=>sources(p).length);const blob=await group(available,settings,onProgress);save(blob,'GAMER-COMAYAGUA-fotos-por-articulo.zip');return true;}
root.GC_PHOTO_DOWNLOAD={sources,photoBlob,one,product,all,safeName};
})(window);
