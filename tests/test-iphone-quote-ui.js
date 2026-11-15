/* Cotizaciones iPhone: dos toques, vista previa para Fotos y adjunto sin texto en Safari. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'text/html');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/productos.html');
  await page.locator('[data-detail]').first().waitFor();
  await page.evaluate(()=>{
   window.__gcShareData=null;
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__gcShareData={files:data.files?.map(f=>({name:f.name,type:f.type,size:f.size})),text:data.text,url:data.url};}});
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   window.GC_PRODUCT_QUOTE.render=async()=>{const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1400;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1080,1400);ctx.fillStyle='#172e49';ctx.font='70px sans-serif';ctx.fillText('GAMER COMAYAGUA',55,95);return canvas;};
  });
  await page.locator('[data-detail]').first().click();
  await page.locator('#detailOverlay').waitFor({state:'visible'});
  assert.ok((await page.locator('#detailQuote').innerText()).includes('cotización'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sin desbordamiento en iPhone');
  if(process.env.GC_TEST_ARTIFACTS){fs.mkdirSync(process.env.GC_TEST_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.GC_TEST_ARTIFACTS,'ficha-iphone.png')});}
  await page.locator('#detailQuote').click();
  await page.locator('#gcQuotePreview').waitFor({state:'visible'});
  assert.equal(await page.locator('#gcQuoteSend').isEnabled(),true);
  assert.match(await page.locator('#gcQuoteHelp').innerText(),/Guardar en Fotos/);
  assert.ok((await page.locator('#gcQuoteOriginal').getAttribute('href')).startsWith('blob:'));
  if(process.env.GC_TEST_ARTIFACTS)await page.screenshot({path:path.join(process.env.GC_TEST_ARTIFACTS,'cotizacion-iphone.png')});
  await page.locator('#gcQuoteSend').click();
  await page.waitForFunction(()=>!!window.__gcShareData);
  const shared=await page.evaluate(()=>window.__gcShareData);
  assert.equal(shared.files.length,1,'Compartir una imagen');
  assert.equal(shared.files[0].type,'image/png');
  assert.equal(shared.text,undefined,'iPhone no debe recibir texto que reemplace la imagen');
  assert.equal(shared.url,undefined,'iPhone no debe recibir un enlace que reemplace la imagen');
  await page.locator('#gcQuoteClose').click();assert.equal(await page.locator('#gcQuoteOverlay').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS ficha iPhone: cotización con vista previa, imagen lista para Fotos y compartir archivo sin perder el PNG.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
