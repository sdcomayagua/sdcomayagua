(function(){'use strict';
 if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
 window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});});
 let prompt=null;
 window.addEventListener('beforeinstallprompt',event=>{
  const button=document.getElementById('installApp');
  if(!button)return;
  event.preventDefault();prompt=event;button.hidden=false;
 });
 document.addEventListener('click',async event=>{
  const button=event.target.closest?.('#installApp');
  if(!button||!prompt)return;
  button.disabled=true;const current=prompt;prompt=null;
  try{await current.prompt();await current.userChoice;}catch{}
  button.hidden=true;button.disabled=false;
 });
 window.addEventListener('appinstalled',()=>{const button=document.getElementById('installApp');if(button)button.hidden=true;prompt=null;});
})();
