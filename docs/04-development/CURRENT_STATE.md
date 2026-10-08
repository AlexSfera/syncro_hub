## Incentivos y autocontrol — 08/10/2026
Esta sección prevalece sobre el estado anterior del módulo.
- IMPLEMENTADO y TESTEADO: una sola entrada Incentivos y liquidaciones; un selector de departamento; autocontrol con detalle de ocho indicadores y partes en Entrenadores, referencias de reserva declaradas y ventas en Recepción, criterios guardados en Housekeeping y cálculo guardado en Sala/Cocina.
- «6» se sustituye por «6 indicadores con diferencias»; ausencia de partes, lectura fallida y archivo incompleto se distinguen, con [NO DATA] cuando faltan datos.
- Permisos y fórmulas conservados: admin/contable consultan; solo admin liquida. Los detalles se limpian al cerrar sesión.
- Pruebas: sintaxis PASS; 196 pruebas PASS, 0 FAIL y 1 E2E omitida; 30 escenarios Chrome de diez perfiles y tres anchos, con clics de autocontrol y datos ficticios.
- Integración directa de reservas de alojamiento vendidas y conciliación MEWS: [NO DATA]. Recepción usa las referencias de reserva declaradas en ventas cross-sell de cierres. Desglose de Sala/Cocina y fechas individuales de Housekeeping no incluidos en los registros consultados: [NO DATA].
- PRODUCCIÓN según Vercel: dpl_2EHAywYVzE31zudUusoneofgwRQf, READY, target production, código bf1907fa9e35daf44d4e4c2e47fe16268520a5d2 desde 2026-10-08T13:54:01.889Z. El dominio syncro-shift.vercel.app devuelve el mismo deployment y revisión. Preview dpl_4NVwYKLEnjbHBMptVmbVvLDPFQyG también READY; build de ambos confirma 196 PASS, 0 FAIL y 1 omitida.
- Reversión de aplicación: dpl_G5LMLN86SbsJbTigVCcxNAddYTjL (1ecbe1da9c31e1f38d7608ce4021d7f7ed74f717). Sin cambios de Supabase, datos LIVE, main, cron ni Bitrix24. Pantalla con sesión real posterior a este despliegue: [NO DATA].
- Detalle y reversión: docs/04-development/FINAL_REPORT_AUTOCONTROL_20261008.md.

---

## Estado comprobado — 08/10/2026

Esta sección prevalece sobre los estados históricos inferiores.

- IMPLEMENTADO y TESTEADO: reorganización en siete áreas y permisos de incentivos. Código de aplicación equivalente a `8f0c1d7cb758c9376d16d710af1a0d5418ee75f9`; el cierre solo añade documentación, estado de SQL y arranque de fixtures.
- PRODUCCIÓN: Vercel confirma `dpl_G5LMLN86SbsJbTigVCcxNAddYTjL`, READY, target production, revisión `1ecbe1da9c31e1f38d7608ce4021d7f7ed74f717`, desde 08/10/2026 09:11:47 UTC. La consulta de `syncro-shift.vercel.app` devuelve ese mismo deployment y revisión.
- Conexión Vercel restaurada tras reconectar Alexander. Lectura del equipo/proyecto y despliegue autorizados completados. Los errores 403/404 de conexión anteriores son históricos.
- Preview probada de la revisión publicada: `dpl_4i38mttSD7iYuP43MQb4Lk6hoaVQ`, READY. Producción se reconstruyó desde esa Preview con `withLatestCommit:false`.
- Pruebas: `npm run check` correcto; `npm test` 188 PASS, 0 FAIL y 1 E2E omitida. Build de Producción repite y confirma esos resultados. Navegación Chrome: 30 escenarios PASS (10 perfiles, 390/768/1366 px), datos ficticios.
- Supabase LIVE: protección específicamente autorizada el 08/10/2026. Migración `20261008073541 navigation_incentives_access` aplicada; 20 políticas restrictivas y trigger de conservación de liquidaciones confirmados.
- Acceso directo RLS comprobado mediante transacciones de solo lectura: admin/contable leen el control financiero; empleado/jefe/jefe_recepcion/adjunto no reciben registros. Sin claims válidos se reciben cero registros. No se cambiaron datos de empleados, saldos, producción ni pagos.
- `employees` ya carece de grants de SELECT para authenticated; las fichas continúan por la API con proyección y permisos. No se concedieron nuevos grants.
- Observación inicial: Vercel no registra errores de runtime entre la disponibilidad del deployment y la consulta posterior. La ventana breve no demuestra todos los flujos.
- Pantalla y endpoints con sesión real: [NO DATA]. El lector HTTP de Preview recibe el 403 del control de IP del recinto; la apertura del navegador de Producción fue rechazada por su política de permisos. No se cambió la lista de IP ni se eludieron esos controles.
- `main` sigue en `38074d99302009228dee8fd8c31fa69c475fc1ab`, sin fusión. El cierre permanece en `codex/cierre-navegacion-permisos-20261008`. POSMEWS–Bitrix24, cron y backfills quedan fuera del alcance.
- Reversión de aplicación: `ce78f882c300e686fe40ad22134a900c840c3d91` / `dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g`. La protección de datos debe conservarse; su rollback requiere autorización específica para restablecer el acceso anterior.
- Informe: `docs/04-development/FINAL_REPORT_NAVEGACION_20261008.md`. No queda una decisión necesaria para el despliegue realizado.

---

## Navegación operativa y permisos — 07/10/2026
Esta sección prevalece sobre los estados históricos inferiores.
- IMPLEMENTADO: siete áreas de trabajo; Jornada reúne planificación, fichajes y balance mensual; producción se separa de informes y pagos.
- Código guardado en GitHub: codex/navegacion-permisos-20261007, revisión de código 8f0c1d7cb758c9376d16d710af1a0d5418ee75f9.
- TESTEADO localmente: sintaxis, 188 pruebas superadas y una E2E omitida; 30 escenarios Chrome con datos ficticios. No representan sesiones LIVE.
- PREVIEW: revisión de código 8f0c1d7 READY, dpl_HUz39jFx6WYQSHBwbRMy2eEHm4B3, según Vercel. La lectura de la aplicación por el conector devolvió 403; login y flujo autenticado: [NO DATA].
- BLOQUEO DE PRODUCCIÓN: RLS financiero actual demasiado amplio. Protección preparada en supabase/changes/navigation_incentives_access.sql, SIN aplicar y pendiente de autorización específica.
- Producción sigue en ce78f88 y dpl_Dnx8sJTTsmT2RHMN5YUg5ipF5P5g; main sigue en 38074d9. No se fusiona ni se cambian datos LIVE, cron o integraciones.
- Evidencia, alcance y reversión: docs/04-development/IMPLEMENTACION_NAVEGACION_20261007.md.

---

## Publicación comprobada — 07/10/2026
Esta sección prevalece sobre los estados históricos inferiores.
- PRODUCCIÓN según el control de Vercel: el código `0391a0fdd0704af3014383a15c796a0f2e4bd4de`, interfaz V4.3, alcanzó READY en `dpl_AJ7BW1uy64AeD8GN3L9B4jnW5tBy`; `https://syncro-shift.vercel.app/` resolvió al mismo deployment y commit. Las revisiones posteriores de este cierre son exclusivamente documentales.
- TESTEADO antes de publicar: 173 pruebas superadas, una omitida y 88 escenarios de Chrome local con perfiles ficticios. El build mantiene `npm run check && npm test`.
- Permisos de ChatGPT comprobados: Vercel ya tiene Allow all actions; no se modificó ninguna preferencia. La petición actual superó aprobación y alcanzó la API.
- Publicación resuelta: Preview debe reconstruirse para Production. La llamada Promote sin reconstrucción devolvió 422; se utilizó create deployment con deploymentId exacto, target production y withLatestCommit false.
- Sin cambios de main, Supabase LIVE, migraciones, Bitrix24 ni configuración de Windows.
- Pantalla autenticada y lectura HTTP directa de la web: [NO DATA]. La sesión local no permite red y el lector Vercel de páginas devolvió 403 al consultar protección; esto limita la comprobación de pantalla, no invalida el READY ni la asignación del dominio confirmados por Vercel.
- Reversión: deployment previo `dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV`. No revertir datos ni borrar auditoría.
- Procedimiento duradero: docs/04-development/RELEASE_RECONCILIACION_20261006.md, apartado Publicación reproducible.

---

## Actualizacion de saldos y consulta — 06/10/2026
Esta seccion prevalece sobre los recuentos historicos inferiores.
- Datos: 60 empleados conciliados, 52 saldos cero de 2025, 129 movimientos totales y siete periodos de ausencia conservados. Cinco exclusiones por instruccion de Alexander.
- Confirmacion CEO: compensacion adicional, correccion de un saldo, reparto de 27 dias entre 2023 y 2024 y cuatro saldos de festivos/compensacion confirmados a cero. El detalle personal permanece exclusivamente en la auditoria de Supabase.
- Consulta: tabla **Saldos de vacaciones** dentro de Planificacion Horaria, con años anteriores y festivos confirmados. Incluye fichas con saldo aunque esten Sin asignar o Baja, sin habilitarlas para asignar turnos ni modificar sus estados.
- Permisos: direccion y RRHH consultan todos los saldos; los responsables consultan su departamento y cada empleado su saldo. La parrilla semanal conserva el filtro de empleados activos.
- Ayuda: boton ⓘ Cómo consultar. El cero certificado se distingue de [NO DATA].
- Pruebas: casos de historia anual, ceros, permisos, ficha sin asignar y escape HTML; la compilacion del deployment ejecuta los tests de planificacion.
- Produccion previa recuperable: dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV. La revision publicada se acredita mediante el deployment READY y su commit en Vercel.
- Reversion de datos: movimientos compensatorios y confirmaciones auditadas posteriores; nunca borrar historial. Reversion de pantalla: volver al deployment previo.
- Pantalla autenticada real: [NO DATA] hasta comprobar una sesion. No se aplican migraciones, condiciones contractuales ni cambios de Bitrix24.

---

## Continuación verificada de datos — 04/10/2026
Esta sección prevalece sobre los recuentos inferiores. Tras confirmar Alexander las nueve correspondencias de identidad pendientes, se corrigieron dos vínculos existentes y se crearon siete referencias internas mínimas en Supabase LIVE.
Resultado de la carga: **57 personas**, **114 aperturas anuales**, **49 ceros de 2025** y corte **30/09/2026**. De las 65 filas originales, cinco están excluidas por decisión de Alexander y tres mantienen contradicciones de saldo. Las 18 aperturas de esta continuación coinciden con los saldos y unidades de la plantilla; el lote conserva los 100 movimientos anteriores, incluidos los distintos de apertura.
Las siete referencias nuevas quedan **Sin asignar**, con rol mínimo empleado, sin credenciales, invitaciones ni facultades de responsable o validador. No se modifica su estado a Activo o Baja porque la consulta directa de Bitrix24 está bloqueada en esta sesión. Esas referencias no aparecen en el filtro de empleados activos de Planificación Horaria. La identidad y el ID se respaldan con la plantilla y la confirmación expresa de Alexander.
La pantalla autenticada y el estado actual de Bitrix24 siguen en **[NO DATA]**. La versión de pantalla del commit `ae4e3b7` permanece en Preview; no hubo cambio en el deployment de Producción ni en `main` en esta continuación.
Reversión: restaurar únicamente los dos vínculos con los valores anteriores registrados en auditoría; compensar exclusivamente las aperturas nuevas no nulas y conservar las aperturas cero, referencias internas e historial. No aplicar el rollback del CHECK con aperturas cero existentes.

---

## Actualización verificada — 04/10/2026

Esta sección prevalece para Planificación Horaria sobre el inventario histórico inferior.
Alcance: saldos certificados de vacaciones con corte **30/09/2026**; no se usa la fecha de activación de Bitrix como fecha contractual.

| Elemento | Estado | Evidencia |
|---|---|---|
| Aperturas 2026 y pendiente 2025 | VERIFICADO | 48 empleados conciliados con la fuente; 40 aperturas cero de 2025 incorporadas |
| Ausencias futuras | VERIFICADO | 7 periodos importados, sin consumir el saldo de apertura |
| Admisión de apertura cero | CONECTADO | Migración LIVE 20261004164824; consumos negativos y otros movimientos no nulos conservan sus restricciones |
| Fecha de corte en pantalla | IMPLEMENTADO / TESTEADO | Bootstrap usa la fecha operativa de la auditoría; prueba de render con cero y corte |
| Comprobación visual con sesión real | [NO DATA] | No se ha ejecutado una sesión autenticada de empleado o supervisor |
| Horas trabajadas y fechas contractuales | [NO DATA] | La fuente aportada no acredita esos datos |

La importación cubre **48 de 65 filas**. Permanecen 17 sin cargar: 5 incompletas, 9 sin vínculo inequívoco con un empleado existente y 3 con contradicciones o liquidación pendiente. No se inventan ceros para filas sin datos.
La pantalla conserva el filtro existente de empleados activos: los saldos históricos de empleados con otro estado no aparecen en ese listado.

Reglas vigentes: [PROJECT_RULES.md](../../PROJECT_RULES.md).
Rama de entrega: `codex/vacaciones-cero-corte-20260930`, basada en la revisión operativa `9e21b8acf64f25d369fe8584315235e131846ee1`; `main` se conserva.
Reversión de pantalla: deployment anterior `dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV`.
La reversión del CHECK SQL está protegida y se detiene si existen aperturas cero: no elimina ni modifica el historial certificado.

---

# SYNCRO Shift — Estado actual del proyecto

## 1. Objetivo

Este documento registra el estado real y verificable del proyecto SYNCRO Shift.

La existencia de un archivo de código o de una documentación no significa automáticamente que una funcionalidad:

- esté terminada;
- funcione correctamente;
- haya sido probada;
- esté desplegada;
- esté aprobada funcionalmente.

Cuando no exista evidencia suficiente se utilizará:

`[NO DATA]`

## 2. Escala de estado

| Estado | Significado |
|---|---|
| NO VERIFICADO | Existe código o documentación, pero no se ha comprobado su funcionamiento |
| PARCIAL | Parte de la funcionalidad está implementada |
| IMPLEMENTADO | El código parece completo, pendiente de validación funcional |
| VERIFICADO | La funcionalidad ha sido probada y cumple los criterios definidos |
| BLOQUEADO | Existe un impedimento técnico o funcional |
| NO INICIADO | No existe implementación identificada |
| OBSOLETO | La implementación o documentación ya no debe utilizarse |

## 3. Estado general

| Área | Estado actual |
|---|---|
| Repositorio GitHub | VERIFICADO |
| Rama estable `main` | EXISTE |
| Rama de backup pre-Codex | VERIFICADO |
| Rama de documentación Claude–Codex | VERIFICADO |
| Despliegue Vercel | [NO DATA] |
| Proyecto Supabase | EXISTE, configuración no verificada |
| Migraciones Supabase versionadas | [NO DATA] |
| Tests automáticos | [NO DATA] |
| Build automatizado | [NO DATA] |
| Lint | [NO DATA] |
| Integración Bitrix24 | EXISTE, funcionamiento no verificado |
| Integración de correo | EXISTE, funcionamiento no verificado |
| Documentación funcional | EXISTE, en proceso de consolidación |
| Documentación arquitectónica | EXISTE parcialmente y requiere validación |
| `AGENTS.md` para Codex | EXISTE |
| `CLAUDE.md` para Claude | NO INICIADO |

## 4. Inventario preliminar de módulos

| ID | Módulo | Archivo principal identificado | Documentación identificada | Estado | Validación |
|---|---|---|---|---|---|
| MOD-001 | Núcleo compartido | `shared.js` | Varios documentos de contexto | NO VERIFICADO | Pendiente |
| MOD-002 | Interfaz principal | `index.html` | `00_overview.md` | NO VERIFICADO | Pendiente |
| MOD-003 | Recepción | `recepcion.js` | `04_departments.md` | NO VERIFICADO | Pendiente |
| MOD-004 | Turnos | `mi_turno.js` | `05_shifts_and_checklists.md`, `22_auto_turno_assignment.md`, `23_feat_turno_auto_implementation.md` | NO VERIFICADO | Pendiente |
| MOD-005 | Checklists | `checklist.js` | `05_shifts_and_checklists.md` | NO VERIFICADO | Pendiente |
| MOD-006 | Fichaje | `fichaje.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-007 | Caja | `caja.js` | `10_caja_all.md` | NO VERIFICADO | Pendiente |
| MOD-008 | Sala | `sala.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-009 | SYNCROLAB | `syncrolab.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-010 | Validaciones | `validacion.js` | `14_validations.md` | NO VERIFICADO | Pendiente |
| MOD-011 | Incidencias | `incidencias.js` | `07_incidents.md` | NO VERIFICADO | Pendiente |
| MOD-012 | Tipos de incidencia | `incidencia_tipos.js` | `07_incidents.md` | NO VERIFICADO | Pendiente |
| MOD-013 | Gestiones pendientes | `gestiones.js` | `08_pending_managements.md` | NO VERIFICADO | Pendiente |
| MOD-014 | Tareas | `tareas.js` | `09_tasks.md` | NO VERIFICADO | Pendiente |
| MOD-015 | Housekeeping | `housekeeping.js` | `20_housekeeping.md` | NO VERIFICADO | Pendiente |
| MOD-016 | Mantenimiento | `mantenimiento.js` | `21_maintenance_purchases.md` | NO VERIFICADO | Pendiente |
| MOD-017 | Informes | `informes.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-018 | Dashboard | `dashboard.js` | `_ARCHIVE/15_dashboard.md` | NO VERIFICADO | Pendiente |
| MOD-019 | Rendimiento individual | `mi_rendimiento.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-020 | Incentivos | `incentivos.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-021 | Merma de cocina | `merma.js` | `13_kitchen_waste.md` | NO VERIFICADO | Pendiente |
| MOD-022 | Hipoxia | `hypoxic.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-023 | Adjuntos | `adjuntos.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-024 | FIO | `fio.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-025 | Fallos técnicos | `faults.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-026 | Middleware | `middleware.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-027 | Sincronización Bitrix24 | `bitrix-sync.js`, `api/bitrix-sync.js` | [NO DATA] | NO VERIFICADO | Pendiente |
| MOD-028 | Envío de correo | `api/send-email.js` | [NO DATA] | NO VERIFICADO | Pendiente |

## 5. Riesgos identificados

### 5.1 Documentación contradictoria

Existen documentos activos, archivados, reemplazados y consolidados en diferentes momentos.

Riesgo:

- Codex podría implementar una especificación obsoleta;
- Claude podría basarse en una conversación anterior;
- el código real podría no coincidir con la documentación.

### 5.2 Falta de pruebas verificadas

No se ha confirmado todavía la existencia de:

- tests unitarios;
- tests de integración;
- tests end-to-end;
- proceso automático de build;
- proceso automático de lint.

Estado: `[NO DATA]`

### 5.3 Modelo de datos no versionado

Existe documentación relacionada con Supabase, pero todavía no se ha confirmado:

- si las tablas reales coinciden con la documentación;
- si existen migraciones SQL;
- si las políticas RLS están versionadas;
- si las funciones y triggers están documentados.

Estado: `[NO DATA]`

### 5.4 Archivos de gran tamaño

Existen archivos JavaScript con muchas responsabilidades, especialmente:

- `shared.js`;
- `validacion.js`;
- `housekeeping.js`;
- `informes.js`;
- `recepcion.js`;
- `caja.js`;
- `dashboard.js`;
- `mi_turno.js`.

No se autoriza una refactorización general hasta comprender:

- dependencias;
- flujo de carga;
- funciones compartidas;
- impacto sobre módulos;
- comportamiento en producción.

### 5.5 Credenciales y secretos

Las credenciales no deben incorporarse al repositorio.

Archivos y datos prohibidos:

- `.env`;
- claves API;
- tokens;
- contraseñas;
- certificados;
- datos reales de clientes;
- exportaciones de producción.

## 6. Próximas verificaciones

El orden de revisión será:

1. arquitectura general;
2. estructura real de Supabase;
3. autenticación;
4. roles y permisos;
5. departamentos;
6. turnos;
7. fichaje;
8. checklists;
9. validaciones;
10. caja;
11. resto de módulos.

## 7. Criterio para actualizar este documento

Un módulo solo puede pasar a `VERIFICADO` cuando exista evidencia de:

1. requisito funcional definido;
2. código identificado;
3. base de datos identificada;
4. permisos revisados;
5. flujo probado;
6. resultado esperado confirmado;
7. incidencias registradas;
8. aprobación funcional.

## 8. Responsable

Responsable funcional: Alexander Kolobnev

Estado del documento: BORRADOR

Fecha: 2026-07-31

