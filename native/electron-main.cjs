'use strict';
const {app,BrowserWindow,protocol,shell}=require('electron');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

const HOST='clinovyra.local';
const ORIGIN=`app://${HOST}`;
const ROOT=path.resolve(__dirname,'www');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg'};
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://rx-offline-medical-prescription.vercel.app; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'";
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);

function externalAllowed(raw){try{const u=new URL(raw);return u.protocol==='https:'&&(['rx-offline-medical-prescription.vercel.app','www.gob.mx','www.cedulaprofesional.sep.gob.mx'].includes(u.hostname))}catch{return false}}
async function localResponse(request){
  const url=new URL(request.url);
  if(url.hostname!==HOST)return new Response('Forbidden',{status:403});
  let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{return new Response('Bad request',{status:400})}
  if(pathname.includes('\\')||pathname.split('/').includes('..'))return new Response('Forbidden',{status:403});
  const filepath=path.resolve(ROOT,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filepath.startsWith(ROOT+path.sep))return new Response('Forbidden',{status:403});
  try{
    const body=await readFile(filepath);
    return new Response(body,{headers:{'Content-Type':MIME[path.extname(filepath)]||'application/octet-stream','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  }catch{return new Response('Not found',{status:404})}
}

async function start(){
  protocol.handle('app',localResponse);
  const win=new BrowserWindow({width:1320,height:880,minWidth:390,minHeight:640,backgroundColor:'#f1f7fb',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:!app.isPackaged}});
  win.webContents.setWindowOpenHandler(({url})=>{if(externalAllowed(url))shell.openExternal(url);return {action:'deny'}});
  win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/')){event.preventDefault();if(externalAllowed(url))shell.openExternal(url)}});
  win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  await win.loadURL(`${ORIGIN}/index.html`);
}
app.whenReady().then(start);
app.on('window-all-closed',()=>app.quit());
