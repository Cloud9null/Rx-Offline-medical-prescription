# Rx Offline EMR V3.3 — sesiones y PWA refinada

## Acceso y credenciales

- La interfaz aclara que el gate usa la contraseña de Supabase Auth ya utilizada para sincronización.
- El PIN/contraseña de la bóveda sigue siendo distinto, local y nunca se envía a Supabase.
- Face ID/Touch ID continúa como desbloqueo WebAuthn PRF cuando el navegador y el autenticador lo permiten.

## Dispositivos y sesiones

- Nuevo panel en **Ajustes → Dispositivos y sesiones** con plataforma, navegador, creación, última actividad y red parcialmente enmascarada.
- Revocación individual de sesiones remotas.
- Cierre de todas las demás sesiones conservando la actual.
- Desautorización del dispositivo actual sin borrar la bóveda cifrada.
- Comprobación online periódica y previa a cada sincronización/uso de IA.

La migración aditiva `manage_owner_sessions` usa `auth.sessions` sin exponerla directamente: los RPC exigen `authenticated`, validan el UID y la allowlist, no permiten eliminar la sesión actual mediante el RPC individual y niegan ejecución anónima.

## PWA y compatibilidad

- Safe areas de iPhone corregidas para evitar que el encabezado del gate quede bajo la barra de estado.
- Liquid Glass progresivo en PWA iOS mediante blur, saturación y brillo deslizante.
- Fallback sin dependencia de WebKit para Android, Chrome/Edge en Windows y navegadores sin `backdrop-filter`.
- Animaciones desactivadas si el sistema solicita movimiento reducido.

## Validación

- Migración probada dentro de transacción y aplicada al proyecto Supabase existente, sin proyecto ni costo adicional.
- Lectura anónima del RPC: denegada.
- Revocación de UUID inexistente/ajeno: sin efecto.
- Pruebas unitarias/contratos locales: 30/30.
- E2E Chromium y Preview: se registran en el PR final.
