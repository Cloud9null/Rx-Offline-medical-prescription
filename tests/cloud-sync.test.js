const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function cloudHarness({failRead=false}={}){
  const calls=[];
  const remotePatient={id:'71a487db-06e7-4f20-88c8-358b5de27cea',name:'Paciente de prueba',updatedAt:'2026-10-01T00:00:00Z'};
  const session={access_token:'test-token',refresh_token:'test-refresh',expires_at:Date.now()+3600000,user:{id:'owner-test'}};
  const storage={getItem:()=>JSON.stringify(session),setItem(){},removeItem(){}};
  const window={RX_SUPABASE_CONFIG:{url:'https://example.supabase.co',publishableKey:'sb_publishable_test_1234567890'},dispatchEvent(){}};
  const fetch=async(url,options={})=>{
    const route=new URL(url).pathname;
    calls.push(route);
    if(failRead&&route==='/rest/v1/patients')throw new TypeError('network unavailable');
    let body;
    if(route==='/auth/v1/user')body=session.user;
    else if(route==='/rest/v1/rpc/rx_cloud_healthcheck')body={ok:true};
    else if(route==='/rest/v1/profiles')body=[{profile:{name:'Perfil remoto'}}];
    else if(route==='/rest/v1/patients')body=[{payload:remotePatient}];
    else if(route==='/rest/v1/prescriptions')body=[];
    else if(route==='/rest/v1/rpc/rx_sync_bundle')body={ok:true,profile:{name:'Perfil local'},patients:[remotePatient],recipes:[]};
    else throw new Error(`Unexpected request ${route}`);
    return {ok:true,text:async()=>JSON.stringify(body)};
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cloud.js'),'utf8'),{window,fetch,localStorage:storage,navigator:{onLine:true},CustomEvent:class{},console,Date,URL,encodeURIComponent});
  return {cloud:window.RxCloud,calls,remotePatient};
}

test('a configured local profile still restores remote patients before the first write',async()=>{
  const {cloud,calls,remotePatient}=cloudHarness();
  const vault={profile:{name:'Perfil local',license:'123'},patients:[],recipes:[],signing:{}};
  const result=await cloud.syncVault(vault,()=>({}));
  assert.equal(result.bundle.ok,true);
  assert.equal(vault.profile.name,'Perfil local');
  assert.equal(vault.patients[0].id,remotePatient.id);
  assert.ok(calls.indexOf('/rest/v1/patients')<calls.indexOf('/rest/v1/rpc/rx_sync_bundle'));
});

test('a failed remote read blocks the first write from a new device',async()=>{
  const {cloud,calls}=cloudHarness({failRead:true});
  const vault={profile:{name:'Perfil local'},patients:[],recipes:[],signing:{}};
  await assert.rejects(cloud.syncVault(vault,()=>({})),/Protección de restauración/);
  assert.ok(!calls.includes('/rest/v1/rpc/rx_sync_bundle'));
});
