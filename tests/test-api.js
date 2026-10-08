// Prueba aislada de la lógica de Google Apps Script, sin acceder a servicios de Google.
const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync(__dirname+'/../data/catalogo-respaldo.json','utf8'));
const headers=['ID','Codigo','Nombre','Categoria','Precio','Costo','Stock','Imagen','Galeria','Descripcion','Descuentos','PagoAlRecibir','Activo','Revision'];
let products=[headers,...data.map(p=>[p.id,p.id,p.name,p.category,p.price,10,p.stock,'','','',p.discounts,p.codAllowed?'SI':'NO',p.active?'SI':'NO','test'])];
const settings=[['Clave','Valor','Descripcion'],['brand','Gamer Comayagua',''],['shipping','110',''],['codMin','350',''],['codRate','10%',''],['tigoRate','7%',''],['codMinUnits','2',''],['whatsapp','50431517755','']];
const banks=[['Banco','Titular','Cuenta','Identidad','Visible']];const cache={};
const sheet=(arr)=>({getLastRow:()=>arr.length,getDataRange:()=>({getDisplayValues:()=>arr.map(r=>r.map(String)),getValues:()=>arr.map(x=>x.slice())}),getRange:(r,c,h,w)=>({getDisplayValues:()=>arr.slice(r-1,r-1+h).map(x=>x.slice(c-1,c-1+w).map(String)),setValues:rows=>{for(let i=0;i<rows.length;i++)arr[r-1+i]=rows[i]},setValue:v=>arr[r-1][c-1]=v}),appendRow:x=>arr.push(x)});
const tabs={Productos:sheet(products),Configuracion:sheet(settings),Cuentas:sheet(banks)};
const context={console,SpreadsheetApp:{openById:()=>({getSheetByName:name=>tabs[name]})},CacheService:{getScriptCache:()=>({get:key=>cache[key]||null,put:(key,data)=>cache[key]=data,remove:key=>delete cache[key]})},PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='ADMIN_TOKEN'?'secret123':null})},ContentService:{MimeType:{TEXT:'text',JAVASCRIPT:'js'},createTextOutput:t=>({data:t,setMimeType(){return this}})},HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:t=>({data:t,setXFrameOptionsMode(){return this}})},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{getUuid:()=> 'FAKE-NEW-ID'}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/Code.gs','utf8'),context);
let pub=context.publicPayload_();assert.equal(pub.products.length,56);assert.equal(pub.settings.shipping,110);assert.equal(pub.settings.codMinimum,350);assert.equal(pub.settings.codMinimumUnits,2);assert.equal(pub.settings.tigoRate,.07);assert.ok(!('cost' in pub.products[0]));
let bad=context.doPost({parameter:{payload:JSON.stringify({requestId:'bad',action:'saveProduct',token:'bad',product:{name:'Intrusión'}})}}).data;
assert.match(bad,/incorrecta/);assert.equal(products.length,59);
let saved=context.doPost({parameter:{payload:JSON.stringify({requestId:'good',action:'saveProduct',token:'secret123',product:{name:'Producto de prueba',category:'Gamepad',price:450,stock:2,codAllowed:false,active:true}})}}).data;
assert.match(saved,/'?Producto agregado/);assert.equal(products.length,60);assert.equal(products.at(-1)[11],'NO');
let get=context.doGet({parameter:{callback:'gcSafeCallback'}}).data;assert.match(get,/^gcSafeCallback\(/);assert.match(get,/Producto de prueba/);
let disabled=context.doPost({parameter:{payload:JSON.stringify({requestId:'disable',action:'disableProduct',token:'secret123',id:'FAKE-NEW-ID'})}}).data;assert.match(disabled,/ocultado/);assert.equal(products.at(-1)[12],'NO');
console.log('PASS 10 verificaciones API: 56 productos activos, hoja nueva, restricciones, lectura pública sin costos, escritura con token, nueva alta y ocultado.');
