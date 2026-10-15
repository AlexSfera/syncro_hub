# SYNCRO SHIFT — regla propuesta de cobertura horaria y recuperación de festivo

Estado: **PENDIENTE DE DOS DECISIONES DE ALEXANDER**. Este documento registra
la petición; no declara la regla implementada, publicada ni operativa.

## Intención confirmada

- Cada fecha aplicable a cada persona del equipo, incluido el responsable,
  debe tener una clasificación única: turno de trabajo, descanso, festivo,
  ausencia, vacaciones o recuperación de festivo.
- Una fecha sin clasificación debe impedir **solicitar la carga de horario** en
  Bitrix y abrir un modal con el empleado y la fecha faltante, con acceso a
  corregirla. Un simple `toast` no cumple la petición.
- La comprobación debe repetirse en el servidor antes de crear una solicitud
  de carga o aviso; no basta con validar el navegador. Guardar borradores
  incompletos debe seguir siendo posible.
- Al elegir «Recuperación de festivo» debe pedirse la fecha concreta del
  festivo trabajado anteriormente. La relación empleado–fecha de recuperación–
  fecha origen debe quedar estructurada y comprobable, no solo escrita en una
  etiqueta libre. No se debe proponer como trabajado un festivo por el mero
  hecho de figurar un turno planificado.

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

## Decisiones pendientes que cambian la regla

1. Alcance del bloqueo: ¿la semana que se solicita o todo el año natural,
   incluidos los meses futuros? El avance anual puede mostrarse en ambos casos.
2. Fuente autorizada que demuestra un festivo **trabajado**: fichaje/registro
   confirmado de Bitrix, validación manual de dirección u otra prueba definida
   por Alexander. Un turno planificado no acredita trabajo efectivo.

## Criterios de aceptación una vez resueltas las decisiones

1. El responsable ve los huecos de todas las personas de su ámbito y los
   suyos; el servidor vuelve a calcular el mismo conjunto autorizado.
2. Una solicitud incompleta recibe un error estructurado con empleado y fecha;
   no crea aviso Bitrix ni marca el horario como publicado. El modal permite ir
   a la fecha concreta.
3. Los días de recuperación muestran la fecha origen elegida, verifican que
   pertenece a la misma persona, que es anterior y que hay prueba del trabajo,
   y evitan consumir dos veces el mismo festivo.
4. Se prueban límites de año, altas/bajas laborales, cambios de versión,
   permisos de jefes y administradores, y llamadas directas a la API.
5. Ningún despliegue ni migración de datos LIVE se infiere de este documento.
