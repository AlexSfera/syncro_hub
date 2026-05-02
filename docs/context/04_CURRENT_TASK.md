# 04_CURRENT_TASK — Cierres de Caja: Sala, Recepción Hotel y preparación de conciliación

## Fecha última actualización
2026-05-02

## Estado

### Completado en sesión 2026-05-02

1. Análisis completo de arquitectura: funciones activas identificadas, dead code confirmado, tablas correctas verificadas.
2. Caja Sala: campo `stripe_real_updated_date` añadido a HTML, lógica de auto-update y guardado implementada.
3. Caja Recepción Hotel: sección de conciliación futura añadida con 4 campos nuevos, guardado y carga al editar implementados.
4. Fix `cash_closings`: eliminada última referencia activa en `openRecCajaModal()`. Corregido también campo `fondo_traspasado` (era `rec_fondo_traspaso`).
5. Diagnóstico completo de Validación y Dashboard entregado.

### Pendiente — Supabase schema (ejecutar antes de probar)

```sql
ALTER TABLE sala_cash_closures
  ADD COLUMN stripe_real_updated_date TEXT;

ALTER TABLE recepcion_cash
  ADD COLUMN room_charge_recibido      NUMERIC DEFAULT 0,
  ADD COLUMN desayunos_confirmados_mews INTEGER DEFAULT 0,
  ADD COLUMN pensiones_confirmadas_mews INTEGER DEFAULT 0,
  ADD COLUMN syncrolab_room_charged    NUMERIC DEFAULT 0;
```

### Pendiente — decisiones no tomadas

| Item | Estado |
|---|---|
| Fórmula Cash spec vs código — ¿adoptar spec? | Pendiente confirmación |
| Signo Tarjeta spec vs código — ¿invertir? | Pendiente confirmación |
| Fondo final ¿calculado automático o sigue manual? | Pendiente confirmación |
| Pensiones: campo único vs dos campos (`media_pension` + `pension_completa`) | Pendiente confirmación |
| Validación Caja Recepción Hotel — implementar tab en Validación | Pendiente |
| Conciliación Dashboard (Sala vs Recepción) — implementar comparativa | Pendiente |

---

## Scope

Trabajar únicamente en:
- Caja Sala
- Caja Recepción Hotel

No modificar Dashboard, Mi Turno, Validación, Incidencias/FIO, Tareas, Sala, Cocina o Recepción salvo que sea estrictamente necesario.

---

## General Rules

- No mostrar NaN, undefined, null, errores técnicos ni arrays visibles en UI.
- No cambiar Supabase schema sin avisar y justificar antes.
- Las funciones activas de caja están SIEMPRE en el script inline de `index.html`. No modificar `caja.js` ni `recepcion.js` para funciones de caja.
- No hacer refactor de `index.html`.
- Cambios pequeños, verificables y reversibles.

---

## Arquitectura activa — referencia rápida

| Archivo | Estado para funciones de caja |
|---|---|
| `index.html` (inline script) | ACTIVO — todas las funciones de caja viven aquí |
| `caja.js` | Dead code — sobreescrito por index.html |
| `recepcion.js` (funciones de caja) | Dead code — sobreescrito por index.html |
| `recepcion.js` (KPI, turno, checklist) | ACTIVO |
| `cajas.js` | ACTIVO — librería CAJAS_CONFIG |
| `dashboard.js` | ACTIVO |
| `shared.js` | ACTIVO |

---

## Caja Sala — Campos y estado

### Tabla: `sala_cash_closures`

| Campo | ID HTML | DB column | Estado |
|---|---|---|---|
| Fecha | `caja-fecha` | `fecha` | OK |
| Fondo inicial | `caja-fondo-ini` | `fondo_inicial` | OK, auto desde cierre anterior |
| Efectivo real | `caja-ef-real` | `efectivo_real` | OK |
| Cash POSMEWS | `caja-ef-posmews` | `efectivo_posmews` | OK |
| Fondo final | `caja-fondo-fin` | `fondo_final` | OK, manual |
| Retiro caja fuerte | `caja-retiro` | `retiro_caja_fuerte` | OK |
| Tarjeta POSMEWS | `caja-tar-posmews` | `tarjeta_posmews` | OK |
| Total TPV | `caja-tar-tpv` | `tarjeta_tpv` | OK |
| Propinas TPV | `caja-propinas-tpv` | `propinas_tpv` | OK |
| Propinas cash | `caja-propinas` | `propinas` | OK |
| Stripe POSMEWS | `caja-str-posmews` | `stripe_posmews` | OK |
| Stripe real | `caja-str-real` | `stripe_real` | OK |
| Fecha últ. actualiz. Stripe | `caja-str-fecha` (hidden) | `stripe_real_updated_date` | Código OK, schema pendiente |
| Room charge declarado | `caja-room` | `room_charge` | OK |
| Cargo Alexander | `caja-alexander` | `cargo_alexander` | OK |
| Desayunos ticados (nº) | `caja-pension-d` | `pension_desayuno` | OK |
| Media pensión (nº) | `caja-pension-m` | `media_pension` | OK |
| Pensión completa (nº) | `caja-pension-c` | `pension_completa` | OK |
| Total neto | `caja-total-neto-manual` | `subtotal_neto` | OK |
| Total bruto | `caja-total-bruto-manual` | `total_bruto` | OK |
| Comentario | `caja-comentario` | `comentario` | OK |
| Diferencia efectivo | — | `diferencia_efectivo` | OK, calculado |
| Diferencia tarjeta | — | `diferencia_tarjeta` | OK, calculado |
| Diferencia stripe | — | `diferencia_stripe` | OK, calculado |
| Diferencia operativa sala | — | `diferencia_operativa_sala` | OK, calculado |

### Fórmulas activas en código

```
difFisica  = efectivo_real - fondo_final - retiro_caja_fuerte
difSistema = efectivo_posmews - retiro_caja_fuerte - (fondo_final - fondo_inicial)
diferencia_efectivo = difFisica + difSistema

diferencia_tarjeta = (tarjeta_tpv - propinas_tpv) - tarjeta_posmews
diferencia_stripe  = stripe_real - stripe_posmews

diferencia_operativa_sala = diferencia_efectivo + diferencia_tarjeta + diferencia_stripe
```

NOTA: fórmulas spec (doc) difieren en signo/convención de las activas. No cambiar sin confirmación.

---

## Caja Recepción Hotel — Campos y estado

### Tabla: `recepcion_cash`

| Campo | ID HTML | DB column | Estado |
|---|---|---|---|
| Turno | radio `rec-turno-*` | `turno` | OK |
| Cash real | `rec-cash-real` | `cash_real` | OK |
| Cash MEWS | `rec-cash-mews` | `cash_mews` | OK |
| Fondo recibido | `rec-fondo-recibido` | `fondo_recibido` | OK, auto desde anterior |
| Fondo traspasado | `rec-fondo-traspaso` | `fondo_traspasado` | OK |
| Retiro caja fuerte | `rec-cf-importe` | `retiro_caja_fuerte` | OK |
| Tarjeta MEWS | `rec-tarjeta-mews` | `tarjeta_mews` | OK |
| TPV físico | `rec-tpv-real` | `tpv_real` | OK |
| Stripe MEWS | `rec-stripe-mews` | `stripe_mews` | OK |
| Stripe real | `rec-stripe-real` | `stripe_real` | OK |
| Fondo inicial siguiente | `rec-fondo-inicial` | `fondo_inicial_siguiente` | OK, solo Noche |
| Room charge recibido | `rec-room-recibido` | `room_charge_recibido` | Código OK, schema pendiente |
| Desayunos confirmados MEWS | `rec-desayunos-mews` | `desayunos_confirmados_mews` | Código OK, schema pendiente |
| Pensiones confirmadas MEWS | `rec-pensiones-mews` | `pensiones_confirmadas_mews` | Código OK, schema pendiente |
| Servicios SYNCROLAB room charged | `rec-syncrolab-room` | `syncrolab_room_charged` | Código OK, schema pendiente |
| dif_cash | — | `dif_cash` | OK, calculado |
| dif_tarjeta | — | `dif_tarjeta` | OK, calculado |
| dif_stripe | — | `dif_stripe` | OK, calculado |
| dif_total | — | `dif_total` | OK, calculado |

---

## Validación y Dashboard — estado actual

### Tablas correctas (confirmadas y limpias)

- Caja Sala → `public.sala_cash_closures`
- Caja Recepción Hotel → `public.recepcion_cash`
- `cash_closings` NO existe. Eliminada toda referencia activa de `index.html`.

### Validación

| Módulo | Estado |
|---|---|
| Tab FOLLOW-UP (shifts) | OK, `renderValidacion()` en shared.js |
| Tab CIERRE CAJA — Caja Sala | OK, `renderValCajaList()`, valida con `validarCierre()` |
| Tab CIERRE CAJA — Caja Recepción Hotel | NO implementado |

### Dashboard

| KPI | Tabla | Campo diferencia | Estado |
|---|---|---|---|
| `_renderKpiSala()` | `sala_cash_closures` | `diferencia_operativa_sala` | OK |
| `_renderKpiFnB()` | `sala_cash_closures` | `total_bruto`, `subtotal_neto` | OK |
| `_renderKpiRecepcion()` | `recepcion_cash` | `dif_total` | OK, sin fallbacks incorrectos |

---

## Caja Sala — Estructura original del Current Task

### Bloque Cash

**Fondo de caja inicial:**
- Campo fijo, no editable por empleado en cierre diario.
- Viene desde cierre anterior (`fondo_final`).
- Solo Admin/supervisor puede desbloquear con motivo + audit_log.

**Efectivo real contado:** obligatorio, editable.
**Cash según POSMEWS:** obligatorio, editable.
**Retiro efectivo caja fuerte:** obligatorio, puede ser 0.

### Control Cash (spec — pendiente alinear código)

```
Diferencial operativa caja cash =
Efectivo real contado - Fondo de caja inicial - Cash según POSMEWS

Fondo de caja final =
Fondo de caja inicial + Cash según POSMEWS - Retiro efectivo caja fuerte
```

### Bloque Tarjeta & Stripe

**Stripe platform:** puede no revisarse cada día. Al revisar, queda fecha de última actualización automática.

### Control Tarjeta (spec — pendiente alinear código)

```
Control tarjeta = Tarjeta según POSMEWS - Total TPV - Propinas TPV
```

### Control Stripe (spec, coincide con código)

```
Control Stripe = Stripe platform - Stripe según POSMEWS
```

### Diferencia operativa (spec)

```
Total desvío = Caja cash + Control tarjeta + Control Stripe
```

---

## Addendum — Validación y Dashboard de Cierres de Caja

### Qué debe hacer Validación

Para Caja Sala: leer desde `sala_cash_closures`. Al validar: actualizar `estado`, `validado_por`, `validado_ts`.
Para Caja Recepción Hotel: leer desde `recepcion_cash`. Al validar: actualizar `estado`, `validado_por`, `validado_ts`.

### Qué debe hacer Dashboard

Para Caja Sala: leer desde `sala_cash_closures`.
Para Caja Recepción Hotel: leer desde `recepcion_cash`.
No usar `cash_closings`. No usar valores hardcoded.

### Campos Validación — Caja Sala

```
id, fecha, servicios, responsable_id, responsable_nombre,
estado, diferencia_operativa_sala, validado_por, validado_ts
```

Fallback diferencia: `diferencia_efectivo + diferencia_tarjeta + diferencia_stripe`

### Campos Validación — Caja Recepción Hotel

```
id, fecha, turno, responsable_id, responsable_nombre,
estado, dif_total, validado_por, validado_ts
```

### Campos Dashboard — Caja Sala

```
id, fecha, estado, responsable_nombre, diferencia_operativa_sala
```

### Campos Dashboard — Caja Recepción Hotel

```
id, fecha, turno, estado, responsable_nombre, dif_total
```
