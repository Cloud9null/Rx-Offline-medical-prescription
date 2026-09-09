const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('legacy prescription contracts remain present',()=>{
  const app=read('app.js');
  assert.match(app,/function renderHistory\(/);
  assert.match(app,/function canonicalPayload\(recipe\)/);
  assert.match(app,/ECDSA-P256-SHA256/);
  assert.match(read('index.html'),/8\.5 × 5\.5/);
  assert.match(read('styles.css'),/width:8\.5in;height:5\.5in/);
  assert.match(app,/https:\/\/cedulaprofesional\.sep\.gob\.mx\/cedula\/presidencia\/indexAvanzada\.action/);
  assert.match(app,/function renderManualLetterPages\(/);
  assert.match(app,/function voidRecipe\(/);
});

test('prescription relation is external to the signed canonical payload',()=>{
  const app=read('app.js'),emr=read('emr.js');
  const canonical=app.match(/function canonicalPayload\(recipe\)\{return \{([^}]+\}[^}]*)\}\}/)?.[0]||'';
  assert.doesNotMatch(canonical,/encounterId|noteId|prescriptionLinks/);
  assert.match(emr,/prescriptionLinks\.push\(link\)/);
});

test('PWA precaches every new EMR runtime asset',()=>{
  const sw=read('sw.js');
  for(const asset of ['emr.css','emr-core.js','emr.js','secure-sync.js','clinical-assistant.js'])assert.match(sw,new RegExp(asset.replace('.','\\.')));
  assert.doesNotMatch(sw,/localStorage\.clear|indexedDB\.deleteDatabase/);
});

test('E2EE migration creates private owner-scoped storage without destructive SQL',()=>{
  const sql=read('supabase/migrations/20260909060646_e2ee_documents_and_key_recovery.sql');
  assert.match(sql,/create table if not exists public\.vault_key_envelopes/i);assert.match(sql,/rx-emr-private-v1/);assert.match(sql,/false,6291456,array\['application\/json'\]/i);assert.match(sql,/storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/i);assert.match(sql,/revoke delete on public\.vault_key_envelopes from authenticated/i);assert.doesNotMatch(sql,/drop table|truncate|delete from|on delete cascade/i);
});

test('clinical AI endpoint is authenticated, no-store and never exposes the provider key',()=>{
  const api=read('api/clinical-note.js'),emr=read('emr.js');assert.match(api,/\/auth\/v1\/user/);assert.match(api,/store:false/);assert.match(api,/process\.env\.OPENAI_API_KEY/);assert.match(api,/x-vercel-oidc-token/);assert.match(api,/process\.env\.VERCEL_OIDC_TOKEN/);assert.match(api,/ai-gateway\.vercel\.sh/);assert.match(api,/disallowPromptTraining:true/);assert.doesNotMatch(emr,/OPENAI_API_KEY|VERCEL_OIDC_TOKEN/);assert.match(emr,/identifiersSent:false/);
});

test('document payloads upload only encrypted content and cloud metadata strips ciphertext',()=>{
  const cloud=read('cloud.js'),emr=read('emr.js');assert.match(emr,/encryptDocument\(new Uint8Array/);assert.match(cloud,/delete safe\.encryptedContent/);assert.match(cloud,/storagePut\(path,doc\.encryptedContent/);assert.doesNotMatch(cloud,/storagePut\(path,doc\.dataUrl/);
});

test('migration is additive, owner-scoped and keeps anon away from clinical tables',()=>{
  const sql=read('supabase/migrations/20260907180000_emr_integrado_v3.sql');
  assert.match(sql,/security invoker/gi);
  assert.match(sql,/enable row level security/gi);
  assert.match(sql,/\(select auth\.uid\(\)\) = user_id/);
  assert.match(sql,/revoke all on public\.encounters[\s\S]+from anon/);
  assert.match(sql,/case when r->>'status'='final' then r->'seal' else null end/i);
  assert.doesNotMatch(sql,/drop table|truncate|on delete cascade/i);
});

test('every issued prescription can populate longitudinal medications without requiring a note',()=>{
  const source=read('emr.js');
  assert.match(source,/sourceRxId:rec\.id/);
  assert.match(source,/encounterId:context\?\.encounterId\|\|null/);
  assert.match(source,/linked:Boolean\(context\)/);
});

test('hardening migration revokes destructive client privileges and covers foreign keys',()=>{
  const sql=read('supabase/migrations/20260907195000_harden_emr_grants_and_indexes.sql');
  assert.match(sql,/revoke delete[\s\S]+from authenticated/i);
  assert.match(sql,/revoke update on public\.note_versions,public\.prescription_links,public\.audit_events/i);
  assert.match(sql,/revoke execute on function public\.rls_auto_enable\(\)/i);
  assert.ok((sql.match(/create index if not exists/g)||[]).length>=17);
  assert.doesNotMatch(sql,/drop table|truncate|delete from|on delete cascade/i);
});

test('empty-device bootstrap grants owner reads while keeping anonymous access blocked',()=>{
  const sql=read('supabase/migrations/20260907195500_enable_safe_legacy_bootstrap.sql');
  assert.match(sql,/grant select on public\.profiles,public\.patients,public\.prescriptions to authenticated/i);
  assert.match(sql,/revoke all on public\.profiles,public\.patients,public\.prescriptions from anon/i);
  assert.doesNotMatch(sql,/insert|update|delete|drop|truncate/i);
});

test('legacy owner policies are optimized without broadening access',()=>{
  const sql=read('supabase/migrations/20260907200000_optimize_legacy_rls.sql');
  assert.ok((sql.match(/\(select auth\.uid\(\)\) = user_id/g)||[]).length>=13);
  assert.match(sql,/create index if not exists prescriptions_user_patient_idx[\s\S]+\(user_id, patient_id\)/i);
  assert.doesNotMatch(sql,/grant|insert into|update\s+public|delete from|drop|truncate/i);
});

test('single-owner access migration is additive, self-readable and administratively seeded',()=>{
  const sql=read('supabase/migrations/20260909153354_authorize_single_owner_access.sql');
  assert.match(sql,/create table if not exists public\.app_authorized_users/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/grant select on public\.app_authorized_users to authenticated/i);
  assert.match(sql,/\(select auth\.uid\(\)\) = user_id and enabled is true/i);
  assert.match(sql,/select count\(\*\) from auth\.users[\s\S]+\) = 1/i);
  assert.doesNotMatch(sql,/drop table|truncate|delete from|on delete cascade/i);
});

test('application and clinical AI both enforce the server-side owner allowlist',()=>{
  const app=read('app.js'),cloud=read('cloud.js'),api=read('api/clinical-note.js'),html=read('index.html');
  assert.match(cloud,/async function authorizeUser\(/);assert.match(cloud,/app_authorized_users/);
  assert.match(app,/async function resolveInitialAccess\(/);assert.match(app,/ownerIdHash/);
  assert.match(api,/async function authorize\(/);assert.match(api,/app_authorized_users/);
  assert.match(html,/ACCESO RESTRINGIDO/);assert.doesNotMatch(html,/registrarse|crear cuenta/i);
  assert.match(app,/\['localhost','127\.0\.0\.1'\][\s\S]+get\('e2e'\)==='1'/);
});

test('session management exposes only owner-scoped inventory and revocation',()=>{
  const sql=read('supabase/migrations/20260909184339_manage_owner_sessions.sql'),cloud=read('cloud.js'),html=read('index.html');
  assert.match(sql,/private\.rx_current_session_is_active\(\)/i);
  assert.match(sql,/s\.id = nullif\(auth\.jwt\(\)->>'session_id'/i);
  assert.match(sql,/where s\.user_id = auth\.uid\(\)/i);
  assert.match(sql,/delete from auth\.sessions[\s\S]+user_id = v_user_id/i);
  assert.match(sql,/revoke all on function public\.rx_revoke_my_session\(uuid\) from public, anon/i);
  assert.match(sql,/security definer[\s\S]+set search_path = ''/i);
  assert.doesNotMatch(sql,/delete from public\.|truncate|drop table|on delete cascade/i);
  assert.match(cloud,/logout\?scope=\$\{scope\}/);assert.match(cloud,/async function listSessions\(/);assert.match(cloud,/async function revokeSession\(/);
  assert.match(html,/Dispositivos y sesiones/);assert.match(html,/Cerrar las demás/);assert.match(html,/Desautorizar este dispositivo/);
});

test('Liquid Glass is progressive and respects reduced motion',()=>{
  const css=read('styles.css'),app=read('app.js'),html=read('index.html');
  assert.match(css,/@supports \(\(-webkit-backdrop-filter/);assert.match(css,/@keyframes rxGlassSlide/);assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/min-height:100svh/);assert.match(css,/env\(safe-area-inset-top\)/);assert.match(html,/viewport-fit=cover/);
  assert.match(html,/La misma que usas para sincronización; no es el PIN de la bóveda/);
  assert.match(app,/display-mode: standalone/);assert.match(app,/ios-pwa/);
});
