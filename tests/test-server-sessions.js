const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
const from=source.indexOf('function gcSessionValid_(candidate){'),to=source.indexOf('function assertAdmin_(candidate){',from);
assert.ok(from>0&&to>from,'Funciones de sesión presentes en Code.gs');
const properties=new Map([['ADMIN_PIN','123456']]),entries=new Map(),cache={
 put:(k,v,ttl)=>{assert.equal(ttl,600);entries.set(k,v);},
 get:k=>entries.get(k)||null,
 remove:k=>entries.delete(k)
};
let pinCalls=0;
const ctx={
 Utilities:{
  DigestAlgorithm:{SHA_256:'SHA256'},Charset:{UTF_8:'UTF8'},
  computeDigest:(_,value)=>[...crypto.createHash('sha256').update(String(value)).digest()],
  base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url'),
  getUuid:()=>crypto.randomUUID()
 },
 CacheService:{getScriptCache:()=>cache},
 PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key)||''})},
 assertAdmin_:candidate=>{pinCalls++;if(candidate!=='123456')throw Error('Clave de administración incorrecta.');},
 Error,RegExp,Date,String
};
vm.runInNewContext(source.slice(from,to),ctx);
const token=ctx.gcSessionOpen_();
assert.match(token,/^gc_[0-9a-f]{64}$/i);
assert.equal(entries.size,1);
assert.equal(ctx.gcSessionAuthorize_(token,'adminCatalog'),true);
assert.equal(ctx.gcSessionAuthorize_('123456','verify'),false);
assert.equal(pinCalls,1);
assert.throws(()=>ctx.gcSessionAuthorize_('000000','verify'),/incorrecta/);
properties.set('GC_REQUIRE_SESSION','SI');
assert.throws(()=>ctx.gcSessionAuthorize_('123456','adminCatalog'),/sesión/i,'En modo estricto no admite PIN para acciones');
assert.equal(ctx.gcSessionAuthorize_('123456','verify'),false,'El PIN sigue permitido para iniciar sesión');
assert.equal(ctx.gcSessionAuthorize_(token,'saveProduct'),true,'Un token válido permite acciones');
const logout=ctx.gcSessionClose_(token);assert.equal(logout.ok,true);
assert.throws(()=>ctx.gcSessionAuthorize_(token,'adminCatalog'),/venci[oó]|cerr[oó]/i,'Cerrar sesión revoca token');
const rotated=ctx.gcSessionOpen_();properties.set('ADMIN_PIN','654321');
assert.throws(()=>ctx.gcSessionAuthorize_(rotated,'adminCatalog'),/venci[oó]|cerr[oó]/i,'Cambiar PIN invalida las sesiones anteriores');
console.log('PASS sesiones Apps Script: token aleatorio, caducidad de caché, revocación, PIN nuevo y modo estricto.');
