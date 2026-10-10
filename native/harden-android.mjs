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
const gradle=join(root,'android/app/build.gradle');
let config=await readFile(gradle,'utf8');
if(!/versionCode\s+\d+/.test(config)||!/versionName\s+"[^"]+"/.test(config))throw new Error('No se encontró la versión nativa de Android.');
config=config.replace(/versionCode\s+\d+/,'versionCode 360').replace(/versionName\s+"[^"]+"/,'versionName "3.6.0"');
// La firma de release se inyecta desde secretos del entorno en cada compilación.
// No se genera una clave nueva en CI: perderla impediría actualizar la app instalada.
const signing=`    signingConfigs {
        clinovyraRelease {
            if (System.getenv('CLINOVYRA_KEYSTORE_PATH')) {
                storeFile file(System.getenv('CLINOVYRA_KEYSTORE_PATH'))
                storePassword System.getenv('CLINOVYRA_KEY_PASSWORD')
                keyAlias 'clinovyra-emr'
                keyPassword System.getenv('CLINOVYRA_KEY_PASSWORD')
            }
        }
    }
`;
if(!config.includes('clinovyraRelease')){
  if(!/^\s*buildTypes\s*\{/m.test(config)||!/release\s*\{/.test(config))throw new Error('No se encontró buildTypes.release de Android.');
  config=config.replace(/^(\s*)buildTypes\s*\{/m,(_match,indent)=>signing+indent+'buildTypes {');
  config=config.replace(/(release\s*\{)/,`$1\n            if (System.getenv('CLINOVYRA_KEYSTORE_PATH')) signingConfig signingConfigs.clinovyraRelease`);
}
await writeFile(gradle,config);
console.log('Android 3.6.0 (360): release con firma persistente, respaldo local desactivado, biometría y protección de capturas activadas.');
