/* Revisión de contraste, cortes, navegación y capturas en PC/celular.
   Usa datos públicos simulados; nunca entra al Admin ni captura información bancaria real. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),fixture=require('./helpers/inventory-fixture');
const root=path.resolve(__dirname,'..'),output=path.resolve(process.env.GC_VISUAL_ARTIFACTS||'artifacts/visual');
const viewports=[360,768,1280,1840];
const pages=[
 {name:'inicio',url:'/index.html',ready:'.home-product'},
 {name:'productos',url:'/productos.html',ready:'#productGrid .product'},
 {name:'pagos',url:'/pagos.html',ready:'.shipping-calculator'},
 {name:'cuentas',url:'/cuentas.html',ready:'.bank-card'}
];
function writeJson(file,value){fs.writeFileSync(path.join(output,file),JSON.stringify(value,null,2)+'\n');}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const demo=fixture(),sample={
  ...demo.post('publicCatalog'),
  banks:[{bank:'Banco de demostración',owner:'Titular ficticio',identity:'0000000000000',account:'0012',visible:true}]
 };
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),filename=path.resolve(root,'.'+pathname);
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(filename,(error,data)=>{
   if(error){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(filename)]||'text/plain');
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,report=[],failures=[],errors=[];
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.GC_TEST_BROWSER?{executablePath:process.env.GC_TEST_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
  const context=await browser.newContext({reducedMotion:'reduce'});
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{
   const url=new URL(route.request().url()),callback=url.searchParams.get('callback');
   if(callback&&/^[A-Za-z_$][\w.$]*$/.test(callback))
    return route.fulfill({contentType:'application/javascript',body:callback+'('+JSON.stringify(sample)+');'});
   return route.abort();
  });
  const tab=await context.newPage();
  tab.on('pageerror',e=>errors.push(e.message));
  for(const width of viewports){
   await tab.setViewportSize({width,height:900});
   for(const entry of pages){
    const id=entry.name+'-'+width;
    try{
     await tab.goto(base+entry.url,{waitUntil:'domcontentloaded'});
     await tab.locator(entry.ready).first().waitFor({state:'visible',timeout:15000});
     await tab.evaluate(()=>document.fonts?.ready);
     const metrics=await tab.evaluate((pageName)=>{
      const css=element=>getComputedStyle(element);
      const bounds=element=>element?.getBoundingClientRect();
      const good=(element)=>!!element&&bounds(element).width>0&&bounds(element).height>0;
      const rgb=color=>(String(color).match(/[\d.]+/g)||[]).slice(0,3).map(Number);
      const luminance=color=>{
       const values=rgb(color),linear=values.map(n=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
       return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
      };
      const contrast=(textEl,backgroundEl)=>{
       if(!textEl||!backgroundEl)return 0;
       const a=luminance(css(textEl).color),b=luminance(css(backgroundEl).backgroundColor);
       return Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));
      };
      const result={page:pageName,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
       noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+1};
      if(pageName==='inicio'){
       const products=document.querySelector('#homeProducts'),categories=document.querySelector('#homeCategories');
       result.productsVisible=good(products);result.categoriesVisible=good(categories);
       result.contentWidth=Math.round(bounds(products).width);
      }else if(pageName==='productos'){
       const item=document.querySelector('#productGrid .product');
       const action=item?.querySelector('[data-add]');
       result.cardVisible=good(item);result.cartButtonHeight=Math.round(bounds(action)?.height||0);
      }else if(pageName==='cuentas'){
       const account=document.querySelector('.bank-card .bank-account-primary'),number=account?.querySelector('strong'),copy=account?.querySelector('button');
       result.bankVisible=good(account)&&good(number);
       result.accountContrast=contrast(number,account);
       result.accountCopyHeight=Math.round(bounds(copy)?.height||0);
       result.accountNotCut=!!account&&!!copy&&bounds(copy).right<=bounds(account).right+1;
      }else if(pageName==='pagos'){
       const calculator=document.querySelector('.shipping-calculator'),label=document.querySelector('.shipping-calc-form label');
       const summary=document.querySelector('.shipping-calc-result'),total=summary?.querySelector('.estimate-total strong');
       result.calculatorVisible=good(calculator);result.amountVisible=good(total);
       result.labelContrast=contrast(label,calculator);
       result.amountContrast=contrast(total,summary);
       result.totalNotCut=!!total&&bounds(total).right<=bounds(summary).right+1;
      }
      return result;
     },entry.name);
     report.push(metrics);
     await tab.screenshot({path:path.join(output,id+'.png'),animations:'disabled'});
     if(!metrics.noHorizontalOverflow)failures.push(id+': desplazamiento horizontal');
     if(entry.name==='inicio'&&(!metrics.productsVisible||!metrics.categoriesVisible))failures.push(id+': secciones desaparecidas');
     if(entry.name==='productos'&&(!metrics.cardVisible||width<=768&&metrics.cartButtonHeight<42))failures.push(id+': ficha o botón demasiado pequeño');
     if(entry.name==='cuentas'&&(!metrics.bankVisible||metrics.accountContrast<7||metrics.accountCopyHeight<42||!metrics.accountNotCut))failures.push(id+': cuenta invisible, bajo contraste o recortada');
     if(entry.name==='pagos'&&(!metrics.calculatorVisible||!metrics.amountVisible||metrics.labelContrast<4.5||metrics.amountContrast<7||!metrics.totalNotCut))failures.push(id+': importe, etiquetas o calculadora ilegibles');
    }catch(error){
     failures.push(id+': '+String(error.message).slice(0,250));
     try{await tab.screenshot({path:path.join(output,id+'-error.png'),animations:'disabled'});}catch(_){}
    }
   }
  }
 }finally{
  writeJson('informe.json',{createdAt:new Date().toISOString(),screenshots:report.length,report,failures,scriptErrors:errors});
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
 assert.equal(failures.length,0,failures.join('\n'));
 assert.deepEqual(errors,[],'Sin excepciones de JavaScript en la tienda');
 console.log('PASS diseño: '+report.length+' capturas verificadas (Inicio, Productos, Pagos, Cuentas) en '+viewports.length+' anchuras.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
