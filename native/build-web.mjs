import {cp,copyFile,mkdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const base=resolve(fileURLToPath(new URL('..',import.meta.url)));
const out=join(base,'native','www');
const nativeAssets=join(base,'native','assets');
const files=['index.html','verify.html','styles.css','emr.css','app.js','runtime.js','native-print.js','native-biometric.js','emr-core.js','emr.js','cloud.js','secure-sync.js','clinical-assistant.js','quick-note.js','supabase-config.js','qr.js','verify.js','manifest.webmanifest'];
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of files)await copyFile(join(base,name),join(out,name));
await cp(join(base,'icons'),join(out,'icons'),{recursive:true});
await cp(join(base,'assets'),join(out,'assets'),{recursive:true});
await mkdir(nativeAssets,{recursive:true});
await copyFile(join(base,'icons','clinovyra.png'),join(nativeAssets,'logo.png'));
console.log(`Clinovyra native bundle: ${files.length} files plus brand assets`);
