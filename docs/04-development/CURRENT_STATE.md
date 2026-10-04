## Actualización verificada — 04/10/2026

Esta sección prevalece para Planificación Horaria sobre el inventario histórico inferior.
Alcance: saldos certificados de vacaciones con corte **30/09/2026**; no se usa la fecha de activación de Bitrix como fecha contractual.

| Elemento | Estado | Evidencia |
|---|---|---|
| Aperturas 2026 y pendiente 2025 | VERIFICADO | 48 empleados conciliados con la fuente; 40 aperturas cero de 2025 incorporadas |
| Ausencias futuras | VERIFICADO | 7 periodos importados, sin consumir el saldo de apertura |
| Admisión de apertura cero | CONECTADO | Migración LIVE 20261004164824; consumos negativos y otros movimientos no nulos conservan sus restricciones |
| Fecha de corte en pantalla | IMPLEMENTADO / TESTEADO | Bootstrap usa la fecha operativa de la auditoría; prueba de render con cero y corte |
| Comprobación visual con sesión real | [NO DATA] | No se ha ejecutado una sesión autenticada de empleado o supervisor |
| Horas trabajadas y fechas contractuales | [NO DATA] | La fuente aportada no acredita esos datos |

La importación cubre **48 de 65 filas**. Permanecen 17 sin cargar: 5 incompletas, 9 sin vínculo inequívoco con un empleado existente y 3 con contradicciones o liquidación pendiente. No se inventan ceros para filas sin datos.
La pantalla conserva el filtro existente de empleados activos: los saldos históricos de empleados con otro estado no aparecen en ese listado.

Reglas vigentes: [PROJECT_RULES.md](../../PROJECT_RULES.md).
Rama de entrega: `codex/vacaciones-cero-corte-20260930`, basada en la revisión operativa `9e21b8acf64f25d369fe8584315235e131846ee1`; `main` se conserva.
Reversión de pantalla: deployment anterior `dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV`.
La reversión del CHECK SQL está protegida y se detiene si existen aperturas cero: no elimina ni modifica el historial certificado.

---

# SYNCRO Shift — Estado actual del proyecto

## 1. Objetivo

Este documento registra el estado real y verificable del proyecto SYNCRO Shift.

La existencia de un archivo de código o de una documentación no significa automáticamente que una funcionalidad:

- esté terminada;
- funcione correctamente;
- haya sido probada;
- esté desplegada;
- esté aprobada funcionalmente.

Cuando no exista evidencia suficiente se utilizará:

`[NO DATA]`

## 2. Escala de estado

| Estado | Significado |
|---|---|
| NO VERIFICADO | Existe código o documentación, pero no se ha comprobado su funcionamiento |
| PARCIAL | Parte de la funcionalidad está implementada |
| IMPLEMENTADO | El código parece completo, pendiente de validación funcional |
| VERIFICADO | La funcionalidad ha sido probada y cumple los criterios definidos |
| BLOQUEADO | Existe un impedimento técnico o funcional |
| NO INICIADO | No existe implementación identificada |
| OBSOLETO | La implementación o documentación ya no debe utilizarse |

## 3. Estado general

| Área | Estado actual |
|---|---|
| Repositorio GitHub | VERIFICADO |
| Rama estable `main` | EXISTE |
| Rama de backup pre-Codex | VERIFICADO |
| Rama de documentación Claude–Codex | VERIFICADO |
| Despliegue Vercel | [NO DATA] |
| Proyecto Supabase | EXISTE, configuración no verificada |
| Migraciones Supabase versionadas | [NO DATA] |
| Tests automáticos | [NO DATA] |
| Build automatizado | [NO DATA] |
| Lint | [NO DATA] |
| Integración Bitrix24 | EXISTE, funcionamiento no verificado |
| Integración de correo | EXISTE, funcionamiento no verificado |
| Documentación funcional | EXISTE, en proceso de consolidación |
| Documentación arquitectónica | EXISTE parcialmente y requiere validación |
| `AGENTS.md` para Codex | EXISTE |
| `CLAUDE.md` para Claude | NO INICIADO |

## 4. Inventario preliminar de módulos

| ID | Módulo | Archivo principal identificado | Documentación identificada | Estado | Validación |
|---|---|---|---|---|---|
| MOD-001 | Núcleo compartido | `shared.js` | Varios documentos de contexto | NO VERIFICADO | Pendiente |
| MOD-002 | Interfaz principal | `index.html` | `00_overview.md` | NO VERIFICADO | Pendiente |
| MOD-003 | Recepción | `recepcion.js` | `04_departments.md` | NO VERIFICADO | Pendiente |
| MOD-004 | Turnos | `mi_turno.js` | `05_shifts_and_checklists.md`, `22_auto_turno_assignment.md`, `23_feat_turno_auto_implementation.md` | NO VERIFICADO | Pendiente |
| MOD-005 | Checklists | `checklist.js` | `05_shifts_and_checklists.md` | NO VERIFICADO | Pendiente |
| MOD-006 | Fichaje | `fichaje.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-007 | Caja | `caja.js` | `10_caja_all.md` | NO VERIFICADO | Pendiente |
| MOD-008 | Sala | `sala.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-009 | SYNCROLAB | `syncrolab.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-010 | Validaciones | `validacion.js` | `14_validations.md` | NO VERIFICADO | Pendiente |
| MOD-011 | Incidencias | `incidencias.js` | `07_incidents.md` | NO VERIFICADO | Pendiente |
| MOD-012 | Tipos de incidencia | `incidencia_tipos.js` | `07_incidents.md` | NO VERIFICADO | Pendiente |
| MOD-013 | Gestiones pendientes | `gestiones.js` | `08_pending_managements.md` | NO VERIFICADO | Pendiente |
| MOD-014 | Tareas | `tareas.js` | `09_tasks.md` | NO VERIFICADO | Pendiente |
| MOD-015 | Housekeeping | `housekeeping.js` | `20_housekeeping.md` | NO VERIFICADO | Pendiente |
| MOD-016 | Mantenimiento | `mantenimiento.js` | `21_maintenance_purchases.md` | NO VERIFICADO | Pendiente |
| MOD-017 | Informes | `informes.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-018 | Dashboard | `dashboard.js` | `_ARCHIVE/15_dashboard.md` | NO VERIFICADO | Pendiente |
| MOD-019 | Rendimiento individual | `mi_rendimiento.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-020 | Incentivos | `incentivos.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-021 | Merma de cocina | `merma.js` | `13_kitchen_waste.md` | NO VERIFICADO | Pendiente |
| MOD-022 | Hipoxia | `hypoxic.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-023 | Adjuntos | `adjuntos.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-024 | FIO | `fio.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-025 | Fallos técnicos | `faults.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-026 | Middleware | `middleware.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-027 | Sincronización Bitrix24 | `bitrix-sync.js`, `api/bitrix-sync.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-028 | Envío de correo | `api/send-email.js` | [NO DATA] | NO VERIFICADO | Pendiente |

## 5. Riesgos identificados

### 5.1 Documentación contradictoria

Existen documentos activos, archivados, reemplazados y consolidados en diferentes momentos.

Riesgo:

- Codex podría implementar una especificación obsoleta;
- Claude podría basarse en una conversación anterior;
- el código real podría no coincidir con la documentación.

### 5.2 Falta de pruebas verificadas

No se ha confirmado todavía la existencia de:

- tests unitarios;
- tests de integración;
- tests end-to-end;
- proceso automático de build;
- proceso automático de lint.

Estado: `[NO DATA]`

### 5.3 Modelo de datos no versionado

Existe documentación relacionada con Supabase, pero todavía no se ha confirmado:

- si las tablas reales coinciden con la documentación;
- si existen migraciones SQL;
- si las políticas RLS están versionadas;
- si las funciones y triggers están documentados.

Estado: `[NO DATA]`

### 5.4 Archivos de gran tamaño

Existen archivos JavaScript con muchas responsabilidades, especialmente:

- `shared.js`;
- `validacion.js`;
- `housekeeping.js`;
- `informes.js`;
- `recepcion.js`;
- `caja.js`;
- `dashboard.js`;
- `mi_turno.js`.

No se autoriza una refactorización general hasta comprender:

- dependencias;
- flujo de carga;
- funciones compartidas;
- impacto sobre módulos;
- comportamiento en producción.

### 5.5 Credenciales y secretos

Las credenciales no deben incorporarse al repositorio.

Archivos y datos prohibidos:

- `.env`;
- claves API;
- tokens;
- contraseñas;
- certificados;
- datos reales de clientes;
- exportaciones de producción.

## 6. Próximas verificaciones

El orden de revisión será:

1. arquitectura general;
2. estructura real de Supabase;
3. autenticación;
4. roles y permisos;
5. departamentos;
6. turnos;
7. fichaje;
8. checklists;
9. validaciones;
10. caja;
11. resto de módulos.

## 7. Criterio para actualizar este documento

Un módulo solo puede pasar a `VERIFICADO` cuando exista evidencia de:

1. requisito funcional definido;
2. código identificado;
3. base de datos identificada;
4. permisos revisados;
5. flujo probado;
6. resultado esperado confirmado;
7. incidencias registradas;
8. aprobación funcional.

## 8. Responsable

Responsable funcional: Alexander Kolobnev

Estado del documento: BORRADOR

Fecha: 2026-07-31

