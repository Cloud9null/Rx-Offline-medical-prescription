'use strict';

const SUPABASE_URL=process.env.RX_SUPABASE_URL||'https://aqugdzqvfqrbvzjqdoef.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.RX_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_baK8ud9Mxxr9E1oD0NMbPQ_p_YOR222';
const SECTION_KEYS=['reasonForVisit','currentIllness','reviewOfSystems','physicalExam','relevantResults','assessment','diagnosticPlan','plan','prognosis','warningSigns','followUp','referral'];
const schema={type:'object',additionalProperties:false,required:['sections','diagnoses','reviewWarnings'],properties:{sections:{type:'object',additionalProperties:false,required:SECTION_KEYS,properties:Object.fromEntries(SECTION_KEYS.map(k=>[k,{type:'string',maxLength:12000}]))},diagnoses:{type:'array',maxItems:12,items:{type:'object',additionalProperties:false,required:['text','status'],properties:{text:{type:'string',maxLength:500},status:{type:'string',enum:['working','confirmed','ruled_out','history']}}}},reviewWarnings:{type:'array',maxItems:12,items:{type:'string',maxLength:500}}}};

function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body))}
async function authenticate(token){if(!token)return false;const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});return response.ok}
function outputText(payload){if(typeof payload?.output_text==='string')return payload.output_text;for(const item of payload?.output||[])for(const content of item?.content||[])if(content?.type==='output_text'&&content.text)return content.text;return ''}
function providerConfig(){
  if(process.env.OPENAI_API_KEY)return {kind:'openai',url:'https://api.openai.com/v1/responses',token:process.env.OPENAI_API_KEY,model:process.env.OPENAI_CLINICAL_MODEL||'gpt-5-mini'};
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(token)return {kind:'vercel-ai-gateway',url:'https://ai-gateway.vercel.sh/v1/responses',token,model:process.env.AI_GATEWAY_CLINICAL_MODEL||'openai/gpt-5-mini'};
  return null;
}
const clean=(value,max)=>String(value??'').replace(/\0/g,'').trim().slice(0,max);
function sanitizeInput(input){
  const documented=Object.fromEntries(SECTION_KEYS.map(key=>[key,clean(input?.documented?.[key],4000)]));
  return {schemaVersion:1,locale:'es-MX',noteType:clean(input?.noteType||'ambulatory',40),ageLabel:clean(input?.ageLabel,40),sex:clean(input?.sex,20),keyPoints:clean(input?.keyPoints,10000),documented};
}
function providerError(status){
  if(status===402)return 'Se agotó el crédito disponible para IA. Usa “Estructurar local”; el borrador no fue modificado.';
  if(status===429)return 'La IA alcanzó un límite temporal. Intenta más tarde o usa “Estructurar local”.';
  if(status===403)return 'El proveedor de IA no está habilitado para este despliegue. Usa “Estructurar local”.';
  return 'El proveedor de IA no respondió correctamente. Usa “Estructurar local”.';
}

module.exports=async function handler(req,res){
  const provider=providerConfig();
  if(req.method==='GET')return send(res,200,{ok:true,externalAI:Boolean(provider),provider:provider?.kind||'disabled',model:provider?.model||null});
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido.'});
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  try{if(!await authenticate(token))return send(res,401,{error:'Sesión Supabase requerida.'})}catch{return send(res,503,{error:'No fue posible validar la sesión.'})}
  if(!provider)return send(res,503,{error:'La IA externa no está habilitada. Usa “Estructurar local”.'});
  const input=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:null;
  if(!input)return send(res,400,{error:'Entrada inválida.'});
  const serialized=JSON.stringify(sanitizeInput(input));if(serialized.length>30000)return send(res,400,{error:'Entrada demasiado extensa.'});
  try{
    const request={model:provider.model,store:false,max_output_tokens:2500,instructions:'Eres un asistente de documentación clínica ambulatoria en México. Convierte únicamente hechos aportados por el médico en una nota clara y concisa. No inventes hallazgos normales, negaciones, diagnósticos, códigos CIE-10, tratamientos, dosis ni signos vitales. Conserva incertidumbre y temporalidad. Diagnoses solo puede contener diagnósticos explícitamente documentados. Si falta información médico-legal o hay ambigüedad, déjala vacía y agrega una advertencia breve en reviewWarnings. La salida es un borrador que el médico debe revisar.',input:serialized,text:{format:{type:'json_schema',name:'clinical_note_draft',strict:true,schema}}};
    if(provider.kind==='vercel-ai-gateway')request.providerOptions={gateway:{disallowPromptTraining:true}};
    const response=await fetch(provider.url,{method:'POST',headers:{Authorization:`Bearer ${provider.token}`,'Content-Type':'application/json'},body:JSON.stringify(request)});
    const payload=await response.json();if(!response.ok)return send(res,response.status===402||response.status===429?response.status:502,{error:providerError(response.status)});
    const text=outputText(payload);if(!text)throw new Error('empty');const result=JSON.parse(text);return send(res,200,{...result,model:provider.model,provider:provider.kind});
  }catch{return send(res,502,{error:'No fue posible generar el borrador. La nota local no fue modificada.'})}
};
