/* Marca de agua pública: solo presentación. El archivo original no se modifica. */
(function(root){'use strict';
const defaults={watermarkEnabled:true,watermarkText:'GAMER COMAYAGUA',watermarkOpacity:.16};
let current={...defaults};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function options(raw={}){
 const text=String(raw.watermarkText??defaults.watermarkText).trim().replace(/\s+/g,' ').slice(0,60);
 return {watermarkEnabled:raw.watermarkEnabled===undefined?defaults.watermarkEnabled:raw.watermarkEnabled===true||/^(si|sí|true|1)$/i.test(String(raw.watermarkEnabled)),watermarkText:text||defaults.watermarkText,watermarkOpacity:clamp(Number(raw.watermarkOpacity)||defaults.watermarkOpacity,.08,.30)};
}
const xml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const marks=[[240,165],[758,165],[240,472],[758,472],[240,779],[758,779]];
function fontSize(text){return clamp(Math.floor(870/(Math.max(8,text.length)*.98)),15,48);}
function svg(raw){
 const o=options(raw),size=fontSize(o.watermarkText),parts=marks.map(([x,y])=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" transform="rotate(-27 '+x+' '+y+')">'+xml(o.watermarkText)+'</text>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000"><g font-family="Arial,Helvetica,sans-serif" font-size="'+size+'" font-weight="700" fill="#ffffff">'+parts+'</g></svg>';
}
function style(){
 if(document.getElementById('gcWatermarkStyles'))return;
 const el=document.createElement('style');el.id='gcWatermarkStyles';
 el.textContent='.gc-wm-host{position:relative}.gc-watermark-overlay{position:absolute;inset:0;z-index:2;pointer-events:none;user-select:none;background-position:center;background-size:100% 100%;background-repeat:no-repeat;opacity:var(--gc-wm-opacity,.16);mix-blend-mode:difference;border-radius:inherit}.gc-wm-host .tag,.gc-wm-host .photo-inspect{z-index:3}.gc-wm-host .detail-gallery-arrow,.gc-wm-host .detail-open-photo{z-index:4}';
 document.head.appendChild(el);
}
function applyTo(root=document){
 if(!root||!root.querySelectorAll)return;
 style();
 const chosen=root.querySelectorAll('.photo,.detail-main,.detail-thumb,.requested-product');
 const o=current,pattern='url("data:image/svg+xml,'+encodeURIComponent(svg(o))+'")';
 chosen.forEach(host=>{
  let overlay=host.querySelector(':scope > .gc-watermark-overlay');
  if(!o.watermarkEnabled){overlay?.remove();return;}
  if(!overlay){overlay=document.createElement('span');overlay.className='gc-watermark-overlay';overlay.setAttribute('aria-hidden','true');host.appendChild(overlay);}
  host.classList.add('gc-wm-host');overlay.style.backgroundImage=pattern;overlay.style.setProperty('--gc-wm-opacity',o.watermarkOpacity);
 });
}
function set(raw){current=options(raw);applyTo(document);}
function get(){return {...current};}
function preview(target,raw){
 if(!target)return;style();const o=options(raw),pattern='url("data:image/svg+xml,'+encodeURIComponent(svg(o))+'")';
 target.querySelector('.gc-watermark-overlay')?.remove();
 target.classList.add('gc-wm-host');
 if(o.watermarkEnabled){const el=document.createElement('span');el.className='gc-watermark-overlay';el.setAttribute('aria-hidden','true');el.style.backgroundImage=pattern;el.style.setProperty('--gc-wm-opacity',o.watermarkOpacity);target.appendChild(el);}
}
root.GC_WATERMARK={options,set,get,applyTo,preview,marks};
})(window);
