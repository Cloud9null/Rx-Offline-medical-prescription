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
- La web usa WebAuthn PRF/largeBlob donde esté disponible; Android/iOS usan credenciales protegidas por biometría fuerte en Keychain/Keystore. El PIN local es fallback. El EXE todavía no implementa Windows Hello nativo.
- Una revocación remota no puede borrar la bóveda de un equipo offline. Al volver a conectarse, la app comprueba la sesión; hasta entonces la protección efectiva es el cifrado local y su PIN/biometría.
- Los archivos estáticos de una PWA son públicamente descargables; la protección cubre acceso funcional, datos y API, no pretende ocultar el código cliente.
- La edición comercial aún no existe: la allowlist y RLS actuales son para un único propietario. Una política de recetas escrita solo en JavaScript se puede modificar; el SaaS necesita validación transaccional en servidor, roles/tenants y pruebas de aislamiento.
- La revisión de alergias actual identifica coincidencias textuales declaradas, no equivalencias farmacológicas, interacciones ni ajuste de dosis. Una ausencia de alertas no demuestra seguridad de una prescripción.

## Frontera exacta de cifrado

| Datos | Protección actual | ¿E2EE? |
|---|---|---|
| Bóveda completa en cada dispositivo | AES-256-GCM con llave envuelta por PIN o WebAuthn PRF | Sí, en reposo local |
| Documentos sincronizados | Cifrados en el navegador antes del upload; Storage recibe ciphertext | Sí |
| Llave privada de firma y recuperación | Sobre AES-GCM derivado del código de recuperación y ligado al UID | Sí |
| Pacientes, notas, signos vitales, diagnósticos y metadatos Rx sincronizados | HTTPS/TLS, Supabase Auth, grants y RLS por `user_id` | No por campo |
| Firma y QR de receta | ECDSA/SHA-256 para integridad y autenticidad; el verificador revela el contenido incluido en el token | No es cifrado |

Por lo tanto, el producto no debe anunciarse como E2EE integral. Convertir también las tablas clínicas a E2EE exige cifrado de campos en cliente, índices ciegos para búsquedas, llaves por organización y una migración controlada; además limita búsquedas, reportes e IA del lado servidor.

## Antes de producción

Validar Preview en dos dispositivos con datos sintéticos; activar MFA y protección de contraseñas filtradas; aprobar aviso, ARCO, retención e incidentes; habilitar IA solo tras evaluación; revisar RLS, grants, dependencias y logs sanitizados.

Las advertencias Advisor restantes incluyen RPC legacy y los nuevos RPC de sesión `SECURITY DEFINER`, además de protección de contraseñas filtradas desactivada. Los RPC de sesión necesitan inspeccionar `auth.sessions`, fijan `search_path=''`, validan `auth.uid()` y la allowlist, niegan ejecución a `anon/public` y nunca devuelven datos clínicos. `verify_prescription` conserva su contrato público por token.

