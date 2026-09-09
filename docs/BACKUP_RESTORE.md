# Backup, recuperación y rollback

## Backup local

`Ajustes → Exportar respaldo` descarga metadatos y ciphertext de la bóveda. Incluye EMR, Rx, documentos presentes e identidad criptográfica; requiere el PIN original.

## Activar recuperación segura

1. Inicia sesión en Supabase y sincroniza.
2. En Seguridad, elige **Activar/renovar recuperación**.
3. Copia o descarga el código mostrado una sola vez y guárdalo fuera del dispositivo.
4. Confirma que lo guardaste. La app y Supabase no conservan el código en claro.

Renovar reemplaza el sobre anterior sin recifrar documentos.

## Recuperar en otro dispositivo

1. En el inicio elige **Recuperar bóveda de otro dispositivo**.
2. Introduce cuenta Supabase, código y un PIN local nuevo.
3. La app valida el sobre owner-only, reconstruye la llave en memoria y crea un nuevo envoltorio local.
4. Sincroniza y verifica una receta, una nota final y un documento antes de retirar el equipo anterior.

No envíes contraseña o código por chat. Si se pierde el código y no queda dispositivo desbloqueable ni backup, el contenido E2EE no es recuperable por diseño.

## Dominio y biometría

El PIN y el código siguen funcionando al cambiar de equipo. Face ID/Touch ID mediante WebAuthn está ligado al dominio y debe activarse otra vez al pasar de Preview al dominio definitivo.

## Rollback

La referencia anterior es `main@3ba287db255cac4e1b0589229027ba7bcec6b373`. V3.1 no re-firma recetas históricas. Las migraciones son aditivas: no elimines tablas, bucket u objetos mientras existan registros. Cualquier retiro requiere exportación, retención y aprobación.
