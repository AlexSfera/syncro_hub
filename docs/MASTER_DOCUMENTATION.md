## Actualizacion de saldos y consulta — 06/10/2026
Esta seccion prevalece sobre los recuentos historicos inferiores.
- Datos: 60 empleados conciliados, 52 saldos cero de 2025, 129 movimientos totales y siete periodos de ausencia conservados. Cinco exclusiones por instruccion de Alexander.
- Confirmacion CEO: compensacion adicional, correccion de un saldo, reparto de 27 dias entre 2023 y 2024 y cuatro saldos de festivos/compensacion confirmados a cero. El detalle personal permanece exclusivamente en la auditoria de Supabase.
- Consulta: tabla **Saldos de vacaciones** dentro de Planificacion Horaria, con años anteriores y festivos confirmados. Incluye fichas con saldo aunque esten Sin asignar o Baja, sin habilitarlas para asignar turnos ni modificar sus estados.
- Permisos: direccion y RRHH consultan todos los saldos; los responsables consultan su departamento y cada empleado su saldo. La parrilla semanal conserva el filtro de empleados activos.
- Ayuda: boton ⓘ Cómo consultar. El cero certificado se distingue de [NO DATA].
- Pruebas: casos de historia anual, ceros, permisos, ficha sin asignar y escape HTML; la compilacion del deployment ejecuta los tests de planificacion.
- Produccion previa recuperable: dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV. La revision publicada se acredita mediante el deployment READY y su commit en Vercel.
- Reversion de datos: movimientos compensatorios y confirmaciones auditadas posteriores; nunca borrar historial. Reversion de pantalla: volver al deployment previo.
- Pantalla autenticada real: [NO DATA] hasta comprobar una sesion. No se aplican migraciones, condiciones contractuales ni cambios de Bitrix24.

---

## Correspondencias completadas — 04/10/2026
Se incorporaron los nueve saldos pendientes por correspondencia de identidad, tras la confirmación expresa de Alexander de los IDs de la plantilla. Se corrigieron dos vínculos de fichas existentes y se crearon siete referencias internas mínimas. La conciliación cubre **57 de 65 filas**: cinco están excluidas del alcance por indicación de Alexander y tres mantienen contradicciones de saldo.
El lote contiene **114 aperturas anuales**, incluidas **49 aperturas cero de 2025**. Las 18 aperturas de esta continuación conservan el corte **30/09/2026**, las unidades natural/laborable de la fuente y el historial previo. Se preservaron los 100 movimientos anteriores del lote, incluidos movimientos distintos de apertura.
Las siete referencias nuevas tienen estado **Sin asignar**, porque no se pudo consultar directamente el estado actual de Bitrix24. No aparecen en el filtro de empleados activos de Planificación Horaria. Su alta no incorpora credenciales ni invitaciones y conserva el rol mínimo empleado sin facultades de responsable o validador.
La lectura directa de Bitrix24 y la pantalla autenticada permanecen **[NO DATA]**. La consulta de Bitrix24 quedó bloqueada por la conexión de esta sesión; los IDs e identidades proceden de la plantilla y de la confirmación de Alexander.
La pantalla del commit `ae4e3b7` permanece en Preview; no se cambió el deployment de Producción en esta continuación. `main` se conserva.
Reversión: usar el valor anterior de la auditoría para restaurar exclusivamente los dos vínculos; compensar las 18 aperturas de esta continuación conservando las referencias internas y el historial. Las aperturas cero se conservan. No ejecutar el rollback del CHECK mientras existan aperturas cero.

---

# SYNCRO SHIFT — Documentación principal

Proyecto: `AlexSfera/syncro_hub`. Producción conocida: https://syncro-shift.vercel.app/.

- [Reglas del proyecto](../PROJECT_RULES.md).
- [Estado actual y evidencia](04-development/CURRENT_STATE.md).
- [Estado comprobado de Planificación Horaria](04-development/MODULE_STATUS.md).

## Saldos con corte 30/09/2026

La incorporación concilia 48 empleados con la fuente, incluidos 40 saldos cero de 2025, y 7 ausencias futuras. Las 17 filas restantes necesitan completar o aclarar datos. La fecha de corte se obtiene de la auditoría de importación y se muestra como apertura, separada de movimientos posteriores.

El cambio mínimo del CHECK permite `apertura = 0`; mantiene las demás restricciones, RLS y el historial append-only. Su versión LIVE es `20261004164824`. La reversión protegida está en [supabase/rollback](../supabase/rollback/vacaciones_apertura_cero_rollback.sql).

El estado visual autenticado y las horas/condiciones contractuales no acreditadas siguen en `[NO DATA]`.

