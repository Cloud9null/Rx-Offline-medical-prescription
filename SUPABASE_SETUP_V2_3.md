# Rx Offline V2.3 — Conectar Supabase

Esta versión conserva la bóveda local cifrada y añade sincronización cloud + verificador público respaldado por Supabase.

## 1. Crear el proyecto Supabase
1. Entra a Supabase y crea un proyecto nuevo.
2. Usa una contraseña fuerte para la base de datos y guárdala en tu password manager.
3. No reutilices el proyecto de producción de otro sistema.

## 2. Crear las tablas, RLS y verificador
En Supabase abre **SQL Editor** y ejecuta completo:

`supabase/001_rx_offline_cloud.sql`

El script crea:
- `profiles`
- `patients`
- `physician_keys`
- `prescriptions`
- `prescription_verifications`
- RLS owner-only
- reglas de inmutabilidad de receta emitida
- RPC pública `verify_prescription(token)`

El rol `anon` NO recibe lectura directa de las tablas. Solo puede ejecutar la función de verificación con un token opaco exacto.

## 3. Crear tu usuario
En **Authentication -> Users**, crea manualmente tu propio usuario con email + contraseña.

Para uso personal es más seguro no depender de registro público de usuarios desde la aplicación.

## 4. Copiar URL y publishable key
En Supabase, abre la sección **Connect / Project Settings / API** (el nombre puede variar) y copia:
- Project URL, por ejemplo `https://abcdefgh.supabase.co`
- Publishable key (o anon key en proyectos que todavía usan ese nombre)

NO uses `service_role`.

## 5. Configurar la PWA
Edita `supabase-config.js`:

```js
window.RX_SUPABASE_CONFIG = {
  url: 'https://TU-PROYECTO.supabase.co',
  publishableKey: 'TU_PUBLISHABLE_KEY'
};
```

La URL y publishable key no son secretos administrativos; la seguridad de datos depende de grants + RLS. Nunca pongas la service-role key en frontend.

## 6. Commit a GitHub
Sube/reemplaza todos los archivos del paquete V2.3 en la raíz de tu repo y haz commit, por ejemplo:

`Rx Offline V2.3 Supabase final`

Vercel hará redeploy automático.

## 7. Primer inicio
1. Abre la PWA actualizada.
2. Desbloquea tu bóveda local.
3. Ve a **Ajustes -> Supabase · sincronización multi-dispositivo**.
4. Inicia sesión con el usuario creado en Supabase.
5. Pulsa **Sincronizar ahora**.

La primera sincronización sube tus pacientes/recetas actuales y registra la clave pública del dispositivo.

## 8. Otro teléfono
1. Abre la misma PWA en el segundo teléfono.
2. Crea una bóveda local nueva para ese dispositivo.
3. Inicia sesión con la MISMA cuenta de Supabase.
4. Pulsa **Sincronizar ahora**.
5. Los pacientes y recetas cloud se copiarán a la nueva bóveda local.

Cada dispositivo puede tener su propia clave de firma. El backend conserva un registro de múltiples claves públicas/fingerprints por médico para que recetas antiguas sigan verificando después de cambiar de dispositivo.

## 9. QR de autenticidad
Cuando una receta queda registrada en Supabase, el segundo QR pasa a ser corto:

`verify.html#t=<token-opaco-aleatorio>`

El fragmento `#t=...` no se envía a Vercel como parte de la petición HTTP. El navegador entrega el token directamente a Supabase para consultar la RPC.

El verificador confirma:
- que el token existe en el backend
- estado vigente/anulado
- contenido canónico original
- SHA-256
- firma ECDSA P-256
- que la clave pública/fingerprint está registrada para la cuenta médica

## Privacidad del verificador
Quien posea el QR/token puede abrir el contenido de verificación de esa receta. El token tiene alta entropía y no puede enumerarse de forma práctica, pero funciona como un enlace portador (bearer link).

La función pública NO permite listar recetas y el rol `anon` no tiene SELECT directo sobre las tablas.

## Datos en Supabase
La bóveda local sigue cifrada en el dispositivo. Para sincronización multi-dispositivo, los datos clínicos sincronizados sí existen en Postgres detrás de Auth + RLS. Esta V2.3 no implementa cifrado end-to-end de cada campo antes de subirlo.

Mantén backups cifrados locales incluso después de activar Supabase.
