/* Gamer Comayagua | tienda móvil centrada en productos · 2026-11-16
   Sin escrituras al inventario, importes ni datos bancarios. */
(function(){'use strict';
 const body=document.body;
 if(body?.dataset.page!=='productos')return;
 const byId=id=>document.getElementById(id);
 const motion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const choice='gc_shop_view_2026';
 function readChoice(){try{return localStorage.getItem(choice)==='list'?'list':'grid'}catch{return 'grid'}}
 function writeChoice(value){try{localStorage.setItem(choice,value)}catch{}}
 function setView(next){
  const list=next==='list',button=byId('gcViewToggle');
  body.classList.toggle('gc-layout-list',list);
  if(button){button.setAttribute('aria-pressed',String(list));button.innerHTML=list?'<span aria-hidden="true">⊞</span> Cuadrícula':'<span aria-hidden="true">▤</span> Vista lista';}
  writeChoice(list?'list':'grid');
 }
 function syncSheets(){
  const busy=['detailOverlay','cartOverlay','compareOverlay'].some(id=>{const node=byId(id);return node&&!node.hidden;});
  body.classList.toggle('gc-sheet-open',busy);
 }
 const nav=byId('mobileCart'),top=byId('gcBackToTop');
 let scrolled=false,raf=false;
 function checkScroll(){
  raf=false;const active=window.scrollY>30;
  if(scrolled!==active){scrolled=active;body.classList.toggle('gc-has-scrolled',active);}
  if(top)top.classList.toggle('is-ready',window.scrollY>550);
 }
 function pulse(){
  if(!nav)return;
  nav.classList.remove('gc-cart-ping');
  void nav.offsetWidth;
  nav.classList.add('gc-cart-ping');
  setTimeout(()=>nav.classList.remove('gc-cart-ping'),750);
 }
 function init(){
  setView(readChoice());
  byId('gcViewToggle')?.addEventListener('click',()=>setView(body.classList.contains('gc-layout-list')?'grid':'list'));
  for(const id of ['detailOverlay','cartOverlay','compareOverlay']){
   const node=byId(id);if(!node)continue;
   new MutationObserver(syncSheets).observe(node,{attributes:true,attributeFilter:['hidden']});
  }
  syncSheets();checkScroll();
  window.addEventListener('scroll',()=>{
   if(!raf){raf=true;requestAnimationFrame(checkScroll);}
  },{passive:true});
  byId('productGrid')?.addEventListener('click',event=>{
   const add=event.target.closest('[data-add]');
   if(!add||add.disabled)return;
   queueMicrotask(()=>{const count=Number(byId('cartCount')?.textContent||0);if(count>0)pulse();});
  },{capture:true});
  // Permite volver a los productos con Escape sin ocultar la barra al abrir el teclado.
  const search=byId('search');
  search?.addEventListener('focus',()=>body.classList.add('gc-typing'));
  search?.addEventListener('blur',()=>body.classList.remove('gc-typing'));
  search?.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!event.currentTarget.value){event.currentTarget.blur();}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
