(function(){
  'use strict';
  const C=window.RxEmrCore,A=window.RxClinicalAssistant;
  const enc=new TextEncoder();
  let vault=null,app=null,autosaveTimer=null,pendingPrescriptionLink=null;
  const $=s=>document.querySelector(s);
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowLocalInput=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,16)};
  const fmt=iso=>{try{return new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso||'—'}};
  const b64url=bytes=>{let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  const emr=()=>C.ensureState(vault);
  const patient=id=>vault?.patients?.find(p=>p.id===id);
  const encounter=id=>emr().encounters.find(x=>x.id===id);
  const noteByEncounter=id=>emr().clinicalNotes.find(x=>x.encounterId===id);
  const prescription=id=>(vault?.recipes||[]).find(x=>x.id===id);
  function patientPrescriptions(patientId){return (vault?.recipes||[]).filter(r=>r.patient?.id===patientId).sort((a,b)=>String(b.issuedAt||'').localeCompare(String(a.issuedAt||'')))}
  function prescriptionSummary(rec){const names=(rec?.medications||[]).map(m=>m.name).filter(Boolean);return names.length?names.slice(0,3).join(', ')+(names.length>3?` +${names.length-3}`:''):'Sin medicamentos capturados'}
  function linkedPrescriptions(encounterId){return emr().prescriptionLinks.filter(l=>l.encounterId===encounterId).map(l=>prescription(l.rxId)).filter(Boolean)}
  function unlinkedPatientPrescriptions(patientId){const linked=new Set(emr().prescriptionLinks.map(l=>l.rxId));return patientPrescriptions(patientId).filter(r=>!linked.has(r.id))}

  async function hashAndSign(canonical){
    const bytes=enc.encode(canonical),hash=b64url(await crypto.subtle.digest('SHA-256',bytes));
    const priv=await crypto.subtle.importKey('jwk',vault.signing.privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
    const signature=b64url(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},priv,bytes));
    return {algorithm:'ECDSA-P256-SHA256',hash,signature,publicJwk:vault.signing.publicJwk,keyFingerprint:vault.signing.keyFingerprint,signedAt:new Date().toISOString(),author:{name:vault.profile?.name||'',license:vault.profile?.license||''}};
  }

  async function verifySigned(canonical,seal){
    try{
      const bytes=enc.encode(canonical),hash=b64url(await crypto.subtle.digest('SHA-256',bytes));
      if(hash!==seal?.hash)return false;
      let raw=seal.signature.replace(/-/g,'+').replace(/_/g,'/');while(raw.length%4)raw+='=';
      const sig=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
      const pub=await crypto.subtle.importKey('jwk',seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,sig,bytes);
    }catch{return false}
  }

  function init(nextVault,nextApp){
    vault=nextVault;app=nextApp;C.ensureState(vault);bindStatic();renderDashboard();
  }

  function onLock(){vault=null;app=null;pendingPrescriptionLink=null;clearTimeout(autosaveTimer)}

  function bindStatic(){
    if(document.body.dataset.emrBound)return;
    document.body.dataset.emrBound='1';
    $('#newEncounterHomeBtn')?.addEventListener('click',()=>openStart());
    $('#newEncounterBtn')?.addEventListener('click',()=>openStart());
    $('#directRxHomeBtn')?.addEventListener('click',directPrescription);
    $('#emrSearch')?.addEventListener('input',e=>renderActivity(e.target.value));
    $('#encounterStartForm')?.addEventListener('submit',createEncounter);
    $('#encounterPatient')?.addEventListener('change',e=>renderSourcePrescriptionOptions(e.target.value));
    $('#clinicalProfileForm')?.addEventListener('submit',saveClinicalProfile);
    $('#addAllergyBtn')?.addEventListener('click',()=>addAllergyRow());
    $('#addendumForm')?.addEventListener('submit',saveAddendum);
    document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.closeDialog)?.close()));
  }

  function renderDashboard(){
    if(!vault)return;
    const x=emr(),drafts=x.clinicalNotes.filter(n=>n.status==='draft').length,finals=x.clinicalNotes.filter(n=>n.status==='final').length;
    if($('#encounterCount'))$('#encounterCount').textContent=String(x.encounters.length);
    if($('#draftCount'))$('#draftCount').textContent=`${drafts} borrador${drafts===1?'':'es'}`;
    if($('#emrDraftMetric'))$('#emrDraftMetric').textContent=String(drafts);
    if($('#emrFinalMetric'))$('#emrFinalMetric').textContent=String(finals);
    if($('#emrPatientMetric'))$('#emrPatientMetric').textContent=String(vault.patients.filter(p=>!p.archived).length);
    renderActivity($('#emrSearch')?.value||'');
  }

  function renderActivity(filter=''){
    const el=$('#emrActivity');if(!el||!vault)return;
    const q=filter.trim().toLowerCase();
    const rows=[...emr().encounters].sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt))).filter(e=>{
      const p=patient(e.patientId),n=noteByEncounter(e.id);return !q||[e.folio,p?.name,n?.sections?.reasonForVisit].some(v=>String(v||'').toLowerCase().includes(q));
    });
    const conflictBanner=emr().conflicts.some(c=>c.status==='open')?'<div class="conflict-banner"><strong>Conflicto clínico protegido</strong><span>Se detectaron dos versiones finalizadas distintas. Ninguna se sobrescribió; requiere revisión manual.</span></div>':'';
    el.innerHTML=conflictBanner+(rows.length?rows.map(e=>{const p=patient(e.patientId),n=noteByEncounter(e.id),status=n?.status||'draft';return `<article class="timeline-item"><div class="timeline-dot ${status}"></div><div class="timeline-content"><div class="timeline-head"><div><strong>${esc(p?.name||'Paciente')}</strong><small>${esc(e.folio)} · ${fmt(e.occurredAt)}</small></div><span class="note-status ${status}">${status==='final'?'FINALIZADA':'BORRADOR'}</span></div><p>${esc(n?.sections?.reasonForVisit||'Consulta sin motivo capturado')}</p><div class="row-actions wrap"><button class="btn small secondary" data-open-encounter="${e.id}" type="button">${status==='final'?'Ver nota':'Continuar nota'}</button><button class="btn small ghost" data-open-record="${e.patientId}" type="button">Expediente</button></div></div></article>`}).join(''):'<div class="empty-state">No hay consultas que coincidan. Crea una consulta sin afectar la opción de receta directa.</div>');
    el.querySelectorAll('[data-open-encounter]').forEach(b=>b.addEventListener('click',()=>openEncounter(b.dataset.openEncounter)));
    el.querySelectorAll('[data-open-record]').forEach(b=>b.addEventListener('click',()=>openPatientRecord(b.dataset.openRecord)));
  }

  function renderSourcePrescriptionOptions(patientId,selectedRxId=''){
    const select=$('#encounterSourceRx'),wrap=$('#encounterSourceRxWrap');if(!select)return;
    const rows=unlinkedPatientPrescriptions(patientId);select.innerHTML='<option value="">Sin receta previa</option>'+rows.map(r=>`<option value="${esc(r.id)}">${esc(r.id)} · ${esc(fmt(r.issuedAt))} · ${esc(prescriptionSummary(r))}</option>`).join('');
    select.value=selectedRxId&&rows.some(r=>r.id===selectedRxId)?selectedRxId:'';select.disabled=!rows.length;if(wrap)wrap.classList.toggle('no-options',!rows.length);
  }

  function openStart(patientId='',sourceRxId=''){
    const select=$('#encounterPatient'),pts=vault.patients.filter(p=>!p.archived).sort((a,b)=>a.name.localeCompare(b.name));
    if(!pts.length){app.toast('Primero registra un paciente.');app.openPatient();return}
    select.innerHTML='<option value="">Seleccionar…</option>'+pts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
    select.value=patientId&&pts.some(p=>p.id===patientId)?patientId:'';renderSourcePrescriptionOptions(select.value,sourceRxId);$('#encounterOccurredAt').value=nowLocalInput();$('#encounterType').value=sourceRxId?'follow_up':'first_visit';$('#encounterStartDialog').showModal();
  }

  async function createEncounter(e){
    e.preventDefault();const patientId=$('#encounterPatient').value,p=patient(patientId);if(!p)return app.toast('Selecciona un paciente.');
    const sourceRxId=$('#encounterSourceRx')?.value||'',sourceRx=sourceRxId?prescription(sourceRxId):null;
    if(sourceRxId&&(!sourceRx||sourceRx.patient?.id!==patientId))return app.toast('La receta seleccionada no pertenece a este paciente.');
    if(sourceRxId&&emr().prescriptionLinks.some(l=>l.rxId===sourceRxId))return app.toast('Esta receta ya está vinculada a una nota.');
    const occurredAt=new Date($('#encounterOccurredAt').value).toISOString(),id=C.uuid(),noteId=C.uuid(),ts=new Date().toISOString();
    emr().encounters.push({id,folio:C.encounterFolio(new Date(occurredAt)),patientId,type:$('#encounterType').value,status:'draft',occurredAt,createdAt:ts,updatedAt:ts,finalizedAt:null});
    emr().clinicalNotes.push({id:noteId,encounterId:id,patientId,noteType:$('#encounterType').value,status:'draft',sections:emptySections(),createdAt:ts,updatedAt:ts,finalizedAt:null,finalSnapshot:null,seal:null,observationId:C.uuid()});
    audit('encounter.created','encounter',id,{noteId,sourceRxId:sourceRxId||null});
    if(sourceRx){const link={id:C.uuid(),encounterId:id,noteId,patientId,rxId:sourceRx.id,createdAt:ts};emr().prescriptionLinks.push(link);audit('prescription.linked_retroactively','prescription_link',link.id,{rxId:sourceRx.id,encounterId:id})}
    await app.save();app.queueSync();$('#encounterStartDialog').close();openEncounter(id);
  }

  function emptySections(){return {reasonForVisit:'',currentIllness:'',reviewOfSystems:'',physicalExam:'',relevantResults:'',assessment:'',diagnosticPlan:'',plan:'',prognosis:'',instructions:'',warningSigns:'',followUp:'',referral:''}}

  function sectionField(key,label,rows=3,placeholder=''){return `<label>${label}<textarea data-note-field="${key}" rows="${rows}" placeholder="${esc(placeholder)}"></textarea></label>`}
  function vitalField(key,label,unit,min,max,step='1'){return `<label>${label}<div class="input-unit"><input data-vital="${key}" type="number" min="${min}" max="${max}" step="${step}" inputmode="decimal"><span>${unit}</span></div></label>`}

  function openEncounter(id){
    const e=encounter(id),n=noteByEncounter(id),p=patient(e?.patientId);if(!e||!n||!p)return;
    app.navigateRaw('encounter');
    if(n.status==='final')return renderFinalNote(e,n,p);
    const age=C.ageAt(p.dob,e.occurredAt),profile=p.clinical||{},relatedRx=linkedPrescriptions(e.id);
    $('#encounterEditor').innerHTML=`<div class="encounter-top"><button class="btn ghost" id="backToEmr" type="button">← Expediente</button><div><span class="eyebrow">${esc(e.folio)}</span><h2>${esc(p.name)}</h2><p>${esc(age?.label||'Edad no disponible')} · ${esc(p.sex||'—')} · ${fmt(e.occurredAt)}</p></div><span id="autosaveState" class="save-state">Guardado</span></div>
      <div class="clinical-alert ${profile.allergyKnowledge==='known'?'danger':''}"><strong>Alergias:</strong> ${esc(profile.allergies||p.allergies||'Información no confirmada')}</div>
      ${relatedRx.length?`<section class="linked-rx-banner"><div><strong>℞ Receta previa vinculada</strong><small>${relatedRx.map(r=>`${esc(r.id)} · ${esc(fmt(r.issuedAt))} · ${esc(prescriptionSummary(r))}`).join('<br>')}</small></div>${relatedRx.map(r=>`<button class="btn small ghost" data-open-linked-rx="${esc(r.id)}" type="button">Ver receta</button>`).join('')}</section>`:''}
      <form id="encounterForm" class="encounter-layout"><aside class="patient-rail premium-card"><h3>Resumen del paciente</h3><dl><dt>F. nacimiento</dt><dd>${esc(p.dob||'—')}</dd><dt>Antecedentes</dt><dd>${esc(profile.pathologicalHistory||'Sin captura')}</dd><dt>Medicamentos</dt><dd>${esc(profile.currentMedications||'Sin captura')}</dd></dl><button class="btn secondary full" id="editClinicalProfile" type="button">Editar antecedentes</button><nav class="section-jump"><a href="#note-subjective">Interrogatorio</a><a href="#note-objective">Objetivo</a><a href="#note-assessment">Evaluación</a><a href="#note-plan">Plan</a></nav></aside>
      <div class="encounter-main">
        <section class="premium-card clinical-readiness" aria-label="Control de integridad del borrador"><div><span class="eyebrow">CONTROL DE DOCUMENTACIÓN</span><strong id="readinessScore">0 de 8 elementos</strong><small>Guía de captura; no sustituye el juicio clínico.</small></div><div id="readinessChecks" class="readiness-checks"><span data-ready="subjective">Interrogatorio</span><span data-ready="vitals">Signos vitales</span><span data-ready="exam">Exploración</span><span data-ready="diagnosis">Diagnóstico</span><span data-ready="assessment">Razonamiento</span><span data-ready="plan">Plan</span><span data-ready="safety">Alarmas</span><span data-ready="followup">Seguimiento</span></div></section>
        <section class="premium-card note-assistant"><div class="assistant-head"><div><span class="eyebrow">CAPTURA RÁPIDA</span><h3>Asistente de nota clínica</h3></div><span class="privacy-chip">Privacidad primero</span></div><p class="muted">Dicta o escribe puntos clave. El modo local los organiza sin salir del dispositivo. La IA externa es opcional, requiere sesión y consentimiento por cada nota.</p><textarea id="assistantKeyPoints" rows="5" placeholder="Ejemplo:\nMC: tos y fiebre\nPA: 3 días de evolución…\nEF: faringe hiperémica…\nImpresión: IRA probable\nPlan: manejo documentado…"></textarea><div class="assistant-actions"><button id="structureLocalBtn" class="btn secondary" type="button">Estructurar local</button><label class="ai-consent"><input id="aiConsent" type="checkbox"> Autorizo enviar solo estos datos clínicos desidentificados al proveedor de IA</label><button id="generateAiBtn" class="btn ghost" type="button">Generar borrador con IA</button></div><div class="row-actions wrap note-text-actions"><button id="copyDraftTextBtn" class="btn small ghost" type="button">Copiar nota en texto</button><button id="downloadDraftTextBtn" class="btn small ghost" type="button">Descargar .txt</button><button id="shareDraftTextBtn" class="btn small ghost" type="button">Compartir texto</button></div><div id="assistantStatus" class="inline-status" role="status"></div><p class="micro">El asistente no sustituye tu valoración. Nunca inventa hallazgos normales, negaciones, diagnósticos, códigos ni tratamientos; revisa antes de firmar.</p></section>
        <section id="note-subjective" class="premium-card note-section"><div class="card-title"><span>S</span><h3>Interrogatorio</h3></div>${sectionField('reasonForVisit','Motivo de consulta',2)}${sectionField('currentIllness','Padecimiento actual',5,'Inicio, evolución, características, factores asociados…')}${sectionField('reviewOfSystems','Revisión por sistemas',4)}</section>
        <section id="note-objective" class="premium-card note-section"><div class="card-title"><span>O</span><h3>Signos vitales y exploración</h3></div><div class="vitals-grid">${vitalField('sbp','TA sistólica','mmHg',40,300)}${vitalField('dbp','TA diastólica','mmHg',20,200)}${vitalField('hr','FC','lpm',20,260)}${vitalField('rr','FR','rpm',4,80)}${vitalField('temperature','Temperatura','°C',30,44,'0.1')}${vitalField('spo2','SpO₂','%',50,100)}${vitalField('weight','Peso','kg',0.2,500,'0.1')}${vitalField('height','Talla','cm',20,260,'0.1')}<label>Dolor<div class="input-unit"><input data-vital="pain" type="number" min="0" max="10" step="1"><span>/10</span></div></label><label>IMC<input id="calculatedBmi" readonly></label></div><div id="vitalAlerts" class="vital-alerts"></div>${sectionField('physicalExam','Exploración física',6)}${sectionField('relevantResults','Resultados relevantes',3)}<div class="subsection-head"><strong>Órdenes y resultados</strong><button id="addOrder" class="btn small secondary" type="button">＋ Orden</button></div><div id="orderList" class="order-list"></div></section>
        <section id="note-assessment" class="premium-card note-section"><div class="card-title"><span>A</span><h3>Problemas y razonamiento</h3></div><div id="diagnosisList" class="diagnosis-list"></div><button id="addDiagnosis" class="btn secondary" type="button">＋ Diagnóstico / problema</button>${sectionField('assessment','Razonamiento / impresión clínica',5)}</section>
        <section id="note-plan" class="premium-card note-section"><div class="card-title"><span>P</span><h3>Plan</h3></div>${sectionField('diagnosticPlan','Plan diagnóstico / estudios',3)}${sectionField('plan','Tratamiento e indicaciones',5)}${sectionField('prognosis','Pronóstico',2)}${sectionField('warningSigns','Signos de alarma',3)}${sectionField('followUp','Seguimiento',2)}${sectionField('referral','Referencia / interconsulta',2)}</section>
        <section class="premium-card note-section"><div class="card-title"><span>▣</span><h3>Documentos</h3></div><p class="micro">PDF/JPEG/PNG, máximo 3 MB. Se cifran individualmente antes de salir del dispositivo y se sincronizan como ciphertext en Storage privado.</p><label class="btn secondary file-btn">Adjuntar PDF o imagen<input id="documentInput" type="file" accept="application/pdf,image/png,image/jpeg"></label><div id="documentList"></div></section>
        <div class="finalize-bar"><div><strong>Borrador con guardado automático</strong><small>Finalizar crea un snapshot firmado; después solo se permiten addenda.</small></div><div class="row-actions"><button id="saveDraftBtn" class="btn secondary" type="button">Guardar borrador</button><button id="finalizeNoteBtn" class="btn primary" type="button">Finalizar y firmar</button></div></div>
      </div></form>`;
    populateDraft(e,n);bindEditor(e,n,p);
  }

  function populateDraft(e,n){
    document.querySelectorAll('[data-note-field]').forEach(x=>x.value=n.sections?.[x.dataset.noteField]||'');
    const obs=emr().observations.find(o=>o.id===n.observationId)||{};document.querySelectorAll('[data-vital]').forEach(x=>x.value=obs[x.dataset.vital]??'');
    renderDiagnoses(n.id);renderOrders(n.id);renderDocuments(n.id);updateVitalUI();updateReadiness();
  }

  function bindEditor(e,n,p){
    $('#backToEmr').addEventListener('click',()=>{renderDashboard();app.navigateRaw('emr')});
    $('#editClinicalProfile').addEventListener('click',()=>openClinicalProfile(p.id));
    $('#addDiagnosis').addEventListener('click',()=>{addDiagnosisRow();updateReadiness()});
    $('#addOrder').addEventListener('click',()=>addOrderRow());
    $('#encounterForm').addEventListener('input',()=>{updateVitalUI();updateReadiness();$('#autosaveState').textContent='Cambios pendientes';clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>saveDraft(e.id,true),700)});
    $('#saveDraftBtn').addEventListener('click',()=>saveDraft(e.id,false));
    $('#finalizeNoteBtn').addEventListener('click',()=>finalizeNote(e.id));
    $('#documentInput').addEventListener('change',ev=>attachDocument(ev,e,n));
    document.querySelectorAll('[data-open-linked-rx]').forEach(b=>b.addEventListener('click',()=>app.openRecipe(b.dataset.openLinkedRx)));
    $('#structureLocalBtn').addEventListener('click',()=>structureLocalDraft(e,n));$('#generateAiBtn').addEventListener('click',()=>generateAiDraft(e,n,p));$('#copyDraftTextBtn').addEventListener('click',()=>exportDraftText(e,n,p,'copy'));$('#downloadDraftTextBtn').addEventListener('click',()=>exportDraftText(e,n,p,'download'));$('#shareDraftTextBtn').addEventListener('click',()=>exportDraftText(e,n,p,'share'));
  }

  function addDiagnosisRow(data={}){
    const row=document.createElement('div');row.className='diagnosis-row';row.dataset.id=data.id||C.uuid();row.innerHTML=`<label>CIE-10 (opcional)<input data-dx-code maxlength="12" value="${esc(data.code||'')}" placeholder="Ej. I10"></label><label class="grow">Diagnóstico / problema<input data-dx-text required maxlength="500" value="${esc(data.text||'')}"></label><label>Estado<select data-dx-status><option value="working">Sospecha / trabajo</option><option value="confirmed">Definitivo</option><option value="ruled_out">Descartado</option><option value="history">Antecedente</option></select></label><button class="icon-btn" type="button" aria-label="Eliminar">×</button>`;row.querySelector('[data-dx-status]').value=data.status||'working';row.querySelector('button').addEventListener('click',()=>{row.remove();updateReadiness()});$('#diagnosisList').appendChild(row);
  }

  function renderDiagnoses(noteId){const list=$('#diagnosisList');list.innerHTML='';const rows=emr().diagnoses.filter(d=>d.noteId===noteId);if(rows.length)rows.forEach(addDiagnosisRow);else addDiagnosisRow()}
  function readDiagnoses(e,n){return Array.from(document.querySelectorAll('.diagnosis-row')).map(r=>({id:r.dataset.id,encounterId:e.id,noteId:n.id,patientId:e.patientId,code:C.cleanText(r.querySelector('[data-dx-code]').value,12).toUpperCase(),text:C.cleanText(r.querySelector('[data-dx-text]').value,500),status:r.querySelector('[data-dx-status]').value,updatedAt:new Date().toISOString()})).filter(d=>d.text||d.code)}
  function readObservation(e,n){const out={id:n.observationId,encounterId:e.id,noteId:n.id,patientId:e.patientId,updatedAt:new Date().toISOString()};document.querySelectorAll('[data-vital]').forEach(x=>out[x.dataset.vital]=x.value);out.bmi=C.bmi(out.weight,out.height);return out}
  function addOrderRow(data={}){const row=document.createElement('div');row.className='order-row';row.dataset.id=data.id||C.uuid();row.innerHTML=`<label class="grow">Estudio / orden<input data-order-name value="${esc(data.name||'')}" placeholder="Ej. Biometría hemática"></label><label>Estado<select data-order-status><option value="draft">Borrador</option><option value="ordered">Solicitado</option><option value="completed">Completado</option><option value="cancelled">Cancelado</option><option value="entered_in_error">Error de captura</option></select></label><label class="grow">Resultado / resumen<input data-order-result value="${esc(data.result||'')}"></label><button class="icon-btn" type="button" aria-label="Quitar">×</button>`;row.querySelector('[data-order-status]').value=data.status||'ordered';row.querySelector('button').addEventListener('click',()=>row.remove());$('#orderList').appendChild(row)}
  function renderOrders(noteId){const list=$('#orderList');list.innerHTML='';emr().orders.filter(o=>o.noteId===noteId).forEach(addOrderRow)}
  function readOrders(e,n){return Array.from(document.querySelectorAll('.order-row')).map(r=>({id:r.dataset.id,patientId:e.patientId,encounterId:e.id,noteId:n.id,name:C.cleanText(r.querySelector('[data-order-name]').value,500),status:r.querySelector('[data-order-status]').value,result:C.cleanText(r.querySelector('[data-order-result]').value,4000),resultedAt:r.querySelector('[data-order-status]').value==='completed'?new Date().toISOString():'',updatedAt:new Date().toISOString()})).filter(o=>o.name)}

  function updateVitalUI(){
    if(!$('#calculatedBmi'))return;const v={};document.querySelectorAll('[data-vital]').forEach(x=>v[x.dataset.vital]=x.value);$('#calculatedBmi').value=C.bmi(v.weight,v.height)??'';
    const alerts=C.vitalAlerts(v);$('#vitalAlerts').innerHTML=alerts.map(a=>`<span class="vital-alert ${a.severity}">${esc(a.message)}</span>`).join('');
  }

  function updateReadiness(){
    const score=$('#readinessScore'),list=$('#readinessChecks');if(!score||!list)return;
    const value=key=>String(document.querySelector(`[data-note-field="${key}"]`)?.value||'').trim(),hasVital=Array.from(document.querySelectorAll('[data-vital]')).some(input=>String(input.value||'').trim()),hasDiagnosis=Array.from(document.querySelectorAll('[data-dx-text]')).some(input=>String(input.value||'').trim());
    const checks={subjective:Boolean(value('reasonForVisit')&&value('currentIllness')),vitals:hasVital,exam:Boolean(value('physicalExam')),diagnosis:hasDiagnosis,assessment:Boolean(value('assessment')),plan:Boolean(value('plan')),safety:Boolean(value('warningSigns')),followup:Boolean(value('followUp'))};
    let complete=0;for(const [key,ok] of Object.entries(checks)){complete+=ok?1:0;list.querySelector(`[data-ready="${key}"]`)?.classList.toggle('complete',ok)}score.textContent=`${complete} de 8 elementos`;
  }

  function formSections(){const sections={};document.querySelectorAll('[data-note-field]').forEach(x=>sections[x.dataset.noteField]=C.cleanText(x.value));return sections}
  function applySections(sections){for(const key of A.SECTION_KEYS){const field=document.querySelector(`[data-note-field="${key}"]`);if(field&&sections[key]!=null)field.value=sections[key]}document.querySelector('#encounterForm')?.dispatchEvent(new Event('input',{bubbles:true}))}
  function assistantMessage(message,ok=false){const el=$('#assistantStatus');if(el){el.textContent=message;el.classList.toggle('ok',ok)}}
  function structureLocalDraft(){const points=$('#assistantKeyPoints').value.trim();if(!points)return assistantMessage('Escribe o dicta algunos puntos clave.');const next=A.structureLocal(points,formSections());applySections(next);assistantMessage('Puntos organizados localmente. Revisa los campos antes de finalizar.',true)}
  async function generateAiDraft(e,n,p){
    const points=$('#assistantKeyPoints').value.trim();if(!points)return assistantMessage('Escribe o dicta los datos que deseas estructurar.');if(!$('#aiConsent').checked)return assistantMessage('Marca la autorización de esta nota. La opción local no requiere enviarla.');
    const cloud=app.cloud?.(),token=await cloud?.accessToken?.();if(!token)return assistantMessage('Conecta tu cuenta de Supabase para usar el endpoint protegido de IA.');
    assistantMessage('Generando borrador desidentificado…');$('#generateAiBtn').disabled=true;
    try{
      const age=C.ageAt(p.dob,e.occurredAt),payload=A.buildAiPayload(points,formSections(),{noteType:n.noteType,ageLabel:age?.label||'',sex:p.sex||''}),response=await fetch('/api/clinical-note',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)}),body=await response.json();if(!response.ok)throw new Error(body?.error||'No se pudo generar.');
      applySections(A.mergeSuggestions(formSections(),body.sections||{}, {overwrite:false}));if(!emr().diagnoses.some(d=>d.noteId===n.id))for(const dx of body.diagnoses||[])addDiagnosisRow({text:dx.text,status:dx.status});const warnings=(body.reviewWarnings||[]).join(' · ');assistantMessage(`Borrador generado${body.model?` con ${body.model}`:''}. ${warnings||'Revisa y completa antes de firmar.'}`,true);$('#aiConsent').checked=false;audit('assistant.draft.generated','clinical_note',n.id,{provider:'external',identifiersSent:false});
    }catch(err){assistantMessage(err.message||'No fue posible generar el borrador. La nota no se modificó.')}finally{$('#generateAiBtn').disabled=false}
  }
  function noteText(e,n,p){const observation=emr().observations.find(o=>o.id===n.observationId)||readObservation(e,n),diagnoses=emr().diagnoses.filter(d=>d.noteId===n.id),orders=emr().orders.filter(o=>o.noteId===n.id);return A.plainText({patient:p,encounter:e,note:n,profile:vault.profile,diagnoses,observation,orders})}
  async function copyPlainText(text){try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()}}
  function downloadPlainText(text,folio){const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`nota-${String(folio||'clinica').replace(/[^A-Za-z0-9_-]/g,'-')}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  async function exportDraftText(e,n,p,action){await saveDraft(e.id,true);const text=noteText(e,n,p);if(action==='copy'){await copyPlainText(text);app.toast('Nota copiada como texto plano')}else if(action==='download'){downloadPlainText(text,e.folio);app.toast('Nota .txt preparada')}else if(navigator.share){await navigator.share({title:`Nota ${e.folio}`,text})}else{await copyPlainText(text);app.toast('Compartir no disponible; nota copiada')}}
  async function exportFinalText(e,n,p,action){const text=noteText(e,n,p);if(action==='copy'){await copyPlainText(text);app.toast('Nota final copiada como texto plano')}else if(action==='download'){downloadPlainText(text,e.folio);app.toast('Nota final .txt preparada')}else if(navigator.share){await navigator.share({title:`Nota ${e.folio}`,text})}else{await copyPlainText(text);app.toast('Compartir no disponible; nota copiada')}}

  async function saveDraft(encounterId,quiet=false){
    const e=encounter(encounterId),n=noteByEncounter(encounterId);if(!e||!n||n.status!=='draft'||!$('#encounterForm'))return;
    document.querySelectorAll('[data-note-field]').forEach(x=>n.sections[x.dataset.noteField]=C.cleanText(x.value));
    const diagnoses=readDiagnoses(e,n),obs=readObservation(e,n),orders=readOrders(e,n);emr().diagnoses=emr().diagnoses.filter(d=>d.noteId!==n.id).concat(diagnoses);emr().observations=emr().observations.filter(o=>o.id!==obs.id).concat(obs);emr().orders=emr().orders.filter(o=>o.noteId!==n.id).concat(orders);
    n.updatedAt=e.updatedAt=new Date().toISOString();await app.save();app.queueSync();if($('#autosaveState'))$('#autosaveState').textContent=`Guardado ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}`;if(!quiet)app.toast('Borrador guardado');renderDashboard();
  }

  async function finalizeNote(encounterId){
    const e=encounter(encounterId),n=noteByEncounter(encounterId),p=patient(e.patientId);await saveDraft(encounterId,true);
    const diagnoses=emr().diagnoses.filter(d=>d.noteId===n.id),observations=emr().observations.filter(o=>o.noteId===n.id),allergies=emr().allergies.filter(a=>a.patientId===p.id),orders=emr().orders.filter(o=>o.noteId===n.id);
    const missing=C.validateDraft(n,diagnoses);if(missing.length)return app.toast(`Completa antes de finalizar: ${missing.join(', ')}`);
    if(!confirm('Finalizar crea un snapshot firmado que ya no podrá editarse. ¿Continuar?'))return;
    const snapshot=C.noteSnapshot({encounter:e,note:n,patient:p,profile:vault.profile,diagnoses,observations,allergies,orders}),canonical=C.canonicalJson(snapshot),seal=await hashAndSign(canonical),ts=seal.signedAt;
    n.status='final';n.finalSnapshot=snapshot;n.canonicalText=canonical;n.seal=seal;n.finalizedAt=ts;n.updatedAt=ts;e.status='final';e.finalizedAt=ts;e.updatedAt=ts;
    emr().noteVersions.push({id:C.uuid(),noteId:n.id,encounterId:e.id,patientId:p.id,versionNo:1,kind:'final',reason:'Finalización clínica',payload:snapshot,canonicalText:canonical,seal,createdAt:ts});
    audit('note.finalized','clinical_note',n.id,{encounterId:e.id,hash:seal.hash});await app.save();app.queueSync();renderDashboard();renderFinalNote(e,n,p);app.toast('Nota finalizada y firmada');
  }

  async function renderFinalNote(e,n,p){
    const ok=await verifySigned(n.canonicalText,n.seal),s=n.finalSnapshot?.sections||{},dx=n.finalSnapshot?.diagnoses||[],obs=n.finalSnapshot?.observations?.[0]||{},orders=n.finalSnapshot?.orders||[],versions=emr().noteVersions.filter(v=>v.noteId===n.id&&v.kind==='addendum').sort((a,b)=>a.createdAt.localeCompare(b.createdAt)),relatedRx=linkedPrescriptions(e.id);
    const rxPrint=relatedRx.length?`<section><h3>Recetas relacionadas</h3><p>${relatedRx.map(r=>`${esc(r.id)} · ${esc(fmt(r.issuedAt))} · ${esc(prescriptionSummary(r))}`).join('<br>')}</p></section>`:'';
    const rxCard=relatedRx.length?`<section class="premium-card linked-prescriptions"><div><span class="eyebrow">TRAZABILIDAD</span><h3>Recetas relacionadas</h3><p class="muted">La relación es externa al contenido firmado; la receta y la nota conservan su integridad original.</p></div><div class="linked-rx-list">${relatedRx.map(r=>`<button class="btn secondary" data-open-linked-rx="${esc(r.id)}" type="button"><span>℞ ${esc(r.id)}</span><small>${esc(fmt(r.issuedAt))} · ${esc(prescriptionSummary(r))}</small></button>`).join('')}</div></section>`:'';
    $('#encounterEditor').innerHTML=`<div class="encounter-top"><button class="btn ghost" id="backToEmr" type="button">← Expediente</button><div><span class="eyebrow">${esc(e.folio)}</span><h2>${esc(p.name)}</h2><p>${fmt(e.occurredAt)}</p></div><span class="integrity-badge ${ok?'ok':'bad'}">${ok?'✓ Integridad verificada':'⚠ Integridad no confirmada'}</span></div><article id="printableClinicalNote" class="clinical-note premium-card"><header><div><h2>${esc(vault.profile?.name||'Médico')}</h2><p>${esc(vault.profile?.role||'')} · Céd. ${esc(vault.profile?.license||'')}</p></div><div><strong>${esc(e.folio)}</strong><p>${fmt(e.occurredAt)}</p></div></header><section class="note-patient"><strong>Paciente: ${esc(p.name)}</strong><span>F. nacimiento: ${esc(p.dob||'—')} · ${esc(C.ageAt(p.dob,e.occurredAt)?.label||'—')} · Sexo: ${esc(p.sex||'—')}</span></section>${finalBlock('Motivo de consulta',s.reasonForVisit)}${finalBlock('Padecimiento actual',s.currentIllness)}${finalBlock('Revisión por sistemas',s.reviewOfSystems)}${finalBlock('Signos vitales',formatVitals(obs))}${finalBlock('Exploración física',s.physicalExam)}${finalBlock('Resultados relevantes',s.relevantResults)}${finalBlock('Órdenes y resultados',orders.map(o=>`${o.name} · ${o.status}${o.result?' · '+o.result:''}`).join('\n'))}${finalBlock('Diagnósticos / problemas',dx.map(d=>`${d.code?d.code+' · ':''}${d.text} (${labelStatus(d.status)})`).join('\n'))}${finalBlock('Razonamiento clínico',s.assessment)}${finalBlock('Plan diagnóstico',s.diagnosticPlan)}${finalBlock('Tratamiento e indicaciones',s.plan)}${finalBlock('Pronóstico',s.prognosis)}${finalBlock('Signos de alarma',s.warningSigns)}${finalBlock('Seguimiento',s.followUp)}${finalBlock('Referencia / interconsulta',s.referral)}${rxPrint}<footer><p>Firmada: ${fmt(n.seal?.signedAt)} · ${esc(n.seal?.algorithm||'')}</p><p class="hash">SHA-256: ${esc(n.seal?.hash||'')}</p><p>Clave pública: ${esc(n.seal?.keyFingerprint||'')}</p></footer></article>${rxCard}<section class="premium-card addenda"><div class="section-head"><h3>Notas complementarias</h3><button id="newAddendumBtn" class="btn secondary" type="button">＋ Addendum</button></div>${versions.length?versions.map(v=>`<article><strong>${fmt(v.createdAt)} · ${esc(v.payload?.reason||'')}</strong><p>${esc(v.payload?.content||'')}</p><small>SHA-256: ${esc(v.seal?.hash||'')}</small></article>`).join(''):'<p class="muted">Sin addenda.</p>'}</section><div class="finalize-bar"><div><strong>Nota finalizada</strong><small>La receta se vincula fuera del contenido firmado.</small></div><div class="row-actions wrap"><button id="printNoteBtn" class="btn secondary" type="button">Imprimir / PDF</button><button id="rxFromNoteBtn" class="btn primary" type="button">℞ Emitir receta vinculada</button></div></div>`;
    $('#printNoteBtn')?.parentElement?.insertAdjacentHTML('afterbegin','<button id="copyFinalTextBtn" class="btn ghost" type="button">Copiar texto</button><button id="downloadFinalTextBtn" class="btn ghost" type="button">Descargar .txt</button><button id="shareFinalTextBtn" class="btn ghost" type="button">Compartir</button>');
    $('#backToEmr').addEventListener('click',()=>{renderDashboard();app.navigateRaw('emr')});$('#printNoteBtn').addEventListener('click',()=>printNote());$('#rxFromNoteBtn').addEventListener('click',()=>prescriptionFromNote(e,n));$('#newAddendumBtn').addEventListener('click',()=>openAddendum(n.id));$('#copyFinalTextBtn')?.addEventListener('click',()=>exportFinalText(e,n,p,'copy'));$('#downloadFinalTextBtn')?.addEventListener('click',()=>exportFinalText(e,n,p,'download'));$('#shareFinalTextBtn')?.addEventListener('click',()=>exportFinalText(e,n,p,'share'));document.querySelectorAll('[data-open-linked-rx]').forEach(b=>b.addEventListener('click',()=>app.openRecipe(b.dataset.openLinkedRx)));
  }

  function finalBlock(title,value){return value?`<section><h3>${esc(title)}</h3><p>${esc(value).replace(/\n/g,'<br>')}</p></section>`:''}
  function labelStatus(v){return ({working:'sospecha/trabajo',confirmed:'definitivo',ruled_out:'descartado',history:'antecedente'})[v]||v||''}
  function formatVitals(v){const map=[['sbp','TA sistólica','mmHg'],['dbp','TA diastólica','mmHg'],['hr','FC','lpm'],['rr','FR','rpm'],['temperature','Temperatura','°C'],['spo2','SpO₂','%'],['weight','Peso','kg'],['height','Talla','cm'],['bmi','IMC',''],['pain','Dolor','/10']];return map.filter(([k])=>v[k]!==''&&v[k]!=null).map(([k,l,u])=>`${l}: ${v[k]} ${u}`.trim()).join(' · ')}

  function printNote(){const area=$('#printArea');area.classList.remove('manual-print-area');area.innerHTML=`<div class="clinical-note-print">${$('#printableClinicalNote').innerHTML}</div>`;document.body.classList.add('printing-note');setTimeout(()=>window.print(),80);setTimeout(()=>document.body.classList.remove('printing-note'),700)}

  function prescriptionFromNote(e,n){pendingPrescriptionLink={encounterId:e.id,noteId:n.id,patientId:e.patientId};app.openRxForPatient(e.patientId);app.toast(`Receta vinculada a ${e.folio} al emitir`)}
  function directPrescription(){pendingPrescriptionLink=null;app.navigateRaw('rx')}
  async function onIssuedPrescription(rec){
    const ts=new Date().toISOString(),context=pendingPrescriptionLink&&rec.patient?.id===pendingPrescriptionLink.patientId?pendingPrescriptionLink:null;
    for(const medication of rec.medications||[]){
      emr().medications.push({id:C.uuid(),patientId:rec.patient?.id,encounterId:context?.encounterId||null,noteId:context?.noteId||null,sourceRxId:rec.id,name:medication.name||'',brand:medication.brand||'',strength:medication.strength||'',dose:medication.dose||'',route:medication.route||'',frequency:medication.frequency||'',duration:medication.duration||'',instructions:medication.instructions||'',status:'active',createdAt:ts,updatedAt:ts});
    }
    if(context){
      const e=encounter(context.encounterId);if(e){const link={id:C.uuid(),encounterId:e.id,noteId:context.noteId,patientId:e.patientId,rxId:rec.id,createdAt:ts};emr().prescriptionLinks.push(link);audit('prescription.linked','prescription_link',link.id,{rxId:rec.id,encounterId:e.id})}
    }
    pendingPrescriptionLink=null;audit('medication.recorded','prescription',rec.id,{count:(rec.medications||[]).length,linked:Boolean(context)});await app.save();app.queueSync();renderDashboard();
  }

  function openPatientRecord(patientId){
    const p=patient(patientId);if(!p)return;app.navigateRaw('emr');
    const x=emr(),encs=x.encounters.filter(e=>e.patientId===p.id),links=x.prescriptionLinks.filter(l=>l.patientId===p.id),recipes=patientPrescriptions(p.id),profile=p.clinical||{},linkByRx=new Map(links.map(l=>[l.rxId,l]));
    const events=[
      ...encs.map(e=>{const n=noteByEncounter(e.id);return {kind:'encounter',at:e.occurredAt,type:n?.status==='final'?'Nota finalizada':'Consulta en borrador',title:e.folio,detail:n?.sections?.reasonForVisit||'Motivo pendiente',encounterId:e.id,status:n?.status||e.status}}),
      ...recipes.map(r=>{const link=linkByRx.get(r.id);return {kind:'prescription',at:r.issuedAt,type:link?'Receta vinculada':'Receta directa',title:r.id,detail:prescriptionSummary(r),rxId:r.id,encounterId:link?.encounterId||'',status:r.status||'issued'}})
    ].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
    const finalNotes=encs.filter(e=>noteByEncounter(e.id)?.status==='final').length,directRecipes=recipes.filter(r=>!linkByRx.has(r.id)).length;
    const eventHtml=events.map(ev=>ev.kind==='encounter'
      ?`<article class="record-event"><span>${esc(ev.type)}</span><div><strong>${esc(ev.title)}</strong><small>${esc(ev.detail)}</small></div><div class="record-event-actions"><small>${esc(fmt(ev.at))}</small><button class="btn small secondary" data-open-encounter="${esc(ev.encounterId)}" type="button">${ev.status==='final'?'Ver nota':'Continuar'}</button></div></article>`
      :`<article class="record-event"><span>${esc(ev.type)}</span><div><strong>${esc(ev.title)}</strong><small>${esc(ev.detail)}</small></div><div class="record-event-actions"><small>${esc(fmt(ev.at))}</small><button class="btn small secondary" data-open-recipe="${esc(ev.rxId)}" type="button">Ver receta</button>${ev.encounterId?`<button class="btn small ghost" data-open-encounter="${esc(ev.encounterId)}" type="button">Ver nota</button>`:`<button class="btn small ghost" data-link-recipe="${esc(ev.rxId)}" type="button">Nueva nota + vincular</button>`}</div></article>`).join('');
    const el=$('#patientRecord');el.classList.remove('hidden');el.innerHTML=`<div class="record-head premium-card"><div><span class="eyebrow">EXPEDIENTE LONGITUDINAL</span><h2>${esc(p.name)}</h2><p>${esc(C.ageAt(p.dob)?.label||'Edad no disponible')} · ${esc(p.sex||'—')} · ${esc(p.phone||'Sin teléfono')}</p></div><div class="row-actions wrap"><button id="recordNewEncounter" class="btn primary" type="button">＋ Consulta</button><button id="recordDirectRx" class="btn secondary" type="button">℞ Receta directa</button><button id="recordProfile" class="btn ghost" type="button">Antecedentes</button><button id="closeRecord" class="icon-btn" type="button">×</button></div></div><div class="record-counts"><div><strong>${encs.length}</strong><span>Consultas</span></div><div><strong>${finalNotes}</strong><span>Notas finalizadas</span></div><div><strong>${recipes.length}</strong><span>Recetas expedidas</span></div><div><strong>${directRecipes}</strong><span>Recetas sin nota</span></div></div><div class="record-summary"><div class="clinical-alert ${profile.allergyKnowledge==='known'?'danger':''}"><strong>Alergias</strong><span>${esc(profile.allergies||p.allergies||'Información no confirmada')}</span></div><div class="premium-card"><strong>Antecedentes relevantes</strong><p>${esc(profile.pathologicalHistory||'Sin captura')}</p></div><div class="premium-card"><strong>Medicamentos actuales</strong><p>${esc(profile.currentMedications||'Sin captura')}</p></div></div><div class="premium-card"><div class="record-timeline-head"><div><h3>Línea de tiempo clínica</h3><p>Consultas, notas y todas las recetas del paciente, incluso las emitidas sin nota.</p></div></div>${eventHtml||'<div class="empty-state">Sin eventos clínicos.</div>'}</div>`;
    $('#recordNewEncounter').addEventListener('click',()=>openStart(p.id));$('#recordDirectRx').addEventListener('click',()=>{pendingPrescriptionLink=null;app.openRxForPatient(p.id)});$('#recordProfile').addEventListener('click',()=>openClinicalProfile(p.id));$('#closeRecord').addEventListener('click',()=>el.classList.add('hidden'));
    el.querySelectorAll('[data-open-encounter]').forEach(b=>b.addEventListener('click',()=>openEncounter(b.dataset.openEncounter)));el.querySelectorAll('[data-open-recipe]').forEach(b=>b.addEventListener('click',()=>app.openRecipe(b.dataset.openRecipe)));el.querySelectorAll('[data-link-recipe]').forEach(b=>b.addEventListener('click',()=>openStart(p.id,b.dataset.linkRecipe)));
  }

  function openClinicalProfile(patientId){
    const p=patient(patientId),c=p.clinical||{};$('#clinicalProfilePatientId').value=p.id;for(const key of ['allergyKnowledge','allergies','familyHistory','pathologicalHistory','nonPathologicalHistory','surgicalHistory','transfusionHistory','currentMedications','immunizations','gyneObHistory','perinatalHistory']){const el=$('#'+(key==='allergies'?'clinicalAllergies':key));if(el)el.value=c[key]||''}$('#allergyKnowledge').value=c.allergyKnowledge||'unknown';$('#allergyEditorList').innerHTML='';const rows=emr().allergies.filter(a=>a.patientId===p.id);rows.forEach(addAllergyRow);$('#clinicalProfileDialog').showModal();
  }
  function addAllergyRow(data={}){const row=document.createElement('div');row.className='allergy-edit-row';row.dataset.id=data.id||C.uuid();row.innerHTML=`<input data-allergy-substance placeholder="Sustancia" value="${esc(data.substance||'')}"><input data-allergy-reaction placeholder="Reacción" value="${esc(data.reaction||'')}"><select data-allergy-severity><option value="unknown">Severidad no confirmada</option><option value="mild">Leve</option><option value="moderate">Moderada</option><option value="severe">Grave</option></select><select data-allergy-status><option value="active">Activa</option><option value="inactive">Inactiva</option><option value="entered_in_error">Registrada por error</option></select><button class="icon-btn" type="button" aria-label="Quitar">×</button>`;row.querySelector('[data-allergy-severity]').value=data.severity||'unknown';row.querySelector('[data-allergy-status]').value=data.status||'active';row.querySelector('button').addEventListener('click',()=>{row.querySelector('[data-allergy-status]').value='entered_in_error';row.classList.add('entered-error')});$('#allergyEditorList').appendChild(row)}
  async function saveClinicalProfile(e){e.preventDefault();const p=patient($('#clinicalProfilePatientId').value);if(!p)return;const ts=new Date().toISOString(),knowledge=$('#allergyKnowledge').value,structured=Array.from(document.querySelectorAll('.allergy-edit-row')).map(r=>({id:r.dataset.id,patientId:p.id,substance:C.cleanText(r.querySelector('[data-allergy-substance]').value,300),reaction:C.cleanText(r.querySelector('[data-allergy-reaction]').value,500),severity:r.querySelector('[data-allergy-severity]').value,status:r.querySelector('[data-allergy-status]').value,updatedAt:ts})).filter(a=>a.substance||a.reaction);let allergySummary=C.cleanText($('#clinicalAllergies').value,4000);if(!allergySummary&&knowledge==='known')allergySummary=structured.filter(a=>a.status==='active').map(a=>`${a.substance}${a.reaction?` (${a.reaction})`:''}`).join('; ');if(!allergySummary&&knowledge==='none_reported')allergySummary='Paciente niega alergias conocidas';emr().allergies=emr().allergies.filter(a=>a.patientId!==p.id).concat(structured);p.clinical={allergyKnowledge:knowledge,allergies:allergySummary,familyHistory:C.cleanText($('#familyHistory').value),pathologicalHistory:C.cleanText($('#pathologicalHistory').value),nonPathologicalHistory:C.cleanText($('#nonPathologicalHistory').value),surgicalHistory:C.cleanText($('#surgicalHistory').value),transfusionHistory:C.cleanText($('#transfusionHistory').value),currentMedications:C.cleanText($('#currentMedications').value),immunizations:C.cleanText($('#immunizations').value),gyneObHistory:C.cleanText($('#gyneObHistory').value),perinatalHistory:C.cleanText($('#perinatalHistory').value),updatedAt:ts};p.allergies=p.clinical.allergies;p.updatedAt=ts;audit('patient.history.updated','patient',p.id,{allergyEntries:structured.length});await app.save();app.queueSync();$('#clinicalProfileDialog').close();renderDashboard();app.toast('Antecedentes guardados')}

  async function attachDocument(ev,e,n){
    const file=ev.target.files?.[0];ev.target.value='';if(!file)return;if(file.size>3*1024*1024)return app.toast('El archivo excede 3 MB.');if(!['application/pdf','image/png','image/jpeg'].includes(file.type))return app.toast('Tipo de archivo no permitido.');
    try{const id=C.uuid(),createdAt=new Date().toISOString(),metadata={id,patientId:e.patientId,encounterId:e.id,noteId:n.id,name:file.name.slice(0,160),mimeType:file.type,size:file.size,createdAt,updatedAt:createdAt},encryptedContent=await app.encryptDocument(new Uint8Array(await file.arrayBuffer()),metadata);const doc={...metadata,sha256:encryptedContent.plaintextSha256,keyId:encryptedContent.keyId,encryptedContent,storage:'local_e2ee_v1',objectPath:null};emr().documents.push(doc);audit('document.attached','document',id,{encounterId:e.id,mimeType:file.type,size:file.size,sha256:doc.sha256,e2ee:true});await app.save();app.queueSync();renderDocuments(n.id);app.toast('Documento cifrado E2EE y guardado localmente')}catch(err){app.toast(err.message||'No se pudo cifrar el documento.')}
  }
  async function openDocument(id){
    const doc=emr().documents.find(x=>x.id===id);if(!doc)return;try{if(!doc.encryptedContent&&doc.objectPath){app.toast('Descargando archivo cifrado…');await app.cloud()?.syncDocumentDownloads?.(vault);await app.save()}if(!doc.encryptedContent)throw new Error('El contenido cifrado aún no está disponible en este dispositivo.');const plain=await app.decryptDocument(doc.encryptedContent,doc),blob=new Blob([plain],{type:doc.mimeType}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.download=doc.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);app.toast('Documento descifrado solo en memoria') }catch(err){app.toast(err.message||'No se pudo abrir el documento.')}
  }
  function renderDocuments(noteId){const el=$('#documentList');if(!el)return;const docs=emr().documents.filter(d=>d.noteId===noteId);el.innerHTML=docs.map(d=>`<div class="document-row"><div><strong>${esc(d.name)}</strong><small>${esc(d.mimeType)} · ${(d.size/1024).toFixed(0)} KB · ${d.objectPath?'E2EE sincronizado':'E2EE local / pendiente'}</small></div><button class="btn small ghost" data-document="${d.id}" type="button">Abrir</button></div>`).join('')||'<p class="muted">Sin documentos.</p>';el.querySelectorAll('[data-document]').forEach(b=>b.addEventListener('click',()=>openDocument(b.dataset.document)))}

  function openAddendum(noteId){$('#addendumNoteId').value=noteId;$('#addendumReason').value='';$('#addendumContent').value='';$('#addendumDialog').showModal()}
  async function saveAddendum(e){e.preventDefault();const note=emr().clinicalNotes.find(n=>n.id===$('#addendumNoteId').value);if(!note||note.status!=='final')return app.toast('La nota original no está finalizada.');const payload={schema:'rx-offline-emr-addendum',version:1,noteId:note.id,encounterId:note.encounterId,patientId:note.patientId,reason:C.cleanText($('#addendumReason').value,500),content:C.cleanText($('#addendumContent').value,12000),author:{name:vault.profile?.name||'',license:vault.profile?.license||''},createdAt:new Date().toISOString()},canonical=C.canonicalJson(payload),seal=await hashAndSign(canonical);const versions=emr().noteVersions.filter(v=>v.noteId===note.id);emr().noteVersions.push({id:C.uuid(),noteId:note.id,encounterId:note.encounterId,patientId:note.patientId,versionNo:versions.length+1,kind:'addendum',reason:payload.reason,payload,canonicalText:canonical,seal,createdAt:seal.signedAt});audit('note.addendum.created','clinical_note',note.id,{hash:seal.hash});await app.save();app.queueSync();$('#addendumDialog').close();renderFinalNote(encounter(note.encounterId),note,patient(note.patientId));app.toast('Addendum firmado')}

  function audit(action,entityType,entityId,metadata){if(!vault)return;emr().auditEvents.push({id:C.uuid(),action,entityType,entityId,actorKeyFingerprint:vault.signing?.keyFingerprint||'',createdAt:new Date().toISOString(),metadata:metadata||{}});if(emr().auditEvents.length>5000)emr().auditEvents=emr().auditEvents.slice(-5000)}

  window.RxEMR={init,onLock,renderDashboard,renderActivity,openStart,openPatientRecord,openEncounter,onIssuedPrescription,directPrescription};
})();
