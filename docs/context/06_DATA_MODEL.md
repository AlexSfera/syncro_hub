# 06_DATA_MODEL.md — SYNCROSFERA / SynchroShift

Versión: ÍNDICE / PUENTE
Estado: este archivo ya no contiene el contenido completo. Fue dividido en dos archivos especializados para reducir consumo de contexto.

---

## Nota de división

El contenido original de `06_DATA_MODEL.md` (~1.885 líneas) fue dividido en:

- **`06a_DATA_MODEL_SCHEMA.md`** — schema, campos, relaciones, reglas
- **`06b_DATA_MODEL_SQL.md`** — SQL de migración, queries, endpoints, QA

---

## Cómo navegar

### Para consultar estructura de datos

Abrir `06a_DATA_MODEL_SCHEMA.md`:

- tablas actuales detectadas en Supabase
- tablas operativas válidas
- tablas legacy / no operativas
- descripción de cada tabla
- campos reales
- claves primarias
- relaciones lógicas
- foreign keys recomendadas (descripción)
- problemas estructurales actuales
- reglas funcionales por tabla
- reglas de datos
- tabla canónica vs legacy (`recepcion_cash` vs `recepcion_cash_closures`)
- advertencias de integridad
- tablas nuevas necesarias (descripción): `gestion_pendiente`, `fio_records`, `alert_logs`, `conciliation_records`
- agregaciones y filtros dashboard
- realtime / WebSocket
- seguridad y RLS
- riesgos a evitar

### Para consultar SQL

Abrir `06b_DATA_MODEL_SQL.md`:

- SQL de migración por tabla (ALTER TABLE, foreign keys)
- CREATE TABLE tablas nuevas
- constraints
- queries de dashboard (turnos, incidencias, merma, tareas, FIO, checklist)
- queries de QA y verificación
- SQL de conciliaciones (Sala vs Recepción Hotel, SYNCROLAB vs Recepción)
- SQL de normalización de fechas
- SQL de auditoría (soft delete / hard delete)
- endpoints API recomendados
- checklist QA obligatorio
- prompt técnico para Codex / Claude Code

---

## Archivos relacionados

- `04_DASHBOARD_DATOS.md` — KPIs, métricas, filtros, fuentes de datos
- `04_DASHBOARD_CONTROL.md` — conciliaciones, alertas, endpoints, permisos, QA
- `09_DECISIONS_PENDING.md` — decisiones P0 pendientes de Alexander
