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
  for(const asset of ['emr.css','emr-core.js','emr.js'])assert.match(sw,new RegExp(asset.replace('.','\\.')));
  assert.doesNotMatch(sw,/localStorage\.clear|indexedDB\.deleteDatabase/);
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
