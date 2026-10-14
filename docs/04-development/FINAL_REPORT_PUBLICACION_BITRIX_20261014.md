# SYNCRO SHIFT — publicación asistida y prueba real, 14/10/2026

## Resultado

`PARCIAL`. La versión autorizada está en Producción, la solicitud de carga se
registra y el aviso a Alexander ya llegó a Bitrix. La prueba de extremo a
extremo **no** ha sido superada: no se ha realizado ninguna escritura de turnos
desde SYNCRO SHIFT.

## Resumen sencillo

Lucrezia debe guardar el borrador y pulsar `Solicitar carga en Bitrix`. Esa
tecla deja una solicitud pendiente; no publica por sí sola. Alexander debe
recibir un aviso en Bitrix y procesar la carga desde su Mac Mini. Tras corregir
el permiso, la prueba demostró que la solicitud y el aviso funcionan; la carga
de turnos sigue pendiente. El ejecutor local
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
| Aviso automático en Bitrix | VERIFICADO LIVE tras corrección | El intento inicial falló con HTTP 401 `insufficient_scope`; tras añadir `task` al webhook 209, la web mostró «aviso enviado» y el conector Bitrix encontró la tarea 66445, asignada a Alexander, para Recepción SYNCROLAB 19–25/10 v4 |
| Transferencia de turnos desde SYNCRO SHIFT | NO VERIFICADA | La aplicación no tiene escritura ShiftPlan; los cinco turnos de Lucrezia ya figuraban en la captura previa |
| Clasificación completa de la semana | FAIL | Maria Fernanda conserva siete días sin registrar |
| Retirada de ausencias de prueba | VERIFICADA LIVE | Desaparecieron las seis entradas `PRUEBA` de Fabián/Kevin: 9305, 9299, 9307, 9301, 9297 y 9303. Permanece la vacación real de Andreea |

## Publicación

- Rama: `codex/planificacion-jornadas-saldos-20261014`; `main` no se fusionó.
- Código GitHub: `2bda03f2fbd33a3edbf7774f10867b471e2a30a0`.
- Preview: `dpl_EuqkLqdFH2hYpxAWDpL3MBiCWadS`, READY.
- Producción: `https://syncro-shift.vercel.app/`,
  `dpl_9ikrFVzt42wkpA2Z8tgBUY4fHqYe`, READY.

## Datos y sistemas externos

Supabase LIVE recibió el registro operativo autorizado de la solicitud
(id 515); no hubo migraciones ni backfill. Bitrix24 recibió el aviso en la tarea
66445 y se eliminó exclusivamente el conjunto de seis ausencias `PRUEBA`
identificadas. Se añadió `task` al webhook 209, conservando `user` y `timeman`.
No se escribieron turnos por este flujo. La credencial Vercel no se modificó:
el intento LIVE exitoso confirma que la ya configurada siguió funcionando.
GitHub y Vercel cambiaron anteriormente según los identificadores citados;
esta corrección operativa no requirió un nuevo deployment.

## Reversión

Promover el deployment anterior
`dpl_Fr4uAh58JytkS8Q85bDMwRyZkpgw` para revertir el diagnóstico de
interfaz/API. La solicitud id 515 es registro de auditoría append-only y no
debe borrarse. Esto no requiere SQL.

## No verificado

- Ejecución local desde Mac Mini, escritura y relectura de ShiftPlan, prueba
  de otro responsable y tiempo de carga.

## Decisión necesaria de Alexander

Queda construir y probar el ejecutor local del Mac Mini: reparar el aviso
**no** vuelca turnos. Antes de una carga semanal completa, completar o excluir
con criterio explícito los siete días sin registrar de Maria Fernanda.
El webhook 209 se puede revertir quitando solo `task`, pero eso volvería a
romper el aviso. La tarea 66445 es un registro operativo pendiente, no una
prueba que deba confundirse con una carga realizada. Los seis borrados de
ausencias en Bitrix no tienen reversión automática; habría que recrear sus
datos de prueba si fueran necesarios.
