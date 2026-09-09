'use strict';

const SUPABASE_URL=process.env.RX_SUPABASE_URL||'https://aqugdzqvfqrbvzjqdoef.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.RX_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_baK8ud9Mxxr9E1oD0NMbPQ_p_YOR222';
const SECTION_KEYS=['reasonForVisit','currentIllness','reviewOfSystems','physicalExam','relevantResults','assessment','diagnosticPlan','plan','prognosis','warningSigns','followUp','referral'];
const schema={type:'object',additionalProperties:false,required:['sections','diagnoses','reviewWarnings'],properties:{sections:{type:'object',additionalProperties:false,required:SECTION_KEYS,properties:Object.fromEntries(SECTION_KEYS.map(k=>[k,{type:'string',maxLength:12000}]))},diagnoses:{type:'array',maxItems:12,items:{type:'object',additionalProperties:false,required:['text','status'],properties:{text:{type:'string',maxLength:500},status:{type:'string',enum:['working','confirmed','ruled_out','history']}}}},reviewWarnings:{type:'array',maxItems:12,items:{type:'string',maxLength:500}}}};

function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body))}
async function authenticate(token){if(!token)return false;const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});return response.ok}
function outputText(payload){if(typeof payload?.output_text==='string')return payload.output_text;for(const item of payload?.output||[])for(const content of item?.content||[])if(content?.type==='output_text'&&content.text)return content.text;return ''}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido.'});
  if(!process.env.OPENAI_API_KEY)return send(res,503,{error:'La IA externa no está habilitada. Usa “Estructurar local” o configura OPENAI_API_KEY en Vercel.'});
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  try{if(!await authenticate(token))return send(res,401,{error:'Sesión Supabase requerida.'})}catch{return send(res,503,{error:'No fue posible validar la sesión.'})}
  const input=req.body&&typeof req.body==='object'?req.body:null,serialized=JSON.stringify(input||{});if(!input||serialized.length>30000)return send(res,400,{error:'Entrada inválida o demasiado extensa.'});
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_CLINICAL_MODEL||'gpt-5-mini',store:false,instructions:'Eres un asistente de documentación clínica ambulatoria en México. Convierte únicamente hechos aportados por el médico en una nota clara y concisa. No inventes hallazgos normales, negaciones, diagnósticos, códigos CIE-10, tratamientos, dosis ni signos vitales. Conserva incertidumbre y temporalidad. Diagnoses solo puede contener diagnósticos explícitamente documentados. Si falta información médico-legal o hay ambigüedad, déjala vacía y agrega una advertencia breve en reviewWarnings. La salida es un borrador que el médico debe revisar.',input:serialized,text:{format:{type:'json_schema',name:'clinical_note_draft',strict:true,schema}}})});
    const payload=await response.json();if(!response.ok)return send(res,502,{error:'El proveedor de IA no respondió correctamente.'});
    const text=outputText(payload);if(!text)throw new Error('empty');const result=JSON.parse(text);return send(res,200,{...result,model:process.env.OPENAI_CLINICAL_MODEL||'gpt-5-mini'});
  }catch{return send(res,502,{error:'No fue posible generar el borrador. La nota local no fue modificada.'})}
};
