const CACHE='clinovyra-emr-v3-20261010-10';
const CORE=['./','./index.html','./styles.css','./emr.css','./app.js','./runtime.js','./product-policy.js','./native-print.js','./native-biometric.js','./emr-core.js','./emr.js','./cloud.js','./secure-sync.js','./clinical-assistant.js','./quick-note.js','./supabase-config.js','./qr.js','./manual-pdf.js','./verify.html','./verify.js','./manifest.webmanifest'];
const OPTIONAL=['./icons/clinovyra.png','./assets/clinovyra-brand.jpeg'];
const STATIC_PATHS=new Set([...CORE,...OPTIONAL].map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(CORE);await Promise.allSettled(OPTIONAL.map(x=>c.add(x)))}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('clinovyra-emr-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||!STATIC_PATHS.has(url.pathname))return;
  // The shell can work offline; API, verification and clinical responses must never enter Cache Storage.
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match(url.pathname===new URL('./',self.registration.scope).pathname?'./index.html':e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(resp=>{
    const copy=resp.clone();
    if(resp.ok&&resp.type==='basic')caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return resp;
  })));
});

