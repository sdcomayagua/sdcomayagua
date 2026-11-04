/* Panel de auditoría local: no modifica precios, fotos ni inventario. */
(function(){'use strict';
const $=id=>document.getElementById(id),A=()=>window.GC_ADMIN,M=()=>window.GC_QUALITY_MODEL;
let current=[],limit=12;
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cards(r){
 const labels=r.issues.map(i=>'<span class="gc-quality-tag '+i.level+'">'+escapeHtml(i.label)+'</span>').join('');
 return '<li class="gc-quality-item"><div class="gc-quality-entry"><strong>'+escapeHtml(r.name)+'</strong><small>'+
  escapeHtml([r.category,r.code||'Sin código'].filter(Boolean).join(' · '))+' · '+r.images+' foto'+(r.images===1?'':'s')+
  '</small><div class="gc-quality-tags">'+labels+'</div></div><button type="button" class="btn outline small" data-quality-edit="'+escapeHtml(r.id)+'">Corregir</button></li>';
}
function refresh(){
 if(!$('gcQualityPanel')||!A()||!M())return;
 current=M().analyze(A().products());
 const stat=M().summary(current),pairs=[['Requieren revisión',current.filter(r=>r.issues.length).length],['Sin foto',stat.missingPhotos],['Textos por mejorar',stat.descriptions],['Precios por revisar',stat.prices]];
 $('gcQualityStats').innerHTML=pairs.map(([label,n])=>'<article><b>'+n+'</b><span>'+label+'</span></article>').join('');
 updateList();
}
function updateList(){
 const filter=$('gcQualityFilter')?.value||'all',query=$('gcQualitySearch')?.value||'';
 const items=M().filter(current,{key:filter,query});
 $('gcQualityList').innerHTML=items.slice(0,limit).map(cards).join('')||'<li class="gc-quality-empty">No hay artículos con este filtro.</li>';
 $('gcQualityMore').textContent='Mostrando '+Math.min(limit,items.length)+' de '+items.length+' fichas. Los indicadores son avisos para revisión manual.';
 $('gcQualityShowMore').hidden=items.length<=limit;
 $('gcQualityExport').disabled=!items.length;
}
function download(){
 const rows=M().filter(current,{key:$('gcQualityFilter').value,query:$('gcQualitySearch').value});
 if(!rows.length)return;
 const data=M().csv(rows),blob=new Blob([data],{type:'text/csv;charset=utf-8'}),href=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=href;link.download='Gamer-Comayagua-revision-de-productos.csv';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(href),30000);
 $('gcQualityMore').textContent='Informe CSV preparado. No incluye costos, información de clientes ni datos de acceso.';
}
function init(){
 const inventory=$('mgViewInventory'),list=$('adminRows');if(!inventory||!list||!A()||!M())return;
 const box=document.createElement('section');box.id='gcQualityPanel';box.className='gc-quality-panel';
 box.setAttribute('aria-label','Control de calidad del inventario');
 box.innerHTML='<div class="gc-quality-header"><div><span>ETAPA 1 · CALIDAD DEL CATÁLOGO</span><h2>Fichas que necesitan atención</h2><p>Detecta fotos faltantes, descripciones genéricas, problemas de precio y existencias. No modifica ningún producto.</p></div><button class="btn outline small" type="button" id="gcQualityRefresh">↻ Revisar</button></div><div class="gc-quality-stats" id="gcQualityStats"></div><div class="gc-quality-controls"><label for="gcQualityFilter">Revisar</label><select id="gcQualityFilter" class="field"><option value="all">Todas las pendientes</option><option value="high">Urgentes</option><option value="photo">Fotografías</option><option value="description">Descripción y características</option><option value="price">Precios y promociones</option><option value="stock">Existencias</option><option value="ok">Sin alertas</option></select><label for="gcQualitySearch">Buscar</label><input type="search" class="field" id="gcQualitySearch" placeholder="Nombre o código del artículo"><button class="btn outline" id="gcQualityExport" type="button">↓ Exportar revisión CSV</button></div><ul class="gc-quality-list" id="gcQualityList"></ul><p id="gcQualityMore" class="gc-quality-more" role="status" aria-live="polite"></p><button id="gcQualityShowMore" class="btn outline small" type="button" hidden>Ver más pendientes</button>';
 const first=inventory.querySelector('.box');if(first)first.insertAdjacentElement('afterend',box);else inventory.prepend(box);
 $('gcQualityRefresh').onclick=refresh;
 $('gcQualityFilter').onchange=()=>{limit=12;updateList();};
 $('gcQualitySearch').oninput=()=>{limit=12;updateList();};
 $('gcQualityExport').onclick=download;
 $('gcQualityShowMore').onclick=()=>{limit+=24;updateList();};
 $('gcQualityList').addEventListener('click',event=>{const button=event.target.closest('[data-quality-edit]');if(button)A().editProduct(button.dataset.qualityEdit);});
 document.addEventListener('gc:catalog',refresh);refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
