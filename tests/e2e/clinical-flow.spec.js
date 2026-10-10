const {test,expect}=require('@playwright/test');

test('synthetic patient → final note → linked prescription → timeline',async({page})=>{
  page.on('dialog',d=>d.accept(d.type()==='prompt'?'Tratamiento completado':undefined));
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-test-123');
  await page.locator('#setupPin2').fill('synthetic-test-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await expect(page.locator('#mainView')).toBeVisible();

  await page.locator('.bottom-nav [data-nav="settings"]').click();
  await page.locator('#profileName').fill('Dra. Prueba Sintética');
  await page.locator('#profileLicense').fill('TEST-000000');
  await page.locator('#profileFacilityType').fill('Consultorio de medicina general');
  await page.locator('#profileFacilityName').fill('Consulta Sintética');
  await page.locator('#profileForm').getByRole('button',{name:'Guardar perfil'}).click();
  const canvas=page.locator('#profileSignatureCanvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  await page.mouse.move(box.x+40,box.y+70);await page.mouse.down();await page.mouse.move(box.x+180,box.y+35,{steps:8});await page.mouse.up();
  await page.locator('#saveProfileSignature').click();
  await expect(page.locator('#toast')).toContainText('Firma guardada localmente');

  await page.locator('.bottom-nav [data-nav="patients"]').click();await page.locator('#newPatientBtn').click();
  await page.locator('#patientName').fill('Paciente Sintético Uno');await page.locator('#patientDob').fill('1990-02-10');await page.locator('#patientSex').selectOption('F');await page.locator('#patientAddress').fill('Domicilio sintético 123');
  await page.locator('#patientForm').getByRole('button',{name:'Guardar paciente'}).click();
  await expect(page.locator('#patientList')).toContainText('Paciente Sintético Uno');

  await page.locator('[data-consult-patient]').click();await page.locator('#encounterStartForm').getByRole('button',{name:'Abrir expediente'}).click();
  await page.locator('[data-note-field="reasonForVisit"]').fill('Tos y odinofagia');
  await page.locator('[data-note-field="currentIllness"]').fill('Cuadro de tres días sin dificultad respiratoria.');
  await page.locator('[data-note-field="physicalExam"]').fill('Alerta, hidratada, faringe hiperémica, campos pulmonares ventilados.');
  await page.locator('[data-dx-text]').fill('Infección respiratoria aguda no complicada');
  await page.locator('[data-note-field="assessment"]').fill('Probable etiología viral, sin datos de alarma actuales.');
  await page.locator('[data-note-field="plan"]').fill('Manejo sintomático, hidratación y vigilancia clínica.');
  await page.locator('[data-note-field="warningSigns"]').fill('Disnea, cianosis, deterioro o fiebre persistente.');
  await page.locator('[data-vital="sbp"]').fill('112');await page.locator('[data-vital="dbp"]').fill('72');await page.locator('[data-vital="spo2"]').fill('98');
  await page.locator('#finalizeNoteBtn').click();
  await expect(page.locator('.integrity-badge')).toContainText('Integridad verificada');

  await page.locator('#rxFromNoteBtn').click();
  await page.locator('.m-name').fill('Paracetamol');await page.locator('.m-strength').fill('500 mg tabletas');await page.locator('.m-dose').fill('500 mg');await page.locator('.m-frequency').fill('Cada 8 horas si dolor o fiebre');await page.locator('.m-duration').fill('3 días');
  await page.locator('#rxForm').getByRole('button',{name:'Emitir y sellar'}).click();await expect(page.locator('#confirmDialog')).toBeVisible();await page.locator('#confirmEmitBtn').click();
  await expect(page.locator('#recipeDetail')).toContainText('Integridad local verificada');

  await page.locator('.bottom-nav [data-nav="emr"]').click();await page.locator('[data-open-record]').click();
  await expect(page.locator('#patientRecord')).toContainText('Receta vinculada');
  await expect(page.locator('.medication-summary')).toContainText('Paracetamol');
  await page.locator('[data-stop-med]').click();
  await expect(page.locator('.medication-summary')).toContainText('Suspendido');
});

test('direct prescription remains available without creating an encounter',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-test-456');await page.locator('#setupPin2').fill('synthetic-test-456');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#directRxHomeBtn').click();
  await expect(page.locator('#screen-rx')).toHaveClass(/active/);
  await expect(page.locator('#encounterCount')).toHaveText('0');
});

test('manual PDF reserves once, opens real PDF and reuses original folios after retry',async({page})=>{
  await page.addInitScript(()=>{window.__opened=[];window.open=(url)=>{window.__opened.push(url);return {closed:false}}});
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-manual-123');await page.locator('#setupPin2').fill('synthetic-manual-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#manualTemplateBtn').click();await expect(page.locator('#manualTemplateDialog')).toBeVisible();
  await page.locator('#manualPrintCount').fill('3');await page.locator('#manualPrintCount').dispatchEvent('change');
  await expect(page.locator('#manualTemplatePreview .manual-letter-page')).toHaveCount(2);
  const originals=await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents();
  await page.evaluate(()=>{const build=window.ClinovyraManualPDF.build;window.ClinovyraManualPDF={...window.ClinovyraManualPDF,build:options=>{window.__manualPdfPages=options.pagesHtml;return build(options)}}});
  await page.locator('#printManualTemplateBtn').click();await expect(page.locator('#openManualPdfBtn')).toBeVisible();
  const sameLayout=await page.evaluate(()=>window.__manualPdfPages.every((html,i)=>{const sheet=document.createElement('div');sheet.innerHTML=html;return sheet.firstElementChild.outerHTML===document.querySelectorAll('#manualTemplatePreview .manual-letter-page')[i].outerHTML}));
  expect(sameLayout).toBe(true);
  expect(originals).toHaveLength(3);expect(new Set(originals).size).toBe(3);
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  await expect(page.locator('#manualBatchHistory')).toContainText('impresión no confirmada');
  await page.locator('#printManualTemplateBtn').click();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  await page.locator('#openManualPdfBtn').click();
  const pdf=await page.evaluate(async()=>{const response=await fetch(window.__opened[0]);return {type:response.headers.get('content-type'),start:(await response.text()).slice(0,8)}});
  expect(pdf.type).toContain('application/pdf');expect(pdf.start).toContain('%PDF-1.4');
  await page.locator('#cancelManualTemplateBtn').click();
  await page.locator('#manualTemplateBtn').click();
  await page.locator('#regenerateManualFoliosBtn').click();
  expect(await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents()).not.toEqual(originals);
  await page.locator('#manualBatchHistory [data-reprint-batch]').first().click();
  expect(await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents()).toEqual(originals);
  await page.locator('#openManualPdfBtn').click();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  expect(await page.evaluate(()=>window.__opened.length)).toBe(2);
  page.once('dialog',d=>d.accept());
  await page.locator('#manualBatchHistory [data-archive-batch]').first().click();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(0);
  await page.locator('#regenerateManualFoliosBtn').click();
  expect(await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents()).not.toEqual(originals);
});

test('iPhone-sized preview fits and a blocked PDF window triggers download without new batch',async({page})=>{
  await page.addInitScript(()=>{window.open=()=>null});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-print-123');await page.locator('#setupPin2').fill('synthetic-print-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#manualTemplateBtn').click();
  const fit=await page.locator('#manualTemplatePreview').evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scale:parseFloat(getComputedStyle(el).getPropertyValue('--manual-preview-scale'))}));
  expect(fit.scrollWidth).toBeLessThanOrEqual(fit.clientWidth+1);
  expect(fit.scale).toBeLessThan(.5);
  await page.locator('#printManualTemplateBtn').click();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  const download=page.waitForEvent('download');
  await page.locator('#openManualPdfBtn').click();expect((await download).suggestedFilename()).toMatch(/Clinovyra-BATCH-.*\.pdf/);
  await page.locator('#printManualTemplateBtn').click();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
});

test('failed PDF capture reserves once and retry preserves the original folios',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-retry-123');await page.locator('#setupPin2').fill('synthetic-retry-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#manualTemplateBtn').click();
  const folios=await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents();
  await page.evaluate(()=>{const original=window.ClinovyraManualPDF.build;let first=true;window.ClinovyraManualPDF={...window.ClinovyraManualPDF,build:(options)=>{if(first){first=false;return Promise.reject(new Error('Fallo sintético de captura'))}return original(options)}}});
  await page.locator('#printManualTemplateBtn').click();
  await expect(page.locator('#manualPdfStatus')).toContainText('Fallo sintético de captura');
  await expect(page.locator('#openManualPdfBtn')).toBeHidden();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  await page.locator('#printManualTemplateBtn').click();
  await expect(page.locator('#openManualPdfBtn')).toBeVisible();
  await expect(page.locator('#manualBatchHistory .manual-batch-row')).toHaveCount(1);
  expect(await page.locator('#manualTemplatePreview .manual-folio-chip strong').allTextContents()).toEqual(folios);
});

test('mobile dock follows a finger swipe and theme palettes are separated',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-swipe-123');await page.locator('#setupPin2').fill('synthetic-swipe-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#mobileDock #dockMoreBtn').click();
  await page.locator('#primaryNav [data-nav="settings"]').click();
  await expect(page.locator('#themeGrid > .theme-section')).toHaveCount(2);
  await expect(page.locator('#themeGrid > .theme-section').first()).toContainText('Temas claros');
  await expect(page.locator('#themeGrid > .theme-section').nth(1)).toContainText('Temas nocturnos');
  await page.locator('#themeGrid [data-theme="prismNight"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode','dark');
  await page.locator('#themeGrid [data-theme="glacierPearl"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode','light');
  await page.locator('#mobileDock [data-nav="home"]').click();
  await page.evaluate(()=>{
    const dock=document.querySelector('#mobileDock'),button=dock.querySelector('[data-nav="home"]'),r=dock.getBoundingClientRect();
    const make=(type,x)=>new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:11,pointerType:'touch',isPrimary:true,clientX:x,clientY:r.top+r.height/2});
    button.dispatchEvent(make('pointerdown',r.left+r.width*.1));
    dock.dispatchEvent(make('pointermove',r.left+r.width*.3));
    dock.dispatchEvent(make('pointerup',r.left+r.width*.3));
  });
  await expect(page.locator('#screen-patients')).toHaveClass(/active/);
  await expect(page.locator('#mobileDock [data-nav="patients"]')).toHaveAttribute('aria-current','page');
});

test('privacy-first local assistant structures a note without network AI',async({page})=>{
  await page.goto('/?e2e=1');await page.locator('#setupPin').fill('synthetic-test-789');await page.locator('#setupPin2').fill('synthetic-test-789');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('.bottom-nav [data-nav="patients"]').click();await page.locator('#newPatientBtn').click();await page.locator('#patientName').fill('Paciente Sintético Asistente');await page.locator('#patientDob').fill('1985-04-02');await page.locator('#patientForm').getByRole('button',{name:'Guardar paciente'}).click();await page.locator('[data-consult-patient]').click();await page.locator('#encounterStartForm').getByRole('button',{name:'Abrir expediente'}).click();
  await page.locator('#assistantKeyPoints').fill('MC: Cefalea\nPA: Inicio hace seis horas\nEF: Neurológico documentado sin déficit focal\nImpresión: Cefalea en estudio\nPlan: Vigilancia y reevaluación documentada');await page.locator('#structureLocalBtn').click();
  await expect(page.locator('[data-note-field="reasonForVisit"]')).toHaveValue('Cefalea');await expect(page.locator('[data-note-field="currentIllness"]')).toHaveValue('Inicio hace seis horas');await expect(page.locator('[data-note-field="assessment"]')).toHaveValue('Cefalea en estudio');await expect(page.locator('#assistantStatus')).toContainText('organizados localmente');await expect(page.locator('#copyDraftTextBtn')).toBeVisible();
});

test('public URL is gated before a vault can be created',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#accessView')).toBeVisible();
  await expect(page.locator('#setupView')).toBeHidden();
  await expect(page.getByText('ACCESO RESTRINGIDO')).toBeVisible();
  await expect(page.locator('#accessForm')).toBeVisible();
});

test('desktop uses a persistent side rail and mobile uses a top dropdown',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-navigation-123');await page.locator('#setupPin2').fill('synthetic-navigation-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await expect(page.locator('#primaryNav')).toBeVisible();
  await expect(page.locator('#menuBtn')).toBeHidden();
  const desktopBox=await page.locator('#primaryNav').boundingBox();expect(desktopBox.x).toBeLessThan(40);expect(desktopBox.height).toBeGreaterThan(400);

  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#menuBtn')).toBeVisible();
  await expect(page.locator('#mobileDock')).toBeVisible();
  await page.locator('#mobileDock [data-nav="patients"]').click();
  await expect(page.locator('#mobileDock [data-nav="patients"]')).toHaveAttribute('aria-current','page');
  await page.locator('#dockMoreBtn').click();await expect(page.locator('#primaryNav')).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.locator('#primaryNav')).toBeHidden();
  await page.locator('#menuBtn').click();
  await expect(page.locator('#primaryNav')).toBeVisible();
  await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded','true');
  await page.locator('#primaryNav [data-nav="patients"]').click();
  await expect(page.locator('#primaryNav')).toBeHidden();
  await expect(page.locator('#screen-patients')).toHaveClass(/active/);
});

test('settings exposes session controls without hiding local security',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-sessions-123');await page.locator('#setupPin2').fill('synthetic-sessions-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#primaryNav [data-nav="settings"]').click();
  await expect(page.getByRole('heading',{name:'Dispositivos y sesiones'})).toBeVisible();
  await expect(page.locator('#refreshSessionsBtn')).toBeVisible();await expect(page.locator('#signOutOthersBtn')).toBeVisible();await expect(page.locator('#deauthorizeDeviceBtn')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Bloqueo y biometría'})).toBeVisible();
  await expect(page.locator('#biometricCapability')).toBeVisible();await expect(page.locator('#lockNowBtn')).toBeVisible();
});

test('backup import verifies its PIN before replacing the local vault',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-backup-123');await page.locator('#setupPin2').fill('synthetic-backup-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#primaryNav [data-nav="settings"]').click();
  await page.locator('#profileName').fill('Perfil del respaldo');
  await page.locator('#profileLicense').fill('TEST-BACKUP-001');
  await page.locator('#profileForm').getByRole('button',{name:'Guardar perfil'}).click();
  await expect(page.locator('#toast')).toContainText('Perfil médico guardado');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBackupBtn').click();
  const download=await downloadPromise;
  const backup=require('fs').readFileSync(await download.path());
  await page.locator('#profileName').fill('Perfil actual');
  await page.locator('#profileForm').getByRole('button',{name:'Guardar perfil'}).click();
  let pin='incorrecto';
  page.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept(pin):dialog.accept());
  await page.locator('#importBackupInput').setInputFiles({name:'respaldo.json',mimeType:'application/json',buffer:backup});
  await expect(page.locator('#toast')).toContainText('PIN del respaldo es incorrecto');
  await expect(page.locator('#profileName')).toHaveValue('Perfil actual');
  pin='synthetic-backup-123';
  await page.locator('#importBackupInput').setInputFiles({name:'respaldo.json',mimeType:'application/json',buffer:backup});
  await expect(page.locator('#unlockView')).toBeVisible();
  await page.locator('#unlockPin').fill(pin);
  await page.locator('#unlockForm').getByRole('button',{name:'Desbloquear'}).click();
  await page.locator('#primaryNav [data-nav="settings"]').click();
  await expect(page.locator('#profileName')).toHaveValue('Perfil del respaldo');
});

test('vault PIN rotates without data loss and night mode remains reversible',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-old-pin-123');await page.locator('#setupPin2').fill('synthetic-old-pin-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#primaryNav [data-nav="settings"]').click();
  await page.locator('#nightModeBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme-mode','dark');await expect(page.locator('#themeModeStatus')).toContainText('Modo nocturno activo');
  await page.locator('#nightModeBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme-mode','light');
  await page.locator('#showChangePinBtn').click();await page.locator('#currentVaultPin').fill('synthetic-old-pin-123');await page.locator('#newVaultPin').fill('synthetic-new-pin-456');await page.locator('#confirmVaultPin').fill('synthetic-new-pin-456');await page.locator('#changePinForm').getByRole('button',{name:'Actualizar protección'}).click();
  await expect(page.locator('#changePinForm')).toBeHidden();await page.locator('#lockNowBtn').click();
  await page.locator('#unlockPin').fill('synthetic-old-pin-123');await page.locator('#unlockForm').getByRole('button',{name:'Desbloquear'}).click();await expect(page.locator('#unlockMsg')).toContainText('incorrecta');
  await page.locator('#unlockPin').fill('synthetic-new-pin-456');await page.locator('#unlockForm').getByRole('button',{name:'Desbloquear'}).click();await expect(page.locator('#mainView')).toBeVisible();
});

test('Safari-style biometric enrollment uses a fresh gesture for the second WebAuthn ceremony',async({page})=>{
  await page.addInitScript(()=>{
    window.__rxWebAuthn={gets:0,lastTransports:[]};
    class MockPublicKeyCredential{
      static async isUserVerifyingPlatformAuthenticatorAvailable(){return true}
      static async getClientCapabilities(){return {prf:true,largeBlob:true}}
    }
    Object.defineProperty(window,'PublicKeyCredential',{configurable:true,value:MockPublicKeyCredential});
    Object.defineProperty(navigator,'credentials',{configurable:true,value:{
      async create(){return {rawId:new Uint8Array([9,8,7,6]).buffer,response:{getTransports:()=>['internal']},getClientExtensionResults:()=>({prf:{enabled:true},largeBlob:{supported:true}})}},
      async get(options){window.__rxWebAuthn.gets++;window.__rxWebAuthn.lastTransports=options.publicKey.allowCredentials[0].transports||[];return {getClientExtensionResults:()=>({prf:{results:{first:new Uint8Array(32).fill(17).buffer}}})}}
    }});
  });
  await page.goto('/?e2e=1');await page.locator('#setupPin').fill('synthetic-faceid-123');await page.locator('#setupPin2').fill('synthetic-faceid-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#primaryNav [data-nav="settings"]').click();await page.locator('#enableBiometricBtn').click();
  await expect(page.locator('#enableBiometricBtn')).toHaveText('Completar con Face ID');await expect(page.locator('#bioStatus')).toContainText('Passkey creada');
  await expect.poll(()=>page.evaluate(()=>window.__rxWebAuthn.gets)).toBe(0);
  await page.locator('#enableBiometricBtn').click();await expect(page.locator('#bioStatus')).toContainText('Biometría configurada y comprobada');await expect(page.locator('#testBiometricBtn')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.__rxWebAuthn.gets)).toBe(1);expect(await page.evaluate(()=>window.__rxWebAuthn.lastTransports)).toEqual(['internal']);
  await page.locator('#testBiometricBtn').click();await expect(page.locator('#bioStatus')).toContainText('Prueba correcta');
  await page.locator('#lockNowBtn').click();await page.locator('#biometricUnlockBtn').click();await expect(page.locator('#mainView')).toBeVisible();
});

test('standalone quick note structures locally and remains outside the patient record',async({page})=>{
  await page.goto('/?e2e=1');await page.locator('#setupPin').fill('synthetic-quick-note-123');await page.locator('#setupPin2').fill('synthetic-quick-note-123');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#quickNoteHomeBtn').click();await expect(page.locator('#screen-quicknote')).toHaveClass(/active/);
  await page.locator('#quickNotePoints').fill('MC: Dolor lumbar\nPA: Inicio después de esfuerzo\nEF: Dolor documentado a la palpación\nImpresión: Lumbalgia mecánica en estudio\nPlan: Revaloración y medidas documentadas');
  await page.locator('#quickNoteLocalBtn').click();await expect(page.locator('#quickNoteOutput')).toHaveValue(/MOTIVO DE CONSULTA[\s\S]*Dolor lumbar[\s\S]*BORRADOR CLÍNICO/);
  await expect(page.locator('#patientCount')).toHaveText('0');await expect(page.locator('#encounterCount')).toHaveText('0');
  await page.locator('#quickNoteReadBtn').click();await expect(page.locator('#quickNoteReadDialog')).toBeVisible();await expect(page.locator('#quickNoteReadText')).toContainText('Dolor lumbar');
});

test('direct prescription is searchable in the patient record and can seed a later note',async({page})=>{
  page.on('dialog',d=>d.accept());
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-link-rx-123');
  await page.locator('#setupPin2').fill('synthetic-link-rx-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();

  await page.locator('#primaryNav [data-nav="settings"]').click();
  await page.locator('#profileName').fill('Dra. Prueba Vinculación');
  await page.locator('#profileLicense').fill('TEST-LINK-001');
  await page.locator('#profileForm').getByRole('button',{name:'Guardar perfil'}).click();
  const canvas=page.locator('#profileSignatureCanvas');
  await canvas.scrollIntoViewIfNeeded();
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+35,box.y+75);await page.mouse.down();await page.mouse.move(box.x+190,box.y+30,{steps:8});await page.mouse.up();
  await page.locator('#saveProfileSignature').click();

  await page.locator('#primaryNav [data-nav="patients"]').click();
  await page.locator('#newPatientBtn').click();
  await page.locator('#patientName').fill('Paciente Receta Previa');
  await page.locator('#patientDob').fill('1988-07-18');
  await page.locator('#patientSex').selectOption('M');
  await page.locator('#patientForm').getByRole('button',{name:'Guardar paciente'}).click();
  await page.locator('[data-rx-patient]').click();

  await page.locator('.m-name').fill('Ibuprofeno');
  await page.locator('.m-strength').fill('400 mg tabletas');
  await page.locator('.m-dose').fill('400 mg');
  await page.locator('.m-frequency').fill('Cada 8 horas con alimentos');
  await page.locator('.m-duration').fill('3 días');
  await page.locator('#rxForm').getByRole('button',{name:'Emitir y sellar'}).click();
  await page.locator('#confirmEmitBtn').click();
  await expect(page.locator('#recipeDetail')).toContainText('Integridad local verificada');
  const rxId=(await page.locator('.recipe-detail-head .eyebrow').textContent()).trim();

  await page.locator('#historySearch').fill('Paciente Receta Previa');
  await expect(page.locator('#historyList')).toContainText(rxId);
  await page.locator(`[data-recipe="${rxId}"]`).click();
  await page.locator('#openRecipePatientBtn').click();
  await expect(page.locator('#patientRecord')).toContainText('Receta directa');
  await expect(page.locator('#patientRecord')).toContainText('Recetas sin nota');
  await expect(page.locator('#patientRecord')).toContainText('Ibuprofeno');

  await page.locator(`[data-link-recipe="${rxId}"]`).click();
  await expect(page.locator('#encounterSourceRx')).toHaveValue(rxId);
  await page.locator('#encounterStartForm').getByRole('button',{name:'Abrir expediente'}).click();
  await expect(page.locator('.linked-rx-banner')).toContainText('Receta previa vinculada');
  await expect(page.locator('.linked-rx-banner')).toContainText(rxId);

  await page.locator('#primaryNav [data-nav="patients"]').click();
  await page.locator('[data-record-patient]').click();
  await expect(page.locator('#patientRecord')).toContainText('Receta vinculada');
  await expect(page.locator(`[data-link-recipe="${rxId}"]`)).toHaveCount(0);
});

