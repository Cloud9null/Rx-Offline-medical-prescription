# Asistente clínico e IA

## Dos modos

**Local:** reconoce etiquetas como `MC`, `PA`, `EF`, `Impresión`, `Plan`, `Alarmas` y `Seguimiento`; reordena solo lo escrito y no transmite datos.

**Externo opcional:** exige consentimiento por solicitud. El cliente elimina identificadores estructurados y `/api/clinical-note` valida la sesión, usa JSON estricto, `store:false` y una instrucción de no inventar hallazgos, diagnósticos, códigos o tratamientos.

## Salvaguardas

- Nunca finaliza, firma, diagnostica o prescribe automáticamente.
- Solo llena campos vacíos.
- La salida siempre es borrador y requiere revisión profesional.
- El payload no incluye nombre, fecha de nacimiento, teléfono, correo, CURP, folio, domicilio ni IDs; el usuario debe evitar identificadores en texto libre.

## Texto plano

La nota puede copiarse, descargarse como `.txt` o compartirse con mecanismos estándar. Sirve para interoperabilidad autorizada; no evade bloqueos, auditoría, DLP ni controles del EMR de terceros. Si el sistema institucional prohíbe pegar, debe usarse un flujo aprobado.

Antes de habilitar IA externa: evaluación de impacto/transferencia, aviso/base aplicable, contrato, retención, subencargados, acceso e incidentes.
