# Arquitectura V3.1

## Capas

1. `app.js`: bóveda, Rx, impresión, firma histórica, biometría, backup y recuperación.
2. `emr-core.js`: modelo, edad a fecha de atención, IMC, validación, canonicalización y merge.
3. `emr.js`: UI clínica, autosave, finalización, addenda, documentos, asistente y timeline.
4. `clinical-assistant.js`: estructuración local, payload minimizado y texto plano.
5. `secure-sync.js`: E2EE de documentos, sobre de recuperación y paquete privado.
6. `cloud.js`: Auth/REST/RPC, Storage privado, bootstrap, cola/backoff y conflictos.
7. `api/clinical-note.js`: proxy autenticado para IA opcional; el secreto nunca llega al cliente.
8. Supabase: tablas owner-scoped, RPC `SECURITY INVOKER`, sobres y bucket privado.
9. `product-policy.js`: edición personal activa y contrato comprobable de nota final previa a receta para una futura edición comercial. No sustituye una validación transaccional de backend multi-tenant.

## Modelo e inmutabilidad

`vault.emr` contiene consultas, notas/versiones, diagnósticos, observaciones, alergias, medicamentos, órdenes, documentos, consentimientos, vínculos Rx, auditoría, cola y conflictos. Todo se cifra localmente. `vault.patients` sigue siendo la identidad única.

Un borrador es mutable. Finalizar genera snapshot canónico, SHA-256 y firma ECDSA. Una nota final no se edita: las correcciones son addenda firmados. Dos finales distintos se conservan como conflicto. `prescriptionLinks` vincula Rx sin cambiar el payload firmado histórico.

La edición personal conserva receta directa y talonario manual. En el SaaS previsto, la receta requerirá nota final del mismo paciente/consulta y una referencia firmada a esa nota. La política de cliente y sus pruebas están preparadas, pero el esquema owner-only y `rx_sync_bundle` todavía no pueden imponerla en servidor. No se debe habilitar un tenant comercial con solo cambiar una bandera de frontend.

## Documentos E2EE

Cada adjunto se cifra en el navegador con AES-GCM e IV aleatorio. El AAD liga ID, MIME y SHA-256. Supabase recibe ciphertext, IV, ID de llave y hash, nunca los bytes legibles. El path es `${auth.uid()}/documents/${document.id}.json`; RLS valida el primer segmento. El archivo se descifra solo en memoria al abrirlo.

## Recuperación entre dispositivos

1. Se genera un código Base32 de 256 bits que no se persiste en claro.
2. PBKDF2-SHA-256 (600,000 iteraciones y salt) deriva una llave de recuperación.
3. Esa llave envuelve la llave maestra con AES-GCM y AAD ligado al UID y `keyId`.
4. Supabase guarda solo el sobre cifrado.
5. Firma privada, perfil y ajustes se guardan en otro objeto E2EE.
6. El equipo nuevo exige cuenta Supabase, código y un PIN local nuevo.

Contraseña cloud o código aislado no bastan por sí solos.

## Sincronización

Guardado local cifrado → cola persistente → bootstrap Rx → upload de documentos cifrados → RPC EMR → descarga de ciphertext faltante → merge. Un final nunca se sustituye silenciosamente; los reintentos usan backoff. Una bóveda vacía lee la nube antes de escribir.

## Asistente

El modo local reordena únicamente hechos aportados por el médico. El modo externo es opt-in, envía un payload sin identificadores directos y solo completa campos vacíos. Ningún modo finaliza ni firma automáticamente.

