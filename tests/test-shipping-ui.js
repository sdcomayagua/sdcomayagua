// Solo servidor local y catálogo simulado. WhatsApp y la impresión se capturan sin enviar pedidos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),artifacts=process.env.GC_TEST_ARTIFACTS,errors=[];
 const products=[['CABLE-001','Cable USB',120],['CARGADOR-001','Cargador',250]].map(([id,name,price])=>({id,code:id,name,price,category:'Accesorios',stock:5,active:true,codAllowed:true}));
 const settings={shipping:110,codMinimum:350,codRate:.1,tigoRate:.07};
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/data/catalogo-inicial.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.GC_CATALOGO_INICIAL='+JSON.stringify(products)+';'}));
  await context.route('**/data/catalogo-respaldo.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(products)}));
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{
   const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
   if(url.hostname==='script.google.com'&&callback)return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify({ok:true,catalogSchemaVersion:2,products,settings,banks:[]})})`});
   return route.abort();
  });
  await page.addInitScript(()=>{
   window.__opened=[];
   window.open=url=>{const opened={url,html:''};window.__opened.push(opened);return {document:{write:html=>opened.html+=html,close:()=>{}}};};
  });
  const select=mode=>page.locator(`[name=deliveryMethod][value=${mode}]`).check();
  const total=async expected=>assert.equal(await page.locator('#checkoutTotals .total-row.big strong').innerText(),'L '+expected);
  const message=async()=>{await page.locator('#sendQuote').click();const out=await page.evaluate(()=>window.__opened.at(-1));assert.ok(out.url.startsWith('https://wa.me/'));return new URL(out.url).searchParams.get('text');};
  const printed=async()=>{await page.locator('#printQuote').click();const out=await page.evaluate(()=>window.__opened.at(-1));assert.equal(out.url,'');assert.ok(out.html.startsWith('<!doctype html>'));return page.evaluate(html=>new DOMParser().parseFromString(html,'text/html').body.textContent,out.html);};
  await page.goto(base+'/productos.html');await page.locator('#syncStatus').filter({hasText:'Catálogo actualizado'}).waitFor();
  for(const p of products)await page.locator(`[data-add="${p.id}"]`).click();
  await page.locator('#openCart').click();await total('480');assert.equal(await page.locator('#deliveryOptions legend').innerText(),'Entrega y envío');
  assert.ok((await page.locator('#deliveryOptions').boundingBox()).y<(await page.locator('.method-grid').boundingBox()).y,'Entrega aparece antes del pago');
  await select('local');assert.equal(await page.locator('#sendQuote').isDisabled(),true);assert.equal(await page.locator('#printQuote').isDisabled(),true);assert.equal(await page.locator('#deliveryError').isVisible(),true);
  for(const bad of ['-1','2.5','1000001']){await page.locator('#deliveryAmount').fill(bad);assert.equal(await page.locator('#sendQuote').isDisabled(),true);}
  await page.locator('#deliveryAmount').fill('50');await total('420');assert.equal(await page.locator('#deliveryError').isVisible(),false);
  assert.match(await message(),/Entrega: Envío en Comayagua\nEnvío: L 50/);assert.match(await printed(),/Envío en Comayagua/);assert.match(await printed(),/TOTAL A PAGARL 420/);
  await page.locator('#deliveryAmount').fill('0');await total('370');assert.match(await message(),/Envío: L 0/);
  await select('free');await page.locator('#deliveryNote').fill('Compra grande / entrega en mi ruta');await total('370');
  assert.match(await message(),/Motivo del envío gratis: Compra grande \/ entrega en mi ruta/);assert.match(await printed(),/Motivo del envío gratis: Compra grande \/ entrega en mi ruta/);
  await page.locator('[name=payMethod][value=tigo]').check();await total('397');
  await page.locator('[name=payMethod][value=cod]').check();await total('407');assert.equal(await page.locator('.deposit-row strong').innerText(),'L 37');assert.equal(await page.locator('.cash-row strong').innerText(),'L 370');
  assert.match(await message(),/ANTICIPO A DEPOSITAR \(comisión\): L 37/);assert.match(await printed(),/TOTAL A PAGARL 407/);
  await select('pickup');await total('407');assert.match(await message(),/Entrega: Retiro en tienda/);assert.match(await message(),/SALDO EN EFECTIVO AL RETIRAR/);assert.match(await printed(),/SALDO EN EFECTIVO AL RETIRAR/);assert.equal(await page.locator('#deliveryNote').isVisible(),false);
  await page.locator('[name=payMethod][value=transfer]').check();await total('370');
  await select('free');await page.locator('#deliveryNote').fill('<img src=x onerror="window.__shippingXss=1">');
  const quoteText=await printed();assert.match(quoteText,/<img src=x onerror=/);assert.equal(await page.evaluate(()=>window.__shippingXss),undefined);
  await page.locator('#deliveryNote').fill('Entrega en mi ruta');
  settings.shipping=135;
  await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'gc_catalog_revision',newValue:'shipping-test'})));
  await page.locator('#deliveryNationalPrice').filter({hasText:'L 135'}).waitFor();await total('370');assert.equal(await page.locator('[name=deliveryMethod][value=free]').isChecked(),true,'Actualizar catálogo conserva el acuerdo de esta cotización');
  await select('national');await total('505');await select('free');await total('370');
  if(artifacts){fs.mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,'delivery-desktop.png')});}
  for(const width of [390,360]){
   await page.setViewportSize({width,height:844});await page.locator('#deliveryOptions').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Carrito sin desborde móvil');
   assert.equal(await page.locator('#cartOverlay .dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false,'Diálogo sin desborde móvil');
   for(const choice of await page.locator('.delivery-method').all())assert.ok((await choice.boundingBox()).height>=44);
   assert.ok((await page.locator('#deliveryNote').boundingBox()).height>=44);
   if(width===390&&artifacts)await page.screenshot({path:path.join(artifacts,'delivery-mobile.png')});
  }
  await page.locator('#cartOverlay [data-close]').click();await page.locator('#openCart').click();await total('370');assert.equal(await page.locator('#deliveryNote').inputValue(),'Entrega en mi ruta');
  for(const name of ['pagos.html','cuentas.html','productos.html']){
   await page.goto(base+'/'+name);await page.locator('#openCart').click();await total('370');assert.equal(await page.locator('[name=deliveryMethod][value=free]').isChecked(),true);assert.equal(await page.locator('#deliveryNote').inputValue(),'Entrega en mi ruta');
  }
  await page.reload();await page.locator('#openCart').click();await total('370');
  await select('pickup');await page.locator('#clearCart').click();assert.equal(await page.evaluate(()=>sessionStorage.getItem('gc_delivery')),null);
  await page.locator('#cartOverlay [data-close]').click();await page.locator('[data-add="CARGADOR-001"]').click();await page.locator('#openCart').click();await total('385');assert.equal(await page.locator('[name=deliveryMethod][value=national]').isChecked(),true,'Un carrito nuevo vuelve a la tarifa nacional');
  await select('free');await page.locator('[name=payMethod][value=cod]').check();assert.equal(await page.locator('#sendQuote').isDisabled(),true,'Envío gratis conserva el mínimo de pago al recibir');
  await page.locator('[data-remove="CARGADOR-001"]').click();assert.equal(await page.evaluate(()=>sessionStorage.getItem('gc_delivery')),null,'Eliminar el último producto limpia la entrega anterior');
  assert.deepEqual(errors,[]);
  console.log('PASS envío en navegador: montos válidos, cero, retiro, gratis, WhatsApp, PDF, comisiones, catálogo actualizado, navegación, reinicio y móvil.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1);});
