# Rx Offline EMR — V3.2

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
- Acceso personal en dos capas: allowlist de propietario en Supabase y PIN/Face ID de la bóveda en cada dispositivo. El dominio público no permite crear una bóveda sin autorizar primero la cuenta.
- Navegación adaptativa: rail lateral persistente en escritorio y menú superior desplegable en móvil, sin barra inferior fija.
- Diecisiete paletas premium, incluidas dos variantes oscuras.
- Instalación PWA en iPhone, iPad, Android y escritorio; bloqueo por PIN y Face ID/Touch ID mediante WebAuthn PRF cuando el navegador lo permite.

## Desarrollo y pruebas

```bash
npm ci
npm test
npm run test:e2e
```

Los E2E usan datos sintéticos. Consulta [despliegue](docs/DEPLOYMENT.md), [backup y recuperación](docs/BACKUP_RESTORE.md), [privacidad de IA](docs/AI_PRIVACY.md) y el [reporte de pruebas](docs/TEST_REPORT.md).

## Backend compartido

Las seis migraciones aditivas de `supabase/migrations/` están aplicadas al proyecto Supabase existente **Expediente Medico v1**. No se creó una rama ni otro proyecto facturable. Las dos últimas incorporan recuperación E2EE/documentos privados y una allowlist administrativa de acceso personal; no borran ni reescriben recetas, pacientes o notas existentes.

El frontend V3.1 está integrado en `main` y desplegado en producción tras aprobación explícita. Los cambios posteriores deben volver a pasar por rama, Preview, pruebas y revisión.

## IA generativa opcional

El estructurador local funciona sin red ni secretos. En Vercel, la función puede usar AI Gateway con el token OIDC efímero inyectado por la plataforma (encabezado en runtime o variable durante build); no es necesario copiar una llave al cliente ni al repositorio. Variables opcionales:

- `AI_GATEWAY_CLINICAL_MODEL` — por defecto `openai/gpt-5-mini`.
- `AI_GATEWAY_API_KEY` — respaldo si el despliegue no dispone de OIDC.
- `OPENAI_API_KEY` y `OPENAI_CLINICAL_MODEL` — reemplazo directo opcional.

La función `/api/clinical-note` valida tanto la sesión Supabase como la allowlist del propietario, vuelve a minimizar el payload en servidor, usa salida JSON estricta, limita la salida, envía `store: false` y solicita no usar prompts para entrenamiento al Gateway. No recibe identificadores estructurados. Su uso clínico requiere evaluación de proveedor, aviso de privacidad y revisión médica antes de guardar o finalizar.

## Límites

- Es una implementación técnica alineada por campos y controles; no constituye certificación NOM-024, homologación, e.firma/FIEL ni asesoría jurídica.
- Los metadatos clínicos de tablas están protegidos por Auth/RLS, pero no tienen E2EE por campo. Los archivos y el paquete privado de recuperación sí usan E2EE del lado cliente.
- La sesión Supabase histórica permanece en `localStorage` por compatibilidad.
- El código de recuperación no puede ser restituido por soporte. Debe guardarse fuera del dispositivo.
- Toda nota estructurada o generada requiere juicio, edición y firma del profesional responsable.

## Instalar en iPhone

Abre el dominio HTTPS definitivo en Safari, usa **Compartir → Añadir a pantalla de inicio** y activa Face ID después de fijar el dominio. La credencial biométrica está ligada al dominio.
