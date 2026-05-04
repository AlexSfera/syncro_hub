# 04_DASHBOARD_CONTROL.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRODUCCIÓN — CONCILIACIONES / ALERTAS / API / QA / RIESGOS / PROMPTS
Parte de: `04_MODULE_DASHBOARD.md` (índice) — ver también `04_DASHBOARD_DATOS.md`
Regla: FULL PRO SIN RECORTAR. No resumir. No simplificar.

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
