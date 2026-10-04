# SYNCRO SHIFT — Documentación principal

Proyecto: `AlexSfera/syncro_hub`. Producción conocida: https://syncro-shift.vercel.app/.

- [Reglas del proyecto](../PROJECT_RULES.md).
- [Estado actual y evidencia](04-development/CURRENT_STATE.md).
- [Estado comprobado de Planificación Horaria](04-development/MODULE_STATUS.md).

## Saldos con corte 30/09/2026

La incorporación concilia 48 empleados con la fuente, incluidos 40 saldos cero de 2025, y 7 ausencias futuras. Las 17 filas restantes necesitan completar o aclarar datos. La fecha de corte se obtiene de la auditoría de importación y se muestra como apertura, separada de movimientos posteriores.

El cambio mínimo del CHECK permite `apertura = 0`; mantiene las demás restricciones, RLS y el historial append-only. Su versión LIVE es `20261004164824`. La reversión protegida está en [supabase/rollback](../supabase/rollback/vacaciones_apertura_cero_rollback.sql).

El estado visual autenticado y las horas/condiciones contractuales no acreditadas siguen en `[NO DATA]`.

