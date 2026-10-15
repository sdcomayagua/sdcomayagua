// Respuestas aisladas: estas pruebas nunca consultan servicios ni usan claves reales.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const url='https://www.memo-develop.com/phone-cooler/cx16.html';
function research(name,{matched='MEMO CX16',source=url,text='MEMO CX16, enfriador USB-C de 72 g.',brand='MEMO',match='exact'}={}){
 const props={GC_FREE_TAVILY_API_KEY:'TEST_ONLY',GC_FREE_GEMINI_API_KEY:'TEST_ONLY'},cache={};
 const context={console,Date,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>{props[k]=v},deleteProperty:k=>{delete props[k]}})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>{cache[k]=v}})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Utilities:{getUuid:()=> 'TEST-RESERVATION',DigestAlgorithm:{MD5:'md5'},computeDigest:(_,s)=>[...crypto.createHash('md5').update(s).digest()]}
 };
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/Code.gs','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/../apps-script/FichaGratis.gs','utf8'),context);
 let calls=0;
 context.gcFreePost_=()=>++calls===1
  ?{results:[{url:source,title:matched,content:text}]}
  :{candidates:[{content:{parts:[{text:JSON.stringify({match,matched_model:matched,description:'Enfriador con conexión USB-C.',description_source:source,specifications:[{field:'brand',value:brand,unit:'',source_url:source},{field:'weight',value:72,unit:'g',source_url:source}]})}]}}]};
 const before=JSON.stringify(props),out=context.researchProduct_(name,'Enfriadores').research;
 assert.equal(JSON.stringify(props),before,'La reserva temporal debe liberarse');
 assert.equal(calls,2);
 return out;
}
assert.equal(research('MEMO CX16').match,'exact');
const prefixed=research('Enfriador MEMO CX16');
assert.equal(prefixed.match,'exact','La categoría al inicio no es la marca');
assert.equal(prefixed.details.weight,72);
assert.equal(research('Cable ARGOM ARG-CB-0048BK',{brand:'ARGOM',matched:'ARGOM ARG-CB-0048BK',source:'https://www.argomtech.com/products/dura-speed',text:'ARGOM ARG-CB-0048BK, cable USB-C.'}).match,'exact');
assert.equal(research('Mouse PRIMUS PMO-S203DV',{brand:'PRIMUS',matched:'PRIMUS GLADIUS 12400T PMO-S203DV',source:'https://api.primusgaming.com/images/PMO-S203DV_DS_SPA.pdf',text:'PRIMUS GLADIUS 12400T PMO-S203DV.'}).match,'exact');
assert.equal(research('Enfriador Marca X123',{brand:'Marca',matched:'Marca X123',source:'https://marca.example/x123',text:'Marca X123, enfriador USB-C.'}).match,'exact','La búsqueda admite otros fabricantes');
assert.equal(research('MEMO CX16',{matched:'MEMO CX160',text:'MEMO CX160, enfriador de 72 g.'}).match,'ambiguous','Los códigos de modelo deben coincidir completos');
assert.equal(research('MEMO CX16 Pro 2026').match,'ambiguous','No agregar datos de otra variante o año');
assert.equal(research('MEMO CX16',{source:'https://www.amazon.com/memo-cx16'}).match,'ambiguous','Un vendedor no prueba una ficha oficial');
assert.equal(research('MEMO CX16',{source:'https://notmemo.com/cx16'}).match,'ambiguous','No aprobar dominios que solo contienen una parte de la marca');
assert.equal(research('MEMO CX16',{match:'not_found'}).description,'');
console.log('PASS buscador gratis: marca después de categoría, fuente oficial, modelos y variantes exactas, reserva liberada y vendedores excluidos.');
