/* Portada = Productos, navegación móvil de cuatro accesos y compra sin regresiones. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[],out=process.env.GC_TEST_ARTIFACTS||'';
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(file)]||'text/plain');res.end(data);
  });
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.goto(base+'/index.html?buscar=mouse');
  await page.locator('#productGrid .product').first().waitFor({state:'visible'});
  assert.match(page.url(),/\/productos\.html\?buscar=mouse/,'La portada abre Productos conservando filtros');
  assert.equal(await page.locator('header .nav a[href="index.html"]').count(),0,'Inicio desaparece del menú PC');
  assert.equal(await page.locator('header .nav a[href="productos.html"]').count(),1,'Productos queda activo en PC');
  assert.equal(await page.locator('#gcHeaderSearch').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'PC sin desborde');
  await page.goto(base+'/index.html');
  await page.locator('#productGrid .product').first().waitFor({state:'visible'});
  await page.setViewportSize({width:1840,height:990});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'PC grande sin desborde');
  assert.ok(await page.locator('#productGrid .product').count()>2);
  await page.setViewportSize({width:980,height:860});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Tablet sin desborde');
  for(const width of [320,360,390,760]){
   await page.setViewportSize({width,height:844});
   const layout=await page.evaluate(()=>{
    const card=document.querySelector('#productGrid .product'),button=card.querySelector('[data-add]'),grid=document.querySelector('#productGrid');
    return {overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
     radius:parseFloat(getComputedStyle(card).borderTopLeftRadius),buttonHeight:button.getBoundingClientRect().height,
     mobileTabs:document.querySelectorAll('.mobile-nav > a,.mobile-nav > button').length,
     noInicio:![...document.querySelectorAll('.mobile-nav a')].some(a=>a.textContent.trim()==='Inicio'),
     bottom:Math.round(document.querySelector('.mobile-nav').getBoundingClientRect().bottom-innerHeight)
    };
   });
   assert.equal(layout.overflow,false,'Sin desplazamiento horizontal a '+width+'px');
   assert.equal(layout.columns,2,'Dos tarjetas por fila a '+width+'px');
   assert.ok(layout.radius>=16,'Tarjetas redondeadas');
   assert.ok(layout.buttonHeight>=44,'Agregar cómodo al tacto');
   assert.equal(layout.mobileTabs,4,'Cuatro pestañas: Productos, Pagos, Cuentas, Carrito');
   assert.equal(layout.noInicio,true,'Inicio desaparece de móvil');
   assert.ok(Math.abs(layout.bottom)<=2,'La barra llega hasta el borde de pantalla');
  }
  await page.setViewportSize({width:390,height:844});
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'catalogo-390-v6.png')});}
  await page.locator('#gcViewToggle').click();
  assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('productGrid')).gridTemplateColumns.split(' ').filter(Boolean).length),1,'Vista de lista');
  assert.equal(await page.locator('#gcViewToggle').getAttribute('aria-pressed'),'true');
  if(out)await page.screenshot({path:path.join(out,'catalogo-lista-v6.png')});
  await page.locator('#gcViewToggle').click();
  assert.equal(await page.locator('#gcViewToggle').getAttribute('aria-pressed'),'false');
  await page.locator('#gcQuickOffers').click();
  assert.equal(await page.locator('#gcQuickOffers').getAttribute('aria-pressed'),'true');
  assert.match(page.url(),/ofertas=1/);
  await page.locator('#gcQuickOffers').click();
  await page.locator('#gcQuickShipping').click();
  assert.equal(await page.locator('#gcQuickShipping').getAttribute('aria-pressed'),'true');
  assert.match(page.url(),/envio=gratis/);
  await page.locator('#gcQuickShipping').click();
  await page.locator('#gcHeaderSearch').click();
  assert.equal(await page.locator('#search').evaluate(el=>document.activeElement===el),true,'Búsqueda accesible desde cabecera');
  await page.locator('#search').fill('teclado');
  assert.equal(await page.locator('#gcClearSearch').isVisible(),true);
  await page.locator('#gcClearSearch').click();
  assert.equal(await page.locator('#search').inputValue(),'');
  await page.locator('#search').blur();
  await page.locator('[data-compare]').nth(0).click();
  await page.locator('[data-compare]').nth(1).click();
  assert.equal(await page.locator('#compareDock').isVisible(),true);
  await page.locator('#compareOpen').click();
  assert.equal(await page.locator('#compareOverlay').isVisible(),true);
  await page.locator('#compareOverlay [data-close]').click();
  await page.locator('#compareClear').click();
  await page.locator('[data-add]').first().click();
  const saved=await page.evaluate(()=>localStorage.getItem('gc_cart_v2'));
  assert.ok(saved&&JSON.parse(saved).items,'El carrito sigue guardándose');
  await page.goto(base+'/index.html?carrito=1');
  await page.locator('#cartOverlay').waitFor({state:'visible'});
  assert.match(page.url(),/productos\.html/,'El enlace antiguo al carrito llega al catálogo nuevo');
  assert.match(await page.locator('.cart-save-note').innerText(),/7 días/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Carrito sin desborde');
  if(out)await page.screenshot({path:path.join(out,'carrito-390-v6.png')});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#cartOverlay').isHidden(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS 20 mejoras: portada Productos, 4 pestañas, filtros, grid/lista, botones táctiles, búsqueda, comparador y carrito.');
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);process.exitCode=1;});
