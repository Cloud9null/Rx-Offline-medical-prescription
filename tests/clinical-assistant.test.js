const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../clinical-assistant.js');

test('local assistant structures only physician-provided facts',()=>{
  const out=A.structureLocal('MC: Tos y fiebre\nPA: Tres días de evolución\nEF: Faringe hiperémica\nPlan: Hidratación documentada');
  assert.equal(out.reasonForVisit,'Tos y fiebre');assert.equal(out.currentIllness,'Tres días de evolución');assert.equal(out.physicalExam,'Faringe hiperémica');assert.equal(out.plan,'Hidratación documentada');assert.equal(out.assessment,'');
});

test('AI payload excludes direct patient identifiers',()=>{
  const payload=A.buildAiPayload('MC: dolor',{currentIllness:'Dato clínico'},{noteType:'first_visit',ageLabel:'36 años',sex:'F',patientName:'NO ENVIAR'});
  assert.equal(payload.patientName,undefined);assert.doesNotMatch(JSON.stringify(payload),/NO ENVIAR/);
});

test('plain-text note remains legible and includes final integrity evidence',()=>{
  const text=A.plainText({patient:{name:'Paciente Sintético',dob:'1990-01-01'},encounter:{folio:'ENC-TEST',occurredAt:'2026-09-09T12:00:00Z'},note:{status:'final',sections:{reasonForVisit:'Tos'},seal:{hash:'abc',signedAt:'2026-09-09T12:01:00Z'}},profile:{name:'Dra. Sintética',license:'TEST'},diagnoses:[],observation:{},orders:[]});
  assert.match(text,/Paciente Sintético/);assert.match(text,/MOTIVO DE CONSULTA\nTos/);assert.match(text,/SHA-256: abc/);
});
