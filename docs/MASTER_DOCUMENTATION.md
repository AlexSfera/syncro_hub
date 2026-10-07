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

## Reconciliación de interfaz y planificación — 06/10/2026
Esta sección prevalece sobre los estados históricos inferiores.
- IMPLEMENTADO: navegación V4.3 y Housekeeping recuperados sobre f1040da, conservando planificación, saldos y permisos posteriores.
- TESTEADO: suite completa y Chrome local, 22 perfiles y 88 escenarios de escritorio/tablet/móvil sin errores; datos ficticios.
- Vercel valida sintaxis y toda la suite antes de compilar.
- Sesión autenticada LIVE y nueva Producción: [NO DATA] hasta la comprobación de publicación.
- Sin cambios de datos LIVE, migraciones, Bitrix24 ni main.
- Detalle, rutas de consulta y reversión: docs/04-development/RELEASE_RECONCILIACION_20261006.md.

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

## Correspondencias completadas — 04/10/2026
Se incorporaron los nueve saldos pendientes por correspondencia de identidad, tras la confirmación expresa de Alexander de los IDs de la plantilla. Se corrigieron dos vínculos de fichas existentes y se crearon siete referencias internas mínimas. La conciliación cubre **57 de 65 filas**: cinco están excluidas del alcance por indicación de Alexander y tres mantienen contradicciones de saldo.
El lote contiene **114 aperturas anuales**, incluidas **49 aperturas cero de 2025**. Las 18 aperturas de esta continuación conservan el corte **30/09/2026**, las unidades natural/laborable de la fuente y el historial previo. Se preservaron los 100 movimientos anteriores del lote, incluidos movimientos distintos de apertura.
Las siete referencias nuevas tienen estado **Sin asignar**, porque no se pudo consultar directamente el estado actual de Bitrix24. No aparecen en el filtro de empleados activos de Planificación Horaria. Su alta no incorpora credenciales ni invitaciones y conserva el rol mínimo empleado sin facultades de responsable o validador.
La lectura directa de Bitrix24 y la pantalla autenticada permanecen **[NO DATA]**. La consulta de Bitrix24 quedó bloqueada por la conexión de esta sesión; los IDs e identidades proceden de la plantilla y de la confirmación de Alexander.
La pantalla del commit `ae4e3b7` permanece en Preview; no se cambió el deployment de Producción en esta continuación. `main` se conserva.
Reversión: usar el valor anterior de la auditoría para restaurar exclusivamente los dos vínculos; compensar las 18 aperturas de esta continuación conservando las referencias internas y el historial. Las aperturas cero se conservan. No ejecutar el rollback del CHECK mientras existan aperturas cero.

---

# SYNCRO SHIFT — Documentación principal

Proyecto: `AlexSfera/syncro_hub`. Producción conocida: https://syncro-shift.vercel.app/.

- [Reglas del proyecto](../PROJECT_RULES.md).
- [Estado actual y evidencia](04-development/CURRENT_STATE.md).
- [Estado comprobado de Planificación Horaria](04-development/MODULE_STATUS.md).

## Saldos con corte 30/09/2026

La incorporación concilia 48 empleados con la fuente, incluidos 40 saldos cero de 2025, y 7 ausencias futuras. Las 17 filas restantes necesitan completar o aclarar datos. La fecha de corte se obtiene de la auditoría de importación y se muestra como apertura, separada de movimientos posteriores.

El cambio mínimo del CHECK permite `apertura = 0`; mantiene las demás restricciones, RLS y el historial append-only. Su versión LIVE es `20261004164824`. La reversión protegida está en [supabase/rollback](../supabase/rollback/vacaciones_apertura_cero_rollback.sql).

El estado visual autenticado y las horas/condiciones contractuales no acreditadas siguen en `[NO DATA]`.

