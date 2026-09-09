# Reporte de pruebas — V3.1 preview

## Local

- `node --check` del runtime y API: PASS.
- `npm test`: **23/23 PASS**.
- `git diff --check`: PASS.
- Playwright local: Chromium no pudo descargarse por 502/timeout del CDN; no se sustituyó por una prueba falsa.

Cobertura: migración del vault, edad, IMC, canonicalización, validación, merge, contratos Rx/QR, receta-consulta, PWA, SQL/RLS/grants, bootstrap, E2EE, rechazo de ciphertext/código incorrectos, paquete privado, minimización IA y texto plano.

## E2E del PR

`clinical-flow.spec.js` usa datos sintéticos y cubre bóveda/perfil, paciente/consulta/autosave/asistente local, finalización/receta vinculada/timeline y receta directa. GitHub Actions instala Chromium y debe validar el SHA final.

## Supabase

Las cinco migraciones aditivas terminan con `20260909060646_e2ee_documents_and_key_recovery`. Esta última dejó `vault_key_envelopes` con RLS y 0 filas, bucket privado de 6 MB, tres políticas owner-only de tabla y tres de objetos, y 0 objetos durante la inspección. No se usaron datos reales.

No hubo hallazgos Advisor nuevos para E2EE. Persisten warnings conocidos de RPC legacy y leaked-password protection. Índices EMR `unused` son esperables antes del uso real.

## Validación manual pendiente

Antes de `main`: Safari/iPhone PWA, Face ID en dominio definitivo, recuperación real, documentos sintéticos, impresión, red intermitente y revisión clínica/jurídica.
