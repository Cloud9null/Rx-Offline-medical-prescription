# Arquitectura V3

## Capas

1. `app.js`: bóveda, Rx, impresión, firma histórica, backup y navegación base.
2. `emr-core.js`: modelo puro, edad a fecha de atención, IMC, validación, canonicalización y merge seguro.
3. `emr.js`: UI clínica, autosave, finalización, addenda, adjuntos locales y timeline.
4. `cloud.js`: Auth/REST/RPC, bootstrap seguro, cola/backoff y merge con conflicto explícito.
5. Supabase: tablas owner-scoped y `emr_sync_bundle(jsonb)` como `SECURITY INVOKER`.

## Modelo local

`vault.emr` contiene `encounters`, `clinicalNotes`, `noteVersions`, `diagnoses`, `observations`, `allergies`, `medications`, `orders`, `documents`, `consents`, `prescriptionLinks`, `auditEvents`, `syncQueue` y `conflicts`. El objeto completo se serializa y cifra con la misma clave AES-GCM de la bóveda.

La tabla `patients`/colección `vault.patients` sigue siendo la identidad única del paciente. No se crea una segunda tabla local de pacientes.

## Inmutabilidad

- Una nota draft es mutable y usa LWW por `updatedAt` solo entre borradores.
- Finalizar genera snapshot canónico estable, hash SHA-256 y firma ECDSA con la clave del dispositivo/autor.
- El sello incluye su propia JWK pública; la verificación no depende de la clave local actual.
- Una nota final no se actualiza. Correcciones se agregan como `noteVersions.kind=addendum` con sello propio.
- Dos finales distintos producen un registro `conflicts`; ninguno sobrescribe al otro.
- `prescriptionLinks` relaciona `rx_id` con consulta/nota sin alterar `canonicalPayload(recipe)`.

## Sincronización

1. Guardado local cifrado.
2. Entrada persistente `syncQueue`.
3. Si hay sesión y red, sync legacy de pacientes/recetas.
4. Sync EMR mediante RPC invoker + RLS.
5. Merge: final gana sobre draft; final contra final distinto se bloquea como conflicto.
6. Reintentos exponenciales limitados a seis intentos (1.2–60 s).
7. Si la RPC EMR no existe, Rx legacy continúa y se informa “migración pendiente”.

Una bóveda vacía realiza lectura de `profiles`, `patients` y `prescriptions` antes de llamar la RPC histórica. Si la lectura falla, no escribe nada.
