# Current Task — Arquitectura y lógica de Cierres de Caja

## Scope

Trabajar únicamente en la definición, implementación mínima y validación de lógica de:

- Caja Sala
- Caja Recepción Hotel

El objetivo es dejar correctamente documentada y preparada la lógica de datos, cálculos, campos obligatorios, campos automáticos y diferencias operativas de cierres de caja.

No modificar Dashboard, Mi Turno, Validación, Incidencias/FIO, Tareas, Sala, Cocina o Recepción salvo que sea estrictamente necesario para leer o mostrar correctamente el módulo de cierre de caja.

---

## Problem

Actualmente la lógica final de cierres de caja no está cerrada.

Se necesita definir de forma clara:

- campos de entrada;
- campos calculados;
- campos bloqueados/no editables;
- fórmulas;
- diferencias operativas;
- fecha de cierre;
- fecha automática de última actualización para valores acumulativos;
- diferencias entre Caja Sala y Caja Recepción Hotel.

El sistema no debe asumir lógica anterior ni inventar fórmulas.

---

## General Rules

### Reglas comunes

- La fecha del cierre debe estar visible.
- Los importes deben tratarse como números.
- Los campos obligatorios deben estar marcados claramente.
- Los campos calculados no deben ser editables manualmente.
- Los campos automáticos no deben poder modificarse manualmente.
- Los valores vacíos deben tratarse de forma segura, preferiblemente como `0` solo cuando tenga sentido operativo.
- No mostrar `NaN`, `undefined`, `null`, errores técnicos ni arrays visibles en UI.
- No cambiar Supabase schema sin avisar y justificar antes.
- Antes de modificar código, identificar si la lógica activa está en `index.html`, `caja.js`, `cajas.js` u otro archivo.
- No hacer refactor grande de `index.html`.
- Hacer cambios pequeños, verificables y reversibles.

---

# Caja Sala

## Fecha

Campo:

- Fecha

Reglas:

- Debe identificar el día del cierre.
- Debe mostrarse en formato claro para usuario.
- Si se usa formato interno distinto, no mostrarlo de forma técnica en UI.

---

## Bloque Cash

### Campos

1. Fondo de caja inicial
2. Efectivo real contado *
3. Cash según POSMEWS *
4. Retiro efectivo caja fuerte *

### Reglas de campos

#### Fondo de caja inicial

- Campo fijo.
- No editable por el usuario en el cierre diario.
- Debe venir desde el cierre anterior.
- Si no existe cierre anterior o no hay dato disponible, mostrar `[NO DATA]` o bloquear guardado con mensaje entendible.
- No inventar valor inicial.

#### Efectivo real contado

- Campo obligatorio.
- Editable por usuario autorizado.
- Valor numérico.

#### Cash según POSMEWS

- Campo obligatorio.
- Editable por usuario autorizado.
- Valor numérico.

#### Retiro efectivo caja fuerte

- Campo obligatorio.
- Editable por usuario autorizado.
- Valor numérico.
- Puede ser `0`.

---

## Control Cash — Caja Sala

### Fórmulas

```text
Diferencial operativa caja cash =
Efectivo real contado - Fondo de caja inicial - Cash según POSMEWS
---

# Addendum — Validación y Dashboard de Cierres de Caja

## Motivo

El Current Task actual permite tocar Validación y Dashboard solo si es necesario para leer o mostrar correctamente los cierres de caja.

Ahora es necesario porque los cierres de caja deben aparecer correctamente en:

- Validación
- Dashboard

## Alcance permitido

Se permite modificar de forma mínima:

- Validación
- Dashboard

Solo para que lean correctamente los cierres de caja guardados.

No se permite rediseñar Validación ni Dashboard.

No se permite tocar otros módulos.

---

## Tablas correctas

Caja Sala debe usar esta tabla:

```text
public.sala_cash_closures
---

# Addendum — Validación y Dashboard de Cierres de Caja

## Qué debe hacer Claude Code con este addendum

Este bloque es una instrucción para Claude Code.

Claude Code debe usar esta información para corregir únicamente la lectura y actualización mínima de cierres de caja en Validación y Dashboard.

No es SQL.
No es código JavaScript.
No es una tabla nueva.
No se debe copiar a Supabase.
No se debe convertir en formulario.

## Tablas que debe usar el código

Para Caja Sala, el código debe leer y actualizar esta tabla:

public.sala_cash_closures

Para Caja Recepción Hotel, el código debe leer y actualizar esta tabla:

public.recepcion_cash

El código NO debe usar esta tabla para cierres de caja:

cash_closings

Motivo:

cash_closings no existe en Supabase.

## Qué debe hacer Validación

Validación debe mostrar los cierres de caja reales guardados.

Para Caja Sala, Validación debe leer desde:

public.sala_cash_closures

Para Caja Recepción Hotel, Validación debe leer desde:

public.recepcion_cash

Cuando se valida un cierre de Caja Sala, debe actualizar en:

public.sala_cash_closures

Campos a actualizar:

estado
validado_por
validado_ts

Cuando se valida un cierre de Caja Recepción Hotel, debe actualizar en:

public.recepcion_cash

Campos a actualizar:

estado
validado_por
validado_ts

## Campos que Validación debe usar para Caja Sala

Para mostrar Caja Sala en Validación, usar estos campos:

id
fecha
servicios
responsable_id
responsable_nombre
estado
diferencia_operativa_sala
validado_por
validado_ts

Campo principal para diferencia:

diferencia_operativa_sala

Si diferencia_operativa_sala está vacío, usar como fallback:

diferencia_efectivo + diferencia_tarjeta + diferencia_stripe

## Campos que Validación debe usar para Caja Recepción Hotel

Para mostrar Caja Recepción Hotel en Validación, usar estos campos:

id
fecha
turno
responsable_id
responsable_nombre
estado
dif_total
validado_por
validado_ts

Campo principal para diferencia:

dif_total

## Qué debe hacer Dashboard

Dashboard debe leer cierres de caja reales guardados.

Para Caja Sala, Dashboard debe leer desde:

public.sala_cash_closures

Para Caja Recepción Hotel, Dashboard debe leer desde:

public.recepcion_cash

Dashboard no debe usar:

cash_closings

Dashboard no debe usar valores hardcoded para cajas.

Dashboard debe separar Caja Sala y Caja Recepción Hotel si el diseño actual lo permite.

## Campos que Dashboard debe usar para Caja Sala

Para Caja Sala, Dashboard debe usar:

id
fecha
estado
responsable_nombre
diferencia_operativa_sala

Campo principal de diferencia:

diferencia_operativa_sala

Si diferencia_operativa_sala está vacío, usar como fallback:

diferencia_efectivo + diferencia_tarjeta + diferencia_stripe

## Campos que Dashboard debe usar para Caja Recepción Hotel

Para Caja Recepción Hotel, Dashboard debe usar:

id
fecha
turno
estado
responsable_nombre
dif_total

Campo principal de diferencia:

dif_total

## Antes de modificar código

Antes de tocar código, Claude Code debe responder con este análisis:

Alcance detectado:
Archivos a inspeccionar:
Funciones de Validación encontradas:
Funciones de Dashboard encontradas:
Tablas que Validación consulta actualmente:
Tablas que Dashboard consulta actualmente:
Referencias encontradas a cash_closings:
Campos incorrectos encontrados:
Cambios mínimos necesarios:
Riesgos:
QA:

No modificar código antes de entregar este análisis.

## Cambios permitidos

Se permite modificar solo lo mínimo necesario para:

- que Validación muestre Caja Sala;
- que Validación muestre Caja Recepción Hotel;
- que Validación actualice el estado en la tabla correcta;
- que Dashboard lea Caja Sala;
- que Dashboard lea Caja Recepción Hotel;
- que no se use cash_closings;
- que no aparezcan NaN, undefined, null ni errores técnicos.

## No modificar

No modificar:

Mi Turno
Incidencias/FIO
Tareas
Login/Auth
Supabase schema
UI general de Dashboard
UI general de Validación
Recepción operativa
Sala operativa
Cocina

No crear archivos nuevos.
No hacer refactor.
No mover funciones fuera de index.html.
No modificar recepcion.js si es dead code.

## Resultado esperado

Validación debe mostrar:

Cierres Caja Sala desde public.sala_cash_closures
Cierres Caja Recepción Hotel desde public.recepcion_cash

Dashboard debe leer o contar:

Cierres Caja Sala desde public.sala_cash_closures
Cierres Caja Recepción Hotel desde public.recepcion_cash

No debe quedar ningún uso de cash_closings para cierres de caja.

## QA obligatorio

Caja Sala:

Crear cierre Caja Sala.
Guardar.
Verificar fila en sala_cash_closures.
Abrir Validación.
Confirmar que aparece.
Validar.
Confirmar que estado, validado_por y validado_ts se actualizan.
Abrir Dashboard.
Confirmar que Caja Sala se contabiliza si existe KPI de cajas.

Caja Recepción Hotel:

Crear cierre Caja Recepción Hotel.
Guardar.
Verificar fila en recepcion_cash.
Abrir Validación.
Confirmar que aparece.
Validar.
Confirmar que estado, validado_por y validado_ts se actualizan.
Abrir Dashboard.
Confirmar que Caja Recepción Hotel se contabiliza si existe KPI de cajas.

General:

Confirmar que no aparece NaN.
Confirmar que no aparece undefined.
Confirmar que no aparece null visible.
Confirmar que no hay errores técnicos visibles.
Confirmar que no se rompió Caja Sala.
Confirmar que no se rompió Caja Recepción Hotel.
Confirmar que no se rompió Dashboard general.
