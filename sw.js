const V='20261027-2005';
const SHELL='piezas-shell-'+V;
const DATA='piezas-data-v1';
const FB=['https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png',...FB])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('piezas-shell-')&&k!==SHELL)||(k.startsWith('piezas-data-')&&k!==DATA)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  const same=u.origin===location.origin;const fb=u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/');
  if(!same&&!fb)return;
  // la página principal: primero red (para tomar versiones nuevas), si no hay señal, caché
  if(same&&(u.pathname.endsWith('/')||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/data.json'))){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(u.pathname.endsWith('/data.json')?DATA:SHELL).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok&&(fb||/\/(p|d)\/\d+\.json$|data\.json$/.test(u.pathname))){const cp=res.clone();caches.open(fb?SHELL:DATA).then(c=>c.put(r,cp))}return res})))});
