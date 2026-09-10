const test=require('node:test');
const assert=require('node:assert/strict');
const Quick=require('../quick-note.js');

test('standalone note is legible, explicitly a draft and contains no invented identifier',()=>{
  const text=Quick.formatStandalone({noteType:'evolution',ageLabel:'42 años',sex:'F',generatedAt:'2026-09-10T12:00:00Z',sections:{reasonForVisit:'Dolor abdominal',currentIllness:'Ocho horas de evolución',physicalExam:'Hallazgos documentados',plan:'Revaloración indicada'},diagnoses:[{text:'Dolor abdominal en estudio'}],warnings:['Confirmar signos vitales']});
  assert.match(text,/NOTA DE EVOLUCIÓN/);assert.match(text,/Edad: 42 años/);assert.match(text,/MOTIVO DE CONSULTA\nDolor abdominal/);assert.match(text,/Dolor abdominal en estudio/);assert.match(text,/REQUIERE REVISIÓN/);assert.doesNotMatch(text,/Paciente:|Fecha de nacimiento:|Folio:/);
});

test('standalone note omits empty clinical blocks',()=>{
  const text=Quick.formatStandalone({generatedAt:'2026-09-10T12:00:00Z',sections:{reasonForVisit:'Control'}});
  assert.match(text,/MOTIVO DE CONSULTA/);assert.doesNotMatch(text,/EXPLORACIÓN FÍSICA/);assert.doesNotMatch(text,/DIAGNÓSTICOS \/ PROBLEMAS/);
});
