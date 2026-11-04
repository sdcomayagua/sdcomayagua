const assert=require('node:assert/strict'),M=require('../assets/js/admin-quality-model.js');
const p=(id,patch={})=>({id,code:'GC-'+id,name:'Artículo '+id,category:'Gamer',price:200,cost:100,costKnown:false,
 stock:2,active:true,image:'assets/products/producto.webp',gallery:'[]',description:'Descripción específica con medidas, material, conexiones y accesorios de fabricación.',
 details:{model:'Gamer 2026'},...patch});
const list=[
 p('A',{image:'',gallery:'[]',description:'',price:0}),
 p('B',{gallery:JSON.stringify(['https://drive.google.com/thumbnail?id=123','https://drive.google.com/thumbnail?id=456'])}),
 p('C',{stock:0,promoPrice:210,code:'GC-A'}),
 p('D',{image:'',gallery:'https://drive.google.com/thumbnail?id=123',description:'Producto disponible en Gamer Comayagua. Ideal para clientes que buscan buena calidad.'}),
 p('E',{active:false,image:'',description:''})
];
const rows=M.analyze(list),sum=M.summary(rows);
assert.equal(rows.length,4,'Los productos inactivos no entran en la auditoría activa');
assert.equal(sum.missingPhotos,1,'Se detecta la falta total de fotografías');
assert.equal(sum.singlePhoto,2,'Se identifican los artículos con una sola foto');
assert.equal(sum.descriptions,2,'Se detectan textos ausentes y genéricos');
assert.equal(sum.prices,2,'Se detectan precios inválidos y promociones no válidas');
assert.equal(sum.out,1,'Agotados visibles');
assert.equal(M.filter(rows,{key:'photo'}).length,3);
assert.equal(M.filter(rows,{key:'price'}).length,2);
assert.equal(M.filter(rows,{key:'ok'}).length,1,'El producto B está completo y no debe aparecer entre pendientes');
assert.equal(M.photos(list[1]).length,3,'Foto principal más dos adicionales');
assert.equal(M.photos({image:'',gallery:'[]'}).length,0);
assert.ok(M.analyze([p('Q',{code:'DUP'}),p('R',{code:'dup'})]).every(r=>r.issues.some(i=>i.key==='duplicate-code')),'Los códigos duplicados se detectan sin discriminar mayúsculas');
assert.ok(M.analyze([p('T',{costKnown:true,cost:300})])[0].issues.some(i=>i.key==='below-cost'),'Precio por debajo de costo queda como alerta');
const text=M.csv(M.analyze([p('X',{code:'=HYPERLINK("https://malicious.invalid")',name:'=SUM(1,1)'})]));
assert.match(text,/^\uFEFF/);
assert.ok(text.includes("'=SUM(1,1)"),'CSV neutraliza fórmulas en nombres');
assert.ok(text.includes("'=HYPERLINK"),'CSV neutraliza fórmulas en códigos');
assert.ok(!text.includes('Costo interno')&&!text.includes('PIN'),'CSV no exporta credenciales ni costos');
console.log('PASS auditoría: filtros, fotos, precios, textos, códigos, CSV seguro y datos privados excluidos.');
