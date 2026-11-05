const assert=require('node:assert/strict'),Q=require('../assets/js/admin-quick-edit-model'),I=require('../assets/js/local-insights'),P=require('../assets/js/promo-image');
const item={id:'SKU-101',revision:'edit-2026',code:'CTRL-001',name:'Mouse Gamer',category:'Mouse',price:390,promoPrice:300,stock:2,
  image:'https://drive.google.com/thumbnail?id=abc',gallery:'[]',description:'Texto del usuario',discounts:'2:280',details:{brand:'Marca del usuario'},colors:'Negro',costKnown:true,cost:50,codAllowed:true,active:true,bestSeller:false};
const next=Q.payload(item,{price:'350',promoPrice:'290',stock:'3'});
assert.equal(next.price,350);assert.equal(next.stock,3);assert.equal(next.promoPrice,290);
assert.equal(next.description,item.description);assert.deepEqual(next.details,item.details);assert.equal(next.image,item.image);
assert.equal(next.gallery,item.gallery);assert.equal(next.revision,item.revision);
assert.equal(next.cost,'','Nunca se envía el costo al servicio de edición rápida');
assert.equal(next.bestSeller,false);
assert.equal(Q.changed(item,next),true);
assert.equal(Q.changed(item,Q.payload(item,{price:'390',promoPrice:'300',stock:'2'})),false);
for(const [update,pattern] of [
 [{price:'12x',stock:'2',promoPrice:''},/precio/i],
 [{price:'100',stock:'2.5',promoPrice:''},/existencias/i],
 [{price:'100',stock:'2',promoPrice:'105'},/promoción/i],
 [{price:'0',stock:'2',promoPrice:'0'},/precio/i]
])assert.throws(()=>Q.payload(item,update),pattern);
const storage=new Map(),local={getItem:key=>storage.get(key)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const sessions=new Map(),session={getItem:k=>sessions.get(k)||null,setItem:(k,v)=>sessions.set(k,v)};
const now=()=>new Date('2026-11-04T14:00:00-06:00');
const stats=I.create({storage:local,session,now});
assert.equal(stats.record('visit'),true);assert.equal(stats.record('visit'),false,'No cuenta visita duplicada en pestaña');
assert.equal(stats.record('product','SKU-101'),true);assert.equal(stats.record('cart','SKU-101'),true);assert.equal(stats.record('whatsapp','SKU-101'),true);
assert.equal(stats.record('whatsapp','?danger'),false,'ID de producto estricto');
assert.deepEqual(stats.summary().totals,{visit:1,product:1,cart:1,whatsapp:1});
assert.equal(stats.summary().top[0].id,'SKU-101');
assert.equal(storage.get(stats.key).includes('Mouse Gamer'),false,'No guarda nombres ni otros datos privados');
assert.equal(stats.clear(),true);assert.equal(stats.summary().totals.product,0);
const manifest={images:{'SKU-101':{source:item.image,path:'assets/catalog/12345678901234567890abcd.jpg'}}};
assert.equal(P.photoFor(item,manifest),'assets/catalog/12345678901234567890abcd.jpg');
assert.equal(P.photoFor({...item,image:'https://otro.invalid'},manifest),null);
assert.equal(P.photoFor({...item,image:'assets/products/imagen.webp'},{}),'assets/products/imagen.webp');
assert.equal(P.filename(item,'story'),'Gamer-Comayagua-CTRL-001-story.png');
assert.equal(P.variants.story.height,1920);assert.equal(P.variants.feed.height,1350);
console.log('PASS herramientas comerciales: guardado seguro, métricas locales y foto promocional verificada.');
