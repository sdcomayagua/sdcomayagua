/* Diagnóstico de calidad de fichas: análisis local, sin sobrescribir el inventario. */
(function(){'use strict';
const $=id=>document.getElementById(id),A=()=>window.GC_ADMIN;
function problems(p){
 const issues=[],photos=A()?.parseGallery?.(p.gallery)||[];
 if(!p.image&&!photos.length)issues.push('Sin fotografías');
 if(!String(p.description||'').trim())issues.push('Sin descripción');
 if(!(Number(p.price)>0))issues.push('Precio pendiente');
 if(p.active&&Number(p.stock)===0)issues.push('Agotado');
 if(p.promoPrice>0&&p.promoPrice>=p.price)issues.push('Promoción sin rebaja');
 if(p.costKnown&&p.cost>0&&p.price>0&&p.price<p.cost)issues.push('Precio menor que costo');
 return issues;
}
function render(){
 if(!$('gcQualityPanel')||!A())return;
 const products=A().products().filter(p=>!p.deletedAt),active=products.filter(p=>p.active),flagged=active.map(p=>({p,issues:problems(p)})).filter(x=>x.issues.length);
 const missing=active.filter(p=>!p.image&&!A().parseGallery(p.gallery).length).length;
 const descriptions=active.filter(p=>!String(p.description||'').trim()).length;
 const prices=active.filter(p=>!(Number(p.price)>0)||(p.costKnown&&p.cost>0&&p.price<p.cost)||(p.promoPrice>0&&p.promoPrice>=p.price)).length;
 $('gcQualityStats').innerHTML='<article><b>'+Math.max(0,active.length-flagged.length)+'</b><span>Fichas sin alertas</span></article><article><b>'+missing+'</b><span>Sin foto</span></article><article><b>'+descriptions+'</b><span>Sin descripción</span></article><article><b>'+prices+'</b><span>Revisar precio</span></article>';
 $('gcQualityList').innerHTML=flagged.slice(0,12).map(({p,issues})=>'<li><div><strong>'+escapeHtml(p.name)+'</strong><small>'+escapeHtml(issues.join(' · '))+'</small></div><button type="button" class="btn outline small" data-quality-edit="'+escapeHtml(p.id)+'">Corregir</button></li>').join('')||'<li class="gc-quality-empty">Las fichas activas están completas según las comprobaciones básicas.</li>';
 $('gcQualityMore').textContent=flagged.length>12?'Mostrando 12 de '+flagged.length+' fichas por revisar. Buscá el resto desde Inventario.':'Revisión automática: '+flagged.length+' fichas con avisos.';
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function init(){
 const inventory=$('mgViewInventory'),list=$('adminRows');if(!inventory||!list||!A())return;
 const box=document.createElement('section');box.id='gcQualityPanel';box.className='gc-quality-panel';box.setAttribute('aria-label','Control de calidad del inventario');
 box.innerHTML='<div class="gc-quality-header"><div><span>CALIDAD DEL CATÁLOGO</span><h2>Productos por mejorar</h2><p>Comprobación automática de fotografías, descripción, existencias y precios. No cambia tus productos.</p></div><button class="btn outline small" type="button" id="gcQualityRefresh">↻ Revisar</button></div><div class="gc-quality-stats" id="gcQualityStats"></div><ul class="gc-quality-list" id="gcQualityList"></ul><p id="gcQualityMore" class="gc-quality-more"></p>';
 const first=inventory.querySelector('.box');if(first)first.insertAdjacentElement('afterend',box);else inventory.prepend(box);
 $('gcQualityRefresh').onclick=render;
 $('gcQualityList').addEventListener('click',e=>{const b=e.target.closest('[data-quality-edit]');if(b)A().editProduct(b.dataset.qualityEdit);});
 document.addEventListener('gc:catalog',render);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
