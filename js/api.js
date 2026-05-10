/* Cliente simple para Google Apps Script · compatible con varios formatos de endpoint. */
(function(){
  function cfg(){ return window.SDC_CONFIG || {}; }
  function cleanUrl(){ return String(cfg().appsScriptUrl || '').trim().replace(/\s+/g,''); }
  function ready(){ return /^https:\/\/script\.google\.com\/macros\/s\//i.test(cleanUrl()); }
  function withParams(params){
    const base = cleanUrl();
    const url = new URL(base);
    Object.entries(params || {}).forEach(([k,v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') url.searchParams.set(k, String(v));
    });
    const key = cfg().apiKey;
    if (key) url.searchParams.set('apiKey', key);
    url.searchParams.set('_', Date.now());
    return url.toString();
  }
  async function parseResponse(res){
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch(e){ throw new Error('Apps Script no devolvió JSON válido. Respuesta: ' + text.slice(0, 160)); }
    if (!res.ok || data.ok === false || data.success === false) throw new Error(data.message || data.error || ('Error HTTP ' + res.status));
    return data;
  }
  async function get(mode){
    if (!ready()) throw new Error('URL de Apps Script inválida.');
    const aliases = mode === 'products' ? ['productos','products'] : [mode || 'all'];
    let lastError;
    for (const alias of aliases) {
      try{
        const res = await fetch(withParams({ only:alias, resource:alias, action:'get' }), { method:'GET', cache:'no-store' });
        return await parseResponse(res);
      }catch(e){ lastError = e; }
    }
    throw lastError || new Error('No se pudo consultar Apps Script.');
  }
  async function post(action, payload){
    if (!ready()) throw new Error('URL de Apps Script inválida.');
    const body = { action, apiKey:cfg().apiKey || '', ...(payload || {}) };
    const res = await fetch(withParams({ action }), {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(body)
    });
    return parseResponse(res);
  }
  async function test(){
    if (!ready()) throw new Error('URL de Apps Script inválida.');
    try { return await get('ping'); }
    catch(e){ return await get('all'); }
  }
  window.SDCApi = { ready, get, post, test };
})();
