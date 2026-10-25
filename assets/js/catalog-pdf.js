/* PDF vectorial del catálogo: texto seleccionable, fotos originales y enlaces públicos. */
(function(){'use strict';
const encoder=new TextEncoder();
const decode=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
const winAnsi=new Map([[0x20ac,128],[0x201a,130],[0x0192,131],[0x201e,132],[0x2026,133],[0x2020,134],[0x2021,135],[0x02c6,136],[0x2030,137],[0x0160,138],[0x2039,139],[0x0152,140],[0x017d,142],[0x2018,145],[0x2019,146],[0x201c,147],[0x201d,148],[0x2022,149],[0x2013,150],[0x2014,151],[0x02dc,152],[0x2122,153],[0x0161,154],[0x203a,155],[0x0153,156],[0x017e,158],[0x0178,159]]);
const num=value=>String(Math.round(value*1000)/1000);
const color=value=>{const hex=value.replace('#','');return [0,2,4].map(i=>num(parseInt(hex.slice(i,i+2),16)/255)).join(' ');};
function literal(value){
 let result='';for(const char of String(value||'')){const cp=char.codePointAt(0),byte=cp<256?cp:winAnsi.get(cp)??63;result+='\\'+byte.toString(8).padStart(3,'0');}return '('+result+')';
}
function uri(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href.replace(/[\\()]/g,'\\$&'):'';}catch{return '';}}
async function jpeg(img){
 const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const data=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo preparar una foto para el PDF.')),'image/jpeg',.96));
 const result={width:canvas.width,height:canvas.height,bytes:new Uint8Array(await data.arrayBuffer())};canvas.width=1;canvas.height=1;return result;
}
async function prepare(page,cache){
 for(const op of page.ops)if(op.kind==='image'){
  const key=op.img.currentSrc||op.img.src;if(!cache.has(key))cache.set(key,await jpeg(op.img));
  op.image=cache.get(key);delete op.img;
 }
}
function rectangle(op,height){
 const x=op.x,y=height-op.y-op.h,w=op.w,h=op.h,r=Math.min(op.r||0,w/2,h/2),k=.55228475;
 if(!r)return `${num(x)} ${num(y)} ${num(w)} ${num(h)} re`;
 const p=(a,b)=>`${num(a)} ${num(b)}`,corner=(a,b,c,d,e,f)=>`${p(a,b)} ${p(c,d)} ${p(e,f)} c`;
 return [p(x+r,y)+' m',p(x+w-r,y)+' l',corner(x+w-r+k*r,y,x+w,y+r-k*r,x+w,y+r),p(x+w,y+h-r)+' l',corner(x+w,y+h-r+k*r,x+w-r+k*r,y+h,x+w-r,y+h),p(x+r,y+h)+' l',corner(x+r-k*r,y+h,x,y+h-r+k*r,x,y+h-r),p(x,y+r)+' l',corner(x,y+r-k*r,x+r-k*r,y,x+r,y),'h'].join('\n');
}
async function create(pages,options){
 if(!window.GC_CATALOG_FONTS)throw Error('No se pudo cargar la tipografía del catálogo. Recargá la página.');
 const objects=[null],reserve=()=>{objects.push(null);return objects.length-1;},catalog=reserve(),tree=reserve(),regular=reserve(),bold=reserve(),info=reserve(),images=new Map();
 const pageIds=pages.map(()=>({page:reserve(),content:reserve(),links:[]}));
 for(const page of pages)for(const op of page.ops)if(op.kind==='image'&&!images.has(op.image))images.set(op.image,{id:reserve(),data:op.image});
 objects[catalog]=`<< /Type /Catalog /Pages ${tree} 0 R /PageLayout /OneColumn >>`;
 objects[tree]=`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(p=>p.page+' 0 R').join(' ')}] >>`;
 for(const [name,id] of [['regular',regular],['bold',bold]]){
  const font=window.GC_CATALOG_FONTS[name],descriptor=reserve(),file=reserve(),bytes=decode(font.data);
  objects[file]={header:'/Length1 '+bytes.length,bytes};
  objects[descriptor]=`<< /Type /FontDescriptor /FontName /${font.name} /Flags 32 /FontBBox [${font.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${font.ascent} /Descent ${font.descent} /CapHeight ${font.ascent} /StemV ${name==='bold'?120:80} /FontFile2 ${file} 0 R >>`;
  objects[id]=`<< /Type /Font /Subtype /TrueType /BaseFont /${font.name} /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 255 /Widths [${font.widths.join(' ')}] /FontDescriptor ${descriptor} 0 R >>`;
 }
 objects[info]=`<< /Title ${literal('Gamer Comayagua - '+options.title)} /Author ${literal('Gamer Comayagua')} /Creator ${literal('Catalogo Gamer Comayagua')} >>`;
 for(const record of images.values()){const d=record.data;objects[record.id]={header:`/Type /XObject /Subtype /Image /Width ${d.width} /Height ${d.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,bytes:d.bytes};}
 pages.forEach((page,index)=>{
  const ids=pageIds[index],scale=612/options.width,height=options.height,commands=[`q ${num(scale)} 0 0 ${num(scale)} 0 0 cm`],used=new Set();
  for(const op of page.ops){
   if(op.kind==='box'){
    commands.push('q');if(op.fill)commands.push(color(op.fill)+' rg');if(op.stroke)commands.push(color(op.stroke)+' RG',num(op.lineWidth||1.5)+' w');
    commands.push(rectangle(op,height),op.fill&&op.stroke?'B':op.fill?'f':'S','Q');
   }else if(op.kind==='text'){
    commands.push('BT',`/${op.bold?'F2':'F1'} ${num(op.size)} Tf`,color(op.color)+' rg',`1 0 0 1 ${num(op.x)} ${num(height-op.y)} Tm`,literal(op.value)+' Tj','ET');
   }else if(op.kind==='image'){
    const record=images.get(op.image);used.add(record.id);commands.push(`q ${num(op.w)} 0 0 ${num(op.h)} ${num(op.x)} ${num(height-op.y-op.h)} cm /Im${record.id} Do Q`);
   }else if(op.kind==='watermark'){
    // La transparencia y el modo Diferencia permiten blanco sobre oscuro y negro sobre claro.
    const angle=-op.angle*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle);
    commands.push('q','/GWM gs','BT',`/F2 ${num(op.size)} Tf`,'1 1 1 rg',`${num(co)} ${num(si)} ${num(-si)} ${num(co)} ${num(op.x)} ${num(height-op.y-op.size*.32)} Tm`,literal(op.value)+' Tj','ET','Q');
   }else if(op.kind==='link'){
    const url=uri(op.url);if(!url)continue;const id=reserve();ids.links.push(id);
    objects[id]=`<< /Type /Annot /Subtype /Link /Rect [${num(op.x*scale)} ${num((height-op.y-op.h)*scale)} ${num((op.x+op.w)*scale)} ${num((height-op.y)*scale)}] /Border [0 0 0] /A << /S /URI /URI (${url}) >> >>`;
   }
  }
  commands.push('Q');objects[ids.content]={bytes:encoder.encode(commands.join('\n')+'\n')};
  const mark=page.ops.find(op=>op.kind==='watermark'),extras=mark?` /ExtGState << /GWM << /Type /ExtGState /ca ${num(mark.alpha)} /BM /Difference >> >>`:'';
  objects[ids.page]=`<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> /XObject << ${[...used].map(id=>`/Im${id} ${id} 0 R`).join(' ')} >>${extras} >> /Contents ${ids.content} 0 R /Annots [${ids.links.map(id=>id+' 0 R').join(' ')}] >>`;
 });
 const parts=[],offsets=[0];let length=0;const append=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);length+=bytes.byteLength;};
 append('%PDF-1.4\n');append(new Uint8Array([37,226,227,207,211,10]));
 for(let id=1;id<objects.length;id++){offsets[id]=length;append(id+' 0 obj\n');const object=objects[id];if(typeof object==='string')append(object);else{append(`<< ${object.header||''} /Length ${object.bytes.byteLength} >>\nstream\n`);append(object.bytes);append('\nendstream');}append('\nendobj\n');}
 const xref=length;append(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);for(let id=1;id<objects.length;id++)append(String(offsets[id]).padStart(10,'0')+' 00000 n \n');
 append(`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);return new Blob(parts,{type:'application/pdf'});
}
window.GC_CATALOG_PDF={create,prepare};
})();
