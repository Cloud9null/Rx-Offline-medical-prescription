# Rx Offline — PWA Final V2.1 (local-first)

Versión web instalable (PWA) para iPhone, iPad, Android y escritorio, sin Supabase.

## Lo que ya hace

- Bóveda local cifrada AES-256-GCM.
- PIN/contraseña local.
- Face ID / Touch ID mediante WebAuthn PRF cuando el navegador/dispositivo lo soporta.
- Alta y búsqueda de pacientes.
- Edad automática por fecha de nacimiento.
- Peso oculto en adultos y disponible en pacientes <18 años.
- Recetas con múltiples medicamentos.
- Firma guardada en perfil o firma manual con dedo antes de emitir.
- Recetas emitidas inmutables; se pueden anular conservando el original.
- Firma criptográfica ECDSA P-256 + SHA-256.
- QR de cédula y QR de sello criptográfico generados offline.
- Receta media carta HORIZONTAL exacta: 8.5 × 5.5 in.
- Imprimir / Guardar PDF mediante el sistema de impresión del navegador.
- Historial local.
- 12 temas premium.
- Backup cifrado exportable e importable para cambiar de teléfono.
- Service Worker para funcionamiento offline después de instalar/cargar la app.

## Importante sobre privacidad

Los datos clínicos se guardan en IndexedDB cifrado dentro del navegador del dispositivo. Esta versión no sincroniza pacientes ni recetas con ningún servidor. No habilites Analytics en Vercel si quieres minimizar telemetría.

El backup exportado permanece cifrado con la misma bóveda. Para restaurarlo necesitas el PIN/contraseña con el que fue creado.

## Cómo ponerla en iPhone sin Xcode

### Opción recomendada: GitHub + Vercel

1. Crea un repositorio PRIVADO nuevo en GitHub.
2. Descomprime este ZIP y sube el CONTENIDO de la carpeta `rx_pwa_v2` al repositorio.
3. En Vercel: Add New > Project > importa ese repositorio.
4. Framework Preset: `Other` (normalmente Vercel lo detecta como sitio estático).
5. No necesita Build Command.
6. Deploy.
7. Abre la URL HTTPS de Vercel en Safari del iPhone.
8. Safari > Compartir > Añadir a pantalla de inicio / Add to Home Screen.
9. Ábrela desde el icono como web app.

## Primer uso

1. Crea un PIN/contraseña local de al menos 8 caracteres.
2. Ajustes > Perfil médico: llena tus datos.
3. Ajustes > Firma del perfil: firma con el dedo y guarda.
4. Ajustes > Tema premium: elige el diseño.
5. Da de alta un paciente.
6. Nueva receta > selecciona paciente > llena medicamentos > emite.
7. Historial > abre receta > Imprimir / Guardar PDF.
8. Ajustes > Respaldos > exporta un backup cifrado.

## Face ID / Touch ID

Actívalo solo después de que la URL/dominio definitivo esté decidido. Las credenciales WebAuthn están ligadas al dominio. Si cambias de `proyecto.vercel.app` a otro dominio, tendrás que configurarlo de nuevo.

Si WebAuthn PRF no está disponible en el navegador/dispositivo, la app conserva siempre el desbloqueo por PIN.

## iPhone: guardar/enviar PDF

En la receta usa **Imprimir / Guardar PDF**. iOS abre el flujo de impresión; desde la vista previa puedes abrir/expandir el documento y usar Compartir para guardarlo en Archivos o enviarlo. Esta V2 no depende de un servidor para crear la receta.

## Multi-dispositivo sin Supabase

No existe sincronización automática. Para mover información:

- Teléfono A > Ajustes > Exportar respaldo.
- Guarda el `.json` cifrado de forma segura.
- Teléfono B > instala la misma PWA > Importar respaldo.
- Desbloquea con el PIN original.

Cuando se agregue Supabase, la capa de sincronización puede añadirse sin eliminar este modo local-first.

## Estructura

- `index.html` — interfaz.
- `styles.css` — diseño responsive + receta media carta horizontal.
- `app.js` — cifrado, pacientes, recetas, firma, biometría, backups.
- `qr.js` — generador QR offline.
- `sw.js` — caché offline PWA.
- `manifest.webmanifest` — instalación en Home Screen.
- `vercel.json` — cabeceras de seguridad/CSP.
- `icons/` — iconos PWA.

## Limitación del sello criptográfico V2

La app verifica internamente que el contenido guardado coincide con el contenido firmado. El QR contiene el hash, firma y clave pública para permitir un verificador futuro. Sin un registro público/backend que ancle la clave pública al médico, el QR por sí solo no demuestra a un tercero la identidad legal del firmante. Esa capa se puede añadir después con un verificador estático/servidor y, posteriormente, Supabase.
