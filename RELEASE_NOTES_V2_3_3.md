# Rx Offline V2.3.3 — Clinical Stable / Cloud Optional

## Objetivo
Mantener el flujo clínico local completamente funcional aunque Supabase no sincronice, sin eliminar la integración de nube para depuración posterior.

## Cambios
- Supabase Auth puede permanecer conectado, pero la sincronización de datos es manual.
- Se eliminó el autosync al abrir la app, recuperar conexión o guardar pacientes/recetas.
- Un fallo de nube no bloquea ni modifica pacientes, recetas, firma, historial, impresión/PDF o QR local.
- El badge principal permanece `Local`/`Offline` hasta que la capa de nube se estabilice.
- Los errores de sincronización indican la etapa/endpoint para facilitar diagnóstico posterior.
- IMPORTANTE: el Service Worker ahora SOLO cachea archivos del mismo origen. Nunca intercepta ni guarda respuestas de Supabase/terceros en Cache Storage. Esto evita cachear datos clínicos de la nube fuera de la bóveda cifrada.
- Nuevo membrete/monograma Rx más sobrio y premium.
- El logo de la receta ya NO muestra el nombre del tema (Teal, Midnight Gold, etc.). Muestra únicamente `Rx · MEDICAL`.
- Los temas siguen controlando colores y acentos de la receta.

## QR
- Si una receta NO está registrada en Supabase, el QR de autenticidad sigue usando el verificador criptográfico autocontenido local.
- Si posteriormente la sincronización cloud funciona y `cloudRegistered=true`, la app puede usar el token corto del backend.

## Importante
Esta release prioriza disponibilidad clínica local. Supabase es opcional y puede depurarse posteriormente sin bloquear la emisión.
