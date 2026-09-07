# Reporte de pruebas — V3 preview

## Ejecutadas

- `node --check`: `app.js`, `cloud.js`, `emr.js`, `emr-core.js`, `verify.js`: PASS.
- `npm test`: 11/11 PASS.
- `git diff --check`: PASS.

Cobertura funcional automatizada: migración aditiva del vault, edad pediátrica a fecha de atención, JSON canónico estable, validación mínima, IMC/alertas, conflicto final/draft, presencia de `renderHistory`, firma/QR/SEP/manuales/anulación, vínculo externo al payload Rx, assets PWA y propiedades de RLS/migración.

## E2E remoto

`tests/e2e/clinical-flow.spec.js` cubre:

1. bóveda sintética;
2. perfil/firma;
3. paciente;
4. consulta y autosave;
5. finalización/firma;
6. receta vinculada;
7. timeline;
8. receta directa sin encounter.

GitHub Actions `EMR preview CI`, run 6: **PASS (2/2)** sobre `914fed340b177d22db9221fa70d0f38c154fc497`.

Vercel reportó el deployment de ese commit como **Ready**. El preview tiene protección de autenticación de Vercel, por lo que la inspección pública anónima redirige a SSO.

## Límites de validación

En el contenedor local, la descarga de Chromium recibió 502/timeout y `agent-browser` no pudo iniciar sin browser. La ejecución equivalente sí se completó en GitHub Actions con Chromium instalado.

Las migraciones/RLS no se aplicaron al Supabase productivo. Las pruebas SQL con dos usuarios están pendientes de una rama staging autorizada.
