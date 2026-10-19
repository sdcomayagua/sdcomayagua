const assert=require('node:assert/strict'),C=require('../assets/js/core.js');
const make=(id,fields={})=>C.cleanProduct({id,name:id,price:100,stock:2,active:true,...fields});
const old=make('viejo',{catalogOrder:3}),legacy=make('registro posterior',{catalogOrder:12}),created=make('nuevo',{createdAt:'2026-10-17T02:00:00Z',catalogOrder:0});
assert.deepEqual([old,created,legacy].sort(C.recentFirst).map(p=>p.id),['nuevo','registro posterior','viejo']);
assert.equal(C.cleanProduct({MasPedidos:'SI'}).bestSeller,true);assert.equal(C.cleanProduct({bestSeller:false}).bestSeller,false);
const sheet={products:[make('uno',{description:'Vieja',details:{}})]};
const api={catalogSchemaVersion:2,products:[make('uno',{description:'Actual',bestSeller:true,details:{brand:'MEMO',material:'Plata'}})]};
assert.equal(C.mergeCatalog(sheet,api).products[0].details.material,'Plata','La hoja antigua no borra las características guardadas');
assert.equal(C.mergeCatalog(sheet,api).products[0].bestSeller,true);
assert.deepEqual(C.mergeCatalog(sheet,{...api,products:[make('uno')]}).products[0].details,{},'El servidor nuevo puede borrar un atributo explícitamente');
assert.equal(C.mergeCatalog(sheet,{products:api.products}).products[0].details.brand,'MEMO','La compatibilidad antigua conserva atributos disponibles');
assert.equal(C.mergeCatalog({products:[{id:'uno',price:120}]},{products:api.products}).products[0].bestSeller,true,'Una hoja sin columna de marcas conserva la estrella del respaldo');
assert.equal(C.mergeCatalog({catalogSchemaVersion:2,products:[make('uno',{bestSeller:false})]},{products:api.products}).products[0].bestSeller,false,'La hoja actualizada puede desmarcar un producto');
for(const url of ['https://www.tiktok.com/@tienda/video/1','https://m.youtube.com/watch?v=1','https://youtu.be/abc','https://instagram.com/reel/abc','https://facebook.com/posts/1','https://tienda.example/video/1'])assert.equal(C.researchPage(url),false,url);
assert.equal(C.researchPage('https://tienda.example/productos/memo-fs01'),true);
console.log('PASS catálogo: recientes, selección de Más pedidos, fuentes públicas y filtros de videos.');

const searchable=C.productSearchText({name:"Control",code:"GC-12",details:{brand:"MEMO",model:"K12",connection:"USB-C"},colors:"Negro",cost:987654,notes:"Dato privado"});
assert.equal(C.matchesSearch(searchable,"memo k12 negro"),true);assert.equal(C.matchesSearch(searchable,"usb-c"),true);assert.equal(C.matchesSearch(searchable,"987654"),false);assert.equal(C.matchesSearch(searchable,"Dato privado"),false);
