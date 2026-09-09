(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RxSecureSync=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const webcrypto=globalThis.crypto||(typeof require==='function'?require('node:crypto').webcrypto:null);
  if(!webcrypto?.subtle)throw new Error('WebCrypto no está disponible.');
  const subtle=webcrypto.subtle,enc=new TextEncoder(),dec=new TextDecoder();
  const CryptoKeyClass=globalThis.CryptoKey||webcrypto.CryptoKey;
  const RECOVERY_ITERATIONS=600000;
  const FORMAT={document:'rx-e2ee-document-v1',recovery:'rx-vault-recovery-v1',secret:'rx-vault-secret-v1'};

  function randomBytes(length){const out=new Uint8Array(length);webcrypto.getRandomValues(out);return out}
  function bytes(value){if(value instanceof Uint8Array)return value;if(value instanceof ArrayBuffer)return new Uint8Array(value);return enc.encode(String(value??''))}
  function toBase64(value){let binary='';for(const b of bytes(value))binary+=String.fromCharCode(b);return btoa(binary)}
  function fromBase64(value){const binary=atob(String(value||'')),out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out}
  function toBase64Url(value){return toBase64(value).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  async function sha256(value){return new Uint8Array(await subtle.digest('SHA-256',bytes(value)))}
  async function importAesKey(value,extractable=false){if(CryptoKeyClass&&value instanceof CryptoKeyClass)return value;return subtle.importKey('raw',bytes(value),{name:'AES-GCM'},extractable,['encrypt','decrypt'])}
  async function keyId(key){const raw=CryptoKeyClass&&key instanceof CryptoKeyClass?new Uint8Array(await subtle.exportKey('raw',key)):bytes(key);return toBase64Url(await sha256(raw))}
  async function aesEncrypt(key,value,aad){const iv=randomBytes(12),cryptoKey=await importAesKey(key);const data=await subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad)},cryptoKey,bytes(value));return {iv:toBase64(iv),data:toBase64(data)}}
  async function aesDecrypt(key,box,aad){const cryptoKey=await importAesKey(key);return new Uint8Array(await subtle.decrypt({name:'AES-GCM',iv:fromBase64(box.iv),additionalData:enc.encode(aad)},cryptoKey,fromBase64(box.data)))}

  function normalizeRecoveryCode(value){return String(value||'').toUpperCase().replace(/[^A-Z2-7]/g,'')}
  function generateRecoveryCode(){
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',source=randomBytes(32);let bits=0,value=0,out='';
    for(const byte of source){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5}}
    if(bits)out+=alphabet[(value<<(5-bits))&31];
    return out.match(/.{1,4}/g).join('-');
  }
  async function deriveRecoveryKey(code,salt,iterations=RECOVERY_ITERATIONS){
    const normalized=normalizeRecoveryCode(code);if(normalized.length<40)throw new Error('El código de recuperación es incompleto.');
    const base=await subtle.importKey('raw',enc.encode(normalized),'PBKDF2',false,['deriveKey']);
    return subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations:Number(iterations)},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function createRecoveryEnvelope(vaultKey,recoveryCode,userId){
    const raw=new Uint8Array(await subtle.exportKey('raw',vaultKey)),id=await keyId(raw),salt=randomBytes(16),aad=`rx-offline-recovery:${userId}:${id}`,derived=await deriveRecoveryKey(recoveryCode,salt),box=await aesEncrypt(derived,raw,aad);
    return {format:FORMAT.recovery,version:1,keyId:id,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:RECOVERY_ITERATIONS,salt:toBase64(salt)},cipher:{name:'AES-GCM',iv:box.iv,data:box.data,aad},createdAt:new Date().toISOString()};
  }
  async function unwrapRecoveryEnvelope(envelope,recoveryCode,userId){
    if(envelope?.format!==FORMAT.recovery||!envelope?.keyId)throw new Error('El paquete de recuperación no es compatible.');
    const aad=`rx-offline-recovery:${userId}:${envelope.keyId}`;if(envelope.cipher?.aad!==aad)throw new Error('El paquete no pertenece a esta cuenta.');
    const derived=await deriveRecoveryKey(recoveryCode,fromBase64(envelope.kdf.salt),envelope.kdf.iterations),raw=await aesDecrypt(derived,envelope.cipher,aad);
    if(await keyId(raw)!==envelope.keyId)throw new Error('El código de recuperación no coincide.');
    return subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);
  }
  async function encryptSecretBundle(vaultKey,payload,userId){
    const id=await keyId(vaultKey),aad=`rx-offline-secret:${userId}:${id}`,box=await aesEncrypt(vaultKey,enc.encode(JSON.stringify(payload)),aad);
    return {format:FORMAT.secret,version:1,keyId:id,cipher:{name:'AES-GCM',iv:box.iv,data:box.data,aad},updatedAt:new Date().toISOString()};
  }
  async function decryptSecretBundle(vaultKey,envelope,userId){
    if(envelope?.format!==FORMAT.secret)throw new Error('El respaldo privado de la bóveda no es compatible.');
    const id=await keyId(vaultKey),aad=`rx-offline-secret:${userId}:${id}`;if(envelope.keyId!==id||envelope.cipher?.aad!==aad)throw new Error('La llave recuperada no abre el respaldo privado.');
    return JSON.parse(dec.decode(await aesDecrypt(vaultKey,envelope.cipher,aad)));
  }
  async function encryptDocument(vaultKey,plainBytes,metadata){
    const plain=bytes(plainBytes),digest=toBase64Url(await sha256(plain)),aad=`rx-offline-document:${metadata.id}:${metadata.mimeType}:${digest}`,box=await aesEncrypt(vaultKey,plain,aad);
    return {format:FORMAT.document,version:1,keyId:await keyId(vaultKey),plaintextSha256:digest,cipher:{name:'AES-GCM',iv:box.iv,data:box.data,aad}};
  }
  async function decryptDocument(vaultKey,envelope,metadata){
    if(envelope?.format!==FORMAT.document)throw new Error('Documento cifrado incompatible.');
    if(envelope.keyId!==await keyId(vaultKey))throw new Error('Este documento requiere la llave original de la bóveda.');
    const aad=`rx-offline-document:${metadata.id}:${metadata.mimeType}:${envelope.plaintextSha256}`;if(envelope.cipher?.aad!==aad)throw new Error('Los metadatos del documento no coinciden.');
    const plain=await aesDecrypt(vaultKey,envelope.cipher,aad);if(toBase64Url(await sha256(plain))!==envelope.plaintextSha256)throw new Error('Falló la verificación SHA-256 del documento.');return plain;
  }

  return {FORMAT,RECOVERY_ITERATIONS,generateRecoveryCode,normalizeRecoveryCode,keyId,createRecoveryEnvelope,unwrapRecoveryEnvelope,encryptSecretBundle,decryptSecretBundle,encryptDocument,decryptDocument,toBase64,fromBase64};
});
