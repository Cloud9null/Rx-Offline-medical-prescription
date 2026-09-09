(function(){
'use strict';
const cfg=window.RX_SUPABASE_CONFIG||{};
const SESSION_KEY='rxOfflineSupabaseSessionV1';
const PRIVATE_BUCKET='rx-emr-private-v1';
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
function encodePath(path){return String(path||'').split('/').map(encodeURIComponent).join('/')}
async function storagePut(path,value,{upsert=false}={}){const token=await accessToken();if(!token)throw new Error('Inicia sesión en Supabase primero.');return request(`${base()}/storage/v1/object/${PRIVATE_BUCKET}/${encodePath(path)}`,{method:'POST',headers:apiHeaders(token,{'Content-Type':'application/json','x-upsert':upsert?'true':'false'}),body:JSON.stringify(value)})}
async function storageGet(path){const token=await accessToken();if(!token)throw new Error('Inicia sesión en Supabase primero.');return request(`${base()}/storage/v1/object/authenticated/${PRIVATE_BUCKET}/${encodePath(path)}`,{headers:apiHeaders(token,{'Cache-Control':'no-store'})})}
function ownerPath(suffix){if(!currentUser?.id)throw new Error('Sesión Supabase requerida.');return `${currentUser.id}/${suffix}`}
async function saveRecoveryEnvelope(envelope){const token=await accessToken();if(!token||!currentUser?.id)throw new Error('Inicia sesión en Supabase primero.');const rows=await request(`${base()}/rest/v1/vault_key_envelopes?on_conflict=user_id`,{method:'POST',headers:apiHeaders(token,{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'}),body:JSON.stringify({user_id:currentUser.id,key_id:envelope.keyId,envelope,updated_at:new Date().toISOString()})});return rows?.[0]||null}
async function loadRecoveryEnvelope(){const token=await accessToken();if(!token)throw new Error('Inicia sesión en Supabase primero.');const rows=await request(`${base()}/rest/v1/vault_key_envelopes?select=key_id,envelope,updated_at&limit=1`,{headers:apiHeaders(token,{'Cache-Control':'no-store'})});if(!rows?.[0]?.envelope)throw new Error('Esta cuenta todavía no tiene recuperación cifrada configurada.');return rows[0].envelope}
async function uploadVaultSecret(envelope){return storagePut(ownerPath('vault/secret.json'),envelope,{upsert:true})}
async function downloadVaultSecret(){return storageGet(ownerPath('vault/secret.json'))}
async function syncDocumentUploads(vault){
  const docs=vault.emr?.documents||[];let uploaded=0;
  for(const doc of docs){if(!doc?.encryptedContent||doc.objectPath)continue;const path=ownerPath(`documents/${doc.id}.json`);try{await storagePut(path,doc.encryptedContent,{upsert:false})}catch(err){const duplicate=err.status===409||/already.?exists|duplicate/i.test(`${err.message||''} ${JSON.stringify(err.body||{})}`);if(!duplicate)throw err}doc.objectPath=path;doc.storage='cloud_e2ee_v1';doc.cloudUpdatedAt=new Date().toISOString();doc.updatedAt=doc.updatedAt||doc.createdAt;uploaded++}
  return uploaded;
}
async function syncDocumentDownloads(vault){
  const docs=vault.emr?.documents||[];let downloaded=0;
  for(const doc of docs){if(doc?.encryptedContent||!doc?.objectPath)continue;try{doc.encryptedContent=await storageGet(doc.objectPath);doc.storage='cloud_e2ee_v1';downloaded++}catch(err){doc.downloadError=err.message||String(err)}}
  return downloaded;
}
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
function emrBundle(vault){
  const src=vault.emr||{};
  const names=['encounters','clinicalNotes','noteVersions','diagnoses','observations','allergies','medications','orders','documents','consents','prescriptionLinks','auditEvents'];
  const out={};for(const name of names)out[name]=Array.isArray(src[name])?src[name]:[];
  out.documents=out.documents.map(d=>{const safe={...d};delete safe.dataUrl;delete safe.encryptedContent;delete safe.downloadError;safe.updatedAt=safe.updatedAt||safe.createdAt;return safe});
  return out;
}
function mergeEmrBundle(vault,bundle){
  if(!vault.emr||!bundle)return;
  const merge=window.RxEmrCore?.mergeCollection||((a,b)=>{const m=new Map((a||[]).map(x=>[x.id,x]));for(const x of b||[])if(x?.id&&!m.has(x.id))m.set(x.id,x);return Array.from(m.values())});
  const localNotes=new Map((vault.emr.clinicalNotes||[]).map(x=>[x.id,x]));
  vault.emr.conflicts=Array.isArray(vault.emr.conflicts)?vault.emr.conflicts:[];
  for(const remote of bundle.clinicalNotes||[]){const local=localNotes.get(remote.id);if(local?.status==='final'&&remote.status==='final'&&local.canonicalText&&remote.canonicalText&&local.canonicalText!==remote.canonicalText){if(!vault.emr.conflicts.some(c=>c.entityId===local.id&&c.status==='open'))vault.emr.conflicts.push({id:crypto.randomUUID(),entityType:'clinical_note',entityId:local.id,status:'open',detectedAt:new Date().toISOString(),localHash:local.seal?.hash||'',remoteHash:remote.seal?.hash||'',remoteRecord:remote,resolution:'manual_review_required'});continue}localNotes.set(remote.id,merge(local?[local]:[],[remote])[0])}
  vault.emr.clinicalNotes=Array.from(localNotes.values());
  for(const name of ['encounters','noteVersions','diagnoses','observations','allergies','medications','orders','documents','consents','prescriptionLinks','auditEvents'])vault.emr[name]=merge(vault.emr[name]||[],bundle[name]||[]);
}
function setEmrQueue(vault,status,error=''){
  if(!vault.emr)return;vault.emr.syncQueue=Array.isArray(vault.emr.syncQueue)?vault.emr.syncQueue:[];
  let item=vault.emr.syncQueue.find(x=>x.id==='emr-bundle');if(!item){item={id:'emr-bundle',kind:'emr_bundle',attempts:0};vault.emr.syncQueue.push(item)}
  item.status=status;item.updatedAt=new Date().toISOString();item.lastError=error||'';if(status==='syncing')item.attempts=(item.attempts||0)+1;if(status==='synced'){item.syncedAt=item.updatedAt;item.attempts=0}
}
async function syncEmr(vault){
  if(!vault.emr)return {available:false,skipped:true};setEmrQueue(vault,'syncing');
  try{const bundle=await rpc('emr_sync_bundle',{p_bundle:emrBundle(vault)},true);if(!bundle?.ok)throw new Error('El backend EMR no confirmó la sincronización.');mergeEmrBundle(vault,bundle);setEmrQueue(vault,'synced');return {available:true,bundle}}
  catch(err){setEmrQueue(vault,'error',err.message||String(err));if(err.status===404||/emr_sync_bundle|function.*not found|PGRST202/i.test(err.message||''))return {available:false,migrationRequired:true};throw err}
}
function isEmptyLocalVault(vault){return !(vault.profile?.name||vault.profile?.license)&&(vault.patients||[]).length===0&&(vault.recipes||[]).length===0}
async function bootstrapRemoteVault(vault){
  const token=await accessToken();if(!token)throw new Error('Authentication required');
  const headers=apiHeaders(token),[profiles,patients,recipes]=await Promise.all([
    request(base()+'/rest/v1/profiles?select=profile,updated_at&limit=1',{headers}),
    request(base()+'/rest/v1/patients?select=payload,updated_at&order=updated_at.desc',{headers}),
    request(base()+'/rest/v1/prescriptions?select=payload,updated_at&order=updated_at.desc',{headers})
  ]);
  mergeBundle(vault,{profile:profiles?.[0]?.profile||null,patients:(patients||[]).map(x=>x.payload),recipes:(recipes||[]).map(x=>x.payload)});
}
async function healthcheck(){const u=await user();if(!u)throw new Error('Inicia sesión en Supabase primero.');const data=await rpc('rx_cloud_healthcheck',{},true);if(!data?.ok)throw new Error('El backend respondió, pero la sesión no quedó autenticada.');return data}
async function syncVault(vault,canonicalFactory){
  if(!navigator.onLine)throw new Error('Sin conexión. Los cambios permanecen en la bóveda local.');
  const u=await user();if(!u)throw new Error('Inicia sesión en Supabase primero.');
  try{await healthcheck()}catch(err){throw new Error(`Backend Supabase: ${err.message}. Si ves “function not found”, ejecuta FINAL_REPAIR_AND_SYNC_V2_3_4.sql en SQL Editor.`)}
  if(isEmptyLocalVault(vault)){try{await bootstrapRemoteVault(vault)}catch(err){throw new Error(`Protección de restauración: no se pudo leer la nube antes de escribir (${err.message}). No se envió una bóveda vacía.`)}}
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
  const documentsUploaded=await syncDocumentUploads(vault);
  const emrResult=await syncEmr(vault);
  const documentsDownloaded=await syncDocumentDownloads(vault);
  return {user:u,bundle,emrResult,documentsUploaded,documentsDownloaded};
}
async function syncRecipe(rec,vault,canonicalFactory){return syncVault(vault,canonicalFactory)}
window.RxCloud={configured,init,signIn,signOut,user,accessToken,healthcheck,syncVault,syncRecipe,syncEmr,saveRecoveryEnvelope,loadRecoveryEnvelope,uploadVaultSecret,downloadVaultSecret,syncDocumentUploads,syncDocumentDownloads,config:()=>({url:cfg.url||'',configured:configured()})};
})();
