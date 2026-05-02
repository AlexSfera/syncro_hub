# Project Context — SYNCROSFERA Platform

## Stack

- Frontend: HTML + JavaScript vanilla. Single-file app served from `index.html`.
- Repository: GitHub local folder `syncro_hub`.
- Deployment: Vercel.
- Data/backend: Supabase (PostgreSQL via REST API).
- Initial development: Claude.
- Current correction workflow: Claude Code.

## Core Purpose

Internal platform for operational follow-up, daily reporting, shifts, incidents, tasks, validations, cash closures, dashboards, FIO/errors and KPIs by department.

## Main Departments

- Sala (F&B)
- Cocina
- Recepción Hotel
- SYNCROLAB
- Housekeeping
- Clínica
- Mantenimiento
- Marketing / Sales

---

## Critical Architecture — Script Loading Order

Scripts load in this exact order (index.html lines 1708–1716):

```
shared.js → checklist.js → sala.js → cajas.js → caja.js → recepcion.js
→ incidencia_tipos.js → dashboard.js → <inline script in index.html>
```

**The inline `<script>` block at the end of index.html is loaded LAST.**
In JavaScript, later definitions override earlier ones in the same global scope.

### Consequence: Dead Code Files

The following functions in external files are **overridden** by the inline script in `index.html` and are therefore **dead code**:

**`caja.js` — all caja functions are dead:**
- `openCajaForm()` → active at index.html:2244
- `calcCajaDifs()` → active at index.html:2331
- `saveCajaForm()` → active at index.html:2411
- `renderCajaList()` → active at index.html:2548

**`recepcion.js` — caja functions are dead:**
- `calcRecDifs()` → active at index.html:3941 (also defined at 3288 — 3941 wins)
- `openRecCajaModal()` → active at index.html:3332
- `submitRecCaja()` → active at index.html:3397
- `renderRecepcionCajaList()` → active at index.html:3487
- `closeRecCajaModal()` → active at index.html:3392

**`recepcion.js` — these functions ARE active (not overridden):**
- `getRecTurnoValue()`, `updateRecTurnoStyle()`, `setRecKpi()`
- `openRecKpiModal()`, `closeRecKpiModal()`, `submitRecKpi()`

**Rule:** Never modify `caja.js` or `recepcion.js` caja functions — they do not execute. Always modify the inline functions in `index.html`.

---

## Supabase Tables (active)

| Table | Module |
|---|---|
| `employees` | Users / employees |
| `shifts` | Turnos (all departments) |
| `merma` | Merma / food waste (Cocina) |
| `incidencias` | Incidents / FIO |
| `tareas` | Tasks |
| `sala_cash_closures` | Caja Sala cash closures |
| `recepcion_cash` | Caja Recepción Hotel cash closures |
| `rec_shift_data` | Recepción shift operational data |
| `closing_audit_log` | Audit log for cash closures |

**Table `cash_closings` does NOT exist in Supabase.** Any reference to it in code is incorrect and must be replaced.

---

## Technical Rules

- Do not invent architecture.
- If something is missing, mark `[NO DATA]`.
- Do not modify unrelated modules.
- Before modifying code, inspect the relevant files and explain the plan.
- Always modify the inline `index.html` functions — not `caja.js` or `recepcion.js`.
- Do not change Supabase schema without prior warning and justification.
- Do not create new files unless strictly necessary.
- Do not refactor.
- Do not move functions outside of `index.html`.
