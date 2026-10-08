(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ClinovyraRuntime=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const PUBLIC_ORIGIN='https://rx-offline-medical-prescription.vercel.app';
  const LOCAL_PROTOCOLS=new Set(['capacitor:','app:']);
  function nativeOrigin(location=root.location){
    if(!location)return false;
    return LOCAL_PROTOCOLS.has(location.protocol)||location.origin==='https://localhost'&&Boolean(root.Capacitor?.isNativePlatform?.());
  }
  function publicVerifierUrl(token,location=root.location){
    const base=nativeOrigin(location)?PUBLIC_ORIGIN:(location?.origin||PUBLIC_ORIGIN);
    const url=new URL('/verify.html',base);url.hash=token;return url.toString();
  }
  function clinicalApiUrl(location=root.location){return nativeOrigin(location)?`${PUBLIC_ORIGIN}/api/clinical-note`:'/api/clinical-note'}
  return Object.freeze({PUBLIC_ORIGIN,nativeOrigin,publicVerifierUrl,clinicalApiUrl});
});
