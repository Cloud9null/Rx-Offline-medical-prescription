(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const enc=new TextEncoder(), dec=new TextDecoder();
const state={db:null,meta:null,vault:null,vaultKey:null,screen:'home',medSeq:0,profilePad:null,rxPad:null,lockTimer:null,hiddenAt:null,pendingEmit:null,cloudSyncTimer:null,cloudUser:null,cloudReady:false};
const themes=[
 {id:'midnightGold',name:'Midnight Gold',desc:'Azul noche + oro',primary:'#122f49',secondary:'#b7904b',accent:'#dfc27e',bg:'#f2f4f5',panel:'#ffffff',panel2:'#edf1f3',text:'#17212b',muted:'#697581',line:'#dbe2e6'},
 {id:'oxfordPearl',name:'Oxford Pearl',desc:'Oxford + perla',primary:'#243b53',secondary:'#8ea3b5',accent:'#c7d1da',bg:'#f5f7f9',panel:'#ffffff',panel2:'#eef2f5',text:'#16212c',muted:'#6c7883',line:'#dce3e8'},
 {id:'emeraldIvory',name:'Emerald Ivory',desc:'Esmeralda + marfil',primary:'#145c4b',secondary:'#b79b69',accent:'#ded0ad',bg:'#f6f5f0',panel:'#fffef9',panel2:'#f0f2ea',text:'#1c2925',muted:'#6d7872',line:'#dfe2d8'},
 {id:'graphitePlatinum',name:'Graphite Platinum',desc:'Grafito + platino',primary:'#36454f',secondary:'#929ca3',accent:'#c7ced2',bg:'#f2f3f4',panel:'#ffffff',panel2:'#eceff1',text:'#1f272c',muted:'#69737a',line:'#d9dfe3'},
 {id:'burgundyChampagne',name:'Burgundy',desc:'Vino + champagne',primary:'#6b2639',secondary:'#b59663',accent:'#dfc99d',bg:'#f7f3f1',panel:'#fffdfc',panel2:'#f2ece9',text:'#2c2023',muted:'#7a6d70',line:'#e5dcd9'},
 {id:'tealPearl',name:'Teal Pearl',desc:'Petróleo + perla',primary:'#0f5960',secondary:'#8eaead',accent:'#bfd2cf',bg:'#f1f6f5',panel:'#ffffff',panel2:'#eaf1f0',text:'#17292b',muted:'#657779',line:'#d8e4e2'},
 {id:'sapphireSilver',name:'Sapphire Silver',desc:'Zafiro + plata',primary:'#214f7a',secondary:'#94a8b9',accent:'#c9d4dd',bg:'#f2f6f9',panel:'#ffffff',panel2:'#eaf0f5',text:'#182532',muted:'#697888',line:'#d9e2e9'},
 {id:'obsidianCopper',name:'Obsidian Copper',desc:'Carbón + cobre',primary:'#282b2e',secondary:'#a66b47',accent:'#d0a282',bg:'#f4f2f0',panel:'#fffefd',panel2:'#efebe8',text:'#202326',muted:'#716d69',line:'#dfd9d5'},
 {id:'navyRose',name:'Navy Rose',desc:'Marino + rosa viejo',primary:'#1f3553',secondary:'#a77982',accent:'#d4b5ba',bg:'#f6f3f4',panel:'#ffffff',panel2:'#f0ebed',text:'#1f2731',muted:'#766d71',line:'#e2dade'},
 {id:'sandstone',name:'Sandstone',desc:'Arena + espresso',primary:'#5b4636',secondary:'#aa8c66',accent:'#d8c2a4',bg:'#f7f4ef',panel:'#fffdfa',panel2:'#f0ebe4',text:'#29231f',muted:'#756c64',line:'#e5ded5'},
 {id:'arctic',name:'Arctic',desc:'Azul hielo + slate',primary:'#37657a',secondary:'#8ca9b4',accent:'#c6d8de',bg:'#f3f8fa',panel:'#ffffff',panel2:'#ebf3f6',text:'#1b292f',muted:'#6c7c83',line:'#d9e5e9'},
 {id:'violetSlate',name:'Violet Slate',desc:'Violeta + pizarra',primary:'#554a78',secondary:'#8b829f',accent:'#c8c0d5',bg:'#f5f3f7',panel:'#ffffff',panel2:'#efecf3',text:'#262330',muted:'#716d7a',line:'#e0dce6'}
];
const logoStyles=[
 {id:'monogram',name:'Monograma clínico',desc:'Sello premium con monograma'},
 {id:'crest',name:'Escudo elegante',desc:'Insignia institucional refinada'},
 {id:'minimal',name:'Minimal serif',desc:'Línea limpia y sobria'}
];
function b64(bytes){let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){const x=atob(s),a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return a}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomBytes(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtDate(iso){try{return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso))}catch{return iso}}
function fmtDateTime(iso){try{return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return iso}}
function ageYears(dob){if(!dob)return null;const [y,m,d]=dob.split('-').map(Number),now=new Date();let age=now.getFullYear()-y;const md=now.getMonth()+1,dd=now.getDate();if(md<m||(md===m&&dd<d))age--;return age}
function displayDob(dob){return dob?new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(dob+'T00:00:00')):'-'}
function sexCode(v=''){const s=String(v||'').trim().toLowerCase();if(!s)return '';if(['f','femenino','female','mujer'].includes(s))return 'F';if(['m','masculino','male','hombre'].includes(s))return 'M';return 'O'}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'PX'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600)}
function setStatus(el,msg,ok=false){el.textContent=msg;el.style.color=ok?'var(--success)':'var(--muted)'}
async function sha256Bytes(data){return new Uint8Array(await crypto.subtle.digest('SHA-256',data instanceof Uint8Array?data:enc.encode(data)))}
async function derivePinKey(pin,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:250000},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptRaw(key,bytes){const iv=randomBytes(12),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);return{iv:b64(iv),data:b64(ct)}}
async function decryptRaw(key,obj){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(obj.iv)},key,unb64(obj.data)))}
function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open('rxOfflineV2',2);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'id'});if(!db.objectStoreNames.contains('vault'))db.createObjectStore('vault',{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);})}
function dbGet(store,id){return new Promise((res,rej)=>{const tx=state.db.transaction(store,'readonly'),r=tx.objectStore(store).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);})}
function dbPut(store,obj){return new Promise((res,rej)=>{const tx=state.db.transaction(store,'readwrite'),r=tx.objectStore(store).put(obj);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})}
async function saveVault(){if(!state.vaultKey||!state.vault)return;const bytes=enc.encode(JSON.stringify(state.vault)),box=await encryptRaw(state.vaultKey,bytes);await dbPut('vault',{id:'payload',...box,updatedAt:new Date().toISOString()});}
async function loadVault(key){const box=await dbGet('vault','payload');if(!box)throw new Error('No se encontró la bóveda.');const bytes=await decryptRaw(key,box);return JSON.parse(dec.decode(bytes))}
async function keyFingerprint(publicJwk){const d=await sha256Bytes(`${publicJwk.x}.${publicJwk.y}`);return Array.from(d.slice(0,8)).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{1,4}/g).join('-')}
async function setupVault(pin){
  const vaultKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),raw=await crypto.subtle.exportKey('raw',vaultKey),salt=randomBytes(16),pinKey=await derivePinKey(pin,salt),wrapped=await encryptRaw(pinKey,new Uint8Array(raw));
  const signing=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),privateJwk=await crypto.subtle.exportKey('jwk',signing.privateKey),publicJwk=await crypto.subtle.exportKey('jwk',signing.publicKey),fingerprint=await keyFingerprint(publicJwk);
  state.meta={id:'setup',version:2,salt:b64(salt),wrappedVaultKey:wrapped,biometric:null,createdAt:new Date().toISOString()};
  state.vaultKey=vaultKey;state.vault={profile:{name:'',role:'Medicina General',license:'',university:'Universidad del Valle de Mexico',address:'Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX',phone:'',email:'',signature:null},patients:[],recipes:[],settings:{theme:'midnightGold',logoStyle:'monogram',lockTimeout:5,profileDataVersion:26},signing:{privateJwk,publicJwk,keyFingerprint:fingerprint}};
  await dbPut('meta',state.meta);await saveVault();if(navigator.storage?.persist)try{await navigator.storage.persist()}catch{}
}
async function unlockWithPin(pin){const pinKey=await derivePinKey(pin,unb64(state.meta.salt));const raw=await decryptRaw(pinKey,state.meta.wrappedVaultKey),key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);const vault=await loadVault(key);state.vaultKey=key;state.vault=vault;}
async function hkdfAes(secret){const base=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:enc.encode('rx-offline-v2-biometric')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function getPrfSecret(credentialId,prfSalt){const assertion=await navigator.credentials.get({publicKey:{challenge:randomBytes(32),allowCredentials:[{type:'public-key',id:unb64(credentialId)}],userVerification:'required',timeout:60000,extensions:{prf:{eval:{first:unb64(prfSalt)}}}}});const ext=assertion.getClientExtensionResults?.();const first=ext?.prf?.results?.first;if(!first)throw new Error('El autenticador no entregó una clave PRF. Usa PIN en este dispositivo.');return new Uint8Array(first)}
async function enableBiometric(){
  if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials)throw new Error('La biometría web requiere HTTPS y un navegador compatible.');
  const prfSalt=randomBytes(32),userId=randomBytes(16);const cred=await navigator.credentials.create({publicKey:{challenge:randomBytes(32),rp:{name:'Rx Offline'},user:{id:userId,name:'rx-local',displayName:'Rx Offline local'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},timeout:60000,attestation:'none',extensions:{prf:{eval:{first:prfSalt}}}}});
  if(!cred)throw new Error('No se creó la credencial.');const credentialId=b64(new Uint8Array(cred.rawId));
  const secret=await getPrfSecret(credentialId,b64(prfSalt)),bioKey=await hkdfAes(secret),raw=await crypto.subtle.exportKey('raw',state.vaultKey),wrapped=await encryptRaw(bioKey,new Uint8Array(raw));
  state.meta.biometric={credentialId,prfSalt:b64(prfSalt),wrappedVaultKey:wrapped,createdAt:new Date().toISOString()};await dbPut('meta',state.meta);return true;
}
async function unlockBiometric(){const bio=state.meta.biometric;if(!bio)throw new Error('Biometría no configurada.');const secret=await getPrfSecret(bio.credentialId,bio.prfSalt),bioKey=await hkdfAes(secret),raw=await decryptRaw(bioKey,bio.wrappedVaultKey),key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);state.vaultKey=key;state.vault=await loadVault(key);}
function applyTheme(id){const t=themes.find(x=>x.id===id)||themes[0];for(const k of ['primary','secondary','accent','bg','panel','panel2','text','muted','line'])document.documentElement.style.setProperty(`--${k}`,t[k]);document.querySelector('meta[name="theme-color"]').setAttribute('content',t.primary);$$('.theme-card').forEach(x=>x.classList.toggle('active',x.dataset.theme===t.id));}
function renderThemeGrid(){const g=$('#themeGrid');g.innerHTML=themes.map(t=>`<button class="theme-card" data-theme="${t.id}" type="button"><div class="theme-preview" style="background:${t.bg}"><div style="background:${t.primary}"></div><div><span style="background:${t.secondary}"></span><span style="background:${t.panel2}"></span></div></div><strong>${esc(t.name)}</strong><small>${esc(t.desc)}</small></button>`).join('');g.querySelectorAll('.theme-card').forEach(b=>b.addEventListener('click',async()=>{state.vault.settings.theme=b.dataset.theme;applyTheme(b.dataset.theme);await saveVault();toast('Tema actualizado');}));applyTheme(state.vault?.settings?.theme||'midnightGold')}
function renderLogoGrid(){const g=$('#logoGrid');if(!g)return;g.innerHTML=logoStyles.map(l=>`<button class="logo-card ${state.vault?.settings?.logoStyle===l.id?'active':''}" data-logo-style="${l.id}" type="button"><div class="logo-mini logo-mini-${l.id}"><span class="lm-a">Rx</span><span class="lm-b">Dr</span><span class="lm-c"></span></div><strong>${esc(l.name)}</strong><small>${esc(l.desc)}</small></button>`).join('');g.querySelectorAll('[data-logo-style]').forEach(b=>b.addEventListener('click',async()=>{state.vault.settings.logoStyle=b.dataset.logoStyle;await saveVault();renderLogoGrid();toast('Logo actualizado');}));}
class SignaturePad{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.drawing=false;this.dirty=false;this.ctx.lineCap='round';this.ctx.lineJoin='round';this.ctx.strokeStyle='#162a3a';this.ctx.lineWidth=5;canvas.addEventListener('pointerdown',e=>this.start(e));canvas.addEventListener('pointermove',e=>this.move(e));['pointerup','pointercancel','pointerleave'].forEach(ev=>canvas.addEventListener(ev,e=>this.end(e)));}
  point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*(this.canvas.width/r.width),y:(e.clientY-r.top)*(this.canvas.height/r.height)}}
  start(e){e.preventDefault();this.drawing=true;this.dirty=true;this.canvas.setPointerCapture?.(e.pointerId);const p=this.point(e);this.ctx.beginPath();this.ctx.moveTo(p.x,p.y)}
  move(e){if(!this.drawing)return;e.preventDefault();const p=this.point(e);this.ctx.lineTo(p.x,p.y);this.ctx.stroke()}
  end(){this.drawing=false}
  clear(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.dirty=false}
  data(){return this.dirty?this.canvas.toDataURL('image/png'):null}
  load(dataUrl){this.clear();if(!dataUrl)return;const im=new Image();im.onload=()=>{this.ctx.drawImage(im,0,0,this.canvas.width,this.canvas.height);this.dirty=true};im.src=dataUrl}
}
function showAuth(which){$('#setupView').classList.toggle('hidden',which!=='setup');$('#unlockView').classList.toggle('hidden',which!=='unlock');$('#mainView').classList.toggle('hidden',which!=='main')}
async function migrateProfileDefaults(){
  if(!state.vault?.profile)return;
  state.vault.settings=state.vault.settings||{};
  let changed=false;
  if(Number(state.vault.settings.profileDataVersion||0)<26){
    state.vault.profile.university='Universidad del Valle de Mexico';
    state.vault.profile.address='Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX';
    state.vault.settings.logoStyle=state.vault.settings.logoStyle||'monogram';
    (state.vault.patients||[]).forEach(p=>{const sx=sexCode(p.sex)||'F';if(p.sex!==sx){p.sex=sx;changed=true;}});
    state.vault.settings.profileDataVersion=26;
    changed=true;
  }
  if(changed)await saveVault();
}
async function initCloudState(){
  if(!window.RxCloud){state.cloudReady=false;return}
  try{const r=await window.RxCloud.init();state.cloudReady=!!r.configured;state.cloudUser=r.user||null;updateCloudUI()}catch(err){console.warn(err);state.cloudReady=false;updateCloudUI(err.message)}
}
function updateCloudUI(message=''){
  const configured=!!window.RxCloud?.configured?.();
  const signed=!!state.cloudUser;
  const status=$('#cloudStatus');
  if(status)status.textContent=message||(configured?(signed?`Conectado como ${state.cloudUser.email||'usuario'} · nube + local`:'Supabase configurado · inicia sesión para activar la nube'):'Supabase no configurado · modo local disponible');
  $('#cloudLoginWrap')?.classList.toggle('hidden',signed);
  $('#cloudSignedWrap')?.classList.toggle('hidden',!signed);
  const badge=$('#offlineBadge');
  if(badge)badge.textContent=!navigator.onLine?'● Offline':(signed?'● Nube + local':'● Local');
}
async function runCloudSync({quiet=false}={}){
  if(!state.vault||!window.RxCloud?.configured?.())return;
  try{
    const u=await window.RxCloud.user();state.cloudUser=u;updateCloudUI();
    if(!u){if(!quiet)toast('Inicia sesión en Supabase para sincronizar');return}
    setStatus($('#cloudSyncStatus'),'Probando sincronización con Supabase…');
    await ensureAllPublicTokens();
    await window.RxCloud.syncVault(state.vault,canonicalPayload);
    for(const rec of state.vault.recipes||[]){if(rec?.seal?.publicToken)rec.seal.cloudRegistered=true}
    await saveVault();renderAll();updateCloudUI();
    setStatus($('#cloudSyncStatus'),`Sincronización completada ${fmtDateTime(new Date().toISOString())}`,true);
    if(!quiet)toast('Sincronización completada');
  }catch(err){
    console.warn('Rx Cloud sync:',err);
    setStatus($('#cloudSyncStatus'),`Nube pendiente: ${err.message||'no se pudo sincronizar'}. La receta y la bóveda local siguen funcionando.`);
    if(!quiet)toast('Sincronización pendiente; modo local activo');
  }
}
function queueCloudSync(){
  clearTimeout(state.cloudSyncTimer);
  const el=$('#cloudSyncStatus');
  if(!state.cloudUser){if(el)setStatus(el,'Cambios guardados en la bóveda local.');return}
  if(!navigator.onLine){if(el)setStatus(el,'Cambios guardados localmente · se sincronizarán al recuperar internet.');return}
  if(el)setStatus(el,'Cambios guardados · sincronizando con Supabase…');
  state.cloudSyncTimer=setTimeout(()=>runCloudSync({quiet:true}),900);
}
async function afterUnlock(){
  applyTheme(state.vault.settings.theme);
  await migrateProfileDefaults();
  showAuth('main');
  renderAll();
  navigate('home');
  scheduleLock();
  await initCloudState();
  if(state.cloudUser){
    setStatus($('#cloudSyncStatus'),'Sesión de nube restaurada · sincronizando…');
    if(navigator.onLine)await runCloudSync({quiet:true});
  }
}
function lock(){state.vault=null;state.vaultKey=null;clearTimeout(state.lockTimer);$('#unlockPin').value='';$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta?.biometric);showAuth('unlock');}
function scheduleLock(){clearTimeout(state.lockTimer);const min=Number(state.vault?.settings?.lockTimeout||0);if(min>0)state.lockTimer=setTimeout(lock,min*60000)}
function navigate(name){if(!state.vault)return;state.screen=name;$$('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${name}`));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));const titles={home:'Inicio',patients:'Pacientes',rx:'Nueva receta',history:'Historial',settings:'Ajustes'};$('#topSubtitle').textContent=titles[name]||'';if(name==='patients')renderPatients();if(name==='history')renderHistory();if(name==='rx')renderRxPatientOptions();if(name==='settings')renderSettings();window.scrollTo({top:0,behavior:'smooth'});}
function renderAll(){renderCounts();renderPatients();renderRxPatientOptions();renderHistory();renderSettings();renderThemeGrid();renderLogoGrid();if(!$('#medicationList').children.length)addMedication();$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta?.biometric);}
function renderCounts(){$('#patientCount').textContent=state.vault.patients.filter(p=>!p.archived).length;$('#recipeCount').textContent=state.vault.recipes.length}
function patientSubtitle(p){const age=ageYears(p.dob);const dobTxt=p.dob?displayDob(p.dob):'F.N. no disponible';const sx=sexCode(p.sex)||'—';return `${dobTxt} · ${age===null?'Edad no disponible':age+' años'} · ${sx}${p.allergies?' · Alergias: '+p.allergies:''}`}
function renderPatients(filter=''){const arr=state.vault.patients.filter(p=>!p.archived&&(p.name.toLowerCase().includes(filter.toLowerCase()))).sort((a,b)=>a.name.localeCompare(b.name));const list=$('#patientList');if(!arr.length){list.innerHTML='<div class="empty-state">No hay pacientes que coincidan. Usa “Alta paciente” para comenzar.</div>';return;}list.innerHTML=arr.map(p=>`<article class="list-item"><div class="avatar">${esc(initials(p.name))}</div><div class="list-main"><strong>${esc(p.name)}</strong><small>${esc(patientSubtitle(p))}</small></div><div class="list-actions"><button type="button" data-rx-patient="${p.id}" title="Crear receta">℞</button><button type="button" data-edit-patient="${p.id}" title="Editar">✎</button></div></article>`).join('');list.querySelectorAll('[data-edit-patient]').forEach(b=>b.addEventListener('click',()=>openPatientDialog(b.dataset.editPatient)));list.querySelectorAll('[data-rx-patient]').forEach(b=>b.addEventListener('click',()=>{navigate('rx');$('#rxPatient').value=b.dataset.rxPatient;updateSelectedPatient();}));}
function openPatientDialog(id=null){const p=id?state.vault.patients.find(x=>x.id===id):null;$('#patientDialogTitle').textContent=p?'Editar paciente':'Alta paciente';$('#patientId').value=p?.id||'';$('#patientName').value=p?.name||'';$('#patientDob').value=p?.dob||'';$('#patientSex').value=sexCode(p?.sex)||'F';$('#patientAllergies').value=p?.allergies||'Niega alergias medicamentosas conocidas';$('#patientPhone').value=p?.phone||'';$('#patientWeight').value=p?.weight||'';$('#patientNotes').value=p?.notes||'';updatePatientWeightField();$('#patientDialog').showModal();}
function updatePatientWeightField(){const age=ageYears($('#patientDob').value);const hint=$('#patientAgeHint');if(hint)hint.textContent=`Edad calculada automáticamente: ${age===null?'—':age+' años'}`;$('#patientWeightWrap').classList.toggle('hidden',!(age!==null&&age<18))}
async function savePatientFromForm(e){e.preventDefault();const id=$('#patientId').value||crypto.randomUUID(),existing=state.vault.patients.find(x=>x.id===id),age=ageYears($('#patientDob').value);const p={id,name:$('#patientName').value.trim(),dob:$('#patientDob').value,sex:sexCode($('#patientSex').value)||'F',allergies:$('#patientAllergies').value.trim(),phone:$('#patientPhone').value.trim(),weight:(age!==null&&age<18)?($('#patientWeight').value||''): '',notes:$('#patientNotes').value.trim(),archived:false,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(!p.name||!p.dob)return toast('Nombre y fecha de nacimiento son obligatorios.');if(existing)Object.assign(existing,p);else state.vault.patients.push(p);await saveVault();$('#patientDialog').close();renderAll();queueCloudSync();toast('Paciente guardado');}
function renderRxPatientOptions(){const sel=$('#rxPatient'),current=sel.value;const pts=state.vault.patients.filter(p=>!p.archived).sort((a,b)=>a.name.localeCompare(b.name));sel.innerHTML='<option value="">Seleccionar…</option>'+pts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(pts.some(p=>p.id===current))sel.value=current;updateSelectedPatient();}
function updateSelectedPatient(){const p=state.vault.patients.find(x=>x.id===$('#rxPatient').value);if(!p){$('#selectedPatientSummary').textContent='Selecciona un paciente.';$('#pediatricWeightWrap').classList.add('hidden');return;}const age=ageYears(p.dob),ped=age!==null&&age<18;$('#selectedPatientSummary').innerHTML=`<div class="patient-summary-grid"><div><span>Paciente</span><strong>${esc(p.name)}</strong></div><div><span>F. nacimiento</span><strong>${displayDob(p.dob)}</strong></div><div><span>Edad</span><strong>${age===null?'-':age+' años'}</strong></div><div><span>Sexo</span><strong>${sexCode(p.sex)||'-'}</strong></div><div class="wide"><span>Alergias</span><strong>${esc(p.allergies||'No registradas')}</strong></div>${ped&&p.weight?`<div><span>Peso</span><strong>${esc(p.weight)} kg</strong></div>`:''}</div>`;$('#pediatricWeightWrap').classList.toggle('hidden',!ped);$('#rxWeight').value=ped?(p.weight||''):'';}
function addMedication(data={}){const id=++state.medSeq,wrap=document.createElement('div');wrap.className='med-card';wrap.dataset.med=id;wrap.innerHTML=`<div class="med-head"><strong>Medicamento <span class="med-number"></span></strong><button type="button" class="delete-med" aria-label="Eliminar medicamento">×</button></div><div class="form-grid two"><label>Nombre genérico<input class="m-name" required value="${esc(data.name||'')}"></label><label>Marca opcional<input class="m-brand" value="${esc(data.brand||'')}"></label></div><div class="form-grid two"><label>Presentación / concentración<input class="m-strength" required value="${esc(data.strength||'')}"></label><label>Dosis<input class="m-dose" required value="${esc(data.dose||'')}"></label></div><div class="form-grid two"><label>Vía<select class="m-route"><option>Oral</option><option>Sublingual</option><option>IM</option><option>IV</option><option>SC</option><option>Tópica</option><option>Oftálmica</option><option>Ótica</option><option>Inhalada</option><option>Rectal</option><option>Vaginal</option><option>Otra</option></select></label><label>Frecuencia<input class="m-frequency" required value="${esc(data.frequency||'')}"></label></div><div class="form-grid two"><label>Duración<input class="m-duration" required value="${esc(data.duration||'')}"></label><label>Indicaciones específicas<input class="m-instructions" value="${esc(data.instructions||'')}"></label></div>`;wrap.querySelector('.m-route').value=data.route||'Oral';wrap.querySelector('.delete-med').addEventListener('click',()=>{if($('#medicationList').children.length<=1)return toast('Debe existir al menos un medicamento.');wrap.remove();renumberMeds()});$('#medicationList').appendChild(wrap);renumberMeds();}
function renumberMeds(){$$('#medicationList .med-card').forEach((x,i)=>x.querySelector('.med-number').textContent=i+1)}
function collectMeds(){return $$('#medicationList .med-card').map(c=>({name:c.querySelector('.m-name').value.trim(),brand:c.querySelector('.m-brand').value.trim(),strength:c.querySelector('.m-strength').value.trim(),dose:c.querySelector('.m-dose').value.trim(),route:c.querySelector('.m-route').value,frequency:c.querySelector('.m-frequency').value.trim(),duration:c.querySelector('.m-duration').value.trim(),instructions:c.querySelector('.m-instructions').value.trim()}))}
function resetRx(){ $('#rxPatient').value='';$('#rxGeneral').value='';$('#rxWeight').value='';$('#medicationList').innerHTML='';state.medSeq=0;addMedication();state.rxPad.clear();$('input[name="signatureMode"][value="profile"]').checked=true;$('#freshSignatureWrap').classList.add('hidden');updateSelectedPatient();setStatus($('#rxMsg'),'');}
function recipeId(){const d=new Date(),yy=String(d.getFullYear()).slice(2),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';const bytes=randomBytes(6);for(const b of bytes)r+=alphabet[b%alphabet.length];return `RX-${yy}${mm}${dd}-${r}`}
async function signatureImageHash(dataUrl){return b64url(await sha256Bytes(dataUrl||''))}
function canonicalPayload(recipe){return {v:1,id:recipe.id,issuedAt:recipe.issuedAt,doctor:recipe.doctor,patient:recipe.patient,medications:recipe.medications,general:recipe.general||'',signatureImageSha256:recipe.signatureImageSha256,design:recipe.design}}
async function buildRecipeDraft(){const patient=state.vault.patients.find(p=>p.id===$('#rxPatient').value);if(!patient)throw new Error('Selecciona un paciente registrado.');const meds=collectMeds();if(!meds.length||meds.some(m=>!m.name||!m.strength||!m.dose||!m.frequency||!m.duration))throw new Error('Completa nombre, presentación, dosis, frecuencia y duración de cada medicamento.');const profile=state.vault.profile;if(!profile.name||!profile.license)throw new Error('Completa nombre y cédula en Perfil médico.');const mode=$('input[name="signatureMode"]:checked').value;const signatureImage=mode==='fresh'?state.rxPad.data():profile.signature;if(!signatureImage)throw new Error(mode==='fresh'?'Firma la receta antes de emitir.':'Guarda una firma en tu perfil o selecciona “Firmar ahora”.');const age=ageYears(patient.dob),ped=age!==null&&age<18;const theme=themes.find(t=>t.id===state.vault.settings.theme)||themes[0];const issuedAt=new Date().toISOString();const rec={id:recipeId(),issuedAt,status:'issued',doctor:{name:profile.name,role:profile.role||'Medicina General',license:profile.license,university:profile.university||'',address:profile.address||'',phone:profile.phone||'',email:profile.email||''},patient:{id:patient.id,name:patient.name,dob:patient.dob,age,sex:sexCode(patient.sex)||'F',allergies:patient.allergies||'',weight:ped?($('#rxWeight').value||patient.weight||''):''},medications:meds,general:$('#rxGeneral').value.trim(),signatureImage,signatureImageSha256:await signatureImageHash(signatureImage),design:{theme:theme.id,primary:theme.primary,secondary:theme.secondary,logoStyle:state.vault.settings.logoStyle||'monogram'},seal:null,voidedAt:null,voidReason:null};return rec;}
async function issueRecipe(){const rec=state.pendingEmit;if(!rec)return;const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical)),priv=await crypto.subtle.importKey('jwk',state.vault.signing.privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},priv,enc.encode(canonical)));rec.seal={algorithm:'ECDSA-P256-SHA256',hash,signature:b64url(sig),publicJwk:state.vault.signing.publicJwk,keyFingerprint:state.vault.signing.keyFingerprint,canonicalVersion:1,verificationToken:null,publicToken:makePublicToken()};rec.seal.verificationToken=await makeVerificationToken(rec);state.vault.recipes.unshift(rec);await saveVault();queueCloudSync();state.pendingEmit=null;$('#confirmDialog').close();renderAll();resetRx();navigate('history');await openRecipe(rec.id);toast('Receta emitida y sellada');}
async function verifyRecipe(rec){try{const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical));if(hash!==rec.seal?.hash)return false;const pub=await crypto.subtle.importKey('jwk',rec.seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,unb64(rec.seal.signature.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((rec.seal.signature.length+3)%4)),enc.encode(canonical));}catch{return false}}
function unb64url(s){let x=s.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return unb64(x)}
async function verifyRecipeFixed(rec){try{const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical));if(hash!==rec.seal?.hash)return false;const pub=await crypto.subtle.importKey('jwk',rec.seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,unb64url(rec.seal.signature),enc.encode(canonical));}catch{return false}}
function verificationPacket(rec){const c=canonicalPayload(rec);return {v:3,i:c.id,t:c.issuedAt,d:[c.doctor.name,c.doctor.role,c.doctor.license,c.doctor.university,c.doctor.address,c.doctor.phone,c.doctor.email],p:[c.patient.id,c.patient.name,c.patient.dob,c.patient.age,c.patient.sex,c.patient.allergies,c.patient.weight],m:c.medications.map(x=>[x.name,x.brand,x.strength,x.dose,x.route,x.frequency,x.duration,x.instructions]),g:c.general,h:c.signatureImageSha256,e:[c.design.theme,c.design.primary,c.design.secondary],s:rec.seal.signature,k:[rec.seal.publicJwk.x,rec.seal.publicJwk.y]}}
async function makeVerificationToken(rec){const raw=enc.encode(JSON.stringify(verificationPacket(rec)));if('CompressionStream' in window){try{const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip')),compressed=new Uint8Array(await new Response(stream).arrayBuffer());if(compressed.length<raw.length)return 'z.'+b64url(compressed)}catch{}}return 'j.'+b64url(raw)}
function makePublicToken(){return b64url(randomBytes(24))}
async function ensureVerificationToken(rec){if(!rec?.seal)return;let changed=false;if(!rec.seal.verificationToken){rec.seal.verificationToken=await makeVerificationToken(rec);changed=true}if(!rec.seal.publicToken){rec.seal.publicToken=makePublicToken();changed=true}if(changed)await saveVault()}
async function ensureAllPublicTokens(){let changed=false;for(const rec of state.vault?.recipes||[]){if(rec?.seal&&!rec.seal.publicToken){rec.seal.publicToken=makePublicToken();changed=true}}if(changed)await saveVault()}
function verificationUrl(rec){const u=new URL("./verify.html",location.href.split("#")[0]);if(window.RxCloud?.configured?.()&&rec.seal?.publicToken&&rec.seal?.cloudRegistered){u.hash='t='+rec.seal.publicToken;return u.toString()}const fallback='j.'+b64url(enc.encode(JSON.stringify(verificationPacket(rec))));u.hash=rec.seal?.verificationToken||fallback;return u.toString()}
function sealPayload(rec){return verificationUrl(rec)}
function renderRxSheet(rec){
  const medHtml=rec.medications.map((m,i)=>`<div class="rx-med"><strong>${i+1}. ${esc(m.name)}${m.brand?' ('+esc(m.brand)+')':''} · ${esc(m.strength)}</strong><p>${esc(m.dose)} · Vía ${esc(m.route)} · ${esc(m.frequency)} · ${esc(m.duration)}</p>${m.instructions?`<p>${esc(m.instructions)}</p>`:''}</div>`).join('');
  let integrityQr='';
  try{integrityQr=RxQR.svg(verificationUrl(rec))}catch{integrityQr='<div style="font-size:6pt">Datos de verificación demasiado largos</div>'}
  const licenseQr=RxQR.svg('https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action');
  const date=new Date(rec.issuedAt),dateTxt=new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'long',year:'numeric'}).format(date);
  const contact=[rec.doctor.phone,rec.doctor.email].filter(Boolean).join(' · ');
  const ageLabel=(rec.patient.age===null||rec.patient.age===undefined)?'-':String(rec.patient.age);
  const sex=sexCode(rec.patient.sex)||'-';
  const dob=displayDob(rec.patient.dob);
  const logoStyle=rec.design?.logoStyle||'monogram';
  const logoInner=logoStyle==='crest'
    ? '<div class="rx-logo-inner crest"><div class="rx-logo-shield">✚</div><div class="rx-logo-type"><span>Rx</span><small>CLINIC</small></div></div>'
    : logoStyle==='minimal'
      ? '<div class="rx-logo-inner minimal"><div class="rx-logo-mark thin">Rx</div><div class="rx-logo-type"><span>Dr</span><small>PRESCRIPTION</small></div></div>'
      : '<div class="rx-logo-inner monogram"><div class="rx-logo-mark"><span class="rx-logo-cross">✚</span></div><div class="rx-logo-type"><span>Rx</span><small>MEDICAL</small></div></div>';
  return `<article class="rx-sheet" style="--rxp:${esc(rec.design?.primary||'#173c5e')};--rxs:${esc(rec.design?.secondary||'#b99352')}"><header class="rx-header"><div class="rx-doc-brand"><div class="rx-logo ${logoStyle}">${logoInner}<span class="rx-logo-accent"></span></div><div class="rx-doc-copy"><div class="rx-ribbon">PRESCRIPCIÓN MÉDICA</div><h3>${esc(rec.doctor.name)}</h3><p>${esc(rec.doctor.role)}</p><p>Cédula profesional: ${esc(rec.doctor.license)}${rec.doctor.university?' · '+esc(rec.doctor.university):''}</p>${rec.doctor.address?`<p>${esc(rec.doctor.address)}</p>`:''}${contact?`<p>${esc(contact)}</p>`:''}</div></div><div class="rx-meta"><p><strong>RECETA MÉDICA</strong></p><p>${esc(dateTxt)}</p><p>${esc(rec.id)}</p>${rec.status==='void'?'<p style="color:#a43131;font-weight:700">ANULADA</p>':''}</div></header><section class="rx-patient rx-patient-emphasis"><div class="patient-chip patient-name"><small>PACIENTE</small><strong>${esc(rec.patient.name)}</strong></div><div class="patient-chip"><small>F. NACIMIENTO</small><strong>${dob}</strong></div><div class="patient-chip"><small>EDAD</small><strong>${ageLabel}${ageLabel==='-'?'':' años'}</strong></div><div class="patient-chip"><small>SEXO</small><strong>${sex}</strong></div>${rec.patient.weight?`<div class="patient-chip"><small>PESO</small><strong>${esc(rec.patient.weight)} kg</strong></div>`:''}<div class="patient-chip wide"><small>ALERGIAS</small><strong>${esc(rec.patient.allergies||'No registradas')}</strong></div></section><section class="rx-body"><div class="rx-prescription"><div class="rx-symbol">℞</div>${medHtml}${rec.general?`<div class="rx-general"><strong>Indicaciones adicionales:</strong> ${esc(rec.general)}</div>`:''}</div><aside class="rx-side"><div class="rx-qr-block">${licenseQr}<span>Verificar cédula</span></div><div class="rx-qr-block">${integrityQr}<span>Verificar autenticidad de receta</span></div><div class="rx-signature"><img src="${rec.signatureImage}" alt="Firma"><div class="rx-signature-line"></div><strong>${esc(rec.doctor.name)}</strong><br>Céd. Prof. ${esc(rec.doctor.license)}</div></aside></section><footer class="rx-footer"><div class="hash">SHA-256: ${esc(rec.seal.hash)}</div><div class="key">Clave: ${esc(rec.seal.keyFingerprint)}<br>${esc(rec.seal.algorithm)}</div></footer></article>`
}
function renderHistory(filter=''){
  const term=String(filter||'').trim().toLowerCase();
  const recipes=Array.isArray(state.vault?.recipes)?state.vault.recipes:[];
  const arr=recipes.filter(r=>{
    const patientName=String(r?.patient?.name||'');
    const id=String(r?.id||'');
    return (patientName+' '+id).toLowerCase().includes(term);
  });
  const list=$('#historyList');
  const detail=$('#recipeDetail');
  if(detail)detail.classList.add('hidden');
  if(!list)return;
  if(!arr.length){
    list.innerHTML='<div class="empty-state">Todavía no hay recetas emitidas.</div>';
    return;
  }
  list.innerHTML=arr.map(r=>{
    const medCount=Array.isArray(r?.medications)?r.medications.length:0;
    const status=r?.status==='void'?'void':'issued';
    return `<button class="list-item" type="button" data-recipe="${esc(r?.id||'')}" style="width:100%;text-align:left"><div class="avatar">Rx</div><div class="list-main"><strong>${esc(r?.patient?.name||'Paciente')}</strong><small>${esc(r?.id||'Sin folio')} · ${fmtDateTime(r?.issuedAt||'')} · ${medCount} medicamento(s)</small></div><span class="${status==='void'?'seal-void':'seal-ok'}">${status==='void'?'ANULADA':'SELLADA'}</span></button>`;
  }).join('');
  list.querySelectorAll('[data-recipe]').forEach(b=>b.addEventListener('click',()=>openRecipe(b.dataset.recipe)));
}
async function openRecipe(id){const rec=state.vault.recipes.find(r=>r.id===id);if(!rec)return;await ensureVerificationToken(rec);const ok=await verifyRecipeFixed(rec),d=$('#recipeDetail');d.classList.remove('hidden');d.innerHTML=`<div class="recipe-detail-card"><div class="recipe-detail-head"><div><span class="eyebrow">${esc(rec.id)}</span><h3 style="margin:5px 0">${esc(rec.patient.name)}</h3><div class="${ok?'seal-ok':'seal-void'}">${ok?'✓ Integridad local verificada':'⚠ El sello local no coincide'}</div></div><button class="icon-btn" type="button" id="closeRecipeDetail">×</button></div><div class="rx-preview-shell">${renderRxSheet(rec)}</div><div class="row-actions wrap"><button id="printRecipeBtn" class="btn primary" type="button">Imprimir / Guardar PDF</button><button id="duplicateRecipeBtn" class="btn secondary" type="button">Duplicar como nueva</button>${rec.status!=='void'?'<button id="voidRecipeBtn" class="btn danger" type="button">Anular receta</button>':''}</div><p class="micro">El QR de autenticidad abre un verificador público y muestra exactamente el contenido firmado al emitir. Si el PDF es alterado, la firma ya no coincidirá con ese contenido.</p></div>`;d.scrollIntoView({behavior:'smooth',block:'start'});$('#closeRecipeDetail').addEventListener('click',()=>d.classList.add('hidden'));$('#printRecipeBtn').addEventListener('click',()=>printRecipe(rec));$('#duplicateRecipeBtn').addEventListener('click',()=>duplicateRecipe(rec));$('#voidRecipeBtn')?.addEventListener('click',()=>voidRecipe(rec));}
function manualLogoMarkup(style='monogram'){
  if(style==='crest')return '<div class="rx-logo-inner crest"><div class="rx-logo-shield">✚</div><div class="rx-logo-type"><span>Rx</span><small>CLINIC</small></div></div>';
  if(style==='minimal')return '<div class="rx-logo-inner minimal"><div class="rx-logo-mark thin">Rx</div><div class="rx-logo-type"><span>Dr</span><small>PRESCRIPTION</small></div></div>';
  return '<div class="rx-logo-inner monogram"><div class="rx-logo-mark"><span class="rx-logo-cross">✚</span></div><div class="rx-logo-type"><span>Rx</span><small>MEDICAL</small></div></div>';
}
function renderManualRxHalf(){
  const profile=state.vault.profile||{},theme=themes.find(t=>t.id===state.vault.settings.theme)||themes[0],logoStyle=state.vault.settings.logoStyle||'monogram';
  const licenseQr=RxQR.svg('https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action');
  const contact=[profile.phone,profile.email].filter(Boolean).join(' · ');
  const lines=Array.from({length:7},()=>'<div class="manual-write-line"></div>').join('');
  return `<article class="manual-rx-half" style="--rxp:${esc(theme.primary)};--rxs:${esc(theme.secondary)}"><header class="manual-rx-header"><div class="rx-doc-brand"><div class="rx-logo ${esc(logoStyle)}">${manualLogoMarkup(logoStyle)}<span class="rx-logo-accent"></span></div><div class="rx-doc-copy"><div class="rx-ribbon">PRESCRIPCIÓN MÉDICA</div><h3>${esc(profile.name||'Médico')}</h3><p>${esc(profile.role||'Medicina General')}</p><p>Cédula profesional: ${esc(profile.license||'—')}${profile.university?' · '+esc(profile.university):''}</p>${profile.address?`<p>${esc(profile.address)}</p>`:''}${contact?`<p>${esc(contact)}</p>`:''}</div></div><div class="manual-rx-meta"><strong>RECETA MÉDICA</strong><div>Fecha: ____ / ____ / ______</div></div></header><section class="manual-patient-box"><div class="manual-field patient"><small>PACIENTE</small><span></span></div><div class="manual-field dob"><small>F. NACIMIENTO</small><span></span></div><div class="manual-field age"><small>EDAD</small><span></span></div><div class="manual-field sex"><small>SEXO</small><b>F □ &nbsp; M □</b></div><div class="manual-field allergies"><small>ALERGIAS</small><span></span></div></section><section class="manual-rx-body"><div class="manual-prescription"><div class="rx-symbol">℞</div>${lines}</div><aside class="manual-rx-side"><div class="manual-license-qr">${licenseQr}<span>Verificar cédula profesional</span></div><div class="manual-signature"><div class="manual-signature-space"></div><div class="rx-signature-line"></div><strong>${esc(profile.name||'Firma médica')}</strong><br><span>Céd. Prof. ${esc(profile.license||'—')}</span></div></aside></section><footer class="manual-rx-footer">Formato manual para contingencia · Llenar y firmar de puño y letra</footer></article>`;
}
function renderManualLetterPage(){return `<section class="manual-letter-page"><div class="manual-half-wrap">${renderManualRxHalf()}</div><div class="manual-half-wrap">${renderManualRxHalf()}</div><div class="manual-cut-line"><span>CORTE</span></div></section>`}
function openManualTemplate(){
  if(!state.vault?.profile?.name||!state.vault?.profile?.license){toast('Completa nombre y cédula en Ajustes antes de imprimir la plantilla.');navigate('settings');return;}
  $('#manualTemplatePreview').innerHTML=renderManualLetterPage();
  $('#manualTemplateDialog').showModal();
}
function clearManualPrintMode(){document.getElementById('manualPrintPageStyle')?.remove();$('#printArea').classList.remove('manual-print-area')}
function printManualTemplate(){
  clearManualPrintMode();
  const area=$('#printArea');area.innerHTML=renderManualLetterPage();area.classList.add('manual-print-area');
  const style=document.createElement('style');style.id='manualPrintPageStyle';style.textContent='@media print{@page{size:letter portrait;margin:0}#printArea.manual-print-area{width:8.5in!important;height:11in!important;margin:0!important;padding:0!important}#printArea.manual-print-area .manual-letter-page{display:block!important;width:8.5in!important;height:11in!important;margin:0!important;box-shadow:none!important;page-break-after:always!important}}';document.head.appendChild(style);
  setTimeout(()=>window.print(),100);
}
async function printRecipe(rec){clearManualPrintMode();await ensureVerificationToken(rec);$('#printArea').innerHTML=renderRxSheet(rec);setTimeout(()=>window.print(),80)}
function duplicateRecipe(rec){navigate('rx');$('#rxPatient').value=rec.patient.id;updateSelectedPatient();$('#rxGeneral').value=rec.general||'';$('#medicationList').innerHTML='';state.medSeq=0;rec.medications.forEach(m=>addMedication(m));toast('Receta copiada como borrador nuevo')}
async function voidRecipe(rec){const reason=prompt('Motivo breve de anulación (opcional):','');if(reason===null)return;rec.status='void';rec.voidedAt=new Date().toISOString();rec.voidReason=reason.trim();await saveVault();renderHistory();queueCloudSync();toast('Receta anulada; el registro original se conserva')}
function renderSettings(){const p=state.vault.profile;$('#profileName').value=p.name||'';$('#profileRole').value=p.role||'Medicina General';$('#profileLicense').value=p.license||'';$('#profileUniversity').value=p.university||'Universidad del Valle de Mexico';$('#profileAddress').value=p.address||'Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX';$('#profilePhone').value=p.phone||'';$('#profileEmail').value=p.email||'';$('#lockTimeout').value=String(state.vault.settings.lockTimeout??5);if(p.signature&&!state.profilePad.dirty)state.profilePad.load(p.signature);$('#enableBiometricBtn').textContent=state.meta.biometric?'Reconfigurar':'Activar';$('#bioStatus').textContent=state.meta.biometric?'Biometría configurada para este dominio/dispositivo.':'';renderLogoGrid();updateStorageStatus();updateCloudUI();}
async function saveProfile(e){e.preventDefault();Object.assign(state.vault.profile,{name:$('#profileName').value.trim(),role:$('#profileRole').value.trim(),license:$('#profileLicense').value.trim(),university:$('#profileUniversity').value.trim(),address:$('#profileAddress').value.trim(),phone:$('#profilePhone').value.trim(),email:$('#profileEmail').value.trim()});await saveVault();queueCloudSync();toast('Perfil médico guardado')}
async function saveProfileSignature(){const data=state.profilePad.data();if(!data)return toast('Dibuja primero tu firma.');state.vault.profile.signature=data;await saveVault();queueCloudSync();toast('Firma guardada localmente')}
async function updateStorageStatus(){const el=$('#storageStatus');try{const e=await navigator.storage?.estimate?.();const persistent=await navigator.storage?.persisted?.();if(e){const used=(e.usage/1024/1024).toFixed(1),quota=(e.quota/1024/1024).toFixed(0);el.textContent=`Uso aproximado: ${used} MB de ${quota} MB. Persistencia del navegador: ${persistent?'sí':'no/indeterminada'}.`}else el.textContent='IndexedDB cifrado en este navegador. Exporta respaldos periódicos.';}catch{el.textContent='IndexedDB cifrado en este navegador. Exporta respaldos periódicos.'}}
async function exportBackup(){const payload=await dbGet('vault','payload'),meta=JSON.parse(JSON.stringify(state.meta));meta.biometric=null;const backup={format:'rx-offline-v2-backup',createdAt:new Date().toISOString(),meta,payload};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`rx-offline-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Respaldo cifrado exportado')}
async function importBackup(file){const text=await file.text(),obj=JSON.parse(text);if(obj.format!=='rx-offline-v2-backup'||!obj.meta?.wrappedVaultKey||!obj.payload?.data)throw new Error('Archivo de respaldo no válido.');if(!confirm('Esto reemplazará la bóveda local de este dispositivo. ¿Continuar?'))return;obj.meta.id='setup';obj.meta.biometric=null;obj.payload.id='payload';await dbPut('meta',obj.meta);await dbPut('vault',obj.payload);alert('Respaldo importado. La app se reiniciará; desbloquéala con el PIN del respaldo.');location.reload()}
function bindEvents(){
  $('#setupForm').addEventListener('submit',async e=>{e.preventDefault();const p=$('#setupPin').value,p2=$('#setupPin2').value;if(p.length<8)return toast('Usa al menos 8 caracteres.');if(p!==p2)return toast('Los PIN no coinciden.');try{await setupVault(p);$('#setupPin').value=$('#setupPin2').value='';afterUnlock();toast('Bóveda creada')}catch(err){toast('No se pudo crear: '+err.message)}});
  $('#unlockForm').addEventListener('submit',async e=>{e.preventDefault();setStatus($('#unlockMsg'),'Desbloqueando…');try{await unlockWithPin($('#unlockPin').value);$('#unlockPin').value='';afterUnlock();setStatus($('#unlockMsg'),'')}catch{setStatus($('#unlockMsg'),'PIN/contraseña incorrecta o bóveda dañada.')}});
  $('#biometricUnlockBtn').addEventListener('click',async()=>{setStatus($('#unlockMsg'),'Solicitando biometría…');try{await unlockBiometric();afterUnlock();setStatus($('#unlockMsg'),'')}catch(err){setStatus($('#unlockMsg'),err.message)}});
  $('#lockBtn').addEventListener('click',lock);$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  $('#manualTemplateBtn')?.addEventListener('click',openManualTemplate);$('#closeManualTemplateBtn')?.addEventListener('click',()=>$('#manualTemplateDialog').close());$('#cancelManualTemplateBtn')?.addEventListener('click',()=>$('#manualTemplateDialog').close());$('#printManualTemplateBtn')?.addEventListener('click',printManualTemplate);
  $('#newPatientBtn').addEventListener('click',()=>openPatientDialog());$('#quickPatientBtn').addEventListener('click',()=>openPatientDialog());$('#cancelPatientBtn').addEventListener('click',()=>$('#patientDialog').close());$('#patientDob').addEventListener('input',updatePatientWeightField);$('#patientForm').addEventListener('submit',savePatientFromForm);$('#patientSearch').addEventListener('input',e=>renderPatients(e.target.value));
  $('#rxPatient').addEventListener('change',updateSelectedPatient);$('#addMedBtn').addEventListener('click',()=>addMedication());$('#resetRxBtn').addEventListener('click',resetRx);$$('input[name="signatureMode"]').forEach(r=>r.addEventListener('change',()=>$('#freshSignatureWrap').classList.toggle('hidden',$('input[name="signatureMode"]:checked').value!=='fresh')));$('#clearRxSignature').addEventListener('click',()=>state.rxPad.clear());
  $('#rxForm').addEventListener('submit',async e=>{e.preventDefault();try{state.pendingEmit=await buildRecipeDraft();$('#confirmDialog').showModal();setStatus($('#rxMsg'),'')}catch(err){setStatus($('#rxMsg'),err.message)}});$('#cancelEmitBtn').addEventListener('click',()=>{state.pendingEmit=null;$('#confirmDialog').close()});$('#confirmEmitBtn').addEventListener('click',()=>issueRecipe().catch(err=>{toast(err.message);$('#confirmDialog').close()}));
  $('#historySearch').addEventListener('input',e=>renderHistory(e.target.value));$('#profileForm').addEventListener('submit',saveProfile);$('#clearProfileSignature').addEventListener('click',()=>state.profilePad.clear());$('#saveProfileSignature').addEventListener('click',()=>saveProfileSignature());
  $('#lockTimeout').addEventListener('change',async e=>{state.vault.settings.lockTimeout=Number(e.target.value);await saveVault();scheduleLock();toast('Bloqueo automático actualizado')});
  $('#enableBiometricBtn').addEventListener('click',async()=>{setStatus($('#bioStatus'),'Preparando biometría…');try{await enableBiometric();setStatus($('#bioStatus'),'Face ID / Touch ID configurado para este dominio.',true);$('#enableBiometricBtn').textContent='Reconfigurar';toast('Biometría activada')}catch(err){setStatus($('#bioStatus'),err.message)}});
  $('#exportBackupBtn').addEventListener('click',()=>exportBackup().catch(err=>toast(err.message)));$('#importBackupInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{await importBackup(f)}catch(err){toast(err.message)}finally{e.target.value=''}});
  $('#cloudLoginBtn')?.addEventListener('click',async()=>{const email=$('#cloudEmail').value.trim(),password=$('#cloudPassword').value;if(!email||!password)return setStatus($('#cloudSyncStatus'),'Escribe correo y contraseña.');try{setStatus($('#cloudSyncStatus'),'Iniciando sesión…');state.cloudUser=await window.RxCloud.signIn(email,password);$('#cloudPassword').value='';updateCloudUI();setStatus($('#cloudSyncStatus'),'Supabase Auth conectado · sincronizando…',true);await runCloudSync({quiet:true});toast('Nube conectada y sincronizada')}catch(err){setStatus($('#cloudSyncStatus'),err.message||'No se pudo iniciar sesión')}});
  $('#cloudLogoutBtn')?.addEventListener('click',async()=>{try{await window.RxCloud.signOut();state.cloudUser=null;updateCloudUI();setStatus($('#cloudSyncStatus'),'Sesión de nube cerrada.');toast('Supabase desconectado en este dispositivo')}catch(err){setStatus($('#cloudSyncStatus'),err.message)}});
  $('#cloudSyncBtn')?.addEventListener('click',()=>runCloudSync({quiet:false}));
  window.addEventListener('rx-cloud-auth',e=>{state.cloudUser=e.detail?.user||null;updateCloudUI()});
  ['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{if(state.vault)scheduleLock()},{passive:true}));document.addEventListener('visibilitychange',()=>{if(document.hidden)state.hiddenAt=Date.now();else if(state.vault&&state.hiddenAt){const min=Number(state.vault.settings.lockTimeout||0);if(min>0&&Date.now()-state.hiddenAt>min*60000)lock();else scheduleLock();state.hiddenAt=null;}});
}
async function init(){
  if(!window.crypto?.subtle||!window.indexedDB){alert('Este navegador no ofrece las APIs criptográficas/almacenamiento necesarias. Usa Safari/Chrome moderno mediante HTTPS.');return;}
  state.db=await openDb();state.meta=await dbGet('meta','setup');state.profilePad=new SignaturePad($('#profileSignatureCanvas'));state.rxPad=new SignaturePad($('#rxSignatureCanvas'));bindEvents();if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});if(!state.meta)showAuth('setup');else{$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta.biometric);showAuth('unlock');}
  window.addEventListener('online',()=>{updateCloudUI();if(state.vault&&state.cloudUser)queueCloudSync()});window.addEventListener('offline',()=>updateCloudUI());
}
init().catch(err=>{console.error(err);alert('Error al iniciar Rx Offline: '+err.message)});
})();
