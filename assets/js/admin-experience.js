/* Accesos y navegación del panel; funciona con la conexión ya existente. */
(function(){'use strict';
const $=id=>document.getElementById(id),A=window.GC_ADMIN;
if(!A||!$('adminSection'))return;
const help={finance:'Clasificá productos comprados y por encargo. Tus importes son privados.',offers:'Activá descuentos y precios individuales sin salir de la página.',inventory:'Buscá y editá tus productos.',sales:'Confirmá una venta y revisá las existencias resultantes.',receipts:'Registrá la mercancía que recibiste.',duplicates:'Compará las fichas antes de elegir qué conservar.',pending:'Revisá fotos y datos que falten.',stock:'Encontrá agotados y artículos por reponer.',orders:'Seguí la preparación y entrega de tus pedidos.',waitlist:'Revisá las solicitudes de tus clientes.',publish:'Prepará un texto con los datos de tu producto.'};
function go(key){const tab=$('mgTabs').querySelector('[data-mg-tab="'+key+'"]');if(tab)tab.click();}
function labels(){const ready=A.features().inventoryMovements===true;for(const key of ['sales','receipts']){const option=[...$('adminSection').options].find(option=>option.value===key);option.textContent=(key==='sales'?'Ventas':'Entradas de mercancía')+(ready?'':' · activación pendiente');}}
function current(key,move=false){$('adminSection').value=key;$('adminSectionHelp').textContent=(key==='sales'||key==='receipts')&&A.features().inventoryMovements!==true?'El guardado de esta sección está pendiente de activación en Google.':help[key]||'';const selected=$('mgTabs').querySelector('[aria-selected="true"]');if(move&&selected){const a=selected.getBoundingClientRect(),b=$('mgTabs').getBoundingClientRect();if(a.left<b.left)$('mgTabs').scrollLeft+=a.left-b.left-10;else if(a.right>b.right)$('mgTabs').scrollLeft+=a.right-b.right+10;}}
$('adminSection').onchange=()=>go($('adminSection').value);
$('adminPanel').addEventListener('click',event=>{const button=event.target.closest('[data-admin-go]');if(!button)return;go(button.dataset.adminGo);if(button.hasAttribute('data-admin-filter')){$('adminFilter').value=button.dataset.adminFilter;$('adminSearch').value='';$('adminFilter').dispatchEvent(new Event('change'));}const target=button.dataset.adminFocus==='search'?$('adminSearch'):document.querySelector('[data-mg-view="'+button.dataset.adminGo+'"]');target?.scrollIntoView({block:'start',behavior:'instant'});if(button.dataset.adminFocus==='search')$('adminSearch').focus({preventScroll:true});});
document.addEventListener('gc:management-view',event=>current(event.detail.view,true));
document.addEventListener('gc:catalog',()=>{labels();current($('adminSection').value||'inventory');});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!$('adminPanel').classList.contains('hidden')&&!document.querySelector('.overlay:not([hidden])')){event.preventDefault();go('inventory');$('adminSearch').focus();$('adminSearch').select();}});
labels();
const requested=new URLSearchParams(location.search).get('seccion');if(requested==='ofertas')go('offers');if(requested==='finanzas')go('finance');
})();
