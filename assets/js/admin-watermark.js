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
   <label>Transparencia <output id="gcWmValue">16%</output><input id="gcWmOpacity" type="range" min="8" max="30" step="1" value="16"></label>
  </div>
  <div class="gc-wm-preview" id="gcWmPreview"><div class="gc-wm-preview-center"><strong>GAMER COMAYAGUA</strong><span>Vista previa de la marca de agua</span></div></div>
  <p class="gc-wm-note" id="gcWmStatus" role="status">Esta opción se sincroniza con Google Sheets mediante Apps Script.</p>
  <button class="btn" type="submit" id="gcWmSave">Guardar marca de agua</button>
 </form>`);
 const css=document.createElement('style');css.textContent=`
 .gc-wm-panel{margin:18px 0 23px;padding:20px;border:1px solid #dbe5ee;border-radius:14px;background:#f8fafc}
 .gc-wm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.gc-wm-head h3{margin:0 0 7px;color:#142b43;font-size:19px}.gc-wm-head p,.gc-wm-note{margin:0 0 14px;font-size:12px;line-height:1.6;color:#66788b}
 .gc-wm-toggle{display:flex;align-items:center;gap:8px;white-space:nowrap;font-weight:700;font-size:13px;color:#243f57}.gc-wm-toggle input{width:19px;height:19px;accent-color:#245d9d}
 .gc-wm-fields{display:grid;grid-template-columns:1fr 200px;gap:14px;margin:16px 0}.gc-wm-fields label{display:grid;gap:8px;font-weight:650;font-size:12px;color:#385069}.gc-wm-fields output{display:inline;color:#26668e;font-weight:700}.gc-wm-fields input[type=range]{accent-color:#245d9d;width:100%}
 .gc-wm-preview{height:190px;background:linear-gradient(110deg,#eef3fa 0 49%,#172331 50% 100%);border-radius:12px;display:grid;place-items:center;overflow:hidden}
 .gc-wm-preview-center{display:grid;place-items:center;text-align:center;gap:6px;color:#1b3047;background:#ffffffdb;padding:12px;border-radius:9px}.gc-wm-preview-center strong{font-size:18px}.gc-wm-preview-center span{font-size:11px}
 .gc-wm-note{margin:12px 0}.gc-wm-panel .btn{min-height:43px}
 @media(max-width:620px){.gc-wm-panel{padding:14px}.gc-wm-fields{grid-template-columns:1fr}.gc-wm-head{flex-direction:column;gap:6px}.gc-wm-preview{height:160px}.gc-wm-panel .btn{width:100%}}
 `;
 document.head.appendChild(css);
 const form=$('gcWmForm');form.addEventListener('input',()=>{dirty=true;preview();});
 form.addEventListener('change',()=>{dirty=true;preview();});
 form.addEventListener('submit',save);
 document.addEventListener('gc:catalog',refresh);
 refresh();
}
function values(){return {watermarkEnabled:$('gcWmEnabled').checked,watermarkText:$('gcWmText').value.trim().replace(/\s+/g,' '),watermarkOpacity:Number($('gcWmOpacity').value)/100};}
function preview(){
 if(!$('gcWmForm'))return;
 $('gcWmValue').textContent=$('gcWmOpacity').value+'%';
 W()?.preview($('gcWmPreview'),values());
}
function refresh(){
 if(!$('gcWmForm')||!api())return;
 const s=api().settings(),feature=api().features()?.watermarkSettings===true;
 if(!dirty||!loaded){$('gcWmEnabled').checked=s.watermarkEnabled!==false;$('gcWmText').value=s.watermarkText||'GAMER COMAYAGUA';$('gcWmOpacity').value=Math.round((Number(s.watermarkOpacity)||.16)*100);loaded=true;dirty=false;preview();}
 $('gcWmStatus').innerHTML=feature?'Los cambios se guardan para todos los visitantes.':'La tienda muestra GAMER COMAYAGUA. Para guardar otro texto para todos, instalá la versión nueva de Code.gs en Apps Script y publicá Nueva versión en tu implementación /exec. <a href="https://github.com/sdcomayagua/sdcomayagua/blob/main/apps-script/Code.gs" target="_blank" rel="noopener noreferrer">Abrir Code.gs actualizado ↗</a>';
 $('gcWmSave').disabled=saving||!feature;
}
async function save(event){
 event.preventDefault();
 const value=values();if(!value.watermarkText||value.watermarkText.length>60){$('gcWmStatus').textContent='Ingresá un texto de 1 a 60 caracteres.';return;}
 if(api().features()?.watermarkSettings!==true){refresh();return;}
 saving=true;$('gcWmSave').disabled=true;$('gcWmStatus').textContent='Guardando marca de agua en Google Sheets…';
 try{
  const answer=await api().request('saveWatermarkSettings',{watermark:value});
  if(answer.ok===false)throw Error(answer.error||'No fue posible guardar.');
  dirty=false;loaded=false;W()?.set(answer.settings||value);api().notify();
  $('gcWmStatus').textContent='✓ Marca de agua guardada para todos los visitantes.';
  api().toast('Marca de agua actualizada.');
 }catch(error){$('gcWmStatus').textContent='No se pudo guardar: '+error.message;api().toast('No se guardó la marca de agua.');}
 finally{saving=false;$('gcWmSave').disabled=false;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
