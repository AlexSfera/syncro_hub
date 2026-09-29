# Planificación Horaria — especificación de implementación v1

**Producto:** SYNCRO SHIFT / SYNCRO HUB

**Fecha de corte:** 30/09/2026

**Rama:** `codex/planificacion-horaria-v1`

**Estado:** implementado y probado en local; migración Supabase LIVE no aplicada
**Publicación futura en Bitrix24:** bloqueada hasta disponer de una API oficial documentada de escritura de ShiftPlan

## Resultado concreto

El módulo añade una pantalla completa de planificación semanal, accesible desde
Horas Mensuales y desde la navegación general. Permite:

- consultar el cuadrante por departamento y semana;
- preparar borradores con turnos oficiales de Bitrix24;
- combinar dos turnos oficiales como turno partido;
- registrar descansos, festivos, vacaciones y ausencias;
- rectificar la tipología de una ausencia con versión y motivo;
- configurar convenio, vigencia, fecha real de contrato y porcentaje de jornada;
- registrar horas extra y recuperación sin autoasignación ni autoaprobación;
- conservar versiones, snapshots, sincronizaciones y auditoría append-only;
- mostrar `[NO DATA]` cuando faltan condiciones laborales o saldos certificados.

La planificación no altera ni sustituye fichajes reales. Los fichajes continúan
procediendo de la integración Timeman existente.

## Alcance de Bitrix24

### Lectura soportada

El catálogo utiliza únicamente `timeman.schedule.get`. La lectura conserva:

- ID del horario;
- ID estable de cada turno;
- nombre visible;
- inicio, fin y cruce de medianoche;
- descanso;
- estado activo/eliminado;
- calendario y exclusiones;
- momento y resultado de la última lectura.

La sincronización se ejecuta al abrir la pantalla para un perfil editor, bajo
demanda, cada cinco minutos mientras la pantalla permanece abierta y antes de
comprobar la publicación. Un turno ausente en una lectura posterior queda
inactivo antes de aceptar nuevas asignaciones.

### Mapeo inicial verificado

| Departamento | Horario Bitrix24 | Uso |
|---|---:|---|
| Cocina | 55 | principal_departamento |
| Sala | 47 | principal_departamento |
| Housekeeping | 41 | principal_departamento |
| Mantenimiento | 63 | principal_departamento |
| Recepción SYNCROLAB | 33 | principal_departamento |
| Recepción | 35 | principal_departamento |
| Fisioterapeutas | 51 | principal_departamento |
| RRHH | 91 | principal_departamento |
| Comercial | 43 | principal_departamento |
| Marketing | 45 | principal_departamento |
| Dirección Comercial | 95 | principal_departamento |
| C&C | 87 | principal_departamento |
| Todos | 85 | extra_recuperacion |

Los horarios individuales permanecen fuera del mapeo automático hasta tener
una regla inequívoca por empleado. No se modifica configuración LIVE.

### Escritura no soportada

No existe evidencia de un método REST oficial documentado para crear, cambiar o
eliminar asignaciones futuras de ShiftPlan. Por seguridad:

- no se usan automatizaciones por clics;
- no se usan endpoints internos del componente cliente;
- no se marca una semana como publicada;
- cada intento de comprobación registra el bloqueo seguro
  `BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO`.

La integración solo podrá considerarse cerrada tras crear, volver a leer,
comparar y revertir una asignación real desde SYNCRO SHIFT.

## Permisos

| Perfil | Publicado global | Borrador propio | Edición global | Rectificación trabajada | Condición laboral |
|---|---:|---:|---:|---:|---:|
| Empleado | Sí | No | No | No | No |
| Jefe/coordinador | Sí | Sí, en su ámbito | No | No | No |
| Técnico RRHH | Sí | Sí | Sí | Sí | Sí |
| Adjunto directivo | Sí | Sí | Sí | Sí | Sí |
| Admin | Sí | Sí | Sí | Sí | Sí |

Las equivalencias de ámbito incluyen Cocina/Friegue,
Housekeeping/Limpieza y Recepción/Recepción SFERA. Los subámbitos SYNCROLAB se
mantienen separados para evitar mezcla de catálogos.

Un jefe no puede crear ni aprobar movimientos extra/recuperación para sí mismo.
Los movimientos de responsables solo pueden ser creados por la persona
autorizada mediante `ANGELICA_EMPLOYEE_ID`; si falta este ID, la operación se
bloquea como `[NO DATA]` operativo.

## Modelo y trazabilidad

La migración crea:

- `convenios` y `convenio_versiones`;
- `empleado_condiciones_laborales` con vigencia temporal;
- `bitrix_horarios_departamento` y `bitrix_turnos_catalogo`;
- `planificacion_semanas`, `planificacion_versiones`,
  `planificacion_asignaciones` y `planificacion_tramos`;
- `planificacion_ausencias` y `festivos_calendario`;
- `vacaciones_movimientos` por empleado y ejercicio;
- `extra_recuperacion_movimientos` y `planificacion_aprobaciones`;
- `planificacion_sync_log` y `planificacion_audit`.

El guardado semanal es atómico mediante una RPC `security invoker`, exige
versión esperada y crea una versión nueva. Los IDs Bitrix se vuelven a resolver
en servidor y se guardan como snapshot confiable; el cliente no decide esos
identificadores.

Las tablas nuevas tienen RLS activado, sin acceso directo para `anon` ni
`authenticated`. El acceso operativo se realiza exclusivamente desde las APIs
autorizadas del backend. Versiones, movimientos de vacaciones, log de
sincronización y auditoría impiden `UPDATE` y `DELETE` mediante trigger.

## Convenios y vacaciones

Reglas iniciales:

- Hostelería Alicante 2023–2026: 31 días naturales/año;
- Instalaciones Deportivas 2024: 23 días laborables/año.

Para un alta durante el ejercicio:

`derecho = base anual × días activos en el ejercicio / días del ejercicio`

La fecha base es la fecha real de inicio de contrato. La fecha de activación en
Bitrix24 se conserva solo como referencia y nunca sustituye al contrato. El
porcentaje de jornada se registra, pero no reduce automáticamente el número de
días de vacaciones. Los cambios de convenio o jornada generan una nueva
vigencia y no reescriben el histórico.

Sin condición laboral o movimientos de apertura certificados, el saldo es
`[NO DATA]`, no cero.

## Excel de apertura

La plantilla corregida mantiene 65 filas del inventario recibido fuera del
repositorio y añade explícitamente:

- fecha real de inicio de contrato;
- fecha de cumplimentación;
- cálculo proporcional desde el contrato;
- separación de pendientes 2025 y 2026;
- estado de completitud por fila;
- validaciones y campos editables diferenciados.

No se incorpora al repositorio porque contiene datos personales. La importación
de saldos permanece pendiente hasta recibir, certificar y autorizar los datos.

## Migración y reversión

Archivos:

- `supabase/migrations/20260929223545_planificacion_horaria_v1.sql`
- `supabase/migrations/20260929224043_planificacion_horaria_v1_fk_indexes.sql`
- `supabase/rollback/20260929223545_planificacion_horaria_v1_rollback.sql`

El rollback elimina un esquema recién creado y sin datos operativos. Si detecta
condiciones laborales, catálogo leído, planificación, ausencias, festivos,
movimientos, logs o auditoría, se detiene y enumera las tablas pobladas. Nunca
borra datos operativos silenciosamente.

## Evidencia de prueba local

Validado con PostgreSQL 17 aislado:

1. migración completa;
2. rollback limpio;
3. reaplicación completa;
4. guardado atómico de semana y tramo;
5. snapshots Bitrix;
6. bloqueo DB de autoasignación;
7. auditoría append-only;
8. bloqueo de rollback con datos operativos.

Las pruebas JavaScript cubren calendario semanal, medianoche, turnos partidos,
solapes, ambos convenios, prorrateo, ventana de 28 días, ámbitos, permisos,
catálogo oficial, RLS y bloqueo seguro de publicación.

## Puerta antes de LIVE

Antes de aplicar la migración en Supabase LIVE se requiere autorización
específica. El plan será:

1. conservar backup y referencia de reversión;
2. aplicar exactamente la migración probada;
3. comprobar tablas, grants, RLS, funciones y seeds;
4. validar APIs y perfiles en Preview;
5. promover el deployment inmutable probado;
6. verificar el dominio público y logs;
7. no marcar `DONE` mientras la escritura oficial ShiftPlan siga bloqueada.
