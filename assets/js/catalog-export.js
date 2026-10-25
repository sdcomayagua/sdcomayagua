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
 return {canvas,ops,box,label,photo,link};
}
function productUrl(context,product){try{const url=new URL('productos.html',context.url||document.baseURI);url.searchParams.set('producto',product.id);return url.href;}catch{return '';}}
function draw(context,products,loaded,index,count,logo){
 const page=artist(),{box,label,photo,link}=page,margin=72,inner=W-margin*2,gap=28,ink='#172333',muted='#657386',red='#c72835';
 box(0,0,W,H,'#f3f4f6');box(0,0,W,292,'#111b29');box(0,0,W,10,red);
 if(logo){box(margin-2,35,116,116,'#ffffff','',10);photo(logo,margin+3,40,106,106);}
 const brandX=logo?margin+137:margin;
 label('GAMER COMAYAGUA',brandX,85,{size:35,bold:true,color:'#ffffff',width:930});
 label('GAMING · TECNOLOGÍA · ACCESORIOS',brandX,122,{size:18,color:'#abb8ca',width:930});
 label('CATÁLOGO / '+context.year,W-margin,68,{size:19,bold:true,color:'#ffffff',align:'right',width:300});
 label(context.date,W-margin,104,{size:19,color:'#abb8ca',align:'right',width:300});
 label(context.title,margin,226,{size:59,bold:true,color:'#ffffff',width:inner-100,fit:true});
 box(margin,252,52,5,red);
 const categories=[...new Set(products.map(p=>p.category).filter(Boolean))],subtitle=context.multipleCategories?categories.join('  /  '):`${context.count} producto${context.count===1?'':'s'} · ${context.prices?'Precios en lempiras':'Consultá precios y disponibilidad'}`;
 label(subtitle,margin+75,265,{size:21,color:'#bdc8d8',width:inner-80,fit:true});
 const columns=products.length<=2?1:2,rows=Math.ceil(products.length/columns),compact=rows===3,solo=rows===1,bodyTop=326,bodyHeight=1390,w=(inner-(columns-1)*gap)/columns,h=rows===1?1120:(bodyHeight-(rows-1)*gap)/rows,top=rows===1?bodyTop+(bodyHeight-h)/2:bodyTop;
 products.forEach((product,i)=>{
  const centered=columns===2&&products.length%2===1&&i===products.length-1;
  const x=centered?(W-w)/2:margin+(i%columns)*(w+gap),y=top+Math.floor(i/columns)*(h+gap);
  const pad=columns===1?34:22,imageW=Math.round(w*(columns===1?.52:.54)),imageH=h-2*pad;
  const photoX=x+pad,photoY=y+pad,infoX=photoX+imageW+(columns===1?30:19),infoW=x+w-pad-infoX;
  box(x,y+4,w,h,'#e7eaf0','',16);box(x,y,w,h,'#ffffff','#dee4ec',16);
  box(photoX,photoY,imageW,imageH,'#f8fafc','',10);
  const img=loaded.get(product.id);
  if(img)photo(img,photoX+5,photoY+5,imageW-10,imageH-10);
  else{
   label('FOTO NO DISPONIBLE',photoX+imageW/2,photoY+imageH/2,{size:columns===1?23:18,color:muted,width:imageW-25,align:'center'});
   label('Consultá por WhatsApp',photoX+imageW/2,photoY+imageH/2+30,{size:columns===1?19:15,color:muted,width:imageW-25,align:'center'});
  }
  const categoryY=y+(compact?48:solo?106:68),titleY=y+(compact?85:solo?182:124);
  label(String(product.category||'PRODUCTO').toLocaleUpperCase('es'),infoX,categoryY,{size:columns===1?18:14,bold:true,color:red,width:infoW,fit:true});
  label(product.name,infoX,titleY,{size:solo?44:columns===1?35:compact?22:27,bold:true,color:ink,width:infoW,lines:solo?4:3,lineHeight:solo?56:columns===1?45:compact?29:35});
  const detail=product.details||{};
  let description=String(product.description||detail.included||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(description.toLocaleLowerCase('es').startsWith(product.name.toLocaleLowerCase('es')))description=description.slice(product.name.length).replace(/^[\s.,:;-]+/,'');
  if(!description&&detail.technology)description=String(detail.technology);
  const detailsY=y+(compact?188:solo?465:268),descriptionLines=solo?11:columns===1?6:compact?3:6;
  if(description)label(description,infoX,detailsY,{size:solo?24:columns===1?21:compact?16:18,color:'#536177',width:infoW,lines:descriptionLines,lineHeight:solo?35:columns===1?30:compact?23:27});
  if((!description||columns===1)&&detail.technology){
   const techY=description?detailsY+(solo?335:190):detailsY;
   if(techY<y+h-220)label(String(detail.technology),infoX,techY,{size:columns===1?19:16,bold:true,color:'#314a67',width:infoW,lines:2,lineHeight:25});
  }
  const price=C.unitPrice(product,1),promo=price>0&&price<product.price,priceY=y+h-(solo?170:columns===1?132:compact?118:139);
  if(context.prices&&price>0){
   if(promo)label('Antes '+C.money(product.price),infoX,priceY-39,{size:columns===1?19:15,color:muted,width:infoW});
   label(C.money(price),infoX,priceY,{size:solo?61:columns===1?48:compact?35:42,bold:true,color:ink,width:infoW,fit:true});
  }else label('Consultá el precio',infoX,priceY,{size:columns===1?32:compact?20:26,bold:true,color:ink,width:infoW,fit:true});
  const available=product.stock>0,status=available?String(product.stock)+' disponible'+(product.stock===1?'':'s'):'AGOTADO';
  const pillW=Math.min(infoW,Math.max(120,available?184:127)),pillY=priceY+(columns===1?24:20);
  box(infoX,pillY,pillW,34,available?'#e8f3ed':'#eef0f3','',7);
  label(status,infoX+pillW/2,pillY+23,{size:columns===1?16:14,bold:true,color:available?'#297451':'#718093',width:pillW-10,align:'center',fit:true});
  label('CÓD. '+(product.code||product.id),infoX,y+h-24,{size:columns===1?18:compact?14:16,color:muted,width:infoW,fit:true});
  link(x,y,w,h,productUrl(context,product));
 });
 // Pie de contacto con área propia, márgenes amplios y enlace en el PDF.
 const footerY=1758,phone=String(context.settings.whatsapp||'50431517755').replace(/\D/g,''),formatted=phone.replace(/^(504)(\d{4})(\d{4})$/,'+$1 $2-$3');
 box(margin,footerY,inner,126,'#111b29','',15);box(margin,footerY+27,5,72,red);
 label('HABLEMOS POR WHATSAPP',margin+32,footerY+37,{size:16,bold:true,color:'#aebdd0',width:600});
 label(formatted,margin+32,footerY+83,{size:38,bold:true,color:'#ffffff',width:600});
 label('Comayagua, Honduras',W-margin-32,footerY+43,{size:23,bold:true,color:'#ffffff',width:560,align:'right'});
 label('Consultá envío y formas de pago',W-margin-32,footerY+80,{size:20,color:'#b3c0d0',width:560,align:'right'});
 link(margin,footerY,inner,126,'https://wa.me/'+phone);
 label('Precios y existencias sujetos a confirmación.',margin,1926,{size:19,color:muted,width:1080});
 label(String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0'),W-margin,1926,{size:20,bold:true,color:ink,width:240,align:'right'});
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
