// SD COMAYAGUA POS - editor visual de promociones v1.4.6
(function(){
  const money=v=>`Lps. ${Number(String(v??0).replace(/,/g,'')||0).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function parsePromos(text=''){
    return String(text||'').split(/[|;,\n]+/).map(part=>{
      const m=part.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
      if(!m)return null;
      const qty=parseInt(m[1],10), price=Number(String(m[2]).replace(/,/g,''))||0;
      return qty>0&&price>0?{qty,price}:null;
    }).filter(Boolean).sort((a,b)=>a.qty-b.qty);
  }

  function serialize(rows){
    return rows.filter(r=>r.qty>0&&r.price>0).sort((a,b)=>a.qty-b.qty).map(r=>`${r.qty}=${r.price}`).join(' | ');
  }

  function rowHtml(rule={qty:'',price:''}){
    return `<div class="sdc-promo-edit-row">
      <label><span>Cantidad</span><input type="number" min="1" step="1" value="${esc(rule.qty)}" data-promo-qty></label>
      <label><span>Precio total</span><input type="number" min="0" step="0.01" value="${esc(rule.price)}" data-promo-price></label>
      <button type="button" class="sdc-promo-remove" data-promo-remove>×</button>
    </div>`;
  }

  function previewHtml(rows){
    if(!rows.length)return `<div class="sdc-promo-empty">Sin promociones. Agrega una oferta si manejas precio por cantidad.</div>`;
    return `<div class="sdc-promo-preview-grid">${rows.map(r=>`<span class="sdc-promo-preview-chip"><b>${r.qty} ${r.qty===1?'Par':'Pares'}</b><small>${money(r.price)}</small></span>`).join('')}</div>`;
  }

  function getRows(box){
    return [...box.querySelectorAll('.sdc-promo-edit-row')].map(row=>({
      qty: parseInt(row.querySelector('[data-promo-qty]')?.value||0,10)||0,
      price: Number(row.querySelector('[data-promo-price]')?.value||0)||0
    })).filter(r=>r.qty>0||r.price>0);
  }

  function sync(box, textarea){
    const rows=getRows(box);
    textarea.value=serialize(rows);
    const preview=box.querySelector('[data-promo-preview]');
    if(preview)preview.innerHTML=previewHtml(rows.filter(r=>r.qty>0&&r.price>0));
  }

  function enhanceTextarea(textarea){
    if(!textarea || textarea.dataset.promoEditor==='1')return;
    textarea.dataset.promoEditor='1';
    textarea.classList.add('sdc-promo-hidden-source');
    const rows=parsePromos(textarea.value);
    const box=document.createElement('div');
    box.className='sdc-promo-editor';
    box.innerHTML=`
      <div class="sdc-promo-editor-head">
        <strong>Promociones por cantidad</strong>
        <small>Se guardan automáticamente en el formato correcto.</small>
      </div>
      <div class="sdc-promo-editor-rows" data-promo-rows>${(rows.length?rows:[{qty:1,price:''}]).map(rowHtml).join('')}</div>
      <button type="button" class="sdc-promo-add" data-promo-add>+ Agregar otra oferta</button>
      <div class="sdc-promo-preview" data-promo-preview>${previewHtml(rows)}</div>
      <details class="sdc-promo-manual"><summary>Editar código manual</summary></details>`;
    textarea.insertAdjacentElement('afterend',box);
    box.querySelector('.sdc-promo-manual')?.appendChild(textarea);
    box.addEventListener('input',()=>sync(box,textarea));
    box.addEventListener('click',e=>{
      const add=e.target.closest('[data-promo-add]');
      if(add){
        box.querySelector('[data-promo-rows]').insertAdjacentHTML('beforeend',rowHtml());
        sync(box,textarea);
        return;
      }
      const remove=e.target.closest('[data-promo-remove]');
      if(remove){
        const row=remove.closest('.sdc-promo-edit-row');
        row?.remove();
        if(!box.querySelector('.sdc-promo-edit-row')) box.querySelector('[data-promo-rows]').insertAdjacentHTML('beforeend',rowHtml());
        sync(box,textarea);
      }
    });
    sync(box,textarea);
  }

  function run(){
    document.querySelectorAll('textarea[name="promos"]').forEach(enhanceTextarea);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;run();});
  }

  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
