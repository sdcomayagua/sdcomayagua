const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const memory=new Map(),calls=[],props={GC_FREE_GEMINI_API_KEY:'demo-privado',GC_FREE_GEMINI_MODEL:'gemini-3.5-flash-lite'};
let vision={kind:'audifonos',confidence:'high',brand:'DANYU',brandEvidence:'DANYU',model:'90H',modelEvidence:'90H',wireless:true,visibleText:'DANYU WIRELESS HEADPHONES 90h',description:'Auriculares claros con diadema y almohadillas.',reason:'Se ve el audífono'};
const context={
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||''})},
 CacheService:{getScriptCache:()=>({get:k=>memory.get(k)||null,put:(k,v)=>memory.set(k,v)})},
 Utilities:{
  base64Decode:s=>Array.from(Buffer.from(s,'base64')),
  computeDigest:(_name,bytes)=>Array.from(crypto.createHash('sha256').update(Buffer.from(bytes)).digest()),
  DigestAlgorithm:{SHA_256:'sha256'}
 },console
};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../apps-script/FichaGratis.gs'),'utf8'),context);
context.gcFreePost_=(url,request,headers)=>{
 calls.push({url,request,headers});
 return {candidates:[{content:{parts:[{text:JSON.stringify(vision)}]}}]};
};
const jpg=Buffer.alloc(425);jpg[0]=0xff;jpg[1]=0xd8;jpg[2]=0xff;jpg[3]=0xe0;
const file={mime:'image/jpeg',base64:jpg.toString('base64')};
let r=context.gcAnalyzeNewProductPhoto_(file);
assert.equal(r.photo.name,'Audífonos inalámbricos DANYU','Identificación visual pero 90h no es un modelo');
assert.equal(r.photo.model,'');
assert.equal(r.photo.category,'Audio');
assert.equal(r.photo.needsReview,true);
assert.equal(r.photo.price,undefined);
assert.equal(r.photo.stock,undefined);
assert.equal(r.photo.freeShipping,undefined);
assert.equal(r.photo.codAllowed,undefined);
assert.equal(calls.length,1);
assert.ok(calls[0].url.includes('generativelanguage.googleapis.com'),'La foto va al servidor con Gemini privado');
assert.equal(calls[0].headers['x-goog-api-key'],'demo-privado');
assert.equal(calls[0].request.contents[0].parts[1].inlineData.mimeType,'image/jpeg');
assert.equal(JSON.stringify(r).includes(file.base64),false,'No devolver bytes de fotos al cliente');
assert.equal(context.gcAnalyzeNewProductPhoto_(file).photo.name,r.photo.name);
assert.equal(calls.length,1,'Lecturas repetidas de la misma foto reutilizan caché');
memory.clear();
vision={...vision,brand:'BOSE',brandEvidence:'BOSE',model:'Y90',modelEvidence:'Y90'};
r=context.gcAnalyzeNewProductPhoto_(file);
assert.equal(r.photo.brand,'','No incorporar marcas ausentes del texto visible');
assert.equal(r.photo.model,'','No aceptar modelos sin evidencia visual textual');
memory.clear();
vision={...vision,kind:'desconocido',confidence:'low'};
r=context.gcAnalyzeNewProductPhoto_(file);assert.equal(r.photo.name,'');
assert.throws(()=>context.gcAnalyzeNewProductPhoto_({mime:'image/jpeg',base64:'aGVsbG8='}),/elegí una foto/);
const bad=Buffer.alloc(420,0);assert.throws(()=>context.gcAnalyzeNewProductPhoto_({mime:'image/jpeg',base64:bad.toString('base64')}),/formato esperado/);
console.log('PASS foto visual: identificación, datos visibles, 90h no es modelo, clave privada, validación, caché, no precios ni permisos inventados.');
