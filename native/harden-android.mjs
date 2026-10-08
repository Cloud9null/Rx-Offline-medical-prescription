import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const manifest=join(root,'android/app/src/main/AndroidManifest.xml');
let source=await readFile(manifest,'utf8');
if(!/<application\b/.test(source))throw new Error('No se encontró el elemento application de Android.');
source=source.replace(/\sandroid:allowBackup="[^"]*"/g,'');
source=source.replace(/<application\b/, '<application android:allowBackup="false"');
await writeFile(manifest,source);
console.log('Android: respaldo del almacenamiento clínico local desactivado.');
