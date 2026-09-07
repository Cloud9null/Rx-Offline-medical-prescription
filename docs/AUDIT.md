# Auditoría inicial — 7 septiembre 2026

## Fuente de verdad

- Repositorio: `Cloud9null/Rx-Offline-medical-prescription` (privado).
- `main` verificada: `3ba287db255cac4e1b0589229027ba7bcec6b373`.
- Árbol Git: `17f2ef7f1170cc00db1787ce4f2c527f041a0a7e`.
- Rama de trabajo: `feat/emr-integrado-v3`, creada desde el SHA anterior.
- Producción no modificada: `https://rx-offline-medical-prescription.vercel.app`.
- Supabase: `Expediente Medico v1`, ref `aqugdzqvfqrbvzjqdoef`, `ca-central-1`, Postgres 17, estado `ACTIVE_HEALTHY`.

## Inventario y contratos congelados

| Área | Implementación observada | Contrato preservado |
|---|---|---|
| Bóveda | IndexedDB `rxOfflineV2`, stores `meta` y `vault` | No se cambia nombre, versión ni se borra IndexedDB |
| Cifrado local | AES-GCM 256; IV aleatorio de 12 bytes por escritura | Se reutiliza para todo el objeto `vault.emr` |
| KDF | PBKDF2-SHA-256, salt aleatorio 16 bytes, 250,000 iteraciones | Parámetros existentes preservados |
| Biometría | WebAuthn PRF + HKDF-AES para envolver clave de bóveda | No se rota ni reemplaza credencial |
| Firma | ECDSA P-256/SHA-256; JWK privada cifrada en bóveda | Recetas y notas verifican con la clave pública guardada en cada sello |
| Receta canónica | `canonicalPayload()` v1 | No agrega `encounterId`, `noteId` ni otros bytes |
| QR cédula | URL SEP exacta | Se mantiene en receta electrónica y manual |
| QR autenticidad | paquete offline o token cloud opaco | No expone notas/diagnósticos del EMR |
| Historial | `renderHistory`, `openRecipe`, `verifyRecipeFixed` | Funciones presentes y conservadas |
| Impresión Rx | 8.5 × 5.5 pulgadas horizontal | CSS y compositor sin reemplazo genérico |
| Manuales | 2 medias cartas por carta, folios independientes, solo QR SEP | Módulo y log local preservados |
| PWA | service worker cache-first same-origin | Cache versionada; no toca IndexedDB |
| Backup | exporta `meta` + ciphertext de bóveda | EMR queda incluido automáticamente dentro del ciphertext |

## Supabase observado

Tablas existentes: `profiles`, `patients`, `physician_keys`, `prescriptions`, `prescription_verifications`; todas con RLS habilitada. RPC: `rx_sync_bundle`, `rx_cloud_healthcheck`, `verify_prescription`.

Hallazgos:

- Las RPC existentes son `SECURITY DEFINER`; tienen `search_path` fijado y `auth.uid()` en su lógica, pero el Security Advisor recomienda revisar/restringir su ejecución.
- `verify_prescription` es ejecutable por `anon` por diseño de token portador.
- El Performance Advisor detecta políticas que usan `auth.uid()` sin `(select auth.uid())` e índice compuesto faltante en una FK de `prescriptions`.
- Protección de contraseñas filtradas está desactivada.
- La sincronización histórica usa LWW para pacientes y recetas inmutables por `do nothing` + transición a `void`.
- Una bóveda nueva podía enviar un perfil vacío antes de recuperar nube. V3 hace bootstrap de solo lectura antes de cualquier escritura cuando la bóveda está vacía.
- La sesión Supabase se persiste en `localStorage`. Se mantiene por compatibilidad en este PR y queda como riesgo pendiente.

## Decisión arquitectónica

No se migra a React/Next.js en esta fase. La aplicación es una PWA estática pequeña pero el motor clínico/criptográfico está estrechamente acoplado a `app.js`; una reescritura elevaría el riesgo sobre recetas reales. V3 usa `emr-core.js` (dominio puro) y `emr.js` (UI/adaptador) conectados por una API mínima, preservando `app.js` como fallback.
