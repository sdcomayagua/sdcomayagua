/* Prueba real del nuevo protocolo; la API y los productos son ficticios. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright'),fixture=require('./helpers/inventory-fixture');
(async()=>{
 const root=path.resolve(__dirname,'..'),env=fixture(),errors=[],calls=[],secret='gc_'+('ab'.repeat(32));
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(data);});
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844}});
 const base='http://127.0.0.1:'+server.address().port;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
 await page.exposeFunction('__backend',req=>{
  calls.push({action:req.action,token:req.token});
  if(req.action==='health')return {ok:true,pinConfigurado:true};
  if(req.action==='verify'){
   if(req.token!=='123456'&&req.token!==secret)return {ok:false,error:'Tu sesión venció.'};
   const response=env.post('verify',{...req,token:'123456'});
   return {...response,features:{...response.features,sessionTokens:true},sessionToken:secret};
  }
  if(req.action==='sessionLogout')return {ok:req.token===secret};
  if(req.action==='sessionPing')return {ok:req.token===secret};
  if(req.token!==secret)return {ok:false,error:'Tu sesión venció.'};
  return env.post(req.action,{...req,token:'123456'});
 });
 await page.addInitScript(()=>{window.GC_GOOGLE_PANEL={request:req=>window.__backend(req)};});
 try{
  await page.goto(base+'/admin.html');await page.locator('#secret').fill('123456');await page.locator('#loginBtn').click();
  await page.locator('#adminPanel:not(.hidden)').waitFor();
  const stored=await page.evaluate(()=>localStorage.getItem('gc_admin_session_v1'));
  assert.ok(stored.includes(secret),'Sesión del servidor guardada');
  assert.equal(stored.includes('123456'),false,'PIN no guardado en localStorage');
  await page.goto(base+'/productos.html');await page.goto(base+'/admin.html');
  await page.locator('#adminPanel:not(.hidden)').waitFor();
  assert.ok(calls.some(c=>c.action==='verify'&&c.token===secret),'El regreso utiliza token, no PIN');
  assert.ok(calls.some(c=>c.action==='adminCatalog'&&c.token===secret),'Las lecturas usan token');
  await page.locator('#logout').click();await page.locator('#loginPanel:not(.hidden)').waitFor();
  assert.ok(calls.some(c=>c.action==='sessionLogout'&&c.token===secret),'Cerrar sesión revoca token remotamente');
  assert.equal(await page.evaluate(()=>localStorage.getItem('gc_admin_session_v1')),null);
  assert.deepEqual(errors,[]);
  console.log('PASS navegador: login con PIN, sesión opaca, restauración y revocación remota.');
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);process.exit(1)});
