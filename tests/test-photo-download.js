/* Pruebas sin red: descarga de Drive por la API autenticada y error de implementación antigua. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/photo-download.js'),'utf8');

function start(request,mirrors=null){
 const calls=[];
 const window={GC_ADMIN:{request:async(...args)=>{calls.push(args);return request(...args)}},
  GC_CONFIG:{publicApiUrl:'https://example.invalid/exec'},
  GC_WATERMARK:{options:()=>({watermarkEnabled:false}),get:()=>({})}};
 class ImageMock{
  set src(v){
   this._src=v;
   queueMicrotask(()=>{
    if(String(v).startsWith('data:image/')||/^assets\/catalog\/[a-f0-9]{24}\.jpg$/.test(v)){this.naturalWidth=800;this.naturalHeight=600;this.onload?.();}
    else this.onerror?.();
   });
  }
  get src(){return this._src;}
 }
 const ctx={fillRect(){},drawImage(){}};
 const document={
  createElement(kind){
   if(kind==='canvas')return {width:0,height:0,getContext:()=>ctx,toBlob:fn=>fn(new Blob([new Uint8Array([0xff,0xd8,0xff])],{type:'image/jpeg'}))};
   if(kind==='script')return {remove(){},set src(v){this._src=v;},get src(){return this._src;}};
   if(kind==='a')return {click(){},remove(){}};
   throw Error('Elemento inesperado '+kind);
  },
  head:{appendChild(script){queueMicrotask(()=>script.onerror?.());}},
  body:{appendChild(){}}
 };
 const context={window,document,Image:ImageMock,Blob,URL,setTimeout,clearTimeout,TextEncoder,Uint8Array,Uint32Array,console,Math,...(mirrors?{fetch:async()=>({ok:true,json:async()=>({images:mirrors})})}:{})};
 vm.runInNewContext(source,context,{filename:'photo-download.js'});
 return {downloader:window.GC_PHOTO_DOWNLOAD,calls};
}
const product={id:'925035f4-5aec-46e6-8459-230373d7a28c',name:'Mouse Gaming K90',code:'Mouse-003',image:'https://drive.google.com/thumbnail?id=1d09XU-sRONXxkS5pprI3Kyllj1rAflIm&sz=w1200',gallery:'https://drive.google.com/thumbnail?id=1BeNCRFyDcDywG3s4FLQvFiLC2woCXjwk&sz=w1200'};
(async()=>{
 const good=start(async()=>({ok:true,data:'data:image/jpeg;base64,/9j/' }));
 assert.equal(good.downloader.sources(product).length,2);
 const first=await good.downloader.photoBlob(product,product.image,0,{});
 assert.equal(first.type,'image/jpeg');
 assert.deepEqual(good.calls[0][0],'adminPhotoData');
 assert.equal(good.calls[0][1].index,0);
 const second=await good.downloader.photoBlob(product,good.downloader.sources(product)[1],1,{});
 assert.equal(second.type,'image/jpeg');
 assert.equal(good.calls[1][1].index,1);

 const local=start(async()=>{throw Error('Apps Script no publicado');},{
   [product.id]:{source:product.image,path:'assets/catalog/'+'a'.repeat(24)+'.jpg',
    gallery:[{source:product.gallery,path:'assets/catalog/'+'b'.repeat(24)+'.jpg'}]}
 });
 const localMain=await local.downloader.photoBlob(product,product.image,0,{});
 const localSecond=await local.downloader.photoBlob(product,product.gallery,1,{});
 assert.equal(localMain.type,'image/jpeg');
 assert.equal(localSecond.type,'image/jpeg');
 assert.equal(local.calls.length,0,'Las copias locales no requieren Apps Script');

 const old=start(async()=>{throw Error('Operación no reconocida.');});
 await assert.rejects(old.downloader.photoBlob(product,product.image,0,{}),/Code\.gs|Apps Script/);
 assert.equal(old.calls.length,1);

 const notAllowed=start(async()=>{throw Error('Acceso no autorizado.');});
 await assert.rejects(notAllowed.downloader.photoBlob(product,product.image,0,{}),/PIN|acceso/i);
 console.log('OK: imagen de Drive con API autenticada, galería y error de Apps Script sin publicar.');
})().catch(e=>{console.error(e);process.exitCode=1;});
