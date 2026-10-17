// Flujos masivos en Chromium con Google y el PIN completamente simulados.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=process.env.GC_TEST_ARTIFACTS;
if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
const make=(id,extra={})=>({id,code:'SKU-'+id,name:'Artículo '+id,category:'Accesorios',price:220,promoPrice:200,cost:80,stock:5,image:'',gallery:'',description:'',colors:'',discounts:'6:180',codAllowed:true,active:true,details:{},...extra});
const inventory=[make('A',{image:'https://cdn.example/principal.jpg'}),make('B',{description:'Descripción manual de B.',details:{brand:'Marca manual'}}),make('C')];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader']}: {})});
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],requests=[],proposals=new Map(),copies=new Map();let serial=0,failC=true,failB=true,stageDelay=0,bulkReady=true;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{
  const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
  if(callback)return route.fulfill({contentType:'application/javascript',body:callback+'('+JSON.stringify({ok:true,pinConfigurado:true})+')'});
  if(url.hostname==='cdn.example'||url.hostname==='drive.google.com')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="#e9f1fa"/><rect x="70" y="30" width="60" height="90" rx="10" fill="#254c72"/><circle cx="100" cy="72" r="18" fill="#92b6d9"/></svg>'});
  return route.abort();
 });
 await page.exposeFunction('__bulkTestBackend',async req=>{
  requests.push(req);
  if(req.action==='verify')return {ok:true,features:{details:true,extendedDetails:true,productResearch:true,productResearchSelection:true,bestSellers:true,publicCatalogMetadata:true,researchImageImport:true,researchPhotos:true,bulkResearch:bulkReady}};
  if(req.action==='adminCatalog')return {ok:true,products:inventory,settings:{shipping:110,codMinimum:350}};
  if(req.action==='researchBulkItem'){
   if(stageDelay)await new Promise(resolve=>setTimeout(resolve,stageDelay));
   if(req.mode==='info'&&req.id==='C'&&failC){failC=false;return {ok:false,error:'Esta fuente no respondió. Probá otra búsqueda.'};}
   const previous=proposals.get(req.previousProposalId),p=inventory.find(p=>p.id===req.id),pageIndex=req.more?(previous.page+1):0;
   const fields=[{key:'description',label:'Descripción',value:'Descripción encontrada para '+p.id,unit:''},{key:'brand',label:'Marca',value:'Marca encontrada',unit:''},{key:'material',label:'Material',value:'Aluminio',unit:''}].filter(field=>field.key==='description'?!p.description:!p.details[field.key]);
   const data={ok:true,proposalId:'PROPOSAL-'+(++serial),productId:p.id,query:req.query,candidates:[{id:'0',title:'Fuente correcta para '+p.name,url:'https://maker.example/'+p.id},{id:'1',title:'Otra fuente de '+p.name,url:'https://other.example/'+p.id}],candidateId:req.candidateId||'0',source:{title:'Fuente del producto',url:'https://maker.example/'+p.id},fields:req.mode==='info'?fields:[],images:req.mode==='photos'?[0,1,2].map(i=>'https://cdn.example/'+p.id+'-'+pageIndex+'-'+i+'.jpg'):[],page:pageIndex,photoCapacity:10-[p.image,...p.gallery.split(', ')].filter(Boolean).length,mode:req.mode,id:p.id};
   proposals.set(data.proposalId,data);return data;
  }
  if(req.action==='importBulkResearchImage'){
   const data=proposals.get(req.proposalId),key=req.proposalId+':'+req.imageIndex;
   if(data.id==='B'&&req.imageIndex===1&&failB){failB=false;return {ok:false,error:'La foto no se pudo descargar. Reintentá.'};}
   if(!copies.has(key))copies.set(key,'https://drive.google.com/thumbnail?id='+key.replace(':','-'));
   return {ok:true,url:copies.get(key)};
  }
  if(req.action==='applyBulkResearch'){
   const p=inventory.find(p=>p.id===req.id);let addedPhotos=0,appliedFields=[];
   if(req.photos){const existing=[p.image,...p.gallery.split(', ')].filter(Boolean),urls=req.photos.map(photo=>copies.get(photo.proposalId+':'+photo.imageIndex));assert.ok(urls.every(Boolean));const all=[...new Set([...existing,...urls])];p.image=all[0];p.gallery=all.slice(1).join(', ');addedPhotos=all.length-existing.length;}
   else{const proposal=proposals.get(req.proposalId);for(const key of req.fields){const field=proposal.fields.find(field=>field.key===key);if(key==='description')p.description=field.value;else p.details[key]=field.value;appliedFields.push(key);}}
   return {ok:true,id:p.id,addedPhotos,appliedFields};
  }
  return {ok:false,error:'Operación inesperada: '+req.action};
 });
 await page.addInitScript(()=>{HTMLFormElement.prototype.submit=async function(){const req=JSON.parse(this.querySelector('[name=payload]').value),result=await window.__bulkTestBackend(req);setTimeout(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://script.google.com',data:{__gcResponse:true,requestId:req.requestId,...result}})),20);};});
 const base='http://127.0.0.1:'+server.address().port;
 await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();await page.locator('[data-edit="A"]').waitFor();
 const row=id=>page.locator('[data-bulk-row="'+id+'"]');
 await page.locator('#bulkPhotos').click();await page.locator('#bulkSelectAll').click();await page.locator('#bulkSearchSelected').click();await page.locator('#bulkStatus').filter({hasText:'Búsqueda terminada'}).waitFor();
 assert.equal(await page.locator('[data-bulk-row]').count(),3);assert.equal(requests.some(req=>req.action==='applyBulkResearch'),false,'Preparar tres artículos no guarda nada');
 await row('A').locator('[data-bulk-photo="0"]').check();const firstA=requests.find(req=>req.action==='researchBulkItem'&&req.id==='A');
 await row('A').locator('[data-more-photos]').click();await page.locator('#bulkStatus').filter({hasText:'Propuesta actualizada'}).waitFor();
 assert.equal(await row('A').locator('.bulk-chosen-photo').count(),1,'Buscar más conserva la foto ya elegida');
 await row('A').locator('[data-bulk-photo="1"]').check();await page.locator('#bulkFirstPhotos').click();await row('B').locator('[data-bulk-photo="1"]').check();await row('C').locator('[data-bulk-approve]').uncheck();
 assert.match(await page.locator('#bulkReadyCount').innerText(),/2 artículos/);
 if(artifacts)await page.screenshot({path:path.join(artifacts,'bulk-photos-desktop.png')});
 await page.setViewportSize({width:390,height:844});await row('A').scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Lote móvil sin desborde');assert.equal(await page.locator('#bulkSave').isVisible(),true);
 if(artifacts)await page.screenshot({path:path.join(artifacts,'bulk-photos-mobile.png')});
 await page.locator('#bulkSave').click();await page.locator('#bulkStatus').filter({hasText:'1 por reintentar'}).waitFor();
 assert.equal(requests.filter(req=>req.action==='applyBulkResearch'&&req.id==='A').length,1);assert.equal(requests.filter(req=>req.action==='applyBulkResearch'&&req.id==='B').length,0);assert.equal(requests.filter(req=>req.action==='applyBulkResearch'&&req.id==='C').length,0);
 assert.equal(inventory[0].image,'https://cdn.example/principal.jpg');assert.equal(inventory[0].gallery.split(', ').length,2,'Se agregan fotos de dos páginas distintas');
 await page.locator('#bulkSave').click();await page.locator('#bulkStatus').filter({hasText:'Proceso terminado. 1 artículo guardado.'}).waitFor();
 assert.equal(requests.filter(req=>req.action==='applyBulkResearch'&&req.id==='A').length,1,'El reintento omite los artículos ya guardados');assert.equal(requests.filter(req=>req.action==='applyBulkResearch'&&req.id==='B').length,1);assert.equal(inventory[2].image,'','No modifica el artículo desmarcado');
 await row('A').locator('[data-row-search]').filter({hasText:'Preparar de nuevo'}).click();await page.locator('#bulkStatus').filter({hasText:'Propuesta actualizada'}).waitFor();assert.equal(await row('A').locator('.bulk-chosen-photo').count(),0,'Preparar otro lote omite las fotos ya aplicadas');
 await page.locator('#bulkClose').click();await page.locator('#bulkInfo').click();await page.locator('#bulkSelectAll').click();await page.locator('#bulkSearchSelected').click();await page.locator('#bulkStatus').filter({hasText:'Búsqueda terminada'}).waitFor();
 assert.equal(await row('C').locator('.bulk-item-error').count(),1);assert.equal(await row('B').locator('[data-bulk-field="description"]').count(),0,'No ofrece reemplazar datos escritos a mano');
 await row('A').locator('[data-bulk-field="brand"]').uncheck();await page.locator('#bulkSelectReady').click();await row('B').locator('[data-bulk-approve]').uncheck();
 assert.match(await page.locator('#bulkReadyCount').innerText(),/1 artículo/);
 if(artifacts)await page.screenshot({path:path.join(artifacts,'bulk-information-mobile.png')});
 await page.locator('#bulkSave').click();await page.locator('#bulkStatus').filter({hasText:'Proceso terminado. 1 artículo guardado.'}).waitFor();
 assert.equal(inventory[0].description,'Descripción encontrada para A');assert.equal(inventory[0].details.material,'Aluminio');assert.equal(inventory[0].details.brand,undefined,'El campo desmarcado se conserva vacío');
 assert.equal(inventory[1].description,'Descripción manual de B.');assert.equal(inventory[1].details.material,undefined);assert.equal(inventory[2].description,'');
 const before=requests.filter(req=>req.action==='researchBulkItem'&&req.mode==='info').length;
 await page.locator('#bulkSearchSelected').click();await page.locator('#bulkStatus').filter({hasText:'Búsqueda terminada'}).waitFor();assert.equal(requests.filter(req=>req.action==='researchBulkItem'&&req.mode==='info').length,before+1,'Continuar consulta solo el artículo que falló');
 await page.locator('#bulkClose').click();await page.reload();await page.locator('[data-edit="A"]').waitFor();
 stageDelay=250;const start=requests.filter(req=>req.action==='researchBulkItem').length;
 await page.locator('#bulkInfo').click();await page.locator('#bulkSelectAll').click();await page.locator('#bulkSearchSelected').click();await page.locator('#bulkStop').click();await page.locator('#bulkStatus').filter({hasText:'Búsqueda detenida'}).waitFor();assert.equal(requests.filter(req=>req.action==='researchBulkItem').length,start+1,'Detener espera al actual y no inicia el siguiente');
 bulkReady=false;await page.locator('#bulkClose').click();await page.reload();await page.locator('[data-edit="A"]').waitFor();await page.locator('#bulkPhotos').click();await page.locator('#bulkSelectAll').click();assert.equal(await page.locator('#bulkSetup').isVisible(),true);assert.equal(await page.locator('#bulkSearchSelected').isDisabled(),true,'El servidor anterior muestra activación y conserva el panel');
 for(const p of inventory){assert.equal(p.price,220);assert.equal(p.promoPrice,200);assert.equal(p.stock,5);assert.equal(p.cost,80);}
 assert.deepEqual(errors,[]);await browser.close();server.close();
 console.log('PASS UI lotes: selección múltiple, buscar más sin perder fotos, campos por artículo, guardado elegido, reintentos parciales, progreso, detener y móvil.');
})().catch(error=>{console.error(error);process.exit(1);});
