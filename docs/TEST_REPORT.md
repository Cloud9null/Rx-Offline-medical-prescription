# Reporte de pruebas — V3 preview

## Ejecutadas

- `node --check`: `app.js`, `cloud.js`, `emr.js`, `emr-core.js`, `verify.js`: PASS.
- `npm test`: 11/11 PASS.
- `git diff --check`: PASS.

Cobertura funcional automatizada: migración aditiva del vault, edad pediátrica a fecha de atención, JSON canónico estable, validación mínima, IMC/alertas, conflicto final/draft, presencia de `renderHistory`, firma/QR/SEP/manuales/anulación, vínculo externo al payload Rx, assets PWA y propiedades de RLS/migración.

## E2E escrito

`tests/e2e/clinical-flow.spec.js` cubre:

1. bóveda sintética;
2. perfil/firma;
3. paciente;
4. consulta y autosave;
5. finalización/firma;
6. receta vinculada;
7. timeline;
8. receta directa sin encounter.

## Bloqueado en este entorno

La descarga de Chromium de Playwright recibió 502/timeout desde `cdn.playwright.dev`; `agent-browser` no pudo iniciar su daemon porque no existe un browser local. Por ello el E2E queda **no ejecutado**, no se afirma PASS. Debe ejecutarse en GitHub Actions o preview con browser disponible.

Las migraciones/RLS no se aplicaron al Supabase productivo. Las pruebas SQL con dos usuarios están pendientes de una rama staging autorizada.
