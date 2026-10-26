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
 const newest={...product,id:'NEW-001',code:'NEW-001',name:'Producto recién agregado',category:'Novedades',price:350,createdAt:'2026-10-17T02:00:00Z',catalogOrder:1};
 product.createdAt='2026-10-15T02:00:00Z';product.catalogOrder=0;
 const inventory=[product,newest],requests=[];
 // Esta prueba conserva el transporte anterior. El catálogo actual con API
 // separada y sin lecturas de la hoja privada se verifica en category-export-ui.
 await context.route('**/assets/js/config.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.resolve(__dirname,'../assets/js/config.js'),'utf8').replace(/publicApiUrl:\s*'[^']*'/,"publicApiUrl: ''").replace('privateInventory: true','privateInventory: false')}));
 let publicGetFails=false,publicPostFails=false,publicSheetHasMetadata=false,publicPostGate=null;
 const publicProducts=()=>inventory.map(({cost,...p})=>p);
 const settings={shipping:110,codMinimum:350,codRate:.1,tigoRate:.07};
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{
  const url=new URL(route.request().url()),cb=url.searchParams.get('callback');
  if(cb&&url.hostname==='script.google.com')return route.fulfill({contentType:'application/javascript',body:publicGetFails&&url.searchParams.get('action')==='public'?'/* Google no ejecutó el callback. */':`${cb}(${JSON.stringify({ok:true,pinConfigurado:true,catalogSchemaVersion:2,products:publicProducts(),settings,banks:[]})})`});
  if(url.hostname==='docs.google.com'&&url.searchParams.get('gid')==='87012030'){
   const callback=(url.searchParams.get('tqx')||'').split('responseHandler:')[1];
   const headers=['ID','Codigo','Nombre','Categoria','Precio','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Colores','PrecioPromocion','PromocionTexto','Detalles'];
   const keys=['id','code','name','category','price','stock','image','gallery','description','discounts','codAllowed','active','colors','promoPrice','promoText','details'];
   if(publicSheetHasMetadata){headers.push('MasPedidos','FechaCreacion');keys.push('bestSeller','createdAt');}
   const rows=publicProducts().map(p=>({c:keys.map(key=>({v:key==='details'?'{}':key==='description'?'Descripción antigua de la hoja':p[key]??''}))}));
   await new Promise(resolve=>setTimeout(resolve,250));
   return route.fulfill({contentType:'application/javascript',body:`${callback}(${JSON.stringify({status:'ok',table:{cols:headers.map(label=>({label})),rows}})})`});
  }
  if(url.hostname==='drive.google.com'&&['TEST_MANAGED_PHOTO','TEST_SECOND_PHOTO'].includes(url.searchParams.get('id'))||url.hostname==='cdn.example')return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=','base64')});
  return route.abort();
 });
 await page.exposeFunction('__testBackend',async req=>{
  if(req.action==='publicCatalog'&&publicPostGate)await publicPostGate;
  requests.push(req);let result={ok:true};
  if(req.action==='verify')result.features={details:true,extendedDetails:true,productResearch:true,productResearchVersion:6,productResearchSelection:true,bestSellers:true,publicCatalogMetadata:true,researchImageImport:true,researchPhotos:true};
  if(req.action==='adminCatalog')result={ok:true,products:inventory,settings};
  if(req.action==='publicCatalog')result=publicPostFails?{ok:false,error:'Sin acceso público'}:{ok:true,catalogSchemaVersion:2,products:publicProducts(),settings};
  if(req.action==='setBestSeller'){inventory.find(p=>p.id===req.id).bestSeller=req.bestSeller;result.bestSeller=req.bestSeller;}
  if(req.action==='saveProduct'){Object.assign(inventory.find(p=>p.id===req.product.id),req.product);result.id=req.product.id;}
  if(req.action==='importResearchImage')result.url='https://drive.google.com/thumbnail?id='+(req.photoSearch?'TEST_SECOND_PHOTO':'TEST_MANAGED_PHOTO')+'&sz=w1200';
  if(req.action==='researchImages')result={ok:true,research:{images:['https://cdn.example/solo-foto.jpg'],selectedSource:{url:'https://distribuidor.example/otg',title:'Fotos del artículo'}}};
  if(req.action==='researchCandidates')result={ok:true,searchId:'TEST-SEARCH-UUID',candidates:[{id:'0',title:'Adaptador OTG USB-C compacto',url:'https://distribuidor.example/otg',excerpt:'USB-C a USB-A, negro, 12 g.'},{id:'1',title:'Adaptador OTG USB-C aluminio',url:'https://distribuidor.example/otg-aluminio',excerpt:'Cuerpo de aluminio, peso 20 g.'},{id:'2',title:'Video que debe ocultarse',url:'https://www.tiktok.com/video/12'}]};
  if(req.action==='researchProduct'){
   const second=req.selection.candidateId==='1',source={url:'https://distribuidor.example/'+(second?'otg-aluminio':'otg'),title:'Ficha de adaptador OTG'};
   result={ok:true,research:{match:'partial',matchedModel:'Adaptador OTG USB-C',description:second?'Adaptador de aluminio con puerto USB-C.':'Adaptador compacto con puerto USB-C.',category:'Adaptadores',colors:'Negro',details:{weight:second?20:12,weightUnit:'g',connection:'USB-C a USB-A',material:second?'Aluminio':'Plástico'},sources:[source],notes:[],missing:['Medidas'],images:['https://cdn.example/otg.jpg'],price:1,cost:1,stock:999}};
  }
  return result;
 });
 await page.addInitScript(()=>{
  window.__requests=[];window.__copied='';
  Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}});
  HTMLFormElement.prototype.submit=async function(){
   const input=this.querySelector('[name=payload]');if(!input)throw Error('Formulario inesperado');
   const req=JSON.parse(input.value);window.__requests.push(req);const result=await window.__testBackend(req);
   setTimeout(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://script.google.com',data:{__gcResponse:true,requestId:req.requestId,...result}})),30);
  };
 });
 await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();
 await page.locator('[data-edit="OTG-001"]').waitFor();await page.locator('[data-best-seller="OTG-001"]').click();await page.waitForFunction(()=>document.querySelector('[data-best-seller="OTG-001"]').getAttribute('aria-pressed')==='true');await page.locator('#refresh').click();await page.locator('[data-edit="OTG-001"]').click();
 await page.locator('#financeCostEditor summary').click();await page.locator('[name=cost]').fill('80');await page.locator('[name=discounts]').fill('6:200');
 await page.locator('#researchQuery').press('Enter');await page.locator('[data-research-source="0"]').waitFor();assert.equal(await page.locator('[data-research-source="2"]').count(),0,'Los videos no se ofrecen como fichas');
 assert.equal(await page.locator('[name=description]').inputValue(),'','Buscar todavía no completa');
 await page.locator('[data-research-source="0"]').click();await page.locator('#researchStatus').filter({hasText:'campos vacíos completados'}).waitFor();
 assert.equal(await page.locator('[name=weight]').inputValue(),'12');assert.equal(await page.locator('[name=weightUnit]').inputValue(),'g');
 for(const [key,value] of Object.entries({price:'220',cost:'80',stock:'5',discounts:'6:200',code:'OTG-001',category:'Adaptador'}))assert.equal(await page.locator(`[name=${key}]`).inputValue(),value);
 await page.locator('[data-research-source="1"]').click();await page.waitForFunction(()=>document.querySelector('[name=weight]').value==='20');
 assert.equal(await page.locator('[name=description]').inputValue(),'Adaptador de aluminio con puerto USB-C.','Cambiar resultado retira la propuesta anterior');
 await page.locator('[name=description]').fill('Descripción escrita por el dueño.');
 await page.locator('[data-research-source="0"]').click();await page.waitForFunction(()=>document.querySelector('[name=weight]').value==='12');
 assert.equal(await page.locator('[name=description]').inputValue(),'Descripción escrita por el dueño.');
 await page.locator('[data-research-photo="0"]').click();await page.waitForFunction(()=>document.getElementById('productImage').value.includes('TEST_MANAGED_PHOTO'));assert.equal(requests.some(r=>r.action==='importResearchImage'),true);
 await page.setViewportSize({width:390,height:844});if(artifacts)await page.screenshot({path:path.join(artifacts,'admin-mobile.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Editor móvil sin desborde horizontal');
 await page.locator('#researchQuery').fill('Otro artículo');assert.equal(await page.locator('[name=weight]').inputValue(),'12','Cambiar consulta conserva los datos ya completados');
 assert.equal(await page.locator('[name=description]').inputValue(),'Descripción escrita por el dueño.');
 assert.equal(await page.evaluate(()=>window.__requests.filter(r=>r.action==='saveProduct').length),0,'Enter en búsqueda no guarda');
 await page.locator('#saveBtn').click();await page.waitForFunction(()=>document.getElementById('formOverlay').hidden);
 await page.locator('[data-edit="OTG-001"]').click();assert.equal(await page.locator('[name=weight]').inputValue(),'12','Guardar y reabrir conserva las características');assert.match(await page.locator('#productImage').inputValue(),/TEST_MANAGED_PHOTO/);
 const researchCalls=requests.filter(r=>r.action==='researchProduct').length;
 await page.locator('#findPhotosBtn').click();await page.locator('[data-research-source="0"]').filter({hasText:'Ver fotos'}).click();await page.locator('[data-research-photo="0"]').waitFor();
 assert.equal(requests.filter(r=>r.action==='researchProduct').length,researchCalls,'Buscar solo fotos no consulta ni modifica la ficha técnica');
 if(artifacts)await page.screenshot({path:path.join(artifacts,'photos-only-mobile.png')});
 assert.equal(await page.locator('[name=description]').inputValue(),'Descripción escrita por el dueño.');
 await page.locator('[data-research-photo="0"]').click();await page.waitForFunction(()=>document.getElementById('galleryInput').value.includes('TEST_SECOND_PHOTO'));
 assert.match(await page.locator('#productImage').inputValue(),/TEST_MANAGED_PHOTO/,'Copiar otra foto conserva la principal');
 await page.locator('#saveBtn').click();await page.waitForFunction(()=>document.getElementById('formOverlay').hidden);
 await page.locator('#adminFilter').selectOption('photos');assert.equal(await page.locator('[data-edit]').count(),1);assert.equal(await page.locator('[data-edit]').getAttribute('data-edit'),'NEW-001');
 await page.locator('#adminFilter').selectOption('requested');assert.equal(await page.locator('[data-edit]').count(),1);assert.equal(await page.locator('[data-edit]').getAttribute('data-edit'),'OTG-001');
 await page.locator('#adminFilter').selectOption('');
 await page.goto(base+'/pagos.html');await page.locator('#shippingEstimate .estimate-total').waitFor();
 assert.match(await page.locator('#shippingEstimate').innerText(),/L 480/);
 await page.locator('#estimateMethod').selectOption('cod');assert.match(await page.locator('#shippingEstimate').innerText(),/L 528/);assert.match(await page.locator('#shippingEstimate').innerText(),/L 158/);
 await page.locator('#estimateSubtotal').fill('349');assert.match(await page.locator('#shippingEstimate').innerText(),/mínima/);
 await page.locator('#estimateSubtotal').fill('400');await page.locator('#estimateMethod').selectOption('tigo');assert.match(await page.locator('#shippingEstimate').innerText(),/L 547/);
 await page.setViewportSize({width:1440,height:1080});if(artifacts)await page.screenshot({path:path.join(artifacts,'shipping-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});if(artifacts)await page.screenshot({path:path.join(artifacts,'shipping-mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Envíos móvil sin desborde horizontal');
 publicGetFails=true;
 await page.goto(base+'/productos.html?categoria=Adaptador');
 await page.waitForFunction(()=>document.querySelectorAll('[data-add]').length===1&&document.querySelector('[data-add]').dataset.add==='OTG-001');
 assert.equal(await page.locator('#bestSellersSection').isVisible(),true);
 assert.ok(requests.some(r=>r.action==='publicCatalog'),'GET bloqueado debe usar POST aunque la hoja pública responda');
 if(artifacts){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(artifacts,'most-requested-mobile.png')});}
 assert.equal(await page.locator('#category').inputValue(),'Adaptador','Un enlace de categoría abre el filtro correcto');
 await page.locator('#shareCategory').click();await page.waitForFunction(()=>window.__copied.includes('categoria=Adaptador'));
 const categoryLink=await page.evaluate(()=>window.__copied);assert.ok(!categoryLink.includes('producto='));
 await page.locator('[data-detail="OTG-001"]').first().click();await page.locator('#detailShare').click();
 await page.waitForFunction(()=>window.__copied.includes('producto=OTG-001'));
 const productLink=await page.evaluate(()=>window.__copied);
 assert.ok(!productLink.includes('categoria='),'El enlace del producto no hereda filtros');
 await page.locator('#detailOverlay [data-close]').click();
 await page.locator('#search').fill('producto que no existe');await page.locator('.catalog-empty').waitFor();
 assert.equal(await page.locator('#clearFilters').isVisible(),true);assert.ok(new URL(page.url()).searchParams.has('buscar'));
 await page.locator('#clearFilters').click();assert.equal(await page.locator('#category').inputValue(),'');assert.equal(await page.locator('#search').inputValue(),'');assert.equal(new URL(page.url()).searchParams.has('buscar'),false);
 if(artifacts)await page.screenshot({path:path.join(artifacts,'catalog-mobile.png')});
 assert.equal(await page.locator('[data-add]').first().getAttribute('data-add'),'NEW-001','Los más recientes se muestran primero');
 await page.locator('#viewBestSellers').click();assert.match(await page.locator('#catalogHeading').innerText(),/Más pedidos/);assert.equal(await page.locator('[data-add]').count(),1);await page.locator('#clearFilters').click();
 await page.locator('[data-add="OTG-001"]').click();await page.locator('#openCart').click();
 assert.match(await page.locator('#codAvailability').innerText(),/Te faltan L 130/);
 await page.locator('[data-qty="OTG-001"][data-step="1"]').click();assert.match(await page.locator('#codAvailability').innerText(),/disponible/);
 await page.locator('[name=payMethod][value=tigo]').check();assert.match(await page.locator('#checkoutTotals').innerText(),/L 590/);
 await page.locator('#deliveryFields summary').click();await page.locator('#delivery_name').fill('Cliente de prueba');await page.locator('#delivery_city').fill('Comayagua');
 assert.equal(await page.locator('#delivery_name').inputValue(),'Cliente de prueba');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Carrito móvil sin desborde horizontal');
 if(artifacts)await page.screenshot({path:path.join(artifacts,'cart-mobile.png')});
 let allowPublicPost;publicPostGate=new Promise(resolve=>{allowPublicPost=resolve;});
 await page.goto(productLink);await page.locator('#detailTitle').filter({hasText:'Adaptador OTG USB a TYPE C'}).waitFor();
 assert.equal(await page.locator('#detailOverlay').isVisible(),true,'El enlace compartido abre directamente su producto');
 await page.locator('#detailContent').filter({hasText:'Descripción antigua de la hoja'}).waitFor();
 await page.locator('[data-photo-index="1"]').click();
 allowPublicPost();publicPostGate=null;
 await page.locator('#detailContent').filter({hasText:'Plástico'}).waitFor();assert.match(await page.locator('#detailContent').innerText(),/Descripción escrita por el dueño/);
 assert.match(await page.locator('#detailPhoto').getAttribute('src'),/TEST_SECOND_PHOTO/,'Una respuesta posterior actualiza la ficha conservando la foto elegida');
 assert.equal(await page.locator('[data-photo-index="1"]').evaluate(el=>el===document.activeElement),true,'La actualización conserva el foco en la galería');
 await page.locator('#detailAdd').focus();const previousBuy=await page.locator('#detailAdd').elementHandle();product.price+=1;
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'gc_catalog_revision'})));
 await page.waitForFunction(button=>!button.isConnected,previousBuy);
 assert.equal(await page.locator('#detailAdd').evaluate(el=>el===document.activeElement),true,'La actualización conserva el foco en el botón de compra fijo');
 assert.match(await page.locator('#detailPurchaseBar').innerText(),/L 221/,'La barra de compra muestra el precio actualizado');
 const savedPublic=JSON.stringify(publicProducts());
 await context.route('**/data/catalogo-respaldo.json?*',route=>route.fulfill({contentType:'application/json',body:savedPublic}));
 publicPostFails=true;
 await page.goto(base+'/productos.html?coleccion=mas-pedidos');await page.waitForTimeout(600);
 assert.equal(await page.locator('[data-add="OTG-001"]').count(),1,'Una hoja antigua conserva las marcas del respaldo cuando ambos canales API fallan');
 product.bestSeller=false;publicSheetHasMetadata=true;
 await page.reload();await page.waitForTimeout(600);
 assert.equal(await page.locator('#bestSellersSection').isVisible(),false,'La hoja con metadatos puede quitar una estrella anterior');
 assert.equal(await page.locator('[data-add]').count(),0);
 assert.deepEqual(errors,[]);
 await browser.close();server?.close();console.log('PASS UI: selección y cambio de fuente, campos manuales, fotos opcionales, Enter sin guardado, calculadora, redondeo adicional, enlaces para compartir, filtros y móvil.');
})().catch(error=>{console.error(error);process.exit(1)});

