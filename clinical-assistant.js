(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RxClinicalAssistant=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SECTION_KEYS=['reasonForVisit','currentIllness','reviewOfSystems','physicalExam','relevantResults','assessment','diagnosticPlan','plan','prognosis','warningSigns','followUp','referral'];
  const LABELS={
    mc:'reasonForVisit',motivo:'reasonForVisit',pa:'currentIllness',padecimiento:'currentIllness',evolucion:'currentIllness',ros:'reviewOfSystems',sistemas:'reviewOfSystems',
    ef:'physicalExam',exploracion:'physicalExam',resultados:'relevantResults',estudios:'relevantResults',impresion:'assessment',analisis:'assessment',razonamiento:'assessment',
    plan_dx:'diagnosticPlan',diagnostico_plan:'diagnosticPlan',tratamiento:'plan',plan:'plan',pronostico:'prognosis',alarmas:'warningSigns',alarma:'warningSigns',seguimiento:'followUp',referencia:'referral'
  };
  const clean=value=>String(value||'').replace(/\r/g,'').trim().slice(0,12000);
  const normalizeLabel=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  function structureLocal(points,existing={}){
    const result=Object.fromEntries(SECTION_KEYS.map(k=>[k,clean(existing[k])]));let active='',unlabeled=[];
    for(const rawLine of clean(points).split('\n')){
      const line=rawLine.trim();if(!line)continue;
      const match=line.match(/^([^:]{1,28}):\s*(.*)$/),key=match?LABELS[normalizeLabel(match[1])]:null;
      if(key){active=key;if(match[2])result[key]=[result[key],match[2].trim()].filter(Boolean).join('\n');continue}
      if(active)result[active]=[result[active],line].filter(Boolean).join('\n');else unlabeled.push(line);
    }
    if(unlabeled.length){const narrative=unlabeled.join(' ');result.currentIllness=[result.currentIllness,narrative].filter(Boolean).join('\n');if(!result.reasonForVisit)result.reasonForVisit=unlabeled[0].split(/[.;]/)[0].slice(0,240)}
    return result;
  }
  function mergeSuggestions(existing,suggested,{overwrite=false}={}){const out={...existing};for(const key of SECTION_KEYS){const value=clean(suggested?.[key]);if(value&&(overwrite||!clean(out[key])))out[key]=value}return out}
  function buildAiPayload(points,sections={},context={}){
    const documented=Object.fromEntries(SECTION_KEYS.map(k=>[k,clean(sections[k]).slice(0,4000)]));
    return {schemaVersion:1,locale:'es-MX',noteType:String(context.noteType||'ambulatory').slice(0,40),ageLabel:String(context.ageLabel||'').slice(0,40),sex:String(context.sex||'').slice(0,20),keyPoints:clean(points).slice(0,10000),documented};
  }
  function plainText({patient={},encounter={},note={},profile={},diagnoses=[],observation={},orders=[],includeIdentifiers=true}){
    const s=note.finalSnapshot?.sections||note.sections||{},lines=[];
    lines.push('NOTA MÉDICA AMBULATORIA');
    if(profile.name)lines.push(`Médico: ${profile.name}${profile.license?` | Cédula: ${profile.license}`:''}`);
    if(includeIdentifiers&&patient.name)lines.push(`Paciente: ${patient.name}${patient.dob?` | Fecha de nacimiento: ${patient.dob}`:''}${patient.sex?` | Sexo: ${patient.sex}`:''}`);
    if(encounter.folio)lines.push(`Folio: ${encounter.folio}`);if(encounter.occurredAt)lines.push(`Fecha y hora: ${new Date(encounter.occurredAt).toLocaleString('es-MX')}`);lines.push('');
    const blocks=[['MOTIVO DE CONSULTA',s.reasonForVisit],['PADECIMIENTO ACTUAL',s.currentIllness],['REVISIÓN POR SISTEMAS',s.reviewOfSystems],['EXPLORACIÓN FÍSICA',s.physicalExam],['RESULTADOS RELEVANTES',s.relevantResults],['RAZONAMIENTO / IMPRESIÓN CLÍNICA',s.assessment],['PLAN DIAGNÓSTICO',s.diagnosticPlan],['TRATAMIENTO E INDICACIONES',s.plan],['PRONÓSTICO',s.prognosis],['SIGNOS DE ALARMA',s.warningSigns],['SEGUIMIENTO',s.followUp],['REFERENCIA / INTERCONSULTA',s.referral]];
    const vitals=[['TA',observation.sbp&&observation.dbp?`${observation.sbp}/${observation.dbp} mmHg`:''],['FC',observation.hr?`${observation.hr} lpm`:'' ],['FR',observation.rr?`${observation.rr} rpm`:'' ],['Temperatura',observation.temperature?`${observation.temperature} °C`:'' ],['SpO₂',observation.spo2?`${observation.spo2}%`:'' ],['Peso',observation.weight?`${observation.weight} kg`:'' ],['Talla',observation.height?`${observation.height} cm`:'' ],['IMC',observation.bmi??''],['Dolor',observation.pain!==''&&observation.pain!=null?`${observation.pain}/10`:'']].filter(x=>x[1]).map(x=>`${x[0]}: ${x[1]}`).join(' | ');
    if(vitals)blocks.splice(3,0,['SIGNOS VITALES',vitals]);if(diagnoses.length)blocks.splice(6,0,['DIAGNÓSTICOS / PROBLEMAS',diagnoses.map(d=>`${d.code?d.code+' - ':''}${d.text||''}${d.status?` (${d.status})`:''}`).join('\n')]);if(orders.length)blocks.splice(6,0,['ÓRDENES / RESULTADOS',orders.map(o=>`${o.name}${o.result?`: ${o.result}`:''}`).join('\n')]);
    for(const [title,value] of blocks)if(clean(value)){lines.push(title);lines.push(clean(value));lines.push('')}
    if(note.status==='final'&&note.seal){lines.push(`Finalizada: ${note.seal.signedAt||note.finalizedAt||''}`);lines.push(`SHA-256: ${note.seal.hash||''}`);lines.push('Documento firmado criptográficamente por la aplicación; requiere validación clínica y no equivale automáticamente a e.firma/FIEL.');}
    return lines.join('\n').trim();
  }
  return {SECTION_KEYS,structureLocal,mergeSuggestions,buildAiPayload,plainText};
});
