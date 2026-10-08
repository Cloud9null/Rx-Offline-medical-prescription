# Clinovyra EMR — desarrollo de apps nativas

Expediente clínico local-first con receta electrónica Rx Offline integrada. La receta directa sigue disponible sin crear una consulta o nota. Esta rama prepara apps Android, iPhone y Windows, junto con la PWA existente. La producción continúa en la versión publicada hasta revisar y promover estos cambios.

## Capacidades

- Pacientes, consultas, notas de primera vez/evolución/referencia, antecedentes, alergias, signos vitales, exploración, diagnósticos, órdenes/resultados, tratamiento, pronóstico, alarmas, seguimiento, consentimientos, documentos y timeline.
- Borradores con autosave en una bóveda local AES-256-GCM.
- Nota final inmutable con snapshot canónico, SHA-256, firma ECDSA P-256, autor y fecha; las correcciones se agregan como addenda firmados.
- Receta electrónica offline conservada: firma, QR, verificación, impresión media carta, historial y anulación. Puede vincularse a una consulta o emitirse directamente.
- Expediente longitudinal unificado: las recetas directas aparecen junto con consultas y notas, con folio, fecha, estado y medicamentos. Desde una receta se abre el expediente; una receta directa previa puede vincularse a una nueva nota sin modificar ni volver a firmar la receta.
- Asistente clínico local que estructura puntos clave sin red y sin inventar datos; opción generativa externa con consentimiento explícito, sesión autenticada y payload minimizado.
- Espacio independiente **Nota IA rápida**: no requiere paciente ni consulta, no se incorpora al expediente, no se sincroniza y ofrece edición, modo de lectura grande, copiar, compartir, descarga e impresión estándar.
- Control visual de integridad del borrador con ocho elementos clínicos (interrogatorio, vitales, exploración, diagnóstico, razonamiento, plan, alarmas y seguimiento).
- Copiar, compartir o descargar la nota como `.txt` estándar. Estas funciones no intentan eludir políticas o restricciones de otro sistema.
- Documentos PDF/JPEG/PNG cifrados antes de salir del dispositivo; Supabase Storage solo recibe ciphertext en un bucket privado owner-scoped.
- Recuperación segura entre dispositivos mediante código aleatorio, PBKDF2-SHA-256 y sobre AES-GCM. El servidor nunca recibe la llave maestra ni el código en claro.
- Supabase Auth/RLS y sincronización owner-only con cola, backoff y conflictos explícitos.
- Acceso personal en dos capas: allowlist de propietario en Supabase y PIN/Face ID de la bóveda en cada dispositivo. El dominio público no permite crear una bóveda sin autorizar primero la cuenta.
- Panel de dispositivos con sesiones reales de Supabase Auth, fecha/última actividad, red parcialmente enmascarada, revocación individual, cierre de todas las demás sesiones y desautorización local.
- Navegación adaptativa: rail lateral en escritorio; dock inferior de cinco accesos y menú de secciones adicionales en móvil.
- Efecto Liquid Glass progresivo en iPhone PWA, con fallback compatible para Android/Windows/web y respeto a `prefers-reduced-motion`.
- Identidad Clinovyra con icono y dos paletas nuevas, incluida una nocturna.
- Instalación PWA en iPhone, iPad, Android y escritorio; PIN siempre disponible, rotación local segura del PIN y biometría WebAuthn autoverificada con PRF o `largeBlob` protegido según capacidad del navegador.
- Veintitrés paletas premium separadas en temas claros y nocturnos. El acceso rápido recuerda la última selección.
- En Safari/iPhone cada ceremonia WebAuthn parte de una acción explícita: se reutiliza el PRF del alta cuando está disponible y, si hace falta otra ceremonia, la interfaz solicita **Completar con Face ID** en un segundo toque.

## Desarrollo y pruebas

```bash
npm ci
npm test
npm run test:e2e
```

Los E2E usan datos sintéticos. Consulta [despliegue](docs/DEPLOYMENT.md), [backup y recuperación](docs/BACKUP_RESTORE.md), [privacidad de IA](docs/AI_PRIVACY.md), [preparación SaaS](docs/SAAS_READINESS.md) y el [reporte de pruebas](docs/TEST_REPORT.md).

El proyecto nativo está en [`native/`](native/) y su guía de compilación y recuperación es [Aplicaciones nativas](docs/NATIVE_APPS.md). La [matriz NOM](docs/NOM_MATRIX.md) indica controles presentes y brechas abiertas. Crear un APK/IPA/EXE instalable requiere compilar y probar en el sistema operativo y dispositivo correspondientes; el código fuente por sí solo no acredita conformidad normativa.

## Backend compartido

Las siete migraciones aditivas de `supabase/migrations/` están aplicadas al proyecto Supabase existente **Expediente Medico v1**. No se creó una rama ni otro proyecto facturable. Las tres últimas incorporan recuperación E2EE/documentos privados, una allowlist administrativa y control de sesiones del propietario; no borran ni reescriben recetas, pacientes o notas existentes.

El backend Supabase de producción no se modifica en este trabajo. La nueva identidad, navegación y proyectos nativos se revisan en una rama antes de cualquier publicación.

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
- La revocación corta el refresh token y la autorización online; un equipo desconectado no puede borrarse a distancia y conserva su bóveda cifrada protegida por PIN/biometría.
- El código de recuperación no puede ser restituido por soporte. Debe guardarse fuera del dispositivo.
- Toda nota estructurada o generada requiere juicio, edición y firma del profesional responsable.

## Instalar en iPhone

Abre el dominio HTTPS definitivo en Safari, usa **Compartir → Añadir a pantalla de inicio** y activa Face ID después de fijar el dominio. En **Ajustes → Bloqueo y biometría**, configura y ejecuta **Probar desbloqueo** antes de depender de él. La credencial está ligada al dominio y el PIN permanece como recuperación local.

