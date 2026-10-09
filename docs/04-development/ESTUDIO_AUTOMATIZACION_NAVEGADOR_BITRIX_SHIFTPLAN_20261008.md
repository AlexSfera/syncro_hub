# SYNCRO SHIFT — Protocolo de estudio: publicación de turnos Bitrix24 mediante navegador

**Fecha:** 2026-10-08  
**Estado:** DOCUMENTADO / PROPUESTA NO OPERATIVA  
**Proyecto:** `AlexSfera/syncro_hub`  
**Ámbito:** Planificación Horaria → asignaciones futuras en los horarios de trabajo de Bitrix24 (ShiftPlan)  
**No autorizado por este documento:** ejecutar un robot, crear credenciales, escribir turnos LIVE, desplegar, modificar Supabase ni retirar el bloqueo de publicación actual.

## 1. Resultado esperado y límite vigente

Objetivo final propuesto: un jefe autorizado aprueba en SYNCRO SHIFT una versión semanal y un ejecutor remoto, sin depender del PC ni de la sesión de Alexander, registra **solo las diferencias** de esa versión en el ShiftPlan correcto de Bitrix24, vuelve a leer el resultado y confirma por empleado, fecha y turno. Si falta evidencia, se devuelve `[NO DATA]` o error específico; nunca se afirma publicado por el mero clic de guardar.

Hechos del código inspeccionado (revisión de Producción observada `1ecbe1da9c31e1f38d7608ce4021d7f7ed74f717`):
- `/api/planning/catalog` usa `timeman.schedule.get` y actualiza el catálogo local; **no publica** asignaciones futuras.
- `/api/planning/week` guarda el borrador versionado en SYNCRO SHIFT.
- `/api/planning/publish` responde 409 `BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO`: `bitrixWriteSupported: false`. No hay publicación LIVE autorizada.
- El plugin conectado `SYNCROSFERA — Bitrix24 MCP` tiene herramientas para tareas, usuarios y departamentos, pero **no** expone creación/edición de asignaciones ShiftPlan.

La documentación REST pública actual de Bitrix24 enumera `timeman.schedule.get` (lectura) y no confirma un método soportado para crear, reemplazar o borrar las asignaciones futuras. OpenAPI/REST no convierte automáticamente una acción de la interfaz en método REST. Antes de desarrollar la vía navegador, volver a consultar documentación oficial o respuesta del proveedor.

## 2. Arquitectura mínima preferida: navegador remoto y determinista

- **Origen:** borrador de SYNCRO SHIFT, semana/versión aprobada, departamento y catálogo/identidad existentes.
- **Ejecutor propuesto:** función Node.js aislada en Vercel con Chromium ligero y Playwright/Puppeteer, **no** la función Edge actual. Su arranque, límites de duración, tamaño, red y acceso al portal deben pasar una prueba de compatibilidad.
- **Autenticación:** identidad técnica individual de Bitrix24 con permisos mínimos de edición de turnos, configurada por el administrador según funciones reales. La sesión protegida se gestiona en el entorno remoto, no se copia del navegador de Alexander ni se guarda en Git.
- **Disparador:** solicitud explícita de publicación de una versión aprobada, nunca apertura de pantalla o cron automático.
- **Resultado:** comparación contra Bitrix24, cambios mínimos, releectura desde la propia interfaz y registro de éxito/error. Si una sesión caduca o exige MFA, detener y solicitar intervención autorizada, sin saltar autenticación ni CAPTCHA.
- **Alternativa de descubrimiento:** OpenAI Agents API tiene navegador alojado en la nube y puede operar interfaces; requiere configuración de acceso, autorización y costes de ejecución. Usarlo, si se autoriza, para explorar/recuperar rutas; **no** para consumir capturas y tokens en cada turno cuando ya existe un recorrido estable.

No debe implementarse una nueva infraestructura ni contratar un servicio hasta descartar con una prueba pequeña el ejecutor Node.js en Vercel existente. Independencia del ordenador **no** implica independencia de la autenticación de Bitrix24.

## 3. Atajos de navegación y catálogo de departamentos

**Patrón de URL documentado, con Cocina (ID 55) confirmado desde la interfaz autenticada el 09/10/2026; otros IDs sin comprobar en navegador:**

`https://syncrosfera.bitrix24.eu/timeman/schedules/{BITRIX_SCHEDULE_ID}/shiftplan/`

La ruta se identificó originalmente como hipótesis a partir de una referencia pública del módulo `timeman`. El 09/10/2026 la **interfaz autenticada de Bitrix24** confirmó que el enlace `PLANIFICAR TURNOS` del horario `Turnos - Cocina` tiene exactamente el valor `https://syncrosfera.bitrix24.eu/timeman/schedules/55/shiftplan/`, y al activarlo abrió la vista de planificación `Turnos - Cocina - horario`. **VERIFICADO exclusivamente ese recorrido interno; no está probado abrir el mismo deep link desde una sesión nueva o un navegador remoto, ni autoriza publicar turnos.**

Mapeo **documentado previamente**, pendiente de revalidar en Bitrix24 antes del primer piloto:

| Departamento operativo | ID horario Bitrix24 |
|---|---:|
| Cocina | 55 |
| Sala | 47 |
| Housekeeping | 41 |
| Mantenimiento | 63 |
| Recepción SYNCROLAB | 33 |
| Recepción | 35 |
| Fisioterapeutas | 51 |
| RRHH | 91 |
| Comercial | 43 |
| Marketing | 45 |
| Dirección Comercial | 95 |
| C&C | 87 |

El horario `85` está reservado en la especificación a `extra_recuperacion` y **no** puede tratarse como calendario departamental. Los horarios individuales quedan excluidos mientras no haya una correspondencia inequívoca por persona.

**Orden obligatorio de navegación:**
1. Resolver el `bitrix_schedule_id` desde el mapeo vigente de SYNCRO SHIFT; no buscar por nombre visual si hay ID confiable.
2. Intentar la URL directa **solo si está previamente verificada** para el portal y rol; validar encabezado, tipo de horario y el ID esperado.
3. Si redirige, da 403/404 o muestra otro horario, pasar a ruta oficial de `Employees → Time and reports → Work schedules`, seleccionar por ID y registrar el motivo del fallback.
4. Usar localizadores DOM estables (`role`, nombre accesible, atributos verificables) y acciones dirigidas. Evitar coordenadas de ratón e inspección por capturas como mecanismo primario.
5. No inferir que guardar ha funcionado: releer la celda empleado-fecha y contrastar el turno/segmentos efectivos.

**Nunca** llamar endpoints privados descubiertos en la pestaña Network ni simular un REST inexistente. Un atajo de URL solo acorta la navegación de la interfaz autorizada; no eleva permisos.

## 4. Aprendizaje operativo controlado

El sistema **no** debe reescribir su propio código automáticamente. Debe aprender en el sentido operacional: medir rutas verificadas, recordar cuál exige menos pasos y reaprovechar controles estables.

Por cada ejecución guardar un resumen sin datos personales ni secretos:
- `run_id`, revisión de aplicación, ID de horario, versión del cuadrante y estado final;
- ruta candidata usada / fallback, número de navegaciones, clics, capturas, esperas y errores;
- número de asignaciones comparadas, sin cambio, nuevas, modificadas y verificadas;
- tiempo total, motivo de cada recuperación, firma de interfaz sin HTML privado;
- **cero capturas por defecto**; solo evidencia de error si resulta imprescindible, en almacenamiento privado con retención limitada y acceso restringido.

Reglas de optimización:
1. La primera exploración identifica ruta, pantalla y controles en modo **solo lectura**.
2. Una ruta se considera `VERIFICADA` solo tras confirmar que aterriza en el ID correcto bajo el rol autorizado.
3. Tras **tres ejecuciones consecutivas exitosas** del mismo recorrido puede proponerse un cambio a la ruta preferida; el cambio de selectores o rutas se versiona mediante revisión en GitHub antes de aplicarse.
4. Si Bitrix cambia su interfaz, degradar a recorrido seguro o detenerse; no improvisar clicks destructivos ni repetir masivamente acciones inciertas.
5. Conservar una ruta de reversión a la versión de selectores anterior. Medir el coste real por ejecución para demostrar mejora de pasos, duración y capturas.
6. No incluir cookies, claves, IDs personales, horarios individuales ni capturas de empleados en el repositorio. Git guarda **reglas y selectores genéricos revisados**, no sesiones ni datos operativos.

## 5. Seguridad e idempotencia de publicación

- La identidad, permisos y departamento se validan en backend. Cada publicación exige aprobación expresa del responsable autorizado y versión estable; prevenir sesiones concurrentes sobre el mismo departamento/semana.
- Identificar cada operación por `week_id + version + bitrix_user_id + fecha_operativa + bitrix_shift_id`, resuelta en servidor. Comparar antes de escribir; no duplicar si ya coincide.
- Verificar turno, fecha, tramos y usuario de destino, incluyendo turnos partidos y medianoche. No mezclar turnos de distintos horarios ni dar por válida una mera coincidencia de texto.
- Bloquear cambios con conflictos, identidad ambigua, rol incorrecto, navegador no autenticado, ausencia de lectura fiable o diferencias no previstas.
- No borrar/reemplazar turnos, sobrescribir semanas publicadas ni modificar una jornada ya iniciada sin autorización específica. Las modificaciones durante la jornada pueden afectar al control de fichajes de Bitrix24.
- Conservar auditoría inmutable de la intención y resultado; evaluar reutilizar `planificacion_sync_log` y `planificacion_audit` **sin introducir esquema ni escritura LIVE en esta fase**.
- Si se producen errores parciales, comunicar exactamente qué celdas están verificadas y cuáles no; no marcar toda la semana como publicada ni reintentar a ciegas.

## 6. Experimento mínimo y puertas de avance

**Paso A, solo lectura:** comprobar con un usuario de prueba autorizado que el enlace directo de Cocina (ID 55) abre la planificación adecuada; medir clics, detectar elementos editables y confirmar que los IDs registrados coinciden. Sin guardar turnos.

**Paso B, después de autorización específica:** usar una única asignación de prueba acotada, con fecha, empleado, turno y entorno acordados; comprobar antes/después, verificar lectura de la misma celda y plan de reversión. Sin calendario masivo.

**Paso C, solo tras B verificado y nueva autorización:** habilitar publicación controlada de un departamento/semana versionada; pruebas de permisos negativos, conflictos, duplicados, cierres de sesión y error parcial. Comprobar el flujo remoto con el PC personal apagado.

**Aceptación:** una asignación de prueba creada/modificada y leída correctamente, sin duplicación y con reversión probada; trabajo remoto sin sesión local; registro del recorrido y métricas; ninguna afirmación `DONE` si faltan evidencias.

**Estado actualizado 09/10/2026:** Paso A **PARCIAL / TESTEADO en aplicación autenticada**: vínculo oficial de Cocina, vista y controles confirmados en solo lectura. Queda `[NO DATA]` para entrada directa en navegador nuevo, sesión técnica separada y ejecución desde Vercel. Pasos B y C **NO IMPLEMENTADOS / NO AUTORIZADOS**. El bloqueo `BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO` sigue vigente; el publicador continúa **NO VERIFICADO**.

## 7. Prueba real de navegación — Cocina ID 55 (09/10/2026)

**Autorización:** Alexander autorizó únicamente una prueba de acceso en **modo lectura**; sin publicar turnos ni modificar fichajes, empleados, datos de Supabase o configuración de Bitrix24.

**Entorno usado:** aplicación de escritorio Bitrix24, sesión del usuario ya autenticada, en dispositivo autorizado HPTOUCHALEXBOSS. Acceso mediante controles de accesibilidad (Windows UI Automation); **cero capturas**, sin extraer cookies, contraseñas ni tokens. El navegador automatizado remoto en Vercel NO se ha desplegado ni ejecutado.

**Recorrido observado y reproducible desde la sección de inicio de la aplicación:**
1. Hipervínculo de menú lateral **Empleados**.
2. Expandir botón **Tiempo y reportes** (`ExpandCollapsePattern`).
3. Menú **Horarios de trabajo** (`MenuItem`, `InvokePattern`), que abre `/timeman/schedules/`.
4. Abrir hipervínculo **Turnos - Cocina** (`Hyperlink`, `InvokePattern`). La ventana `Editar el horario de trabajo` muestra el campo **Título del horario de trabajo** con valor `Turnos - Cocina`.
5. Leer y activar el hipervínculo **PLANIFICAR TURNOS**. Su valor de destino es **exactamente** `https://syncrosfera.bitrix24.eu/timeman/schedules/55/shiftplan/`; se abre la ventana **Turnos - Cocina - horario** y aparece el ámbito **Cocina**.

**Controles accesibles observados en la vista de turnos** (solo identificadores genéricos):
- Ventana/documento: `Turnos - Cocina - horario`.
- Botón: `Agregar` (no pulsado; podría crear o proponer un turno).
- Campo de búsqueda: `Filtrar y buscar`.
- Enlace de fecha: `Hoy`.
- Tabla y ámbito: etiqueta `Cocina`.
- La rejilla contiene muchos elementos `Group`; los selectores DOM exactos no se han inspeccionado ni verificado, por lo que no se pueden afirmar estables.

**Métrica inicial:** cinco acciones de navegación en la interfaz desde Empleados al cuadrante (sin contar abrir una pestaña nueva). **Ruta optimizada candidata:** abrir el enlace exacto validado para ese horario, con autenticación y comprobación de encabezado/ID. **Ahorro potencial:** cuatro pasos de menú, pero el acceso directo desde un navegador independiente sigue `[NO DATA]` y no debe presentarse como probado.

**Resultado y límite:** **VERIFICADO el enlace interno y la pantalla de Cocina por interacción real**; **NO VERIFICADOS** el lanzamiento de esa URL en nueva sesión, el inicio de sesión autónomo en nube, el guardado de una asignación y la lectura tras escritura. No se pulsaron acciones `Agregar`/`Guardar`, no hubo modificaciones de turnos, no se crearon credenciales ni se realizaron sincronizaciones masivas.

**Aprendizaje para futuras ejecuciones:** priorizar la ruta de ID 55 y selectores basados en roles/nombres comprobados; registrar rutas, tiempo, errores y fallbacks; exigir verificación del departamento antes de cualquier escritura futura. Si cambia la UI, degradar a menú con el recorrido observado; no actualizar selectores automáticamente sin revisión de GitHub.

**Reversión:** esta evidencia se retira revirtiendo únicamente el commit documental. El navegador del dispositivo conserva una pestaña de consulta adicional; no hay cambios de negocio que revertir.

## 8. Fuentes consultadas

- Código real: `planificacion_horaria.js`, `api/planning/catalog.js`, `api/planning/week.js`, `api/planning/publish.js`, `lib/planning-server.js` de la revisión `1ecbe1d`.
- Especificación local: `docs/04-development/SPEC_PLANIFICACION_HORARIA.md`.
- API oficial: https://apidocs.bitrix24.com/api-reference/timeman/schedule/index.html
- Tipos de horarios: https://helpdesk.bitrix24.com/open/24757966/
- Permisos de turnos: https://helpdesk.bitrix24.com/open/24776990/
- Ruta candidata (referencia de código de terceros, NO verificación LIVE): https://aclips.ru/bitrix24-api/bx_timeman_timemanurlmanager_getroutes/
- Ejecución Chromium en Vercel: https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel
- OpenAI Agents API, navegador alojado: https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use

**Reversión documental:** revertir únicamente el commit o los enlaces de este estudio en su rama `codex/...`. No hay reversión de Bitrix24, datos LIVE o producción porque no se modifican.
