# Despliegue controlado

## Estado

- Rama: `feat/emr-integrado-v3`.
- Producción: `main` intacta.
- Supabase: mismo proyecto gratuito; cinco migraciones aditivas aplicadas.
- Storage: `rx-emr-private-v1`, privado, máximo 6 MB por JSON cifrado.
- Frontend/API: Preview de Vercel mediante el PR.

No se necesita una rama Supabase facturable. El uso queda sujeto a las cuotas del plan existente.

## Variables

Nunca incluir `service_role`, contraseña DB ni tokens administrativos en cliente o Git. Solo para IA externa, configura privadamente en Vercel:

```text
OPENAI_API_KEY=<secreto>
OPENAI_CLINICAL_MODEL=gpt-5-mini
```

Sin la llave, el asistente local funciona y el endpoint externo responde 503 sin perder el borrador.

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
