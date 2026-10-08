# Permisos de incentivos — 08/10/2026

## Resultado
IMPLEMENTADO y TESTEADO en una Preview READY. Producción conserva la revisión anterior. Cambio Supabase PREPARADO, SIN APLICAR: requiere autorización específica según PROJECT_RULES.md y AGENTS.md. No se declara el control completo en Producción.

## Regla solicitada y comportamiento preparado
| Perfil | Consulta | Liquidaciones |
|---|---|---|
| Administrador | Control general de incentivos y sus registros | Acceso y registro autorizados |
| Jefe de departamento | Pendientes del equipo dentro de su ámbito autorizado | Sin acceso a pantallas, historial o acciones de liquidación |
| Empleado, Contabilidad, RRHH y adjunto | Sus propios incentivos pendientes | Sin acceso a control general ni liquidación |

La consulta departamental usa la jerarquía ya existente: F&B cubre sus departamentos y Club Manager su ámbito SYNCROLAB; los coordinadores permanecen dentro de su especialidad. No se crean roles ni se cambian fichas.

## Cambios de código
- canControlIncentives y canControlIncentivesUI pasan a Administrador exclusivo; las APIs existentes de Recepción y Housekeeping heredan ese límite.
- Nueva consulta GET /api/department-incentives, con actor autenticado del servidor y selección de empleados basada en targetIsInScope. El cliente no puede elegir departamento, empleado o rol.
- Nueva vista Incentivos de mi departamento, de consulta y sin selector de departamento ni botones de pago.
- Mis incentivos pendientes queda disponible a todos los perfiles no administradores. Se consulta únicamente la identidad del actor; no se envía historial de liquidación ni datos de otra persona.
- Lectura agrupada y paginada de las fuentes existentes para ambas consultas. Recepción reutiliza el cálculo existente de ventas de cierres; no hay una integración nueva.
- Un mes o semestre con liquidación registrada oculta también los duplicados genéricos u oficiales; se conserva todo el historial interno.
- Caché de respuestas no-store; la vista departamental rechaza respuestas de otra sesión o navegación.
- Fórmulas, importaciones y acciones de liquidación existentes conservadas. Ninguna liquidación real se ejecuta como prueba.

## Protección de base de datos preparada
Archivo supabase/changes/incentives_admin_read_ceiling.sql: modifica exclusivamente cuatro políticas SELECT restrictivas existentes para que solo Administrador pueda leer tablas financieras completas:
employee_incentives, entrenadores_incentivos_mes, incentivos_liquidaciones y dept_incentive_rules.
Las consultas personales y departamentales usan las APIs del servidor y reciben una proyección restringida.
No altera empleados, importes, pagos, grants, políticas de escritura ni trigger de conservación de pagos.
Rollback específico: supabase/changes/incentives_admin_read_ceiling_rollback.sql; restaura la consulta anterior de Contabilidad únicamente con autorización expresa.

## Comprobaciones ejecutadas
- Build Vercel de la revisión 0cceb9cc0aa06a539cf7cf049fd9cb97ced60ae7: npm run check y npm test, 205 PASS, 0 FAIL, 1 E2E omitida; Build Completed y Deployment completed.
- Preview dpl_9XbNiXHjXyXvJkTMZcwpSpd6e44R, READY, revisión exacta 0cceb9cc0aa06a539cf7cf049fd9cb97ced60ae7.
- 14 archivos del código y pruebas leídos de nuevo desde GitHub y comparados íntegramente con el contenido preparado: coinciden.
- Nueve perfiles de jefes probados con datos ficticios: Cocina, Sala, Recepción Hotel, Entrenadores, Fisioterapeutas, Recepción SYNCROLAB, Housekeeping, F&B y Club Manager.
- API probada contra selección de otro departamento, ID ajeno, rol forjado, POST, Contabilidad, RRHH, adjunto y empleados.
- API personal probada con siete especialidades y liquidación simulada de Entrenadores, Housekeeping y Recepción: no devuelve pagos ni duplicados liquidados.
- Sin filtros de cliente como autorización; incluso cuando el mock devuelve filas de terceros, quedan excluidas.
- Paginación de más de mil registros, fallo de fuente, ausencia de campos financieros internos y Cache-Control no-store.
- Supabase LIVE: consultas READ ONLY confirman que las cuatro políticas actuales todavía permiten admin/contable. Identidades incompatibles con el filtro de consultas: cero. Ningún DDL ni dato de negocio modificado.
- El primer build tuvo un falso positivo del test de campos por la palabra Housekeeping; se corrigió para comprobar nombres de campos completos. El build posterior pasa.
- Las nuevas comprobaciones locales del ordenador dejaron de responder. Sintaxis y toda la suite se ejecutaron realmente en Vercel; no se atribuyen a una ejecución local.
- scripts/check-navigation-browser.js actualizado para los límites nuevos, SIN ejecución nueva confirmada. No se reutilizan como prueba de estos permisos los 30 escenarios de la versión anterior.
- Navegador y sesión autenticada LIVE: [NO DATA]. No se elude el rechazo previo del navegador ni la protección de IP.

## GitHub, Vercel y Producción
- Rama codex/permisos-incentivos-20261008, basada en 3d4314c47c18525656555f8f268528e8d9e2d80c.
- Código probado: 0cceb9cc0aa06a539cf7cf049fd9cb97ced60ae7; el cierre documental posterior no cambia código.
- Preview: https://syncro-ldm5dl8m6-akolobnev-1789s-projects.vercel.app/ — dpl_9XbNiXHjXyXvJkTMZcwpSpd6e44R, READY.
- Producción SIN CAMBIOS: dpl_2EHAywYVzE31zudUusoneofgwRQf, bf1907fa9e35daf44d4e4c2e47fe16268520a5d2, READY en syncro-shift.vercel.app.
- main SIN CAMBIOS: 38074d99302009228dee8fd8c31fa69c475fc1ab; no se fusiona.
- Supabase SIN CAMBIOS: protección nueva pendiente. Bitrix24, cron y backfills no se ejecutan.

## Reversión
Antes de publicar, conservar Producción actual y retirar esta corrección del proceso de publicación. No borrar commits ni registros.
Si se autoriza y publica, revertir aplicación y la política de lectura solo mediante decisión explícita: el estado anterior vuelve a dar consulta general a Contabilidad. Conservar siempre el historial y la protección de liquidaciones ya instalada.

## Decisión necesaria
Autorizar específicamente la aplicación en Supabase LIVE de incentives_admin_read_ceiling.
El despliegue ya está autorizado en la sesión; se realizará después de aplicar y verificar esa protección.
