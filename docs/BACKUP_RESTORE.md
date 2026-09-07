# Backup, restauración y rollback

## Backup local cifrado

`Ajustes → Exportar respaldo` descarga `meta` y el ciphertext de la bóveda. V3 incluye todo `vault.emr` automáticamente. El archivo no contiene la clave en claro; requiere el PIN/contraseña original.

Prueba recomendada trimestral: exportar, abrir un perfil nuevo de navegador sin datos reales, importar, desbloquear, verificar una receta histórica y una nota final, y destruir el perfil de prueba.

## Rollback de aplicación

La fuente segura anterior es `main@3ba287db255cac4e1b0589229027ba7bcec6b373`. Como V3 no cambia IndexedDB ni re-firma recetas, volver al build anterior deja los datos `vault.emr` sin interpretar pero no los borra. No exportar/importar entre versiones sin conservar antes una copia cifrada.

## Rollback de base

La migración es aditiva y no debe revertirse eliminando tablas mientras existan notas. En staging se puede descartar la rama completa. En producción, deshabilitar primero el feature EMR, exportar y validar registros; cualquier retiro de tablas requiere plan de retención y aprobación explícita.
