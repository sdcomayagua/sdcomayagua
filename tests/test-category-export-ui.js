// Todas las escrituras usan inventario ficticio. Los archivos compartidos se capturan sin enviarlos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{chromium}=require('playwright'),fixture=require('./helpers/inventory-fixture');
(async()=>{
 const root=path.resolve(__dirname,'..'),artifacts=process.env.GC_TEST_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'gc-catalog-')),fx=fixture(),errors=[],calls=[];fs.mkdirSync(artifacts,{recursive:true});
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.exposeFunction('__catalogAdmin',req=>{calls.push(req);const {action,token,...extra}=req;return fx.post(action,extra,token);});
  await page.addInitScript(()=>{window.GC_GOOGLE_PANEL={request:req=>window.__catalogAdmin(req)};});
  await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();await page.locator('[data-delete-product="A"]').waitFor();
  assert.equal(await page.locator('[data-delete-product="A"]').isEnabled(),true);
  await page.locator('[data-delete-product="A"]').click();await page.locator('#productDeleteOverlay').waitFor({state:'visible'});assert.match(await page.locator('#productDeleteSummary').innerText(),/Control A/);
  await page.locator('#productDeleteCancel').click();assert.equal(calls.filter(r=>r.action==='deleteProduct').length,0);
  await page.locator('[data-delete-product="A"]').click();await page.locator('#productDeleteOverlay').press('Escape');assert.equal(calls.filter(r=>r.action==='deleteProduct').length,0);
  await page.locator('[data-delete-product="A"]').click();await page.locator('#productDeleteConfirm').click();await page.locator('#productDeleteOverlay').waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelectorAll('[data-delete-product]').length===1);
  assert.equal(fx.get('A','Stock'),10);assert.equal(fx.get('A','Costo'),73);assert.equal(fx.get('A','Activo'),'NO');
  await page.locator('#adminFilter').selectOption('trash');await page.locator('[data-restore-product="A"]').waitFor();assert.equal(await page.locator('[data-edit="A"]').count(),0);assert.equal(await page.locator('#adminTrashNotice').isVisible(),true);
  await page.locator('[data-restore-product="A"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-restore-product]').length===0);assert.equal(fx.get('A','Activo'),'SI');
  await page.locator('#adminFilter').selectOption('');await page.locator('[data-delete-product="A"]').waitFor();
  for(const width of [390,360]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok((await page.locator('[data-delete-product="A"]').boundingBox()).height>=44);}
  await page.locator('[data-delete-product="B"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(artifacts,'delete-mobile.png')});await page.locator('#productDeleteCancel').click();
  await page.close();

  const names=['Dedales V1 - Fibra de Carbón','Dedales V2 - Hilo de Plata','Dedales Gamer Pro de doble capa para pantalla táctil','Dedales de tejido transpirable','Dedales V5','Dedales MEMO para celular','Dedales edición azul','Dedales agotados'];
  const products=names.map((name,index)=>({id:'DEDAL-'+index,code:'Dedales-'+String(index+1).padStart(3,'0'),name,category:'Dedales',price:index===0?25:40+index*10,promoPrice:index===1?45:0,stock:index===7?0:20-index,active:true,codAllowed:true,image:index===2?'https://drive.google.com/thumbnail?id=PUBLIC_MIRROR_PHOTO&sz=w1200':'assets/products/kouvolsen-x36-usb-c.webp',cost:999999}));
  products[0].description='Tejido cómodo para jugar en pantallas táctiles.';products[0].details={material:'Fibra de carbono'};products[0].gallery='assets/products/voltrax-vc07-65w.webp';
  products.push({id:'OTHER',name:'Artículo de otra categoría',category:'Otros',price:999,stock:3,active:true},{id:'HIDDEN',name:'Producto privado oculto',category:'Dedales',price:999,stock:4,active:false});
  const photoBytes=fs.readFileSync(path.join(root,'assets/products/voltrax-vc07-65w.webp')),context=await browser.newContext({viewport:{width:1440,height:1050}}),catalog=await context.newPage();catalog.on('pageerror',error=>errors.push(error.message));
  await context.route('**/data/catalogo-inicial.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.GC_CATALOGO_INICIAL='+JSON.stringify(products)+';'}));
  await context.route('**/data/catalogo-respaldo.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(products)}));
  await context.route('**/data/catalogo-fotos.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({images:{'DEDAL-2':{source:products[2].image,path:'assets/catalog/0123456789abcdef01234567.webp'}}})}));
  await context.route('**/assets/catalog/0123456789abcdef01234567.webp',route=>route.fulfill({contentType:'image/webp',body:photoBytes}));
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const url=new URL(route.request().url()),callback=url.searchParams.get('callback');if(url.hostname==='script.google.com'&&callback)return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify(url.searchParams.get('action')==='catalogPhotos'?{ok:true,images:[{id:'DEDAL-2',data:'data:image/webp;base64,'+photoBytes.toString('base64')}]}:{ok:true,catalogSchemaVersion:2,products,settings:{shipping:110},banks:[]})})`});return route.abort();});
  await catalog.addInitScript(()=>{window.__shared=[];Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>data.files?.length===1});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared.push({title:data.title,files:data.files.map(f=>({name:f.name,type:f.type,size:f.size}))});}});});
  const ready=()=>catalog.waitForFunction(()=>document.getElementById('catalogExportDownload')?.getAttribute('aria-disabled')==='false'&&!document.getElementById('catalogExportPrices').disabled);
  const download=async filename=>{const promise=catalog.waitForEvent('download');await catalog.locator('#catalogExportDownload').click();const file=await promise;await file.saveAs(path.join(artifacts,filename));return fs.readFileSync(path.join(artifacts,filename));};
  await catalog.goto(base+'/productos.html?categoria=Dedales');
  await catalog.locator('[data-detail="DEDAL-0"]').first().click();await catalog.locator('#detailOpenPhoto').waitFor();
  assert.equal(await catalog.locator('#detailOpenPhoto').getAttribute('target'),'_blank');
  await catalog.locator('[data-photo-index="1"]').click();assert.match(await catalog.locator('#detailOpenPhoto').getAttribute('href'),/voltrax-vc07-65w/);assert.match(await catalog.locator('#detailPhotoCount').innerText(),/2 de 2/);
  await catalog.screenshot({path:path.join(artifacts,'detail-desktop.png')});
  for(const width of [390,360,320]){await catalog.setViewportSize({width,height:844});assert.equal(await catalog.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await catalog.locator('#detailContent').evaluate(el=>el.scrollWidth>el.clientWidth),false);}
  await catalog.screenshot({path:path.join(artifacts,'detail-mobile.png')});await catalog.locator('#detailOverlay [data-close]').click();await catalog.setViewportSize({width:1440,height:1050});
  await catalog.locator('#exportCategory').click();await ready();assert.equal(await catalog.locator('#catalogExportCategory').innerText(),'Dedales');assert.match(await catalog.locator('#catalogExportCount').innerText(),/^8 productos/);assert.equal(await catalog.locator('#catalogExportRetry').isVisible(),false);
  assert.match(await catalog.locator('#catalogExportPage').innerText(),/Página 1 de 2/);
  const png=await download('catalogo.png');assert.equal(png.readUInt32BE(16),3060);assert.equal(png.readUInt32BE(20),3960);
  await catalog.locator('#catalogExportNext').click();assert.match(await catalog.locator('#catalogExportPreview').getAttribute('alt'),/Página 2 de 2/);assert.match(await catalog.locator('#catalogExportDownload').getAttribute('download'),/_02\.png$/);await download('catalogo-pagina-2.png');
  await catalog.locator('#catalogExportShare').click();assert.equal((await catalog.evaluate(()=>window.__shared.at(-1))).files[0].type,'image/png');
  await catalog.locator('#catalogExportFormat').selectOption('pdf');const pdf=await download('catalogo.pdf');assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');assert.equal((pdf.toString('latin1').match(/\/Type \/Page \/Parent/g)||[]).length,2);
  const start=Number(pdf.toString('latin1').match(/startxref\n(\d+)/)[1]);assert.equal(pdf.subarray(start,start+4).toString(),'xref');
  assert.match(pdf.toString('latin1'),/\/BaseFont \/GCCatalog-Bold/);assert.match(pdf.toString('latin1'),/\/Encoding \/WinAnsiEncoding/);assert.match(pdf.toString('latin1'),/\/FontFile2 /);
  assert.equal((pdf.toString('latin1').match(/\/Subtype \/Link/g)||[]).length,10);
  await catalog.locator('#catalogExportDensity').selectOption('6');await ready();await download('catalogo-compacto.pdf');
  await catalog.locator('#catalogExportFormat').selectOption('image');await download('catalogo-compacto.png');await catalog.locator('#catalogExportFormat').selectOption('pdf');
  await catalog.locator('#catalogExportDensity').selectOption('4');await ready();
  await catalog.locator('#catalogExportShare').click();assert.equal((await catalog.evaluate(()=>window.__shared.at(-1))).files[0].type,'application/pdf');
  await catalog.locator('#catalogExportOut').uncheck();await ready();assert.match(await catalog.locator('#catalogExportCount').innerText(),/^7 productos/);
  await catalog.locator('#catalogExportPrices').uncheck();await ready();assert.equal(await catalog.locator('#catalogExportPricesHelp').isVisible(),true);await catalog.locator('#catalogExportPrices').check();await ready();assert.equal(await catalog.locator('#catalogExportPricesHelp').isVisible(),false);
  await catalog.setViewportSize({width:1440,height:1050});await catalog.screenshot({path:path.join(artifacts,'catalog-export-desktop.png')});
  for(const width of [390,360]){await catalog.setViewportSize({width,height:844});assert.equal(await catalog.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await catalog.locator('#catalogExportOverlay .dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.ok((await catalog.locator('#catalogExportDownload').boundingBox()).height>=44);}
  await catalog.screenshot({path:path.join(artifacts,'catalog-export-mobile.png')});
  await catalog.locator('#catalogExportClose').click();await catalog.locator('#search').fill('no existe este producto');await catalog.locator('#exportCategory').click();await catalog.locator('#catalogExportEmpty').filter({hasText:'No hay productos'}).waitFor();assert.equal(await catalog.locator('#catalogExportDownload').getAttribute('href'),null);await catalog.locator('#catalogExportClose').click();
  await catalog.locator('#search').fill('');await catalog.locator('#exportCategory').click();await ready();await catalog.locator('#catalogExportOverlay').press('Escape');assert.equal(await catalog.locator('#catalogExportOverlay').isVisible(),false);
  await catalog.locator('#search').fill('edición azul');await catalog.locator('#exportCategory').click();await ready();assert.match(await catalog.locator('#catalogExportCount').innerText(),/^1 producto/);await download('catalogo-un-producto.png');await catalog.locator('#catalogExportClose').click();
  await catalog.locator('#search').fill('');await catalog.locator('#category').selectOption('');await catalog.locator('#exportCategory').click();await ready();assert.equal(await catalog.locator('#catalogExportGroupLabel').isVisible(),true);await catalog.locator('#catalogExportFormat').selectOption('pdf');
  const grouped=(await download('catalogo-ordenado.pdf')).toString('latin1');assert.ok(grouped.indexOf('producto=OTHER')>grouped.indexOf('producto=DEDAL-'));assert.equal((grouped.match(/\/Type \/Page \/Parent/g)||[]).length,3);
  await catalog.locator('#catalogExportGroup').uncheck();await ready();const recent=(await download('catalogo-recientes.pdf')).toString('latin1');assert.ok(recent.indexOf('producto=OTHER')<recent.indexOf('producto=DEDAL-'));await catalog.locator('#catalogExportClose').click();
  assert.deepEqual(errors,[]);console.log('PASS catálogo y papelera UI: eliminar/cancelar/restaurar, stock intacto, filtros completos, fotos, PNG, PDF paginado, compartir nativo y móvil.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1);});
