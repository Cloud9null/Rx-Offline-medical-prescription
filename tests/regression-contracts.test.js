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
