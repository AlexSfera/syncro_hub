# Modules — SYNCROSFERA Platform

## Active Screens

| Screen ID | Title | Module |
|---|---|---|
| `screen-sala` | Sala / F&B | Mi Turno — Sala |
| `screen-cocina` | Cocina | Mi Turno — Cocina |
| `screen-recepcion` | Recepción | Mi Turno — Recepción |
| `screen-rec-caja` | Caja Recepción | Caja Recepción Hotel |
| `screen-caja` | Cierre Caja | Caja Sala |
| `screen-validacion` | Validación | Validación (Follow-up + Cierre Caja) |
| `screen-dashboard` | Dashboard | Dashboard |
| `screen-export` | Exportar | Export |

---

## Module: Caja Sala

### Active functions (all in `index.html` inline script)

| Function | Line | Description |
|---|---|---|
| `openCajaForm(existingId)` | ~2244 | Opens modal. Auto-fills fondo_inicial from previous closure. |
| `calcCajaDifs()` | ~2331 | Recalculates all differences on input. |
| `_setCajaStrFecha()` | ~2425 | Auto-updates Stripe real date (DD/MM/YYYY) when stripe_real > 0. |
| `saveCajaForm()` | ~2411 | Saves to `sala_cash_closures` via direct Supabase REST fetch. |
| `renderCajaList()` | ~2548 | Renders the list of closures on screen-caja. |
| `renderValCajaList()` | ~2902 | Renders Caja Sala closures in Validación tab. |
| `validarCierre(cajaId)` | ~2953 | Advances estado, writes validado_por + validado_ts. |

### HTML form: `modal-caja`

Sections:
1. **Fecha** — `caja-fecha`
2. **Cash** — `caja-ef-real`, `caja-fondo-ini` (auto from previous), `caja-ef-posmews`, `caja-fondo-fin` (manual), `caja-retiro`
3. **Tarjeta & Stripe** — `caja-tar-posmews`, `caja-tar-tpv`, `caja-propinas-tpv`, `caja-propinas`, `caja-str-posmews`, `caja-str-real`, `caja-str-fecha` (hidden), `caja-str-fecha-disp` (read-only display)
4. **Diferencia operativa** — display only: `dif-ef-disp`, `dif-tar-disp`, `dif-str-disp`, `dif-sala-total`
5. **Campos PMS / Recepción** — `caja-room`, `caja-alexander`, `caja-pension-d`, `caja-pension-m`, `caja-pension-c`
6. **Totales manuales** — `caja-total-neto-manual`, `caja-total-bruto-manual`
7. **Comentario** — `caja-comentario` (required if diferencia exists)

### Supabase fields saved (`sala_cash_closures`)

```
id, fecha, servicios, responsable_id, responsable_nombre,
efectivo_real, efectivo_posmews, fondo_inicial, fondo_final, retiro_caja_fuerte,
diferencia_efectivo, tarjeta_posmews, tarjeta_tpv, propinas_tpv, propinas,
diferencia_tarjeta, stripe_posmews, stripe_real, stripe_real_updated_date,
diferencia_stripe, diferencia_operativa_sala, diferencia_caja,
room_charge, cargo_alexander, pension_desayuno, media_pension, pension_completa,
subtotal_neto, total_bruto, total_medios_pago, comentario,
estado, validado_por, validado_ts, created_at, updated_at
```

### Pending Supabase schema

```sql
ALTER TABLE sala_cash_closures ADD COLUMN stripe_real_updated_date TEXT;
```

---

## Module: Caja Recepción Hotel

### Active functions (all in `index.html` inline script)

| Function | Line | Description |
|---|---|---|
| `openRecCajaModal(existingId)` | ~3332 | Opens modal. Auto-fills fondo_recibido from previous recepcion_cash. |
| `calcRecDifs()` | ~3941 | Recalculates all differences on input. (Definition at 3288 is dead.) |
| `submitRecCaja()` | ~3397 | Saves to `recepcion_cash`. |
| `renderRecepcionCajaList()` | ~3487 | Renders list on screen-rec-caja. |
| `renderRecepcionDashboard()` | ~3572 | Renders KPI block on screen-rec-caja. |
| `reabrirCajaRec(cajaId)` | ~3531 | Reopens a closure with mandatory reason + audit log. |
| `eliminarCajaRec(cajaId)` | ~3553 | Admin-only deletion with audit log. |

### HTML form: `modal-rec-caja`

Sections:
1. **Efectivo** — `rec-cash-real`, `rec-fondo-recibido`, `rec-cash-mews`, `rec-fondo-traspaso`, `rec-cf-importe`
2. **Tarjeta & Stripe** — `rec-tarjeta-mews`, `rec-tpv-real`, `rec-stripe-mews`, `rec-stripe-real`
3. **Diferencias calculadas** — display: `rec-dif-cash-total`, `rec-dif-tarjeta`, `rec-dif-stripe`, `rec-dif-total`
4. **Explicación diferencia** — `rec-dif-exp`, `rec-dif-accion` (shown only if diferencia > 0.01)
5. **Fondo inicial siguiente** — `rec-fondo-inicial` (only Noche shift)
6. **Confirmación Restaurante** (conciliation) — `rec-room-recibido`, `rec-desayunos-mews`, `rec-pensiones-mews`, `rec-syncrolab-room`

### Supabase fields saved (`recepcion_cash`)

```
id, fecha, turno, shift_id, responsable_id, responsable_nombre, estado,
fondo_recibido, fondo_traspasado, fondo_inicial_siguiente, retiro_caja_fuerte,
cash_mews, tarjeta_mews, stripe_mews,
cash_real, tpv_real, stripe_real,
dif_cash, dif_tarjeta, dif_stripe, dif_total,
explicacion_diferencia, accion_diferencia, informado_responsable,
room_charge_recibido, desayunos_confirmados_mews,
pensiones_confirmadas_mews, syncrolab_room_charged,
validado_por, validado_ts, created_at, updated_at
```

### Pending Supabase schema

```sql
ALTER TABLE recepcion_cash
  ADD COLUMN room_charge_recibido      NUMERIC DEFAULT 0,
  ADD COLUMN desayunos_confirmados_mews INTEGER DEFAULT 0,
  ADD COLUMN pensiones_confirmadas_mews INTEGER DEFAULT 0,
  ADD COLUMN syncrolab_room_charged    NUMERIC DEFAULT 0;
```

---

## Module: Validación

### Tabs
- **FOLLOW-UP** — `renderValidacion()` in `shared.js:1331` — reads `shifts`
- **CIERRE CAJA** — `renderValCajaList()` in `index.html` — reads `sala_cash_closures`

### Caja Sala in Validación
- Table: `sala_cash_closures`
- Uses field: `diferencia_operativa_sala` (fallback: `diferencia_efectivo + diferencia_tarjeta + diferencia_stripe`)
- Validate button: `validarCierre(cajaId)` → updates `estado`, `validado_por`, `validado_ts`

### Caja Recepción Hotel in Validación
- **Not yet implemented.** No tab or section exists for `recepcion_cash` in the Validación screen.

---

## Module: Dashboard

### KPI functions (all in `dashboard.js`)

| Function | Line | Reads from |
|---|---|---|
| `_renderKpiSala()` | ~624 | `sala_cash_closures` |
| `_renderKpiFnB()` | ~663 | `sala_cash_closures` |
| `_renderKpiRecepcion()` | ~698 | `recepcion_cash` (no fallbacks to cash_closings) |

### Dashboard — Caja Sala fields used
- `diferencia_operativa_sala` (primary) — fallback: `diferencia_efectivo + diferencia_tarjeta + diferencia_stripe`
- `responsable_nombre`, `estado`, `fecha`

### Dashboard — Caja Recepción Hotel fields used
- `dif_total`, `turno`, `responsable_nombre`, `validado_ts`, `fecha`

---

## Module: Mi Turno

- Do not modify. Separate from caja logic.
- Mi Turno for Sala uses `shifts` table.
- Mi Turno for Recepción uses `shifts` + `rec_shift_data`.

---

## Reception Rules

- Use "turno", not "servicio".
- Do not require "responsable de turno" if not operationally necessary.
- Incidents must stay visible in Follow-up until closed.
- Incidents must calculate resolution time.

---

## Dashboard Rules

- Dashboard counters must be based on real saved records.
- Dashboard must not show hardcoded values.
- Dashboard must separate departments correctly.
- Dashboard must separate incidents from pending management.

---

## Cash Closure Rules (summary)

- Admin can edit cash closures.
- Non-admin users can only view or create.
- Fixed cash fund (fondo_inicial / fondo_recibido) must not be manually changed without admin unlock + audit.
- `cash_closings` table does not exist — do not reference it anywhere.
- Caja Sala → `sala_cash_closures`.
- Caja Recepción Hotel → `recepcion_cash`.
