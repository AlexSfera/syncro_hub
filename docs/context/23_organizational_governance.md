# Gobernanza organizativa de SYNCRO HUB

## Principio

El puesto es la fuente de verdad. Al seleccionar un puesto, el sistema deriva
automáticamente el departamento, el rol técnico, el nivel de acceso y la
capacidad de validación. Un superior solo puede gestionar puestos de rango
inferior dentro de su ámbito.

## Niveles de acceso

| Nivel | Alcance | Puestos | Permisos principales |
|---|---|---|---|
| 5 | Global y seguridad | Administrador | Acceso total; configuración; usuarios, incluidos Administradores; validación y eliminación controlada. |
| 4 | Global operativo | Adjunto Directivo | Todos los departamentos, validaciones, reporting y gestión de puestos inferiores. Nunca gestiona Administradores. |
| 3 | Departamento matriz | F&B Manager, Club Manager | Supervisa las unidades incluidas, responsables/coordinadores y personal. No accede a otros departamentos ni a Dirección. |
| 2 | Jefatura o coordinación | Jefaturas, segundos responsables, coordinadores y Técnico de Recursos Humanos | Valida y gestiona únicamente puestos subordinados dentro de su ámbito. |
| 1 | Operativo | Personal operativo y Contable | Trabajo propio. Contable dispone de lectura financiera y dashboard, sin validación ni gestión de usuarios. |

Dentro del nivel 2 existe orden jerárquico: la jefatura principal está por
encima de segundos responsables y coordinadores. Estos últimos están por
encima del personal operativo.

## Matriz de roles, permisos y accesos

El nombre de rol entre código es técnico y no sustituye al puesto visible del
empleado. El puesto sigue siendo la fuente de verdad para el rango exacto.

| Rol técnico | Puestos asociados | Nivel / rango | Ámbito | Accesos principales | Validación | Gestión de personas y límites |
|---|---|---:|---|---|---|---|
| `admin` | Administrador | 5 / 100 | Toda la organización | Todos los módulos, seguridad, configuración, Dashboard, Maestro, exportación e informes | Global, incluidos casos críticos | Gestiona cualquier puesto, incluidos Administradores; eliminación controlada de bajas. |
| `adjunto` (`adjunto_directivo` como alias) | Adjunto Directivo | 4 / 90 | Toda la operación | Validación, dashboards, Maestro, FIO, liquidaciones, exportación e informes globales | Global operativa | Gestiona puestos de rango inferior; nunca Administradores ni configuración de seguridad. |
| `fb` | F&B Manager | 3 / 80 | Restaurante: Sala y Cocina | Validación, Dashboard, Maestro, FIO e informes de Restaurante | Sala y Cocina; puede resolver casos críticos de su matriz | Gestiona jefaturas, segundos responsables y personal de Sala/Cocina; sin acceso a otros departamentos. |
| `jefe` | Club Manager | 3 / 80 por puesto | Todo SYNCROLAB | Validación, Dashboard, Maestro, FIO e informes de los tres segmentos | Todo SYNCROLAB; puede resolver casos críticos de su matriz | Gestiona coordinadores y personal de Atención al Cliente, Entrenadores y Fisioterapia; sin acceso externo. |
| `tecnico_rrhh` | Técnico de Recursos Humanos | 2 / 70 | Administración y RRHH | Validación, Maestro y FIO. Sin acceso a Dashboard, Liquidaciones, Hypoxic Room ni Informes | Solo Administración/RRHH | Gestiona puestos inferiores de su ámbito. Nunca Administrador, Adjunto Directivo, seguridad global ni casos críticos L4/L5. |
| `chef` | Jefe de Cocina; Segundo Jefe de Cocina | 2 / 70 o 60 | Cocina | Validación, Dashboard, Maestro, FIO e informes de Cocina | Cocina | El Jefe gestiona al Segundo y al personal; el Segundo solo al personal. |
| `supervisor` | Jefe de Sala; Jefe de Sector | 2 / 70 o 60 | Sala | Validación, Dashboard, Maestro, FIO e informes de Sala | Sala | El Jefe gestiona al Jefe de Sector y al personal; el Jefe de Sector solo al personal. |
| `jefe_recepcion` | Jefe de Recepción; Subjefe de Recepción | 2 / 70 o 60 | Recepción Hotel | Validación, Dashboard, Maestro, FIO, caja e informes de Recepción | Recepción Hotel | El Jefe gestiona al Subjefe y al personal; el Subjefe solo al personal. |
| `gobernante` | Gobernanta | 2 / 70 | Housekeeping | Validación, Dashboard, Maestro, FIO, planificación y configuración de Housekeeping | Housekeeping | Gestiona Subgobernanta y personal de pisos. |
| `subgobernante` | Subgobernanta | 2 / 60 | Housekeeping | Validación, Dashboard, Maestro, FIO, planificación y configuración de Housekeeping | Housekeeping | Gestiona únicamente personal operativo de pisos. |
| `jefe_mantenimiento` | Jefe de Mantenimiento | 2 / 70 | Mantenimiento | Validación, Dashboard, Maestro, FIO e informes de Mantenimiento | Mantenimiento | Gestiona Técnicos de Mantenimiento. |
| `coord_recepcion_syncrolab` | Coordinador(a) de Atención al Cliente | 2 / 60 | Atención a clientes SYNCROLAB | Validación, Dashboard, Maestro, FIO e informes del segmento | Solo Atención a clientes | Gestiona únicamente personal de Atención al Cliente. |
| `coord_entrenadores` | Coordinador(a) de Entrenadores | 2 / 60 | Entrenadores | Validación, Dashboard, Maestro, FIO e informes del segmento | Solo Entrenadores | Gestiona únicamente Entrenadores. |
| `coord_fisioterapeutas` | Coordinador(a) de Fisioterapeutas | 2 / 60 | Fisioterapia | Validación, Dashboard, Maestro, FIO e informes del segmento | Solo Fisioterapia | Gestiona únicamente Fisioterapeutas. |
| `contable` | Contable | 1 / 20 | Cajas y lectura financiera | Validación en modo lectura para Caja y Dashboard | No valida | No gestiona personas ni cambia permisos. |
| `empleado` | Todos los puestos operativos | 1 / 10 | Trabajo propio y datos compartidos de su departamento | Mi Turno, checklist, gestiones, tareas, incidencias, notas y módulos operativos del puesto | No valida | No gestiona personas ni accede a Maestro. |

## Departamentos y puestos

### Restaurante / F&B

- F&B Manager: superior de Sala y Cocina.
- Cocina: Jefe de Cocina → Segundo Jefe de Cocina → Cocinero/a, Ayudante de cocina y Freelancer.
- Sala: Jefe de Sala → Jefe de Sector → Camarero/a y Ayudante camarero/a.

### Recepción / Hotel

- Jefe de Recepción → Subjefe de Recepción → Recepcionista, Ayudante de Recepción y Auditor de Noche.

### Housekeeping

- Gobernanta → Subgobernanta → Camarera de pisos y Ayudante camarera de pisos.
- No asignables: Camarero de pisos, Ayudante camarero de pisos y Lavandería.

### Mantenimiento

- Jefe de Mantenimiento → Técnico.

### SYNCROLAB

- Club Manager: superior de todo SYNCROLAB.
- Atención a clientes: Coordinador(a) de Atención al Cliente → Atención al Cliente.
- Entrenadores: Coordinador(a) de Entrenadores → Entrenador(a).
- Fisioterapia: Coordinador(a) de Fisioterapeutas → Fisioterapeuta.

El Club Manager puede ver, validar y gestionar los tres segmentos y sus
coordinadores. Cada coordinador queda limitado a su propio segmento.

### Dirección

- Administrador: nivel 5.
- Adjunto Directivo: nivel 4.
- Técnico de Recursos Humanos: rol técnico independiente `tecnico_rrhh`, nivel 2 y rango 70. Mantiene capacidades de jefatura dentro de Administración/RRHH, pero no accede a Dashboard, Liquidaciones, Hypoxic Room ni Informes; nunca recibe permisos de Administrador ni de Adjunto Directivo.
- Contable: nivel 1 con acceso financiero de lectura.

## Compatibilidad histórica

Los puestos retirados continúan siendo legibles en fichas existentes para no
romper el histórico, pero ya no aparecen al crear empleados nuevos ni pueden
reasignarse a otra persona.
