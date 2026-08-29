(function(){
'use strict';
const $=s=>document.querySelector(s);
const enc=new TextEncoder();
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function b64ToBytes(s){const x=atob(s),a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return a}
function unb64url(s){let x=s.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return b64ToBytes(x)}
function bytesToB64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fmtDateTime(iso){try{return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return iso}}
async function sha256Bytes(data){return new Uint8Array(await crypto.subtle.digest('SHA-256',data instanceof Uint8Array?data:enc.encode(data)))}
async function verifyPacket(packet){
  if(!packet?.canonical||!packet?.seal?.publicJwk||!packet?.seal?.signature||!packet?.seal?.hash)throw new Error('El enlace no contiene un paquete de verificación válido.');
  const canonical=JSON.stringify(packet.canonical);
  const calcHash=bytesToB64url(await sha256Bytes(canonical));
  const hashOk=calcHash===packet.seal.hash;
  if(!hashOk)return {ok:false,hashOk:false,calcHash,signatureOk:false};
  const pub=await crypto.subtle.importKey('jwk',packet.seal.publicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const signatureOk=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,unb64url(packet.seal.signature),enc.encode(canonical));
  return {ok:hashOk&&signatureOk,hashOk,calcHash,signatureOk};
}
function showStatus(kind,title,detail){const box=$('#statusBox');box.className='status '+kind;box.textContent=title;$('#statusDetail').textContent=detail}
function showCards(){['#summaryCard','#rxCard','#techCard'].forEach(id=>$(id).style.display='block')}
function medHtml(m,i){return `<div class="med"><strong>${i+1}. ${esc(m.name)}${m.brand?' ('+esc(m.brand)+')':''} · ${esc(m.strength)}</strong><div>${esc(m.dose)} · Vía ${esc(m.route)} · ${esc(m.frequency)} · ${esc(m.duration)}</div>${m.instructions?`<div class="muted" style="margin-top:4px">${esc(m.instructions)}</div>`:''}</div>`}
async function init(){
  try{
    const raw=location.hash.slice(1);
    if(!raw)throw new Error('Este QR no contiene datos de verificación.');
    const packet=JSON.parse(new TextDecoder().decode(unb64url(raw)));
    const result=await verifyPacket(packet);
    const c=packet.canonical;
    showCards();
    $('#vId').textContent=packet.id||c.id||'—';
    $('#vIssuedAt').textContent=fmtDateTime(packet.issuedAt||c.issuedAt||'');
    $('#vDoctor').textContent=c.doctor?.name||'—';
    $('#vLicense').textContent=c.doctor?.license||'—';
    $('#vPatient').textContent=c.patient?.name||'—';
    $('#vState').textContent=packet.status==='void'?'Receta anulada':(result.ok?'Receta vigente':'No válida');
    $('#vMeds').innerHTML=(c.medications||[]).map(medHtml).join('') || '<p class="muted">Sin medicamentos.</p>';
    $('#vGeneral').textContent=c.general||'Sin indicaciones adicionales.';
    $('#vAlgo').textContent=packet.seal.algorithm||'—';
    $('#vFp').textContent=packet.seal.keyFingerprint||'—';
    $('#vHash').textContent=packet.seal.hash||'—';
    if(packet.status==='void')showStatus('warn','Receta auténtica, pero anulada','La firma digital es válida; sin embargo, el emisor marcó posteriormente esta receta como anulada.');
    else if(result.ok)showStatus('ok','✓ Receta auténtica','La firma digital y el contenido prescrito coinciden con la receta emitida originalmente.');
    else showStatus('bad','✕ Verificación fallida','La firma digital no corresponde al contenido recibido. La receta pudo haber sido alterada o el enlace es inválido.');
  }catch(err){
    showStatus('bad','✕ No se pudo verificar',''+err.message);
  }
}
init();
})();
