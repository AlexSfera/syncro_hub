# Informe final — Navegación y permisos — 08/10/2026

## Resultado

Despliegue completado. Vercel confirma PRODUCCIÓN READY y el dominio habitual en la revisión probada. Conexión Vercel restaurada. Navegación IMPLEMENTADA y TESTEADA; protección Supabase aplicada y comprobada mediante lecturas. Flujo autenticado LIVE: [NO DATA].

## Cambios realizados

- Siete áreas de trabajo; Jornada reúne planificación, fichajes y balance mensual. Producción se separa de informes y pagos.
- Incentivos propios pendientes para empleados; los liquidados se ocultan de su vista y conservan historial interno. Control financiero limitado a admin y consulta de Contabilidad; perfiles operativos no reciben ese acceso por su rol.
- Aplicada exclusivamente la protección autorizada de employees, employee_incentives, entrenadores_incentivos_mes, incentivos_liquidaciones y dept_incentive_rules: 20 políticas RESTRICTIVE y un trigger de conservación de liquidaciones.
- No se actualizaron empleados, roles, saldos, producción, incentivos ni pagos.
- El código de aplicación ya estaba guardado en `8f0c1d7`. El cierre `1ecbe1d` solo añadió documentación, estado del SQL y arranque de Chrome en fixtures locales aisladas.
- Actualizada la documentación para reflejar el despliegue confirmado y sus límites de verificación.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sintaxis | PASS | npm run check local, Preview y build de Producción |
| Regresión, ámbitos, caché y APIs de incentivos | PASS | npm test: 188 superadas, 0 fallos; 1 E2E omitida |
| Navegación y layout local | PASS | scripts/check-navigation-browser.js: 30 escenarios, 0 fallos; 10 perfiles y tres anchos, datos ficticios |
| Migración Supabase | PASS | 20261008073541 navigation_incentives_access; 20 políticas y trigger confirmados |
| RLS con seis perfiles reales | PASS | Transacciones READ ONLY; admin/contable reciben control; empleado/jefe/jefe_recepcion/adjunto reciben cero |
| RLS sin sesión | PASS | Contexto nulo y cero registros |
| Fichas directas | PASS | authenticated no tiene SELECT sobre employees; circuito API existente |
| Escrituras y liquidaciones LIVE | OMITIDA | No se utilizan escrituras de negocio como pruebas |
| Trigger sobre un pago real | OMITIDA | Definición instalada; no se alteran pagos para comprobarla |
| Preview de la revisión publicada | READY | dpl_4i38mttSD7iYuP43MQb4Lk6hoaVQ; revisión 1ecbe1d |
| Conexión Vercel del equipo/proyecto | RESTAURADA | Lectura y creación de deployment completadas tras reconectar |
| Build de Producción | PASS | 188 pass, 0 fail, 1 skipped; Build Completed y Deployment completed |
| Producción y dominio habitual | CONFIRMADO | dpl_G5LMLN86SbsJbTigVCcxNAddYTjL, READY, target production; consulta por syncro-shift.vercel.app devuelve mismo ID y SHA |
| Errores de runtime posteriores | Ninguno observado | Consulta desde 2026-10-08T09:11:47.494Z; ventana inicial breve |
| Pantalla y endpoints autenticados LIVE | [NO DATA] | HTTP Preview 403 por IP del recinto; navegador Producción rechazado por política de permisos |

Las pruebas RLS usan claims en el contexto SQL de transacciones de lectura y no crean usuarios, sesiones, credenciales o registros. La primera consulta incluyó SELECT sobre employees y fue denegada por grants preexistentes; se corrigió la prueba para verificar esa ausencia de grants y evaluar las cuatro tablas financieras. Los escenarios de Chrome usan fixtures y no prueban datos ni sesiones reales.

## Publicación

- Rama: `codex/cierre-navegacion-permisos-20261008`.
- Código de aplicación de referencia: `8f0c1d7cb758c9376d16d710af1a0d5418ee75f9`.
- Revisión desplegada: `1ecbe1da9c31e1f38d7608ce4021d7f7ed74f717`.
- Preview: https://syncro-ek6illn4o-akolobnev-1789s-projects.vercel.app/ — `dpl_4i38mttSD7iYuP43MQb4Lk6hoaVQ`.
- Producción: https://syncro-shift.vercel.app/ — `dpl_G5LMLN86SbsJbTigVCcxNAddYTjL`, disponible desde 08/10/2026 09:11:47 UTC.
- Se reconstruyó exactamente la Preview probada con `withLatestCommit:false`; no se publicó otro HEAD por accidente.
- `main` sigue en `38074d99302009228dee8fd8c31fa69c475fc1ab`, sin fusión. Este informe posterior es documental y no requiere otro despliegue.
- Los rechazos 403/404 de la conexión anterior se resolvieron al reconectar. El 403 actual del lector HTTP corresponde al control de IP de la aplicación.

## Límites

No se ha confirmado una sesión de usuario real ni el flujo completo en Producción. La ausencia inicial de errores de runtime y las pruebas locales no demuestran todos los recorridos LIVE. No se cambió la lista de IP ni se intentó eludir la negativa del navegador.

Vercel conserva una advertencia de build: el runtime edge de middleware.js está deprecado. La construcción y publicación concluyeron correctamente; su migración no forma parte de este cambio.

El asesor Supabase no detectó un problema específico del nuevo trigger. Conserva avisos anteriores sobre tablas de acceso por servidor con RLS sin políticas, search_path de sync_shifts_horas_from_bitrix, syncro_auth_context SECURITY DEFINER y protección de contraseñas filtradas. No se modificaron esos objetos. POSMEWS–Bitrix24, cron, backfills y un nuevo motor automático de balances quedan fuera de este cierre.

## Reversión

- Aplicación: volver al deployment anterior `dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g`, revisión `ce78f882c300e686fe40ad22134a900c840c3d91`.
- Mantener las restricciones Supabase al revertir interfaz. `supabase/changes/navigation_incentives_access_rollback.sql` elimina solo los nuevos techos y trigger; aplicarlo exige autorización específica para restaurar el acceso amplio anterior.
- No borrar registros o auditoría ni reescribir Git.

## Decisión de Alexander

Ninguna decisión pendiente para el despliegue completado. La comprobación de pantalla autenticada debe realizarse con una sesión y un acceso permitido al recinto; se mantiene [NO DATA] hasta disponer de esa evidencia.
