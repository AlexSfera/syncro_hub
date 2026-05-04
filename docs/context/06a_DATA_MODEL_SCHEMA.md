# 06a_DATA_MODEL_SCHEMA.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRODUCCIÓN — Schema y Modelo Conceptual
Estado: preparado para consulta de estructura, campos, relaciones y reglas.
Base real analizada: tablas actuales de Supabase aportadas por Alexander.

> Este archivo proviene de la división de `06_DATA_MODEL.md`.
> No elimina reglas originales.
> Si falta información: `[NO DATA]`.

---

## Índice

1. [Objetivo del documento](#1-objetivo-del-documento)
2. [Tablas actuales detectadas en Supabase](#2-tablas-actuales-detectadas-en-supabase)
3. [Problemas estructurales actuales](#3-problemas-estructurales-actuales)
4. [Modelo actual real por tabla](#4-modelo-actual-real-por-tabla)
5. [Tablas nuevas necesarias para nivel ultra producción](#5-tablas-nuevas-necesarias-para-nivel-ultra-producción)
6. [Agregaciones y filtros dashboard](#6-agregaciones-y-filtros-dashboard)
7. [Realtime / WebSocket](#7-realtime--websocket)
8. [Seguridad y RLS](#8-seguridad-y-rls)
9. [Riesgos a evitar](#9-riesgos-a-evitar)

> Para SQL de migración, ALTER TABLE, CREATE TABLE, foreign keys ejecutables, queries de dashboard, conciliaciones SQL, endpoints API, QA checklist y prompt técnico:
> → abrir `06b_DATA_MODEL_SQL.md`

---

# 1. Objetivo del documento

Definir el modelo de datos operativo real para SYNCROSFERA/SynchroShift con:

- tablas actuales detectadas;
- tablas legacy o no operativas;
- relaciones reales actuales;
- relaciones lógicas necesarias;
- claves primarias;
- foreign keys recomendadas;
- SQL joins para dashboard;
- estructura de logs;
- estructura de alertas;
- agregaciones por empleado, turno, departamento y periodo;
- endpoints API recomendados;
- riesgos de migración;
- checklist QA obligatorio.

Este documento no sustituye los módulos funcionales. Los módulos funcionales siguen siendo fuente de negocio:

- `00_OVERVIEW.md`
- `01_ARCHITECTURE.md`
- `02_BUSINESS_RULES.md`
- `03_CORE_TURNOS_FULL.md`
- `04_MODULE_COCINA_FULL.md`
- `04_MODULE_SALA_FULL.md`
- `04_MODULE_RECEPCION_HOTEL_FULL.md`
- `04_MODULE_VALIDACION_FULL.md`
- `04_MODULE_DASHBOARD_ULTRA_PRO.md`

---

# 2. Tablas actuales detectadas en Supabase

## 2.1 Tablas operativas válidas

Estas tablas sí pertenecen al sistema operativo actual:

| Tabla | Uso |
|---|---|
| `employees` | empleados, roles, PIN, coste/hora, departamento textual |
| `departments` | catálogo de departamentos |
| `shifts` | turnos/follow-up de empleados |
| `incidencias` | incidencias operativas declaradas |
| `merma` | mermas de cocina |
| `tareas` | tareas interdepartamentales |
| `sala_cash_closures` | cierres de caja de Sala |
| `recepcion_cash` | caja/turno de Recepción Hotel |
| `recepcion_cash_closures` | cierre de caja Recepción Hotel legacy/duplicado parcial |
| `recepcion_ventas` | ventas SYNCROLAB declaradas desde Recepción Hotel |
| `audit_logs` | log estructurado moderno |
| `audit_log` | log antiguo textual |

---

## 2.2 Tablas no operativas / legacy / fuera de alcance actual

Estas tablas existen, pero no deben alimentar dashboard operativo de turnos/caja/incidencias:

| Tabla | Estado |
|---|---|
| `courses` | fuera de alcance actual |
| `course_weeks` | fuera de alcance actual |
| `course_assignments` | fuera de alcance actual |
| `week_attempts` | fuera de alcance actual |
| `attempt_answers` | fuera de alcance actual |
| `questions` | fuera de alcance actual |
| `sops` | fuera de alcance actual salvo futuro módulo formación |
| `notifications` | futuro sistema de notificaciones |
| `users` | puede existir, pero el flujo operativo actual usa `employees` |

Regla: estas tablas no se eliminan automáticamente. Se deben aislar del dashboard para no contaminar KPIs.

---

# 3. Problemas estructurales actuales

## 3.1 Tipos de ID inconsistentes

Actualmente:

- `departments.id` es `uuid`.
- `audit_logs.id` es `uuid`.
- `employees.id` es `text`.
- `shifts.id` es `text`.
- `incidencias.id` es `text`.
- `merma.id` es `text`.
- `tareas.id` es `text`.
- `sala_cash_closures.id` es `text`.
- `recepcion_cash.id` es `text`.
- `recepcion_ventas.id` es `text`.

Esto permite funcionar, pero dificulta foreign keys estrictas.

Regla para esta fase:

- no migrar todo a UUID si puede romper producción;
- mantener `text` en tablas operativas existentes;
- añadir foreign keys text-to-text donde sea posible;
- documentar futura migración a UUID como fase posterior.

---

## 3.2 Fechas guardadas como texto

Actualmente muchas fechas están en `text`:

- `shifts.fecha`
- `incidencias.fecha`
- `merma.fecha`
- `tareas.deadline`
- `sala_cash_closures.fecha`
- `sala_cash_closures.created_at`
- `sala_cash_closures.updated_at`
- `recepcion_cash.fecha`
- `recepcion_cash.validado_ts`
- `recepcion_ventas.fecha`

Riesgo:

- filtros por periodo pueden fallar;
- orden cronológico puede ser incorrecto;
- joins por fecha pueden ser frágiles;
- dashboard puede contar mal.

Regla recomendada:

- mantener campos actuales;
- añadir columnas normalizadas `fecha_date date`;
- añadir `created_at timestamptz` real donde falte;
- hacer backfill;
- usar nuevas columnas para dashboard.

---

# 4. Modelo actual real por tabla

> Los bloques SQL ejecutables (ALTER TABLE, foreign keys, migraciones) de esta sección están compilados en `06b_DATA_MODEL_SQL.md` → Sección 1.

## 4.1 `employees`

Clave primaria:

```sql
employees.id text primary key
```

Campos relevantes:

```text
id
nombre
area
puesto
pin
estado
responsable
validador
rol
coste
obs
fecha_alta
created_at
```

Uso:

- login por PIN;
- empleado creador de turno;
- empleado responsable de turno;
- empleado validador;
- coste laboral por hora;
- filtro de dashboard por empleado;
- asignación de FIO.

Reglas:

- `employees.estado = 'Activo'` para empleados visibles.
- `employees.responsable = 1` indica responsable de turno.
- `employees.validador = 1` indica validador/jefe.
- `employees.rol` debe controlar permisos.
- `employees.coste` se usa para costes laborales.

Problema actual:

- `employees.area` es texto, no FK a `departments`.
- No existe `department_id`.

Recomendación:

Añadir `department_id uuid` con FK a `departments(id)`.
Backfill posterior según `employees.area`.

Ver SQL de migración → `06b_DATA_MODEL_SQL.md` Sección 1.1

---

## 4.2 `departments`

Clave primaria:

```sql
departments.id uuid primary key
```

Campos:

```text
id
name
code
created_at
```

Uso:

- catálogo oficial;
- filtros;
- dashboard;
- permisos;
- agrupaciones.

Departamentos operativos iniciales:

```text
Cocina
Sala
Recepción Hotel
Recepción SYNCROLAB
Restaurante / F&B
```

Departamentos futuros:

```text
Housekeeping
Clínica
Mantenimiento
Marketing
Sales
SYNCROLAB
```

Regla especial:

```text
Restaurante / F&B = Cocina + Sala
```

---

## 4.3 `shifts`

Clave primaria:

```sql
shifts.id text primary key
```

Campos reales:

```text
id
employee_id
nombre
area
puesto
fecha
servicio
horas
responsable_id
responsable_nombre
follow_up
merma_declarada
incidencia_declarada
observacion
estado
validado_por
validado_ts
comentario_validador
correcciones
created_at
updated_at
fio
gravedad_error
tipo_error
num_errores
checklist_items
error_employee_id
error_employee_nombre
coste_merma_supervisor
descuentos_si
descuentos_num
descuentos_motivo
anulaciones_si
anulaciones_num
anulaciones_motivo
anulaciones_resp_inf
invitaciones_si
invitaciones_tipo
invitaciones_num
invitaciones_producto
invitaciones_posmews
devoluciones_si
devoluciones_num
devoluciones_motivo
devoluciones_cliente
```

Relaciones lógicas actuales:

```text
shifts.employee_id -> employees.id
shifts.responsable_id -> employees.id
shifts.error_employee_id -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.2

Reglas funcionales:

- Cada turno guardado genera un registro en `shifts`.
- No existe borrador para usuario lineal.
- Al guardar turno, pasa a revisión.
- Tras guardar turno, el usuario debe salir del login.
- Si vuelve a entrar, el formulario aparece vacío.
- Sus últimos turnos aparecen abajo como histórico.
- La edición por usuario lineal solo se permite durante 30 minutos.
- Admin/validador puede validar o enviar a corrección.
- FIO nunca lo crea usuario en turno.
- FIO solo lo crea jefe de departamento, validador o admin durante validación.

Estados recomendados para `shifts.estado`:

```text
Pendiente revisión
En corrección
Validado
Cerrado
Eliminado
```

Mapeo desde estado actual:

```text
Pendiente -> Pendiente revisión
Pendiente validación -> Pendiente revisión
Validado -> Validado
Cerrado -> Cerrado
Corrección -> En corrección
```

---

## 4.4 `incidencias`

Clave primaria:

```sql
incidencias.id text primary key
```

Campos reales:

```text
id
shift_id
employee_id
nombre
fecha
servicio
categoria
severidad
descripcion
accion_inmediata
requiere_formacion
requiere_disciplina
estado
created_at
staff_implicado_ids
staff_implicado_nombres
tipo_incidencia
```

Relaciones lógicas:

```text
incidencias.shift_id -> shifts.id
incidencias.employee_id -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.3

Reglas:

- Incidencia debe tener creador (`employee_id`).
- Incidencia debe tener turno origen (`shift_id`) si nace de turno.
- Incidencia debe aparecer en follow-up hasta cierre.
- Incidencia debe tener tiempo medio de resolución.
- Incidencia debe tener estado.
- Incidencia debe tener severidad.
- Incidencia debe tener tipo/categoría.
- Personas involucradas pueden ser múltiples.

Problema actual:

- `staff_implicado_ids` está como `text`, no tabla relacional.
- No existe `closed_at`.
- No existe `resolved_at`.
- No existe `department_id`.

Recomendaciones:

Añadir columnas: `department_code text`, `closed_at timestamptz`, `resolved_at timestamptz`, `informed_responsable boolean`.
Crear tabla relacional `incidencia_staff`.

Ver SQL de migración → `06b_DATA_MODEL_SQL.md` Sección 1.3

---

## 4.5 `merma`

Clave primaria:

```sql
merma.id text primary key
```

Campos:

```text
id
shift_id
employee_id
nombre
fecha
servicio
producto
cantidad
unidad
causa
obs
coste_unitario
coste_total
created_at
```

Relaciones:

```text
merma.shift_id -> shifts.id
merma.employee_id -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.4

Reglas:

- Merma solo aplica a Cocina.
- Sala no usa merma.
- Recepción Hotel no usa merma.
- Recepción SYNCROLAB no usa merma.
- Si no hay merma, debe poder marcar "Sin merma".
- Coste merma se usa en dashboard de Cocina y F&B.

---

## 4.6 `tareas`

Clave primaria:

```sql
tareas.id text primary key
```

Campos reales:

```text
id
titulo
dept_destino
dept_origen
prioridad
deadline
descripcion
origen
shift_id
creado_por
estado
completada_por
completada_ts
verificada_por
verificada_ts
notas_cierre
created_at
updated_at
```

Relaciones lógicas:

```text
tareas.shift_id -> shifts.id
tareas.creado_por -> employees.id
tareas.completada_por -> employees.id
tareas.verificada_por -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.5

Reglas:

- Tarea = acción formal con responsable y deadline interdepartamental.
- Tarea no es gestión pendiente.
- Tarea debe tener título.
- Tarea debe tener descripción.
- Tarea debe tener departamento origen.
- Tarea debe tener departamento destino.
- Tarea debe tener deadline futuro.
- Tarea debe aparecer en dashboard.
- Tarea vencida debe contarse.
- Tarea debe tener estado coherente.

Estados recomendados:

```text
Abierta
En proceso
Completada
Verificada
Cerrada
Vencida
Eliminada
```

Problema actual:

- No existe `responsable_id`.
- `deadline` está como texto.

Recomendación:

Añadir `responsable_id text references employees(id)` y `deadline_date date`.

Ver SQL de migración → `06b_DATA_MODEL_SQL.md` Sección 1.5

---

## 4.7 `sala_cash_closures`

Clave primaria:

```sql
sala_cash_closures.id text primary key
```

Campos principales:

```text
id
fecha
servicios
responsable_id
responsable_nombre
categoria
efectivo
tarjeta
room_charge
cargo_alexander
pension_desayuno
media_pension
pension_completa
propinas
subtotal_neto
total_bruto
descuentos_importe
descuentos_num
anulaciones_importe
anulaciones_num
invitaciones_importe
invitaciones_num
diferencia_caja
comentario
estado
validado_por
validado_ts
created_at
updated_at
efectivo_posmews
efectivo_real
diferencia_efectivo
tarjeta_posmews
tarjeta_tpv
diferencia_tarjeta
stripe_posmews
stripe_real
diferencia_stripe
diferencia_operativa_sala
fondo_inicial
fondo_final
retiro_caja_fuerte
propinas_tpv
total_medios_pago
```

Relaciones lógicas:

```text
sala_cash_closures.responsable_id -> employees.id
```

Falta recomendada:

```text
shift_id
```

Reglas:

- Cierre de caja de Sala puede hacerlo cualquier empleado de Sala.
- Se debe poder hacer dentro del flujo de turno.
- También debe existir pestaña propia "Cierre de caja".
- En dashboard aparecen todos los cierres, validados y pendientes.
- Deben separarse pendientes y validados.
- Admin/validador valida cierre.
- Si se elimina cierre, dashboard recalcula retrospectivamente.

Conciliaciones:

```text
Sala room_charge declarado -> Recepción Hotel room charge recibido
Sala pension_desayuno -> Recepción Hotel desayunos consumidos
Sala media_pension -> Recepción Hotel medias pensiones consumidas
Sala pension_completa -> Recepción Hotel pensiones completas consumidas
```

Migración recomendada: añadir `shift_id` con FK a `shifts`.

Ver SQL → `06b_DATA_MODEL_SQL.md` Sección 1.6

---

## 4.8 `recepcion_cash`

Clave primaria:

```sql
recepcion_cash.id text primary key
```

Campos principales:

```text
id
shift_id
fecha
turno
responsable_id
responsable_nombre
fondo_recibido
fondo_traspasado
fondo_inicial_siguiente
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
validado_por
validado_ts
estado
comentario
created_at
retiro_caja_fuerte
```

Relaciones:

```text
recepcion_cash.shift_id -> shifts.id
recepcion_cash.responsable_id -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.7

Reglas:

- Caja Recepción Hotel se activa.
- Debe guardar cash MEWS, tarjeta MEWS, Stripe MEWS.
- Debe guardar cash real, TPV físico, Stripe real.
- Debe calcular diferencias.
- Si diferencia != 0, explicación obligatoria.
- Si se guarda, debe aparecer en dashboard.
- Debe separarse pendiente validación vs validado.
- Debe participar en conciliación con Sala y SYNCROLAB.

---

## 4.9 `recepcion_cash_closures`

Tabla duplicada/parcial de `recepcion_cash`.

Regla:

- No eliminar aún.
- Revisar si contiene datos reales.
- Elegir una tabla canónica para Recepción Caja.
- Recomendación: usar `recepcion_cash` como tabla canónica si está más completa.
- `recepcion_cash_closures` debe migrarse o quedar legacy.

Acción recomendada: comparar conteos de registros entre ambas tablas antes de decidir.

Ver SQL de verificación → `06b_DATA_MODEL_SQL.md` Sección 1.8

---

## 4.10 `recepcion_ventas`

Clave primaria:

```sql
recepcion_ventas.id text primary key
```

Campos:

```text
id
shift_id
fecha
empleado_id
empleado_nombre
tipo_venta
importe
reserva_mews
servicio_detalle
departamento_relacionado
created_at
```

Relaciones:

```text
recepcion_ventas.shift_id -> shifts.id
recepcion_ventas.empleado_id -> employees.id
```

Foreign keys recomendadas: ver `06b_DATA_MODEL_SQL.md` Sección 1.9

Reglas:

- Ventas SYNCROLAB desde Recepción Hotel se registran aquí.
- Venta sin número de reserva MEWS = error grave.
- Venta sin número de reserva MEWS puede generar FIO.
- `reserva_mews` es obligatoria en Recepción Hotel.
- SYNCROLAB no tiene acceso MEWS, por tanto SYNCROLAB no debe depender de `reserva_mews`.

---

# 5. Tablas nuevas necesarias para nivel ultra producción

> Los bloques CREATE TABLE de esta sección están en `06b_DATA_MODEL_SQL.md` → Sección 2.

## 5.1 `gestion_pendiente`

Actualmente las gestiones pendientes no tienen tabla propia clara. No deben confundirse con tareas.

Ver CREATE TABLE SQL → `06b_DATA_MODEL_SQL.md` Sección 2.1

Estados:

```text
Abierta
En proceso
Cerrada
Validada
Vencida
Eliminada
```

Reglas:

- Gestión pendiente no es tarea.
- Gestión pendiente puede nacer del turno.
- Debe aparecer en follow-up hasta cierre.
- Debe aparecer en dashboard.
- Si usuario marca "No", no se crea registro.
- Si marca "Sí", tipo y descripción son obligatorios.

---

## 5.2 `fio_records`

Actualmente FIO está dentro de `shifts`. Para producción se recomienda tabla propia.

Ver CREATE TABLE SQL → `06b_DATA_MODEL_SQL.md` Sección 2.2

Reglas:

- FIO nunca lo crea usuario lineal.
- FIO solo lo crea jefe de departamento, validador o admin.
- Si FIO = No, campos se bloquean.
- Si FIO = Sí, campos obligatorios:
  - empleado responsable del error;
  - concepto FIO;
  - severidad;
  - impacto en bonus;
  - comentario supervisor.
- Dashboard de momento muestra cantidad de FIO, severidad y si impacta bonus.
- Cálculo económico de bonus queda pendiente para futuro.

---

## 5.3 `alert_logs`

Ver CREATE TABLE SQL → `06b_DATA_MODEL_SQL.md` Sección 2.3

Tipos de alerta:

```text
turno_no_validado
incidencia_abierta
incidencia_24h
incidencia_48h
fio_critico
fio_no_gestionado
gestion_vencida
tarea_vencida
cierre_caja_pendiente
diferencia_caja
conciliacion_sala_recepcion
conciliacion_syncrolab_recepcion
```

Reglas:

- Alertas activas desaparecen automáticamente cuando se resuelven.
- Historial de alertas se conserva.
- Dashboard muestra alertas activas.
- Histórico puede consultarse por admin.

---

## 5.4 `conciliation_records`

Ver CREATE TABLE SQL → `06b_DATA_MODEL_SQL.md` Sección 2.4

Tipos:

```text
sala_room_charge_vs_recepcion_room_charge
sala_desayuno_vs_recepcion_desayuno
sala_media_pension_vs_recepcion_media_pension
sala_pension_completa_vs_recepcion_pension_completa
syncrolab_talonario_vs_recepcion_syncrolab_charge
```

---

# 6. Agregaciones y filtros dashboard

## 6.1 Prioridad de dashboard

Confirmado por Alexander:

```text
Prioridad 1: dashboard por empleado
Prioridad 2: dashboard por departamento
Prioridad 3: dashboard por turno
Prioridad 4: dashboard por periodo
```

## 6.2 Periodos

Filtros:

```text
Hoy
Esta semana
Este mes
Todo
Rango personalizado futuro
```

Modelo backend:

```text
from_ts
to_ts
business_date
```

## 6.3 Departamentos

Selector:

```text
Todos
Cocina
Sala
Restaurante / F&B
Recepción Hotel
Recepción SYNCROLAB
Housekeeping — Próximamente
Mantenimiento — Próximamente
Marketing — Próximamente
Sales — Próximamente
Clínica — Próximamente
```

Regla Restaurante / F&B: filtra donde `s.area in ('Cocina', 'Sala')`.
Ver SQL → `06b_DATA_MODEL_SQL.md` Sección 5

## 6.4 Servicio / turno

Debe llamarse:

```text
Servicio / Turno
```

Opciones por departamento:

Cocina / Sala:

```text
Desayuno
Comida
Cena
Evento
Otro
```

Recepción Hotel:

```text
Mañana
Tarde
Noche
```

---

# 7. Realtime / WebSocket

Confirmado:

```text
Preferencia: WebSocket realtime + botón Actualizar.
```

Implementación Supabase:

- suscribirse a cambios en:
  - `shifts`;
  - `incidencias`;
  - `tareas`;
  - `merma`;
  - `sala_cash_closures`;
  - `recepcion_cash`;
  - `recepcion_ventas`;
  - `fio_records` cuando exista;
  - `alert_logs` cuando exista.
- añadir botón "Actualizar".

Regla:

- dashboard debe recalcular tras insert/update/delete;
- no usar datos cacheados obsoletos;
- si una línea se elimina, estadísticas se corrigen retrospectivamente.

---

# 8. Seguridad y RLS

Problema actual:

- varias tablas aparecen como `UNRESTRICTED`.

Riesgo alto:

- empleados podrían leer/editar datos no autorizados;
- PINs visibles en frontend;
- cambios no auditados.

Reglas:

- No exponer PIN en frontend.
- No usar claves API privadas en frontend.
- Usar variables de entorno.
- RLS por rol.
- Admin puede ver todo.
- Jefe/validador ve su departamento.
- Usuario lineal ve solo sus turnos y tareas visibles.
- Usuario lineal no crea FIO.
- Usuario lineal no valida.
- Usuario lineal no elimina.

---

# 9. Riesgos a evitar

- No mezclar gestión pendiente con tarea.
- No mezclar FIO con incidencia normal.
- No mezclar caja Sala con caja Recepción.
- No usar tablas de cursos en dashboard operativo.
- No calcular tiempo medio sin `resolved_at` o `closed_at`.
- No usar fechas texto para filtros críticos.
- No borrar datos sin log.
- No dejar tablas `UNRESTRICTED` en producción.
- No mostrar PINs.
- No usar `recepcion_cash` y `recepcion_cash_closures` duplicadas sin decidir canónica.
- No contar registros eliminados en dashboard.
- No contar FIO sin severidad si FIO está activo.
- No permitir venta Recepción SYNCROLAB sin reserva MEWS.
- No conciliar SYNCROLAB directamente con MEWS si SYNCROLAB no tiene acceso MEWS.
