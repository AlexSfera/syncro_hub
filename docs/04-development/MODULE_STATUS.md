# SYNCRO SHIFT — Estado funcional por módulo

**Corte de evidencia:** 2026-10-02

## 1. Convenciones

- `DOCUMENTADO`: existe descripción útil y vigente.
- `IMPLEMENTADO`: existe código identificable.
- `CONECTADO`: existe integración técnica en el código; no implica éxito LIVE.
- `TESTEADO`: se ejecutó una prueba reproducible en este corte.
- `VERIFICADO`: se comprobó el flujo real y su resultado.
- `PRODUCCIÓN`: el recurso se observó cargado o disponible en Producción.
- `[NO DATA]`: falta evidencia suficiente.

## 2. Matriz

| Módulo | Código principal | Documentado | Implementado | Conectado | Testeado | Verificado | Producción | Nota |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Portal y shell | `index.html` | Sí | Sí | Sí | Sintaxis/DOM | Portada | Sí | Producción diverge de `main` |
| Autenticación cliente | `auth-client.js` | Sí | Sí | Sí | Sí | Parcial | Sí | E2E real omitido |
| Núcleo compartido | `shared.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Alto acoplamiento |
| Turnos y Mi Día | `mi_turno.js`, `shared.js` | Sí | Sí | Sí | Histórico | No | Sí | Flujo autenticado no probado |
| Checklists | `checklist.js` | Sí | Sí | Sí | Histórico | No | Sí | Configuración mayormente hardcodeada |
| Tareas | `tareas.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Usa helpers globales |
| Incidencias | `incidencias.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Script versionado en Producción |
| Tipos de incidencia | `incidencia_tipos.js` | Parcial | Sí | No aplica | Sintaxis | No | Sí | Catálogo global |
| Gestiones | `gestiones.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Usa helpers globales |
| Hypoxic | `hypoxic.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Acciones de validación incompletas en `main` |
| Mantenimiento Kanban | `mantenimiento.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Tabla `tareas` |
| Sala operativa | `sala.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Complementa caja |
| Caja Sala | `caja.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Sin E2E actual |
| Caja Recepción | `recepcion.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Sin E2E actual |
| Caja SYNCROLAB | `syncrolab.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Helpers de fotos ausentes en `main` |
| Validación | `validacion.js`, `shared.js` | Sí | Sí | Sí | Sintaxis | No | Sí | `openShiftDetail` no es el modal real |
| Housekeeping | `housekeeping.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Integración MEWS no verificada |
| FIO | `fio.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Matriz de permisos requiere E2E |
| Incentivos | `incentivos.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Varias tablas y flujos parciales |
| Liquidaciones Housekeeping | `housekeeping_incentivos.js` | `[NO DATA]` en `main` | Solo Producción/rama | API propia | No | No | Sí | Ausente de `main` |
| Planificación horaria | `planificacion_horaria.js` | `[NO DATA]` en `main` | Solo Producción/rama | `/api/planning/*` | No | No | Sí | Publicación declarada bloqueada en el propio módulo |
| POSMEWS Ventas/Datos | `posmews_ventas.js` | Sí | Parcial | Sí | Sintaxis | No | Sí | Parsers finales no demostrados |
| Informes | `informes.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Contiene deuda histórica |
| Mi Rendimiento | `mi_rendimiento.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Liquidaciones no verificadas |
| Fichaje | `fichaje.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Resultado Bitrix LIVE `[NO DATA]` |
| Horas mensuales | `horas_mensuales.js`, API | Parcial | Sí | Sí | Sintaxis | No | Sí | API presente; flujo no probado |
| Merma | `merma.js` | Sí | Sí | Sí | Sintaxis | No | Sí | Catálogos y costes LIVE `[NO DATA]` |
| Adjuntos | `adjuntos.js` | Parcial | Sí | Supabase Storage | Sintaxis | No | Sí | Doble carga en `main`; una en Producción |
| Dashboard | `dashboard.js` | Parcial | Sí | Sí | Sintaxis | No | Sí | Documento detallado está archivado |
| Middleware | `middleware.js` | Parcial | Sí | Supabase | Sintaxis | No | Servidor | Modo depende de variables Vercel |
| API Auth | `api/auth/*`, `lib/auth-*` | Sí | Sí | Supabase Auth | 28 pruebas | Parcial | Servidor | E2E Supabase omitido |
| Sync Bitrix | `api/bitrix-sync.js` | Sí | Sí | Bitrix/Supabase | Sintaxis | No | Cron | v3 en API frente a v4 raíz |
| Backfill Bitrix | `api/bitrix-backfill-hours.js` | Parcial | Sí | Bitrix/Supabase | Sintaxis | No | Servidor | Operación de escritura; no ejecutar en auditoría |
| Correo | `api/send-email.js`, `lib/email-server.js` | Parcial | Sí | Proveedor correo | Sintaxis | No | Servidor | Entrega real `[NO DATA]` |
| Faults legacy | `faults.js` | Histórico | Huérfano | Tabla no confirmada | Sintaxis | No | No | Sustituido funcionalmente por FIO |

## 3. Resultado de pruebas

`node --test tests/*.test.js`:

- 29 pruebas detectadas;
- 28 correctas;
- 0 fallidas;
- 1 omitida: E2E local con Supabase.

La sintaxis de todos los JavaScript versionados pasó correctamente. No existen
pruebas automáticas equivalentes para la mayoría de módulos de negocio.

## 4. Criterio de avance

Un módulo solo pasa a `VERIFICADO` cuando se comprueban requisito, rol, datos de
entrada, resultado visible, efecto real en base o integración, errores, regresión
y versión desplegada. La mera presencia en Producción no satisface ese criterio.
