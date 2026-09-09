const {test,expect}=require('@playwright/test');

test('synthetic patient → final note → linked prescription → timeline',async({page})=>{
  page.on('dialog',d=>d.accept());
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-test-123');
  await page.locator('#setupPin2').fill('synthetic-test-123');
  await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await expect(page.locator('#mainView')).toBeVisible();

  await page.locator('.bottom-nav [data-nav="settings"]').click();
  await page.locator('#profileName').fill('Dra. Prueba Sintética');
  await page.locator('#profileLicense').fill('TEST-000000');
  await page.locator('#profileForm').getByRole('button',{name:'Guardar perfil'}).click();
  const canvas=page.locator('#profileSignatureCanvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  await page.mouse.move(box.x+40,box.y+70);await page.mouse.down();await page.mouse.move(box.x+180,box.y+35,{steps:8});await page.mouse.up();
  await page.locator('#saveProfileSignature').click();
  await expect(page.locator('#toast')).toContainText('Firma guardada localmente');

  await page.locator('.bottom-nav [data-nav="patients"]').click();await page.locator('#newPatientBtn').click();
  await page.locator('#patientName').fill('Paciente Sintético Uno');await page.locator('#patientDob').fill('1990-02-10');await page.locator('#patientSex').selectOption('F');
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
});

test('direct prescription remains available without creating an encounter',async({page})=>{
  await page.goto('/?e2e=1');
  await page.locator('#setupPin').fill('synthetic-test-456');await page.locator('#setupPin2').fill('synthetic-test-456');await page.getByRole('button',{name:'Crear bóveda cifrada'}).click();
  await page.locator('#directRxHomeBtn').click();
  await expect(page.locator('#screen-rx')).toHaveClass(/active/);
  await expect(page.locator('#encounterCount')).toHaveText('0');
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
});
