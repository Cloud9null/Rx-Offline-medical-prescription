# Clinovyra: comparación y ruta hacia un SaaS clínico

Revisión: 9 de octubre de 2026. Fuentes: páginas oficiales de los proveedores y normas/DGIS. Las descripciones comerciales son capacidades que cada proveedor declara, no una auditoría independiente. Esta matriz guía el producto; no es dictamen de conformidad ni autorización para comercializarlo.

## Qué existe hoy

Clinovyra personal: paciente longitudinal, antecedentes/alergias, consulta y nota final firmada con addenda, vitales, diagnósticos, órdenes, documentos cifrados, receta firmada/QR, recetas manuales por lote, impresión, asistente local/IA externa consentida, bóveda offline, recuperación cifrada, sincronización Supabase por propietario, web/PWA y shells Android/iOS/Windows. La comparación usa el código y las pruebas del repositorio; no se han completado pruebas físicas ni certificación. Los metadatos clínicos sincronizados no son E2EE por campo.

## Productos de referencia

| Referencia y fuente oficial | Fortaleza observable | Qué incorporar a Clinovyra | Qué no copiar literalmente |
|---|---|---|---|
| [athenahealth athenaOne](https://www.athenahealth.com/resources/blog/athenaone-athena-clinicals-collector-communicator) y [actualización 2026](https://www.athenahealth.com/resources/blog/automatic-ehr-updates-athenaone-spring-2026) | Expediente, órdenes y gestión de práctica/ingresos conectados; interoperabilidad, comunicación con pacientes y automatización administrativa. | Agenda, tareas y seguimiento; panel operativo simple; integración de resultados y portal. | Facturación/reclamaciones de EE. UU. y reglas de pagadores estadounidenses. |
| [Practice Fusion](https://www.practicefusion.com/unique-ehr-solutions/), [e-prescribing](https://www.practicefusion.com/electronic-prescribing/) | Plantillas personalizables, órdenes de laboratorio/gabinete, portal y verificaciones de alergias/interacciones declaradas. | Plantillas por especialidad, órdenes/resultados, reconciliación de medicamentos, revisión clínica graduada y catálogos validados. | Conexión a farmacias, EPCS o formularios de EE. UU. sin convenios y autorización mexicanos. La revisión textual actual no equivale a un motor de interacciones. |
| [Praxis EMR](https://www.praxisemr.com/praxis-ai-ehr-features.html) | Documentación flexible, adaptable al estilo del médico y captura asistida, con poco peso de plantillas rígidas. | Texto libre más secciones estructuradas mínimas, favoritos del profesional, dictado asistido bajo consentimiento y revisión humana antes de firmar. | Aprendizaje automático sobre datos de pacientes sin gobernanza, consentimiento y evaluación de privacidad. |
| [Medilink México](https://www.softwaremedilink.com/mx) | Ficha personalizable, evoluciones, recetas, documentos, agenda por profesional y pagos. | Agenda clínica y formularios por especialidad vinculados al expediente, manteniendo flujo de consulta sencillo. | Convertir la consulta en un sistema de menús de administración extensos. |
| [SaludTotal](https://saludtotal.mx/es/) | Portal paciente, agenda, receta integrada con un tercero, reportes y transcripción de consulta según el proveedor. | Portal mínimo con acceso selectivo, recordatorios consentidos y tablero de operación. | Prometer validación farmacéutica o precisión de IA sin servicio y evaluación propios. |
| [Luna Salud](https://www.lunasalud.mx/) y [expediente](https://www.lunasalud.mx/expediente-medico-electronico) | Agenda, ingresos/cobranza, transcripción asistida y bitácora clínica según el proveedor. | Consentimientos y trazabilidad de cada acceso, flujo de captura breve, pagos/facturación como módulo posterior. | Tratar la afirmación de cumplimiento de un proveedor como prueba de certificación de Clinovyra. |
| [Nimbo Clinical](https://www.nimbo-x.com/clinical) | Expediente en una pantalla, búsqueda, historia configurable y gráficas de signos vitales según el proveedor. | Resumen longitudinal visible y acceso al historial con menos saltos de pantalla; detección de duplicados antes de incorporar importaciones. | Mezclar ERP, inventario y marketing en la portada clínica personal. |

## Revisión de interfaz para la edición personal

Las páginas públicas de Medilink, Luna, SaludTotal y Nimbo permiten identificar sus flujos y algunas imágenes promocionales; no proporcionan acceso autenticado para medir sus pantallas internas ni sus tiempos de tarea. Estos criterios son decisiones de diseño derivadas de esa revisión y de la interfaz real de Clinovyra, no una copia de sus interfaces.

| Criterio | Cambio aplicado ahora | Próxima medición con datos sintéticos |
|---|---|---|
| Primer vistazo orientado a la consulta | Portada menos promocional, acciones directas de consulta y receta; pacientes, expediente e historial juntos. | ¿Se encuentra una consulta o receta en dos toques desde Inicio? |
| Receta original siempre visible | Talonario manual destacado en Inicio, con explicación breve de impresión offline. | Probar la vista previa y dos medias cartas en impresora real. |
| Jerarquía clínica | Tipografía, contraste, foco visible, áreas táctiles y paneles sobrios; el cristal se limita a controles y capas donde el texto sigue legible. | Revisar iPhone, Windows, alto contraste, zoom 200 % y movimiento reducido. |
| Datos y privacidad | Caché PWA restringida a archivos estáticos conocidos; API y rutas de verificación fuera de Cache Storage. | Inspeccionar almacenamiento del navegador, cierre de sesión, recuperación y revocación en equipo físico. |

La siguiente iteración personal debe resolver con pruebas clínicas: búsqueda de paciente duplicado, continuación de borradores, impresión y recuperación, estados de sincronización claramente distinguibles y ergonomía de la nota. Agenda de varios profesionales, portal, pagos y colaboración pertenecen a la fase comercial y requieren antes roles y aislamiento por consultorio.

## Brechas reales y orden de trabajo

| Prioridad | Resultado verificable | Estado |
|---|---|---|
| 0 · seguridad/arquitectura | Separar consultorios con `tenant_id`, membresías, roles mínimos, RLS por organización y pruebas de aislamiento; migrar propietario actual sin mezclar datos. | **Pendiente.** El backend actual es owner-only. No habilitar cuentas comerciales todavía. |
| 0 · emisión comercial | Receta solo después de nota final firmada del mismo paciente/encuentro; referencia a nota y hash dentro del contenido firmado; operación transaccional en servidor que valide vínculo y rol. | Política de cliente y pruebas agregadas; **servidor y firma vinculada pendientes**. El modo personal conserva receta directa y plantilla manual. |
| 0 · integridad y continuidad | Auditoría de accesos inalterable del lado servidor, respaldos probados, restauración, retención, borrado controlado, incidentes y revisión de dependencias. | Firma local/addenda/cola presentes; operación institucional pendiente. |
| 1 · seguridad clínica | Alergias activas, duplicidades y reconciliación de medicamentos con advertencias visibles; después integrar catálogo, interacciones, dosis, contraindicaciones y trazabilidad de anulaciones, validados clínicamente. | Coincidencia **textual** y suspensión auditada incorporadas; farmacología validada pendiente. |
| 1 · operación diaria | Agenda por profesional, estados de cita, recordatorios con consentimiento, tareas de resultados y seguimiento. | Pendiente. Diseñar sincronización multiusuario y colisiones antes de publicar agenda compartida. |
| 1 · expediente | Plantillas de especialidad configurables, problemas longitudinales, órdenes/resultados con estado y firma, importación/exportación conforme a las guías DGIS aplicables. | Núcleo de notas/órdenes existe; catálogos e intercambio formal pendientes. |
| 2 · colaboración | Portal paciente de mínimo privilegio, consentimientos vinculados a divulgación, mensajería, referencia/interconsulta y roles de recepción/enfermería. | Pendiente; requiere multi-tenant y autorización granular. |
| 2 · negocio | Suscripciones, facturación mexicana/CFDI y pagos con proveedor externo, reportes de ingresos. | A petición del propietario, después de validación clínica y normativa. |

## Modos y frontera de confianza

La instalación actual usa edición `personal`: receta directa digital y talonario manual siguen disponibles para el propietario. La función `validatePrescription` prueba la política futura de edición `saas`, pero una bandera en JavaScript **no es seguridad**. No cambiar simplemente `edition` para ofrecer el SaaS. El backend comercial debe rechazar cualquier receta sin nota final del mismo paciente/encuentro, verificar firma/rol/tenant y guardar nota, vínculo y receta de forma atómica. El QR y el historial deberán incluir el hash de la nota en la carga firmada; las recetas personales antiguas mantienen su formato y validez histórica.

El verificador QR público necesita revisión de minimización: hoy un QR autocontenido puede transportar datos de paciente. Antes del SaaS, emitir únicamente un token aleatorio y recuperar una vista pública mínima desde el servidor con caducidad/revocación y límites de consulta.

## Webapp y apps

**Recomendación: mantener la webapp clínica** para escritorio, tablet, recepción y pruebas tempranas; las apps nativas reutilizan el flujo y capacidades del sistema operativo. No se necesita una landing page para que funcione el EMR. Se podría retirar la interfaz de navegador en un producto solo de apps, pero seguirían siendo necesarios API, autenticación, sincronización, verificador y consola administrativa. Para un SaaS la versión web reduce fricción de uso y despliegue; se protege con autenticación, MFA/passkeys, roles/RLS, CSP, bloqueo y controles de dispositivo. Una web pública no significa expedientes públicos.

Flujo de entrega: commit → preview Vercel → CI web y prueba con datos sintéticos → revisión clínica/seguridad → etiqueta `native-ready` en el PR (o ejecución manual cuando esté disponible en la rama predeterminada) → compilación nativa → pruebas físicas → firma release. Los builds Android/iOS/Windows no se disparan automáticamente por cada cambio de la web.

## Marco mexicano

La [NOM-004-SSA3-2012](https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787) rige la integración, conservación y confidencialidad del expediente. La [NOM-024-SSA3-2012](https://dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30/11/2012) trata SIRES e intercambio; la [DGIS publica el proceso de certificación](https://www.dgis.salud.gob.mx/contenidos/intercambio/certificacion-nom-024-ssa3-2012.html). Completar una lista de funciones no acredita conformidad. Antes de comercializar se requieren evaluación técnica y jurídica, operación documentada, pruebas de interoperabilidad aplicables, protección de datos, seguridad y evidencia de conformidad de la versión evaluada.
