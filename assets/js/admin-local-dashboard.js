/* Estadísticas del propio navegador (no son analíticas globales). */
(function(){'use strict';
const I=window.GC_LOCAL_INSIGHTS,A=window.GC_ADMIN;
if(!I||!A||!document.getElementById('adminPanel'))return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const container=document.createElement('section');container.className='box gc-local-panel';container.setAttribute('aria-label','Actividad local');
container.innerHTML='<div class="gc-local-head"><div><span class="eyebrow">Estadísticas · privacidad</span><h2>Actividad de este navegador</h2><p>Contadores de los últimos 30 días registrados únicamente en este dispositivo. No representan las visitas ni las ventas totales de la tienda; no se envían a Google ni a terceros.</p></div><button class="btn outline small" type="button" id="gcLocalClear">Borrar datos de este navegador</button></div><div class="gc-local-stats" id="gcLocalStats"></div><h3>Artículos consultados en este dispositivo</h3><div class="gc-local-ranking" id="gcLocalRanking"></div>';
const anchor=document.getElementById('mgViewInventory');anchor.parentNode.insertBefore(container,anchor);
const $=id=>document.getElementById(id);
function render(){
 const summary=I.summary();
 const labels=[['visit','Sesiones de este navegador'],['product','Fichas abiertas'],['cart','Agregados al carrito'],['whatsapp','Productos enviados a WhatsApp']];
 $('gcLocalStats').innerHTML=labels.map(([key,label])=>'<article><strong>'+summary.totals[key]+'</strong><span>'+label+'</span></article>').join('');
 const names=new Map(A.products().map(p=>[p.id,p.name]));
 $('gcLocalRanking').innerHTML=summary.top.length?summary.top.map((r,index)=>'<div><span>'+(index+1)+'. '+esc(names.get(r.id)||'Artículo no disponible')+'</span><small>'+r.product+' aperturas · '+r.cart+' agregados · '+r.whatsapp+' consultas</small></div>').join(''):'<p class="gc-local-empty">Sin eventos registrados en este navegador. Otros celulares o computadoras no aportan datos a esta tabla.</p>';
}
$('gcLocalClear').addEventListener('click',()=>{
 if(!confirm('¿Borrar únicamente los contadores de este navegador? No afectará el inventario.'))return;
 I.clear();render();
});
document.addEventListener('gc:catalog',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
render();
})();
