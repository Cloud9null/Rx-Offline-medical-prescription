# Rx Offline V2.3 — Cloud Final

## Cambios
- Perfil médico: universidad predeterminada/migrada a `Universidad del Valle de Mexico`.
- Domicilio profesional predeterminado/migrado a `Heron Ramirez #680, Reynosa Tamaulipas C.P 88630. MEX`.
- Supabase Auth por email/password.
- Sincronización multi-dispositivo de pacientes y recetas.
- Registro de múltiples claves públicas por usuario/dispositivo.
- Backend real para QR de autenticidad.
- Token opaco aleatorio de 192 bits para verificación.
- Token colocado en fragmento URL para reducir exposición en logs de Vercel.
- Verificador consulta Supabase mediante RPC exact-token; no permite listar registros.
- Verificador comprueba firma, SHA-256, clave registrada y estado vigente/anulado.
- RLS owner-only para información clínica autenticada.
- Recetas cloud inmutables salvo anulación.
- QR de receta reducidos para liberar más espacio a la prescripción.
- La bóveda IndexedDB local continúa operando offline.

## Compatibilidad
Las recetas V2.2.1 existentes siguen disponibles localmente. Tras configurar Supabase y sincronizar, al volver a imprimir/compartir una receta se puede utilizar el nuevo QR backend corto. PDFs antiguos conservan su QR autocontenido anterior.
