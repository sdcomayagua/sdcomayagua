const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),{chromium}=require('playwright'),fixture=require('./helpers/inventory-fixture.js');
const fx=fixture(),root=path.resolve(__dirname,'..'),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=','base64');
let uploads=0,saves=0,failUpload=2;const backendLog=[];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'text/html');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{
  const u=new URL(route.request().url()),cb=u.searchParams.get('callback');
  if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'application/javascript',body:`window.Tesseract={createWorker:async()=>({setParameters:async()=>{},terminate:async()=>{},recognize:async file=>({data:{text:file.name.includes('dedales')?'DEDALES\\nMEMO\\nMODEL:FS01\\nL.25':'KOUVOLSEN\\nDATA CABLE\\nMODEL:X176\\nC TO C CABLE\\n60W\\n100CM'}})})};`});
  if(cb)return route.fulfill({contentType:'application/javascript',body:cb+'('+JSON.stringify({ok:true,pinConfigurado:true,...fx.context.publicPayload_()})+');'});
  if(u.hostname==='drive.google.com'||u.hostname==='cdn.example')return route.fulfill({contentType:'image/png',body:png});return route.abort();
 });
 await page.exposeFunction('__backend',req=>{
  if(req.action==='uploadImage'){uploads++;if(uploads===failUpload)return {ok:false,error:'Error de carga simulado'};return {ok:true,url:'https://drive.google.com/thumbnail?id=IMG'+uploads+'&sz=w1200'};}
  if(req.action==='saveProduct')saves++;
  const out=fx.post(req.action,Object.fromEntries(Object.entries(req).filter(([k])=>!['action','token','requestId'].includes(k))));backendLog.push({action:req.action,ok:out.ok,error:out.error});return out;
 });
 await page.addInitScript(()=>{window.Tesseract={createWorker:async()=>({setParameters:async()=>{},terminate:async()=>{},recognize:async file=>({data:{text:file.name.includes('dedales')?'DEDALES\nMEMO\nMODEL:FS01\nL.25':'KOUVOLSEN\nDATA CABLE\nMODEL:X176\nC TO C CABLE\n60W\n100CM'}})})};HTMLFormElement.prototype.submit=async function(){const req=JSON.parse(this.querySelector('[name=payload]').value),out=await window.__backend(req);window.dispatchEvent(new MessageEvent('message',{origin:'https://script.google.com',data:{...out,__gcResponse:true,requestId:req.requestId}}));};});
 await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();await page.locator('[data-edit="A"]').waitFor().catch(async error=>{console.error(backendLog,errors,await page.locator('body').innerText());throw error;});
 await page.locator('#photoIntakeOpen').click();await page.locator('#piFiles').setInputFiles([{name:'dedales.png',mimeType:'image/png',buffer:png},{name:'cable.png',mimeType:'image/png',buffer:png}]);
 await page.locator('#piSummary').filter({hasText:'2 por guardar'}).waitFor();await page.locator('#piStop').waitFor({state:'hidden'});
 const cards=page.locator('[data-pi-row]');assert.equal(await cards.count(),2);assert.equal(await cards.nth(0).locator('[data-pi-field=name]').inputValue(),'Dedales MEMO FS01');
 assert.equal(await cards.nth(1).locator('[data-pi-field=price]').inputValue(),'');assert.equal(await cards.nth(1).locator('[data-pi-field=stock]').inputValue(),'');assert.equal(await cards.nth(0).locator('[data-pi-field=active]').isChecked(),false);
 await cards.nth(0).locator('[data-pi-field=stock]').fill('3');await cards.nth(0).locator('[data-pi-field=active]').check();
 await page.locator('#piSave').click();await page.locator('#piGlobal').filter({hasText:'1 ficha guardada.'}).waitFor();assert.equal(saves,1);assert.equal(uploads,2);
 assert.equal(await cards.nth(0).locator('.pi-code').innerText(),'Dedales-001');assert.equal(fx.tables.Productos.filter(r=>r[1]==='Dedales-001').length,1);
 await page.locator('#piSave').click();await page.locator('#piGlobal').filter({hasText:'1 ficha guardada.'}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('.pi-card.is-saved').length===2&&document.querySelector('#piSave').disabled);
 assert.equal(saves,2);assert.equal(uploads,3,'Reintentar no vuelve a subir la foto del producto guardado');assert.equal(fx.tables.Productos.filter(r=>r[1]==='Dedales-001').length,1);
 const cable=fx.tables.Productos.find(r=>String(r[2]).startsWith('Cable KOUVOLSEN'));assert.equal(cable[12],'NO');assert.equal(cable[4],0);assert.equal(cable[6],0);
 if(process.env.GC_TEST_ARTIFACTS){fs.mkdirSync(process.env.GC_TEST_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.GC_TEST_ARTIFACTS,'carga-fotos-desktop.png')});}
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('.pi-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 if(process.env.GC_TEST_ARTIFACTS)await page.screenshot({path:path.join(process.env.GC_TEST_ARTIFACTS,'carga-fotos-mobile.png')});
 await page.locator('#piClose').click();await page.locator('#createNew').click();await page.locator('#uploadFile').setInputFiles({name:'cable.png',mimeType:'image/png',buffer:png});await page.locator('#packageReadStatus').filter({hasText:'campos vacíos completados'}).waitFor();assert.match(await page.locator('[name=name]').inputValue(),/Cable KOUVOLSEN/);assert.equal(await page.locator('[name=power]').inputValue(),'60 W');assert.equal(await page.locator('[name=code]').getAttribute('readonly'),'');
 assert.deepEqual(errors,[]);await browser.close();server.close();console.log('PASS carga de fotos: OCR, campos vacíos, SKU, borradores, guardado parcial, reintentos sin duplicados, extracción en editor y presentación móvil/PC.');
})().catch(e=>{console.error(e);process.exit(1);});
