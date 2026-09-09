# Reporte de pruebas — V3.4 preview

## Local

- `node --check` del runtime y API: PASS.
- `npm test`: **31/31 PASS**.
- `git diff --check`: PASS.
- Playwright local: Chromium no pudo descargarse por 502/timeout del CDN; no se sustituyó por una prueba falsa.
- Playwright local no inició porque la imagen de trabajo no contiene el binario de Chromium; GitHub Actions instaló Chromium y ejecutó la misma suite.
- GitHub Actions `EMR preview CI` run 19: **31/31 unitarias y 7/7 E2E PASS** sobre `8119e87`.

Cobertura: migración del vault, edad, IMC, canonicalización, validación, merge, contratos Rx/QR, receta-consulta, PWA, SQL/RLS/grants, bootstrap, E2EE, rechazo de ciphertext/código incorrectos, paquete privado, allowlist owner-only en frontend/API, minimización IA, texto plano, inventario/revocación de sesiones, Liquid Glass progresivo y vinculación retrospectiva segura de recetas directas.

## E2E del PR

`clinical-flow.spec.js` usa datos sintéticos y cubre bóveda/perfil, paciente/consulta/autosave/asistente local, finalización/receta vinculada/timeline, receta directa, gate del enlace público, navegación escritorio/móvil, controles visibles de sesiones y el flujo receta directa → búsqueda → expediente → nueva nota vinculada. Los siete flujos pasaron en Chromium.

## Preview Vercel

- Build de Preview: **Ready** para el SHA `8119e87`.
- URL del Preview protegida por Vercel Authentication: `https://rx-offline-medical-prescription-git-924e99-cloud9nulls-projects.vercel.app`.
- La protección de Preview impidió inspección anónima externa; no se compartieron ni solicitaron credenciales. El artefacto quedó cubierto por build Ready y el E2E del mismo commit.

## Supabase

Las siete migraciones aditivas terminan con `manage_owner_sessions`. La verificación posterior confirmó RLS activo, un propietario habilitado, cuatro sesiones activas para esa cuenta, lectura/RPC anónimos denegados, listado autenticado limitado al UID propio y revocación incapaz de afectar sesiones ajenas o la sesión actual. No se usaron datos clínicos reales.

No hubo hallazgos Advisor nuevos para E2EE. Los RPC de sesión agregan warnings esperados por `SECURITY DEFINER`; están restringidos a `authenticated`, validan UID/allowlist y usan `search_path=''`. Persisten warnings legacy y leaked-password protection. Índices EMR `unused` son esperables antes del uso real.

## Validación manual pendiente

Antes de `main`: Safari/iPhone PWA, Face ID en dominio definitivo, recuperación real, documentos sintéticos, impresión, red intermitente y revisión clínica/jurídica.
