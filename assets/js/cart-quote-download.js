/* Descargas locales de cotizaciones Gamer Comayagua.
   No usa servidores externos: produce PNG de alta resolución y PDF tamaño carta. */
(function(){
 'use strict';
 function setup(targetWindow){
 const document=targetWindow.document;
 const raw=document.getElementById('gcQuoteDownloadData');
 const pdfButton=document.getElementById('gcDirectPdf');
 const pngButton=document.getElementById('gcDirectPng');
 if(!raw||!pdfButton||!pngButton)return;
 let data;
 try{data=JSON.parse(raw.textContent)}catch(error){console.error('Cotización incompleta',error);return;}
 const status=document.getElementById('gcQuoteDownloadStatus');
 const W=800,H=1035,SCALE=2,MARGIN=44;
 const ink='#17314d',muted='#627890',blue='#1269d9',line='#dce6f1',red='#d82f50';
 const currency=value=>'L '+(Number(value)||0).toLocaleString('en-US',{maximumFractionDigits:2});
 const clean=value=>String(value??'').trim();
 const pad=(value,n=2)=>String(value).padStart(n,'0');
 function rounded(ctx,x,y,w,h,r,fill,stroke){
  if(w<=0||h<=0)return;
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
 }
 function font(ctx,size=14,bold=false){
  ctx.font=(bold?'800 ':'400 ')+size+'px Arial,sans-serif';
 }
 function text(ctx,value,x,y,size=14,bold=false,color=ink,align='left'){
  ctx.save();font(ctx,size,bold);ctx.textAlign=align;ctx.textBaseline='top';
  ctx.fillStyle=color;ctx.fillText(clean(value),x,y);ctx.restore();
 }
 function wrap(ctx,value,maxWidth,size=13,bold=false,maxLines=Infinity){
  ctx.save();font(ctx,size,bold);
  const pieces=clean(value).split(/\s+/),out=[];let current='';
  for(const piece of pieces){
   const possible=current?current+' '+piece:piece;
   if(ctx.measureText(possible).width<=maxWidth||!current)current=possible;
   else{out.push(current);current=piece;}
  }
  if(current)out.push(current);
  if(out.length>maxLines){
   out.length=maxLines;
   let last=out[maxLines-1];
   while(last.length>1&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);
   out[maxLines-1]=last+'…';
  }
  ctx.restore();return out;
 }
 function multiline(ctx,value,x,y,width,size=13,color=ink,weight=false,maxLines=10,height=17){
  const rows=wrap(ctx,value,width,size,weight,maxLines);
  rows.forEach((row,i)=>text(ctx,row,x,y+i*height,size,weight,color));
  return rows.length*height;
 }
 const labelPay={transfer:'Transferencia / depósito',tigo:'Tigo Money',cod:'Pagar al recibir'};
 function createCanvas(){
  const c=document.createElement('canvas');c.width=W*SCALE;c.height=H*SCALE;
  const ctx=c.getContext('2d',{alpha:false});
  ctx.scale(SCALE,SCALE);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  return {canvas:c,ctx};
 }
 function drawHeader(ctx,pageNo,totalPages,logo){
  ctx.fillStyle=red;ctx.fillRect(0,0,W,5);
  if(logo)ctx.drawImage(logo,MARGIN,33,74,74);
  else{rounded(ctx,MARGIN,33,74,74,12,'#eaf4ff');text(ctx,'GC',MARGIN+37,53,26,true,blue,'center');}
  text(ctx,'GAMER COMAYAGUA',133,39,27,true,blue);
  text(ctx,'Comayagua · Envíos a toda Honduras',134,77,12,false,muted);
  text(ctx,'WhatsApp: +504 3151-7755',134,94,12,false,muted);
  text(ctx,data.compareAll?'COTIZACIÓN · 3 FORMAS DE PAGO':'COTIZACIÓN',W-MARGIN,40,12,true,blue,'right');
  text(ctx,clean(data.id),W-MARGIN,62,13,true,ink,'right');
  text(ctx,clean(data.date),W-MARGIN,86,10,false,muted,'right');
  ctx.fillStyle=blue;ctx.fillRect(MARGIN,123,W-2*MARGIN,3);
  text(ctx,data.compareAll?'Cotización comparativa':'Cotización de productos',MARGIN,145,21,true,ink);
  text(ctx,'Pedido sujeto a confirmación de existencias',MARGIN,175,12,false,muted);
  text(ctx,'Página '+pageNo+' de '+totalPages,W-MARGIN,175,11,true,muted,'right');
 }
 function drawFooter(ctx){
  ctx.fillStyle=line;ctx.fillRect(MARGIN,H-92,W-2*MARGIN,1);
  multiline(ctx,'Esta cotización no confirma pago ni reserva automática. Existencias y precios sujetos a confirmación.',MARGIN,H-77,W-2*MARGIN,11,muted,false,2,15);
  text(ctx,'GAMER COMAYAGUA · Gracias por elegirnos',MARGIN,H-41,11,true,blue);
 }
 function drawTableHead(ctx,y){
  rounded(ctx,MARGIN,y,W-2*MARGIN,32,6,'#eaf2fb');
  text(ctx,'PRODUCTO',MARGIN+12,y+9,11,true,ink);
  text(ctx,'CANT.',MARGIN+487,y+9,11,true,ink,'right');
  text(ctx,'PRECIO UNIT.',MARGIN+607,y+9,11,true,ink,'right');
  text(ctx,'SUBTOTAL',W-MARGIN-12,y+9,11,true,ink,'right');
  return y+34;
 }
 function productHeight(ctx,item){
  return Math.max(35,15*wrap(ctx,item.name,430,12.5,false,2).length+13);
 }
 function drawProduct(ctx,item,i,y){
  const rowLines=wrap(ctx,item.name,430,12.5,false,2);
  const h=productHeight(ctx,item);
  text(ctx,pad(i+1),MARGIN+11,y+9,10,false,'#8093a7');
  rowLines.forEach((name,k)=>text(ctx,name,MARGIN+40,y+7+15*k,12.5,false,ink));
  text(ctx,item.qty,MARGIN+487,y+9,12,true,ink,'right');
  text(ctx,currency(item.unit),MARGIN+607,y+9,12,false,ink,'right');
  text(ctx,currency(item.subtotal),W-MARGIN-12,y+9,12,true,ink,'right');
  ctx.fillStyle=line;ctx.fillRect(MARGIN,y+h-1,W-2*MARGIN,1);
  return y+h;
 }
 function deliveryLines(ctx){
  const entries=[];
  entries.push('Modalidad: '+clean(data.delivery.label));
  if(data.delivery.note)entries.push('Nota: '+clean(data.delivery.note));
  if(data.delivery.name)entries.push('Cliente: '+clean(data.delivery.name));
  if(data.delivery.city||data.delivery.department)entries.push('Destino: '+[data.delivery.city,data.delivery.department].filter(Boolean).join(', '));
  if(data.delivery.address)entries.push('Dirección: '+clean(data.delivery.address));
  return entries.flatMap(x=>wrap(ctx,x,W-2*MARGIN-26,10.5,false,2));
 }
 function drawDelivery(ctx,y){
  const lines=deliveryLines(ctx),height=32+lines.length*14;
  rounded(ctx,MARGIN,y,W-2*MARGIN,height,9,'#f7faff',line);
  text(ctx,'ENTREGA DEL PEDIDO',MARGIN+13,y+9,11.5,true,ink);
  lines.forEach((entry,i)=>text(ctx,entry,MARGIN+13,y+27+i*14,10.5,false,muted));
  return y+height;
 }
 function drawBase(ctx,y){
  rounded(ctx,MARGIN,y,W-2*MARGIN,data.compareAll?39:108,10,'#f5f9fd',line);
  text(ctx,'Subtotal de productos',MARGIN+16,y+13,13,true,ink);
  text(ctx,currency(data.base.subtotal),W-MARGIN-16,y+13,14,true,ink,'right');
  if(!data.compareAll){
   text(ctx,'Envío ('+clean(data.delivery.label)+')',MARGIN+16,y+38,11,false,muted);
   text(ctx,currency(data.base.shipping),W-MARGIN-16,y+38,12,true,ink,'right');
   text(ctx,'TOTAL A PAGAR',MARGIN+16,y+73,14,true,blue);
   text(ctx,currency(data.base.total),W-MARGIN-16,y+69,22,true,red,'right');
  }
  return y+(data.compareAll?39:108);
 }
 function drawComparison(ctx,y){
  text(ctx,'Comparativo de las 3 formas de pago',MARGIN,y,17,true,ink);
  text(ctx,'Productos, envío y comisión incluidos en cada total.',MARGIN,y+24,10.5,false,muted);
  const start=y+43,gap=10,width=(W-2*MARGIN-gap*2)/3,cardH=170;
  for(const [i,mode] of ['transfer','tigo','cod'].entries()){
   const x=MARGIN+i*(width+gap),q=data.payments[mode],disabled=mode==='cod'&&!q.allowed;
   rounded(ctx,x,start,width,cardH,12,disabled?'#f4f5f7':'#f8fbff',disabled?'#cbd4df':line);
   text(ctx,labelPay[mode],x+11,start+10,11.5,true,disabled?'#738093':ink);
   if(disabled){
    rounded(ctx,x+10,start+35,width-20,52,9,'#e7ebef');
    text(ctx,'NO DISPONIBLE',x+width/2,start+51,15.5,true,'#68798c','center');
    multiline(ctx,(q.reasons||[]).join(' '),x+11,start+94,width-22,9.2,'#707d8c',false,6,11);
    continue;
   }
   text(ctx,currency(q.total),x+11,start+34,26,true,red);
   ctx.fillStyle=line;ctx.fillRect(x+11,start+67,width-22,1);
   text(ctx,'Productos: '+currency(q.subtotal),x+11,start+79,10.5,false,muted);
   text(ctx,'Envío: '+currency(q.shipping),x+11,start+99,10.5,false,muted);
   text(ctx,mode==='transfer'?'Sin comisión':'Comisión '+Math.round(q.rate*100)+'%: '+currency(q.fee),x+11,start+119,10.5,false,muted);
   if(mode==='cod'){
    text(ctx,'Anticipo: '+currency(q.deposit),x+11,start+140,10.5,true,ink);
    text(ctx,'Al recibir: '+currency(q.balance),x+11,start+155,10.5,true,ink);
   }
  }
  return start+cardH;
 }
 async function loadLogo(){
  if(!data.logo)return null;
  return new Promise(resolve=>{
   const image=new Image();
   image.onload=()=>resolve(image);
   image.onerror=()=>resolve(null);
   image.src=data.logo;
  });
 }
 function splitItems(){
  const items=data.items||[];
  if(!items.length)return [[]];
  const measure=document.createElement('canvas').getContext('2d');
  const heights=items.map(item=>productHeight(measure,item));
  const lastReserve=9+(32+deliveryLines(measure).length*14)+9+(data.compareAll?39:108)
   +(data.compareAll?13+43+170:data.base.mode==='cod'?56:0);
  const tableStart=202+34,limit=H-92-14,continuationReserve=34;
  // Ajustar por altura real: priorizar una hoja cuando contiene el pedido completo.
  // Cuando hacen falta varias hojas, repartir los artículos de forma equilibrada
  // y reservar entrega, subtotal y métodos de pago para la hoja final.
  for(let count=1;count<=items.length;count++){
   const groups=[];let offset=0,valid=true;
   for(let index=0;index<count;index++){
    const size=Math.ceil((items.length-offset)/(count-index));
    const end=offset+size;
    const used=heights.slice(offset,end).reduce((sum,h)=>sum+h,0);
    const reserve=index===count-1?lastReserve:continuationReserve;
    if(tableStart+used+reserve>limit){valid=false;break;}
    groups.push(items.slice(offset,end));
    offset=end;
   }
   if(valid&&offset===items.length)return groups;
  }
  // Fallback excepcional para nombres/direcciones extremadamente largos.
  return items.map(item=>[item]);
 }
 async function renderPages(){
  const groups=splitItems(),logo=await loadLogo(),pages=[];
  let first=0;
  for(let k=0;k<groups.length;k++){
   const {canvas,ctx}=createCanvas(),group=groups[k];
   drawHeader(ctx,k+1,groups.length,logo);
   let y=drawTableHead(ctx,202);
   for(let i=0;i<group.length;i++)y=drawProduct(ctx,group[i],first+i,y);
   first+=group.length;
   if(k===groups.length-1){
    y=drawDelivery(ctx,y+9);
    y=drawBase(ctx,y+9);
    if(data.compareAll)y=drawComparison(ctx,y+13);
    else if(data.base.mode==='cod'){
     text(ctx,'ANTICIPO A DEPOSITAR: '+currency(data.base.deposit),MARGIN+8,y+16,12,true,ink);
     text(ctx,'SALDO AL RECIBIR: '+currency(data.base.balance),MARGIN+8,y+38,12,true,ink);
    }
   }else text(ctx,'Continúa en la siguiente página',W-MARGIN,y+20,12,false,muted,'right');
   drawFooter(ctx);
   pages.push(canvas);
  }
  return pages;
 }
 function blobOf(canvas,type,quality){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo generar el archivo.')),type,quality));
 }
 function save(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.rel='noopener';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function slug(value){return clean(value).replace(/[^A-Za-z0-9_-]+/g,'-').slice(0,64)||'Cotizacion';}
 function pdfFromJpegs(images){
  const encode=new TextEncoder(),objects=[null],reserve=()=>{objects.push(null);return objects.length-1;};
  const catalog=reserve(),tree=reserve();
  const refs=images.map(()=>({page:reserve(),stream:reserve(),image:reserve()}));
  objects[catalog]='<< /Type /Catalog /Pages '+tree+' 0 R >>';
  objects[tree]='<< /Type /Pages /Kids ['+refs.map(r=>r.page+' 0 R').join(' ')+'] /Count '+refs.length+' >>';
  images.forEach((im,i)=>{
   const r=refs[i],bytes=im.bytes;
   objects[r.image]={head:'/Type /XObject /Subtype /Image /Width '+im.width+' /Height '+im.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',bytes};
   objects[r.stream]={bytes:encode.encode('q\n612 0 0 792 0 0 cm\n/Im1 Do\nQ\n')};
   objects[r.page]='<< /Type /Page /Parent '+tree+' 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 '+r.image+' 0 R >> >> /Contents '+r.stream+' 0 R >>';
  });
  const parts=[],offsets=[0];let total=0;
  function write(bytes){const arr=typeof bytes==='string'?encode.encode(bytes):bytes;parts.push(arr);total+=arr.byteLength;}
  write('%PDF-1.4\n%');write(new Uint8Array([0xE2,0xE3,0xCF,0xD3]));write('\n');
  for(let i=1;i<objects.length;i++){
   offsets[i]=total;write(i+' 0 obj\n');
   const obj=objects[i];
   if(typeof obj==='string')write(obj);
   else{write('<< '+(obj.head||'')+' /Length '+obj.bytes.byteLength+' >>\nstream\n');write(obj.bytes);write('\nendstream');}
   write('\nendobj\n');
  }
  const xref=total;write('xref\n0 '+objects.length+'\n0000000000 65535 f \n');
  for(let i=1;i<objects.length;i++)write(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  write('trailer\n<< /Size '+objects.length+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
 }
 async function exportImage(){
  const pages=await renderPages(),limit=7;
  for(let from=0;from<pages.length;from+=limit){
   const subset=pages.slice(from,from+limit),combined=document.createElement('canvas');
   combined.width=W*SCALE;combined.height=H*SCALE*subset.length;
   const ctx=combined.getContext('2d',{alpha:false});
   subset.forEach((canvas,index)=>ctx.drawImage(canvas,0,index*H*SCALE));
   const blob=await blobOf(combined,'image/png');
   save(blob,'Gamer-Comayagua-'+slug(data.id)+(pages.length>limit?'-parte-'+pad(from/limit+1):'')+'.png');
   combined.width=1;combined.height=1;
  }
  pages.forEach(p=>{p.width=1;p.height=1;});
 }
 async function exportPdf(){
  const pages=await renderPages(),images=[];
  for(const canvas of pages){
   const blob=await blobOf(canvas,'image/jpeg',.86);
   images.push({width:canvas.width,height:canvas.height,bytes:new Uint8Array(await blob.arrayBuffer())});
   canvas.width=1;canvas.height=1;
  }
  save(pdfFromJpegs(images),'Gamer-Comayagua-'+slug(data.id)+'.pdf');
 }
 let busy=false;
 async function onExport(kind){
  if(busy)return;busy=true;pdfButton.disabled=true;pngButton.disabled=true;
  status.textContent=kind==='pdf'?'Creando PDF tamaño carta…':'Preparando imagen PNG…';
  try{
   if(kind==='pdf')await exportPdf();else await exportImage();
   status.textContent='Descarga preparada correctamente.';
  }catch(error){console.error('Descarga de cotización',error);status.textContent='No se pudo descargar el archivo. Usá Imprimir / Guardar PDF.';}
  finally{busy=false;pdfButton.disabled=false;pngButton.disabled=false;}
 }
 pdfButton.addEventListener('click',()=>onExport('pdf'));
 pngButton.addEventListener('click',()=>onExport('png'));
 targetWindow.GC_CART_QUOTE_DOWNLOAD={renderPages,exportPdf,exportImage};
 }
 window.GC_CART_QUOTE_DOWNLOAD_SETUP=setup;
 if(document.getElementById('gcQuoteDownloadData'))setup(window);
})();
