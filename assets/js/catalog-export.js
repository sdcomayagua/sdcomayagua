/* Catálogo público en PNG y PDF. Las fotos y los datos comerciales originales se conservan. */
(function(){'use strict';
const C=window.GC,$=id=>document.getElementById(id),W=1440,H=2048,SIZE=6;
let state=null,epoch=0,trigger=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,65)||'Productos';
function setup(){
 if($('catalogExportOverlay'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="overlay catalog-export-overlay" id="catalogExportOverlay" hidden><section class="dialog catalog-export-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogExportTitle"><div class="dialog-head"><div><p class="catalog-export-eyebrow">PARA TUS CLIENTES</p><h2 id="catalogExportTitle">Compartir categoría</h2></div><button type="button" class="icon" id="catalogExportClose" aria-label="Cerrar catálogo">×</button></div><div class="catalog-export-layout"><section class="catalog-export-controls"><h3 id="catalogExportCategory"></h3><p id="catalogExportCount"></p><div class="catalog-export-options"><label><input type="checkbox" id="catalogExportPrices" checked>Mostrar precios</label><label><input type="checkbox" id="catalogExportOut" checked>Incluir agotados</label></div><p class="catalog-export-help" id="catalogExportPricesHelp" hidden>Los precios escritos dentro de las fotos seguirán visibles; forman parte de la imagen original.</p><label class="catalog-export-label" for="catalogExportFormat">Formato</label><select class="field" id="catalogExportFormat"><option value="image">Imagen PNG · página actual</option><option value="pdf">PDF · categoría completa</option></select><p class="catalog-export-status" id="catalogExportStatus" role="status" aria-live="polite"></p><button type="button" class="btn outline" id="catalogExportRetry" hidden>Reintentar fotos</button><a class="btn" id="catalogExportDownload" aria-disabled="true">Descargar imagen</a><button type="button" class="btn outline" id="catalogExportShare" disabled>Compartir imagen</button><p class="catalog-export-help" id="catalogExportShareHelp"></p><p class="catalog-export-help">La imagen incluye la página que estás viendo. El PDF reúne todas las páginas. Las fotos se muestran completas.</p></section><section class="catalog-export-preview" aria-label="Vista previa del catálogo"><div class="catalog-export-preview-empty" id="catalogExportEmpty">Preparando tu catálogo…</div><img id="catalogExportPreview" alt="Vista previa del catálogo" hidden><nav class="catalog-export-pages" aria-label="Páginas del catálogo" hidden><button type="button" class="btn outline" id="catalogExportPrevious" aria-label="Página anterior">←</button><span id="catalogExportPage" role="status"></span><button type="button" class="btn outline" id="catalogExportNext" aria-label="Página siguiente">→</button></nav></section></div></section></div>`);
 $('catalogExportClose').onclick=close;
 $('catalogExportOverlay').onclick=event=>{if(event.target===$('catalogExportOverlay'))close();};
 for(const id of ['catalogExportPrices','catalogExportOut'])$(id).onchange=build;
 $('catalogExportFormat').onchange=updateDownloads;
 $('catalogExportPrevious').onclick=()=>{if(state&&state.index>0){state.index--;preview();}};
 $('catalogExportNext').onclick=()=>{if(state&&state.index<state.pages.length-1){state.index++;preview();}};
 $('catalogExportRetry').onclick=()=>{if(state){state.mirrors=null;build();}};
 $('catalogExportShare').onclick=share;
 $('catalogExportOverlay').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
  if(event.key!=='Tab')return;
  const controls=[...$('catalogExportOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
}
function release(context){if(!context)return;for(const url of context.urls||[])URL.revokeObjectURL(url);context.urls=[];}
function close(){epoch++;release(state);state=null;$('catalogExportOverlay').hidden=true;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';if(trigger?.isConnected)trigger.focus();}
function image(src){
 return new Promise(resolve=>{
  if(!src)return resolve(null);const img=new Image();let ended=false;
  const finish=value=>{if(ended)return;ended=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(value);};
  const timer=setTimeout(()=>finish(null),7000);img.crossOrigin='anonymous';img.onload=()=>finish(img.naturalWidth?img:null);img.onerror=()=>finish(null);img.src=src;
 });
}
function primary(product){
 let gallery=product.gallery;try{gallery=JSON.parse(gallery)}catch{}
 return String(product.image||(Array.isArray(gallery)?gallery[0]:String(gallery||'').split(/[\n,;|]/)[0])||'');
}
function validSource(src){return /^https:\/\//i.test(src)||/^assets\/(?:products|catalog)\/[\w.-]+$/.test(src);}
async function photos(context,products){
 const loaded=new Map(),missing=[];
 await Promise.all(products.map(async product=>{
  const raw=primary(product),mirror=context.mirrors?.[product.id],src=mirror&&mirror.source===raw&&/^assets\/catalog\/[a-f0-9]{24}\.(?:jpg|png|webp|gif)$/.test(mirror.path)?mirror.path:raw;
  const img=await image(validSource(src)?src:'');if(img)loaded.set(product.id,img);else if(raw)missing.push(product);
 }));
 if(missing.length&&context.photoLoader){
  try{
   const results=await context.photoLoader(missing.map(p=>p.id));
   await Promise.all(results.filter(item=>missing.some(p=>p.id===item.id)&&/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(item.data||'')&&item.data.length<=900000).map(async item=>{const img=await image(item.data);if(img)loaded.set(item.id,img);}));
  }catch(error){}
 }
 return loaded;
}
function rounded(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function text(ctx,value,x,y,width,lines=1,lineHeight=34){
 const words=String(value||'').trim().split(/\s+/),output=[];let line='';
 for(const word of words){
  const next=line?line+' '+word:word;
  if(ctx.measureText(next).width>width&&line){output.push(line);line=word;}else line=next;
 }
 if(line)output.push(line);
 output.slice(0,lines).forEach((value,index)=>{
  if(index===lines-1&&output.length>lines)value+='…';
  while(ctx.measureText(value).width>width&&value.length>1)value=value.slice(0,-2)+'…';
  ctx.fillText(value,x,y+index*lineHeight);
 });
}
function contain(ctx,img,x,y,w,h){if(!img)return;const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
function draw(context,products,loaded,index,count,logo){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d',{alpha:false});
 const margin=80,inner=W-2*margin,gap=32,bodyTop=296,bodyHeight=1480;
 ctx.fillStyle='#f2f5f8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,264);
 if(logo)contain(ctx,logo,margin,48,104,104);
 const brandX=logo?margin+128:margin;ctx.fillStyle='#162d45';ctx.font='800 37px Arial';ctx.fillText('GAMER COMAYAGUA',brandX,92);ctx.font='22px Arial';ctx.fillStyle='#667e95';ctx.fillText('Comayagua, Honduras · Gaming y tecnología',brandX,132);
 ctx.fillStyle='#152f48';ctx.font='800 46px Arial';text(ctx,context.title,margin,222,W-440,1,50);
 ctx.fillStyle='#657c93';ctx.font='21px Arial';ctx.textAlign='right';ctx.fillText(`${context.count} productos · ${index+1}/${count}`,W-margin,222);ctx.textAlign='left';ctx.fillStyle='#be292b';ctx.fillRect(margin,257,80,5);
 const columns=products.length===1?1:2,rows=Math.ceil(products.length/columns),w=(inner-(columns-1)*gap)/columns,h=(bodyHeight-(rows-1)*gap)/rows;
 products.forEach((product,i)=>{
  const centered=products.length%2===1&&i===products.length-1;
  const x=centered?(W-w)/2:margin+(i%columns)*(w+gap),y=bodyTop+Math.floor(i/columns)*(h+gap),pad=32;
  rounded(ctx,x,y,w,h,22,'#fff','#dce5ee');
  const img=loaded.get(product.id),photoHeight=h-250;
  if(img)contain(ctx,img,x+pad,y+28,w-2*pad,photoHeight);
  else{rounded(ctx,x+pad,y+28,w-2*pad,photoHeight,12,'#f4f7fa');ctx.fillStyle='#7b8da0';ctx.font='24px Arial';ctx.textAlign='center';ctx.fillText('Foto no disponible',x+w/2,y+28+photoHeight/2);ctx.textAlign='left';}
  ctx.fillStyle='#1c354c';ctx.font='700 26px Arial';text(ctx,product.name,x+pad,y+h-180,w-2*pad,2,35);
  const price=C.unitPrice(product,1),promo=price<product.price;
  if(context.prices){
   ctx.fillStyle='#172f48';ctx.font='800 43px Arial';ctx.fillText(C.money(price),x+pad,y+h-88);
   if(promo){ctx.font='20px Arial';const old=C.money(product.price),width=ctx.measureText(old).width;ctx.fillStyle='#8090a0';ctx.fillText(old,x+pad,y+h-61);ctx.fillRect(x+pad,y+h-68,width,1.5);}
  }else{ctx.fillStyle='#456780';ctx.font='23px Arial';ctx.fillText('Consultá el precio',x+pad,y+h-88);}
  const available=product.stock>0,label=available?`${product.stock} disponible${product.stock===1?'':'s'}`:'Agotado';ctx.font='600 19px Arial';const pillWidth=ctx.measureText(label).width+30;
  rounded(ctx,x+w-pillWidth-pad,y+h-121,pillWidth,42,11,available?'#e7f4ed':'#eef1f4');ctx.fillStyle=available?'#287454':'#6f7e8d';ctx.fillText(label,x+w-pillWidth-pad+15,y+h-93);
  ctx.font='18px Arial';ctx.fillStyle='#75899c';text(ctx,product.code||product.category,x+pad,y+h-34,w-2*pad,1,22);
 });
 // El contacto y las condiciones tienen su propio espacio y margen inferior.
 const footerTop=1816,footerHeight=152;
 rounded(ctx,margin,footerTop,inner,footerHeight,18,'#fff','#dce5ee');
 const phone=String(context.settings.whatsapp||'50431517755').replace(/\D/g,''),formatted=phone.replace(/^(504)(\d{4})(\d{4})$/,'+$1 $2-$3');
 ctx.fillStyle='#27815b';ctx.font='700 18px Arial';ctx.fillText('WHATSAPP',margin+32,footerTop+38);
 ctx.fillStyle='#203b54';ctx.font='700 30px Arial';ctx.fillText(formatted,margin+32,footerTop+77);
 ctx.textAlign='right';ctx.fillStyle='#75899c';ctx.font='18px Arial';ctx.fillText('CATÁLOGO ACTUALIZADO',W-margin-32,footerTop+38);ctx.fillStyle='#365169';ctx.font='24px Arial';ctx.fillText(context.date,W-margin-32,footerTop+77);ctx.textAlign='left';
 ctx.fillStyle='#e5ebf0';ctx.fillRect(margin+32,footerTop+98,inner-64,1);
 ctx.fillStyle='#6b8093';ctx.font='20px Arial';text(ctx,'Precios y existencias sujetos a confirmación. Consultá envío y formas de pago.',margin+32,footerTop+129,inner-64,1,26);
 return canvas;
}
const blob=(canvas,type,quality)=>new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('El navegador no pudo crear el archivo.')),type,quality));
function pdf(pages,url){
 const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const append=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);length+=bytes.byteLength;};
 const object=(id,body)=>{offsets[id]=length;append(id+' 0 obj\n');append(body);append('\nendobj\n');};
 append('%PDF-1.4\n');append(new Uint8Array([37,226,227,207,211,10]));
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>(3+i*4)+' 0 R').join(' ')}] >>`);
 const link=String(url||'').replace(/[^\x20-\x7e]/g,'').replace(/[\\()]/g,'\\$&');
 pages.forEach((page,i)=>{
  const id=3+i*4,scale=Math.min(564/W,744/H),width=W*scale,height=H*scale,left=(612-width)/2,bottom=(792-height)/2,command=`q ${width} 0 0 ${height} ${left} ${bottom} cm /Im0 Do Q\n`;
  const linkBottom=bottom+(H-1968)*scale,linkTop=bottom+(H-1816)*scale;
  object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${id+2} 0 R >> >> /Contents ${id+1} 0 R /Annots [${id+3} 0 R] >>`);
  object(id+1,`<< /Length ${command.length} >>\nstream\n${command}endstream`);
  offsets[id+2]=length;append(`${id+2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`);append(page.jpeg);append('\nendstream\nendobj\n');
  object(id+3,`<< /Type /Annot /Subtype /Link /Rect [${left+80*scale} ${linkBottom} ${left+(W-80)*scale} ${linkTop}] /Border [0 0 0] /A << /S /URI /URI (${link}) >> >>`);
 });
 const xref=length;append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(let i=1;i<offsets.length;i++)append(String(offsets[i]).padStart(10,'0')+' 00000 n \n');append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'});
}
function updateDownloads(){
 const ready=state?.pages.length&&!state.busy,format=$('catalogExportFormat').value,asPdf=format==='pdf',page=state?.pages[state.index];
 const file=ready?(asPdf?state.pdfFile:page.file):null;
 $('catalogExportDownload').textContent=asPdf?'Descargar PDF completo':'Descargar imagen';$('catalogExportShare').textContent=asPdf?'Compartir PDF':'Compartir imagen';
 $('catalogExportDownload').setAttribute('aria-disabled',String(!file));
 if(file){$('catalogExportDownload').href=asPdf?state.pdfUrl:page.url;$('catalogExportDownload').download=file.name;$('catalogExportDownload').removeAttribute('tabindex');}else{$('catalogExportDownload').removeAttribute('href');$('catalogExportDownload').tabIndex=-1;}
 let supported=false;try{supported=!!(file&&navigator.canShare&&navigator.canShare({files:[file]}));}catch{}
 $('catalogExportShare').disabled=!supported;$('catalogExportShareHelp').textContent=file&&!supported?'Descargá el archivo y adjuntalo en WhatsApp o en la aplicación que prefirás.':'';
}
function preview(){
 const page=state?.pages[state.index];if(!page)return;
 $('catalogExportPreview').src=page.url;$('catalogExportPreview').alt=state.title+' · Página '+(state.index+1)+' de '+state.pages.length;$('catalogExportPreview').hidden=false;$('catalogExportEmpty').hidden=true;
 $('catalogExportPage').textContent=`Página ${state.index+1} de ${state.pages.length}`;$('catalogExportPrevious').disabled=state.index===0;$('catalogExportNext').disabled=state.index===state.pages.length-1;
 document.querySelector('.catalog-export-pages').hidden=state.pages.length<2;updateDownloads();
}
async function share(){
 if(!state||state.busy)return;const file=$('catalogExportFormat').value==='pdf'?state.pdfFile:state.pages[state.index]?.file;if(!file)return;
 try{await navigator.share({files:[file],title:'Gamer Comayagua · '+state.title});}
 catch(error){if(error.name!=='AbortError')$('catalogExportShareHelp').textContent='No se pudo abrir el menú para compartir. Usá Descargar y adjuntá el archivo.';}
}
async function build(){
 const context=state;if(!context)return;const ticket=++epoch;context.busy=true;release(context);context.pages=[];context.index=0;context.prices=$('catalogExportPrices').checked;$('catalogExportPricesHelp').hidden=context.prices;
 const selected=context.products.filter(p=>$('catalogExportOut').checked||p.stock>0);context.count=selected.length;
 $('catalogExportCount').textContent=selected.length+' productos · '+Math.ceil(selected.length/SIZE)+' página'+(selected.length>SIZE?'s':'');
 $('catalogExportPreview').hidden=true;$('catalogExportEmpty').hidden=false;$('catalogExportEmpty').textContent=selected.length?'Preparando fotos y páginas…':'No hay productos con esta selección.';
 $('catalogExportRetry').hidden=true;$('catalogExportStatus').textContent='Preparando catálogo…';document.querySelector('.catalog-export-pages').hidden=true;
 $('catalogExportPrices').disabled=true;$('catalogExportOut').disabled=true;updateDownloads();
 let missing=0;
 try{
  if(!selected.length){$('catalogExportStatus').textContent='Incluí agotados o elegí otra categoría.';return;}
  if(!context.mirrors){try{const response=await fetch('data/catalogo-fotos.json',{cache:'no-cache'});context.mirrors=response.ok?(await response.json()).images||{}:{};}catch{context.mirrors={};}}
  const logo=await image(context.logo||'assets/img/logo-rojo.webp'),count=Math.ceil(selected.length/SIZE);
  for(let index=0;index<count;index++){
   if(ticket!==epoch)return;$('catalogExportStatus').textContent=`Preparando página ${index+1} de ${count}…`;
   const entries=selected.slice(index*SIZE,(index+1)*SIZE),loaded=await photos(context,entries);if(ticket!==epoch)return;
   missing+=entries.filter(p=>!loaded.has(p.id)).length;
   const canvas=draw(context,entries,loaded,index,count,logo),png=await blob(canvas,'image/png'),jpeg=await blob(canvas,'image/jpeg',.9);canvas.width=1;canvas.height=1;
   if(ticket!==epoch)return;
   const url=URL.createObjectURL(png);context.urls.push(url);context.pages.push({url,file:new File([png],context.filename+'_'+String(index+1).padStart(2,'0')+'.png',{type:'image/png'}),jpeg:new Uint8Array(await jpeg.arrayBuffer())});
  }
  if(ticket!==epoch)return;
  const contact='https://wa.me/'+String(context.settings.whatsapp||'50431517755').replace(/\D/g,'');
  const output=pdf(context.pages,contact);context.pdfFile=new File([output],context.filename+'.pdf',{type:'application/pdf'});context.pdfUrl=URL.createObjectURL(output);context.urls.push(context.pdfUrl);
  $('catalogExportStatus').textContent=missing?`${missing} foto${missing===1?' no se pudo':'s no se pudieron'} incluir. Podés reintentar antes de compartir.`:'Catálogo listo para descargar o compartir.';$('catalogExportRetry').hidden=!missing;
  context.busy=false;preview();
 }catch(error){if(ticket===epoch){release(context);context.pages=[];$('catalogExportEmpty').textContent='No se pudo crear el catálogo.';$('catalogExportStatus').textContent=error.message;$('catalogExportRetry').hidden=false;}}
 finally{if(ticket===epoch){context.busy=false;$('catalogExportPrices').disabled=false;$('catalogExportOut').disabled=false;updateDownloads();}}
}
function open(options){
 setup();release(state);trigger=document.activeElement;
 const products=(options.products||[]).map(C.cleanProduct).filter(p=>p.active&&p.id&&p.name);
 const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Tegucigalpa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=type=>parts.find(p=>p.type===type).value;
 state={...options,products,title:String(options.title||'Catálogo').slice(0,120),date:new Intl.DateTimeFormat('es-HN',{timeZone:'America/Tegucigalpa',dateStyle:'medium'}).format(now),filename:'GC_Catalogo_'+slug(options.title)+'_'+part('year')+part('month')+part('day'),pages:[],urls:[],index:0,busy:true,settings:options.settings||{},mirrors:null};
 $('catalogExportCategory').textContent=state.title;$('catalogExportOut').checked=options.includeOut!==false;$('catalogExportPrices').checked=true;$('catalogExportFormat').value='image';$('catalogExportOverlay').hidden=false;document.body.style.overflow='hidden';$('catalogExportClose').focus();build();
}
window.GC_CATALOG_EXPORT={open};
})();
