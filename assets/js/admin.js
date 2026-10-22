
(function(){
'use strict';
const cfg=window.GC_CONFIG,C=window.GC,S=window.GC_PRODUCT_SEARCH,$=id=>document.getElementById(id);
let token='',products=[],settings={},selectedFiles=[],busy=false,previewUrls=[],checkingConnection=null,catalogSource='',detailsSupported=false,extendedDetailsSupported=false,researchSupported=false,bestSellersSupported=false,imageImportSupported=false;
let researchBusy=false,researchEpoch=0,researchDraft=null,automaticQuery=true,researchSelectable=false,researchSearch=null,researchApplied=[],researchReferencesBefore=null;
let researchMode='details',researchPhotoDraft=null,imageSearchSupported=false;
let verifiedProfiles=null,serverFeatures={},checkingFeatures=null,editorBaseline='',editorTrigger=null;
function researchQuery(){return ($('researchQuery').value||formField($('productForm'),'name').value).trim();}
async function verifiedProfile(name,productName=''){
 if(!verifiedProfiles){
  const response=await fetch('data/fichas-verificadas.json?v=gc-panel-54',{cache:'no-cache'});
  if(!response.ok)throw Error('No se pudieron cargar las fichas verificadas.');
  const data=await response.json();verifiedProfiles=Array.isArray(data)?data:[];
 }
 const normalize=value=>String(value).toUpperCase().replace(/[^A-Z0-9]/g,'');
 const query=normalize(name),product=normalize(productName);
 return verifiedProfiles.find(profile=>
  (profile.aliases||[]).some(alias=>normalize(alias)===query)||
  (profile.conditionalAliases||[]).some(alias=>
   normalize(alias.query)===query &&
   !!normalize(alias.productIncludes) &&
   product.includes(normalize(alias.productIncludes))
  )
 )||null;
}
const technicalFields=['weight','width','height','length','size','material','model','compatibility','brand','voltage','current','power','connection','technology','included'];
const extendedFields=['brand','voltage','current','power','connection','technology','included'];
const technicalLabels={weight:'Peso',width:'Ancho',height:'Alto',length:'Largo / profundidad',size:'Tamaño',material:'Material',model:'Modelo',compatibility:'Compatibilidad',brand:'Marca',voltage:'Voltaje de entrada',current:'Corriente de entrada',power:'Potencia',connection:'Conexión',technology:'Tecnología',included:'Incluye'};
try{token=sessionStorage.getItem('gc_admin_token')||''}catch{}
const fallback='assets/img/sin-foto.svg';
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const toast=x=>{const el=$('toast');el.textContent=x;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3800)};
const yes=v=>String(v??'').trim().toUpperCase()==='SI';
/* namedItem evita choques con propiedades nativas como "length". */
function formField(form,name){
 const field=form.elements.namedItem(name);
 if(!field||!('value' in field))throw Error('Campo inexistente: '+name);
 return field;
}
function validApi(){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(cfg.apiUrl||'')}
function request(action,extra={}){
 if(window.GC_GOOGLE_PANEL?.request){
  return new Promise((resolve,reject)=>{
   let ended=false;const timer=setTimeout(()=>finish(Error('Google tardó en responder. Comprobá la conexión y reintentá.')),action==='health'?16000:action==='verify'?28000:180000);
   function finish(error,data){if(ended)return;ended=true;clearTimeout(timer);error?reject(error):resolve(data);}
   window.GC_GOOGLE_PANEL.request({action,...(action==='health'?{}:{token}),...extra}).then(data=>data?.ok?finish(null,data):finish(Error(data?.error||'Google no pudo completar la solicitud.')),error=>finish(error));
  });
 }
 if(!validApi())return Promise.reject(Error('No se encontró la dirección de Apps Script. Podés administrar el inventario desde Google Sheets mientras se revisa la conexión.'));
 return new Promise((resolve,reject)=>{
  const requestId='req'+Date.now()+Math.random().toString(36).slice(2),frame=document.createElement('iframe'),form=document.createElement('form');
  let timer,complete=false;
  function finish(err,data){if(complete)return;complete=true;clearTimeout(timer);window.removeEventListener('message',listener);frame.remove();form.remove();err?reject(err):resolve(data)}
  frame.name='frame_'+requestId;frame.style.cssText='position:absolute;width:0;height:0;visibility:hidden;border:0';document.body.appendChild(frame);
  function listener(ev){const allowed=ev.origin==='null'||/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/i.test(ev.origin);if(!allowed)return;const d=ev.data;if(!d||d.__gcResponse!==true||d.requestId!==requestId)return;if(d.ok)finish(null,d);else finish(Error(d.error||'No se pudo completar la operación'))}
  window.addEventListener('message',listener);
  form.method='POST';form.target=frame.name;form.action=cfg.apiUrl;form.style.display='none';
  const field=document.createElement('input');field.name='payload';field.value=JSON.stringify({requestId,action,...(action==='health'?{}:{token}),...extra});
  form.appendChild(field);document.body.appendChild(form);
  const waitMs=action==='health'?16000:action==='verify'?28000:['researchProduct','researchImages','researchBulkItem'].includes(action)?180000:['uploadImage','importResearchImage','importBulkResearchImage'].includes(action)?90000:60000;
  timer=setTimeout(()=>finish(Error(action==='verify'?'Google no respondió al validar el PIN. Podés abrir el diagnóstico para revisar la conexión.':action==='researchImages'?'La búsqueda de fotos tardó demasiado. Probá otro resultado.':action==='researchProduct'?'La consulta automática tardó demasiado. No se cambió ningún dato. Revisá en Apps Script el Registro de ejecución de la búsqueda, o buscá usando el código exacto del fabricante.':'Google no respondió a la operación. Revisá el diagnóstico de conexión.')),waitMs);
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
function checkHealth(){
 const valid=promise=>promise.then(data=>{if(typeof data.pinConfigurado!=='boolean')throw Error('Respuesta de conexión incompleta.');return data;});
 return Promise.any([valid(request('health')),valid(jsonp('health'))]);
}
function connectionCheck(){
 if(checkingConnection)return checkingConnection;
 checkingConnection=(async()=>{
  $('retryConnection').disabled=true;
  $('connectionStatus').textContent='Comprobando conexión… Podés ingresar tu PIN.';
  try{
   if(navigator.onLine===false)throw Error('offline');
   const health=await checkHealth();
   if(health.pinConfigurado===false){
    $('connectionStatus').textContent='Google responde, pero falta configurar el PIN en Apps Script.';
    $('connectionHelp').classList.remove('hidden');return false;
   }
   $('connectionStatus').textContent='Conexión disponible. Ingresá tu PIN.';
   $('connectionHelp').classList.add('hidden');return true;
  }catch(error){
   // La prueba pública usa GET/JSONP. No bloqueamos el POST que valida el PIN.
   $('connectionStatus').textContent=navigator.onLine===false?'No hay conexión a Internet. Tus cambios pendientes pueden recuperarse en este navegador.':'No se pudo confirmar la conexión. Podés abrir el panel desde Google para usar la conexión directa o intentar ingresar aquí con tu PIN.';
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
   ? all.map((url,i)=>`<div class="gallery-thumb" data-photo-position="${i}"><img draggable="false" src="${esc(normalizePreview(url))}" onerror="this.onerror=null;this.src='${fallback}'" alt="Foto ${i+1}"><span>${i===0?'Principal':'Foto '+(i+1)}</span><button type="button" class="photo-grip" draggable="true" data-photo-grip="${i}" aria-label="Mover foto ${i+1}. Usá las flechas izquierda y derecha">↔ Arrastrar</button><div class="photo-step"><button type="button" data-photo-step="${i}" data-step="-1" aria-label="Mover foto ${i+1} antes" ${i===0?'disabled':''}>←</button><button type="button" data-photo-step="${i}" data-step="1" aria-label="Mover foto ${i+1} después" ${i===all.length-1?'disabled':''}>→</button></div><button type="button" data-main="${i}" aria-label="Usar foto ${i+1} como principal">Principal</button><button type="button" data-remove-photo="${i}" aria-label="Quitar foto ${i+1}">Quitar</button></div>`).join('')
   : '<div class="gallery-help">Acá verás la imagen principal y la galería.</div>';
 $('pendingPreview').innerHTML=files.map((file,i)=>{const url=URL.createObjectURL(file);previewUrls.push(url);return `<div class="gallery-thumb pending"><img src="${url}" alt="Foto pendiente ${i+1}"><span>Pendiente</span><button type="button" data-remove-file="${i}" aria-label="Quitar archivo ${i+1}">Quitar</button></div>`}).join('');
 $('imagePreview').onerror=function(){this.onerror=null;this.src=fallback};
 editorEvent('change');
}
function render(){
 const q=$('adminSearch').value.toLowerCase().trim(),filter=$('adminFilter').value;
 const noPhoto=p=>!p.image&&!parseGallery(p.gallery).length;
 const rows=products.filter(p=>C.matchesSearch(p.id+' '+C.productSearchText(p),q)&&(filter==='photos'?noPhoto(p):filter==='requested'?p.bestSeller:filter==='out'?p.stock===0:filter==='available'?p.active&&p.stock>0:filter==='low'?p.active&&p.stock>0&&p.stock<=3:filter==='hidden'?!p.active:true));
 const sort=$('adminSort')?.value||'newest';
 rows.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name,'es'):sort==='stock'?(a,b)=>a.stock-b.stock||C.recentFirst(a,b):sort==='price'?(a,b)=>C.unitPrice(a,1)-C.unitPrice(b,1):C.recentFirst);
 if($('adminResultCount'))$('adminResultCount').textContent=rows.length+' de '+products.length+' productos';
 if($('adminClearFilters'))$('adminClearFilters').hidden=!(q||filter||sort!=='newest');
 $('adminFilter').options[1].textContent='Sin foto ('+products.filter(noPhoto).length+')';
 $('adminFilter').options[2].textContent='Más pedidos ('+products.filter(p=>p.bestSeller).length+')';
 $('statProducts').textContent=products.filter(p=>p.active).length;
 $('statAvailable').textContent=products.filter(p=>p.active&&p.stock>0).length;
 $('statOut').textContent=products.filter(p=>p.active&&!p.stock).length;
 $('statCod').textContent=products.filter(p=>p.active&&p.codAllowed).length;
 $('adminRows').innerHTML=rows.map(p=>`<tr>
   <td data-label="Producto"><div class="admin-product-identity"><img loading="lazy" decoding="async" src="${esc(normalizePreview(p.image||parseGallery(p.gallery)[0]))}" alt="" onerror="this.onerror=null;this.src='assets/img/sin-foto.svg'"><div><strong>${esc(p.name)}</strong><span class="admin-product-meta">${esc(p.category)} · ${esc(p.code||'Sin código')}</span>${p.bestSeller?'<span class="admin-requested-tag">★ Más pedidos</span>':''}${noPhoto(p)?'<span class="admin-photo-tag">Sin foto</span>':''}</div></div></td>
   <td data-label="Precio">${C.money(p.price)}</td>
   <td data-label="Promoción">${p.promoPrice>0?C.money(p.promoPrice):'—'}</td>
   <td data-label="Costo">${catalogSource==='privado'?C.money(p.cost):'—'}</td>
   <td data-label="Stock"><span class="admin-stock-pill ${p.stock===0?'empty':p.stock<=3?'low':''}">${p.stock} ${p.stock===1?'unidad':'unidades'}</span></td>
   <td data-label="Pago al recibir"><span style="color:${p.codAllowed?'#0f9f6a':'#d64545'}">${p.codAllowed?'✓ Permitido':'× Prohibido'}</span></td>
   <td data-label="Estado">${p.active?'Activo':'Oculto'}</td>
   <td data-label="Acciones"><div class="admin-row-actions"><button type="button" class="btn small outline" data-edit="${esc(p.id)}" >Editar</button> ${!noPhoto(p)?`<button type="button" class="btn small outline" data-reference-product="${esc(p.id)}">Buscar con mi foto</button>`:''}<button type="button" class="btn small red" data-disable="${esc(p.id)}" >Ocultar</button> <button type="button" class="btn small outline best-seller-toggle ${p.bestSeller?'selected':''}" data-best-seller="${esc(p.id)}" aria-pressed="${p.bestSeller}" aria-label="${p.bestSeller?'Quitar de':'Marcar en'} Más pedidos: ${esc(p.name)}">${p.bestSeller?'★ En Más pedidos':'☆ Más pedidos'}</button></div></td>
 </tr>`).join('')||'<tr><td colspan="8"><div class="admin-empty"><strong>No encontramos productos con esos filtros.</strong><p>Probá con nombre, marca, modelo o código.</p><button class="btn outline small" type="button" data-clear-admin>Ver todos los productos</button></div></td></tr>';
 $('settingsSummary').textContent=`Envío: ${C.money(settings.shipping??110)} | Mínimo pago al recibir: ${C.money(settings.codMinimum||350)} en productos | Comisión al recibir: ${Math.round((settings.codRate||.1)*100)}% | Tigo Money: ${Math.round((settings.tigoRate||.07)*100)}%`;
 if(typeof CustomEvent==='function')document.dispatchEvent(new CustomEvent('gc:catalog'));

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
  products=data.products.map((p,index)=>({...C.cleanProduct(p,index),cost:C.num(p.cost),revision:p.revision==null?undefined:String(p.revision)}));
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
function applyFeatures(verification){
 serverFeatures=verification.features||{};
 detailsSupported=serverFeatures.details===true;extendedDetailsSupported=serverFeatures.extendedDetails===true;
 researchSupported=serverFeatures.productResearch===true;researchSelectable=serverFeatures.productResearchSelection===true;
 bestSellersSupported=serverFeatures.bestSellers===true;imageImportSupported=serverFeatures.researchImageImport===true;imageSearchSupported=serverFeatures.researchPhotos===true;
 $('bestSellersPublishNotice').hidden=!bestSellersSupported||serverFeatures.publicCatalogMetadata===true;
}
function refreshFeatures(){
 if(checkingFeatures)return checkingFeatures;
 checkingFeatures=request('verify').then(verification=>{applyFeatures(verification);return serverFeatures;}).finally(()=>{checkingFeatures=null;});
 return checkingFeatures;
}
async function logIn(e){
 if(e)e.preventDefault();
 // El PIN se comprueba directamente en el servidor; no dependemos del test público JSONP.
 const candidate=$('secret').value.trim();
 if(!/^\d{6}$/.test(candidate)){toast('Ingresá tu PIN de seis dígitos.');return;}
 token=candidate;$('loginBtn').disabled=true;$('loginBtn').textContent='Verificando…';$('loginMessage').classList.add('hidden');
 try{
  await refreshFeatures();sessionStorage.setItem('gc_admin_token',token);
  $('loginPanel').classList.add('hidden');$('adminPanel').classList.remove('hidden');$('logout').classList.remove('hidden');reload();
 }catch(err){token='';$('loginMessage').textContent=err.message;$('loginMessage').classList.remove('hidden')}
 finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Ingresar al panel'}
}
function editorEvent(name,detail={}){document.dispatchEvent(new CustomEvent('gc:editor-'+name,{detail}));}
function showProduct(id){
 editorTrigger=document.activeElement;
 resetResearch(true);
 $('productForm').querySelectorAll('.research-filled').forEach(field=>field.classList.remove('research-filled'));
 const p=products.find(p=>p.id===id)||{id:'',name:'',code:'',category:'',price:0,promoPrice:0,promoText:'',colors:'',stock:0,cost:'',image:'',gallery:'',description:'',discounts:'',codAllowed:true,active:true};
 const f=$('productForm');
 f.dataset.originalCategory=p.category||'';f.dataset.originalCode=p.code||'';
 f.dataset.revision=p.revision??'';f.dataset.hasRevision=String(p.revision!==undefined);
 for(const [k,v] of Object.entries(p)){if(k!=='cost'&&k!=='promoPrice'&&f.elements.namedItem(k))formField(f,k).value=v??'';}
 formField(f,'promoPrice').value=p.promoPrice>0?p.promoPrice:'';
 formField(f,'cost').value='';
 const specs=C.cleanDetails(p.details);
 for(const key of technicalFields){
  formField(f,key).value=specs[key]??'';
 }
 formField(f,'weightUnit').value=specs.weightUnit||'kg';
 formField(f,'measureUnit').value=specs.measureUnit||'cm';
 formField(f,'researchReferences').value=JSON.stringify(specs.references||[]);
 $('technicalEditor').open=Object.keys(specs).length>0;
 $('technicalDeploymentNotice').classList.toggle('hidden',detailsSupported);
 formField(f,'codAllowed').value=p.codAllowed?'SI':'NO';
 formField(f,'active').value=p.active?'SI':'NO';
 $('formTitle').textContent=id?'Editar producto':'Nuevo producto';
 $('formMessage').textContent='';$('researchFieldSummary').hidden=true;
 $('researchQuery').value=specs.brand&&specs.model?specs.brand+' '+specs.model:p.name;
 automaticQuery=!(specs.brand&&specs.model);
 selectedFiles=[];
 $('uploadFile').value='';$('cameraFile').value='';
 renderGalleryPreview();
 updateEditorCode();
 $('formOverlay').hidden=false;document.body.style.overflow='hidden';
 $('productEditorBody').scrollTop=0;
 editorBaseline=editorSnapshot();
 formField(f,'name').focus({preventScroll:true});
 editorEvent('open',{id:p.id});
}
function updateEditorCode(){
 const f=$('productForm'),field=formField(f,'code'),category=formField(f,'category').value.trim(),codes=window.GC_CODES;
 if(!codes)return;
 const original=f.dataset.originalCode||'';
 field.value=original&&codes.key(category)===codes.key(f.dataset.originalCategory)?original:category?codes.next(products,category):'';
 field.readOnly=true;
 const list=$('productCategories');if(list)list.innerHTML=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).map(c=>'<option value="'+esc(c)+'"></option>').join('');
}
function editorSnapshot(){return JSON.stringify([...new FormData($('productForm'))].filter(([key])=>key!=='researchQuery'))+'|'+selectedFiles.map(file=>file.name+':'+file.size+':'+file.lastModified).join('|');}
function editorDirty(){return !$('formOverlay').hidden&&editorSnapshot()!==editorBaseline;}
function closeForm(force=false){if(busy||$('formOverlay').hidden)return;if(force!==true&&editorDirty()&&!confirm('Tenés cambios sin guardar en esta ficha. ¿Querés cerrar? El borrador de texto y enlaces se conserva en este navegador; las fotos pendientes deberán elegirse nuevamente.'))return;editorEvent('close');resetResearch(true);$('formOverlay').hidden=true;document.body.style.overflow='';editorBaseline='';editorTrigger?.focus({preventScroll:true});}
function editorPhotos(){
 const f=$('productForm');
 return {id:formField(f,'id').value,name:formField(f,'name').value.trim(),images:[$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean),pending:selectedFiles.length>0,busy:busy||researchBusy};
}
function appendEditorPhotos(id,urls){
 const current=editorPhotos();
 if($('formOverlay').hidden||current.id!==id)throw Error('Abrí nuevamente el producto antes de copiar las fotos.');
 if(new Set([...current.images,...urls]).size>10)throw Error('No hay espacio para estas fotos en el formulario. Elegí menos.');
 setGalleryFromUrls(urls);
 $('formMessage').textContent=urls.length+' fotos copiadas al formulario. Revisalas y tocá Guardar y actualizar tienda.';
}
function reorderEditorPhotos(from,to){
 if(busy||researchBusy)return false;
 const urls=[$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=urls.length||to>=urls.length)return false;
 urls.splice(to,0,urls.splice(from,1)[0]);$('productImage').value=urls[0]||'';$('galleryInput').value=urls.slice(1).join('\n');renderGalleryPreview();
 $('formMessage').textContent='Orden de fotos actualizado. La primera es la principal. Tocá Guardar y actualizar tienda para publicarlo.';return true;
}
function undoResearch(){
 const f=$('productForm'),kept=researchApplied.filter(item=>{const field=formField(f,item.key);return field.value.trim()&&(!field.classList.contains('research-filled')||field.value!==item.value);}).map(item=>item.key);
 for(const item of researchApplied){
  const field=formField(f,item.key),keepUnit=item.key==='weightUnit'&&kept.includes('weight')||item.key==='measureUnit'&&['width','height','length'].some(key=>kept.includes(key));
  if(!keepUnit&&field.classList.contains('research-filled')&&field.value===item.value)field.value=item.before;
  field.classList.remove('research-filled');
 }
 if(researchReferencesBefore!==null&&!kept.length)formField(f,'researchReferences').value=researchReferencesBefore;
 researchApplied=[];researchReferencesBefore=null;
}
function resetResearch(discard=false){
 if(discard===true)undoResearch();
 researchEpoch++;researchBusy=false;researchDraft=null;researchSearch=null;researchPhotoDraft=null;researchMode='details';
 $('researchPreview').hidden=true;$('researchPreview').innerHTML='';
 $('researchCandidates').hidden=true;$('researchCandidates').innerHTML='';
 $('researchPhotos').hidden=true;$('researchPhotos').innerHTML='';
 $('researchApply').hidden=true;$('researchSetup').hidden=researchSelectable;
 $('researchSetup').querySelector('p').textContent=researchSupported?'Para elegir resultados y completar productos genéricos, actualizá Code.gs y FichaGratis.gs en Apps Script. Las fichas exactas siguen disponibles.':'Conectá la búsqueda con las claves privadas de Tavily y Gemini en Apps Script. Las fichas verificadas siguen disponibles.';
 $('researchButton').disabled=busy;$('researchButton').textContent='Buscar ficha';
 $('researchStatus').textContent='Buscá el artículo y elegí el resultado que corresponde a tu producto.';
 $('saveBtn').disabled=busy;
}
function researchLoading(value,message=''){
 researchBusy=value;$('researchButton').disabled=value||busy;$('saveBtn').disabled=value||busy;
 $('findPhotosBtn').disabled=value||busy;
 $('findReferencePhotosBtn').disabled=value||busy;
 $('researchButton').textContent=value?'Buscando…':'Buscar ficha';
 $('researchCandidates').querySelectorAll('button').forEach(button=>button.disabled=value);
 if(message)$('researchStatus').textContent=message;
}
function researchFallback(){
 const query=encodeURIComponent(S?S.query(researchQuery()):researchQuery());
 return `<p class="research-candidate-help">Revisá la marca y el modelo de la caja. También podés consultar otras fuentes:</p><div class="row"><a class="btn small outline" href="https://www.google.com/search?q=${query}" target="_blank" rel="noopener noreferrer">Buscar modelo en Google ↗</a><a class="btn small outline" href="https://www.google.com/search?tbm=isch&q=${query}" target="_blank" rel="noopener noreferrer">Ver imágenes en Google ↗</a></div>`;
}
function showCandidates(candidates,searchId='',requestName=researchQuery()){
 const valid=(Array.isArray(candidates)?candidates:[]).filter(x=>x&&C.researchPage(x.url)&&C.cleanDetails({references:[x]}).references?.length&&(!S||S.matches(researchQuery(),x))).slice(0,8);
 $('researchCandidates').hidden=!valid.length;
 $('researchCandidates').innerHTML=valid.length?`<div class="research-step"><span>1</span><strong>Elegí el producto correcto</strong></div><p class="research-candidate-help">Compará el modelo, los conectores y la variante con tu artículo.</p><div class="research-result-list">${valid.map((source,i)=>`<article class="research-result"><div><strong>${esc(source.title||source.url)}</strong><small>${esc(new URL(source.url).hostname)}</small>${source.excerpt?`<p>${esc(source.excerpt.slice(0,280))}</p>`:''}<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Ver página ↗</a></div><button type="button" class="btn small outline" data-research-source="${esc(source.id??i)}">${researchMode==='photos'?'Ver fotos':'Usar este resultado'}</button></article>`).join('')}</div>`:'';
 if(!valid.length){$('researchCandidates').hidden=false;$('researchCandidates').innerHTML='<strong>No se encontraron coincidencias del modelo exacto.</strong>'+researchFallback();}
 researchSearch=searchId?{id:searchId,name:researchQuery(),requestName,category:formField($('productForm'),'category').value.trim()}:null;
 return valid.length;
}
function showResearchPhotos(data,selection,photoSearch=false){
 const photos=(Array.isArray(data.images)?data.images:[]).filter(url=>typeof url==='string'&&/^https:\/\//i.test(url)&&url.length<=800&&(!data.selectedSource||!S||S.matches(researchQuery(),data.selectedSource))).slice(0,6);
 researchPhotoDraft={images:photos,selection,photoSearch};
 $('researchPhotos').hidden=!selection&&!photos.length;
 const source=data.selectedSource,sourceLink=source&&C.researchPage(source.url)?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Ver página de origen ↗</a>`:'';
 $('researchPhotos').innerHTML=`<strong>${photos.length?'Elegí las fotos que querés copiar':'La página no entregó fotos utilizables'}</strong><p>${data.broader?'Estas son coincidencias del sitio elegido. Revisá modelo, color y conectores antes de copiarlas.':'Compará cada imagen con tu artículo. Se copia a tus fotos solo cuando tocás el botón.'}</p>${sourceLink}${photos.length?`<div class="research-photo-list">${photos.map((url,i)=>`<div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar foto ${i+1}"><img src="${esc(url)}" alt="Foto propuesta ${i+1}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='assets/img/sin-foto.svg'"></a><button type="button" class="btn small outline" data-research-photo="${i}">Copiar al producto</button></div>`).join('')}</div>`:''}${selection&&!photoSearch?'<button type="button" class="btn small outline" data-find-source-photos>Buscar más fotos de este resultado</button>':''}${!photos.length&&photoSearch?'<p>Probá otro resultado o elegí una imagen de tu galería.</p>':''}`;
}
async function loadResearchPhotos(selection){
 if(busy||researchBusy)return;
 if(!imageSearchSupported){toast('Actualizá Code.gs y FichaGratis.gs para activar la búsqueda independiente de fotos.');return;}
 const epoch=researchEpoch;
 researchLoading(true,'Buscando fotos del resultado elegido…');
 try{
  const result=await request('researchImages',{selection});
  if(epoch!==researchEpoch||$('formOverlay').hidden)return;
  showResearchPhotos(result.research||{},selection,true);
  $('researchPhotos').scrollIntoView({behavior:'smooth',block:'start'});
  $('researchStatus').textContent=researchPhotoDraft.images.length?'Fotos listas para revisar. Elegí cuáles copiar y guardá el producto para publicarlas.':result.research?.notice||'No se encontraron fotos utilizables del modelo exacto. Probá otra fuente.';
 }catch(error){if(epoch===researchEpoch)$('researchStatus').textContent=error.message;}
 finally{if(epoch===researchEpoch)researchLoading(false);}
}
function presentResearch(data,name){
 if(!data||!['exact','partial','ambiguous','not_found'].includes(data.match))throw Error('La búsqueda no devolvió una ficha válida.');
 const details=C.cleanDetails(data.details),sources=C.cleanDetails({references:data.sources}).references||[];
 const rows=technicalFields.filter(key=>details[key]!==undefined).map(key=>{
  const unit=key==='weight'?details.weightUnit:['width','height','length'].includes(key)?details.measureUnit:'';
  return `<div><dt>${esc(technicalLabels[key])}</dt><dd>${esc(details[key])}${unit?' '+esc(unit):''}</dd></div>`;
 }).join('');
 const notes=(Array.isArray(data.notes)?data.notes:[]).map(note=>`<li>${esc(note)}</li>`).join('');
 const missing=(Array.isArray(data.missing)?data.missing:[]).map(String).filter(Boolean);
 const exact=['exact','partial'].includes(data.match)&&sources.length>0&&(String(data.description||'').trim()||rows);
 const links=sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('');
 if(exact)undoResearch();
 $('researchPreview').innerHTML=`<strong>${exact?'Ficha propuesta para revisar':data.match==='ambiguous'?'Revisá la coincidencia':'No se encontraron datos confirmados'}</strong>${data.matchedModel?`<p class="research-model">${esc(data.matchedModel)}</p>`:''}${exact&&data.description?`<p class="research-description">${esc(data.description)}</p>`:''}${exact&&rows?`<dl>${rows}</dl>`:''}${notes?`<ul>${notes}</ul>`:''}${exact&&missing.length?`<p class="research-missing">Sin confirmar: ${esc(missing.join(', '))}.</p>`:''}${links?`<div class="research-sources"><span>Fuentes de los datos propuestos</span>${links}</div>`:''}`;
 $('researchPreview').hidden=false;$('researchApply').hidden=!exact;
 researchDraft=exact?{...data,details,sources,requestedName:name}:null;
 showResearchPhotos(data,data.selection);
 if(exact){applyResearch();$('researchPreview').scrollIntoView?.({behavior:'smooth',block:'start'});}else $('researchStatus').textContent='No se encontraron datos nuevos confirmados. La información del formulario se conserva; probá otra fuente.';
}
async function researchProduct(photosOnly=false){
 photosOnly=photosOnly===true;
 if(busy||researchBusy)return;
 if(photosOnly&&!imageSearchSupported){$('researchSetup').hidden=false;toast('Actualizá Code.gs y FichaGratis.gs para activar Buscar fotos.');return;}
 const f=$('productForm');
 if(automaticQuery&&S){let query=researchQuery();for(const key of ['brand','model']){const value=formField(f,key).value.trim();if(value&&!S.contains(query,value))query=key==='brand'?value+' '+query:query+' '+value;}$('researchQuery').value=query.slice(0,180);}
 const name=researchQuery(),category=formField(f,'category').value.trim(),lookupName=S?S.query(name):name;
 if(name.length<3){$('researchStatus').textContent='Escribí primero el nombre o modelo del producto.';$('researchQuery').focus();return;}
 resetResearch();researchMode=photosOnly?'photos':'details';const epoch=researchEpoch;
 researchLoading(true,'Buscando coincidencias del producto…');
 try{
  let profile=null;try{if(!photosOnly)profile=await verifiedProfile(name,formField(f,'name').value)}catch(error){if(!researchSupported)throw error}
  if(epoch!==researchEpoch||$('formOverlay').hidden)return;
  if(profile){presentResearch(profile,name);return;}
  if(!researchSupported)throw Error('Conectá la búsqueda web siguiendo los pasos de activación. No necesitás cambiar tu inventario.');
  if(researchSelectable){
   const result=await request('researchCandidates',{name:lookupName,category});
   if(epoch!==researchEpoch||$('formOverlay').hidden||researchQuery()!==name)return;
   const count=showCandidates(result.candidates,result.searchId,lookupName);
   $('researchStatus').textContent=count?(photosOnly?'Elegí Ver fotos en el resultado que corresponde a tu artículo.':'Elegí Usar este resultado. Después se consultará la ficha y se buscarán coincidencias.'):result.notice||'No se encontraron páginas del modelo exacto. Revisá el código de la caja; los resultados de otros productos se omitieron.';
  }else{
   const result=await request('researchProduct',{name:lookupName,category});
   if(epoch!==researchEpoch||$('formOverlay').hidden||researchQuery()!==name)return;
   presentResearch(result.research,name);
   if(result.research?.match!=='exact')showCandidates(result.research?.sources);
  }
 }catch(error){if(epoch===researchEpoch)$('researchStatus').textContent=error.message;}
 finally{if(epoch===researchEpoch)researchLoading(false);}
}
async function selectResearchSource(candidateId){
 if(busy||researchBusy)return;
 if(!researchSearch||!researchSelectable){
  $('researchSetup').hidden=false;$('researchStatus').textContent='Para usar este resultado, publicá Code.gs y FichaGratis.gs actualizados en Apps Script. Abrí los pasos de activación.';
  return;
 }
 const search=researchSearch,epoch=researchEpoch,name=researchQuery(),category=formField($('productForm'),'category').value.trim();
 const automaticCategory=researchApplied.some(item=>item.key==='category'&&item.value===category);
 if(search.name!==name||search.category!==category&&!automaticCategory){resetResearch();return;}
 if(researchMode==='photos'){await loadResearchPhotos({searchId:search.id,candidateId});return;}
 researchDraft=null;$('researchApply').hidden=true;$('researchPreview').hidden=true;$('researchPhotos').hidden=true;
 $('researchCandidates').querySelectorAll('[data-research-source]').forEach(button=>button.closest('article').classList.toggle('selected',button.dataset.researchSource===candidateId));
 researchLoading(true,'Leyendo el resultado elegido y buscando el mismo producto en otras fuentes…');
 try{
  const result=await request('researchProduct',{name:search.requestName||name,category:search.category,selection:{searchId:search.id,candidateId}});
  if(epoch!==researchEpoch||$('formOverlay').hidden||researchQuery()!==name||formField($('productForm'),'category').value.trim()!==category)return;
  presentResearch({...result.research,selection:{searchId:search.id,candidateId}},name);
 }catch(error){if(epoch===researchEpoch)$('researchStatus').textContent=error.message;}
 finally{if(epoch===researchEpoch)researchLoading(false);}
}
function applyResearch(){
 const draft=researchDraft,f=$('productForm');if(!draft||draft.requestedName!==researchQuery())return;
 let filled=0;
 researchReferencesBefore=formField(f,'researchReferences').value;
 const assign=(key,value)=>{const field=formField(f,key),before=field.value;field.value=value;field.classList.add('research-filled');researchApplied.push({key,before,value:field.value});};
 const fill=(key,value)=>{const field=formField(f,key);if(value&&!field.value.trim()){assign(key,value);filled++;}};
 fill('description',draft.description);fill('category',draft.category);fill('colors',draft.colors);
 const dimensions=['width','height','length'],hasDimensions=dimensions.some(key=>formField(f,key).value.trim());
 for(const key of technicalFields){
  const value=draft.details[key],field=formField(f,key);if(value===undefined||field.value.trim())continue;
  if(dimensions.includes(key)&&hasDimensions&&draft.details.measureUnit!==formField(f,'measureUnit').value)continue;
  assign(key,value);filled++;
  if(key==='weight')assign('weightUnit',draft.details.weightUnit||'kg');
  if(dimensions.includes(key)&&!researchApplied.some(item=>item.key==='measureUnit'))assign('measureUnit',draft.details.measureUnit||'cm');
 }
 if(filled){
  let old=[];try{old=JSON.parse(formField(f,'researchReferences').value||'[]')}catch{}
  const refs=[...old,...draft.sources].filter((ref,i,all)=>all.findIndex(x=>x.url===ref.url)===i);
  formField(f,'researchReferences').value=JSON.stringify(C.cleanDetails({references:refs}).references||[]);
  $('technicalEditor').open=true;
 }
 const keys=researchApplied.filter(item=>technicalFields.includes(item.key)).map(item=>technicalLabels[item.key]);
 $('researchFieldSummary').textContent=keys.length?'Completados: '+keys.join(', ')+'. Lo que no tiene fuente queda vacío.':'Podés completar manualmente los datos que no estén publicados en la fuente.';
 $('researchFieldSummary').hidden=false;
 $('researchApply').textContent=filled?'Ver los '+filled+' campos completados':'Revisar características';
 $('researchStatus').textContent=filled?`${filled} campos vacíos completados. Revisalos y tocá Guardar y actualizar tienda.`:'Los campos que tienen información se conservaron. Comparalos con la ficha propuesta.';
 editorEvent('change');
}
async function save(e){
 e.preventDefault();
 if(busy||researchBusy)return;
 if(selectedFiles.length && !(await upload()))return;
 const f=$('productForm'),p={};
 if(f.dataset.hasRevision==='true')p.revision=f.dataset.revision;
 for(const k of ['id','code','name','category','price','promoPrice','promoText','colors','cost','stock','image','gallery','discounts','description'])p[k]=formField(f,k).value.trim();
 p.gallery=parseGallery(p.gallery).filter(u=>u!==p.image).slice(0,9).join(', ')||'[]';
 p.codAllowed=formField(f,'codAllowed').value==='SI';
 p.active=formField(f,'active').value==='SI';
 const rawDetails={};
 for(const key of [...technicalFields,'weightUnit','measureUnit']){
  rawDetails[key]=formField(f,key).value.trim();
 }
 try{rawDetails.references=JSON.parse(formField(f,'researchReferences').value||'[]')}catch{}
 p.details=C.cleanDetails(rawDetails);
 const needsExtended=extendedFields.some(key=>p.details[key])||p.details.references?.length;
 if((Object.keys(p.details).length&&!detailsSupported)||(needsExtended&&!extendedDetailsSupported)){
  $('technicalEditor').open=true;
  $('technicalDeploymentNotice').classList.remove('hidden');
  $('formMessage').textContent='Las características aún no se han guardado. Seguí los pasos de actualización del servidor indicados arriba.';
  $('technicalDeploymentNotice').scrollIntoView?.({behavior:'smooth',block:'center'});
  return;
 }
 p.price=Number(p.price);p.stock=Number(p.stock);
 // Compatibilidad con la implementación anterior; la nueva API confirma el consecutivo.
 if(window.GC_CODES&&(!p.id||window.GC_CODES.key(p.category)!==window.GC_CODES.key(f.dataset.originalCategory))){
  try{const fresh=await request('adminCatalog');p.code=window.GC_CODES.next(fresh.products||products,p.category);}catch(error){$('formMessage').textContent='No se pudo comprobar el siguiente código. Sincronizá e intentá guardar otra vez.';return;}
 }
 p.promoPrice=p.promoPrice===''||Number(p.promoPrice)===0?'':Number(p.promoPrice);
 if(!Number.isFinite(p.price)||p.price<0||p.stock<0||!Number.isInteger(p.stock))return toast('Verificá precio y stock');
 if(p.promoPrice!==''&&(!Number.isFinite(p.promoPrice)||p.promoPrice<=0||p.promoPrice>p.price))return toast('La promoción debe ser mayor que cero y no superar el precio normal.');
 setBusy(true);$('formMessage').textContent='Guardando en Google Sheets...';
 try{
  const out=await request('saveProduct',{product:p}),id=out.id||p.id;
  const confirmed=await reload(),saved=confirmed&&products.find(product=>product.id===id);
  if(confirmed&&!saved){
   $('formMessage').textContent='Google respondió al guardado, pero el producto todavía no aparece al comprobarlo. Conservá el formulario y sincronizá antes de volver a guardar.';return;
  }
  if(saved&&(saved.description!==p.description||JSON.stringify(saved.details)!==JSON.stringify(p.details)||saved.image!==p.image||JSON.stringify(parseGallery(saved.gallery))!==JSON.stringify(parseGallery(p.gallery)))){
   $('formMessage').textContent='Google guardó el producto, pero la ficha recibida no coincide. Conservá este formulario y revisá la versión de Code.gs.';return;
  }
  if(!confirmed){
   const merged=C.cleanProduct({...p,id}),index=products.findIndex(product=>product.id===id);
   if(index>=0)products[index]=merged;else products.unshift(merged);render();
  }
  try{localStorage.setItem('gc_catalog_revision',JSON.stringify({id,at:Date.now()}))}catch{}
  editorEvent('saved',{id});setBusy(false);closeForm(true);toast(confirmed?'Ficha guardada y comprobada.':'Producto guardado. No se pudo comprobar la lectura.');
  $('adminStatus').textContent=confirmed?'✓ Ficha guardada y comprobada en Google Sheets.':'✓ Guardado. La lectura de comprobación no respondió; revisá la ficha en la tienda.';
  const link=document.createElement('a');link.href='productos.html?producto='+encodeURIComponent(id)+'&v=gc-catalog-41';link.target='_blank';link.rel='noopener';link.textContent='Ver ficha en tienda ↗';$('adminStatus').appendChild(link);
 }catch(err){$('formMessage').textContent='⚠ '+err.message;toast(err.message)}finally{setBusy(false)}
}
function mergeSelectedFiles(list){
 const offered=Array.from(list||[]).filter(Boolean),incoming=offered.filter(file=>/^image\/(jpeg|png|webp|gif)$/i.test(file.type)&&file.size<=(file.type==='image/gif'?2:30)*1024*1024);
 if(incoming.length!==offered.length){toast('Usá JPG, PNG o WEBP de hasta 30 MB; GIF de hasta 2 MB.');$('formMessage').textContent='Algunas fotos no se agregaron. Revisá el formato y el tamaño.';}
 if(!incoming.length)return;
 const merged=[...selectedFiles];
 incoming.forEach(file=>{if(!merged.some(x=>x.name===file.name&&x.size===file.size&&x.lastModified===file.lastModified))merged.push(file)});
 const capacity=Math.max(0,10-editorPhotos().images.length);
 if(merged.length>capacity)toast('Máximo 10 fotos entre la principal, la galería y las pendientes.');
 selectedFiles=merged.slice(0,capacity);
 renderGalleryPreview();
 document.dispatchEvent(new CustomEvent('gc:photos-selected',{detail:{files:[...selectedFiles]}}));
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
 $('researchButton').disabled=value||researchBusy;
 $('findPhotosBtn').disabled=value||researchBusy;
 $('findReferencePhotosBtn').disabled=value||researchBusy;
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
async function toggleBestSeller(button){
 const product=products.find(p=>p.id===button.dataset.bestSeller);if(!product||button.disabled)return;
 if(!bestSellersSupported){toast('Actualizá Code.gs en Apps Script para guardar Más pedidos.');$('adminStatus').textContent='Publicá la última versión de Code.gs para habilitar Más pedidos. La marca se guardará en la hoja Productos.';return;}
 button.disabled=true;
 try{
  const result=await request('setBestSeller',{id:product.id,bestSeller:!product.bestSeller});
  product.bestSeller=result.bestSeller===true;render();
  try{localStorage.setItem('gc_catalog_revision',JSON.stringify({id:product.id,at:Date.now()}))}catch{}
  toast(product.bestSeller?'Agregado a Más pedidos.':'Quitado de Más pedidos.');
 }catch(error){button.disabled=false;toast(error.message);}
}
function binds(){
 $('sheetLink').href=cfg.spreadsheetUrl;
 $('loginForm').onsubmit=logIn;
 // El enlace de diagnóstico también funciona con implementaciones anteriores que exigen JSONP.
 $('googleConnection').href=cfg.apiUrl+'?action=health&callback=gcConnection';
 $('googlePanel').href=cfg.apiUrl+'?action=panel';
 $('retryConnection').onclick=connectionCheck;
 window.addEventListener('online',()=>{if(!$('loginPanel').classList.contains('hidden'))connectionCheck();});
 $('logout').onclick=()=>{token='';sessionStorage.removeItem('gc_admin_token');location.reload()};
 $('refresh').onclick=reload;
 $('createNew').onclick=()=>showProduct('');
 $('adminSearch').oninput=render;$('adminFilter').onchange=render;
 if($('adminSort'))$('adminSort').onchange=render;
 const clearAdmin=()=>{$('adminSearch').value='';$('adminFilter').value='';if($('adminSort'))$('adminSort').value='newest';render();$('adminSearch').focus({preventScroll:true});};
 if($('adminClearFilters'))$('adminClearFilters').onclick=clearAdmin;
 window.addEventListener('beforeunload',event=>{if(editorDirty()){event.preventDefault();event.returnValue='';}});
 document.addEventListener('keydown',event=>{if(event.key!=='Tab'||$('formOverlay').hidden||!$('bulkOverlay').hidden||!$('mgEditorOverlay').hidden||!$('ivOverlay').hidden)return;const controls=[...$('formOverlay').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary')].filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}},true);
 $('adminRows').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-clear-admin')){clearAdmin();return;}
  if(b.dataset.edit!==undefined){
   try{showProduct(b.dataset.edit)}catch(error){
    console.error('Error al abrir edición:',error);
    toast('No se pudo abrir el editor. Actualizá la página e intentá de nuevo.');
   }
  }else if(b.dataset.referenceProduct!==undefined)window.GC_BULK?.openReference(b.dataset.referenceProduct);else if(b.dataset.bestSeller!==undefined)toggleBestSeller(b);else if(b.dataset.disable!==undefined)disable(b.dataset.disable);
 };
 $('closeForm').onclick=closeForm;$('cancelForm').onclick=closeForm;
 $('productForm').onsubmit=save;
 $('researchButton').onclick=researchProduct;$('researchApply').onclick=()=>{$('technicalEditor').open=true;$('technicalEditor').scrollIntoView({behavior:'smooth',block:'start'});};
 $('findPhotosBtn').onclick=()=>researchProduct(true);
 $('findReferencePhotosBtn').onclick=()=>{const editor=editorPhotos();if(!editor.busy)window.GC_BULK?.openReference(editor.id,true);};
 $('researchQuery').addEventListener('input',()=>{automaticQuery=false;resetResearch()});
 $('researchQuery').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();researchProduct();}});
 formField($('productForm'),'category').addEventListener('input',()=>{resetResearch();updateEditorCode();});
 $('researchCandidates').addEventListener('click',event=>{const button=event.target.closest('[data-research-source]');if(button)selectResearchSource(button.dataset.researchSource);});
 $('researchPhotos').addEventListener('click',async event=>{
  if(event.target.closest('[data-find-source-photos]')){if(researchPhotoDraft?.selection)loadResearchPhotos(researchPhotoDraft.selection);return;}
  const button=event.target.closest('[data-research-photo]');if(!button||busy||researchBusy||!researchPhotoDraft)return;
  if([$('productImage').value.trim(),...parseGallery($('galleryInput').value)].filter(Boolean).length>=10){toast('Ya hay 10 fotos. Quitá una antes de agregar otra.');return;}
  if(!imageImportSupported||!researchPhotoDraft.selection){$('researchSetup').hidden=false;toast('Publicá Code.gs y FichaGratis.gs actualizados para importar fotos.');return;}
  const index=Number(button.dataset.researchPhoto),selection=researchPhotoDraft.selection,photoSearch=researchPhotoDraft.photoSearch;
  setBusy(true);button.disabled=true;button.textContent='Importando…';
  try{
   const out=await request('importResearchImage',{selection,imageIndex:index,photoSearch});
   if(!/^https:\/\//i.test(out.url||''))throw Error('No se recibió una foto guardada.');
   setGalleryFromUrls([out.url]);button.textContent='Foto importada';toast('Foto guardada en tu alojamiento. Tocá Guardar y actualizar tienda.');
  }catch(error){button.disabled=false;button.textContent='Reintentar foto';toast(error.message);}
  finally{setBusy(false);}
 });
 $('productForm').addEventListener('input',event=>event.target.classList.remove('research-filled'));
 formField($('productForm'),'name').addEventListener('input',()=>{if(automaticQuery)$('researchQuery').value=formField($('productForm'),'name').value;resetResearch()});
 $('uploadBtn').onclick=upload;
 $('galleryPreview').onclick=e=>{
  if(busy)return;
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.main===undefined&&b.dataset.removePhoto===undefined)return;
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
window.GC_ADMIN={request,products:()=>products,settings:()=>({...settings}),features:()=>serverFeatures,refreshFeatures,editProduct:showProduct,reload,toast,parseGallery,editorPhotos,appendEditorPhotos,reorderEditorPhotos,preparePhoto,selectedPhotos:()=>[...selectedFiles],addPhotos:mergeSelectedFiles,updateEditorCode,notify:()=>{try{localStorage.setItem('gc_catalog_revision',JSON.stringify({at:Date.now()}))}catch{}}};
binds();
})();

