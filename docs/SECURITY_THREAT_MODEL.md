# Modelo de amenazas y privacidad

| Amenaza | Control |
|---|---|
| Lectura del almacenamiento local | Bóveda AES-256-GCM; llave aleatoria envuelta por PBKDF2 |
| Robo de documentos cloud | E2EE previo al upload; bucket privado; RLS por UID; SHA-256 |
| Compromiso de contraseña | Se requiere además el código de recuperación |
| Robo del código aislado | El sobre solo se lee con sesión del propietario y está ligado al UID |
| Manipulación/edición silenciosa | Snapshot, SHA-256, ECDSA, final inmutable y addenda |
| IDOR/BOLA | RLS owner-only y RPC invoker |
| Bóveda vacía sobre nube | Bootstrap remoto obligatorio |
| Conflicto de finales | Ambos se preservan para revisión |
| XSS | Escape de campos y CSP |
| Secreto de IA | Solo server-side; endpoint exige sesión |
| Transferencia excesiva a IA | Opt-in, minimización, `store:false`, salida estricta |
| Desconexión | Local-first, cola y backoff |
| Telemetría | Sin analytics/CDN; no se registran prompts |

## Riesgos residuales

- Metadatos clínicos en tablas tienen Auth/RLS pero no E2EE por campo; archivos y paquete privado sí.
- La sesión legacy usa `localStorage`; un origen/navegador comprometido puede extraer tokens.
- Un equipo desbloqueado o con malware puede leer memoria.
- El token QR de receta es portador.
- El texto libre enviado voluntariamente a IA puede contener identificadores escritos por el usuario.
- Vercel, Supabase y el proveedor de IA requieren evaluación contractual y de privacidad.
- Biometría depende de WebAuthn PRF; el PIN es fallback.

## Antes de producción

Validar Preview en dos dispositivos con datos sintéticos; activar MFA y protección de contraseñas filtradas; aprobar aviso, ARCO, retención e incidentes; habilitar IA solo tras evaluación; revisar RLS, grants, dependencias y logs sanitizados.

Las advertencias Advisor restantes son de RPC legacy `SECURITY DEFINER` y protección de contraseñas filtradas desactivada. No se amplió acceso en esta entrega; `verify_prescription` conserva su contrato público por token.
