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
 const tabs={Productos:sheet(products),Configuracion:sheet([['Clave','Valor','Descripcion'],['shipping','110',''],['codMin','350',''],['codMinUnits','8','Configuración antigua']]),Cuentas:sheet([['Banco','Titular','Cuenta','Identidad','Visible']])};
 const context={console,Date,SpreadsheetApp:{openById:()=>({getSheetByName:n=>tabs[n]})},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>{cache[k]=v},remove:k=>{delete cache[k]}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>{props[k]=v},deleteProperty:k=>{delete props[k]}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ContentService:{MimeType:{TEXT:'text',JAVASCRIPT:'js'},createTextOutput:data=>({data,setMimeType(){return this}})},
 HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:data=>({data,setXFrameOptionsMode(){return this}})},
 Utilities:{getUuid:()=> 'FAKE-NEW-ID'}};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/Code.gs','utf8'),context);
 return {context,products,props,cache};
}
for(const headers of [oldHeaders,newHeaders]){
 const {context,products}=setup(headers);
 const at=k=>headers.indexOf(k);
 const pub=context.publicPayload_();
 assert.equal(pub.products.length,sample.filter(p=>p.active).length);
 assert.equal(pub.settings.shipping,110);
 assert.equal(pub.settings.codMinimum,350);
 assert.equal('codMinimumUnits' in pub.settings,false);
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

// La investigación usa respuestas simuladas: no hay llamadas de API ni cargos.
const crypto=require('node:crypto');
const {context:research,products:researchProducts,props:researchProps}=setup(oldHeaders);
research.Utilities.DigestAlgorithm={SHA_256:'sha256'};
research.Utilities.computeDigest=(_,text)=>Array.from(crypto.createHash('sha256').update(text).digest());
const sourceUrl='https://maker.example/model-x',otherUrl='https://maker.example/other-page';
const evidence={match:'exact',matched_model:'Marca Modelo X',description:'Enfriador para el teléfono, con conexión USB-C.',description_sources:[sourceUrl],specifications:[
 {field:'weight',value:'72',unit:'g',source_url:sourceUrl},
 {field:'power',value:'10 W',unit:'',source_url:sourceUrl},
 {field:'connection',value:'USB-C',unit:'',source_url:sourceUrl},
 {field:'voltage',value:'9 V',unit:'',source_url:'https://unvisited.example/specs'}
],notes:[],missing:['Medidas']};
const response=data=>({status:'completed',output:[
 {type:'web_search_call',status:'completed',action:{type:'search',sources:[{type:'url',url:sourceUrl}]}},
 {type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(data),annotations:[{type:'url_citation',url:sourceUrl,title:'Ficha oficial Modelo X'}]}]}
]});
let apiCalls=0,httpStatus=200,reply=response(evidence);
research.UrlFetchApp={fetch:(url,options)=>{
 apiCalls++;assert.equal(url,'https://api.openai.com/v1/responses');
 assert.equal(options.headers.Authorization,'Bearer PRIVATE_TEST_VALUE');
 const body=JSON.parse(options.payload);
 assert.equal(body.store,false);assert.equal(body.model,'gpt-4.1-mini');
 const searching=Array.isArray(body.tools);
 if(searching){
  assert.equal(body.tools[0].type,'web_search');assert.equal(body.tool_choice,'auto');
  assert.equal(body.text,undefined,'La búsqueda no fuerza salida JSON');assert.equal(body.max_tool_calls,3);
  assert.deepEqual(Object.keys(JSON.parse(body.input)),['product_name','category']);
 }else{
  assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);
  const input=JSON.parse(body.input);assert.equal(input.research_summary,'Marca Modelo X. Peso neto 72 g, potencia 10 W, USB-C.');assert.equal(input.sources[0].url,sourceUrl);
 }
 const searched=response(evidence);searched.output[1].content[0].text='Marca Modelo X. Peso neto 72 g, potencia 10 W, USB-C.';
 const extracted={...reply,output:reply.output.filter(item=>item.type==='message')};
 return {getResponseCode:()=>httpStatus,getContentText:()=>httpStatus===200?JSON.stringify(searching?searched:extracted):'PRIVATE_TEST_VALUE provider error'};
}};
const post=(action,extra={},pin='123456')=>research.doPost({parameter:{payload:JSON.stringify({requestId:'research-test',action,token:pin,...extra})}}).data;
assert.throws(()=>research.researchProduct_('Marca Modelo X','Enfriadores'),/todavía no está conectada/);
assert.equal(apiCalls,0);
researchProps.PRODUCT_RESEARCH_API_KEY='PRIVATE_TEST_VALUE';
assert.match(post('researchProduct',{name:'Marca Modelo X'},'111111'),/incorrecta/);
assert.equal(apiCalls,0);
const verify=post('verify');assert.match(verify,/"extendedDetails":true/);assert.match(verify,/"productResearch":true/);
assert.ok(!verify.includes('PRIVATE_TEST_VALUE'));
const rowsBefore=JSON.stringify(researchProducts);
const proposed=research.researchProduct_('Marca Modelo X','Enfriadores');
assert.equal(proposed.research.details.weight,72);assert.equal(proposed.research.details.weightUnit,'g');
assert.equal(proposed.research.details.power,'10 W');assert.equal(proposed.research.details.voltage,undefined);
assert.equal(proposed.research.sources[0].url,sourceUrl);assert.equal(apiCalls,2);
assert.equal(JSON.stringify(researchProducts),rowsBefore,'Investigar no debe modificar el inventario');
research.researchProduct_('Marca Modelo X','Enfriadores');assert.equal(apiCalls,2,'La consulta idéntica usa la propuesta guardada en caché');
assert.ok(!research.doGet({parameter:{}}).data.includes('PRIVATE_TEST_VALUE'));
assert.ok(!research.doGet({parameter:{}}).data.includes('PRODUCT_RESEARCH_API_KEY'));
const ambiguous=research.readResearchResponse_(response({...evidence,match:'ambiguous'}));
assert.equal(ambiguous.description,'');assert.equal(Object.keys(ambiguous.details).length,0);
assert.ok(ambiguous.sources.length>0);
const wrongVariant=research.readResearchResponse_(response({...evidence,matched_model:'MEMO CX16'}),'Enfriador MEMO CXD16 Pro 2026');
assert.equal(wrongVariant.match,'ambiguous');assert.equal(Object.keys(wrongVariant.details).length,0);
const wrongNumber=research.readResearchResponse_(response({...evidence,matched_model:'MEMO CX160'}),'MEMO CX16');
assert.equal(wrongNumber.match,'ambiguous','CX160 no es el modelo CX16');
const conflict=research.readResearchResponse_(response({...evidence,specifications:[...evidence.specifications,{field:'power',value:'15 W',unit:'',source_url:sourceUrl}]}));
assert.equal(conflict.details.power,undefined);assert.ok(conflict.notes.some(note=>note.includes('contradictorio')));
assert.throws(()=>research.readResearchResponse_({...response(evidence),status:'incomplete'}),/incompleta/);
assert.throws(()=>research.readResearchResponse_({status:'completed',output:[response(evidence).output[1]]}),/búsqueda web/);
assert.throws(()=>research.readResearchResponse_(response({...evidence,description_sources:[otherUrl],specifications:[{field:'weight',value:'72',unit:'',source_url:sourceUrl}]})),/ninguna confirmó/);
const normalized=research.readResearchResponse_(response({...evidence,description_sources:[sourceUrl+'/?utm_source=search#specs'],specifications:[{field:'weight',value:'72',unit:'g',source_url:sourceUrl+'#weight'}]}),'Marca Modelo X');
assert.equal(normalized.details.weight,72);assert.ok(normalized.description);
const nested=response(evidence);nested.output[0].action.sources=[];nested.output[1].content[0].annotations=[{type:'url_citation',url_citation:{url:sourceUrl,title:'Fuente oficial'}}];
assert.equal(research.readResearchResponse_(nested).sources[0].title,'Fuente oficial');
const http=response({...evidence,description_sources:['http://maker.example/model-x'],specifications:[]});http.output[0].action.sources=[{url:'http://maker.example/model-x'}];http.output[1].content[0].annotations=[];
assert.equal(research.readResearchResponse_(http).sources[0].url,'http://maker.example/model-x');
assert.equal(research.researchUrlKey_('javascript:alert(1)'), '');
assert.throws(()=>research.readResearchResponse_({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'refusal',refusal:'Private provider refusal'}]}]},'Marca Modelo X',research.researchEvidence_(response(evidence))),/no pudo completar/);
const malformed=response(evidence);malformed.output[1].content[0].text='Not JSON';
assert.throws(()=>research.readResearchResponse_(malformed),/organizar la ficha/);
researchProps.PRODUCT_RESEARCH_ACTIVE_UNTIL=String(Date.now()+30000);
assert.throws(()=>research.researchProduct_('Otra consulta','Enfriadores'),/curso/);assert.equal(apiCalls,2);
delete researchProps.PRODUCT_RESEARCH_ACTIVE_UNTIL;
httpStatus=429;
const failed=post('researchProduct',{name:'Otra consulta',category:'Enfriadores'});
assert.match(failed,/límite o no tiene saldo/);assert.ok(!failed.includes('PRIVATE_TEST_VALUE'));
assert.equal(researchProps.PRODUCT_RESEARCH_ACTIVE_UNTIL,undefined);
assert.equal(researchProps.PRODUCT_RESEARCH_ACTIVE_ID,undefined);
research.saveProduct_({name:'Producto con ficha',category:'Enfriadores',price:500,cost:200,stock:1,codAllowed:true,active:true,description:proposed.research.description,details:proposed.research.details});
const realHeaders=researchProducts[0],savedRow=researchProducts.at(-1);
const savedDetails=JSON.parse(savedRow[realHeaders.indexOf('Detalles')]);
assert.equal(savedDetails.power,'10 W');assert.equal(savedDetails.weightUnit,'g');assert.equal(savedDetails.references[0].url,sourceUrl);
assert.equal(savedRow[realHeaders.indexOf('Costo')],200);assert.equal(savedRow[realHeaders.indexOf('Stock')],1);
assert.equal(research.publicPayload_().products.find(p=>p.name==='Producto con ficha').details.power,'10 W');
assert.equal(research.publicPayload_().products.find(p=>p.name==='Producto con ficha').cost,undefined);
const C=require('../assets/js/core.js');
assert.equal(C.cleanProduct({id:'x',name:'x',details:savedDetails}).details.power,'10 W');
assert.deepEqual(C.cleanDetails({references:[{url:'javascript:alert(1)'},{url:'https://maker.example/model-x',title:'Ficha'}]}).references,[{url:'https://maker.example/model-x',title:'Ficha'}]);
console.log('PASS fichas: PIN y clave privados, fuentes consultadas, coincidencia exacta, datos contradictorios omitidos, caché, fallos sin pérdida, columna Detalles y guardado de atributos eléctricos.');
