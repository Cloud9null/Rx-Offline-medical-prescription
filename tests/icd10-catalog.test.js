const {test}=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../icd10-mx-inegi-2025.json');
const {readFileSync}=require('node:fs');
const {gunzipSync}=require('node:zlib');
const spanish=JSON.parse(gunzipSync(readFileSync(require('node:path').join(__dirname,'../icd10es-es-2026.json.gz'))));

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

test('2026 Spanish clinical modification is separate, complete and explicitly versioned',()=>{
  assert.match(spanish.source,/Ministerio de Sanidad/);
  assert.match(spanish.sourceUrl,/sanidad\.gob\.es/);
  assert.equal(spanish.version,'ES-2026');
  assert.ok(spanish.items.length>100000);
  assert.ok(spanish.items.filter(item=>item[2]===1).length>70000);
  const codes=new Set(spanish.items.map(item=>item[0]));
  assert.equal(codes.size,spanish.items.length);
  assert.ok(codes.has('I10'));
  assert.ok(spanish.items.some(([code,label])=>code.startsWith('A01.')&&/tifoidea/i.test(label)));
});
