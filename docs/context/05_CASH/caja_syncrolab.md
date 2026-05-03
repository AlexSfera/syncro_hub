# 05_CASH/caja_syncrolab_FULL_PRO.md — SYNCROSFERA / SynchroShift

Versión: FULL PRO SIN RECORTAR  
Módulo: Caja SYNCROLAB  
Estado: listo para desarrollo, validación, dashboard y QA.

---

# 0. REGLA DEL DOCUMENTO

Este archivo define la **Caja SYNCROLAB** completa.

No es resumen.

Incluye:

- lógica operativa;
- lógica de cálculo;
- campos sistema vs real;
- fórmulas;
- reglas de validación;
- SQL recomendado;
- dashboard;
- conciliación;
- permisos;
- QA;
- riesgos;
- prompt técnico.

Si falta información:

```text
[NO DATA]
```

---

# 1. NOMBRE OFICIAL DEL MÓDULO

Nombre correcto:

```text
Caja SYNCROLAB
```

No usar:

```text
Caja SincroLab
Caja SincloLab
Caja Syncrolab
Caja SíncroLab
```

En todo el sistema escribir siempre:

```text
SYNCROLAB
MEWS
FlyBy
Nubimed
```

---

# 2. OBJETIVO

Caja SYNCROLAB controla el cierre económico del departamento SYNCROLAB.

SYNCROLAB trabaja con:

1. Una caja registradora vinculada a FlyBy / Training.
2. Una caja registradora vinculada a Nubimed / Clínica.
3. Un TPV conjunto.
4. Stripe conjunto.
5. Cargos a MEWS generados desde FlyBy.
6. Cargos a MEWS generados desde Nubimed.
7. Conciliación posterior con Recepción Hotel.
8. Traspaso de caja a mediodía.
9. Validación por Admin o Jefe Recepción SYNCROLAB.
10. Dashboard operativo y financiero.

---

# 3. PRINCIPIO CRÍTICO DE CÁLCULO

Todas las cajas de SYNCROSFERA deben usar la misma lógica:

```text
Sistema / esperado
vs
Real / contado / cobrado
=
Diferencia
```

Fórmula universal:

```text
diferencia = real - sistema
```

Esta lógica aplica a:

- Caja Sala;
- Caja Recepción Hotel;
- Caja SYNCROLAB.

Regla crítica:

```text
No se puede guardar/validar una caja con diferencia sin explicación.
```

---

# 4. ALCANCE

## 4.1 Incluido

- Cierre de caja por turno.
- Pregunta: “¿Quieres cerrar caja?”
- Registro de caja FlyBy / Training.
- Registro de caja Nubimed / Clínica.
- Registro TPV conjunto.
- Registro Stripe conjunto.
- Control de diferencias.
- Comentario/explicación obligatoria.
- Traspaso mediodía.
- Cargos a MEWS desde FlyBy.
- Cargos a MEWS desde Nubimed.
- Habitación obligatoria para cargos a MEWS.
- Conciliación con Recepción Hotel.
- Estado pendiente/validado/corrección.
- Dashboard.
- Alertas.
- Eliminación Admin con recálculo dashboard.
- QA completo.

## 4.2 No incluido todavía

- Integración automática FlyBy: `[NO DATA]`.
- Integración automática Nubimed: `[NO DATA]`.
- Integración automática TPV: `[NO DATA]`.
- Integración automática Stripe: `[NO DATA]`.
- Integración automática MEWS: `[NO DATA]`.
- Tabla real existente confirmada para Caja SYNCROLAB: `[NO DATA]`.

---

# 5. FLUJO OPERATIVO

SYNCROLAB registra turno y al finalizar debe poder decidir si cierra caja.

Flujo:

```text
Mi turno
→ Guardar turno
→ Checklist
→ ¿Quieres cerrar caja?
→ Sí / No
```

## 5.1 Si responde No

- No se abre Caja SYNCROLAB.
- Se guarda solo follow-up/turno.
- Estado turno: Pendiente revisión.
- Logout obligatorio.

## 5.2 Si responde Sí

- Se abre formulario Caja SYNCROLAB.
- Se registran los bloques:
  - FlyBy / Training.
  - Nubimed / Clínica.
  - TPV conjunto.
  - Stripe conjunto.
  - Cargos a MEWS.
  - Traspaso mediodía.
  - Totales.
  - Diferencias.
- Se guarda caja en estado:

```text
Pendiente validación
```

- Aparece en:
  - Validación;
  - Dashboard;
  - Conciliación;
  - Alertas si aplica.

---

# 6. TURNO Y TRASPASO MEDIODÍA

## 6.1 Cierre por turno

Confirmado:

```text
SYNCROLAB registra caja por turno.
```

Los turnos exactos quedan pendientes:

```text
[NO DATA]
```

Opciones recomendadas:

```text
Mañana
Tarde
```

o:

```text
Turno 1
Turno 2
```

## 6.2 Traspaso mediodía

Confirmado:

```text
El traspaso de caja se hace también a mediodía.
```

Debe registrarse en el cierre:

- si hubo traspaso;
- quién entrega;
- quién recibe;
- importe FlyBy / Training traspasado;
- importe Nubimed / Clínica traspasado;
- fecha/hora;
- comentario.

Campos:

```text
traspaso_mediodia_si
traspaso_entrega_empleado_id
traspaso_entrega_nombre
traspaso_recibe_empleado_id
traspaso_recibe_nombre
traspaso_flyby_training
traspaso_nubimed_clinica
traspaso_comentario
traspaso_ts
```

Regla:

- Si `traspaso_mediodia_si = true`, campos de entrega/recibe e importes deben ser obligatorios.

---

# 7. QUIÉN PUEDE REGISTRAR Y VALIDAR

## 7.1 Registro

Confirmado:

```text
Cualquier empleado de SYNCROLAB puede registrar cierre de caja.
```

Puede:

- crear cierre;
- completar importes;
- guardar;
- ver su cierre si aplica.

No puede:

- validar;
- eliminar;
- crear FIO;
- modificar cierres de otros si no tiene permiso.

## 7.2 Validación

Confirmado:

```text
Admin
Jefe Recepción SYNCROLAB
```

pueden validar Caja SYNCROLAB.

Pueden:

- revisar;
- validar;
- enviar a corrección;
- registrar FIO si aplica;
- revisar conciliación.

---

# 8. TABLA RECOMENDADA

No existe tabla confirmada para Caja SYNCROLAB.

Crear:

```text
syncrolab_cash_closures
```

## 8.1 SQL tabla

```sql
create table if not exists syncrolab_cash_closures (
  id text primary key,
  shift_id text references shifts(id) on delete set null,

  fecha text not null,
  fecha_date date,
  turno text,

  responsable_id text references employees(id),
  responsable_nombre text,

  -- FlyBy / Training
  efectivo_flyby_sistema numeric default 0,
  efectivo_training_real numeric default 0,
  diferencia_training numeric default 0,
  cargo_mews_flyby numeric default 0,
  servicios_syncrolab_flyby text,

  -- Nubimed / Clínica
  efectivo_nubimed_sistema numeric default 0,
  efectivo_clinica_real numeric default 0,
  diferencia_clinica numeric default 0,
  cargo_mews_nubimed numeric default 0,
  servicios_syncrolab_nubimed text,

  -- TPV conjunto
  tpv_flyby numeric default 0,
  tpv_nubimed numeric default 0,
  tpv_total_real numeric default 0,
  diferencia_tpv numeric default 0,

  -- Stripe conjunto
  stripe_sistema_syncrolab numeric default 0,
  stripe_total_syncrolab numeric default 0,
  diferencia_stripe numeric default 0,

  -- Totales control
  total_efectivo_sistema numeric default 0,
  total_efectivo_real numeric default 0,
  total_tpv_sistema numeric default 0,
  total_tpv_real numeric default 0,
  total_cargos_mews numeric default 0,
  total_diferencias numeric default 0,

  -- Conciliación
  habitacion text,
  comentario_conciliacion text,

  -- Traspaso mediodía
  traspaso_mediodia_si boolean default false,
  traspaso_entrega_empleado_id text references employees(id),
  traspaso_entrega_nombre text,
  traspaso_recibe_empleado_id text references employees(id),
  traspaso_recibe_nombre text,
  traspaso_flyby_training numeric default 0,
  traspaso_nubimed_clinica numeric default 0,
  traspaso_comentario text,
  traspaso_ts timestamptz,

  -- Diferencias
  explicacion_diferencia text,
  accion_diferencia text,
  informado_responsable text,
  comentario text,

  -- Validación
  estado text default 'Pendiente validación',
  validado_por text references employees(id),
  validado_ts timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

# 9. BLOQUES DEL FORMULARIO

El formulario debe dividirse en bloques claros:

1. Identificación.
2. FlyBy / Training.
3. Nubimed / Clínica.
4. TPV conjunto.
5. Stripe conjunto.
6. Cargos a MEWS.
7. Traspaso mediodía.
8. Totales de control.
9. Diferencias y explicación.
10. Guardar / Cancelar.

---

# 10. IDENTIFICACIÓN

Campos:

| Campo | Obligatorio | Regla |
|---|---:|---|
| Fecha | Sí | automática |
| Turno | Sí | según configuración SYNCROLAB |
| Responsable | Sí | usuario logado |
| Shift ID | recomendado | si viene de Mi turno |
| Habitación | obligatorio si cargo MEWS > 0 | para conciliación |

Reglas:

- fecha debe guardarse igual que otras cajas;
- idealmente añadir `fecha_date`;
- responsable debe venir de `employees`;
- no mostrar ID técnico al usuario.

---

# 11. BLOQUE FLYBY / TRAINING

## 11.1 Campos

```text
efectivo_flyby_sistema
efectivo_training_real
diferencia_training
cargo_mews_flyby
servicios_syncrolab_flyby
```

## 11.2 Significado

| Campo | Significado |
|---|---|
| efectivo_flyby_sistema | efectivo esperado según FlyBy |
| efectivo_training_real | efectivo contado en caja Training |
| diferencia_training | diferencia entre real y sistema |
| cargo_mews_flyby | cargos a MEWS originados en FlyBy |
| servicios_syncrolab_flyby | tipos de servicio SYNCROLAB registrados en FlyBy |

## 11.3 Fórmula

```text
diferencia_training = efectivo_training_real - efectivo_flyby_sistema
```

## 11.4 Reglas

- Si diferencia_training != 0 → explicación obligatoria.
- Si cargo_mews_flyby > 0 → habitación obligatoria.
- “Servicios FlyBy” no significa servicios propios de FlyBy, sino tipos de servicio SYNCROLAB registrados en FlyBy.
- No guardar valores negativos salvo que el negocio lo permita `[NO DATA]`.

---

# 12. BLOQUE NUBIMED / CLÍNICA

## 12.1 Campos

```text
efectivo_nubimed_sistema
efectivo_clinica_real
diferencia_clinica
cargo_mews_nubimed
servicios_syncrolab_nubimed
```

## 12.2 Significado

| Campo | Significado |
|---|---|
| efectivo_nubimed_sistema | efectivo esperado según Nubimed |
| efectivo_clinica_real | efectivo contado en caja Clínica |
| diferencia_clinica | diferencia entre real y sistema |
| cargo_mews_nubimed | cargos a MEWS originados en Nubimed |
| servicios_syncrolab_nubimed | tipos de servicio SYNCROLAB registrados en Nubimed |

## 12.3 Fórmula

```text
diferencia_clinica = efectivo_clinica_real - efectivo_nubimed_sistema
```

## 12.4 Reglas

- Si diferencia_clinica != 0 → explicación obligatoria.
- Si cargo_mews_nubimed > 0 → habitación obligatoria.
- “Servicios Nubimed” significa tipos de servicio SYNCROLAB registrados en Nubimed.
- No confundir Nubimed con MEWS.

---

# 13. BLOQUE TPV CONJUNTO

## 13.1 Regla confirmada

```text
TPV está en conjunto para SYNCROLAB.
```

Debe compararse contra:

```text
TPV FlyBy + TPV Nubimed
```

## 13.2 Campos

```text
tpv_flyby
tpv_nubimed
tpv_total_real
diferencia_tpv
```

## 13.3 Fórmula

```text
total_tpv_sistema = tpv_flyby + tpv_nubimed
diferencia_tpv = tpv_total_real - total_tpv_sistema
```

## 13.4 Reglas

- TPV esperado = tpv_flyby + tpv_nubimed.
- TPV real = tpv_total_real.
- Si diferencia_tpv != 0 → explicación obligatoria.
- Debe verse claramente en UI:
  - TPV FlyBy;
  - TPV Nubimed;
  - TPV esperado;
  - TPV real;
  - Diferencia.

---

# 14. BLOQUE STRIPE CONJUNTO

## 14.1 Regla confirmada

```text
Stripe es conjunto de SYNCROLAB.
```

## 14.2 Campos

```text
stripe_sistema_syncrolab
stripe_total_syncrolab
diferencia_stripe
```

## 14.3 Fórmula

```text
diferencia_stripe = stripe_total_syncrolab - stripe_sistema_syncrolab
```

## 14.4 Si no existe fuente sistema

Si todavía no existe fuente de Stripe sistema:

```text
[NO DATA] fuente Stripe sistema
```

Regla:

- Stripe total puede registrarse.
- No debe generar diferencia crítica hasta que exista fuente sistema.
- Dashboard debe mostrar Stripe total como informativo.
- Validación puede revisar manualmente.

---

# 15. TOTALES DE CONTROL

## 15.1 Total efectivo sistema

```text
total_efectivo_sistema = efectivo_flyby_sistema + efectivo_nubimed_sistema
```

## 15.2 Total efectivo real

```text
total_efectivo_real = efectivo_training_real + efectivo_clinica_real
```

## 15.3 Total TPV sistema

```text
total_tpv_sistema = tpv_flyby + tpv_nubimed
```

## 15.4 Total TPV real

```text
total_tpv_real = tpv_total_real
```

## 15.5 Total cargos MEWS

```text
total_cargos_mews = cargo_mews_flyby + cargo_mews_nubimed
```

## 15.6 Total diferencias

```text
total_diferencias =
  diferencia_training
+ diferencia_clinica
+ diferencia_tpv
+ diferencia_stripe
```

## 15.7 Regla de bloqueo

Si:

```text
total_diferencias != 0
```

entonces:

```text
explicacion_diferencia obligatoria
```

---

# 16. CARGOS A MEWS

## 16.1 Regla confirmada

SYNCROLAB no tiene acceso a número de reserva MEWS.

Por tanto SYNCROLAB registra:

- fecha;
- habitación;
- importe;
- tipo servicio;
- origen FlyBy o Nubimed.

Recepción Hotel puede registrar:

- número reserva MEWS;
- habitación;
- importe;
- cargo SYNCROLAB recibido.

## 16.2 Campos

```text
cargo_mews_flyby
cargo_mews_nubimed
total_cargos_mews
habitacion
```

## 16.3 Regla obligatoria

Si:

```text
cargo_mews_flyby > 0
or
cargo_mews_nubimed > 0
```

entonces:

```text
habitacion obligatoria
```

Mensaje:

```text
Indica la habitación para conciliar el cargo a MEWS.
```

---

# 17. CONCILIACIÓN CON RECEPCIÓN HOTEL

## 17.1 Regla confirmada

Conciliar:

```text
SYNCROLAB total_cargos_mews
vs
Recepción Hotel syncrolab_room_charged
```

## 17.2 Matching confirmado

```text
fecha + habitación + importe
```

## 17.3 No usar reserva MEWS

No usar como obligatorio:

```text
reserva_mews
```

porque:

```text
SYNCROLAB no tiene acceso a número de reserva MEWS.
```

## 17.4 Campos requeridos en Recepción Hotel

Si no existen, añadir:

```sql
alter table recepcion_cash add column if not exists syncrolab_room_charged numeric default 0;
alter table recepcion_cash add column if not exists syncrolab_habitacion text;
```

## 17.5 SQL conceptual

```sql
select
  sc.fecha,
  sc.habitacion,
  sc.total_cargos_mews as syncrolab_total_cargos_mews,
  rc.syncrolab_room_charged as recepcion_syncrolab_room_charged,
  sc.total_cargos_mews - rc.syncrolab_room_charged as diferencia,
  case
    when sc.total_cargos_mews = rc.syncrolab_room_charged then 'OK'
    else 'DIFERENCIA'
  end as estado
from syncrolab_cash_closures sc
left join recepcion_cash rc
  on rc.fecha = sc.fecha
 and rc.syncrolab_habitacion = sc.habitacion
 and rc.syncrolab_room_charged = sc.total_cargos_mews;
```

---

# 18. ESTADOS

Estados:

```text
Pendiente validación
Validado
En corrección
Eliminado
```

Reglas:

- Nuevo cierre → Pendiente validación.
- Admin/Jefe Recepción SYNCROLAB valida → Validado.
- Error corregible → En corrección.
- Admin elimina → Eliminado o hard delete.

---

# 19. VALIDACIÓN

En `Validación → Cierres de caja`, Admin/Jefe Recepción SYNCROLAB debe ver todos los bloques.

## 19.1 Debe mostrar

- fecha;
- turno;
- responsable;
- efectivo FlyBy sistema;
- efectivo Training real;
- diferencia Training;
- efectivo Nubimed sistema;
- efectivo Clínica real;
- diferencia Clínica;
- TPV FlyBy;
- TPV Nubimed;
- TPV esperado;
- TPV real;
- diferencia TPV;
- Stripe sistema;
- Stripe real;
- diferencia Stripe;
- cargo MEWS FlyBy;
- cargo MEWS Nubimed;
- total cargos MEWS;
- habitación;
- servicios SYNCROLAB FlyBy;
- servicios SYNCROLAB Nubimed;
- traspaso mediodía;
- totales;
- explicación;
- acción;
- informado responsable;
- estado.

## 19.2 Bloqueos

No validar si:

- diferencia_training != 0 sin explicación;
- diferencia_clinica != 0 sin explicación;
- diferencia_tpv != 0 sin explicación;
- diferencia_stripe != 0 sin explicación;
- cargo MEWS > 0 sin habitación;
- falta responsable;
- falta turno;
- falta fecha;
- estado = En corrección.

---

# 20. DASHBOARD

Caja SYNCROLAB debe aparecer como tercera caja operativa:

```text
Caja Sala
Caja Recepción Hotel
Caja SYNCROLAB
```

## 20.1 KPIs

Mostrar:

- total cierres SYNCROLAB;
- cierres pendientes;
- cierres validados;
- efectivo FlyBy sistema;
- efectivo Training real;
- diferencia Training;
- efectivo Nubimed sistema;
- efectivo Clínica real;
- diferencia Clínica;
- TPV FlyBy;
- TPV Nubimed;
- TPV esperado;
- TPV real;
- diferencia TPV;
- Stripe sistema;
- Stripe real;
- diferencia Stripe;
- cargos MEWS FlyBy;
- cargos MEWS Nubimed;
- total cargos MEWS;
- total diferencias;
- traspasos mediodía;
- cierres con diferencia;
- conciliaciones OK;
- conciliaciones con diferencia.

## 20.2 SQL Dashboard

```sql
select
  count(id) as total_cierres,
  count(*) filter (where estado = 'Pendiente validación') as pendientes,
  count(*) filter (where estado = 'Validado') as validados,

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
where fecha between :from_date and :to_date;
```

---

# 21. ALERTAS

Generar alerta si:

- Caja SYNCROLAB pendiente validación;
- diferencia_training != 0 sin explicación;
- diferencia_clinica != 0 sin explicación;
- diferencia_tpv != 0 sin explicación;
- diferencia_stripe != 0 sin explicación;
- cargo MEWS > 0 sin habitación;
- conciliación SYNCROLAB ↔ Recepción con diferencia;
- cierre en corrección;
- traspaso mediodía incompleto.

Las alertas:

- desaparecen al resolverse;
- quedan en histórico.

---

# 22. UI/UX

## 22.1 Estructura del formulario

Debe ser clara:

```text
Identificación
FlyBy / Training
Nubimed / Clínica
TPV conjunto
Stripe conjunto
Cargos a MEWS
Traspaso mediodía
Totales
Diferencias
Guardar / Cancelar
```

## 22.2 Reglas visuales

- Diferencia = 0 → OK.
- Diferencia != 0 con explicación → diferencia explicada.
- Diferencia != 0 sin explicación → error bloqueante.
- Cargo MEWS sin habitación → error bloqueante.
- Totales deben recalcular en tiempo real.
- No mostrar datos técnicos.

## 22.3 Mensajes

Guardar:

```text
Caja SYNCROLAB guardada correctamente.
```

Validar:

```text
Caja SYNCROLAB validada correctamente.
```

Diferencia sin explicación:

```text
Explica la diferencia antes de guardar o validar.
```

Cargo MEWS sin habitación:

```text
Indica la habitación para conciliar el cargo a MEWS.
```

---

# 23. PERMISOS

## 23.1 Usuario SYNCROLAB

Puede:

- crear cierre;
- registrar traspaso;
- guardar;
- ver sus cierres si aplica.

No puede:

- validar;
- eliminar;
- crear FIO;
- modificar cierres de otros sin permiso.

## 23.2 Jefe Recepción SYNCROLAB

Puede:

- revisar;
- validar;
- enviar a corrección;
- revisar diferencias;
- revisar conciliación.

## 23.3 Admin

Puede:

- ver todo;
- validar;
- corregir;
- eliminar;
- hard delete con confirmación;
- exportar.

---

# 24. ELIMINACIÓN

## 24.1 Soft delete

Recomendado en producción.

## 24.2 Hard delete

Permitido solo Admin.

Debe:

- pedir confirmación;
- escribir audit log;
- recalcular Dashboard;
- recalcular conciliación.

Mensaje:

```text
¿Eliminar definitivamente esta Caja SYNCROLAB?
Esta acción no se puede deshacer.
```

---

# 25. QA CHECKLIST

- [ ] Login empleado SYNCROLAB.
- [ ] Pregunta ¿Quieres cerrar caja? aparece.
- [ ] Si No, no crea cierre.
- [ ] Si Sí, abre Caja SYNCROLAB.
- [ ] Fecha guarda.
- [ ] Turno guarda.
- [ ] Responsable guarda.
- [ ] Efectivo FlyBy sistema guarda.
- [ ] Efectivo Training real guarda.
- [ ] Diferencia Training calcula.
- [ ] Diferencia Training sin explicación bloquea.
- [ ] Efectivo Nubimed sistema guarda.
- [ ] Efectivo Clínica real guarda.
- [ ] Diferencia Clínica calcula.
- [ ] Diferencia Clínica sin explicación bloquea.
- [ ] TPV FlyBy guarda.
- [ ] TPV Nubimed guarda.
- [ ] TPV esperado calcula.
- [ ] TPV real guarda.
- [ ] Diferencia TPV calcula.
- [ ] Diferencia TPV sin explicación bloquea.
- [ ] Stripe sistema guarda si existe.
- [ ] Stripe total guarda.
- [ ] Diferencia Stripe calcula.
- [ ] Cargo MEWS FlyBy guarda.
- [ ] Cargo MEWS Nubimed guarda.
- [ ] Total cargos MEWS calcula.
- [ ] Habitación obligatoria si cargo MEWS > 0.
- [ ] Servicios SYNCROLAB FlyBy guardan.
- [ ] Servicios SYNCROLAB Nubimed guardan.
- [ ] Traspaso mediodía guarda.
- [ ] Entrega/recibe obligatorios si traspaso sí.
- [ ] Total efectivo sistema calcula.
- [ ] Total efectivo real calcula.
- [ ] Total diferencias calcula.
- [ ] Guardar crea estado Pendiente validación.
- [ ] Validación muestra Caja SYNCROLAB completa.
- [ ] Admin valida.
- [ ] Jefe Recepción SYNCROLAB valida.
- [ ] Usuario lineal no valida.
- [ ] Dashboard refleja Caja SYNCROLAB.
- [ ] Conciliación con Recepción funciona por fecha + habitación + importe.
- [ ] Alertas aparecen.
- [ ] Alertas desaparecen al resolver.
- [ ] Histórico de alertas se conserva.
- [ ] Eliminación recalcula Dashboard.
- [ ] No aparecen null/undefined/NaN.
- [ ] No aparecen IDs técnicos.
- [ ] Responsive correcto.

---

# 26. RIESGOS

- Confundir FlyBy con tipo de servicio.
- Confundir Nubimed con tipo de servicio.
- No separar caja Training y caja Clínica.
- No controlar TPV conjunto.
- No controlar Stripe conjunto.
- No exigir habitación para cargos a MEWS.
- Intentar conciliar por reserva MEWS desde SYNCROLAB.
- No registrar traspaso mediodía.
- Validar diferencias sin explicación.
- Permitir usuario lineal validar.
- No recalcular Dashboard.
- Duplicar datos de caja.
- Escribir MUSE en vez de MEWS.
- Escribir SYNCROLAB incorrectamente.

---

# 27. PROMPT TÉCNICO PARA CODEX / CLAUDE CODE

Contexto:
Caja SYNCROLAB es un módulo nuevo dentro de SYNCROSFERA/SynchroShift. SYNCROLAB trabaja con dos cajas registradoras: FlyBy/Training y Nubimed/Clínica. Además tiene TPV conjunto y Stripe conjunto. Los cargos a MEWS se generan desde FlyBy y Nubimed. SYNCROLAB no tiene número de reserva MEWS, solo fecha, habitación, importe y tipo de servicio. La conciliación se realiza contra Recepción Hotel por fecha + habitación + importe.

Objetivo:
Implementar Caja SYNCROLAB a nivel producción.

Requisitos funcionales:
1. En flujo de turno SYNCROLAB, al guardar turno preguntar: ¿Quieres cerrar caja?
2. Si No: guardar turno y logout.
3. Si Sí: abrir formulario Caja SYNCROLAB.
4. Cualquier empleado SYNCROLAB puede registrar cierre.
5. Admin y Jefe Recepción SYNCROLAB pueden validar.
6. Crear tabla `syncrolab_cash_closures`.
7. Guardar datos FlyBy/Training.
8. Guardar datos Nubimed/Clínica.
9. Guardar TPV conjunto y comparar contra TPV FlyBy + TPV Nubimed.
10. Guardar Stripe conjunto.
11. Guardar cargos a MEWS FlyBy y Nubimed.
12. Exigir habitación si cargo MEWS > 0.
13. Registrar traspaso mediodía.
14. Calcular totales y diferencias.
15. Requerir explicación si hay diferencia.
16. Mostrar en Validación.
17. Mostrar en Dashboard.
18. Conciliar contra Recepción Hotel por fecha + habitación + importe.
19. Recalcular Dashboard al editar/eliminar.

Reglas de cálculo:
- diferencia_training = efectivo_training_real - efectivo_flyby_sistema.
- diferencia_clinica = efectivo_clinica_real - efectivo_nubimed_sistema.
- total_tpv_sistema = tpv_flyby + tpv_nubimed.
- diferencia_tpv = tpv_total_real - total_tpv_sistema.
- diferencia_stripe = stripe_total_syncrolab - stripe_sistema_syncrolab.
- total_efectivo_sistema = efectivo_flyby_sistema + efectivo_nubimed_sistema.
- total_efectivo_real = efectivo_training_real + efectivo_clinica_real.
- total_cargos_mews = cargo_mews_flyby + cargo_mews_nubimed.
- total_diferencias = diferencia_training + diferencia_clinica + diferencia_tpv + diferencia_stripe.

Reglas UI/UX:
- Formulario por bloques.
- Diferencias visibles en tiempo real.
- Explicación obligatoria si diferencia.
- Habitación obligatoria si cargo MEWS > 0.
- No mostrar datos técnicos.
- No mostrar null/undefined/NaN.
- Escribir siempre SYNCROLAB y MEWS correctamente.

Reglas permisos:
- Usuario SYNCROLAB registra.
- Admin valida.
- Jefe Recepción SYNCROLAB valida.
- Usuario lineal no valida ni elimina.

Criterios aceptación:
- Caja SYNCROLAB guarda.
- Diferencias calculan.
- Totales calculan.
- Cargos MEWS requieren habitación.
- Traspaso mediodía funciona.
- Validación funciona.
- Dashboard muestra datos.
- Conciliación con Recepción funciona.
- Eliminación recalcula.

No romper:
- Caja Sala.
- Caja Recepción Hotel.
- Dashboard.
- Validación.
- CoreTurnos.
