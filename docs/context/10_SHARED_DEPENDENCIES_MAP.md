# 10_SHARED_DEPENDENCIES_MAP.md — Mapa de Dependencias de shared.js

Estado: ANÁLISIS COMPLETADO — Solo documentación, sin modificación de código  
Fecha: 2026-05-04  
Regla: Este archivo es entrada para TASK-007. No ejecutar ningún refactor basado en este documento sin confirmación de Alexander.

---

## 0. RESUMEN EJECUTIVO

| Dato | Valor |
|---|---|
| Archivo analizado | `shared.js` (1991 líneas) |
| Funciones definidas en shared.js | ~75 |
| Variables globales mutables | 8 |
| Constantes globales | 11 |
| Scripts externos que dependen de shared.js | 7 archivos .js |
| Funciones que shared.js llama de OTROS archivos | ~20 |
| Funciones duplicadas (inline script gana sobre .js) | 11+ |
| Funciones DEAD CODE en shared.js | 3+ (pinOk, pinPress ref., logout sobreescrito) |

**HALLAZGO CRÍTICO:** El script inline de `index.html` (líneas 1749–4113, ~87 funciones)  
se carga DESPUÉS de todos los `.js` files y SOBREESCRIBE funciones en ellos.  
Muchas funciones en `caja.js`, `checklist.js`, `recepcion.js` son código muerto.

---

## 1. ORDEN DE CARGA ACTUAL (index.html líneas 1741–1749)

```
1. shared.js           ← BASE — cargado primero
2. checklist.js
3. sala.js
4. cajas.js
5. caja.js
6. recepcion.js
7. incidencia_tipos.js
8. dashboard.js
9. [script inline]     ← ÚLTIMO — sobreescribe todo lo anterior
```

---

## 2. FUNCIONES DUPLICADAS — SOBREESCRITAS POR EL SCRIPT INLINE

Las siguientes funciones están definidas tanto en un `.js` file como en el script inline de `index.html`.  
**La versión del script inline SIEMPRE gana** porque se carga última.

| Función | Definida en .js | Línea .js | Sobreescrita por inline | Línea inline |
|---|---|---|---|---|
| `logout` | shared.js | 348 | index.html | 3244 |
| `loadStaffImplicado` | checklist.js | 120 | index.html | 2136 |
| `getStaffImplicado` | checklist.js | 136 | index.html | 2161 |
| `getServicioValue` | caja.js | 263 | index.html | 2653 |
| `displayServicio` | caja.js | 277 | index.html | 2670 |
| `switchValTab` | caja.js | 281 | index.html | 2941 |
| `setDeadlineLimits` | caja.js | 359 | index.html | 3033 |
| `openPostErrorModal` | caja.js | 493 | index.html | 2834 |
| `openCajaOfferModal` | caja.js | 368 | index.html | 3043 |
| `openRecKpiModal` | recepcion.js | 58 | index.html | 3306 |
| `renderFollowupList` | recepcion.js | 442 | index.html | 3695 |
| `renderRecepcionCajaList` | recepcion.js | ? | index.html | 3554 |
| `calcRecDifs` | index.html | 3348 | index.html mismo | 4008 |
| `submitRecKpi` | index.html | 3327 | index.html mismo | 4066 |

**Consecuencia:** Antes de refactorizar `shared.js`, la base real de código activo  
es `shared.js` + `index.html inline`. Los `.js` files son parcialmente código muerto.

---

## 3. CÓDIGO MUERTO EN shared.js

| Elemento | Línea | Problema |
|---|---|---|
| `function logout()` | 348 | Sobreescrita por inline. La versión de shared.js nunca se ejecuta. |
| `function pinOk()` | 330 | El flujo de login es ahora el portal (pK/pGo). Esta función y sus referencias a `updPin`, `login-screen` son dead code. |
| Keyboard listener `pinPress`/`pinDel` | 349 | `login-screen` no existe en el HTML actual (fue reemplazado por el portal). `document.getElementById('login-screen').style` lanza TypeError en cada keydown. |
| `updPin` | llamada en 343, 346, 348 | Función NUNCA DEFINIDA en ningún archivo del proyecto. Causa ReferenceError si se invoca. |

---

## 4. VARIABLES GLOBALES EN shared.js

### 4.1 Constantes (se asignan una vez en evaluación del script)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | API key pública (publishable) |
| `CACHE_TTL` | 30000ms — tiempo de vida de caché |
| `SCHEMA_VERSION` | '5.0' |
| `DEPTS` | Array de 7 departamentos |
| `DEPT_COLORS` | Objeto: dpto → color HEX |
| `DEPT_ICONS` | Objeto: dpto → emoji |
| `ROLE_PINS` | PINs de acceso por rol (admin, chef, fb) |
| `TASK_STATES` | {ABIERTA, EN_PROCESO, CERRADA, VALIDADA} |
| `INCIDENT_STATES` | {ABIERTA, EN_PROCESO, CERRADA, VALIDADA} |
| `SUPERVISOR_DEPT_MAP` | Mapeo rol → departamentos supervisados |

### 4.2 Estado mutable global (leído/escrito desde múltiples archivos)

| Variable | Tipo inicial | Descripción |
|---|---|---|
| `currentUser` | `null` | Usuario activo tras login |
| `currentPin` | `''` | PIN en curso durante login |
| `toggleState` | `{}` | Estado de los toggles del formulario de turno |
| `mermaRows` | `[]` | Filas de merma en el formulario |
| `sinMermaFlag` | `false` | Bandera "sin merma declarada" |
| `editingShiftId` | `null` | ID del turno en edición/corrección |
| `validatingShiftId` | `null` | ID del turno en validación |
| `_editEmpId` | `null` | ID del empleado en edición en Maestro |

### 4.3 Estado de caché (privado, pero en scope global)

| Variable | Descripción |
|---|---|
| `_cache` | Objeto con datos de tablas en memoria |
| `_cacheTs` | Timestamps de última actualización por tabla |

---

## 5. INVENTARIO COMPLETO DE FUNCIONES

### 5.1 → shared_db.js (capa de base de datos)

| Función | Línea | Dependencias internas | Notas |
|---|---|---|---|
| `sbRequest` | 7 | — | HTTP helper REST/Supabase |
| `dbGetAll` | 34 | `sbRequest` | GET con fallback de orden |
| `dbInsert` | 42 | `sbRequest` | POST |
| `dbUpdate` | 46 | `sbRequest` | PATCH by id |
| `dbDelete` | 50 | `sbRequest` | DELETE by id |
| `dbUpsert` | 54 | `sbRequest` | POST array |
| `getDB` | 65 | `dbGetAll` | GET con caché |
| `invalidateCache` | 76 | — | Limpia caché de una tabla |
| `setDB` | 81 | `sbRequest`, `invalidateCache` | Solo usado por importBackup |
| `migrateFromLocalStorage` | 92 | `sbRequest` | No-op en uso normal |
| `auditLog` | 301 | `dbInsert`, `genId` | Lee `currentUser` |

**Constantes requeridas:** `SUPABASE_URL`, `SUPABASE_KEY`, `_cache`, `_cacheTs`, `CACHE_TTL`

---

### 5.2 → shared_format.js (utilidades puras, sin DOM)

**Funciones de fecha/ID:**

| Función | Línea | Notas |
|---|---|---|
| `genId` | 178 | Genera ID único con timestamp |
| `today` | 181 | Fecha ISO YYYY-MM-DD de hoy |
| `fmtDate` | 182 | YYYY-MM-DD → DD/MM/YYYY |
| `fmtTs` | 183 | ISO timestamp → legible |
| `startOfWeek` | 184 | Lunes de la semana actual |
| `startOfMonth` | 185 | Primer día del mes |
| `isOverdue` | 186 | Compara fecha con today() |
| `getDateOnly` | 187 | Date sin hora |
| `toYMD` | 188 | Date → YYYY-MM-DD |
| `getMinTaskDeadline` | 191 | Mañana |
| `getMaxTaskDeadline` | 192 | Hoy + 7 días |
| `validateTaskDeadline` | 193 | {ok, msg} |

**Funciones de normalización de estado:**

| Función | Línea | Notas |
|---|---|---|
| `normalizeTaskState` | 201 | Normaliza a TASK_STATES |
| `normalizeIncidentState` | 210 | Normaliza a INCIDENT_STATES |
| `isTaskOpen` | 218 | Abierta o En proceso |
| `isIncidentOpen` | 219 | Abierta o En proceso |
| `normalizeDeptName` | 220 | Lowercase + trim |

**Funciones de formato:**

| Función | Línea | Notas |
|---|---|---|
| `formatDisplayValue` | 264 | Maneja null, arrays, strings vacíos |
| `formatServiceOrTurn` | 275 | Alias de formatDisplayValue |
| `formatStaffList` | 276 | Alias de formatDisplayValue |
| `recordMatchesShift` | 277 | Compara shift_id, fecha, nombre |

**Funciones de badge HTML (devuelven strings, sin DOM):**

| Función | Línea |
|---|---|
| `deptStyle` | 161 |
| `deptIcon` | 165 |
| `deptBadge` | 166 |
| `bFU` | 1162 |
| `bEstado` | 1163 |
| `bSev` | 1164 |
| `bPrio` | 1165 |
| `bTaskEstado` | 1166 |
| `bIncidentEstado` | 1167 |

**Constantes requeridas:** `TASK_STATES`, `INCIDENT_STATES`, `DEPT_COLORS`, `DEPT_ICONS`

---

### 5.3 → shared_auth.js (permisos y autenticación)

| Función | Línea | Dependencias |
|---|---|---|
| `isAdmin` | 221 | `currentUser` |
| `isSupervisor` | 222 | `SUPERVISOR_DEPT_MAP` |
| `getSupervisorDepartments` | 223 | `isAdmin`, `SUPERVISOR_DEPT_MAP` |
| `canViewDepartment` | 228 | `isAdmin`, `getSupervisorDepartments`, `normalizeDeptName` |
| `canValidateDepartment` | 234 | `isAdmin`, `isSupervisor`, `canViewDepartment` |
| `getRecordDepartment` | 235 | — |
| `canEditRecord` | 248 | `isAdmin`, `getRecordDepartment`, `isSupervisor`, `canViewDepartment` |
| `canValidateTask` | 254 | `isAdmin`, `normalizeTaskState`, `TASK_STATES` |
| `canCloseTask` | 255 | `isAdmin`, `isSupervisor`, `canViewDepartment` |
| `canValidateShift` | 260 | `canValidateDepartment`, `getRecordDepartment` |
| `canEditCashClosing` | 261 | `isAdmin`, `isSupervisor`, `canViewDepartment`, `getRecordDepartment` |
| `canCloseIncident` | 262 | `isAdmin`, `isSupervisor`, `canViewDepartment`, `getRecordDepartment` |
| `canValidateIncident` | 263 | `isAdmin`, `normalizeIncidentState`, `INCIDENT_STATES` |
| `canProgressTask` | 1303 | `normalizeTaskState`, `TASK_STATES`, `isAdmin`, `isSupervisor`, `canViewDepartment`, `currentUser` |
| `pinOk` | 330 | **VER SECCIÓN 3 — CÓDIGO MUERTO** |
| `logout` | 348 | **SOBREESCRITA POR inline** |

**Constantes requeridas:** `SUPERVISOR_DEPT_MAP`, `ROLE_PINS`

---

### 5.4 → shared_core.js (estado, navegación, UI base)

**Navegación y app:**

| Función | Línea | Llamadas a EXTERNOS |
|---|---|---|
| `fixSelectColors` | 352 | — |
| `startApp` | 373 | `buildNav`, `showScreen`, `getDB`, `populateDashEmpDropdowns`, `fixSelectColors` |
| `getScreens` | 390 | `isSupervisor`, `currentUser` |
| `buildNav` | 417 | `getScreens`, `showScreen`, `currentUser` |
| `showScreen` | 454 | `initTurnoForm`, `renderTareas`, `switchValTab`*, `renderDashboard`, `renderCostTable`*, `renderRecepcionCajaList`*, `renderMaestro`, `updateDots` |
| `updateDots` | 480 | `getDB`, `isTaskOpen`, `currentUser` |
| `populateDashEmpDropdowns` | 492 | `getDB` |

**Toggles:**

| Función | Línea | Notas |
|---|---|---|
| `setT` | 503 | Llama a `loadStaffImplicado`* (externo) |
| `resetToggles` | 533 | — |
| `showTaskGen` | 540 | Llama a `setDeadlineLimits`* (externo) |
| `hideTaskGen` | 541 | — |

**Merma:**

| Función | Línea | Notas |
|---|---|---|
| `addMermaRow` | 545 | `genId`, `mermaRows`, `renderMermaRows` |
| `removeMermaRow` | 550 | `mermaRows`, `renderMermaRows` |
| `renderMermaRows` | 551 | Genera HTML con onclik inline |
| `getMermaRow` | 567 | Lee DOM por IDs dinámicos |
| `collectMerma` | 568 | `getMermaRow`, `mermaRows` |
| `updMermaStatus` | 569 | `sinMermaFlag`, `mermaRows` |
| `toggleSinMerma` | 576 | `sinMermaFlag`, `mermaRows`, `renderMermaRows`, `updMermaStatus` |

**UI base:**

| Función | Línea |
|---|---|
| `closeModal` | 1977 |
| `toast` | 1979 |

**Stubs:**

| Función | Línea | Notas |
|---|---|---|
| `runMigrations` | 316 | No-op — tables en Supabase |
| `seedEmployees` | 324 | No-op — seed en SQL |

---

### 5.5 → [REVISAR] Funciones de negocio (no mover todavía)

**Turno:**

| Función | Línea | Llamadas a EXTERNOS (bloqueantes) |
|---|---|---|
| `initTurnoForm` | 585 | `setDeadlineLimits`*, `getRecTurnoValue`*, `updateRecTurnoStyle`*, `clearSalaFields`*, `renderFollowupList`* |
| `clearTurnoForm` | 725 | `clearSalaFields`*, `setDeadlineLimits`* |
| `renderCorrectionsPend` | 754 | `displayServicio`* |
| `loadForCorrection` | 765 | `getDB`, `fmtDate`, `formatServiceOrTurn`, `setT`, `renderMermaRows`, `toast` |
| `_doSaveTurno` | 789 | `_chkSavedState`* (var global), `_ajustesLines`* (var global), `getStaffImplicado`*, `getServicioValue`*, `getRecTurnoValue`* |
| `saveTurno` | 1050 | `chkOpen`* (inline), `openAjustesModal`* (sala.js), `getServicioValue`* |
| `buildInciObj` | 1111 | `getStaffImplicado`* |
| `renderMisTurnos` | 1131 | `displayServicio`*, `getDB`, `fmtDate`, `bEstado` |

**Tareas:**

| Función | Línea |
|---|---|
| `createTask` | 1171 |
| `openTaskModal` | 1184 |
| `saveTask` | 1195 |
| `renderTareas` | 1212 |
| `deleteTask` | 1281 |
| `advanceTask` | 1311 |

**Validación:**

| Función | Línea | Llamadas a EXTERNOS |
|---|---|---|
| `renderValidacion` | 1331 | `displayServicio`*, `openShiftDetail`* (inline), `openPostErrorModal`* (inline), `openReopenModal`* (inline), `deleteShift`* (inline) |
| `openValidarModal` | 1393 | `CHK_COCINA_ITEMS`*, `CHK_FRIEGUE_ITEMS`*, `_initEmpSearchSelect`* (inline) |
| `updMcoste` | 1547 | — |
| `doValidacion` | 1548 | — |

**Dashboard:**

| Función | Línea |
|---|---|
| `renderDashboard` | 1619 |

**Maestro:**

| Función | Línea |
|---|---|
| `renderMaestro` | 1842 |
| `openEmpModal` | 1854 |
| `saveEmpleado` | 1860 |
| `toggleEmp` | 1924 |

**Export:**

| Función | Línea |
|---|---|
| `toCSV` | 1928 |
| `dl` | 1929 |
| `exportCSV` | 1930 |
| `exportFiltered` | 1939 |
| `exportBackup` | 1940 |
| `importBackup` | 1956 |

**Incidencias:**

| Función | Línea |
|---|---|
| `advanceIncident` | 287 |

---

## 6. FUNCIONES QUE shared.js LLAMA DE OTROS ARCHIVOS

| Función | Definida activa en | Tipo de llamada | Riesgo si se mueve |
|---|---|---|---|
| `displayServicio` | index.html:2670 (inline gana sobre caja.js) | directa | ALTO |
| `getServicioValue` | index.html:2653 | directa | ALTO |
| `getRecTurnoValue` | index.html:1826 (inline) | directa | ALTO |
| `loadStaffImplicado` | index.html:2136 (inline gana sobre checklist.js) | directa | MEDIO |
| `getStaffImplicado` | index.html:2161 (inline gana sobre checklist.js) | directa | MEDIO |
| `chkOpen` | index.html:1936 (inline) | directa | ALTO |
| `openAjustesModal` | sala.js | directa | ALTO |
| `clearSalaFields` | sala.js | directa | MEDIO |
| `setDeadlineLimits` | index.html:3033 (inline gana sobre caja.js) | directa | MEDIO |
| `updateRecTurnoStyle` | index.html:1831 (inline) | directa | BAJO |
| `renderRecepcionCajaList` | index.html:3554 (inline) | directa | BAJO |
| `renderCostTable` | index.html inline (gana sobre dashboard.js) | directa | BAJO |
| `renderFollowupList` | index.html:3695 (inline gana sobre recepcion.js) | `typeof` check | BAJO |
| `switchValTab` | index.html:2941 (inline gana sobre caja.js) | directa | BAJO |
| `openShiftDetail` | index.html:1979 (inline) | onclick en HTML generado | BAJO |
| `openPostErrorModal` | index.html:2834 (inline) | onclick en HTML generado | BAJO |
| `openReopenModal` | index.html:2899 (inline) | onclick en HTML generado | BAJO |
| `deleteShift` | index.html:1963 (inline) | onclick en HTML generado | BAJO |
| `_initEmpSearchSelect` | index.html:2790 (inline) | `typeof` check | BAJO |
| `openCajaOfferModal` | index.html:3043 (inline) | llamada desde chkConfirm inline | BAJO |
| `openRecKpiModal` | index.html:3306 (inline) | llamada desde chkConfirm inline | BAJO |
| `_ajustesLines` | sala.js (var global) | variable global en `_doSaveTurno` | ALTO |
| `_chkSavedState` | index.html:1755 (var global) | variable global en `_doSaveTurno` | ALTO |
| `CHK_COCINA_ITEMS` | index.html:1841 (inline) | variable global | MEDIO |
| `CHK_FRIEGUE_ITEMS` | index.html:1863 (inline) | variable global | MEDIO |

---

## 7. FUNCIONES DE shared.js CONSUMIDAS POR OTROS ARCHIVOS

| Función/Variable | Consumidores probables |
|---|---|
| `getDB`, `invalidateCache`, `dbInsert`, `dbUpdate`, `dbDelete` | Todos los .js files + inline |
| `currentUser` | sala.js, checklist.js, recepcion.js, caja.js, dashboard.js, inline |
| `toggleState` | sala.js, inline |
| `editingShiftId`, `validatingShiftId` | checklist.js, inline |
| `toast` | Todos |
| `genId`, `today`, `fmtDate`, `fmtTs` | caja.js, cajas.js, recepcion.js, dashboard.js, inline |
| `isAdmin`, `isSupervisor`, `canViewDepartment` | sala.js, caja.js, recepcion.js |
| `DEPTS`, `DEPT_COLORS`, `DEPT_ICONS` | dashboard.js |
| `TASK_STATES`, `INCIDENT_STATES` | inline, sala.js |
| `normalizeTaskState`, `normalizeIncidentState` | sala.js, dashboard.js |
| `bEstado`, `bSev`, `bPrio`, `deptBadge`, `bTaskEstado`, `bIncidentEstado` | dashboard.js, sala.js, inline |
| `auditLog` | sala.js, caja.js, cajas.js, recepcion.js, inline |
| `SUPABASE_URL`, `SUPABASE_KEY` | inline (`deleteTask`, `saveEmpleado` usan fetch directo) |
| `formatDisplayValue`, `formatServiceOrTurn` | sala.js, dashboard.js, inline |
| `_doSaveTurno` | inline (`chkConfirm`) |
| `closeModal` | Todos |
| `renderTareas`, `updateDots`, `renderDashboard` | inline |
| `isOverdue` | dashboard.js, sala.js |
| `isTaskOpen` | sala.js |

---

## 8. DEPENDENCIAS CIRCULARES DETECTADAS

| Ciclo | Descripción | Impacto |
|---|---|---|
| `shared.js` → `inline` → `shared.js` | `showScreen` llama `switchValTab` (inline). `chkConfirm` (inline) llama `_doSaveTurno` (shared). | CRÍTICO — mayor ciclo |
| `shared.js` → `sala.js` → `shared.js` | shared llama `openAjustesModal`, `clearSalaFields`; sala.js llama `getDB`, `toast`, `currentUser`, etc. | ALTO |
| `shared.js` → `caja.js` → `shared.js` | shared llama funciones que caja.js define (pero sobreescritas por inline); caja.js llama getDB etc. | ALTO |
| `shared.js` → `recepcion.js` → `shared.js` | shared llama `renderRecepcionCajaList`; recepcion.js llama muchas de shared. | MEDIO |

**Nota:** Estos ciclos son inofensivos con `<script src>` normales (scope global).  
Se vuelven BLOQUEANTES si se migra a módulos ES (`import`/`export`).  
**Recomendación: NO migrar a módulos ES en TASK-007.**

---

## 9. CÓDIGO QUE EJECUTA EN TIEMPO DE EVALUACIÓN DEL SCRIPT

Estas líneas corren cuando el browser parsea `shared.js`, NO dentro de funciones.

| Línea | Código | Riesgo si se mueve |
|---|---|---|
| 1–4 | Constantes SUPABASE_URL/KEY | BAJO — deben estar antes de db functions |
| 61–63 | `_cache = {}`, `_cacheTs = {}`, `CACHE_TTL` | BAJO |
| 110–146 | Constantes SCHEMA_VERSION, DEPTS, etc. | BAJO — deben estar antes de que se lean |
| 148–158 | Estado global (`currentUser=null` etc.) | BAJO — init normal |
| 349 | `document.addEventListener('keydown', ...)` | **ALTO** — referencia `login-screen` que ya no existe → TypeError en cada keydown |
| 1978 | `document.querySelectorAll('.modal-overlay')` | MEDIO — requiere DOM. OK porque shared.js se carga al final del body |
| 1983 | `runMigrations()` | BAJO — no-op |
| 1984 | `seedEmployees()` | BAJO — no-op |
| 1985 | `mermaRows = []` | BAJO |
| 1986–1991 | `DOMContentLoaded` listener | BAJO — seguro |

---

## 10. WINDOW.* Y ACCESO DESDE onclick

En modo `<script src>` normal (sin `type="module"`), todas las funciones top-level  
son accesibles como `window.X` automáticamente. **No se necesita `window.X = X` explícito.**

Si en el futuro se usa `type="module"`, TODAS las funciones invocadas desde `onclick=""` en HTML  
necesitarían exposición explícita (>40 funciones). **No usar módulos ES.**

---

## 11. RIESGOS ANTES DEL REFACTOR

| # | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | `index.html` tiene 87 funciones inline que sobreescriben .js files | CRÍTICO | Antes de mover cualquier función, verificar si hay versión inline que ya la reemplaza |
| R2 | `pinOk`, `updPin`, `pinPress`, `pinDel` son dead code / referencias rotas | ALTO | Eliminar `pinOk` y el keyboard listener de shared.js en TASK-007 fase 1 |
| R3 | Keyboard listener de shared.js (línea 349) lanza TypeError en cada keydown | ALTO | Eliminar o mover a `if (document.getElementById('login-screen'))` check |
| R4 | `logout` de shared.js sobreescrita por inline — la versión shared es dead code | ALTO | Eliminar `logout` de shared.js en TASK-007 |
| R5 | `_ajustesLines` (sala.js) y `_chkSavedState` (inline) son globales sin declarar en shared.js | ALTO | Documentar dependencia, no mover `_doSaveTurno` hasta resolver |
| R6 | Sin suite de tests automatizados | ALTO | QA manual obligatorio por cada fase |
| R7 | Dependencias circulares en runtime | MEDIO | Inofensivas con `<script src>` normal. NO usar módulos ES |
| R8 | `deleteTask` y `saveEmpleado` usan fetch directo con SUPABASE_URL/KEY | MEDIO | Mover constantes a shared_db.js o asegurar que shared_db.js cargue primero |
| R9 | `calcRecDifs` y `submitRecKpi` definidas DOS VECES en index.html | MEDIO | No tocar index.html, pero documentar el bug |
| R10 | `.modal-overlay` query ejecuta en evaluación del script | BAJO | OK porque shared.js está al final del body — riesgo solo si se mueve a un script que cargue antes |

---

## 12. PROPUESTA DE MÓDULOS

### shared_db.js (~110 líneas)
Funciones: `sbRequest`, `dbGetAll`, `dbInsert`, `dbUpdate`, `dbDelete`, `dbUpsert`, `getDB`, `invalidateCache`, `setDB`, `migrateFromLocalStorage`, `auditLog`  
Constantes: `SUPABASE_URL`, `SUPABASE_KEY`, `_cache`, `_cacheTs`, `CACHE_TTL`  
Dependencias externas: solo `fetch` (browser API)

### shared_format.js (~100 líneas)
Funciones: todas las de fecha, normalización de estado, formato, badges  
Constantes: `TASK_STATES`, `INCIDENT_STATES`, `DEPT_COLORS`, `DEPT_ICONS`  
Dependencias externas: ninguna (funciones puras)

### shared_auth.js (~60 líneas)
Funciones: `isAdmin`, `isSupervisor`, `getSupervisorDepartments`, `canViewDepartment`, `canValidateDepartment`, `getRecordDepartment`, `canEditRecord`, `canValidateTask`, `canCloseTask`, `canValidateShift`, `canEditCashClosing`, `canCloseIncident`, `canValidateIncident`, `canProgressTask`  
Constantes: `SUPERVISOR_DEPT_MAP`, `ROLE_PINS`  
Funciones eliminadas: `pinOk`, `logout` (dead code)

### shared_core.js (~250 líneas)
Funciones: navegación, toggles, merma, modal/toast, stubs + estado global + constantes  
El INIT block del final de shared.js va aquí con corrección del keydown listener roto

### shared.js residual (~1400 líneas)
Funciones de negocio: turno, tareas, validación, dashboard, maestro, export  
No mover hasta que las 4 fases anteriores estén estables

---

## 13. ORDEN DE CARGA PROPUESTO (POST-REFACTOR)

```html
<script src="shared_core.js"></script>     <!-- 1. Estado + constantes primero -->
<script src="shared_db.js"></script>        <!-- 2. DB layer -->
<script src="shared_format.js"></script>    <!-- 3. Formato/utilidades -->
<script src="shared_auth.js"></script>      <!-- 4. Permisos -->
<script src="shared.js"></script>           <!-- 5. Lógica de negocio residual -->
<script src="checklist.js"></script>
<script src="sala.js"></script>
<script src="cajas.js"></script>
<script src="caja.js"></script>
<script src="recepcion.js"></script>
<script src="incidencia_tipos.js"></script>
<script src="dashboard.js"></script>
<!-- script inline: sigue siendo el último, sigue ganando -->
```

---

## 14. PLAN FASEADO — TASK-007

### FASE 1 — Limpiar dead code de shared.js (riesgo BAJO)

**No mueve funciones, solo elimina código muerto.**

- Eliminar `function pinOk()` (línea 330–347)
- Eliminar `function logout()` (línea 348) — la versión activa está en inline
- Eliminar o corregir el keyboard listener de login (línea 349) — referencia a `pinPress`, `pinDel`, `login-screen` que no existen

**Verificación:** Login sigue funcionando (portal). Logout sigue funcionando (inline).  
**Cambio en index.html:** Ninguno.

---

### FASE 2 — Extraer shared_db.js (riesgo BAJO)

**Qué se mueve:** Capa DB + caché + auditLog.  
**Cambio en index.html:** Añadir `<script src="shared_db.js"></script>` ANTES de shared.js.  
**Verificación:** Login → guardar turno → validar turno → exportar CSV.

---

### FASE 3 — Extraer shared_format.js (riesgo BAJO)

**Qué se mueve:** Funciones de fecha, normalización, formato, badges.  
**Cambio en index.html:** Añadir `<script src="shared_format.js"></script>` DESPUÉS de shared_db.js.  
**Verificación:** Dashboard muestra KPIs. Badges de estado se ven bien.

---

### FASE 4 — Extraer shared_auth.js (riesgo MEDIO)

**Qué se mueve:** Funciones de permisos. Se elimina `pinOk`/`logout` definitivamente.  
**Cambio en index.html:** Añadir `<script src="shared_auth.js"></script>`.  
**Verificación ESPECIAL:**
- Login con cada PIN de rol (admin `300415`, chef `0101`, fb `1010`)
- Login con PIN de empleado
- Verificar que botones de validación respetan permisos
- Verificar que jefe_recepcion solo ve Recepción

---

### FASE 5 — Extraer shared_core.js (riesgo ALTO — última fase)

**Qué se mueve:** Estado global, constantes, navegación, toggles, merma, modal/toast.  
**Condición:** Solo cuando las fases 1–4 estén estables y en producción.  
**Verificación:** Flujo completo de turno, navegación entre pantallas.

---

## CRITERIOS DE ACEPTACIÓN VERIFICADOS

- [x] Existe `docs/context/10_SHARED_DEPENDENCIES_MAP.md`
- [x] No se modificó `shared.js`
- [x] No se modificó `index.html`
- [x] Todas las funciones principales de `shared.js` están listadas
- [x] Cada función tiene categoría propuesta
- [x] Hay propuesta de orden de carga
- [x] Hay lista de riesgos (11 riesgos documentados)
- [x] Hay plan faseado para TASK-007 (5 fases)
- [x] Código dead code documentado (3+ elementos)
- [x] Duplicados entre .js files e inline script documentados (14 casos)
