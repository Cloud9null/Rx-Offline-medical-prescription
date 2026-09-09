# Reporte de pruebas — V3.2 preview

## Local

- `node --check` del runtime y API: PASS.
- `npm test`: **28/28 PASS**.
- `git diff --check`: PASS.
- Playwright local: Chromium no pudo descargarse por 502/timeout del CDN; no se sustituyó por una prueba falsa.

Cobertura: migración del vault, edad, IMC, canonicalización, validación, merge, contratos Rx/QR, receta-consulta, PWA, SQL/RLS/grants, bootstrap, E2EE, rechazo de ciphertext/código incorrectos, paquete privado, allowlist owner-only en frontend/API, minimización IA y texto plano.

## E2E del PR

`clinical-flow.spec.js` usa datos sintéticos y cubre bóveda/perfil, paciente/consulta/autosave/asistente local, finalización/receta vinculada/timeline, receta directa, gate del enlace público y navegación escritorio/móvil. GitHub Actions instala Chromium y debe validar el SHA final.

## Supabase

Las seis migraciones aditivas terminan con `authorize_single_owner_access`. La verificación posterior confirmó tabla `app_authorized_users`, RLS activo, un propietario habilitado, lectura anónima denegada y lectura autenticada limitada por política a la fila propia. No se usaron datos clínicos reales.

No hubo hallazgos Advisor nuevos para E2EE. Persisten warnings conocidos de RPC legacy y leaked-password protection. Índices EMR `unused` son esperables antes del uso real.

## Validación manual pendiente

Antes de `main`: Safari/iPhone PWA, Face ID en dominio definitivo, recuperación real, documentos sintéticos, impresión, red intermitente y revisión clínica/jurídica.
