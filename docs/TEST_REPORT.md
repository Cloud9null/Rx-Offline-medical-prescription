# Reporte de pruebas — V3.3 preview

## Local

- `node --check` del runtime y API: PASS.
- `npm test`: **30/30 PASS**.
- `git diff --check`: PASS.
- Playwright local: Chromium no pudo descargarse por 502/timeout del CDN; no se sustituyó por una prueba falsa.
- GitHub Actions `EMR preview CI` run 17: **6/6 E2E PASS** con Chromium sobre el SHA del PR.

Cobertura: migración del vault, edad, IMC, canonicalización, validación, merge, contratos Rx/QR, receta-consulta, PWA, SQL/RLS/grants, bootstrap, E2EE, rechazo de ciphertext/código incorrectos, paquete privado, allowlist owner-only en frontend/API, minimización IA, texto plano, inventario/revocación de sesiones y Liquid Glass progresivo.

## E2E del PR

`clinical-flow.spec.js` usa datos sintéticos y cubre bóveda/perfil, paciente/consulta/autosave/asistente local, finalización/receta vinculada/timeline, receta directa, gate del enlace público, navegación escritorio/móvil y controles visibles de sesiones. GitHub Actions instaló Chromium y confirmó los seis flujos en verde.

## Supabase

Las siete migraciones aditivas terminan con `manage_owner_sessions`. La verificación posterior confirmó RLS activo, un propietario habilitado, cuatro sesiones activas para esa cuenta, lectura/RPC anónimos denegados, listado autenticado limitado al UID propio y revocación incapaz de afectar sesiones ajenas o la sesión actual. No se usaron datos clínicos reales.

No hubo hallazgos Advisor nuevos para E2EE. Los RPC de sesión agregan warnings esperados por `SECURITY DEFINER`; están restringidos a `authenticated`, validan UID/allowlist y usan `search_path=''`. Persisten warnings legacy y leaked-password protection. Índices EMR `unused` son esperables antes del uso real.

## Validación manual pendiente

Antes de `main`: Safari/iPhone PWA, Face ID en dominio definitivo, recuperación real, documentos sintéticos, impresión, red intermitente y revisión clínica/jurídica.
