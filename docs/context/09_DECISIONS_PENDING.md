# 09_DECISIONS_PENDING.md — SYNCROSFERA / SynchroShift

Versión: FULL PRO  
Objetivo: registrar decisiones pendientes que afectan a arquitectura, desarrollo, datos, permisos, dashboard, QA y producción.

---

# 0. OBJETIVO DEL ARCHIVO

Este archivo recoge todas las decisiones importantes que aún no están cerradas.

Regla principal:

```text
Si algo no está decidido, no se inventa.
Se marca como [NO DATA] y se deja aquí hasta que Alexander confirme.
```

Este archivo evita:

- que Codex invente lógica;
- que Claude Code asuma reglas;
- que desarrolladores creen comportamiento no aprobado;
- que Dashboard calcule datos falsos;
- que QA valide algo no definido;
- que producción tenga reglas contradictorias.

---

# 1. CÓMO USAR ESTE ARCHIVO

Cada decisión debe tener:

```text
ID
Tema
Módulo afectado
Estado
Pregunta pendiente
Opciones posibles
Recomendación técnica
Impacto si no se decide
Quién decide
Fecha decisión
Resultado final
```

Estados posibles:

```text
Pendiente
Confirmado
Descartado
Bloqueado
Futuro
```

Prioridades:

```text
P0 = bloquea desarrollo / producción
P1 = crítico operativo
P2 = importante pero no bloquea
P3 = futuro / mejora
```

---

# 2. DECISIONES P0 — BLOQUEAN PRODUCCIÓN

---

## DEC-P0-001 — Política de eliminación en producción

### Módulos afectados

- Dashboard
- Validación
- Data Model
- Cajas
- Incidencias
- Tareas
- Audit logs

### Estado

```text
Confirmado
```

### Pregunta pendiente

¿En producción se usará `soft delete`, `hard delete` o modelo híbrido?

### Contexto confirmado

Alexander quiere poder eliminar definitivamente datos de prueba para no ensuciar sistema ni Dashboard.

### Opciones

#### Opción A — Soft delete normal

- Registro queda en DB.
- Se marca como eliminado.
- Dashboard lo excluye.
- Audit log conserva trazabilidad.

#### Opción B — Hard delete Admin

- Registro desaparece físicamente.
- Dashboard recalcula.
- Requiere popup especial.
- Requiere audit log previo.

#### Opción C — Híbrido recomendado

- Soft delete en producción normal.
- Hard delete solo Admin / modo limpieza / pruebas.
- Siempre audit log.

### Recomendación técnica

```text
Opción C — híbrido.
```

### Impacto si no se decide

- Dashboard puede contar registros eliminados.
- Se pueden perder datos sin trazabilidad.
- QA no puede cerrar eliminación.
- Riesgo legal/auditoría.

### Quién decide

```text
Alexander
```

### Quién decidió

```text
Alexander
```

### Fecha decisión

```text
2026-05-04
```

### Resultado final

```text
Confirmado. Modelo híbrido.

- Soft delete como comportamiento normal en producción.
- Registros eliminados se marcan como eliminados y se excluyen de Dashboard,
  Validación operativa, listados activos y KPIs.
- Trazabilidad garantizada mediante audit log.
- Hard delete permitido solo para Admin.
- Hard delete solo en modo limpieza / datos de prueba / corrección excepcional.
- Antes de hard delete debe registrarse audit log previo con:
    - tabla afectada;
    - id del registro;
    - usuario que elimina;
    - fecha/hora;
    - motivo;
    - snapshot mínimo del registro si está disponible.
- Hard delete requiere confirmación fuerte en UI.
- Usuario lineal nunca puede eliminar definitivamente.
- Validador/Jefe no puede hard delete salvo permiso explícito futuro.
- No ejecutar SQL ahora.
- No tocar código ahora.
- No tocar Supabase ahora.
```

---

## DEC-P0-002 — Tabla definitiva para FIO

### Módulos afectados

- Validación
- Dashboard
- Data Model
- QA
- Bonus futuro

### Estado

```text
Confirmado
```

### Pregunta pendiente

¿FIO seguirá guardado dentro de `shifts` o se crea tabla propia?

### Estado actual

Actualmente FIO existe en:

```text
shifts.fio
shifts.gravedad_error
shifts.tipo_error
shifts.num_errores
shifts.error_employee_id
shifts.error_employee_nombre
```

### Problema

Esto sirve para fase inicial, pero no es ideal para:

- histórico;
- múltiples FIO por turno;
- estado gestionado/no gestionado;
- impacto bonus futuro;
- alertas;
- reportes mensuales.

### Opciones

#### Opción A — Mantener FIO en shifts

Más rápido, menos cambios. Riesgo: limitado para futuro.

#### Opción B — Crear `fio_records`

Más robusto.

Campos:

```text
id
shift_id
employee_id
error_employee_id
department_code
fecha
concepto_fio
severidad_fio
impacto_bonus
comentario_supervisor
creado_por
estado
created_at
resolved_at
```

### Recomendación técnica

```text
Crear fio_records y mantener campos actuales como compatibilidad temporal.
```

### Impacto si no se decide

- Dashboard FIO limitado.
- Alertas FIO críticas no gestionadas incompletas.
- Bonus futuro bloqueado.

### Quién decidió

```text
Alexander
```

### Fecha decisión

```text
2026-05-04
```

### Resultado final

```text
Confirmado.

- Crear fio_records como tabla definitiva para FIO.
- Mantener columnas actuales en shifts como compatibilidad temporal.
- No eliminar columnas actuales de shifts todavía.
- Dashboard y Validación deben migrar progresivamente a fio_records.
- Usuario lineal nunca crea FIO.
- Solo Admin / Validador / Jefe autorizado puede crear FIO.
- La migración debe ser faseada y documentada.
- No ejecutar SQL ahora.
- No tocar código ahora.
```

---

## DEC-P0-003 — Tabla definitiva para gestiones pendientes

### Módulos afectados

- CoreTurnos
- Cocina
- Sala
- Recepción Hotel
- Dashboard
- Validación
- QA

### Estado

```text
Confirmado
```

### Pregunta pendiente

¿Se crea tabla específica para gestiones pendientes?

### Problema actual

Gestión pendiente no debe mezclarse con:

- tareas;
- incidencias;
- observaciones;
- follow_up texto.

### Recomendación técnica

Crear:

```text
gestion_pendiente
```

Campos mínimos:

```text
id
shift_id
employee_id
department_code
fecha
servicio_turno
tipo_gestion
descripcion
estado
deadline
created_at
updated_at
closed_at
closed_by
```

### Impacto si no se decide

- Dashboard no puede contar gestiones correctamente.
- Follow-up no puede mantener gestiones abiertas.
- Validación no puede separar gestión/incidencia/tarea.
- QA queda bloqueado en gestiones.

### Quién decidió

```text
Alexander
```

### Fecha decisión

```text
2026-05-04
```

### Resultado final

```text
Confirmado.

- Crear gestion_pendiente como tabla separada.
- No mezclar gestiones con incidencias.
- No mezclar gestiones con tareas.
- No usar observaciones/follow_up para ocultar gestiones.
- Gestiones deben ser visibles hasta cierre.
- Deben alimentar Dashboard, Validación y Follow-up.
- La migración debe ser faseada.
- No ejecutar SQL ahora.
- No tocar código ahora.

Campos mínimos confirmados:
id, shift_id, employee_id, department_code, fecha, servicio_turno,
tipo_gestion, descripcion, estado, deadline, created_at, updated_at,
closed_at, closed_by.
```

---

## DEC-P0-004 — Fechas normalizadas en Supabase

### Módulos afectados

- Dashboard
- Data Model
- Cajas
- Tareas
- Incidencias
- Conciliaciones
- QA

### Estado

```text
Confirmado
```

### Problema

Muchas fechas están como `text`.

Ejemplos:

```text
shifts.fecha
incidencias.fecha
merma.fecha
tareas.deadline
sala_cash_closures.fecha
recepcion_cash.fecha
recepcion_ventas.fecha
```

### Pregunta pendiente

¿Se añaden columnas normalizadas tipo `date`?

### Recomendación técnica

Añadir sin romper campos existentes:

```sql
fecha_date date
deadline_date date
closed_at timestamptz
resolved_at timestamptz
```

### Impacto si no se decide

- Filtros por periodo pueden fallar.
- Dashboard puede calcular mal.
- Conciliación por fecha puede fallar.
- Tareas vencidas pueden fallar.

### Quién decidió

```text
Alexander
```

### Fecha decisión

```text
2026-05-04
```

### Resultado final

```text
Confirmado.

- Mantener campos text actuales por compatibilidad.
- Añadir columnas normalizadas sin romper campos actuales.
- Usar columnas normalizadas para Dashboard, filtros, orden cronológico, SLA y reporting.
- No eliminar campos actuales.
- Migración faseada con backfill y QA.
- No ejecutar SQL ahora.
- No tocar código ahora.

Columnas a añadir:
- fecha_date date
- deadline_date date
- created_at_ts timestamptz (si falta created_at real)
- updated_at_ts timestamptz (si aplica)
- closed_at timestamptz (para incidencias, gestiones y tareas cerradas/resueltas)
```

---

# 3. DECISIONES P1 — CRÍTICAS OPERATIVAS

---

## DEC-P1-001 — Fórmula económica de bonus

### Módulos afectados

- FIO
- Dashboard
- Validación
- Empleados
- Payroll futuro

### Estado

```text
Futuro / Pendiente
```

### Confirmado

De momento Dashboard solo debe mostrar:

- cantidad de FIO;
- severidad;
- si impacta bonus.

No debe calcular dinero todavía.

### Pregunta pendiente

¿Cómo se transforma FIO en impacto económico real?

Ejemplos:

```text
Baja = sin impacto
Media = revisión
Alta = parcial
Crítica = posible pérdida total
```

### Recomendación técnica

No implementar cálculo monetario hasta que Alexander defina fórmula.

### Impacto si no se decide

- No se puede automatizar bonus.
- Solo reporte informativo.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-002 — Severidad FIO y peso operativo

### Módulos afectados

- FIO
- Dashboard
- Validación
- Alertas

### Estado

```text
Pendiente parcial
```

### Confirmado

Severidades:

```text
Baja
Media
Alta
Crítica
```

Crítica = mayor impacto negativo.

### Pregunta pendiente

¿Cada severidad debe tener peso numérico interno?

Ejemplo:

```text
Baja = 1
Media = 2
Alta = 3
Crítica = 4
```

### Recomendación técnica

Sí, guardar peso numérico interno para dashboard futuro, sin mostrarlo al usuario lineal.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-003 — Estados finales de turnos

### Módulos afectados

- CoreTurnos
- Validación
- Dashboard
- QA

### Estado

```text
Parcialmente confirmado
```

### Estados confirmados

```text
Pendiente revisión
En corrección
Validado
Cerrado
```

### Pregunta pendiente

¿Quién puede pasar de `Validado` a `Cerrado`?

Opciones:

- Admin.
- Jefe departamento.
- Automático después de X tiempo.
- No usar `Cerrado` todavía.

### Recomendación técnica

Usar:

```text
Validado = aprobado operativo
Cerrado = bloqueo final / histórico
```

Solo Admin debe cerrar si no hay regla mejor.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-004 — Reapertura de turnos validados

### Módulos afectados

- Validación
- CoreTurnos
- Dashboard
- Audit logs

### Estado

```text
Pendiente
```

### Pregunta pendiente

¿Se permite reabrir un turno validado?

Opciones:

- No.
- Solo Admin.
- Admin + jefe departamento.
- Reapertura con motivo obligatorio.

### Recomendación técnica

Permitir solo Admin con motivo y audit log.

### Impacto si no se decide

- Correcciones post-validación no tienen flujo claro.
- Dashboard puede quedar inconsistente.

### Resultado final

```text
[NO DATA]
```

---

# 4. DECISIONES P1 — CAJAS Y CONCILIACIÓN

---

## DEC-P1-005 — Tabla canónica Caja Recepción Hotel

### Módulos afectados

- Caja Recepción Hotel
- Dashboard
- Validación
- Data Model

### Estado

```text
Pendiente técnico
```

### Problema

Existen dos tablas:

```text
recepcion_cash
recepcion_cash_closures
```

### Pregunta pendiente

¿Cuál será tabla canónica?

### Recomendación técnica

Usar:

```text
recepcion_cash
```

como canónica si es la que usa el flujo actual.

Mantener `recepcion_cash_closures` como legacy hasta migración.

### Impacto si no se decide

- Doble conteo en Dashboard.
- Conciliación incorrecta.
- QA no puede cerrar cajas recepción.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-006 — Fuente sistema Stripe SYNCROLAB

### Módulos afectados

- Caja SYNCROLAB
- Dashboard
- Validación
- Conciliación

### Estado

```text
Pendiente
```

### Confirmado

Stripe es conjunto para SYNCROLAB.

### Pregunta pendiente

¿Existe una fuente “Stripe sistema” para comparar contra Stripe real?

Campos propuestos:

```text
stripe_sistema_syncrolab
stripe_total_syncrolab
diferencia_stripe
```

### Recomendación técnica

Mientras no exista fuente sistema:

- registrar Stripe total;
- no generar error automático por diferencia Stripe;
- marcar `[NO DATA]`.

### Impacto si no se decide

- Stripe no puede validarse automáticamente.
- Dashboard solo muestra dato informativo.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-007 — Turnos exactos de SYNCROLAB

### Módulos afectados

- Turnos
- Caja SYNCROLAB
- Dashboard
- Validación

### Estado

```text
Pendiente
```

### Confirmado

SYNCROLAB cierra caja por turnos y tiene traspaso mediodía.

### Pregunta pendiente

¿Cuáles son los turnos oficiales?

Opciones:

```text
Mañana / Tarde
Turno 1 / Turno 2
Apertura / Cierre
```

### Recomendación técnica

Usar temporalmente:

```text
Mañana
Tarde
```

hasta confirmación.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-008 — Matching conciliación SYNCROLAB ↔ Recepción

### Módulos afectados

- Caja SYNCROLAB
- Caja Recepción
- Dashboard
- Conciliación

### Estado

```text
Confirmado parcialmente
```

### Confirmado

Matching:

```text
fecha + habitación + importe
```

SYNCROLAB no tiene reserva MEWS.

### Pregunta pendiente

¿Qué pasa si hay varios cargos iguales en misma habitación y fecha?

Opciones:

- pedir tipo servicio;
- pedir hora;
- pedir comentario;
- permitir múltiples y revisar manualmente.

### Recomendación técnica

Añadir al matching opcional:

```text
tipo_servicio
created_at/hora
```

sin hacerlo obligatorio todavía.

### Resultado final

```text
[NO DATA]
```

---

# 5. DECISIONES P1 — RECEPCIÓN HOTEL

---

## DEC-P1-009 — Schema definitivo de `rec_shift_data`

### Módulos afectados

- Recepción Hotel
- Dashboard
- Validación
- QA

### Estado

```text
Pendiente técnico
```

### Problema

Se conocen los KPIs de negocio, pero no se ha confirmado schema completo de DB.

KPIs:

- check-ins;
- check-outs;
- reservas gestionadas;
- reservas pendientes;
- desayunos ofrecidos;
- desayunos vendidos;
- emails revisados;
- WhatsApp revisado;
- llamadas revisadas;
- leads Bitrix24;
- clientes insatisfechos.

### Pregunta pendiente

¿Dónde se guarda cada KPI?

### Recomendación técnica

Crear o confirmar tabla:

```text
rec_shift_data
```

con columnas explícitas.

### Impacto si no se decide

- Dashboard Recepción queda parcial.
- QA no puede validar KPI reales.
- Validación no puede bloquear datos incompletos.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P1-010 — Clientes insatisfechos y FIO automático

### Módulos afectados

- Recepción Hotel
- Validación
- FIO
- Dashboard

### Estado

```text
Confirmado negocio / pendiente implementación
```

### Confirmado

```text
Cliente insatisfecho = Sí
y
Informado responsable = No
→ FIO automático / obligatorio
```

### Pregunta pendiente

¿El sistema debe crear el FIO automáticamente o bloquear validación hasta que validador lo cree?

### Recomendación técnica

Bloquear validación y exigir FIO por Admin/Validador, no crear FIO invisible.

### Resultado final

```text
[NO DATA]
```

---

# 6. DECISIONES P2 — INTEGRACIONES

---

## DEC-P2-001 — Integración MEWS

### Módulos afectados

- Recepción Hotel
- Caja Recepción
- Conciliación
- Dashboard

### Estado

```text
Futuro / [NO DATA]
```

### Pregunta pendiente

¿Se conectará API MEWS o será manual?

### Impacto

Sin integración:

- datos se introducen manualmente;
- conciliación depende del usuario;
- QA valida solo sistema interno.

---

## DEC-P2-002 — Integración POSMEWS

### Módulos afectados

- Caja Sala
- Dashboard
- Conciliación

### Estado

```text
Futuro / [NO DATA]
```

### Pregunta pendiente

¿POSMEWS se integrará automáticamente?

---

## DEC-P2-003 — Integración Nubimed

### Módulos afectados

- Caja SYNCROLAB
- Clínica
- Dashboard

### Estado

```text
Futuro / [NO DATA]
```

### Pregunta pendiente

¿Nubimed se integrará automáticamente o se carga manualmente?

---

## DEC-P2-004 — Integración FlyBy

### Módulos afectados

- Caja SYNCROLAB
- Dashboard

### Estado

```text
Futuro / [NO DATA]
```

### Pregunta pendiente

¿FlyBy se integrará automáticamente o se carga manualmente?

---

## DEC-P2-005 — Integración Bitrix24

### Módulos afectados

- Tareas
- Leads
- Recepción Hotel
- Dashboard

### Estado

```text
Futuro / [NO DATA]
```

### Pregunta pendiente

¿Las tareas/leads se sincronizan con Bitrix24 o se replican manualmente?

---

# 7. DECISIONES P2 — ALERTAS

---

## DEC-P2-006 — Niveles de alerta

### Módulos afectados

- Dashboard
- Validación
- QA

### Estado

```text
Pendiente
```

### Pregunta pendiente

¿Todas las alertas pesan igual?

Tipos actuales:

- turno no validado;
- incidencia abierta;
- incidencia >24h;
- incidencia >48h;
- FIO crítico;
- caja con diferencia;
- conciliación con diferencia;
- tarea vencida.

### Recomendación técnica

Usar:

```text
Info
Warning
Crítica
```

### Resultado final

```text
[NO DATA]
```

---

## DEC-P2-007 — Caducidad de alertas históricas

### Módulos afectados

- Dashboard
- alert_logs
- QA

### Estado

```text
Pendiente
```

### Confirmado

Alertas activas desaparecen al resolver, pero histórico queda.

### Pregunta pendiente

¿Cuánto tiempo se conserva histórico visible?

Opciones:

- siempre;
- 12 meses;
- 24 meses;
- archivado.

### Recomendación técnica

Guardar siempre en DB, mostrar filtro por periodo.

### Resultado final

```text
[NO DATA]
```

---

# 8. DECISIONES P2 — UI/UX

---

## DEC-P2-008 — Edición de turno por usuario después de guardar

### Módulos afectados

- Turnos
- Sala
- Cocina
- Recepción
- SYNCROLAB

### Estado

```text
Confirmado parcial
```

### Confirmado

Usuario puede editar durante 30 minutos en Sala.

### Pregunta pendiente

¿Aplica a todos los departamentos?

### Recomendación técnica

Usar misma regla global:

```text
30 minutos tras guardar
```

salvo excepciones.

### Resultado final

```text
[NO DATA]
```

---

## DEC-P2-009 — Botón Info

### Módulos afectados

- UI global
- Cocina
- Sala
- Recepción
- Admin

### Estado

```text
Confirmado diseño
```

### Confirmado

Info debe ir a la derecha junto a:

- nombre usuario;
- departamento;
- salir.

### Pregunta pendiente

¿Qué contenido exacto muestra Info?

### Resultado final

```text
[NO DATA]
```

---

# 9. DECISIONES P3 — FUTURAS

---

## DEC-P3-001 — Biblioteca productos Cocina

### Módulos afectados

- Cocina
- Mermas
- Dashboard costes

### Estado

```text
Futuro
```

### Confirmado

Actualmente productos se escriben a mano.

### Pregunta pendiente

¿Crear catálogo de productos?

Campos posibles:

```text
id
nombre_producto
unidad_default
coste_unitario
activo
```

### Resultado final

```text
[NO DATA]
```

---

## DEC-P3-002 — Dashboard bonus avanzado

### Módulos afectados

- Dashboard
- FIO
- Empleados

### Estado

```text
Futuro
```

### Pregunta pendiente

¿Cómo calcular bonus mensual?

### Resultado final

```text
[NO DATA]
```

---

# 10. PROMPT TÉCNICO PARA CODEX / CLAUDE CODE

Contexto:
Este archivo contiene decisiones pendientes de SYNCROSFERA / SynchroShift. No debe implementarse ninguna lógica marcada como `[NO DATA]` sin confirmación de Alexander.

Objetivo:
Antes de desarrollar una funcionalidad, revisar `09_DECISIONS_PENDING.md` y comprobar si hay decisiones abiertas que afectan al módulo.

Reglas:
1. Si una decisión está Pendiente, no inventar comportamiento.
2. Si es P0, no avanzar a producción.
3. Si es P1, marcar riesgo y pedir confirmación.
4. Si es P2/P3, puede dejarse como futuro si no bloquea.
5. Si se toma una decisión, actualizar este archivo:
   - Estado.
   - Resultado final.
   - Fecha.
   - Quién decidió.

No romper:
- Dashboard.
- Validación.
- Cajas.
- Turnos.
- Data Model.
- QA.

Salida esperada:
- Lista de decisiones afectadas por el cambio.
- Riesgos.
- Recomendación.
- Campos `[NO DATA]` mantenidos si no hay confirmación.
