# Informe final — Jornadas registradas y proyección de saldos

Fecha: 14/10/2026  
Proyecto: SYNCRO SHIFT  
Rama: `codex/planificacion-jornadas-saldos-20261014`

## Resultado conseguido

Se corrigió la lógica para que cada fecha registrada por empleado tenga una sola clasificación: trabajo, descanso, vacaciones, festivo, recuperación festiva, baja médica u otra ausencia.

La pantalla muestra por persona:

- recuento semanal por tipo, días sin registrar y conflictos;
- total anual y desglose de cada tipo de jornada;
- saldo confirmado de vacaciones, vacaciones futuras y saldo tras planificación;
- saldo festivo confirmado, movimiento futuro y resultado tras planificación.

Una recuperación festiva de jornada completa registrada como ausencia produce `-1`. Una recuperación por horas sigue visible, pero no se transforma en un día sin conocer la jornada contractual. Los saldos negativos confirmados se muestran y `[NO DATA]` no se sustituye por cero.

## Cambios realizados

- `lib/planning-domain.js`: clasificación única de fechas, conflictos, festivos por calendario, vacaciones futuras y recuperaciones.
- `lib/planning-server.js`: lectura anual paginada, inclusión de empleados sin movimientos previos, proyección de saldos y conservación de negativos.
- `planificacion_horaria.js`: desglose semanal/anual, alerta de días sin registrar, calculadora confirmada frente a planificada y ayuda visible.
- Pruebas de dominio, permisos, privacidad, negativos, `[NO DATA]` y fixture visual actualizadas.

## Comprobaciones

- Sintaxis de los tres archivos modificados: PASS.
- Suite completa: 236 PASS, 0 FAIL, 1 prueba de integración local preexistente OMITIDA.
- Pruebas específicas de planificación: 25 PASS.
- Navegador local con datos ficticios: verificados alerta semanal, desglose anual, vacaciones futuras, baja médica, recuperación festiva y resultado `-1`.
- GitHub: commit remoto `0eca395dd46ff8f624dff358c5752f822052193b`.
- Preview Vercel: `dpl_2cGQsTkP35iRcBAdZaD2Q4RZaDL9`, READY, construida desde ese commit.

## No comprobado o no modificado

- Preview autenticada: `[NO DATA]`; el lector remoto recibe 403 por la restricción IP existente.
- Producción: no contiene todavía este cambio. Continúa en `dpl_5EVMnobUf56LdhaRvXVRAnwKGm89`.
- Supabase LIVE: sin migraciones y sin cambios de datos.
- Bitrix24: sin escrituras. La publicación de ShiftPlan continúa bloqueada porque no existe una API oficial documentada de escritura en este proyecto.
- Los registros personales propuestos anteriormente para Alexander no se crearon en este cambio.

## Reversión

La rama parte de `dd6ebcedf3d78a349f09078778582304c2321041`. Como Producción no cambió, no requiere reversión. Si se autoriza y publica después, el deployment recuperable anterior es `dpl_5EVMnobUf56LdhaRvXVRAnwKGm89`.

## Decisión necesaria

Alexander debe autorizar explícitamente la promoción de la Preview `dpl_2cGQsTkP35iRcBAdZaD2Q4RZaDL9` a Vercel Producción. Esa autorización no implica escribir datos en Supabase ni publicar horarios en Bitrix24.
