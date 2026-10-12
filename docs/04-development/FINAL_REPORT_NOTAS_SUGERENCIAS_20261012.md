# Notas y Sugerencias — 12/10/2026

## Resultado
PARCIAL: IMPLEMENTADO y TESTEADO localmente. SQL PREPARADO, sin aplicar LIVE.

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
- `supabase/changes/employee_notes_board.sql`: ocho columnas, restricciones y RPC
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
| Supabase LIVE | SOLO LECTURA | Se confirmaron columnas previas, PK, categorías, grants, RLS y contexto de autenticación; 10 notas, 9 sugerencias y 1 mejora en la inspección |

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
- Rama local: `codex/app-mejoras-20261012`.
- Base: `cc47b4c4d36f89eab54886a926ef509e9afc3a7b`, la revisión actual de Producción.
- `main`: `38074d99302009228dee8fd8c31fa69c475fc1ab`, sin fusión ni cambios.
- Preview previa: `a64ada9391977103de4fc21cf1db9a1325e8eddf`, READY,
  `dpl_HkhrpqKgR29S35k4sKrQmSyWJqMZ`. No contiene este cambio.
- Producción previa/actual: `https://syncro-shift.vercel.app/`, READY,
  `dpl_9yLSpaBGyx599FdJ8X2wM2kK2bPU`, revisión `cc47b4c`.
- Nueva Preview y nueva Producción: [NO DATA], no solicitadas todavía con la
  autorización específica exigida por las instrucciones humanas de esta sesión.

## Datos y sistemas externos
Sin modificaciones en GitHub, Vercel, Supabase LIVE, Bitrix24 ni Producción.
Sin cron, backfills, sincronizaciones, fusiones o datos personales en fixtures.
Los archivos sincronizados de `sources/` no se modificaron.
La cláusula de cierre automático del AGENTS del checkout no prevalece sobre la
instrucción humana actual que separa código de publicación y migraciones LIVE.

## Reversión
El código previo está conservado en el commit base y deployment indicados.
Después de una publicación autorizada, volver al deployment anterior y ejecutar
el rollback preparado solo con autorización específica. El SQL de rollback
restaura los grants anteriores y conserva las columnas, propuestas y decisiones;
no borra datos ni reescribe historial.

## No verificado
- Migración y uso de nuevos campos en Supabase LIVE: no aplicados.
- Sesiones reales de empleado, jefe y administrador en la nueva Producción.
- Arrastre físico manual; los botones y selectores sí se comprobaron en navegador.
- La E2E preexistente de autenticación requiere su entorno y sigue omitida.

## Decisión necesaria de Alexander
Autorizar expresamente aplicar el SQL preparado al proyecto
`tsfhrpdpbkciofvejrao`, publicar esta rama en GitHub y desplegar el cambio en
Preview y Producción, conservando las notas originales y sin fusionar main.
Antes de ejecutar, comprobar de nuevo revisión de Producción, esquema y grants;
aplicar SQL, validar Preview y publicar únicamente la revisión probada.
