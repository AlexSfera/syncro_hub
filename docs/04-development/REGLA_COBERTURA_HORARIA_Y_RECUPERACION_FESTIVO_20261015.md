# SYNCRO SHIFT — cobertura semanal y recuperación de festivo

Estado: **REGLA DOCUMENTADA, NO IMPLEMENTADA**. Alexander aclaró el alcance
semanal y el papel del calendario de RRHH el 15/10/2026. Queda por precisar
cuándo se acredita el trabajo efectivo en festivo. Este documento no declara
la regla operativa ni autoriza migraciones o cambios de datos LIVE.

## Intención confirmada

- Cada fecha de la **semana seleccionada** para cada persona del departamento,
  incluido el propio responsable,
  debe tener una clasificación única: turno de trabajo, descanso, festivo,
  ausencia, vacaciones o recuperación de festivo.
- Una fecha sin clasificación debe impedir **solicitar la carga de horario** en
  Bitrix y abrir un modal con el empleado y la fecha faltante, con acceso a
  corregirla. No se exige rellenar meses futuros para tramitar una semana.
  Un simple `toast` no cumple la petición.
- La comprobación debe repetirse en el servidor antes de crear una solicitud
  de carga o aviso; no basta con validar el navegador. Guardar borradores
  incompletos debe seguir siendo posible.
- Cuando las siete fechas estén clasificadas para el responsable y todo su
  equipo, se permite la solicitud y aparece un modal indicando que **será
  procesada**. El aviso no significa que los turnos ya estén en Bitrix.
- Al elegir «Recuperación de festivo» debe pedirse la fecha concreta del
  festivo trabajado anteriormente. La relación empleado–fecha de recuperación–
  fecha origen debe quedar estructurada y comprobable, no solo escrita en una
  etiqueta libre. No se debe proponer como trabajado un festivo por el mero
  hecho de figurar un turno planificado.

## Calendario de vacaciones y festivos de RRHH

- RRHH necesita un apartado donde planificar y **publicar** el calendario de
  vacaciones y festivos. Las vacaciones publicadas deben aparecer para la
  persona y fechas correspondientes en la semana del departamento. Una fecha
  festiva publicada debe aparecer marcada en esa semana, incluso si ese día
  se asigna un turno de trabajo.
- Si una persona trabaja un festivo publicado, el derecho previsto es de
  **8 horas (480 minutos)** de compensación. Una ausencia de jornada completa
  registrada como «Recuperación de festivo trabajado» consume esas 8 horas y
  señala el festivo concreto que las generó. No se debe contar el mismo
  festivo dos veces ni compensarlo dos veces. Los saldos históricos negativos
  existentes no se corrigen ni se borran por esta regla nueva.
- La fecha origen debe proponerse desde festivos anteriores de **esa misma
  persona**, publicados por RRHH, con trabajo acreditado y compensación aún
  disponible. Si hay varias fechas elegibles, la interfaz debe mostrarlas
  claramente para elegir la correcta. Si no hay ninguna, no debe inventarla.
- Publicar un festivo y planificar un turno en él no demuestra por sí solo que
  se trabajó. Está pendiente confirmar si el derecho se acredita al guardar
  el turno o después de validar el trabajo efectivo; esta decisión afecta al
  saldo y no se resuelve por inferencia.

## Distinción de controles existentes

En la interfaz actual, `Actualizar Bitrix24` solo refresca el catálogo de
turnos. La acción que crea una solicitud y un aviso, sin escribir turnos, es
`Solicitar carga en Bitrix`. La nueva barrera debe proteger esta última y la
futura ejecución local; bloquear el refresco del catálogo impediría seleccionar
turnos para corregir los huecos.

## Estado técnico observado el 15/10/2026

- `lib/planning-domain.js` y `api/planning/publish.js` comprueban las
  asignaciones **que existen**, pero no exigen una entrada por cada persona y
  fecha aplicable. La semana real 19–25/10/2026 conservaba siete días de María
  Fernanda sin registrar y aun así se creó la solicitud/aviso.
- `planificacion_horaria.js` ofrece `turno`, `descanso`, `festivo`, `ausencia`
  y `vacaciones` en la celda. La recuperación se muestra en otros flujos, pero
  no dispone de un selector de festivo origen en esa celda.
- El esquema `planificacion_asignaciones` no admite todavía
  `recuperacion_festivo` como `tipo_dia`; `planificacion_ausencias` tampoco
  tiene una columna para la fecha del festivo origen. Una implementación
  persistente necesita cambios de esquema preparados y autorización separada
  antes de aplicarlos a Supabase LIVE.
- El código distingue entre «turno planificado en festivo» y trabajo realmente
  acreditado; no hay evidencia en este proyecto de una fuente individual por
  fecha que permita sugerir automáticamente qué festivo se trabajó.

## Decisión pendiente que cambia el saldo

¿Las 8 horas se acreditan al **planificar** un turno en festivo futuro o solo
después de confirmar que la persona **trabajó**? La fuente concreta de esa
confirmación sigue en `[NO DATA]` en la implementación actual.

## Criterios de aceptación una vez resueltas las decisiones

1. El responsable ve los huecos de las siete fechas de todas las personas de
   su departamento y los suyos; el servidor vuelve a calcular el mismo
   conjunto autorizado. No se inspeccionan meses ajenos a la semana solicitada.
2. Una solicitud incompleta recibe un error estructurado con empleado y fecha;
   no crea aviso Bitrix ni marca el horario como publicado. El modal permite ir
   a la fecha concreta. Una solicitud completa muestra «será procesada» y
   conserva el estado pendiente de Mac Mini hasta verificación real.
3. Los días de recuperación muestran la fecha origen elegida, verifican que
   pertenece a la misma persona, que es anterior y que hay prueba del trabajo,
   y evitan consumir dos veces el mismo festivo; el balance se expresa en
   minutos para que 480 de generación y 480 de consumo sean comprobables.
4. Se prueban límites de año, altas/bajas laborales, cambios de versión,
   permisos de RRHH, jefes y administradores, publicación del calendario,
   modificaciones de turnos y llamadas directas a la API.
5. Ningún despliegue ni migración de datos LIVE se infiere de este documento.
