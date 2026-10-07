# SYNCRO SHIFT — Navegación operativa, permisos y fuentes de datos

Fecha: 07/10/2026, Europe/Madrid. Repositorio: `AlexSfera/syncro_hub`.

**Estado: DOCUMENTADO.** Este documento reúne la revisión de navegación y las aclaraciones de Alexander del 07/10/2026. Define requisitos para una implementación posterior; no acredita que el nuevo menú, los nuevos permisos o las conexiones propuestas estén implementados.

**Alcance autorizado de esta entrega:** documentación en GitHub. No autoriza cambios de código, cuentas, permisos efectivos, datos LIVE, migraciones, integraciones, configuración ni Producción. No autoriza fusionar con `main`.

## 1. Decisiones de negocio confirmadas por Alexander

Estas aclaraciones prevalecen sobre las dudas y recomendaciones anteriores de esta revisión.

| Código | Regla confirmada | Consecuencia para la organización |
|---|---|---|
| NEG-01 | Liquidaciones es un control interno; no forma parte del circuito oficial indicado por Alexander. | Acceso restringido dentro de Producción e incentivos. No se presenta como nómina oficial ni como cierre de horas. |
| NEG-02 | La función Liquidaciones está autorizada para administrador de empresa, Alexander y Daria. | La pertenencia genérica a Dirección, RRHH, jefatura o adjunto no concede este acceso. Las identidades técnicas y el alcance concreto se deberán comprobar antes de aplicar la regla. |
| NEG-03 | El control de incentivos pendientes y liquidados está reservado al administrador de empresa o Contabilidad. | Contabilidad consulta el control de estados; no se le concede automáticamente la acción de liquidar. Daria conserva la autorización nominal de NEG-02. |
| NEG-04 | Un empleado puede ver sus incentivos pendientes de pagar. Cuando estén liquidados deben desaparecer de su vista. | La vista personal contiene únicamente pendientes propios; no presenta históricos, importes, fechas ni justificantes de incentivos ya liquidados. El registro interno se conserva. |
| NEG-05 | Trabajar un día festivo genera un día pendiente de compensación; ausentarse para compensar ese festivo consume ese derecho. | Un solo saldo de festivos pendientes, con movimientos de generación y consumo. No sumar el festivo trabajado y la ausencia compensatoria como dos saldos. |
| NEG-06 | Alexander quiere relacionar ventas reales y horas trabajadas, prioritariamente para Sala y Cocina. Las horas proceden de Bitrix24; las ventas deben obtenerse de Muse POS mediante API. | Se documenta el destino funcional y la relación entre fuentes. La integración LIVE se realizará en otro trabajo. |
| NEG-07 | Primero se organiza la aplicación. | No añadir módulos ajenos, herramientas ni conexiones nuevas durante esta entrega documental. |

**Interpretación de permisos sin ampliación:** el empleado consulta exclusivamente sus pendientes propios, como excepción personal expresa a la reserva del control financiero. Los listados de terceros y el historial de pendientes/liquidados son de administración de empresa o Contabilidad. Ver el control no equivale a poder liquidar. El acceso nominal de Alexander y Daria no se extiende a todos los perfiles con un rol equivalente o parecido.

No se documentan importes ni condiciones individuales de empleados, credenciales, PIN, tokens o datos de pago.

## 2. Evidencia y revisión examinada

| Elemento | Evidencia comprobada | Límite |
|---|---|---|
| Repositorio remoto | `AlexSfera/syncro_hub` | Se mantiene separado de otros proyectos. |
| `main` | `38074d99302009228dee8fd8c31fa69c475fc1ab` | No coincide con la revisión que sirve Producción. |
| Producción, según Vercel | `ce78f882c300e686fe40ad22134a900c840c3d91`, deployment `dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g`, READY; alias `syncro-shift.vercel.app` | Esto confirma deployment y alias, no una prueba funcional autenticada. |
| Preview de referencia | Mismo commit `ce78f88`, deployment `dpl_68KLwHxS9vxoFmsMH7ZtwaDPsxEb`, READY | Es la Preview de la revisión examinada; no acredita flujos LIVE. |
| Diferencia de revisiones | Producción está 90 commits por delante de `main`, sin commits por detrás en la comparación | Esta entrega no incorpora ni fusiona esos cambios. |
| Checkout local examinado | Rama `codex/reconciliar-interfaz-planificacion-20261006`, commit local `47a093975b6e6e106f6482b735e5fc17cf1f3f5f`, árbol limpio | Su historial local no es el historial remoto. |
| Correspondencia de código | 70 archivos: JavaScript raíz, API, lib e `index.html`; hashes Git iguales al árbol remoto de `ce78f88` | Permite usar ese código para la revisión estática. |
| Documentación consultada | PROJECT_CONTEXT, PROJECT_RULES, RUNBOOK, FINAL_REPORT, MASTER_DOCUMENTATION, MODULE_STATUS, CURRENT_STATE y mapa previo de navegación | Las afirmaciones históricas no sustituyen comprobaciones actuales. |
| Aplicación autenticada | `[NO DATA]` | La apertura de Producción quedó bloqueada por la política de acceso del navegador; no se intentó eludirla. |
| Permisos y datos LIVE | `[NO DATA]` | No se consultaron cuentas personales ni se ejecutaron escrituras, cron, backfills o sincronizaciones. |
| Conexión ventas ↔ incentivos en Sala | Dos rutas de datos identificadas en código; no se encontró un puente en los archivos revisados | Triggers o procesos externos LIVE: `[NO DATA]`. |
| API de Muse POS | Necesidad y disponibilidad indicadas por Alexander | Contrato API, conexión actual y correspondencia con el importador histórico POSMEWS: `[NO DATA]`. No investigados ni conectados en este trabajo. |

Los vínculos del apartado 10 están fijados a `ce78f88`. El documento puede existir en una rama derivada de `main` sin implicar que los módulos citados estén todos presentes en `main`.

## A. Diagnóstico breve

1. **Fichajes mezcla nombre y finalidad.** `fichaje.js` muestra e importa alertas de Bitrix desde `bitrix_alerts`: anomalías, métodos de marcaje y horario superado. No es la pantalla de entradas y salidas completas ni de corrección del registro de tiempo. El nombre actual hace esperar una función distinta.
2. **Horas mensuales mide horas registradas, no un balance laboral cerrado.** `/api/monthly-hours` agrega `bitrix_time_records` y muestra patrones, evolución y comparaciones. No se encontró una conciliación mensual integrada con planificación, contrato, horas validadas y cierre. Su endpoint solo permite actualmente el rol `admin`.
3. **Validar un parte no equivale a validar todas las horas del mes.** Validación revisa partes operativos, caja, merma, notas y FIO. El estado validado de `shifts` no convierte automáticamente el agregado de Bitrix en horas mensuales validadas.
4. **Liquidaciones tiene una finalidad económica específica.** Reúne liquidaciones de incentivos de Recepción, Entrenadores y premio semestral de Housekeeping. Debe permanecer como control interno restringido; no corresponde a nómina oficial, saldo laboral ni cierre mensual de jornada.
5. **Informes contiene registros y cálculos además de informes.** Incluye importación de ventas de Sala, datos de Entrenadores, incentivos e informes redactados por jefes. Obliga a buscar tareas de registro dentro de un apartado que parece de consulta.
6. **Dashboard mezcla resumen, detalle y acciones.** Resume operación y costes estimados; también presenta listas y acciones. Su Previsión usa históricos y ausencias, no las asignaciones de Planificación Horaria. Debe distinguirse del plan de turnos.
7. **Sala tiene dos rutas de ventas.** Producción guarda datos en `sala_produccion_semanal`; el cálculo de incentivos utiliza `employee_sales_weekly` mediante otro importador. Sin una relación comprobada, reutilizar la misma venta no está garantizado.
8. **Los incentivos personales muestran hoy más información de la solicitada.** `mi_rendimiento.js` muestra estados e información de liquidaciones. También contiene gestión de equipo y acciones de liquidación para determinados responsables. La futura vista personal debe limitarse a pendientes propios.
9. **Ausencias y saldos tienen rutas parcialmente separadas.** Planificación usa `planificacion_ausencias`; informes de jefes y previsión usan `employee_status`. En Housekeeping existe un circuito específico de sincronización de ausencias. Reorganizar el menú no resuelve por sí solo estas correspondencias.
10. **Hay entradas que anuncian funciones pendientes.** Varias subtabs de KPI, ventas u horas extra muestran “próximamente”. No deben ofrecerse como funciones disponibles del menú operativo.

La aclaración de festivos resuelve la duda semántica: se trata del derecho a descanso por un festivo trabajado y su consumo mediante descanso compensatorio. Lo pendiente es comprobar la trazabilidad técnica de ese ciclo, no volver a preguntar qué significa el concepto.

## B. Menú recomendado

**Mi día · Operación · Jornada y saldos · Producción e incentivos · Resultados e informes · Equipo · Configuración**

Se muestran únicamente áreas y subtabs autorizadas para el usuario. No es un menú de siete pestañas obligatorio para todos los perfiles.

| Área | Pregunta que resuelve | Pantalla inicial habitual |
|---|---|---|
| Mi día | ¿Qué tengo que hacer y registrar hoy? | Mi turno, ruta o checklist del puesto |
| Operación | ¿Qué necesita seguimiento y revisión en mi departamento? | Pendientes y revisiones del ámbito autorizado |
| Jornada y saldos | ¿Qué estaba previsto, qué se ha trabajado y qué queda pendiente? | Mi horario o planificación del equipo |
| Producción e incentivos | ¿Qué se ha producido y qué incentivos siguen pendientes? | Producción para responsables; mis incentivos pendientes para empleados |
| Resultados e informes | ¿Qué resultados y desviaciones requieren atención? | Resumen para Dirección |
| Equipo | ¿Qué personas y asuntos laborales debo gestionar? | Plantilla dentro del alcance autorizado |
| Configuración | ¿Qué parámetros y accesos debo administrar? | Configuración autorizada |

Liquidaciones queda dentro de Producción e incentivos, exclusivamente para sus usuarios autorizados. No aparece en Mi día, Jornada y saldos ni como pestaña principal general. Contabilidad dispone de la consulta de control financiero autorizada.

## C. Contenido, usuarios y acciones

### C.1. Áreas y fuentes

| Nombre | Finalidad | Contenido y subpestañas | Usuarios | Acciones | Fuente de datos |
|---|---|---|---|---|---|
| Mi día | Trabajo personal | Mi turno; checklist; Mi ruta HK; mis pendientes; notas; enlaces a mi horario, saldos, FIO e incentivos pendientes | Cada empleado; responsables en su propio trabajo | Registrar y cerrar parte, completar checklist/ruta, aportar evidencia y consultar lo propio | `shifts`, checklists y ejecución HK; registros operativos compartidos |
| Operación | Ejecutar, seguir y revisar | Gestiones; Tareas; Incidencias; Sala hipóxica; Merma; Notas; Partes y revisión; Housekeeping; Mantenimiento | Empleados según puesto; responsables según departamentos; revisores autorizados | Registrar, asignar, corregir, cerrar y validar según permisos existentes; inspeccionar HK | Registros operativos, `shifts`, `tareas`, incidencias, `merma`, registros HK e hipóxicos |
| Jornada y saldos | Planificación, tiempo real y derechos de descanso | Planificación y cobertura; Fichajes e incidencias de marcaje; Balance de horas con vista mensual; Ausencias; Vacaciones; Festivos pendientes; Extras y recuperación | Empleado: lo propio; jefe: su ámbito; RRHH/Dirección según permiso laboral; administración autorizada | Consultar y planificar; revisar incidencias; solicitar/aprobar según circuito; consultar movimientos. Validación y cierre mensual integrados quedan como diseño pendiente | `planificacion_*`, `bitrix_time_records`, `bitrix_alerts`, `vacaciones_movimientos`, `extra_recuperacion_movimientos`, condiciones laborales y auditoría |
| Producción e incentivos | Registro económico y seguimiento de pendientes | Producción/Ventas y KPI por departamento; Cajas y revisión; mis incentivos pendientes; Control de incentivos; Liquidaciones internas restringidas | Registro y producción: operadores y responsables autorizados; pendientes personales: titular; control: administrador de empresa/Contabilidad; liquidación: autorizaciones nominales confirmadas | Registrar/importar producción existente, cerrar/revisar caja, consultar lo propio pendiente, calcular/revisar y liquidar únicamente con capacidad específica | Fuentes de ventas/caja existentes, reglas, FIO y liquidaciones. Bitrix para horas; API Muse POS como trabajo posterior |
| Resultados e informes | Consulta y explicación de resultados | Resumen; detalle por periodo/departamento; informes de jefe; exportaciones | Dirección y responsables dentro del ámbito; Contabilidad según datos financieros autorizados | Filtrar, consultar trazabilidad, redactar/publicar informe de jefe, exportar dentro del mismo permiso | Lecturas de las fuentes anteriores; `dept_reports`; no segundo registro de ventas o saldos |
| Equipo | Gestión de personas y FIO | Plantilla y ficha; condiciones laborales; FIO y revisiones; mi FIO como vista personal | Jefes según jerarquía; RRHH; administración autorizada; empleado solo lo propio | Gestionar ficha dentro del rango permitido, revisar FIO, consultar condiciones según atribuciones | `employees`, gobierno organizativo, condiciones laborales, `fio` y catálogo |
| Configuración | Parámetros y accesos | Permisos/accesos; catálogos; reglas de incentivos; configuración HK; herramientas de importación/copia ya existentes | Administración del sistema según capacidad; responsables HK solo configuración HK autorizada | Administrar parámetros, invitaciones y recuperación de acceso; herramientas técnicas separadas del reporting | Configuración, reglas y catálogos actuales; endpoints de administración existentes |

Los enlaces personales reutilizan vistas y fuentes de sus áreas; no crean registros independientes.

### C.2. Qué ve primero cada perfil

| Perfil | Primera vista propuesta | Puede hacer | Necesita aprobación o capacidad adicional |
|---|---|---|---|
| Empleado | Mi día | Registrar su trabajo; consultar horario, tiempo, saldos y FIO propios; ver solo sus incentivos pendientes de pagar | No autoaprobar extras, correcciones o cambios de saldo; no consultar historial de incentivos liquidados ni liquidar |
| Jefe de departamento | Operación: pendientes y revisiones de su equipo | Planificar y revisar dentro de su ámbito; comprobar cobertura, marcajes, partes, producción y FIO según permisos | Cierre/validación laboral mensual cuando exista; cambios fuera de ámbito; control monetario de incentivos de terceros y liquidación no se conceden por ser jefe |
| RRHH | Jornada y saldos | Revisar incidencias laborales, ausencias, vacaciones, compensaciones y condiciones autorizadas | Acceso a incentivos internos no implícito; cierre mensual formal depende de circuito todavía no acreditado |
| Dirección | Resultados e informes | Consultar resultados, desviaciones y detalle autorizado | Ver datos monetarios personales y liquidaciones requiere la autorización de administrador de empresa/Contabilidad o la autorización nominal confirmada |
| Contabilidad | Producción e incentivos: Cajas y Control de incentivos | Consultar pendientes/liquidados y trazabilidad dentro de su atribución; cajas autorizadas | Marcar liquidado no se concede automáticamente por ser contable |
| Administración del sistema | Configuración | Gestionar parámetros y accesos autorizados | Una función técnica de administración no debe conceder por sí sola atribuciones financieras distintas de las confirmadas |

Alexander y Daria son autorizaciones de negocio expresas para Liquidaciones. Su correspondencia con cuentas, roles o capacidades técnicas actuales se documenta como `[NO DATA]`; no se deduce por nombre de puesto ni se cambia ninguna cuenta.

## 3. Permisos: código actual frente a regla objetivo

### 3.1. Permisos encontrados en la revisión de código

| Función | Comportamiento encontrado | Diferencia con el objetivo |
|---|---|---|
| Administración ampliada | `canActAsAdmin` devuelve verdadero para `admin` y `adjunto`/`adjunto_directivo` | No sirve por sí sola para limitar Liquidaciones a las autorizaciones confirmadas |
| Navegación RRHH técnico | `showScreen` y `canAccessInformes` bloquean Dashboard, Liquidaciones y/o Informes según pantalla | Mover funciones laborales fuera de Informes facilitaría el trabajo, pero no modifica automáticamente permisos |
| Horas mensuales | Endpoint `/api/monthly-hours` limitado a `admin` | Jefes/RRHH/empleados no obtienen acceso solo por ubicarlo en Balance de horas |
| Liquidaciones internas | Funciones actuales usan administración/adjunto y permisos específicos del backend de HK | Se deberá separar consulta, cálculo, aprobación y liquidación; no generalizar acceso a adjuntos |
| Mi Rendimiento | Contiene importes/estados liquidados y, en Entrenadores, vista de equipo y liquidación | La parte personal deberá excluir liquidados; el control de terceros irá a la vista restringida |
| Contabilidad | Código de navegación describe y ofrece consulta de cajas y Dashboard; validación de caja en lectura | La consulta de incentivos confirmada por Alexander se documenta como requisito, no como acceso actual verificado |
| Plantilla | Admin/adjunto: alcance amplio; otros responsables: subordinados y departamentos supervisados | Mantener el alcance y proteger datos; no dar plantilla completa por reorganizar menú |
| Planificación | Global para administración/adjunto/RRHH según backend; responsables en ámbito; empleados solo semanas publicadas | Conservar el alcance. Publicar en Bitrix no está soportado en la revisión examinada |
| FIO | Consulta personal o revisión según ámbito y nivel | No convertir la autorización para FIO en acceso financiero a incentivos de terceros |
| HK | Configuración, inspección y asignación según perfiles HK autorizados | Conservar permisos especializados al mover accesos |

Son hallazgos de implementación. Eficacia de los permisos, RLS y cuentas reales en LIVE: `[NO DATA]`.

### 3.2. Códigos de permiso propuestos

Los siguientes códigos son **identificadores documentales nuevos**, no permisos ya existentes ni código ejecutable.

| Código propuesto | Alcance y regla | Autorización objetivo |
|---|---|---|
| `JORNADA_LEER_PROPIA` | Tiempo, horario y saldos del titular | Empleado autenticado para sí mismo |
| `JORNADA_GESTIONAR_EQUIPO` | Planificación y revisión de personas del ámbito | Responsables y RRHH con ámbito explícito |
| `JORNADA_VALIDAR` | Validar horas con evidencia; separado de validar parte operativo | Circuito a definir y autorizar en implementación; no se presume existente |
| `JORNADA_CERRAR_PERIODO` | Cierre formal y rectificación auditada | Circuito todavía no acreditado; no se concede en esta documentación |
| `PRODUCCION_GESTIONAR` | Registrar/revisar ventas o producción del ámbito | Operadores/responsables que ya tengan esa atribución |
| `INCENTIVOS_LEER_PROPIOS_PENDIENTES` | Solo incentivos del titular no liquidados y realmente pendientes de pago | Empleado; no habilita historial ni terceros |
| `INCENTIVOS_CONTROL_LEER` | Control interno de pendientes, liquidados y trazabilidad | Administrador de empresa o Contabilidad; autorizaciones nominales expresas de Alexander y Daria según su ámbito |
| `INCENTIVOS_CALCULAR` | Operación de cálculo interno, diferenciada de registro de ventas | No conceder por ser jefe; comprobar atribución autorizada antes de implementar |
| `INCENTIVOS_APROBAR` | Aprobar incentivo, si se formaliza un paso diferenciado | No atribuir automáticamente a ningún rol: circuito específico pendiente |
| `LIQUIDACIONES_ACCEDER` | Entrar a la función interna de Liquidaciones | Administrador de empresa, Alexander o Daria; no todos los adjuntos |
| `LIQUIDACIONES_MARCAR` | Registrar la liquidación y su evidencia | Administrador de empresa, Alexander o Daria mediante capacidad específica; el acceso de lectura de Contabilidad no la concede |
| `CONFIGURACION_GESTIONAR` | Parámetros/accesos dentro de la atribución técnica | Administración autorizada; sin acceso financiero implícito |

**Requisito PERM-01:** filtros y controles se aplicarán en las lecturas, endpoints, acciones, exportaciones y caché, además del menú. Ocultar la pestaña no protege por sí solo los datos.

**Requisito PERM-02:** una liquidación ajena no debe llegar a la respuesta personal y quedar solamente oculta por JavaScript. La futura comprobación debe incluir acceso directo al dato.

**Requisito PERM-03:** ni la pertenencia a un departamento ni un rol transversal sustituyen una autorización para Liquidaciones. Identificar las cuentas autorizadas sin guardar identificadores personales en esta especificación.

**Requisito PERM-04:** registrar ventas, validar partes/FIO y gestionar equipo no concede ver importes o estados monetarios de terceros.

## 4. Jornada, saldos y estados: significado único

### 4.1. Relación de planificación, fichaje y balance

| Concepto | Significado | Situación actual y presentación propuesta |
|---|---|---|
| Horas previstas | Horas de las asignaciones del plan | Planificación semanal; el borrador no acredita publicación |
| Horas registradas | Tiempo recogido por Bitrix24 | Agregado actual de Horas mensuales; no llamarlo validado por defecto |
| Horas validadas | Horas revisadas con responsable, evidencia y criterio | Circuito mensual integrado: no encontrado; `[NO DATA]` sobre operación real |
| Balance de horas | Comparación usando periodo, persona, unidad y definición comunes | Área propuesta; Horas mensuales es una vista mensual dentro de ella |
| Periodo cerrado | Conjunto de datos estabilizado, con cierre y rectificación trazables | No se encontró cierre laboral mensual equivalente; no inventar estado “cerrado” |
| Parte operativo validado | Revisión de lo declarado y ejecutado en el parte | Mantener en Operación; no confundirlo con validación de todo el tiempo Bitrix |
| Cierre de caja | Cierre y revisión del registro económico de caja | Mantener en Producción e incentivos; no equivale a cierre de jornada |
| Liquidación interna | Registro de liquidación de un incentivo/premio | Mantener restringida y separada de horas, nómina oficial y aprobación laboral |

Planificación Horaria incorpora borradores, ausencias, condiciones y movimientos. La revisión contiene `bitrixWriteSupported: false` y rechazo de publicación no soportada. La organización propuesta no elimina ese límite.

### 4.2. Festivos trabajados y descanso compensatorio

**SAL-01 — Nombre:** “Festivos pendientes de compensar”.

**SAL-02 — Ciclo:** festivo trabajado acreditado → derecho pendiente → descanso compensatorio previsto → descanso disfrutado y validado → reducción del pendiente.

**SAL-03 — Definición del saldo:**

```text
saldo pendiente = saldo de apertura confirmado
                + derechos por festivos trabajados posteriores al corte
                - compensaciones disfrutadas y validadas posteriores al corte
                + ajustes auditados
```

Ejemplo conceptual sin datos de empleados: apertura de 2 días, 1 festivo trabajado posterior y 1 día compensatorio disfrutado dan 2 días pendientes. Programar otro descanso futuro permite mostrar 1 día reservado y 1 todavía disponible para planificar; no genera otro saldo ni borra el movimiento original.

**SAL-04 — Unidad y corte:** conservar la unidad confirmada y la fecha de apertura. No convertir automáticamente días en horas ni recomputar como nuevos derechos los festivos anteriores ya incluidos en el saldo de apertura.

**SAL-05 — Validación:** la mera fecha en un calendario de festivos no prueba que una persona trabajó. Vincular el derecho al trabajo acreditado y la compensación a una ausencia de ese motivo efectivamente disfrutada. Una solicitud o borrador no prueba consumo definitivo.

**SAL-06 — No duplicación:** la ausencia por compensación se muestra en Planificación/Ausencias y su movimiento en Saldos. Ambas vistas representan el mismo hecho. Una edición o reimportación no debe generar dos cargos.

**Estado técnico actual:** `planning-server.js` lee una confirmación auditada con `ambito = festivos_compensacion`, `saldo_dias` y `fecha_operativa`. Esto acredita cómo se obtiene el saldo mostrado en el código; no demuestra una generación/consumo automático a partir de fichajes y ausencias. Ese ciclo LIVE queda en `[NO DATA]`.

### 4.3. Vacaciones, extras y recuperación

- Vacaciones: separar derecho, apertura por año, movimientos posteriores, reserva futura y saldo; conservar días naturales/laborables y el corte. No sumar derecho anual y saldo restante como si fueran dos derechos distintos.
- Extras y recuperación: mostrar movimientos de `extra_recuperacion_movimientos`; no volver a contar como “horas pendientes” una misma hora ya incluida en el balance. La existencia de un saldo acumulado integrado no quedó acreditada.
- Ausencias: un lugar principal de registro en Jornada y saldos; el informe de jefe y la previsión deben reutilizarlas. La adaptación de `planificacion_ausencias` y `employee_status` requiere trabajo posterior.
- Cero confirmado y ausencia de datos son distintos: conservar `[NO DATA]` cuando no exista apertura, unidad o evidencia suficiente.

## 5. Producción, incentivos y liquidaciones

### 5.1. Estados económicos diferentes

| Concepto | Definición | Quién lo consulta |
|---|---|---|
| Producción/ventas | Hechos del negocio, con origen y periodo | Operadores, responsables y Dirección dentro de su ámbito |
| Incentivo calculado | Resultado de reglas aplicadas a una producción y periodo | Control financiero autorizado; cálculo provisional etiquetado |
| Incentivo aprobado | Resultado aprobado por el circuito establecido | Control financiero autorizado; no asumir que el paso existe hoy |
| Incentivo pendiente de pagar | Obligación interna que todavía no está liquidada | Titular exclusivamente lo propio; control financiero autorizado |
| Incentivo liquidado | Incentivo registrado como liquidado en el circuito interno | Control financiero autorizado; desaparece de la vista del empleado |
| Pago acreditado | Pago con evidencia suficiente | Solo ámbito financiero autorizado; no deducir pago bancario de una etiqueta o cálculo |

La interfaz actual de Entrenadores usa `liquidado` y texto de pagado; Recepción persiste liquidaciones, y HK maneja estados de premio. No se verificó un circuito homogéneo cálculo → aprobación → pago. El futuro adaptador de estados deberá respetar cada fuente sin tratar automáticamente todo cálculo como pendiente de pagar.

**INC-01:** tras liquidar, el incentivo deja de aparecer en la vista personal, incluidos históricos, gráficos, totales, exportaciones, notificaciones y justificantes accesibles desde ella.

**INC-02:** “desaparecer” significa excluirlo de la vista personal, no borrar el registro. Mantener auditoría y control interno autorizado.

**INC-03:** la vista personal no debe mezclar producción, previsión de bono y deuda aprobada bajo un mismo total de “pendiente de pagar”.

**INC-04:** toda acción que marque liquidado necesita el permiso específico y registro de actor/fecha/evidencia ya soportada o expresamente definida en la implementación posterior.

**INC-05:** el premio HK semestral sigue en el mismo dominio económico interno, con sus reglas y periodos; no se transforma en un saldo laboral.

### 5.2. Un registro de producción, varias vistas

| Departamento | Fuente/ruta encontrada | Reutilización y destino |
|---|---|---|
| Sala | Importación de archivos históricos POSMEWS → `sala_produccion_semanal`; importador de incentivos separado → `employee_sales_weekly` | Registro principal en Producción/Ventas; Dashboard y cálculo deben leer el mismo hecho de venta. Unificar origen no consiste solo en mover botones |
| Cocina | Formularios/reglas de costes y ventas asociados a incentivo; varias vistas de KPI/Ventas pendientes | Conservar funciones existentes. Ventas LIVE de Muse POS y horas de Bitrix se prepararán en otro trabajo |
| Recepción Hotel | Ventas asociadas a caja/parte, `recepcion_ventas`; cálculo servidor en `/api/reception-incentives` | Aprovechar reutilización existente, distinguir estado de caja y estado de incentivo |
| Entrenadores | Declaración personal en parte/KPI y datos oficiales importados de VirtuGym en `entrenadores_incentivos_mes` | Mantener ambos propósitos con nombres claros: declaración y dato oficial. No pedir reintroducir el dato oficial para liquidación |
| Housekeeping | Ejecución/ausencias/FIO y premio semestral en circuito específico | Producción operativa en Operación/HK; premio y liquidación solo en control autorizado |
| Otros departamentos | Subtabs o catálogos con funciones “próximamente” | Mantener como catálogo pendiente, sin entradas operativas ni integración nueva |

Reglas de incentivos: Configuración. Datos que originan el cálculo: Producción. Control de cálculo/pendiente/liquidado: vista restringida. Consultas de empleados: únicamente pendientes propios.

### 5.3. Trabajo posterior: ventas Muse POS ↔ horas Bitrix24

**DAT-01 — Alcance futuro confirmado:** Sala y Cocina son prioritarias. Fuente de ventas: Muse POS mediante API, según Alexander. Fuente de horas reales: Bitrix24, aprovechando `bitrix_time_records` y el circuito existente.

**DAT-02 — Ubicación:** el registro/control del origen de ventas pertenece a Producción/Ventas. La consulta de horas pertenece a Jornada y saldos. Resultados cruza ambas fuentes; incentivos consume la misma producción autorizada sin una segunda introducción.

**DAT-03 — Relación:** conservar fecha operativa, departamento/servicio, periodo y origen. Usar el identificador de empleado solo cuando la fuente permita atribución fiable. No inventar ventas individuales de Cocina a partir de un total departamental.

**DAT-04 — Métricas:** ventas por hora trabajada se calcula sobre el mismo ámbito y periodo. Definir bruto/neto, anulaciones, descuentos y límites de jornada en ese trabajo; no mezclar ventas departamentales con horas individuales.

**DAT-05 — Diferencia de nombres:** el código contiene un importador `POSMEWS`; Alexander indica `Muse POS` como origen objetivo. No asumir que la carga de archivos actual es una conexión API LIVE ni que su contrato coincide con el proveedor objetivo.

**DAT-06 — Exclusión actual:** no instalar conectores, investigar credenciales, llamar a la API de ventas, alterar sincronización de Bitrix, ejecutar importaciones o diseñar migraciones en esta entrega.

## D. Mapa completo de reorganización

Los identificadores actuales se conservan aquí para que una implementación pueda localizar las funciones. Los destinos son propuestas; no rutas ya implementadas.

| Pestaña o función actual / código | Destino propuesto | Acción | Motivo |
|---|---|---|---|
| `readme` — Info | Ayuda contextual de Mi día y del puesto | Mover acceso | Ayuda donde se ejecuta el trabajo |
| `turno` — Mi Turno | Mi día → Mi turno | Mantener | Punto principal del trabajo personal |
| `chk-mod` y checklists del turno | Mi día → Checklist, dentro del flujo del puesto | Unificar acceso | Conservar checklist especializado y su fuente |
| `ruta-mod` — Mi Ruta | Mi día → Mi ruta | Mantener | Ejecución HK personal |
| `gestiones` | Operación → Gestiones; enlace a mis pendientes | Mover | Seguimiento departamental y personal con una fuente |
| `tareas` | Operación → Tareas; enlace a mis tareas | Mover | Asignación y seguimiento únicos |
| `incidencias` | Operación → Incidencias | Mantener dentro del área | Seguimiento, cierre y evidencias |
| `hypoxic` — Hypoxic Room | Operación → Sala hipóxica | Renombrar y mover | Nombre comprensible; conservar especialización |
| `notas-mod` — Nota | Mi día → Registrar nota; Operación → Notas | Unificar acceso | Un registro con vista personal y de revisión |
| `merma-mod` | Operación → Merma | Mover | Registro, valoración y revisión próximos |
| `validacion` → Turnos | Operación → Partes y revisión | Mover y renombrar | Revisión del parte, separada del fichaje |
| `validacion` → Operativo | Operación → Revisiones de gestiones/tareas/incidencias/hipóxica | Unificar accesos | Revisar dentro de la función correspondiente |
| `validacion` → Merma | Operación → Merma → Revisión | Mover | Una pantalla de dominio |
| `validacion` → Notas | Operación → Notas → Revisión | Unificar | Evitar acceso duplicado de revisión |
| `validacion` → FIO | Equipo → FIO → Revisión | Mover | Misma fuente y permisos de FIO |
| `validacion` → Cierre Caja | Producción e incentivos → Cajas → Revisión | Mover | Registro y revisión económicos juntos |
| Cajas Sala/`rec-caja-op`/`lab-caja-op` y pantalla `rec-caja` | Producción e incentivos → Cajas, con acceso contextual desde el turno | Unificar accesos | Conservar cierre, traspaso y departamento |
| Ajustes de caja, `ajustes-mod`, KPI de caja, cargos a hotel y traspasos | Producción e incentivos → Cajas → Detalle/ajustes/cargos | Mover acceso | No crear una segunda caja ni registro de venta |
| `hk-plan` — Planificación HK | Operación → Housekeeping → Asignaciones | Renombrar y mover | Asigna limpieza; es distinta de horarios laborales |
| `hk-zonas` — Zonas públicas | Operación → Housekeeping → Zonas públicas | Mover | Ejecución e histórico especializado |
| `hk-revision` — Inspecciones | Operación → Housekeeping → Inspecciones | Mover | Mantener revisión y solicitud de corrección |
| `hk-dash` — Dashboard HK | Operación → Housekeeping → Seguimiento | Renombrar y mover | Resumen operativo útil; no eliminar visualización |
| `hk-config` — Configuración HK | Configuración → Housekeeping | Mover | Catálogos/tiempos, con permisos HK existentes |
| `mant-mod` — Mantenimiento | Operación → Mantenimiento | Mover | Tablero técnico de las mismas tareas/incidencias |
| `planificacion-horaria` | Jornada y saldos → Planificación | Mover | Parrilla semanal, cobertura y asignación de personas |
| Condiciones laborales y convenios de planificación | Equipo → Condiciones; referencias desde Jornada | Mover acceso de gestión | Fuente única; no duplicar el contrato |
| Ausencias de planificación | Jornada y saldos → Ausencias | Unificar punto principal | Informes y previsión reutilizan el registro |
| Extras/recuperación de planificación | Jornada y saldos → Balance → Movimientos | Mover vista | Distinguir movimiento de saldo acumulado |
| Vacaciones actuales/anteriores/históricas | Jornada y saldos → Saldos → Vacaciones | Mover vista | Una fuente, años y unidades separados |
| Festivos/compensación confirmados | Jornada y saldos → Saldos → Festivos pendientes de compensar | Renombrar | Saldo único de derechos y consumos |
| `fichaje` — alertas/importador | Jornada y saldos → Fichajes → Incidencias de marcaje | Renombrar contenido y mover | El código actual muestra alertas, no todo el registro |
| Entradas/salidas y patrones que aparecen en Horas mensuales | Jornada y saldos → Fichajes/Balance → Detalle de tiempo | Mover vistas existentes | Misma fuente Bitrix; no nuevo registro manual |
| `horas-mes` — resumen, evolución, patrones, ranking y comparación | Jornada y saldos → Balance de horas → Vista mensual/detalle | Unificar y retirar pestaña independiente | Mantener análisis y CSV; distinguir registrado/validado |
| Backfill/importación técnica de Bitrix | Configuración → Herramientas de datos | Mover acceso | No tratar ejecución masiva como consulta o reporte |
| `informes` → Sala → Ventas/Datos y cargas POSMEWS | Producción e incentivos → Ventas → Sala | Mover | Registrar producción fuera del reporting |
| `informes` → Entrenadores → KPI/datos oficiales VirtuGym | Producción e incentivos → Producción → Entrenadores | Mover | Separar dato oficial y declaración personal |
| Otros KPI/ventas implementados | Producción e incentivos → Producción del departamento | Mover | Mantener campos y fuentes reales |
| `informes` → Incentivos y `incentivos` del catálogo | Producción e incentivos → Control de incentivos, restringido | Unificar acceso | No habilitar control monetario de terceros a jefes por defecto |
| Cálculo de incentivos Sala/Cocina/Recepción/Entrenadores | Producción e incentivos → Control de incentivos → Cálculo | Mover | Una función interna separada de producción y pago |
| Reglas, métodos y objetivos de incentivos | Configuración → Reglas de incentivos | Mover | Cambiar regla no equivale a consultar resultados |
| `liquidaciones` — Recepción/Entrenadores/premio HK | Producción e incentivos → Liquidaciones internas | Mover y retirar acceso general | Solo autorizaciones confirmadas; no nómina oficial |
| `mi-rendimiento` → incentivos personales | Producción e incentivos → Mis incentivos pendientes; enlace desde Mi día | Renombrar y limitar contenido | Solo pendientes propios; liquidados desaparecen |
| `mi-rendimiento` → declaración/KPI personal | Mi día → Mi producción declarada; resultados propios autorizados | Separar contenido | Conservar información operativa sin exponer liquidaciones |
| `mi-rendimiento` → equipo/importación/liquidar Entrenadores | Producción e incentivos → Producción o control interno, según acción | Mover | Gestión de terceros no pertenece a una vista personal |
| `informes` → Informe de Jefe semanal/mensual/semestral/evento | Resultados e informes → Informes de departamento | Mantener y mover acceso | Resumen narrativo, publicación y explicación |
| Ausencias/vacaciones/bajas del Informe de Jefe | Jornada y saldos → Ausencias; referencia en el informe | Unificar punto de registro propuesto | Conservar dependencias y evitar introducir ausencia dos veces |
| `informes` → RRHH | Jornada y saldos/Equipo, según campo | Mover | Control laboral accesible en su ámbito |
| `dashboard` → Turnos/Incidencias/Gestiones/Merma/FIO/Tareas | Resultados e informes → Resumen y detalle | Mantener visualizaciones | Resumen ejecutivo distinto del trabajo operativo |
| Acciones de edición/borrado presentes en Dashboard | Función de dominio correspondiente, con permiso actual | Mover acceso | Consulta enlaza a gestión; no suprimir función por visualizarse dos veces |
| Dashboard → Costes | Resultados e informes → Costes estimados | Renombrar alcance | `shifts.horas × employees.coste` es estimación, no nómina oficial |
| Dashboard → Previsión | Jornada y saldos → Planificación → Cobertura estimada | Mover y etiquetar | Usa históricos/ausencias; no presentarla como turnos ya asignados |
| `maestro` — Equipo/Maestro | Equipo → Plantilla | Renombrar | Fichas, estado, jerarquía y gestión dentro de ámbito |
| `fio` — Gestión FIO | Equipo → FIO | Mover | Registro, revisión, disputa y resolución |
| `mis-fio` | Mi día → Mis FIO; misma vista personal de Equipo | Unificar accesos | Consulta propia; no duplicar faltas |
| `export` — CSV operativos/de plantilla | Resultados e informes → Exportaciones autorizadas | Mover | Mantener filtros y alcance del dato |
| Backup JSON/importación/copia y herramientas de migración existentes | Configuración → Herramientas de datos | Mover | Administración técnica, separada de informes |
| Invitación, restablecimiento de acceso y gestión IP desde ficha | Configuración → Accesos; enlace contextual desde ficha | Mover acceso | Mantener capacidades restringidas |
| Adjuntos/fotos/evidencias; abrir detalle/cerrar/reabrir/corregir/validar | Dentro de la función que origina el registro | Mantener | No son módulos independientes; conservar trazabilidad y permisos |
| Subtabs KPI/Ventas/Horas extra “próximamente”, Fisioterapeutas y Marketing deshabilitados | Catálogo de funciones pendientes, fuera del menú operativo | Retirar únicamente del menú disponible | No declarar implementado ni eliminar el trabajo futuro |
| Código auxiliar o legado no cargado, por ejemplo `faults.js` | Referencia técnica; función activa FIO en Equipo | No activar ni crear acceso nuevo | Evitar duplicar la función activa |

No se propone borrar funciones, tablas o historial. Retirar del menú significa retirar un acceso independiente o no operativo, conservando el destino de las funciones existentes.

## E. Ejemplo de uso

### Jefe de departamento

1. En Jornada y saldos → Planificación prepara la semana, asigna personas y comprueba ausencias/cobertura. El borrador conserva su estado; no se presume publicación en Bitrix.
2. Durante la semana, el equipo trabaja desde Mi día. El jefe sigue tareas, incidencias, partes y revisiones desde Operación.
3. En Jornada y saldos → Fichajes consulta incidencias de marcaje y el tiempo procedente de Bitrix. Una alerta no sustituye a los intervalos reales.
4. En Balance → Vista mensual compara previsto y registrado sobre el mismo periodo. La futura validación integrada necesita evidencia y circuito; hoy no se declara disponible.
5. Revisa vacaciones y compensación de festivos: un festivo trabajado aumenta el derecho acreditado y el descanso compensatorio disfrutado reduce el mismo saldo, evitando duplicación.
6. Consulta producción departamental y redacta su informe. No accede por defecto a importes pendientes/liquidados de incentivos de terceros ni los liquida.
7. Consulta el cierre mensual cuando exista y esté autorizado. El diseño no convierte el botón de validar un parte en cierre de mes.

### Dirección, empleado y control financiero

- Dirección abre Resultados e informes para consultar producción, desviaciones y costes estimados; accede al detalle de origen autorizado.
- El empleado abre Mis incentivos pendientes y consulta exclusivamente lo suyo. Tras liquidarse un incentivo, deja de aparecer en todas sus vistas personales.
- El administrador de empresa o Contabilidad consulta el control de pendientes/liquidados. Alexander y Daria disponen de acceso nominal a Liquidaciones; la acción de marcar exige su capacidad específica.
- El registro de liquidación permanece en la trazabilidad interna. No se borra al desaparecer de la vista del empleado.
- Los resultados de ventas por hora trabajada de Sala/Cocina utilizarán ventas Muse POS y horas Bitrix cuando se autorice e implemente el trabajo de integración posterior.

## F. Decisiones y trabajo pendiente

### Confirmado; no volver a plantearlo como duda

- Liquidaciones es interna y de acceso restringido.
- Autorizaciones nominales de Liquidaciones: administrador de empresa, Alexander y Daria.
- Control de pendientes/liquidados: administrador de empresa o Contabilidad.
- Empleado: solo incentivos propios pendientes; liquidados fuera de su vista.
- Festivos compensación: derechos por festivos trabajados y consumo por descanso compensatorio.
- Origen objetivo de ventas: Muse POS; horas reales: Bitrix24; prioridad Sala/Cocina.
- Integración LIVE: otro trabajo.

### Propuesta documentada pendiente de implementación autorizada

La organización en siete áreas, sus nombres, el mapa de accesos y los permisos propuestos. Esta entrega no solicita ni presupone autorización para implementar. La siguiente petición de implementación deberá indicar ese alcance; fusionar con `main` continúa requiriendo autorización expresa.

### Comprobaciones técnicas pendientes antes de implementar

1. Correspondencia de cuentas/capacidades de administrador de empresa, Alexander, Daria y Contabilidad; no asumir que `canActAsAdmin` equivale a esa lista.
2. Relación real entre `sala_produccion_semanal` y `employee_sales_weekly`, incluidos posibles procesos LIVE no examinados.
3. Trazabilidad del saldo confirmado de festivos hasta los hechos que generan/consumen derechos; vínculo de ausencias entre circuitos.
4. Definición de incentivo aprobado/pendiente de pagar y equivalencia de estados por departamento; permisos separados de lectura y liquidación.
5. Existencia y alcance de validación/cierre laboral mensual; si no existen, mantenerlos claramente pendientes sin crearlos por un cambio de menú.
6. Contrato de la API Muse POS y criterios de ventas/hora para Sala/Cocina, exclusivamente en la tarea futura.

No quedan dudas de significado sobre festivos ni sobre la visibilidad personal solicitada. Los puntos anteriores son verificaciones técnicas, no una petición de redefinir esas decisiones.

## 9. Criterios de aceptación para una implementación posterior

Estos criterios no se han ejecutado como pruebas del nuevo comportamiento, porque no se implementó ningún cambio.

| Código | Criterio observable |
|---|---|
| NAV-01 | Cada identificador y función del mapa tiene un destino; no quedan accesos huérfanos |
| NAV-02 | Cada perfil encuentra su trabajo principal en la primera vista y conserva su ámbito |
| NAV-03 | Horas mensuales queda como vista del balance; no desaparecen análisis, filtros ni exportaciones existentes |
| NAV-04 | Dashboard resume y enlaza al detalle; Informes contiene explicación y reporting; registro de ventas está en Producción |
| PERM-05 | Empleado no recibe ni muestra incentivos propios liquidados, tampoco por acceso directo, históricos, gráficos o exportación |
| PERM-06 | Empleado no recibe incentivos de terceros; jefe/RRHH/adjunto no obtienen control financiero por su rol operativo |
| PERM-07 | Contabilidad autorizada consulta pendientes/liquidados, pero no puede marcar liquidado sin capacidad adicional |
| PERM-08 | Liquidaciones solo admite la autorización de negocio confirmada, también en endpoints y acciones |
| SAL-07 | Un festivo trabajado genera una sola acreditación; una compensación disfrutada consume una sola vez; reintentos no duplican |
| SAL-08 | Un descanso futuro no se contabiliza como nuevo derecho; apertura/corte/unidad impiden doble cómputo |
| SAL-09 | Vacaciones, festivos y extras se distinguen y cada saldo comparte definición/fuente en todas las vistas |
| DAT-07 | La misma venta alimenta producción, resultados y cálculo sin segunda introducción cuando se conecten las fuentes |
| DAT-08 | Datos registrados, validados y de periodo cerrado se identifican sin atribuir estados no acreditados |
| INC-06 | Liquidar excluye el incentivo de la vista del titular y conserva registro y auditoría internos |
| LIM-01 | Integración Muse POS, migraciones y datos LIVE quedan fuera de la reorganización salvo autorización posterior específica |

## 10. Referencias de código para implementar después

Todas las rutas siguientes existen en la revisión remota examinada `ce78f882c300e686fe40ad22134a900c840c3d91`. Son códigos y localizadores de implementación, no una autorización de modificación.

| Función | Archivo / identificadores relevantes |
|---|---|
| Catálogo, navegación y permisos UI | [shared.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/shared.js): `getScreens`, `showScreen`, `canActAsAdmin`, `isContable`, `isTecnicoRrhh` |
| Pantallas, subtabs y scripts activos | [index.html](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/index.html) |
| Ámbito y gobierno organizativo | [lib/authz-server.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/lib/authz-server.js), [lib/org-governance.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/lib/org-governance.js) |
| Planificación, ausencias y saldos | [planificacion_horaria.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/planificacion_horaria.js), [lib/planning-domain.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/lib/planning-domain.js), [lib/planning-server.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/lib/planning-server.js), `api/planning/*` |
| Alertas de marcaje | [fichaje.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/fichaje.js): `renderFichaje`, `bitrix_alerts` |
| Tiempo registrado y agregación mensual | [horas_mensuales.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/horas_mensuales.js), [api/monthly-hours.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/api/monthly-hours.js), `bitrix_time_records` |
| Entrada de tiempos Bitrix | [api/bitrix-sync.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/api/bitrix-sync.js); sincronización/backfill se citan, no se ejecutaron |
| Informes, producción Sala e importación histórica | [informes.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/informes.js): `INF_DEPT_CATALOG`, `canAccessInformes`, `_infPersistSalaSemana`; [posmews_ventas.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/posmews_ventas.js) |
| Cálculo/importación de incentivos | [incentivos.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/incentivos.js): `renderIncentivos`, `incImportarExcel`, `employee_sales_weekly` |
| Vistas personales y equipo Entrenadores | [mi_rendimiento.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/mi_rendimiento.js): `renderMiRendimiento`, `_mrLiquidarConfirm`, `entrenadores_incentivos_mes` |
| Liquidaciones unificadas | [housekeeping_incentivos.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/housekeeping_incentivos.js): `renderLiquidacionesPorDepartamento` |
| Recepción y premio HK | [api/reception-incentives.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/api/reception-incentives.js), [api/housekeeping-semester-incentives.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/api/housekeeping-semester-incentives.js) |
| Resumen, costes y previsión | [dashboard.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/dashboard.js): `renderDashboard`, `renderCostTable`, `renderDashPrevision`; [api/kpi-sala-labor.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/api/kpi-sala-labor.js) |
| Revisión operativa/caja | [validacion.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/validacion.js), `shared.js` y `index.html`; partes y modales no equivalen a cierre mensual |
| Operación HK y mantenimiento | [housekeeping.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/housekeeping.js), [mantenimiento.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/mantenimiento.js) |
| Observaciones laborales FIO | [fio.js](https://github.com/AlexSfera/syncro_hub/blob/ce78f882c300e686fe40ad22134a900c840c3d91/fio.js): `renderFIOScreen`, `renderMisFIOScreen` |

## 11. Entrega documental, comprobaciones y reversión

- Alcance de entrega: añadir exclusivamente este documento a una rama `codex/...` de GitHub, derivada del commit de `main` examinado. Las referencias fijadas a Producción evitan confundir su código con el de `main`.
- No se modifican MASTER_DOCUMENTATION, MODULE_STATUS ni CURRENT_STATE para atribuir un nuevo estado operativo: la aplicación y sus funciones no han cambiado.
- Comprobaciones proporcionales: correspondencia de código con revisión remota; existencia de archivos citados; cobertura del catálogo de navegación en el mapa; códigos de requisito únicos; revisión de contenido y lectura posterior del documento guardado; diff remoto limitado al documento.
- Pruebas del nuevo menú/permisos: no ejecutadas, porque no se implementan. Pantalla autenticada, grants/RLS actuales y flujo de pago LIVE: `[NO DATA]`.
- GitHub: rama y commit documentales. No fusionar con `main`. Un PR documental en borrador, si se crea, no autoriza implementación ni fusión.
- Vercel: no se solicitó despliegue, promoción ni cambio de configuración. La integración Git creó una Preview automática al guardar el documento (primera observación: `dpl_36xqL1WgJEKFjCnz9DqqgEjP527P`, READY). Esa Preview corresponde a la rama documental derivada de `main`, conserva el código de esa base y no implementa ni valida la propuesta. No sustituye a la Preview de referencia de Producción indicada en el apartado 2. Producción mantiene `ce78f88` y `dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g`. Supabase y Bitrix: sin cambios. Muse POS: sin conexión.
- Reversión: revertir el commit documental con un nuevo commit o cerrar el PR sin fusionarlo. No borrar datos, reescribir historial ni revertir despliegues por este documento.
- Decisión posterior: autorizar expresamente la implementación de la reorganización y precisar su alcance. La integración LIVE de ventas/horas permanece como tarea independiente.
