# SYNCRO SHIFT — Inventario documental vigente

**Estado:** ACTIVO
**Corte:** 2026-10-02

## Lectura obligatoria

| Orden | Documento | Función |
|---:|---|---|
| 1 | `AGENTS.md` | Reglas operativas y de seguridad del repositorio |
| 2 | `docs/MASTER_DOCUMENTATION.md` | Entrada maestra y resumen del sistema |
| 3 | `docs/00-governance/SOURCE_OF_TRUTH.md` | Jerarquía de evidencia |
| 4 | `docs/00-governance/AGENT_INSTRUCTIONS.md` | Instrucciones permanentes para agentes |
| 5 | `docs/01-architecture/ARCHITECTURE.md` | Arquitectura técnica actual |
| 6 | `docs/04-development/CURRENT_STATE.md` | Corte verificable del proyecto |
| 7 | `docs/04-development/MODULE_STATUS.md` | Estado de todos los módulos |

## Documentación funcional activa

| Área | Documentos |
|---|---|
| Roles y permisos | `docs/context/03_roles_permissions.md` |
| Departamentos | `docs/context/04_departments.md` |
| Turnos y checklists | `docs/context/05_shifts_and_checklists.md`, `22_auto_turno_assignment.md`, `23_feat_turno_auto_implementacion.md` |
| Incidencias | `docs/context/07_incidents.md` |
| Gestiones | `docs/context/08_pending_managements.md` |
| Tareas | `docs/context/09_tasks.md` |
| Caja | `docs/context/10_caja_all.md` |
| Merma | `docs/context/13_kitchen_waste.md` |
| Validaciones | `docs/context/14_validations.md` |
| Housekeeping | `docs/context/20_housekeeping.md` |
| Mantenimiento | `docs/context/21_mantenimiento_kanban.md` |
| Riesgos conocidos | `docs/context/trampas.md` |
| Mapa técnico histórico | `docs/context/mapa-modulos.md` |
| Esquema Supabase histórico | `docs/context/esquema-supabase.md` |

Los documentos funcionales anteriores deben contrastarse con código y estado
LIVE antes de implementar. Sus fechas y conteos no se actualizan de forma
automática.

## Seguridad, decisiones y auditoría

| Documento | Uso |
|---|---|
| `docs/P0_AUTH_IMPLEMENTATION.md` | Diseño e implementación histórica de Auth |
| `docs/P0_RLS_ACCESS_MATRIX.md` | Matriz RLS y plan de corte |
| `docs/P0_SECURITY_CONTAINMENT_PLAN.md` | Plan de contención P0 |
| `docs/AUDIT_ACTION_REGISTER.md` | Registro histórico de hallazgos y acciones |
| `docs/04-development/issues/ARCH-001.md` | Decisión sobre modularización progresiva |

## Handoffs y artefactos específicos

- `docs/HANDOFF_POSMEWS_Ventas_Datos.md`
- `docs/POSMEWS_Ventas_Datos_Analisis_Previo.html`
- `docs/Este texto sustituye y amplía la instruc.md`

Son materiales de trabajo o transferencia. No sustituyen el estado maestro.

## Archivo histórico

Todo `docs/context/_ARCHIVE/` es histórico. Puede explicar decisiones pasadas,
pero no debe utilizarse como especificación vigente sin revalidación.

## Regla de inventario

Todo documento nuevo debe indicar propietario lógico, fecha, estado y fuente de
evidencia. Si reemplaza otro documento, debe enlazarlo y marcar el anterior como
histórico; no se eliminan antecedentes necesarios para la trazabilidad.
