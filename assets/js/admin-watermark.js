/* Preferencias globales de marca de agua, protegidas por PIN de ADMIN. */
(function(){'use strict';
const $=id=>document.getElementById(id),W=()=>window.GC_WATERMARK,api=()=>window.GC_ADMIN;
let dirty=false,loaded=false,saving=false;
function init(){
 const summary=$('settingsSummary');if(!summary||$('gcWmForm'))return;
 summary.insertAdjacentHTML('afterend',`
 <form id="gcWmForm" class="gc-wm-panel" autocomplete="off">
  <div class="gc-wm-head"><div><h3>Marca de agua de las fotografías</h3><p>Se aplica automáticamente a todos los productos y a los catálogos PNG/PDF. Las fotos originales se conservan.</p></div><label class="gc-wm-toggle"><input id="gcWmEnabled" type="checkbox" checked><span>Activada</span></label></div>
  <div class="gc-wm-fields">
   <label>Texto para marca de agua<input class="field" id="gcWmText" type="text" maxlength="60" value="GAMER COMAYAGUA" required placeholder="Ej. GAMER COMAYAGUA"></label>
   <label>Tipografía de marca de agua<select id="gcWmFont" class="field" aria-label="Tipografía de la marca de agua">${Object.entries(W()?.fonts||{}).map(([key,item])=>`<option value="${key}">${item.label}</option>`).join('')}</select></label>
   <label>Transparencia · <output id="gcWmValue">16%</output><input id="gcWmOpacity" type="range" min="0" max="100" step="1" value="16" aria-label="Opacidad de la marca del 0 al 100 por ciento"></label>
   <label>Tamaño de letra (px)<input class="field" id="gcWmFontSize" type="number" min="0" max="1200" step="1" value="48" inputmode="numeric" aria-label="Tamaño de letra en píxeles, de 0 a 1200"></label>
   <label>Cantidad por fotografía<input class="field" id="gcWmCount" type="number" min="0" max="100" step="1" value="6" inputmode="numeric" aria-label="Cantidad de marcas por fotografía, de 0 a 100"></label>
  </div>
  <div class="gc-wm-live-title"><strong>Vista previa en tiempo real</strong><span>Los cambios se muestran sin guardar · 0% es invisible</span></div>
  <div class="gc-wm-preview" id="gcWmPreview" aria-label="Vista previa sobre fondo claro y oscuro"><div class="gc-wm-sample gc-wm-light" id="gcWmPreviewLight"><span>Fondo claro</span></div><div class="gc-wm-sample gc-wm-dark" id="gcWmPreviewDark"><span>Fondo oscuro</span></div></div>
  <p class="gc-wm-preview-description" id="gcWmLiveDescription" aria-live="off">6 marcas · 48 px · 16% de opacidad</p>
  <p class="gc-wm-note" id="gcWmStatus" role="status">Esta opción se sincroniza con Google Sheets mediante Apps Script.</p>
  <button class="btn" type="submit" id="gcWmSave">Guardar marca de agua</button>
 </form>`);
 const css=document.createElement('style');css.textContent=`
 .gc-wm-panel{margin:18px 0 23px;padding:20px;border:1px solid #dbe5ee;border-radius:14px;background:#f8fafc}
 .gc-wm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.gc-wm-head h3{margin:0 0 7px;color:#142b43;font-size:19px}.gc-wm-head p,.gc-wm-note{margin:0 0 14px;font-size:12px;line-height:1.6;color:#66788b}
 .gc-wm-toggle{display:flex;align-items:center;gap:8px;white-space:nowrap;font-weight:700;font-size:13px;color:#243f57}.gc-wm-toggle input{width:19px;height:19px;accent-color:#245d9d}
 .gc-wm-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:16px 0}.gc-wm-fields label{display:grid;gap:8px;font-weight:650;font-size:12px;color:#385069}.gc-wm-fields output{display:inline;color:#26668e;font-weight:700}.gc-wm-fields input[type=range]{accent-color:#245d9d;width:100%}
 .gc-wm-live-title{display:flex;gap:8px;align-items:baseline;justify-content:space-between;margin:22px 0 10px;color:#142b43;font-size:13px}.gc-wm-live-title span,.gc-wm-preview-description{font-size:12px;font-weight:400;color:#687b8d}
 .gc-wm-preview{display:flex;justify-content:center;gap:14px;align-items:stretch;padding:14px;border-radius:12px;background:#e9eef5}
 .gc-wm-sample{width:min(100%,300px);aspect-ratio:1/1;flex:0 1 300px;position:relative;display:grid;place-items:center;overflow:hidden;border:1px solid #d2dbe6;border-radius:10px;isolation:isolate}
 .gc-wm-light{background:radial-gradient(circle at 53% 43%,#ffffff 0 17%,#e1eaf5 18% 28%,#fafbfe 29% 100%);color:#51687d}
 .gc-wm-dark{background:radial-gradient(circle at 47% 52%,#34475f 0 18%,#111d2c 19% 100%);color:#e1e9f5}
 .gc-wm-sample>span:first-child{font-size:12px;font-weight:700;z-index:0;opacity:.55}
 .gc-wm-preview-description{margin:8px 0 12px;text-align:center}
 .gc-wm-note{margin:12px 0}.gc-wm-panel .btn{min-height:43px}
 @media(max-width:750px){.gc-wm-panel{padding:14px}.gc-wm-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.gc-wm-head{flex-direction:column;gap:6px}.gc-wm-preview{gap:8px;padding:8px}.gc-wm-live-title{flex-direction:column;gap:4px}.gc-wm-panel .btn{width:100%}}@media(max-width:420px){.gc-wm-fields{grid-template-columns:1fr}.gc-wm-sample{min-width:0}}
 `;
 document.head.appendChild(css);
 const form=$('gcWmForm');form.addEventListener('input',()=>{dirty=true;preview();});
 form.addEventListener('change',()=>{dirty=true;preview();});
 form.addEventListener('submit',save);
 document.addEventListener('gc:catalog',refresh);
 refresh();
}
function values(){return {watermarkEnabled:$('gcWmEnabled').checked,watermarkText:$('gcWmText').value.trim().replace(/\s+/g,' '),watermarkOpacity:Number($('gcWmOpacity').value)/100,watermarkFont:$('gcWmFont').value,watermarkFontSize:Number($('gcWmFontSize').value),watermarkCount:Number($('gcWmCount').value)};}
function preview(){
 if(!$('gcWmForm'))return;
 $('gcWmValue').textContent=$('gcWmOpacity').value+'%';
 const v=values(),wm=W();if(!wm)return;
 wm.preview($('gcWmPreviewLight'),v);wm.preview($('gcWmPreviewDark'),v);
 $('gcWmLiveDescription').textContent=v.watermarkCount+' marca'+(v.watermarkCount===1?'':'s')+' · '+v.watermarkFontSize+' px · '+Math.round(v.watermarkOpacity*100)+'% de opacidad · '+($('gcWmFont').selectedOptions[0]?.textContent||'Arial');
}
function refresh(){
 if(!$('gcWmForm')||!api())return;
 const s=api().settings(),feature=api().features()?.watermarkSettings===true;
 if(!dirty||!loaded){$('gcWmEnabled').checked=s.watermarkEnabled!==false;$('gcWmText').value=s.watermarkText||'GAMER COMAYAGUA';$('gcWmFont').value=W()?.fonts?.[s.watermarkFont]?s.watermarkFont:'arial';$('gcWmOpacity').value=Math.round(Number(s.watermarkOpacity??.16)*100);$('gcWmFontSize').value=Number(s.watermarkFontSize??48);$('gcWmCount').value=Number(s.watermarkCount??6);loaded=true;dirty=false;preview();}
 $('gcWmStatus').innerHTML=feature?'Los cambios se guardan para todos los visitantes.':'La tienda muestra GAMER COMAYAGUA. Para guardar otro texto para todos, instalá la versión nueva de Code.gs en Apps Script y publicá Nueva versión en tu implementación /exec. <a href="https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs" target="_blank" rel="noopener noreferrer">Abrir Code.gs actualizado ↗</a>';
 $('gcWmSave').disabled=saving||!feature;
}
async function save(event){
 event.preventDefault();
 const value=values();if(!value.watermarkText||value.watermarkText.length>60){$('gcWmStatus').textContent='Ingresá un texto de 1 a 60 caracteres.';return;}
 if(!Number.isInteger(value.watermarkFontSize)||value.watermarkFontSize<0||value.watermarkFontSize>1200||!Number.isInteger(value.watermarkCount)||value.watermarkCount<0||value.watermarkCount>100){$('gcWmStatus').textContent='Elegí un tamaño de 0 a 1200 px y entre 0 y 100 marcas.';return;}
 if(api().features()?.watermarkSettings!==true){refresh();return;}
 saving=true;$('gcWmSave').disabled=true;$('gcWmStatus').textContent='Guardando marca de agua en Google Sheets…';
 try{
  const answer=await api().request('saveWatermarkSettings',{watermark:value});
  if(answer.ok===false)throw Error(answer.error||'No fue posible guardar.');
  dirty=false;loaded=false;W()?.set(answer.settings||value);api().notify();await api().reload();
  $('gcWmStatus').textContent='✓ Marca de agua guardada para todos los visitantes.';
  api().toast('Marca de agua actualizada.');
 }catch(error){$('gcWmStatus').textContent='No se pudo guardar: '+error.message;api().toast('No se guardó la marca de agua.');}
 finally{saving=false;$('gcWmSave').disabled=false;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
