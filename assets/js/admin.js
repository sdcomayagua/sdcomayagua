
(function(){
'use strict';
const cfg=window.GC_CONFIG,C=window.GC,$=id=>document.getElementById(id);
let token='',products=[],settings={},selectedFiles=[];
try{token=sessionStorage.getItem('gc_admin_token')||''}catch{}
const fallback='assets/img/sin-foto.svg';
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const toast=x=>{const el=$('toast');el.textContent=x;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3800)};
const yes=v=>String(v??'').trim().toUpperCase()==='SI';
function validApi(){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(cfg.apiUrl||'')}
function request(action,extra={}){
 if(!validApi())return Promise.reject(Error('Primero configurá la URL de Apps Script en assets/js/config.js.'));
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
  timer=setTimeout(()=>finish(Error('No hubo respuesta del servidor. Revisá Apps Script.')),45000);
  form.submit();
 });
}
function jsonp(action='public'){
 return new Promise((resolve,reject)=>{
  const n='gcAdminList'+Date.now(),s=document.createElement('script');
  const t=setTimeout(()=>end(Error('Sin respuesta de Apps Script')),14000);
  function end(err,result){clearTimeout(t);delete window[n];s.remove();err?reject(err):resolve(result)}
  window[n]=result=>result.ok?end(null,result):end(Error(result.error||'Error al consultar'));
  s.onerror=()=>end(Error('Fallo al consultar'));
  s.src=cfg.apiUrl+'?action='+encodeURIComponent(action)+'&callback='+n+'&t='+Date.now();
  document.head.appendChild(s)
 })
}
function checkHealth(){return jsonp('health')}
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
 const files=selectedFiles.slice(0,10);
 $('selectedFilesText').textContent=files.length?files.map(f=>f.name).join(', '):'No hay archivos seleccionados.';
 $('galleryPreview').innerHTML=all.length
   ? all.map((url,i)=>`<div class="gallery-thumb"><img src="${esc(normalizePreview(url))}" onerror="this.onerror=null;this.src='${fallback}'" alt="Foto ${i+1}"><span>${i===0?'Principal':'Foto '+(i+1)}</span></div>`).join('')
   : '<div class="gallery-help">Acá verás la imagen principal y la galería.</div>';
 $('imagePreview').onerror=function(){this.onerror=null;this.src=fallback};
}
function render(){
 const q=$('adminSearch').value.toLowerCase().trim();
 const rows=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q));
 $('statProducts').textContent=products.length;
 $('statAvailable').textContent=products.filter(p=>p.stock>0).length;
 $('statOut').textContent=products.filter(p=>!p.stock).length;
 $('statCod').textContent=products.filter(p=>p.codAllowed).length;
 $('adminRows').innerHTML=rows.map(p=>`<tr>
   <td data-label="Producto"><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.category)}</span></td>
   <td data-label="Precio">${C.money(p.price)}</td>
   <td data-label="Stock">${p.stock}</td>
   <td data-label="Pago al recibir"><span style="color:${p.codAllowed?'#0f9f6a':'#d64545'}">${p.codAllowed?'✓ Permitido':'× Prohibido'}</span></td>
   <td data-label="Estado">${p.active?'Activo':'Oculto'}</td>
   <td data-label="Acciones"><button type="button" class="btn small outline" data-edit="${esc(p.id)}" >Editar</button> <button type="button" class="btn small red" data-disable="${esc(p.id)}" >Ocultar</button></td>
 </tr>`).join('')||'<tr><td colspan="6" class="muted">No hay resultados.</td></tr>';
 $('settingsSummary').textContent=`Envío: ${C.money(settings.shipping||110)} | Mínimo pago al recibir: ${C.money(settings.codMinimum||350)} | Cantidad mínima: ${settings.codMinimumUnits||2} | Comisión al recibir: ${Math.round((settings.codRate||.1)*100)}% | Tigo Money: ${Math.round((settings.tigoRate||.07)*100)}%`;

}
async function reload(){
 try{
  $('adminStatus').textContent='Sincronizando catálogo...';
  const data=await jsonp();
  products=data.products.map(C.cleanProduct);settings=data.settings||{};render();
  $('adminStatus').textContent='✓ Inventario actualizado desde Google Sheets.';
 }catch(e){$('adminStatus').textContent='⚠ '+e.message;toast(e.message)}
}
async function logIn(e){
 if(e)e.preventDefault();
 const candidate=$('secret').value.trim();
 if(!candidate)return;
 token=candidate;$('loginBtn').disabled=true;$('loginMessage').classList.add('hidden');
 try{
  const health=await checkHealth();
  if(health.version!=='GC-20261008-PIN-V6')throw Error('La versión de Apps Script está desactualizada. Actualizá la implementación existente.');
  if(!health.pinConfigurado)throw Error('Revisá que ADMIN_PIN esté configurado en Apps Script.');
  await request('verify');sessionStorage.setItem('gc_admin_token',token);
  $('loginPanel').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('logout').classList.remove('hidden');reload();
 }catch(err){token='';$('loginMessage').textContent=err.message;$('loginMessage').classList.remove('hidden')}
 finally{$('loginBtn').disabled=false}
}
function showProduct(id){
 const p=products.find(p=>p.id===id)||{id:'',name:'',code:'',category:'',price:0,stock:0,cost:'',image:'',gallery:'',description:'',discounts:'',codAllowed:true,active:true};
 const f=$('productForm');
 for(const [k,v] of Object.entries(p)){if(f.elements[k]&&k!=='cost')f.elements[k].value=v??'';}
 f.elements.cost.value='';
 f.elements.codAllowed.value=p.codAllowed?'SI':'NO';
 f.elements.active.value=p.active?'SI':'NO';
 $('formTitle').textContent=id?'Editar producto':'Nuevo producto';
 $('formMessage').textContent='';
 selectedFiles=[];
 $('uploadFile').value='';$('cameraFile').value='';
 renderGalleryPreview();
 $('formOverlay').hidden=false;document.body.style.overflow='hidden';
}
function closeForm(){$('formOverlay').hidden=true;document.body.style.overflow='';}
async function save(e){
 e.preventDefault();
 const f=$('productForm'),p={};
 for(const k of ['id','code','name','category','price','cost','stock','image','gallery','discounts','description'])p[k]=f.elements[k].value.trim();
 p.gallery=parseGallery(p.gallery).filter(u=>u!==p.image).slice(0,9).join(', ');
 p.codAllowed=f.elements.codAllowed.value==='SI';
 p.active=f.elements.active.value==='SI';
 p.price=Number(p.price);p.stock=Number(p.stock);
 if(p.price<0||p.stock<0||!Number.isInteger(p.stock))return toast('Verificá precio y stock');
 $('saveBtn').disabled=true;$('formMessage').textContent='Guardando en Google Sheets...';
 try{const out=await request('saveProduct',{product:p});toast(out.message||'Guardado');closeForm();await reload()}catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{$('saveBtn').disabled=false}
}
function mergeSelectedFiles(list){
 const incoming=Array.from(list||[]).filter(Boolean);
 const merged=[...selectedFiles];
 incoming.forEach(file=>{if(!merged.some(x=>x.name===file.name&&x.size===file.size&&x.lastModified===file.lastModified))merged.push(file)});
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
async function upload(){
 const already=[...new Set([$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean))];
 const allowed=Math.max(0,10-already.length);
 const queue=selectedFiles.slice(0,allowed);
 if(!allowed)return toast('Ya tenés 10 fotografías. Quitá una de la galería para subir otra.');
 if(!queue.length)return toast('Elegí una o varias fotos primero');
 for(const file of queue){
  if(file.size>2*1024*1024)return toast('Cada foto debe pesar máximo 2 MB');
  if(!/^image\/(jpeg|png|webp|gif)$/i.test(file.type))return toast('Solo JPG, PNG, WEBP o GIF');
 }
 $('uploadBtn').disabled=true;$('formMessage').textContent='Subiendo fotos a Google Drive...';
 const uploaded=[];
 try{
  for(const file of queue){
   const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('No se pudo leer la foto'));r.readAsDataURL(file)});
   const out=await request('uploadImage',{file:{mime:file.type,base64}});
   uploaded.push(out.url);
   $('formMessage').textContent=`Subiendo ${uploaded.length} de ${queue.length}...`;
  }
  setGalleryFromUrls(uploaded);
  selectedFiles=[];$('uploadFile').value='';$('cameraFile').value='';renderGalleryPreview();
  $('formMessage').textContent='✓ Fotos subidas. Ahora tocá Guardar producto.';
  toast(uploaded.length===1?'Imagen cargada':'Fotos cargadas');
 }catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{$('uploadBtn').disabled=false}
}
async function disable(id){
 const p=products.find(x=>x.id===id);if(!p||!confirm('¿Ocultar "'+p.name+'" de la tienda? El registro se conservará en Sheets.'))return;
 try{await request('disableProduct',{id});toast('Producto ocultado');await reload()}catch(e){toast(e.message)}
}
function binds(){
 $('sheetLink').href=cfg.spreadsheetUrl;
 $('loginForm').onsubmit=logIn;
 $('logout').onclick=()=>{token='';sessionStorage.removeItem('gc_admin_token');location.reload()};
 $('refresh').onclick=reload;
 $('createNew').onclick=()=>showProduct('');
 $('adminSearch').oninput=render;
 $('adminRows').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)showProduct(b.dataset.edit);if(b.dataset.disable)disable(b.dataset.disable)};
 $('closeForm').onclick=closeForm;$('cancelForm').onclick=closeForm;
 $('productForm').onsubmit=save;
 $('uploadBtn').onclick=upload;
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
 else if(token){$('secret').value=token;logIn();}
}
binds();
})();
