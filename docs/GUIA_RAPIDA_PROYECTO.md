# Clinovyra en 55 minutos: guía práctica para el propietario

Objetivo: entender un cambio, encontrar su archivo y revisar si llegó al preview, sin aprender un lenguaje completo. Usa siempre datos sintéticos al experimentar. La rama `main` es producción; `feat/clinovyra-native-emr` es la vista previa del PR.

## 1. El mapa en 5 minutos

```text
Tu dispositivo: interfaz + bóveda cifrada local
      ├─ Supabase: identidad, acceso, sincronización y almacenamiento privado
      └─ Vercel: archivos de la web, verificación QR y API opcional de IA
GitHub: código e historial → PR → pruebas automáticas → preview Vercel
```

Android/iOS/Windows empaquetan los mismos archivos de interfaz desde `native/build-web.mjs`; no necesitan descargar cada pantalla de Vercel. Sí pueden necesitar internet para iniciar sesión, sincronizar o verificar un QR. Cloudflare no participa en esta arquitectura.

## 2. Lee la interfaz (8 minutos)

Lee sólo la introducción de [HTML en MDN](https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content), [CSS en MDN](https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Styling_the_content) y [JavaScript en MDN](https://developer.mozilla.org/es/docs/Learn_web_development/Getting_started/Your_first_website/Adding_interactivity). Busca en el repositorio `manualTemplateBtn`: `index.html` crea el botón, `styles.css`/`emr.css` le dan apariencia y `app.js` responde al clic. **Ejercicio:** identifica esos tres sitios sin editar el código.

## 3. Comprende GitHub y el despliegue (10 minutos)

Haz el ejercicio de [Hello World de GitHub](https://docs.github.com/es/get-started/start-your-journey/hello-world) en un repositorio de prueba. Un **commit** es una versión identificable de cambios; una **rama** es una línea de trabajo; un **PR** solicita revisar y unir una rama con `main`; **merge** aplica esa unión. Vercel construye un **preview** independiente para el PR; sólo `main` publica la versión de producción. Lee la [guía de despliegues Git de Vercel](https://vercel.com/docs/git). **Ejercicio:** en el PR de Clinovyra abre *Files changed*, identifica el commit más reciente y compara la URL preview con la de producción.

## 4. Sigue un dato clínico (12 minutos)

`app.js` gestiona la bóveda, la receta y la impresión; `emr-core.js` valida modelos clínicos; `emr.js` maneja la consulta y la nota; `cloud.js` autentica y sincroniza; `secure-sync.js` cifra adjuntos y recuperación; `product-policy.js` distingue las reglas personales de las comerciales futuras. Supabase Auth identifica la cuenta; **RLS** (seguridad por filas) restringe qué registros puede leer o escribir. Lee [Auth](https://supabase.com/docs/guides/auth) y [arquitectura](https://supabase.com/docs/guides/getting-started/architecture). **Ejercicio:** sigue una receta nueva desde `rxForm` en `index.html` hasta el manejador de emisión en `app.js`; ubica el guard de política, la revisión de alergias y la llamada de guardado. Evita copiar datos reales en capturas o herramientas públicas.

## 5. Entiende las pruebas (8 minutos)

`npm test` ejecuta pruebas de reglas y funciones; Playwright abre un navegador automatizado y prueba flujos completos, como alta de paciente y receta. Lee el [inicio de Playwright](https://playwright.dev/docs/intro) y abre el [historial de Actions](https://docs.github.com/es/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows). **Ejercicio:** revisa en el PR el estado de *Checks*, abre un test en `tests/e2e/clinical-flow.spec.js` y traduce tres acciones a lenguaje cotidiano. Verde significa que esos casos pasaron; no prueba biometría ni impresoras físicas.

## 6. Revisa un cambio sin romper nada (12 minutos)

Abre el preview, crea **un paciente ficticio** y prueba: nueva consulta → borrador → nota final → receta → historial → impresión. Repite sin red el talonario manual con datos de prueba. Inspecciona el aspecto en móvil; en Windows Chrome, `Ctrl+Shift+C` abre el [inspector visual](https://developer.chrome.com/docs/devtools/inspect-mode?hl=es-419). Compara lo observado con *Files changed*. Nunca pruebes con expedientes reales en un preview cuyo acceso y permisos aún se están verificando.

### Diccionario de bolsillo

| Término | Significado aquí |
|---|---|
| Frontend | Pantallas y lógica que ejecuta tu navegador o app. |
| Backend / API | Servicio que valida solicitudes y devuelve datos; `api/clinical-note.js` es una función en Vercel. |
| Base de datos | Tablas de Supabase Postgres donde se sincronizan registros autorizados. |
| Auth / RLS | Identidad de la cuenta / regla de acceso a filas concretas. |
| Bóveda offline | Copia local cifrada disponible en el dispositivo autorizado. |
| PWA / service worker | Web instalable / script que guarda sólo la interfaz estática para uso sin red. |
| Build | Proceso que prepara archivos o paquetes ejecutables. |
| CI / GitHub Actions | Equipo automatizado que ejecuta pruebas y, cuando se indique, builds. |
| Preview / producción | URL temporal del PR / versión estable publicada desde `main`. |
| APK / IPA / EXE | Paquetes Android / iPhone / Windows; requieren pruebas y firmas para distribución. |

**Regla de revisión:** primero preview y pruebas web, después prueba clínica con datos ficticios, luego build nativo, prueba física y finalmente publicación. Un PR aprobado no equivale a certificación clínica.
