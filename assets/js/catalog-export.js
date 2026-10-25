/* Catálogo público en PNG y PDF. Las fotos y los datos comerciales originales se conservan. */
(function(){'use strict';
const C=window.GC,$=id=>document.getElementById(id),W=1530,H=1980,SCALE=2;
let state=null,epoch=0,trigger=null,fontReady=null;
function fonts(){
 if(!fontReady)fontReady=(async()=>{
  if(!window.GC_CATALOG_FONTS)throw Error('No se pudo cargar la tipografía. Recargá la página.');
  for(const [name,font] of Object.entries(window.GC_CATALOG_FONTS)){
   const bytes=Uint8Array.from(atob(font.data),char=>char.charCodeAt(0)),face=new FontFace('GC Catalog',bytes,{weight:name==='bold'?'700':'400'});
   document.fonts.add(await face.load());
  }
 })().catch(error=>{fontReady=null;throw error;});
 return fontReady;
}
const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,65)||'Productos';
function setup(){
 if($('catalogExportOverlay'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="overlay catalog-export-overlay" id="catalogExportOverlay" hidden><section class="dialog catalog-export-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogExportTitle"><div class="dialog-head"><div><p class="catalog-export-eyebrow">PARA TUS CLIENTES</p><h2 id="catalogExportTitle">Compartir categoría</h2></div><button type="button" class="icon" id="catalogExportClose" aria-label="Cerrar catálogo">×</button></div><div class="catalog-export-layout"><section class="catalog-export-controls"><h3 id="catalogExportCategory"></h3><p id="catalogExportCount"></p><div class="catalog-export-options"><label><input type="checkbox" id="catalogExportPrices" checked>Mostrar precios</label><label><input type="checkbox" id="catalogExportOut" checked>Incluir agotados</label><label id="catalogExportGroupLabel" hidden><input type="checkbox" id="catalogExportGroup" checked>Ordenar por categoría</label></div><p class="catalog-export-help" id="catalogExportPricesHelp" hidden>Los precios escritos dentro de las fotos seguirán visibles; forman parte de la imagen original.</p><label class="catalog-export-label" for="catalogExportDensity">Distribución</label><select class="field" id="catalogExportDensity"><option value="2">2 productos · fotos extra grandes</option><option value="4">4 productos · fotos grandes</option><option value="6">6 productos · compacto</option></select><p class="catalog-export-quality">Alta resolución · 3060 × 3960 px</p><label class="catalog-export-label" for="catalogExportFormat">Formato</label><select class="field" id="catalogExportFormat"><option value="image">Imagen PNG · página actual</option><option value="pdf">PDF · catálogo completo</option></select><p class="catalog-export-status" id="catalogExportStatus" role="status" aria-live="polite"></p><button type="button" class="btn outline" id="catalogExportRetry" hidden>Reintentar fotos</button><a class="btn" id="catalogExportDownload" aria-disabled="true">Descargar imagen</a><button type="button" class="btn outline" id="catalogExportShare" disabled>Compartir imagen</button><p class="catalog-export-help" id="catalogExportShareHelp"></p><p class="catalog-export-help">La imagen incluye la página que estás viendo. El PDF reúne todas las páginas. Las fotos se muestran completas. El PDF conserva el texto nítido y permite tocar cada producto para abrir su ficha.</p></section><section class="catalog-export-preview" aria-label="Vista previa del catálogo"><div class="catalog-export-preview-empty" id="catalogExportEmpty">Preparando tu catálogo…</div><img id="catalogExportPreview" alt="Vista previa del catálogo" hidden><nav class="catalog-export-pages" aria-label="Páginas del catálogo" hidden><button type="button" class="btn outline" id="catalogExportPrevious" aria-label="Página anterior">←</button><span id="catalogExportPage" role="status"></span><button type="button" class="btn outline" id="catalogExportNext" aria-label="Página siguiente">→</button></nav></section></div></section></div>`);
 $('catalogExportClose').onclick=close;
 $('catalogExportOverlay').onclick=event=>{if(event.target===$('catalogExportOverlay'))close();};
 for(const id of ['catalogExportPrices','catalogExportOut','catalogExportGroup','catalogExportDensity'])$(id).onchange=build;
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
// Una sola composición dibuja el PNG y describe los elementos vectoriales del PDF.
function artist(){
 const canvas=document.createElement('canvas');canvas.width=W*SCALE;canvas.height=H*SCALE;
 const ctx=canvas.getContext('2d',{alpha:false});ctx.scale(SCALE,SCALE);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const ops=[];
 const box=(x,y,w,h,fill,stroke='',r=0)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}ops.push({kind:'box',x,y,w,h,r,fill,stroke});};
 const label=(value,x,y,{size=24,bold=false,color='#1b2636',width=W,lines=1,lineHeight=size*1.28,align='left',fit=false}={})=>{
  value=String(value||'').trim();const font=()=>{ctx.font=`${bold?'700':'400'} ${size}px "GC Catalog", Arial`;};font();
  if(fit){while(size>16&&ctx.measureText(value).width>width){size--;font();}}
  const words=value.split(/\s+/),rows=[];let row='';
  for(const word of words){const next=row?row+' '+word:word;if(ctx.measureText(next).width>width&&row){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);
  rows.slice(0,lines).forEach((line,index)=>{
   if(index===lines-1&&rows.length>lines)line+='…';
   while(ctx.measureText(line).width>width&&line.length>1)line=line.slice(0,-2)+'…';
   const left=align==='right'?x-ctx.measureText(line).width:align==='center'?x-ctx.measureText(line).width/2:x;
   ctx.fillStyle=color;ctx.fillText(line,left,y+index*lineHeight);ops.push({kind:'text',value:line,x:left,y:y+index*lineHeight,size,bold,color});
  });
 };
 const photo=(img,x,y,w,h)=>{if(!img)return;const s=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*s,dh=img.naturalHeight*s,left=x+(w-dw)/2,top=y+(h-dh)/2;ctx.drawImage(img,left,top,dw,dh);ops.push({kind:'image',img,x:left,y:top,w:dw,h:dh});};
 const link=(x,y,w,h,url)=>ops.push({kind:'link',x,y,w,h,url});
 const watermark=(x,y,w,h,settings)=>{
  const helper=window.GC_WATERMARK,o=helper?.options(settings);
  if(!o?.watermarkEnabled||o.watermarkFontSize<=0||o.watermarkCount<=0||o.watermarkOpacity<=0)return;
  const text=o.watermarkText,face=helper.fonts[o.watermarkFont],size=o.watermarkFontSize*w/1000,alpha=o.watermarkOpacity;
  const marks=helper.positions(o.watermarkCount);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='difference';
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=face.weight+' '+size+'px '+(o.watermarkFont==='arial'?'"GC Catalog", Arial':face.css);
  const measured=ctx.measureText(text).width;
  for(const [u,v] of marks){
   const xx=x+w*u/1000,yy=y+h*v/1000;
   ctx.save();ctx.translate(xx,yy);ctx.rotate(-27*Math.PI/180);ctx.fillText(text,0,0);ctx.restore();
   ops.push({kind:'watermark',x:xx,y:yy,value:text,size,angle:-27,alpha,font:o.watermarkFont,textWidth:measured,clip:{x,y,w,h}});
  }
  ctx.restore();
 };
 return {canvas,ops,box,label,photo,link,watermark};
}
function productUrl(context,product){try{const url=new URL('productos.html',context.url||document.baseURI);url.searchParams.set('producto',product.id);return url.href;}catch{return '';}}
function draw(context,products,loaded,index,count,logo){
 const page=artist(),{box,label,photo,link,watermark}=page;
 const margin=72,inner=W-margin*2,gap=18;
 const ink='#17283d',muted='#64778b',red='#cf263b',navy='#111d2e',paper='#f2f5f9';
 const settings=context.settings||{};
 // Cabecera editorial de menor altura: identidad, categoría y número del catálogo.
 box(0,0,W,H,paper);
 box(0,0,W,258,navy);
 box(0,0,W,9,red);
 box(margin,34,98,98,'#ffffff','',12);
 if(logo)photo(logo,margin+5,39,88,88);
 const bx=margin+124;
 label('GAMER COMAYAGUA',bx,80,{size:36,bold:true,color:'#ffffff',width:890,fit:true});
 label('GAMING · TECNOLOGÍA · ACCESORIOS',bx,117,{size:19,color:'#b2c3d6',width:890});
 label('CATÁLOGO '+context.year,W-margin,78,{size:19,bold:true,color:'#ffffff',width:270,align:'right',fit:true});
 label(context.date,W-margin,113,{size:18,color:'#b2c3d6',width:270,align:'right'});
 box(margin,154,5,77,red);
 label(context.title,margin+23,200,{size:62,bold:true,color:'#ffffff',width:inner-80,fit:true});
 const categories=[...new Set(products.map(p=>p.category).filter(Boolean))];
 const subtitle=context.multipleCategories?categories.join('  ·  '):context.count+' producto'+(context.count===1?'':'s')+'  ·  '+(context.prices?'Precios en lempiras':'Consultá precios y disponibilidad');
 label(subtitle,margin+25,237,{size:19,color:'#b6c6d7',width:inner-80,fit:true});
 // El área de productos ocupa todo el espacio entre la cabecera y el pie.
 // Hasta cuatro artículos: una ficha horizontal por fila. De cinco a seis: dos columnas.
 const n=products.length,columns=n>=5?2:1,rows=Math.ceil(n/columns);
 const bodyTop=286,bodyBottom=1736;
 const rowGap=18,colGap=22,slotH=(bodyBottom-bodyTop-(rows-1)*rowGap)/rows;
 const regularW=(inner-(columns-1)*colGap)/columns;
 products.forEach((product,i)=>{
  const lastFull=columns===2&&n%2===1&&i===n-1;
  const wide=columns===1||lastFull;
  const col=columns===1?0:i%columns,row=columns===1?i:Math.floor(i/columns);
  const x=margin+(!wide?col*(regularW+colGap):0),y=bodyTop+row*(slotH+rowGap);
  const w=wide?inner:regularW,h=slotH;
  const pad=wide?22:20;
  box(x,y+4,w,h,'#dfe7f0','',16);
  box(x,y,w,h,'#ffffff','#dbe3eb',16);
  // La foto queda siempre cuadrada, con margen constante y sin recortarla.
  const imageSize=wide?Math.min(h-2*pad,n===1?740:n===2?590:455):Math.min(w*.47,h-137);
  const photoX=x+pad,photoY=y+pad,photoSize=Math.round(imageSize);
  box(photoX,photoY,photoSize,photoSize,'#f5f7fa','',10);
  const img=loaded.get(product.id);
  if(img){
   photo(img,photoX+6,photoY+6,photoSize-12,photoSize-12);
   watermark(photoX+6,photoY+6,photoSize-12,photoSize-12,settings);
  }else{
   label('FOTO NO DISPONIBLE',photoX+photoSize/2,photoY+photoSize/2,{size:19,color:muted,width:photoSize-18,align:'center',fit:true});
  }
  const price=C.unitPrice(product,1),promo=price>0&&price<product.price;
  const available=product.stock>0;
  const status=available?product.stock+' disponible'+(product.stock===1?'':'s'):'AGOTADO';
  const details=product.details||{};
  let description=String(product.description||details.included||details.technology||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(description.toLocaleLowerCase('es').startsWith(product.name.toLocaleLowerCase('es')))description=description.slice(product.name.length).replace(/^[\s.,:;-]+/,'');
  if(wide){
   // Tres áreas: imagen | información | precio, sin huecos entre secciones.
   const priceW=252,priceX=x+w-pad-priceW,detailsX=photoX+photoSize+28;
   const detailsW=Math.max(190,priceX-detailsX-26);
   box(priceX,y+15,priceW,h-30,'#f5f8fc','',12);
   box(priceX,y+15,5,h-30,red,'',3);
   const titleBase=y+(n===4?100:125);
   const titleSize=n===4?32:38,titleLine=n===4?42:48;
   label(String(product.category||'PRODUCTO').toLocaleUpperCase('es'),detailsX,y+48,{size:15,bold:true,color:red,width:detailsW,fit:true});
   label(product.name,detailsX,titleBase,{size:titleSize,bold:true,color:ink,width:detailsW,lines:3,lineHeight:titleLine});
   const descTop=n===4?y+215:n===3?y+258:y+290;
   const descLine=29,descMax=Math.max(0,Math.floor((y+h-37-descTop)/descLine)+1);
   if(description&&descMax>0)label(description,detailsX,descTop,{size:n===4?19:21,color:'#52677c',width:detailsW,lines:Math.min(descMax,7),lineHeight:descLine});
   label('PRECIO',priceX+24,y+55,{size:15,bold:true,color:muted,width:priceW-45});
   const priceY=y+(n===4?125:165);
   if(context.prices&&price>0){
    if(promo)label('Antes '+C.money(product.price),priceX+24,priceY-33,{size:17,color:muted,width:priceW-44,fit:true});
    label(C.money(price),priceX+24,priceY,{size:44,bold:true,color:ink,width:priceW-44,fit:true});
   }else label('Consultar',priceX+24,priceY,{size:30,bold:true,color:ink,width:priceW-44,fit:true});
   const pillW=Math.min(priceW-43,190),pillY=priceY+22;
   box(priceX+24,pillY,pillW,36,available?'#e0f2e9':'#e8edf3','',8);
   label(status,priceX+24+pillW/2,pillY+25,{size:15,bold:true,color:available?'#236847':'#64758a',align:'center',width:pillW-12,fit:true});
   box(priceX+24,y+h-75,priceW-48,1,'#dce5ed');
   label('CÓD. '+(product.code||product.id),priceX+24,y+h-37,{size:16,color:muted,width:priceW-40,fit:true});
  }else{
   // Formato compacto: precio, existencias y código en una banda inferior completa.
   const detailsX=photoX+photoSize+18,detailsW=x+w-pad-detailsX;
   label(String(product.category||'PRODUCTO').toLocaleUpperCase('es'),detailsX,y+51,{size:14,bold:true,color:red,width:detailsW,fit:true});
   label(product.name,detailsX,y+100,{size:26,bold:true,color:ink,width:detailsW,lines:3,lineHeight:33});
   const descTop=y+208,descBottom=y+h-124;
   const descLines=Math.max(0,Math.min(5,Math.floor((descBottom-descTop)/26)+1));
   if(description&&descLines>0)label(description,detailsX,descTop,{size:17,color:'#52677c',width:detailsW,lines:descLines,lineHeight:26});
   const bandX=x+pad,bandY=y+h-98,bandW=w-2*pad;
   box(bandX,bandY,bandW,76,'#f5f8fc','',10);
   box(bandX,bandY,5,76,red,'',3);
   if(context.prices&&price>0){
    if(promo)label('Antes '+C.money(product.price),bandX+20,bandY+18,{size:13,color:muted,width:170,fit:true});
    label(C.money(price),bandX+20,bandY+60,{size:37,bold:true,color:ink,width:215,fit:true});
   }else label('Consultar',bandX+20,bandY+57,{size:27,bold:true,color:ink,width:195,fit:true});
   const pillW=Math.min(160,Math.max(110,bandW*.25));
   box(bandX+245,bandY+14,pillW,30,available?'#e0f2e9':'#e8edf3','',6);
   label(status,bandX+245+pillW/2,bandY+35,{size:13,bold:true,color:available?'#236847':'#64758a',width:pillW-10,align:'center',fit:true});
   label('CÓD. '+(product.code||product.id),bandX+bandW-16,bandY+63,{size:14,color:muted,width:230,align:'right',fit:true});
  }
  link(x,y,w,h,productUrl(context,product));
 });
 // Pie integrado, sin franjas vacías ni elementos repetidos.
 const footerY=1773,footerH=124;
 const phone=String(settings.whatsapp||'50431517755').replace(/\D/g,'');
 const formatted=phone.replace(/^(504)(\d{4})(\d{4})$/,'+$1 $2-$3');
 box(margin,footerY,inner,footerH,navy,'',14);
 box(margin,footerY+18,6,footerH-36,red,'',3);
 label('PEDIDOS Y CONSULTAS POR WHATSAPP',margin+36,footerY+39,{size:17,bold:true,color:'#a9bfd2',width:650});
 label(formatted,margin+36,footerY+93,{size:43,bold:true,color:'#ffffff',width:680,fit:true});
 label('GAMER COMAYAGUA',W-margin-30,footerY+50,{size:25,bold:true,color:'#ffffff',width:530,align:'right'});
 label('Comayagua · Envíos a toda Honduras',W-margin-30,footerY+88,{size:19,color:'#b6c6d7',width:560,align:'right'});
 link(margin,footerY,inner,footerH,'https://wa.me/'+phone);
 label('Precios y existencias sujetos a confirmación.',margin,1945,{size:17,color:muted,width:1080});
 label(String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0'),W-margin,1945,{size:20,bold:true,color:ink,width:220,align:'right'});
 return page;
}
const blob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('El navegador no pudo crear el archivo.')),'image/png'));
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
 const count=state.busy?state.pageCount:state.pages.length;
 $('catalogExportPreview').src=page.url;$('catalogExportPreview').alt=state.title+' · Página '+(state.index+1)+' de '+count;$('catalogExportPreview').hidden=false;$('catalogExportEmpty').hidden=true;
 $('catalogExportPage').textContent=`Página ${state.index+1} de ${count}`;$('catalogExportPrevious').disabled=state.index===0;$('catalogExportNext').disabled=state.index===state.pages.length-1;
 document.querySelector('.catalog-export-pages').hidden=state.busy||state.pages.length<2;updateDownloads();
}
async function share(){
 if(!state||state.busy)return;const file=$('catalogExportFormat').value==='pdf'?state.pdfFile:state.pages[state.index]?.file;if(!file)return;
 try{await navigator.share({files:[file],title:'Gamer Comayagua · '+state.title});}
 catch(error){if(error.name!=='AbortError')$('catalogExportShareHelp').textContent='No se pudo abrir el menú para compartir. Usá Descargar y adjuntá el archivo.';}
}
async function build(){
 const context=state;if(!context)return;const ticket=++epoch;context.busy=true;release(context);context.pages=[];context.index=0;context.prices=$('catalogExportPrices').checked;$('catalogExportPricesHelp').hidden=context.prices;
 const size=[2,4,6].includes(Number($('catalogExportDensity').value))?Number($('catalogExportDensity').value):4,selected=context.products.filter(p=>$('catalogExportOut').checked||p.stock>0);if($('catalogExportGroup').checked&&context.multipleCategories)selected.sort((a,b)=>a.category.localeCompare(b.category,'es'));context.count=selected.length;
 $('catalogExportCount').textContent=selected.length+' producto'+(selected.length===1?'':'s')+' · '+Math.ceil(selected.length/size)+' página'+(selected.length>size?'s':'');
 $('catalogExportPreview').hidden=true;$('catalogExportEmpty').hidden=false;$('catalogExportEmpty').textContent=selected.length?'Preparando fotos y páginas…':'No hay productos con esta selección.';
 $('catalogExportRetry').hidden=true;$('catalogExportStatus').textContent='Preparando catálogo…';document.querySelector('.catalog-export-pages').hidden=true;
 for(const id of ['catalogExportPrices','catalogExportOut','catalogExportGroup','catalogExportDensity'])$(id).disabled=true;updateDownloads();
 let missing=0;const pdfImages=new Map();
 try{
  if(!selected.length){$('catalogExportStatus').textContent='Incluí agotados o elegí otra categoría.';return;}
  if(!window.GC_CATALOG_PDF)throw Error('No se pudo cargar el generador PDF. Recargá la página.');
  await fonts();if(ticket!==epoch)return;
  if(!context.mirrors){try{const response=await fetch('data/catalogo-fotos.json',{cache:'no-cache'});context.mirrors=response.ok?(await response.json()).images||{}:{};}catch{context.mirrors={};}}
  const logo=await image(context.logo||'assets/img/logo-rojo.webp'),count=Math.ceil(selected.length/size);context.pageCount=count;
  let pendingPhotos=photos(context,selected.slice(0,size));
  for(let index=0;index<count;index++){
   if(ticket!==epoch)return;$('catalogExportStatus').textContent=`Preparando página ${index+1} de ${count}…`;
   const entries=selected.slice(index*size,(index+1)*size),loaded=await pendingPhotos;if(ticket!==epoch)return;
   if(index+1<count)pendingPhotos=photos(context,selected.slice((index+1)*size,(index+2)*size));
   missing+=entries.filter(p=>!loaded.has(p.id)).length;
   const page=draw(context,entries,loaded,index,count,logo),png=await blob(page.canvas);page.canvas.width=1;page.canvas.height=1;
   await window.GC_CATALOG_PDF.prepare(page,pdfImages);
   if(ticket!==epoch)return;
   const url=URL.createObjectURL(png);context.urls.push(url);context.pages.push({url,file:new File([png],context.filename+'_'+String(index+1).padStart(2,'0')+'.png',{type:'image/png'}),ops:page.ops});
   if(index===0)preview();
  }
  if(ticket!==epoch)return;
  const contact='https://wa.me/'+String(context.settings.whatsapp||'50431517755').replace(/\D/g,'');
  $('catalogExportStatus').textContent='Preparando PDF de alta calidad…';
  const output=await window.GC_CATALOG_PDF.create(context.pages,{width:W,height:H,title:context.title,contact});for(const page of context.pages)delete page.ops;pdfImages.clear();if(ticket!==epoch)return;context.pdfFile=new File([output],context.filename+'.pdf',{type:'application/pdf'});context.pdfUrl=URL.createObjectURL(output);context.urls.push(context.pdfUrl);
  $('catalogExportStatus').textContent=missing?`${missing} foto${missing===1?' no se pudo':'s no se pudieron'} incluir. Podés reintentar antes de compartir.`:'Catálogo listo · PNG en alta resolución y PDF con texto nítido.';$('catalogExportRetry').hidden=!missing;
  context.busy=false;preview();
 }catch(error){if(ticket===epoch){release(context);context.pages=[];$('catalogExportPreview').hidden=true;$('catalogExportEmpty').hidden=false;$('catalogExportEmpty').textContent='No se pudo crear el catálogo.';$('catalogExportStatus').textContent=error.message;$('catalogExportRetry').hidden=false;}}
 finally{if(ticket===epoch){context.busy=false;for(const id of ['catalogExportPrices','catalogExportOut','catalogExportGroup','catalogExportDensity'])$(id).disabled=false;updateDownloads();}}
}
function open(options){
 setup();release(state);trigger=document.activeElement;
 const products=(options.products||[]).map(C.cleanProduct).filter(p=>p.active&&p.id&&p.name);
 const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Tegucigalpa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=type=>parts.find(p=>p.type===type).value;
 state={...options,products,multipleCategories:new Set(products.map(p=>p.category)).size>1,year:part('year'),title:String(options.title||'Catálogo').slice(0,120),date:new Intl.DateTimeFormat('es-HN',{timeZone:'America/Tegucigalpa',dateStyle:'medium'}).format(now),filename:'GC_Catalogo_'+slug(options.title)+'_'+part('year')+part('month')+part('day'),pages:[],urls:[],index:0,busy:true,settings:options.settings||{},mirrors:null};
 $('catalogExportTitle').textContent=state.multipleCategories?'Compartir catálogo':'Compartir categoría';$('catalogExportCategory').textContent=state.title;$('catalogExportOut').checked=options.includeOut!==false;$('catalogExportPrices').checked=true;$('catalogExportFormat').value='image';$('catalogExportDensity').value='4';$('catalogExportGroup').checked=true;$('catalogExportGroupLabel').hidden=!state.multipleCategories;$('catalogExportOverlay').hidden=false;document.body.style.overflow='hidden';$('catalogExportClose').focus();build();
}
window.GC_CATALOG_EXPORT={open};
})();
