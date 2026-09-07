# Rx Offline EMR — V3 preview

Rama incremental que integra expediente clínico local-first con el sistema Rx Offline existente. No reemplaza el motor criptográfico ni cambia el contenido canónico de recetas históricas.

## Novedades V3

- Dos flujos independientes: **Nueva consulta** y **Receta directa**.
- Expediente longitudinal por paciente con consultas, notas y recetas vinculadas.
- Nota de primera vez, evolución y referencia/interconsulta.
- Antecedentes, alergias estructuradas, signos vitales, IMC, exploración, diagnósticos, órdenes/resultados, plan, tratamiento, pronóstico, alarmas y seguimiento.
- Borradores con guardado automático dentro de la bóveda AES-GCM existente.
- Finalización con snapshot canónico, SHA-256, firma ECDSA P-256, autor y timestamp.
- Addenda firmados; una nota finalizada no se edita silenciosamente.
- Adjuntos PDF/JPEG/PNG de hasta 3 MB cifrados dentro de la bóveda local (sin upload cloud en esta fase).
- Relación consulta-receta fuera del payload firmado: una consulta puede tener varias recetas y una receta directa no requiere consulta.
- Migración Supabase aditiva con RLS y sincronización `SECURITY INVOKER`.
- Cola persistente, backoff, detección de conflicto de notas finales y protección ante una bóveda nueva vacía.

## Desarrollo y pruebas

```bash
npm ci
npm test
npm run test:e2e
```

Los E2E usan exclusivamente datos sintéticos. Revisa [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) antes de aplicar la migración o crear un preview.

## Estado del backend compartido

Las cuatro migraciones aditivas de `supabase/migrations/` ya fueron aplicadas al proyecto existente **Expediente Medico v1** con autorización del propietario. No se creó una rama ni otro proyecto Supabase, por lo que esta integración no añade el costo horario de una rama. Las recetas, verificaciones y funciones históricas no fueron reemplazadas.

La interfaz V3 continúa únicamente en `feat/emr-integrado-v3` y en Preview de Vercel. `main` y el deployment web de producción no se promueven sin aprobación explícita.

## Límites importantes

- Esto no constituye certificación NOM-024, homologación ni asesoría jurídica.
- El cifrado fuerte cubre la bóveda local. Los datos sincronizados actuales se almacenan en Supabase protegidos por Auth/RLS, pero **no** son E2EE por campo.
- La sesión Supabase histórica continúa en `localStorage` por compatibilidad; su migración a almacenamiento protegido requiere un release específico para no cerrar sesiones ni romper recuperación.
- Los documentos permanecen locales hasta implementar almacenamiento cifrado de adjuntos y pruebas de restauración.

---

# Documentación heredada: Rx Offline — PWA Final V2.1

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
