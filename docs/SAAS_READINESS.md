# Preparación para una futura versión SaaS

## Lo que ya está preparado

- Todas las entidades clínicas sincronizadas conservan `user_id` y RLS owner-only.
- La allowlist administrativa separa autorización de cuenta y acceso a la bóveda local.
- La receta, nota final y addenda tienen identidad, integridad y trazabilidad independientes.
- Documentos y recuperación de llave ya usan cifrado del lado cliente.
- No existe registro público; el producto actual sigue siendo de un solo propietario.

## Evolución requerida antes de autorizar terceros

1. Introducir `organizations`, `memberships` y roles por tenant sin reemplazar todavía `user_id`.
2. Migrar RLS de propietario a membresía activa, con pruebas negativas entre organizaciones.
3. Añadir invitaciones verificadas, MFA/AAL2, recuperación administrativa limitada y offboarding.
4. Usar llaves de datos por organización/usuario, rotación, revocación y recuperación auditada.
5. Separar propietario clínico, médico, asistente y solo lectura con mínimo privilegio.
6. Incorporar consentimiento, retención, exportación, borrado conforme a política, auditoría y respuesta a incidentes.
7. Agregar límites/cuotas, facturación, soporte y acuerdos contractuales aplicables antes de vender el servicio.

No se debe habilitar signup público reutilizando únicamente `app_authorized_users`. Esa tabla es adecuada para el modo personal actual, no sustituye un modelo multi-tenant.
