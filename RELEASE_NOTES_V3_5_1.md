# Rx Offline EMR V3.5.1 — Face ID para Safari/PWA

## Corrección

- El alta biométrica ya no encadena `navigator.credentials.create()` y `navigator.credentials.get()` bajo un solo toque.
- Si Safari devuelve PRF durante el alta, se usa ese resultado y la configuración termina en una sola ceremonia.
- Si Safari requiere una segunda ceremonia, la interfaz muestra **Completar con Face ID** para obtener una nueva activación del usuario.
- Las solicitudes de desbloqueo declaran `transports: ["internal"]` para dirigir WebKit al autenticador integrado del iPhone.
- Si PRF no está disponible, `largeBlob` sigue siendo el fallback cifrado y se completa en una ceremonia separada.
- Cancelar una configuración pendiente conserva el PIN y cualquier configuración biométrica previa.

## Seguridad

- La llave maestra nunca se persiste sin cifrar.
- Una configuración pendiente solo conserva el identificador de la passkey y metadatos no secretos en memoria.
- Bloquear la bóveda elimina inmediatamente la configuración pendiente de memoria.
- El PIN permanece disponible como recuperación local.

## Validación

- Prueba E2E con un comportamiento tipo Safari: el primer toque crea la passkey sin ejecutar una segunda ceremonia; el segundo toque completa PRF, valida `transports: ["internal"]`, prueba el desbloqueo y vuelve a abrir la bóveda.
- La validación final de Face ID requiere el iPhone físico desde la PWA instalada en el dominio correspondiente.
