import {cp,copyFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const base=resolve(fileURLToPath(new URL('..',import.meta.url)));
const out=join(base,'native','www');
const nativeAssets=join(base,'native','assets');
const files=['index.html','verify.html','styles.css','emr.css','app.js','runtime.js','product-policy.js','native-print.js','native-biometric.js','emr-core.js','emr.js','cloud.js','secure-sync.js','clinical-assistant.js','quick-note.js','supabase-config.js','qr.js','manual-pdf.js','icd10-mx-inegi-2025.json','verify.js','manifest.webmanifest'];
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of files)await copyFile(join(base,name),join(out,name));
// The injected native bridge does not expose registerPlugin by itself. Bundle the
// matching Capacitor JS runtime before our native print and biometric adapters.
const nativeIndex=join(out,'index.html');
const html=await readFile(nativeIndex,'utf8');
const insertion='<script src="capacitor-core.js"></script>\n  <script src="runtime.js"></script>';
if(!html.includes('<script src="runtime.js"></script>'))throw new Error('Native entry point changed: cannot install Capacitor JS bridge.');
await writeFile(nativeIndex,html.replace('<script src="runtime.js"></script>',insertion));
await copyFile(join(base,'native','node_modules','@capacitor','core','dist','capacitor.js'),join(out,'capacitor-core.js'));
await cp(join(base,'icons'),join(out,'icons'),{recursive:true});
await cp(join(base,'assets'),join(out,'assets'),{recursive:true});
await mkdir(nativeAssets,{recursive:true});
await copyFile(join(base,'icons','medivorix.png'),join(nativeAssets,'logo.png'));
console.log(`Medivorix native bundle: ${files.length} files, Capacitor JS bridge and brand assets`);
