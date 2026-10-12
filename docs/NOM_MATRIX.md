# Matriz normativa preliminar (México)

Revisión técnica ampliada el 8 de octubre de 2026. Es una matriz de ingeniería, no certificación ni dictamen jurídico.

| Requisito | Campo/flujo V3 | Prueba | Fuente oficial | Brecha |
|---|---|---|---|---|
| Identificación del paciente: nombre, edad y sexo | Paciente único; edad calculada a la fecha de atención; snapshot | E2E clínico + unit edad | NOM-004-SSA3-2012, 5.9: https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787 | Validar política para sexo no registrado |
| Datos generales: tipo, nombre y domicilio del establecimiento; domicilio del paciente | Captura de tipo, nombre y domicilio en perfil, domicilio del paciente y snapshot firmado de notas nuevas; se exigen antes de finalizar | Unit snapshot y validación antes de firmar | NOM-004, 5.2, misma fuente | Datos declarados por el profesional; requiere verificar que coincidan con el establecimiento real. Notas anteriores conservan sus snapshots. |
| Fecha, hora, autor y firma | `occurredAt`, autor del perfil, `seal.signedAt`, ECDSA | Unit canonical + E2E finalización | NOM-004, 5.10, misma fuente | ECDSA de la app no se declara FIEL/e.firma |
| Evolución/cuadro, vitales si procede, resultados, diagnósticos, pronóstico, tratamiento | Secciones de nota, vitales, órdenes/resultados y diagnósticos | E2E clínico | NOM-004, 6.2.1–6.2.6 | Plantillas especializadas posteriores |
| Interconsulta/referencia | Tipo `referral`, plan y campo referencia | Test de modelo/tipo | NOM-004, 6.3 y 6.4 | No cubre traslado hospitalario completo |
| Conservación mínima de 5 años desde último acto | No hay eliminación ordinaria de finales; FK `restrict` | Test SQL sin cascade | NOM-004, 5.4 | Falta job/política organizacional de retención y archivo |
| Confidencialidad y acceso limitado | Bóveda cifrada, bloqueo, Supabase Auth/RLS | Test estático/RLS | NOM-004, 5.4; NOM-024, 3.1 | Requiere controles operativos del consultorio |
| Respaldo y recuperación con confidencialidad | Documentos E2EE, sobre de llave separado y código no custodial | Unit E2EE + restauración manual | NOM-024, 6.6.1; LFPDPPP art. 18 | Metadatos tabulares aún dependen de Auth/RLS y controles del proveedor |
| Integridad, disponibilidad, trazabilidad y no repudio | Firma/hash, audit events, backup, cola | Unit + regresión + restore plan | NOM-024-SSA3-2012, 6.6.1: https://dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30/11/2012 | No equivale a evaluación de conformidad NOM-024 |
| Autenticación y autorización por roles | Auth + owner RLS | SQL con dos usuarios | NOM-024, 6.6.3–6.6.4 | Producto personal solo implementa rol médico propietario |
| Datos de salud como sensibles y minimización | Campos pertinentes, sin analytics; IA local por defecto y externa solo opt-in | Revisión de UI/CSP | LFPDPPP arts. 2, 5, 8, 12, reforma DOF 14-11-2025: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf | Aviso/consentimiento operativo pendiente |
| Asistencia automatizada en documentación | Modo local por defecto; IA externa opt-in, pseudonimizada y siempre borrador | Unit payload + revisión manual | LFPDPPP arts. 12 y 18, misma fuente | Requiere evaluación de impacto/proveedor y no sustituye responsabilidad profesional |
| Medidas administrativas, físicas y técnicas | Controles técnicos + modelo de amenazas | Security review | LFPDPPP art. 18; Reglamento arts. 52 y 57: https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LFPDPPP.pdf | Requiere análisis de riesgos, contratos, capacitación e incident response |
| Marco para SIRES | Arquitectura documentada e intercambio owner-scoped | Revisión técnica | LGS art. 109 Bis: https://www.diputados.gob.mx/LeyesBiblio/pdf/LGS.pdf | Certificación/evaluación externa no realizada |
| Interoperabilidad y documentos estructurados | Modelo clínico JSON y notas inalterables tras firma | Prueba de snapshot/firma | NOM-024, 6.3.1–6.3.4: https://dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30/11/2012 | Faltan interfaces y guías DGIS aplicables; JSON interno no equivale a interoperabilidad certificada. |
| Firma electrónica avanzada cuando corresponda | ECDSA interna de integridad con clave del profesional | Unit de firma | NOM-024, 6.6.2; NOM-004, 5.10, mismas fuentes | No es e.firma/FIEL ni acredita por sí misma firma electrónica avanzada bajo el marco aplicable. |
| Exportación y consentimientos para intercambio | Texto/PDF clínico y consentimientos en expediente | Revisión de UI | NOM-024, 6.6.6, misma fuente | Sin exportación en Guías/Formatos DGIS, y el consentimiento no gobierna aún cada operación de intercambio. |

## Límites

Agregar campos no acredita conformidad. Antes de usar el EMR como sistema institucional se necesita validación por responsable sanitario/asesoría jurídica, aviso de privacidad vigente, políticas de retención/ARCO/incidentes, evaluación de proveedores y, cuando aplique, procedimiento formal de evaluación de conformidad.

