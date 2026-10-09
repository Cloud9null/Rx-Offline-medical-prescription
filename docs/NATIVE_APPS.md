# Clinovyra en Android, iPhone y Windows

La aplicación mantiene el mismo modelo clínico, la bóveda local y el proyecto Supabase existente. Las apps instaladas tienen **almacenamiento local propio**. Para recuperar expedientes en un dispositivo nuevo, primero autoriza la misma cuenta Supabase, después recupera la llave de la bóveda con tu código de recuperación y define un PIN local. Conserva ese código fuera del equipo. No desinstales ni borres datos de la PWA antes de comprobar la restauración.

## Qué se entrega

| Plataforma | Proyecto | Salida de prueba | Condición para distribución habitual |
|---|---|---|---|
| Android | Capacitor 8, `native/android` generado | APK de depuración | Keystore privada, build release y pruebas físicas |
| iPhone/iPad | Capacitor 8, `native/ios` generado | Proyecto Xcode y compilación de simulador en CI | Mac, Xcode, Apple Developer, firma y perfil de aprovisionamiento para IPA/TestFlight |
| Windows | Electron, protocolo local seguro `app://clinovyra.local` | EXE NSIS/portable sin firma | Certificado Authenticode, revisión SmartScreen y pruebas Windows |
| Web/PWA | Vercel | Preview HTTPS del PR para pruebas inmediatas | Producción tras revisión de seguridad y flujo clínico |

`native/www` se genera desde la raíz y se excluye de git. No contiene secretos ni una copia de la base. La interfaz de las apps instaladas está empaquetada localmente; no carga Vercel para mostrar cada pantalla. Supabase autentica y sincroniza los datos; Cloudflare no almacena los expedientes en esta arquitectura. La API opcional de IA se invoca sobre HTTPS contra la función Vercel existente con Supabase Auth. Los QR emitidos desde una app nativa apuntan al verificador público HTTPS, no a `localhost`.

El proyecto Android generado desactiva `android:allowBackup` y activa `FLAG_SECURE` para dificultar capturas y grabaciones de pantalla. Windows activa la protección de contenido de Electron. En iOS se declara el uso de Face ID. Estas barreras protegen capturas ordinarias, pero no pueden impedir que un usuario con acceso al binario público o a un documento exportado lo copie, fotografíe o suba a un servicio de IA. No hay secretos privados ni expedientes empaquetados en la app; los respaldos se exportan cifrados. La recuperación deliberada del EMR usa el sobre cifrado y el código de recuperación. No confundas el APK de depuración o el EXE sin firma con una versión clínica lista para distribuir.

## Construir

Con Node 22 y las herramientas de la plataforma:

```bash
cd native
npm ci
npm run android:init
cd android && ./gradlew assembleDebug
```

En macOS con Xcode, desde `native`:

```bash
npm run ios:init
npm run ios:open
```

En Windows, desde `native`:

```powershell
npm ci
npm run desktop:win
```

Si el proyecto nativo ya existe, usa `npm run android:sync` o `npm run ios:sync` tras editar la web. La acción `Clinovyra native test builds` corre en el PR y manualmente; genera APK de depuración, EXE sin firma y comprueba la compilación de iOS para simulador. No genera IPA instalable ni publica tiendas o producción. No ejecutes artefactos de CI con datos reales hasta completar las pruebas de seguridad del dispositivo.

## Verificación obligatoria por dispositivo

1. Autoriza la cuenta y restaura una bóveda nueva con el código de recuperación. Confirma paciente, notas, documentos cifrados y recetas en dos dispositivos; prueba desconexión, edición local y resolución de conflicto al reconectar.
2. Emite una receta sintética offline y escanea su QR desde otro dispositivo con internet. Verifica firma y estado en el sitio público.
3. Bloquea, desbloquea con PIN y prueba biometría **en la plataforma concreta**. Android/iOS usan `@capgo/capacitor-native-biometric` 8.8.1 con almacenamiento de llave protegido por biometría actual; Android pide una operación criptográfica nueva por lectura. Un cambio de huellas o Face ID invalida esa credencial; el PIN permite entrar y reconfigurarla. La web usa passkey WebAuthn PRF/largeBlob donde esté disponible, incluido Windows Hello en un navegador compatible. El EXE usa contraseña local y no ofrece todavía Windows Hello dentro del ejecutable. WebAuthn/passkeys pertenecen al origen HTTPS web; `capacitor://`, `https://localhost` y `app://` tienen almacenamiento separado.
   La PWA y cada app instalada tienen credenciales y almacenamiento distintos. No borres la PWA para instalar la app; recupera la bóveda en la app y verifica que los datos coincidan antes de migrar tu flujo diario.
4. Comprueba IA externa bajo sesión autorizada, impresión/descarga de notas y recetas, permisos, revocación de sesiones y cierre de la app. La IA local sigue disponible offline. Android e iOS integran `@capgo/capacitor-printer` 8.1.2 para abrir la impresión del sistema desde la WebView. Prueba físicamente el tamaño carta, dos medias cartas, cortes, colores y la cantidad de páginas. El historial registra la **solicitud** de impresión, no confirma que la impresora haya producido papel. Los lotes recientes permiten repetir los mismos folios; el historial completo permanece en la bóveda.
5. Para iOS revisa la política de privacidad, permisos y comportamiento WebKit en hardware. Un IPA instalable requiere firma de Apple; un entorno Linux no lo produce.

Los metadatos clínicos de Supabase usan Auth/RLS, **no cifrado de extremo a extremo por campo**. La bóveda y documentos sincronizados sí están cifrados en cliente según los módulos actuales. Mantén copia del código de recuperación y respaldo verificado.
