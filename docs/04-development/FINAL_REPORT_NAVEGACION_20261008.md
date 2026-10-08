# Informe final — Navegación y permisos — 08/10/2026

## Resultado

PARCIAL. Protección de Supabase EJECUTADA y comprobada. Reorganización IMPLEMENTADA, TESTEADA y en Preview. Nueva Producción NO DESPLEGADA por rechazo del acceso de Vercel.

## Cambios realizados

- Aplicada exclusivamente la protección autorizada de acceso a employees, employee_incentives, entrenadores_incentivos_mes, incentivos_liquidaciones y dept_incentive_rules: 20 techos RLS y un trigger.
- No se actualizaron empleados, roles, saldos, producción, incentivos ni pagos.
- El cambio de aplicación ya estaba guardado en GitHub en 8f0c1d7; conserva las siete áreas, consulta de pendientes propios, ocultación de liquidados y control restringido.
- Corregido el arranque de Chrome en el script de pruebas local. Esta opción afecta a fixtures locales aisladas, no al navegador del usuario ni a la aplicación.
- Actualizada la documentación con autorización, migración, pruebas, publicación fallida y reversión.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sintaxis | PASS | npm run check |
| Regresión, ámbitos, caché y APIs de incentivos | PASS | npm test: 188 superadas, 0 fallos; 1 E2E omitida |
| Navegación y layout local | PASS | scripts/check-navigation-browser.js: 30 escenarios, 0 fallos, datos ficticios |
| Migración Supabase | PASS | 20261008073541 navigation_incentives_access; 20 políticas y trigger |
| RLS con seis perfiles reales, consultas sin datos personales | PASS | Transacciones READ ONLY; rol obtenido de contexto seguro; admin/contable reciben control; empleado/jefe/jefe_recepcion/adjunto reciben cero |
| RLS sin sesión | PASS | Contexto nulo y cero registros |
| Fichas directas | PASS | authenticated no tiene SELECT sobre employees; circuito API existente |
| Escrituras y liquidaciones LIVE | OMITIDA | No se utilizan escrituras de negocio como pruebas |
| Trigger sobre un pago real | OMITIDA | Definición instalada; no se alteran pagos para comprobarla |
| Preview | READY según metadatos | dpl_HUz39jFx6WYQSHBwbRMy2eEHm4B3; código 8f0c1d7 |
| Pantalla/endpoints Preview | [NO DATA] | Lector Vercel rechazado 403 |
| Publicación production | FAIL | create_deployment: 404 Deployment not found |
| Lectura explícita del equipo Vercel | FAIL | list_deployments: 403 forbidden |
| CLI alternativa | NO DISPONIBLE | Terminal: CreateProcessWithLogonW failed 1909 |

Las pruebas RLS usan claims en el contexto SQL de transacciones de lectura y no crean usuarios, sesiones, credenciales o registros. La primera consulta incluyó SELECT sobre employees y fue denegada por grants preexistentes; se corrigió la prueba para verificar esa ausencia de grants y evaluar las cuatro tablas financieras.

## Publicación

- Rama de cierre: codex/cierre-navegacion-permisos-20261008.
- Revisión de aplicación candidata: 8f0c1d7cb758c9376d16d710af1a0d5418ee75f9.
- Preview: https://syncro-pzz1e0paa-akolobnev-1789s-projects.vercel.app/, READY según metadatos.
- Producción anterior: https://syncro-shift.vercel.app/, ce78f88, dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g.
- No hay evidencia de un nuevo deployment de producción: el intento fue rechazado, no se publicó.
- main conserva su estado; sin fusión.

## Permisos LIVE y límites

Los derechos de la base de datos ya están restringidos, aunque la navegación anterior sigue publicada. Las vistas antiguas que intenten leer incentivos directamente pueden quedar sin resultados para perfiles operativos hasta que se publique el código nuevo. No se restablece acceso amplio para compensar un problema de despliegue.

El asesor de seguridad de Supabase no detectó un problema específico en el nuevo trigger; conserva avisos sobre objetos anteriores: tablas destinadas a APIs de servidor con RLS y sin políticas, sync_shifts_horas_from_bitrix sin search_path fijo, syncro_auth_context SECURITY DEFINER intencional y protección de contraseñas filtradas desactivada. No se amplía la tarea para modificar esos objetos.

Referencias de los avisos existentes:
- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Reversión

- Aplicación: conservar ce78f88 / dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g como referencia anterior.
- Protección: archivo navigation_incentives_access_rollback.sql elimina solo los nuevos techos y trigger; su aplicación exige autorización para restablecer el acceso amplio anterior.
- No borrar registros o auditoría, ni reescribir Git.

## Decisión necesaria de Alexander

No hace falta otra autorización de implementación, Supabase o despliegue. Para terminar se necesita acceso operativo de la conexión Vercel al equipo team_EsCg9IVC7OyrFyx6WxT4af9N y proyecto prj_n6NFkCypqDfaUXYM26uFnlKslAgs. No se atribuye el rechazo a una causa no comprobada.
