/* Creador de imágenes promocionales originales de Gamer Comayagua.
   No envía datos a servidores, solo usa fotografía local verificada por el manifiesto.
*/
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_PROMO_IMAGE=api;})(typeof self!=='undefined'?self:globalThis,function(){'use strict';
const variants={feed:{width:1080,height:1350,label:'Publicación · 4:5'},story:{width:1080,height:1920,label:'Historia · 9:16'}};
const imagePath=/^assets\/catalog\/[a-f0-9]{24}\.(?:webp|jpg|jpeg|png|gif)$/i;
const localProduct=/^assets\/products\/[\w.-]+$/i;
function photoFor(product,manifest){
 const source=String(product?.image||'').trim(),record=manifest?.images?.[product?.id];
 if(record&&typeof record==='object'&&record.source===source&&imagePath.test(record.path||''))return record.path;
 if(localProduct.test(source))return source;
 return null;
}
function splitText(ctx,text,maxWidth,maxLines=3){
 const words=String(text||'').trim().split(/\s+/),lines=[];let line='';
 for(const word of words){
  const next=line?line+' '+word:word;
  if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines)break;}
  else line=next;
 }
 if(lines.length<maxLines&&line)lines.push(line);
 if(words.length&&lines.join(' ').length<words.join(' ').length&&lines.length)lines[lines.length-1]=lines[lines.length-1].replace(/\s+$/,'')+'…';
 return lines;
}
function rounded(ctx,x,y,width,height,radius,fill){
 ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fill();
}
function render(canvas,product,photo,{format='feed',price='',brand='GAMER COMAYAGUA'}={}){
 if(!variants[format])throw Error('Formato de imagen inválido.');
 if(!photo||!photo.naturalWidth)throw Error('Se requiere una fotografía válida para exportar.');
 const {width,height}=variants[format];canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('El navegador no permite crear la imagen.');
 const story=format==='story',pad=62;
 ctx.fillStyle='#0f2740';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#1b3c5d';ctx.fillRect(0,0,width,story?170:145);
 ctx.fillStyle='#fff';ctx.font='800 40px system-ui,Arial';ctx.fillText(brand,pad,story?100:88);
 ctx.fillStyle='#ff4458';ctx.fillRect(pad,story?126:113,250,7);
 ctx.font='700 23px system-ui,Arial';ctx.fillStyle='#cfdef0';
 ctx.fillText('TECNOLOGÍA Y ACCESORIOS · HONDURAS',pad,story?210:182);
 const picY=story?250:210,picH=story?980:740,picX=pad,picW=width-pad*2;
 rounded(ctx,picX,picY,picW,picH,28,'#ffffff');
 ctx.save();ctx.beginPath();ctx.roundRect(picX,picY,picW,picH,28);ctx.clip();
 const ratio=Math.min((picW-58)/photo.naturalWidth,(picH-58)/photo.naturalHeight);
 const iw=photo.naturalWidth*ratio,ih=photo.naturalHeight*ratio;
 ctx.drawImage(photo,picX+(picW-iw)/2,picY+(picH-ih)/2,iw,ih);
 ctx.translate(width/2,picY+picH/2);ctx.rotate(-Math.PI/5);
 ctx.font='900 37px system-ui,Arial';ctx.fillStyle='rgba(19,42,65,.17)';
 for(let y=-picH;y<=picH;y+=105)for(let x=-picW*2;x<picW*2;x+=450)ctx.fillText('GAMER COMAYAGUA',x,y);
 ctx.restore();
 const titleY=picY+picH+(story?110:75);
 ctx.fillStyle='#fff';ctx.font='800 49px system-ui,Arial';
 splitText(ctx,product.name,width-2*pad,story?4:2).forEach((line,i)=>ctx.fillText(line,pad,titleY+i*62));
 const bottom=story?height-255:height-198;
 ctx.font='900 63px system-ui,Arial';ctx.fillStyle='#ffffff';ctx.fillText(price||'Consultá precio',pad,bottom);
 const stock=Number(product.stock)||0;
 rounded(ctx,width-344,bottom-60,282,70,14,stock>0?'#e9f8f0':'#fbe5e5');
 ctx.font='800 25px system-ui,Arial';ctx.fillStyle=stock>0?'#176342':'#91333b';ctx.fillText(stock>0?'CONSULTÁ STOCK':'AGOTADO',width-322,bottom-16);
 rounded(ctx,pad,height-120,width-pad*2,65,15,'#f02d45');
 ctx.font='800 27px system-ui,Arial';ctx.fillStyle='#fff';ctx.fillText('COMPRÁ EN GAMER COMAYAGUA · WHATSAPP',pad+36,height-77);
 return {width,height};
}
async function loadPhoto(url,ImageClass=Image){
 if(!url||!imagePath.test(url)&&!localProduct.test(url))throw Error('No existe copia local válida de esta fotografía.');
 return new Promise((resolve,reject)=>{
  const image=new ImageClass();image.onload=()=>image.naturalWidth?resolve(image):reject(Error('Fotografía inválida.'));
  image.onerror=()=>reject(Error('No se pudo abrir la fotografía local. Revisá las fotos del producto.'));
  image.src=url;
 });
}
function filename(product,format){
 const name=String(product.code||product.name||'producto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'producto';
 return 'Gamer-Comayagua-'+name+'-'+format+'.png';
}
return {variants,photoFor,splitText,render,loadPhoto,filename};
});
