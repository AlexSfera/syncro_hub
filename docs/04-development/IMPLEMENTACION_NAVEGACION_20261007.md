# Navegación operativa y permisos — implementación del 07/10/2026

Estado: IMPLEMENTADO y TESTEADO localmente. Publicación en Producción BLOQUEADA por permisos de Supabase pendientes de autorización específica. No atribuir este cambio a la aplicación LIVE.

## Base y alcance

- Especificación autorizada: NAVEGACION_OPERATIVA_PERMISOS_20261007.md, revisión documental original 81ec27421eb19715dee8517d834f64bfff493615.
- Código de referencia: Producción ce78f882c300e686fe40ad22134a900c840c3d91; tree remoto d51ad4dda38420c66eff90a01b1db24df2caea9e.
- main sigue en 38074d99302009228dee8fd8c31fa69c475fc1ab. No equivale a Producción. No se fusiona.
- Rama de trabajo: codex/navegacion-permisos-20261007. Checkout aislado de cambios ajenos.
- Se reutilizan pantallas y fuentes existentes. No se conectan POSMEWS/MEWS con Bitrix, no se crean balances o cierres mensuales, ni se ejecutan sincronizaciones, backfills, pagos o datos LIVE.

## Navegación implementada

| Área | Funciones existentes y destino |
|---|---|
| Mi día | Mi Turno, Mi Ruta HK, checklist, notas, Mis FIO; actividad declarada de Entrenadores separada de pagos; Ayuda accesible desde cabecera |
| Operación | Gestiones, tareas, incidencias, Sala hipóxica, merma, Partes y revisión; asignaciones, zonas, inspecciones y seguimiento HK; mantenimiento |
| Jornada y saldos | Planificación; Fichajes con incidencias de marcaje; Balance con vista mensual, evolución, patrones, comparación y CSV; vacaciones y festivos; cobertura estimada; histórico de disponibilidad para sus perfiles anteriores |
| Producción e incentivos | Cajas y revisión con sus permisos previos; entrada de ventas Sala y producción oficial Entrenadores; Mis incentivos pendientes; Control de incentivos y Liquidaciones internas restringidos |
| Resultados e informes | Resumen de resultados, informes narrativos por departamento y exportaciones; sin duplicar la importación de producción |
| Equipo | Plantilla, FIO y acceso a condiciones laborales; gestión según el ámbito y los permisos existentes |
| Configuración | Configuración HK conservada para sus responsables; reglas de incentivos y herramientas de copia/datos/Bitrix para administración |

Los contenidos marcados próximamente no se convierten en herramientas disponibles. Los formularios de costes/ventas e importación Excel vinculados al cálculo de Sala/Cocina se conservan dentro del control autorizado. El método de Entrenadores conserva su configuración contextual en la importación; las reglas generales tienen acceso en Configuración.

## Accesos del cambio

| Capacidad | Implementación | Límite |
|---|---|---|
| INCENTIVOS_PROPIOS_PENDIENTES_LEER | GET /api/pending-incentives, identidad de sesión; sin aceptar otro empleado | Excluye liquidaciones y evita recuperar un pago mediante una copia genérica |
| INCENTIVOS_CONTROL_LEER | admin o contable en UI, API Recepción y API HK | Un jefe, RRHH o adjunto operativo no obtiene esta capacidad |
| LIQUIDACIONES_MARCAR | admin en UI y endpoints | contable consulta; no marca por defecto |
| PRODUCCION_ENTRENADORES_LEER | GET /api/trainer-production devuelve contadores y planes, sin importes ni estados de pago | Propio empleado o equipo autorizado |
| PRODUCCION_ENTRENADORES_IMPORTAR | POST /api/trainer-production; personas activas identificadas y ámbito comprobado | Sin nombres no identificados, personas fuera del equipo o reimportación de liquidado |
| METODOS_ENTRENADORES_CONFIGURAR | POST action configure, admin | Campos permitidos y rangos comprobados; no se aceptan importes calculados del navegador |
| HORAS_MENSUALES_LEER | GET /api/monthly-hours filtra personas antes del agregado y ranking | Empleado propio; responsable equipo; Dirección/RRHH según capacidad existente; contable no recibe horas generales por ser contable |

La cuenta BOSS activa y Daria tienen rol admin en la evidencia consultada; no se asignaron roles ni se concedieron excepciones por nombres. La identidad y su versión de autorización siguen el circuito seguro existente.

La caché del navegador identifica usuario y ámbito, rechaza respuestas de una sesión anterior y se limpia al salir. La caché global de horas solo se reutiliza para admin.

## Fuentes y estados

- Entrenadores: producción oficial importada y contadores declarados son vistas diferentes. El servidor calcula desde la configuración de la ficha con las fórmulas existentes. Un upsert conserva el identificador y no borra todo el mes.
- Pendientes propios: registros genéricos con status approved; importes oficiales positivos de Entrenadores no liquidados; premio HK pendiente; Recepción reutiliza el cálculo existente desde sus ventas de cierres y excluye meses liquidados. Esta consulta no crea un nuevo paso de aprobación.
- Sala/Cocina: no se convierte un cálculo provisional no registrado en una aprobación ni en una obligación de pago.
- Registro de liquidación e histórico interno se conservan; desaparecer de la vista personal no borra datos.
- Horas del Balance son registradas en Bitrix24. Validación laboral mensual y cierre: [NO DATA]. Validar un parte operativo no valida el mes.
- Festivos: se conserva la lectura del saldo confirmado, su unidad y corte; se explica generación y consumo del mismo derecho. Generación/consumo automático desde fichajes y ausencias: [NO DATA], sin motor nuevo.
- Disponibilidad employee_status y ausencias de planificación conservan sus fuentes existentes. Conciliación automática entre ambas: pendiente de trabajo posterior, como indicaba la especificación.

## Comprobaciones

- npm run check: sintaxis de aplicación, endpoints y nuevos archivos.
- npm test: 186 pruebas superadas, una omitida (E2E de autenticación con Supabase local no disponible); regresión existente y pruebas de capacidades, IDOR, pendientes/liquidados, duplicados, ámbito de importación, cálculo confiable, reimportación pagada y caché de horas/sesión.
- scripts/check-navigation-browser.js: 30 escenarios Chrome local, 10 perfiles × 390/768/1366 px. HTML/CSS, catálogo y controlador reales; renderizadores de dominio y datos simulados. Comprueba montaje/restauración, una pantalla activa, configuración, pendientes, denegaciones y menús dentro del viewport. No es un flujo autenticado LIVE.
- La comprobación Chrome detectó contenedores duplicados y colocación incorrecta de copias. Se corrigieron y los 30 escenarios pasaron.
- Árbol/diff: no se cambian integración, cron, main ni datos de negocio.
- PostgreSQL de la protección preparada, RLS con sesiones LIVE y pantalla autenticada de Producción: [NO DATA].

## Bloqueo concreto de Supabase

Lectura de pg_policies confirmó políticas permisivas para cualquier sesión válida en employee_incentives, entrenadores_incentivos_mes, incentivos_liquidaciones y dept_incentive_rules. employees también permite mutaciones con una sesión válida, por lo que ocultar el menú o filtrar una API no basta: un cliente podría consultar REST o cambiar su rol.

Protección preparada, SIN aplicar:
- supabase/changes/navigation_incentives_access.sql: techos restrictivos de lectura admin/contable y escritura admin sobre esas cuatro tablas y employees; el listado autorizado sigue por /api/auth/employees. Trigger impide alterar/borrar un incentivo Entrenadores ya liquidado, también ante una carrera de importación.
- supabase/changes/navigation_incentives_access_rollback.sql: revierte únicamente los nuevos techos/trigger; no borra registros. Restablecer acceso amplio requiere aprobación.
- HK ya dispone de RLS y permisos de tabla/RPC solo para service_role; sus cuatro RPC financieros no son ejecutables por anon/authenticated. No se cambian sus grants.
- No se aplicó una migración. El SQL preparado debe probarse antes de dar por cumplidas las garantías de acceso directo.
- PROJECT_RULES.md: modificar Supabase LIVE requiere autorización específica de migración o datos. La autorización de implementación/despliegue no la sustituye.

## Publicación y reversión

Guardar esta rama en GitHub permite revisar el código y puede generar una Preview automática de Vercel. Esa Preview no acredita protección de Supabase ni comportamiento LIVE. No promover a Producción mientras el bloqueo de permisos siga pendiente.

Producción comprobada por Vercel antes del cambio: dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g, ce78f88, dominio syncro-shift.vercel.app. No se solicitó otra publicación en Producción.

Reversión del código: nuevo commit que revierta los cambios de esta rama; no reescribir historial ni modificar datos. Si se publica tras completar permisos, conservar ce78f88 como referencia anterior y verificar el dominio después de volver a esa revisión.

Decisión necesaria: autorizar específicamente la protección de permisos preparada en Supabase LIVE, tras su revisión y comprobaciones. Fusionar main e integrar POSMEWS siguen sin autorización.
