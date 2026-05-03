# 07_QA_ULTRA_PRO_DASHBOARD_LEVEL.md — SYNCROSFERA / SynchroShift

Versión: ULTRA PRO — NIVEL DASHBOARD / PRODUCCIÓN  
Regla: FULL PRO SIN RECORTAR.  
No resumir. No simplificar. No eliminar checklist, campos, reglas, QA, prompts, riesgos ni detalles operativos.  
Si falta información: `[NO DATA]`.

---

# 0. OBJETIVO DEL DOCUMENTO

Este archivo define QA completo para llevar SYNCROSFERA/SynchroShift a nivel producción real.

Debe validar:

- lógica funcional;
- datos en Supabase;
- SQL de KPI;
- dashboard;
- validación;
- permisos;
- cajas;
- conciliaciones;
- alertas;
- migraciones;
- realtime;
- eliminación;
- logs;
- UX/UI;
- integridad entre módulos.

El QA no se considera aprobado solo porque la UI “parece funcionar”.

Regla principal:

```text
UI correcta + DB correcta + Dashboard correcto + permisos correctos = QA aprobado
```

---

# 1. PRINCIPIOS QA OBLIGATORIOS

1. No confiar solo en frontend.
2. No confiar solo en dashboard.
3. Validar contra base de datos.
4. Validar permisos con usuario Admin y usuario no admin.
5. Validar dashboard con SQL.
6. Validar que las eliminaciones recalculan KPIs.
7. Validar que las alertas desaparecen al resolverse pero quedan en histórico.
8. Validar que no hay datos técnicos visibles.
9. Validar responsive.
10. Validar que no se rompen módulos existentes.

---

# 2. FORMATO ESTÁNDAR DE CADA CASO QA

Cada caso debe documentarse así:

```text
Caso:
Módulo:
Prioridad:
Precondición:
Pasos:
Resultado esperado UI:
Resultado esperado DB:
SQL verificación:
Riesgo si falla:
Estado:
Notas:
```

Prioridades:

```text
P0 = bloquea producción
P1 = crítico operativo
P2 = importante
P3 = mejora
```

---

# 3. BLOQUEO DE PRODUCCIÓN — NO PASA A PRODUCCIÓN SI

La plataforma NO puede pasar a producción si ocurre cualquiera de estos puntos:

## 3.1 Datos

- [ ] Se guardan datos y al recargar desaparecen.
- [ ] Dashboard muestra datos que no existen en DB.
- [ ] Dashboard no recalcula tras eliminación.
- [ ] Hay registros huérfanos sin `shift_id` o `employee_id` cuando son obligatorios.
- [ ] Cajas con diferencia se validan sin explicación.
- [ ] Incidencias cerradas no tienen fecha cierre/resolución.
- [ ] Tareas vencidas no aparecen como vencidas.
- [ ] FIO creado por usuario lineal.

## 3.2 Permisos

- [ ] Usuario lineal accede a Validación.
- [ ] Usuario lineal valida.
- [ ] Usuario lineal elimina.
- [ ] Usuario lineal crea FIO.
- [ ] Validador ve departamentos no permitidos.
- [ ] Admin no puede validar.

## 3.3 UI/UX

- [ ] Aparecen `null`, `undefined`, `NaN`.
- [ ] Aparecen arrays crudos.
- [ ] Aparece JSON técnico.
- [ ] Aparecen IDs internos al usuario.
- [ ] Aparece “MUSE” en vez de MEWS.
- [ ] SYNCROSFERA, SYNCROLAB, POSMEWS, MEWS están mal escritos.

## 3.4 Dashboard

- [ ] F&B no suma Cocina + Sala.
- [ ] Servicio/Turno mezclado incorrectamente.
- [ ] Caja Sala y Caja Recepción se duplican.
- [ ] Caja SYNCROLAB no aparece si se crea cierre.
- [ ] Conciliaciones no detectan diferencias.
- [ ] Alertas no desaparecen al resolver.
- [ ] Alertas desaparecen sin histórico.

---

# 4. QA GLOBAL END-TO-END OBLIGATORIO

## Caso E2E-001 — Flujo completo Admin + Usuario

Prioridad: P0

Precondición:

- Existe Admin.
- Existe usuario Cocina.
- Existe usuario Sala.
- Existe usuario Recepción Hotel.
- Existe usuario SYNCROLAB.
- Existen datos de departamentos.

Pasos:

1. Login Admin.
2. Confirmar menú Admin:
   - Dashboard.
   - Validación.
   - Incidencias.
   - Gestiones pendientes.
   - Tareas.
   - Maestro.
   - Export.
3. Logout Admin.
4. Login usuario Cocina.
5. Crear turno Cocina.
6. Crear incidencia Cocina.
7. Crear merma Cocina.
8. Guardar turno.
9. Confirmar logout automático.
10. Login Admin.
11. Validar turno Cocina.
12. Revisar dashboard Cocina.
13. Login usuario Sala.
14. Crear turno Sala.
15. Registrar ajuste si aplica.
16. Registrar cierre de caja Sala.
17. Guardar turno.
18. Confirmar logout automático.
19. Login Admin.
20. Validar turno Sala y Caja Sala.
21. Revisar Dashboard Sala/F&B.
22. Login usuario Recepción Hotel.
23. Crear turno Recepción Hotel.
24. Registrar KPI.
25. Registrar Caja Recepción.
26. Guardar turno.
27. Confirmar logout automático.
28. Login Admin.
29. Validar turno Recepción y Caja.
30. Revisar Dashboard Recepción.
31. Login usuario SYNCROLAB.
32. Crear turno SYNCROLAB.
33. Registrar Caja SYNCROLAB.
34. Guardar.
35. Confirmar logout.
36. Login Admin.
37. Validar Caja SYNCROLAB.
38. Revisar Dashboard y conciliación.

Resultado esperado:

- Todos los registros guardan.
- Todos recargan.
- Todos aparecen en Dashboard.
- Validación funciona.
- No hay errores técnicos.
- Logout automático funciona.

SQL verificación general:

```sql
select count(*) from shifts;
select count(*) from incidencias;
select count(*) from merma;
select count(*) from tareas;
select count(*) from sala_cash_closures;
select count(*) from recepcion_cash;
select count(*) from syncrolab_cash_closures;
```

Riesgo si falla:

```text
La plataforma no es operativa en producción.
```

---

# 5. QA LOGIN / AUTH / SESIÓN

## Caso AUTH-001 — Login por PIN

Prioridad: P0

Pasos:

1. Acceder pantalla login.
2. Introducir PIN válido.
3. Confirmar acceso al departamento correcto.
4. Confirmar nombre usuario.
5. Confirmar rol.

Resultado esperado DB:

```sql
select id, nombre, area, rol, estado
from employees
where pin = :pin;
```

Debe devolver empleado activo.

Riesgos:

- acceso a departamento incorrecto;
- usuario ve módulo incorrecto;
- permisos erróneos.

## Caso AUTH-002 — Logout tras guardar turno

Prioridad: P0

Regla:

```text
Guardar turno → logout automático obligatorio en todos los departamentos.
```

Aplica:

- Cocina.
- Sala.
- Recepción Hotel.
- SYNCROLAB.
- futuros departamentos.

Pasos:

1. Login usuario.
2. Crear turno.
3. Guardar.
4. Confirmar logout.
5. Intentar volver atrás navegador.

Resultado esperado:

- vuelve a login;
- no vuelve al formulario lleno;
- formulario nuevo vacío si entra otra vez.

---

# 6. QA CORE TURNOS

## Caso CORE-001 — Máximo 2 turnos por usuario/día

Prioridad: P0

Regla:

```text
Máximo 2 turnos por usuario por día.
```

SQL:

```sql
select count(*)
from shifts
where employee_id = :employee_id
  and fecha = :today;
```

Pasos:

1. Crear primer turno.
2. Crear segundo turno.
3. Intentar crear tercero.

Resultado esperado:

- primero permitido;
- segundo permitido con aviso;
- tercero bloqueado.

Mensaje:

```text
Ya has registrado el máximo de turnos permitidos hoy (2).
```

## Caso CORE-002 — Formulario vacío después de guardar

Prioridad: P0

Pasos:

1. Crear turno con horas = 6.
2. Guardar.
3. Logout.
4. Login otra vez.
5. Abrir Mi turno.

Resultado esperado:

- horas vacías;
- observación vacía;
- gestión vacía;
- incidencia vacía;
- datos anteriores solo en “Mis últimos turnos”.

---

# 7. QA COCINA

## Caso COC-001 — Turno Cocina completo

Prioridad: P0

Campos:

- fecha;
- servicio;
- responsable;
- horas;
- observación;
- gestión pendiente;
- incidencia;
- merma;
- tarea.

Pasos:

1. Login usuario Cocina.
2. Abrir Mi turno.
3. Seleccionar servicio.
4. Introducir horas.
5. Añadir observación.
6. Añadir gestión pendiente.
7. Añadir incidencia.
8. Añadir merma.
9. Crear tarea.
10. Guardar.

Resultado esperado DB:

```sql
select *
from shifts
where employee_id = :employee_id
order by created_at desc
limit 1;
```

Debe existir turno.

Merma:

```sql
select *
from merma
where shift_id = :shift_id;
```

Incidencia:

```sql
select *
from incidencias
where shift_id = :shift_id;
```

Riesgo:

- Cocina pierde control APPCC/mermas.

## Caso COC-002 — Merma solo Cocina

Prioridad: P1

Pasos:

1. Login Sala.
2. Verificar que no aparece Merma.
3. Login Recepción Hotel.
4. Verificar que no aparece Merma.

Resultado esperado:

- merma solo Cocina.

---

# 8. QA SALA

## Caso SALA-001 — Turno Sala completo

Prioridad: P0

Campos:

- fecha;
- servicio;
- horas;
- responsable turno;
- observación;
- gestiones;
- incidencias;
- ajustes;
- caja si decide cerrarla.

SQL:

```sql
select *
from shifts
where area = 'Sala'
order by created_at desc
limit 1;
```

## Caso SALA-002 — Cierre Caja Sala

Prioridad: P0

Campos críticos:

- efectivo_posmews;
- efectivo_real;
- diferencia_efectivo;
- tarjeta_posmews;
- tarjeta_tpv;
- diferencia_tarjeta;
- stripe_posmews;
- stripe_real;
- diferencia_stripe;
- room_charge;
- pensiones;
- total_bruto;
- diferencia_caja;
- comentario.

Regla:

```text
diferencia = real - sistema
```

SQL verificación:

```sql
select
  efectivo_real - efectivo_posmews as calc_dif_efectivo,
  diferencia_efectivo,
  tarjeta_tpv - tarjeta_posmews as calc_dif_tarjeta,
  diferencia_tarjeta,
  stripe_real - stripe_posmews as calc_dif_stripe,
  diferencia_stripe
from sala_cash_closures
where id = :cash_id;
```

Resultado esperado:

- cálculo DB coincide con campos guardados.

Bloqueo:

```text
Si diferencia != 0 y comentario vacío → no validar.
```

---

# 9. QA RECEPCIÓN HOTEL

## Caso REC-001 — Turno Recepción Hotel completo

Prioridad: P0

Campos core:

- fecha;
- turno mañana/tarde/noche;
- horas;
- observación;
- gestión;
- incidencia.

KPI:

- check-ins;
- check-outs;
- reservas gestionadas;
- reservas pendientes;
- desayunos ofrecidos;
- desayunos vendidos;
- ventas SYNCROLAB;
- leads Bitrix;
- clientes insatisfechos.

Campos reales KPI en DB:

```text
[NO DATA] schema completo rec_shift_data
```

Regla QA:

- si no existe tabla/campos, marcar como pendiente técnico;
- no inventar datos.

## Caso REC-002 — Cliente insatisfecho no informado

Prioridad: P0

Regla confirmada:

```text
Cliente insatisfecho y NO informado → FIO automático / obligatorio.
```

Pasos:

1. Crear turno Recepción.
2. Indicar cliente insatisfecho = Sí.
3. Informado responsable = No.
4. Guardar.
5. Validación.

Resultado esperado:

- Validación exige FIO.
- Usuario lineal no puede crear FIO.
- Admin/validador crea FIO.

## Caso REC-003 — Venta SYNCROLAB sin reserva MEWS

Prioridad: P0

Regla:

```text
Venta SYNCROLAB sin Nº reserva MEWS = error grave y posible FIO.
```

SQL:

```sql
select *
from recepcion_ventas
where reserva_mews is null or reserva_mews = '';
```

Resultado esperado:

- no se valida sin corrección o FIO.

---

# 10. QA CAJA RECEPCIÓN HOTEL

## Caso CASH-REC-001 — Diferencias caja Recepción

Prioridad: P0

Campos:

- cash_mews;
- cash_real;
- dif_cash;
- tarjeta_mews;
- tpv_real;
- dif_tarjeta;
- stripe_mews;
- stripe_real;
- dif_stripe;
- dif_total.

SQL:

```sql
select
  cash_real - cash_mews as calc_dif_cash,
  dif_cash,
  tpv_real - tarjeta_mews as calc_dif_tarjeta,
  dif_tarjeta,
  stripe_real - stripe_mews as calc_dif_stripe,
  dif_stripe,
  (cash_real - cash_mews) + (tpv_real - tarjeta_mews) + (stripe_real - stripe_mews) as calc_dif_total,
  dif_total
from recepcion_cash
where id = :cash_id;
```

Resultado esperado:

- diferencias calculadas correctamente.
- si dif_total != 0, explicación obligatoria.

---

# 11. QA SYNCROLAB

## Caso SYN-001 — Caja SYNCROLAB completa

Prioridad: P0

Campos:

- efectivo_flyby_sistema;
- efectivo_training_real;
- diferencia_training;
- efectivo_nubimed_sistema;
- efectivo_clinica_real;
- diferencia_clinica;
- tpv_flyby;
- tpv_nubimed;
- tpv_total_real;
- diferencia_tpv;
- stripe_sistema_syncrolab;
- stripe_total_syncrolab;
- diferencia_stripe;
- cargo_mews_flyby;
- cargo_mews_nubimed;
- total_cargos_mews;
- habitación;
- traspaso mediodía.

SQL:

```sql
select
  efectivo_training_real - efectivo_flyby_sistema as calc_dif_training,
  diferencia_training,
  efectivo_clinica_real - efectivo_nubimed_sistema as calc_dif_clinica,
  diferencia_clinica,
  tpv_total_real - (tpv_flyby + tpv_nubimed) as calc_dif_tpv,
  diferencia_tpv,
  stripe_total_syncrolab - stripe_sistema_syncrolab as calc_dif_stripe,
  diferencia_stripe,
  cargo_mews_flyby + cargo_mews_nubimed as calc_total_cargos_mews,
  total_cargos_mews
from syncrolab_cash_closures
where id = :cash_id;
```

Resultado esperado:

- todos los cálculos coinciden.

## Caso SYN-002 — Cargo MEWS sin habitación

Prioridad: P0

Regla:

```text
Si cargo_mews_flyby > 0 o cargo_mews_nubimed > 0 → habitación obligatoria.
```

SQL:

```sql
select *
from syncrolab_cash_closures
where (cargo_mews_flyby > 0 or cargo_mews_nubimed > 0)
  and (habitacion is null or trim(habitacion) = '');
```

Resultado esperado:

- query devuelve 0 registros válidos en producción.

## Caso SYN-003 — Traspaso mediodía incompleto

Prioridad: P1

SQL:

```sql
select *
from syncrolab_cash_closures
where traspaso_mediodia_si = true
  and (
    traspaso_entrega_empleado_id is null
    or traspaso_recibe_empleado_id is null
  );
```

Resultado esperado:

- no debe haber registros incompletos.

---

# 12. QA VALIDACIÓN

## Caso VAL-001 — Validación Follow-up

Prioridad: P0

Debe mostrar:

- empleado;
- departamento;
- fecha;
- servicio/turno;
- estado;
- checklist;
- gestiones;
- incidencias;
- tareas;
- módulo específico.

Resultado esperado:

- Cocina muestra mermas.
- Sala muestra ajustes/caja.
- Recepción muestra KPI/caja.
- SYNCROLAB muestra caja si aplica.

## Caso VAL-002 — FIO

Prioridad: P0

Reglas:

- FIO solo admin/validador/jefe.
- Usuario lineal nunca.
- Si FIO = Sí → campos obligatorios.
- Si FIO = No → campos bloqueados.

SQL actual:

```sql
select *
from shifts
where fio = true
  and (
    gravedad_error is null
    or tipo_error is null
  );
```

Resultado esperado:

- 0 registros incompletos.

---

# 13. QA DASHBOARD — SQL REAL

## Caso DASH-001 — Turnos por empleado

Prioridad: P0

SQL:

```sql
select
  e.id,
  e.nombre,
  count(s.id) as total_turnos,
  coalesce(sum(s.horas),0) as horas
from shifts s
left join employees e on e.id = s.employee_id
where s.created_at >= :from_ts
  and s.created_at < :to_ts
group by e.id, e.nombre;
```

Resultado esperado:

- UI Dashboard coincide con SQL.

## Caso DASH-002 — F&B

Prioridad: P0

Regla:

```text
F&B = Cocina + Sala
```

SQL:

```sql
select count(*)
from shifts
where area in ('Cocina','Sala')
  and created_at >= :from_ts
  and created_at < :to_ts;
```

Resultado esperado:

- Dashboard F&B = suma Cocina + Sala.

## Caso DASH-003 — FIO

SQL:

```sql
select
  count(*) filter (where fio = true) as fio_total,
  count(*) filter (where fio = true and gravedad_error = 'Crítica') as fio_critico
from shifts
where created_at >= :from_ts
  and created_at < :to_ts;
```

Resultado esperado:

- Dashboard muestra cantidad y severidad.

## Caso DASH-004 — Cajas

Debe comparar UI con SQL por:

- Caja Sala.
- Caja Recepción.
- Caja SYNCROLAB.

---

# 14. QA CONCILIACIONES

## Caso CON-001 — Sala ↔ Recepción

Prioridad: P0

Room charge:

```sql
select
  sc.fecha,
  sum(sc.room_charge) as sala_room_charge,
  sum(rc.room_charge_recibido) as recepcion_room_charge
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

Resultado esperado:

- diferencia detectada si importes no coinciden.

## Caso CON-002 — SYNCROLAB ↔ Recepción

Prioridad: P0

SQL:

```sql
select
  sc.fecha,
  sc.habitacion,
  sc.total_cargos_mews,
  rc.syncrolab_room_charged
from syncrolab_cash_closures sc
left join recepcion_cash rc
  on rc.fecha = sc.fecha
 and rc.syncrolab_habitacion = sc.habitacion
 and rc.syncrolab_room_charged = sc.total_cargos_mews
where sc.fecha = :business_date;
```

Resultado esperado:

- OK si coincide.
- Diferencia si no coincide.
- Sin registro recepción si falta.

---

# 15. QA ALERTAS

## Caso ALERT-001 — Alerta activa aparece

Crear:

- incidencia abierta >24h;
- caja con diferencia sin explicación;
- FIO crítico;
- caja pendiente.

Resultado esperado:

- aparece alerta.

## Caso ALERT-002 — Alerta se resuelve

Resolver:

- cerrar incidencia;
- explicar diferencia;
- validar caja;
- gestionar FIO.

Resultado esperado:

- alerta desaparece de activas;
- queda en histórico.

SQL:

```sql
select *
from alert_logs
where status = 'Activa';

select *
from alert_logs
where status = 'Resuelta';
```

---

# 16. QA ELIMINACIÓN / RECÁLCULO

## Caso DEL-001 — Eliminar turno

Prioridad: P0

Pasos:

1. Crear turno.
2. Ver Dashboard.
3. Eliminar turno Admin.
4. Ver Dashboard.

Resultado esperado:

- turno desaparece de KPIs;
- registros vinculados tratados según regla;
- audit log existe.

SQL:

```sql
select *
from audit_logs
where action ilike '%delete%'
order by created_at desc;
```

## Caso DEL-002 — Eliminar caja

Aplicar a:

- sala_cash_closures;
- recepcion_cash;
- syncrolab_cash_closures.

Resultado esperado:

- dashboard recalcula.
- conciliación recalcula.
- alerta relacionada se resuelve o desaparece.

---

# 17. QA MIGRACIONES SUPABASE

## 17.1 Foreign keys

Validar que existen o documentar pendiente:

```sql
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table,
  ccu.column_name as foreign_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public';
```

## 17.2 Fechas normalizadas

Verificar columnas:

```sql
select table_name, column_name
from information_schema.columns
where column_name in ('fecha_date','deadline_date','closed_at','resolved_at');
```

## 17.3 Tablas nuevas

Verificar:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'alert_logs',
    'fio_records',
    'gestion_pendiente',
    'syncrolab_cash_closures'
  );
```

---

# 18. QA PERMISOS / RLS

Validar:

- Admin ve todo.
- Validador ve su departamento.
- Usuario lineal solo su operación.
- Usuario lineal no valida.
- Usuario lineal no elimina.
- Usuario lineal no crea FIO.

Riesgo:

```text
Si RLS está unrestricted en producción, riesgo crítico.
```

---

# 19. QA REALTIME / WEBSOCKET

Casos:

- crear turno → dashboard actualiza;
- crear caja → dashboard actualiza;
- validar → estado cambia;
- eliminar → KPI recalcula;
- si WebSocket falla → botón Actualizar funciona.

No debe ocurrir:

- duplicar filas;
- duplicar alertas;
- mostrar datos obsoletos.

---

# 20. QA UX/UI

Validar en:

- desktop;
- tablet;
- móvil.

Checklist:

- [ ] no hay botones duplicados;
- [ ] formularios claros;
- [ ] errores entendibles;
- [ ] calendarios funcionan;
- [ ] selects muestran valores correctos;
- [ ] no aparecen arrays;
- [ ] no aparece JSON;
- [ ] no aparece null;
- [ ] no aparece undefined;
- [ ] no aparece NaN;
- [ ] no aparecen IDs técnicos;
- [ ] no aparece MUSE.

---

# 21. QA PERFORMANCE

Dashboard:

- carga inicial aceptable `[NO DATA objetivo ms]`;
- filtros no bloquean UI;
- SQL no hace full scan innecesario;
- tablas grandes deben tener índices.

Índices recomendados:

```sql
create index if not exists idx_shifts_employee_created on shifts(employee_id, created_at);
create index if not exists idx_shifts_area_created on shifts(area, created_at);
create index if not exists idx_incidencias_shift on incidencias(shift_id);
create index if not exists idx_incidencias_employee_created on incidencias(employee_id, created_at);
create index if not exists idx_tareas_shift on tareas(shift_id);
create index if not exists idx_sala_cash_fecha on sala_cash_closures(fecha);
create index if not exists idx_recepcion_cash_fecha on recepcion_cash(fecha);
create index if not exists idx_syncrolab_cash_fecha on syncrolab_cash_closures(fecha);
```

---

# 22. QA EDGE CASES

- Turno sin employee_id.
- Turno sin fecha.
- Incidencia sin shift_id.
- Tarea sin deadline.
- Caja con diferencia sin explicación.
- Caja con estado inválido.
- Caja SYNCROLAB con cargo MEWS sin habitación.
- Cliente insatisfecho no informado.
- Venta Recepción sin reserva MEWS.
- Dos turnos mismo usuario.
- Tercer turno mismo día.
- Dashboard con periodo vacío.
- F&B sin registros.
- Conciliación sin datos de recepción.
- WebSocket desconectado.

---

# 23. PROMPT TÉCNICO QA PARA CODEX / CLAUDE CODE

Contexto:
SYNCROSFERA/SynchroShift tiene módulos de turnos, Cocina, Sala, Recepción Hotel, SYNCROLAB, cajas, validación, dashboard y conciliaciones. Se necesita QA Ultra Pro nivel producción, validando UI, DB, SQL, permisos, alertas, realtime y dashboard.

Objetivo:
Ejecutar QA completo, detectar fallos, proponer correcciones y verificar que Dashboard coincide con Supabase.

Requisitos:
1. Probar login Admin y usuario lineal.
2. Probar cada módulo.
3. Verificar persistencia en DB.
4. Verificar SQL contra Dashboard.
5. Verificar permisos.
6. Verificar cajas.
7. Verificar conciliaciones.
8. Verificar alertas.
9. Verificar eliminación y recálculo.
10. Verificar responsive.
11. No aceptar UI correcta si DB está incorrecta.
12. No aceptar Dashboard correcto si SQL no coincide.

Salida esperada:
- Lista de tests ejecutados.
- Fallos encontrados.
- Severidad.
- Evidencia.
- SQL usado.
- Archivos/componente afectado.
- Recomendación técnica.
- Checklist final.
