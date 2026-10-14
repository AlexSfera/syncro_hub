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

## Estados visibles

- `Borrador`: todavía editable y sin solicitud.
- `Pendiente de carga`: solicitud registrada; Alexander ha sido avisado.
- `En proceso en Mac Mini`: el ejecutor local está trabajando.
- `Verificado en Bitrix`: la lectura posterior coincide con la versión pedida.
- `Error`: la carga o la verificación falló y requiere revisión.

Nunca se mostrará `Publicado` solo por guardar el borrador o enviar el aviso.

## Ejecución desde Mac Mini

Cuando Alexander recibe el aviso, abre la cola de publicación en SYNCRO SHIFT
y pulsa `Procesar en Mac Mini`. Un ejecutor local, limitado a la sesión abierta
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
`IMPLEMENTADOS` y `TESTEADOS` localmente. La revisión GitHub es
`0b345acbd34e3ba6dc3b20dafae52189a19921bb` y su Preview Vercel
`dpl_3cosiVymzG9gqaPdAo4UVCAb7Lbm` está `READY`. La comprobación HTTP remota
recibe el `403` previsto del control de IP, por lo que la interfaz autenticada
y el aviso real siguen sin verificar. El ejecutor Mac Mini y la prueba real de
extremo a extremo también siguen pendientes; por ello el flujo completo no es
`VERIFICADO` ni `PRODUCCIÓN`.
