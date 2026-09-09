# Rx Offline EMR — V3.1 preview

PWA clínica local-first que integra expediente médico longitudinal y la receta electrónica Rx Offline existente. La receta directa sigue disponible y no obliga a crear una consulta o nota.

## Capacidades

- Pacientes, consultas, notas de primera vez/evolución/referencia, antecedentes, alergias, signos vitales, exploración, diagnósticos, órdenes/resultados, tratamiento, pronóstico, alarmas, seguimiento, consentimientos, documentos y timeline.
- Borradores con autosave en una bóveda local AES-256-GCM.
- Nota final inmutable con snapshot canónico, SHA-256, firma ECDSA P-256, autor y fecha; las correcciones se agregan como addenda firmados.
- Receta electrónica offline conservada: firma, QR, verificación, impresión media carta, historial y anulación. Puede vincularse a una consulta o emitirse directamente.
- Asistente clínico local que estructura puntos clave sin red y sin inventar datos; opción generativa externa con consentimiento explícito, sesión autenticada y payload minimizado.
- Copiar, compartir o descargar la nota como `.txt` estándar. Estas funciones no intentan eludir políticas o restricciones de otro sistema.
- Documentos PDF/JPEG/PNG cifrados antes de salir del dispositivo; Supabase Storage solo recibe ciphertext en un bucket privado owner-scoped.
- Recuperación segura entre dispositivos mediante código aleatorio, PBKDF2-SHA-256 y sobre AES-GCM. El servidor nunca recibe la llave maestra ni el código en claro.
- Supabase Auth/RLS y sincronización owner-only con cola, backoff y conflictos explícitos.
- Instalación PWA en iPhone, iPad, Android y escritorio; bloqueo por PIN y Face ID/Touch ID mediante WebAuthn PRF cuando el navegador lo permite.

## Desarrollo y pruebas

```bash
npm ci
npm test
npm run test:e2e
```

Los E2E usan datos sintéticos. Consulta [despliegue](docs/DEPLOYMENT.md), [backup y recuperación](docs/BACKUP_RESTORE.md), [privacidad de IA](docs/AI_PRIVACY.md) y el [reporte de pruebas](docs/TEST_REPORT.md).

## Backend compartido

Las cinco migraciones aditivas de `supabase/migrations/` están aplicadas al proyecto Supabase existente **Expediente Medico v1**. No se creó una rama ni otro proyecto facturable. La nueva migración añade únicamente la tabla de sobres de recuperación, un bucket privado y sus políticas RLS; no borra ni reescribe recetas o pacientes existentes.

El frontend V3.1 permanece en `feat/emr-integrado-v3` y en un Preview de Vercel. `main` y producción no se promueven sin aprobación explícita.

## IA generativa opcional

El estructurador local funciona sin secretos. Para habilitar generación externa en Preview, configura desde el panel de Vercel, nunca en Git o chat:

- `OPENAI_API_KEY`
- `OPENAI_CLINICAL_MODEL` — opcional; por defecto `gpt-5-mini`.

La función `/api/clinical-note` valida la sesión Supabase, usa salida JSON estricta y envía `store: false`. No recibe identificadores estructurados. Su uso clínico requiere evaluación de proveedor, aviso de privacidad y revisión médica antes de guardar o finalizar.

## Límites

- Es una implementación técnica alineada por campos y controles; no constituye certificación NOM-024, homologación, e.firma/FIEL ni asesoría jurídica.
- Los metadatos clínicos de tablas están protegidos por Auth/RLS, pero no tienen E2EE por campo. Los archivos y el paquete privado de recuperación sí usan E2EE del lado cliente.
- La sesión Supabase histórica permanece en `localStorage` por compatibilidad.
- El código de recuperación no puede ser restituido por soporte. Debe guardarse fuera del dispositivo.
- Toda nota estructurada o generada requiere juicio, edición y firma del profesional responsable.

## Instalar en iPhone

Abre el dominio HTTPS definitivo en Safari, usa **Compartir → Añadir a pantalla de inicio** y activa Face ID después de fijar el dominio. La credencial biométrica está ligada al dominio.
