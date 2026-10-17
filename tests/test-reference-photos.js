// Fotos de referencia: APIs simuladas, bytes reales en la solicitud; no claves ni inventario externo.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const reference='https://cdn.example/my-controller.png';
function setup(){
 const products={A:{id:'A',name:'Control K12 negro',category:'Controles',image:reference,gallery:'',details:{},description:'',colors:''},B:{id:'B',name:'Sin foto',category:'Otros',image:'',gallery:'',details:{}}};
 const props={ADMIN_PIN:'123456',GC_FREE_TAVILY_API_KEY:'FAKE_TEST_ONLY',GC_FREE_GEMINI_API_KEY:'FAKE_TEST_ONLY'},cache={},calls=[];
 let serial=0,page=0,reads=0,copies=0,quota=false,conflict=false,uncertain=false;
 const imageBytes=text=>Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from(text)]);
 const bytesFor=url=>url===reference||url.includes('identical')?imageBytes('REFERENCE'):imageBytes(url.includes('my-saved-gallery')||url.includes('alias-side')?'SIDE':url.includes('side')?'SIDE':url.includes('rear')?'REAR':url.includes('new')?'NEW':url.includes('wrong')?'WRONG':'UNCERTAIN');
 const reply=data=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(data)});
 const context={console,Date,Logger:{log(){}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>{cache[k]=v;},remove:k=>{delete cache[k];}})},
  Utilities:{getUuid:()=> 'REFERENCE-UUID-'+(++serial),DigestAlgorithm:{SHA_256:'sha256'},base64Encode:bytes=>Buffer.from(bytes).toString('base64'),base64Decode:value=>Array.from(Buffer.from(value,'base64')),computeDigest:(algorithm,bytes)=>Array.from(crypto.createHash(algorithm).update(Buffer.from(bytes)).digest())},
  HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:data=>({data,setXFrameOptionsMode(){return this;}})},
  UrlFetchApp:{fetch:(url,options)=>{
   calls.push({url,options});
   if(url.includes('api.tavily.com')){
    const payload=JSON.parse(options.payload);assert.equal(payload.include_images,true);assert.equal(payload.include_image_descriptions,true);assert.ok(payload.exclude_domains.includes('youtube.com'));
    const images=page++===0?['identical.png','wrong.png','uncertain.png','side.png?w=200','side.png?w=400','rear.png']:page===2?['side.png?w=1200','alias-side.png','wrong.png','new.png']:['side.png?w=900','alias-side.png','new.png'];
    return reply({images:images.map(file=>({url:'https://cdn.example/'+file,description:file})),results:[{url:'https://shop.example/controller-k12',title:'Control K12'}]});
   }
   if(url.includes('generativelanguage.googleapis.com')){
    if(quota)return {getResponseCode:()=>429};
    const payload=JSON.parse(options.payload),parts=payload.contents[0].parts,images=parts.filter(part=>part.inlineData);
    assert.ok(images.length>=1,'El análisis recibe bytes de la foto, no solo su nombre');
    assert.equal(images[0].inlineData.data,bytesFor(reference).toString('base64'));
    assert.equal(payload.generationConfig.temperature,0);assert.equal(payload.generationConfig.responseMimeType,'application/json');
    if(payload.generationConfig.responseSchema.properties.query)return reply({candidates:[{content:{parts:[{text:JSON.stringify({query:'K12 black controller asymmetric sticks',visibleText:'K12',features:'Control negro con botones y conectores propios del K12',conflict,reason:'Modelo visible diferente'})}]}}]});
    const matches=images.slice(1).map((image,id)=>{
     const value=Buffer.from(image.inlineData.data,'base64').toString();
     return {id,match:uncertain?'uncertain':value.includes('WRONG')?'different':value.includes('UNCERTAIN')?'uncertain':'same_product',confidence:uncertain||value.includes('UNCERTAIN')?'low':'high',reason:value.includes('WRONG')?'Otro modelo de control':'Coinciden carcasa, botones y conectores'};
    });
    matches.push({id:999,match:'same_product',confidence:'high',reason:'ID inventado'});
    return reply({candidates:[{content:{parts:[{text:JSON.stringify({matches})}]}}]});
   }
   assert.equal(options.followRedirects,false);
   const bytes=bytesFor(url);return {getResponseCode:()=>200,getContent:()=>Array.from(bytes)};
  }}
 };
 vm.createContext(context);for(const file of ['Code.gs','FichaGratis.gs'])vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/'+file,'utf8'),context);
 context.gcBulkProduct_=id=>{reads++;if(!products[id])throw Error('No existe');return {...products[id]};};
 context.uploadImage_=file=>{copies++;assert.equal(file.mime,'image/png');return {ok:true,url:'https://drive.google.com/thumbnail?id=COPY-'+copies};};
 const post=(extra,token='123456')=>{
  const html=context.doPost({parameter:{payload:JSON.stringify({requestId:'test',token,action:'researchBulkItem',id:'A',mode:'photos',useReference:true,...extra})}}).data;
  return JSON.parse(html.match(/var answer=(.*?);function deliver/)[1]);
 };
 return {context,products,cache,calls,post,readCount:()=>reads,copyCount:()=>copies,setQuota:()=>{quota=true;},setConflict:()=>{conflict=true;},setUncertain:()=>{uncertain=true;}};
}
const run=setup();
assert.equal(run.post({},'000000').ok,false);assert.equal(run.readCount(),0);assert.equal(run.calls.length,0,'El PIN protege también la comparación visual');
const first=run.post({referenceImage:'https://inventada.example/mi-foto.png'});assert.equal(first.ok,true,JSON.stringify(first));
assert.deepEqual(first.images,['https://cdn.example/side.png?w=200','https://cdn.example/rear.png']);
assert.equal(first.reference.url,reference);assert.equal(first.photoMatches.length,2);assert.equal(first.photoCapacity,9);assert.equal(run.copyCount(),0,'Buscar no importa ni modifica el producto');
assert.equal(run.calls.some(call=>call.url.includes('inventada.example')),false,'Usa únicamente una foto registrada en ese artículo');
const query1=JSON.parse(run.calls.find(call=>call.url.includes('api.tavily.com')).options.payload).query;
const more=run.post({previousProposalId:first.proposalId,more:true});assert.equal(more.ok,true,JSON.stringify(more));assert.deepEqual(more.images,['https://cdn.example/new.png']);
const searches=run.calls.filter(call=>call.url.includes('api.tavily.com'));
assert.notEqual(JSON.parse(searches[1].options.payload).query,query1);assert.ok(JSON.parse(searches[1].options.payload).exclude_domains.includes('shop.example'));
assert.equal(run.calls.filter(call=>call.url.includes('generativelanguage')&&JSON.parse(call.options.payload).generationConfig.responseSchema.properties.query).length,1,'Reutiliza la identidad solo cuando la foto tiene los mismos bytes');
assert.equal(run.calls.filter(call=>call.url==='https://cdn.example/side.png?w=1200').length,0,'Descarta tamaños distintos de una foto ya vista antes de descargar');
const none=run.post({previousProposalId:more.proposalId,more:true});assert.equal(none.ok,true);assert.deepEqual(none.images,[]);assert.match(none.notice,/No encontré fotos nuevas/,'No rellena con fotos viejas ni productos dudosos');
const imported=run.post({action:'importBulkResearchImage',proposalId:first.proposalId,imageIndex:0});assert.equal(imported.ok,true);assert.equal(run.copyCount(),1);
assert.equal(run.post({action:'importBulkResearchImage',proposalId:first.proposalId,imageIndex:0}).ok,true);assert.equal(run.copyCount(),1,'La copia elegida admite reintento sin duplicarla');
assert.equal(run.post({id:'B'}).ok,false);assert.equal(run.post({referenceIndex:9}).ok,false);
const changed=setup(),staged=changed.post({});changed.products.A.image='https://cdn.example/otra.png';
assert.equal(changed.post({action:'importBulkResearchImage',proposalId:staged.proposalId,imageIndex:0}).ok,false,'Cambiar la foto exige buscar de nuevo');
const mismatch=setup();mismatch.setConflict();assert.equal(mismatch.post({}).ok,false);assert.equal(mismatch.calls.some(call=>call.url.includes('api.tavily.com')),false,'Una contradicción visible detiene la búsqueda');
const ambiguous=setup();ambiguous.setUncertain();assert.deepEqual(ambiguous.post({}).images,[],'La comparación dudosa no se ofrece para copiar');
const owned=setup();owned.products.A.gallery='https://cdn.example/my-saved-gallery.png';const ownedFirst=owned.post({});assert.deepEqual(ownedFirst.images,['https://cdn.example/rear.png'],'También omite los bytes de fotos que ya están en la galería, aunque tengan otra URL');owned.post({previousProposalId:ownedFirst.proposalId,more:true});assert.equal(owned.calls.filter(call=>call.url.includes('my-saved-gallery')).length,1,'El hash de la galería se reutiliza entre búsquedas');
const quota=setup();quota.setQuota();assert.match(quota.post({}).error,/cuota/);assert.equal(quota.calls.some(call=>call.url.includes('api.tavily.com')),false,'No salta a otro proveedor al agotarse Gemini');
const key=run.context.gcPhotoKey_;assert.equal(key('https://cdn.example/a.png?w=200&utm_source=test'),key('https://cdn.example/a.png?w=900'));assert.notEqual(key('https://cdn.example/image?id=1'),key('https://cdn.example/image?id=2'));
assert.equal(key('https://drive.google.com/thumbnail?id=abc_123&sz=w1200'),key('https://drive.google.com/file/d/abc_123/view'));
console.log('PASS referencia: PIN, foto propia real, comparación visual estricta, variantes, duplicados por URL y bytes, más resultados nuevos, cuota y copias opcionales.');
