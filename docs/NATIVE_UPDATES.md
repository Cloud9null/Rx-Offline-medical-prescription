# Actualizaciones instaladas de Clinovyra

Clinovyra empaqueta su interfaz y sus recursos dentro del APK, IPA y EXE. Android e iOS usan Capacitor y componentes nativos para impresión y biometría; la interfaz sigue siendo HTML/CSS/JavaScript en una WebView local. Windows usa Electron con el protocolo local `app://clinovyra.local`. La PWA de Vercel es independiente y mantiene otra bóveda y otra sesión. La sincronización y la IA externa sí requieren red.

## Android

El identificador es `com.clinovyra.emr`. Una actualización encima de la instalación anterior exige el **mismo certificado de firma** y un `versionCode` mayor o igual. El primer APK de Clinovyra 3.6.0 se generó con la clave de depuración temporal del runner de GitHub. Un APK release con otra clave no puede actualizarlo. Antes de desinstalarlo, exporta un respaldo cifrado, verifica la recuperación de Supabase y conserva el código de recuperación. La primera transición a la firma permanente exige reinstalar una vez; las siguientes versiones firmadas con esa misma clave podrán actualizar encima y conservarán la bóveda local. No borres la app antes de comprobar la recuperación.

Neo QBank ya usa una clave privada permanente en GitHub Actions. Clinovyra requiere una **clave propia**. Genera un PKCS12 privado con alias `clinovyra-emr`, guárdalo con copias de respaldo fuera del repositorio y configura estos secretos de GitHub Actions en este repositorio:

- `CLINOVYRA_ANDROID_KEY_B64`: contenido binario del `.p12` codificado en base64, sin saltos de línea.
- `CLINOVYRA_ANDROID_KEY_PASSWORD`: contraseña de la clave y del almacén.
- `CLINOVYRA_ANDROID_CERT_SHA256`: huella SHA-256 del certificado (puede llevar `:`).

Por ejemplo, `keytool -genkeypair -storetype PKCS12 -keystore clinovyra-emr.p12 -alias clinovyra-emr -keyalg RSA -keysize 3072 -validity 10000` crea la clave una sola vez. `keytool -list -v -storetype PKCS12 -keystore clinovyra-emr.p12 -alias clinovyra-emr` muestra la huella. `base64 -w 0 clinovyra-emr.p12` genera el valor para el secreto en Linux (`base64 < clinovyra-emr.p12 | tr -d '\n'` en macOS). Nunca publiques el `.p12` ni la contraseña en el repositorio o un issue.

El workflow `Clinovyra installable builds` falla si faltan estos secretos, comprueba la huella antes de compilar, produce `app-release.apk` y verifica la firma del APK. Mantén la misma clave en cada versión y aumenta `versionCode`; no uses la clave de Neo QBank.

## iPhone y iPad

El bundle ID es `com.clinovyra.emr`. El IPA del workflow contiene la aplicación local, pero está **sin firma de Apple**. AltStore o Sideloadly firman al instalar con tu Apple ID; usa el mismo método/cuenta y bundle ID para intentar la actualización encima. iOS puede exigir renovar el aprovisionamiento. Para una IPA firmada y distribuible directamente se necesitan certificado/perfil de Apple para ese identificador y el dispositivo o TestFlight; no se pueden crear legítimamente desde este repositorio sin las credenciales de Apple. Verifica en el iPhone que la siguiente instalación conserve la bóveda antes de depender de ella.

## Windows

Usa el instalador NSIS `Clinovyra EMR Setup`, con `appId` estable `com.clinovyra.emr`; instala nuevas versiones sobre el mismo destino. El EXE portable se ejecuta sin instalación y no se actualiza automáticamente. Ambos cargan archivos empaquetados localmente. El EXE no tiene certificado Authenticode: Windows puede mostrar SmartScreen, aunque eso es distinto a la identidad de la instalación. La bóveda de Windows está separada de la PWA y del móvil.

Prueba siempre una actualización con datos sintéticos y un respaldo cifrado verificado. Un cambio del certificado Android, bundle ID iOS o identificador Windows rompe la continuidad, por lo que estos valores deben quedar fijos.
