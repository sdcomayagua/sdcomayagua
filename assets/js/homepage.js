/* Portada: solo consume catálogo público, sin costos, PIN ni datos personales. */
(function(root){
 'use strict';
 const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fallback='assets/img/sin-foto.svg';
 const validId=id=>/^[\w.-]{1,160}$/.test(String(id||''));
 function image(value){
  const raw=String(value||'').trim();
  if(/^assets\/(?:catalog|products)\/[\w.-]+$/i.test(raw)||/^https:\/\//i.test(raw))return raw;
  return fallback;
 }
 function products(raw){
  const list=Array.isArray(raw)?raw:Array.isArray(raw?.products)?raw.products:[];
  return list.map(p=>root.GC?.cleanProduct?.(p)||p)
   .filter(p=>p&&validId(p.id)&&p.active!==false&&Number(p.stock)>0&&p.name)
   .sort((a,b)=>Number(!!b.bestSeller)-Number(!!a.bestSeller)||
       (Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||
       Number(b.catalogOrder||0)-Number(a.catalogOrder||0));
 }
 function card(p){
  const price=root.GC?.unitPrice?.(p,1)??Number(p.price);
  const discounted=Number(price)<Number(p.price);
  const url='productos.html?producto='+encodeURIComponent(p.id);
  return '<article class="home-product"><div class="home-product-media"><a href="'+url+'" aria-label="Ver '+escape(p.name)+'"><img src="'+escape(image(p.image))+'" loading="lazy" decoding="async" alt="'+escape(p.name)+'" onerror="this.onerror=null;this.src=\''+fallback+'\'"></a></div><div class="home-product-copy"><small>'+escape(p.category||'Accesorios')+'</small><strong>'+escape(p.name)+'</strong><div class="home-product-price">'+escape(root.GC?.money?.(price)||'Consultar precio')+(discounted?'<del>'+escape(root.GC?.money?.(p.price)||'')+'</del>':'')+'</div><a href="'+url+'" class="home-product-link">Ver producto <span aria-hidden="true">→</span></a></div></article>';
 }
 function display(raw){
  const list=products(raw),categoryCounts=new Map();
  for(const p of list){const key=String(p.category||'').trim();if(key&&!/^(otros?|productos?)$/i.test(key))categoryCounts.set(key,(categoryCounts.get(key)||0)+1);}
  const categories=[...categoryCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).slice(0,4);
  if($('homeCategories'))$('homeCategories').innerHTML=(categories.length?categories.map(([name])=>'<a class="home-category" href="productos.html?categoria='+encodeURIComponent(name)+'"><strong>'+escape(name)+'</strong><span>Explorar categoría →</span></a>').join(''):'<a href="productos.html" class="home-category"><strong>Ver catálogo completo</strong><span>Explorar productos →</span></a>');
  if($('homeProducts'))$('homeProducts').innerHTML=list.length?list.slice(0,6).map(card).join(''):'<div class="home-empty">El catálogo está temporalmente no disponible. <a href="productos.html">Abrí la lista de productos</a> o consultanos por WhatsApp.</div>';
  if($('homeHeroPhotos')&&list.length){
   $('homeHeroPhotos').innerHTML=list.slice(0,4).map(p=>'<a href="productos.html?producto='+encodeURIComponent(p.id)+'" aria-label="Ver '+escape(p.name)+'"><img src="'+escape(image(p.image))+'" decoding="async" alt="'+escape(p.name)+'" onerror="this.onerror=null;this.src=\''+fallback+'\'"></a>').join('');
  }
  return {count:list.length,categories:categories.length};
 }
 async function init(){
  if($('homeYear'))$('homeYear').textContent=String(new Date().getFullYear());
  display(root.GC_CATALOGO_INICIAL||[]);
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=setTimeout(()=>controller?.abort(),8500);
  try{
   const response=await fetch('data/catalogo-respaldo.json',{cache:'no-store',...(controller?{signal:controller.signal}:{})});
   if(!response.ok)throw Error('Sin catálogo público');
   const data=await response.json();
   if(Array.isArray(data)&&data.length)display(data);
  }catch(error){
   // La portada es utilizable con el respaldo local cargado.
  }finally{clearTimeout(timer);}
 }
 root.GC_HOME={display,products};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
})(window);
