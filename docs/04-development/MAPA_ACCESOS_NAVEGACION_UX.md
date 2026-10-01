# Mapa de accesos y arquitectura de navegación

Fecha de auditoría: 1 de octubre de 2026  
Base auditada: Producción `272a9cb` / deployment `dpl_2KiN5G6FWCngYiaA5xvExn9UG3SX`

## Resultado final definido

La navegación se organiza por alcance de trabajo, no por fecha de creación del módulo:

1. **Mi día**: lo que la persona debe registrar, ejecutar o cerrar hoy.
2. **Mi departamento**: planificación, jornada, validación y resultados del equipo.
3. **Manager**: control, personas, disciplina, informes y configuración.

Para Administración, los mismos niveles se nombran según su alcance real: **Operación**, **Equipo** y **Dirección**. Para Contabilidad se reduce a un único sector: **Control contable**.

La reorganización no concede ni retira permisos. Cambia la posición, el nombre visible de algunos accesos y su explicación.

## Problemas confirmados en la arquitectura anterior

- `Mi día` mezclaba registro personal, seguimiento, disciplina y planificación.
- `Mi departamento` mezclaba validación, alertas, rendimiento y módulos especializados sin subtítulos.
- `Manager Bar` mezclaba control ejecutivo, personas, exportaciones, horas y planificación.
- Housekeeping aparecía como un cuarto sector separado, aunque funcionalmente pertenece al departamento.
- Administración veía operaciones globales bajo el nombre `Mi departamento`, que no representaba su alcance.
- Los botones solo mostraban el nombre; no explicaban para qué servía cada pantalla.
- En móvil se intentaban mostrar todos los accesos en la barra inferior.

## Arquitectura aplicada

### Mi día

Propósito: ejecución personal y cierre de jornada.

- **Registro y cierre**: Mi Turno, Mi Ruta, Checklist, Caja y Merma, según puesto.
- **Seguimiento**: Gestiones, Incidencias, Tareas, Hypoxic Room y Nota.

### Mi departamento

Propósito: ver y controlar el trabajo del equipo autorizado.

- **Planificación y jornada**: Planificación Horaria, Validación, Fichajes y Mantenimiento, según rol.
- **Rendimiento y disciplina**: Mis FIO y Mi Rendimiento.
- **Operación Housekeeping**: Revisión HK, Dashboard HK, Planificación HK y Zonas públicas.

### Manager

Propósito: gestión y control, no ejecución diaria.

- **Control**: Dashboard e Informes.
- **Personas y disciplina**: Equipo y Gestión FIO.
- **Configuración**: Configuración HK cuando aplica.

### Administración

- **Operación**: seguimiento global y supervisión transversal.
- **Equipo**: planificación, fichajes, horas, personas y disciplina.
- **Dirección**: Dashboard, Informes y Exportar.

### Control contable

- **Cierres**: Validación, iniciada en Cierre de caja y en modo de consulta.
- **Consulta**: Dashboard y Planificación Horaria.

## Catálogo de accesos

| Acceso | Para qué sirve | Fuente principal |
|---|---|---|
| Mi Turno | Registrar y cerrar la jornada operativa | SYNCRO SHIFT; fichajes conciliados con Bitrix24 |
| Mi Ruta | Ejecutar la ruta asignada de Housekeeping | SYNCRO SHIFT |
| Checklist | Completar controles obligatorios del puesto | SYNCRO SHIFT |
| Caja | Registrar traspaso o cierre de caja | Recepción o SYNCROLAB según puesto |
| Merma | Registrar desperdicio, cantidad y causa | SYNCRO SHIFT |
| Gestiones | Continuidad de pendientes del departamento | SYNCRO SHIFT |
| Incidencias | Registrar hechos que requieren seguimiento o decisión | SYNCRO SHIFT |
| Tareas | Delegar acciones entre departamentos | SYNCRO SHIFT |
| Hypoxic Room | Registrar y seguir incidencias de la sala hipóxica | SYNCRO SHIFT |
| Nota | Registrar una nota o sugerencia de mejora | SYNCRO SHIFT |
| Planificación Horaria | Consultar o preparar cuadrantes, ausencias y vacaciones | Catálogo Bitrix24; planificación SYNCRO SHIFT |
| Validación | Revisar turnos, operativa, caja, merma, notas y FIO | SYNCRO SHIFT |
| Fichajes | Consultar marcajes y alertas de jornada | Bitrix24 Timeman |
| Mantenimiento | Priorizar y seguir el trabajo técnico | SYNCRO SHIFT |
| Mis FIO | Consultar observaciones asociadas a la persona | SYNCRO SHIFT |
| Mi Rendimiento | Consultar producción, incentivos y evolución | SYNCRO SHIFT y fuentes departamentales |
| Revisión HK | Revisar trabajos terminados y pedir correcciones | SYNCRO SHIFT |
| Dashboard HK | Controlar ejecución, tiempos y estado de Housekeeping | SYNCRO SHIFT |
| Planificación HK | Asignar habitaciones, zonas y tareas periódicas | SYNCRO SHIFT |
| Zonas públicas | Controlar limpieza e histórico de zonas comunes | SYNCRO SHIFT |
| Dashboard | Control ejecutivo de KPI, costes y previsión | SYNCRO SHIFT y fuentes departamentales |
| Informes | Registrar datos y reportes por departamento | SYNCRO SHIFT; POSMEWS solo en flujos confirmados |
| Equipo | Consultar y gestionar personas dentro del alcance autorizado | Directorio SYNCRO SHIFT |
| Gestión FIO | Registrar, revisar y resolver faltas u observaciones | SYNCRO SHIFT |
| Configuración HK | Configurar habitaciones, zonas, periódicas y tiempos | SYNCRO SHIFT |
| Liquidaciones | Controlar incentivos pendientes y liquidados | SYNCRO SHIFT |
| Horas Mensuales | Control mensual de horas reales | Bitrix24 Timeman |
| Exportar | Extraer datos operativos y copias de control | SYNCRO SHIFT |

## Mapa por rol

La tabla enumera solo accesos visibles. El alcance de datos sigue limitado por departamento y por las reglas de autorización existentes.

| Rol / puesto | Mi día u Operación | Mi departamento o Equipo | Manager, Dirección o Control |
|---|---|---|---|
| Administrador | Gestiones, Incidencias, Tareas, Hypoxic Room; Validación, Mantenimiento, Dashboard HK, Liquidaciones | Planificación Horaria, Fichajes, Horas Mensuales; Equipo, Gestión FIO | Dashboard, Informes, Exportar |
| Adjunto Directivo | Mi Turno, Nota; Gestiones, Incidencias, Tareas, Mis FIO | Planificación Horaria, Validación, Fichajes; Dashboard HK, Liquidaciones | Dashboard, Informes; Equipo, Gestión FIO; Exportar |
| Contable | [NO APLICA] | [NO APLICA] | Validación de cierres; Dashboard; Planificación Horaria |
| Técnico de Recursos Humanos | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO | Equipo, Gestión FIO |
| F&B Manager | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Jefe / Segundo Jefe de Cocina | Mi Turno, Merma, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Jefe / Jefe de Sector de Sala | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Jefe / Subjefe de Recepción | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Hypoxic Room, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Gobernanta / Subgobernanta | Mi Ruta, Checklist, Mi Turno; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento; Revisión HK, Dashboard HK, Planificación HK, Zonas públicas | Dashboard, Informes; Equipo, Gestión FIO; Configuración HK |
| Jefe de Mantenimiento | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Hypoxic Room, Nota | Planificación Horaria, Validación, Mantenimiento, Fichajes; Mis FIO | Dashboard, Informes; Equipo, Gestión FIO |
| Club Manager | Mi Turno, Checklist, Caja; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Coordinación Atención al Cliente SYNCROLAB | Mi Turno, Checklist, Caja; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Coordinación Entrenadores | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Coordinación Fisioterapeutas | Mi Turno, Checklist, Caja; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Validación, Fichajes; Mis FIO, Mi Rendimiento | Dashboard, Informes; Equipo, Gestión FIO |
| Empleado Cocina | Mi Turno, Merma, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Fichajes; Mis FIO, Mi Rendimiento | [NO APLICA] |
| Empleado Recepción | Mi Turno, Checklist, Caja; Gestiones, Incidencias, Tareas, Hypoxic Room, Nota | Planificación Horaria, Fichajes; Mis FIO, Mi Rendimiento | [NO APLICA] |
| Empleado Housekeeping | Mi Ruta, Checklist, Mi Turno; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Fichajes; Mis FIO, Mi Rendimiento | [NO APLICA] |
| Empleado Mantenimiento | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Hypoxic Room, Nota | Planificación Horaria, Fichajes; Mis FIO | [NO APLICA] |
| Entrenador | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Fichajes; Mis FIO, Mi Rendimiento | [NO APLICA] |
| Fisioterapeuta | Mi Turno, Checklist; Gestiones, Incidencias, Tareas, Nota | Planificación Horaria, Fichajes; Mis FIO, Mi Rendimiento | [NO APLICA] |

## Mapa de pestañas internas

### Validación

| Pestaña | Finalidad |
|---|---|
| Turnos | Validar registros de jornada o pedir corrección |
| Operativo | Revisar gestiones, incidencias y tareas relacionadas con los turnos |
| Cierre caja | Revisar cierres y traspasos; Contabilidad entra aquí en consulta |
| Merma | Revisar merma registrada |
| Notas | Revisar notas de empleados |
| FIO | Revisar y validar FIO cuando el rol lo permite |

### Dashboard

| Pestaña | Finalidad |
|---|---|
| Turnos | Estado y volumen de turnos |
| Incidencias | Seguimiento de incidencias |
| Gestiones | Seguimiento de gestiones pendientes |
| Merma | Coste y evolución de merma |
| FIO | Control agregado de FIO |
| Tareas | Control de tareas interdepartamentales |
| Costes | Horas y costes estimados |
| Previsión | Cuadrante y previsión operativa |

### Informes

Nivel 1: departamento visible según rol.  
Nivel 2: tipo de dato disponible para ese departamento.

- KPI: entrada o control de indicadores.
- Ventas / Datos: carga de datos operativos o comerciales.
- Incentivos: datos base para cálculo.
- Informe de Jefe: reporte cualitativo del responsable.
- Horas Extra: registro específico de Mantenimiento.
- RR.HH.: bajas y reporte de personas.

### Housekeeping

- Revisión HK: trabajos terminados y correcciones.
- Dashboard HK: estado, tiempos y cumplimiento.
- Planificación HK: asignaciones del día.
- Zonas públicas: ejecución e histórico de zonas.
- Configuración HK: Habitaciones, Zonas, Periódicas y Tipos de limpieza.

### Planificación Horaria

No usa pestañas independientes. Se organiza por departamento y semana. La edición permite turnos, descansos, ausencias, vacaciones, extras/recuperación y condiciones laborales según permiso. La escritura automática en ShiftPlan de Bitrix24 continúa bloqueada hasta disponer de una API oficial documentada.

## Reglas UX de cierre

- Un sector responde a una pregunta: `¿qué hago hoy?`, `¿qué controlo de mi equipo?` o `¿qué gestiono como responsable?`.
- Cada acceso muestra nombre y descripción; no se depende del icono para entenderlo.
- El sector activo queda marcado aunque su menú esté cerrado.
- En móvil se muestran como máximo cinco accesos frecuentes en la barra inferior; el mapa completo permanece en los sectores superiores.
- La navegación no sustituye la autorización del servidor ni amplía el alcance de datos.

