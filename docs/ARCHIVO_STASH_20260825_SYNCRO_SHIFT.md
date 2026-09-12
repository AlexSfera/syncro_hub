# Expediente de archivo — stash SYNCRO SHIFT (2026-08-25)

## Resultado

El contenido funcional de `stash@{0}` **no se debe aplicar**. Sus bloques de
adjuntos, KPI laboral de Sala y caja SYNCROLAB ya están presentes en `HEAD`
mediante commits posteriores, con controles adicionales en algunos casos.

Este documento archiva la evidencia sin borrar ni modificar el stash. No se
ejecutó ninguna migración, consulta a Supabase LIVE, despliegue, `push` o fusión
a `main` durante esta auditoría.

## Evidencia Git de partida

| Dato | Valor |
|---|---|
| Rama auditada | `codex/integration-main-p0-attachments` |
| Estado inicial | 14 commits por delante de `origin/main`; `AGENTS.md` sin seguimiento |
| `origin/main` | `38074d99302009228dee8fd8c31fa69c475fc1ab` |
| `HEAD` | `0fef207` |
| Referencia | `stash@{0}: audit-sync-2026-08-25-pre-integration` |
| SHA del stash | `8dd0ef2a3091e1aaa2b7497f78f0b48135772993` |
| Fecha del reflog | `2026-08-25 23:04:38 +0200` |
| Base del stash | `ba56c8680b9c83358941dbb11c19e4a878e4f5a2` |
| Padre de índice | `554be1123f287b500f69c486c9c3ec94a4cdc892`; sin diferencia frente a la base |
| Padre de archivos no rastreados | `ab502665855d417ce4d21c293c99865bc6b610a3` |

El diff de trabajo rastreado de la base al stash contiene 11 archivos
(295 altas, 72 bajas). El tercer padre aporta 4 archivos no rastreados
(397 altas). El conjunto reconstruido es por tanto de **15 archivos, 692 altas
y 72 bajas**.

`git diff HEAD stash@{0}` muestra más archivos y muchas bajas porque compara un
snapshot histórico incompleto con un `HEAD` que siguió evolucionando. No es una
lista fiable del contenido original del stash: los cuatro archivos no rastreados
residen en su tercer padre.

## Clasificación por archivo y hunk

| Archivo histórico | Hunks auditados | Estado en `HEAD` | Sustitución o decisión |
|---|---|---|---|
| `adjuntos.js` | Sustituye el `PATCH` directo por altas/bajas autenticadas de metadatos; compensación de borrado; registro del último insert sólo si tuvo éxito. | **Ya integrado.** | `0714b15` incorpora el flujo. No reaplicar. |
| `api/attachments/object.js` | El borrado exige permiso de gestión, no sólo lectura. | **Ya integrado.** | `0714b15`. No reaplicar. |
| `api/attachments/sign-upload.js` | La firma de subida exige permiso de gestión, no sólo lectura. | **Ya integrado.** | `0714b15`. No reaplicar. |
| `auth-client.js` | Añade `addAttachmentMetadata` y `removeAttachmentMetadata` al cliente autenticado. | **Ya integrado.** | `0714b15`. No reaplicar. |
| `docs/AUDIT_ACTION_REGISTER.md` | Añade la entrada histórica `UI-008` sobre persistencia uniforme de adjuntos. | **Pendiente de decisión documental.** La entrada no está en el registro maestro actual. | Conservar sólo en este expediente hasta decidir si se incorpora al registro maestro. No copiarla automáticamente: su texto describe el permiso como lectura y el código final exige gestión. |
| `informes.js` | Estado visual de subpestaña activa (`data-inf-subtab`, `_infSelectSubTab`). | **Excluido deliberadamente.** No existe en `HEAD`; su prueba también fue retirada. | No incorporar sin una decisión de interfaz. |
| `informes.js` | KPI Sala: periodo semanal exacto, endpoint Bitrix, unión por ID/nombre compatible y columnas/totales de coste. | **Ya integrado y refinado.** | `72d6d5c`; `HEAD` añade protección contra nombres normalizados duplicados y conserva el rango semanal. |
| `informes.js` | Clasificación de entrenadores: PT de 50 minutos/DUO y regla específica de Oleksandra Melnykova. | **Ya integrado por una línea distinta al stash.** | La procedencia rastreable de la regla de Oleksandra es `31e7368` (`main`). El stash la duplicaba; no debe reaplicarse. Mantener o retirar esa regla de negocio requiere decisión explícita de producto. |
| `lib/attachments-server.js` | Valida metadatos y resuelve el permiso operativo de gestión por registro. | **Ya integrado y endurecido.** | `0714b15`; `HEAD` restringe además la mutación a roles de gestión, incluso para registros propios. |
| `package.json` | Amplía `npm run check` para los endpoints de metadatos y KPI. | **Ya integrado y ampliado.** | `0714b15` y `72d6d5c`; `HEAD` añade también comprobación de `syncrolab.js`. |
| `syncrolab.js` | Fondo por caja basado sólo en el último efectivo realmente traspasado; avisos por historial incompleto; guardia anti doble clic. | **Ya integrado y ampliado.** | `e87bd3d`, `1aec13f` y `1464315` mantienen cajas independientes, bloquean historial faltante y cubren el flujo con pruebas. |
| `syncrolab.js` | Permitía al administrador confirmar un segundo registro del mismo turno. | **Obsoleto o incompatible.** `HEAD` bloquea duplicados para todos los roles. | Sustituido por `1464315`, coherente con la custodia actual. No reintroducir. |
| `syncrolab.js` | Textos de traspaso/cierre. | **Ya integrado con regla más concreta.** | `HEAD`: traspaso entrega todo el efectivo sin retiro; cierre calcula retiro y deja 120 € en Clínica y 215 € en Fitness. |
| `tests/attachments-security.test.js` | Pruebas de metadatos, ruta, permisos y escritura para gestiones/incidencias/tareas. | **Ya integrado y reforzado.** | `0714b15`; `HEAD` prueba que empleados no pueden mutar adjuntos y que los roles de gestión sí. |
| `tests/auth-client.test.js` | Exige APIs autenticadas de metadatos y elimina el `PATCH` directo. | **Ya integrado.** | `0714b15`; el nombre de la prueba se actualizó para reflejar el flujo final. |
| `api/attachments/metadata.js` *(no rastreado en el stash)* | Endpoint autenticado para alta/baja de metadatos. | **Ya integrado y endurecido.** | Creado en `0714b15`. La diferencia actual es de formato y del control de gestión final. |
| `api/kpi-sala-labor.js` *(no rastreado en el stash)* | Endpoint de coste laboral de Sala desde horas Bitrix. | **Ya integrado y refinado.** | Creado en `72d6d5c`; `HEAD` valida fechas reales y acepta hasta 31 fechas de calendario. |
| `tests/informes-kpi.test.js` *(no rastreado en el stash)* | Prueba de estilo de subpestañas y pruebas KPI. | **Mixto.** El estilo fue excluido deliberadamente; las pruebas de KPI están integradas y refinadas. | `72d6d5c` para KPI. No recuperar sólo la prueba de estilo sin aprobar también el cambio de interfaz. |
| `tests/kpi-sala-labor.test.js` *(no rastreado en el stash)* | Acceso por rol y rango semanal del endpoint KPI. | **Ya integrado y reforzado.** | `72d6d5c`; `HEAD` cubre 31 fechas e invalida fechas de calendario inexistentes. |

## Bloques sustituidos

| Bloque histórico | Commit(s) que lo sustituyen | Resultado actual |
|---|---|---|
| Metadatos autenticados de adjuntos | `0714b15` | Endpoint, cliente, validación y pruebas presentes; permisos posteriores más estrictos. |
| KPI laboral de Sala e Informes | `72d6d5c` | Endpoint y cálculo desde Bitrix presentes; no se recuperó el cambio visual de subpestañas. |
| Regla específica de Oleksandra/formador | `31e7368` | Ya existe en `HEAD` por la línea de `main`, no por una aplicación del stash. |
| Caja SYNCROLAB | `e87bd3d`, `1aec13f`, `1464315` | Cadena de custodia por caja, historial obligatorio, bloqueo de duplicados y fondos finales fijos. |
| Exclusiones de despliegue | `0fef207` | No formaban parte del contenido original del stash; `.vercelignore` excluye los archivos locales definidos. |

## Estado de migraciones y rollbacks

Los estados «aplicada en LIVE» de esta tabla proceden de los comentarios de los
archivos SQL. Esta auditoría no consultó Supabase LIVE, por lo que la existencia
real de esquema, grants, RLS, policies y Storage es **[NO DATA]** hasta ejecutar
un preflight de sólo lectura autorizado.

| Migración | Estado declarado en el repositorio | Rollback y pruebas versionadas | Estado LIVE comprobado en esta auditoría |
|---|---|---|---|
| `202608080001_p0_auth_foundation.sql` | Declarada «VERIFICADO locally y aplicada a LIVE el 2026-08-10». | `202608080001_p0_auth_foundation_rollback.sql`; pruebas SQL de fundación y rollback. El rollback elimina datos nuevos de auditoría/rate limit y está marcado PLANIFICADO. | **[NO DATA]** |
| `202608080002_p0_rls_cutover_TEMPLATE.sql` | Plantilla no ejecutable por diseño; matriz de 51 tablas incompleta. | Sin rollback ejecutable porque no es una migración ejecutable. | **[NO DATA]** |
| `202608100001_p0_employee_ips_containment.sql` | Declarada «VERIFICADO locally y en LIVE el 2026-08-10». | Rollback versionado y pruebas SQL. El rollback reabre privilegios amplios y CRUD anónimo: riesgo alto. | **[NO DATA]** |
| `202608100002_p0_authenticated_containment.sql` | Declarada «VERIFICADO locally y aplicada a LIVE el 2026-08-10». | Rollback versionado y pruebas SQL de contención/rollback. El rollback restaura grants guardados y reabre el acceso anónimo previo. | **[NO DATA]** |
| `20260814192801_p0_private_attachments.sql` | PLANIFICADA: hace privado el bucket `adjuntos`, limita MIME/tamaño y guarda backup de bucket/policies. | Rollback versionado, reconstruye configuración/policies desde backup y no modifica objetos almacenados; pruebas JavaScript y SQL versionadas. | **[NO DATA]** |

No hay evidencia de que las pruebas SQL se hayan ejecutado en este trabajo. La
suite JavaScript valida de forma estática la estructura de la migración privada
y de su rollback; no demuestra el estado real de Supabase LIVE.

## Validación realizada en esta auditoría

| Comprobación | Resultado |
|---|---|
| `npm run check` | Correcto. |
| `npm test` | 57 pruebas: 56 correctas, 0 fallos y 1 omitida por requerir Supabase local. |
| Comparación de stash | Realizada contra `HEAD` por archivo y hunk, incluyendo el tercer padre de archivos no rastreados. |
| Validación operativa de SYNCROLAB desde la red autorizada de SYNCROSFERA | **[NO DATA]** |
| Esquema, RLS, policies y Storage de Supabase LIVE | **[NO DATA]** |

## Riesgos y acciones que requieren autorización

1. **No borrar `stash@{0}` todavía.** Su eliminación requiere orden explícita
   posterior, después de aceptar este expediente. Aplicarlo o hacer `pop` sigue
   siendo riesgoso por duplicación/conflictos.
2. **Resolver el único pendiente documental:** decidir si `UI-008` debe volver
   al registro maestro, redactado conforme al permiso final de gestión, o quedar
   únicamente en este archivo histórico.
3. **No proponer ni ejecutar migraciones adicionales** antes de un preflight
   autorizado de sólo lectura que confirme: esquema real, RLS/policies, Storage,
   migración exacta ausente, dependencias con el código publicado, rollback
   probado e impacto en permisos/datos.
4. **Regla Oleksandra/formador:** está presente en `HEAD` por `31e7368`, aunque
   no debe volver a incorporarse desde el stash. Cualquier cambio o retirada de
   esa regla necesita una decisión de negocio explícita.
5. **Producción:** el estado real de SYNCROLAB, permisos y flujo de cierre desde
   la red autorizada de SYNCROSFERA permanece **[NO DATA]**.

## Decisión solicitada para cierre posterior

Una vez revisado este expediente, Alexander puede autorizar de forma separada:

1. conservar `stash@{0}` como respaldo, o eliminarlo;
2. incorporar o no una versión actualizada de `UI-008` al registro maestro;
3. realizar un preflight de sólo lectura en Supabase LIVE;
4. preparar una migración concreta con rollback y plan de reversión.

Hasta entonces, el expediente queda listo para consulta y el stash permanece
intacto.
