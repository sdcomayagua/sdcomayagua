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
 // La edición rápida debe mantener características y costos privados.
 await page.locator('#adminRows [data-quick-edit]').first().click();
 await page.locator('#gcQuickOverlay:not([hidden])').waitFor();
 assert.equal(await page.locator('#gcQuickSave').isDisabled(),true);
 await page.locator('#gcQuickForm [name=price]').fill('235');
 await page.locator('#gcQuickForm [name=stock]').fill('6');
 await page.locator('#gcQuickSave').click();
 await page.locator('#gcQuickOverlay[hidden]').waitFor();
 assert.equal(Number(env.get('A','Precio')),235,'Precio confirmado por Google de prueba');
 assert.equal(Number(env.get('A','Stock')),6,'Existencias confirmadas');
 assert.equal(env.get('A','Costo'),73,'Costo privado intacto');
 assert.equal(env.get('A','Descripcion'),'Ficha real','Texto original intacto');
 assert.equal(await page.locator('#gcLocalStats article').count(),4,'Panel local de estadísticas');
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
 const bankLabels=await page.locator('.bank-card .bank-copy-row small').allTextContents();
 assert.deepEqual(bankLabels,['Nombre del titular','Número de identidad','Número de cuenta'],'Identidad debajo del titular y cuenta al final');
 assert.equal(await page.locator('.bank-card .bank-account-primary strong').innerText(),'0012');
 assert.equal(await page.locator('header .nav a[href="index.html"]').count(),1,'Inicio aparece en la navegación de Cuentas');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator('.mobile-nav a[href="index.html"]').isVisible(),true,'Inicio disponible en navegación móvil de Cuentas');
 await page.setViewportSize({width:1280,height:900});

 await page.getByRole('button',{name:'Copiar todos los datos',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),'Banco de prueba\nTitular: Gabriel de prueba\nIdentidad: 0000\nCuenta: 0012');
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Cuentas sin desborde en '+width);const box=await page.locator('.bank-copy-all').boundingBox();assert.ok(box.height>=44);}

 // Contraste bancario y ancho responsivo. Datos ficticios; no hay PIN ni cuentas reales en las pruebas.
 for(const width of [320,390,768,1280,1830]){
  await page.setViewportSize({width,height:920});
  const layout=await page.evaluate(()=>{
   const card=document.querySelector('.bank-card'),row=card?.querySelector('.bank-account-primary'),
    value=row?.querySelector('strong'),button=row?.querySelector('button'),heading=document.querySelector('.page-banner');
   const lum=color=>{
    const rgb=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
    const cv=n=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};
    return .2126*cv(rgb[0])+.7152*cv(rgb[1])+.0722*cv(rgb[2]);
   };
   const l=lum(getComputedStyle(value).color),b=lum(getComputedStyle(row).backgroundColor);
   return {overflow:document.documentElement.scrollWidth>innerWidth,
    contrast:(Math.max(l,b)+.05)/(Math.min(l,b)+.05),
    valueVisible:value.getBoundingClientRect().width>0,
    accountText:value.textContent.trim(),
    rowRight:row.getBoundingClientRect().right,
    buttonRight:button.getBoundingClientRect().right,
    headingWidth:heading.getBoundingClientRect().width
   };
  });
  assert.equal(layout.overflow,false,'Cuentas sin scroll horizontal a '+width+'px');
  assert.ok(layout.contrast>=7,'Número de cuenta claramente legible a '+width+'px');
  assert.ok(layout.valueVisible&&layout.accountText==='0012','Cuenta de prueba visible y completa');
  assert.ok(layout.buttonRight<=layout.rowRight+1,'Copiar cuenta no se sale de la tarjeta');
  if(width>=1280)assert.ok(layout.headingWidth>=width*.88,'Se aprovecha el ancho de escritorio');
 }
 await page.goto(base+'/pagos.html');
 await page.locator('.estimate-total strong').waitFor();
 for(const width of [320,390,768,1280,1830]){
  await page.setViewportSize({width,height:920});
  const layout=await page.evaluate(()=>{
   const form=document.querySelector('.shipping-calc-form'),label=form.querySelector('label'),
     calculator=document.querySelector('.shipping-calculator'),total=document.querySelector('.estimate-total strong'),
     result=document.querySelector('.shipping-calc-result');
   const lum=color=>{
    const rgb=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
    const cv=n=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};
    return .2126*cv(rgb[0])+.7152*cv(rgb[1])+.0722*cv(rgb[2]);
   };
   const ratio=(a,b)=>{const l=lum(a),m=lum(b);return (Math.max(l,m)+.05)/(Math.min(l,m)+.05)};
   return {overflow:document.documentElement.scrollWidth>innerWidth,
    labelContrast:ratio(getComputedStyle(label).color,getComputedStyle(calculator).backgroundColor),
    totalContrast:ratio(getComputedStyle(total).color,getComputedStyle(result).backgroundColor),
    totalText:total.textContent,
    calculatorWidth:calculator.getBoundingClientRect().width,
    totalRight:total.getBoundingClientRect().right,
    resultRight:result.getBoundingClientRect().right};
  });
  assert.equal(layout.overflow,false,'Pagos sin scroll horizontal a '+width+'px');
  assert.ok(layout.labelContrast>=7,'Etiquetas del cálculo legibles a '+width+'px');
  assert.ok(layout.totalContrast>=7,'Total del pedido legible a '+width+'px');
  assert.ok(layout.totalText.includes('480'),'Se conserva el total correcto de la cotización');
  assert.ok(layout.totalRight<=layout.resultRight+1,'Total no se sale de la calculadora');
  if(width>=1280)assert.ok(layout.calculatorWidth>=width*.88,'Calculadora aprovecha el ancho de PC');
 }
 assert.deepEqual(errors,[]);await browser.close();await new Promise(resolve=>server.close(resolve));
 console.log('PASS navegador: sesión restaurada sin diagnóstico, filtros y sección conservados, vencimiento, cierre explícito, bancos y copias con titular en celular y PC.');
})().catch(error=>{console.error(error);process.exit(1);});
