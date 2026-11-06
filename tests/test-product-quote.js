/* Verifica importes y textos del PNG contra la misma cotización del carrito. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../assets/js/core');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/product-quote.js'),'utf8');
function fixture(){
 const labels=[],images=[],ctx={
  beginPath(){},roundRect(){},fill(){},fillRect(){},stroke(){},moveTo(){},lineTo(){},drawImage(...args){images.push(args);},
  measureText:s=>({width:String(s).length*24}),
  fillText:s=>labels.push(String(s)),
  textAlign:'left',textBaseline:'alphabetic'
 };
 const canvas={width:0,height:0,getContext:()=>ctx};
 const window={GC:C,GC_PHOTO_DOWNLOAD:{photoBlob:async()=>({})},GC_WATERMARK:{get:()=>({})},createImageBitmap:async()=>({width:600,height:500,close(){}})};
 const document={createElement:name=>{assert.equal(name,'canvas');return canvas;}};
 class BrandLogoMock{
 constructor(){this.width=256;this.height=256;this.naturalWidth=256;this.naturalHeight=256;}
 set src(value){this.source=value;queueMicrotask(()=>this.onload?.());}
}
 const context={window,document,console,Image:BrandLogoMock};
 vm.runInNewContext(source,context);
 return {api:window.GC_PRODUCT_QUOTE,labels,images};
}
async function main(){
 const normal={id:'MOUSE',name:'Mouse Gaming K90',price:300,stock:2,active:true,codAllowed:false,discounts:''};
 const free={id:'KIT',name:'Kit Gamer Mobilador V8',price:1470,stock:3,active:true,codAllowed:true,discounts:'ENVIOGRATIS'};
 const settings={shipping:110,tigoRate:.10,codRate:.15,codMinimum:350};
 for(const p of [normal,free]){
  const f=fixture(),computed=f.api.calculate(p,settings),expected={
   transfer:C.quote([{product:p,qty:1}],'transfer',settings),
   tigo:C.quote([{product:p,qty:1}],'tigo',settings),
   cod:C.quote([{product:p,qty:1}],'cod',settings)
  };
  for(const method of Object.keys(expected))assert.equal(computed[method].total,expected[method].total);
  await f.api.render(p,'foto.jpg',settings);
  assert.ok(f.images.some(args=>args[0]?.source==='assets/img/logo-rojo.webp'),'Debe dibujar el logo oficial dentro de la cotización');
  const content=f.labels.join(' | ');
  assert.match(content,/GAMER/);assert.match(content,/COMAYAGUA/);
  assert.match(content,/Depósito \/ transferencia/);
  assert.match(content,/Tigo Money/);assert.match(content,/Pagar al recibir/);
  assert.ok(f.labels.includes(C.money(computed.transfer.total)));
  assert.ok(f.labels.includes(C.money(computed.tigo.total)));
  assert.ok(content.includes('Comisión 10%: '+C.money(computed.tigo.fee)),'Debe mostrar importe de la comisión de Tigo Money.');
  assert.ok(content.includes('Envío '+C.money(computed.transfer.shipping)),'Debe mostrar el envío real.');
  if(computed.cod.codAllowed){
   assert.ok(f.labels.includes(C.money(computed.cod.total)));
   assert.ok(content.includes('Comisión 15%: '+C.money(computed.cod.fee)));
   assert.ok(content.includes('Anticipo a depositar: '+C.money(computed.cod.deposit)));
   assert.ok(content.includes('Saldo al recibir: '+C.money(computed.cod.balance)));
  }else assert.match(content,/No disponible/);
  assert.equal(content.includes('gratis incluido'),computed.transfer.shipping===0);
 }
 console.log('PASS cotización PNG: diseño sin tarjetas, importes Tigo/COD, anticipo, envíos y producto restringido.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
