(function(){
'use strict';
const cfg=window.RX_SUPABASE_CONFIG||{};
let client=null;
let currentUser=null;
function configured(){return /^https:\/\/.+\.supabase\.co$/i.test(String(cfg.url||''))&&String(cfg.publishableKey||'').length>20&&!String(cfg.publishableKey).includes('PASTE_')}
function getClient(){
  if(client)return client;
  if(!configured())return null;
  if(!window.supabase?.createClient)throw new Error('No se pudo cargar el cliente de Supabase. Revisa tu conexión e intenta nuevamente.');
  client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
async function init(){
  const c=getClient(); if(!c)return {configured:false,user:null};
  const {data,error}=await c.auth.getUser();
  if(error&&error.name!=='AuthSessionMissingError')console.warn('Supabase getUser:',error.message);
  currentUser=data?.user||null;
  c.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;window.dispatchEvent(new CustomEvent('rx-cloud-auth',{detail:{user:currentUser}}));});
  return {configured:true,user:currentUser};
}
async function signIn(email,password){const c=getClient();if(!c)throw new Error('Supabase todavía no está configurado.');const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;currentUser=data.user;return currentUser}
async function signOut(){const c=getClient();if(!c)return;const {error}=await c.auth.signOut();if(error)throw error;currentUser=null}
async function user(){const c=getClient();if(!c)return null;const {data,error}=await c.auth.getUser();if(error)return null;currentUser=data.user||null;return currentUser}
async function syncProfile(vault,u){
  const c=getClient();
  const profile={...vault.profile,signature:undefined};
  let r=await c.from('profiles').upsert({user_id:u.id,profile,updated_at:new Date().toISOString()},{onConflict:'user_id'}); if(r.error)throw r.error;
  r=await c.from('physician_keys').upsert({user_id:u.id,public_jwk:vault.signing.publicJwk,fingerprint:vault.signing.keyFingerprint,active:true,updated_at:new Date().toISOString()},{onConflict:'user_id,fingerprint'}); if(r.error)throw r.error;
}
async function pullProfile(vault,u){
  const c=getClient();const {data,error}=await c.from('profiles').select('profile,updated_at').eq('user_id',u.id).maybeSingle();if(error)throw error;
  if(data?.profile){const sig=vault.profile?.signature||null;vault.profile={...vault.profile,...data.profile,signature:sig}}
}
async function pushPatients(vault,u){
  const c=getClient(); if(!vault.patients.length)return;
  const rows=vault.patients.map(p=>({user_id:u.id,id:p.id,payload:p,updated_at:p.updatedAt||p.createdAt||new Date().toISOString()}));
  const {error}=await c.from('patients').upsert(rows,{onConflict:'user_id,id'}); if(error)throw error;
}
async function pushRecipes(vault,u,canonicalFactory){
  const c=getClient();
  for(const rec of vault.recipes){
    if(!rec?.seal?.publicToken)continue;
    const canonicalText=JSON.stringify(canonicalFactory(rec));
    let r=await c.from('prescriptions').upsert({user_id:u.id,rx_id:rec.id,patient_id:rec.patient.id||null,status:rec.status||'issued',issued_at:rec.issuedAt,payload:rec,verification_token:rec.seal.publicToken,voided_at:rec.voidedAt||null,void_reason:rec.voidReason||null},{onConflict:'user_id,rx_id',ignoreDuplicates:true});
    if(r.error)throw r.error;
    if(rec.status==='void'){
      r=await c.from('prescriptions').update({status:'void',voided_at:rec.voidedAt||new Date().toISOString(),void_reason:rec.voidReason||''}).eq('user_id',u.id).eq('rx_id',rec.id);if(r.error)throw r.error;
    }
    const publicSeal={algorithm:rec.seal.algorithm,hash:rec.seal.hash,signature:rec.seal.signature,publicJwk:rec.seal.publicJwk,keyFingerprint:rec.seal.keyFingerprint,canonicalVersion:rec.seal.canonicalVersion};
    r=await c.from('prescription_verifications').upsert({token:rec.seal.publicToken,user_id:u.id,rx_id:rec.id,status:rec.status||'issued',issued_at:rec.issuedAt,canonical_text:canonicalText,seal:publicSeal,voided_at:rec.voidedAt||null,void_reason:rec.voidReason||null},{onConflict:'token',ignoreDuplicates:true});
    if(r.error)throw r.error;
    if(rec.status==='void'){
      r=await c.from('prescription_verifications').update({status:'void',voided_at:rec.voidedAt||new Date().toISOString(),void_reason:rec.voidReason||''}).eq('token',rec.seal.publicToken).eq('user_id',u.id);if(r.error)throw r.error;
    }
  }
}
async function pullPatients(vault,u){
  const c=getClient();const {data,error}=await c.from('patients').select('id,payload,updated_at').eq('user_id',u.id);if(error)throw error;
  const byId=new Map(vault.patients.map(p=>[p.id,p]));
  for(const row of data||[]){const remote=row.payload||{};const local=byId.get(row.id);const rt=Date.parse(remote.updatedAt||row.updated_at||0)||0,lt=Date.parse(local?.updatedAt||local?.createdAt||0)||0;if(!local||rt>lt){if(local)Object.assign(local,remote);else vault.patients.push(remote)}}
}
async function pullRecipes(vault,u){
  const c=getClient();const {data,error}=await c.from('prescriptions').select('rx_id,status,payload,voided_at,void_reason').eq('user_id',u.id).order('issued_at',{ascending:false});if(error)throw error;
  const byId=new Map(vault.recipes.map(r=>[r.id,r]));
  for(const row of data||[]){let local=byId.get(row.rx_id);if(!local&&row.payload){local=row.payload;vault.recipes.push(local);byId.set(row.rx_id,local)}if(local&&row.status==='void'){local.status='void';local.voidedAt=row.voided_at||local.voidedAt;local.voidReason=row.void_reason||local.voidReason||''}}
  vault.recipes.sort((a,b)=>String(b.issuedAt).localeCompare(String(a.issuedAt)));
}
async function syncVault(vault,canonicalFactory){
  if(!navigator.onLine)throw new Error('Sin conexión. Los cambios permanecen en la bóveda local y se sincronizarán después.');
  const u=await user();if(!u)throw new Error('Inicia sesión en Supabase primero.');
  // Pull first to avoid an older device overwriting newer cloud data.
  await pullProfile(vault,u);await pullPatients(vault,u);await pullRecipes(vault,u);
  await syncProfile(vault,u);await pushPatients(vault,u);await pushRecipes(vault,u,canonicalFactory);
  return {user:u};
}
async function syncRecipe(rec,vault,canonicalFactory){return syncVault(vault,canonicalFactory)}
window.RxCloud={configured,init,signIn,signOut,user,syncVault,syncRecipe,config:()=>({url:cfg.url||'',configured:configured()})};
})();
