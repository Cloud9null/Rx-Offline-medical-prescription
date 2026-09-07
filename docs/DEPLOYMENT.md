# Despliegue controlado

## Precondiciones

- No usar datos reales.
- No aplicar SQL al proyecto Supabase de producción hasta aprobar el PR.
- No colocar `service_role`, contraseña DB ni tokens en GitHub/cliente.
- Confirmar costo antes de crear una rama Supabase.

## Preview recomendado

1. Crear/autorizar una rama Supabase de staging.
2. Aplicar `supabase/migrations/20260907180000_emr_integrado_v3.sql` a staging.
3. Configurar en el preview únicamente la URL y publishable key de staging en un mecanismo de configuración separado.
4. Desplegar la rama Git `feat/emr-integrado-v3` como Preview de Vercel; nunca `--prod`.
5. Ejecutar `npm ci && npm test && npm run test:e2e`.
6. Ejecutar las pruebas de aislamiento con dos usuarios sintéticos y Security/Performance Advisors.
7. Validar impresión Rx 8.5×5.5, nota A4, offline/reconexión, addendum, anulación y restauración en segundo navegador.

No se requieren nuevas variables secretas de frontend. La publishable key no es administrativa; la `service_role` está prohibida en la PWA.

## Orden de release futuro

1. Backup/restore verificado.
2. Migración Supabase aprobada y aplicada.
3. Smoke test cloud.
4. Promover el artefacto preview exacto.
5. Monitorear errores sin registrar PHI.

El merge y redeploy productivo requieren aprobación explícita del propietario.
