# SYNCRO SHIFT — ejecutor de turnos Bitrix en Mac Mini

## Trabajo en curso el 17/10/2026

En la rama local se ha implementado la segunda fase: lectura y alta controlada
del gráfico de ausencias de Bitrix para descanso, vacaciones, festivo y otras
ausencias. El ejecutor no crea eventos si existe uno de distinto tipo o un
duplicado, y solo informa `verified_schedule` tras verificar los 35 días tanto
en ShiftPlan como en el gráfico de ausencias. La API exige evidencia única por
jornada, registra auditoría y solo entonces pone la semana en
`publicado_bitrix`. La recuperación festiva aún se bloquea porque el esquema
actual no guarda el festivo de origen. Las pruebas locales de lógica y API
están superadas; el alta real de un evento y el circuito completo están
`NO VERIFICADOS`.

La rama `codex/bitrix-executor-slidepanel-20261016` llegó a Preview READY
en `dpl_3wsbYmRYr3Cu8Bz1QxLMxMwmPcGm` (`83e9ca2`); 250 pruebas pasaron,
ninguna falló y una quedó omitida. Una lectura real sin escrituras desde la
sesión dedicada del Mac Mini encontró las vacaciones ya existentes de Andreea
en Bitrix. Esto comprueba acceso y lectura, no el alta ni la publicación.

La semana 19–25/10 de Recepción SYNCROLAB continúa con 28/35 jornadas LIVE:
faltan las siete de María Fernanda. Hasta que Lucrezia las guarde y solicite
una versión nueva, no se puede completar la prueba sin inventar el horario.
Esta segunda fase no está instalada ni en Producción ni en el Mac Mini; no ha
escrito ausencias LIVE. El rollback del código es volver al commit anterior y
reinstalar el ejecutor previo; cualquier ausencia ya creada en Bitrix requiere
revisión individual, no borrado masivo.

## Estado comprobado el 16/10/2026

`IMPLEMENTADO` y `PRODUCCIÓN` para la solicitud automática **solo** del horario
Bitrix 33 de Recepción SYNCROLAB: rama `codex/bitrix-auto-publish-20261016`,
commit remoto `d409d39`, deployment `dpl_7ABoWrTm9kEfB95mVr53vzzLgEj3`
READY en `syncro-shift.vercel.app`. El flag de producción
`SYNCRO_PLANNING_EXECUTOR_ENABLED=true` está configurado; los demás horarios
conservan el aviso manual. El Mac Mini ejecuta el LaunchAgent cada 60 segundos,
la sesión dedicada de Chrome respondió `BITRIX_SESSION_READY`, y las últimas
consultas devolvieron `NO_PENDING_JOB`. Suite actual: 244 PASS, 0 FAIL, 1 OMITIDA.

`TESTEADO` y `VERIFICADO` para dos correcciones LIVE puntuales autorizadas: el
16/10 el ejecutor del Mac Mini eliminó el turno anterior de Fabián el 21/10 y
asignó el 08:00–16:00 de SYNCRO SHIFT; eliminó el turno 09:00–14:00 de
Lucrezia el 25/10, cuyo día está clasificado como descanso. Tras recargar el
ShiftPlan 33, ambas celdas se comprobaron otra vez. La ruta directa de Bitrix
fallaba al inicializar su componente JavaScript (`#content-table` ausente); el
ejecutor corregido abre el plan mediante la acción oficial `Schedule` de la
lista de horarios, en el panel lateral, y allí se verificó `BITRIX_SESSION_READY`.
Suite local: 244 PASS, 0 FAIL, 1 OMITIDA.

`NO VERIFICADO`: ninguna **solicitud automática de semana completa** ha
publicado todavía sus 35 jornadas. La semana 19–25/10 de Recepción SYNCROLAB
sigue en versión 4 con 28/35
jornadas: la ficha activa de María Fernanda tiene el vínculo Bitrix 25033 pero
carece de sus siete asignaciones guardadas. La solicitud antigua de versión 4
era manual y no se convierte retroactivamente en automática. Las dos
discrepancias se corrigieron según la decisión expresa de Alexander; el
ejecutor conserva una excepción limitada a esas dos celdas y sus valores
anteriores exactos, sin política general de sobrescritura. Las vacaciones de Andreea
del 19 al 23/10 aparecen ya en el gráfico de ausencias de Bitrix, pero no hay
evidencia de que esta integración las haya creado.

**Pendiente para cierre integral:** la jefa debe guardar las siete jornadas de
María Fernanda y solicitar la nueva versión completa. El ejecutor actual solo escribe/verifica
turnos de `ShiftPlan`; vacaciones, bajas, festivos y recuperación festiva no
se publican automáticamente en el gráfico de ausencias. Una semana que los
contenga queda `partial`, no `publicado_bitrix`. No se modificaron turnos ni
ausencias adicionales fuera de las dos correcciones expresas.

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
4. El navegador dedicado del Mac abre el horario mediante `Schedule` en el
   panel lateral y comprueba previamente toda la semana. Ante un turno distinto
   no autorizado, una celda no única o falta de sesión, no sobrescribe nada.
   Puede sustituir únicamente las dos celdas expresamente autorizadas de
   Fabián y Lucrezia si los valores origen y destino coinciden exactamente.
   Añade los turnos que faltan y vuelve a leer el plan de Bitrix.
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
