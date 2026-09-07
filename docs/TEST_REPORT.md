# Reporte de pruebas — V3 preview

## Ejecutadas

- `node --check`: `app.js`, `cloud.js`, `emr.js`, `emr-core.js`, `verify.js`: PASS.
- `npm test`: 14/14 PASS.
- `git diff --check`: PASS.

Cobertura funcional automatizada: migración aditiva del vault, edad pediátrica a fecha de atención, JSON canónico estable, validación mínima, IMC/alertas, conflicto final/draft, presencia de `renderHistory`, firma/QR/SEP/manuales/anulación, vínculo externo al payload Rx, assets PWA, propiedades de RLS/migración, grants mínimos, bootstrap seguro e índices/políticas legacy optimizados.

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

GitHub Actions `EMR preview CI`: la rama ejecuta unit/regression y E2E Chromium en cada push. El último resultado y SHA deben tomarse de los checks del PR para evitar dejar un identificador obsoleto en este documento.

Vercel reportó el deployment de ese commit como **Ready**. El preview tiene protección de autenticación de Vercel, por lo que la inspección pública anónima redirige a SSO.

## Límites de validación

En el contenedor local, la descarga de Chromium recibió 502/timeout y `agent-browser` no pudo iniciar sin browser. La ejecución equivalente sí se completó en GitHub Actions con Chromium instalado.

## Verificación Supabase compartido

Con autorización explícita se aplicaron cuatro migraciones aditivas al proyecto existente, sin crear una rama facturable:

- `20260907193602 emr_integrado_v3`
- `20260907194052 harden_emr_grants_and_indexes`
- `20260907194549 enable_safe_legacy_bootstrap`
- `20260907195054 optimize_legacy_rls`

Resultados: 12/12 tablas EMR con RLS owner-only; rol anónimo sin lectura ni RPC EMR; usuario autenticado con lectura solamente de sus registros; identidad sintética ajena obtuvo 0 perfiles, 0 pacientes y 0 recetas. Una escritura completa por `emr_sync_bundle` se validó dentro de una transacción y se revirtió. Después de la prueba quedaron 0 encounters y 0 clinical_notes.

Los conteos legacy permanecieron en 3 pacientes, 13 recetas y 13 verificaciones. Los hashes de `rx_cloud_healthcheck`, `rx_sync_bundle` y `verify_prescription` permanecieron idénticos al baseline.

Security Advisor no reporta hallazgos nuevos de EMR. Conserva advertencias legacy por los tres RPC de recetas `SECURITY DEFINER` —su ejecución es parte del contrato actual— y por protección de contraseñas filtradas desactivada. Performance Advisor ya no reporta RLS initplan ni FK sin índice; los índices EMR vacíos aparecen como `unused`, esperado antes de uso real.
