# Despliegue controlado

## Estado

- Rama de producción: `main`.
- Producción: V3.1 promovida únicamente después de aprobación explícita.
- Supabase: mismo proyecto gratuito; cinco migraciones aditivas aplicadas.
- Storage: `rx-emr-private-v1`, privado, máximo 6 MB por JSON cifrado.
- Frontend/API: Vercel Production; cada ajuste se valida primero mediante Preview.

No se necesita una rama Supabase facturable. El uso queda sujeto a las cuotas del plan existente.

## Variables

Nunca incluir `service_role`, contraseña DB ni tokens administrativos en cliente o Git. La opción recomendada para IA externa en Vercel usa `VERCEL_OIDC_TOKEN`, que la plataforma inyecta y rota automáticamente. No debe crearse manualmente. Configuración opcional:

```text
AI_GATEWAY_CLINICAL_MODEL=openai/gpt-5-mini
AI_GATEWAY_API_KEY=<respaldo solo si OIDC no está disponible>
OPENAI_API_KEY=<reemplazo directo opcional>
OPENAI_CLINICAL_MODEL=gpt-5-mini
```

El endpoint da prioridad a la conexión directa si existe `OPENAI_API_KEY`; de lo contrario usa AI Gateway con OIDC. Si no hay proveedor, se agota el crédito o existe un límite temporal, el asistente local sigue disponible y el borrador no se modifica. El consumo queda sujeto al crédito y límites del plan Vercel; la aplicación no compra crédito ni habilita cobros automáticamente.

## Gate de promoción

1. Unit/regression y E2E Chromium en verde para el SHA final.
2. Dos identidades sintéticas sin lectura cruzada.
3. Restauración en segundo navegador con código y PIN nuevo.
4. Upload/download de PDF/JPEG/PNG.
5. Nota local/IA opcional, final, addendum y texto plano.
6. Receta vinculada y receta directa; QR/verificador/anulación.
7. PWA, modo avión/reconexión e impresión Rx.
8. Aprobación explícita para merge/promoción.

No registrar prompts, notas, tokens, códigos o cuerpos de Storage. Monitorear solo estado, latencia, versión, agregados y errores sanitizados.
