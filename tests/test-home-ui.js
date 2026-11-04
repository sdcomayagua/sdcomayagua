/* Revisión visual de portada y comparador con catálogo público local. No usa PIN. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[];
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(file)]||'text/plain');res.end(data);});
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.goto(base+'/index.html');
  await page.locator('.home-product').first().waitFor();
  assert.equal(await page.locator('.home-desktop-nav').isVisible(),true);
  assert.equal(await page.locator('#homeProducts .home-product').count()>0,true);
  assert.equal(await page.locator('#installApp').isVisible(),false,'La instalación no aparece si el navegador no la ofrece');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Portada PC sin desborde');
  await page.setViewportSize({width:1840,height:1000});
  const wide=await page.evaluate(()=>{
   const categories=document.getElementById('homeCategories'),products=document.getElementById('homeProducts');
   return {categoriesWidth:categories.getBoundingClientRect().width,productsWidth:products.getBoundingClientRect().width,
    productColumns:getComputedStyle(products).gridTemplateColumns.split(' ').filter(Boolean).length,
    categoriesColumns:getComputedStyle(categories).gridTemplateColumns.split(' ').filter(Boolean).length,
    overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.ok(wide.categoriesWidth>=1840*.93,'Categorías ocupan casi todo el ancho del PC, como el catálogo');
  assert.ok(wide.productsWidth>=1840*.93,'Productos destacados ocupan casi todo el ancho del PC');
  assert.equal(wide.categoriesColumns,4,'Categorías siguen alineadas en cuatro columnas');
  assert.equal(wide.productColumns,6,'Seis productos destacados caben en una fila en PC ancho');
  assert.equal(wide.overflow,false,'Portada ancha sin desplazamiento horizontal');
  await page.setViewportSize({width:980,height:860});
  const tablet=await page.evaluate(()=>({
   categoryColumns:getComputedStyle(document.getElementById('homeCategories')).gridTemplateColumns.split(' ').filter(Boolean).length,
   productColumns:getComputedStyle(document.getElementById('homeProducts')).gridTemplateColumns.split(' ').filter(Boolean).length,
   overflow:document.documentElement.scrollWidth>innerWidth
  }));
  assert.equal(tablet.categoryColumns,2,'Tablet muestra dos categorías por fila');
  assert.equal(tablet.productColumns,3,'Tablet conserva tres productos por fila');
  assert.equal(tablet.overflow,false,'Tablet sin desbordes');
  await page.setViewportSize({width:1365,height:900});
  for(const width of [390,360]){
   await page.setViewportSize({width,height:840});
   assert.equal(await page.locator('.home-mobile-nav').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Portada móvil sin desborde horizontal');
  }
  await page.goto(base+'/productos.html');
  await page.waitForFunction(()=>document.querySelectorAll('[data-compare]').length>2);
  await page.locator('[data-compare]').nth(0).click();
  await page.locator('[data-compare]').nth(1).click();
  assert.equal(await page.locator('#compareDock').isVisible(),true);
  assert.equal(await page.locator('#compareOpen').isEnabled(),true);
  await page.locator('#compareOpen').click();
  assert.equal(await page.locator('#compareOverlay').isVisible(),true);
  assert.equal(await page.locator('.compare-table thead th').count(),3);
  assert.ok((await page.locator('.compare-table').innerText()).includes('Precio'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Comparador móvil sin desborde');
  await page.locator('#compareOverlay [data-close]').click();
  await page.locator('#compareClear').click();
  assert.equal(await page.locator('#compareDock').isVisible(),false);
  await page.locator('[data-add]').first().click();
  const saved=await page.evaluate(()=>localStorage.getItem('gc_cart_v2'));
  assert.ok(saved&&JSON.parse(saved).items,'El carrito se guarda en este navegador');
  await page.goto(base+'/index.html');
  await page.locator('#homeResumeCart').waitFor({state:'visible'});
  assert.match(await page.locator('#homeResumeCart').innerText(),/Retomar carrito/);
  await page.locator('#homeResumeCart').click();
  await page.locator('#cartOverlay').waitFor({state:'visible'});
  assert.equal(await page.locator('#cartOverlay [data-close]').evaluate(el=>el===document.activeElement),true,'El foco inicia dentro del carrito al abrirlo');
  assert.match(await page.locator('.cart-save-note').innerText(),/7 días/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#cartOverlay').isHidden(),true);
  assert.equal(await page.locator('#openCart').evaluate(el=>el===document.activeElement),true,'Al cerrar el carrito el foco vuelve al botón de abrir');
  assert.deepEqual(errors,[]);
  console.log('PASS portada y comparador en PC y móvil.');
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);process.exit(1)});
