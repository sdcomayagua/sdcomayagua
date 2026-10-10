
(function(){
'use strict';
const cfg=window.GC_CONFIG,C=window.GC,$=id=>document.getElementById(id);
let token='',products=[],settings={},selectedFiles=[],busy=false,previewUrls=[],checkingConnection=null,catalogSource='';
try{token=sessionStorage.getItem('gc_admin_token')||''}catch{}
const fallback='assets/img/sin-foto.svg';
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const toast=x=>{const el=$('toast');el.textContent=x;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3800)};
const yes=v=>String(v??'').trim().toUpperCase()==='SI';
function validApi(){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(cfg.apiUrl||'')}
function request(action,extra={}){
 if(!validApi())return Promise.reject(Error('No se encontró la dirección de Apps Script. Podés administrar el inventario desde Google Sheets mientras se revisa la conexión.'));
 return new Promise((resolve,reject)=>{
  const requestId='req'+Date.now()+Math.random().toString(36).slice(2),frame=document.createElement('iframe'),form=document.createElement('form');
  let timer,complete=false;
  function finish(err,data){if(complete)return;complete=true;clearTimeout(timer);window.removeEventListener('message',listener);frame.remove();form.remove();err?reject(err):resolve(data)}
  frame.name='frame_'+requestId;frame.style.cssText='position:absolute;width:0;height:0;visibility:hidden;border:0';document.body.appendChild(frame);
  function listener(ev){const allowed=ev.origin==='null'||/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/i.test(ev.origin);if(!allowed)return;const d=ev.data;if(!d||d.__gcResponse!==true||d.requestId!==requestId)return;if(d.ok)finish(null,d);else finish(Error(d.error||'No se pudo completar la operación'))}
  window.addEventListener('message',listener);
  form.method='POST';form.target=frame.name;form.action=cfg.apiUrl;form.style.display='none';
  const field=document.createElement('input');field.name='payload';field.value=JSON.stringify({requestId,action,token,...extra});
  form.appendChild(field);document.body.appendChild(form);
  timer=setTimeout(()=>finish(Error(action==='verify'?'Google no respondió al validar el PIN. Podés abrir el diagnóstico para revisar la conexión.':'Google no respondió a la operación. Revisá el diagnóstico de conexión.')),action==='verify'?28000:action==='uploadImage'?90000:60000);
  form.submit();
 });
}
function jsonp(action='public'){
 return new Promise((resolve,reject)=>{
  const n='gcAdminList'+Date.now(),s=document.createElement('script');
  let done=false;
  const t=setTimeout(()=>end(Error('Sin respuesta de Apps Script. Revisá el acceso público de la implementación /exec.')),14000);
  function end(err,result){if(done)return;done=true;clearTimeout(t);delete window[n];s.remove();err?reject(err):resolve(result)}
  window[n]=result=>result.ok?end(null,result):end(Error(result.error||'Error al consultar'));
  // Una pantalla de inicio de sesión cargada como script no ejecuta el callback JSONP.
  s.onload=()=>{if(!done)end(Error('Google devolvió una página sin respuesta de la API. Revisá el acceso anónimo de Apps Script.'));};
  s.onerror=()=>end(Error('Google rechazó o bloqueó la conexión. Revisá los permisos de Apps Script.'));
  s.src=cfg.apiUrl+'?action='+encodeURIComponent(action)+'&callback='+n+'&t='+Date.now();
  document.head.appendChild(s)
 })
}
function checkHealth(){return jsonp('health')}
function connectionCheck(){
 if(checkingConnection)return checkingConnection;
 checkingConnection=(async()=>{
  $('retryConnection').disabled=true;
  $('connectionStatus').textContent='Comprobando conexión… Podés ingresar tu PIN.';
  try{
   const health=await checkHealth();
   if(health.pinConfigurado===false){
    $('connectionStatus').textContent='Google responde, pero falta configurar el PIN en Apps Script.';
    $('connectionHelp').classList.remove('hidden');return false;
   }
   $('connectionStatus').textContent='Conexión disponible. Ingresá tu PIN.';
   $('connectionHelp').classList.add('hidden');return true;
  }catch(error){
   // La prueba pública usa GET/JSONP. No bloqueamos el POST que valida el PIN.
   $('connectionStatus').textContent='No se pudo comprobar la conexión automáticamente. Podés intentar ingresar.';
   $('connectionHelp').classList.remove('hidden');return false;
  }finally{$('retryConnection').disabled=false;checkingConnection=null;}
 })();
 return checkingConnection;
}
function parseGallery(raw){
 const out=[];
 let text=String(raw||'').trim();try{const parsed=JSON.parse(text);if(Array.isArray(parsed))text=parsed.join('\n')}catch{}
 text.split(/[\n,;|]/).map(v=>v.trim()).filter(Boolean).forEach(url=>{if(/^https:\/\//i.test(url)||/^assets\/products\/[\w.-]+$/i.test(url)){if(!out.includes(url))out.push(url)}});
 return out.slice(0,10);
}
function normalizePreview(url){
 const src=String(url||'').trim();
 if(/^https:\/\//i.test(src))return src;
 if(/^(?:assets\/products\/)[\w.-]+$/i.test(src))return src;
 return fallback;
}
function renderGalleryPreview(){
 const main=$('productImage').value.trim();
 const gallery=parseGallery($('galleryInput').value);
 const all=[main,...gallery].filter(Boolean).slice(0,10);
 $('imagePreview').src=normalizePreview(all[0]);
 previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];
 const files=selectedFiles.slice(0,10);
 $('selectedFilesText').textContent=files.length?files.map(f=>f.name).join(', '):'No hay archivos seleccionados.';
 $('galleryPreview').innerHTML=all.length
   ? all.map((url,i)=>`<div class="gallery-thumb"><img src="${esc(normalizePreview(url))}" onerror="this.onerror=null;this.src='${fallback}'" alt="Foto ${i+1}"><span>${i===0?'Principal':'Foto '+(i+1)}</span><button type="button" data-main="${i}" aria-label="Usar foto ${i+1} como principal">Principal</button><button type="button" data-remove-photo="${i}" aria-label="Quitar foto ${i+1}">Quitar</button></div>`).join('')
   : '<div class="gallery-help">Acá verás la imagen principal y la galería.</div>';
 $('pendingPreview').innerHTML=files.map((file,i)=>{const url=URL.createObjectURL(file);previewUrls.push(url);return `<div class="gallery-thumb pending"><img src="${url}" alt="Foto pendiente ${i+1}"><span>Pendiente</span><button type="button" data-remove-file="${i}" aria-label="Quitar archivo ${i+1}">Quitar</button></div>`}).join('');
 $('imagePreview').onerror=function(){this.onerror=null;this.src=fallback};
}
function render(){
 const q=$('adminSearch').value.toLowerCase().trim();
 const rows=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q));
 $('statProducts').textContent=products.filter(p=>p.active).length;
 $('statAvailable').textContent=products.filter(p=>p.stock>0).length;
 $('statOut').textContent=products.filter(p=>!p.stock).length;
 $('statCod').textContent=products.filter(p=>p.codAllowed).length;
 $('adminRows').innerHTML=rows.map(p=>`<tr>
   <td data-label="Producto"><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.category)}</span></td>
   <td data-label="Precio">${C.money(p.price)}</td>
   <td data-label="Promoción">${p.promoPrice>0?C.money(p.promoPrice):'—'}</td>
   <td data-label="Costo">${catalogSource==='privado'?C.money(p.cost):'—'}</td>
   <td data-label="Stock">${p.stock}</td>
   <td data-label="Pago al recibir"><span style="color:${p.codAllowed?'#0f9f6a':'#d64545'}">${p.codAllowed?'✓ Permitido':'× Prohibido'}</span></td>
   <td data-label="Estado">${p.active?'Activo':'Oculto'}</td>
   <td data-label="Acciones"><button type="button" class="btn small outline" data-edit="${esc(p.id)}" >Editar</button> <button type="button" class="btn small red" data-disable="${esc(p.id)}" >Ocultar</button></td>
 </tr>`).join('')||'<tr><td colspan="8" class="muted">No hay resultados.</td></tr>';
 $('settingsSummary').textContent=`Envío: ${C.money(settings.shipping||110)} | Mínimo pago al recibir: ${C.money(settings.codMinimum||350)} | Cantidad mínima: ${settings.codMinimumUnits||2} | Comisión al recibir: ${Math.round((settings.codRate||.1)*100)}% | Tigo Money: ${Math.round((settings.tigoRate||.07)*100)}%`;

}
async function reload(){
 const label=$('adminStatus');
 label.textContent='Sincronizando inventario…';
 // El canal POST ya funciona para autenticar y modificar datos. Lo usamos
 // también para leer productos, sin depender del GET/JSONP bloqueado.
 try{
  const data=await request('adminCatalog');
  if(!Array.isArray(data.products))throw Error('El servidor no devolvió productos.');
  catalogSource='privado';
  products=data.products.map(p=>({...C.cleanProduct(p),cost:C.num(p.cost)}));
  settings=data.settings||{};
  render();
  label.textContent='✓ Inventario actualizado desde Google Sheets.';
  return true;
 }catch(error){
  try{
   const response=await fetch('data/catalogo-respaldo.json?admin='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('No se pudo abrir el respaldo.');
   const data=await response.json();
   if(!Array.isArray(data)||!data.length)throw Error('Respaldo vacío.');
   catalogSource='respaldo';
   products=data.map(C.cleanProduct);
   render();
   label.textContent='Catálogo de respaldo cargado. Para sincronizar cambios al instante, publicá la última versión de Code.gs en Apps Script.';
   return false;
  }catch(backupError){
   label.textContent='No se pudieron consultar los productos. Revisá la implementación de Apps Script.';
   toast(backupError.message);
   return false;
  }
 }
}
async function logIn(e){
 if(e)e.preventDefault();
 // El PIN se comprueba directamente en el servidor; no dependemos del test público JSONP.
 const candidate=$('secret').value.trim();
 if(!/^\d{6}$/.test(candidate)){toast('Ingresá tu PIN de seis dígitos.');return;}
 token=candidate;$('loginBtn').disabled=true;$('loginBtn').textContent='Verificando…';$('loginMessage').classList.add('hidden');
 try{
  await request('verify');sessionStorage.setItem('gc_admin_token',token);
  $('loginPanel').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('logout').classList.remove('hidden');reload();
 }catch(err){token='';$('loginMessage').textContent=err.message;$('loginMessage').classList.remove('hidden')}
 finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Ingresar al panel'}
}
function showProduct(id){
 const p=products.find(p=>p.id===id)||{id:'',name:'',code:'',category:'',price:0,promoPrice:0,promoText:'',colors:'',stock:0,cost:'',image:'',gallery:'',description:'',discounts:'',codAllowed:true,active:true};
 const f=$('productForm');
 for(const [k,v] of Object.entries(p)){if(f.elements[k]&&k!=='cost'&&k!=='promoPrice')f.elements[k].value=v??'';}
 f.elements.promoPrice.value=p.promoPrice>0?p.promoPrice:'';
 f.elements.cost.value='';
 const specs=C.cleanDetails(p.details);
 for(const key of ['weight','width','height','length','size','material','model','compatibility']){
  f.elements[key].value=specs[key]??'';
 }
 f.elements.weightUnit.value=specs.weightUnit||'kg';
 f.elements.measureUnit.value=specs.measureUnit||'cm';
 $('technicalEditor').open=Object.keys(specs).length>0;
 f.elements.codAllowed.value=p.codAllowed?'SI':'NO';
 f.elements.active.value=p.active?'SI':'NO';
 $('formTitle').textContent=id?'Editar producto':'Nuevo producto';
 $('formMessage').textContent='';
 selectedFiles=[];
 $('uploadFile').value='';$('cameraFile').value='';
 renderGalleryPreview();
 $('formOverlay').hidden=false;document.body.style.overflow='hidden';
}
function closeForm(){if(busy)return;$('formOverlay').hidden=true;document.body.style.overflow='';}
async function save(e){
 e.preventDefault();
 if(busy)return;
 if(selectedFiles.length && !(await upload()))return;
 const f=$('productForm'),p={};
 for(const k of ['id','code','name','category','price','promoPrice','promoText','colors','cost','stock','image','gallery','discounts','description'])p[k]=f.elements[k].value.trim();
 p.gallery=parseGallery(p.gallery).filter(u=>u!==p.image).slice(0,9).join(', ')||'[]';
 p.codAllowed=f.elements.codAllowed.value==='SI';
 p.active=f.elements.active.value==='SI';
 const rawDetails={};
 for(const key of ['weight','width','height','length','size','material','model','compatibility','weightUnit','measureUnit']){
  rawDetails[key]=f.elements[key].value.trim();
 }
 p.details=C.cleanDetails(rawDetails);
 p.price=Number(p.price);p.stock=Number(p.stock);
 p.promoPrice=p.promoPrice===''||Number(p.promoPrice)===0?'':Number(p.promoPrice);
 if(!Number.isFinite(p.price)||p.price<0||p.stock<0||!Number.isInteger(p.stock))return toast('Verificá precio y stock');
 if(p.promoPrice!==''&&(!Number.isFinite(p.promoPrice)||p.promoPrice<=0||p.promoPrice>p.price))return toast('La promoción debe ser mayor que cero y no superar el precio normal.');
 setBusy(true);$('formMessage').textContent='Guardando en Google Sheets...';
 try{const out=await request('saveProduct',{product:p});toast(out.message||'Guardado');setBusy(false);closeForm();if(catalogSource==='respaldo'){const merged=C.cleanProduct({...p,cost:0});const i=products.findIndex(x=>x.id===(out.id||p.id));merged.id=out.id||p.id;if(i>=0)products[i]=merged;else products.unshift(merged);render();$('adminStatus').textContent='✓ Guardado en Google Sheets. La vista de respaldo puede requerir actualización cuando se publique la nueva versión de Apps Script.';}else await reload()}catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{setBusy(false)}
}
function mergeSelectedFiles(list){
 const incoming=Array.from(list||[]).filter(Boolean);
 const merged=[...selectedFiles];
 incoming.forEach(file=>{if(!merged.some(x=>x.name===file.name&&x.size===file.size&&x.lastModified===file.lastModified))merged.push(file)});
 if(merged.length>10)toast('Podés seleccionar hasta 10 fotos.');
 selectedFiles=merged.slice(0,10);
 renderGalleryPreview();
}
function setGalleryFromUrls(urls){
 const current=parseGallery($('galleryInput').value);
 const main=$('productImage').value.trim();
 const merged=[];
 if(main)merged.push(main);
 current.forEach(u=>{if(!merged.includes(u))merged.push(u)});
 urls.forEach(u=>{if(!merged.includes(u))merged.push(u)});
 const unique=merged.slice(0,10);
 $('productImage').value=unique[0]||'';
 $('galleryInput').value=unique.slice(1).join('\n');
 renderGalleryPreview();
}
function setBusy(value){
 busy=value;
 for(const id of ['saveBtn','uploadBtn','pickGalleryBtn','pickCameraBtn','closeForm','cancelForm'])$(id).disabled=value;
 $('productForm').setAttribute('aria-busy',String(value));
}
async function preparePhoto(file){
 if(!/^image\/(jpeg|png|webp|gif)$/i.test(file.type))throw Error('Usá una foto JPG, PNG, WEBP o GIF. Si tu celular usa HEIC, elegí formato JPG.');
 if(file.size>30*1024*1024)throw Error('La foto supera 30 MB. Elegí una más pequeña.');
 if(file.type==='image/gif'){
  if(file.size>2*1024*1024)throw Error('El GIF debe pesar menos de 2 MB.');
  return file;
 }
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('No se pudo abrir la foto. Probá otra imagen.'));i.src=url});
  const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));
  if(!blob||blob.size>2*1024*1024)throw Error('No se pudo reducir la foto a 2 MB. Elegí una más pequeña.');
  return blob;
 }finally{URL.revokeObjectURL(url)}
}
async function upload(){
 if(busy)return false;
 const already=[...new Set([$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean))];
 if(already.length+selectedFiles.length>10){toast('Máximo 10 fotos. Quitá alguna antes de continuar.');return false;}
 if(!selectedFiles.length){toast('Elegí fotos de tu galería o cámara.');return false;}
 setBusy(true);
 const queue=[...selectedFiles];
 try{
  for(let i=0;i<queue.length;i++){
   $('formMessage').textContent=`Optimizando y subiendo foto ${i+1} de ${queue.length}…`;
   const file=await preparePhoto(queue[i]);
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No se pudo leer la foto'));reader.readAsDataURL(file)});
   const out=await request('uploadImage',{file:{mime:file.type,base64}});
   if(!/^https:\/\//i.test(out.url||''))throw Error('El servidor no devolvió el enlace de la foto.');
   setGalleryFromUrls([out.url]);
   selectedFiles=selectedFiles.filter(f=>f!==queue[i]);renderGalleryPreview();
  }
  $('uploadFile').value='';$('cameraFile').value='';
  $('formMessage').textContent='Fotos listas. Tocá Guardar producto para publicarlas.';
  return true;
 }catch(err){$('formMessage').textContent='⚠ '+err.message+' Las fotos ya subidas se conservan. Podés reintentar las pendientes.';toast(err.message);return false;}
 finally{setBusy(false)}
}
async function disable(id){
 const p=products.find(x=>x.id===id);if(!p||!confirm('¿Ocultar "'+p.name+'" de la tienda? El registro se conservará en Sheets.'))return;
 try{await request('disableProduct',{id});toast('Producto ocultado');if(catalogSource==='respaldo'){p.active=false;render();$('adminStatus').textContent='✓ Producto ocultado en Google Sheets. Vista temporal con datos de respaldo.';}else await reload()}catch(e){toast(e.message)}
}
function binds(){
 $('sheetLink').href=cfg.spreadsheetUrl;
 $('loginForm').onsubmit=logIn;
 // El enlace de diagnóstico también funciona con implementaciones anteriores que exigen JSONP.
 $('googleConnection').href=cfg.apiUrl+'?action=health&callback=gcConnection';
 $('retryConnection').onclick=connectionCheck;
 $('logout').onclick=()=>{token='';sessionStorage.removeItem('gc_admin_token');location.reload()};
 $('refresh').onclick=reload;
 $('createNew').onclick=()=>showProduct('');
 $('adminSearch').oninput=render;
 $('adminRows').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)showProduct(b.dataset.edit);if(b.dataset.disable)disable(b.dataset.disable)};
 $('closeForm').onclick=closeForm;$('cancelForm').onclick=closeForm;
 $('productForm').onsubmit=save;
 $('uploadBtn').onclick=upload;
 $('galleryPreview').onclick=e=>{
  if(busy)return;
  const b=e.target.closest('button');if(!b)return;
  const urls=[$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean);
  if(b.dataset.main!==undefined){const i=Number(b.dataset.main);urls.unshift(...urls.splice(i,1));}
  if(b.dataset.removePhoto!==undefined)urls.splice(Number(b.dataset.removePhoto),1);
  $('productImage').value=urls[0]||'';$('galleryInput').value=urls.slice(1).join('\n');renderGalleryPreview();
 };
 $('pendingPreview').onclick=e=>{if(busy)return;const b=e.target.closest('[data-remove-file]');if(b){selectedFiles.splice(Number(b.dataset.removeFile),1);renderGalleryPreview();}};
 $('pickGalleryBtn').onclick=()=>$('uploadFile').click();
 $('pickCameraBtn').onclick=()=>$('cameraFile').click();
 $('uploadFile').addEventListener('change',e=>mergeSelectedFiles(e.target.files));
 $('cameraFile').addEventListener('change',e=>mergeSelectedFiles(e.target.files));
 $('productImage').addEventListener('input',renderGalleryPreview);
 $('galleryInput').addEventListener('input',renderGalleryPreview);
 $('imagePreview').onerror=function(){this.onerror=null;this.src=fallback};
 $('formOverlay').onclick=e=>{if(e.target===$('formOverlay'))closeForm()};
 document.onkeydown=e=>{if(e.key==='Escape')closeForm()};
 renderGalleryPreview();
 if(!validApi()){$('loginMessage').textContent='Todavía falta conectar el sitio con Apps Script: editá assets/js/config.js.';$('loginMessage').classList.remove('hidden')}
 else {connectionCheck().then(ok=>{if(token){$('secret').value=token;if(ok)logIn();}});}
}
binds();
})();
