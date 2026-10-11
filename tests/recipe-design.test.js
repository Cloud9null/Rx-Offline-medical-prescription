const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('offline QR reconstructs the exact signed design for every new layout',()=>{
  const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
  const verifier=fs.readFileSync(path.join(__dirname,'../verify.js'),'utf8');
  const context=vm.createContext({});
  for(const name of ['canonicalPayload','verificationPacket']){
    const definition=app.split(`function ${name}(`)[1].split('\n')[0];
    vm.runInContext(`function ${name}(${definition}`,context);
  }
  vm.runInContext(verifier.split('function expandPacket(')[1].split('\n')[0].replace(/^/,'function expandPacket('),context);
  for(const layout of ['classic','side','clean','folio','column','minimal']){
    const rec={id:'RX-SYNTHETIC',issuedAt:'2026-10-11T00:00:00Z',doctor:{name:'Dra. Sintética',role:'General',license:'TEST',university:'',address:'',phone:'',email:''},patient:{id:'patient',name:'Paciente sintético',dob:'1990-01-01',age:36,sex:'F',allergies:'',weight:''},medications:[{name:'Sintético',brand:'',strength:'1 mg',dose:'1 mg',route:'Oral',frequency:'Diaria',duration:'1 día',instructions:''}],general:'',signatureImageSha256:'hash',design:{theme:'clinovyra',primary:'#0753b7',secondary:'#12afa8',logoStyle:'monogram',layout},seal:{signature:'synthetic',publicJwk:{x:'x',y:'y'}}};
    context.rec=rec;
    const packet=vm.runInContext('verificationPacket(rec)',context);
    assert.equal(packet.v,4);
    context.packet=packet;
    const actual=vm.runInContext('JSON.stringify(expandPacket(packet).canonical)',context);
    const expected=vm.runInContext('JSON.stringify(canonicalPayload(rec))',context);
    assert.equal(actual,expected,`${layout} must produce the same canonical bytes`);
  }
});
