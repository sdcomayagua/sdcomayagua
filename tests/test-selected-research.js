// Pruebas de regresión: selección, genéricos, evidencia, caché y errores sin APIs reales.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const primary='https://distribuidor.example/productos/otg-usbc',other='https://otra.example/productos/otro-adaptador';
function setup(){
 const props={ADMIN_PIN:'123456',GC_FREE_TAVILY_API_KEY:'TEST_ONLY',GC_FREE_GEMINI_API_KEY:'TEST_ONLY'},cache={},calls=[];
 const context={console,Date,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>{props[k]=v},deleteProperty:k=>{delete props[k]}})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>{cache[k]=v}})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Utilities:{getUuid:()=> 'TEST-SEARCH-UUID',DigestAlgorithm:{MD5:'md5'},computeDigest:(_,s)=>[...crypto.createHash('md5').update(s).digest()]},
  HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALL'},createHtmlOutput:data=>({data,setXFrameOptionsMode(){return this}})}
 };
 vm.createContext(context);
 for(const file of ['Code.gs','FichaGratis.gs'])vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/'+file,'utf8'),context);
 const data={match:'exact',matched_model:'Adaptador OTG USB-C',description:'Adaptador OTG con conexión USB-C y puerto USB-A.',description_sources:[primary],category:'Adaptadores',colors:'Negro',specifications:[
  {field:'weight',value:'12',unit:'g',source_url:primary},
  {field:'connection',value:'USB-C a USB-A',unit:'',source_url:primary},
  {field:'voltage',value:'5 V',unit:'',source_url:primary}, // texto tiene 15 V, no 5 V
  {field:'power',value:'99 W',unit:'',source_url:other}, // otro modelo no es evidencia
  {field:'width',value:'300',unit:'mm',source_url:'https://inventada.example/ficha'}
 ],same_product_sources:[other],product_images:['https://cdn.example/otg.jpg','https://inventada.example/foto.jpg'],notes:[],missing:['Medidas'],price:1,stock:999};
 context.gcFreePost_=(url,payload)=>{
  calls.push({url,payload});
  if(url.endsWith('/search'))return {results:[{url:primary,title:'Adaptador OTG USB-C',content:'Adaptador genérico negro, USB-C a USB-A. Peso: 12 g. Entrada 15 V.'},{url:other,title:'Otro adaptador',content:'Otro producto, 99 W.'},{url:'https://127.0.0.1/private',title:'No válido'},{url:'javascript:alert(1)',title:'No válido'}]};
  if(url.endsWith('/extract')){assert.deepEqual(Array.from(payload.urls),[primary]);return {results:[{url:primary,raw_content:'Adaptador genérico negro, conexión USB-C a USB-A. Peso: 12 g. Entrada 15 V.',images:['https://cdn.example/otg.jpg']}]};}
  assert.match(url,/gemini-2.5-flash-lite:generateContent$/);assert.equal(payload.generationConfig.thinkingConfig,undefined);
  return {candidates:[{content:{parts:[{text:JSON.stringify(data)}]}}]};
 };
 return {context,props,cache,calls,data};
}
const {context,props,cache,calls,data}=setup(),name='Adaptador OTG USB a TYPE C';
const found=context.gcFreeCandidates_(name,'Adaptador');
assert.equal(found.candidates.length,2);assert.equal(calls.length,1);assert.equal(found.research,undefined);
context.gcFreeCandidates_(name,'Adaptador');assert.equal(calls.length,1,'Repetir candidatos no consume otra consulta');
const selection={searchId:found.searchId,candidateId:'0'};
assert.throws(()=>context.researchProduct_(name,'Otra categoría',selection),/cambió/);
assert.throws(()=>context.researchProduct_(name,'Adaptador',{...selection,candidateId:'9'}),/no está disponible/);
assert.throws(()=>context.researchProduct_(name,'Adaptador',{...selection,searchId:'http://127.0.0.1'}),/Elegí/);
assert.equal(calls.length,1,'Selecciones inválidas no consumen consultas');
const out=context.researchProduct_(name,'Adaptador',selection).research;
assert.equal(out.match,'exact','El dueño puede confirmar un producto genérico de distribuidor');
assert.equal(out.details.weight,12);assert.equal(out.details.weightUnit,'g');assert.equal(out.details.connection,'USB-C a USB-A');
assert.equal(out.details.voltage,undefined,'5 V no aparece en una fuente que dice 15 V');
assert.equal(out.details.power,undefined,'Un parecido no autoriza copiar sus datos');assert.equal(out.details.width,undefined);
assert.equal(out.category,'Adaptadores');assert.equal(out.description,data.description);assert.equal(out.colors,'Negro');
assert.deepEqual(Array.from(out.images),['https://cdn.example/otg.jpg']);
for(const key of ['price','cost','stock','discounts','codAllowed','code'])assert.equal(out[key],undefined);
assert.equal(props.GC_FREE_BUSY_ID,undefined);assert.equal(props.GC_FREE_BUSY_UNTIL,undefined);
assert.equal(calls.length,4,'Buscar candidatos, extraer, comparar y organizar');
context.researchProduct_(name,'Adaptador',selection);assert.equal(calls.length,4,'La misma elección usa caché');
const unauthorized=context.doPost({parameter:{payload:JSON.stringify({action:'researchCandidates',name,token:'000000'})}}).data;
assert.match(unauthorized,/incorrecta/);assert.equal(calls.length,4);
delete cache['gc_selection_'+found.searchId];assert.throws(()=>context.researchProduct_(name,'Adaptador',selection),/vencieron/);
const failure=setup(),pool=failure.context.gcFreeCandidates_(name,'Adaptador');
failure.context.gcFreePost_=()=>{throw Error('Cuota agotada')};
assert.throws(()=>failure.context.researchProduct_(name,'Adaptador',{searchId:pool.searchId,candidateId:'0'}),/Cuota/);
assert.equal(failure.props.GC_FREE_BUSY_ID,undefined,'Un fallo libera la reserva');
const variant=setup(),variantPool=variant.context.gcFreeCandidates_('MEMO CX16 Pro','Enfriadores');
variant.data.matched_model='MEMO CX16';
const rejected=variant.context.researchProduct_('MEMO CX16 Pro','Enfriadores',{searchId:variantPool.searchId,candidateId:'0'}).research;
assert.equal(rejected.match,'ambiguous');assert.equal(Object.keys(rejected.details).length,0);
console.log('PASS selección: genéricos, PIN, resultados vigentes, fuentes del mismo producto, unidades, imágenes, datos comerciales preservados, caché y fallos.');
