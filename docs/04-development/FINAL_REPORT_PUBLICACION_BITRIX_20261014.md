# SYNCRO SHIFT — publicación asistida y prueba real, 14/10/2026

## Resultado

`PARCIAL`. La versión autorizada está en Producción y la solicitud de carga se
registra, pero la prueba de extremo a extremo **no** ha sido superada: el aviso
automático de Bitrix falla y no se ha realizado ninguna escritura de turnos
desde SYNCRO SHIFT.

## Resumen sencillo

Lucrezia debe guardar el borrador y pulsar `Solicitar carga en Bitrix`. Esa
tecla deja una solicitud pendiente; no publica por sí sola. Alexander debe
recibir un aviso en Bitrix y procesar la carga desde su Mac Mini. La prueba
demostró que la primera parte funciona y la segunda no. El ejecutor local
todavía no existe. El antiguo equipo HP está retirado.

## Cambios realizados

- `api/planning/publish.js`: devuelve código y estado seguros del error de
  notificación y registra método/HTTP/código en runtime sin claves ni datos
  personales.
- `lib/planning-server.js`: expone en el bootstrap si hubo aviso Bitrix
  confirmado para la versión de la semana.
- `planificacion_horaria.js`: diferencia solicitud pendiente de aviso enviado
  y conserva el último error de reintento en pantalla.
- Documentación de estado y flujo actualizada con la observación LIVE.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sintaxis y suite completa | PASS | 238 pruebas correctas, 0 fallos, 1 integración omitida |
| Preview y Producción | PASS | Deployments READY; `syncro-shift.vercel.app` apunta a la revisión citada |
| Solicitud real 19–25/10, Recepción SYNCROLAB v4 | PASS parcial | `planificacion_sync_log` id 515, `pendiente_mac_mini`, una sola solicitud |
| Aviso automático en Bitrix | FAIL | Reintento LIVE: `tasks.task.list` respondió HTTP 401 `insufficient_scope`; `notification_sent=false`, sin `notificar_carga_bitrix` ni tarea `[SYNCROSHIFT` para Alexander |
| Transferencia de turnos desde SYNCRO SHIFT | NO VERIFICADA | La aplicación no tiene escritura ShiftPlan; los cinco turnos de Lucrezia ya figuraban en la captura previa |
| Clasificación completa de la semana | FAIL | Maria Fernanda conserva siete días sin registrar |
| Retirada de ausencias de prueba | PENDIENTE | Seis entradas `PRUEBA` de Fabián/Kevin siguen visibles en Bitrix |

## Publicación

- Rama: `codex/planificacion-jornadas-saldos-20261014`; `main` no se fusionó.
- Código GitHub: `2bda03f2fbd33a3edbf7774f10867b471e2a30a0`.
- Preview: `dpl_EuqkLqdFH2hYpxAWDpL3MBiCWadS`, READY.
- Producción: `https://syncro-shift.vercel.app/`,
  `dpl_9ikrFVzt42wkpA2Z8tgBUY4fHqYe`, READY.

## Datos y sistemas externos

Supabase LIVE recibió únicamente el registro operativo autorizado de la
solicitud (id 515); no hubo migraciones, cambios de permisos ni backfill.
Bitrix24 no recibió un aviso confirmado ni turnos por este flujo. Sus entradas
`PRUEBA` existentes no se eliminaron. GitHub y Vercel sí cambiaron según los
identificadores anteriores.

## Reversión

Promover el deployment anterior
`dpl_Fr4uAh58JytkS8Q85bDMwRyZkpgw` para revertir el diagnóstico de
interfaz/API. La solicitud id 515 es registro de auditoría append-only y no
debe borrarse. Esto no requiere SQL.

## No verificado

- Aviso real a Alexander, ejecución local desde Mac Mini, escritura y
  relectura de ShiftPlan, prueba de otro responsable y tiempo de carga.
- Retirada de las seis ausencias de prueba.

## Decisión necesaria de Alexander

El último reintento diagnóstico se realizó y confirmó falta de permiso `task`
en la credencial Bitrix de la web. Alexander debe autorizar por separado añadir
el permiso mínimo de Tareas y actualizar la credencial en Vercel, sin divulgar
el secreto. Después habrá que repetir el aviso y construir/probar el ejecutor
local del Mac Mini: corregir el aviso **no** volcará turnos. Antes de una carga
semanal completa, completar o excluir con criterio explícito los siete días sin
registrar de Maria Fernanda.
