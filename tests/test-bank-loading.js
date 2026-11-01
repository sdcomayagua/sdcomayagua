// Regresión: cuentas independientes del respaldo, inventario privado y fallo de JSONP.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const elements=new Map(['bankAccounts','bankStatus','bankRetry','bankFilter'].map(id=>[id,{innerHTML:'',textContent:'',value:'',setAttribute(name,value){this[name]=value;}}]));
 const config={privateInventory:true,publicApiUrl:'https://script.google.com/macros/s/public-test/exec',whatsapp:'50400000000'},pending=[];
 const context={window:{GC:require('../assets/js/core'),GC_CONFIG:config},document:{body:{dataset:{page:'cuentas'}},getElementById:id=>elements.get(id),createElement:()=>({remove(){}}),head:{appendChild:script=>pending.push(script)}},location:{search:''},URLSearchParams,URL,setTimeout,clearTimeout,console,AbortController,fetch:async()=>({ok:true,json:async()=>({ok:true,products:[],banks:[{bank:'Alternativa',owner:'Titular de prueba',account:'0007',visible:true}]})})};
 let source=fs.readFileSync(__dirname+'/../assets/js/site.js','utf8');source=source.replace("try{\n binds();", "window.test={loadBanksFromSheet,publicCatalogRequest,bankText};return;\ntry{\n binds();");vm.runInNewContext(source,context);
 return {api:context.window.test,elements,pending,context,respond(data){const script=pending.shift();context.window[new URL(script.src).searchParams.get('callback')](data);}};
}
(async()=>{
 const f=fixture(),loading=f.api.loadBanksFromSheet();
 assert.match(f.elements.get('bankAccounts').innerHTML,/Cargando tus opciones/,'No mostrar indisponibilidad antes de recibir respuesta');
 assert.equal(f.elements.get('bankRetry').disabled,true);
 const same=f.api.loadBanksFromSheet();assert.equal(same,loading);const catalog=f.api.publicCatalogRequest(f.context.window.GC_CONFIG.publicApiUrl);assert.equal(f.pending.length,1,'Cuentas y catálogo comparten una sola petición');
 f.respond({ok:true,products:[],banks:[{bank:'Banco de prueba',owner:'Gabriel de prueba',account:'0012',identity:'0000',visible:true},{bank:'OCULTA',account:'1234',visible:false}]});await Promise.all([loading,catalog]);
 const html=f.elements.get('bankAccounts').innerHTML;assert.match(html,/Gabriel de prueba/);assert.match(html,/Copiar todos los datos/);assert.equal(html.includes('OCULTA'),false);assert.equal(f.elements.get('bankRetry').disabled,false);assert.equal(f.elements.get('bankFilter').disabled,false);
 assert.equal(f.api.bankText({bank:'Banco',owner:'Gabriel',account:'0001',identity:'0010'}),'Banco\nTitular: Gabriel\nCuenta: 0001\nIdentidad: 0010');
 const retry=f.api.loadBanksFromSheet();f.pending.shift().onerror();await retry;assert.match(f.elements.get('bankAccounts').innerHTML,/Alternativa/,'JSON recupera la carga cuando falla JSONP');
 f.context.fetch=async()=>{throw Error('Sin conexión');};const failed=f.api.loadBanksFromSheet();f.pending.shift().onerror();await failed;assert.equal(f.elements.get('bankRetry').textContent,'Reintentar');
 const recovered=f.api.loadBanksFromSheet();assert.equal(f.pending.length,1,'Una falla no bloquea los reintentos');f.respond({ok:true,products:[],banks:[]});await recovered;assert.match(f.elements.get('bankAccounts').innerHTML,/No hay cuentas publicadas/,'Una cuenta retirada por Google deja de mostrarse');
 console.log('PASS cuentas: carga sin esperar al respaldo, petición compartida, titular y copia completa, privacidad, JSON alternativo y reintento.');
})().catch(error=>{console.error(error);process.exitCode=1;});
