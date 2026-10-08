# Permisos de incentivos e informe contable — 08/10/2026

## Resultado
IMPLEMENTADO, TESTEADO y desplegado a PRODUCCIÓN: código cc47b4c4d36f89eab54886a926ef509e9afc3a7b, deployment dpl_9yLSpaBGyx599FdJ8X2wM2kK2bPU, READY desde 2026-10-08T19:28:18.758Z, dominio https://syncro-shift.vercel.app/ confirmado con la misma revisión.
Restricción Supabase EJECUTADA y VERIFICADA mediante políticas y pruebas RLS. Uso con sesión real y descarga autenticada desde la red del recinto: [NO DATA]; no se declara verificación completa de ese flujo.

## Límites finales
| Perfil | Incentivos | Liquidaciones |
|---|---|---|
| Administrador | Control general y registros | Puede consultar, liquidar y descargar CSV |
| Jefe de departamento | Pendientes de su ámbito y propios | Sin acceso a historial, pagos o informe contable |
| Empleado, RRHH y adjunto | Solo pendientes propios; pagados desaparecen | Sin acceso |
| Contabilidad | Solo pendientes propios, sin consulta general | Solo informe CSV de importes ya liquidados; sin pagos |

La jerarquía existente de F&B y Club Manager se conserva; coordinadores aislados por especialidad. No se cambian roles.

## Qué se modificó
La corrección previa 0cceb9cc0aa06a539cf7cf049fd9cb97ced60ae7 restringe el control a Administrador, añade consulta departamental segura y oculta fuentes/duplicados liquidados en la consulta personal.
Esta revisión añade api/liquidation-report.js, botón y navegación de descarga en workflow-ui.js/shared.js, versiones de recursos en index.html, sintaxis y pruebas. Ubicación: Resultados e informes → Informe de incentivos liquidados.

CSV UTF-8 con BOM, punto y coma y decimal español. Mes de liquidación según la fecha de pago registrada en Europe/Madrid, con cambios de hora; no es el periodo de devengo. Filas por departamento/empleado y subtotales identificados en Tipo de fila, con total general.
Fuentes existentes: incentivos_liquidaciones de Recepción Hotel (incentivo_final), entrenadores_incentivos_mes con liquidado=true (incentivo_bruto), housekeeping_semester_incentives con estado=liquidado (importe_premio). Calculado/aprobado sin liquidación no es pago. Otros departamentos sin registro de pago disponible: [NO DATA]; no se inventa historial.
Proyección limitada a nombre/ID registrado, departamento e importe pagado; sin notas, FIO, ausencias, fotos, credenciales o configuración personal. Actor autenticado y rol vigente desde servidor; GET exclusivo, mes estricto, sin selección de otra persona/departamento o formato JSON. Paginación, cabeceras no-store y Vary, neutralización de fórmulas CSV; error ante fuentes incompletas, fechas/importes inválidos o duplicados. Respuestas de otra sesión, rol o pantalla no pueden descargarse.

## Supabase
Alexander autorizó específicamente retirar la consulta general de Contabilidad y pidió el informe descargable.
Aplicada exactamente supabase/changes/incentives_admin_read_ceiling.sql mediante apply_migration: 20261008191437 incentives_admin_read_ceiling.
Solo se modifican cuatro políticas SELECT RESTRICTIVE syncro_finance_read_ceiling de employee_incentives, entrenadores_incentivos_mes, incentivos_liquidaciones y dept_incentive_rules: requieren rol confiable admin.
APIs personales/departamentales e informe contable usan proyecciones restringidas del servidor. Sin cambios de importes, pagos, fichas, grants, políticas de escritura ni trigger syncro_preserve_settled_trainer.

## Comprobaciones
- npm run check PASS y npm test local: 216 casos, 215 PASS, 0 FAIL, 1 E2E local Supabase omitida.
- Chrome local con fixtures: 30 escenarios, 0 fallos; diez perfiles en 390/768/1366 px. Incluye bloqueo de liquidaciones, ámbitos, CSV del mes elegido, limpieza y autocontrol.
- Preview dpl_3tPpt2S5vQSBZY5zBC4zPXVoJmZP, READY y revisión exacta cc47b4c4d36f89eab54886a926ef509e9afc3a7b; build ejecuta sintaxis y 215 PASS, 0 FAIL, 1 omitida; Build Completed y Deployment completed.
- Ocho archivos de código/pruebas leídos desde GitHub y comparados íntegramente con las fuentes probadas: coinciden.
- RLS LIVE en transacciones READ ONLY con claims locales de identidades existentes y SET LOCAL ROLE authenticated: Administrador conserva lectura; Contabilidad, jefe, empleado, adjunto y RRHH obtienen cero filas generales. Solo user_metadata con role admin no crea identidad confiable ni permite leer. Sin generar sesiones ni guardar tokens.
- Cuatro condiciones SELECT admin-only, 20 políticas restrictivas conservadas y trigger de conservación comprobados.
- Metadatos antes/después: siete liquidaciones HK de septiembre 2026, cero de Recepción/Entrenadores; sin nuevos pagos ni datos incompletos en pagos existentes. Ningún dato personal real guardado como fixture.
- Build de Producción repite 215 PASS, 0 FAIL, 1 omitida; READY, target production, y dominio con deployment/revisión exactos.
- Runtime desde 2026-10-08T19:28:18.758Z: ningún error encontrado en la ventana inicial. Observación breve, no prueba de carga o sesión real.

## Límites de comprobación
Preview HTTP /api/liquidation-report?mes=2026-09 devuelve 403 de protección de red/IP del recinto antes del endpoint. No se cambia whitelist ni protección. Navegación de Producción y descarga autenticada: [NO DATA]; se conserva el rechazo previo del navegador y no se elude por otro canal.
E2E local Supabase omitida por falta de esa dependencia. No se ejecutan pagos, cron, backfills o importaciones LIVE como pruebas.

## Sistemas modificados
GitHub: rama codex/permisos-incentivos-20261008, código cc47b4c4d36f89eab54886a926ef509e9afc3a7b; cierre documental posterior sin cambios de aplicación.
Vercel: Preview y Producción actualizadas; dpl_9yLSpaBGyx599FdJ8X2wM2kK2bPU, READY, aplicación estática y funciones Edge, región iad1.
Supabase: solo cuatro políticas de lectura. Importes/pagos intactos.
main: 38074d99302009228dee8fd8c31fa69c475fc1ab, sin cambios o fusión; difiere de Producción de forma registrada.
Bitrix24 y otros servicios: sin cambios nuevos.

## Reversión
Para retirar solo el CSV conservando los límites nuevos, desplegar 0cceb9cc0aa06a539cf7cf049fd9cb97ced60ae7 desde Preview dpl_9XbNiXHjXyXvJkTMZcwpSpd6e44R con target production y withLatestCommit=false; comprobar build, READY y dominio. Mantener política admin-only en Supabase. Alternativa: commit de reversión de los ocho archivos del informe sobre esta rama, sin reescribir historial.
No restaurar automáticamente bf1907fa9e35daf44d4e4c2e47fe16268520a5d2: reabre consulta general mediante APIs.
Reabrir lectura Supabase requiere autorización específica; existe supabase/changes/incentives_admin_read_ceiling_rollback.sql, sin ejecutar. Conservar todos los pagos y trigger.

## Decisión
Ninguna autorización adicional pendiente. Falta evidencia del uso autenticado desde la red permitida; no se presenta como prueba realizada.
