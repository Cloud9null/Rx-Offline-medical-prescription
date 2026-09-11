# Rx Offline EMR V3.5.2

## Seguridad local

- Permite cambiar el PIN o contraseña de una bóveda ya abierta desde **Ajustes → Bloqueo y biometría**.
- Exige el PIN actual, un valor nuevo de al menos ocho caracteres y confirmación.
- Reenvuelve la misma llave AES de la bóveda con PBKDF2 y una sal nueva; no vuelve a crear ni descifra permanentemente el expediente.
- Conserva datos clínicos, firma ECDSA, recuperación cifrada, relación con Supabase y biometría configurada.
- Si la comprobación o escritura falla, la protección anterior continúa vigente.
- Los respaldos descargados antes del cambio conservan su PIN original; los nuevos usan el PIN actualizado.

## Apariencia

- Añade un control visible para activar o desactivar el modo nocturno.
- Recuerda el último tema claro y el último tema oscuro.
- Separa visualmente las paletas claras de las nocturnas.
- Amplía la selección oscura a **Deep Clinic**, **Aurora Night**, **Obsidian Gold**, **Burgundy Noir**, **Emerald Night** y **Cobalt Noir**.

## Alcance

- No requiere migraciones de Supabase.
- No borra ni transforma pacientes, recetas, notas o documentos.
