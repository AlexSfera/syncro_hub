# 06b_DATA_MODEL_SQL.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRODUCCIÓN — SQL de migración, queries y endpoints
Estado: preparado para backend, Supabase, dashboard, QA.
Base real analizada: tablas actuales de Supabase aportadas por Alexander.

> Este archivo proviene de la división de `06_DATA_MODEL.md`.
> No elimina reglas originales.
> Si falta información: `[NO DATA]`.

---

## Índice

1. [SQL por tabla — migraciones y foreign keys](#1-sql-por-tabla--migraciones-y-foreign-keys)
2. [SQL tablas nuevas — CREATE TABLE](#2-sql-tablas-nuevas--create-table)
3. [Joins SQL para dashboard](#3-joins-sql-para-dashboard)
4. [SQL de conciliaciones](#4-sql-de-conciliaciones)
5. [SQL de departamento Restaurante / F&B](#5-sql-de-departamento-restaurante--fb)
6. [Endpoints API recomendados](#6-endpoints-api-recomendados)
7. [SQL de auditoría — soft delete y hard delete](#7-sql-de-auditoría--soft-delete-y-hard-delete)
8. [Checklist QA obligatorio](#8-checklist-qa-obligatorio)
9. [Prompt técnico para Codex / Claude Code](#9-prompt-técnico-para-codex--claude-code)

> Para schema de tablas, campos, relaciones lógicas, reglas, problemas estructurales y modelo conceptual:
> → abrir `06a_DATA_MODEL_SCHEMA.md`

---

# 1. SQL por tabla — migraciones y foreign keys

> Estos bloques SQL corresponden a las tablas documentadas en `06a_DATA_MODEL_SCHEMA.md` Sección 4.
> No ejecutar sin backup.

## 1.1 `employees` — migración recomendada

```sql
alter table employees add column if not exists department_id uuid;

alter table employees
add constraint employees_department_id_fk
foreign key (department_id)
references departments(id);
```

Backfill posterior según `employees.area`.

---

## 1.2 `shifts` — foreign keys recomendadas

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

---

## 1.3 `incidencias` — foreign keys y migraciones recomendadas

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

Columnas adicionales recomendadas:

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

## 1.4 `merma` — foreign keys recomendadas

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

---

## 1.5 `tareas` — foreign keys y migraciones recomendadas

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

Columnas adicionales recomendadas:

```sql
alter table tareas add column if not exists responsable_id text references employees(id);
alter table tareas add column if not exists deadline_date date;
```

---

## 1.6 `sala_cash_closures` — migración recomendada

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

---

## 1.7 `recepcion_cash` — foreign keys recomendadas

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

---

## 1.8 `recepcion_cash_closures` — verificación antes de acción

```sql
-- No ejecutar sin backup
-- Crear vista temporal para comparar registros
select count(*) from recepcion_cash;
select count(*) from recepcion_cash_closures;
```

---

## 1.9 `recepcion_ventas` — foreign keys recomendadas

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

---

# 2. SQL tablas nuevas — CREATE TABLE

> Estos bloques corresponden a las tablas documentadas en `06a_DATA_MODEL_SCHEMA.md` Sección 5.
> No ejecutar sin backup.

## 2.1 `gestion_pendiente`

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

---

## 2.2 `fio_records`

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

---

## 2.3 `alert_logs`

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

---

## 2.4 `conciliation_records`

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

---

## 2.5 `syncrolab_charges`

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

---

# 3. Joins SQL para dashboard

## 3.1 Turnos por empleado

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

## 3.2 Incidencias por empleado y periodo

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

## 3.3 Tiempo medio de resolución de incidencias

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

## 3.4 Mermas Cocina

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

## 3.5 Tareas abiertas / vencidas

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

## 3.6 FIO actual desde `shifts`

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

## 3.7 Checklist completado

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

# 4. SQL de conciliaciones

## 4.1 Sala Room Charge vs Recepción Hotel

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

## 4.2 Sala desayunos / pensiones vs Recepción Hotel

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

## 4.3 SYNCROLAB talonario vs Recepción Hotel

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

Ver CREATE TABLE syncrolab_charges → Sección 2.5 de este archivo.

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

# 5. SQL de departamento Restaurante / F&B

```sql
-- Restaurante / F&B
where s.area in ('Cocina', 'Sala')
```

---

# 6. Endpoints API recomendados

## 6.1 Dashboard summary

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

## 6.2 Dashboard employees

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

## 6.3 Dashboard incidencias

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

## 6.4 Dashboard FIO

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

## 6.5 Dashboard conciliación

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

## 6.6 Admin delete definitivo

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

# 7. SQL de auditoría — soft delete y hard delete

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

SQL de auditoría:

```sql
insert into audit_logs (user_id, action, entity, entity_id, metadata)
values (:admin_user_id, 'hard_delete', :entity, :entity_id, :metadata);
```

---

# 8. Checklist QA obligatorio

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

# 9. Prompt técnico para Codex / Claude Code

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
