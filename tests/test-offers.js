// Cálculos, API autenticada, compatibilidad y conflictos; no toca datos reales.
const assert=require('node:assert/strict'),C=require('../assets/js/core.js'),O=require('../assets/js/admin-offers-model.js'),fixture=require('./helpers/inventory-fixture.js');
const product=(id,extra={})=>({id,name:'Producto '+id,price:199.99,promoPrice:0,promoText:'',stock:5,active:true,revision:'v1',...extra});
assert.equal(C.money(159.99),'L 159.99');assert.equal(C.money(170),'L 170');assert.equal(C.money(2000.5),'L 2,000.50');
for(const [raw,whole] of [[200,200],[200.243,200],[200.52,200],[200.59,200],[200.5999,200],[200.60,201],[200.89,201],[159.60,160],[159.59999999999997,160]]){
 assert.equal(C.roundOfferPrice(raw),whole,'Redondeo de '+raw);
 const legacy=product('LEGACY',{price:300,promoPrice:raw});assert.equal(C.unitPrice(legacy,1),whole,'Promoción anterior con centavos');
 const q=C.quote([{product:legacy,qty:2}],'transfer',{}, {mode:'pickup'});assert.equal(q.subtotal,whole*2);assert.ok(C.waMessage(q.valid,q,'ROUND').includes('2 × '+C.money(whole)));
}
assert.equal(O.individual(product('190',{price:190}),'percent','16').promoPrice,160);
assert.equal(O.individual(product('190',{price:190}),'price','160').promoPrice,160);
assert.equal(O.individual(product('250',{price:250}),'price','200.52').promoPrice,200);
assert.equal(O.individual(product('250',{price:250}),'price','200.60').promoPrice,201);
assert.equal(O.globalPlan([product('190',{price:190})],16).changes[0].promoPrice,160);
assert.equal(C.unitPrice(product('TIER',{price:300,discounts:'2:200.52'}),2),200);
assert.equal(C.unitPrice(product('NORMAL',{price:200.52}),1),200.52,'El precio normal y los costos no se alteran');
for(const bad of ['',null,'-2','100','70.111','1e2','abc',Infinity])assert.throws(()=>O.percent(bad));
assert.equal(O.percent('70'),70);assert.equal(O.percent('20,5'),20.5);
const all=[product('A'),product('B',{price:250,promoPrice:170,promoText:'Solo hoy'}),product('C',{price:400,active:false}),product('D',{price:0}),product('E',{price:150,stock:0})];
const plan=O.globalPlan(all,20);assert.deepEqual(plan.changes.map(x=>[x.id,x.promoPrice]),[['A',160],['E',120]]);assert.deepEqual(plan.skipped,['B']);
assert.equal(O.globalPlan(all,70,'Solo hoy',true).changes.find(x=>x.id==='B').promoPrice,75);
const active=all.map(p=>{const item=plan.changes.find(x=>x.id===p.id);return item?{...p,...item}:p;});
assert.equal(O.general(active[0]).percent,20);assert.equal(O.active(active[1]),true);assert.deepEqual(O.clearGeneral(active).changes.map(p=>p.id),['A','E']);
const special=O.individual(active[0],'price','170','Solo hoy');assert.equal(special.promoPrice,170);assert.equal(special.promoText,'Solo hoy');assert.equal(O.general({...active[0],...special}),null);
assert.equal(O.individual(active[0],'percent','70').promoPrice,60);assert.equal(O.individual(active[0],'percent','0').promoPrice,0);
assert.throws(()=>O.individual(active[0],'price','200'),/menor/);assert.throws(()=>O.individual(active[0],'price','-1'));
assert.throws(()=>O.check({...all[0],revision:'v2'},plan.changes[0]),/cambió/);assert.throws(()=>O.check({...all[0],price:200},plan.changes[0]),/cambió/);
assert.equal(O.payload(all[0],plan.changes[0]).cost,'');assert.equal(O.payload(all[0],plan.changes[0]).stock,5);
const f=fixture();f.context.Utilities={getUuid:()=> 'OFFER-TEST'};
const read=()=>f.context.adminPayload_().products;
let changes=O.globalPlan(read(),20).changes,before=JSON.stringify(f.tables.Productos),writes=f.state.writes;
assert.equal(f.post('saveOffers',{changes},'000000').ok,false);assert.equal(JSON.stringify(f.tables.Productos),before);
assert.equal(f.post('saveOffers',{changes:[changes[0],{...changes[1],promoPrice:250}]}).ok,false);assert.equal(JSON.stringify(f.tables.Productos),before,'Un error no guarda la mitad del lote');
assert.equal(f.post('saveOffers',{changes:[changes[0],changes[0]]}).ok,false);assert.equal(f.state.writes,writes);
const column=key=>f.headers.indexOf(key);f.tables.Productos[1][column('Costo')]='=20+53';
const original=f.tables.Productos.map(row=>row.slice()),saved=f.post('saveOffers',{changes});assert.equal(saved.ok,true);assert.equal(saved.updated.length,2);assert.equal(f.get('A','PrecioPromocion'),176);assert.equal(f.get('A','Costo'),'=20+53');assert.equal(f.state.writes,writes+1);
for(let i=1;i<original.length;i++)for(let j=0;j<f.headers.length;j++)if(!['PrecioPromocion','PromocionTexto','Revision'].includes(f.headers[j]))assert.equal(f.tables.Productos[i][j],original[i][j],f.headers[j]+' se conserva');
assert.equal(f.post('saveOffers',{changes}).ok,true,'Repetir una respuesta perdida es seguro');
const pub=f.context.publicPayload_();assert.equal(pub.products[0].promoPrice,176);assert.equal(pub.products[0].promoText,'Oferta · 20% en todos los productos');assert.equal(JSON.stringify(pub).includes('Costo'),false);assert.ok(pub.products.every(p=>!('cost' in p)&&!('revision' in p)));
const single=O.individual(read()[0],'price','170','Solo hoy');assert.equal(f.post('saveOffers',{changes:[single]}).ok,true);const remaining=O.clearGeneral(read());assert.deepEqual(remaining.changes.map(p=>p.id),['B']);assert.equal(f.post('saveOffers',remaining).ok,true);assert.equal(f.get('A','PrecioPromocion'),170);assert.equal(f.get('B','PrecioPromocion'),'');
const quote=C.quote([{product:{...C.cleanProduct(read()[0]),stock:5},qty:2}],'transfer',{}, {mode:'pickup'});assert.equal(quote.subtotal,340);assert.match(C.waMessage(quote.valid,quote,'TEST'),/2 × L 170/);
const stale=O.individual(read()[0],'price','160');f.tables.Productos[1][column('Revision')]='another-edit';before=JSON.stringify(f.tables.Productos);assert.equal(f.post('saveOffers',{changes:[stale]}).ok,false);assert.equal(JSON.stringify(f.tables.Productos),before);
// Servidores anteriores: saveProduct guarda ambos campos y conserva el costo.
const old=fixture();old.context.Utilities={getUuid:()=> 'OLD-TEST'};const p=old.context.adminPayload_().products[0],item=O.individual(p,'price','170','Solo hoy');assert.equal(old.post('saveProduct',{product:O.payload(p,item)}).ok,true);assert.equal(old.get('A','PrecioPromocion'),170);assert.equal(old.get('A','Costo'),73);assert.equal(old.get('A','Stock'),10);assert.equal(old.get('A','Precio'),220);
console.log('PASS ofertas: enteros con corte en .60, 190 al 16% = 160, promociones anteriores, carrito/WhatsApp, prioridades, persistencia, eliminación, autenticación y conexión anterior.');
