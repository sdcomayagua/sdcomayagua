// Ejecutar: node tests/test-ui.js (requiere Playwright y Chromium). Servidor local temporal incluido.
// Las APIs y el PIN de prueba se simulan dentro del navegador. No envía datos a Google.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let base=process.env.GC_TEST_URL,server;
const artifacts=process.env.GC_TEST_ARTIFACTS;
if(artifacts)fs.mkdirSync(artifacts,{recursive:true});
const product={id:'OTG-001',code:'OTG-001',name:'Adaptador OTG USB a TYPE C',category:'Adaptador',price:220,promoPrice:0,cost:80,stock:5,image:'',gallery:'',description:'',discounts:'',colors:'',codAllowed:true,active:true,details:{}};
(async()=>{
 if(!base){
  const root=path.resolve(__dirname,'..');
  server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
 }
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader']}: {})}),context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{
  const url=new URL(route.request().url()),cb=url.searchParams.get('callback');
  if(cb&&url.hostname==='script.google.com')return route.fulfill({contentType:'application/javascript',body:`${cb}(${JSON.stringify({ok:true,pinConfigurado:true,products:[product],settings:{shipping:110,codMinimum:350,codRate:.1,tigoRate:.07},banks:[]})})`});
  return route.abort();
 });
 await page.addInitScript(({product})=>{
  window.__requests=[];
  HTMLFormElement.prototype.submit=function(){
   const input=this.querySelector('[name=payload]');if(!input)throw Error('Formulario inesperado');
   const req=JSON.parse(input.value);window.__requests.push(req);
   let result={ok:true};
   if(req.action==='verify')result.features={details:true,extendedDetails:true,productResearch:true,productResearchVersion:4,productResearchSelection:true};
   if(req.action==='adminCatalog')result={ok:true,products:[product],settings:{shipping:110,codMinimum:350}};
   if(req.action==='researchCandidates')result={ok:true,searchId:'TEST-SEARCH-UUID',candidates:[{id:'0',title:'Adaptador OTG USB-C compacto',url:'https://distribuidor.example/otg',excerpt:'USB-C a USB-A, negro, 12 g.'},{id:'1',title:'Adaptador OTG USB-C aluminio',url:'https://distribuidor.example/otg-aluminio',excerpt:'Cuerpo de aluminio, peso 20 g.'}]};
   if(req.action==='researchProduct'){
    const second=req.selection.candidateId==='1',source={url:'https://distribuidor.example/'+(second?'otg-aluminio':'otg'),title:'Ficha de adaptador OTG'};
    result={ok:true,research:{match:'exact',matchedModel:'Adaptador OTG USB-C',description:second?'Adaptador de aluminio con puerto USB-C.':'Adaptador compacto con puerto USB-C.',category:'Adaptadores',colors:'Negro',details:{weight:second?20:12,weightUnit:'g',connection:'USB-C a USB-A',material:second?'Aluminio':'Plástico'},sources:[source],notes:[],missing:['Medidas'],images:['https://cdn.example/otg.jpg'],price:1,cost:1,stock:999}};
   }
   setTimeout(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://script.google.com',data:{__gcResponse:true,requestId:req.requestId,...result}})),60);
  };
 },{product});
 await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();
 await page.locator('[data-edit="OTG-001"]').waitFor();await page.locator('[data-edit="OTG-001"]').click();
 await page.locator('[name=cost]').fill('80');await page.locator('[name=discounts]').fill('6:200');
 await page.locator('#researchQuery').press('Enter');await page.locator('[data-research-source="0"]').waitFor();
 assert.equal(await page.locator('[name=description]').inputValue(),'','Buscar todavía no completa');
 await page.locator('[data-research-source="0"]').click();await page.locator('#researchStatus').filter({hasText:'campos vacíos completados'}).waitFor();
 assert.equal(await page.locator('[name=weight]').inputValue(),'12');assert.equal(await page.locator('[name=weightUnit]').inputValue(),'g');
 for(const [key,value] of Object.entries({price:'220',cost:'80',stock:'5',discounts:'6:200',code:'OTG-001',category:'Adaptador'}))assert.equal(await page.locator(`[name=${key}]`).inputValue(),value);
 await page.locator('[data-research-source="1"]').click();await page.waitForFunction(()=>document.querySelector('[name=weight]').value==='20');
 assert.equal(await page.locator('[name=description]').inputValue(),'Adaptador de aluminio con puerto USB-C.','Cambiar resultado retira la propuesta anterior');
 await page.locator('[name=description]').fill('Descripción escrita por el dueño.');
 await page.locator('[data-research-source="0"]').click();await page.waitForFunction(()=>document.querySelector('[name=weight]').value==='12');
 assert.equal(await page.locator('[name=description]').inputValue(),'Descripción escrita por el dueño.');
 await page.locator('[data-research-photo="0"]').click();assert.equal(await page.locator('#productImage').inputValue(),'https://cdn.example/otg.jpg');
 await page.setViewportSize({width:390,height:844});if(artifacts)await page.screenshot({path:path.join(artifacts,'admin-mobile.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Editor móvil sin desborde horizontal');
 await page.locator('#researchQuery').fill('Otro artículo');assert.equal(await page.locator('[name=weight]').inputValue(),'','Cambiar consulta retira datos transitorios');
 assert.equal(await page.locator('[name=description]').inputValue(),'Descripción escrita por el dueño.');
 assert.equal(await page.evaluate(()=>window.__requests.filter(r=>r.action==='saveProduct').length),0,'Enter en búsqueda no guarda');
 await page.goto(base+'/pagos.html');await page.locator('#shippingEstimate .estimate-total').waitFor();
 assert.match(await page.locator('#shippingEstimate').innerText(),/L 480/);
 await page.locator('#estimateMethod').selectOption('cod');assert.match(await page.locator('#shippingEstimate').innerText(),/L 528/);assert.match(await page.locator('#shippingEstimate').innerText(),/L 158/);
 await page.locator('#estimateSubtotal').fill('349');assert.match(await page.locator('#shippingEstimate').innerText(),/mínima/);
 await page.locator('#estimateSubtotal').fill('400');await page.locator('#estimateMethod').selectOption('tigo');assert.match(await page.locator('#shippingEstimate').innerText(),/L 546/);
 await page.setViewportSize({width:1440,height:1080});if(artifacts)await page.screenshot({path:path.join(artifacts,'shipping-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});if(artifacts)await page.screenshot({path:path.join(artifacts,'shipping-mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Envíos móvil sin desborde horizontal');
 await page.goto(base+'/productos.html');await page.locator('[data-add]').first().waitFor();await page.locator('[data-add]').first().click();await page.locator('#openCart').click();
 await page.locator('#deliveryFields summary').click();await page.locator('#delivery_name').fill('Cliente de prueba');await page.locator('#delivery_city').fill('Comayagua');
 assert.equal(await page.locator('#delivery_name').inputValue(),'Cliente de prueba');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Carrito móvil sin desborde horizontal');
 assert.deepEqual(errors,[]);
 await browser.close();server?.close();console.log('PASS UI: selección y cambio de fuente, campos manuales, fotos opcionales, Enter sin guardado, calculadora y móvil.');
})().catch(error=>{console.error(error);process.exit(1)});
