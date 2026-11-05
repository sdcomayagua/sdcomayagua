/* Cotización individual PNG. Importes tomados de GC.quote (carrito). */
(function(root){'use strict';
const C=root.GC;
function calculate(p,settings){
 const entries=[{product:p,qty:1}];
 return {transfer:C.quote(entries,'transfer',settings),tigo:C.quote(entries,'tigo',settings),cod:C.quote(entries,'cod',settings)};
}
function box(ctx,x,y,w,h,color,r=16){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
function label(ctx,s,x,y,size=24,color='#1b3754',weight=700){ctx.fillStyle=color;ctx.font=weight+' '+size+'px Arial';ctx.textAlign='left';ctx.fillText(String(s),x,y);}
function wrap(ctx,s,width){let lines=[],line='';for(const w of String(s).split(/\s+/)){const next=line?line+' '+w:w;if(line&&ctx.measureText(next).width>width){lines.push(line);line=w;}else line=next;}if(line)lines.push(line);if(lines.length>2){lines=lines.slice(0,2);while(ctx.measureText(lines[1]+'…').width>width)lines[1]=lines[1].slice(0,-1);lines[1]+='…';}return lines;}
async function getPhoto(p,url){
 const api=root.GC_PHOTO_DOWNLOAD;
 if(!api?.photoBlob)throw Error('No está disponible la descarga de imagen.');
 const blob=await api.photoBlob(p,url,0,root.GC_WATERMARK?.get?.());
 if(root.createImageBitmap)return root.createImageBitmap(blob);
 return new Promise((resolve,reject)=>{const img=new Image(),u=URL.createObjectURL(blob);img.onload=()=>{URL.revokeObjectURL(u);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(u);reject(Error('No se pudo cargar la imagen'))};img.src=u;});
}
async function download(p,url,settings){
 if(!p?.id||!p?.active||p.stock<=0)throw Error('El producto no está disponible para cotizar.');
 const q=calculate(p,settings);
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1500;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Este navegador no permite exportar imágenes.');
 ctx.fillStyle='#f3f7fb';ctx.fillRect(0,0,1080,1500);
 box(ctx,0,0,1080,171,'#102e4e',0);box(ctx,47,38,10,94,'#eb3450',4);
 label(ctx,'GAMER COMAYAGUA',82,95,40,'#fff',800);
 label(ctx,'COTIZACIÓN INDIVIDUAL · 1 UNIDAD',82,137,21,'#c7e0f1',700);
 box(ctx,47,201,986,514,'#fff',24);
 try{const im=await getPhoto(p,url),w=im.width||im.naturalWidth,h=im.height||im.naturalHeight,scale=Math.min(912/w,471/h);
 ctx.drawImage(im,83+(912-w*scale)/2,224+(471-h*scale)/2,w*scale,h*scale);im.close?.();
 }catch(error){label(ctx,'Imagen no disponible',360,470,27,'#72859a');}
 ctx.font='800 42px Arial';
 const titleLines=wrap(ctx,p.name,963);titleLines.forEach((s,i)=>label(ctx,s,52,777+i*49,42,'#132d47',800));
 const y=777+(titleLines.length-1)*49;
 label(ctx,'PRECIO DEL PRODUCTO',53,y+43,21,'#6a8299',700);
 label(ctx,C.money(C.unitPrice(p,1)),53,y+104,51,'#df2945',800);
 const free=q.transfer.shipping===0,sy=y+127;
 box(ctx,48,sy,984,55,free?'#e4f5e9':'#e9f0f9',12);
 label(ctx,free?'✓ ENVÍO NACIONAL GRATIS INCLUIDO':'Envío nacional con empaque: '+C.money(q.transfer.shipping),73,sy+37,25,free?'#196843':'#22567e',800);
 const rows=[['DEPÓSITO / TRANSFERENCIA',q.transfer],['TIGO MONEY',q.tigo],['PAGAR AL RECIBIR',q.cod]];
 rows.forEach(([title,quote],i)=>{
  const top=sy+71+i*112;box(ctx,48,top,984,103,'#fff',14);
  label(ctx,title,71,top+35,23,'#265778',800);
  if(i===2&&!quote.codAllowed){label(ctx,'No disponible para este producto',71,top+76,22,'#b84750',700);return;}
  const note=i===0?'Total a transferir':i===1?'Comisión '+Math.round(quote.rate*100)+'% incluida': 'Anticipo '+C.money(quote.deposit)+' / saldo '+C.money(quote.balance);
  label(ctx,note,71,top+77,21,'#6a7c8f',500);
  ctx.textAlign='right';ctx.font='800 39px Arial';ctx.fillStyle='#13314c';ctx.fillText(C.money(quote.total),1008,top+63);ctx.textAlign='left';
 });
 label(ctx,'Valores sujetos a confirmación de existencias y condiciones.',54,1405,20,'#57718a',500);
 box(ctx,0,1435,1080,65,'#102e4e',0);
 label(ctx,'WhatsApp +504 3151-7755 · Honduras',54,1476,23,'#fff',700);
 const blob=await new Promise((ok,no)=>canvas.toBlob(b=>b?ok(b):no(Error('No se pudo generar PNG')),'image/png'));
 const file=(p.code||p.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'-').slice(0,64);
 const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='GC-Cotizacion-'+file+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),30000);
 return true;
}
root.GC_PRODUCT_QUOTE={calculate,download};
})(window);
