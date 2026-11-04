/* Gamer Comayagua · offline público. Nunca se guardan sesiones, Admin ni API de Sheets. */
const CACHE='gc-public-shell-20261104-v1',PREFIX='gc-public-shell-';
const SHELL=['offline.html','assets/img/pwa-icon.svg','assets/img/logo-rojo.webp'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
const root=new URL(self.registration.scope);
function privatePath(path){
 return /(?:^|\/)(?:admin\.html|apps-script|api|panel)(?:\/|$)/i.test(path)||
 /(?:^|\/)data\//i.test(path)||
 /(?:^|\/)(?:admin|finance|operation|account)[^/]*\.(?:js|json|html)$/i.test(path);
}
function safeStatic(path){
 return /\/assets\/(?:css|js|img)\//.test(path)&&/\.(?:js|css|png|svg|webp|jpg|jpeg)$/i.test(path);
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 let url;try{url=new URL(request.url)}catch{return;}
 if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname)||privatePath(url.pathname))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>await caches.match(new URL('offline.html',root))||Response.error()));
  return;
 }
 if(!safeStatic(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request);
  const refresh=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone()).catch(()=>{});return response;});
  if(cached){event.waitUntil(refresh.catch(()=>{}));return cached;}
  return refresh.catch(()=>Response.error());
 })());
});
