(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_PACKAGE_READER=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const full={x:0,y:0,width:1,height:1};
 function canvasFor(image,region=full,style='color',rotation=0){
  const angle=((rotation%360)+360)%360,swap=angle===90||angle===270,sourceWidth=swap?image.height:image.width,sourceHeight=swap?image.width:image.height;
  const x=Math.max(0,Math.min(.99,region.x)),y=Math.max(0,Math.min(.99,region.y)),width=Math.max(.01,Math.min(1-x,region.width)),height=Math.max(.01,Math.min(1-y,region.height));
  const sw=sourceWidth*width,sh=sourceHeight*height,scale=Math.min(2.5,1800/Math.max(sw,sh));
  const canvas=document.createElement('canvas');canvas.width=Math.max(24,Math.round(sw*scale))+24;canvas.height=Math.max(24,Math.round(sh*scale))+24;
  const target=canvas.getContext('2d',{willReadFrequently:style!=='color'});target.fillStyle='#fff';target.fillRect(0,0,canvas.width,canvas.height);
  // Crop directly into the small output canvas, including rotated selections.
  // Never allocate another full-resolution copy of a phone camera photograph.
  target.save();target.beginPath();target.rect(12,12,canvas.width-24,canvas.height-24);target.clip();target.translate(12,12);target.scale((canvas.width-24)/sw,(canvas.height-24)/sh);target.translate(-sourceWidth*x,-sourceHeight*y);target.translate(sourceWidth/2,sourceHeight/2);target.rotate(angle*Math.PI/180);target.drawImage(image,-image.width/2,-image.height/2);target.restore();
  if(style!=='color'){
   const pixels=target.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
   for(let i=0;i<data.length;i+=4){let v=.299*data[i]+.587*data[i+1]+.114*data[i+2];v=style==='label'?Math.min(data[i],data[i+1],data[i+2])>170?0:255:Math.max(0,Math.min(255,(v-128)*1.35+128));data[i]=data[i+1]=data[i+2]=v;}
   target.putImageData(pixels,0,0);
  }
  return canvas;
 }
 async function loadImage(file){
  const url=URL.createObjectURL(file);
  try{return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('No se pudo abrir la foto para ampliar el texto. Probá con un archivo JPG o PNG.'));image.src=url;});}finally{URL.revokeObjectURL(url);}
 }
 async function read(file,{model,recognize,onProgress=()=>{},stopped=()=>false,region=null,rotation=0,detailed=false,categories=[]}){
  const readings=[];let image,draft,warning='';
  const check=()=>{if(stopped())throw Error('Lectura cancelada.');};
  const attempt=async(input,label,mode='11')=>{
   check();onProgress(label);const result=await recognize(input,mode);check();
   const data=result.data||result;readings.push({text:String(data.text||''),confidence:Number(data.confidence)||0});draft=model.combine(readings,file.name,categories);
  };
  const finish=()=>({data:{text:draft?.text||'',confidence:Math.max(0,...readings.map(r=>r.confidence))},draft:draft||model.parse('',file.name,categories),readings,warning});
  image=await loadImage(file);check();
  if(!region&&!rotation){const normalized=Math.max(image.width,image.height)>2400?canvasFor(image):null;try{await attempt(normalized||file,'Leyendo foto completa…');}finally{if(normalized)normalized.width=normalized.height=1;}if(!detailed&&model.assessment(draft).complete)return finish();}
  const passes=region?[
   {label:'Ampliando la zona seleccionada…',box:region,style:'color'},
   {label:'Leyendo las líneas de la etiqueta…',box:region,style:'color',mode:'6'},
   {label:'Mejorando contraste de la etiqueta…',box:region,style:'label',mode:'6'}
  ]:[
   {label:'Leyendo marca y encabezado…',box:{x:0,y:.08,width:.66,height:.24},style:'label'},
   {label:'Buscando modelo y especificaciones…',box:{x:0,y:.54,width:1,height:.22},style:'color'},
   {label:'Leyendo la parte inferior de la caja…',box:{x:0,y:.78,width:1,height:.22},style:'color'},
   {label:'Ampliando medidas y conexiones…',box:{x:.5,y:.72,width:.5,height:.28},style:'gray',when:()=>!draft.details.length},
   {label:'Ampliando el logotipo de la marca…',box:{x:.25,y:.08,width:.5,height:.22},style:'label',when:()=>!draft.details.brand}
  ];
  try{
   if(rotation&&!region)await attempt(canvasFor(image,full,'color',rotation),'Leyendo la foto girada…');
   for(const pass of passes){
    check();if(pass.when&&!detailed&&!pass.when())continue;
    const canvas=canvasFor(image,pass.box,pass.style,rotation);
    try{await attempt(canvas,pass.label,pass.mode);}finally{canvas.width=canvas.height=1;}
    // Finish the three main regions before deciding which smaller labels need a retry.
    if(!region&&!detailed&&pass===passes[2]&&model.assessment(draft).complete)break;
   }
  }catch(error){check();if(!readings.length)throw error;warning='No se completaron todas las zonas. Podés reintentar o enfocar una etiqueta.';}
  return finish();
 }
 return {read};
});
