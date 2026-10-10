const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{},Blob,TextEncoder,atob};
vm.createContext(context);
vm.runInContext(fs.readFileSync('manual-pdf.js','utf8'),context);
test('rasterized letter sheets form a real multi-page PDF with embedded image',async()=>{
  const jpeg='data:image/jpeg;base64,'+Buffer.from([0xff,0xd8,0xff,0xd9]).toString('base64');
  const blob=context.window.ClinovyraManualPDF.pdfFromJpegs([{dataUrl:jpeg,width:1632,height:2112},{dataUrl:jpeg,width:1632,height:2112}]);
  assert.equal(blob.type,'application/pdf');
  const source=Buffer.from(await blob.arrayBuffer()).toString('latin1');
  assert.match(source,/^%PDF-1\.4/);
  assert.equal((source.match(/\/Type \/Page \/Parent/g)||[]).length,2);
  assert.equal((source.match(/\/Subtype \/Image/g)||[]).length,2);
  assert.match(source,/\/MediaBox \[0 0 612 792\]/);
  assert.match(source,/xref\n0 9\n/);
});
