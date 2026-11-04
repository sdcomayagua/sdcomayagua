const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const C=require('../assets/js/core.js');
const nodes={homeCategories:{innerHTML:''},homeProducts:{innerHTML:''},homeHeroPhotos:{innerHTML:''},homeYear:{textContent:''}};
const callbacks={};
const context={window:{GC:C},document:{getElementById:id=>nodes[id]||null,readyState:'loading',addEventListener:(key,cb)=>{callbacks[key]=cb}},fetch:async()=>({ok:true,json:async()=>[]}),setTimeout,clearTimeout,Date,URL,console};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/homepage.js'),'utf8'),context);
const p=(id,category,overrides={})=>({id,code:id,name:'Artículo '+id,category,price:390,stock:2,image:'assets/products/demo.webp',active:true,createdAt:'2026-11-01T10:00:00Z',...overrides});
let result=context.window.GC_HOME.display([
 p('MOUSE-1','Mouse',{name:'Mouse <script>alert(1)</script>',image:'javascript:alert(1)'}),
 p('TECLADO-1','Teclados',{price:600,promoPrice:450}),
 p('SOPORTE-1','Soportes',{stock:0}),
 p('AUDIO-1','Audio',{active:false})
]);
assert.equal(result.count,2);
assert.ok(nodes.homeCategories.innerHTML.includes('categoria=Mouse'));
assert.ok(nodes.homeProducts.innerHTML.includes('producto=MOUSE-1'));
assert.ok(nodes.homeProducts.innerHTML.includes('L 450'));
assert.ok(!nodes.homeProducts.innerHTML.includes('<script>'));
assert.ok(nodes.homeProducts.innerHTML.includes('sin-foto.svg'));
assert.equal((nodes.homeProducts.innerHTML.match(/class="home-product"/g)||[]).length,2);
assert.ok(nodes.homeHeroPhotos.innerHTML.includes('TECLADO-1'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(!html.includes('http-equiv="refresh"'),'La portada ya no redirige automáticamente');
assert.ok(html.includes('application/ld+json'));
assert.ok(html.includes('id="installApp"'));
console.log('PASS portada: categorías, productos públicos, SEO y contenido escapado.');
