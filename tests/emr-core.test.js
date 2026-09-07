const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../emr-core.js');

test('migrates a legacy vault additively without changing existing collections',()=>{
  const patient={id:'p1',name:'Paciente Sintético'},vault={patients:[patient],recipes:[{id:'RX-OLD'}]};
  const state=C.ensureState(vault);
  assert.equal(vault.patients[0],patient);
  assert.equal(vault.recipes[0].id,'RX-OLD');
  assert.equal(state.schemaVersion,3);
  for(const name of C.COLLECTIONS)assert.ok(Array.isArray(state[name]),name);
});

test('calculates pediatric age at the encounter date without using today',()=>{
  assert.deepEqual(C.ageAt('2025-01-15','2025-03-20T12:00:00Z'),{years:0,months:2,days:5,label:'2 meses 5 días'});
  assert.equal(C.ageAt('2000-09-08','2026-09-07T12:00:00Z').label,'25 años');
});

test('canonical JSON is stable across object key order',()=>{
  assert.equal(C.canonicalJson({b:2,a:{d:4,c:3}}),C.canonicalJson({a:{c:3,d:4},b:2}));
});

test('validates minimum clinical finalization fields',()=>{
  const note={sections:{reasonForVisit:'Tos',currentIllness:'Tres días',physicalExam:'Alerta',assessment:'IRA probable',plan:'Manejo y vigilancia'}};
  assert.deepEqual(C.validateDraft(note,[{text:'Infección respiratoria aguda'}]),[]);
  assert.ok(C.validateDraft({sections:{}},[]).length>=6);
});

test('calculates BMI and emits non-blocking plausibility alerts',()=>{
  assert.equal(C.bmi(70,175),22.9);
  const alerts=C.vitalAlerts({sbp:'350',spo2:'82',temperature:'38.5'});
  assert.ok(alerts.some(a=>a.field==='sbp'&&a.severity==='danger'));
  assert.ok(alerts.some(a=>a.field==='spo2'));
});

test('merge never overwrites a finalized local note and accepts a remote final over draft',()=>{
  const localFinal={id:'n1',status:'final',updatedAt:'2026-01-01',finalSnapshot:{x:1}};
  const remoteDraft={id:'n1',status:'draft',updatedAt:'2027-01-01',sections:{x:2}};
  assert.equal(C.mergeRecord(localFinal,remoteDraft),localFinal);
  assert.equal(C.mergeRecord(remoteDraft,{...localFinal,updatedAt:'2025-01-01'}).status,'final');
});
