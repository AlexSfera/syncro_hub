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

## TASK-007 Fase 1 — Limpiar dead code en shared.js

### Estado
```text
COMPLETADO
```

### Prioridad
```text
P2
```

### Objetivo
Eliminar dead code confirmado en shared.js sin tocar lógica activa.

### Cambios realizados
- Eliminada `function pinOk()` (líneas 330–347 originales) — flujo de login reemplazado por portal
- Eliminada `function logout()` (línea 348 original) — sobreescrita por inline, nunca se ejecutaba
- Eliminado keyboard listener (línea 349 original) — referenciaba `login-screen`, `pinPress`, `pinDel` inexistentes → TypeError en cada keydown

### Archivos modificados
- `shared.js` — 1991 → 1972 líneas (−19, diff limpio: 1 insertion / 20 deletions)
- `docs/context/08_CURRENT_TASK.md` — este archivo

### Archivos NO modificados (confirmado)
- `index.html` — sin cambios
- `dashboard.js` — sin cambios
- `sala.js`, `caja.js`, `cajas.js`, `recepcion.js`, `checklist.js` — sin cambios
- Permisos — sin cambios
- CRUD — sin cambios
- Supabase — sin cambios

### Referencias activas conservadas en shared.js
- `startApp()` línea 336 actual: `if(ls2)` check sobre `login-screen` — seguro, con null check
- `DOMContentLoaded` línea 1949 actual: `if(ls)` check sobre `login-screen` — seguro, con null check

### QA automático verificado
- [x] `pinOk` eliminada de shared.js
- [x] `logout` de shared.js eliminada (versión activa sigue en inline de index.html)
- [x] Keyboard listener roto eliminado
- [x] No se tocaron permisos, CRUD, dashboard
- [x] No se movieron funciones
- [x] No se crearon módulos
- [x] No se modificó index.html
- [x] Referencias con null check en startApp y DOMContentLoaded conservadas
- [x] Diff limpio: 1 insertion / 20 deletions, sin ruido de whitespace
- [x] Line endings originales preservados (CRLF/LF mixto original intacto)

### QA manual pendiente en navegador
- [ ] Abrir `index.html` en navegador
- [ ] Login correcto con PIN de admin (`300415`) → portal abre sesión sin error
- [ ] Login correcto con PIN de chef (`0101`) → portal abre sesión sin error
- [ ] Login correcto con PIN de fb (`1010`) → portal abre sesión sin error
- [ ] Login con PIN incorrecto → muestra error y resetea (lógica en inline, no en shared.js)
- [ ] Logout desde cualquier sesión → regresa al portal (lógica en inline, no en shared.js)
- [ ] Navegar a cada pantalla → sin errores en consola
- [ ] Abrir DevTools → consola sin TypeError ni ReferenceError al pulsar teclas

---

## TASK-007 Fase 2 — Extraer shared_db.js

### Estado
```text
COMPLETADO — QA automático OK — QA manual OK (confirmado Alexander 2026-05-04)
```

### Objetivo
Mover capa DB de `shared.js` a `shared_db.js`, cargando el nuevo archivo antes que `shared.js`.

### Cambios realizados
- Creado `shared_db.js` (126 líneas): `SUPABASE_URL/KEY`, `sbRequest`, `dbGetAll/Insert/Update/Delete/Upsert`, `getDB`, `invalidateCache`, `setDB`, `migrateFromLocalStorage`, `auditLog`
- `shared.js` — 1972 → 1854 líneas (−118): bloque DB reemplazado por 2 stubs de comentario
- `index.html` — +1 línea: `<script src="shared_db.js"></script>` antes de `<script src="shared.js"></script>`

### Archivos NO modificados
- `sala.js`, `caja.js`, `cajas.js`, `recepcion.js`, `checklist.js`, `dashboard.js` — intactos
- Permisos, CRUD, lógica de negocio — sin cambios

### QA automático verificado
- [x] `node --check shared_db.js` — sin errores de sintaxis
- [x] `node --check shared.js` — sin errores de sintaxis
- [x] 11 funciones DB presentes en `shared_db.js` y ausentes en `shared.js`
- [x] `index.html`: `shared_db.js` carga ANTES de `shared.js`
- [x] Diff `shared.js`: solo stubs de comentario, sin ruido de whitespace
- [x] Diff `index.html`: 1 línea añadida

### QA manual en navegador — OK (Alexander 2026-05-04)
- [x] Login con PIN admin → sesión abre y app carga sin error en consola
- [x] Login con PIN chef → sesión abre
- [x] DevTools Network → `shared_db.js` carga con 200
- [x] Guardar turno → sin error Supabase en consola
- [x] Validar turno → sin error
- [x] Dashboard carga → sin error
- [x] Exportar CSV → sin error

---

## TASK-010 — BUG-CAJA-RECEPCION-LOGICA-003: Causa raíz fondoRec = 0

### Estado
```text
COMPLETADO — SQL ejecutado en Supabase — QA manual OK (confirmado Alexander 2026-05-04)
```

### Prioridad
```text
P1 — Bug crítico
```

### Diagnóstico
4 definiciones de `calcRecDifs` en el codebase:

| Archivo | Línea | Estado | Fórmula difCash |
|---|---|---|---|
| recepcion.js | 100 | muerta (overwritten por 697) | helpers.calcularDiferenciaFisicaCaja |
| recepcion.js | 697 | muerta (overwritten por inline) | helpers.calcularDiferenciaFisicaCaja |
| index.html | ~3377 | muerta (overwritten por ~4075) | helpers.calcularDiferenciaFisicaCaja |
| index.html | **~4075** | **ACTIVA** | `realCash - fondoRec - mewsCash` ✓ |

**Fórmula en función activa ERA correcta.** La causa raíz era otra:

`applyAutoInitialFund` (cajas.js:380) hace `readOnly=true` en `rec-fondo-recibido` con `prev.fondo_traspasado`. Si ese valor es 0 en DB (guardado con código viejo antes de TASK-008), el campo queda bloqueado a 0 y el usuario no puede entrar 100. calcRecDifs leía fondoRec = 0 → difCash = 180 - 0 - 80 = 100.

### Fix aplicado
En `openRecCajaModal` (inline script ~3489):
- Prefiere `fondo_real_a_traspasar` (nuevo campo TASK-009) sobre `fondo_traspasado`
- Solo llama `applyAutoInitialFund` (y bloquea el campo) cuando el valor auto-cargado es **> 0**
- Si el valor es 0 (dato incorrecto en DB), el campo queda editable → usuario puede entrar el valor correcto

### Verificaciones
```
fondoRec=100, mewsCash=80, realCash=180, cfImporte=50:
  difCash    = 180 − 100 − 80 = 0   ✓
  fondoFinal = 100 + 80 − 50 = 130  ✓
  difTotal   = difCash + difTar + difStr + difTransf (sin dif_fondo_traspaso) ✓
```

### Archivos modificados
- `index.html` — `openRecCajaModal`: lógica de auto-fill corregida (~3489)

### Archivos NO modificados
- `cajas.js`, `recepcion.js`, `shared.js`, `shared_db.js`, `sala.js` — intactos

### No hay SQL adicional
Los campos usados (`fondo_real_a_traspasar`, `fondo_traspasado`) ya están en el SQL pendiente de TASK-008/009.

### QA manual — OK (Alexander 2026-05-04)
- [x] SQL aditivo completo (TASK-008 + TASK-009) ejecutado en Supabase
- [x] `rec-fondo-recibido` editable cuando previo = 0
- [x] Fórmulas: Δ Cash = 0, Fondo esperado = 130, Total desvío = 0 ✓
- [x] Campo se auto-carga correctamente en registros existentes
- [x] Campo se bloquea cuando `fondo_traspasado > 0` en DB ✓
- [x] Caja Sala intacta — sin cambios

---

## TASK-009 — BUG-CAJA-RECEPCION-LOGICA-002: Traspaso + Fondo real

### Estado
```text
COMPLETADO — SQL ejecutado en Supabase — QA manual OK (confirmado Alexander 2026-05-04)
```

### Prioridad
```text
P1 — Bug crítico
```

### Bugs / features implementados
1. **Fondo recibido como referencia de Δ Cash**: fórmula `difCash = realCash - fondoRec - mewsCash` ya estaba en función activa (línea ~4072); si mostraba +100 era porque `fondo_traspasado` en DB estaba en 0 (SQL pendiente) → `applyAutoInitialFund` cargaba 0 en campo readonly.
2. **Bloque TRASPASO AL SIGUIENTE TURNO** añadido entre EFECTIVO y TARJETA:
   - Campo `rec-fondo-traspaso-real` (editable, usuario introduce lo que físicamente traspasa)
   - Display 3 columnas: Esperado | Real | Diferencia (colores green/blue/red)
   - Alerta separada `rec-traspaso-alert` si diferencia traspaso ≠ 0
3. **Validación**: si `dif_fondo_traspaso ≠ 0`, bloque explicación obligatoria se activa (mismo `rec-dif-exp-block`)
4. **Total desvío operativo NO cambiado** (sigue siendo cash + tarjeta + stripe + transferencia)
5. **Label**: "Fondo de caja final" → "Fondo esperado a traspasar"

### Función activa
`calcRecDifs` en index.html línea ~4072 (la de línea ~3366 es dead code)

### Fórmulas implementadas
```
difCash          = realCash - fondoRec - mewsCash
fondoEsperado    = fondoRec + mewsCash - cfImporte    (= fondoFinal, read-only)
difFT            = fondoTraspasoReal - fondoEsperado
difTotal         = difCash + difTar + difStr + difTransf  (sin cambios)
```

### Campos nuevos guardados en DB
- `fondo_real_a_traspasar` — lo que el recepcionista físicamente traspasa
- `dif_fondo_traspaso` — diferencia vs fondo esperado

### Archivos modificados
- `index.html` — HTML modal + calcRecDifs activo + submitRecCaja + openRecCajaModal

### Archivos NO modificados
- `shared.js`, `shared_db.js`, `sala.js`, `cajas.js`, `caja.js`, `recepcion.js`, `dashboard.js`

### SQL aditivo PENDIENTE — ejecutar en Supabase
```sql
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS fondo_real_a_traspasar numeric DEFAULT NULL;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS dif_fondo_traspaso     numeric DEFAULT 0;
```
*(Ver también SQL pendiente de TASK-008 arriba)*

### QA automático verificado
- [x] `node --check shared.js` — sin errores
- [x] `node --check shared_db.js` — sin errores
- [x] HTML: `rec-fondo-traspaso-real`, `rec-fondo-esperado-disp`, `rec-fondo-real-disp`, `rec-dif-fondo-traspaso`, `rec-traspaso-alert` presentes
- [x] `calcRecDifs` activo lee `rec-fondo-traspaso-real` y calcula `difFT`
- [x] `submitRecCaja` guarda `fondo_real_a_traspasar` y `dif_fondo_traspaso`
- [x] `openRecCajaModal` resetea y carga nuevo campo
- [x] Caja Sala (`calcCajaDifs`, `sala_cash_closures`) intacta — 25 referencias sin cambios

### QA manual — OK (Alexander 2026-05-04)
- [x] SQL aditivo (TASK-008 + TASK-009) ejecutado en Supabase
- [x] Sección TRASPASO AL SIGUIENTE TURNO visible ✓
- [x] Fórmulas: Δ Cash = 0, Fondo esperado = 130 ✓
- [x] Fondo real a traspasar: campo vacío → sin alerta ✓
- [x] Fondo real = 130 → Diferencia = 0, sin alerta ✓
- [x] Fondo real = 0 → Diferencia = −130, alerta + explicación obligatoria ✓
- [x] Persistencia en DB correcta ✓
- [x] Caja Sala intacta — fórmulas sin cambios ✓

---

## TASK-008 — Bug fix Caja Recepción: fórmulas + Transferencia + UI

### Estado
```text
COMPLETADO — SQL ejecutado en Supabase — QA manual OK (confirmado Alexander 2026-05-04)
```

### Prioridad
```text
P1 — Bug crítico
```

### Bugs corregidos
1. **CASH**: Fórmula errónea `realCash - mewsCash` → corregida a `realCash - fondoRec - mewsCash`
2. **TARJETA**: Signo invertido `realTpv - mewsTar` → corregido a `mewsTar - realTpv`
3. **STRIPE**: Label "Stripe real — Stripe.com" → "Stripe Platform"; sin fecha automática → añadida
4. **TRANSFERENCIA**: Sección completamente nueva (banco + MEWS + control + fecha automática)
5. **DIFERENCIA OPERATIVA**: 3 componentes → 4 componentes (cash + tarjeta + stripe + transferencia)
6. **Fondo de caja**: `fondo_traspasado` era editable → ahora calculado (fondoRec + cashMews - retiro)
7. **UI**: Secciones separadas, labels claros, sin "MUSE", sin "Stripe.com"

### Función activa
`calcRecDifs` en index.html línea ~4051 (la de línea ~3366 es dead code, no ejecuta)

### Fórmulas implementadas
```
difCash    = realCash - fondoRec - mewsCash
fondoFinal = fondoRec + mewsCash - cfImporte   (calculado, readonly display)
difTar     = mewsTar - realTpv
difStr     = stripeReal - stripeMews
difTransf  = transfBanco - transfMews
difTotal   = difCash + difTar + difStr + difTransf
```

### Archivos modificados
- `index.html` — modal HTML + calcRecDifs activo + submitRecCaja + openRecCajaModal + renderRecepcionCajaList

### Archivos NO modificados
- `shared.js`, `shared_db.js`, `sala.js`, `cajas.js`, `caja.js`, `recepcion.js`, `dashboard.js`

### SQL aditivo PENDIENTE — ejecutar en Supabase
```sql
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS transferencia_banco            numeric  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS transferencia_banco_updated_at text     DEFAULT NULL;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS transferencia_mews             numeric  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS dif_transferencia              numeric  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS stripe_platform_updated_at     text     DEFAULT NULL;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS room_charge_recibido           numeric  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS desayunos_confirmados_mews     integer  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS pensiones_confirmadas_mews     integer  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS syncrolab_room_charged         numeric  DEFAULT 0;
ALTER TABLE recepcion_cash ADD COLUMN IF NOT EXISTS retiro_caja_fuerte             numeric  DEFAULT 0;
```

### QA automático verificado
- [x] `node --check shared.js` — sin errores
- [x] `node --check shared_db.js` — sin errores
- [x] Todos los IDs nuevos presentes en HTML
- [x] `rec-fondo-traspaso` eliminado como input editable
- [x] `rec-fondo-esperado`, `rec-fisico-esperado`, `rec-dif-cash-mews` eliminados del HTML
- [x] Caja Sala (calcCajaDifs, sala_cash_closures) intacta
- [x] 2 definiciones de calcRecDifs: la activa es la de línea ~4051

### QA manual — OK (Alexander 2026-05-04)
- [x] SQL aditivo ejecutado en Supabase ✓
- [x] Secciones EFECTIVO / TARJETA / STRIPE / TRANSFERENCIA / DIFERENCIA OPERATIVA ✓
- [x] Todo 0 → desvío = 0 ✓
- [x] Diferencia en cash → desvío ≠ 0 → explicación requerida ✓
- [x] Stripe Platform → fecha se actualiza ✓
- [x] Transferencia → fecha se actualiza ✓
- [x] Persistencia de todos los campos ✓
- [x] Fondo final calculado correcto ✓
- [x] Dashboard no roto ✓
- [x] Caja Sala — fórmulas sin cambios ✓

---

## PRÓXIMAS TAREAS

| Prioridad | Tarea | Estado |
|---|---|---|
| ~~P1.9~~ | ~~Ejecutar SQL aditivo (TASK-008 + TASK-009) + QA manual~~ | ~~COMPLETADO 2026-05-04~~ |
| **P2.2 — SIGUIENTE** | **TASK-007 Fase 3: Extraer `shared_format.js`** | **Listo para iniciar** |
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
