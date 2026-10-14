# Flujo de publicación de horarios en Bitrix24 desde Mac Mini

## Decisión operativa

El único equipo de ejecución es el Mac Mini de Alexander. El equipo HP está
retirado y no forma parte del sistema.

Los responsables de departamento no publican directamente en Bitrix24. Su
responsabilidad termina en SYNCRO SHIFT mediante dos acciones explícitas:

1. `Guardar borrador`.
2. `Solicitar carga en Bitrix`.

La segunda acción debe validar la semana, registrar una solicitud idempotente
en `planificacion_sync_log` y crear un aviso o tarea de Bitrix24 asignado a
Alexander (usuario Bitrix24 `1`). El aviso debe incluir departamento, semana,
versión, solicitante y enlace a SYNCRO SHIFT, pero no necesita listar datos
personales ni horarios individuales.

## Estados objetivo (no todos implementados)

- `Borrador`: todavía editable y sin solicitud.
- `Pendiente de carga`: solicitud registrada; el aviso a Alexander se muestra
  por separado como enviado o fallido.
- `En proceso en Mac Mini`: el ejecutor local está trabajando.
- `Verificado en Bitrix`: la lectura posterior coincide con la versión pedida.
- `Error`: la carga o la verificación falló y requiere revisión.

Nunca se mostrará `Publicado` solo por guardar el borrador o enviar el aviso.

## Ejecución prevista desde Mac Mini (aún no implementada)

Cuando Alexander reciba el aviso, deberá abrir la cola de publicación en SYNCRO SHIFT
y pulsar un futuro control `Procesar en Mac Mini`. Un ejecutor local, limitado a la sesión abierta
de Bitrix24, aplica la versión solicitada mediante la interfaz oficial, vuelve
a leer la cuadrícula y compara empleado, fecha y turno antes de marcarla como
verificada.

El ejecutor debe ser idempotente, detenerse ante sesión caducada o diferencias
inesperadas, y no utilizar endpoints internos no documentados. Las ausencias y
los turnos normales deben tratarse como operaciones distintas.

## Límites confirmados

La API REST oficial documentada de horarios solo expone
`timeman.schedule.get`. No existe método oficial documentado para escribir el
ShiftPlan. Por ello, el backend de Vercel no puede completar por sí solo la
carga de turnos. El aviso sí puede crearse mediante la API oficial de tareas de
Bitrix24 (`tasks.task.add`).

## Criterio de terminado

El flujo estará terminado cuando una prueba etiquetada pueda recorrer:

`jefe solicita -> Alexander recibe aviso -> Mac Mini carga -> Bitrix se relee
-> coincidencia verificada -> prueba eliminada`.

El botón, la cola idempotente y la creación/reutilización del aviso Bitrix están
`IMPLEMENTADOS` y `TESTEADOS` localmente. La revisión GitHub inicial era
`0b345acbd34e3ba6dc3b20dafae52189a19921bb` y su Preview Vercel
`dpl_3cosiVymzG9gqaPdAo4UVCAb7Lbm` está `READY`. La comprobación HTTP remota
recibe el `403` previsto del control de IP, por lo que la interfaz autenticada
y el aviso real siguen sin verificar. El ejecutor Mac Mini y la prueba real de
extremo a extremo también siguen pendientes; por ello el flujo completo no es
`VERIFICADO` ni `PRODUCCIÓN`.

## Resultado de la prueba LIVE posterior, 14/10/2026

Alexander autorizó la promoción. Producción sirve el código
`2bda03f2fbd33a3edbf7774f10867b471e2a30a0` en
`dpl_9ikrFVzt42wkpA2Z8tgBUY4fHqYe` (READY). La semana de Recepción
SYNCROLAB 19–25/10/2026, versión 4, genera una sola solicitud auditada
(`planificacion_sync_log` id 515), pero el aviso mediante `tasks.task.list/add`
falló con `BITRIX_READ_FAILED`: no hay confirmación de tarea ni registro de
`notificar_carga_bitrix`. El último reintento autorizado mostró en el runtime
de Producción `tasks.task.list`, HTTP 401, `insufficient_scope`. Una búsqueda
de tareas `[SYNCROSHIFT` asignadas a Alexander devolvió cero resultados. Falta
autorizar y configurar el permiso mínimo de Tareas en la credencial Bitrix;
esto resolvería solo el aviso, no la escritura de turnos.

La lectura de ShiftPlan muestra cinco turnos de Lucrezia coincidentes con el
borrador, pero la captura anterior ya los mostraba. Por tanto, no existe
evidencia de que SYNCRO SHIFT los volcara. El ejecutor Mac Mini continúa sin
implementarse. La pantalla distingue el aviso fallido y no declara la semana
publicada. Maria Fernanda conserva siete jornadas sin registrar. Los seis
registros de ausencia `PRUEBA` de Fabián y Kevin siguen presentes; no se
consideran resultado de esta publicación.
