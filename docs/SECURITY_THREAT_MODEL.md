# Modelo de amenazas y privacidad

| Amenaza | Control |
|---|---|
| Lectura del almacenamiento local | Bóveda AES-256-GCM; llave aleatoria envuelta por PBKDF2 |
| Robo de documentos cloud | E2EE previo al upload; bucket privado; RLS por UID; SHA-256 |
| Compromiso de contraseña | Se requiere además el código de recuperación |
| Robo del código aislado | El sobre solo se lee con sesión del propietario y está ligado al UID |
| Manipulación/edición silenciosa | Snapshot, SHA-256, ECDSA, final inmutable y addenda |
| IDOR/BOLA | RLS owner-only y RPC invoker |
| Persona con solo el enlace de Vercel | Gate de cuenta, allowlist RLS y ausencia de registro público; después PIN/biometría local |
| Sesión perdida o equipo remoto | Inventario owner-only, IP enmascarada, revocación individual/masiva y validación periódica de sesión activa |
| Bóveda vacía sobre nube | Bootstrap remoto obligatorio |
| Conflicto de finales | Ambos se preservan para revisión |
| XSS | Escape de campos y CSP |
| Secreto de IA | Solo server-side; endpoint exige sesión y allowlist del propietario |
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
- Una revocación remota no puede borrar la bóveda de un equipo offline. Al volver a conectarse, la app comprueba la sesión; hasta entonces la protección efectiva es el cifrado local y su PIN/biometría.
- Los archivos estáticos de una PWA son públicamente descargables; la protección cubre acceso funcional, datos y API, no pretende ocultar el código cliente.

## Antes de producción

Validar Preview en dos dispositivos con datos sintéticos; activar MFA y protección de contraseñas filtradas; aprobar aviso, ARCO, retención e incidentes; habilitar IA solo tras evaluación; revisar RLS, grants, dependencias y logs sanitizados.

Las advertencias Advisor restantes incluyen RPC legacy y los nuevos RPC de sesión `SECURITY DEFINER`, además de protección de contraseñas filtradas desactivada. Los RPC de sesión necesitan inspeccionar `auth.sessions`, fijan `search_path=''`, validan `auth.uid()` y la allowlist, niegan ejecución a `anon/public` y nunca devuelven datos clínicos. `verify_prescription` conserva su contrato público por token.
