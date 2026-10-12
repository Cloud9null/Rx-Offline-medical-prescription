import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const plist=join(root,'ios/App/App/Info.plist');
let source=await readFile(plist,'utf8');
if(!source.includes('NSFaceIDUsageDescription'))source=source.replace('</dict>','\t<key>NSFaceIDUsageDescription</key>\n\t<string>Desbloquear la bóveda clínica cifrada con Face ID.</string>\n</dict>');
await writeFile(plist,source);
console.log('iOS: motivo de Face ID declarado.');
