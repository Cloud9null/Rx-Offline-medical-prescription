(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RxQuickNote=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  const LABELS={
    ambulatory:'NOTA MÉDICA AMBULATORIA',soap:'NOTA CLÍNICA SOAP',evolution:'NOTA DE EVOLUCIÓN',
    telemedicine:'NOTA DE TELECONSULTA',referral:'REFERENCIA / INTERCONSULTA'
  };
  const BLOCKS=[
    ['MOTIVO DE CONSULTA','reasonForVisit'],['PADECIMIENTO ACTUAL','currentIllness'],
    ['REVISIÓN POR SISTEMAS','reviewOfSystems'],['EXPLORACIÓN FÍSICA','physicalExam'],
    ['RESULTADOS RELEVANTES','relevantResults'],['RAZONAMIENTO / IMPRESIÓN CLÍNICA','assessment'],
    ['PLAN DIAGNÓSTICO','diagnosticPlan'],['TRATAMIENTO E INDICACIONES','plan'],
    ['PRONÓSTICO','prognosis'],['SIGNOS DE ALARMA','warningSigns'],
    ['SEGUIMIENTO','followUp'],['REFERENCIA / INTERCONSULTA','referral']
  ];
  let deps={},bound=false;
  const $=selector=>root?.document?.querySelector(selector);
  const clean=value=>String(value||'').replace(/\r/g,'').trim();

  function formatStandalone({sections={},noteType='ambulatory',ageLabel='',sex='',diagnoses=[],warnings=[],generatedAt=new Date()}={}){
    const lines=[LABELS[noteType]||LABELS.ambulatory];
    const context=[clean(ageLabel)&&`Edad: ${clean(ageLabel)}`,clean(sex)&&`Sexo registrado: ${clean(sex)}`].filter(Boolean);
    if(context.length)lines.push(context.join(' | '));
    lines.push(`Borrador generado: ${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(generatedAt))}`,'');
    for(const [title,key] of BLOCKS){const value=clean(sections[key]);if(value)lines.push(title,value,'')}
    const dx=(diagnoses||[]).map(item=>clean(item?.text||item)).filter(Boolean);
    if(dx.length)lines.push('DIAGNÓSTICOS / PROBLEMAS',dx.map((item,index)=>`${index+1}. ${item}`).join('\n'),'');
    const review=(warnings||[]).map(clean).filter(Boolean);
    if(review.length)lines.push('PUNTOS PENDIENTES DE REVISIÓN',review.map(item=>`• ${item}`).join('\n'),'');
    lines.push('BORRADOR CLÍNICO — REQUIERE REVISIÓN, COMPLETADO Y FIRMA DEL PROFESIONAL.');
    return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }

  function status(message,ok=false){const el=$('#quickNoteStatus');if(!el)return;el.textContent=message;el.classList.toggle('ok',ok)}
  function output(value){const el=$('#quickNoteOutput');if(!el)return;el.value=clean(value);const chip=$('#quickNoteState');if(chip)chip.textContent=el.value?'Borrador sin firmar':'Vacío'}
  function context(){return {noteType:$('#quickNoteType')?.value||'ambulatory',ageLabel:clean($('#quickNoteAge')?.value),sex:$('#quickNoteSex')?.value||''}}
  function points(){return clean($('#quickNotePoints')?.value)}
  function requirePoints(){const value=points();if(!value)status('Escribe o dicta los puntos clínicos que deseas organizar.');return value}
  function renderResult(result){output(formatStandalone({...context(),sections:result.sections||{},diagnoses:result.diagnoses||[],warnings:result.reviewWarnings||[]}))}
  function resetClinicalReview(){const area=$('#aiClinicalReview');if(area){area.replaceChildren();area.hidden=true}}
  function reviewGroup(parent,title,rows,render){
    const section=document.createElement('section'),heading=document.createElement('h4');heading.textContent=title;section.appendChild(heading);
    if(!rows?.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Sin datos aportados o propuestas en esta sección.';section.appendChild(empty)}
    else for(const item of rows){const card=document.createElement('article');card.className='ai-review-item';render(card,item);section.appendChild(card)}
    parent.appendChild(section);
  }
  function reviewText(parent,label,value){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`${label}: `;p.append(strong,document.createTextNode(clean(value)||'No documentado'));parent.appendChild(p)}
  function renderClinicalReview(result){
    const area=$('#aiClinicalReview');if(!area)return;area.replaceChildren();area.hidden=false;
    const header=document.createElement('div');header.className='assistant-head';header.innerHTML='<div><span class="eyebrow">ANÁLISIS SIN FIRMAR</span><h3>Revisión clínica sugerida</h3></div>';
    const notice=document.createElement('p');notice.className='quick-note-safety';notice.textContent='Estas son hipótesis, no diagnósticos confirmados. No se copiaron al expediente ni a la receta. Sin consulta de guías en tiempo real; verifica indicación, dosis, interacciones y referencias vigentes antes de decidir.';header.appendChild(notice);area.appendChild(header);
    reviewGroup(area,'1 · Urgencias y señales de alarma',result.urgentFindings,(card,item)=>{card.textContent=clean(item)});
    reviewGroup(area,'2 · Diagnósticos diferenciales',result.differential,(card,item)=>{const title=document.createElement('h5');title.textContent=`${clean(item.name)} · prioridad ${clean(item.priority)}`;card.appendChild(title);reviewText(card,'A favor',item.supporting);reviewText(card,'En contra o pendiente',item.against)});
    reviewGroup(area,'3 · Datos necesarios para decidir',result.missingData,(card,item)=>{card.textContent=clean(item)});
    reviewGroup(area,'4 · Estudios a considerar',result.workup,(card,item)=>{card.textContent=clean(item)});
    reviewGroup(area,'5 · Opciones terapéuticas condicionadas',result.treatmentOptions,(card,item)=>{const title=document.createElement('h5');title.textContent=clean(item.forDiagnosis);card.appendChild(title);reviewText(card,'Opción a valorar',item.option);reviewText(card,'Solo si',item.conditions);reviewText(card,'Seguridad',item.safety)});
    reviewGroup(area,'6 · Revisión adicional',result.reviewWarnings,(card,item)=>{card.textContent=clean(item)});
  }
  function reasoningContext(){
    const fields={symptoms:'#aiSymptoms',duration:'#aiDuration',pertinentNegatives:'#aiNegatives',vitals:'#aiVitals',history:'#aiHistory',allergies:'#aiAllergies',medications:'#aiMeds',renalHepatic:'#aiRenal',pregnancy:'#aiPregnancy',tests:'#aiTests'};
    return Object.fromEntries(Object.entries(fields).map(([key,selector])=>[key,clean($(selector)?.value)]));
  }
  async function analyzeClinical(){
    const clinical=reasoningContext();if(!clinical.symptoms)return status('Describe los síntomas principales para analizar el cuadro.');
    if(!$('#quickNoteConsent')?.checked)return status('Autoriza esta generación después de revisar que no haya identificadores.');
    const token=await deps.getToken?.();if(!token)return status('Conecta tu cuenta autorizada de Supabase para usar la IA.');
    const button=$('#aiReasoningBtn');button.disabled=true;status('Preparando hipótesis y opciones para revisión médica…');resetClinicalReview();
    try{
      const payload={mode:'clinical_reasoning',ageLabel:context().ageLabel,sex:context().sex,context:clinical};
      const response=await fetch(root.ClinovyraRuntime?.clinicalApiUrl()||'/api/clinical-note',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const body=await response.json();if(!response.ok)throw new Error(body?.error||'No fue posible analizar el caso.');
      renderResult({sections:body.sections,reviewWarnings:body.reviewWarnings});renderClinicalReview(body);$('#quickNoteConsent').checked=false;
      status('Análisis temporal listo. Confirma diagnósticos, seguridad terapéutica y redacción antes de documentar o prescribir.',true);
    }catch(error){status(error?.message||'No se obtuvo análisis; el expediente no cambió.')}finally{button.disabled=false}
  }

  function structureLocal(){
    const value=requirePoints();if(!value)return;
    const assistant=root.RxClinicalAssistant;if(!assistant)return status('El estructurador clínico no está disponible.');
    resetClinicalReview();renderResult({sections:assistant.structureLocal(value)});
    status('Estructurado completamente en este dispositivo. Revisa y completa el borrador.',true);
  }

  async function generateAi(){
    const value=requirePoints();if(!value)return;
    if(!$('#quickNoteConsent')?.checked)return status('Marca el consentimiento de esta generación o usa el estructurador local.');
    const token=await deps.getToken?.();if(!token)return status('Conecta tu cuenta autorizada de Supabase para usar el endpoint protegido de IA.');
    const button=$('#quickNoteAiBtn');button.disabled=true;status('Generando un borrador clínico desidentificado…');
    try{
      const payload=root.RxClinicalAssistant.buildAiPayload(value,{},context());
      const response=await fetch(window.ClinovyraRuntime?.clinicalApiUrl()||'/api/clinical-note',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const body=await response.json();if(!response.ok)throw new Error(body?.error||'No se pudo generar el borrador.');
      resetClinicalReview();renderResult(body);$('#quickNoteConsent').checked=false;
      status(`Borrador generado${body.model?` con ${body.model}`:''}. Revisa omisiones y exactitud antes de usarlo.`,true);
    }catch(error){status(error?.message||'No fue posible generar el borrador. No se guardó información.')}finally{button.disabled=false}
  }

  async function copyOutput(){const value=clean($('#quickNoteOutput')?.value);if(!value)return status('Primero genera o escribe un borrador.');try{await navigator.clipboard.writeText(value);deps.toast?.('Borrador copiado como texto plano')}catch{const el=$('#quickNoteOutput');el.focus();el.select();status('El navegador bloqueó el portapapeles. El texto quedó seleccionado para copiarlo manualmente.')}}
  function downloadOutput(){const value=clean($('#quickNoteOutput')?.value);if(!value)return status('Primero genera o escribe un borrador.');const blob=new Blob([value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`nota-clinica-borrador-${new Date().toISOString().slice(0,10)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);deps.toast?.('Archivo .txt preparado')}
  async function shareOutput(){const value=clean($('#quickNoteOutput')?.value);if(!value)return status('Primero genera o escribe un borrador.');if(navigator.share)try{return await navigator.share({title:'Borrador de nota clínica',text:value})}catch(error){if(error?.name==='AbortError')return}await copyOutput();status('Compartir no está disponible; se intentó copiar el texto.')}
  function showReadMode(){const value=clean($('#quickNoteOutput')?.value);if(!value)return status('Primero genera o escribe un borrador.');$('#quickNoteReadText').textContent=value;$('#quickNoteReadDialog').showModal()}
  function printOutput(){const value=clean($('#quickNoteOutput')?.value);if(!value)return status('Primero genera o escribe un borrador.');const area=$('#printArea');area.classList.remove('manual-print-area');area.textContent='';const page=document.createElement('article'),pre=document.createElement('pre');page.className='quick-note-print';pre.textContent=value;page.appendChild(pre);area.appendChild(page);document.body.classList.add('printing-quick-note');setTimeout(()=>window.ClinovyraPrint.print('Medivorix - nota rápida').catch(e=>status(e.message)),80);setTimeout(()=>document.body.classList.remove('printing-quick-note'),window.Capacitor?.isNativePlatform?.()?60000:800)}
  function clearAll(){if((points()||clean($('#quickNoteOutput')?.value)||reasoningContext().symptoms)&&!confirm('¿Limpiar este borrador temporal? No se puede recuperar.'))return;$('#quickNoteForm')?.reset();resetClinicalReview();output('');status('Borrador temporal limpio.',true)}
  function onLock(){if($('#quickNoteForm'))$('#quickNoteForm').reset();resetClinicalReview();output('');status('');$('#quickNoteReadText')&&( $('#quickNoteReadText').textContent='' );$('#quickNoteReadDialog')?.open&&$('#quickNoteReadDialog').close()}

  function bind(){
    if(bound||!$('#quickNoteForm'))return;bound=true;
    $('#quickNoteForm').addEventListener('submit',event=>event.preventDefault());
    $('#quickNoteLocalBtn').addEventListener('click',structureLocal);$('#quickNoteAiBtn').addEventListener('click',generateAi);$('#aiReasoningBtn').addEventListener('click',analyzeClinical);
    $('#quickNoteCopyBtn').addEventListener('click',copyOutput);$('#quickNoteDownloadBtn').addEventListener('click',downloadOutput);$('#quickNoteShareBtn').addEventListener('click',shareOutput);$('#quickNotePrintBtn').addEventListener('click',printOutput);$('#quickNoteReadBtn').addEventListener('click',showReadMode);$('#quickNoteClearBtn').addEventListener('click',clearAll);
    $('#quickNoteReadCloseBtn').addEventListener('click',()=>$('#quickNoteReadDialog').close());$('#quickNoteReadCloseBottomBtn').addEventListener('click',()=>$('#quickNoteReadDialog').close());
    $('#quickNoteOutput').addEventListener('input',()=>{$('#quickNoteState').textContent=clean($('#quickNoteOutput').value)?'Editado · sin firmar':'Vacío'});
  }
  function init(nextDeps={}){deps={...deps,...nextDeps};bind()}
  return {init,onLock,formatStandalone};
});

