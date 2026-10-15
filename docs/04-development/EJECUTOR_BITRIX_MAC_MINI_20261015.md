# SYNCRO SHIFT — ejecutor de turnos Bitrix en Mac Mini

## Estado al 15/10/2026

`IMPLEMENTADO` en la rama de trabajo y `PRODUCCIÓN` para la web en el deployment
`dpl_F3iSTYnLFpHeH2fCMxvXKrNsMQJb` (commit `b78b517`). `TESTEADO` en
pruebas locales de API/lógica y consulta autenticada de la cola en Producción:
HTTP 200, sin solicitudes automáticas pendientes. El agente `launchd` del Mac
Mini está activado y terminó una ejecución con código 0 y `NO_PENDING_JOB`.
`NO VERIFICADO` para escritura LIVE de un turno y `NO ACTIVADO` el flag de
solicitudes automáticas hasta completar el acceso dedicado a Bitrix y la
semana de prueba. El antiguo equipo HP no interviene.

## Recorrido previsto

1. La jefa guarda una semana. `Solicitar carga en Bitrix` comprueba en el
   servidor que las siete fechas de todas las personas activas del departamento,
   incluida la jefa, están clasificadas. Si falta alguna, devuelve un modal
   con nombre y fecha y no crea solicitud.
2. Con la semana completa y catálogo fresco, registra una solicitud
   append-only. Cuando el ejecutor esté **activado** en Producción, no enviará
   una tarea manual para cada solicitud; la cola segura atenderá la petición.
3. El Mac Mini consulta la cola con una credencial dedicada. La API reconstruye
   la versión vigente y vuelve a validar cobertura, permisos de catálogo,
   empleado y horario. En la primera fase solo acepta el horario Bitrix 33 de
   Recepción SyncroLab.
4. El navegador dedicado del Mac hace una comprobación previa de toda la semana.
   Ante un turno diferente, una celda no única o falta de sesión, no sobrescribe
   nada. Si no hay conflictos, añade únicamente los turnos que faltan y vuelve
   a leer el plan de Bitrix para verificarlos.
5. El resultado se añade al log inmutable y se presenta en la semana. Una
   solicitud o aviso jamás equivalen a turno publicado.

## Límites de esta primera fase

- Bitrix no documenta una API REST de escritura de `ShiftPlan`; la operación
  se realiza mediante la interfaz del portal con Chrome del Mac Mini. Si
  Bitrix cambia la interfaz, el ejecutor se detiene y no debe improvisar un
  selector.
- Descanso se representa como ausencia de turno. Vacaciones, bajas, festivos y
  recuperación de festivo necesitan además el gráfico de ausencias de Bitrix;
  esta primera fase **no** los escribe. Por tanto una semana con esas jornadas
  queda `partial`, aunque sus turnos estén verificados. No se debe anunciar
  sincronización integral ni marcar `publicado_bitrix`.
- La regla de recuperación con festivo origen y acreditación del trabajo real
  sigue documentada, no implementada. Requiere esquema y fuente verificable.
- La sesión de Bitrix debe iniciarse una vez en el perfil dedicado de Chrome.
  El Mac Mini debe estar encendido, con conexión a Internet y sesión vigente.
  Si se cierra la sesión o hay conflicto, se registra error y se requiere
  intervención; no se pide a Alexander un comando semanal.
- Las solicitudes antiguas, no marcadas como automáticas, quedan fuera de esta
  cola. No se completan inventando jornadas. Una nueva versión completa
  necesita una nueva solicitud de la jefa.

## Configuración y reversión

- Credencial: `SYNCRO_PLANNING_EXECUTOR_TOKEN` en Vercel Producción y fichero
  local `~/Library/Application Support/SYNCRO SHIFT Executor/executor-token`
  con permisos 0600. Nunca se copia la clave de servicio de Supabase al Mac.
- El flag `SYNCRO_PLANNING_EXECUTOR_ENABLED=true` solo se pondrá tras verificar
  que el agente local está operativo. Sin flag, el flujo de aviso anterior
  permanece vigente.
- El instalador usa el Node firmado del runtime de Codex y prepara Playwright
  local. `--activate` registra
  `~/Library/LaunchAgents/com.syncrosfera.syncroshift-executor.plist` con
  intervalo de 60 segundos. `launchctl bootout gui/<uid> <plist>` lo detiene;
  no elimina registros ni turnos ya escritos.
- Para revertir la web, promover el deployment de Producción anterior y retirar
  el flag. Para revocar el canal seguro, eliminar/rotar la variable de Vercel y
  retirar el fichero local. No se borra `planificacion_sync_log`.
