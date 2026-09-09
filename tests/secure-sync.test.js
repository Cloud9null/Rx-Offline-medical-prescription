const test=require('node:test');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
global.crypto=webcrypto;
const S=require('../secure-sync.js');

test('recovery envelope restores the same vault key and rejects a wrong code',async()=>{
  const vaultKey=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),code=S.generateRecoveryCode(),envelope=await S.createRecoveryEnvelope(vaultKey,code,'00000000-0000-4000-8000-000000000001'),restored=await S.unwrapRecoveryEnvelope(envelope,code,'00000000-0000-4000-8000-000000000001');
  assert.equal(await S.keyId(restored),await S.keyId(vaultKey));
  await assert.rejects(()=>S.unwrapRecoveryEnvelope(envelope,S.generateRecoveryCode(),'00000000-0000-4000-8000-000000000001'));
});

test('document encryption is authenticated and verifies plaintext SHA-256',async()=>{
  const vaultKey=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),metadata={id:'00000000-0000-4000-8000-000000000002',mimeType:'application/pdf'},plain=new TextEncoder().encode('synthetic-pdf-content'),envelope=await S.encryptDocument(vaultKey,plain,metadata),opened=await S.decryptDocument(vaultKey,envelope,metadata);
  assert.deepEqual(opened,plain);const altered=structuredClone(envelope);altered.plaintextSha256='tampered';await assert.rejects(()=>S.decryptDocument(vaultKey,altered,metadata));
});

test('private signing material round-trips only with the matching account and key',async()=>{
  const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),payload={format:'rx-vault-private-payload-v1',signing:{privateJwk:{d:'synthetic-secret'}}},envelope=await S.encryptSecretBundle(key,payload,'owner-a');
  assert.deepEqual(await S.decryptSecretBundle(key,envelope,'owner-a'),payload);await assert.rejects(()=>S.decryptSecretBundle(key,envelope,'owner-b'));
});
