# Rx Offline EMR V3.2 — acceso personal y navegación adaptativa

## Cambios

- El dominio público abre ahora un gate de acceso Supabase antes de permitir crear o recuperar una bóveda.
- Una allowlist con RLS autoriza únicamente al propietario actual; no existe registro público.
- Las bóvedas existentes se ligan al UID autorizado sin reescribir su contenido clínico.
- El desbloqueo posterior conserva PIN y Face ID/Touch ID, incluido uso offline en dispositivos ya autorizados.
- `/api/clinical-note` comprueba sesión y allowlist antes de usar IA.
- Escritorio usa un rail lateral; móvil usa menú superior desplegable y ya no muestra barra inferior.
- Se agregaron Clinical Glass, Cobalt Mint, Rosewood Silk, Deep Clinic y Aurora Night.
- Se incrementó la versión de caché de la PWA para entregar la interfaz nueva.

## Backend

La migración aditiva `authorize_single_owner_access` quedó aplicada al mismo proyecto Supabase gratuito. Confirmado: RLS activo, un propietario habilitado y rol anónimo sin `SELECT`. No se eliminaron ni modificaron registros clínicos.

## Validación

- Sintaxis JavaScript: PASS.
- Unitarias/contratos: 28/28 PASS.
- El runner local no pudo descargar Chromium por timeout/502 del CDN; los cinco E2E quedan definidos para CI y validación remota de Preview.

No promover a producción hasta revisar el Preview y aprobarlo explícitamente.
