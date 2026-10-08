# Clinovyra en Android, iPhone y Windows

La aplicación mantiene el mismo modelo clínico, la bóveda local y el proyecto Supabase existente. Las apps instaladas tienen **almacenamiento local propio**. Para recuperar expedientes en un dispositivo nuevo, primero autoriza la misma cuenta Supabase, después recupera la llave de la bóveda con tu código de recuperación y define un PIN local. Conserva ese código fuera del equipo. No desinstales ni borres datos de la PWA antes de comprobar la restauración.

## Qué se entrega

| Plataforma | Proyecto | Salida de prueba | Condición para distribución habitual |
|---|---|---|---|
| Android | Capacitor 8, `native/android` generado | APK de depuración | Keystore privada, build release y pruebas físicas |
| iPhone/iPad | Capacitor 8, `native/ios` generado | Proyecto Xcode | Mac, Xcode, Apple Developer, firma y perfil de aprovisionamiento para IPA/TestFlight |
| Windows | Electron, protocolo local seguro `app://clinovyra.local` | EXE NSIS/portable sin firma | Certificado Authenticode, revisión SmartScreen y pruebas Windows |
| Web/PWA | Vercel | URL existente | Sigue siendo opción de acceso; este cambio no publica producción automáticamente |

`native/www` se genera desde la raíz y se excluye de git. No contiene secretos ni una copia de la base. La API opcional de IA se invoca sobre HTTPS contra la función Vercel existente con Supabase Auth. Los QR emitidos desde una app nativa apuntan al verificador público HTTPS, no a `localhost`.

El proyecto Android generado desactiva `android:allowBackup` para evitar que el respaldo general del teléfono copie el almacenamiento clínico local. Al reconstruir o sincronizar Android se aplica de nuevo esta configuración. La recuperación deliberada del EMR usa el sobre cifrado y el código de recuperación. No confundas el APK de depuración o el EXE sin firma con una versión clínica lista para distribuir.

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

Si el proyecto nativo ya existe, usa `npm run android:sync` o `npm run ios:sync` tras editar la web. La acción `Clinovyra native test builds` se ejecuta **solo manualmente** y genera APK de depuración y EXE sin firma; no publica tiendas ni producción. No ejecutes artefactos de CI con datos reales hasta completar las pruebas de seguridad del dispositivo.

## Verificación obligatoria por dispositivo

1. Autoriza la cuenta y restaura una bóveda nueva con el código de recuperación. Confirma paciente, notas, documentos cifrados y recetas en dos dispositivos; prueba desconexión, edición local y resolución de conflicto al reconectar.
2. Emite una receta sintética offline y escanea su QR desde otro dispositivo con internet. Verifica firma y estado en el sitio público.
3. Bloquea, desbloquea con PIN y prueba biometría **en la plataforma concreta**. WebAuthn/passkeys están asociados al origen web; `capacitor://`, `https://localhost` y `app://` son otros orígenes. La biometría web no se promete en la app nativa y el PIN continúa siendo el medio de acceso local. Para biometría nativa real haría falta un módulo de almacenamiento protegido y una migración de llaves auditada.
   La PWA y cada app instalada tienen credenciales y almacenamiento distintos. No borres la PWA para instalar la app; recupera la bóveda en la app y verifica que los datos coincidan antes de migrar tu flujo diario.
4. Comprueba IA externa bajo sesión autorizada, impresión/descarga de notas y recetas, permisos, revocación de sesiones y cierre de la app. La IA local sigue disponible offline.
5. Para iOS revisa la política de privacidad, permisos y comportamiento WebKit en hardware. Un IPA instalable requiere firma de Apple; un entorno Linux no lo produce.

Los metadatos clínicos de Supabase usan Auth/RLS, **no cifrado de extremo a extremo por campo**. La bóveda y documentos sincronizados sí están cifrados en cliente según los módulos actuales. Mantén copia del código de recuperación y respaldo verificado.
