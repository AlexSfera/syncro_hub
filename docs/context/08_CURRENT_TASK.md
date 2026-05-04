# 08_CURRENT_TASK.md — SYNCROSFERA / SynchroShift

Estado: ACTIVO  
Regla: actualizar este archivo al inicio y fin de cada sesión. Es la fuente rápida de contexto entre sesiones.

---

## TASK-001 — Section markers en index.html + crear Current Task

### Estado
```text
COMPLETADO
```

### Objetivo
Reducir consumo de tokens añadiendo marcas de sección buscables en `index.html` y creando este archivo como contexto activo entre sesiones.

### Archivos modificados
- `docs/context/08_CURRENT_TASK.md` — creado y actualizado.
- `index.html` — añadidos 15 comentarios `<!-- ==================== SECTION: X ==================== -->`.

### Markers actuales en index.html

| SECTION | Línea aprox. | Elemento |
|---|---:|---|
| `styles` | ~8 | Bloque de estilos principal |
| `login` | ~385 | Pantalla portal/PIN |
| `navigation` | ~540 | Navegación principal / topbar |
| `cocina` | ~615 | Bloque Cocina dentro de Mi turno |
| `gestiones` | ~645 | Bloque de gestión pendiente |
| `incidencias` | ~679 | Bloque de incidencia operativa |
| `tareas` | ~778 | Pantalla Tareas |
| `validacion` | ~804 | Pantalla Validación |
| `dashboard` | ~844 | Pantalla Dashboard |
| `maestro` | ~965 | Pantalla Maestro |
| `recepcion` | ~975 | Pantalla Caja Recepción |
| `cajas` | ~1007 | Pantalla Caja Sala |
| `modals` | ~1029 | Bloque de modales |
| `sala` | ~1186 | Bloque / modal Ajustes Sala |
| `scripts-inline` | ~1749 | Script inline final con lógica principal |

### Cómo usar los markers

```bash
grep -n "SECTION: dashboard" index.html
grep -n "SECTION: cajas" index.html
grep -n "SECTION:" index.html
```

### Criterios de aceptación verificados
- [x] `08_CURRENT_TASK.md` existe en `docs/context/`.
- [x] 15 markers `SECTION:` en `index.html`.
- [x] Sin cambios funcionales.
- [x] Sin cambios visuales.
- [x] Sin modificación de IDs, clases, eventos ni funciones.
- [x] Diff final solo añade comentarios HTML.

---

## TASK-002 — Dividir documentación Dashboard

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P1
```

### Objetivo
Dividir `04_MODULE_DASHBOARD.md` para reducir contexto en sesiones futuras y separar trabajo de datos/SQL del trabajo de control/QA/endpoints.

### Archivos afectados
- `docs/context/04_MODULE_DASHBOARD.md`
- `docs/context/04_DASHBOARD_DATOS.md` — nuevo
- `docs/context/04_DASHBOARD_CONTROL.md` — nuevo

### División esperada

```text
04_DASHBOARD_DATOS.md
→ fuentes de datos
→ tablas
→ campos
→ filtros
→ KPIs
→ fórmulas
→ SQL
→ cajas SQL
→ migraciones
→ agregaciones
→ métricas
→ reglas de cálculo
→ estados incluidos/excluidos

04_DASHBOARD_CONTROL.md
→ conciliaciones
→ alertas
→ endpoints
→ permisos
→ validación
→ QA
→ riesgos
→ checklist
→ prompts técnicos
→ pruebas
→ criterios de aceptación
→ producción
```

### Reglas
- No eliminar contenido.
- No resumir contenido.
- No cambiar reglas de negocio.
- No cambiar fórmulas KPI.
- No cambiar SQL.
- No eliminar QA, riesgos ni prompts.
- Mantener `[NO DATA]`.
- No tocar código.
- No tocar `index.html`.
- No tocar `shared.js`.
- Dejar `04_MODULE_DASHBOARD.md` como índice/puente.

### Archivos resultantes
- `04_DASHBOARD_DATOS.md` — 1613 líneas (secciones 0–8, 16)
- `04_DASHBOARD_CONTROL.md` — 1164 líneas (secciones 9–15, 17–19)
- `04_MODULE_DASHBOARD.md` — 63 líneas (índice/puente)

### Criterios de aceptación verificados
- [x] Existen `04_DASHBOARD_DATOS.md` y `04_DASHBOARD_CONTROL.md`.
- [x] `04_MODULE_DASHBOARD.md` queda como índice/puente.
- [x] No se pierde contenido.
- [x] SQL/KPIs/datos quedan en `04_DASHBOARD_DATOS.md`.
- [x] QA/control/endpoints/riesgos quedan en `04_DASHBOARD_CONTROL.md`.
- [x] No aparece “MUSE”.
- [x] Se mantienen nombres correctos: SYNCROSFERA, SYNCROLAB, MEWS, POSMEWS.
- [x] Git diff no toca código.

---

## TASK-003 — Dividir `06_DATA_MODEL.md` en schema + SQL

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P1.2
```

### Objetivo
Dividir `06_DATA_MODEL.md` (~1.885 líneas) en dos archivos especializados para reducir contexto en sesiones futuras.

### Archivos resultantes
- `06a_DATA_MODEL_SCHEMA.md` — schema, campos, relaciones, reglas, riesgos
- `06b_DATA_MODEL_SQL.md` — SQL de migración, queries dashboard, conciliaciones, endpoints, QA checklist, prompt técnico
- `06_DATA_MODEL.md` — índice/puente (~40 líneas)

### Criterios de aceptación verificados
- [x] Existe `06a_DATA_MODEL_SCHEMA.md`.
- [x] Existe `06b_DATA_MODEL_SQL.md`.
- [x] `06_DATA_MODEL.md` queda como índice/puente.
- [x] No se pierde contenido.
- [x] No se resumen reglas.
- [x] No se cambian nombres de tablas.
- [x] No se cambia SQL.
- [x] No se eliminan warnings ni riesgos.
- [x] No se eliminan bloques `[NO DATA]`.
- [x] No se modifica código.
- [x] No se ejecutó ningún SQL.

---

## TASK-004 — Confirmar decisiones P0 en `09_DECISIONS_PENDING.md`

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P1.3
```

### Objetivo
Revisar `09_DECISIONS_PENDING.md`, presentar las decisiones P0 a Alexander y registrar las confirmaciones en el archivo.

### Decisiones confirmadas
- DEC-P0-002 — Tabla definitiva para FIO → **Confirmado** (2026-05-04)
- DEC-P0-003 — Tabla definitiva para gestiones pendientes → **Confirmado** (2026-05-04)
- DEC-P0-004 — Fechas normalizadas en Supabase → **Confirmado** (2026-05-04)

### Decisiones aún pendientes
- DEC-P0-001 — Política de eliminación → **Pendiente**

### Archivos modificados
- `docs/context/09_DECISIONS_PENDING.md` — Estado y Resultado final actualizados en DEC-P0-002, 003, 004.
- `docs/context/08_CURRENT_TASK.md` — este archivo.

### Criterios de aceptación verificados
- [x] DEC-P0-002 actualizada con decisión, fecha y quién decidió.
- [x] DEC-P0-003 actualizada con decisión, campos confirmados, fecha y quién decidió.
- [x] DEC-P0-004 actualizada con decisión, columnas confirmadas, fecha y quién decidió.
- [x] No se tocó código.
- [x] No se ejecutó SQL.
- [x] No se tocó `index.html` ni `shared.js`.

---

## TASK-005 — Confirmar DEC-P0-001 (política de eliminación)

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P1.4
```

### Objetivo
Registrar la decisión de Alexander sobre política de eliminación en producción.

### Decisión confirmada
- DEC-P0-001 — Política de eliminación → **Confirmado modelo híbrido** (2026-05-04)

### Archivos modificados
- `docs/context/09_DECISIONS_PENDING.md` — Estado y Resultado final actualizados en DEC-P0-001.
- `docs/context/08_CURRENT_TASK.md` — este archivo.

### Criterios de aceptación verificados
- [x] DEC-P0-001 actualizada con decisión, fecha y quién decidió.
- [x] Modelo híbrido documentado: soft delete normal + hard delete solo Admin.
- [x] Requisitos de audit log previo al hard delete documentados.
- [x] No se tocó código.
- [x] No se ejecutó SQL.
- [x] No se tocó `index.html` ni `shared.js`.

---

## TASK-006 — Mapa de dependencias de shared.js

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P1.5
```

### Objetivo
Analizar `shared.js` y preparar mapa técnico de división segura antes de cualquier refactor.

### Archivos leídos
- `shared.js` (1991 líneas)
- `index.html` líneas 1741–1748 (orden de carga de scripts)
- `index.html` script inline (líneas 1749–4113)
- `caja.js`, `checklist.js`, `recepcion.js` — búsquedas de funciones duplicadas

### Archivos creados
- `docs/context/10_SHARED_DEPENDENCIES_MAP.md`

### Hallazgos críticos
1. El script inline de index.html (~87 funciones) sobreescribe 14 funciones de archivos .js
2. `shared.js` contiene dead code: `pinOk`, `logout` (inline gana), keyboard listener roto
3. `updPin`, `pinPress`, `pinDel` nunca están definidas en ningún archivo
4. Dependencias circulares shared.js ↔ sala.js / checklist.js / inline — inofensivas con `<script src>` normal

### Criterios de aceptación verificados
- [x] `10_SHARED_DEPENDENCIES_MAP.md` creado
- [x] No se modificó código
- [x] No se modificó shared.js
- [x] No se modificó index.html
- [x] Todas las funciones principales listadas y categorizadas
- [x] Orden de carga propuesto
- [x] 11 riesgos documentados
- [x] Plan faseado de 5 fases para TASK-007

---

## PRÓXIMAS TAREAS — NO EMPEZAR TODAVÍA

| Prioridad | Tarea | Estado |
|---|---|---|
| **P2 — SIGUIENTE** | **TASK-007: Dividir `shared.js` en módulos** | **Pendiente confirmación — leer TASK-006 primero** |
| P3 | Extraer templates HTML de `index.html` | Futuro |
| P3 | Implementar Caja SYNCROLAB | Futuro / depende de tabla real |

---

## ESTADO GENERAL DEL PROYECTO

### Branch activa
```text
feature/cajas-v1
```

### Módulos operativos
- Login / PIN / Portal
- Mi Turno: Sala, Cocina, Recepción Hotel
- Tareas interdepartamento
- Validación Admin
- Dashboard operativo en mejora
- Caja Sala: `sala_cash_closures`
- Caja Recepción Hotel: `recepcion_cash`

### Módulos en desarrollo o pendientes
- Caja SYNCROLAB: `syncrolab_cash_closures` definido en documentación, no implementado aún.

### Decisiones P0 pendientes
Ver `09_DECISIONS_PENDING.md`.

Pendientes críticos:
- DEC-P0-001 — política de eliminación. [CONFIRMADO 2026-05-04]
- DEC-P0-002 — tabla definitiva para FIO. [CONFIRMADO 2026-05-04]
- DEC-P0-003 — tabla definitiva para gestiones pendientes. [CONFIRMADO 2026-05-04]
- DEC-P0-004 — fechas normalizadas en Supabase. [CONFIRMADO 2026-05-04]

Todas las decisiones P0 están confirmadas.

### Regla Caja Recepción
Usar `recepcion_cash` como tabla canónica.  
Mantener `recepcion_cash_closures` como legacy hasta revisión/migración.

---

## REGLAS DE ESTE ARCHIVO

- Actualizar estado de tarea al completarla.
- Mantener solo contexto activo.
- No duplicar documentación larga.
- No documentar código aquí.
- No superar 150 líneas activas si no es necesario.
- Si algo no está confirmado por Alexander, marcar `[NO DATA]`.
