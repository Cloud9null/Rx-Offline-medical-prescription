const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('offline worker only intercepts the static shell, never clinical API or verifier routes',async()=>{
  const handlers={};
  const cacheReads=[];
  const scope='https://clinovyra.test/';
  const context={
    URL,Set,Promise,
    self:{location:{origin:new URL(scope).origin},registration:{scope},addEventListener:(name,handler)=>{handlers[name]=handler}},
    caches:{match:async(request)=>{cacheReads.push(request);return {cached:true}},open:async()=>({put:async()=>{}})},
    fetch:async()=>({ok:true,type:'basic',clone(){return this}})
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),context);
  const request=(url,mode='cors')=>{
    let response;
    handlers.fetch({request:{url:scope+url,method:'GET',mode},respondWith:promise=>{response=promise}});
    return response;
  };
  assert.equal(request('api/clinical-note?patient=test'),undefined);
  assert.equal(request('v/sensitive-verification-token','navigate'),undefined);
  assert.equal(request('not-an-asset?private=value'),undefined);
  assert.equal(cacheReads.length,0);
  assert.deepEqual(await request('styles.css'),{cached:true});
  assert.equal(cacheReads.length,1);
});
