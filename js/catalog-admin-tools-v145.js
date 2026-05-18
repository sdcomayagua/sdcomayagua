// SD COMAYAGUA POS - herramientas admin en catálogo e inventario v1.4.5
(function(){
  const PKEY='sd_pos_products';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const products=()=>window.SD_POS?.state?.products||read(PKEY,[]);
  const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=v=>`Lps. ${Number(String(v??0).replace(/,/g,'')||0).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const findProduct=code=>products().find(p=>String(p.codigo)===String(code));
  const fallback='assets/categorias/general.svg';

  function parsePromo(text=''){
    return String(text||'').split(/[|;,\n]+/).map(part=>{
      const m=part.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
      if(!m)return null;
      const qty=parseInt(m[1],10), total=Number(String(m[2]).replace(/,/g,''))||0;
      return qty&&total?{qty,total}:null;
    }).filter(Boolean).sort((a,b)=>a.qty-b.qty);
  }

  function enhancePromoBlocks(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const code=card.dataset.code;
      const p=findProduct(code);
      const promo=card.querySelector('.product-promo');
      if(!promo||!p?.promos)return;
      const rules=parsePromo(p.promos);
      if(!rules.length)return;
      promo.classList.add('sdc-promo-buttons');
      promo.innerHTML=`<span class="sdc-promo-title">Cantidad - Precio</span><div class="sdc-promo-grid">${rules.map(r=>`<span class="sdc-promo-btn"><b>${r.qty} ${r.qty===1?'Par':'Pares'}</b><small>${money(r.total)}</small></span>`).join('')}</div>`;
    });
  }

  function addEditButtons(){
    document.querySelectorAll('.product-card[data-code]').forEach(card=>{
      const code=card.dataset.code;
      const actions=card.querySelector('.product-actions');
      if(!actions||actions.querySelector('[data-catalog-edit]'))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn ghost sdc-edit-product-btn';
      btn.dataset.catalogEdit=code;
      btn.textContent='Editar';
      actions.appendChild(btn);
    });
  }

  function enhanceInventoryImages(){
    document.querySelectorAll('.table-wrap tbody tr').forEach(row=>{
      if(row.dataset.sdcImageDone==='1')return;
      const first=row.querySelector('td:first-child');
      const code=first?.querySelector('strong')?.textContent?.trim();
      const p=findProduct(code);
      if(!first||!p)return;
      row.dataset.sdcImageDone='1';
      const img=document.createElement('img');
      img.className='sdc-inventory-thumb';
      img.src=p.imagen||fallback;
      img.alt=p.nombre||code;
      img.onerror=function(){this.onerror=null;this.src=fallback};
      const wrap=document.createElement('div');
      wrap.className='sdc-inventory-head';
      wrap.appendChild(img);
      const info=document.createElement('div');
      info.className='sdc-inventory-codebox';
      while(first.firstChild) info.appendChild(first.firstChild);
      wrap.appendChild(info);
      first.appendChild(wrap);
    });
  }

  function openEdit(code){
    const p=findProduct(code);
    if(!p)return;
    if(window.SD_POS?.openProductForm){
      window.SD_POS.openProductForm(p);
      return;
    }
    if(window.SD_POS?.navigate) window.SD_POS.navigate('inventory');
  }

  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-catalog-edit]');
    if(!edit)return;
    e.preventDefault();
    e.stopPropagation();
    openEdit(edit.dataset.catalogEdit);
  },true);

  let scheduled=false;
  function run(){enhancePromoBlocks();addEditButtons();enhanceInventoryImages();}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run();});}
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
