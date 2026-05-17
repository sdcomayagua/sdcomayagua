// SD COMAYAGUA POS - Mejora de precio con envio v1.4.2
(function(){
  const PKEY='sd_pos_products', SKEY='sd_pos_settings';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const num=v=>Number(String(v??0).replace(/,/g,''))||0;
  const esc=t=>String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const ps=()=>window.SD_POS?.state?.products||read(PKEY,[]);
  const st=()=>window.SD_POS?.state?.settings||read(SKEY,{});
  const cur=()=>st().currency||'Lps.';
  const money=v=>`${cur()} ${num(v).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const unit=q=>`${q} ${q===1?'unidad':'unidades'}`;
  const product=code=>ps().find(p=>String(p.codigo)===String(code));

  function rules(txt=''){
    return String(txt||'').split(/[|;,\n]+/).map(x=>{
      const m=x.trim().match(/^(\d+)\s*(?:=|x|por|a|:)\s*(?:lps\.?|l\.?|hnl)?\s*([\d,.]+)/i);
      return m?{qty:parseInt(m[1],10),total:num(m[2])}:null;
    }).filter(r=>r&&r.qty>0&&r.total>0).sort((a,b)=>a.qty-b.qty);
  }

  function promo(qty,price,txt=''){
    const q=Math.max(1,Math.floor(num(qty)||1)), unitPrice=num(price), base=q*unitPrice, rs=rules(txt);
    if(!rs.length)return{q,base,total:base,discount:0,rs};
    const exact=rs.find(r=>r.qty===q); if(exact)return{q,base,total:exact.total,discount:Math.max(0,base-exact.total),rs};
    const best=Array(q+1).fill(Infinity); best[0]=0;
    for(let i=1;i<=q;i++){best[i]=best[i-1]+unitPrice;rs.forEach(r=>{if(r.qty<=i)best[i]=Math.min(best[i],best[i-r.qty]+r.total)})}
    const total=Math.min(base,best[q]); return{q,base,total,discount:Math.max(0,base-total),rs};
  }

  function chips(txt=''){
    const rs=rules(txt); if(!rs.length)return'';
    return `<span class="sdc-offers-title">Ofertas por cantidad</span><div class="sdc-offer-chips">${rs.slice(0,12).map(r=>`<span class="sdc-offer-chip"><b>${unit(r.qty)}</b><small>Total ${money(r.total)}</small><em>${money(r.total/r.qty)} c/u</em></span>`).join('')}</div>`;
  }

  function calc(p,q){
    const set=st(), pr=promo(q,p.precio,p.promos||''), normal=num(set.normalShipping||0), cod=num(set.codShipping||normal||0), rate=num(set.codCommissionRate||0), com=pr.total*rate;
    return{pr,normal,cod,rate,com,normalTotal:pr.total+normal,codTotal:pr.total+cod+com};
  }

  function msg(p,q,c){
    const pct=c.rate?`${(c.rate*100).toFixed((c.rate*100)%1?1:0)}%`:'0%';
    return `🛍️ PRODUCTO DISPONIBLE - SD COMAYAGUA\n\n📌 Producto: ${p.nombre}\n🔖 Código: ${p.codigo||'N/A'}\n🔢 Cantidad consultada: ${unit(q)}\n💰 Solo producto: ${money(c.pr.total)}${c.pr.discount?`\n🎁 Promo aplicada: ahorrás ${money(c.pr.discount)}`:''}\n\n🚚 Envío Normal: ${money(c.normalTotal)}\nIncluye producto + ${money(c.normal)} de envío.\nPago por depósito, transferencia o Tigo Money.\n\n📦 Pagar al Recibir: ${money(c.codTotal)}\nIncluye producto + ${money(c.cod)} de envío${c.com?` + comisión COD de ${pct} (${money(c.com)})`:''}.\n\n✅ Disponible para entrega.\n📲 Para confirmar pedido, enviame tu nombre, municipio y dirección.`;
  }

  function image(p){return p.imagen||'assets/categorias/general.svg'}
  function modal(p,qty=1){
    const max=Math.max(1,num(p.stock)), q=Math.max(1,Math.min(Math.floor(num(qty)||1),max)), c=calc(p,q), text=msg(p,q,c);
    return `<section class="modal" role="dialog" aria-modal="true"><header class="modal-header"><h2>Precio con envío</h2><button class="icon-btn" data-close-modal>×</button></header><div class="modal-body"><div class="sdc-ship-modal" data-ship-code="${esc(p.codigo)}"><div class="sdc-ship-hero"><img src="${esc(image(p))}" alt="${esc(p.nombre)}" onerror="this.onerror=null;this.src='assets/categorias/general.svg'"><div><h3>${esc(p.nombre)}</h3><p>${esc(p.codigo||'')} · Disponible: ${max}</p></div></div><div class="sdc-qty-card"><span class="sdc-qty-title">Cantidad de producto</span><div class="sdc-product-stepper"><button class="sdc-step-btn" type="button" data-qty-minus>−</button><div class="sdc-step-center"><strong>PRODUCTO</strong><input type="number" min="1" max="${max}" value="${q}" data-ship-qty></div><button class="sdc-step-btn" type="button" data-qty-plus>+</button></div></div><div class="sdc-ship-results"><div class="sdc-ship-row"><span>Producto</span><strong>${money(c.pr.total)}</strong></div>${c.pr.discount?`<div class="sdc-ship-row"><span>Ahorro promo</span><strong>${money(c.pr.discount)}</strong></div>`:''}<div class="sdc-ship-row"><span>Envío normal</span><strong>${money(c.normal)}</strong></div><div class="sdc-ship-row total-normal"><span>Total envío normal</span><strong>${money(c.normalTotal)}</strong></div><div class="sdc-ship-row"><span>Envío pago al recibir</span><strong>${money(c.cod)}</strong></div>${c.com?`<div class="sdc-ship-row"><span>Comisión COD</span><strong>${money(c.com)}</strong></div>`:''}<div class="sdc-ship-row total-cod"><span>Total pago al recibir</span><strong>${money(c.codTotal)}</strong></div></div>${c.pr.rs.length?`<div class="sdc-offers-panel">${chips(p.promos||'')}</div>`:''}<div class="sdc-copy-box" data-copy-text>${esc(text)}</div><div class="sdc-ship-actions"><button class="btn primary" type="button" data-copy-shipping>Copiar mensaje</button><button class="btn secondary" type="button" data-add-ship-cart>Agregar al carrito</button><button class="btn ghost span" type="button" data-close-modal>Cerrar</button></div></div></div></section>`;
  }

  function open(code,qty=1){const p=product(code), root=document.getElementById('modalRoot'); if(!p||!root)return; root.hidden=false; root.innerHTML=modal(p,qty)}
  function close(){const r=document.getElementById('modalRoot'); if(r){r.hidden=true;r.innerHTML=''}}
  function add(code){const b=document.querySelector(`[data-cart-add="${CSS.escape(code)}"]`); if(b)b.click()}
  function current(box){return Math.max(1,num(box?.querySelector('[data-ship-qty]')?.value||1))}
  function rerender(box,qty){if(box?.dataset.shipCode)open(box.dataset.shipCode,qty)}
  function copyText(t){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(t);const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();return Promise.resolve()}

  document.addEventListener('click',e=>{
    const ship=e.target.closest('[data-shipping-quote]'); if(ship){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return open(ship.dataset.shippingQuote,1)}
    if(e.target.closest('[data-close-modal]'))return close();
    const box=e.target.closest('[data-ship-code]');
    if(e.target.closest('[data-qty-minus]'))return rerender(box,Math.max(1,current(box)-1));
    if(e.target.closest('[data-qty-plus]')){const max=num(box?.querySelector('[data-ship-qty]')?.max||9999);return rerender(box,Math.min(max,current(box)+1))}
    if(e.target.closest('[data-add-ship-cart]')){const code=box?.dataset.shipCode, q=current(box);close();for(let i=0;i<q;i++)add(code);return}
    const cp=e.target.closest('[data-copy-shipping]'); if(cp){const t=box?.querySelector('[data-copy-text]')?.textContent||'';copyText(t).then(()=>{cp.textContent='Mensaje copiado';setTimeout(()=>cp.textContent='Copiar mensaje',1400)})}
  },true);

  document.addEventListener('change',e=>{const input=e.target.closest('[data-ship-qty]'); if(!input)return;const box=input.closest('[data-ship-code]'), max=num(input.max||9999);rerender(box,Math.min(max,Math.max(1,num(input.value||1))))},true);
})();
