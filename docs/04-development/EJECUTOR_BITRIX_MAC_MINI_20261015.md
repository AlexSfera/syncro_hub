# SYNCRO SHIFT — ejecutor de turnos Bitrix en Mac Mini

## Estado comprobado el 16/10/2026

`IMPLEMENTADO` y `PRODUCCIÓN` para la solicitud automática **solo** del horario
Bitrix 33 de Recepción SYNCROLAB: rama `codex/bitrix-auto-publish-20261016`,
commit remoto `f8a9513`, deployment `dpl_93Mn9EhiUgYwqj7p2t5ToM7XCYVs`
READY en `syncro-shift.vercel.app`. El flag de producción
`SYNCRO_PLANNING_EXECUTOR_ENABLED=true` está configurado; los demás horarios
conservan el aviso manual. El Mac Mini ejecuta el LaunchAgent cada 60 segundos,
la sesión dedicada de Chrome respondió `BITRIX_SESSION_READY`, y las últimas
consultas devolvieron `NO_PENDING_JOB`. Suite: 243 PASS, 0 FAIL, 1 OMITIDA.

`NO VERIFICADO`: ninguna solicitud automática real ha escrito un turno en
Bitrix. La semana 19–25/10 de Recepción SYNCROLAB sigue en versión 4 con 28/35
jornadas: la ficha activa de María Fernanda tiene el vínculo Bitrix 25033 pero
carece de sus siete asignaciones guardadas. La solicitud antigua de versión 4
era manual y no se convierte retroactivamente en automática. Se detectaron
turnos preexistentes incompatibles: Fabián el 21/10 (Bitrix 13:15–21:15 frente
a SYNCRO SHIFT 08:00–16:00) y Lucrezia el 25/10 (Bitrix 09:00–14:00 frente a
descanso). El ejecutor se detendrá sin sobrescribir. Las vacaciones de Andreea
del 19 al 23/10 aparecen ya en el gráfico de ausencias de Bitrix, pero no hay
evidencia de que esta integración las haya creado.

**Pendiente para cierre integral:** la jefa debe guardar las siete jornadas de
María Fernanda y solicitar la nueva versión completa; debe decidirse qué fuente
prevalece en las dos discrepancias. El ejecutor actual solo escribe/verifica
turnos de `ShiftPlan`; vacaciones, bajas, festivos y recuperación festiva no
se publican automáticamente en el gráfico de ausencias. Una semana que los
contenga queda `partial`, no `publicado_bitrix`. No se modificaron turnos ni
ausencias de Bitrix en esta comprobación.

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
