const test=require('node:test');
const assert=require('node:assert/strict');

const handler=require('../api/clinical-note.js');
const SECTION_KEYS=['reasonForVisit','currentIllness','reviewOfSystems','physicalExam','relevantResults','assessment','diagnosticPlan','plan','prognosis','warningSigns','followUp','referral'];

function responseCapture(){
  return {statusCode:0,headers:{},body:'',setHeader(name,value){this.headers[name]=value},end(body){this.body=body}};
}

test('GET reports provider readiness without disclosing credentials',async()=>{
  const res=responseCapture();await handler({method:'GET',headers:{'x-vercel-oidc-token':'synthetic-runtime-oidc'}},res);
  assert.equal(res.statusCode,200);const body=JSON.parse(res.body);assert.equal(body.externalAI,true);assert.equal(body.provider,'vercel-ai-gateway');assert.doesNotMatch(res.body,/synthetic-runtime-oidc/);
});

test('Gateway request authenticates, minimizes PHI and disables prompt training',async()=>{
  const oldFetch=global.fetch,oldOidc=process.env.VERCEL_OIDC_TOKEN,oldOpenAI=process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;delete process.env.VERCEL_OIDC_TOKEN;
  const calls=[];global.fetch=async(url,options={})=>{
    calls.push({url,options});
    if(String(url).includes('/auth/v1/user'))return {ok:true,status:200,json:async()=>({id:'synthetic-user'})};
    const sections=Object.fromEntries(SECTION_KEYS.map(key=>[key,key==='reasonForVisit'?'Cefalea':'']));
    return {ok:true,status:200,json:async()=>({output_text:JSON.stringify({sections,diagnoses:[],reviewWarnings:['Revisar antes de firmar.']})})};
  };
  try{
    const req={method:'POST',headers:{authorization:'Bearer synthetic-session','x-vercel-oidc-token':'synthetic-runtime-oidc'},body:{noteType:'first_visit',keyPoints:'MC: cefalea',patientName:'NOMBRE QUE NO DEBE SALIR',patientId:'secret-id',documented:{assessment:'En estudio'},unexpected:{identifier:'secret'}}};
    const res=responseCapture();await handler(req,res);assert.equal(res.statusCode,200,res.body);
    assert.equal(calls.length,2);assert.equal(calls[1].url,'https://ai-gateway.vercel.sh/v1/responses');assert.equal(calls[1].options.headers.Authorization,'Bearer synthetic-runtime-oidc');
    const gatewayBody=JSON.parse(calls[1].options.body);assert.equal(gatewayBody.model,'openai/gpt-5-mini');assert.equal(gatewayBody.store,false);assert.equal(gatewayBody.providerOptions.gateway.disallowPromptTraining,true);assert.match(gatewayBody.input,/cefalea/);assert.doesNotMatch(gatewayBody.input,/NOMBRE QUE NO DEBE SALIR|secret-id|unexpected/);
    assert.equal(JSON.parse(res.body).provider,'vercel-ai-gateway');
  }finally{
    global.fetch=oldFetch;if(oldOidc===undefined)delete process.env.VERCEL_OIDC_TOKEN;else process.env.VERCEL_OIDC_TOKEN=oldOidc;if(oldOpenAI===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldOpenAI;
  }
});
