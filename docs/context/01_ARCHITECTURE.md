# 01_ARCHITECTURE.md — SYNCROSFERA / SynchroShift

## 1. Objetivo del archivo

Este documento define la arquitectura técnica real de la plataforma SYNCROSFERA / SynchroShift.

Su objetivo es evitar errores de desarrollo por desconocimiento de:

- orden real de carga de scripts;
- funciones activas vs funciones muertas;
- tablas reales de Supabase;
- reglas técnicas críticas;
- estructura actual del repositorio;
- módulos existentes;
- restricciones para Codex / Claude Code / desarrolladores.

Este archivo NO es un resumen genérico.  
Debe usarse como referencia obligatoria antes de tocar código.

---

## 2. Stack actual

### Frontend

- HTML
- JavaScript vanilla
- Aplicación single-file servida principalmente desde `index.html`

### Backend / Data

- Supabase
- PostgreSQL vía REST API

### Repositorio

- GitHub / carpeta local: `syncro_hub`

### Deploy

- Vercel

### Flujo de corrección actual

- Claude Code / Codex / desarrollador humano
- Cambios pequeños, verificables y reversibles

---

## 3. Naturaleza actual de la aplicación

La plataforma actualmente NO está completamente modularizada.

Aunque existen archivos externos como:

- `shared.js`
- `sala.js`
- `caja.js`
- `cajas.js`
- `recepcion.js`
- `checklist.js`
- `incidencia_tipos.js`
- `dashboard.js`

la aplicación depende de forma crítica de funciones definidas dentro del script inline final de `index.html`.

Esto es fundamental:

```text
El script inline de index.html se carga al final y puede sobrescribir funciones definidas antes.
```

---

## 4. Orden real de carga de scripts

Orden crítico detectado en `index.html`:

```text
shared.js
→ checklist.js
→ sala.js
→ cajas.js
→ caja.js
→ recepcion.js
→ incidencia_tipos.js
→ dashboard.js
→ inline script final en index.html
```

### Regla técnica crítica

En JavaScript, si una función se define varias veces en el scope global, la última definición cargada gana.

Por tanto:

```text
Las funciones inline finales de index.html sobrescriben funciones externas con el mismo nombre.
```

---

## 5. Consecuencia: dead code

Existen archivos con funciones que parecen activas, pero realmente NO se ejecutan porque son sobrescritas por `index.html`.

Esto afecta especialmente a:

- `caja.js`
- funciones de caja dentro de `recepcion.js`

### Regla obligatoria

```text
No modificar funciones de caja en caja.js ni en recepcion.js si están sobrescritas por index.html.
Modificar siempre la función activa en el script inline de index.html.
```

---

## 6. Dead code — Caja Sala

### Archivo afectado

```text
caja.js
```

### Estado

Las funciones de caja en `caja.js` son dead code porque están sobrescritas por funciones inline en `index.html`.

### Funciones externas muertas

- `openCajaForm()`
- `calcCajaDifs()`
- `saveCajaForm()`
- `renderCajaList()`

### Funciones activas reales

Las funciones activas están en el script inline de `index.html`.

| Función activa | Ubicación aproximada | Descripción |
|---|---:|---|
| `openCajaForm(existingId)` | `index.html` ~2244 | Abre modal Caja Sala y auto-rellena fondo inicial |
| `calcCajaDifs()` | `index.html` ~2331 | Recalcula diferencias de Caja Sala |
| `_setCajaStrFecha()` | `index.html` ~2425 | Actualiza fecha Stripe real |
| `saveCajaForm()` | `index.html` ~2411 | Guarda en `sala_cash_closures` |
| `renderCajaList()` | `index.html` ~2548 | Renderiza lista Cierre Caja |
| `renderValCajaList()` | `index.html` ~2902 | Renderiza Caja Sala en Validación |
| `validarCierre(cajaId)` | `index.html` ~2953 | Valida cierre y escribe validador/timestamp |

### Regla

```text
Para corregir Caja Sala, inspeccionar y modificar index.html, no caja.js.
```

---

## 7. Dead code — Caja Recepción Hotel

### Archivo afectado

```text
recepcion.js
```

### Estado

Las funciones de caja dentro de `recepcion.js` están sobrescritas por funciones inline de `index.html`.

### Funciones de caja muertas en `recepcion.js`

- `calcRecDifs()`
- `openRecCajaModal()`
- `submitRecCaja()`
- `renderRecepcionCajaList()`
- `closeRecCajaModal()`

### Funciones activas reales

| Función activa | Ubicación aproximada | Descripción |
|---|---:|---|
| `openRecCajaModal(existingId)` | `index.html` ~3332 | Abre modal Caja Recepción y auto-rellena fondo recibido |
| `submitRecCaja()` | `index.html` ~3397 | Guarda en `recepcion_cash` |
| `renderRecepcionCajaList()` | `index.html` ~3487 | Renderiza lista Caja Recepción |
| `renderRecepcionDashboard()` | `index.html` ~3572 | Renderiza KPI Caja Recepción |
| `reabrirCajaRec(cajaId)` | `index.html` ~3531 | Reabre cierre con motivo + audit log |
| `eliminarCajaRec(cajaId)` | `index.html` ~3553 | Eliminación admin con audit log |
| `calcRecDifs()` | `index.html` ~3941 | Recalcula diferencias Caja Recepción |

### Nota técnica importante

Existe más de una definición de `calcRecDifs()`.

Regla:

```text
La definición posterior en index.html gana.
Revisar duplicidad antes de modificar.
```

---

## 8. Funciones activas en recepcion.js

Aunque las funciones de caja de `recepcion.js` están muertas, otras funciones sí están activas.

### Funciones activas

- `getRecTurnoValue()`
- `updateRecTurnoStyle()`
- `setRecKpi()`
- `openRecKpiModal()`
- `closeRecKpiModal()`
- `submitRecKpi()`

### Regla

```text
No considerar todo recepcion.js como muerto.
Solo las funciones de caja sobrescritas están muertas.
```

---

## 9. Archivos principales del frontend

### `index.html`

Archivo central actual.

Contiene:

- estructura HTML;
- modales;
- navegación;
- parte importante de lógica activa;
- funciones inline que sobrescriben módulos externos;
- funciones activas de Caja Sala;
- funciones activas de Caja Recepción.

### `shared.js`

Contiene lógica compartida.

Uso detectado:

- Validación follow-up.
- Renderizado de validación (`renderValidacion()`).
- Funciones comunes del sistema.

### `dashboard.js`

Contiene lógica actual del dashboard.

Funciones relevantes:

- `_renderKpiSala()`
- `_renderKpiFnB()`
- `_renderKpiRecepcion()`

### `cajas.js`

Contiene librería/configuración de cajas.

Estado:

```text
Activo.
```

### `caja.js`

Estado:

```text
Dead code para funciones de Caja Sala.
```

No modificar funciones de caja aquí salvo refactor planificado.

### `recepcion.js`

Estado mixto:

- funciones KPI/turno/checklist activas;
- funciones de caja muertas si están sobrescritas.

### `checklist.js`

Estado:

```text
Activo para checklist.
```

### `incidencia_tipos.js`

Estado:

```text
Activo para tipos/catálogos si el código actual lo usa.
```

---

## 10. Pantallas activas actuales

| Screen ID | Título | Módulo |
|---|---|---|
| `screen-sala` | Sala / F&B | Mi Turno — Sala |
| `screen-cocina` | Cocina | Mi Turno — Cocina |
| `screen-recepcion` | Recepción | Mi Turno — Recepción Hotel |
| `screen-rec-caja` | Caja Recepción | Caja Recepción Hotel |
| `screen-caja` | Cierre Caja | Caja Sala |
| `screen-validacion` | Validación | Validación follow-up + cierres |
| `screen-dashboard` | Dashboard | Dashboard |
| `screen-export` | Exportar | Export |

### Regla

```text
No eliminar pantallas existentes sin plan de migración.
Si se ocultan de navegación admin, pueden seguir existiendo técnicamente.
```

Ejemplo:

- Admin no debe ver “Mi turno” arriba.
- Pero `screen-sala`, `screen-cocina`, `screen-recepcion` siguen existiendo para usuarios operativos.

---

## 11. Tablas Supabase activas

| Tabla | Uso |
|---|---|
| `employees` | Usuarios / empleados |
| `shifts` | Turnos / follow-up general |
| `merma` | Mermas / food waste Cocina |
| `incidencias` | Incidencias / FIO según implementación actual |
| `tareas` | Tareas |
| `sala_cash_closures` | Cierre de caja Sala |
| `recepcion_cash` | Caja Recepción Hotel |
| `rec_shift_data` | Datos extra turno Recepción |
| `closing_audit_log` | Auditoría cierres de caja |

---

## 12. Tabla prohibida / inexistente

### `cash_closings`

Regla crítica:

```text
La tabla cash_closings NO existe en Supabase.
No debe referenciarse en ningún código, query, dashboard, validación o documentación técnica activa.
```

Si aparece en código:

```text
Debe reemplazarse por tabla real:
- sala_cash_closures
- recepcion_cash
```

según el contexto.

---

## 13. Tablas por módulo

### Turnos

```text
shifts
```

Uso:

- follow-up general;
- turnos de departamentos;
- validación follow-up;
- dashboard operativo.

### Datos extra Recepción

```text
rec_shift_data
```

Uso:

- datos operativos adicionales de Recepción Hotel;
- KPI recepción si aplica.

### Cocina

```text
merma
```

Uso:

- mermas de Cocina;
- costes de merma;
- dashboard Cocina/F&B.

### Caja Sala

```text
sala_cash_closures
```

Uso:

- cierre de caja Sala;
- validación Caja Sala;
- dashboard Sala / F&B.

### Caja Recepción Hotel

```text
recepcion_cash
```

Uso:

- cuadro de caja Recepción;
- dashboard Recepción;
- futura validación Caja Recepción.

### Auditoría de caja

```text
closing_audit_log
```

Uso:

- reapertura;
- eliminación;
- desbloqueo;
- cambios sensibles.

---

## 14. Regla de modificación de código

Antes de modificar código:

1. Identificar pantalla afectada.
2. Identificar archivo activo real.
3. Confirmar si la función está sobrescrita.
4. Modificar solo la función activa.
5. No refactorizar sin permiso.
6. No tocar módulos no relacionados.
7. Documentar cambios en `08_CURRENT_TASK.md`.
8. Ejecutar checklist QA correspondiente.

---

## 15. Regla anti-refactor

Actualmente la aplicación tiene deuda técnica.

Pero regla actual:

```text
No hacer refactor grande sin instrucción explícita.
No mover funciones fuera de index.html.
No crear arquitectura nueva si el objetivo es corregir bug puntual.
```

La prioridad es:

- estabilidad;
- cambios pequeños;
- QA verificable;
- no romper módulos existentes.

---

## 16. Reglas de Supabase schema

No modificar schema sin:

1. Avisar.
2. Justificar.
3. Indicar SQL exacto.
4. Indicar impacto.
5. Indicar QA posterior.

### Schema pendiente conocido

#### Caja Sala

```sql
ALTER TABLE sala_cash_closures
  ADD COLUMN stripe_real_updated_date TEXT;
```

#### Caja Recepción Hotel

```sql
ALTER TABLE recepcion_cash
  ADD COLUMN room_charge_recibido NUMERIC DEFAULT 0,
  ADD COLUMN desayunos_confirmados_mews INTEGER DEFAULT 0,
  ADD COLUMN pensiones_confirmadas_mews INTEGER DEFAULT 0,
  ADD COLUMN syncrolab_room_charged NUMERIC DEFAULT 0;
```

Si las columnas ya existen, no repetir migración sin comprobar.

---

## 17. Arquitectura activa — Caja Sala

### Pantalla

```text
screen-caja
```

### Modal

```text
modal-caja
```

### Tabla

```text
sala_cash_closures
```

### Formulario HTML

Secciones actuales:

1. Fecha.
2. Cash.
3. Tarjeta & Stripe.
4. Diferencia operativa.
5. Campos PMS / Recepción.
6. Totales manuales.
7. Comentario.

### IDs HTML relevantes

#### Fecha

- `caja-fecha`

#### Cash

- `caja-ef-real`
- `caja-fondo-ini`
- `caja-ef-posmews`
- `caja-fondo-fin`
- `caja-retiro`

#### Tarjeta & Stripe

- `caja-tar-posmews`
- `caja-tar-tpv`
- `caja-propinas-tpv`
- `caja-propinas`
- `caja-str-posmews`
- `caja-str-real`
- `caja-str-fecha`
- `caja-str-fecha-disp`

#### Diferencias display

- `dif-ef-disp`
- `dif-tar-disp`
- `dif-str-disp`
- `dif-sala-total`

#### PMS / Recepción

- `caja-room`
- `caja-alexander`
- `caja-pension-d`
- `caja-pension-m`
- `caja-pension-c`

#### Totales manuales

- `caja-total-neto-manual`
- `caja-total-bruto-manual`

#### Comentario

- `caja-comentario`

---

## 18. Campos guardados — Caja Sala

Tabla:

```text
sala_cash_closures
```

Campos:

```text
id
fecha
servicios
responsable_id
responsable_nombre
efectivo_real
efectivo_posmews
fondo_inicial
fondo_final
retiro_caja_fuerte
diferencia_efectivo
tarjeta_posmews
tarjeta_tpv
propinas_tpv
propinas
diferencia_tarjeta
stripe_posmews
stripe_real
stripe_real_updated_date
diferencia_stripe
diferencia_operativa_sala
diferencia_caja
room_charge
cargo_alexander
pension_desayuno
media_pension
pension_completa
subtotal_neto
total_bruto
total_medios_pago
comentario
estado
validado_por
validado_ts
created_at
updated_at
```

---

## 19. Arquitectura activa — Caja Recepción Hotel

### Pantalla

```text
screen-rec-caja
```

### Modal

```text
modal-rec-caja
```

### Tabla

```text
recepcion_cash
```

### Formulario HTML

Secciones:

1. Efectivo.
2. Tarjeta & Stripe.
3. Diferencias calculadas.
4. Explicación diferencia.
5. Fondo inicial siguiente.
6. Confirmación Restaurante / conciliación.

### IDs HTML relevantes

#### Efectivo

- `rec-cash-real`
- `rec-fondo-recibido`
- `rec-cash-mews`
- `rec-fondo-traspaso`
- `rec-cf-importe`

#### Tarjeta & Stripe

- `rec-tarjeta-mews`
- `rec-tpv-real`
- `rec-stripe-mews`
- `rec-stripe-real`

#### Diferencias calculadas

- `rec-dif-cash-total`
- `rec-dif-tarjeta`
- `rec-dif-stripe`
- `rec-dif-total`

#### Explicación diferencia

- `rec-dif-exp`
- `rec-dif-accion`

#### Fondo inicial siguiente

- `rec-fondo-inicial`

#### Confirmación Restaurante

- `rec-room-recibido`
- `rec-desayunos-mews`
- `rec-pensiones-mews`
- `rec-syncrolab-room`

---

## 20. Campos guardados — Caja Recepción Hotel

Tabla:

```text
recepcion_cash
```

Campos:

```text
id
fecha
turno
shift_id
responsable_id
responsable_nombre
estado
fondo_recibido
fondo_traspasado
fondo_inicial_siguiente
retiro_caja_fuerte
cash_mews
tarjeta_mews
stripe_mews
cash_real
tpv_real
stripe_real
dif_cash
dif_tarjeta
dif_stripe
dif_total
explicacion_diferencia
accion_diferencia
informado_responsable
room_charge_recibido
desayunos_confirmados_mews
pensiones_confirmadas_mews
syncrolab_room_charged
validado_por
validado_ts
created_at
updated_at
```

---

## 21. Arquitectura de Validación

### Pantalla

```text
screen-validacion
```

### Tabs actuales

- `FOLLOW-UP`
- `CIERRE CAJA`

### Follow-up

Función:

```text
renderValidacion()
```

Ubicación:

```text
shared.js
```

Lee:

```text
shifts
```

### Cierre Caja — Sala

Función:

```text
renderValCajaList()
```

Ubicación:

```text
index.html`
```

Lee:

```text
sala_cash_closures
```

Validación:

```text
validarCierre(cajaId)
```

Actualiza:

- `estado`
- `validado_por`
- `validado_ts`

### Cierre Caja — Recepción Hotel

Estado actual:

```text
No implementado en Validación.
```

Debe añadirse posteriormente leyendo:

```text
recepcion_cash
```

---

## 22. Arquitectura de Dashboard

### Archivo

```text
dashboard.js
```

### Funciones KPI actuales

| Función | Tabla | Uso |
|---|---|---|
| `_renderKpiSala()` | `sala_cash_closures` | KPI Sala |
| `_renderKpiFnB()` | `sala_cash_closures` | KPI F&B |
| `_renderKpiRecepcion()` | `recepcion_cash` | KPI Recepción |

### Reglas

- Dashboard debe leer datos reales.
- No hardcode.
- No referencia a `cash_closings`.
- Filtros deben afectar KPIs y tablas.
- F&B = Sala + Cocina.
- Recepción usa `turno`, no `servicio`.

---

## 23. Arquitectura de Mi Turno

### Sala

Usa:

```text
shifts
```

### Cocina

Usa:

```text
shifts`
```

y para mermas:

```text
merma
```

### Recepción Hotel

Usa:

```text
shifts
rec_shift_data
```

### Regla

```text
No mezclar lógica de caja con Mi Turno sin vincular por shift_id.
```

Mi Turno puede iniciar flujo de caja, pero caja debe guardarse en su tabla específica:

- Sala → `sala_cash_closures`
- Recepción Hotel → `recepcion_cash`

---

## 24. Reglas de naming técnico y negocio

Escribir siempre correctamente:

- SYNCROSFERA
- SYNCROLAB
- MEWS
- POSMEWS
- Bitrix24
- Nubimed

Regla:

```text
Si aparece “MUSE”, interpretarlo y corregirlo como MEWS.
```

---

## 25. Reglas de errores visibles

La UI nunca debe mostrar:

- `undefined`
- `null`
- `NaN`
- arrays tipo `["Desayuno","Comida"]`
- IDs técnicos
- nombres de tablas
- errores internos
- stack traces
- logs
- textos tipo “schema”, “migration”, “debug”

Mensajes permitidos:

```text
Sin datos en el periodo.
Revisa los campos obligatorios.
Turno guardado correctamente.
Cierre guardado correctamente.
```

---

## 26. Arquitectura de real-time / actualización

### Estado deseado

- WebSocket / Supabase Realtime para dashboard.
- Botón manual “Actualizar” como fallback.

### Eventos que deben actualizar dashboard

- turno creado;
- turno validado;
- turno eliminado;
- incidencia creada;
- incidencia cerrada;
- gestión creada/cerrada;
- FIO creado/gestionado;
- tarea creada/cerrada;
- cierre caja creado;
- cierre caja validado;
- cierre caja eliminado;
- coste creado/eliminado.

### Regla

Si se elimina un registro:

```text
Dashboard debe recalcular retrospectivamente.
```

---

## 27. Eliminación de datos

### Tipos

1. Soft delete.
2. Hard delete.

### Soft delete

Uso normal recomendado.

- marca registro como eliminado;
- no aparece en UI;
- no cuenta en dashboard;
- queda trazabilidad.

### Hard delete

Uso excepcional.

- elimina definitivamente;
- requiere popup especial;
- solo Admin;
- debe advertir que no se puede deshacer.

Mensaje recomendado:

```text
¿Eliminar definitivamente este registro?
Esta acción no se puede deshacer.
```

### Regla

```text
Toda eliminación debe afectar dashboard y estadísticas.
```

---

## 28. Borrado en cascada

Si se elimina un turno, deben eliminarse o excluirse del dashboard:

- incidencias vinculadas;
- gestiones vinculadas;
- FIO vinculado;
- checklist vinculado;
- tareas creadas desde ese turno si aplica;
- KPI vinculados;
- registros específicos vinculados por `shift_id`.

Regla:

```text
No dejar datos huérfanos.
```

---

## 29. Reglas de permisos arquitectura

### Usuario lineal

Puede:

- crear sus registros;
- ver lo permitido;
- editar solo si regla lo permite.

No puede:

- validar;
- cerrar definitivo;
- eliminar;
- ver todo el sistema.

### Jefe / Validador

Puede:

- ver su departamento;
- validar;
- devolver a corrección;
- revisar cierres si aplica.

No puede:

- eliminar definitivo;
- ver todo salvo permiso.

### Admin

Puede:

- ver todo;
- validar;
- cerrar;
- devolver;
- eliminar;
- reabrir;
- acceder a maestro;
- exportar.

---

## 30. Reglas de seguridad

- No exponer credenciales.
- No poner API keys en frontend si se integran sistemas externos.
- Usar variables de entorno.
- No guardar PINs en frontend.
- No exponer datos internos de Supabase en UI.
- No implementar integraciones MEWS / POSMEWS / Bitrix24 / Nubimed sin documentación API y permisos confirmados.

---

## 31. Reglas para Codex / Claude Code

Cuando se pida implementar o corregir:

1. Leer este archivo primero.
2. Confirmar archivo activo.
3. No modificar dead code.
4. No refactorizar.
5. No tocar módulos no relacionados.
6. No cambiar schema sin aviso.
7. No usar `cash_closings`.
8. No mostrar errores técnicos.
9. Mantener naming correcto.
10. Entregar:
    - archivos inspeccionados;
    - archivos modificados;
    - qué cambió;
    - cómo probar;
    - riesgos;
    - dudas `[NO DATA]`.

---

## 32. Riesgos técnicos conocidos

- Funciones duplicadas sobrescritas por `index.html`.
- Código muerto en archivos externos.
- Dependencia fuerte de script inline.
- Posible confusión entre Caja Sala y Caja Recepción.
- Posible confusión entre servicio y turno.
- `cash_closings` inexistente.
- Fórmulas caja con diferencias entre spec y código activo.
- Schema pendiente no ejecutado.
- Dashboard parcial respecto a validación de Caja Recepción.
- Validación Caja Recepción aún no implementada.
- Riesgo de romper Mi Turno al tocar cajas.

---

## 33. Qué NO debe estar en este archivo

Este archivo NO debe contener en detalle:

- especificación completa de cada módulo;
- reglas negocio completas;
- prompt de implementación;
- checklist QA exhaustivo;
- current task diario.

Eso pertenece a:

- `02_BUSINESS_RULES.md`
- `03_CORE_TURNOS.md`
- `04_MODULES/*`
- `05_CASH/*`
- `06_DATA_MODEL.md`
- `07_QA.md`
- `08_CURRENT_TASK.md`
- `09_DECISIONS_PENDING.md`

---

## 34. Criterios de aceptación para arquitectura

- Cualquier desarrollador entiende qué archivo tocar.
- No se modifica dead code por error.
- No se referencia `cash_closings`.
- Se preserva orden real de carga.
- Se respetan tablas reales.
- Caja Sala y Caja Recepción están separadas.
- Dashboard lee fuentes correctas.
- Validación no se rompe.
- Cambios son pequeños y verificables.
- Información técnica esencial no se pierde.
