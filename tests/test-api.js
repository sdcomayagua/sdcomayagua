// Pruebas aisladas de Apps Script con hojas de orden antiguo y nuevo.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const sample=JSON.parse(fs.readFileSync(__dirname+'/../data/catalogo-respaldo.json','utf8'));
const oldHeaders=['ID','Codigo','Nombre','Categoria','Precio','Costo','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Revision','Colores','PrecioPromocion','PromocionTexto'];
const newHeaders=['ID','Codigo','Nombre','Categoria','Precio','PrecioPromocion','Costo','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Revision','Colores','PromocionTexto'];
function sheet(arr){
 return {
  getLastRow:()=>arr.length,
  getDataRange:()=>({getValues:()=>arr.map(r=>r.slice()),getDisplayValues:()=>arr.map(r=>r.map(v=>String(v??'')))}),
  getRange:(r,c,h,w)=>({
   getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>arr[r+i-1]?.[c+j-1]??'')),
   getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(arr[r+i-1]?.[c+j-1]??''))),
   setValues:rows=>{for(let i=0;i<rows.length;i++){while(arr.length<r+i)arr.push([]);for(let j=0;j<rows[i].length;j++)arr[r+i-1][c+j-1]=rows[i][j];}},
   setValue:v=>{while(arr.length<r)arr.push([]);arr[r-1][c-1]=v;}
  }),
  appendRow:r=>arr.push(r.slice())
 };
}
function setup(headers){
 const initial=sample.map(p=>headers.map(k=>({
  ID:p.id,Codigo:p.code,Nombre:p.name,Categoria:p.category,Precio:p.price,
  PrecioPromocion:p.promoPrice,Costo:15,Stock:p.stock,Imagen:p.image,Galeria:p.gallery,
  Descripcion:p.description,Descuentos:p.discounts,PagoAlRecibir:p.codAllowed?'SI':'NO',
  Activo:p.active?'SI':'NO',Revision:'test',Colores:p.colors,PromocionTexto:p.promoText
 })[k]??''));
 const products=[headers.slice(),...initial];
 const cache={},props={ADMIN_PIN:'123456'};
 const tabs={Productos:sheet(products),Configuracion:sheet([['Clave','Valor','Descripcion'],['shipping','110',''],['codMin','350','']]),Cuentas:sheet([['Banco','Titular','Cuenta','Identidad','Visible']])};
 const context={console,Date,SpreadsheetApp:{openById:()=>({getSheetByName:n=>tabs[n]})},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v},remove:k=>{delete cache[k]}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>{props[k]=v},deleteProperty:k=>{delete props[k]}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ContentService:{MimeType:{TEXT:'text',JAVASCRIPT:'js'},createTextOutput:data=>({data,setMimeType(){return this}})},
 HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:data=>({data,setXFrameOptionsMode(){return this}})},
 Utilities:{getUuid:()=> 'FAKE-NEW-ID'}};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/Code.gs','utf8'),context);
 return {context,products};
}
for(const headers of [oldHeaders,newHeaders]){
 const {context,products}=setup(headers);
 const at=k=>headers.indexOf(k);
 const pub=context.publicPayload_();
 assert.equal(pub.products.length,sample.filter(p=>p.active).length);
 assert.equal(pub.settings.shipping,110);
 assert.ok(pub.products.every(p=>!('cost' in p)));
 assert.equal(pub.products.find(p=>p.promoPrice>0)?.promoPrice,80);
 const admin=context.adminPayload_();
 assert.equal(admin.products.length,sample.length);
 assert.equal(admin.products[0].cost,15);
 const health=JSON.parse(context.doGet({parameter:{action:'health'}}).data);
 assert.equal(health.pinConfigurado,true);
 const get=context.doGet({parameter:{callback:'callback'}}).data;
 assert.match(get,/^callback\(/);
 assert.ok(!get.includes('"cost"'));
 // La tienda puede leer imágenes y precios sin PIN, pero nunca datos privados.
 const postPublic=context.doPost({parameter:{payload:JSON.stringify({requestId:'public',action:'publicCatalog'})}}).data;
 assert.match(postPublic,/"ok":true/);
 assert.match(postPublic,/"__gcResponse":true/);
 assert.ok(!postPublic.includes('"cost"'));
 assert.ok(!postPublic.includes('"Costo"'));
 let bad=context.doPost({parameter:{payload:JSON.stringify({requestId:'bad',action:'adminCatalog',token:'111111'})}}).data;
 assert.match(bad,/incorrecta/);
 assert.equal(products.length,sample.length+1);
 const posted=context.doPost({parameter:{payload:JSON.stringify({requestId:'admin',action:'adminCatalog',token:'123456'})}}).data;
 assert.match(posted,/privado/);
 const inserted=context.doPost({parameter:{payload:JSON.stringify({requestId:'save',action:'saveProduct',token:'123456',product:{name:'Producto nuevo',category:'Gamer',price:500,promoPrice:400,cost:200,stock:3,codAllowed:true,active:true,colors:'Azul',promoText:'Oferta'}})}}).data;
 assert.match(inserted,/Producto agregado/);
 assert.equal(products.length,sample.length+2);
 const last=products.at(-1);
 assert.equal(last[at('Precio')],500);
 assert.equal(last[at('PrecioPromocion')],400);
 assert.equal(last[at('Costo')],200);
 assert.equal(last[at('Stock')],3);
 const edited=context.saveProduct_({id:'FAKE-NEW-ID',name:'Producto editado',category:'Gamer',price:600,promoPrice:450,cost:'',stock:2,codAllowed:false,active:true,colors:'Negro'});
 assert.equal(edited.ok,true);
 assert.equal(products.at(-1)[at('Costo')],200);
 assert.equal(products.at(-1)[at('PrecioPromocion')],450);
 assert.equal(products.at(-1)[at('Stock')],2);
 context.disableProduct_('FAKE-NEW-ID');
 assert.equal(products.at(-1)[at('Activo')],'NO');
}
console.log('PASS API: lectura pública sin costos, POST privado, promoción/costo/stock, ocultar y dos órdenes de columnas.');
