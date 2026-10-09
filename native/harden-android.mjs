import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const manifest=join(root,'android/app/src/main/AndroidManifest.xml');
const activity=join(root,'android/app/src/main/java/com/clinovyra/emr/MainActivity.java');
let source=await readFile(manifest,'utf8');
if(!/<application\b/.test(source))throw new Error('No se encontró el elemento application de Android.');
source=source.replace(/\sandroid:allowBackup="[^"]*"/g,'');
source=source.replace(/<application\b/, '<application android:allowBackup="false"');
if(!source.includes('android.permission.USE_BIOMETRIC'))source=source.replace(/<application\b/,'<uses-permission android:name="android.permission.USE_BIOMETRIC" />\n    <application');
await writeFile(manifest,source);
let java=await readFile(activity,'utf8');
if(!java.includes('FLAG_SECURE'))java=java.replace('public class MainActivity extends BridgeActivity {','public class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(android.os.Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE, android.view.WindowManager.LayoutParams.FLAG_SECURE);\n  }');
if(!java.includes('FLAG_SECURE'))throw new Error('No se pudo activar FLAG_SECURE para proteger capturas Android.');
await writeFile(activity,java);
console.log('Android: respaldo local desactivado, permiso biométrico y protección de capturas activados.');
