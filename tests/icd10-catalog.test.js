const {test}=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../icd10-mx-inegi-2025.json');

test('INEGI offline cause list retains searchable Spanish code-label pairs',()=>{
  assert.match(catalog.url,/inegi\.org\.mx/);
  assert.match(catalog.scope,/no catálogo exhaustivo/);
  assert.ok(catalog.items.length>9000);
  const codes=new Map(catalog.items);
  assert.match(codes.get('I10'),/hipertension esencial/i);
  assert.match(codes.get('N18.5'),/enfermedad renal cronica, etapa 5/i);
  assert.match(codes.get('L97'),/ulcera de miembro inferior/i);
  assert.equal(codes.size,catalog.items.length);
});
