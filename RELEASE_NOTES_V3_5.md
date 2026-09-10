# Rx Offline EMR V3.5 — biometría comprobable y Nota IA rápida

## Seguridad local

- Corrige el flujo que daba por configurado Face ID aun cuando WebAuthn no entregaba una clave PRF utilizable.
- Detecta autenticador de plataforma, prueba el acceso durante la configuración y muestra errores recuperables.
- Prefiere PRF y usa almacenamiento `largeBlob` protegido por la credencial cuando el navegador lo admite.
- Añade **Probar desbloqueo**, **Desactivar biometría** y **Bloquear ahora**. El PIN nunca se elimina.
- El desbloqueo espera todas las migraciones, preparación de documentos y validación de sesión antes de mostrar la app.

## Documentación clínica

- Nuevo espacio **Nota clínica rápida**, independiente de paciente, consulta y expediente.
- Estructuración 100% local o generación externa autenticada con consentimiento por intento y payload desidentificado.
- El borrador solo vive en memoria; al bloquear se limpia y no se sincroniza.
- Salida editable con modo de lectura grande, copia estándar, compartir, `.txt` e impresión/PDF.
- No contiene automatización de teclado ni mecanismos para evadir restricciones de software de terceros.
- Los borradores del expediente muestran un control no bloqueante de ocho elementos clínicos.

## Compatibilidad y validación

- PWA precachea el nuevo módulo.
- UI responsive con rail de escritorio, menú superior móvil, safe areas y Liquid Glass progresivo.
- 35/35 pruebas unitarias y contratos locales PASS.
- Ocho E2E sintéticos definidos; ejecución Chromium CI obligatoria antes de promoción.
- Sin migraciones ni cambios destructivos de Supabase.
