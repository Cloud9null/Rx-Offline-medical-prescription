# Despliegue controlado

## Precondiciones

- No usar datos reales.
- No colocar `service_role`, contraseña DB ni tokens en GitHub/cliente.
- No ejecutar migraciones destructivas ni modificar datos existentes.
- No promover `main` ni el frontend productivo sin aprobación explícita.

## Estado actual

Por decisión del propietario se reutiliza el proyecto Supabase existente para evitar el costo de una rama. Ya están aplicadas, en orden, las cuatro migraciones de `supabase/migrations/`. Fueron verificadas con RLS, grants, Advisors, lectura autenticada owner-only, identidad ajena y smoke transaccional revertido.

El frontend V3 está en `feat/emr-integrado-v3` y debe desplegarse únicamente como Preview de Vercel. GitHub Actions ejecuta:

```bash
npm ci
npm test
npm run test:e2e
```

No se requieren nuevas variables secretas de frontend. La publishable key no es administrativa; la `service_role` está prohibida en la PWA.

Antes de promover producción, validar manualmente en el Preview: impresión Rx 8.5×5.5, nota A4, offline/reconexión, addendum, anulación, restauración en segundo navegador y flujo directo de receta sin nota.

## Orden de release futuro

1. Backup/restore verificado por el propietario.
2. Checks del PR y smoke del Preview en verde.
3. Aprobación explícita para merge/promoción.
4. Promover el artefacto preview exacto.
5. Monitorear errores sin registrar PHI.

El merge y redeploy productivo requieren aprobación explícita del propietario.
