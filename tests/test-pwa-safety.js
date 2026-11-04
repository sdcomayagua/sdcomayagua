const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),events={};
const cache={match:async()=>null,put:async()=>{},addAll:async()=>{}};
const self={registration:{scope:'https://sdcomayagua.github.io/sdcomayagua/'},addEventListener:(name,handler)=>events[name]=handler,skipWaiting:()=>{},clients:{claim:async()=>{}}};
const context={self,caches:{open:async()=>cache,keys:async()=>[]},URL,Response,fetch:async()=>({ok:true,clone(){return this}}),Promise,console};
vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),context);
function intercepted(url,mode='cors',method='GET'){
 let responded=false;
 const event={request:{url,mode,method},respondWith(p){responded=true;Promise.resolve(p).catch(()=>{});},waitUntil(p){Promise.resolve(p).catch(()=>{})}};
 events.fetch(event);return responded;
}
const origin='https://sdcomayagua.github.io/sdcomayagua/';
assert.equal(intercepted(origin+'admin.html','navigate'),false,'Admin sin caché');
assert.equal(intercepted(origin+'data/catalogo-respaldo.json'),false,'Datos de inventario siempre de red');
assert.equal(intercepted('https://script.google.com/macros/s/PRIVATE/exec'),false,'Apps Script no interceptado');
assert.equal(intercepted(origin+'assets/js/admin.js'),false,'Scripts de Admin no cacheados');
assert.equal(intercepted(origin+'assets/css/homepage.css'),true,'Estilos públicos cacheados');
assert.equal(intercepted(origin+'productos.html','navigate'),true,'Navegación pública puede mostrar pantalla sin conexión');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.display,'standalone');
assert.ok(manifest.icons.length>=1);
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
assert.ok(robots.includes('Disallow: /sdcomayagua/admin.html'));
console.log('PASS PWA: caché pública, Admin y datos privados excluidos, manifest y robots.');
