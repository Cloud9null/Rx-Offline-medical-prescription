# Modelo de amenazas y privacidad

## Activos

PHI, antecedentes, notas, documentos, recetas, firma manuscrita, clave privada ECDSA, tokens de sesión y tokens públicos de verificación.

## Controles implementados

| Amenaza | Control |
|---|---|
| Lectura casual del almacenamiento local | Bóveda AES-256-GCM; clave aleatoria envuelta por PBKDF2; IV único |
| Manipulación de nota final | Snapshot canónico + SHA-256 + ECDSA; verificación con JWK original |
| Edición silenciosa | Estado final inmutable + addendum firmado + trigger DB |
| IDOR/BOLA | RLS owner-only con `(select auth.uid())=user_id`; RPC invoker |
| Enumeración pública | Sin SELECT anon; verificador Rx por token de alta entropía; EMR nunca se publica |
| Bóveda vacía destruye nube | Bootstrap remoto obligatorio antes de escribir |
| Conflicto de notas finales | No LWW; ambas versiones se preservan y se marca revisión manual |
| XSS en campos clínicos | Escape antes de renderizar; CSP; sin HTML clínico arbitrario |
| Pérdida por desconexión | Guardado local primero, cola persistente y backoff |
| Fuga por telemetría | Sin analytics, fuentes/CDN o IA de terceros |

## Riesgos residuales

- Supabase recibe PHI en JSON detrás de Auth/RLS. No hay E2EE cloud por campo en esta fase.
- La sesión legacy está en `localStorage`; una XSS en el mismo origen podría extraer tokens.
- Un dispositivo desbloqueado o comprometido puede leer la bóveda en memoria.
- El QR/token de receta es un enlace portador y muestra el contenido canónico de esa receta a quien lo posee.
- Los adjuntos locales aumentan el tamaño del ciphertext y requieren comprobar cuotas del navegador.
- Vercel/Supabase son encargados/proveedores externos; ubicación, subencargados y contratos deben evaluarse en el aviso de privacidad y análisis jurídico.

## Recomendaciones antes de producción

1. Completar la validación manual del Preview en dos navegadores/dispositivos con datos sintéticos.
2. Migrar tokens a almacenamiento protegido por la bóveda sin forzar logout ni impedir recuperación.
3. Diseñar E2EE cloud con clave maestra recuperable y ceremonia segura multi-dispositivo.
4. Activar MFA y protección de contraseñas filtradas; revisar periódicamente los grants de RPC legacy.
5. Definir aviso de privacidad, responsable, procedimiento ARCO, respuesta a incidentes y contrato con encargados.

Las migraciones compartidas ya pasaron RLS/grants, identidad owner y una identidad sintética ajena. Las advertencias Advisor restantes sobre RPC legacy son conocidas: `verify_prescription` debe ser público por token portador y los RPC Rx autenticados conservan el contrato existente; no se cambiaron en este release.
