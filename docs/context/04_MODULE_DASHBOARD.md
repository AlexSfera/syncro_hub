# 04_MODULE_DASHBOARD_ULTRA_PRO_SQL_REAL.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRODUCCIÓN — SQL REAL + DATA MODEL + API + QA  
Estado: documento final de Dashboard para desarrollo backend/frontend.  
Regla: FULL PRO SIN RECORTAR. No resumir. No simplificar. No meter teoría no usable.

---

# 0. ALCANCE DE ESTE DOCUMENTO

Este documento define el Dashboard definitivo de SYNCROSFERA/SynchroShift a nivel:

- producto;
- datos;
- SQL;
- backend/API;
- frontend/UI;
- permisos;
- QA;
- riesgos.

Se basa en las tablas reales detectadas en Supabase y en las reglas operativas ya confirmadas por Alexander.

El Dashboard debe servir para:

- controlar operación diaria;
- medir rendimiento por empleado;
- medir rendimiento por departamento;
- controlar incidencias;
- controlar FIO;
- controlar tareas;
- controlar gestiones pendientes;
- controlar cajas;
- controlar costes;
- controlar conciliaciones entre Sala, Recepción y SYNCROLAB;
- mantener alertas activas e histórico;
- recalcular métricas tras validación, corrección o eliminación.

---

# 1. PRINCIPIO PRINCIPAL DEL DASHBOARD

```text
Dashboard = control operativo real, no panel decorativo.
```

El dashboard debe:

- leer datos reales persistidos en Supabase;
- no inventar métricas;
- no usar mocks;
- recalcular al cambiar datos;
- respetar permisos;
- separar claramente datos pendientes, validados, cerrados y eliminados;
- priorizar lectura por empleado;
- permitir segunda lectura por departamento;
- mantener coherencia con Validación.

---

# 2. PRIORIDAD DE ANÁLISIS CONFIRMADA

## 2.1 Prioridad 1 — Empleado

La vista principal del Dashboard debe ser:

```text
Empleado primero.
```

El dashboard debe responder rápidamente:

- qué hizo cada empleado;
- cuántos turnos registró;
- cuántas horas trabajó;
- cuántas incidencias generó;
- cuántas tareas creó o recibió;
- cuántos FIO tiene;
- qué severidad tienen sus FIO;
- si sus FIO impactan bonus;
- qué KPI específicos tiene según departamento;
- si tiene alertas activas;
- si tiene incidencias abiertas;
- si tiene cierres pendientes.

## 2.2 Prioridad 2 — Departamento

La segunda lectura debe ser:

```text
Departamento.
```

Debe responder:

- cómo va Cocina;
- cómo va Sala;
- cómo va Recepción Hotel;
- cómo va F&B;
- qué departamentos tienen más incidencias;
- qué departamentos tienen más FIO;
- qué departamentos tienen tareas vencidas;
- qué departamentos tienen diferencias de caja;
- qué departamentos tienen conciliaciones con diferencia.

## 2.3 Prioridad 3 — Turno / Servicio

Tercer nivel:

```text
Servicio / Turno.
```

Regla:

- Cocina/Sala usan servicio.
- Recepción Hotel usa turno.
- UI siempre debe mostrar el label unificado: `Servicio / Turno`.

## 2.4 Prioridad 4 — Periodo

Todo debe poder verse por:

- Hoy;
- Esta semana;
- Este mes;
- Todo;
- Rango personalizado futuro `[NO DATA]`.

---

# 3. TABLAS REALES USADAS POR DASHBOARD

## 3.1 Tablas operativas actuales

| Tabla | Uso dashboard |
|---|---|
| `employees` | empleados, área, rol, coste laboral |
| `departments` | catálogo de departamentos |
| `shifts` | turnos, horas, estados, checklist, FIO actual, ajustes Sala |
| `incidencias` | incidencias operativas, estado, severidad, SLA |
| `merma` | mermas Cocina y coste merma |
| `tareas` | tareas, deadlines, estados |
| `sala_cash_closures` | caja Sala, room charge, pensiones, diferencias |
| `recepcion_cash` | caja Recepción Hotel |
| `recepcion_cash_closures` | tabla duplicada/legacy parcial de recepción caja |
| `recepcion_ventas` | ventas SYNCROLAB registradas por Recepción |
| `syncrolab_cash_closures` | caja SYNCROLAB, cargos MEWS, traspaso mediodía |
| `audit_logs` | auditoría moderna |
| `audit_log` | auditoría antigua textual |

## 3.2 Tablas fuera de alcance dashboard operativo

No deben alimentar el Dashboard operativo:

- `courses`
- `course_weeks`
- `course_assignments`
- `week_attempts`
- `attempt_answers`
- `questions`
- `sops`
- `notifications` salvo futuro sistema de notificaciones
- `users` salvo autenticación futura

Regla:

```text
No mezclar tablas de formación/cursos con dashboard operativo.
```

---

# 4. PROBLEMAS REALES DEL MODELO ACTUAL QUE AFECTAN DASHBOARD

## 4.1 Foreign keys no existentes

Actualmente las relaciones operativas existen por campos text, pero no como FK reales:

```text
shifts.employee_id -> employees.id
incidencias.shift_id -> shifts.id
incidencias.employee_id -> employees.id
merma.shift_id -> shifts.id
merma.employee_id -> employees.id
tareas.shift_id -> shifts.id
recepcion_cash.shift_id -> shifts.id
recepcion_ventas.shift_id -> shifts.id
sala_cash_closures.responsable_id -> employees.id
```

Riesgo:

- datos huérfanos;
- dashboard contando registros sin empleado;
- registros que no pueden trazarse a turno;
- eliminación sin cascada;
- conciliación incompleta.

## 4.2 Fechas como texto

Campos fecha en texto:

```text
shifts.fecha
incidencias.fecha
merma.fecha
tareas.deadline
sala_cash_closures.fecha
sala_cash_closures.created_at
sala_cash_closures.updated_at
recepcion_cash.fecha
recepcion_cash.validado_ts
recepcion_ventas.fecha
```

Riesgo:

- filtros por fecha fallan;
- orden por fecha incorrecto;
- conciliación por día incorrecta;
- dashboard con periodo erróneo.

Recomendación:

- añadir columnas normalizadas `*_date`;
- mantener campos antiguos por compatibilidad;
- usar columnas normalizadas para SQL del dashboard.

## 4.3 FIO todavía dentro de `shifts`

Campos actuales:

```text
shifts.fio
shifts.gravedad_error
shifts.tipo_error
shifts.num_errores
shifts.error_employee_id
shifts.error_employee_nombre
```

Esto permite dashboard inicial, pero no es suficiente para producción avanzada.

Recomendación futura:

```text
fio_records
```

## 4.4 Gestiones pendientes sin tabla clara

No se ha detectado una tabla propia para gestiones pendientes.

No deben mezclarse con:

- tareas;
- incidencias;
- observaciones.

Recomendación:

```text
gestion_pendiente
```

## 4.5 Recepción Cash duplicada

Existen:

```text
recepcion_cash
recepcion_cash_closures
```

Recomendación:

- usar `recepcion_cash` como tabla canónica si es la que usa el flujo activo;
- dejar `recepcion_cash_closures` como legacy hasta migración;
- no contar ambas en dashboard para evitar duplicidad.

---

# 5. FILTROS GLOBALES DEL DASHBOARD

## 5.1 Filtro periodo

Opciones:

```text
Hoy
Esta semana
Este mes
Todo
Personalizado [NO DATA]
```

### SQL periodo base

Para tablas con `created_at` timestamp:

```sql
where created_at >= :from_ts
  and created_at < :to_ts
```

Para tablas con `fecha text`:

```sql
where to_date(fecha, 'YYYY-MM-DD') >= :from_date
  and to_date(fecha, 'YYYY-MM-DD') < :to_date
```

Riesgo:

- si `fecha` no está en formato `YYYY-MM-DD`, la query puede fallar.

Recomendación:

```sql
alter table shifts add column if not exists fecha_date date;
alter table incidencias add column if not exists fecha_date date;
alter table merma add column if not exists fecha_date date;
alter table sala_cash_closures add column if not exists fecha_date date;
alter table recepcion_cash add column if not exists fecha_date date;
alter table recepcion_ventas add column if not exists fecha_date date;
alter table tareas add column if not exists deadline_date date;
```

## 5.2 Filtro departamento

Opciones UI:

```text
Todos
Cocina
Sala
Restaurante / F&B
Recepción Hotel
Recepción SYNCROLAB
Housekeeping [futuro]
Clínica [futuro]
Mantenimiento [futuro]
Marketing [futuro]
Sales [futuro]
```

### Regla F&B

```text
F&B = Sala + Cocina
```

SQL lógico:

```sql
where s.area in ('Sala', 'Cocina')
```

## 5.3 Filtro Servicio / Turno

Label único:

```text
Servicio / Turno
```

Cocina/Sala:

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

Regla:

- si departamento = Recepción Hotel, filtrar por turno;
- si departamento = Sala/Cocina/F&B, filtrar por servicio.

## 5.4 Filtro empleado

Fuente:

```text
employees
```

SQL:

```sql
select id, nombre, area, puesto
from employees
where estado = 'Activo'
order by nombre;
```

Filtrado por departamento:

```sql
where area = :department
```

Para F&B:

```sql
where area in ('Sala', 'Cocina')
```

## 5.5 Filtro tipo FIO

Fuente actual:

```text
shifts.tipo_error
```

Valores esperados:

```text
Operativo
Disciplina
Comunicación
Procedimiento
Calidad
Caja / cobro
APPCC / higiene
Atención al cliente
Registro incompleto
Otro
```

## 5.6 Severidad FIO

No se usa como filtro principal por UX, pero se muestra en métricas.

Fuente actual:

```text
shifts.gravedad_error
```

Valores esperados:

```text
Baja
Media
Alta
Crítica
```

---

# 6. KPI PRINCIPALES — DEFINICIÓN Y SQL

## 6.1 KPI Turnos

### Campos

Fuente:

```text
shifts
```

Columnas:

```text
id
employee_id
nombre
area
fecha
servicio
horas
estado
created_at
```

### Métricas

- total turnos;
- horas totales;
- turnos pendientes;
- turnos en corrección;
- turnos validados;
- turnos cerrados.

### SQL Summary Turnos

```sql
select
  count(s.id) as total_turnos,
  coalesce(sum(s.horas), 0) as total_horas,
  count(*) filter (where s.estado in ('Pendiente', 'Pendiente revisión', 'Pendiente validación')) as turnos_pendientes,
  count(*) filter (where s.estado in ('En corrección', 'Corrección')) as turnos_correccion,
  count(*) filter (where s.estado = 'Validado') as turnos_validados,
  count(*) filter (where s.estado = 'Cerrado') as turnos_cerrados
from shifts s
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and (
    :department = 'Todos'
    or (:department = 'Restaurante / F&B' and s.area in ('Sala','Cocina'))
    or s.area = :department
  )
  and (:employee_id = 'Todos' or s.employee_id = :employee_id)
  and (:service_turn = 'Todos' or s.servicio = :service_turn);
```

### SQL Turnos por empleado

```sql
select
  e.id as employee_id,
  coalesce(e.nombre, s.nombre) as empleado,
  coalesce(e.area, s.area) as departamento,
  count(s.id) as total_turnos,
  coalesce(sum(s.horas), 0) as horas_totales,
  count(*) filter (where s.estado in ('Pendiente', 'Pendiente revisión', 'Pendiente validación')) as pendientes,
  count(*) filter (where s.estado in ('En corrección', 'Corrección')) as en_correccion,
  count(*) filter (where s.estado = 'Validado') as validados,
  count(*) filter (where s.estado = 'Cerrado') as cerrados
from shifts s
left join employees e on e.id = s.employee_id
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and (
    :department = 'Todos'
    or (:department = 'Restaurante / F&B' and coalesce(e.area, s.area) in ('Sala','Cocina'))
    or coalesce(e.area, s.area) = :department
  )
group by e.id, coalesce(e.nombre, s.nombre), coalesce(e.area, s.area)
order by total_turnos desc, horas_totales desc;
```

---

## 6.2 KPI Incidencias

### Fuente

```text
incidencias
```

Columnas reales:

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
estado
created_at
staff_implicado_ids
staff_implicado_nombres
tipo_incidencia
```

### Métricas

- total incidencias;
- abiertas;
- cerradas;
- severidad alta/crítica;
- por empleado;
- por departamento;
- por tipo;
- SLA.

### SQL Summary Incidencias

```sql
select
  count(i.id) as total_incidencias,
  count(*) filter (where i.estado in ('Abierta','Pendiente','En proceso')) as abiertas,
  count(*) filter (where i.estado in ('Cerrada','Validada')) as cerradas,
  count(*) filter (where i.severidad in ('Alta','Crítica')) as alta_critica
from incidencias i
left join shifts s on s.id = i.shift_id
left join employees e on e.id = i.employee_id
where i.created_at >= :from_ts
  and i.created_at < :to_ts
  and (
    :department = 'Todos'
    or (:department = 'Restaurante / F&B' and coalesce(e.area, s.area) in ('Sala','Cocina'))
    or coalesce(e.area, s.area) = :department
  )
  and (:employee_id = 'Todos' or i.employee_id = :employee_id);
```

### SQL Incidencias por empleado

```sql
select
  i.employee_id,
  coalesce(e.nombre, i.nombre) as empleado,
  coalesce(e.area, s.area) as departamento,
  count(i.id) as total,
  count(*) filter (where i.estado in ('Abierta','Pendiente','En proceso')) as abiertas,
  count(*) filter (where i.estado in ('Cerrada','Validada')) as cerradas,
  count(*) filter (where i.severidad = 'Baja') as severidad_baja,
  count(*) filter (where i.severidad = 'Media') as severidad_media,
  count(*) filter (where i.severidad = 'Alta') as severidad_alta,
  count(*) filter (where i.severidad = 'Crítica') as severidad_critica
from incidencias i
left join employees e on e.id = i.employee_id
left join shifts s on s.id = i.shift_id
where i.created_at >= :from_ts
  and i.created_at < :to_ts
group by i.employee_id, coalesce(e.nombre, i.nombre), coalesce(e.area, s.area)
order by total desc;
```

### SLA incidencias

Regla confirmada:

```text
si cerrada: fecha_cierre - fecha_creacion
si abierta: fecha_actual - fecha_creacion
```

Problema actual:

```text
No existe closed_at/resolved_at en incidencias.
```

Migración necesaria:

```sql
alter table incidencias add column if not exists closed_at timestamptz;
alter table incidencias add column if not exists resolved_at timestamptz;
```

SQL futuro:

```sql
select
  avg(
    extract(epoch from (
      coalesce(i.resolved_at, i.closed_at, now()) - i.created_at
    )) / 3600
  ) as avg_resolution_hours,
  count(*) filter (
    where extract(epoch from (coalesce(i.resolved_at, i.closed_at, now()) - i.created_at)) / 3600 < 24
  ) as sla_ok,
  count(*) filter (
    where extract(epoch from (coalesce(i.resolved_at, i.closed_at, now()) - i.created_at)) / 3600 >= 24
      and extract(epoch from (coalesce(i.resolved_at, i.closed_at, now()) - i.created_at)) / 3600 < 48
  ) as sla_warning,
  count(*) filter (
    where extract(epoch from (coalesce(i.resolved_at, i.closed_at, now()) - i.created_at)) / 3600 >= 48
  ) as sla_critico
from incidencias i
where i.created_at >= :from_ts
  and i.created_at < :to_ts;
```

---

## 6.3 KPI FIO

### Regla confirmada

De momento Dashboard debe mostrar:

- cantidad de FIO;
- severidad;
- si impacta bonus;
- sin cálculo económico de bonus.

No debe calcular todavía:

- penalización monetaria;
- porcentaje de bonus;
- nómina.

### Fuente actual

```text
shifts
```

Campos:

```text
fio boolean
gravedad_error text
tipo_error text
num_errores integer
error_employee_id text
error_employee_nombre text
comentario_validador text
validado_por text
validado_ts timestamptz
```

### SQL FIO Summary

```sql
select
  count(*) filter (where s.fio = true) as total_fio,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Baja') as fio_baja,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Media') as fio_media,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Alta') as fio_alta,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Crítica') as fio_critica,
  count(*) filter (where s.fio = true and s.gravedad_error in ('Alta','Crítica')) as fio_alta_critica
from shifts s
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and (
    :department = 'Todos'
    or (:department = 'Restaurante / F&B' and s.area in ('Sala','Cocina'))
    or s.area = :department
  );
```

### SQL FIO por empleado

```sql
select
  coalesce(s.error_employee_id, s.employee_id) as employee_id,
  coalesce(s.error_employee_nombre, e.nombre, s.nombre) as empleado,
  coalesce(e.area, s.area) as departamento,
  count(*) filter (where s.fio = true) as total_fio,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Baja') as baja,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Media') as media,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Alta') as alta,
  count(*) filter (where s.fio = true and s.gravedad_error = 'Crítica') as critica,
  count(*) filter (where s.fio = true and s.num_errores > 0) as con_impacto_bonus
from shifts s
left join employees e on e.id = coalesce(s.error_employee_id, s.employee_id)
where s.created_at >= :from_ts
  and s.created_at < :to_ts
  and s.fio = true
group by
  coalesce(s.error_employee_id, s.employee_id),
  coalesce(s.error_employee_nombre, e.nombre, s.nombre),
  coalesce(e.area, s.area)
order by total_fio desc, critica desc, alta desc;
```

### Modelo futuro recomendado

Crear tabla `fio_records` para evitar mezclar FIO con shift.

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
  estado text not null default 'No gestionado',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

---

## 6.4 KPI Tareas

### Fuente

```text
tareas
```

Campos:

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

### Problema

`deadline` es texto.

Migración recomendada:

```sql
alter table tareas add column if not exists deadline_date date;
alter table tareas add column if not exists responsable_id text references employees(id);
```

### SQL Tareas Summary

```sql
select
  count(t.id) as total_tareas,
  count(*) filter (where t.estado in ('Pendiente','Abierta','En proceso')) as abiertas,
  count(*) filter (
    where t.estado in ('Pendiente','Abierta','En proceso')
      and t.deadline_date < current_date
  ) as vencidas,
  count(*) filter (where t.estado in ('Completada','Verificada','Cerrada')) as cerradas
from tareas t
where t.created_at >= :from_ts
  and t.created_at < :to_ts
  and (
    :department = 'Todos'
    or (:department = 'Restaurante / F&B' and (t.dept_origen in ('Sala','Cocina') or t.dept_destino in ('Sala','Cocina')))
    or t.dept_origen = :department
    or t.dept_destino = :department
  );
```

### SQL Tareas por empleado creador

```sql
select
  t.creado_por as employee_id,
  e.nombre as empleado,
  e.area as departamento,
  count(t.id) as total_creadas,
  count(*) filter (where t.estado in ('Pendiente','Abierta','En proceso')) as abiertas,
  count(*) filter (where t.estado in ('Completada','Verificada','Cerrada')) as cerradas
from tareas t
left join employees e on e.id = t.creado_por
where t.created_at >= :from_ts
  and t.created_at < :to_ts
group by t.creado_por, e.nombre, e.area
order by total_creadas desc;
```

---

## 6.5 KPI Mermas Cocina

### Fuente

```text
merma
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

### SQL Merma Summary

```sql
select
  count(m.id) as lineas_merma,
  coalesce(sum(m.cantidad), 0) as cantidad_total,
  coalesce(sum(m.coste_total), 0) as coste_merma_total
from merma m
where m.created_at >= :from_ts
  and m.created_at < :to_ts
  and (:employee_id = 'Todos' or m.employee_id = :employee_id);
```

### SQL Merma por empleado

```sql
select
  m.employee_id,
  coalesce(e.nombre, m.nombre) as empleado,
  count(m.id) as lineas_merma,
  coalesce(sum(m.cantidad), 0) as cantidad_total,
  coalesce(sum(m.coste_total), 0) as coste_total
from merma m
left join employees e on e.id = m.employee_id
where m.created_at >= :from_ts
  and m.created_at < :to_ts
group by m.employee_id, coalesce(e.nombre, m.nombre)
order by coste_total desc;
```

---

## 6.6 KPI Costes laborales

### Fuente

```text
employees.coste
shifts.horas
```

### Fórmula

```text
coste_laboral = shifts.horas * employees.coste
```

### SQL

```sql
select
  e.id as employee_id,
  e.nombre,
  e.area,
  coalesce(sum(s.horas), 0) as horas,
  e.coste as coste_hora,
  coalesce(sum(s.horas), 0) * coalesce(e.coste, 0) as coste_laboral
from shifts s
left join employees e on e.id = s.employee_id
where s.created_at >= :from_ts
  and s.created_at < :to_ts
group by e.id, e.nombre, e.area, e.coste
order by coste_laboral desc;
```

Regla:

- Tipo coste = coste laboral.
- No inventar otros tipos de coste.
- Si más adelante hay otros costes, crear tabla separada `[NO DATA]`.

---

## 6.7 KPI Checklist

### Fuente actual

```text
shifts.checklist_items
```

### Problema

Campo actual es `text`.

No se conoce estructura exacta.

Debe normalizarse a JSONB:

```sql
alter table shifts add column if not exists checklist_items_json jsonb default '[]'::jsonb;
```

### Fórmula confirmada

```text
% checklist = items completados / items totales * 100
```

### Agregaciones confirmadas

- media por empleado;
- media por departamento;
- media por turno/servicio.

### SQL futuro con JSONB

```sql
with checklist as (
  select
    s.id as shift_id,
    s.employee_id,
    s.area,
    s.servicio,
    count(item) as total_items,
    count(item) filter ((item->>'checked')::boolean = true) as completed_items
  from shifts s
  cross join lateral jsonb_array_elements(s.checklist_items_json) as item
  where s.created_at >= :from_ts
    and s.created_at < :to_ts
  group by s.id, s.employee_id, s.area, s.servicio
)
select
  employee_id,
  avg((completed_items::numeric / nullif(total_items, 0)) * 100) as checklist_pct_avg
from checklist
group by employee_id;
```

---

# 7. KPI Recepción Hotel

## 7.1 Fuente actual

Parte de los KPI de recepción están en:

```text
recepcion_ventas
recepcion_cash
shifts
rec_shift_data [NO DATA schema no aportado en esta tanda]
```

## 7.2 KPI confirmados por negocio

Recepción debe mostrar:

- check-ins;
- check-outs;
- reservas gestionadas;
- reservas pendientes;
- desayunos ofrecidos;
- desayunos vendidos;
- ventas SYNCROLAB;
- leads pendientes Bitrix24;
- revisión de emails / WhatsApp / llamadas;
- clientes insatisfechos;
- caja Recepción;
- diferencia cash/tarjeta/Stripe;
- room charge recibido;
- pensiones/desayunos confirmados;
- cargos SYNCROLAB en recepción.

## 7.3 Problema actual

No tenemos schema completo de `rec_shift_data`.

Por tanto:

```text
[NO DATA] columnas reales para check-ins/check-outs/leads/clientes insatisfechos.
```

Regla:

- el Dashboard debe reservar estos KPI;
- no calcularlos si no existen columnas;
- mostrar “Sin datos en el periodo” si no hay fuente.

## 7.4 SQL ventas SYNCROLAB desde Recepción

Fuente:

```text
recepcion_ventas
```

SQL:

```sql
select
  rv.empleado_id,
  coalesce(e.nombre, rv.empleado_nombre) as empleado,
  count(rv.id) as total_ventas,
  coalesce(sum(rv.importe), 0) as importe_total,
  count(*) filter (where rv.reserva_mews is null or rv.reserva_mews = '') as ventas_sin_reserva_mews
from recepcion_ventas rv
left join employees e on e.id = rv.empleado_id
where rv.created_at >= :from_ts
  and rv.created_at < :to_ts
group by rv.empleado_id, coalesce(e.nombre, rv.empleado_nombre)
order by importe_total desc;
```

Regla validación:

```text
Venta SYNCROLAB sin reserva MEWS = error grave y posible FIO.
```

---

# 8. Cajas en Dashboard

## 8.1 Regla confirmada

Mostrar todas las cajas:

- pendientes;
- validadas.

Separar visualmente:

```text
Pendientes
Validadas
Con diferencia
Sin diferencia
```

## 8.2 Caja Sala

Fuente:

```text
sala_cash_closures
```

Métricas:

- total cierres;
- pendientes;
- validados;
- diferencia caja total;
- diferencia efectivo;
- diferencia tarjeta;
- diferencia Stripe;
- diferencia operativa Sala;
- room charge declarado;
- desayunos declarados;
- media pensión declarada;
- pensión completa declarada.

SQL:

```sql
select
  count(id) as total_cierres,
  count(*) filter (where estado = 'Pendiente validación') as pendientes,
  count(*) filter (where estado = 'Validado') as validados,
  coalesce(sum(diferencia_caja), 0) as diferencia_caja_total,
  coalesce(sum(diferencia_efectivo), 0) as diferencia_efectivo_total,
  coalesce(sum(diferencia_tarjeta), 0) as diferencia_tarjeta_total,
  coalesce(sum(diferencia_stripe), 0) as diferencia_stripe_total,
  coalesce(sum(diferencia_operativa_sala), 0) as diferencia_operativa_sala_total,
  coalesce(sum(room_charge), 0) as room_charge_total,
  coalesce(sum(pension_desayuno), 0) as desayunos_total,
  coalesce(sum(media_pension), 0) as media_pension_total,
  coalesce(sum(pension_completa), 0) as pension_completa_total
from sala_cash_closures
where to_date(fecha, 'YYYY-MM-DD') >= :from_date
  and to_date(fecha, 'YYYY-MM-DD') < :to_date;
```

## 8.3 Caja Recepción

Fuente canónica recomendada:

```text
recepcion_cash
```

Métricas:

- total cierres;
- pendientes;
- validados;
- cash MEWS;
- cash real;
- diferencia cash;
- tarjeta MEWS;
- TPV real;
- diferencia tarjeta;
- Stripe MEWS;
- Stripe real;
- diferencia Stripe;
- diferencia total;
- fondo recibido;
- fondo traspasado;
- fondo inicial siguiente.

SQL:

```sql
select
  count(id) as total_cierres,
  count(*) filter (where estado = 'Pendiente validación') as pendientes,
  count(*) filter (where estado = 'Validado') as validados,
  coalesce(sum(cash_mews), 0) as cash_mews_total,
  coalesce(sum(cash_real), 0) as cash_real_total,
  coalesce(sum(dif_cash), 0) as dif_cash_total,
  coalesce(sum(tarjeta_mews), 0) as tarjeta_mews_total,
  coalesce(sum(tpv_real), 0) as tpv_real_total,
  coalesce(sum(dif_tarjeta), 0) as dif_tarjeta_total,
  coalesce(sum(stripe_mews), 0) as stripe_mews_total,
  coalesce(sum(stripe_real), 0) as stripe_real_total,
  coalesce(sum(dif_stripe), 0) as dif_stripe_total,
  coalesce(sum(dif_total), 0) as dif_total
from recepcion_cash
where to_date(fecha, 'YYYY-MM-DD') >= :from_date
  and to_date(fecha, 'YYYY-MM-DD') < :to_date;
```

## 8.4 Caja SYNCROLAB

El Dashboard debe mostrar Caja SYNCROLAB como tercera caja operativa junto a:

```text
Caja Sala
Caja Recepción Hotel
Caja SYNCROLAB
```

Caja SYNCROLAB debe aparecer en el Dashboard con la misma lógica de control que Caja Sala y Caja Recepción Hotel:

```text
Sistema / esperado
vs
Real / contado / cobrado
=
Diferencia
```

La fórmula general es:

```text
diferencia = real - sistema
```

Si cualquier diferencia es distinta de cero:

```text
explicacion_diferencia = obligatoria
```

No se puede validar una caja con diferencia sin explicación.

---

## 8.4.1 Fuente de datos Caja SYNCROLAB

Fuente futura/recomendada:

```text
syncrolab_cash_closures
```

Esta tabla debe guardar:

- caja FlyBy / Training;
- caja Nubimed / Clínica;
- TPV conjunto;
- Stripe conjunto;
- cargos MEWS FlyBy;
- cargos MEWS Nubimed;
- habitación;
- traspaso mediodía;
- estado;
- validación.

---

## 8.4.2 Estados de Caja SYNCROLAB

Dashboard debe separar visualmente:

- cierres pendientes de validación;
- cierres validados;
- cierres en corrección;
- cierres eliminados si aplica;
- cierres con diferencia;
- cierres con diferencia sin explicación;
- cierres con conciliación pendiente;
- cierres con conciliación OK;
- cierres con conciliación con diferencia.

### Definición de estados

```text
Pendiente validación = cierre registrado pero aún no aprobado.
Validado = cierre revisado y aprobado por Admin o Jefe Recepción SYNCROLAB.
En corrección = cierre devuelto para corregir.
Eliminado = cierre eliminado por Admin y excluido de KPIs.
```

---

## 8.4.3 KPIs de estado Caja SYNCROLAB

Mostrar:

- total cierres SYNCROLAB;
- cierres pendientes;
- cierres validados;
- cierres en corrección;
- cierres eliminados si aplica;
- cierres con diferencia;
- cierres con diferencia sin explicación;
- cierres con conciliación pendiente;
- cierres con conciliación OK;
- cierres con conciliación con diferencia.

---

## 8.4.4 KPIs económicos Caja SYNCROLAB

Mostrar:

### FlyBy / Training

- efectivo FlyBy sistema;
- efectivo Training real;
- diferencia Training;
- cargos MEWS FlyBy;
- servicios SYNCROLAB registrados en FlyBy.

### Nubimed / Clínica

- efectivo Nubimed sistema;
- efectivo Clínica real;
- diferencia Clínica;
- cargos MEWS Nubimed;
- servicios SYNCROLAB registrados en Nubimed.

### TPV conjunto

- TPV FlyBy;
- TPV Nubimed;
- TPV esperado;
- TPV total real;
- diferencia TPV.

### Stripe conjunto

- Stripe sistema SYNCROLAB;
- Stripe total real SYNCROLAB;
- diferencia Stripe.

### Totales

- total efectivo sistema;
- total efectivo real;
- total TPV sistema;
- total TPV real;
- total cargos MEWS;
- total diferencias;
- traspasos mediodía.

---

## 8.4.5 Fórmulas Caja SYNCROLAB

### FlyBy / Training

```text
diferencia_training = efectivo_training_real - efectivo_flyby_sistema
```

### Nubimed / Clínica

```text
diferencia_clinica = efectivo_clinica_real - efectivo_nubimed_sistema
```

### TPV conjunto

```text
total_tpv_sistema = tpv_flyby + tpv_nubimed
diferencia_tpv = tpv_total_real - total_tpv_sistema
```

### Stripe conjunto

```text
diferencia_stripe = stripe_total_syncrolab - stripe_sistema_syncrolab
```

Si no existe fuente sistema para Stripe:

```text
[NO DATA] fuente Stripe sistema
```

En este caso, Stripe se muestra como dato informativo y no debe generar diferencia automática hasta definir fuente sistema.

### Totales

```text
total_efectivo_sistema = efectivo_flyby_sistema + efectivo_nubimed_sistema
total_efectivo_real = efectivo_training_real + efectivo_clinica_real
total_cargos_mews = cargo_mews_flyby + cargo_mews_nubimed
total_diferencias = diferencia_training + diferencia_clinica + diferencia_tpv + diferencia_stripe
```

---

## 8.4.6 SQL Dashboard Caja SYNCROLAB

```sql
select
  count(id) as total_cierres,

  count(*) filter (where estado = 'Pendiente validación') as pendientes,
  count(*) filter (where estado = 'Validado') as validados,
  count(*) filter (where estado = 'En corrección') as en_correccion,
  count(*) filter (where estado = 'Eliminado') as eliminados,

  count(*) filter (where total_diferencias <> 0) as cierres_con_diferencia,
  count(*) filter (
    where total_diferencias <> 0
      and (explicacion_diferencia is null or trim(explicacion_diferencia) = '')
  ) as cierres_diferencia_sin_explicacion,

  coalesce(sum(efectivo_flyby_sistema), 0) as efectivo_flyby_sistema,
  coalesce(sum(efectivo_training_real), 0) as efectivo_training_real,
  coalesce(sum(diferencia_training), 0) as diferencia_training,

  coalesce(sum(efectivo_nubimed_sistema), 0) as efectivo_nubimed_sistema,
  coalesce(sum(efectivo_clinica_real), 0) as efectivo_clinica_real,
  coalesce(sum(diferencia_clinica), 0) as diferencia_clinica,

  coalesce(sum(tpv_flyby), 0) as tpv_flyby,
  coalesce(sum(tpv_nubimed), 0) as tpv_nubimed,
  coalesce(sum(total_tpv_sistema), 0) as total_tpv_sistema,
  coalesce(sum(tpv_total_real), 0) as tpv_total_real,
  coalesce(sum(diferencia_tpv), 0) as diferencia_tpv,

  coalesce(sum(stripe_sistema_syncrolab), 0) as stripe_sistema_syncrolab,
  coalesce(sum(stripe_total_syncrolab), 0) as stripe_total_syncrolab,
  coalesce(sum(diferencia_stripe), 0) as diferencia_stripe,

  coalesce(sum(cargo_mews_flyby), 0) as cargo_mews_flyby,
  coalesce(sum(cargo_mews_nubimed), 0) as cargo_mews_nubimed,
  coalesce(sum(total_cargos_mews), 0) as total_cargos_mews,

  coalesce(sum(total_efectivo_sistema), 0) as total_efectivo_sistema,
  coalesce(sum(total_efectivo_real), 0) as total_efectivo_real,
  coalesce(sum(total_diferencias), 0) as total_diferencias,

  count(*) filter (where traspaso_mediodia_si = true) as traspasos_mediodia
from syncrolab_cash_closures
where fecha between :from_date and :to_date
  and estado <> 'Eliminado';
```

---

# 9. Conciliación Sala ↔ Recepción

## 9.1 Regla confirmada

Conciliación debe ser visible ya en Dashboard.

Comparación por mismo día.

No se pregunta por servicio/turno ahora: la regla confirmada es **mismo día**.

## 9.2 Conciliaciones requeridas

### 9.2.1 Room charge

```text
Sala room_charge declarado
vs
Recepción room_charge recibido
```

Fuente Sala:

```text
sala_cash_closures.room_charge
```

Fuente Recepción:

```text
recepcion_cash.room_charge_recibido
```

Problema:

```text
room_charge_recibido no aparece actualmente en schema aportado de recepcion_cash.
```

Migración necesaria:

```sql
alter table recepcion_cash add column if not exists room_charge_recibido numeric default 0;
```

SQL:

```sql
select
  sc.fecha,
  coalesce(sum(sc.room_charge), 0) as sala_room_charge,
  coalesce(sum(rc.room_charge_recibido), 0) as recepcion_room_charge,
  coalesce(sum(sc.room_charge), 0) - coalesce(sum(rc.room_charge_recibido), 0) as diferencia,
  case
    when coalesce(sum(sc.room_charge), 0) = coalesce(sum(rc.room_charge_recibido), 0)
    then 'OK'
    else 'DIFERENCIA'
  end as estado
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

### 9.2.2 Desayunos

```text
Sala pension_desayuno
vs
Recepción desayunos consumidos/confirmados
```

Fuente Sala:

```text
sala_cash_closures.pension_desayuno
```

Fuente Recepción requerida:

```text
recepcion_cash.desayunos_consumidos
```

Migración:

```sql
alter table recepcion_cash add column if not exists desayunos_consumidos numeric default 0;
```

SQL:

```sql
select
  sc.fecha,
  coalesce(sum(sc.pension_desayuno), 0) as sala_desayunos,
  coalesce(sum(rc.desayunos_consumidos), 0) as recepcion_desayunos,
  coalesce(sum(sc.pension_desayuno), 0) - coalesce(sum(rc.desayunos_consumidos), 0) as diferencia,
  case
    when coalesce(sum(sc.pension_desayuno), 0) = coalesce(sum(rc.desayunos_consumidos), 0)
    then 'OK'
    else 'DIFERENCIA'
  end as estado
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

### 9.2.3 Media pensión

Fuente Sala:

```text
sala_cash_closures.media_pension
```

Fuente Recepción:

```text
recepcion_cash.media_pension_consumida
```

Migración:

```sql
alter table recepcion_cash add column if not exists media_pension_consumida numeric default 0;
```

### 9.2.4 Pensión completa

Fuente Sala:

```text
sala_cash_closures.pension_completa
```

Fuente Recepción:

```text
recepcion_cash.pension_completa_consumida
```

Migración:

```sql
alter table recepcion_cash add column if not exists pension_completa_consumida numeric default 0;
```

## 9.3 UI conciliación Sala ↔ Recepción

Tabla:

| Fecha | Concepto | Sala declara | Recepción confirma | Diferencia | Estado |
|---|---:|---:|---:|---:|---|
| 2026-05-03 | Room charge | 100 | 100 | 0 | OK |
| 2026-05-03 | Desayunos | 12 | 10 | 2 | DIFERENCIA |

Colores:

- OK → verde.
- DIFERENCIA → rojo.
- Pendiente de datos → amarillo.

---

# 10. Conciliación SYNCROLAB ↔ Recepción Hotel

## 10.1 Regla de negocio

La conciliación correcta es:

```text
SYNCROLAB total_cargos_mews
vs
Recepción Hotel syncrolab_room_charged
```

SYNCROLAB puede generar cargos a MEWS desde:

- FlyBy;
- Nubimed.

Recepción Hotel debe confirmar esos cargos.

---

## 10.2 Matching confirmado

La conciliación debe hacerse por:

```text
fecha + habitación + importe
```

No usar como obligatorio:

```text
número reserva MEWS
```

Motivo:

```text
SYNCROLAB no tiene acceso al número de reserva MEWS.
Recepción Hotel sí puede tener número de reserva MEWS.
```

---

## 10.3 Campos requeridos en SYNCROLAB

Tabla:

```text
syncrolab_cash_closures
```

Campos:

```text
fecha
habitacion
cargo_mews_flyby
cargo_mews_nubimed
total_cargos_mews
```

---

## 10.4 Campos requeridos en Recepción Hotel

Tabla:

```text
recepcion_cash
```

Campos necesarios:

```text
syncrolab_room_charged
syncrolab_habitacion
```

Si no existen, añadir en migración:

```sql
alter table recepcion_cash add column if not exists syncrolab_room_charged numeric default 0;
alter table recepcion_cash add column if not exists syncrolab_habitacion text;
```

---

## 10.5 SQL conciliación SYNCROLAB ↔ Recepción Hotel

```sql
select
  sc.fecha,
  sc.habitacion,
  sc.total_cargos_mews as syncrolab_total_cargos_mews,
  rc.syncrolab_room_charged as recepcion_syncrolab_room_charged,
  sc.total_cargos_mews - coalesce(rc.syncrolab_room_charged, 0) as diferencia,
  case
    when rc.id is null then 'SIN REGISTRO RECEPCIÓN'
    when sc.total_cargos_mews = rc.syncrolab_room_charged then 'OK'
    else 'DIFERENCIA'
  end as estado
from syncrolab_cash_closures sc
left join recepcion_cash rc
  on rc.fecha = sc.fecha
 and rc.syncrolab_habitacion = sc.habitacion
 and rc.syncrolab_room_charged = sc.total_cargos_mews
where sc.fecha = :business_date
  and sc.estado <> 'Eliminado';
```

---

## 10.6 Estados conciliación

Mostrar:

```text
OK
DIFERENCIA
SIN REGISTRO RECEPCIÓN
PENDIENTE VALIDACIÓN
```

Reglas:

- OK → coincide fecha + habitación + importe.
- DIFERENCIA → existe recepción pero importe no coincide.
- SIN REGISTRO RECEPCIÓN → SYNCROLAB declaró cargo, pero Recepción no lo confirmó.
- PENDIENTE VALIDACIÓN → caja aún no está validada.

---

# 11. Alertas del Dashboard

## 11.1 Regla confirmada

Las alertas:

- desaparecen automáticamente al resolverse;
- quedan guardadas en histórico escrito.

## 11.2 Tipos de alertas

| Código | Descripción | Resolución |
|---|---|---|
| `turno_no_validado` | turno pendiente | estado Validado/Cerrado |
| `incidencia_abierta` | incidencia abierta | estado Cerrada |
| `incidencia_24h` | incidencia supera 24h | cierre incidencia |
| `incidencia_48h` | incidencia supera 48h | cierre incidencia |
| `fio_critico_no_gestionado` | FIO crítico activo | marcar FIO gestionado |
| `caja_pendiente` | cierre caja pendiente | estado Validado |
| `diferencia_caja` | diferencia no resuelta | validación/explicación aceptada |
| `conciliacion_diferencia` | diferencia Sala/Recepción/SYNCROLAB | resolución manual |
| `tarea_vencida` | deadline vencido | completar/verificar |
| `gestion_vencida` | gestión vencida | cerrar/validar |

## 11.3 Tabla necesaria

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

## 11.4 Query alertas activas

```sql
select *
from alert_logs
where status = 'Activa'
order by
  case severity
    when 'Crítica' then 1
    when 'Alta' then 2
    when 'Media' then 3
    else 4
  end,
  first_seen_at asc;
```

## 11.5 Query histórico alertas

```sql
select *
from alert_logs
where status = 'Resuelta'
order by resolved_at desc;
```

## 11.6 Alertas Caja SYNCROLAB

Generar alertas para Caja SYNCROLAB si ocurre cualquiera de estos casos:

### Alertas de validación

- Caja SYNCROLAB pendiente de validación.
- Caja SYNCROLAB en corrección.

### Alertas de diferencias

- diferencia_training != 0 sin explicación.
- diferencia_clinica != 0 sin explicación.
- diferencia_tpv != 0 sin explicación.
- diferencia_stripe != 0 sin explicación.
- total_diferencias != 0 sin explicación.

### Alertas MEWS

- cargo_mews_flyby > 0 sin habitación.
- cargo_mews_nubimed > 0 sin habitación.
- total_cargos_mews > 0 sin habitación.

### Alertas conciliación

- Conciliación SYNCROLAB ↔ Recepción con diferencia.
- Cargo SYNCROLAB sin registro correspondiente en Recepción Hotel.
- Caja SYNCROLAB validada pero Recepción no confirma cargo.

### Alertas traspaso mediodía

- traspaso_mediodia_si = true sin empleado entrega.
- traspaso_mediodia_si = true sin empleado recibe.
- traspaso_mediodia_si = true sin importes de traspaso.
- traspaso_mediodia_si = true sin comentario si hay diferencia.

---

## 11.6.1 Resolución de alertas

Las alertas desaparecen de activas cuando:

- caja se valida;
- diferencia recibe explicación;
- cargo MEWS recibe habitación;
- recepción confirma cargo;
- conciliación pasa a OK;
- traspaso mediodía se completa.

Pero deben quedar en histórico.

---

## 11.6.2 Histórico

Guardar en `alert_logs`:

```text
alert_type
entity_type = syncrolab_cash_closure
entity_id
department_code = SYNCROLAB
employee_id
severity
status
message
first_seen_at
resolved_at
metadata
```

---

# 12. Vistas del Dashboard

## 12.1 Vista Turnos

Columnas:

- Fecha.
- Empleado.
- Departamento.
- Servicio / Turno.
- Horas.
- Estado.
- Incidencias count.
- Gestiones count.
- Tareas count.
- FIO count.
- Alertas.

SQL base:

```sql
select
  s.id,
  s.fecha,
  coalesce(e.nombre, s.nombre) as empleado,
  coalesce(e.area, s.area) as departamento,
  s.servicio as servicio_turno,
  s.horas,
  s.estado,
  count(distinct i.id) as incidencias_count,
  count(distinct t.id) as tareas_count,
  case when s.fio = true then 1 else 0 end as fio_count
from shifts s
left join employees e on e.id = s.employee_id
left join incidencias i on i.shift_id = s.id
left join tareas t on t.shift_id = s.id
where s.created_at >= :from_ts
  and s.created_at < :to_ts
group by s.id, s.fecha, e.nombre, s.nombre, e.area, s.area, s.servicio, s.horas, s.estado, s.fio;
```

## 12.2 Vista Incidencias

Columnas:

- Fecha creación.
- Empleado.
- Departamento.
- Tipo.
- Severidad.
- Estado.
- Tiempo resolución.
- SLA.
- Acción.

## 12.3 Vista Gestiones

Fuente actual:

```text
[NO DATA] tabla no existe clara.
```

Crear `gestion_pendiente`.

Columnas:

- Fecha.
- Empleado.
- Departamento.
- Tipo.
- Descripción.
- Estado.
- Tiempo abierta.
- Deadline.
- Acción.

## 12.4 Vista FIO

Columnas:

- Fecha.
- Empleado afectado.
- Departamento.
- Tipo error.
- Severidad.
- Impacta bonus.
- Estado.
- Validador.
- Comentario.

## 12.5 Vista Tareas

Columnas:

- Fecha.
- Título.
- Origen.
- Destino.
- Responsable.
- Deadline.
- Estado.
- Prioridad.
- Vencida.
- Acción.

## 12.6 Vista Costes

Columnas:

- Fecha.
- Empleado.
- Departamento.
- Horas.
- Coste/hora.
- Coste laboral.
- Merma coste.
- Total.

## 12.7 Vista Cajas

Columnas:

- Fecha.
- Departamento.
- Responsable.
- Servicio / Turno.
- Estado.
- Neto.
- Bruto.
- Diferencia.
- Validado por.
- Acción.

## 12.8 Vista Conciliación

Columnas:

- Fecha.
- Tipo conciliación.
- Origen.
- Valor origen.
- Destino.
- Valor destino.
- Diferencia.
- Estado.
- Acción.

---

# 13. Endpoints API recomendados

## 13.1 GET `/api/dashboard/summary`

Params:

```text
period
from
to
department
employee_id
service_turn
error_type
```

Response:

```json
{
  "turnos": {
    "total": 0,
    "horas": 0,
    "pendientes": 0,
    "correccion": 0,
    "validados": 0,
    "cerrados": 0
  },
  "incidencias": {
    "total": 0,
    "abiertas": 0,
    "cerradas": 0,
    "sla_ok": 0,
    "sla_warning": 0,
    "sla_critico": 0
  },
  "fio": {
    "total": 0,
    "baja": 0,
    "media": 0,
    "alta": 0,
    "critica": 0,
    "impacta_bonus": 0
  },
  "tareas": {
    "total": 0,
    "abiertas": 0,
    "vencidas": 0,
    "cerradas": 0
  },
  "cajas": {
    "pendientes": 0,
    "validadas": 0,
    "diferencia_total": 0
  }
}
```

## 13.2 GET `/api/dashboard/employees`

Devuelve ranking por empleado.

## 13.3 GET `/api/dashboard/incidencias`

Devuelve incidencias y SLA.

## 13.4 GET `/api/dashboard/fio`

Devuelve FIO por empleado/severidad.

## 13.5 GET `/api/dashboard/tareas`

Devuelve tareas abiertas/vencidas.

## 13.6 GET `/api/dashboard/cajas`

Devuelve cajas Sala/Recepción.

## 13.7 GET `/api/dashboard/conciliacion`

Devuelve conciliaciones.

## 13.8 GET `/api/dashboard/alerts`

Devuelve alertas activas.

## 13.9 GET `/api/dashboard/alerts/history`

Devuelve histórico de alertas.

## 13.10 DELETE `/api/admin/entities/:entity/:id`

Solo Admin.

Reglas:

- popup obligatorio;
- audit log;
- recálculo dashboard;
- soft/hard según opción.

## 13.11 GET `/api/dashboard/cash/syncrolab`

Params:

```text
from
to
department=SYNCROLAB
employee_id
estado
```

Response esperado:

```json
{
  "total_cierres": 0,
  "pendientes": 0,
  "validados": 0,
  "en_correccion": 0,
  "cierres_con_diferencia": 0,
  "cierres_diferencia_sin_explicacion": 0,
  "efectivo_flyby_sistema": 0,
  "efectivo_training_real": 0,
  "diferencia_training": 0,
  "efectivo_nubimed_sistema": 0,
  "efectivo_clinica_real": 0,
  "diferencia_clinica": 0,
  "tpv_flyby": 0,
  "tpv_nubimed": 0,
  "total_tpv_sistema": 0,
  "tpv_total_real": 0,
  "diferencia_tpv": 0,
  "stripe_sistema_syncrolab": 0,
  "stripe_total_syncrolab": 0,
  "diferencia_stripe": 0,
  "cargo_mews_flyby": 0,
  "cargo_mews_nubimed": 0,
  "total_cargos_mews": 0,
  "total_diferencias": 0,
  "traspasos_mediodia": 0
}
```

## 13.12 GET `/api/dashboard/conciliation/syncrolab-recepcion`

Params:

```text
date
from
to
habitacion
estado
```

Response esperado:

```json
{
  "items": [
    {
      "fecha": "2026-05-04",
      "habitacion": "101",
      "syncrolab_total_cargos_mews": 100,
      "recepcion_syncrolab_room_charged": 100,
      "diferencia": 0,
      "estado": "OK"
    }
  ]
}
```

---

# 14. Realtime / WebSocket

## 14.1 Tablas a suscribir

- `shifts`
- `incidencias`
- `tareas`
- `merma`
- `sala_cash_closures`
- `recepcion_cash`
- `recepcion_ventas`
- `syncrolab_cash_closures` cuando exista
- `alert_logs`
- `fio_records` cuando exista
- `gestion_pendiente` cuando exista

## 14.2 Eventos

- insert;
- update;
- delete.

## 14.3 Regla

```text
Cualquier cambio recalcula widgets afectados.
```

No recalcular toda la pantalla si puede recalcularse bloque específico, pero si hay duda, recargar Dashboard.

---

# 15. Impacto de validación, corrección y eliminación

## 15.1 Validar turno

Afecta:

- turnos pendientes;
- turnos validados;
- alertas turno no validado;
- FIO si existe;
- ranking empleado;
- dashboard departamento.

## 15.2 Enviar a corrección

Afecta:

- estado;
- alertas;
- ranking;
- validación.

## 15.3 Eliminar turno

Debe eliminar o excluir:

- incidencias vinculadas;
- tareas vinculadas si aplica;
- mermas vinculadas;
- FIO;
- checklist;
- KPI vinculados;
- alertas.

Regla:

```text
No dejar datos huérfanos.
```

---

# 16. Migraciones SQL recomendadas para completar Dashboard

## 16.1 Foreign keys

```sql
alter table shifts
add constraint shifts_employee_id_fk
foreign key (employee_id) references employees(id);

alter table incidencias
add constraint incidencias_shift_id_fk
foreign key (shift_id) references shifts(id) on delete cascade;

alter table incidencias
add constraint incidencias_employee_id_fk
foreign key (employee_id) references employees(id);

alter table merma
add constraint merma_shift_id_fk
foreign key (shift_id) references shifts(id) on delete cascade;

alter table merma
add constraint merma_employee_id_fk
foreign key (employee_id) references employees(id);

alter table tareas
add constraint tareas_shift_id_fk
foreign key (shift_id) references shifts(id) on delete set null;

alter table recepcion_cash
add constraint recepcion_cash_shift_id_fk
foreign key (shift_id) references shifts(id) on delete set null;

alter table recepcion_ventas
add constraint recepcion_ventas_shift_id_fk
foreign key (shift_id) references shifts(id) on delete cascade;
```

## 16.2 Fechas normalizadas

```sql
alter table shifts add column if not exists fecha_date date;
alter table incidencias add column if not exists fecha_date date;
alter table merma add column if not exists fecha_date date;
alter table sala_cash_closures add column if not exists fecha_date date;
alter table recepcion_cash add column if not exists fecha_date date;
alter table recepcion_ventas add column if not exists fecha_date date;
alter table tareas add column if not exists deadline_date date;
```

## 16.3 Incidencias SLA

```sql
alter table incidencias add column if not exists closed_at timestamptz;
alter table incidencias add column if not exists resolved_at timestamptz;
```

## 16.4 Recepción conciliación

```sql
alter table recepcion_cash add column if not exists room_charge_recibido numeric default 0;
alter table recepcion_cash add column if not exists desayunos_consumidos numeric default 0;
alter table recepcion_cash add column if not exists media_pension_consumida numeric default 0;
alter table recepcion_cash add column if not exists pension_completa_consumida numeric default 0;
alter table recepcion_cash add column if not exists syncrolab_room_charged numeric default 0;
alter table recepcion_cash add column if not exists syncrolab_habitacion text;
```

## 16.5 Recepción ventas

```sql
alter table recepcion_ventas add column if not exists habitacion text;
```

## 16.6 Tabla syncrolab_cash_closures

```sql
create table if not exists syncrolab_cash_closures (
  id text primary key,
  shift_id text references shifts(id) on delete set null,

  fecha text not null,
  fecha_date date,
  turno text,

  responsable_id text references employees(id),
  responsable_nombre text,

  efectivo_flyby_sistema numeric default 0,
  efectivo_training_real numeric default 0,
  diferencia_training numeric default 0,
  cargo_mews_flyby numeric default 0,
  servicios_syncrolab_flyby text,

  efectivo_nubimed_sistema numeric default 0,
  efectivo_clinica_real numeric default 0,
  diferencia_clinica numeric default 0,
  cargo_mews_nubimed numeric default 0,
  servicios_syncrolab_nubimed text,

  tpv_flyby numeric default 0,
  tpv_nubimed numeric default 0,
  tpv_total_real numeric default 0,
  diferencia_tpv numeric default 0,

  stripe_sistema_syncrolab numeric default 0,
  stripe_total_syncrolab numeric default 0,
  diferencia_stripe numeric default 0,

  total_efectivo_sistema numeric default 0,
  total_efectivo_real numeric default 0,
  total_tpv_sistema numeric default 0,
  total_tpv_real numeric default 0,
  total_cargos_mews numeric default 0,
  total_diferencias numeric default 0,

  habitacion text,
  comentario_conciliacion text,

  traspaso_mediodia_si boolean default false,
  traspaso_entrega_empleado_id text references employees(id),
  traspaso_entrega_nombre text,
  traspaso_recibe_empleado_id text references employees(id),
  traspaso_recibe_nombre text,
  traspaso_flyby_training numeric default 0,
  traspaso_nubimed_clinica numeric default 0,
  traspaso_comentario text,
  traspaso_ts timestamptz,

  explicacion_diferencia text,
  accion_diferencia text,
  informado_responsable text,
  comentario text,

  estado text default 'Pendiente validación',
  validado_por text references employees(id),
  validado_ts timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

# 17. QA Checklist completo Dashboard

## 17.1 Filtros

- [ ] Periodo Hoy.
- [ ] Periodo Semana.
- [ ] Periodo Mes.
- [ ] Periodo Todo.
- [ ] Departamento Cocina.
- [ ] Departamento Sala.
- [ ] Departamento Recepción Hotel.
- [ ] Departamento F&B suma Cocina + Sala.
- [ ] Servicio/Turno correcto por departamento.
- [ ] Empleado filtra datos correctos.

## 17.2 Turnos

- [ ] Total turnos correcto.
- [ ] Pendientes correcto.
- [ ] En corrección correcto.
- [ ] Validados correcto.
- [ ] Horas correcto.

## 17.3 Incidencias

- [ ] Abiertas correcto.
- [ ] Cerradas correcto.
- [ ] SLA OK.
- [ ] SLA warning.
- [ ] SLA crítico.
- [ ] Incidencia cerrada elimina alerta activa.
- [ ] Historial alerta queda guardado.

## 17.4 FIO

- [ ] FIO total correcto.
- [ ] Severidad correcta.
- [ ] Impacta bonus mostrado como clasificación.
- [ ] No calcula dinero.
- [ ] FIO crítico alerta.
- [ ] FIO gestionado elimina alerta.

## 17.5 Tareas

- [ ] Abiertas correcto.
- [ ] Vencidas correcto.
- [ ] Cerradas correcto.
- [ ] Deadline texto no rompe UI.
- [ ] Deadline_date se usa cuando exista.

## 17.6 Mermas

- [ ] Merma Cocina aparece.
- [ ] Merma no aparece en Sala.
- [ ] Coste merma correcto.
- [ ] F&B suma merma Cocina.

## 17.7 Caja Sala

- [ ] Pendientes visibles.
- [ ] Validadas visibles.
- [ ] Diferencia caja correcta.
- [ ] Room charge suma correcta.
- [ ] Desayunos/pensiones suma correcta.

## 17.8 Caja Recepción

- [ ] Pendientes visibles.
- [ ] Validadas visibles.
- [ ] Cash/tarjeta/Stripe correcto.
- [ ] Diferencia total correcta.
- [ ] Datos para conciliación visibles.

## 17.9 Caja SYNCROLAB

### Estados

- [ ] Dashboard muestra total cierres SYNCROLAB.
- [ ] Dashboard muestra cierres pendientes.
- [ ] Dashboard muestra cierres validados.
- [ ] Dashboard muestra cierres en corrección.
- [ ] Dashboard excluye cierres eliminados de KPIs.

### FlyBy / Training

- [ ] Dashboard muestra efectivo FlyBy sistema.
- [ ] Dashboard muestra efectivo Training real.
- [ ] Dashboard calcula diferencia Training.
- [ ] Diferencia Training sin explicación genera alerta.

### Nubimed / Clínica

- [ ] Dashboard muestra efectivo Nubimed sistema.
- [ ] Dashboard muestra efectivo Clínica real.
- [ ] Dashboard calcula diferencia Clínica.
- [ ] Diferencia Clínica sin explicación genera alerta.

### TPV conjunto

- [ ] Dashboard muestra TPV FlyBy.
- [ ] Dashboard muestra TPV Nubimed.
- [ ] Dashboard calcula TPV esperado.
- [ ] Dashboard muestra TPV total real.
- [ ] Dashboard calcula diferencia TPV.
- [ ] Diferencia TPV sin explicación genera alerta.

### Stripe conjunto

- [ ] Dashboard muestra Stripe sistema si existe.
- [ ] Dashboard muestra Stripe total real.
- [ ] Dashboard calcula diferencia Stripe si hay fuente sistema.
- [ ] Si no hay fuente sistema, Stripe no genera error automático y marca [NO DATA].

### Cargos MEWS

- [ ] Dashboard muestra cargo MEWS FlyBy.
- [ ] Dashboard muestra cargo MEWS Nubimed.
- [ ] Dashboard calcula total cargos MEWS.
- [ ] Cargo MEWS sin habitación genera alerta.
- [ ] No exige número reserva MEWS a SYNCROLAB.

### Conciliación

- [ ] Conciliación usa fecha + habitación + importe.
- [ ] Conciliación no usa reserva MEWS como obligatorio en SYNCROLAB.
- [ ] Estado OK si coincide.
- [ ] Estado DIFERENCIA si importe no coincide.
- [ ] Estado SIN REGISTRO RECEPCIÓN si Recepción no confirma.
- [ ] Diferencia genera alerta.

### Traspaso mediodía

- [ ] Dashboard muestra traspasos mediodía.
- [ ] Traspaso incompleto genera alerta.
- [ ] Traspaso completo no genera alerta.

### Recalculo

- [ ] Crear Caja SYNCROLAB actualiza Dashboard.
- [ ] Editar Caja SYNCROLAB actualiza Dashboard.
- [ ] Validar Caja SYNCROLAB actualiza Dashboard.
- [ ] Eliminar Caja SYNCROLAB recalcula Dashboard.
- [ ] Alertas se resuelven al corregir.
- [ ] Histórico de alertas se conserva.

### UX Caja SYNCROLAB

- [ ] No aparecen null.
- [ ] No aparece undefined.
- [ ] No aparece NaN.
- [ ] No aparecen IDs técnicos.
- [ ] No aparece JSON crudo.
- [ ] SYNCROLAB y MEWS están escritos correctamente.

## 17.10 Conciliación Sala ↔ Recepción

- [ ] Room charge compara mismo día.
- [ ] Desayunos comparan mismo día.
- [ ] Media pensión compara mismo día.
- [ ] Pensión completa compara mismo día.
- [ ] OK cuando coincide.
- [ ] DIFERENCIA cuando no coincide.

## 17.11 Conciliación SYNCROLAB ↔ Recepción Hotel

- [ ] No usa reserva MEWS como obligatorio en SYNCROLAB.
- [ ] Match por fecha.
- [ ] Match por importe.
- [ ] Match por habitación.
- [ ] Estado OK si coincide.
- [ ] Estado DIFERENCIA si importe no coincide.
- [ ] Estado SIN REGISTRO RECEPCIÓN si Recepción no confirma.
- [ ] Si tabla SYNCROLAB no existe, muestra [NO DATA] / pendiente.

## 17.12 Eliminación

- [ ] Eliminar shift recalcula.
- [ ] Eliminar incidencia recalcula.
- [ ] Eliminar tarea recalcula.
- [ ] Eliminar caja recalcula.
- [ ] Delete definitivo solo Admin.
- [ ] Audit log creado.

## 17.13 UX

- [ ] No muestra arrays.
- [ ] No muestra null.
- [ ] No muestra undefined.
- [ ] No muestra NaN.
- [ ] No muestra IDs técnicos.
- [ ] Responsive OK.
- [ ] Mensajes usuario claros.

---

# 18. Riesgos críticos

- Fechas como texto → filtros incorrectos.
- Falta tabla gestiones → dashboard incompleto.
- FIO en shifts → difícil histórico avanzado.
- Recepción cash duplicada → doble conteo.
- Falta `closed_at` incidencias → SLA incompleto.
- Falta `room_charge_recibido` en recepción → conciliación incompleta.
- Tabla `syncrolab_cash_closures` no creada → Caja SYNCROLAB y conciliación no operativas.
- Falta FKs → datos huérfanos.
- RLS unrestricted → riesgo seguridad.
- Eliminar sin audit log → pérdida trazabilidad.
- Dashboard cacheado → KPIs falsos.
- Mezclar servicio/turno → filtros falsos.
- Mezclar gestión/tarea/incidencia → analítica inútil.

---

# 19. Prompt técnico para Codex / Claude Code

Contexto:
Estamos trabajando en SYNCROSFERA/SynchroShift. Dashboard debe ser módulo central operativo, con prioridad por empleado, segunda lectura por departamento, cálculo de KPI reales, alertas, conciliación Sala/Recepción/SYNCROLAB y recálculo en tiempo real. El modelo actual usa Supabase con tablas operativas: employees, shifts, incidencias, merma, tareas, sala_cash_closures, recepcion_cash, recepcion_ventas, audit_logs.

Problema:
El Dashboard actual está incompleto y necesita SQL real, joins correctos, reglas de conciliación, alertas históricas, endpoints API y migraciones seguras. Muchas fechas están como text, FIO está en shifts, gestiones no tienen tabla clara, y no hay foreign keys operativas.

Objetivo:
Implementar Dashboard Ultra Pro sin romper módulos existentes.

Requisitos funcionales:
1. Dashboard por empleado primero.
2. Dashboard por departamento segundo.
3. Filtros: periodo, departamento, servicio/turno, empleado, tipo FIO.
4. F&B = Sala + Cocina.
5. Turnos desde shifts.
6. Incidencias desde incidencias con SLA.
7. FIO desde shifts inicialmente.
8. Tareas desde tareas.
9. Mermas desde merma.
10. Caja Sala desde sala_cash_closures.
11. Caja Recepción desde recepcion_cash.
12. Ventas SYNCROLAB Recepción desde recepcion_ventas.
13. Conciliación Sala/Recepción por mismo día.
14. Conciliación SYNCROLAB/Recepción preparada por fecha, importe, tipo servicio y habitación.
15. Alertas activas + histórico.
16. WebSocket realtime + botón actualizar.
17. Eliminación recalcula dashboard.

Requisitos SQL:
- Usar joins documentados.
- No usar tablas de cursos.
- No usar tablas legacy sin confirmar.
- No contar recepcion_cash y recepcion_cash_closures duplicadas.
- Crear migraciones para fechas normalizadas, closed_at, alert_logs, gestion_pendiente, fio_records.

Reglas de datos:
- No mostrar arrays.
- No mostrar JSON crudo.
- No mostrar null/undefined/NaN.
- No inventar datos.
- Si falta fuente, mostrar “Sin datos en el periodo” o [NO DATA] en documentación.

Reglas de permisos:
- Admin ve todo.
- Jefe/validador ve su departamento.
- Usuario lineal no ve dashboard admin.
- Delete definitivo solo Admin.

Criterios de aceptación:
- KPIs coinciden con DB.
- Filtros funcionan.
- F&B suma Sala+Cocina.
- Servicio/Turno correcto.
- FIO correcto.
- Conciliación visible.
- Alertas aparecen y desaparecen al resolver.
- Histórico alerta se guarda.
- Eliminación recalcula.
- No rompe Cocina/Sala/Recepción/Validación.

Pruebas obligatorias:
1. Crear turno Cocina.
2. Crear turno Sala.
3. Crear turno Recepción.
4. Crear incidencia.
5. Cerrar incidencia.
6. Crear FIO.
7. Crear tarea.
8. Crear merma.
9. Crear caja Sala.
10. Crear caja Recepción.
11. Crear venta SYNCROLAB Recepción.
12. Ver dashboard por empleado.
13. Ver dashboard por departamento.
14. Ver F&B.
15. Ver conciliación.
16. Eliminar registro.
17. Confirmar recálculo.
18. Confirmar permisos.
19. Confirmar responsive.
20. Confirmar sin errores técnicos.

No romper:
- login PIN;
- Mi turno;
- Validación;
- Caja Sala;
- Caja Recepción;
- módulos existentes;
- datos actuales.

Salida esperada:
- SQL migrations.
- Backend/API.
- Frontend dashboard.
- Lista de archivos modificados.
- Checklist QA ejecutado.
