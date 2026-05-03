# 05_CASH/caja_recepcion_hotel.md — SYNCROSFERA / SynchroShift (FULL PRO)

---

## 1. Objetivo

Definir el módulo **Caja Recepción Hotel** a nivel operativo, funcional, UI/UX, validación, dashboard, conciliación y QA.

Caja Recepción Hotel controla:

- cash MEWS;
- cash real;
- tarjeta MEWS;
- TPV físico;
- Stripe MEWS;
- Stripe real;
- diferencias;
- fondo recibido;
- fondo traspasado;
- fondo inicial siguiente;
- retiro caja fuerte;
- room charge recibido;
- desayunos/pensiones confirmadas;
- cargos SYNCROLAB;
- validación;
- dashboard;
- conciliación con Sala y SYNCROLAB.

---

## 2. Alcance

### Incluido

- Registro de caja recepción.
- Validación por Admin / responsable autorizado.
- Visualización en Dashboard.
- Conciliación con Sala.
- Preparación de conciliación con SYNCROLAB.
- Separación pendientes / validadas.
- Eliminación admin con recálculo Dashboard.
- Revisión en Validación.
- Control de diferencias.
- Comentario obligatorio si hay diferencia.

### No incluido

- Integración automática real MEWS: `[NO DATA]`.
- Integración automática SYNCROLAB/talonario: `[NO DATA]`.
- Integración bancaria/TPV automática: `[NO DATA]`.

---

## 3. Fuente de datos actual

Tabla canónica recomendada:

```text
recepcion_cash
```

Tabla duplicada/legacy:

```text
recepcion_cash_closures
```

Regla:

- Usar `recepcion_cash` como fuente principal.
- No contar `recepcion_cash` y `recepcion_cash_closures` a la vez.
- Revisar si `recepcion_cash_closures` tiene datos reales antes de migrar.

Campos reales detectados en `recepcion_cash`:

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

---

## 4. Relación con turno

Relación lógica:

```text
recepcion_cash.shift_id → shifts.id
recepcion_cash.responsable_id → employees.id
```

Reglas:

- Caja Recepción debe vincularse a turno cuando se crea desde Mi Turno.
- Debe guardar turno:
  - Mañana;
  - Tarde;
  - Noche.
- En Recepción se usa `turno`, no servicio.

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

---

## 5. Campos del formulario

### 5.1 Identificación

| Campo | Fuente | Obligatorio |
|---|---|---|
| Fecha | automática/manual autorizada | Sí |
| Turno | mañana/tarde/noche | Sí |
| Responsable | usuario logado | Sí |
| Shift ID | turno origen | recomendado |

### 5.2 Efectivo

| Campo | Descripción |
|---|---|
| fondo_recibido | fondo recibido turno anterior |
| cash_mews | cash según MEWS |
| cash_real | cash contado real |
| retiro_caja_fuerte | retirada caja fuerte |
| fondo_traspasado | fondo entregado siguiente turno |
| fondo_inicial_siguiente | fondo inicial siguiente día/turno |
| dif_cash | diferencia cash |

### 5.3 Tarjeta

| Campo | Descripción |
|---|---|
| tarjeta_mews | tarjeta según MEWS |
| tpv_real | TPV físico |
| dif_tarjeta | diferencia tarjeta |

### 5.4 Stripe

| Campo | Descripción |
|---|---|
| stripe_mews | Stripe según MEWS |
| stripe_real | Stripe real |
| dif_stripe | diferencia Stripe |

### 5.5 Diferencias

| Campo | Descripción |
|---|---|
| dif_total | suma diferencias |
| explicacion_diferencia | explicación obligatoria si dif != 0 |
| accion_diferencia | acción tomada |
| informado_responsable | si se informó responsable |

### 5.6 Conciliación con Sala

Campos necesarios recomendados:

```sql
alter table recepcion_cash add column if not exists room_charge_recibido numeric default 0;
alter table recepcion_cash add column if not exists desayunos_consumidos numeric default 0;
alter table recepcion_cash add column if not exists media_pension_consumida numeric default 0;
alter table recepcion_cash add column if not exists pension_completa_consumida numeric default 0;
```

### 5.7 Conciliación con SYNCROLAB

Campo recomendado:

```sql
alter table recepcion_cash add column if not exists syncrolab_room_charged numeric default 0;
```

---

## 6. Fórmulas

### 6.1 Diferencia cash

```text
dif_cash = cash_real - cash_mews
```

### 6.2 Diferencia tarjeta

```text
dif_tarjeta = tpv_real - tarjeta_mews
```

### 6.3 Diferencia Stripe

```text
dif_stripe = stripe_real - stripe_mews
```

### 6.4 Diferencia total

```text
dif_total = dif_cash + dif_tarjeta + dif_stripe
```

### 6.5 Regla comentario

Si:

```text
dif_total != 0
```

entonces:

```text
explicacion_diferencia obligatoria
accion_diferencia recomendada/obligatoria según validación
```

---

## 7. Estados

Estados recomendados:

```text
Pendiente validación
Validado
En corrección
Eliminado
```

Reglas:

- Nuevo cierre → Pendiente validación.
- Admin/Validador valida → Validado.
- Error corregible → En corrección.
- Admin elimina → Eliminado o hard delete.

---

## 8. Validación

En `Validación → Cierres de caja`, Admin/Validador debe ver:

- fecha;
- turno;
- responsable;
- fondo recibido;
- cash MEWS;
- cash real;
- dif cash;
- tarjeta MEWS;
- TPV real;
- dif tarjeta;
- Stripe MEWS;
- Stripe real;
- dif Stripe;
- dif total;
- explicación diferencia;
- acción diferencia;
- informado responsable;
- room charge recibido;
- desayunos consumidos;
- media pensión consumida;
- pensión completa consumida;
- SYNCROLAB room charged;
- estado.

### Reglas

- No validar si diferencia sin explicación.
- No validar si faltan datos obligatorios.
- Validar caja = cierre definitivo.
- Validación debe guardar:
  - validado_por;
  - validado_ts;
  - estado = Validado.

---

## 9. Dashboard

Caja Recepción debe alimentar Dashboard:

### KPIs

- total cierres Recepción;
- cierres pendientes;
- cierres validados;
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
- fondo inicial siguiente;
- retiros caja fuerte;
- room charge recibido;
- desayunos consumidos;
- media pensión consumida;
- pensión completa consumida;
- SYNCROLAB room charged.

### SQL base

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
where fecha between :from_date and :to_date;
```

---

## 10. Conciliación con Sala

Comparación por mismo día.

### Room charge

```text
Sala room_charge
vs
Recepción room_charge_recibido
```

### Desayunos

```text
Sala pension_desayuno
vs
Recepción desayunos_consumidos
```

### Media pensión

```text
Sala media_pension
vs
Recepción media_pension_consumida
```

### Pensión completa

```text
Sala pension_completa
vs
Recepción pension_completa_consumida
```

### SQL ejemplo

```sql
select
  sc.fecha,
  sum(sc.room_charge) as sala_room_charge,
  sum(rc.room_charge_recibido) as recepcion_room_charge,
  sum(sc.room_charge) - sum(rc.room_charge_recibido) as diferencia_room_charge
from sala_cash_closures sc
left join recepcion_cash rc on rc.fecha = sc.fecha
where sc.fecha = :business_date
group by sc.fecha;
```

---

## 11. Conciliación con SYNCROLAB

Regla confirmada:

- No se concilian ventas de Recepción contra SYNCROLAB directamente si SYNCROLAB no tiene tabla.
- Debe conciliarse:
  - cargos/talonario SYNCROLAB;
  - contra cargos SYNCROLAB en Recepción Hotel.

Matching ideal:

- fecha;
- importe;
- tipo de servicio;
- habitación/número habitación.

Nº reserva MEWS:

```text
solo existe en Recepción Hotel
```

Tabla futura requerida:

```text
syncrolab_charges
```

---

## 12. UX/UI

- Formulario dividido en bloques:
  - identificación;
  - efectivo;
  - tarjeta;
  - Stripe;
  - diferencias;
  - fondo;
  - conciliación Sala;
  - conciliación SYNCROLAB;
  - comentario.
- Diferencias visibles en tiempo real.
- Diferencia != 0 debe destacarse.
- Explicación obligatoria si diferencia.
- No mostrar lenguaje técnico.
- No mostrar MEWS mal escrito como MUSE.
- Feedback tras guardar:

```text
Caja Recepción guardada correctamente.
```

Tras validar:

```text
Caja Recepción validada correctamente.
```

---

## 13. Permisos

### Usuario Recepción

Puede:

- registrar caja;
- ver sus cajas si aplica;
- editar durante ventana permitida `[NO DATA]`.

No puede:

- validar;
- eliminar;
- modificar cajas de otros sin permiso.

### Jefe Recepción / Validador

Puede:

- revisar;
- validar si permiso definido;
- enviar a corrección.

### Admin

Puede:

- ver todo;
- validar;
- corregir;
- eliminar;
- hard delete con confirmación;
- exportar.

---

## 14. Eliminación

### Soft delete

Recomendado producción.

### Hard delete

Permitido solo Admin.

Debe:

- pedir confirmación;
- escribir audit log;
- recalcular Dashboard.

Mensaje:

```text
¿Eliminar definitivamente esta Caja Recepción?
Esta acción no se puede deshacer.
```

---

## 15. QA Checklist Caja Recepción

- [ ] Login Recepción.
- [ ] Caja Recepción visible.
- [ ] Fecha guarda.
- [ ] Turno guarda.
- [ ] Responsable guarda.
- [ ] Fondo recibido guarda.
- [ ] Cash MEWS guarda.
- [ ] Cash real guarda.
- [ ] Dif cash calcula.
- [ ] Tarjeta MEWS guarda.
- [ ] TPV real guarda.
- [ ] Dif tarjeta calcula.
- [ ] Stripe MEWS guarda.
- [ ] Stripe real guarda.
- [ ] Dif Stripe calcula.
- [ ] Dif total calcula.
- [ ] Diferencia exige explicación.
- [ ] Acción diferencia guarda.
- [ ] Informado responsable guarda.
- [ ] Room charge recibido guarda.
- [ ] Desayunos consumidos guarda.
- [ ] Pensiones consumidas guardan.
- [ ] SYNCROLAB room charged guarda.
- [ ] Validación muestra caja.
- [ ] Admin valida.
- [ ] Dashboard refleja caja.
- [ ] Conciliación con Sala calcula.
- [ ] Conciliación con SYNCROLAB preparada.
- [ ] Eliminación recalcula Dashboard.
- [ ] Sin errores técnicos.
- [ ] Responsive correcto.

---

## 16. Riesgos

- Doble conteo con recepcion_cash_closures.
- Fechas como text.
- Falta room_charge_recibido.
- Falta desayunos/pensiones consumidos.
- Falta syncrolab_room_charged.
- Validar diferencia sin explicación.
- Mezclar caja recepción con caja sala.
- No recalcular Dashboard.
- No conciliar con Sala.
- Permitir usuario lineal validar.
- Escribir MUSE en vez de MEWS.

---

## 17. Prompt técnico Codex / Claude Code

Contexto:
Caja Recepción Hotel controla caja diaria/turno de Recepción en SYNCROSFERA. La tabla canónica recomendada es `recepcion_cash`. Debe integrarse con Validación, Dashboard, conciliación con Sala y futura conciliación SYNCROLAB.

Objetivo:
Completar Caja Recepción Hotel a nivel producción.

Requisitos:
- Formulario completo con cash, tarjeta, Stripe, fondos, diferencias, explicación, acción, responsable informado.
- Añadir campos para conciliación Sala: room charge, desayunos, media pensión, pensión completa.
- Añadir campo SYNCROLAB room charged.
- Calcular diferencias en tiempo real.
- Explicación obligatoria si diferencia.
- Guardar estado Pendiente validación.
- Validar desde módulo Validación.
- Mostrar en Dashboard pendientes y validadas.
- Preparar conciliación por fecha.
- No contar recepcion_cash_closures si se usa recepcion_cash.
- Recalcular Dashboard al editar/eliminar.
- No mostrar errores técnicos.

No romper:
- Mi turno Recepción.
- Validación.
- Dashboard.
- Caja Sala.
- CoreTurnos.

Salida esperada:
- Código corregido.
- SQL si hace falta.
- Lista de archivos modificados.
- Checklist QA ejecutado.
