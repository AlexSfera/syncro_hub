# QA Checklist — SYNCROSFERA Platform

## Minimum QA — General

1. Open app.
2. Login or select role if applicable.
3. Create a new record.
4. Save.
5. Reload page.
6. Verify persistence.
7. Create incident.
8. Verify incident appears in Follow-up.
9. Close incident.
10. Verify resolution time.
11. Create task.
12. Verify deadline.
13. Verify Dashboard count.
14. Verify role permissions.
15. Verify no technical text is visible.
16. Verify no arrays like `["Desayuno","Comida"]` are visible.
17. Verify responsive view.
18. Verify that unrelated modules are not broken.

---

## QA — Caja Sala

1. Open Caja Sala form (new).
2. Verify `fondo_inicial` is auto-filled from previous closure `fondo_final`. If no previous closure, field is empty.
3. Enter a value > 0 in **Stripe real**. Verify that "Última actualización Stripe real" shows today's date in DD/MM/YYYY format.
4. Leave Stripe real empty. Verify date does NOT auto-fill.
5. Fill all required fields.
6. Verify differences update live (Δ Efectivo, Δ Tarjeta, Δ Stripe, Total desvío).
7. If total diferencia > 0, verify comentario becomes required.
8. Save. Verify toast "Cierre de caja guardado ✓".
9. Reload. Verify closure appears in list.
10. Open in edit mode. Verify all fields preload correctly including `stripe_real_updated_date`.
11. Verify `sala_cash_closures` in Supabase has `stripe_real_updated_date` with correct value.
12. Go to Validación → tab CIERRE CAJA. Verify closure appears.
13. Click Validar. Verify `estado`, `validado_por`, `validado_ts` update in Supabase.
14. Verify validado cierre cannot be edited without reopening.

---

## QA — Caja Recepción Hotel

1. Open Caja Recepción modal (new).
2. Verify `fondo_recibido` is auto-filled from `fondo_traspasado` of the previous `recepcion_cash` record.
3. Select turno Mañana / Tarde / Noche. Verify "Fondo inicial día siguiente" only appears for Noche.
4. Fill all required fields.
5. Verify differences update live (Δ Efectivo total, Δ Tarjeta, Δ Stripe, Diferencia operativa total).
6. If diferencia > 0.01, verify explanation block appears and is required.
7. Scroll to section **CONFIRMACIÓN RESTAURANTE**. Verify 4 fields are visible:
   - Room charge recibido de Restaurante (€)
   - Desayunos confirmados en MEWS (nº)
   - Pensiones comida & cena confirmadas en MEWS (nº)
   - Servicios SYNCROLAB room charged (€)
8. Fill the 4 conciliation fields.
9. Save. Verify toast confirmation.
10. Reload. Verify closure appears in list with correct dif_total.
11. Open in edit mode. Verify all 4 conciliation fields preload correctly.
12. Verify `recepcion_cash` in Supabase has all 4 new columns with correct values.
13. Verify Dashboard → Recepción KPI shows the closure.

---

## QA — Pending Supabase Schema

Before testing new fields, run in Supabase SQL Editor:

```sql
ALTER TABLE sala_cash_closures
  ADD COLUMN stripe_real_updated_date TEXT;

ALTER TABLE recepcion_cash
  ADD COLUMN room_charge_recibido      NUMERIC DEFAULT 0,
  ADD COLUMN desayunos_confirmados_mews INTEGER DEFAULT 0,
  ADD COLUMN pensiones_confirmadas_mews INTEGER DEFAULT 0,
  ADD COLUMN syncrolab_room_charged    NUMERIC DEFAULT 0;
```

If columns already exist, skip (Supabase will error on duplicate column — not destructive).

---

## QA — Dashboard

1. Open Dashboard → Sala. Verify Caja Sala closures appear in KPI.
2. Verify `diferencia_operativa_sala` is used as difference field (not `diferencia_caja`).
3. Open Dashboard → Recepción. Verify Caja Recepción closures appear.
4. Verify `dif_total` is shown in the table.
5. Verify no reference to `cash_closings` causes errors.
6. Verify no NaN, undefined, null visible in any KPI.

---

## QA — Validation Summary (after any cash closure change)

- Confirm Caja Sala creates correctly.
- Confirm Caja Recepción creates correctly.
- Confirm Dashboard — Sala shows correct data.
- Confirm Dashboard — Recepción shows correct data.
- Confirm Validación — CIERRE CAJA shows Sala closures.
- Confirm no NaN / undefined / null visible.
- Confirm no technical errors visible.
- Confirm Mi Turno not broken.
- Confirm Incidents / FIO not broken.
- Confirm Tareas not broken.

---

## Required QA Output

When Claude Code changes code, it must provide:

- Files inspected.
- Files modified.
- What changed and why.
- How to test.
- Risks and open questions.
- Pending Supabase schema if applicable.
- Items marked `[NO DATA]` if missing information.
