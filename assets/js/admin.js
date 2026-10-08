(function(){'use strict';const cfg=window.GC_CONFIG,C=window.GC,$=id=>document.getElementById(id);let token='',products=[],settings={};try{token=sessionStorage.getItem('gc_admin_token')||''}catch{}const fallback='assets/img/sin-foto.svg';
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const toast=x=>{const el=$('toast');el.textContent=x;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3800)};
function validApi(){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(cfg.apiUrl||'')}
function request(action,extra={}){
 if(!validApi())return Promise.reject(Error('La URL de Apps Script no está configurada correctamente.'));
 return new Promise((resolve,reject)=>{
  const requestId=(typeof crypto!=='undefined' && crypto.randomUUID)?crypto.randomUUID():('gc'+Date.now()+Math.random().toString(36).slice(2));
  const frame=document.createElement('iframe'),form=document.createElement('form');
  let timer,finished=false;
  function finish(err,data){
   if(finished)return;finished=true;clearTimeout(timer);
   window.removeEventListener('message',listener);frame.remove();form.remove();
   if(err)reject(err);else resolve(data);
  }
  frame.name='gcFrame_'+requestId.replace(/[^\w]/g,'');
  frame.style.cssText='position:absolute;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(frame);
  function listener(ev){
   const allowed=ev.origin==='null'||/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/i.test(ev.origin);
   if(!allowed)return;
   const d=ev.data;
   if(!d||d.__gcResponse!==true||d.requestId!==requestId)return;
   if(d.ok)finish(null,d);else finish(Error(d.error||'No se pudo completar la operación.'));
  }
  window.addEventListener('message',listener);
  form.method='POST';form.target=frame.name;form.action=cfg.apiUrl;form.style.display='none';
  const field=document.createElement('input');field.name='payload';
  field.value=JSON.stringify({requestId,action,token,...extra});
  form.appendChild(field);document.body.appendChild(form);
  timer=setTimeout(()=>finish(Error('Apps Script respondió a la prueba pública, pero el navegador no recibió la confirmación privada. Revisá el permiso “Cualquier usuario” de la implementación y las restricciones de cookies/iframes del navegador.')),30000);
  try{form.submit()}catch(error){finish(Error('No se pudo enviar la solicitud al servidor de Google.'))}
 });
}
function jsonp(action='public'){
 return new Promise((resolve,reject)=>{
  if(!validApi())return reject(Error('Falta configurar la URL de Apps Script.'));
  const n='gcCheck'+Date.now()+'_'+Math.floor(Math.random()*100000);
  const script=document.createElement('script');
  let done=false;
  const timer=setTimeout(()=>finish(Error('No se pudo conectar con Apps Script. Comprobá el acceso público de la implementación.')),12000);
  function finish(err,result){
   if(done)return;done=true;clearTimeout(timer);delete window[n];script.remove();
   if(err)reject(err);else resolve(result);
  }
  window[n]=result=>result&&result.ok?finish(null,result):finish(Error(result?.error||'Respuesta inválida de Apps Script.'));
  script.onerror=()=>finish(Error('La aplicación web de Google no está accesible desde esta página.'));
  script.src=cfg.apiUrl+(cfg.apiUrl.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+'&callback='+n+'&t='+Date.now();
  document.head.appendChild(script);
 });
}
function render(){
 const q=$('adminSearch').value.toLowerCase().trim();
 const rows=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q));
 $('statProducts').textContent=products.length;
 $('statAvailable').textContent=products.filter(p=>p.stock>0).length;
 $('statOut').textContent=products.filter(p=>!p.stock).length;
 $('statCod').textContent=products.filter(p=>p.codAllowed).length;
 $('adminRows').innerHTML=rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.category)}</span></td><td>${C.money(p.price)}</td><td>${p.stock}</td><td><span style="color:${p.codAllowed?'#0d9f6e':'#d64545'}">${p.codAllowed?'✓ Permitido':'× Prohibido'}</span></td><td>${p.active?'Activo':'Oculto'}</td><td><button type="button" class="btn small outline" data-edit="${esc(p.id)}">Editar</button> <button type="button" class="btn small red" data-disable="${esc(p.id)}">Ocultar</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No hay resultados.</td></tr>';
 $('settingsSummary').textContent=`Envío: ${C.money(settings.shipping||110)} | Mínimo al recibir: ${C.money(settings.codMinimum||350)} | Unidades: ${settings.codMinimumUnits||2} | Comisión: ${Math.round((settings.codRate||.1)*100)}% | Tigo Money: ${Math.round((settings.tigoRate||.07)*100)}%`;
}
async function reload(){
 try{
  $('adminStatus').textContent='Sincronizando catálogo...';
  const data=await jsonp();
  products=data.products.map(C.cleanProduct);settings=data.settings||{};
  render();$('adminStatus').textContent='✓ Inventario actualizado desde Google Sheets.';
 }catch(e){$('adminStatus').textContent='⚠ '+e.message;toast(e.message)}
}
async function logIn(e){
 if(e)e.preventDefault();
 const candidate=$('secret').value.trim();if(!candidate)return;
 token=candidate;$('loginBtn').disabled=true;$('loginMessage').classList.add('hidden');
 try{
  const health=await jsonp('health');
  if(health.version!=='GC-20261008-PIN-V6')throw Error('La implementación de Apps Script está desactualizada. Copiá el último Code.gs desde GitHub y publicá una NUEVA VERSIÓN de la implementación existente.');
  if(!health.pinConfigurado)throw Error('Falta configurar un PIN válido de seis dígitos en las propiedades de Apps Script.');
  await request('verify');
  sessionStorage.setItem('gc_admin_token',token);
  $('loginPanel').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('logout').classList.remove('hidden');reload();
 }catch(err){token='';$('loginMessage').textContent=String(err.message||'No se pudo verificar el acceso.');$('loginMessage').classList.remove('hidden')}
 finally{$('loginBtn').disabled=false}
}
function showProduct(id){const p=products.find(p=>p.id===id)||{id:'',name:'',code:'',category:'',price:0,stock:0,cost:'',image:'',description:'',discounts:'',codAllowed:true,active:true};const f=$('productForm');for(const [k,v]of Object.entries(p)){if(f.elements[k]&&k!=='cost')f.elements[k].value=v??'';}f.elements.cost.value='';f.elements.codAllowed.value=p.codAllowed?'SI':'NO';f.elements.active.value=p.active?'SI':'NO';$('formTitle').textContent=id?'Editar producto':'Nuevo producto';$('imagePreview').src=(/^https:\/\//.test(p.image||'')?p.image:fallback);$('formMessage').textContent='';$('uploadFile').value='';$('formOverlay').hidden=false;document.body.style.overflow='hidden';}
function closeForm(){$('formOverlay').hidden=true;document.body.style.overflow='';}
async function save(e){e.preventDefault();const f=$('productForm'),p={};for(const k of ['id','code','name','category','price','cost','stock','image','discounts','description'])p[k]=f.elements[k].value.trim();p.codAllowed=f.elements.codAllowed.value==='SI';p.active=f.elements.active.value==='SI';p.price=Number(p.price);p.stock=Number(p.stock);if(p.price<0||p.stock<0||!Number.isInteger(p.stock))return toast('Verificá precio y stock');$('saveBtn').disabled=true;$('formMessage').textContent='Guardando en Google Sheets...';try{const out=await request('saveProduct',{product:p});toast(out.message||'Guardado');closeForm();await reload()}catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{$('saveBtn').disabled=false}}
async function upload(){const f=$('uploadFile').files?.[0];if(!f)return toast('Elegí una foto primero');if(f.size>2*1024*1024)return toast('La foto debe pesar máximo 2 MB');if(!/^image\/(jpeg|png|webp|gif)$/.test(f.type))return toast('Solo JPG, PNG, WEBP o GIF');$('uploadBtn').disabled=true;$('formMessage').textContent='Subiendo imagen a Google Drive...';try{const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('No se pudo leer la foto'));r.readAsDataURL(f)});const out=await request('uploadImage',{file:{mime:f.type,base64}});$('productImage').value=out.url;$('imagePreview').src=out.url;$('formMessage').textContent='✓ Foto subida. Ahora tocá Guardar producto.';toast('Imagen cargada')}catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{$('uploadBtn').disabled=false}}
async function disable(id){const p=products.find(x=>x.id===id);if(!p||!confirm('¿Ocultar "'+p.name+'" de la tienda? El registro se conservará en Sheets.'))return;try{await request('disableProduct',{id});toast('Producto ocultado');await reload()}catch(e){toast(e.message)}}
function binds(){$('sheetLink').href=cfg.spreadsheetUrl;$('loginForm').onsubmit=logIn;$('secret').placeholder='Ingresá tu clave privada';$('logout').onclick=()=>{token='';sessionStorage.removeItem('gc_admin_token');location.reload()};$('refresh').onclick=reload;$('createNew').onclick=()=>showProduct('');$('adminSearch').oninput=render;$('adminRows').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)showProduct(b.dataset.edit);if(b.dataset.disable)disable(b.dataset.disable)};$('closeForm').onclick=closeForm;$('cancelForm').onclick=closeForm;$('productForm').onsubmit=save;$('uploadBtn').onclick=upload;$('productImage').onchange=e=>{$('imagePreview').src=/^https:\/\//.test(e.target.value)?e.target.value:fallback};$('imagePreview').onerror=function(){this.onerror=null;this.src=fallback};$('formOverlay').onclick=e=>{if(e.target===$('formOverlay'))closeForm()};document.onkeydown=e=>{if(e.key==='Escape')closeForm()};if(token&&validApi()){$('secret').value=token;logIn();}}
binds();
})();
