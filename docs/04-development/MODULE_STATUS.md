## Navegación operativa y permisos — 07/10/2026
Esta sección prevalece sobre los estados históricos inferiores.
- IMPLEMENTADO: siete áreas de trabajo; Jornada reúne planificación, fichajes y balance mensual; producción se separa de informes y pagos.
- TESTEADO localmente: sintaxis, regresión y pruebas de permisos/caché, más 30 escenarios Chrome con datos ficticios. No representan sesiones LIVE.
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

## Continuación comprobada — 04/10/2026
Esta sección prevalece sobre los recuentos de la revisión anterior.

| Flujo | Estado | Evidencia y límite |
|---|---|---|
| Nueve correspondencias de identidad | VERIFICADO en Supabase | Dos vínculos existentes corregidos y siete referencias internas creadas con IDs confirmados por Alexander |
| Saldos con corte 30/09/2026 | VERIFICADO en Supabase | 57 personas, 114 aperturas anuales, 49 ceros de 2025; sin duplicados en las 18 aperturas nuevas |
| Personas excluidas del alcance | DOCUMENTADO | Cinco por indicación de Alexander; no se les inventan saldos |
| Contradicciones de saldo | [NO DATA] | Tres filas pendientes de resolución |
| Estado actual de las siete referencias nuevas | [NO DATA] | Sin asignar; no aparecen en el filtro de empleados activos |
| Consulta directa de Bitrix24 | [NO DATA] | Conexión bloqueada en esta sesión; identidades e IDs confirmados mediante plantilla y usuario |
| Pantalla autenticada | [NO DATA] | No se ha comprobado una sesión real |
| Despliegue de pantalla | IMPLEMENTADO / TESTEADO en Preview | Producción y main no se modificaron en esta continuación |

Los 100 movimientos anteriores del lote se conservaron. La reversión utiliza la auditoría de los dos vínculos y movimientos compensatorios para las 18 aperturas de esta continuación; conserva las referencias y el historial.

---

# Estado comprobado de Planificación Horaria

Fecha de revisión: 04/10/2026. Corte de saldos: **30/09/2026**.

| Flujo | Estado | Límite |
|---|---|---|
| Importación de vacaciones | VERIFICADO | 48/65 empleados; 17 filas pendientes de aclaración |
| Pendiente 2025 igual a cero | VERIFICADO | 40 aperturas con cero y auditoría de corte |
| Ausencias futuras | VERIFICADO | 7 periodos; no consume saldo de apertura ni publica turnos en Bitrix |
| Saldo cero y fecha en pantalla | IMPLEMENTADO / TESTEADO | Falta comprobación visual con sesión real |
| Horas y contratos | [NO DATA] | No acreditados por la fuente |

Este registro cubre solo el alcance de esta revisión. El inventario de otros módulos se conserva en [CURRENT_STATE.md](CURRENT_STATE.md); no se declara su funcionamiento actual a partir de documentos históricos.

Reglas: [PROJECT_RULES.md](../../PROJECT_RULES.md).

