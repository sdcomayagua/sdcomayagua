const assert=require('node:assert/strict');
const L=require('../assets/js/catalog-layout-model'),K=require('../assets/js/admin-kit-model'),C=require('../assets/js/core');
for(const n of [1,2,3,4,5,6,7,8,9,10,11,12]){
 const counts=L.rows(n);assert.equal(counts.reduce((a,b)=>a+b,0),n);
 for(let i=0;i<n;i++){const p=L.position(i,counts);assert.ok(p);assert.ok(p.column>=0&&p.column<p.columns);assert.ok(p.row<counts.length);}
}
assert.deepEqual(L.rows(3),[3]);assert.deepEqual(L.rows(4),[4]);assert.deepEqual(L.rows(8),[4,4]);assert.deepEqual(L.rows(10),[4,3,3]);
const pages=L.pages(Array.from({length:17},(_,i)=>i));assert.deepEqual(pages.map(p=>p.length),[9,8]);
assert.deepEqual(L.pages([1,2,3,4]).map(x=>x.length),[4]);
const p=[
 {id:'D',code:'Dedales-001',name:'Dedales gamer V2',price:34,stock:10,active:true,codAllowed:true,image:'https://example.com/d.jpg'},
 {id:'G',code:'Gatillos-001',name:'Gatillos F6',price:150,stock:6,active:true,codAllowed:true,image:'https://example.com/g.jpg'},
 {id:'A',code:'Audifonos-001',name:'Audífonos',price:220,stock:4,active:true,codAllowed:true,image:'https://example.com/a.jpg'}
];
const draft={name:'Kit gaming completo',items:[{id:'D',qty:2,price:30},{id:'G',qty:1,price:130},{id:'A',qty:1,price:200}],finalPrice:350,freeShipping:true};
const bundle=K.assemble(p,draft);
assert.equal(bundle.totalIndividual,390);
assert.equal(bundle.price,390);assert.equal(bundle.promoPrice,350);assert.equal(bundle.stock,4);
assert.equal(bundle.discounts,'ENVIOGRATIS');assert.equal(bundle.image,p[0].image);assert.match(bundle.description,/Dedales gamer V2/);
const quoted=C.quote([{product:C.cleanProduct(bundle),qty:1}],'transfer',{shipping:110});
assert.equal(quoted.shipping,0);assert.equal(quoted.total,350);
const noFree=K.assemble(p,{...draft,freeShipping:false,finalPrice:425});
assert.equal(noFree.promoPrice,'');assert.equal(noFree.price,425);assert.equal(C.quote([{product:C.cleanProduct(noFree),qty:1}],'transfer',{shipping:110}).shipping,110);
assert.equal(p[0].stock,10,'Armar kit no altera stock de originales');
assert.throws(()=>K.assemble(p,{...draft,items:[{id:'D',qty:1,price:20}]}),/entre 2 y 12/);
assert.throws(()=>K.assemble(p,{...draft,items:[{id:'D',qty:1,price:20},{id:'D',qty:1,price:20}]}),/repetir/);
console.log('PASS distribución automática y creador de kits, precios individuales, stock, envío incluido y carrito.');
