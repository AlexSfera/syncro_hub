# 04_MODULE_DASHBOARD.md — SYNCROSFERA / SynchroShift

Versión: ÍNDICE  
Estado: documento dividido en dos archivos especializados.  
Regla: No editar aquí. Editar en el archivo correspondiente.

---

## Estructura

Este documento es el índice/puente del módulo Dashboard.  
El contenido completo está dividido en:

| Archivo | Contenido |
|---|---|
| [`04_DASHBOARD_DATOS.md`](04_DASHBOARD_DATOS.md) | Secciones 0–8 + 16: alcance, tablas, filtros, KPIs, SQL, cajas, migraciones |
| [`04_DASHBOARD_CONTROL.md`](04_DASHBOARD_CONTROL.md) | Secciones 9–15 + 17–19: conciliaciones, alertas, endpoints, realtime, validación, QA, riesgos, prompt técnico |

---

## Mapa de secciones

### En 04_DASHBOARD_DATOS.md

| Sección | Título |
|---|---|
| 0 | Alcance de este documento |
| 1 | Principio principal del Dashboard |
| 2 | Prioridad de análisis confirmada |
| 3 | Tablas reales usadas por Dashboard |
| 4 | Problemas reales del modelo actual |
| 5 | Filtros globales del Dashboard |
| 6 | KPI Principales — Definición y SQL |
| 7 | KPI Recepción Hotel |
| 8 | Cajas en Dashboard (Sala, Recepción, SYNCROLAB) |
| 16 | Migraciones SQL recomendadas |

### En 04_DASHBOARD_CONTROL.md

| Sección | Título |
|---|---|
| 9 | Conciliación Sala ↔ Recepción |
| 10 | Conciliación SYNCROLAB ↔ Recepción Hotel |
| 11 | Alertas del Dashboard |
| 12 | Vistas del Dashboard |
| 13 | Endpoints API recomendados |
| 14 | Realtime / WebSocket |
| 15 | Impacto de validación, corrección y eliminación |
| 17 | QA Checklist completo Dashboard |
| 18 | Riesgos críticos |
| 19 | Prompt técnico para Codex / Claude Code |

---

## Reglas del módulo Dashboard

- Tabla canónica Recepción: `recepcion_cash` (no `recepcion_cash_closures`).
- Tabla SYNCROLAB: `syncrolab_cash_closures` (definida en documentación, no creada aún en DB).
- Conciliación SYNCROLAB ↔ Recepción: matching por `fecha + habitación + importe`. No usar reserva MEWS como obligatorio en SYNCROLAB.
- F&B = Sala + Cocina.
- No contar `recepcion_cash` y `recepcion_cash_closures` a la vez: duplicaría.
- Si algo no está confirmado: `[NO DATA]`.
- Nombres correctos: SYNCROSFERA, SYNCROLAB, MEWS, POSMEWS, Bitrix24, Nubimed. Nunca "MUSE".
