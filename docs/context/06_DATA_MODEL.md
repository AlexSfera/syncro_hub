# 05_DATA_MODEL_ULTRA_PRO.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRODUCCIÓN  
Estado: preparado para desarrollo backend, SQL, Supabase, dashboard, validación y QA.  
Base real analizada: tablas actuales de Supabase aportadas por Alexander.

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

```sql
alter table employees add column if not exists department_id uuid;

alter table employees
add constraint employees_department_id_fk
foreign key (department_id)
references departments(id);
```

Backfill posterior según `employees.area`.

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

Foreign keys recomendadas:

```sql
alter table shifts
add constraint shifts_employee_id_fk
foreign key (employee_id)
references employees(id);

alter table shifts
add constraint shifts_responsable_id_fk
foreign key (responsable_id)
references employees(id);

alter table shifts
add constraint shifts_error_employee_id_fk
foreign key (error_employee_id)
references employees(id);
```

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

Foreign keys recomendadas:

```sql
alter table incidencias
add constraint incidencias_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete cascade;

alter table incidencias
add constraint incidencias_employee_id_fk
foreign key (employee_id)
references employees(id);
```

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

```sql
alter table incidencias add column if not exists department_code text;
alter table incidencias add column if not exists closed_at timestamptz;
alter table incidencias add column if not exists resolved_at timestamptz;
alter table incidencias add column if not exists informed_responsable boolean default false;
```

Tabla relacional recomendada:

```sql
create table if not exists incidencia_staff (
  id uuid primary key default uuid_generate_v4(),
  incidencia_id text not null references incidencias(id) on delete cascade,
  employee_id text not null references employees(id),
  created_at timestamptz default now()
);
```

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

Foreign keys recomendadas:

```sql
alter table merma
add constraint merma_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete cascade;

alter table merma
add constraint merma_employee_id_fk
foreign key (employee_id)
references employees(id);
```

Reglas:

- Merma solo aplica a Cocina.
- Sala no usa merma.
- Recepción Hotel no usa merma.
- Recepción SYNCROLAB no usa merma.
- Si no hay merma, debe poder marcar “Sin merma”.
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

Foreign keys recomendadas:

```sql
alter table tareas
add constraint tareas_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete set null;

alter table tareas
add constraint tareas_creado_por_fk
foreign key (creado_por)
references employees(id);

alter table tareas
add constraint tareas_completada_por_fk
foreign key (completada_por)
references employees(id);

alter table tareas
add constraint tareas_verificada_por_fk
foreign key (verificada_por)
references employees(id);
```

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

```sql
alter table tareas add column if not exists responsable_id text references employees(id);
alter table tareas add column if not exists deadline_date date;
```

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

Migración recomendada:

```sql
alter table sala_cash_closures add column if not exists shift_id text;

alter table sala_cash_closures
add constraint sala_cash_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete set null;

alter table sala_cash_closures
add constraint sala_cash_responsable_id_fk
foreign key (responsable_id)
references employees(id);
```

Reglas:

- Cierre de caja de Sala puede hacerlo cualquier empleado de Sala.
- Se debe poder hacer dentro del flujo de turno.
- También debe existir pestaña propia “Cierre de caja”.
- En dashboard aparecen todos los cierres, validados y pendientes.
- Deben separarse pendientes y validados.
- Admin/validador valida cierre.
- Si se elimina cierre, dashboard recalcula retrospectivamente.

Conciliaciones:

```text
Sala room_charge declarado -> Recepción Hotel room charge recibido
Sala pensión desayuno -> Recepción Hotel desayunos consumidos
Sala media_pension -> Recepción Hotel medias pensiones consumidas
Sala pension_completa -> Recepción Hotel pensiones completas consumidas
```

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

Foreign keys recomendadas:

```sql
alter table recepcion_cash
add constraint recepcion_cash_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete set null;

alter table recepcion_cash
add constraint recepcion_cash_responsable_id_fk
foreign key (responsable_id)
references employees(id);
```

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

Acción recomendada:

```sql
-- No ejecutar sin backup
-- Crear vista temporal para comparar registros
select count(*) from recepcion_cash;
select count(*) from recepcion_cash_closures;
```

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

Foreign keys recomendadas:

```sql
alter table recepcion_ventas
add constraint recepcion_ventas_shift_id_fk
foreign key (shift_id)
references shifts(id)
on delete cascade;

alter table recepcion_ventas
add constraint recepcion_ventas_empleado_id_fk
foreign key (empleado_id)
references employees(id);
```

Reglas:

- Ventas SYNCROLAB desde Recepción Hotel se registran aquí.
- Venta sin número de reserva MEWS = error grave.
- Venta sin número de reserva MEWS puede generar FIO.
- `reserva_mews` es obligatoria en Recepción Hotel.
- SYNCROLAB no tiene acceso MEWS, por tanto SYNCROLAB no debe depender de `reserva_mews`.

---

# 5. Tablas nuevas necesarias para nivel ultra producción

## 5.1 `gestion_pendiente`

Actualmente las gestiones pendientes no tienen tabla propia clara. No deben confundirse con tareas.

Crear:

```sql
create table if not exists gestion_pendiente (
  id text primary key,
  shift_id text references shifts(id) on delete cascade,
  employee_id text references employees(id),
  department_code text not null,
  fecha date not null,
  servicio_turno text,
  tipo_gestion text not null,
  descripcion text not null,
  estado text not null default 'Abierta',
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz,
  closed_by text references employees(id)
);
```

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
- Si usuario marca “No”, no se crea registro.
- Si marca “Sí”, tipo y descripción son obligatorios.

---

## 5.2 `fio_records`

Actualmente FIO está dentro de `shifts`. Para producción se recomienda tabla propia.

```sql
create table if not exists fio_records (
  id text primary key,
  shift_id text references shifts(id) on delete cascade,
  employee_id text references employees(id),
  error_employee_id text references employees(id),
  department_code text not null,
  fecha date not null,
  concepto_fio text not null,
  severidad_fio text not null,
  impacto_bonus text not null,
  comentario_supervisor text not null,
  creado_por text references employees(id),
  estado text not null default 'Activo',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

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

```sql
create table if not exists alert_logs (
  id uuid primary key default uuid_generate_v4(),
  alert_type text not null,
  entity_type text not null,
  entity_id text not null,
  department_code text,
  employee_id text,
  severity text not null default 'Media',
  status text not null default 'Activa',
  message text not null,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by text,
  metadata jsonb default '{}'::jsonb
);
```

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

```sql
create table if not exists conciliation_records (
  id uuid primary key default uuid_generate_v4(),
  conciliation_type text not null,
  business_date date not null,
  source_entity text not null,
  source_entity_id text not null,
  target_entity text not null,
  target_entity_id text,
  department_origin text,
  department_target text,
  amount_source numeric default 0,
  amount_target numeric default 0,
  quantity_source numeric default 0,
  quantity_target numeric default 0,
  difference_amount numeric default 0,
  difference_quantity numeric default 0,
  status text not null default 'Pendiente',
  severity text,
  notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

Tipos:

```text
sala_room_charge_vs_recepcion_room_charge
sala_desayuno_vs_recepcion_desayuno
sala_media_pension_vs_recepcion_media_pension
sala_pension_completa_vs_recepcion_pension_completa
syncrolab_talonario_vs_recepcion_syncrolab_charge
```

---

# 6. Joins SQL reales para dashboard

## 6.1 Turnos por empleado

```sql
select
  e.id as employee_id,
  e.nombre,
  e.area,
  e.puesto,
  count(s.id) as total_turnos,
  coalesce(sum(s.horas), 0) as total_horas,
  count(*) filter (where s.estado in ('Pendiente', 'Pendiente revisión', 'Pendiente validación')) as turnos_pendientes,
  count(*) filter (where s.estado in ('Validado', 'Cerrado')) as turnos_validados
from shifts s
left join employees e on e.id = s.employee_id
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and (:department = 'Todos' or s.area = :department)
  and (:employee_id = 'Todos' or s.employee_id = :employee_id)
group by e.id, e.nombre, e.area, e.puesto
order by total_turnos desc, total_horas desc;
```

---

## 6.2 Incidencias por empleado y periodo

```sql
select
  i.employee_id,
  coalesce(e.nombre, i.nombre) as empleado,
  coalesce(e.area, s.area) as departamento,
  count(i.id) as total_incidencias,
  count(*) filter (where i.estado in ('Abierta', 'Pendiente', 'En proceso')) as abiertas,
  count(*) filter (where i.estado in ('Cerrada', 'Validada')) as cerradas,
  count(*) filter (where i.severidad in ('Alta', 'Crítica')) as alta_critica
from incidencias i
left join employees e on e.id = i.employee_id
left join shifts s on s.id = i.shift_id
where i.created_at >= :from_ts
  and i.created_at < :to_ts
  and (:department = 'Todos' or coalesce(e.area, s.area) = :department)
  and (:employee_id = 'Todos' or i.employee_id = :employee_id)
group by i.employee_id, coalesce(e.nombre, i.nombre), coalesce(e.area, s.area)
order by total_incidencias desc;
```

---

## 6.3 Tiempo medio de resolución de incidencias

Requiere `closed_at` o `resolved_at`. Actualmente no existe. Mientras no exista:

```text
[NO DATA] para cálculo exacto.
```

Migración necesaria:

```sql
alter table incidencias add column if not exists resolved_at timestamptz;
alter table incidencias add column if not exists closed_at timestamptz;
```

SQL futuro:

```sql
select
  avg(extract(epoch from (coalesce(i.resolved_at, i.closed_at) - i.created_at)) / 3600) as avg_resolution_hours
from incidencias i
left join employees e on e.id = i.employee_id
left join shifts s on s.id = i.shift_id
where coalesce(i.resolved_at, i.closed_at) is not null
  and i.created_at >= :from_ts
  and i.created_at < :to_ts
  and (:department = 'Todos' or coalesce(e.area, s.area) = :department);
```

---

## 6.4 Mermas Cocina

```sql
select
  m.employee_id,
  coalesce(e.nombre, m.nombre) as empleado,
  count(m.id) as lineas_merma,
  coalesce(sum(m.coste_total), 0) as coste_merma_total,
  coalesce(sum(m.cantidad), 0) as cantidad_total
from merma m
left join employees e on e.id = m.employee_id
left join shifts s on s.id = m.shift_id
where m.created_at >= :from_ts
  and m.created_at < :to_ts
  and (:employee_id = 'Todos' or m.employee_id = :employee_id)
group by m.employee_id, coalesce(e.nombre, m.nombre)
order by coste_merma_total desc;
```

---

## 6.5 Tareas abiertas / vencidas

Actualmente `deadline` es texto. Requiere `deadline_date`.

Migración:

```sql
alter table tareas add column if not exists deadline_date date;
```

SQL:

```sql
select
  dept_destino,
  count(id) as total_tareas,
  count(*) filter (where estado in ('Pendiente', 'Abierta', 'En proceso')) as abiertas,
  count(*) filter (
    where estado in ('Pendiente', 'Abierta', 'En proceso')
      and deadline_date < current_date
  ) as vencidas,
  count(*) filter (where estado in ('Completada', 'Verificada', 'Cerrada')) as cerradas
from tareas
where created_at >= :from_ts
  and created_at < :to_ts
  and (:department = 'Todos' or dept_destino = :department or dept_origen = :department)
group by dept_destino
order by abiertas desc;
```

---

## 6.6 FIO actual desde `shifts`

Mientras no exista `fio_records`:

```sql
select
  coalesce(s.error_employee_id, s.employee_id) as employee_id,
  coalesce(s.error_employee_nombre, e.nombre, s.nombre) as empleado,
  s.area as departamento,
  count(s.id) filter (where s.fio = true) as fio_total,
  count(s.id) filter (where s.fio = true and s.gravedad_error in ('Alta', 'Crítica')) as fio_alta_critica,
  count(s.id) filter (where s.fio = true and s.tipo_error is not null) as fio_con_tipo
from shifts s
left join employees e on e.id = coalesce(s.error_employee_id, s.employee_id)
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and (:department = 'Todos' or s.area = :department)
  and (:employee_id = 'Todos' or coalesce(s.error_employee_id, s.employee_id) = :employee_id)
group by coalesce(s.error_employee_id, s.employee_id), coalesce(s.error_employee_nombre, e.nombre, s.nombre), s.area
order by fio_total desc;
```

---

## 6.7 Checklist completado

`shifts.checklist_items` está como `text`. Debe normalizarse.

Formato actual esperado:

```text
[NO DATA]
```

Recomendación:

- convertir a `jsonb`;
- guardar cada ítem con `id`, `label`, `section`, `checked`.

Migración:

```sql
alter table shifts add column if not exists checklist_items_json jsonb default '[]'::jsonb;
```

SQL futuro:

```sql
select
  s.id as shift_id,
  s.employee_id,
  s.area,
  count(item) as total_items,
  count(item) filter ((item->>'checked')::boolean = true) as checked_items,
  round(
    (count(item) filter ((item->>'checked')::boolean = true)::numeric
    / nullif(count(item), 0)) * 100,
    2
  ) as checklist_pct
from shifts s
cross join lateral jsonb_array_elements(s.checklist_items_json) as item
where s.created_at >= :from_ts
  and s.created_at < :to_ts
group by s.id, s.employee_id, s.area;
```

---

# 7. Conciliaciones exactas

## 7.1 Sala Room Charge vs Recepción Hotel

Fuente Sala:

```text
sala_cash_closures.room_charge
```

Fuente Recepción Hotel:

```text
[NO DATA] falta campo específico room_charge_recibido en recepcion_cash
```

Recomendación:

```sql
alter table recepcion_cash add column if not exists room_charge_recibido numeric default 0;
```

SQL:

```sql
select
  sc.fecha,
  sum(sc.room_charge) as sala_room_charge,
  sum(rc.room_charge_recibido) as recepcion_room_charge,
  sum(sc.room_charge) - sum(rc.room_charge_recibido) as diferencia
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

---

## 7.2 Sala desayunos / pensiones vs Recepción Hotel

Sala:

```text
sala_cash_closures.pension_desayuno
sala_cash_closures.media_pension
sala_cash_closures.pension_completa
```

Recepción:

```text
[NO DATA] faltan campos actuales en recepcion_cash para desayunos/pensiones consumidos
```

Recomendación:

```sql
alter table recepcion_cash add column if not exists desayunos_consumidos numeric default 0;
alter table recepcion_cash add column if not exists media_pension_consumida numeric default 0;
alter table recepcion_cash add column if not exists pension_completa_consumida numeric default 0;
```

SQL:

```sql
select
  sc.fecha,
  sum(sc.pension_desayuno) as sala_desayunos,
  sum(rc.desayunos_consumidos) as recepcion_desayunos,
  sum(sc.media_pension) as sala_media_pension,
  sum(rc.media_pension_consumida) as recepcion_media_pension,
  sum(sc.pension_completa) as sala_pension_completa,
  sum(rc.pension_completa_consumida) as recepcion_pension_completa
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

---

## 7.3 SYNCROLAB talonario vs Recepción Hotel

Regla de negocio confirmada:

- Recepción Hotel registra ventas SYNCROLAB con número de reserva MEWS.
- SYNCROLAB no tiene acceso MEWS.
- La conciliación real futura debe ser:
  - cargos/talonario SYNCROLAB;
  - contra cargos SYNCROLAB en Recepción Hotel.
- Match ideal:
  - fecha;
  - importe;
  - tipo de servicio;
  - habitación;
  - número de habitación;
  - número reserva MEWS solo en Recepción Hotel.

Tabla faltante:

```text
syncrolab_charges / syncrolab_talonario = [NO DATA]
```

Crear:

```sql
create table if not exists syncrolab_charges (
  id text primary key,
  fecha date not null,
  tipo_servicio text not null,
  importe numeric not null default 0,
  habitacion text,
  cliente text,
  empleado_id text references employees(id),
  comentario text,
  created_at timestamptz default now()
);
```

Conciliación futura:

```sql
select
  sl.fecha,
  sl.tipo_servicio,
  sl.importe as syncrolab_importe,
  rv.importe as recepcion_importe,
  rv.reserva_mews,
  sl.habitacion,
  case
    when rv.id is null then 'Sin match recepción'
    when sl.importe <> rv.importe then 'Diferencia importe'
    else 'OK'
  end as estado_conciliacion
from syncrolab_charges sl
left join recepcion_ventas rv
  on rv.fecha = sl.fecha::text
 and rv.tipo_venta = sl.tipo_servicio
 and rv.importe = sl.importe
where sl.fecha = :business_date;
```

---

# 8. Agregaciones dashboard

## 8.1 Prioridad de dashboard

Confirmado por Alexander:

```text
Prioridad 1: dashboard por empleado
Prioridad 2: dashboard por departamento
Prioridad 3: dashboard por turno
Prioridad 4: dashboard por periodo
```

## 8.2 Periodos

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

## 8.3 Departamentos

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

Regla:

```sql
-- Restaurante / F&B
where s.area in ('Cocina', 'Sala')
```

## 8.4 Servicio / turno

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

# 9. Endpoints API recomendados

## 9.1 Dashboard summary

```http
GET /api/dashboard/summary
```

Query params:

```text
period
from
to
department
employee_id
service_turn
error_type
```

Devuelve:

```json
{
  "turnos": 0,
  "horas": 0,
  "turnos_pendientes": 0,
  "turnos_validados": 0,
  "incidencias_abiertas": 0,
  "incidencias_cerradas": 0,
  "gestiones_pendientes": 0,
  "tareas_abiertas": 0,
  "tareas_vencidas": 0,
  "fio_total": 0,
  "fio_alta_critica": 0,
  "coste_merma": 0
}
```

---

## 9.2 Dashboard employees

```http
GET /api/dashboard/employees
```

Devuelve ranking por empleado:

```json
[
  {
    "employee_id": "text",
    "nombre": "text",
    "departamento": "Sala",
    "turnos": 2,
    "horas": 14,
    "incidencias": 0,
    "fio": 0,
    "tareas": 0,
    "coste_laboral": 210
  }
]
```

---

## 9.3 Dashboard incidencias

```http
GET /api/dashboard/incidencias
```

Devuelve:

```json
{
  "total": 0,
  "abiertas": 0,
  "cerradas": 0,
  "alta_critica": 0,
  "tiempo_medio_resolucion_horas": null,
  "items": []
}
```

---

## 9.4 Dashboard FIO

```http
GET /api/dashboard/fio
```

Devuelve:

```json
{
  "total": 0,
  "por_severidad": {
    "Baja": 0,
    "Media": 0,
    "Alta": 0,
    "Crítica": 0
  },
  "impacta_bonus": 0,
  "items": []
}
```

---

## 9.5 Dashboard conciliación

```http
GET /api/dashboard/conciliation
```

Devuelve:

```json
{
  "sala_recepcion": {
    "room_charge": {},
    "desayunos": {},
    "media_pension": {},
    "pension_completa": {}
  },
  "syncrolab_recepcion": []
}
```

---

## 9.6 Admin delete definitivo

```http
DELETE /api/admin/entities/:entity/:id
```

Reglas:

- Solo Admin.
- Debe pedir confirmación en popup.
- Debe escribir en `audit_logs`.
- Debe borrar o marcar según modo.
- Si se borra en cascada, dashboard recalcula.

---

# 10. Soft delete vs delete definitivo

Confirmado:

- se permite delete definitivo para pruebas y limpieza;
- debe existir popup especial;
- solo admin;
- debe quedar log.

Recomendación híbrida:

```text
Producción normal: soft delete.
Modo limpieza admin: hard delete con confirmación explícita.
```

Tabla audit:

```sql
insert into audit_logs (user_id, action, entity, entity_id, metadata)
values (:admin_user_id, 'hard_delete', :entity, :entity_id, :metadata);
```

---

# 11. Realtime / WebSocket

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
- añadir botón “Actualizar”.

Regla:

- dashboard debe recalcular tras insert/update/delete;
- no usar datos cacheados obsoletos;
- si una línea se elimina, estadísticas se corrigen retrospectivamente.

---

# 12. Seguridad y RLS

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

# 13. Checklist QA obligatorio

Comprobar:

- login admin;
- login no admin;
- admin ve dashboard completo;
- usuario lineal no ve dashboard admin si no corresponde;
- filtros por departamento funcionan;
- Restaurante / F&B suma Cocina + Sala;
- recepción no muestra servicios de cocina/sala;
- cocina/sala no muestran turnos mañana/tarde/noche;
- empleado filtra datos reales;
- fechas filtran correctamente;
- turnos eliminados desaparecen de dashboard;
- incidencias eliminadas desaparecen de dashboard;
- cierres de caja eliminados desaparecen de dashboard;
- tareas eliminadas desaparecen de dashboard;
- FIO solo lo crea admin/validador/jefe;
- FIO no lo crea usuario en turno;
- dashboard muestra cantidad de FIO;
- dashboard muestra severidad FIO;
- dashboard muestra si impacta bonus;
- cálculo económico de bonus no se muestra todavía como definitivo;
- checklist calcula porcentaje correcto;
- incidencias abiertas generan alerta;
- incidencias cerradas eliminan alerta activa;
- alerta queda en histórico;
- caja Sala aparece pendiente o validada;
- caja Recepción aparece pendiente o validada;
- conciliación Sala vs Recepción se calcula por día;
- conciliación SYNCROLAB queda preparada pero marcada [NO DATA] hasta tabla talonario;
- no aparecen arrays crudos;
- no aparecen errores técnicos;
- no se muestran campos irrelevantes por departamento;
- responsive no se rompe.

---

# 14. Riesgos a evitar

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

---

# 15. Prompt técnico para Codex / Claude Code

Contexto:
Plataforma interna SYNCROSFERA/SynchroShift con Supabase. Existen módulos de turnos, cocina, sala, recepción hotel, validación y dashboard. El modelo de datos actual usa tablas operativas con IDs tipo text y algunas fechas como text. Hay que llevar dashboard/data model a nivel producción sin romper datos existentes.

Problema:
No existen foreign keys operativas reales entre shifts, employees, incidencias, merma, tareas, caja sala, caja recepción y ventas recepción. Dashboard necesita joins fiables, agregaciones por empleado/departamento/periodo, conciliaciones y alertas históricas.

Objetivo:
Implementar modelo de datos ultra producción manteniendo compatibilidad con tablas actuales y añadiendo columnas/tablas necesarias sin borrar datos.

Requisitos funcionales:
- Mantener tablas existentes.
- Añadir foreign keys recomendadas donde tipos coincidan.
- Crear tablas `gestion_pendiente`, `fio_records`, `alert_logs`, `conciliation_records`, `incidencia_staff`.
- Añadir columnas normalizadas de fecha donde sea necesario.
- Crear SQL queries para dashboard summary, empleados, incidencias, FIO, tareas, mermas y conciliación.
- Dashboard debe priorizar empleado y permitir segunda lectura por departamento.
- Restaurante / F&B debe sumar Cocina + Sala.
- Incidencias deben calcular tiempo medio solo si existe `resolved_at` o `closed_at`.
- Alertas activas deben desaparecer al resolverse, manteniendo historial.
- Delete definitivo solo admin, con popup y audit log.

Requisitos UI/UX:
- No mostrar errores técnicos.
- Filtros claros: periodo, departamento, servicio/turno, empleado, tipo error.
- Eliminar filtro severidad global si genera confusión, salvo dentro de FIO/incidencias.
- Mostrar pending/validated separados en cajas.
- Dashboard debe recalcular en realtime y tener botón actualizar.

Reglas de datos:
- `employee_id + shift_id + department/area` deben existir en registros operativos.
- FIO nunca se crea por usuario lineal.
- Gestión pendiente no es tarea.
- Tarea tiene responsable y deadline.
- Merma solo cocina.
- Sala y Recepción se concilian por fecha.
- SYNCROLAB requiere tabla futura de talonario/cargos.

Reglas de permisos:
- Admin ve todo y puede eliminar definitivo.
- Validador/jefe valida su departamento.
- Usuario lineal crea turno, incidencias, gestiones y tareas permitidas.
- Usuario lineal no valida, no crea FIO, no elimina definitivo.

Criterios de aceptación:
- Joins funcionan con datos reales.
- Dashboard recalcula al insertar/editar/eliminar.
- Filtros devuelven resultados correctos.
- F&B suma Cocina + Sala.
- Caja Sala y Recepción aparecen separadas.
- Alertas activas e histórico funcionan.
- Delete definitivo deja log.
- No se rompen módulos existentes.

Pruebas obligatorias:
- Crear turno.
- Crear incidencia.
- Crear tarea.
- Crear merma cocina.
- Crear cierre Sala.
- Crear caja Recepción.
- Validar turno.
- Crear FIO desde validación.
- Ver dashboard por empleado.
- Ver dashboard por departamento.
- Borrar registro y verificar recálculo.
- Probar responsive.
- Probar usuario no admin.

No romper:
- login por PIN;
- módulos cocina, sala, recepción;
- validación;
- cierres de caja;
- registros existentes.

Salida esperada:
- SQL migration segura.
- Queries dashboard.
- Endpoints API.
- Explicación breve.
- Lista de archivos modificados.
- Checklist de pruebas realizadas.
