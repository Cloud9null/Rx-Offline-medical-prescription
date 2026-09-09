# Rx Offline EMR V3.4 — expediente longitudinal de recetas

## Flujo clínico

- Todas las recetas de un paciente aparecen en su expediente aunque se hayan emitido sin consulta o nota.
- La línea de tiempo muestra folio, fecha, estado, medicamentos y si la receta es directa o está vinculada.
- El historial sigue buscando por nombre del paciente o folio de receta.
- Desde el detalle de una receta se puede abrir directamente el expediente del paciente.
- Una receta directa previa puede iniciar una nueva nota ya vinculada; la app valida paciente y evita doble vínculo.
- La nota borrador/final muestra las recetas relacionadas y permite abrirlas.

## Integridad

El vínculo es una entidad clínica externa. No se modifica el contenido canónico, hash, firma ECDSA, QR ni fecha de la receta previa. La receta no se vuelve a emitir.

## Backend y costo

No se agregan migraciones: se reutiliza `prescription_links` con RLS owner-only y la restricción única existente por receta. Se mantiene el mismo proyecto Supabase gratuito.

## Validación

- Unitarias/contratos: 31/31 PASS.
- E2E sintético nuevo: receta directa → búsqueda → expediente → nota vinculada.
- GitHub Actions: 31/31 unitarias y 7/7 E2E Chromium PASS.
- Vercel Preview: Ready para el SHA del PR.
