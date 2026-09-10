# Reporte de pruebas — V3.5 preview

## Local

- `node --check` del runtime y API: PASS.
- `npm test`: **35/35 PASS**.
- `git diff --check`: PASS.
- Playwright local no inició porque la imagen de trabajo no contiene Chromium y el CDN devolvió 502/timeout al restaurarlo; no se sustituyó por una prueba falsa.
- GitHub Actions: pendiente para el SHA del PR V3.5; instalará Chromium y ejecutará los ocho flujos.

Cobertura: migración del vault, edad, IMC, canonicalización, validación, merge, contratos Rx/QR, receta-consulta, PWA, SQL/RLS/grants, E2EE, minimización IA, texto plano, sesiones, Liquid Glass, vinculación retrospectiva, autoprueba biométrica PRF/`largeBlob`, nota rápida temporal y control de integridad del borrador.

## E2E del PR

`clinical-flow.spec.js` usa datos sintéticos y cubre bóveda/perfil, paciente/consulta/autosave/asistente local, finalización/receta vinculada/timeline, receta directa, gate del enlace público, navegación escritorio/móvil, sesiones, receta previa vinculada y la Nota IA rápida local sin crear pacientes o consultas. La ejecución CI del PR es obligatoria antes de promoverse.

## Preview Vercel

- Pendiente de generar desde la rama V3.5.

## Supabase

El proyecto `Expediente Medico v1` está `ACTIVE_HEALTHY` en Postgres 17. Todas las tablas clínicas, allowlist y sobres de recuperación reportan RLS activo; el bucket `rx-emr-private-v1` es privado y conserva el límite de 6 MiB. No se consultó contenido clínico real ni se aplicó DDL.

Advisor reporta warnings esperados por funciones `SECURITY DEFINER` deliberadamente expuestas a roles concretos (verificador público, sincronización y sesiones) y la protección de contraseñas filtradas aún desactivada. Los índices EMR `unused` son informativos con el volumen actual; no deben eliminarse antes de uso representativo.

## Validación manual pendiente

Antes de `main`: CI Chromium, Safari/iPhone PWA con **Probar desbloqueo**, Firefox Portable/Windows Hello si se usará, recuperación real, documentos sintéticos, impresión, red intermitente y revisión clínica/jurídica.
