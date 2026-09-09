const CACHE='rx-offline-emr-v3-20260909-04';
const CORE=['./','./index.html','./styles.css','./emr.css','./app.js','./emr-core.js','./emr.js','./cloud.js','./secure-sync.js','./clinical-assistant.js','./supabase-config.js','./qr.js','./verify.html','./verify.js','./manifest.webmanifest'];
const OPTIONAL=['./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(CORE);await Promise.allSettled(OPTIONAL.map(x=>c.add(x)))}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(resp=>{
    const copy=resp.clone();
    if(resp.ok)caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return resp;
  }).catch(()=>{
    if(e.request.mode==='navigate')return caches.match('./index.html');
    throw new Error('offline');
  })));
});
