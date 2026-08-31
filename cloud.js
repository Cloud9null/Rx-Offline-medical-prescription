(function(){
'use strict';
const cfg=window.RX_SUPABASE_CONFIG||{};
const SESSION_KEY='rxOfflineSupabaseSessionV1';
let currentUser=null;
let session=null;
function configured(){return /^https:\/\/.+\.supabase\.co$/i.test(String(cfg.url||''))&&String(cfg.publishableKey||'').length>20&&!String(cfg.publishableKey).includes('PASTE_')}
function base(){return String(cfg.url||'').replace(/\/$/,'')}
function emitAuth(){window.dispatchEvent(new CustomEvent('rx-cloud-auth',{detail:{user:currentUser}}))}
function loadStoredSession(){try{const x=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');if(x?.access_token&&x?.refresh_token)return x}catch{}return null}
function saveSession(s){session=s||null;currentUser=s?.user||null;try{if(s)localStorage.setItem(SESSION_KEY,JSON.stringify(s));else localStorage.removeItem(SESSION_KEY)}catch{}emitAuth()}
function apiHeaders(accessToken=null,extra={}){const h={'apikey':cfg.publishableKey,'Accept':'application/json',...extra};if(accessToken)h.Authorization='Bearer '+accessToken;return h}
async function parseResponse(r){const text=await r.text();let body=null;if(text){try{body=JSON.parse(text)}catch{body=text}}if(!r.ok){const detail=body?.details||body?.hint||body?.message||body?.msg||body?.error_description||body?.error||`HTTP ${r.status}`;const code=body?.code?` [${body.code}]`:'';const e=new Error(`${detail}${code}`);e.status=r.status;e.body=body;throw e}return body}
async function request(url,options={}){try{return await parseResponse(await fetch(url,options))}catch(err){if(err instanceof TypeError){let endpoint='Supabase';try{endpoint=new URL(url).pathname}catch{}throw new Error(`No se pudo alcanzar ${endpoint}. La bóveda local sigue funcionando.`)}throw err}}
async function refreshSession(){if(!session?.refresh_token)throw new Error('La sesión de Supabase expiró. Inicia sesión otra vez.');const data=await request(base()+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:apiHeaders(null,{'Content-Type':'application/json'}),body:JSON.stringify({refresh_token:session.refresh_token})});const next={...data,expires_at:Date.now()+Number(data.expires_in||3600)*1000};saveSession(next);return next}
async function ensureSession(){if(!session)session=loadStoredSession();if(!session)return null;currentUser=session.user||currentUser;const exp=Number(session.expires_at||0);if(exp&&Date.now()>exp-60000){try{await refreshSession()}catch(err){if(!navigator.onLine)return session;saveSession(null);throw err}}return session}
async function accessToken(){const s=await ensureSession();return s?.access_token||null}
async function authUser(){const token=await accessToken();if(!token)return null;try{const u=await request(base()+'/auth/v1/user',{headers:apiHeaders(token)});currentUser=u||null;if(session&&u){session.user=u;saveSession(session)}return currentUser}catch(err){if(err.status===401&&session?.refresh_token){await refreshSession();return authUser()}throw err}}
async function init(){if(!configured())return {configured:false,user:null};session=loadStoredSession();currentUser=session?.user||null;if(session&&navigator.onLine){try{await authUser()}catch(err){console.warn('Supabase session:',err.message)}}return {configured:true,user:currentUser}}
async function signIn(email,password){if(!configured())throw new Error('Supabase todavía no está configurado.');const data=await request(base()+'/auth/v1/token?grant_type=password',{method:'POST',headers:apiHeaders(null,{'Content-Type':'application/json'}),body:JSON.stringify({email,password})});if(!data?.access_token)throw new Error('Supabase no devolvió una sesión válida.');data.expires_at=Date.now()+Number(data.expires_in||3600)*1000;saveSession(data);return currentUser}
async function signOut(){const token=await accessToken();if(token&&navigator.onLine){try{await request(base()+'/auth/v1/logout',{method:'POST',headers:apiHeaders(token)})}catch{}}saveSession(null)}
async function user(){if(!configured())return null;if(!session)session=loadStoredSession();if(!session)return null;if(!navigator.onLine){currentUser=session.user||null;return currentUser}return authUser()}
async function rpc(name,params={},requireAuth=true){let token=requireAuth?await accessToken():null;if(requireAuth&&!token)throw new Error('Inicia sesión en Supabase primero.');const doCall=t=>request(base()+'/rest/v1/rpc/'+encodeURIComponent(name),{method:'POST',headers:apiHeaders(t,{'Content-Type':'application/json'}),body:JSON.stringify(params)});try{return await doCall(token)}catch(err){if(requireAuth&&err.status===401&&session?.refresh_token){await refreshSession();token=await accessToken();return doCall(token)}throw err}}
function stripProfile(vault){const profile={...(vault.profile||{})};delete profile.signature;return profile}
function localPatientTime(p){return Date.parse(p?.updatedAt||p?.createdAt||0)||0}
function mergeBundle(vault,bundle){
  if(bundle?.profile){const sig=vault.profile?.signature||null;vault.profile={...vault.profile,...bundle.profile,signature:sig}}
  const byPatient=new Map((vault.patients||[]).map(p=>[p.id,p]));
  for(const remote of bundle?.patients||[]){if(!remote?.id)continue;const local=byPatient.get(remote.id);if(!local){vault.patients.push(remote);byPatient.set(remote.id,remote)}else if(localPatientTime(remote)>localPatientTime(local)){Object.assign(local,remote)}}
  const byRecipe=new Map((vault.recipes||[]).map(r=>[r.id,r]));
  for(const remote of bundle?.recipes||[]){if(!remote?.id)continue;let local=byRecipe.get(remote.id);if(!local){local=remote;vault.recipes.push(local);byRecipe.set(remote.id,local)}else if(remote.status==='void'){local.status='void';local.voidedAt=remote.voidedAt||local.voidedAt;local.voidReason=remote.voidReason||local.voidReason||''}if(local?.seal?.publicToken)local.seal.cloudRegistered=true}
  vault.recipes.sort((a,b)=>String(b.issuedAt||'').localeCompare(String(a.issuedAt||'')));
}
async function healthcheck(){const u=await user();if(!u)throw new Error('Inicia sesión en Supabase primero.');const data=await rpc('rx_cloud_healthcheck',{},true);if(!data?.ok)throw new Error('El backend respondió, pero la sesión no quedó autenticada.');return data}
async function syncVault(vault,canonicalFactory){
  if(!navigator.onLine)throw new Error('Sin conexión. Los cambios permanecen en la bóveda local.');
  const u=await user();if(!u)throw new Error('Inicia sesión en Supabase primero.');
  try{await healthcheck()}catch(err){throw new Error(`Backend Supabase: ${err.message}. Si ves “function not found”, ejecuta FINAL_REPAIR_AND_SYNC_V2_3_4.sql en SQL Editor.`)}
  const recipes=(vault.recipes||[]).filter(r=>r?.seal?.publicToken).map(rec=>({rec,canonical_text:JSON.stringify(canonicalFactory(rec))}));
  const params={
    p_profile:stripProfile(vault),
    p_public_jwk:vault.signing?.publicJwk||{},
    p_fingerprint:vault.signing?.keyFingerprint||'',
    p_patients:vault.patients||[],
    p_recipes:recipes
  };
  let bundle;
  try{bundle=await rpc('rx_sync_bundle',params,true)}catch(err){throw new Error(`Sincronización RPC: ${err.message}`)}
  if(!bundle?.ok)throw new Error('Supabase respondió sin confirmar la sincronización.');
  mergeBundle(vault,bundle);
  return {user:u,bundle};
}
async function syncRecipe(rec,vault,canonicalFactory){return syncVault(vault,canonicalFactory)}
window.RxCloud={configured,init,signIn,signOut,user,healthcheck,syncVault,syncRecipe,config:()=>({url:cfg.url||'',configured:configured()})};
})();
