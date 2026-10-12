# Catálogo local CIE-10

Medivorix incorpora pares de código y descripción obtenidos de **INEGI, Lista de Causas CIE-10, 2025**, documento publicado en el material de las Estadísticas de Defunciones Registradas 2024. INEGI atribuye su contenido a OPS/OMS.

- Fuente: https://www.inegi.org.mx/rnm/index.php/catalog/1140/download/36625
- SHA-256 del PDF consultado: `208eb2e4dde88562e01dc71f11aed64f30a2fedd7d808e360680c3e65f8d9dc9`
- Extracción: `pdftotext -layout`; 10,067 pares de código y título, normalizados con punto después de los tres primeros caracteres y sin traducción clínica ni equivalencias inferidas.
- Alcance: es una **lista de causas**; no representa todo el catálogo de morbilidad ni contiene inclusiones, exclusiones y notas de codificación. El médico puede escribir un código o diagnóstico que no figure en la lista y debe revisar la codificación antes de firmar.
- Privacidad: la búsqueda opera dentro del dispositivo; no transmite términos ni datos de pacientes.

El archivo fuente no se distribuye dentro de la aplicación. La versión comercial debe revisar la licencia aplicable a su uso y distribuir su propio catálogo autorizado.

## Edición clínica adicional, separada: CIE-10-ES Diagnósticos 2026

La selección «España · CIE-10-ES 2026» procede de la **Tabla de Referencia, 6ª edición, enero de 2026**, publicada por el Ministerio de Sanidad de España. Es una modificación clínica de CIE-10 basada en ICD-10-CM, **no** el catálogo mexicano. Se conserva separada y se etiqueta junto al código en las notas nuevas.

- Fuente y manual: https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/
- Archivo original: https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/2026/Diagnosticos_Tabla_Referencia_CIE10ES_2026.xlsx
- SHA-256 del XLSX: `3695159d8f9a5a77e7ecdcee29657debbee4ed74b470a6d6143e99c80a5782fc`.
- Índice local: 101,520 códigos diagnósticos de la columna «Código», con texto literal de «Descripción» y marca «Nodo_Final»; se excluyeron 928 filas de capítulos y rangos que no son códigos individuales. 74,260 nodos figuran como finales. Archivo comprimido determinísticamente con gzip (`mtime=0`) para uso sin conexión; SHA-256: `b4512b3221da78cecc64c03916f3b2395b88aa1297a16116b9b94199e25fba5d`.
- Los resultados de búsqueda que son categorías no finales se muestran, pero no se pueden seleccionar. Los códigos previos sin procedencia explícita se mantienen atribuidos al catálogo mexicano para continuidad; una codificación histórica debe revisarse por el médico.
- El aviso legal del Ministerio permite reutilización con cita de fuente, fecha y sin desnaturalizar el contenido. Se conserva el texto español original y se señala la clasificación; para distribución comercial, revisar además derechos de terceros.

La OMS identifica 2019 como la última edición de su navegador ICD-10. CIE-10-ES 2026 es una **adaptación nacional más reciente**, no una edición OMS 2026 ni sustitución automática de la codificación mexicana. El catálogo mexicano CSV publicado en datos.gob.mx el 10 de marzo de 2026 quedó identificado como posible mejora posterior, pero la descarga devolvió HTTP 403 durante esta integración y no se añadió sin validación.
