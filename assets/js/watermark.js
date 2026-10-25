/* Marca de agua pública: solo presentación. El archivo original no se modifica. */
(function(root){'use strict';
const fonts=Object.freeze({
 arial:{label:'Actual · Arial',css:'Arial,Helvetica,sans-serif',pdf:'F2',weight:700},
 verdana:{label:'Moderna · Verdana',css:'Verdana,Geneva,sans-serif',pdf:'F3',weight:700},
 georgia:{label:'Elegante · Georgia',css:'Georgia,Times New Roman,serif',pdf:'F4',weight:700},
 times:{label:'Clásica · Times New Roman',css:'Times New Roman,Times,serif',pdf:'F5',weight:400},
 courier:{label:'Tecnológica · Courier New',css:'Courier New,Courier,monospace',pdf:'F6',weight:700},
 trebuchet:{label:'Contemporánea · Trebuchet MS',css:'Trebuchet MS,Arial,sans-serif',pdf:'F3',weight:700},
 impact:{label:'Fuerte · Impact',css:'Impact,Arial Narrow,Arial,sans-serif',pdf:'F3',weight:700}
});
const defaults={watermarkEnabled:true,watermarkText:'GAMER COMAYAGUA',watermarkOpacity:.16,watermarkFont:'arial'};
let current={...defaults};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function options(raw={}){
 const text=String(raw.watermarkText??defaults.watermarkText).trim().replace(/\s+/g,' ').slice(0,60);
 return {watermarkEnabled:raw.watermarkEnabled===undefined?defaults.watermarkEnabled:raw.watermarkEnabled===true||/^(si|sí|true|1)$/i.test(String(raw.watermarkEnabled)),watermarkText:text||defaults.watermarkText,watermarkOpacity:clamp(Number(raw.watermarkOpacity)||defaults.watermarkOpacity,.08,.30),watermarkFont:Object.hasOwn(fonts,String(raw.watermarkFont||''))?String(raw.watermarkFont):defaults.watermarkFont};
}
const xml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const marks=[[240,165],[758,165],[240,472],[758,472],[240,779],[758,779]];
function fontSize(text){return clamp(Math.floor(870/(Math.max(8,text.length)*.98)),15,48);}
function svg(raw){
 const o=options(raw),size=fontSize(o.watermarkText),face=fonts[o.watermarkFont],parts=marks.map(([x,y])=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" transform="rotate(-27 '+x+' '+y+')">'+xml(o.watermarkText)+'</text>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000"><g font-family="'+face.css+'" font-size="'+size+'" font-weight="'+face.weight+'" fill="#ffffff">'+parts+'</g></svg>';
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
function openLightbox(source,alt){
 const previous=document.activeElement,dialog=document.createElement('div');dialog.className='gc-wm-lightbox';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Vista ampliada del producto');
 dialog.style.cssText='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:56px 18px 24px;background:rgba(6,15,25,.94)';
 const frame=document.createElement('div');frame.style.cssText='position:relative;max-width:min(1050px,95vw);max-height:80vh;display:grid;place-items:center;background:#fff;border-radius:12px;overflow:hidden';
 const img=document.createElement('img');img.src=source;img.alt=alt||'Foto ampliada';img.style.cssText='display:block;max-height:80vh;max-width:95vw;width:auto;height:auto;object-fit:contain';
 frame.appendChild(img);dialog.appendChild(frame);preview(frame,current);
 const close=document.createElement('button');close.type='button';close.textContent='Cerrar ×';close.style.cssText='position:absolute;right:18px;top:13px;padding:10px 16px;border:1px solid #617086;border-radius:8px;background:#fff;color:#182d44;font:600 14px Arial;cursor:pointer';
 dialog.appendChild(close);const dismiss=()=>{dialog.remove();document.removeEventListener('keydown',key);previous?.focus?.();};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();dismiss();}};document.addEventListener('keydown',key);close.onclick=dismiss;dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss();});
 document.body.appendChild(dialog);close.focus();
}
root.GC_WATERMARK={options,set,get,applyTo,preview,openLightbox,marks,fonts};
})(window);
