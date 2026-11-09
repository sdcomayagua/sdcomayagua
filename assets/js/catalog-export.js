/* Catálogo público en PNG y PDF. Las fotos y los datos comerciales originales se conservan. */
(function(){'use strict';
const C=window.GC,$=id=>document.getElementById(id),W=1530,H=1980,SCALE=2;
let state=null,epoch=0,trigger=null,fontReady=null,noteTimer=null;
let hiddenIds=new Set();
const buildInputs=['catalogExportPrices','catalogExportOut','catalogExportGroup','catalogExportDensity','catalogExportText'];
const textModes=['none','description','details','custom'],noteStorage='gcCatalogTextV1';
let extraText={mode:'none',layouts:{},notes:new Map()};
try{const saved=JSON.parse(localStorage.getItem(noteStorage)||'null');if(saved){extraText.mode=textModes.includes(saved.mode)?saved.mode:'none';extraText.layouts=Object.fromEntries(Object.entries(saved.layouts||{}).filter(([density,mode])=>['auto','2','4','6','9','12','16'].includes(density)&&textModes.includes(mode)));extraText.notes=new Map(Object.entries(saved.notes||{}).filter(([id,text])=>id&&typeof text==='string').map(([id,text])=>[id,text.slice(0,120)]));}}catch{}
function saveText(){try{localStorage.setItem(noteStorage,JSON.stringify({mode:extraText.mode,layouts:extraText.layouts,notes:Object.fromEntries(extraText.notes)}));}catch{}}
function layoutTextMode(density){return extraText.layouts[density]||(density===2?'description':extraText.mode==='description'?'none':extraText.mode);}
function changeDensity(){
 if(state)extraText.layouts[$('catalogExportDensity').value]=$('catalogExportText').value;
 $('catalogExportText').value=layoutTextMode($('catalogExportDensity').value==='auto'?'auto':Number($('catalogExportDensity').value));
 saveText();textEditor();build();
}
function textEditor(refresh=false){
 const select=$('catalogExportTextProduct'),old=select.value;
 if(refresh){select.replaceChildren(...state.products.map(product=>{const option=document.createElement('option');option.value=product.id;option.textContent=(product.code?product.code+' · ':'')+product.name;return option;}));if(state.products.some(p=>p.id===old))select.value=old;}
 $('catalogExportCustom').hidden=$('catalogExportText').value!=='custom';
 $('catalogExportTextHelp').textContent=$('catalogExportText').value==='none'?'El catálogo muestra nombre, precio y existencias.':$('catalogExportText').value==='description'?'Muestra la descripción registrada de cada producto.':$('catalogExportText').value==='details'?'Usa marca, modelo, material o medidas cuando estén registrados.':'El texto se conserva en este navegador y solo cambia el catálogo.';
 $('catalogExportCustomText').value=extraText.notes.get(select.value)||'';
 $('catalogExportTextCount').textContent=$('catalogExportCustomText').value.length+' / 120';
}
function scheduleText(){
 const id=$('catalogExportTextProduct').value,value=$('catalogExportCustomText').value.slice(0,120);
 if(value.trim())extraText.notes.set(id,value);else extraText.notes.delete(id);saveText();
 $('catalogExportTextCount').textContent=value.length+' / 120';
 clearTimeout(noteTimer);epoch++;if(state){state.busy=true;updateDownloads();noteTimer=setTimeout(()=>{noteTimer=null;build();},450);}
}
function fonts(){
 if(!fontReady)fontReady=(async()=>{
  if(!window.GC_CATALOG_FONTS)await new Promise((resolve,reject)=>{
   const script=document.createElement('script');let done=false;
   const finish=error=>{if(done)return;done=true;clearTimeout(timer);script.remove();error?reject(error):resolve();};
   const timer=setTimeout(()=>finish(Error('No se pudo cargar la tipografía del catálogo. Reintentá.')),15000);
   script.src='assets/js/catalog-fonts.js?v=gc-catalog-pro-59';
   script.onload=()=>finish(window.GC_CATALOG_FONTS?null:Error('La tipografía no está disponible.'));script.onerror=()=>finish(Error('No se pudo descargar la tipografía. Reintentá.'));document.head.appendChild(script);
  });
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
 document.body.insertAdjacentHTML('beforeend',`<div class="overlay catalog-export-overlay" id="catalogExportOverlay" hidden><section class="dialog catalog-export-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogExportTitle"><div class="dialog-head"><div><p class="catalog-export-eyebrow">PARA TUS CLIENTES</p><h2 id="catalogExportTitle">Compartir categoría</h2></div><button type="button" class="icon" id="catalogExportClose" aria-label="Cerrar catálogo">×</button></div><div class="catalog-export-layout"><section class="catalog-export-controls"><h3 id="catalogExportCategory"></h3><p id="catalogExportCount"></p><div class="catalog-export-options"><label><input type="checkbox" id="catalogExportPrices" checked>Mostrar precios</label><label><input type="checkbox" id="catalogExportOut" checked>Incluir agotados</label><label id="catalogExportGroupLabel" hidden><input type="checkbox" id="catalogExportGroup" checked>Ordenar por categoría</label></div><p class="catalog-export-help" id="catalogExportPricesHelp" hidden>Los precios escritos dentro de las fotos seguirán visibles; forman parte de la imagen original.</p><label class="catalog-export-label" for="catalogExportDensity">Distribución</label><select class="field" id="catalogExportDensity"><option value="auto">Automática · ordenar y ajustar sin espacios vacíos</option><option value="9">Premium · 9 productos (3 × 3) — catálogo completo</option><option value="6">Recomendado · 6 productos (2 × 3)</option><option value="12">Equilibrado · 12 productos (3 × 4)</option><option value="4">Estándar · 4 productos (2 × 2)</option><option value="2">Promocional · 2 fotos grandes</option><option value="16">Muy compacto · 16 productos (4 × 4) — letras pequeñas</option></select><p class="catalog-export-help">Automática es la opción inicial: elige columnas y filas según la cantidad. Puede dejar 3 o 4 productos en una sola fila, y 8 en dos filas de 4.</p><details class="catalog-export-selection" id="catalogExportSelection"><summary>Elegir qué productos incluir (opcional)</summary><p class="catalog-export-help">Los productos seleccionados aparecerán en el catálogo. Podés ocultar cualquiera solo de esta descarga.</p><div class="catalog-export-selection-list" id="catalogExportSelectionList"></div><button type="button" class="btn outline small" id="catalogExportSelectAll">Seleccionar todos</button></details><p class="catalog-export-quality">Tamaño carta · Alta resolución · 3060 × 3960 px</p><label class="catalog-export-label" for="catalogExportText">Información debajo del nombre</label><select class="field" id="catalogExportText"><option value="none">Sin texto adicional</option><option value="description">Contenido del producto</option><option value="details">Datos breves del producto</option><option value="custom">Texto personalizado</option></select><div class="catalog-export-custom" id="catalogExportCustom" hidden><label class="catalog-export-label" for="catalogExportTextProduct">Elegí el producto</label><select class="field" id="catalogExportTextProduct"></select><label class="catalog-export-label" for="catalogExportCustomText">Texto para este producto</label><textarea class="field" id="catalogExportCustomText" rows="3" maxlength="120" placeholder="Ej.: Ideal para Free Fire y COD Mobile."></textarea><p class="catalog-export-help"><span id="catalogExportTextCount">0 / 120</span> · Solo aparece en el catálogo.</p></div><p class="catalog-export-help" id="catalogExportTextHelp">Elegí una frase corta para que se lea completa.</p><label class="catalog-export-label" for="catalogExportFormat">Formato</label><select class="field" id="catalogExportFormat"><option value="image">Imagen PNG · página actual</option><option value="pdf">PDF · catálogo completo</option></select><p class="catalog-export-status" id="catalogExportStatus" role="status" aria-live="polite"></p><button type="button" class="btn outline" id="catalogExportRetry" hidden>Reintentar fotos</button><a class="btn" id="catalogExportDownload" aria-disabled="true">Descargar imagen</a><button type="button" class="btn outline" id="catalogExportShare" disabled>Compartir imagen</button><p class="catalog-export-help" id="catalogExportShareHelp"></p><p class="catalog-export-help">La imagen incluye la página que estás viendo. El PDF reúne todas las páginas. Las fotos se muestran completas. El PDF conserva el texto nítido y permite tocar cada producto para abrir su ficha.</p></section><section class="catalog-export-preview" aria-label="Vista previa del catálogo"><div class="catalog-export-preview-empty" id="catalogExportEmpty">Preparando tu catálogo…</div><img id="catalogExportPreview" alt="Vista previa del catálogo" hidden><nav class="catalog-export-pages" aria-label="Páginas del catálogo" hidden><button type="button" class="btn outline" id="catalogExportPrevious" aria-label="Página anterior">←</button><span id="catalogExportPage" role="status"></span><button type="button" class="btn outline" id="catalogExportNext" aria-label="Página siguiente">→</button></nav></section></div></section></div>`);
 $('catalogExportClose').onclick=close;
 $('catalogExportOverlay').onclick=event=>{if(event.target===$('catalogExportOverlay'))close();};
 for(const id of buildInputs)$(id).onchange=build;
 $('catalogExportDensity').onchange=changeDensity;
 $('catalogExportSelectionList').onchange=event=>{const input=event.target.closest('input[data-export-id]');if(!input)return;if(input.checked)hiddenIds.delete(input.dataset.exportId);else hiddenIds.add(input.dataset.exportId);build();};
 $('catalogExportSelectAll').onclick=()=>{hiddenIds.clear();$('catalogExportSelectionList').querySelectorAll('input[data-export-id]').forEach(input=>input.checked=true);build();};
 $('catalogExportText').onchange=()=>{extraText.mode=$('catalogExportText').value;extraText.layouts[$('catalogExportDensity').value]=extraText.mode;saveText();textEditor();build();};
 $('catalogExportTextProduct').onchange=()=>textEditor();
 $('catalogExportCustomText').oninput=scheduleText;
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
function refreshSelection(){
 const list=$('catalogExportSelectionList');
 list.replaceChildren(...(state?.products||[]).map(product=>{
  const label=document.createElement('label'),checkbox=document.createElement('input'),span=document.createElement('span');
  checkbox.type='checkbox';checkbox.checked=!hiddenIds.has(product.id);checkbox.dataset.exportId=product.id;
  span.textContent=product.name+(product.code?' · '+product.code:'');
  label.append(checkbox,span);return label;
 }));
}
function release(context){if(!context)return;for(const url of context.urls||[])URL.revokeObjectURL(url);context.urls=[];}
function close(){clearTimeout(noteTimer);noteTimer=null;epoch++;release(state);state=null;$('catalogExportOverlay').hidden=true;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';if(trigger?.isConnected)trigger.focus();}
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
function photoSources(product){
 let gallery=product.gallery;try{gallery=JSON.parse(gallery)}catch{}
 const extras=Array.isArray(gallery)?gallery:String(gallery||'').split(/[\n,;|]/);
 return [...new Set([primary(product),...extras].map(src=>String(src||'').trim()).filter(validSource))].slice(0,10);
}
async function photos(context,products){
 const loaded=new Map(),missing=[];
 await Promise.all(products.map(async product=>{
  const raw=primary(product),mirror=context.mirrors?.[product.id],sources=photoSources(product);
  const local=[mirror,...(Array.isArray(mirror?.gallery)?mirror.gallery:[])];
  for(const entry of local){
   if(entry?.source&&sources.includes(entry.source)&&/^assets\/catalog\/[a-f0-9]{24}\.(?:jpg|png|webp|gif)$/.test(entry.path||''))sources.unshift(entry.path);
  }
  for(const src of [...new Set(sources)]){const img=await image(src);if(img){loaded.set(product.id,img);return;}}
  // El respaldo de Apps Script solo puede resolver fotos de Google Drive.
  if(/^https:\/\/drive\.google\.com\/(?:thumbnail\?id=|file\/d\/)/i.test(raw))missing.push(product);
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
  const visible=rows.slice(0,lines);
  visible.forEach((line,index)=>{
   if(index===lines-1&&rows.length>lines)line+='…';
   while(ctx.measureText(line).width>width&&line.length>1)line=line.slice(0,-2)+'…';
   const left=align==='right'?x-ctx.measureText(line).width:align==='center'?x-ctx.measureText(line).width/2:x;
   ctx.fillStyle=color;ctx.fillText(line,left,y+index*lineHeight);ops.push({kind:'text',value:line,x:left,y:y+index*lineHeight,size,bold,color});
  });
  return {width:Math.min(width,ctx.measureText(visible[0]||'').width),bottom:y+(visible.length-1)*lineHeight,lines:visible.length};
 };
 // Ajustar el texto completo al área disponible, sin puntos suspensivos.
 const block=(value,x,top,{width,height,size=28,minSize=18,bold=false,color='#101b2b'}={})=>{
  value=String(value||'').replace(/\s+/g,' ').trim();if(!value)return {drawn:false,bottom:top};
  let rows=[],leading=0;
  const wrap=()=>{
   ctx.font=`${bold?'700':'400'} ${size}px "GC Catalog", Arial`;rows=[];let row='';
   for(const word of value.split(' ')){
    if(ctx.measureText(word).width>width){
     if(row){rows.push(row);row='';}
     for(const char of word){if(row&&ctx.measureText(row+char).width>width){rows.push(row);row='';}row+=char;}
    }else if(row&&ctx.measureText(row+' '+word).width>width){rows.push(row);row=word;}
    else row+=(row?' ':'')+word;
   }
   if(row)rows.push(row);leading=size*1.2;
  };
  wrap();while(size>minSize&&size*1.24+(rows.length-1)*leading>height){size--;wrap();}
  if(size*1.24+(rows.length-1)*leading>height)return {drawn:false,bottom:top};
  rows.forEach((row,i)=>{const y=top+size+i*leading;ctx.fillStyle=color;ctx.fillText(row,x,y);ops.push({kind:'text',value:row,x,y,size,bold,color});});
  return {drawn:true,bottom:top+size+(rows.length-1)*leading,lines:rows.length,size};
 };
 const path=(commands,fill='',stroke='',lineWidth=2)=>{
  ctx.beginPath();for(const [kind,...p] of commands){if(kind==='M')ctx.moveTo(...p);else if(kind==='L')ctx.lineTo(...p);else if(kind==='C')ctx.bezierCurveTo(...p);else if(kind==='Z')ctx.closePath();}
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
  ops.push({kind:'path',commands,fill,stroke,lineWidth});
 };
 const photo=(img,x,y,w,h,grayscale=false)=>{
  if(!img)return;
  const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale,left=x+(w-dw)/2,top=y+(h-dh)/2;
  ctx.save();if(grayscale)ctx.filter='grayscale(1)';ctx.drawImage(img,left,top,dw,dh);ctx.restore();
  ops.push({kind:'image',img,x:left,y:top,w:dw,h:dh,grayscale});return {x:left,y:top,w:dw,h:dh};
 };
 const link=(x,y,w,h,url)=>ops.push({kind:'link',x,y,w,h,url});
 const watermark=(x,y,w,h,settings)=>{
  const helper=window.GC_WATERMARK,o=helper?.options(settings);
  if(!o?.watermarkEnabled||!o.watermarkText||o.watermarkOpacity<=0)return;
  const value=String(o.watermarkText).slice(0,45),face=helper.fonts[o.watermarkFont]||helper.fonts.arial;
  let size=Math.min(o.watermarkFontSize*w/1000,Math.min(w*.16,h*.14));
  size=Math.max(9,size);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.font=face.weight+' '+size+'px '+(o.watermarkFont==='arial'?'"GC Catalog", Arial':face.css);
  const width=ctx.measureText(value).width;
  if(width>w*.72&&width>0)size*=w*.72/width;
  ctx.font=face.weight+' '+size+'px '+(o.watermarkFont==='arial'?'"GC Catalog", Arial':face.css);
  const measured=ctx.measureText(value).width,cx=x+w*.5,cy=y+h*.52,alpha=Math.min(.18,Math.max(.08,o.watermarkOpacity));
  ctx.translate(cx,cy);ctx.rotate(-19*Math.PI/180);ctx.globalAlpha=alpha;
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#17436c';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(value,0,0);ctx.restore();
  ops.push({kind:'watermark',x:cx,y:cy,value,size,angle:-19,alpha,font:o.watermarkFont,textWidth:measured,clip:{x,y,w,h}});
 };
 return {canvas,ops,box,label,block,path,photo,link,watermark};
}
function productUrl(context,product){try{const url=new URL('productos.html',context.url||document.baseURI);url.searchParams.set('producto',product.id);return url.href;}catch{return '';}}
function productInfo(context,product){
 if(context.textMode==='custom')return String(context.notes.get(product.id)||'').trim();
 if(context.textMode==='description')return String(product.description||product.details?.included||product.details?.technology||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 if(context.textMode!=='details')return '';
 const clean=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/[*#`]/g,'').replace(/\s+/g,' ').trim(),d=product.details||{},facts=[];
 for(const [key,title] of [['brand','Marca'],['model','Modelo'],['material','Material'],['size','Medidas']]){const value=clean(d[key]);if(value&&value.length<=48)facts.push(title+': '+value);if(facts.length===2)break;}
 return facts.join(' · ');
}
function draw(context,products,loaded,index,count,logo){
 const page=artist(),{box,label,block,path,photo,link,watermark}=page;
 const margin=34,inner=W-2*margin,ink='#101b2b',muted='#526780',red='#ec0631',navy='#071727';
 const settings=context.settings||{},density=context.density||6;
 const polygon=(points,fill,stroke='')=>path(points.map(([x,y],i)=>[i?'L':'M',x,y]).concat([['Z']]),fill,stroke);
 const circle=(x,y,r,fill,stroke='')=>box(x-r,y-r,2*r,2*r,fill,stroke,r);
 box(0,0,W,H,'#ffffff');
 // Cabecera compacta: prioridad a las fotos y precios, sin decoración innecesaria.
 box(0,0,W,206,navy);box(0,0,W,8,red);
 box(46,30,116,112,'#ffffff','',15);if(logo)photo(logo,52,34,104,104);
 label('GAMER COMAYAGUA',182,78,{size:45,bold:true,color:'#ffffff',width:970,fit:true});
 label('GAMING · TECNOLOGÍA · ACCESORIOS',184,113,{size:19,bold:true,color:'#dae5f0',width:850});
 label('CATÁLOGO / '+context.year,W-48,61,{size:21,bold:true,color:'#ffffff',width:295,align:'right',fit:true});
 label(context.date,W-48,95,{size:19,color:'#dae5f0',width:295,align:'right'});
 box(48,152,7,42,red,'',3);
 label(context.title,184,170,{size:33,bold:true,color:'#ffffff',width:1090,fit:true});
 const categories=[...new Set(products.map(p=>p.category).filter(Boolean))];
 const subtitle=context.multipleCategories
  ?categories.slice(0,4).join(' · ')+(categories.length>4?' · +'+(categories.length-4)+' categorías':'')
  :context.count+' producto'+(context.count===1?'':'s')+' · '+(context.prices?'Precios en lempiras':'Consultar disponibilidad');
 label(subtitle,186,199,{size:16,color:'#c9d9e9',width:1090,fit:true});
 // Cada cuadrícula conserva el tamaño de sus tarjetas también en la última página.
 const auto=context.autoLayout===true,layout=window.GC_CATALOG_LAYOUT;
 const rowCounts=auto?layout.rows(products.length):[];
 const columns=auto?Math.max(...rowCounts):density===16?4:(density===9||density===12?3:density===2?1:2);
 const rows=auto?rowCounts.length:density===16||density===12?4:density===9||density===6?3:2;
 const dense=auto?columns>=3:density>=9,feature=!auto&&density===9,compact=!auto&&density===6,wide=density===2||(auto&&products.length===1),hasExtra=context.textMode!=='none';
 const gap=dense?19:20,bodyBottom=1818;
 const maxWidth=(inner-(columns-1)*gap)/columns;
 const singleHeight=auto&&rows===1?Math.min(1140,Math.max(730,maxWidth*1.35)):0;
 const bodyTop=auto&&rows===1?Math.max(225,(225+bodyBottom-singleHeight)/2):225;
 const h=auto&&rows===1?singleHeight:(bodyBottom-bodyTop-(rows-1)*gap)/rows;
 const manualWidth=(inner-(columns-1)*gap)/columns;
 products.forEach((product,i)=>{
  const position=auto?layout.position(i,rowCounts):{row:Math.floor(i/columns),column:i%columns,columns};
  const w=auto?(inner-(position.columns-1)*gap)/position.columns:manualWidth;
  const x=margin+position.column*(w+gap),y=bodyTop+position.row*(h+gap),pad=dense?14:compact?22:28;
  const available=Number(product.stock)>0;
  box(x,y+3,w,h,'#e7ecf2','',dense?10:16);box(x,y,w,h,available?'#ffffff':'#f5f6f8','#dce4ed',dense?10:16);
  const infoReserve=(feature?177:dense?166:compact?192:230)+(hasExtra?(dense?56:compact?62:68):0);
  const photoH=wide?h-32:h-infoReserve,photoW=wide?(auto?Math.min(photoH,(w-52)*.63):photoH):w-4;
  const photoX=x+(wide?16:2),photoY=y+(wide?16:2);
  box(photoX,photoY,photoW,photoH,available?'#f3f6f9':'#e9edf1','',dense?8:12);
  const img=loaded.get(product.id);
  if(img){const rect=photo(img,photoX+2,photoY+2,photoW-4,photoH-4,!available);watermark(rect.x,rect.y,rect.w,rect.h,settings);}
  else{
   const cx=photoX+photoW/2,cy=photoY+photoH*.28,iconSize=Math.min(104,photoH*.2),buttonW=Math.min(300,photoW-36),buttonY=photoY+photoH*.72,buttonH=Math.min(48,photoH*.18);
   box(cx-iconSize*.5,cy-iconSize*.25,iconSize,iconSize*.65,'','#a1b5c7',iconSize*.1);
   box(cx-iconSize*.2,cy-iconSize*.38,iconSize*.4,iconSize*.15,'#a1b5c7','',3);circle(cx,cy+iconSize*.08,iconSize*.19,'','#a1b5c7');
   label('Consultá la foto',cx,photoY+photoH*.52,{size:dense?18:compact?25:32,bold:true,color:ink,width:photoW-30,align:'center',fit:true});
   label('Te la enviamos por WhatsApp',cx,photoY+photoH*.63,{size:dense?12:compact?17:20,color:muted,width:photoW-30,align:'center',fit:true});
   box(cx-buttonW/2,buttonY,buttonW,buttonH,'#173b58','',7);
   label('PEDIR FOTO',cx,buttonY+buttonH*.7,{size:dense?12:17,bold:true,color:'#ffffff',width:buttonW-16,align:'center',fit:true});
   const phone=String(settings.whatsapp||'50431517755').replace(/\D/g,'');
   const message='Hola, quisiera una foto de '+product.name+' (código '+(product.code||product.id)+').';
   link(cx-buttonW/2,buttonY,buttonW,buttonH,'https://wa.me/'+phone+'?text='+encodeURIComponent(message));
  }
  if(!available){
   const badgeW=dense?119:compact?169:198,badgeH=dense?32:compact?43:49;
   box(photoX+13,photoY+13,badgeW,badgeH,'#445365','',dense?7:10);
   label('AGOTADO',photoX+13+badgeW/2,photoY+13+badgeH*.72,{size:dense?18:compact?23:26,bold:true,color:'#ffffff',width:badgeW-16,align:'center',fit:true});
  }
  const price=C.unitPrice(product,1),promo=price>0&&price<product.price;
  const status=available?product.stock+' disponible'+(product.stock===1?'':'s'):'AGOTADO';
  const tx=wide?photoX+photoW+34:x+pad,tw=x+w-pad-tx;
  const panelH=hasExtra?420:310,infoTop=wide?y+(h-panelH)/2:photoY+photoH;
  label(String(product.category||'PRODUCTO').toLocaleUpperCase('es'),tx,infoTop+(dense?19:26),{size:feature?15:dense?12:compact?16:18,bold:true,color:red,width:tw,fit:true});
  const bandY=wide?infoTop+panelH-87:y+h-(dense?64:compact?76:92);
  const titleTop=infoTop+(dense?27:wide?43:compact?34:39),titleH=Math.min(dense?62:wide?128:compact?85:95,bandY-titleTop-(dense?8:12));
  const titleOptions={width:tw,height:titleH,size:feature?27:dense?20:wide?36:compact?28:34,minSize:feature?20:dense?15:compact?23:27,bold:true,color:available?ink:'#687587'};
  let name=block(product.name,tx,titleTop,titleOptions);
  if(!name.drawn)name=block(product.name,tx,titleTop,{...titleOptions,minSize:10});
  const extra=productInfo(context,product),extraTop=name.bottom+(dense?12:compact?14:18),extraHeight=bandY-extraTop-(dense?7:10);
  if(extra){const rendered=block(extra,tx,extraTop,{width:tw,height:extraHeight,size:dense?15:compact?19:22,minSize:dense?12:compact?15:17,color:muted});if(!rendered.drawn)context.omittedText++;}
  // Precio tipográfico y datos alineados: dos áreas, sin bloques de color pesados.
  box(tx,bandY,tw,1,'#e1e7ee');
  const stockW=Math.round(Math.min(dense?170:300,tw*(dense ? .51 : .48))),stockX=tx+tw-stockW,priceW=stockX-tx-(dense?12:22);
  const overlineY=bandY+(dense?16:compact?19:23);
  label(promo&&context.prices?'OFERTA':'PRECIO',tx,overlineY,{size:dense?10:compact?12:13,bold:true,color:available?'#b51d32':muted,width:priceW,fit:true});
  if(promo&&context.prices){const offset=dense?48:68;label('Antes '+C.money(product.price),tx+offset,overlineY,{size:dense?11:compact?11:13,color:muted,width:priceW-offset,fit:true});}
  label(context.prices&&price>0?C.money(price):'Consultar',tx,bandY+(dense?50:compact?62:73),{size:feature?35:dense?30:compact?38:46,bold:true,color:available?'#162d45':'#718091',width:priceW,fit:true});
  const pillY=bandY+(dense?8:compact?10:15),pillH=dense?22:compact?29:34;
  box(stockX,pillY,stockW,pillH,available?'#e8f4ee':'#edf0f4','',dense?5:7);
  label(status,stockX+stockW/2,pillY+pillH*.72,{size:feature?15:dense?14:compact?16:19,bold:true,color:available?'#087451':'#6a7888',width:stockW-12,align:'center',fit:true});
  label('Cód. '+(product.code||product.id),tx+tw,bandY+(dense?53:compact?63:74),{size:dense?12:compact?15:17,color:muted,width:stockW,align:'right',fit:true});
  link(x,img?y:photoY+photoH,w,img?h:y+h-photoY-photoH,productUrl(context,product));
 });
 // En páginas Premium con ocho productos, la novena tarjeta invita a consultar.
 if(!auto&&feature&&products.length===8&&count>1){
  const x=margin+2*(w+gap),y=bodyTop+2*(h+gap);
  box(x,y,w,h,'#f3f7fb','#dce5ef',15);
  box(x+25,y+25,w-50,65,navy,'',10);
  label('¿BUSCÁS ALGO MÁS?',x+w/2,y+68,{size:23,bold:true,color:'#ffffff',width:w-74,align:'center',fit:true});
  label('Te ayudamos por WhatsApp',x+w/2,y+205,{size:24,bold:true,color:ink,width:w-45,align:'center',fit:true});
  label('Modelos, colores y disponibilidad',x+w/2,y+253,{size:16,color:muted,width:w-55,align:'center',fit:true});
  box(x+38,y+h-115,w-76,65,red,'',12);
  label('ESCRIBINOS',x+w/2,y+h-75,{size:22,bold:true,color:'#ffffff',width:w-90,align:'center',fit:true});
  const phone=String(settings.whatsapp||'50431517755').replace(/\D/g,'');
  link(x,y,w,h,'https://wa.me/'+phone);
 }
 const footerY=1850,phone=String(settings.whatsapp||'50431517755').replace(/\D/g,''),formatted=phone.replace(/^(504)(\d{4})(\d{4})$/,'+$1 $2-$3');
 label('Precios y existencias sujetos a confirmación.',margin,1839,{size:15,color:muted,width:inner-210});
 label(String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0'),W-margin,1839,{size:17,bold:true,color:muted,width:180,align:'right'});
 box(0,footerY,W,H-footerY,navy);polygon([[0,footerY],[65,footerY],[0,footerY+65]],'#44182b');
 box(72,footerY+23,84,84,red,'',14);
 const wx=114,wy=footerY+65;
 circle(wx,wy-2,24,'','#ffffff');polygon([[wx-20,wy+11],[wx-26,wy+29],[wx-7,wy+23]],'#ffffff');
 path([['M',wx-11,wy-14],['C',wx-20,wy-8,wx-1,wy+18,wx+11,wy+11],['L',wx+15,wy+4],['L',wx+5,wy],['L',wx+1,wy+5],['C',wx-5,wy+2,wx-9,wy-3,wx-9,wy-7],['L',wx-5,wy-10],['Z']],'#ffffff');
 box(188,footerY+28,1,H-footerY-56,'#c6d3df');
 label('HABLEMOS POR WHATSAPP',220,footerY+46,{size:18,bold:true,color:'#d6e0eb',width:680});
 label(formatted,220,footerY+96,{size:43,bold:true,color:'#ffffff',width:680,fit:true});
 box(968,footerY+28,1,H-footerY-56,'#c6d3df');circle(1038,footerY+66,34,red);
 path([['M',1038,footerY+87],['C',1026,footerY+70,1024,footerY+66,1024,footerY+59],['C',1024,footerY+41,1052,footerY+41,1052,footerY+59],['C',1052,footerY+66,1050,footerY+70,1038,footerY+87],['Z']],'#ffffff');circle(1038,footerY+59,5,red);
 label('Comayagua, Honduras',1092,footerY+55,{size:23,bold:true,color:'#ffffff',width:W-1126,fit:true});
 label('Envíos a toda Honduras',1092,footerY+89,{size:20,color:'#d6e0eb',width:W-1126,fit:true});
 link(72,footerY+15,W-144,H-footerY-30,'https://wa.me/'+phone);
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
function paginate(items,size){
 const count=Math.ceil(items.length/size),balanced=(size===9||size===12||(size===16&&items.length>size*2))&&count>1;
 if(!balanced)return Array.from({length:count},(_,i)=>items.slice(i*size,(i+1)*size));
 const min=Math.floor(items.length/count),extra=items.length%count;let start=0;
 return Array.from({length:count},(_,i)=>{const n=min+(i<extra?1:0),page=items.slice(start,start+n);start+=n;return page;});
}
async function build(){
 const context=state;if(!context)return;const ticket=++epoch;context.busy=true;release(context);context.pages=[];context.index=0;context.prices=$('catalogExportPrices').checked;$('catalogExportPricesHelp').hidden=context.prices;
 const auto=$('catalogExportDensity').value==='auto';
 const size=auto?12:[2,4,6,9,12,16].includes(Number($('catalogExportDensity').value))?Number($('catalogExportDensity').value):6;
 const selected=context.products.filter(p=>!hiddenIds.has(p.id)&&($('catalogExportOut').checked||p.stock>0));
 if($('catalogExportGroup').checked&&context.multipleCategories)selected.sort((a,b)=>a.category.localeCompare(b.category,'es'));
 context.count=selected.length;context.density=size;context.autoLayout=auto;
 const plan=auto?window.GC_CATALOG_LAYOUT.pages(selected):paginate(selected,size);context.textMode=$('catalogExportText').value;context.notes=new Map(extraText.notes);context.omittedText=0;
 $('catalogExportCount').textContent=selected.length+' producto'+(selected.length===1?'':'s')+' · '+plan.length+' página'+(plan.length>1?'s':'');
 $('catalogExportPreview').hidden=true;$('catalogExportEmpty').hidden=false;$('catalogExportEmpty').textContent=selected.length?'Preparando fotos y páginas…':'No hay productos con esta selección.';
 $('catalogExportRetry').hidden=true;$('catalogExportStatus').textContent='Preparando catálogo…';document.querySelector('.catalog-export-pages').hidden=true;
 for(const id of buildInputs)$(id).disabled=true;updateDownloads();
 let missing=0;const pdfImages=new Map();
 try{
  if(!selected.length){$('catalogExportStatus').textContent='Incluí agotados o elegí otra categoría.';return;}
  if(!window.GC_CATALOG_PDF)throw Error('No se pudo cargar el generador PDF. Recargá la página.');
  await fonts();if(ticket!==epoch)return;
  if(!context.mirrors){try{const response=await fetch('data/catalogo-fotos.json',{cache:'no-cache'});context.mirrors=response.ok?(await response.json()).images||{}:{};}catch{context.mirrors={};}}
  const logo=await image(context.logo||'assets/img/logo-rojo.webp'),count=plan.length;context.pageCount=count;
  let pendingPhotos=photos(context,plan[0]);
  for(let index=0;index<count;index++){
   if(ticket!==epoch)return;$('catalogExportStatus').textContent=`Preparando página ${index+1} de ${count}…`;
   const entries=plan[index],loaded=await pendingPhotos;if(ticket!==epoch)return;
   if(index+1<count)pendingPhotos=photos(context,plan[index+1]);
   missing+=entries.filter(p=>!loaded.has(p.id)).length;
   const page=draw(context,entries,loaded,index,count,logo),png=await blob(page.canvas);page.canvas.width=1;page.canvas.height=1;
   await window.GC_CATALOG_PDF.prepare(page,pdfImages);
   if(ticket!==epoch)return;
   const url=URL.createObjectURL(png);context.urls.push(url);context.pages.push({url,file:new File([png],context.filename+'_'+String(index+1).padStart(2,'0')+'.png',{type:'image/png'}),ops:page.ops});
   if(index===0)preview();
  }
  if(ticket!==epoch)return;
  const contact='https://wa.me/'+String(context.settings.whatsapp||'50431517755').replace(/\D/g,'');
  const sections=[];
  if(context.multipleCategories&&$('catalogExportGroup').checked){const seen=new Set();selected.forEach((product,index)=>{const title=String(product.category||'Otros').trim()||'Otros';if(!seen.has(title)){seen.add(title);sections.push({title,page:plan.findIndex(group=>group.some(p=>p.id===product.id))});}});}
  $('catalogExportStatus').textContent='Preparando PDF de alta calidad…';
  const output=await window.GC_CATALOG_PDF.create(context.pages,{width:W,height:H,title:context.title,contact,sections});for(const page of context.pages)delete page.ops;pdfImages.clear();if(ticket!==epoch)return;context.pdfFile=new File([output],context.filename+'.pdf',{type:'application/pdf'});context.pdfUrl=URL.createObjectURL(output);context.urls.push(context.pdfUrl);
  $('catalogExportStatus').textContent=missing?`Catálogo listo · ${missing} producto${missing===1?' sin foto: incluye':'s sin foto: incluyen'} acceso para solicitarla por WhatsApp.`:'Catálogo listo · PNG en alta resolución y PDF con texto nítido.';$('catalogExportRetry').hidden=!missing;
  if(context.omittedText)$('catalogExportStatus').textContent+=' '+context.omittedText+(context.omittedText===1?' texto no cabe completo':' textos no caben completos')+': acortá la frase o elegí menos productos.';
  context.busy=false;preview();
 }catch(error){if(ticket===epoch){release(context);context.pages=[];$('catalogExportPreview').hidden=true;$('catalogExportEmpty').hidden=false;$('catalogExportEmpty').textContent='No se pudo crear el catálogo.';$('catalogExportStatus').textContent=error.message;$('catalogExportRetry').hidden=false;}}
 finally{if(ticket===epoch){context.busy=false;for(const id of buildInputs)$(id).disabled=false;updateDownloads();}}
}
function open(options){
 clearTimeout(noteTimer);noteTimer=null;setup();release(state);hiddenIds=new Set();trigger=document.activeElement;
 const products=(options.products||[]).map(C.cleanProduct).filter(p=>p.active&&p.id&&p.name);
 const now=new Date(),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Tegucigalpa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=type=>parts.find(p=>p.type===type).value;
 state={...options,products,multipleCategories:new Set(products.map(p=>p.category)).size>1,year:part('year'),title:String(options.title||'Catálogo').slice(0,120),date:new Intl.DateTimeFormat('es-HN',{timeZone:'America/Tegucigalpa',dateStyle:'medium'}).format(now),filename:'GC_Catalogo_'+slug(options.title)+'_'+part('year')+part('month')+part('day'),pages:[],urls:[],index:0,busy:true,settings:options.settings||{},mirrors:null};
 $('catalogExportTitle').textContent=state.multipleCategories?'Compartir catálogo':'Compartir categoría';$('catalogExportCategory').textContent=state.title;$('catalogExportOut').checked=options.includeOut!==false;$('catalogExportPrices').checked=true;$('catalogExportFormat').value='image';$('catalogExportDensity').value='auto';$('catalogExportText').value=layoutTextMode('auto');refreshSelection();textEditor(true);$('catalogExportGroup').checked=true;$('catalogExportGroupLabel').hidden=!state.multipleCategories;$('catalogExportOverlay').hidden=false;document.body.style.overflow='hidden';$('catalogExportClose').focus();build();
}
window.GC_CATALOG_EXPORT={open};
})();
