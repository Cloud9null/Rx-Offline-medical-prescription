# Despliegue controlado

## Estado

- Rama de producción: `main`.
- Producción: V3.3; V3.4 requiere Preview y aprobación antes de promoverse.
- Supabase: mismo proyecto gratuito; siete migraciones aditivas aplicadas.
- Acceso: `app_authorized_users` con RLS, un propietario habilitado y sin lectura anónima.
- Storage: `rx-emr-private-v1`, privado, máximo 6 MB por JSON cifrado.
- Frontend/API: Vercel Production; cada ajuste se valida primero mediante Preview.
- Preview V3.4: Ready y protegido por Vercel Authentication; CI del mismo SHA en verde.

No se necesita una rama Supabase facturable. El uso queda sujeto a las cuotas del plan existente.

## Variables

Nunca incluir `service_role`, contraseña DB ni tokens administrativos en cliente o Git. La opción recomendada para IA externa usa el token OIDC que Vercel inyecta como `x-vercel-oidc-token` en runtime (y `VERCEL_OIDC_TOKEN` durante build) y rota automáticamente. No debe crearse manualmente. Configuración opcional:

```text
AI_GATEWAY_CLINICAL_MODEL=openai/gpt-5-mini
AI_GATEWAY_API_KEY=<respaldo solo si OIDC no está disponible>
OPENAI_API_KEY=<reemplazo directo opcional>
OPENAI_CLINICAL_MODEL=gpt-5-mini
```

El endpoint da prioridad a la conexión directa si existe `OPENAI_API_KEY`; de lo contrario usa AI Gateway con OIDC. Si no hay proveedor, se agota el crédito o existe un límite temporal, el asistente local sigue disponible y el borrador no se modifica. El consumo queda sujeto al crédito y límites del plan Vercel; la aplicación no compra crédito ni habilita cobros automáticamente.

## Gate de promoción

1. Unit/regression y E2E Chromium en verde para el SHA final.
2. URL limpia muestra el acceso restringido; solo la identidad allowlisted puede autorizar un dispositivo nuevo.
3. Restauración en segundo navegador con código y PIN nuevo.
4. Upload/download de PDF/JPEG/PNG.
5. Nota local/IA opcional, final, addendum y texto plano.
6. Receta vinculada y receta directa; QR/verificador/anulación.
7. PWA, modo avión/reconexión e impresión Rx.
8. Aprobación explícita para merge/promoción.

## Primer acceso y sesiones desde V3.3

La contraseña del gate es la contraseña de **Supabase Auth** que ya se usa para sincronización; no es el PIN de la bóveda. En un navegador que ya tiene bóveda, inicia sesión una sola vez con la cuenta del propietario; el UID queda ligado criptográficamente al metadato local y después puede desbloquearse offline con PIN o biometría. En un dispositivo nuevo se exige primero esa cuenta y luego se crea o recupera la bóveda. No hay registro público.

En **Ajustes → Dispositivos y sesiones** se puede actualizar el inventario, revocar una sesión remota, cerrar todas las demás o desautorizar el equipo actual. La revocación impide el refresh y el siguiente control online de autorización. No puede borrar una bóveda de un equipo desconectado; esa copia permanece cifrada y exige PIN/biometría.

No registrar prompts, notas, tokens, códigos o cuerpos de Storage. Monitorear solo estado, latencia, versión, agregados y errores sanitizados.
