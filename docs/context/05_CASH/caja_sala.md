# 05_CASH/caja_sala.md — SYNCROSFERA / SynchroShift (FULL PRO)

---

## 1. Objetivo

Definir el módulo de **Cierre de Caja Sala** a nivel operativo, funcional, UI/UX, validación, dashboard, conciliación y QA.

Caja Sala controla:

- efectivo real;
- efectivo POSMEWS;
- tarjeta POSMEWS;
- tarjeta TPV;
- Stripe POSMEWS;
- Stripe real;
- propinas;
- fondo inicial;
- fondo final;
- retiro caja fuerte;
- room charge;
- cargo Alexander;
- pensiones/desayunos;
- descuentos;
- anulaciones;
- invitaciones;
- diferencias;
- validación;
- impacto en Dashboard;
- conciliación con Recepción Hotel.

---

## 2. Alcance

### Incluido

- Registro de cierre de caja de Sala.
- Validación por Admin / responsable autorizado.
- Visualización en Dashboard.
- Conciliación con Recepción Hotel.
- Separación entre cierres pendientes y validados.
- Eliminación admin con impacto en Dashboard.
- Revisión en módulo Validación.
- Control de diferencias.
- Comentario obligatorio si existe diferencia.

### No incluido

- Integración automática directa con POSMEWS: `[NO DATA]`.
- Conciliación automática final con MEWS: `[NO DATA]`.
- Importación automática bancaria/TPV: `[NO DATA]`.

---

## 3. Reglas principales

- Cualquier empleado de Sala puede registrar cierre de caja.
- Usuario lineal registra, pero no valida.
- Admin / validador autorizado valida.
- Validar caja = cierre definitivo operativo.
- Dashboard muestra todas las cajas: pendientes y validadas.
- Si se elimina un cierre, Dashboard debe recalcular.
- Si hay diferencia, debe existir explicación.
- No mostrar errores técnicos al usuario.
- No mostrar nombres de tablas ni IDs.

---

## 4. Navegación

En módulo Sala debe existir pestaña:

```text
Cierre de caja
```

En Admin no debe aparecer como pestaña operativa superior.  
En Admin debe revisarse dentro de:

```text
Validación → Cierres de caja
```

---

## 5. Fuente de datos actual

Tabla principal real:

```text
sala_cash_closures
```

Campos reales detectados:

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

---

## 6. Relación con turno

Actualmente la tabla no tiene `shift_id` en el schema aportado.

### Recomendación

Añadir:

```sql
alter table sala_cash_closures add column if not exists shift_id text;
```

Relación lógica:

```text
sala_cash_closures.shift_id → shifts.id
sala_cash_closures.responsable_id → employees.id
```

### Regla

Si el cierre se crea desde flujo de Mi turno, debe guardar `shift_id`.

Si el cierre se crea desde pestaña Cierre de caja, puede quedar sin `shift_id`, pero debe guardar:

- responsable_id;
- responsable_nombre;
- fecha;
- servicios.

---

## 7. Campos del formulario

### 7.1 Identificación

| Campo | Fuente | Obligatorio |
|---|---|---|
| Fecha | automática/manual autorizada | Sí |
| Servicio(s) | Sala | Sí |
| Responsable | usuario logado | Sí |
| Categoría | selector | No |

### 7.2 Efectivo

| Campo | Descripción |
|---|---|
| efectivo_posmews | efectivo según POSMEWS |
| efectivo_real | efectivo contado |
| fondo_inicial | fondo recibido/inicial |
| fondo_final | fondo final declarado |
| retiro_caja_fuerte | importe retirado caja fuerte |
| diferencia_efectivo | cálculo diferencia efectivo |

### 7.3 Tarjeta

| Campo | Descripción |
|---|---|
| tarjeta_posmews | tarjeta según POSMEWS |
| tarjeta_tpv | tarjeta según TPV |
| propinas_tpv | propinas en TPV |
| diferencia_tarjeta | diferencia tarjeta |

### 7.4 Stripe

| Campo | Descripción |
|---|---|
| stripe_posmews | Stripe según POSMEWS |
| stripe_real | Stripe real |
| diferencia_stripe | diferencia Stripe |

### 7.5 PMS / Recepción

| Campo | Descripción |
|---|---|
| room_charge | cargos habitación declarados por Sala |
| cargo_alexander | cargo Alexander si aplica |
| pension_desayuno | desayunos/pensión desayuno declarados por Sala |
| media_pension | medias pensiones declaradas por Sala |
| pension_completa | pensiones completas declaradas por Sala |

### 7.6 Ajustes operativos

| Campo | Descripción |
|---|---|
| descuentos_importe | importe descuentos |
| descuentos_num | número descuentos |
| anulaciones_importe | importe anulaciones |
| anulaciones_num | número anulaciones |
| invitaciones_importe | importe invitaciones |
| invitaciones_num | número invitaciones |

### 7.7 Totales

| Campo | Descripción |
|---|---|
| subtotal_neto | subtotal neto |
| total_bruto | total bruto |
| total_medios_pago | total medios pago |
| diferencia_operativa_sala | diferencia operativa |
| diferencia_caja | diferencia total |

### 7.8 Comentario

Campo:

```text
comentario
```

Obligatorio si:

- diferencia_efectivo != 0;
- diferencia_tarjeta != 0;
- diferencia_stripe != 0;
- diferencia_operativa_sala != 0;
- diferencia_caja != 0.

---

## 8. Fórmulas

### 8.1 Diferencia efectivo

```text
diferencia_efectivo = efectivo_real - efectivo_posmews
```

### 8.2 Diferencia tarjeta

```text
diferencia_tarjeta = tarjeta_tpv - tarjeta_posmews
```

### 8.3 Diferencia Stripe

```text
diferencia_stripe = stripe_real - stripe_posmews
```

### 8.4 Diferencia operativa Sala

```text
diferencia_operativa_sala =
  diferencia_efectivo
+ diferencia_tarjeta
+ diferencia_stripe
```

### 8.5 Total medios pago

```text
total_medios_pago =
  efectivo_real
+ tarjeta_tpv
+ stripe_real
+ room_charge
+ cargo_alexander
```

### 8.6 Diferencia caja

Regla actual:

```text
diferencia_caja = diferencia_operativa_sala
```

Si negocio define fórmula más avanzada:

```text
[NO DATA]
```

---

## 9. Estados

Estados recomendados:

```text
Pendiente validación
Validado
En corrección
Eliminado
```

Reglas:

- Nuevo cierre → Pendiente validación.
- Validado por Admin/Validador → Validado.
- Si hay error → En corrección.
- Si Admin elimina → Eliminado o hard delete según acción.

---

## 10. Validación

En `Validación → Cierres de caja`, Admin/Validador debe ver:

- fecha;
- responsable;
- servicio(s);
- efectivo POSMEWS;
- efectivo real;
- tarjeta POSMEWS;
- tarjeta TPV;
- Stripe POSMEWS;
- Stripe real;
- diferencias;
- room charge;
- pensiones/desayunos;
- ajustes;
- comentario;
- estado.

### Reglas

- No validar si hay diferencia sin comentario.
- No validar si datos obligatorios faltan.
- Validar caja = cierre definitivo.
- Validación debe guardar:
  - validado_por;
  - validado_ts;
  - estado = Validado.

---

## 11. Dashboard

Caja Sala debe alimentar Dashboard:

### KPIs

- total cierres Sala;
- cierres pendientes;
- cierres validados;
- diferencia efectivo total;
- diferencia tarjeta total;
- diferencia Stripe total;
- diferencia caja total;
- total bruto;
- subtotal neto;
- total room charge;
- total desayunos;
- total media pensión;
- total pensión completa;
- total descuentos;
- total anulaciones;
- total invitaciones.

### SQL base

```sql
select
  count(id) as total_cierres,
  count(*) filter (where estado = 'Pendiente validación') as pendientes,
  count(*) filter (where estado = 'Validado') as validados,
  coalesce(sum(diferencia_efectivo), 0) as diferencia_efectivo_total,
  coalesce(sum(diferencia_tarjeta), 0) as diferencia_tarjeta_total,
  coalesce(sum(diferencia_stripe), 0) as diferencia_stripe_total,
  coalesce(sum(diferencia_caja), 0) as diferencia_caja_total,
  coalesce(sum(total_bruto), 0) as total_bruto,
  coalesce(sum(subtotal_neto), 0) as subtotal_neto,
  coalesce(sum(room_charge), 0) as room_charge,
  coalesce(sum(pension_desayuno), 0) as pension_desayuno,
  coalesce(sum(media_pension), 0) as media_pension,
  coalesce(sum(pension_completa), 0) as pension_completa
from sala_cash_closures
where fecha between :from_date and :to_date;
```

---

## 12. Conciliación con Recepción Hotel

### 12.1 Room charge

```text
Sala room_charge
vs
Recepción room_charge_recibido
```

### 12.2 Desayunos

```text
Sala pension_desayuno
vs
Recepción desayunos_consumidos / desayunos_confirmados
```

### 12.3 Media pensión

```text
Sala media_pension
vs
Recepción media_pension_consumida
```

### 12.4 Pensión completa

```text
Sala pension_completa
vs
Recepción pension_completa_consumida
```

### Regla

Comparación por mismo día.

```text
fecha Sala = fecha Recepción
```

---

## 13. UX/UI

- Formulario dividido en bloques.
- Diferencias visibles en tiempo real.
- Si diferencia != 0, resaltar.
- Comentario obligatorio con diferencia.
- Botón guardar claro.
- Botón cancelar claro.
- Feedback tras guardar:

```text
Cierre de caja guardado correctamente.
```

- Al validar:

```text
Cierre de caja validado correctamente.
```

No mostrar:

- null;
- undefined;
- NaN;
- arrays;
- JSON;
- IDs técnicos;
- nombres de tabla.

---

## 14. Permisos

### Usuario Sala

Puede:

- crear cierre;
- ver sus cierres si aplica;
- editar durante ventana permitida `[NO DATA]`.

No puede:

- validar;
- eliminar;
- modificar cierres de otros si no tiene permiso.

### Responsable / Validador

Puede:

- revisar cierres;
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

## 15. Eliminación

### Soft delete

Recomendado producción.

### Hard delete

Permitido para Admin en pruebas/limpieza.

Debe:

- pedir confirmación;
- escribir audit log;
- recalcular Dashboard.

Mensaje:

```text
¿Eliminar definitivamente este cierre de caja?
Esta acción no se puede deshacer.
```

---

## 16. QA Checklist Caja Sala

- [ ] Login usuario Sala.
- [ ] Abrir Cierre de caja.
- [ ] Fecha carga correctamente.
- [ ] Servicios guardan.
- [ ] Responsable guarda.
- [ ] Efectivo POSMEWS guarda.
- [ ] Efectivo real guarda.
- [ ] Diferencia efectivo calcula.
- [ ] Tarjeta POSMEWS guarda.
- [ ] Tarjeta TPV guarda.
- [ ] Diferencia tarjeta calcula.
- [ ] Stripe POSMEWS guarda.
- [ ] Stripe real guarda.
- [ ] Diferencia Stripe calcula.
- [ ] Room charge guarda.
- [ ] Pensiones guardan.
- [ ] Ajustes guardan.
- [ ] Diferencia requiere comentario.
- [ ] Guardar crea estado Pendiente validación.
- [ ] Validación muestra cierre.
- [ ] Admin valida.
- [ ] Dashboard refleja caja.
- [ ] Conciliación con Recepción preparada.
- [ ] Eliminación recalcula Dashboard.
- [ ] Sin errores técnicos.
- [ ] Responsive correcto.

---

## 17. Riesgos

- Doble conteo por no vincular shift_id.
- Fechas como text.
- Validar diferencia sin comentario.
- Mezclar Caja Sala con Caja Recepción.
- No recalcular Dashboard tras eliminación.
- No conciliar room charge con Recepción.
- Mostrar datos técnicos.
- Permitir usuario lineal validar.

---

## 18. Prompt técnico Codex / Claude Code

Contexto:
Caja Sala controla cierre de caja del departamento Sala en SYNCROSFERA. La tabla real actual es `sala_cash_closures`. Debe integrarse con Validación, Dashboard y conciliación con Recepción Hotel.

Objetivo:
Completar Caja Sala a nivel producción.

Requisitos:
- Formulario completo con efectivo, tarjeta, Stripe, fondos, room charge, pensiones, ajustes y comentario.
- Calcular diferencias en tiempo real.
- Comentario obligatorio si hay diferencia.
- Guardar estado Pendiente validación.
- Validar desde módulo Validación.
- Mostrar en Dashboard pendientes y validadas.
- Preparar conciliación con Recepción por fecha.
- Recalcular Dashboard al editar/eliminar.
- No mostrar errores técnicos.

No romper:
- Mi turno Sala.
- Validación.
- Dashboard.
- Caja Recepción.
- CoreTurnos.

Salida esperada:
- Código corregido.
- SQL si hace falta.
- Lista de archivos modificados.
- Checklist QA ejecutado.
