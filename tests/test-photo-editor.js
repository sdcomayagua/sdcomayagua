// Isolated client workflow: no network calls or inventory writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',innerHTML:'',setAttribute(){}});return elements.get(id)};
let count=0,failAt=2;
const context={window:{GC_CONFIG:{},GC:{}},document:{getElementById:get,createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}}),toBlob:cb=>cb({type:'image/webp',size:1000})})},sessionStorage:{getItem:()=>''},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Image:class{naturalWidth=4000;naturalHeight=3000;set src(v){this.onload()}},FileReader:class{readAsDataURL(){this.result='data:image/webp;base64,eA==';this.onload()}},setTimeout:()=>0,clearTimeout(){},console};
let source=fs.readFileSync(__dirname+'/../assets/js/admin.js','utf8');
source=source.replace('binds();',`window.test={upload,preparePhoto,select:files=>selectedFiles=files,pending:()=>selectedFiles.length,mock:fn=>request=fn};`);
vm.runInNewContext(source,context);
const api=context.window.test;
api.mock(async()=>{count++;if(count===failAt)throw Error('Conexión interrumpida');return {url:'https://example.com/photo'+count+'.webp'}});
(async()=>{
 const photo={type:'image/jpeg',size:5*1024*1024,name:'camera.jpg'};
 assert.equal((await api.preparePhoto(photo)).type,'image/webp');
 await assert.rejects(api.preparePhoto({type:'image/heic',size:100}),/JPG/);
 await assert.rejects(api.preparePhoto({type:'image/gif',size:3*1024*1024}),/2 MB/);
 api.select([photo,{...photo,name:'second.jpg'}]);
 assert.equal(await api.upload(),false);
 assert.equal(get('productImage').value,'https://example.com/photo1.webp');
 assert.equal(api.pending(),1);assert.equal(get('saveBtn').disabled,false);
 failAt=0;assert.equal(await api.upload(),true);assert.equal(api.pending(),0);
 assert.match(get('galleryInput').value,/photo3/);assert.equal(count,3);
 get('galleryInput').value=Array.from({length:9},(_,i)=>'https://example.com/'+i).join('\n');
 api.select([photo]);assert.equal(await api.upload(),false);assert.equal(count,3);
 console.log('PASS: camera optimization, invalid formats, partial failure, retry without repeated uploads, gallery limit.');
})().catch(e=>{console.error(e);process.exitCode=1});
