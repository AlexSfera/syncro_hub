# Reconciliación de navegación y planificación — 06/10/2026

## Problema y revisión unificada

Producción servía `9e21b8acf64f25d369fe8584315235e131846ee1`. El Preview de saldos `f1040da6bcb61114341e420b29e2a6f566af8c77` conservaba la última planificación, pero no incorporaba dos cambios de interfaz publicados anteriormente desde ramas divergentes:

- Navegación: `f2e3b41a6caa8ea7222bd1996df21aea58ae3e1c`, `codex/navigation-information-architecture`.
- Housekeeping: `e3b0f0233df19d6b261945b5be4592363d856579` y corrección `5114cac110daad957615a6205251fe16d9eb3e4b`, `codex/housekeeping-ux`.

Esta revisión integra esos cambios sobre `f1040da` y conserva planificación, saldos históricos, ceros confirmados, Club Manager y permisos posteriores. No fusiona `main`.

## Comportamiento

- Empleados y responsables: **Mi día → Mi departamento → Manager**, según permisos. Administrador: **Operación → Equipo → Dirección**. Contabilidad: **Control contable**.
- Todos los accesos tienen una descripción. La barra móvil contiene como máximo cinco accesos; el menú de sectores conserva el resto.
- Menús alineados y situados dentro de la pantalla, también a 768 px. La cabecera permite nombres de puestos largos y conserva visible Salir. El contenido móvil deja espacio para la barra inferior.
- Housekeeping recupera multiselección, inspecciones, carga de trabajo y checklist propio de Gobernanta; personal operativo empieza en Mi Ruta. Caja permanece fuera del alcance HK.
- La cabecera identifica la interfaz como **V4.3**.

## Dónde consultar

- Dirección: **Equipo → Planificación Horaria**. Empleados y responsables: **Mi departamento → Planificación Horaria**. Contabilidad: **Control contable → Planificación Horaria**.
- Dentro: calendario semanal, controles de ausencia y recuperación según permisos, y **Saldos de vacaciones** debajo del calendario. **ⓘ Cómo consultar** explica años, ceros y ausencias.
- Los marcajes y horas reales se consultan en **Fichajes** y, para Administrador, **Horas Mensuales**.
- La publicación de esta web en Vercel es independiente de la escritura de horarios ShiftPlan en Bitrix24. Esta revisión no habilita dicha escritura ni completa datos contractuales ausentes.

## Validación y límites

- Comprobación sintáctica y suite completa de pruebas, incluidas navegación, Housekeeping, planificación, autorización y saldos. Vercel ejecuta `npm run check && npm test` antes de aceptar la compilación.
- Chrome local con el código real de navegación y render de planificación: 22 perfiles × 4 anchos (1366, 768, 390 y 320 px), 88 escenarios sin errores. Prueba de alineación, límites de menú, acceso a planificación, ayuda y altura de botones. Datos y perfiles ficticios; no equivale a una sesión autenticada LIVE.
- Sesión autenticada LIVE, catálogo FIO aplicado y envío de ShiftPlan: **[NO DATA]**. Los archivos SQL históricos se recuperan como código; no se ejecutan migraciones.
- No se modifican saldos LIVE, estados de empleados, configuración de Bitrix ni tareas de Windows.

## Publicación y reversión

Rama de trabajo: `codex/reconciliar-interfaz-planificacion-20261006`. La evidencia operativa exige deployment READY y resolución del dominio de Producción al mismo commit. El estado final se consigna en la documentación del proyecto después de consultar Vercel; un Preview no acredita Producción.

Reversión de interfaz: devolver Producción a `dpl_9rQJeELKiCbrXUbPH6iHZwKD3ArV`. No revertir saldos, borrar auditoría ni reescribir Git.

## Publicación reproducible — 07/10/2026

1. Leer el candidato y el deployment del dominio de Producción. Confirmar proyecto, SHA y READY; conservar el deployment previo para revertir. Revisar cualquier nueva revisión antes de publicar una más antigua.
2. Si el candidato es Preview (target null), crear un deployment del mismo proyecto con `deploymentId` del candidato, `target: production` y `withLatestCommit: false`. Esto reconstruye el mismo código para el entorno de Producción. No cambiar rama ni fusionar main.
3. Esperar READY. Comprobar que la revisión coincide con el candidato y que el dominio operativo resuelve a ese deployment. No declarar publicación por la mera creación de un Preview.
4. Usar Promote sin reconstrucción únicamente para una revisión ya construida para Production. La llamada directa aplicada al Preview de este cierre devolvió HTTP 422.
5. Ante una futura denegación de aprobación, leer primero el permiso real de Vercel. El 07/10/2026 ya figuraba Allow all actions. No atribuir una denegación histórica a la configuración actual sin comprobarla ni repetir la petición sin nueva evidencia.

Evidencia del código publicado: `0391a0fdd0704af3014383a15c796a0f2e4bd4de`, deployment `dpl_AJ7BW1uy64AeD8GN3L9B4jnW5tBy`, READY y `syncro-shift.vercel.app` asignado. Los commits posteriores de documentación conservan íntegramente ese código y se vuelven a publicar con el mismo procedimiento.

La comprobación mediante Vercel no acredita por sí sola una sesión autenticada ni una operación LIVE. La lectura HTTP en esta sesión quedó [NO DATA] por acceso de red local y 403 del lector de protección. No se modifican permisos de terceros para probar la interfaz.
