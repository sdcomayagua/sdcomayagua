// Prueba de descargas directas PNG/PDF en la ventana de cotización real.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[];
 const products=[
  {id:'GAMER-500',code:'GAMER-500',name:'Mouse gamer de prueba L 500',price:500,stock:5,active:true,codAllowed:true,category:'Accesorios'},
  {id:'ADAPTADOR-220',code:'ADAPTADOR-220',name:'Adaptador OTG USB a Type C',price:220,stock:5,active:true,codAllowed:false,category:'Adaptadores'}
 ];
 const settings={shipping:110,codMinimum:350,tigoRate:.10,codRate:.15};
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
   if(err){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'text/html; charset=utf-8');
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1300,height:1000},acceptDownloads:true});
  await context.addInitScript(()=>{window.print=()=>{};});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/data/catalogo-inicial.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.GC_CATALOGO_INICIAL='+JSON.stringify(products)+';'}));
  await context.route('**/data/catalogo-respaldo.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(products)}));
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{
   const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
   if(url.hostname==='script.google.com'&&callback){
    return route.fulfill({contentType:'application/javascript',body:callback+'('+JSON.stringify({ok:true,catalogSchemaVersion:2,products,settings,banks:[]})+');'});
   }
   return route.abort();
  });
  await page.goto(base+'/productos.html');
  await page.locator('#syncStatus').filter({hasText:'Catálogo actualizado'}).waitFor();
  await page.locator('[data-add="GAMER-500"]').click();
  await page.locator('#openCart').click();
  await page.locator('[name=payMethod][value=cod]').check();
  assert.equal(await page.locator('#sendQuote').isEnabled(),true,'Producto único de L 500 habilita pago al recibir');
  const popupPromise=context.waitForEvent('page');
  await page.locator('#printQuoteAll').click();
  const popup=await popupPromise;
  await popup.waitForLoadState('load');
  try{await popup.waitForFunction(()=>!!window.GC_CART_QUOTE_DOWNLOAD,null,{timeout:5000});}
  catch(error){const info=await popup.evaluate(()=>({ready:document.readyState,url:location.href,scripts:[...document.scripts].map(el=>({src:el.src,type:el.type})),bodyEnd:document.body?.innerHTML.slice(-700),hasButtons:!!document.getElementById('gcDirectPdf')}));throw new Error('Popup download debug: '+JSON.stringify(info)+'; errors='+errors.join(' | ')+'; '+error.message);}
  const raw=JSON.parse(await popup.locator('#gcQuoteDownloadData').textContent());
  assert.equal(raw.payments.cod.allowed,true,'La comparación permite COD para producto único de L 500');
  assert.equal(raw.payments.transfer.total,610);
  assert.equal(raw.payments.tigo.total,671);
  assert.equal(raw.payments.cod.total,703);
  assert.ok(await popup.locator('#gcDirectPdf').isVisible());
  assert.ok(await popup.locator('#gcDirectPng').isVisible());
  const [pdfDownload]=await Promise.all([popup.waitForEvent('download'),popup.locator('#gcDirectPdf').click()]);
  assert.match(pdfDownload.suggestedFilename(),/\.pdf$/);
  const pdfFile=fs.readFileSync(await pdfDownload.path());
  assert.equal(pdfFile.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'),true,'PDF generado válido');
  assert.match(pdfFile.toString('latin1'),/\/MediaBox \[0 0 612 792\]/,'PDF tamaño carta');
  const [pngDownload]=await Promise.all([popup.waitForEvent('download'),popup.locator('#gcDirectPng').click()]);
  assert.match(pngDownload.suggestedFilename(),/\.png$/);
  const pngFile=fs.readFileSync(await pngDownload.path());
  assert.equal(pngFile.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Archivo PNG real');
  const printPdf=await popup.pdf({preferCSSPageSize:true,printBackground:true});
  const pageCount=(printPdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert.equal(pageCount,1,'La cotización de un artículo ocupa una sola hoja al imprimir');
  await popup.close();
  await page.locator('#cartOverlay [data-close]').click();
  await page.locator('[data-add="ADAPTADOR-220"]').click();
  await page.locator('#openCart').click();
  const second=context.waitForEvent('page');
  await page.locator('#printQuoteAll').click();
  const restricted=await second;
  await restricted.waitForLoadState('load');
  const disabled=await restricted.locator('.payment-card-disabled').innerText();
  assert.match(disabled,/NO DISPONIBLE/);
  assert.doesNotMatch(disabled,/L 829|L 800|L 8\d\d/,'Pago restringido no muestra precio');
  assert.equal(await restricted.locator('.comparison-subtotal .sumrow').count(),1,'Subtotal sin repeticiones');
  assert.equal(await restricted.locator('#gcDirectPdf').isVisible(),true);
  const screenshot=process.env.GC_TEST_ARTIFACTS&&path.join(root,process.env.GC_TEST_ARTIFACTS,'quote-comparison-print.png');
  if(screenshot){fs.mkdirSync(path.dirname(screenshot),{recursive:true});await restricted.screenshot({path:screenshot,fullPage:true});}
  // Regresión: el pedido REAL de diez artículos debe ocupar una sola hoja carta
  // en PDF y PNG, igual que la impresión en navegador.
  const sampleItems=[
   ['Adaptador OTG USB a TYPE C',220],
   ['Teclado y Mouse Gamer WB-550C',540],
   ['Teclado y Mouse Wire Keyboard (AOAS)',300],
   ['Teclado Wire Keyboard (AOAS)',250],
   ['Gatillos F6 Sarafox',600],
   ['Gamer 1',1100],
   ['OTG con Capturadora 4K',570],
   ['Kit Mobilador V9',1150],
   ['Mouse Redragon Griffin 7200 DPI M607W',590],
   ['Dedales V2 - Fibra de Carbono',35]
  ].map(([name,price])=>({name,qty:1,unit:price,subtotal:price}));
  const sampleData={
   id:'GC-TEST-DIEZ',date:'16 de noviembre de 2026',logo:'',
   compareAll:true,items:sampleItems,delivery:{label:'Envío nacional'},
   base:{subtotal:5355,shipping:110,total:5465,fee:0,rate:0,mode:'transfer',deposit:5465,balance:0},
   payments:{
    transfer:{total:5465,subtotal:5355,shipping:110,fee:0,rate:0,allowed:true,reasons:[]},
    tigo:{total:6013,subtotal:5355,shipping:110,fee:548,rate:.1,allowed:true,reasons:[]},
    cod:{total:6286,subtotal:5355,shipping:110,fee:821,rate:.15,allowed:false,
      reasons:['Estos productos no permiten pago al recibir: Adaptador OTG USB a TYPE C, Teclado y Mouse Gamer WB-550C, Teclado y Mouse Wire Keyboard (AOAS), Teclado Wire Keyboard (AOAS), Gamer 1, OTG con Capturadora 4K, Kit Mobilador V9.']}
   }
  };
  const layoutPage=await context.newPage();
  await layoutPage.goto(base+'/productos.html');
  await layoutPage.evaluate(value=>{
   const json=document.createElement('script');json.id='gcQuoteDownloadData';json.type='application/json';
   json.textContent=JSON.stringify(value);document.body.appendChild(json);
   for(const id of ['gcDirectPdf','gcDirectPng']){
    const button=document.createElement('button');button.id=id;button.textContent=id;
    document.body.appendChild(button);
   }
   const output=document.createElement('output');output.id='gcQuoteDownloadStatus';document.body.appendChild(output);
   window.GC_CART_QUOTE_DOWNLOAD_SETUP(window);
  },sampleData);
  const onePage=await layoutPage.evaluate(async()=>{
   const pages=await window.GC_CART_QUOTE_DOWNLOAD.renderPages();
   const count=pages.length;
   pages.forEach(canvas=>{canvas.width=1;canvas.height=1;});
   return count;
  });
  assert.equal(onePage,1,'Los diez artículos y tres formas de pago deben caber en una sola hoja');
  const [samplePdf]=await Promise.all([layoutPage.waitForEvent('download'),layoutPage.locator('#gcDirectPdf').click()]);
  const samplePdfBytes=fs.readFileSync(await samplePdf.path());
  assert.equal((samplePdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,'PDF directo de diez productos: una sola página');
  const [samplePng]=await Promise.all([layoutPage.waitForEvent('download'),layoutPage.locator('#gcDirectPng').click()]);
  const samplePngBytes=fs.readFileSync(await samplePng.path());
  assert.equal(samplePngBytes.readUInt32BE(16),1600,'PNG ancho de hoja carta');
  assert.equal(samplePngBytes.readUInt32BE(20),2070,'PNG de diez productos sin segunda hoja');
  const moreItems=sampleItems.concat(sampleItems.slice(0,8).map(item=>({...item,name:item.name+' adicional'})));
  const extraPages=await layoutPage.evaluate(async items=>{
   const doc=document.getElementById('gcQuoteDownloadData');
   const data=JSON.parse(doc.textContent);data.items=items;
   data.base.subtotal=items.reduce((sum,item)=>sum+item.subtotal,0);
   doc.textContent=JSON.stringify(data);
   window.GC_CART_QUOTE_DOWNLOAD_SETUP(window);
   const pages=await window.GC_CART_QUOTE_DOWNLOAD.renderPages();
   const count=pages.length,sizes=window.GC_CART_QUOTE_DOWNLOAD.splitItems().map(group=>group.length);
   pages.forEach(canvas=>{canvas.width=1;canvas.height=1;});
   return {count,sizes};
  },moreItems);
  assert.equal(extraPages.count,2,'Dieciocho productos: solo dos hojas');
  assert.ok(extraPages.sizes[0]>=12&&extraPages.sizes[1]>=1,'Repartir según espacio y evitar primera página casi vacía: '+extraPages.sizes.join('/'));
  await layoutPage.close();
  assert.deepEqual(errors,[]);
  console.log('PASS cotizaciones: precio de una unidad, bloqueo COD, PDF carta de una página y descargas PNG/PDF.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1);});
