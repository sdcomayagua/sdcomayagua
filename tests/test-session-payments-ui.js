// Datos ficticios; nunca consulta ni modifica el inventario real.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright'),fixture=require('./helpers/inventory-fixture');
(async()=>{
 const env=fixture(),root=path.resolve(__dirname,'..'),requests=[],errors=[];let transientVerifyFailure=false;
 const publicData={...env.post('publicCatalog'),banks:[{bank:'Banco de prueba',owner:'Gabriel de prueba',account:'0012',identity:'0000',visible:true},{bank:'Oculta',account:'9999',visible:false},{bank:'Tigo Money',owner:'Titular Tigo de prueba',account:'0000-0000',visible:true}]};
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(error,content)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(content);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}}),base='http://127.0.0.1:'+server.address().port;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const url=new URL(route.request().url()),callback=url.searchParams.get('callback');if(callback&&url.searchParams.get('action')!=='health')return route.fulfill({contentType:'application/javascript',body:callback+'('+JSON.stringify(publicData)+');'});return route.abort();});
 await page.exposeFunction('__backend',req=>{requests.push(req.action);if(req.action==='health')return {ok:false,error:'Diagnóstico bloqueado de prueba'};if(req.action==='verify'&&transientVerifyFailure){transientVerifyFailure=false;return {ok:false,error:'Google temporalmente no responde.'};}return env.post(req.action,req);});
 await page.addInitScript(()=>{window.GC_GOOGLE_PANEL={request:req=>window.__backend(req)};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});});
 await page.clock.install();
 await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();await page.locator('#adminRows [data-edit]').first().waitFor();
 await page.locator('#adminSearch').fill('Cable');await page.locator('#adminSort').selectOption('name');await page.locator('#adminSection').selectOption('stock');
 const healthCount=requests.filter(action=>action==='health').length;
 await page.goto(base+'/productos.html');await page.clock.fastForward(10000);await page.goto(base+'/admin.html');
 await page.locator('#adminPanel:not(.hidden)').waitFor();
 assert.equal(await page.locator('#loginPanel').isHidden(),true,'Regresar después de 10 segundos mantiene el Admin abierto');
 transientVerifyFailure=true;
 await page.goto(base+'/productos.html');await page.clock.fastForward(10000);await page.goto(base+'/admin.html');
 await page.locator('#adminPanel:not(.hidden)').waitFor();
 assert.equal(await page.locator('#loginPanel').isHidden(),true,'Un error transitorio de Google se recupera sin pedir PIN');

 await page.goto(base+'/productos.html');await page.clock.fastForward(599000);await page.goto(base+'/admin.html');await page.locator('#adminPanel:not(.hidden)').waitFor();
 assert.equal(requests.filter(action=>action==='health').length,healthCount,'Restaurar no depende del diagnóstico público bloqueado');
 assert.equal(await page.locator('#adminSearch').inputValue(),'Cable');assert.equal(await page.locator('#adminSort').inputValue(),'name');assert.equal(await page.locator('#adminSection').inputValue(),'stock','Se conserva la sección elegida');
 await page.clock.fastForward(600000);await page.locator('#loginPanel:not(.hidden)').waitFor();assert.match(await page.locator('#loginMessage').innerText(),/10 minutos/);assert.equal(await page.locator('#adminPanel').isHidden(),true,'Al vencer se ocultan los datos privados');
 await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();await page.locator('#adminPanel:not(.hidden)').waitFor();await page.locator('#logout').click();await page.locator('#loginPanel:not(.hidden)').waitFor();await page.reload();assert.equal(await page.locator('#loginPanel').isVisible(),true,'Cerrar sesión no restaura el acceso');
 await page.clock.resume();
 await page.goto(base+'/cuentas.html');await page.locator('.bank-card').first().waitFor();assert.equal(await page.locator('.bank-card').count(),2,'Solo se muestran cuentas publicadas');
 await page.locator('#bankFilter').selectOption('Banco de prueba');assert.equal(await page.locator('.bank-card').count(),1);await page.getByRole('button',{name:'Copiar Nombre del titular',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),'Gabriel de prueba');
 await page.getByRole('button',{name:'Copiar todos los datos',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),'Banco de prueba\nTitular: Gabriel de prueba\nCuenta: 0012\nIdentidad: 0000');
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Cuentas sin desborde en '+width);const box=await page.locator('.bank-copy-all').boundingBox();assert.ok(box.height>=44);}
 assert.deepEqual(errors,[]);await browser.close();await new Promise(resolve=>server.close(resolve));
 console.log('PASS navegador: sesión restaurada sin diagnóstico, filtros y sección conservados, vencimiento, cierre explícito, bancos y copias con titular en celular y PC.');
})().catch(error=>{console.error(error);process.exit(1);});
