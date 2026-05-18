// SD COMAYAGUA POS - actualizador de sistema v1.5.2
(function(){
  const VERSION = '1.5.2';
  const KEY = 'sd_pos_app_version';

  function showToast(message){
    const root = document.getElementById('toastRoot');
    if(!root) return;
    root.innerHTML = '';
    const node = document.createElement('div');
    node.className = 'toast ok';
    node.textContent = message;
    root.appendChild(node);
  }

  async function clearBrowserCache(){
    try{
      if('caches' in window){
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
      }
      localStorage.setItem(KEY, VERSION);
      sessionStorage.setItem('sd_pos_cache_cleaned', String(Date.now()));
    }catch(error){
      console.warn('No se pudo limpiar toda la cache', error);
    }
  }

  async function refreshNow(){
    const btn = document.getElementById('sdcManualUpdate');
    if(btn){
      btn.disabled = true;
      btn.textContent = 'Actualizando...';
    }
    showToast('Limpiando cache y cargando la ultima version...');
    await clearBrowserCache();
    const url = new URL(window.location.href);
    url.searchParams.set('v', VERSION + '-' + Date.now());
    window.location.replace(url.toString());
  }

  async function checkVersion(){
    try{
      const res = await fetch('version.json?v=' + Date.now(), { cache:'no-store' });
      if(!res.ok) return;
      const data = await res.json();
      const remote = String(data.version || '').trim();
      const current = localStorage.getItem(KEY);
      if(remote && current && remote !== current){
        await clearBrowserCache();
        const url = new URL(window.location.href);
        url.searchParams.set('v', remote + '-' + Date.now());
        window.location.replace(url.toString());
        return;
      }
      if(remote) localStorage.setItem(KEY, remote);
    }catch(error){
      console.warn('No se pudo revisar version', error);
    }
  }

  window.SDC_REFRESH_SYSTEM = refreshNow;
  document.addEventListener('click', function(event){
    if(event.target && event.target.id === 'sdcManualUpdate'){
      event.preventDefault();
      refreshNow();
    }
  });
  window.addEventListener('load', checkVersion);
  setInterval(checkVersion, 180000);
})();
