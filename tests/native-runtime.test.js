const test=require('node:test');
const assert=require('node:assert/strict');
const runtime=require('../runtime.js');
const handler=require('../api/clinical-note.js');
const model=require('../emr-core.js');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function capture(){return {headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=value}}}

test('native prescriptions always point QR verification to the public HTTPS origin',()=>{
  for(const origin of [{protocol:'capacitor:',origin:'capacitor://localhost'},{protocol:'app:',origin:'app://clinovyra.local'}]){
    assert.equal(runtime.publicVerifierUrl('t=synthetic',origin),'https://rx-offline-medical-prescription.vercel.app/verify.html#t=synthetic');
    assert.equal(runtime.clinicalApiUrl(origin),'https://rx-offline-medical-prescription.vercel.app/api/clinical-note');
  }
  assert.equal(runtime.publicVerifierUrl('j.synthetic',{protocol:'https:',origin:'https://preview.example'}),'https://preview.example/verify.html#j.synthetic');
});

test('clinical AI CORS is restricted to installed app origins',async()=>{
  const good=capture();await handler({method:'OPTIONS',headers:{origin:'capacitor://localhost'}},good);
  assert.equal(good.statusCode,204);assert.equal(good.headers['Access-Control-Allow-Origin'],'capacitor://localhost');
  assert.match(good.headers['Access-Control-Allow-Headers'],/Authorization/);
  const denied=capture();await handler({method:'OPTIONS',headers:{origin:'https://untrusted.example'}},denied);
  assert.equal(denied.statusCode,403);assert.equal(denied.headers['Access-Control-Allow-Origin'],undefined);
});

test('new final notes capture patient and facility addresses in the signed snapshot',()=>{
  const snapshot=model.noteSnapshot({
    encounter:{id:'e',folio:'E-1',occurredAt:'2026-10-08T12:00:00Z'},note:{id:'n',noteType:'first_visit',sections:{}},
    patient:{id:'p',name:'Paciente sintético',dob:'1990-01-01',sex:'F',address:'Calle Prueba 123'},
    profile:{name:'Dra. Sintética',facilityType:'Consultorio de medicina general',facilityName:'Consulta Sintética',address:'Consultorio Prueba 456'}
  });
  assert.equal(snapshot.patient.address,'Calle Prueba 123');assert.equal(snapshot.facility.address,'Consultorio Prueba 456');
  assert.equal(snapshot.facility.type,'Consultorio de medicina general');assert.equal(snapshot.facility.name,'Consulta Sintética');
});

test('Android rebuilds disable operating-system backup of the local clinical vault',()=>{
  const script=fs.readFileSync(path.join(__dirname,'../native/harden-android.mjs'),'utf8');
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../native/package.json'),'utf8'));
  assert.match(script,/android:allowBackup="false"/);
  assert.match(script,/FLAG_SECURE/);
  assert.match(pkg.scripts['android:init'],/android:harden/);
  assert.match(pkg.scripts['android:sync'],/android:harden/);
});

test('installable packages keep local assets and stable identities; Android release requires persistent signing',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../native/package.json'),'utf8'));
  const harden=fs.readFileSync(path.join(__dirname,'../native/harden-android.mjs'),'utf8');
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/clinovyra-native.yml'),'utf8');
  const desktop=fs.readFileSync(path.join(__dirname,'../native/electron-main.cjs'),'utf8');
  assert.equal(pkg.build.appId,'com.clinovyra.emr');
  assert.match(desktop,/const HOST='clinovyra\.local'/);
  assert.match(desktop,/const ORIGIN=`app:\/\/\$\{HOST\}`/);
  assert.match(desktop,/win\.loadURL\(`\$\{ORIGIN\}\/index\.html`\)/);
  assert.match(harden,/keyAlias 'clinovyra-emr'/);
  assert.match(harden,/CLINOVYRA_KEYSTORE_PATH/);
  assert.match(workflow,/base64 --decode/);
  assert.match(workflow,/CLINOVYRA_ANDROID_CERT_SHA256/);
  assert.match(workflow,/assembleRelease/);
  assert.match(workflow,/verify --verbose --print-certs/);
  assert.doesNotMatch(workflow,/assembleDebug|app-debug\.apk/);
});

test('mobile biometric unlock retrieves a hardware-protected key, never a plain credential',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../native-biometric.js'),'utf8');
  const calls=[];
  const native={Capacitor:{isNativePlatform:()=>true,registerPlugin(id){assert.equal(id,'NativeBiometric');return {
    isAvailable:async()=>({isAvailable:true,strongBiometryIsAvailable:true}),
    setCredentials:async x=>calls.push(['store',x]),
    getSecureCredentials:async x=>{calls.push(['read',x]);return {username:'owner:vault',password:'synthetic-key'}},
    deleteCredentials:async x=>calls.push(['delete',x])
  }}}};
  vm.runInNewContext(source,{window:native});
  assert.equal(await native.ClinovyraBiometric.available(),true);
  await native.ClinovyraBiometric.protect('vault-1','owner:vault','synthetic-key');
  assert.equal(calls[0][1].accessControl,1);
  assert.equal(calls[0][1].authValidityDuration,0);
  assert.equal((await native.ClinovyraBiometric.release('vault-1')).password,'synthetic-key');
  assert.equal(calls[1][0],'read');
  await native.ClinovyraBiometric.remove('vault-1');
  const web={};vm.runInNewContext(source,{window:web});
  assert.equal(web.ClinovyraBiometric.supported(),false);
  await assert.rejects(()=>web.ClinovyraBiometric.release('vault-1'));
});

test('native printing uses the system printer and the web keeps its print dialog',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../native-print.js'),'utf8');
  let name='',webCalls=0;
  const native={Capacitor:{isNativePlatform:()=>true,registerPlugin(id){assert.equal(id,'Printer');return {printWebView:async options=>{name=options.name}}}},print(){throw new Error('unexpected browser print')}};
  vm.runInNewContext(source,{window:native});await native.ClinovyraPrint.print('Receta manual');assert.equal(name,'Receta manual');
  const web={print(){webCalls++}};vm.runInNewContext(source,{window:web});await web.ClinovyraPrint.print('Receta manual');assert.equal(webCalls,1);
});
