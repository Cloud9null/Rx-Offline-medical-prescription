# Rx Offline V2.3.8 — Receta manual de contingencia

## Nueva función
Después de desbloquear la bóveda, Inicio incluye **Receta manual de contingencia**.

Genera una hoja tamaño carta (8.5 × 11 in) con **dos recetas media carta (8.5 × 5.5 in)**, una arriba y otra abajo, listas para recortar y llenar a mano.

## La plantilla incluye
- Membrete y logo actualmente seleccionados.
- Nombre, especialidad, cédula, universidad y domicilio del médico.
- Campo de fecha.
- Paciente.
- Fecha de nacimiento.
- Edad.
- Sexo F / M.
- Alergias.
- Área amplia rayada para prescripción manuscrita.
- Área para firma manuscrita.
- Únicamente QR para verificar cédula profesional.
- Línea central de corte.

## Intencionalmente NO incluye
- QR de autenticidad digital de receta.
- Token Supabase de receta.
- Hash o firma ECDSA de receta.
- Folio digital.
- Registro en historial.

Es una plantilla física para contingencia y debe llenarse y firmarse a mano.

## Archivos modificados
- app.js
- index.html
- styles.css
- sw.js
