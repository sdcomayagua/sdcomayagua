// Lotes privados: revisión sin escritura, campos elegidos, concurrencia y fotos entre páginas.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const headers=['ID','Codigo','Nombre','Categoria','Precio','PrecioPromocion','Costo','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Revision','Colores','PromocionTexto','Detalles','MasPedidos','FechaCreacion'];
const make=(id,extra={})=>({ID:id,Codigo:'SKU-'+id,Nombre:'Producto '+id,Categoria:'Accesorios',Precio:220,PrecioPromocion:200,Costo:80,Stock:5,Imagen:'',Galeria:'',Descripcion:'',Descuentos:'6:180',PagoAlRecibir:'SI',Activo:'SI',Revision:'original',Colores:'Negro',PromocionTexto:'Oferta',Detalles:'{}',MasPedidos:'SI',FechaCreacion:'2026-10-17T02:00:00Z',...extra});
const records=[make('A',{Detalles:JSON.stringify({width:2,measureUnit:'cm'})}),make('B',{Descripcion:'Texto propio del dueño.'}),make('C')],table=[headers.slice(),...records.map(p=>headers.map(k=>p[k]))],writes=[],cache={},props={ADMIN_PIN:'123456'};let uuid=0,searches=0,downloads=0,failPhoto=false;
const cell=(id,key)=>table[table.findIndex((r,i)=>i>0&&r[0]===id)][headers.indexOf(key)];
const set=(id,key,value)=>{table[table.findIndex((r,i)=>i>0&&r[0]===id)][headers.indexOf(key)]=value;};
const sheet={getDataRange:()=>({getValues:()=>table.map(r=>r.slice()),getDisplayValues:()=>table.map(r=>r.map(String))}),getRange:(r,c)=>({setValue:value=>{table[r-1][c-1]=value;writes.push({r,c,value});}})};
const context={console,Date,
 SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==='Productos'?sheet:name==='Configuracion'?{getLastRow:()=>1,getDataRange:()=>({getValues:()=>[['Clave','Valor','Descripción']]})}:null})},
 CacheService:{getScriptCache:()=>({get:key=>cache[key]||null,put:(key,value,ttl)=>{assert.ok(ttl<=21600);cache[key]=value;},remove:key=>{delete cache[key];}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>props[key],setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{getUuid:()=> 'BULK-UUID-'+(++uuid)},
 HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:data=>({data,setXFrameOptionsMode(){return this;}})}
};
vm.createContext(context);for(const file of ['Code.gs','FichaGratis.gs'])vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/'+file,'utf8'),context);
context.gcFreeCandidates_=(name,category)=>{searches++;const searchId='BULK-SEARCH-'+searches;cache['gc_selection_'+searchId]=JSON.stringify({name,category,hits:[]});return {searchId,candidates:[{id:'0',url:'https://maker.example/product',title:name}]};};
context.gcFreeSelected_=(name,category,selection)=>({research:{match:'partial',description:'Descripción confirmada para '+name,colors:'Rojo',sources:[{url:'https://maker.example/product',title:'Fuente elegida'}],details:{brand:'Marca',material:'Aluminio',width:999,height:100,measureUnit:'mm'}}});
context.gcFreeImages_=()=>({research:{images:['https://cdn.example/uno.jpg','https://cdn.example/dos.jpg'],selectedSource:{url:'https://maker.example/product',title:'Producto elegido'}}});
context.gcResearchKeys_=()=>({tavily:'FAKE_ONLY',gemini:'FAKE_ONLY'});
context.gcFreePost_=(url,payload)=>{assert.equal(payload.include_images,true);assert.ok(payload.exclude_domains.includes('youtube.com'));assert.ok(payload.exclude_domains.includes('maker.example'),'Buscar más consulta otros sitios');return {images:['https://cdn.example/uno.jpg','https://cdn.example/nueva.jpg','https://cdn.example/logo.png']};};
context.gcDownloadResearchImage_=(url)=>{downloads++;if(failPhoto&&url.endsWith('dos.jpg'))throw Error('La foto no respondió');return {ok:true,url:'https://drive.google.com/thumbnail?id='+url.split('/').at(-1)};};
const post=(action,extra={},token='123456')=>{
 const html=context.doPost({parameter:{payload:JSON.stringify({requestId:'bulk-test',action,token,...extra})}}).data;
 return JSON.parse(html.match(/var answer=(.*?);function deliver/)[1]);
};
assert.equal(post('researchBulkItem',{id:'A',mode:'info'},'000000').ok,false);assert.equal(searches,0,'El PIN se comprueba antes de consultar');
const first=post('researchBulkItem',{id:'A',mode:'info'});assert.equal(first.ok,true,JSON.stringify(first));assert.equal(writes.length,0,'Buscar un lote no guarda propuestas');
assert.equal(first.fields.some(field=>field.key==='width'),false);assert.equal(first.fields.some(field=>field.key==='colors'),false);
assert.equal(first.fields.find(field=>field.key==='height').value,10);assert.equal(first.fields.find(field=>field.key==='height').unit,'cm');
assert.equal(JSON.stringify(first).includes('"cost"'),false);assert.equal(JSON.stringify(first).includes('"Precio"'),false);
set('A','Precio',999);set('A','Stock',1);
const commercial=['Codigo','Precio','PrecioPromocion','Costo','Stock','Descuentos','PagoAlRecibir','Activo','MasPedidos','FechaCreacion'],original=Object.fromEntries(commercial.map(k=>[k,cell('A',k)]));
const applied=post('applyBulkResearch',{id:'A',proposalId:first.proposalId,fields:['description','height','price','cost','stock']});
assert.equal(applied.ok,true);assert.deepEqual(applied.appliedFields,['description','height']);
assert.match(cell('A','Descripcion'),/Descripción confirmada/);const details=JSON.parse(cell('A','Detalles'));assert.equal(details.width,2);assert.equal(details.height,10);assert.equal(details.measureUnit,'cm');assert.equal(details.brand,undefined);
for(const key of commercial)assert.equal(cell('A',key),original[key],'Conservar '+key+' incluso si cambió durante la revisión');
assert.equal(cell('B','Descripcion'),'Texto propio del dueño.');assert.equal(cell('C','Descripcion'),'','Los otros artículos no se completan');
const pending=post('researchBulkItem',{id:'C',mode:'info'});set('C','Descripcion','Edición concurrente');
const protectedEdit=post('applyBulkResearch',{id:'C',proposalId:pending.proposalId,fields:['description','material']});assert.equal(protectedEdit.ok,true);assert.deepEqual(protectedEdit.skippedFields,['description']);assert.equal(cell('C','Descripcion'),'Edición concurrente');
const changedName=post('researchBulkItem',{id:'B',mode:'info'});set('B','Nombre','Nombre corregido');assert.equal(post('applyBulkResearch',{id:'B',proposalId:changedName.proposalId,fields:['brand']}).ok,false);
const photos=post('researchBulkItem',{id:'A',mode:'photos'});assert.equal(photos.images.length,2);const beforePhotoWrites=writes.length;
assert.equal(post('importBulkResearchImage',{proposalId:photos.proposalId,imageIndex:0}).ok,true);assert.equal(post('importBulkResearchImage',{proposalId:photos.proposalId,imageIndex:0}).ok,true);assert.equal(downloads,1,'Reintentar usa la copia existente');
failPhoto=true;assert.equal(post('importBulkResearchImage',{proposalId:photos.proposalId,imageIndex:1}).ok,false);assert.equal(writes.length,beforePhotoWrites,'Una descarga fallida no publica fotos parciales');failPhoto=false;
const more=post('researchBulkItem',{id:'A',mode:'photos',previousProposalId:photos.proposalId,more:true});assert.equal(more.ok,true);assert.deepEqual(more.images,['https://cdn.example/nueva.jpg'],'Buscar más omite las opciones anteriores');
assert.equal(post('importBulkResearchImage',{proposalId:more.proposalId,imageIndex:0}).ok,true);
set('A','Imagen','https://drive.google.com/thumbnail?id=PRINCIPAL_MANUAL');
const savedPhotos=post('applyBulkResearch',{id:'A',photos:[{proposalId:photos.proposalId,imageIndex:0},{proposalId:more.proposalId,imageIndex:0}]});
assert.equal(savedPhotos.ok,true);assert.equal(savedPhotos.addedPhotos,2);assert.match(cell('A','Imagen'),/PRINCIPAL_MANUAL/);assert.match(cell('A','Galeria'),/uno.jpg/);assert.match(cell('A','Galeria'),/nueva.jpg/);
const duplicate=post('applyBulkResearch',{id:'A',photos:[{proposalId:photos.proposalId,imageIndex:0}]});assert.equal(duplicate.addedPhotos,0,'Repetir el guardado no duplica fotos');
assert.equal(post('applyBulkResearch',{id:'C',photos:[{proposalId:photos.proposalId,imageIndex:0}]}).ok,false,'No mezcla propuestas de artículos distintos');
const mainChange=post('applyBulkResearch',{id:'A',useFirstAsMain:true,photos:[{proposalId:photos.proposalId,imageIndex:0}]});assert.equal(mainChange.ok,true);assert.match(cell('A','Imagen'),/uno.jpg/);assert.match(cell('A','Galeria'),/PRINCIPAL_MANUAL/,'Cambiar la principal conserva la foto anterior');
assert.equal(post('importBulkResearchImage',{proposalId:photos.proposalId,imageIndex:1}).ok,true);
set('A','Galeria',Array.from({length:9},(_,i)=>'https://cdn.example/guardada-'+i+'.jpg').join(', '));const fullGallery=cell('A','Galeria');
assert.equal(post('applyBulkResearch',{id:'A',photos:[{proposalId:photos.proposalId,imageIndex:1}]}).ok,false);assert.equal(cell('A','Galeria'),fullGallery,'La capacidad se comprueba de nuevo al guardar');

assert.equal(post('importBulkResearchImage',{proposalId:more.proposalId,imageIndex:3}).ok,false);
const longHistory=JSON.parse(cache['gc_bulk_v7_'+photos.proposalId]);longHistory.seenImages=Array.from({length:150},(_,i)=>'https://cdn.example/'+i+'x'.repeat(700)+'.jpg');cache['gc_bulk_v7_'+photos.proposalId]=JSON.stringify(longHistory);const bounded=post('researchBulkItem',{id:'A',mode:'photos',previousProposalId:photos.proposalId,more:true});assert.equal(bounded.ok,true);assert.ok(cache['gc_bulk_v7_'+bounded.proposalId].length<=65000,'El historial no excede la caché de Google');
delete cache['gc_bulk_v7_'+more.proposalId];assert.equal(post('importBulkResearchImage',{proposalId:more.proposalId,imageIndex:0}).ok,false,'Una propuesta vencida debe renovarse');
for(const key of commercial)assert.equal(cell('A',key),original[key]);
console.log('PASS lotes: PIN, propuestas sin guardar, campos y artículos elegidos, unidades, cambios concurrentes, fotos nuevas, copias reutilizadas, galería y aislamiento entre artículos.');
