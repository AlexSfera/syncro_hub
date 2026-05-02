# Business Rules — SYNCROSFERA Platform

## Naming

Always write correctly:

- SYNCROSFERA
- SYNCROLAB
- MEWS (hotel system)
- POSMEWS (restaurant POS)

If "MUSE" appears, interpret it as MEWS.

## Business Systems

- Bitrix24 — central source for tasks, CRM, follow-up and control.
- MEWS — main hotel system.
- POSMEWS — restaurant POS (Sala / F&B).
- Nubimed — clinic system.
- Stripe — online payment platform. Stripe real = Stripe.com value.

## General Platform Rules

- Incidents and pending management are different concepts.
- Dashboards must count real saved data.
- Roles and permissions must be respected.
- User-facing UI must not show technical code, arrays or internal errors.
- The interface must be clear for line staff.
- Do not expose credentials, API keys or sensitive configuration.

---

## Cash Closure — Caja Sala

### Table: `sala_cash_closures`

### Roles
- Responsable de turno: can create.
- Admin / FB / validador: can edit and validate.
- Validado final: cannot be edited without reopening with audit reason.

### Fondo de caja inicial
- Comes automatically from `fondo_final` of the previous closure.
- Cannot be manually changed by non-admin staff.
- Admin / supervisor can unlock with a mandatory reason — logged to audit.

### Fondo de caja final
- Currently a manual field (`caja-fondo-fin` / `fondo_final`).
- Spec formula: `fondo_inicial + Cash POSMEWS - Retiro` — NOT YET implemented as calculated.
- **Do not change to calculated without explicit confirmation.**

### Cash formulas (current code — active)
```
difFisica  = efectivo_real - fondo_final - retiro_caja_fuerte
difSistema = efectivo_posmews - retiro_caja_fuerte - (fondo_final - fondo_inicial)
diferencia_efectivo = difFisica + difSistema
```

Spec formula (not yet applied):
```
Diferencial cash = efectivo_real - fondo_inicial - efectivo_posmews
```
These are equivalent ONLY if `fondo_final` is calculated automatically. Contradict if manual. **Do not change without confirmation.**

### Tarjeta formula (current code — active)
```
diferencia_tarjeta = (tarjeta_tpv - propinas_tpv) - tarjeta_posmews
```

Spec formula (not yet applied):
```
Control tarjeta = tarjeta_posmews - tarjeta_tpv - propinas_tpv
```
Sign is inverted vs spec. **Do not change without confirmation.**

### Stripe formula (current code — active, matches spec)
```
diferencia_stripe = stripe_real - stripe_posmews
```
Positive when Stripe.com has more than POSMEWS.

### Stripe real updated date
- Field `stripe_real_updated_date` (TEXT, format DD/MM/YYYY).
- Auto-updated when user inputs a value > 0 in Stripe real field.
- Read-only display. Not manually editable.
- Saved with the closure.

### Diferencia operativa Sala
```
diferencia_operativa_sala = diferencia_efectivo + diferencia_tarjeta + diferencia_stripe
```
Also saved as `diferencia_caja` (alias, same value) for legacy compatibility.

### Conciliation fields (Sala declares → Recepción confirms)
- `room_charge` — Room charge declarado (€)
- `pension_desayuno` — Desayunos ticados en POSMEWS (nº personas)
- `media_pension` — Media pensión ticada (nº personas)
- `pension_completa` — Pensión completa ticada (nº personas)

Note: spec asks for one field "pensiones comida & cena" but code has two: `media_pension` + `pension_completa`. **Do not unify without confirmation.**

### Estado values
- `Pendiente validación` — just saved
- `Cuadrado Sala` — first validation step
- `Validado final` — fully validated, locked

---

## Cash Closure — Caja Recepción Hotel

### Table: `recepcion_cash`

### Roles
- Recepcionista: can create.
- Admin / jefe_recepcion: can reopen and delete.

### Fondo recibido
- Comes automatically from `fondo_traspasado` of the previous `recepcion_cash` record.
- Admin / jefe_recepcion can unlock with mandatory reason.

### Cash formulas (same logic as Sala, adapted for MEWS)
```
difCash  = cash_real - fondo_traspasado - retiro_caja_fuerte
difCashSistema = cash_mews - retiro - (fondo_traspasado - fondo_recibido)
dif_cash = difCash
dif_tarjeta = tpv_real - tarjeta_mews
dif_stripe  = stripe_real - stripe_mews
dif_total   = dif_cash + difCashSistema + dif_tarjeta + dif_stripe
```

### Conciliation fields (Recepción confirms ← Sala declares)
Added 2026-05-02. Require Supabase schema (see below):
- `room_charge_recibido` — Room charge recibido de Restaurante (€)
- `desayunos_confirmados_mews` — Desayunos confirmados en MEWS (nº)
- `pensiones_confirmadas_mews` — Pensiones comida & cena confirmadas en MEWS (nº)
- `syncrolab_room_charged` — Servicios SYNCROLAB room charged (€)

### Supabase schema — pending execution
```sql
ALTER TABLE recepcion_cash
  ADD COLUMN room_charge_recibido      NUMERIC DEFAULT 0,
  ADD COLUMN desayunos_confirmados_mews INTEGER DEFAULT 0,
  ADD COLUMN pensiones_confirmadas_mews INTEGER DEFAULT 0,
  ADD COLUMN syncrolab_room_charged    NUMERIC DEFAULT 0;
```

### Estado values
- `cerrado` — saved by receptionist
- `reabierto` — reopened by admin/jefe_recepcion
- `validado` — validated (validado_ts set)

---

## Conciliation Logic — Future (NOT YET IMPLEMENTED)

Sala declares → Recepción confirms → Dashboard compares:

| Sala field | Recepción field | Concept |
|---|---|---|
| `room_charge` | `room_charge_recibido` | Room charge |
| `pension_desayuno` | `desayunos_confirmados_mews` | Desayunos |
| `media_pension` + `pension_completa` | `pensiones_confirmadas_mews` | Pensiones comida & cena |

Dashboard will compare these fields in future. Do not implement conciliation logic until explicitly requested.

---

## Validation Rules

- Validación screen has two tabs: FOLLOW-UP (shifts) and CIERRE CAJA (cash closures).
- CIERRE CAJA tab shows only Caja Sala (`sala_cash_closures`) currently.
- Caja Recepción Hotel validation tab: not yet implemented.
- `validarCierre()` updates `sala_cash_closures`: `estado`, `validado_por`, `validado_ts`.
- Recepción: validated via `reabrirCajaRec()` / direct state update in `recepcion_cash`.
