// SD COMAYAGUA POS - actualizador manual seguro v1.5.4
(function(){
  const VERSION = '1.5.4';
  let running = false;

  function toast(message){
    const root = document.getElementById('toastRoot');
    if(!root) return;
    root.innerHTML = '';
    const node = document.createElement('div');
    node.className = 'toast ok';
    node.textContent = message;
    root.appendChild(node);
    setTimeout(function(){ if(node.parentNode) node.remove(); }, 2500);
  }

  async function clearStorageCache(){
    try{
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(function(key){ return caches.delete(key); }));
      }
    }catch(error){
      console.warn('No se pudo borrar cache storage', error);
    }

    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(reg){ return reg.unregister(); }));
      }
    }catch(error){
      console.warn('No se pudo desactivar service worker', error);
    }
  }

  async function refreshSystem(){
    if(running) return;
    running = true;
    const btn = document.getElementById('sdcManualUpdate');
    if(btn){
      btn.disabled = true;
      btn.textContent = 'Actualizando...';
    }
    toast('Actualizando sistema y limpiando cache...');
    await clearStorageCache();
    try{
      localStorage.setItem('sd_pos_manual_refresh', VERSION + '-' + Date.now());
      sessionStorage.setItem('sd_pos_manual_refresh', VERSION + '-' + Date.now());
    }catch(_){ }
    const url = new URL(window.location.href);
    url.searchParams.set('v', VERSION + '-' + Date.now());
    window.location.replace(url.toString());
  }

  window.SDC_REFRESH_SYSTEM = refreshSystem;

  document.addEventListener('click', function(event){
    const btn = event.target && event.target.closest ? event.target.closest('#sdcManualUpdate') : null;
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    refreshSystem();
  }, true);
})();
