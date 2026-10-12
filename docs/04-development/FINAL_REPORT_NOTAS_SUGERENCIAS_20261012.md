# Notas y Sugerencias — 12/10/2026

## Resultado
PARCIAL en verificación funcional LIVE: la aplicación SQL y la publicación están completadas.
IMPLEMENTADO y TESTEADO; versión de código confirmada en PRODUCCIÓN.
No se declara verificado el flujo autenticado completo ni el arrastre físico.

## Resumen sencillo
El apartado existente se convierte en un tablero con Pendiente, En desarrollo,
Terminado y Rechazado. Empleados y jefes proponen; el administrador ordena y
cambia estados. El rechazo exige un motivo visible al autor. Hay controles de
subir/bajar y selector de estado para móvil y teclado, además de arrastre HTML5.

## Cambios realizados
- `notas.js` y `notas.css`: tablero, formulario, detalle, actualización, estados,
  orden, rechazo, mensajes de error y limpieza de sesión; móvil muestra cuatro
  pestañas en dos filas y una columna por estado.
- `api/suggestions.js` y `lib/suggestions.js`: sesión vigente, autor derivado del
  perfil del servidor, lectura propia/departamental/dirección, gestión admin-only,
  validación, paginación y proyección explícita.
- `shared.js`, `validacion.js`, `index.html` y `workflow-ui.js`: sustitución de los
  antiguos accesos REST a notas, entrada directa para administrador y contable,
  tablero compartido con revisión y limpieza de datos al salir.
- `supabase/changes/employee_notes_board.sql`: siete columnas, restricciones y RPC
  transaccional; orden y estados se guardan con versiones y bloqueo para evitar
  sobrescrituras concurrentes. Se conservan texto, autor, categoría y fecha.
- Acceso a `employee_notes` exclusivamente mediante la API: la propuesta retira
  DML directo de anon/authenticated y mantiene el acceso de servidor. La RPC es
  SECURITY INVOKER y ejecutable solo por service_role; vuelve a comprobar admin
  activo en la base de datos. No se confía en roles enviados por el navegador.
- Tests de API/cliente y scripts de PostgreSQL y vista local con datos ficticios.
  PGlite 0.5.9 se instaló en `/private/tmp`, sin dependencias nuevas en la aplicación.

## Comprobaciones
| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sintaxis completa | PASS | `node --run check`, Node 24.19.0 |
| Suite completa | PASS | 228 tests: 227 PASS, 0 FAIL, 1 E2E previa omitida |
| API/cliente de propuestas | PASS | 12 tests: autor, IDOR, perfiles, sesión, CSRF, rechazo, versiones, paginación, fallos y eventos HTML5 |
| PostgreSQL aislado | PASS | `scripts/test-suggestions-sql.js`: 20 comprobaciones, incluidos grants, RPC, conflicto, preservación y rollback |
| Navegador → API real → PostgreSQL aislado | PASS | Envío como empleado, orden con botón, cambio a desarrollo como admin, rechazo con motivo, recarga y consulta personal |
| Diseño móvil 390×844 | PASS | Sin desbordamiento horizontal; cero controles de gestión para empleado; estados y motivos visibles |
| Diseño ordenador 1366×900 | PASS | Cuatro columnas y controles visibles; consola sin errores en la prueba |
| Arrastre físico automatizado | NO VERIFICADO | Dos arrastres con la herramienta no produjeron movimiento. El contrato de eventos HTML5 está probado; falta validación manual |
| Supabase LIVE | PASS | Migración 20261012192221 employee_notes_board aplicada; 15 columnas; RPC solo service_role; acceso directo authenticated retirado |
| Conservación de notas | PASS | 10 notas antes/después; huella agregada idéntica de id, autor, nombre, área, categoría, texto, leída y fecha; las 10 empiezan Pendiente |
| Build de Preview y Producción | PASS | Ambos READY y 227 PASS, 0 FAIL, 1 omitida en sus propios builds |
| Recursos servidos por Producción | PASS | GET notas.js y notas.css: HTTP 200 y bytes idénticos a los probados |
| Sesión exigida por API | PASS | GET sin credenciales a /api/suggestions: HTTP 401 JSON |
| Navegador público | PASS | Portal abre desde navegador local, carga notas.js y notas.css v20261012, sin errores de consola |
| Errores runtime | Sin registros | Consulta del deployment nuevo, niveles error/fatal, ventana breve de 10 minutos; no prueba todos los flujos |

Capturas en `implementation/evidence/notas-tablero-desktop.jpg` y
`implementation/evidence/notas-tablero-movil.jpg` del workspace padre. Son
personas/propuestas ficticias y no son evidencia de una sesión de Producción.

Para reproducir PostgreSQL, instalar PGlite fuera del proyecto y ejecutar:
```sh
SYNCRO_PGLITE_MODULE=/ruta/temporal/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-suggestions-sql.js
```
Para revisar la interfaz, con la misma variable ejecutar
`node scripts/suggestions-local-preview.js`. Escucha exclusivamente en loopback,
usa datos ficticios y bloquea conexiones a servicios externos. Los perfiles se
eligen con `?profile=admin`, `employee`, `chief` u `other`.

## Publicación
- Rama remota: `codex/app-mejoras-20261012`, publicada sin fusión.
- Código publicado: `a4f61faf1333608dfa1bfd7e3960d06e41731c71`.
- El conector de GitHub creó el commit porque Git del terminal no tenía credenciales.
  Su árbol `32638f25f844d7efb69c9698b74d42c7fe0f00f6` es idéntico al del
  commit local probado `779b3022327eb5e36b08fdbc9c9bb4955a6f4205`.
- `main`: `38074d99302009228dee8fd8c31fa69c475fc1ab`, confirmado sin cambios.
- Preview: `https://syncro-lg4mic2qv-akolobnev-1789s-projects.vercel.app/`,
  READY, `dpl_9krrRYnMfZFj7WqU2HpN3KHA2zGp`, código `a4f61faf`.
- Producción: `https://syncro-shift.vercel.app/`, READY,
  `dpl_4w9hGfRvtxf3SaV14o6jzzwZJwUX`, código `a4f61faf`.
- Producción se reconstruyó a partir del deployment inmutable de Preview con
  `withLatestCommit:false`; su build repitió las pruebas.
- El dominio público resuelve al deployment y commit anteriores. Lectura desde
  el host local confirmó los archivos y el HTTP 401 de la API sin sesión.
- El lector remoto del conector Vercel recibe el HTTP 403 del control de IP del
  recinto. Preview en navegador requiere además Vercel SSO. No se modificaron
  protecciones, IPs, credenciales ni variables de entorno para superar controles.
- El cierre posterior de documentación no cambia los archivos de la aplicación
  que sirven estos deployments.

## Datos y sistemas externos
Alexander autorizó expresamente el SQL, GitHub, Preview y Producción el 12/10/2026.
Se aplicó la migración `20261012192221 employee_notes_board` en
`tsfhrpdpbkciofvejrao`. Se añadieron siete campos y tres restricciones, se creó
la RPC y se restringió el acceso directo a las notas. Se confirmó acceso de
service_role a notas y perfiles y rechazo de un actor inexistente por la RPC,
sin ejecutar una escritura de prueba sobre notas LIVE.
Las 10 notas originales conservan todos sus campos previos. No hubo borrados,
cron, backfills, sincronizaciones, fusiones ni cambios de Bitrix24.
Los archivos sincronizados de `sources/` permanecen intactos.

## Reversión
El código previo está conservado en `cc47b4c4d36f89eab54886a926ef509e9afc3a7b`
y el deployment `dpl_9yLSpaBGyx599FdJ8X2wM2kK2bPU`.
Para revertir, volver a ese deployment y ejecutar el rollback preparado solo
con autorización específica. El SQL de rollback
restaura los grants anteriores y conserva las columnas, propuestas y decisiones;
no borra datos ni reescribe historial.

## No verificado
- Creación, cambios de estado y orden con perfiles reales en la nueva Producción.
  No había una sesión de aplicación autenticada disponible y no se crearon datos
  de prueba en LIVE para obtener evidencia.
- Sesiones reales de empleado, jefe y administrador en la nueva Producción.
- Arrastre físico manual; los botones y selectores sí se comprobaron en navegador.
- La E2E preexistente de autenticación requiere su entorno y sigue omitida.

## Decisión necesaria de Alexander
Ninguna para la aplicación y publicación solicitadas: autorización ejecutada.
La verificación manual con sesión real y del arrastre permanece pendiente.
Actualizar la página permite cargar los recursos publicados.
