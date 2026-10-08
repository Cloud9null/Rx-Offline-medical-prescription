(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RxEmrCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const COLLECTIONS=['encounters','clinicalNotes','noteVersions','diagnoses','observations','allergies','medications','orders','documents','consents','prescriptionLinks','auditEvents','syncQueue','conflicts'];
  const NOTE_TYPES=['first_visit','follow_up','referral'];

  function emptyState(){
    const state={schemaVersion:3};
    for(const name of COLLECTIONS)state[name]=[];
    return state;
  }

  function ensureState(vault){
    if(!vault.emr||typeof vault.emr!=='object')vault.emr=emptyState();
    vault.emr.schemaVersion=Math.max(3,Number(vault.emr.schemaVersion)||0);
    for(const name of COLLECTIONS)if(!Array.isArray(vault.emr[name]))vault.emr[name]=[];
    return vault.emr;
  }

  function uuid(){
    if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
  }

  function encounterFolio(date=new Date(),random=uuid().replace(/-/g,'').slice(0,6).toUpperCase()){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `NC-${y}${m}${d}-${random}`;
  }

  function parseLocalDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;
    const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d);
    return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
  }

  function ageAt(dob,at=new Date()){
    const birth=parseLocalDate(dob),when=at instanceof Date?at:new Date(at);
    if(!birth||Number.isNaN(when.getTime())||birth>when)return null;
    let years=when.getFullYear()-birth.getFullYear();
    const beforeBirthday=when.getMonth()<birth.getMonth()||(when.getMonth()===birth.getMonth()&&when.getDate()<birth.getDate());
    if(beforeBirthday)years--;
    const cursor=new Date(birth.getFullYear()+years,birth.getMonth(),birth.getDate());
    let months=(when.getFullYear()-cursor.getFullYear())*12+when.getMonth()-cursor.getMonth();
    if(when.getDate()<cursor.getDate())months--;
    months=Math.max(0,months);
    const monthCursor=new Date(cursor.getFullYear(),cursor.getMonth()+months,cursor.getDate());
    const days=Math.max(0,Math.floor((new Date(when.getFullYear(),when.getMonth(),when.getDate())-monthCursor)/86400000));
    return {years,months:years*12+months,days,label:years>=2?`${years} años`:(years>=1?`${years} año ${months} meses`:(months>=1?`${months} meses ${days} días`:`${days} días`))};
  }

  function bmi(weightKg,heightCm){
    const w=Number(weightKg),h=Number(heightCm)/100;
    return w>0&&h>0?Math.round((w/(h*h))*10)/10:null;
  }

  function vitalAlerts(v={}){
    const out=[];
    const push=(field,message,severity='warning')=>out.push({field,message,severity});
    const sbp=Number(v.sbp),dbp=Number(v.dbp),hr=Number(v.hr),rr=Number(v.rr),temp=Number(v.temperature),spo2=Number(v.spo2),weight=Number(v.weight),height=Number(v.height);
    if(v.sbp!==''&&(sbp<50||sbp>280))push('sbp','TA sistólica fuera de rango plausible','danger');
    else if(sbp>=180||sbp<80)push('sbp','TA sistólica requiere valoración clínica');
    if(v.dbp!==''&&(dbp<20||dbp>180))push('dbp','TA diastólica fuera de rango plausible','danger');
    else if(dbp>=120||dbp<50)push('dbp','TA diastólica requiere valoración clínica');
    if(v.hr!==''&&(hr<20||hr>260))push('hr','FC fuera de rango plausible','danger');
    else if(hr>120||hr<45)push('hr','FC requiere correlación clínica');
    if(v.rr!==''&&(rr<4||rr>80))push('rr','FR fuera de rango plausible','danger');
    if(v.temperature!==''&&(temp<30||temp>44))push('temperature','Temperatura fuera de rango plausible','danger');
    else if(temp>=38||temp<35)push('temperature','Temperatura requiere valoración clínica');
    if(v.spo2!==''&&(spo2<50||spo2>100))push('spo2','SpO₂ fuera de rango plausible','danger');
    else if(spo2<92)push('spo2','SpO₂ baja; correlacionar y confirmar');
    if(v.weight!==''&&(weight<=0||weight>500))push('weight','Peso fuera de rango plausible','danger');
    if(v.height!==''&&(height<20||height>260))push('height','Talla fuera de rango plausible','danger');
    return out;
  }

  function stable(value){
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object')return Object.keys(value).sort().reduce((o,k)=>{if(value[k]!==undefined)o[k]=stable(value[k]);return o},{});
    return value;
  }

  function canonicalJson(value){return JSON.stringify(stable(value))}
  function cleanText(v,max=20000){return String(v??'').replace(/\u0000/g,'').trim().slice(0,max)}

  function validateDraft(note,diagnoses=[]){
    const errors=[];
    if(!cleanText(note?.sections?.reasonForVisit,500))errors.push('Motivo de consulta');
    if(!cleanText(note?.sections?.currentIllness))errors.push('Padecimiento actual');
    if(!cleanText(note?.sections?.physicalExam))errors.push('Exploración física');
    if(!diagnoses.some(d=>cleanText(d.text,500)))errors.push('Al menos un diagnóstico o problema clínico');
    if(!cleanText(note?.sections?.assessment))errors.push('Razonamiento / impresión clínica');
    if(!cleanText(note?.sections?.plan))errors.push('Plan e indicaciones');
    return errors;
  }

  function noteSnapshot({encounter,note,patient,profile,diagnoses=[],observations=[],allergies=[],orders=[]}){
    return {
      schema:'rx-offline-emr-note',version:1,
      noteId:note.id,encounterId:encounter.id,folio:encounter.folio,
      occurredAt:encounter.occurredAt,noteType:note.noteType,
      patient:{id:patient.id,name:patient.name,dob:patient.dob||'',sex:patient.sex||'',address:patient.address||'',ageAtEncounter:ageAt(patient.dob,encounter.occurredAt)?.label||''},
      author:{name:profile.name||'',role:profile.role||'',license:profile.license||''},
      facility:{type:profile.facilityType||'',name:profile.facilityName||'Consultorio médico',address:profile.address||''},
      sections:stable(note.sections||{}),
      diagnoses:diagnoses.map(d=>({id:d.id,code:d.code||'',text:d.text||'',status:d.status||'working'})),
      observations:observations.map(o=>stable(o)),
      allergies:allergies.map(a=>({substance:a.substance||'',reaction:a.reaction||'',severity:a.severity||'',status:a.status||'active'})),
      orders:orders.map(o=>({id:o.id,name:o.name||'',status:o.status||'ordered',result:o.result||'',resultedAt:o.resultedAt||''}))
    };
  }

  function mergeRecord(local,remote){
    if(!local)return remote;
    if(local.status==='final')return local;
    if(remote.status==='final')return remote;
    return Date.parse(remote.updatedAt||0)>Date.parse(local.updatedAt||0)?remote:local;
  }

  function mergeCollection(local=[],remote=[]){
    const byId=new Map(local.map(x=>[x.id,x]));
    for(const item of remote||[])if(item?.id)byId.set(item.id,mergeRecord(byId.get(item.id),item));
    return Array.from(byId.values());
  }

  return {COLLECTIONS,NOTE_TYPES,emptyState,ensureState,uuid,encounterFolio,parseLocalDate,ageAt,bmi,vitalAlerts,stable,canonicalJson,cleanText,validateDraft,noteSnapshot,mergeRecord,mergeCollection};
});

