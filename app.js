(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const enc=new TextEncoder(), dec=new TextDecoder();
const state={db:null,meta:null,vault:null,vaultKey:null,screen:'home',medSeq:0,profilePad:null,rxPad:null,lockTimer:null,accessCheckTimer:null,hiddenAt:null,pendingEmit:null,pendingReview:null,pendingBiometric:null,cloudSyncTimer:null,cloudSyncAttempts:0,cloudSyncState:'pending',cloudSyncError:'',cloudUser:null,cloudReady:false,accessGranted:false,accessRole:null,accessOwnerHash:null,accessSessionId:null,testAccess:false};
let visibleRecoveryCode='';
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
 {id:'violetSlate',name:'Violet Slate',desc:'Violeta + pizarra',primary:'#554a78',secondary:'#8b829f',accent:'#c8c0d5',bg:'#f5f3f7',panel:'#ffffff',panel2:'#efecf3',text:'#262330',muted:'#716d7a',line:'#e0dce6'},
 {id:'clinicalGlass',name:'Clinical Glass',desc:'Cristal azul + plata',primary:'#174b68',secondary:'#78a9bd',accent:'#bcd6e0',bg:'#edf5f8',panel:'#fbfdfe',panel2:'#e4eff3',text:'#14252d',muted:'#60757e',line:'#d3e2e8'},
 {id:'cobaltMint',name:'Cobalt Mint',desc:'Cobalto + menta',primary:'#234f88',secondary:'#4f9b89',accent:'#a7d2c7',bg:'#f1f6f6',panel:'#ffffff',panel2:'#e8f0f1',text:'#182531',muted:'#65747b',line:'#d7e2e3'},
 {id:'rosewoodSilk',name:'Rosewood Silk',desc:'Palo de rosa + seda',primary:'#70404a',secondary:'#b38882',accent:'#d8b8b0',bg:'#f8f3f2',panel:'#fffdfc',panel2:'#f2e9e7',text:'#302326',muted:'#7b6b6e',line:'#e6dad8'},
 {id:'deepClinic',name:'Deep Clinic',desc:'Noche clínica + turquesa',dark:true,primary:'#2d87a3',secondary:'#66c2ad',accent:'#9edbd0',bg:'#0c1218',panel:'#131c24',panel2:'#1b2832',text:'#edf5f7',muted:'#9aabb3',line:'#2c3b46'},
 {id:'auroraNight',name:'Aurora Night',desc:'Índigo + aurora',dark:true,primary:'#7486d8',secondary:'#62b8a7',accent:'#a4d7cc',bg:'#0f111a',panel:'#171b27',panel2:'#202637',text:'#f1f3fa',muted:'#a1a8bd',line:'#30384d'},
 {id:'obsidianGoldNight',name:'Obsidian Gold',desc:'Obsidiana + oro tenue',dark:true,primary:'#76552a',secondary:'#c9a65d',accent:'#e3c887',bg:'#0d0f12',panel:'#15181d',panel2:'#20242a',text:'#f4f0e8',muted:'#aaa49a',line:'#34383e'},
 {id:'burgundyNoir',name:'Burgundy Noir',desc:'Vino profundo + champagne',dark:true,primary:'#7c324a',secondary:'#c48a9c',accent:'#deb4bf',bg:'#120d10',panel:'#1d1519',panel2:'#2a1e24',text:'#f7eff2',muted:'#b2a0a7',line:'#403039'},
 {id:'emeraldNight',name:'Emerald Night',desc:'Esmeralda + jade nocturno',dark:true,primary:'#1f6c5b',secondary:'#62b9a0',accent:'#98d7c6',bg:'#0a1210',panel:'#111d1a',panel2:'#1a2a26',text:'#edf7f4',muted:'#96aaa4',line:'#2a403a'},
 {id:'cobaltNoir',name:'Cobalt Noir',desc:'Cobalto + azul glaciar',dark:true,primary:'#31568e',secondary:'#7897d0',accent:'#a9bce5',bg:'#0b0f17',panel:'#121a27',panel2:'#1b2637',text:'#eef3fb',muted:'#97a4b8',line:'#2b3a50'},
 {id:'clinovyra',name:'Clinovyra',desc:'Azul médico + turquesa',primary:'#0753b7',secondary:'#12afa8',accent:'#56d8bd',bg:'#f1f7fb',panel:'#ffffff',panel2:'#e8f3f8',text:'#112741',muted:'#607b8d',line:'#d2e5ef'},
 {id:'clinovyraNight',name:'Clinovyra Night',desc:'Azul profundo + verde agua',dark:true,primary:'#258bdf',secondary:'#54d4bb',accent:'#7de8d1',bg:'#081520',panel:'#102436',panel2:'#193247',text:'#f0fbff',muted:'#9ebbc7',line:'#294459'},
 {id:'clinicalDay',name:'Clinical Day',desc:'Blanco clínico + azul marino',primary:'#154269',secondary:'#246a70',accent:'#c7e6e4',bg:'#f5f8fa',panel:'#ffffff',panel2:'#eaf1f4',text:'#172a35',muted:'#506675',line:'#ccdce3'},
 {id:'surgicalNight',name:'Surgical Night',desc:'Azul carbón + aqua',dark:true,primary:'#69b8da',secondary:'#7fdbc5',accent:'#b9efe0',bg:'#0a141b',panel:'#142530',panel2:'#1d3440',text:'#f3f9fb',muted:'#b1c7cf',line:'#35515c'},
 {id:'glacierPearl',name:'Glacier Pearl',desc:'Hielo + azul quirúrgico',primary:'#155979',secondary:'#4d9fac',accent:'#c2e4e6',bg:'#f3f9fa',panel:'#ffffff',panel2:'#e7f2f4',text:'#17303a',muted:'#536f79',line:'#d0e2e7'},
 {id:'sageAtelier',name:'Sage Atelier',desc:'Salvia + marfil cálido',primary:'#316b5a',secondary:'#a18462',accent:'#d9ccb0',bg:'#f5f7f2',panel:'#ffffff',panel2:'#eaf0e8',text:'#21342f',muted:'#597168',line:'#d8e2d7'},
 {id:'prismNight',name:'Prism Night',desc:'Índigo + reflejo aqua',dark:true,primary:'#9aaaf7',secondary:'#65cabc',accent:'#b8e9df',bg:'#0b1221',panel:'#151e32',panel2:'#222d45',text:'#f3f6ff',muted:'#b2c1d2',line:'#3a4963'},
 {id:'petrolNoir',name:'Petrol Noir',desc:'Petróleo + jade luminoso',dark:true,primary:'#7ac9d8',secondary:'#86d8b6',accent:'#c6eee1',bg:'#0b171b',panel:'#15282e',panel2:'#20373d',text:'#f2faf9',muted:'#abc4c7',line:'#355359'}
];
const logoStyles=[
 {id:'monogram',name:'Monograma clínico',desc:'Sello premium con monograma'},
 {id:'crest',name:'Escudo elegante',desc:'Insignia institucional refinada'},
 {id:'minimal',name:'Minimal serif',desc:'Línea limpia y sobria'}
];
const manualPrintThemes=[
 {id:'burgundyGold',name:'Burgundy Gold',primary:'#6B2639',secondary:'#B89A62',soft:'#F7F0F1'},
 {id:'navyChampagne',name:'Navy Champagne',primary:'#173A5E',secondary:'#C0A46B',soft:'#EEF3F7'},
 {id:'emeraldBrass',name:'Emerald Brass',primary:'#185646',secondary:'#AF915B',soft:'#EEF5F2'},
 {id:'graphiteSilver',name:'Graphite Silver',primary:'#37434B',secondary:'#AAB4BA',soft:'#F1F3F4'},
 {id:'plumRose',name:'Plum Rose',primary:'#5D2F50',secondary:'#C392A6',soft:'#F7F0F5'},
 {id:'tealCopper',name:'Teal Copper',primary:'#17646A',secondary:'#B87850',soft:'#EDF5F5'},
 {id:'indigoAntique',name:'Indigo Antique',primary:'#3E457A',secondary:'#BDA566',soft:'#F1F2F8'},
 {id:'terracottaIvory',name:'Terracotta Ivory',primary:'#8A4F3D',secondary:'#C3A078',soft:'#F8F1ED'}
];
state.manualPrintFolios=[];
state.manualPrintCount=2;
function b64(bytes){let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){const x=atob(s),a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return a}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomBytes(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function copyText(value){try{await navigator.clipboard.writeText(String(value));return true}catch{const area=document.createElement('textarea');area.value=String(value);area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('El navegador bloqueó el portapapeles.');return true}}
function fmtDate(iso){try{return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso))}catch{return iso}}
function fmtDateTime(iso){try{return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return iso}}
function ageYears(dob){if(!dob)return null;const [y,m,d]=dob.split('-').map(Number),now=new Date();let age=now.getFullYear()-y;const md=now.getMonth()+1,dd=now.getDate();if(md<m||(md===m&&dd<d))age--;return age}
function displayDob(dob){return dob?new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(dob+'T00:00:00')):'-'}
function sexCode(v=''){const s=String(v||'').trim().toLowerCase();if(!s)return '';if(['f','femenino','female','mujer'].includes(s))return 'F';if(['m','masculino','male','hombre'].includes(s))return 'M';return 'O'}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'PX'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600)}
function setStatus(el,msg,ok=false){el.textContent=msg;el.style.color=ok?'var(--success)':'var(--muted)'}
function platformLabel(ua=''){
  const s=String(ua);let device=/iPhone/i.test(s)?'iPhone':/iPad/i.test(s)?'iPad':/Android/i.test(s)?'Android':/Windows/i.test(s)?'Windows':/Macintosh|Mac OS X/i.test(s)?'Mac':'Dispositivo';
  let browser=/Edg\//i.test(s)?'Edge':/CriOS|Chrome\//i.test(s)?'Chrome':/FxiOS|Firefox\//i.test(s)?'Firefox':/Safari\//i.test(s)&&!/Chrome|CriOS|Edg\//i.test(s)?'Safari':'Navegador';
  return `${device} · ${browser}`;
}
function maskedIp(ip=''){const s=String(ip||'');if(!s)return '';if(s.includes('.')){const p=s.split('.');return p.length===4?`${p[0]}.${p[1]}.${p[2]}.×`:''}const p=s.split(':').filter(Boolean);return p.length?`${p.slice(0,3).join(':')}::`:'IPv6'}
async function sha256Bytes(data){return new Uint8Array(await crypto.subtle.digest('SHA-256',data instanceof Uint8Array?data:enc.encode(data)))}
async function ownerIdHash(userId){const digest=await sha256Bytes(`rx-owner-v1:${String(userId||'')}`);return b64url(digest)}
async function derivePinKey(pin,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:250000},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptRaw(key,bytes){const iv=randomBytes(12),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);return{iv:b64(iv),data:b64(ct)}}
async function decryptRaw(key,obj){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(obj.iv)},key,unb64(obj.data)))}
function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open('rxOfflineV2',2);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'id'});if(!db.objectStoreNames.contains('vault'))db.createObjectStore('vault',{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);})}
function dbGet(store,id){return new Promise((res,rej)=>{const tx=state.db.transaction(store,'readonly'),r=tx.objectStore(store).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);})}
function dbPut(store,obj){return new Promise((res,rej)=>{const tx=state.db.transaction(store,'readwrite'),r=tx.objectStore(store).put(obj);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})}
function replaceLocalBackup(meta,payload){return new Promise((res,rej)=>{const tx=state.db.transaction(['meta','vault'],'readwrite');tx.objectStore('meta').put(meta);tx.objectStore('vault').put(payload);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('No se pudo guardar el respaldo.'));})}
async function saveVault(){if(!state.vaultKey||!state.vault)return;const bytes=enc.encode(JSON.stringify(state.vault)),box=await encryptRaw(state.vaultKey,bytes);await dbPut('vault',{id:'payload',...box,updatedAt:new Date().toISOString()});}
async function loadVault(key){const box=await dbGet('vault','payload');if(!box)throw new Error('No se encontró la bóveda.');const bytes=await decryptRaw(key,box);return JSON.parse(dec.decode(bytes))}
async function keyFingerprint(publicJwk){const d=await sha256Bytes(`${publicJwk.x}.${publicJwk.y}`);return Array.from(d.slice(0,8)).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{1,4}/g).join('-')}
async function setupVault(pin){
  if(!state.accessGranted&&!state.testAccess)throw new Error('Autoriza primero este dispositivo con la cuenta del propietario.');
  const vaultKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),raw=await crypto.subtle.exportKey('raw',vaultKey),salt=randomBytes(16),pinKey=await derivePinKey(pin,salt),wrapped=await encryptRaw(pinKey,new Uint8Array(raw));
  const signing=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),privateJwk=await crypto.subtle.exportKey('jwk',signing.privateKey),publicJwk=await crypto.subtle.exportKey('jwk',signing.publicKey),fingerprint=await keyFingerprint(publicJwk);
  state.meta={id:'setup',version:4,salt:b64(salt),wrappedVaultKey:wrapped,biometric:null,vaultInstanceId:b64url(randomBytes(24)),ownerIdHash:state.accessOwnerHash||null,deviceAuthorizedAt:new Date().toISOString(),createdAt:new Date().toISOString()};
  state.vaultKey=vaultKey;state.vault={profile:{name:'',role:'Medicina General',license:'',university:'Universidad del Valle de Mexico',address:'Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX',phone:'',email:'',signature:null},patients:[],recipes:[],settings:{theme:'midnightGold',logoStyle:'monogram',lockTimeout:5,profileDataVersion:26},signing:{privateJwk,publicJwk,keyFingerprint:fingerprint}};
  await dbPut('meta',state.meta);await saveVault();if(navigator.storage?.persist)try{await navigator.storage.persist()}catch{}
}
async function wrapVaultKeyForPin(vaultKey,pin){const raw=await crypto.subtle.exportKey('raw',vaultKey),salt=randomBytes(16),pinKey=await derivePinKey(pin,salt),wrapped=await encryptRaw(pinKey,new Uint8Array(raw));return {salt:b64(salt),wrappedVaultKey:wrapped}}
function dataUrlBytes(dataUrl){const match=String(dataUrl||'').match(/^data:([^;,]+);base64,(.+)$/);if(!match)throw new Error('Adjunto local inválido.');return unb64(match[2])}
async function prepareEncryptedDocuments(){
  if(!state.vaultKey||!window.RxSecureSync)return;const docs=state.vault?.emr?.documents||[];let changed=false;
  for(const doc of docs){if(doc.encryptedContent)continue;if(doc.dataUrl){doc.encryptedContent=await window.RxSecureSync.encryptDocument(state.vaultKey,dataUrlBytes(doc.dataUrl),doc);delete doc.dataUrl;doc.storage='local_e2ee_v1';doc.updatedAt=doc.updatedAt||doc.createdAt||new Date().toISOString();changed=true}}
  if(changed)await saveVault();
}
function privateVaultPayload(){return {format:'rx-vault-private-payload-v1',profile:state.vault.profile||{},signing:state.vault.signing||{},settings:state.vault.settings||{},manualFolioLedger:state.vault.manualFolioLedger||[],manualPrintLog:state.vault.manualPrintLog||[],createdAt:new Date().toISOString()}}
async function syncVaultSecret(){
  const recovery=state.vault?.settings?.recovery;if(!recovery?.enabled||!state.cloudUser||!window.RxSecureSync)return;
  const currentKeyId=await window.RxSecureSync.keyId(state.vaultKey);if(recovery.keyId!==currentKeyId)throw new Error('La llave local no coincide con la recuperación activa. Recupera la bóveda antes de sincronizar datos privados.');
  let remoteEnvelope;
  try{remoteEnvelope=await window.RxCloud.downloadVaultSecret()}catch(error){if(error.status!==404)throw error}
  if(remoteEnvelope){
    const remote=await window.RxSecureSync.decryptSecretBundle(state.vaultKey,remoteEnvelope,state.cloudUser.id);
    const logs=new Map([...(remote.manualPrintLog||[]),...(state.vault.manualPrintLog||[])].filter(b=>b?.batchId).map(b=>[b.batchId,b]));
    for(const b of remote.manualPrintLog||[]){const current=logs.get(b.batchId);if(b.archivedAt&&current&&!current.archivedAt)current.archivedAt=b.archivedAt}
    state.vault.manualPrintLog=Array.from(logs.values());
    state.vault.manualFolioLedger=Array.from(new Set([...(remote.manualFolioLedger||[]),...(state.vault.manualFolioLedger||[]),...state.vault.manualPrintLog.flatMap(b=>b.folios||[])]));
    await saveVault();
  }
  const secret=await window.RxSecureSync.encryptSecretBundle(state.vaultKey,privateVaultPayload(),state.cloudUser.id);await window.RxCloud.uploadVaultSecret(secret);
}
async function enableCloudRecovery(){
  const user=await validateCloudAccess();if(!user)throw new Error('Conecta primero tu cuenta autorizada de Supabase.');if(!navigator.onLine)throw new Error('Necesitas conexión para configurar recuperación.');
  const code=window.RxSecureSync.generateRecoveryCode(),envelope=await window.RxSecureSync.createRecoveryEnvelope(state.vaultKey,code,user.id),secret=await window.RxSecureSync.encryptSecretBundle(state.vaultKey,privateVaultPayload(),user.id);
  await window.RxCloud.saveRecoveryEnvelope(envelope);await window.RxCloud.uploadVaultSecret(secret);state.vault.settings.recovery={enabled:true,keyId:envelope.keyId,updatedAt:new Date().toISOString()};await saveVault();visibleRecoveryCode=code;renderRecoveryState();$('#recoveryCodeValue').textContent=code;$('#recoverySavedCheck').checked=false;$('#closeRecoveryCodeBtn').disabled=true;$('#recoveryCodeDialog').showModal();
}
async function recoverCloudVault(e){
  e.preventDefault();const email=$('#recoveryEmail').value.trim(),password=$('#recoveryPassword').value,code=$('#recoveryCode').value,newPin=$('#recoveryNewPin').value,confirmPin=$('#recoveryNewPin2').value;
  if(!email||!password||!code)return setStatus($('#recoverySetupStatus'),'Completa correo, contraseña y código de recuperación.');if(newPin.length<8)return setStatus($('#recoverySetupStatus'),'El nuevo PIN debe tener al menos 8 caracteres.');if(newPin!==confirmPin)return setStatus($('#recoverySetupStatus'),'Los PIN nuevos no coinciden.');
  setStatus($('#recoverySetupStatus'),'Validando cuenta y recuperando la llave cifrada…');
  try{
    const user=await window.RxCloud.signIn(email,password),access=await window.RxCloud.authorizeUser(),envelope=await window.RxCloud.loadRecoveryEnvelope(),vaultKey=await window.RxSecureSync.unwrapRecoveryEnvelope(envelope,code,user.id),secretEnvelope=await window.RxCloud.downloadVaultSecret(),secret=await window.RxSecureSync.decryptSecretBundle(vaultKey,secretEnvelope,user.id),pinBox=await wrapVaultKeyForPin(vaultKey,newPin);
    if(secret?.format!=='rx-vault-private-payload-v1'||!secret?.signing?.privateJwk)throw new Error('El respaldo privado no contiene la identidad de firma.');
    state.accessGranted=true;state.accessRole=access.role;state.accessOwnerHash=await ownerIdHash(user.id);
    state.meta={id:'setup',version:4,...pinBox,biometric:null,vaultInstanceId:b64url(randomBytes(24)),ownerIdHash:state.accessOwnerHash,deviceAuthorizedAt:new Date().toISOString(),createdAt:new Date().toISOString(),recoveredAt:new Date().toISOString()};state.vaultKey=vaultKey;state.vault={profile:secret.profile||{},patients:[],recipes:[],manualFolioLedger:secret.manualFolioLedger||[],manualPrintLog:secret.manualPrintLog||[],settings:{...(secret.settings||{}),recovery:{enabled:true,keyId:envelope.keyId,updatedAt:envelope.createdAt||new Date().toISOString()}},signing:secret.signing};
    await dbPut('meta',state.meta);await saveVault();$('#recoveryPassword').value=$('#recoveryCode').value=$('#recoveryNewPin').value=$('#recoveryNewPin2').value='';await afterUnlock();toast('Bóveda e identidad recuperadas; sincronización en curso');
  }catch(err){setStatus($('#recoverySetupStatus'),err.message||'No se pudo recuperar la bóveda. No se modificaron datos locales.')}
}
async function unlockWithPin(pin){const pinKey=await derivePinKey(pin,unb64(state.meta.salt));const raw=await decryptRaw(pinKey,state.meta.wrappedVaultKey),key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);const vault=await loadVault(key);state.vaultKey=key;state.vault=vault;}
function equalBytes(a,b){if(a.byteLength!==b.byteLength)return false;let diff=0;for(let i=0;i<a.byteLength;i++)diff|=a[i]^b[i];return diff===0}
async function changeVaultPin(e){
  e.preventDefault();const current=$('#currentVaultPin').value,next=$('#newVaultPin').value,confirmNext=$('#confirmVaultPin').value,status=$('#changePinStatus');
  if(next.length<8)return setStatus(status,'El nuevo PIN o contraseña debe tener al menos 8 caracteres.');
  if(next!==confirmNext)return setStatus(status,'La confirmación del nuevo PIN no coincide.');
  if(current===next)return setStatus(status,'El nuevo PIN debe ser diferente del actual.');
  try{
    setStatus(status,'Verificando y actualizando la protección local…');
    const currentKey=await derivePinKey(current,unb64(state.meta.salt)),unwrapped=await decryptRaw(currentKey,state.meta.wrappedVaultKey),active=new Uint8Array(await crypto.subtle.exportKey('raw',state.vaultKey));
    if(!equalBytes(unwrapped,active))throw new Error('CURRENT_PIN_INVALID');
    const pinBox=await wrapVaultKeyForPin(state.vaultKey,next),updated={...state.meta,...pinBox,pinChangedAt:new Date().toISOString()};
    await dbPut('meta',updated);state.meta=updated;$('#changePinForm').reset();$('#changePinForm').classList.add('hidden');$('#showChangePinBtn').setAttribute('aria-expanded','false');setStatus(status,'');toast('PIN de la bóveda actualizado');
  }catch(error){const invalid=error?.message==='CURRENT_PIN_INVALID'||error?.name==='OperationError';setStatus(status,invalid?'El PIN o contraseña actual no es correcto.':'No fue posible cambiar el PIN. La protección anterior continúa vigente.');}
}
async function hkdfAes(secret){const base=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:enc.encode('rx-offline-v2-biometric')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function nativeBiometricUnsupported(){return !!window.ClinovyraRuntime?.nativeOrigin?.()&&!window.ClinovyraBiometric?.supported?.()}
function nativeBiometricEnabled(){return !!window.ClinovyraBiometric?.supported?.()}
function nativeBiometricUnavailableText(){return window.Capacitor?.getPlatform?.()==='ios'?'Esta instalación no cargó el puente nativo de Face ID. Actualiza la app; el PIN sigue disponible.':window.Capacitor?.getPlatform?.()==='android'?'Esta instalación no cargó el puente nativo de huella. Actualiza la app; el PIN sigue disponible.':'En Windows instalado usa la contraseña local; para Windows Hello abre la webapp HTTPS.'}
function biometricBinding(meta=state.meta){return `${meta.ownerIdHash||'local'}:${meta.vaultInstanceId}`}
async function enableNativeBiometric(){
  const capability=await window.ClinovyraBiometric.capability();
  if(!capability.isAvailable||!capability.strongBiometryIsAvailable)throw new Error(`Face ID o huella no está disponible (código ${capability.errorCode??'sin diagnóstico'}). Comprueba que esté configurado en el dispositivo. El PIN continúa disponible.`);
  const prior=state.meta.biometric,instance=state.meta.vaultInstanceId||b64url(randomBytes(24));
  const server=`com.clinovyra.emr.vault.${b64url(randomBytes(18))}`;
  const binding=biometricBinding({...state.meta,vaultInstanceId:instance});
  const raw=b64(new Uint8Array(await crypto.subtle.exportKey('raw',state.vaultKey)));
  try{
    await window.ClinovyraBiometric.protect(server,binding,raw);
    const verified=await window.ClinovyraBiometric.release(server);
    if(verified.username!==binding||verified.password!==raw)throw new Error('La credencial biométrica no abrió esta bóveda.');
    const next={...state.meta,vaultInstanceId:instance,biometric:{mode:'native',server,createdAt:new Date().toISOString()}};
    await dbPut('meta',next);state.meta=next;
    if(prior?.mode==='native')window.ClinovyraBiometric.remove(prior.server).catch(()=>{});
    return {complete:true,mode:'native'};
  }catch(error){await window.ClinovyraBiometric.remove(server).catch(()=>{});throw error}
}
function biometricError(error){
  if(['PRF_UNAVAILABLE','LARGE_BLOB_UNAVAILABLE','BIOMETRIC_CONTINUE'].includes(error?.code))return error.message;
  if(error?.name==='NotAllowedError')return 'La verificación biométrica se canceló, venció o no fue autorizada. Intenta de nuevo y confirma Face ID / Touch ID / Windows Hello.';
  if(error?.name==='InvalidStateError')return 'La credencial ya existe o no puede reconfigurarse. Usa “Reconfigurar” y confirma la solicitud del sistema.';
  if(error?.name==='SecurityError')return 'El navegador bloqueó WebAuthn para este dominio. Abre la app desde su URL HTTPS original, no desde un iframe.';
  if(error?.name==='NotSupportedError')return 'Este navegador o autenticador no ofrece el método criptográfico requerido. Continúa usando el PIN.';
  return error?.message||'No fue posible completar la verificación biométrica. Usa el PIN e inténtalo de nuevo desde Ajustes.';
}
async function biometricCapabilities(){
  const base={secure:!!window.isSecureContext,api:!!(window.PublicKeyCredential&&navigator.credentials),platform:false,prf:null,largeBlob:null};
  if(!base.secure||!base.api)return base;
  try{base.platform=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()}catch{}
  try{if(typeof PublicKeyCredential.getClientCapabilities==='function'){const caps=await PublicKeyCredential.getClientCapabilities();base.prf=caps?.prf??null;base.largeBlob=caps?.largeBlob??null}}catch{}
  return base;
}
function internalTransports(values){const list=Array.isArray(values)?values.filter(x=>x==='internal'):[];return list.length?list:['internal']}
function assertionOptions(credentialId,extensions,transports=['internal']){return {publicKey:{challenge:randomBytes(32),allowCredentials:[{type:'public-key',id:unb64(credentialId),transports:internalTransports(transports)}],userVerification:'required',timeout:60000,extensions}}}
async function getPrfSecret(credentialId,prfSalt,transports){const assertion=await navigator.credentials.get(assertionOptions(credentialId,{prf:{eval:{first:unb64(prfSalt)}}},transports));const ext=assertion?.getClientExtensionResults?.();const first=ext?.prf?.results?.first;if(!first){const error=new Error('Face ID se confirmó, pero Safari no entregó la clave PRF. Pulsa de nuevo para completar en modo compatible.');error.code='PRF_UNAVAILABLE';throw error}return new Uint8Array(first)}
async function writeLargeBlob(credentialId,rawVaultKey,transports){const bytes=new Uint8Array(rawVaultKey),assertion=await navigator.credentials.get(assertionOptions(credentialId,{largeBlob:{write:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}},transports)),ext=assertion?.getClientExtensionResults?.();if(ext?.largeBlob?.written!==true){const error=new Error('Safari no pudo guardar la llave en el almacenamiento protegido de la passkey.');error.code='LARGE_BLOB_UNAVAILABLE';throw error}}
async function readLargeBlob(credentialId,transports){const assertion=await navigator.credentials.get(assertionOptions(credentialId,{largeBlob:{read:true}},transports)),ext=assertion?.getClientExtensionResults?.(),blob=ext?.largeBlob?.blob;if(!blob){const error=new Error('La passkey no devolvió la llave protegida. Usa el PIN y reconfigura Face ID.');error.code='LARGE_BLOB_UNAVAILABLE';throw error}const raw=new Uint8Array(blob);if(raw.byteLength!==32){const error=new Error('La llave biométrica recuperada no tiene un formato válido. Usa el PIN.');error.code='LARGE_BLOB_UNAVAILABLE';throw error}return raw}
async function storePrfBiometric(pending,secret){const bioKey=await hkdfAes(secret),raw=new Uint8Array(await crypto.subtle.exportKey('raw',state.vaultKey)),wrapped=await encryptRaw(bioKey,raw);state.meta.biometric={mode:'prf',credentialId:pending.credentialId,prfSalt:pending.prfSalt,transports:pending.transports,wrappedVaultKey:wrapped,createdAt:new Date().toISOString()};await dbPut('meta',state.meta);state.pendingBiometric=null;return {complete:true,mode:'prf'}}
async function completeBiometricEnrollment(){
  const pending=state.pendingBiometric;if(!pending)throw new Error('No hay una configuración biométrica pendiente.');
  if(pending.mode==='prf'){
    try{return await storePrfBiometric(pending,await getPrfSecret(pending.credentialId,pending.prfSalt,pending.transports))}
    catch(error){if(error?.code!=='PRF_UNAVAILABLE'||!pending.largeBlobSupported)throw error;pending.mode='largeBlob';return {complete:false,mode:'largeBlob',message:'Face ID fue reconocido. Safari no entregó PRF; pulsa “Completar con Face ID” otra vez para guardar la llave en el modo compatible.'}}
  }
  const raw=new Uint8Array(await crypto.subtle.exportKey('raw',state.vaultKey));await writeLargeBlob(pending.credentialId,raw,pending.transports);state.meta.biometric={mode:'largeBlob',credentialId:pending.credentialId,transports:pending.transports,createdAt:new Date().toISOString()};await dbPut('meta',state.meta);state.pendingBiometric=null;return {complete:true,mode:'largeBlob'};
}
async function enableBiometric(){
  if(nativeBiometricEnabled())return enableNativeBiometric();
  if(nativeBiometricUnsupported())throw new Error('Esta plataforma instalada conserva el PIN local. Usa la webapp HTTPS para configurar una passkey con Windows Hello.');
  if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials)throw new Error('La biometría web requiere HTTPS y un navegador compatible.');
  if(state.pendingBiometric)return completeBiometricEnrollment();
  // WebKit may require the WebAuthn request to begin in the original tap. The
  // capability check belongs in the settings display, not before create().
  const prfSalt=randomBytes(32),userId=randomBytes(16);const cred=await navigator.credentials.create({publicKey:{challenge:randomBytes(32),rp:{name:'Rx Offline EMR'},user:{id:userId,name:`rx-local-${Date.now()}`,displayName:'Bóveda local Rx Offline'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},timeout:60000,attestation:'none',extensions:{prf:{eval:{first:prfSalt}},largeBlob:{support:'preferred'}}}});
  if(!cred)throw new Error('No se creó la passkey.');const extension=cred.getClientExtensionResults?.()||{},credentialId=b64(new Uint8Array(cred.rawId)),transports=internalTransports(cred.response?.getTransports?.()),pending={credentialId,prfSalt:b64(prfSalt),transports,largeBlobSupported:extension?.largeBlob?.supported===true,mode:extension?.prf?.enabled===false?'largeBlob':'prf'},registrationSecret=extension?.prf?.results?.first;
  if(registrationSecret)return storePrfBiometric(pending,new Uint8Array(registrationSecret));
  if(pending.mode==='largeBlob'&&!pending.largeBlobSupported)throw new Error('Safari creó la passkey, pero no habilitó PRF ni almacenamiento protegido. El PIN continúa funcionando.');
  state.pendingBiometric=pending;return {complete:false,mode:pending.mode,message:'Passkey creada. Pulsa “Completar con Face ID” para terminar el cifrado con una nueva autorización de Safari.'};
}
async function unlockBiometric(){if(nativeBiometricUnsupported())throw new Error('Usa el PIN de esta app instalada.');const bio=state.meta.biometric;if(!bio)throw new Error('Biometría no configurada.');let raw;if(bio.mode==='native'){
  if(!nativeBiometricEnabled()||!state.meta.vaultInstanceId)throw new Error('Esta credencial pertenece a otra instalación. Usa el PIN.');
  const credential=await window.ClinovyraBiometric.release(bio.server);
  if(credential.username!==biometricBinding())throw new Error('La credencial pertenece a otra bóveda. Usa el PIN.');
  raw=unb64(credential.password);
}else if((bio.mode||'prf')==='largeBlob')raw=await readLargeBlob(bio.credentialId,bio.transports);else{const secret=await getPrfSecret(bio.credentialId,bio.prfSalt,bio.transports),bioKey=await hkdfAes(secret);raw=await decryptRaw(bioKey,bio.wrappedVaultKey)}if(raw.byteLength!==32)throw new Error('La llave biométrica no es válida. Usa el PIN.');const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);const vault=await loadVault(key);state.vaultKey=key;state.vault=vault;}
async function updateBiometricCapabilityStatus(){const el=$('#biometricCapability');if(!el)return;if(nativeBiometricEnabled()){try{const c=await window.ClinovyraBiometric.capability();el.textContent=c.isAvailable&&c.strongBiometryIsAvailable?'Biometría fuerte disponible. La llave quedará protegida por el sistema; cada desbloqueo requiere confirmación.':`Face ID o huella no disponible (código ${c.errorCode??'sin diagnóstico'}). Revisa la configuración del dispositivo; usa el PIN mientras tanto.`}catch(error){el.textContent=`No se pudo comprobar la biometría nativa: ${error?.message||'error desconocido'}. Usa el PIN.`}return}if(nativeBiometricUnsupported())return el.textContent=nativeBiometricUnavailableText();const c=await biometricCapabilities();if(!c.secure)return el.textContent='No disponible: esta página no está en un contexto HTTPS seguro.';if(!c.api)return el.textContent='No disponible: el navegador no implementa WebAuthn.';if(!c.platform)return el.textContent='No se detectó biometría del dispositivo. En Firefox Portable puede requerir Windows Hello o una llave de seguridad.';if(state.pendingBiometric)return el.textContent='Passkey creada; falta una autorización directa para completar el cifrado en Safari.';const mode=state.meta?.biometric?.mode||'prf';el.textContent=state.meta?.biometric?`Autenticador detectado · configuración activa (${mode==='largeBlob'?'almacenamiento protegido':'PRF'}).`:'Autenticador del dispositivo detectado. Listo para configurar y probar.'}
async function disableBiometric(){if(state.pendingBiometric){state.pendingBiometric=null;renderSettings();return toast('Configuración biométrica cancelada; el método anterior y el PIN siguen intactos')}const prior=state.meta?.biometric;if(!prior)return;if(!confirm('¿Desactivar el desbloqueo biométrico en este dispositivo? El PIN seguirá funcionando.'))return;const next={...state.meta,biometric:null};await dbPut('meta',next);state.meta=next;if(prior.mode==='native')await window.ClinovyraBiometric.remove(prior.server).catch(()=>{});renderSettings();$('#biometricUnlockBtn').classList.add('hidden');toast('Biometría desactivada; la bóveda conserva el PIN')}
function updateNightModeControl(id){const t=themes.find(x=>x.id===id)||themes[0],button=$('#nightModeBtn'),status=$('#themeModeStatus');if(button)button.textContent=t.dark?'Usar tema claro':'Activar modo nocturno';if(status)status.textContent=t.dark?`Modo nocturno activo · ${t.name}`:`Modo claro activo · ${t.name}`}
function applyTheme(id){const t=themes.find(x=>x.id===id)||themes[0];for(const k of ['primary','secondary','accent','bg','panel','panel2','text','muted','line'])document.documentElement.style.setProperty(`--${k}`,t[k]);document.documentElement.dataset.themeMode=t.dark?'dark':'light';document.documentElement.style.colorScheme=t.dark?'dark':'light';document.querySelector('meta[name="theme-color"]').setAttribute('content',t.primary);$$('.theme-card').forEach(x=>{x.classList.toggle('active',x.dataset.theme===t.id);x.setAttribute('aria-pressed',String(x.dataset.theme===t.id))});updateNightModeControl(t.id)}
async function toggleNightMode(){const current=themes.find(x=>x.id===state.vault.settings.theme)||themes[0];if(current.dark){state.vault.settings.lastDarkTheme=current.id;state.vault.settings.theme=state.vault.settings.lastLightTheme||'clinovyra'}else{state.vault.settings.lastLightTheme=current.id;state.vault.settings.theme=state.vault.settings.lastDarkTheme||'clinovyraNight'}applyTheme(state.vault.settings.theme);await saveVault();toast(themes.find(x=>x.id===state.vault.settings.theme)?.dark?'Modo nocturno activado':'Tema claro restaurado')}
function themeCard(t){return `<button class="theme-card" data-theme="${t.id}" type="button"><div class="theme-preview" style="background:${t.bg}"><div style="background:${t.primary}"></div><div><span style="background:${t.secondary}"></span><span style="background:${t.panel2}"></span></div></div><strong>${esc(t.name)}</strong><small>${esc(t.desc)}</small></button>`}
function renderThemeGrid(){
  const g=$('#themeGrid'),featured=['clinovyra','glacierPearl','sageAtelier','clinovyraNight','prismNight','petrolNoir'];
  const selected=state.vault?.settings?.theme||'midnightGold',more=themes.filter(t=>!featured.includes(t.id));
  const group=(title,items)=>`<section class="theme-section"><h3>${title}</h3><div class="theme-options">${items.map(themeCard).join('')}</div></section>`;
  g.innerHTML=group('Temas claros',featured.slice(0,3).map(id=>themes.find(t=>t.id===id)))+
    group('Temas nocturnos',featured.slice(3).map(id=>themes.find(t=>t.id===id)))+
    `<details class="theme-more" ${featured.includes(selected)?'':'open'}><summary>Explorar las ${more.length} paletas anteriores</summary><div class="theme-more-grid">${group('Más temas claros',more.filter(t=>!t.dark))}${group('Más temas nocturnos',more.filter(t=>t.dark))}</div></details>`;
  g.querySelectorAll('.theme-card').forEach(b=>b.addEventListener('click',async()=>{
    const t=themes.find(x=>x.id===b.dataset.theme);state.vault.settings.theme=b.dataset.theme;
    if(t?.dark)state.vault.settings.lastDarkTheme=t.id;else state.vault.settings.lastLightTheme=t?.id;
    applyTheme(b.dataset.theme);await saveVault();toast('Tema actualizado');
  }));
  applyTheme(selected);
}
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
function closeNavigation(){const nav=$('#primaryNav'),backdrop=$('#navBackdrop'),menu=$('#menuBtn');nav?.classList.remove('open');backdrop?.classList.remove('open');menu?.setAttribute('aria-expanded','false');$('#dockMoreBtn')?.setAttribute('aria-expanded','false')}
function toggleNavigation(){const open=!$('#primaryNav')?.classList.contains('open');$('#primaryNav')?.classList.toggle('open',open);$('#navBackdrop')?.classList.toggle('open',open);$('#menuBtn')?.setAttribute('aria-expanded',String(open));$('#dockMoreBtn')?.setAttribute('aria-expanded',String(open))}
function showAuth(which){$('#accessView').classList.toggle('hidden',which!=='access');$('#setupView').classList.toggle('hidden',which!=='setup');$('#unlockView').classList.toggle('hidden',which!=='unlock');$('#mainView').classList.toggle('hidden',which!=='main');if(which!=='main')closeNavigation()}
async function grantAccountAccess(access){
  if(!access?.user?.id)throw new Error('Supabase no devolvió una identidad válida.');
  const hash=await ownerIdHash(access.user.id);if(state.meta?.ownerIdHash&&state.meta.ownerIdHash!==hash)throw new Error('La bóveda de este dispositivo pertenece a otra cuenta.');
  state.accessGranted=true;state.accessRole=access.role||'authorized';state.accessOwnerHash=hash;state.accessSessionId=access.sessionId||window.RxCloud?.currentSessionId?.()||null;state.cloudUser=access.user;
  if(state.meta&&!state.meta.ownerIdHash){state.meta.ownerIdHash=hash;state.meta.deviceAuthorizedAt=new Date().toISOString();state.meta.version=Math.max(4,Number(state.meta.version||0));await dbPut('meta',state.meta)}
  return access.user;
}
async function validateCloudAccess(){const access=await window.RxCloud.authorizeUser();return grantAccountAccess(access)}
async function deauthorizeCurrentDevice(message='Este dispositivo fue desautorizado.'){
  clearTimeout(state.accessCheckTimer);clearTimeout(state.cloudSyncTimer);clearTimeout(state.lockTimer);
  try{await window.RxCloud?.signOut?.('local')}catch{}
  if(state.meta){state.meta.ownerIdHash=null;state.meta.deviceAuthorizedAt=null;await dbPut('meta',state.meta)}
  window.RxEMR?.onLock?.();state.vault=null;state.vaultKey=null;state.cloudUser=null;state.accessGranted=false;state.accessRole=null;state.accessOwnerHash=null;state.accessSessionId=null;
  showAuth('access');setStatus($('#accessStatus'),message);
}
function scheduleAccessCheck(){
  clearTimeout(state.accessCheckTimer);if(!state.vault||!state.cloudUser)return;
  state.accessCheckTimer=setTimeout(async()=>{if(!state.vault)return;if(navigator.onLine){try{await validateCloudAccess()}catch(err){if(err?.status===403)return deauthorizeCurrentDevice('La sesión de este dispositivo fue revocada. Inicia sesión nuevamente para autorizarlo.')}}scheduleAccessCheck()},60000);
}
async function resolveInitialAccess(){
  state.testAccess=(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('e2e')==='1');
  if(state.testAccess){state.accessGranted=true;state.accessRole='test';state.accessOwnerHash='local-e2e';return showAuth(state.meta?'unlock':'setup')}
  if(state.meta?.ownerIdHash){state.accessGranted=true;state.accessOwnerHash=state.meta.ownerIdHash;return showAuth('unlock')}
  await initCloudState();
  if(state.cloudUser){try{await validateCloudAccess();return showAuth(state.meta?'unlock':'setup')}catch(err){await window.RxCloud.signOut().catch(()=>{});state.cloudUser=null;setStatus($('#accessStatus'),err.message)}}
  showAuth('access');if(!navigator.onLine)setStatus($('#accessStatus'),'Conéctate a internet para autorizar este dispositivo por primera vez.');
}
async function submitAccess(e){
  e.preventDefault();const email=$('#accessEmail').value.trim(),password=$('#accessPassword').value;if(!email||!password)return setStatus($('#accessStatus'),'Escribe el correo y la contraseña autorizados.');
  setStatus($('#accessStatus'),'Verificando cuenta y autorización…');
  try{await window.RxCloud.signIn(email,password);await validateCloudAccess();$('#accessPassword').value='';setStatus($('#accessStatus'),'Dispositivo autorizado.',true);showAuth(state.meta?'unlock':'setup')}
  catch(err){await window.RxCloud?.signOut?.().catch(()=>{});state.cloudUser=null;state.accessGranted=false;setStatus($('#accessStatus'),err.message||'No fue posible autorizar este dispositivo.')}
}
async function migrateProfileDefaults(){
  if(!state.vault?.profile)return;
  state.vault.settings=state.vault.settings||{};
  let changed=false;
  if(Number(state.vault.settings.profileDataVersion||0)<26){
    if(!state.vault.profile.university)state.vault.profile.university='Universidad del Valle de Mexico';
    if(!state.vault.profile.address)state.vault.profile.address='Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX';
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
  const cloudLabel=state.cloudSyncState==='synced'?'Nube al día':state.cloudSyncState==='error'?'Nube pendiente':'Sincronizando…';
  const status=$('#cloudStatus');
  if(status)status.textContent=message||(configured?(signed?`Conectado como ${state.cloudUser.email||'usuario'} · ${cloudLabel}${state.cloudSyncError?` · ${state.cloudSyncError}`:''}`:'Supabase configurado · inicia sesión para activar la nube'):'Supabase no configurado · modo local disponible');
  $('#cloudLoginWrap')?.classList.toggle('hidden',signed);
  $('#cloudSignedWrap')?.classList.toggle('hidden',!signed);
  const badge=$('#offlineBadge');
  if(badge)badge.textContent=!navigator.onLine?'● Offline':(signed?`● ${cloudLabel}`:'● Local');
  const ownerStatus=$('#ownerAccessStatus'),navUser=$('#navUserLabel');
  if(ownerStatus)ownerStatus.textContent=signed?`${state.cloudUser.email||'Cuenta privada'} · ${state.accessRole==='owner'?'propietario':'autorizada'}`:'Autorización guardada en este dispositivo';
  if(navUser)navUser.textContent=signed?(state.cloudUser.email||'Cuenta autorizada'):'Dispositivo autorizado · offline';
}
function renderSessionRows(rows=[]){
  const list=$('#sessionList');if(!list)return;
  if(!rows.length){list.innerHTML='<div class="empty-state compact">No se encontraron sesiones activas.</div>';return}
  list.innerHTML=rows.map(row=>{const current=Boolean(row.is_current),network=maskedIp(row.ip_address);return `<article class="session-item ${current?'current':''}"><div class="session-icon">${/iPhone|iPad/i.test(row.user_agent||'')?'◉':/Android/i.test(row.user_agent||'')?'◇':'▣'}</div><div class="session-main"><div><strong>${esc(platformLabel(row.user_agent))}</strong>${current?'<span class="current-chip">Este dispositivo</span>':''}</div><small>Última actividad: ${esc(fmtDateTime(row.last_active_at||row.created_at))}${network?' · Red '+esc(network):''}</small><small>Inicio: ${esc(fmtDateTime(row.created_at))}</small></div>${current?'':`<button class="btn danger session-revoke" type="button" data-revoke-session="${esc(row.session_id)}">Revocar</button>`}</article>`}).join('');
  list.querySelectorAll('[data-revoke-session]').forEach(button=>button.addEventListener('click',()=>revokeRemoteSession(button.dataset.revokeSession)));
}
async function refreshSessions(){
  const status=$('#sessionStatus');if(!state.cloudUser)return setStatus(status,'Conecta la cuenta del propietario para consultar sesiones.');if(!navigator.onLine)return setStatus(status,'Necesitas conexión para consultar sesiones.');
  setStatus(status,'Consultando sesiones protegidas…');
  try{const rows=await window.RxCloud.listSessions();renderSessionRows(rows);setStatus(status,`${rows.length} sesión${rows.length===1?'':'es'} activa${rows.length===1?'':'s'}.`,true)}catch(err){setStatus(status,err.message||'No fue posible consultar las sesiones.')}
}
async function revokeRemoteSession(sessionId){
  if(!confirm('¿Revocar esta sesión? El dispositivo perderá sincronización y acceso online al comprobar su autorización.'))return;
  setStatus($('#sessionStatus'),'Revocando sesión…');
  try{await window.RxCloud.revokeSession(sessionId);await refreshSessions();toast('Sesión remota revocada')}catch(err){setStatus($('#sessionStatus'),err.message||'No se pudo revocar la sesión.')}
}
async function signOutOtherSessions(){
  if(!confirm('¿Cerrar todas las demás sesiones de Supabase y conservar únicamente este dispositivo?'))return;
  setStatus($('#sessionStatus'),'Cerrando las demás sesiones…');
  try{await window.RxCloud.signOutOthers();await refreshSessions();toast('Las demás sesiones fueron cerradas')}catch(err){setStatus($('#sessionStatus'),err.message||'No se pudieron cerrar las demás sesiones.')}
}
async function runCloudSync({quiet=false}={}){
  if(!state.vault||!window.RxCloud?.configured?.())return false;
  try{
    state.cloudSyncState='pending';state.cloudSyncError='';updateCloudUI();
    const u=await window.RxCloud.user();state.cloudUser=u;updateCloudUI();
    if(!u){if(!quiet)toast('Inicia sesión en Supabase para sincronizar');return false}
    await validateCloudAccess();
    scheduleAccessCheck();
    setStatus($('#cloudSyncStatus'),'Probando sincronización con Supabase…');
    await ensureAllPublicTokens();
    await prepareEncryptedDocuments();
    await syncVaultSecret();
    const syncResult=await window.RxCloud.syncVault(state.vault,canonicalPayload);
    for(const rec of state.vault.recipes||[]){if(rec?.seal?.publicToken)rec.seal.cloudRegistered=true}
    await saveVault();state.cloudSyncAttempts=0;
    const emrPending=syncResult?.emrResult?.migrationRequired;
    state.cloudSyncState=emrPending?'error':'synced';state.cloudSyncError=emrPending?'EMR pendiente de migración':'';
    renderAll();updateCloudUI();
    setStatus($('#cloudSyncStatus'),emrPending?`Recetas sincronizadas · EMR pendiente de migración en el entorno Supabase`:`Sincronización completada ${fmtDateTime(new Date().toISOString())}`,!emrPending);
    if(!quiet)toast('Sincronización completada');
    return !emrPending;
  }catch(err){
    console.warn('Rx Cloud sync:',err);
    state.cloudSyncAttempts=Math.min(6,(state.cloudSyncAttempts||0)+1);
    state.cloudSyncState='error';state.cloudSyncError=err.message||'no se pudo sincronizar';updateCloudUI();
    setStatus($('#cloudSyncStatus'),`Nube pendiente: ${err.message||'no se pudo sincronizar'}. La receta y la bóveda local siguen funcionando.`);
    if(state.vault&&!state.vault.patients?.length)renderPatients($('#patientSearch')?.value||'');
    if(navigator.onLine&&state.cloudUser&&state.cloudSyncAttempts<6){clearTimeout(state.cloudSyncTimer);const delay=Math.min(60000,1200*(2**(state.cloudSyncAttempts-1)));state.cloudSyncTimer=setTimeout(()=>runCloudSync({quiet:true}),delay)}
    if(!quiet)toast('Sincronización pendiente; modo local activo');
    return false;
  }
}
function queueCloudSync(){
  clearTimeout(state.cloudSyncTimer);
  state.cloudSyncState='pending';state.cloudSyncError='';updateCloudUI();
  const el=$('#cloudSyncStatus');
  if(!state.cloudUser){if(el)setStatus(el,'Cambios guardados en la bóveda local.');return}
  if(!navigator.onLine){if(el)setStatus(el,'Cambios guardados localmente · se sincronizarán al recuperar internet.');return}
  if(el)setStatus(el,'Cambios guardados · sincronizando con Supabase…');
  state.cloudSyncTimer=setTimeout(()=>runCloudSync({quiet:true}),900);
}
async function afterUnlock(){
  if(!state.accessGranted&&!state.meta?.ownerIdHash&&!state.testAccess){state.vault=null;state.vaultKey=null;return showAuth('access')}
  state.accessGranted=true;state.accessOwnerHash=state.meta?.ownerIdHash||state.accessOwnerHash;
  applyTheme(state.vault.settings.theme);
  await migrateProfileDefaults();
  await prepareEncryptedDocuments();
  showAuth('main');
  window.RxEMR?.init?.(state.vault,{save:saveVault,queueSync:queueCloudSync,toast,encryptDocument:(bytes,meta)=>window.RxSecureSync.encryptDocument(state.vaultKey,bytes,meta),decryptDocument:(box,meta)=>window.RxSecureSync.decryptDocument(state.vaultKey,box,meta),cloud:()=>window.RxCloud,openPatient:()=>openPatientDialog(),navigateRaw:navigate,openRxForPatient:id=>{navigate('rx');$('#rxPatient').value=id||'';updateSelectedPatient();},openRecipe:id=>{navigate('history');openRecipe(id);}});
  window.RxQuickNote?.init?.({getToken:()=>window.RxCloud?.accessToken?.(),toast});
  renderAll();
  navigate('home');
  scheduleLock();
  await initCloudState();
  if(state.cloudUser){
    try{await validateCloudAccess();scheduleAccessCheck();setStatus($('#cloudSyncStatus'),'Sesión de nube restaurada · sincronizando…');if(navigator.onLine)await runCloudSync({quiet:true});else updateCloudUI()}
    catch(err){await window.RxCloud.signOut().catch(()=>{});state.cloudUser=null;updateCloudUI('Sesión de nube no autorizada; la bóveda local permanece protegida.');setStatus($('#cloudSyncStatus'),err.message)}
  }
}
function lock(){window.RxEMR?.onLock?.();window.RxQuickNote?.onLock?.();state.pendingBiometric=null;state.vault=null;state.vaultKey=null;clearTimeout(state.lockTimer);clearTimeout(state.accessCheckTimer);$('#unlockPin').value='';$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta?.biometric||nativeBiometricUnsupported());closeNavigation();showAuth('unlock');}
function scheduleLock(){clearTimeout(state.lockTimer);const min=Number(state.vault?.settings?.lockTimeout||0);if(min>0)state.lockTimer=setTimeout(lock,min*60000)}
function updateDock(name){
  const dock=$('#mobileDock');if(!dock)return;
  const buttons=$$('#mobileDock [data-nav]'),active=buttons.find(b=>b.dataset.nav===name);
  for(const button of buttons){button.classList.toggle('active',button===active);if(button===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')}
  const index=active?buttons.indexOf(active):4;dock.style.setProperty('--dock-index',String(index));
  $('#dockMoreBtn')?.classList.toggle('active',!active);
}
function bindDockSwipe(){
  const dock=$('#mobileDock');if(!dock)return;
  let gesture=null,suppressClickUntil=0;
  dock.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
  dock.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||!e.isPrimary||!e.target.closest('button'))return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};
  });
  dock.addEventListener('pointermove',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(!gesture.dragging){if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.2)return;gesture.dragging=true;dock.classList.add('dragging');try{dock.setPointerCapture(e.pointerId)}catch{}}
    e.preventDefault();const rect=dock.getBoundingClientRect();
    const index=Math.max(0,Math.min(4,(e.clientX-rect.left-5)*5/(rect.width-10)-.5));
    dock.style.setProperty('--dock-index',String(index));
  });
  const finish=e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const dragged=gesture.dragging;gesture=null;dock.classList.remove('dragging');
    if(!dragged){updateDock(state.screen);return}
    suppressClickUntil=Date.now()+400;e.preventDefault();
    if(e.type==='pointercancel'){updateDock(state.screen);return}
    const buttons=Array.from(dock.querySelectorAll('button')),rect=dock.getBoundingClientRect();
    const index=Math.max(0,Math.min(buttons.length-1,Math.floor((e.clientX-rect.left)*buttons.length/rect.width)));
    const button=buttons[index];
    if(button?.id==='dockMoreBtn'){dock.style.setProperty('--dock-index','4');toggleNavigation()}
    else if(button?.dataset.nav==='rx')window.RxEMR?.directPrescription?.();
    else if(button?.dataset.nav)navigate(button.dataset.nav);
    else updateDock(state.screen);
  };
  dock.addEventListener('pointerup',finish);dock.addEventListener('pointercancel',finish);
}
function navigate(name){if(!state.vault)return;closeNavigation();state.screen=name;$$('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${name}`));$$('#primaryNav button[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));updateDock(name);const titles={home:'Inicio',patients:'Pacientes',emr:'Expediente clínico',encounter:'Consulta',quicknote:'Nota clínica rápida',rx:'Nueva receta',history:'Recetas',settings:'Ajustes'};$('#topSubtitle').textContent=titles[name]||'';if(name==='patients')renderPatients();if(name==='history')renderHistory();if(name==='emr'){const record=$('#patientRecord');record?.classList.add('hidden');$('#screen-emr')?.classList.remove('record-open');window.RxEMR?.renderDashboard?.()}if(name==='rx')renderRxPatientOptions();if(name==='settings'){renderSettings();refreshSessions()}window.scrollTo({top:0,behavior:'smooth'});}
function renderAll(){const commercial=window.ClinovyraPolicy?.isCommercial?.()||false;$('#manualTemplateBtn')?.classList.toggle('hidden',commercial);$('#directRxHomeBtn')?.classList.toggle('hidden',commercial);renderCounts();renderPatients();renderRxPatientOptions();renderHistory();renderSettings();renderThemeGrid();renderLogoGrid();window.RxEMR?.renderDashboard?.();if(!$('#medicationList').children.length)addMedication();$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta?.biometric||nativeBiometricUnsupported());}
function renderCounts(){$('#patientCount').textContent=state.vault.patients.filter(p=>!p.archived).length;$('#recipeCount').textContent=state.vault.recipes.length;window.RxEMR?.renderDashboard?.()}
function patientSubtitle(p){const age=ageYears(p.dob);const dobTxt=p.dob?displayDob(p.dob):'F.N. no disponible';const sx=sexCode(p.sex)||'—';return `${dobTxt} · ${age===null?'Edad no disponible':age+' años'} · ${sx}${p.allergies?' · Alergias: '+p.allergies:''}`}
function renderPatients(filter=''){
  const arr=state.vault.patients.filter(p=>!p.archived&&p.name.toLowerCase().includes(filter.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  const list=$('#patientList');
  if(!arr.length){const cloudEmpty=!filter&&!state.vault.patients.length&&state.cloudUser;list.innerHTML=cloudEmpty?`<div class="empty-state"><p>${state.cloudSyncState==='synced'?'No hay pacientes en esta cuenta.':'No hay pacientes en este dispositivo. La nube aún no confirmó la sincronización.'}</p><button type="button" class="btn ghost" id="retryPatientsSync">Sincronizar pacientes</button></div>`:'<div class="empty-state">No hay pacientes que coincidan. Usa “Alta paciente” para comenzar.</div>';list.querySelector('#retryPatientsSync')?.addEventListener('click',()=>runCloudSync({quiet:false}));return;}
  list.innerHTML=arr.map(p=>{
    const recent=(state.vault.emr?.encounters||[]).filter(e=>e.patientId===p.id).sort((a,b)=>String(b.occurredAt||'').localeCompare(String(a.occurredAt||'')))[0];
    return `<article class="list-item patient-list-card"><div class="avatar" aria-hidden="true">${esc(initials(p.name))}</div><div class="list-main"><button type="button" class="patient-name-link" data-record-patient="${esc(p.id)}">${esc(p.name)} <span aria-hidden="true">↗</span></button><small>${esc(patientSubtitle(p))}</small><small>${recent?`Última consulta: ${esc(displayDob(String(recent.occurredAt||'').slice(0,10)))}`:'Sin consultas registradas'}</small></div><div class="list-actions"><button type="button" data-record-patient="${esc(p.id)}">▤ <span>Ver perfil</span></button><button type="button" data-consult-patient="${esc(p.id)}">＋ <span>Nueva consulta</span></button><button type="button" data-rx-patient="${esc(p.id)}">℞ <span>Receta directa</span></button><button type="button" data-edit-patient="${esc(p.id)}">✎ <span>Editar datos</span></button></div></article>`;
  }).join('');
  list.querySelectorAll('[data-edit-patient]').forEach(b=>b.addEventListener('click',()=>openPatientDialog(b.dataset.editPatient)));
  list.querySelectorAll('[data-record-patient]').forEach(b=>b.addEventListener('click',()=>window.RxEMR?.openPatientRecord?.(b.dataset.recordPatient)));
  list.querySelectorAll('[data-consult-patient]').forEach(b=>b.addEventListener('click',()=>window.RxEMR?.openStart?.(b.dataset.consultPatient)));
  list.querySelectorAll('[data-rx-patient]').forEach(b=>b.addEventListener('click',()=>{if(window.ClinovyraPolicy?.isCommercial?.())return window.RxEMR?.openStart?.(b.dataset.rxPatient);window.RxEMR?.directPrescription?.();$('#rxPatient').value=b.dataset.rxPatient;updateSelectedPatient()}));
}
function openPatientDialog(id=null){const p=id?state.vault.patients.find(x=>x.id===id):null;$('#patientDialogTitle').textContent=p?'Editar paciente':'Alta paciente';$('#patientId').value=p?.id||'';$('#patientName').value=p?.name||'';$('#patientDob').value=p?.dob||'';$('#patientSex').value=sexCode(p?.sex)||'';$('#patientAllergies').value=p?.allergies||'';$('#patientAddress').value=p?.address||'';$('#patientPhone').value=p?.phone||'';$('#patientWeight').value=p?.weight||'';$('#patientNotes').value=p?.notes||'';updatePatientWeightField();$('#patientDialog').showModal();}
function updatePatientWeightField(){const age=ageYears($('#patientDob').value);const hint=$('#patientAgeHint');if(hint)hint.textContent=`Edad calculada automáticamente: ${age===null?'—':age+' años'}`;$('#patientWeightWrap').classList.toggle('hidden',!(age!==null&&age<18))}
async function savePatientFromForm(e){e.preventDefault();const id=$('#patientId').value||crypto.randomUUID(),existing=state.vault.patients.find(x=>x.id===id),age=ageYears($('#patientDob').value);const p={id,name:$('#patientName').value.trim(),dob:$('#patientDob').value,sex:sexCode($('#patientSex').value)||'',allergies:$('#patientAllergies').value.trim(),address:$('#patientAddress').value.trim(),phone:$('#patientPhone').value.trim(),weight:(age!==null&&age<18)?($('#patientWeight').value||''): '',notes:$('#patientNotes').value.trim(),clinical:existing?.clinical||{},archived:false,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(!p.name||!p.dob)return toast('Nombre y fecha de nacimiento son obligatorios.');if(existing)Object.assign(existing,p);else state.vault.patients.push(p);await saveVault();$('#patientDialog').close();renderAll();queueCloudSync();toast('Paciente guardado');}
function renderRxPatientOptions(){const sel=$('#rxPatient'),current=sel.value;const pts=state.vault.patients.filter(p=>!p.archived).sort((a,b)=>a.name.localeCompare(b.name));sel.innerHTML='<option value="">Seleccionar…</option>'+pts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(pts.some(p=>p.id===current))sel.value=current;updateSelectedPatient();}
function updateSelectedPatient(){const p=state.vault.patients.find(x=>x.id===$('#rxPatient').value);if(!p){$('#selectedPatientSummary').textContent='Selecciona un paciente.';$('#pediatricWeightWrap').classList.add('hidden');return;}const age=ageYears(p.dob),ped=age!==null&&age<18;$('#selectedPatientSummary').innerHTML=`<div class="patient-summary-grid"><div><span>Paciente</span><strong>${esc(p.name)}</strong></div><div><span>F. nacimiento</span><strong>${displayDob(p.dob)}</strong></div><div><span>Edad</span><strong>${age===null?'-':age+' años'}</strong></div><div><span>Sexo</span><strong>${sexCode(p.sex)||'-'}</strong></div><div class="wide"><span>Alergias</span><strong>${esc(p.allergies||'No registradas')}</strong></div>${ped&&p.weight?`<div><span>Peso</span><strong>${esc(p.weight)} kg</strong></div>`:''}</div>`;$('#pediatricWeightWrap').classList.toggle('hidden',!ped);$('#rxWeight').value=ped?(p.weight||''):'';}
function addMedication(data={}){const id=++state.medSeq,wrap=document.createElement('div');wrap.className='med-card';wrap.dataset.med=id;wrap.innerHTML=`<div class="med-head"><strong>Medicamento <span class="med-number"></span></strong><button type="button" class="delete-med" aria-label="Eliminar medicamento">×</button></div><div class="form-grid two"><label>Nombre genérico<input class="m-name" required value="${esc(data.name||'')}"></label><label>Marca opcional<input class="m-brand" value="${esc(data.brand||'')}"></label></div><div class="form-grid two"><label>Presentación / concentración<input class="m-strength" required value="${esc(data.strength||'')}"></label><label>Dosis<input class="m-dose" required value="${esc(data.dose||'')}"></label></div><div class="form-grid two"><label>Vía<select class="m-route"><option>Oral</option><option>Sublingual</option><option>IM</option><option>IV</option><option>SC</option><option>Tópica</option><option>Oftálmica</option><option>Ótica</option><option>Inhalada</option><option>Rectal</option><option>Vaginal</option><option>Otra</option></select></label><label>Frecuencia<input class="m-frequency" required value="${esc(data.frequency||'')}"></label></div><div class="form-grid two"><label>Duración<input class="m-duration" required value="${esc(data.duration||'')}"></label><label>Indicaciones específicas<input class="m-instructions" value="${esc(data.instructions||'')}"></label></div>`;wrap.querySelector('.m-route').value=data.route||'Oral';wrap.querySelector('.delete-med').addEventListener('click',()=>{if($('#medicationList').children.length<=1)return toast('Debe existir al menos un medicamento.');wrap.remove();renumberMeds()});$('#medicationList').appendChild(wrap);renumberMeds();}
function renumberMeds(){$$('#medicationList .med-card').forEach((x,i)=>x.querySelector('.med-number').textContent=i+1)}
function collectMeds(){return $$('#medicationList .med-card').map(c=>({name:c.querySelector('.m-name').value.trim(),brand:c.querySelector('.m-brand').value.trim(),strength:c.querySelector('.m-strength').value.trim(),dose:c.querySelector('.m-dose').value.trim(),route:c.querySelector('.m-route').value,frequency:c.querySelector('.m-frequency').value.trim(),duration:c.querySelector('.m-duration').value.trim(),instructions:c.querySelector('.m-instructions').value.trim()}))}
function resetRx(){ $('#rxPatient').value='';$('#rxGeneral').value='';$('#rxWeight').value='';$('#medicationList').innerHTML='';state.medSeq=0;addMedication();state.rxPad.clear();$('input[name="signatureMode"][value="profile"]').checked=true;$('#freshSignatureWrap').classList.add('hidden');updateSelectedPatient();setStatus($('#rxMsg'),'');}
function recipeId(){const d=new Date(),yy=String(d.getFullYear()).slice(2),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';const bytes=randomBytes(6);for(const b of bytes)r+=alphabet[b%alphabet.length];return `RX-${yy}${mm}${dd}-${r}`}
async function signatureImageHash(dataUrl){return b64url(await sha256Bytes(dataUrl||''))}
function canonicalPayload(recipe){return {v:1,id:recipe.id,issuedAt:recipe.issuedAt,doctor:recipe.doctor,patient:recipe.patient,medications:recipe.medications,general:recipe.general||'',signatureImageSha256:recipe.signatureImageSha256,design:recipe.design}}
function validatePrescriptionContext(patientId){
  const result=window.ClinovyraPolicy.validatePrescription({patientId,context:window.RxEMR?.prescriptionContext?.(patientId),emr:state.vault.emr});
  if(!result.ok)throw new Error(result.reason);
  return result;
}
function renderPrescriptionReview(rec){
  const patient=state.vault.patients.find(p=>p.id===rec.patient.id),allergies=state.vault.emr?.allergies||[];
  const review=window.RxEmrCore.medicationReview(patient,rec.medications,allergies);
  state.pendingReview=review;$('#rxSafetyAck').checked=false;$('#rxSafetyAckWrap').classList.toggle('hidden',!review.requiresAcknowledgement);setStatus($('#rxSafetyStatus'),'');
  const rows=review.matches.map(m=>`<strong>Coincidencia textual:</strong> ${esc(m.medication)} ↔ ${esc(m.substance)}${m.reaction?` · ${esc(m.reaction)}`:''}`).concat(review.duplicates.map(name=>`<strong>Medicamento repetido:</strong> ${esc(name)}`));
  const message=review.allergyStatus==='unknown'?'Estado de alergias no confirmado en el expediente.':'Revisa siempre alergias, interacciones, dosis y contexto clínico.';
  $('#rxSafetyReview').innerHTML=`<strong>Revisión antes de firmar</strong><p>${rows.join('<br>')||'No se encontraron coincidencias textuales con alergias activas registradas ni nombres repetidos.'}</p><small>${message} Esta revisión no es un verificador farmacológico completo.</small>`;
}
async function buildRecipeDraft(){const patient=state.vault.patients.find(p=>p.id===$('#rxPatient').value);if(!patient)throw new Error('Selecciona un paciente registrado.');validatePrescriptionContext(patient.id);const meds=collectMeds();if(!meds.length||meds.some(m=>!m.name||!m.strength||!m.dose||!m.frequency||!m.duration))throw new Error('Completa nombre, presentación, dosis, frecuencia y duración de cada medicamento.');const profile=state.vault.profile;if(!profile.name||!profile.license)throw new Error('Completa nombre y cédula en Perfil médico.');const mode=$('input[name="signatureMode"]:checked').value;const signatureImage=mode==='fresh'?state.rxPad.data():profile.signature;if(!signatureImage)throw new Error(mode==='fresh'?'Firma la receta antes de emitir.':'Guarda una firma en tu perfil o selecciona “Firmar ahora”.');const age=ageYears(patient.dob),ped=age!==null&&age<18;const theme=themes.find(t=>t.id===state.vault.settings.theme)||themes[0];const issuedAt=new Date().toISOString();const rec={id:recipeId(),issuedAt,status:'issued',doctor:{name:profile.name,role:profile.role||'Medicina General',license:profile.license,university:profile.university||'',address:profile.address||'',phone:profile.phone||'',email:profile.email||''},patient:{id:patient.id,name:patient.name,dob:patient.dob,age,sex:sexCode(patient.sex)||'',allergies:patient.allergies||'',weight:ped?($('#rxWeight').value||patient.weight||''):''},medications:meds,general:$('#rxGeneral').value.trim(),signatureImage,signatureImageSha256:await signatureImageHash(signatureImage),design:{theme:theme.id,primary:theme.primary,secondary:theme.secondary,logoStyle:state.vault.settings.logoStyle||'monogram'},seal:null,voidedAt:null,voidReason:null};return rec;}
async function issueRecipe(){const rec=state.pendingEmit;if(!rec)return;validatePrescriptionContext(rec.patient.id);const patient=state.vault.patients.find(p=>p.id===rec.patient.id),review=window.RxEmrCore.medicationReview(patient,rec.medications,state.vault.emr?.allergies||[]);if(review.requiresAcknowledgement&&!$('#rxSafetyAck').checked)return setStatus($('#rxSafetyStatus'),'Confirma que revisaste las coincidencias antes de emitir.');const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical)),priv=await crypto.subtle.importKey('jwk',state.vault.signing.privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},priv,enc.encode(canonical)));rec.seal={algorithm:'ECDSA-P256-SHA256',hash,signature:b64url(sig),publicJwk:state.vault.signing.publicJwk,keyFingerprint:state.vault.signing.keyFingerprint,canonicalVersion:1,verificationToken:null,publicToken:makePublicToken()};rec.seal.verificationToken=await makeVerificationToken(rec);state.vault.recipes.unshift(rec);await saveVault();await window.RxEMR?.onIssuedPrescription?.(rec,review);queueCloudSync();state.pendingEmit=null;state.pendingReview=null;$('#confirmDialog').close();renderAll();resetRx();navigate('history');await openRecipe(rec.id);toast('Receta emitida y sellada');}
async function verifyRecipe(rec){try{const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical));if(hash!==rec.seal?.hash)return false;const pub=await crypto.subtle.importKey('jwk',rec.seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,unb64(rec.seal.signature.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((rec.seal.signature.length+3)%4)),enc.encode(canonical));}catch{return false}}
function unb64url(s){let x=s.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return unb64(x)}
async function verifyRecipeFixed(rec){try{const canonical=JSON.stringify(canonicalPayload(rec)),hash=b64url(await sha256Bytes(canonical));if(hash!==rec.seal?.hash)return false;const pub=await crypto.subtle.importKey('jwk',rec.seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,unb64url(rec.seal.signature),enc.encode(canonical));}catch{return false}}
function verificationPacket(rec){const c=canonicalPayload(rec);return {v:3,i:c.id,t:c.issuedAt,d:[c.doctor.name,c.doctor.role,c.doctor.license,c.doctor.university,c.doctor.address,c.doctor.phone,c.doctor.email],p:[c.patient.id,c.patient.name,c.patient.dob,c.patient.age,c.patient.sex,c.patient.allergies,c.patient.weight],m:c.medications.map(x=>[x.name,x.brand,x.strength,x.dose,x.route,x.frequency,x.duration,x.instructions]),g:c.general,h:c.signatureImageSha256,e:[c.design.theme,c.design.primary,c.design.secondary],s:rec.seal.signature,k:[rec.seal.publicJwk.x,rec.seal.publicJwk.y]}}
async function makeVerificationToken(rec){const raw=enc.encode(JSON.stringify(verificationPacket(rec)));if('CompressionStream' in window){try{const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip')),compressed=new Uint8Array(await new Response(stream).arrayBuffer());if(compressed.length<raw.length)return 'z.'+b64url(compressed)}catch{}}return 'j.'+b64url(raw)}
function makePublicToken(){return b64url(randomBytes(24))}
async function ensureVerificationToken(rec){if(!rec?.seal)return;let changed=false;if(!rec.seal.verificationToken){rec.seal.verificationToken=await makeVerificationToken(rec);changed=true}if(!rec.seal.publicToken){rec.seal.publicToken=makePublicToken();changed=true}if(changed)await saveVault()}
async function ensureAllPublicTokens(){let changed=false;for(const rec of state.vault?.recipes||[]){if(rec?.seal&&!rec.seal.publicToken){rec.seal.publicToken=makePublicToken();changed=true}}if(changed)await saveVault()}
function verificationUrl(rec){const token=window.RxCloud?.configured?.()&&rec.seal?.publicToken&&rec.seal?.cloudRegistered?'t='+rec.seal.publicToken:(rec.seal?.verificationToken||'j.'+b64url(enc.encode(JSON.stringify(verificationPacket(rec)))));return window.ClinovyraRuntime.publicVerifierUrl(token)}
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
async function openRecipe(id){
  const rec=state.vault.recipes.find(r=>r.id===id);if(!rec)return;
  await ensureVerificationToken(rec);
  const ok=await verifyRecipeFixed(rec),d=$('#recipeDetail');d.classList.remove('hidden');
  d.innerHTML=`<div class="recipe-detail-card"><div class="recipe-detail-head"><div><span class="eyebrow">${esc(rec.id)}</span><h3 style="margin:5px 0">${esc(rec.patient.name)}</h3><div class="${ok?'seal-ok':'seal-void'}">${ok?'✓ Integridad local verificada':'⚠ El sello local no coincide'}</div></div><button class="icon-btn" type="button" id="closeRecipeDetail">×</button></div><div class="rx-preview-shell">${renderRxSheet(rec)}</div><div class="row-actions wrap"><button id="printRecipeBtn" class="btn primary" type="button">Imprimir / Guardar PDF</button><button id="openRecipePatientBtn" class="btn secondary" type="button">Abrir expediente del paciente</button><button id="duplicateRecipeBtn" class="btn secondary" type="button">Duplicar como nueva</button>${rec.status!=='void'?'<button id="voidRecipeBtn" class="btn danger" type="button">Anular receta</button>':''}</div><p class="micro">El QR de autenticidad abre un verificador público y muestra exactamente el contenido firmado al emitir. Si el PDF es alterado, la firma ya no coincidirá con ese contenido.</p></div>`;
  d.scrollIntoView({behavior:'smooth',block:'start'});
  $('#closeRecipeDetail').addEventListener('click',()=>d.classList.add('hidden'));
  $('#printRecipeBtn').addEventListener('click',()=>printRecipe(rec));
  $('#openRecipePatientBtn').addEventListener('click',()=>window.RxEMR?.openPatientRecord(rec.patient.id));
  $('#duplicateRecipeBtn').addEventListener('click',()=>duplicateRecipe(rec));
  $('#voidRecipeBtn')?.addEventListener('click',()=>voidRecipe(rec));
}
function manualLogoMarkup(style='monogram'){
  if(style==='crest')return '<div class="rx-logo-inner crest"><div class="rx-logo-shield">✚</div><div class="rx-logo-type"><span>Rx</span><small>CLINIC</small></div></div>';
  if(style==='minimal')return '<div class="rx-logo-inner minimal"><div class="rx-logo-mark thin">Rx</div><div class="rx-logo-type"><span>Dr</span><small>PRESCRIPTION</small></div></div>';
  return '<div class="rx-logo-inner monogram"><div class="rx-logo-mark"><span class="rx-logo-cross">✚</span></div><div class="rx-logo-type"><span>Rx</span><small>MEDICAL</small></div></div>';
}
function manualPrintTheme(){const id=state.vault?.settings?.manualPrintTheme||'burgundyGold';return manualPrintThemes.find(t=>t.id===id)||manualPrintThemes[0]}
function manualKnownFolios(){const s=new Set(state.vault?.manualFolioLedger||[]);for(const batch of (state.vault?.manualPrintLog||[])){for(const f of (batch?.folios||[]))if(f)s.add(String(f));}for(const f of (state.manualPrintFolios||[]))if(f)s.add(String(f));return s}
function manualFolio(exclude=new Set()){for(let attempt=0;attempt<30;attempt++){const r=crypto.randomUUID().replace(/-/g,'').toUpperCase();const f=`RM-${r.slice(0,8)}-${r.slice(8,16)}-${r.slice(16,24)}-${r.slice(24,32)}`;if(!exclude.has(f))return f;}throw new Error('No se pudo generar un folio único. Intenta nuevamente.')}
function clampManualCount(v){const n=Math.floor(Number(v)||2);return Math.min(100,Math.max(1,n))}
function generateManualFolios(count=state.manualPrintCount||2){count=clampManualCount(count);state.manualPrintCount=count;const used=manualKnownFolios(),out=[];while(out.length<count){const f=manualFolio(used);used.add(f);out.push(f)}state.manualPrintFolios=out;return out}
function renderManualStyleGrid(){const g=$('#manualStyleGrid');if(!g)return;const current=state.vault?.settings?.manualPrintTheme||'burgundyGold';g.innerHTML=manualPrintThemes.map(t=>`<button type="button" class="manual-style-card ${current===t.id?'active':''}" data-manual-theme="${t.id}"><span class="manual-style-swatch" style="--ms1:${t.primary};--ms2:${t.secondary};--mss:${t.soft}"></span><strong>${esc(t.name)}</strong></button>`).join('');g.querySelectorAll('[data-manual-theme]').forEach(b=>b.addEventListener('click',async()=>{state.vault.settings.manualPrintTheme=b.dataset.manualTheme;await saveVault();renderManualStyleGrid();renderManualPreview();}));}
function renderManualRxHalf(folio){
  const profile=state.vault.profile||{},theme=manualPrintTheme(),logoStyle=state.vault.settings.logoStyle||'monogram';
  const licenseQr=RxQR.svg('https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action');
  const contact=[profile.phone,profile.email].filter(Boolean).join(' · ');
  const lines=Array.from({length:6},()=>'<div class="manual-write-line"></div>').join('');
  return `<article class="manual-rx-half" style="--rxp:${esc(theme.primary)};--rxs:${esc(theme.secondary)};--rxsoft:${esc(theme.soft)}"><div class="manual-theme-band"></div><div class="manual-folio-watermark">${esc(folio)}</div><header class="manual-rx-header"><div class="rx-doc-brand"><div class="rx-logo ${esc(logoStyle)}">${manualLogoMarkup(logoStyle)}<span class="rx-logo-accent"></span></div><div class="rx-doc-copy"><div class="rx-ribbon">PRESCRIPCIÓN MÉDICA</div><h3>${esc(profile.name||'Médico')}</h3><p>${esc(profile.role||'Medicina General')}</p><p>Cédula profesional: ${esc(profile.license||'—')}${profile.university?' · '+esc(profile.university):''}</p>${profile.address?`<p>${esc(profile.address)}</p>`:''}${contact?`<p>${esc(contact)}</p>`:''}</div></div><div class="manual-rx-meta"><div class="manual-meta-title">RECETA MÉDICA</div><div class="manual-folio-chip"><small>FOLIO</small><strong>${esc(folio)}</strong></div><div class="manual-date-modern"><small>FECHA</small><div class="manual-date-box"><span></span><b>DÍA</b></div><i>/</i><div class="manual-date-box"><span></span><b>MES</b></div><i>/</i><div class="manual-date-box year"><span></span><b>AÑO</b></div></div></div></header><section class="manual-patient-box"><div class="manual-field patient"><small>PACIENTE</small><span></span></div><div class="manual-field dob"><small>F. NACIMIENTO</small><span></span></div><div class="manual-field age"><small>EDAD</small><span></span></div><div class="manual-field sex"><small>SEXO</small><span></span></div><div class="manual-field weight"><small>PESO</small><span></span></div><div class="manual-field allergies"><small>ALERGIAS</small><span></span></div><div class="manual-field vital"><small>TA</small><span></span></div><div class="manual-field vital"><small>FC</small><span></span></div><div class="manual-field vital"><small>FR</small><span></span></div><div class="manual-field vital"><small>TEMP</small><span></span></div><div class="manual-field vital"><small>SpO₂</small><span></span></div></section><section class="manual-rx-body"><div class="manual-prescription"><div class="manual-rx-title"><span class="rx-symbol">℞</span><small>INDICACIONES / PRESCRIPCIÓN</small></div>${lines}<div class="manual-microfolio">ORIGINAL · ${esc(folio)} · Documento manual numerado</div></div><aside class="manual-rx-side"><div class="manual-license-qr"><div class="manual-qr-frame">${licenseQr}</div><span>Verificar cédula profesional</span></div><div class="manual-signature"><small>FIRMA DEL MÉDICO</small><div class="manual-signature-space"></div><div class="manual-signature-rule"></div><strong>${esc(profile.name||'Firma médica')}</strong><span>Céd. Prof. ${esc(profile.license||'—')}</span><em>Folio ${esc(folio)}</em></div></aside></section></article>`;
}
function renderManualLetterPage(f1,f2=null,pageNo=1,totalPages=1){return `<section class="manual-letter-page" data-page="${pageNo}"><div class="manual-half-wrap">${renderManualRxHalf(f1)}</div><div class="manual-half-wrap ${f2?'':'manual-empty-half'}">${f2?renderManualRxHalf(f2):''}</div><div class="manual-cut-line"><span>CORTE</span></div><div class="manual-page-index">Hoja ${pageNo} de ${totalPages}</div></section>`}
function manualPagesForBatch(batch){
  const profile=state.vault.profile,theme=state.vault.settings.manualPrintTheme,logo=state.vault.settings.logoStyle;
  try{
    state.vault.profile=batch.profile||profile;
    state.vault.settings.manualPrintTheme=batch.theme||theme;
    state.vault.settings.logoStyle=batch.logoStyle||logo;
    const total=Math.ceil(batch.folios.length/2);
    return Array.from({length:total},(_,p)=>renderManualLetterPage(batch.folios[p*2],batch.folios[p*2+1]||null,p+1,total));
  }finally{state.vault.profile=profile;state.vault.settings.manualPrintTheme=theme;state.vault.settings.logoStyle=logo}
}
function renderManualLetterPages(){const folios=(state.manualPrintFolios?.length===state.manualPrintCount)?state.manualPrintFolios:generateManualFolios(state.manualPrintCount||2);const total=Math.ceil(folios.length/2);let out='';for(let p=0;p<total;p++)out+=renderManualLetterPage(folios[p*2],folios[p*2+1]||null,p+1,total);return out}
function fitManualPreview(){const el=$('#manualTemplatePreview');if(!el||!el.clientWidth)return;const scale=Math.min(.72,Math.max(.25,(el.clientWidth-28)/816));el.style.setProperty('--manual-preview-scale',String(scale));el.style.setProperty('--manual-preview-width',`${816*scale}px`);el.style.setProperty('--manual-preview-height',`${1056*scale}px`)}
function renderManualPreview(){const el=$('#manualTemplatePreview');if(el){const folios=(state.manualPrintFolios?.length===state.manualPrintCount)?state.manualPrintFolios:generateManualFolios(state.manualPrintCount||2),batch=(state.vault.manualPrintLog||[]).find(b=>b.batchId===state.manualActiveBatchId&&!b.archivedAt&&JSON.stringify(b.folios)===JSON.stringify(folios));const pages=batch?manualPagesForBatch(batch):manualPagesForBatch({folios});el.innerHTML=pages.map(html=>`<div class="manual-preview-page-shell">${html}</div>`).join('');fitManualPreview()}const q=$('#manualPrintCount');if(q)q.value=String(state.manualPrintCount||2);const summary=$('#manualBatchSummary');if(summary){const pages=Math.ceil((state.manualPrintCount||2)/2);summary.textContent=`${state.manualPrintCount||2} receta(s) · ${pages} hoja(s) carta · ${state.manualPrintFolios?.length||0} folio(s) únicos`}}
function renderManualBatchHistory(){
  const root=$('#manualBatchHistory');if(!root)return;
  const batches=(state.vault?.manualPrintLog||[]).filter(b=>!b.archivedAt).slice(-20).reverse();
  root.innerHTML=batches.length?batches.map(b=>`<div class="manual-batch-row"><div><strong>${esc(b.batchId||'Lote anterior')}</strong><small>${esc(new Date(b.createdAt).toLocaleString('es-MX'))} · ${Number(b.recipeCount)||b.folios?.length||0} recetas · folios reservados; impresión no confirmada</small></div><div class="manual-batch-actions"><button class="btn secondary small" type="button" data-reprint-batch="${esc(b.batchId||'')}">Reabrir PDF / folios</button><button class="btn ghost small" type="button" data-archive-batch="${esc(b.batchId||'')}">Quitar de la lista</button></div></div>`).join(''):'<p class="micro">Aún no hay lotes preparados.</p>';
  root.querySelectorAll('[data-reprint-batch]').forEach(button=>button.addEventListener('click',async()=>{
    const batch=(state.vault.manualPrintLog||[]).find(b=>b.batchId===button.dataset.reprintBatch);
    if(!batch?.folios?.length)return toast('No se encontraron los folios de este lote');
    state.manualPrintCount=batch.folios.length;state.manualPrintFolios=[...batch.folios];state.manualReprintBatchId=batch.batchId;state.manualActiveBatchId=batch.batchId;
    state.vault.settings.manualPrintTheme=batch.theme||'burgundyGold';renderManualStyleGrid();renderManualPreview();setManualPdfActions(false);
    await prepareManualPdf(batch);
  }));
  root.querySelectorAll('[data-archive-batch]').forEach(button=>button.addEventListener('click',async()=>{
    const batch=(state.vault.manualPrintLog||[]).find(b=>b.batchId===button.dataset.archiveBatch);if(!batch)return;
    if(!confirm(`¿Quitar ${batch.batchId} de la lista? Hazlo solo si ya imprimiste o guardaste el PDF. Sus folios seguirán reservados y no podrás reabrir este lote desde la lista.`))return;
    batch.archivedAt=new Date().toISOString();if(state.manualActiveBatchId===batch.batchId){state.manualActiveBatchId=null;state.manualPdfBlob=null;state.manualPdfToken=(state.manualPdfToken||0)+1}
    await saveVault();renderManualBatchHistory();setManualPdfActions(false);queueCloudSync();toast('Lote oculto; folios conservados en el registro.');
  }));
}
function openManualTemplate(){
  if(window.ClinovyraPolicy?.isCommercial?.())return toast('El talonario manual solo está disponible en la edición personal.');
  state.vault.settings.manualPrintTheme=state.vault.settings.manualPrintTheme||'burgundyGold';
  state.manualPrintCount=clampManualCount(state.manualPrintCount||2);
  state.manualReprintBatchId=null;state.manualActiveBatchId=null;state.manualPdfBlob=null;state.manualPdfToken=(state.manualPdfToken||0)+1;generateManualFolios(state.manualPrintCount);renderManualStyleGrid();renderManualPreview();renderManualBatchHistory();setManualPdfActions(false);$('#manualTemplateDialog').showModal();fitManualPreview();
}
function regenerateManualFolios(){state.manualReprintBatchId=null;state.manualActiveBatchId=null;state.manualPdfBlob=null;state.manualPdfToken=(state.manualPdfToken||0)+1;generateManualFolios(state.manualPrintCount||2);renderManualPreview();setManualPdfActions(false);toast(`Se generaron ${state.manualPrintFolios.length} folios nuevos`)}
function changeManualPrintCount(){const q=clampManualCount($('#manualPrintCount')?.value||2);if(q===state.manualPrintCount&&state.manualPrintFolios?.length===q)return;state.manualPrintCount=q;state.manualReprintBatchId=null;state.manualActiveBatchId=null;state.manualPdfBlob=null;state.manualPdfToken=(state.manualPdfToken||0)+1;generateManualFolios(q);renderManualPreview();setManualPdfActions(false)}
function clearManualPrintMode(){document.getElementById('manualPrintPageStyle')?.remove();$('#printArea').classList.remove('manual-print-area')}
function setManualPdfActions(ready){$('#openManualPdfBtn')?.classList.toggle('hidden',!ready);$('#shareManualPdfBtn')?.classList.toggle('hidden',!ready);$('#manualPdfStatus').textContent=ready?'PDF listo. Ábrelo para imprimir o guardar en Archivos. iOS no informa si terminó la impresión.':'Primero prepara el PDF y reserva los folios en la bóveda.'}
async function prepareManualPdf(batch){
  const token=state.manualPdfToken=(state.manualPdfToken||0)+1;
  state.manualPdfBlob=null;
  $('#manualPdfStatus').textContent='Generando el PDF con el mismo diseño de la vista previa…';
  $('#printManualTemplateBtn').disabled=true;
  try{
    const pagesHtml=manualPagesForBatch(batch);
    const blob=await window.ClinovyraManualPDF.build({pagesHtml});
    if(token!==state.manualPdfToken)return;
    state.manualPdfBlob=blob;state.manualPdfBatchId=batch.batchId;setManualPdfActions(true);
    toast('PDF preparado con el diseño original y los mismos folios.');
  }catch(err){
    if(token!==state.manualPdfToken)return;
    setManualPdfActions(false);
    $('#manualPdfStatus').textContent=`No se pudo generar el PDF: ${err.message} Los folios están reservados. Pulsa “Preparar PDF y folios” para reintentar este mismo lote.`;
  }finally{if(token===state.manualPdfToken)$('#printManualTemplateBtn').disabled=false}
}
async function printManualTemplate(){
  if(window.ClinovyraPolicy?.isCommercial?.())return toast('El talonario manual no está disponible en esta edición.');
  const count=clampManualCount($('#manualPrintCount')?.value||state.manualPrintCount||2);state.manualPrintCount=count;
  if(!state.manualPrintFolios||state.manualPrintFolios.length!==count)generateManualFolios(count);
  const folios=[...state.manualPrintFolios];
  if(state.manualActiveBatchId){const existing=(state.vault.manualPrintLog||[]).find(b=>b.batchId===state.manualActiveBatchId);if(existing&&!existing.archivedAt&&JSON.stringify(existing.folios)===JSON.stringify(folios)){if(state.manualPdfBlob&&state.manualPdfBatchId===existing.batchId){setManualPdfActions(true);return toast('Este lote ya está preparado; los folios no cambian.')}return prepareManualPdf(existing)}}
  const batchId='BATCH-'+crypto.randomUUID().slice(0,8).toUpperCase();
  const batch={batchId,folios,recipeCount:count,sheetCount:Math.ceil(count/2),createdAt:new Date().toISOString(),theme:state.vault.settings.manualPrintTheme||'burgundyGold',logoStyle:state.vault.settings.logoStyle||'monogram',status:'reserved',profile:{...state.vault.profile},reprintOf:state.manualReprintBatchId||null};
  // Reserve before exposing a printable file. A failed save cannot release a new serial.
  const oldLedger=state.vault.manualFolioLedger,oldLog=state.vault.manualPrintLog;
  state.vault.manualFolioLedger=Array.from(new Set([...(oldLedger||[]),...(oldLog||[]).flatMap(b=>b.folios||[]),...folios]));
  state.vault.manualPrintLog=[...(oldLog||[]),batch];
  try{
    await saveVault();state.manualActiveBatchId=batchId;state.manualReprintBatchId=batchId;renderManualBatchHistory();setManualPdfActions(false);queueCloudSync();await prepareManualPdf(batch);
  }catch(err){state.vault.manualFolioLedger=oldLedger;state.vault.manualPrintLog=oldLog;toast(`No se pudo guardar el lote: ${err.message}`)}
}
function activeManualPdf(){const batch=(state.vault.manualPrintLog||[]).find(b=>b.batchId===state.manualActiveBatchId&&!b.archivedAt);if(!batch||!state.manualPdfBlob||state.manualPdfBatchId!==batch.batchId)throw new Error('Prepara primero el PDF de este lote.');return {batch,blob:state.manualPdfBlob}}
function openManualPdf(){try{const {batch,blob}=activeManualPdf(),url=URL.createObjectURL(blob),win=window.open(url,'_blank');if(!win){const a=document.createElement('a');a.href=url;a.download=`Clinovyra-${batch.batchId}.pdf`;document.body.appendChild(a);a.click();a.remove();toast('iOS bloqueó la pestaña; revisa la descarga de PDF.')}else toast('PDF abierto. Usa Compartir → Imprimir o Guardar en Archivos.');setTimeout(()=>URL.revokeObjectURL(url),120000)}catch(err){toast(`No se pudo abrir el PDF: ${err.message}`)}}
async function shareManualPdf(){try{const {batch,blob}=activeManualPdf(),file=new File([blob],`Clinovyra-${batch.batchId}.pdf`,{type:'application/pdf'});if(!navigator.canShare?.({files:[file]}))return openManualPdf();await navigator.share({files:[file],title:'Talonario Clinovyra'});}catch(err){if(err.name!=='AbortError')toast(`No se pudo compartir el PDF: ${err.message}`)}}
function printRecipe(rec){clearManualPrintMode();$('#printArea').innerHTML=renderRxSheet(rec);try{Promise.resolve(window.ClinovyraPrint.print(`Clinovyra - ${rec.id}`)).catch(e=>toast(e.message))}catch(e){toast(e.message)}}
function duplicateRecipe(rec){navigate('rx');$('#rxPatient').value=rec.patient.id;updateSelectedPatient();$('#rxGeneral').value=rec.general||'';$('#medicationList').innerHTML='';state.medSeq=0;rec.medications.forEach(m=>addMedication(m));toast('Receta copiada como borrador nuevo')}
async function voidRecipe(rec){const reason=prompt('Motivo breve de anulación (opcional):','');if(reason===null)return;rec.status='void';rec.voidedAt=new Date().toISOString();rec.voidReason=reason.trim();await saveVault();renderHistory();queueCloudSync();toast('Receta anulada; el registro original se conserva')}
function renderRecoveryState(){const enabled=!!state.vault?.settings?.recovery?.enabled,button=$('#enableRecoveryBtn'),status=$('#recoveryStatus');if(button)button.textContent=enabled?'Generar nuevo código':'Configurar recuperación';if(status)status.textContent=enabled?'Recuperación cifrada activa. El código no se guarda en este dispositivo; consérvalo fuera de línea.':'Todavía no configurada. Sin el respaldo o código, una bóveda perdida no puede recuperarse.'}
function renderSettings(){const p=state.vault.profile,bio=state.meta.biometric,pending=state.pendingBiometric;$('#profileName').value=p.name||'';$('#profileRole').value=p.role||'Medicina General';$('#profileLicense').value=p.license||'';$('#profileUniversity').value=p.university||'Universidad del Valle de Mexico';$('#profileFacilityType').value=p.facilityType||'';$('#profileFacilityName').value=p.facilityName||'';$('#profileAddress').value=p.address||'Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX';$('#profilePhone').value=p.phone||'';$('#profileEmail').value=p.email||'';$('#lockTimeout').value=String(state.vault.settings.lockTimeout??5);if(p.signature&&!state.profilePad.dirty)state.profilePad.load(p.signature);$('#enableBiometricBtn').disabled=nativeBiometricUnsupported();$('#enableBiometricBtn').textContent=pending?'Completar con Face ID':bio?'Reconfigurar':'Activar';$('#testBiometricBtn')?.classList.toggle('hidden',!bio);$('#disableBiometricBtn')?.classList.toggle('hidden',!bio&&!pending);if($('#disableBiometricBtn'))$('#disableBiometricBtn').textContent=pending?'Cancelar configuración':'Desactivar biometría';$('#bioStatus').textContent=nativeBiometricUnsupported()?nativeBiometricUnavailableText():pending?'Passkey creada. Pulsa “Completar con Face ID” para finalizar desde una nueva acción.':bio?`Biometría configurada (${bio.mode==='native'?'protección del sistema':bio.mode==='largeBlob'?'modo compatible':'PRF'}). Usa “Probar desbloqueo” antes de depender de ella.`:'';updateBiometricCapabilityStatus();renderLogoGrid();renderRecoveryState();updateStorageStatus();updateCloudUI();}
async function saveProfile(e){e.preventDefault();Object.assign(state.vault.profile,{name:$('#profileName').value.trim(),role:$('#profileRole').value.trim(),license:$('#profileLicense').value.trim(),university:$('#profileUniversity').value.trim(),facilityType:$('#profileFacilityType').value.trim(),facilityName:$('#profileFacilityName').value.trim(),address:$('#profileAddress').value.trim(),phone:$('#profilePhone').value.trim(),email:$('#profileEmail').value.trim()});await saveVault();queueCloudSync();toast('Perfil médico guardado')}
async function saveProfileSignature(){const data=state.profilePad.data();if(!data)return toast('Dibuja primero tu firma.');state.vault.profile.signature=data;await saveVault();queueCloudSync();toast('Firma guardada localmente')}
async function updateStorageStatus(){const el=$('#storageStatus');try{const e=await navigator.storage?.estimate?.();const persistent=await navigator.storage?.persisted?.();if(e){const used=(e.usage/1024/1024).toFixed(1),quota=(e.quota/1024/1024).toFixed(0);el.textContent=`Uso aproximado: ${used} MB de ${quota} MB. Persistencia del navegador: ${persistent?'sí':'no/indeterminada'}.`}else el.textContent='IndexedDB cifrado en este navegador. Exporta respaldos periódicos.';}catch{el.textContent='IndexedDB cifrado en este navegador. Exporta respaldos periódicos.'}}
async function exportBackup(){const payload=await dbGet('vault','payload'),meta=JSON.parse(JSON.stringify(state.meta));meta.biometric=null;const backup={format:'rx-offline-v2-backup',createdAt:new Date().toISOString(),meta,payload};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`rx-offline-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Respaldo cifrado exportado')}
async function importBackup(file){
  const obj=JSON.parse(await file.text());
  if(obj.format!=='rx-offline-v2-backup'||!obj.meta?.salt||!obj.meta?.wrappedVaultKey?.iv||!obj.meta?.wrappedVaultKey?.data||!obj.payload?.iv||!obj.payload?.data)throw new Error('Archivo de respaldo no válido.');
  const owner=state.meta?.ownerIdHash||state.accessOwnerHash;
  if(obj.meta.ownerIdHash&&owner&&obj.meta.ownerIdHash!==owner)throw new Error('Este respaldo pertenece a otra cuenta. No se importó.');
  const pin=prompt('Escribe el PIN o contraseña del respaldo para comprobarlo antes de reemplazar esta bóveda:');
  if(pin===null)return;
  let restored,vaultKey;
  try{
    const pinKey=await derivePinKey(pin,unb64(obj.meta.salt));
    const raw=await decryptRaw(pinKey,obj.meta.wrappedVaultKey);
    vaultKey=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);
    restored=JSON.parse(dec.decode(await decryptRaw(vaultKey,obj.payload)));
  }catch{throw new Error('El PIN del respaldo es incorrecto o el archivo está dañado. No se modificó la bóveda actual.');}
  if(!restored?.signing?.privateJwk||!Array.isArray(restored.patients)||!Array.isArray(restored.recipes))throw new Error('El respaldo no contiene una bóveda válida. No se modificó la bóveda actual.');
  if(!confirm('Respaldo verificado. Esto reemplazará la bóveda local de este dispositivo. ¿Continuar?'))return;
  // An older backup must not roll back the irreversible manual folio register.
  restored.manualFolioLedger=Array.from(new Set([...(restored.manualFolioLedger||[]),...(restored.manualPrintLog||[]).flatMap(b=>b.folios||[]),...(state.vault?.manualFolioLedger||[]),...(state.vault?.manualPrintLog||[]).flatMap(b=>b.folios||[])]));
  const knownBatches=new Map([...(restored.manualPrintLog||[]),...(state.vault?.manualPrintLog||[])].filter(b=>b?.batchId).map(b=>[b.batchId,b]));
  restored.manualPrintLog=Array.from(knownBatches.values());
  const prior=state.meta?.biometric;
  const meta={...obj.meta,id:'setup',biometric:null,vaultInstanceId:b64url(randomBytes(24)),ownerIdHash:owner||null,deviceAuthorizedAt:new Date().toISOString(),version:Math.max(4,Number(obj.meta.version||0))};
  const payload={id:'payload',...await encryptRaw(vaultKey,enc.encode(JSON.stringify(restored))),updatedAt:new Date().toISOString()};
  await replaceLocalBackup(meta,payload);
  if(prior?.mode==='native')await window.ClinovyraBiometric.remove(prior.server).catch(()=>{});
  alert('Respaldo importado. La app se reiniciará; desbloquéala con el PIN del respaldo.');location.reload();
}
function bindEvents(){
  $('#accessForm')?.addEventListener('submit',submitAccess);$('#menuBtn')?.addEventListener('click',toggleNavigation);$('#dockMoreBtn')?.addEventListener('click',toggleNavigation);bindDockSwipe();$('#navBackdrop')?.addEventListener('click',closeNavigation);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNavigation()});
  $('#setupForm').addEventListener('submit',async e=>{e.preventDefault();const p=$('#setupPin').value,p2=$('#setupPin2').value;if(p.length<8)return toast('Usa al menos 8 caracteres.');if(p!==p2)return toast('Los PIN no coinciden.');try{await setupVault(p);$('#setupPin').value=$('#setupPin2').value='';await afterUnlock();toast('Bóveda creada')}catch(err){toast('No se pudo crear: '+err.message)}});
  $('#showRecoverySetupBtn')?.addEventListener('click',()=>$('#recoverySetup').classList.toggle('hidden'));$('#recoverySetup')?.addEventListener('submit',recoverCloudVault);
  $('#unlockForm').addEventListener('submit',async e=>{e.preventDefault();setStatus($('#unlockMsg'),'Desbloqueando…');try{await unlockWithPin($('#unlockPin').value);$('#unlockPin').value='';await afterUnlock();setStatus($('#unlockMsg'),'')}catch{setStatus($('#unlockMsg'),'PIN/contraseña incorrecta o bóveda dañada.')}});
  $('#biometricUnlockBtn').addEventListener('click',async()=>{setStatus($('#unlockMsg'),'Solicitando verificación del dispositivo…');try{await unlockBiometric();await afterUnlock();setStatus($('#unlockMsg'),'')}catch(err){setStatus($('#unlockMsg'),biometricError(err))}});
  $('#lockBtn').addEventListener('click',lock);$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>b.dataset.nav==='rx'?window.RxEMR?.directPrescription?.():navigate(b.dataset.nav)));
  $('#manualTemplateBtn')?.addEventListener('click',openManualTemplate);$('#quickNoteHomeBtn')?.addEventListener('click',()=>navigate('quicknote'));$('#closeManualTemplateBtn')?.addEventListener('click',()=>$('#manualTemplateDialog').close());$('#cancelManualTemplateBtn')?.addEventListener('click',()=>$('#manualTemplateDialog').close());$('#regenerateManualFoliosBtn')?.addEventListener('click',regenerateManualFolios);$('#manualPrintCount')?.addEventListener('change',changeManualPrintCount);$('#manualPrintCount')?.addEventListener('input',()=>{const n=clampManualCount($('#manualPrintCount').value);const s=$('#manualBatchSummary');if(s)s.textContent=`${n} receta(s) · ${Math.ceil(n/2)} hoja(s) carta · se generarán ${n} folios únicos`;});$('#printManualTemplateBtn')?.addEventListener('click',printManualTemplate);$('#openManualPdfBtn')?.addEventListener('click',openManualPdf);$('#shareManualPdfBtn')?.addEventListener('click',shareManualPdf);window.addEventListener('resize',()=>{if($('#manualTemplateDialog')?.open)fitManualPreview()});
  $('#newPatientBtn').addEventListener('click',()=>openPatientDialog());$('#quickPatientBtn').addEventListener('click',()=>openPatientDialog());$('#cancelPatientBtn').addEventListener('click',()=>$('#patientDialog').close());$('#patientDob').addEventListener('input',updatePatientWeightField);$('#patientForm').addEventListener('submit',savePatientFromForm);$('#patientSearch').addEventListener('input',e=>renderPatients(e.target.value));
  $('#rxPatient').addEventListener('change',updateSelectedPatient);$('#addMedBtn').addEventListener('click',()=>addMedication());$('#resetRxBtn').addEventListener('click',resetRx);$$('input[name="signatureMode"]').forEach(r=>r.addEventListener('change',()=>$('#freshSignatureWrap').classList.toggle('hidden',$('input[name="signatureMode"]:checked').value!=='fresh')));$('#clearRxSignature').addEventListener('click',()=>state.rxPad.clear());
  $('#rxForm').addEventListener('submit',async e=>{e.preventDefault();try{state.pendingEmit=await buildRecipeDraft();renderPrescriptionReview(state.pendingEmit);$('#confirmDialog').showModal();setStatus($('#rxMsg'),'')}catch(err){setStatus($('#rxMsg'),err.message)}});$('#cancelEmitBtn').addEventListener('click',()=>{state.pendingEmit=null;state.pendingReview=null;$('#confirmDialog').close()});$('#confirmEmitBtn').addEventListener('click',()=>issueRecipe().catch(err=>{toast(err.message);$('#confirmDialog').close()}));
  $('#historySearch').addEventListener('input',e=>renderHistory(e.target.value));$('#profileForm').addEventListener('submit',saveProfile);$('#clearProfileSignature').addEventListener('click',()=>state.profilePad.clear());$('#saveProfileSignature').addEventListener('click',()=>saveProfileSignature());
  $('#lockTimeout').addEventListener('change',async e=>{state.vault.settings.lockTimeout=Number(e.target.value);await saveVault();scheduleLock();toast('Bloqueo automático actualizado')});
  $('#nightModeBtn')?.addEventListener('click',()=>toggleNightMode().catch(err=>toast(err.message)));$('#showChangePinBtn')?.addEventListener('click',()=>{const form=$('#changePinForm'),open=form.classList.toggle('hidden')===false;$('#showChangePinBtn').setAttribute('aria-expanded',String(open));if(open)$('#currentVaultPin').focus();else form.reset();});$('#cancelChangePinBtn')?.addEventListener('click',()=>{$('#changePinForm').reset();$('#changePinForm').classList.add('hidden');$('#showChangePinBtn').setAttribute('aria-expanded','false');setStatus($('#changePinStatus'),'')});$('#changePinForm')?.addEventListener('submit',changeVaultPin);
  $('#enableBiometricBtn').addEventListener('click',async()=>{setStatus($('#bioStatus'),state.pendingBiometric?'Completando desde una nueva autorización de Face ID…':nativeBiometricEnabled()?'Protegiendo la llave con biometría del dispositivo…':'Creando la passkey del dispositivo…');$('#enableBiometricBtn').disabled=true;try{const result=await enableBiometric();renderSettings();if(!result.complete){setStatus($('#bioStatus'),result.message);return toast('Face ID reconocido; completa el segundo paso')}setStatus($('#bioStatus'),`Biometría configurada y comprobada (${result.mode==='native'?'protección del sistema':result.mode==='largeBlob'?'modo compatible':'PRF'}).`,true);toast('Biometría activada y verificada')}catch(err){renderSettings();setStatus($('#bioStatus'),biometricError(err))}finally{$('#enableBiometricBtn').disabled=false}});
  $('#testBiometricBtn')?.addEventListener('click',async()=>{setStatus($('#bioStatus'),'Probando acceso a la bóveda…');$('#testBiometricBtn').disabled=true;try{await unlockBiometric();setStatus($('#bioStatus'),'Prueba correcta: la credencial abrió esta bóveda.',true);toast('Desbloqueo biométrico verificado')}catch(err){setStatus($('#bioStatus'),biometricError(err))}finally{$('#testBiometricBtn').disabled=false}});$('#disableBiometricBtn')?.addEventListener('click',()=>disableBiometric().catch(err=>setStatus($('#bioStatus'),biometricError(err))));$('#lockNowBtn')?.addEventListener('click',lock);
  $('#enableRecoveryBtn')?.addEventListener('click',async()=>{setStatus($('#recoveryStatus'),'Creando paquete de recuperación E2EE…');try{await enableCloudRecovery();setStatus($('#recoveryStatus'),'Recuperación cifrada activa.',true)}catch(err){setStatus($('#recoveryStatus'),err.message)}});$('#recoverySavedCheck')?.addEventListener('change',e=>{$('#closeRecoveryCodeBtn').disabled=!e.target.checked});$('#closeRecoveryCodeBtn')?.addEventListener('click',()=>{visibleRecoveryCode='';$('#recoveryCodeValue').textContent='';$('#recoveryCodeDialog').close()});$('#copyRecoveryCodeBtn')?.addEventListener('click',async()=>{if(!visibleRecoveryCode)return;try{await copyText(visibleRecoveryCode);toast('Código copiado; guárdalo en un lugar seguro')}catch(err){toast(err.message)}});$('#downloadRecoveryCodeBtn')?.addEventListener('click',()=>{if(!visibleRecoveryCode)return;const blob=new Blob([`RX OFFLINE EMR — CÓDIGO DE RECUPERACIÓN\n\n${visibleRecoveryCode}\n\nGuárdalo fuera de línea. No lo envíes por chat ni correo.\n`],{type:'text/plain'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='rx-offline-codigo-recuperacion.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
  $('#exportBackupBtn').addEventListener('click',()=>exportBackup().catch(err=>toast(err.message)));$('#importBackupInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{await importBackup(f)}catch(err){toast(err.message)}finally{e.target.value=''}});
  $('#cloudLoginBtn')?.addEventListener('click',async()=>{const email=$('#cloudEmail').value.trim(),password=$('#cloudPassword').value;if(!email||!password)return setStatus($('#cloudSyncStatus'),'Escribe correo y contraseña.');try{setStatus($('#cloudSyncStatus'),'Iniciando sesión…');await window.RxCloud.signIn(email,password);await validateCloudAccess();$('#cloudPassword').value='';updateCloudUI();setStatus($('#cloudSyncStatus'),'Cuenta autorizada · sincronizando…',true);const synced=await runCloudSync({quiet:true});toast(synced?'Nube conectada y sincronizada':'Cuenta conectada · sincronización pendiente')}catch(err){await window.RxCloud?.signOut?.().catch(()=>{});state.cloudUser=null;updateCloudUI();setStatus($('#cloudSyncStatus'),err.message||'No se pudo iniciar sesión')}});
  $('#cloudLogoutBtn')?.addEventListener('click',async()=>{try{await window.RxCloud.signOut();state.cloudUser=null;state.cloudSyncState='pending';state.cloudSyncError='';updateCloudUI();setStatus($('#cloudSyncStatus'),'Sesión de nube cerrada.');toast('Supabase desconectado en este dispositivo')}catch(err){setStatus($('#cloudSyncStatus'),err.message)}});
  $('#cloudSyncBtn')?.addEventListener('click',()=>runCloudSync({quiet:false}));
  $('#refreshSessionsBtn')?.addEventListener('click',refreshSessions);$('#signOutOthersBtn')?.addEventListener('click',signOutOtherSessions);$('#deauthorizeDeviceBtn')?.addEventListener('click',async()=>{if(!confirm('¿Desautorizar este dispositivo? Necesitarás la cuenta Supabase y el PIN para volver a entrar. Tus datos cifrados locales no se borrarán.'))return;await deauthorizeCurrentDevice('Este dispositivo fue desautorizado correctamente. Los datos cifrados locales se conservaron.')});
  window.addEventListener('rx-cloud-auth',e=>{const next=e.detail?.user||null;if(next?.id!==state.cloudUser?.id){state.cloudSyncState='pending';state.cloudSyncError=''}state.cloudUser=next;updateCloudUI()});
  ['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{if(state.vault)scheduleLock()},{passive:true}));document.addEventListener('visibilitychange',()=>{if(document.hidden)state.hiddenAt=Date.now();else if(state.vault&&state.hiddenAt){const min=Number(state.vault.settings.lockTimeout||0);if(min>0&&Date.now()-state.hiddenAt>min*60000)lock();else scheduleLock();state.hiddenAt=null;}});
}
function initPlatformUi(){const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent),standalone=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true,native=window.ClinovyraRuntime?.nativeOrigin();document.documentElement.classList.toggle('ios-device',ios);document.documentElement.classList.toggle('ios-pwa',ios&&(standalone||native));document.documentElement.classList.toggle('native-shell',!!native)}
async function init(){
  if(!window.crypto?.subtle||!window.indexedDB){alert('Este navegador no ofrece las APIs criptográficas/almacenamiento necesarias. Usa Safari/Chrome moderno mediante HTTPS.');return;}
  initPlatformUi();applyTheme('midnightGold');state.db=await openDb();state.meta=await dbGet('meta','setup');state.profilePad=new SignaturePad($('#profileSignatureCanvas'));state.rxPad=new SignaturePad($('#rxSignatureCanvas'));bindEvents();if(!window.ClinovyraRuntime?.nativeOrigin()&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});$('#biometricUnlockBtn').classList.toggle('hidden',!state.meta?.biometric||nativeBiometricUnsupported());await resolveInitialAccess();
  window.addEventListener('online',()=>{updateCloudUI();if(state.vault&&state.cloudUser){queueCloudSync();scheduleAccessCheck()}});window.addEventListener('offline',()=>updateCloudUI());
}
init().catch(err=>{console.error(err);alert('Error al iniciar Rx Offline: '+err.message)});
})();

