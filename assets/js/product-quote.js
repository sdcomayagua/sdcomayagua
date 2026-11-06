/* Cotización individual Gamer Comayagua · diseño editorial blanco.
   Un solo cálculo oficial para transferencia, Tigo Money y pago al recibir. */
(function(root){'use strict';
const C=root.GC;
const COLORS={navy:'#14324f',blue:'#23557a',red:'#e62d47',muted:'#65788c',line:'#dce5ee',pale:'#f5f8fc',green:'#176943',white:'#ffffff'};
function calculate(product,settings={}){
 const items=[{product,qty:1}];
 return {transfer:C.quote(items,'transfer',settings),tigo:C.quote(items,'tigo',settings),cod:C.quote(items,'cod',settings)};
}
function rect(ctx,x,y,w,h,color,r=0){
 ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function text(ctx,value,x,y,size=24,color=COLORS.navy,weight=600,align='left'){
 ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;
 ctx.font=weight+' '+size+'px Arial, sans-serif';ctx.fillText(String(value),x,y);
 ctx.textAlign='left';
}
function line(ctx,x1,y1,x2,y2,color=COLORS.line,width=2){
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function titleRows(ctx,name,maxWidth=952,maxLines=2){
 ctx.font='800 43px Arial, sans-serif';
 const words=String(name||'Producto').trim().split(/\s+/),rows=[];let current='';
 for(const word of words){
  const next=current?current+' '+word:word;
  if(ctx.measureText(next).width>maxWidth&&current){rows.push(current);current=word;}else current=next;
 }
 if(current)rows.push(current);
 if(rows.length>maxLines){
  rows.length=maxLines;let tail=rows[maxLines-1];
  while(tail.length&&ctx.measureText(tail+'…').width>maxWidth)tail=tail.slice(0,-1);
  rows[maxLines-1]=tail+'…';
 }
 return rows;
}
async function loadPhoto(product,source){
 const photos=root.GC_PHOTO_DOWNLOAD;
 if(!photos?.photoBlob)throw Error('No está disponible la descarga protegida de fotos.');
 const blob=await photos.photoBlob(product,source,0,root.GC_WATERMARK?.get?.());
 if(typeof root.createImageBitmap==='function')return root.createImageBitmap(blob);
 return new Promise((resolve,reject)=>{
  const image=new Image(),url=URL.createObjectURL(blob);
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('No se pudo preparar la fotografía.'));};
  image.src=url;
 });
}
function summaryRow(ctx,labelText,value,y,accent=false){
 text(ctx,labelText,66,y,24,accent?COLORS.navy:COLORS.muted,accent?800:500);
 text(ctx,value,1014,y,accent?34:26,accent?COLORS.red:COLORS.navy,800,'right');
}
function sectionHeader(ctx,name,y){
 text(ctx,name,66,y,27,COLORS.navy,800);
 line(ctx,66,y+19,1014,y+19,COLORS.line,2);
}
function paymentRow(ctx,y,title,subtotal,shipping,fee,total,rate){
 text(ctx,title,66,y,29,COLORS.navy,800);
 text(ctx,C.money(total),1014,y,39,COLORS.navy,800,'right');
 const detail='Producto '+C.money(subtotal)+'   ·   Envío '+C.money(shipping)+(rate?'   ·   Comisión '+Math.round(rate*100)+'%: '+C.money(fee):'');
 text(ctx,detail,66,y+38,21,COLORS.muted,500);
}
async function render(product,source,settings={}){
 if(!product?.id||!product.active||product.stock<=0)throw Error('El producto no está disponible para cotizar.');
 const q=calculate(product,settings),width=1080,height=1700;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw Error('Este navegador no permite crear la cotización.');
 rect(ctx,0,0,width,height,COLORS.white);
 rect(ctx,0,0,width,13,COLORS.red);
 text(ctx,'GAMER',64,93,45,COLORS.navy,900);
 text(ctx,'COMAYAGUA',256,93,45,COLORS.red,900);
 text(ctx,'COTIZACIÓN DE PRODUCTO',66,139,21,COLORS.muted,700);
 text(ctx,'1 UNIDAD',1014,137,21,COLORS.muted,700,'right');
 line(ctx,64,166,1016,166);
 // Fondo blanco sobre un panel tenue; las fotos mantienen sus colores originales.
 rect(ctx,63,191,954,590,COLORS.pale,18);
 try{
  const img=await loadPhoto(product,source);
  const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight;
  const k=Math.min(898/w,538/h);
  ctx.drawImage(img,91+(898-w*k)/2,216+(538-h*k)/2,w*k,h*k);
  img.close?.();
 }catch(error){
  text(ctx,'Fotografía no disponible',540,475,30,COLORS.muted,600,'center');
 }
 ctx.font='800 43px Arial, sans-serif';
 const names=titleRows(ctx,product.name);
 names.forEach((row,i)=>text(ctx,row,65,839+i*51,43,COLORS.navy,800));
 const nameBase=839+(names.length-1)*51;
 const priceY=nameBase+58;
 text(ctx,'PRECIO DEL PRODUCTO',66,priceY,21,COLORS.muted,700);
 text(ctx,C.money(C.unitPrice(product,1)),66,priceY+65,58,COLORS.red,900);
 const free=q.transfer.freeShippingIncluded===true;
 text(ctx,free?'✓ Envío nacional gratis incluido':'Envío nacional con empaque: '+C.money(q.transfer.shipping),1014,priceY+59,22,free?COLORS.green:COLORS.blue,700,'right');
 const sepY=priceY+100;
 line(ctx,65,sepY,1015,sepY,COLORS.line,2);
 const headerY=sepY+51;
 sectionHeader(ctx,'FORMAS DE PAGO',headerY);
 const row1=headerY+69,row2=row1+116,row3=row2+116;
 paymentRow(ctx,row1,'Depósito / transferencia',q.transfer.subtotal,q.transfer.shipping,0,q.transfer.total,0);
 line(ctx,66,row1+59,1014,row1+59);
 paymentRow(ctx,row2,'Tigo Money',q.tigo.subtotal,q.tigo.shipping,q.tigo.fee,q.tigo.total,q.tigo.rate);
 line(ctx,66,row2+59,1014,row2+59);
 if(!q.cod.codAllowed){
  text(ctx,'Pagar al recibir',66,row3,29,COLORS.navy,800);
  text(ctx,'No disponible',1014,row3,29,'#ac4652',800,'right');
  text(ctx,'Este producto no cumple las condiciones para esa modalidad.',66,row3+38,21,COLORS.muted,500);
 }else{
  paymentRow(ctx,row3,'Pagar al recibir',q.cod.subtotal,q.cod.shipping,q.cod.fee,q.cod.total,q.cod.rate);
  text(ctx,'Anticipo a depositar: '+C.money(q.cod.deposit),66,row3+75,22,COLORS.blue,700);
  text(ctx,'Saldo al recibir: '+C.money(q.cod.balance),1014,row3+75,22,COLORS.blue,700,'right');
 }
 // Pie discreto: sin recuadros ni botones falsos.
 line(ctx,65,1587,1015,1587);
 text(ctx,'Precios y existencias sujetos a confirmación.',66,1625,20,COLORS.muted,500);
 text(ctx,'WhatsApp +504 3151-7755',66,1660,24,COLORS.navy,800);
 text(ctx,'HONDURAS',1014,1660,21,COLORS.muted,700,'right');
 return canvas;
}
async function download(product,source,settings={}){
 const canvas=await render(product,source,settings);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(data=>data?resolve(data):reject(Error('No se pudo generar el PNG.')),'image/png'));
 const raw=String(product.code||product.name||'producto');
 const filename=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,60)||'producto';
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='GC-Cotizacion-'+filename+'.png';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 return true;
}
root.GC_PRODUCT_QUOTE={calculate,render,download};
})(window);
