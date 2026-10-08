# Autocontrol de incentivos — 08/10/2026

## Resultado y alcance
IMPLEMENTADO y TESTEADO. Una sola entrada «Incentivos y liquidaciones» sustituye las dos entradas que cargaban la misma tabla. La ruta anterior se conserva como alias autorizado. Se elimina el selector de departamento repetido; se conserva el periodo.

## Funcionamiento
- Entrenadores: el botón abre los ocho indicadores, total declarado en los partes del mes, archivo VirtuGym y diferencia; incluye fecha, turno, estado y actividad de cada parte utilizado. «6 indicadores con diferencias» cuenta seis tipos de actividad distintos que no coinciden, no euros ni reservas. «Sin partes registrados» indica que no se encontraron partes con indicadores; un error de lectura se muestra como comparación no disponible. Un archivo incompleto conserva [NO DATA].
- Recepción Hotel: Autocontrol → Ver ventas abre fecha, cierre y estado, n.º de reserva/referencia MEWS, producto vendido, bruto, IVA, neto y cálculo del incentivo. Se usa reserva_mews de recepcion_ventas; reservation_reference es un alias compatible con invoice_reference.
- Las referencias son las declaradas en los cierres de ventas cross-sell (desayuno, comida/cena y SYNCROLAB). La integración directa de reservas de alojamiento vendidas y su conciliación contra MEWS siguen en [NO DATA]; no se afirma que estas ventas estén verificadas en MEWS.
- Housekeeping: abre días registrados, criterios de antigüedad y bajas, nivel, importe y estado. Las fechas individuales de baja no llegan en esta respuesta y se señalan [NO DATA].
- Sala y Cocina: abre periodo, importe y estado del cálculo guardado; el desglose de origen sigue en [NO DATA] en este registro.
- Las comparaciones no cambian incentivos, fórmulas, liquidaciones ni registros de negocio. Los partes conservan su estado visible, incluidos los aún no validados.

## Permisos
Consulta financiera exclusivamente para Administrador y Contabilidad. Marcar liquidado exclusivamente para Administrador, con permisos existentes en servidor. Cachés de detalle ligadas al actor; cierre de sesión borra datos y modales. Sin nuevos permisos, migraciones ni escrituras LIVE.

## Comprobaciones
- npm run check: PASS, todas las comprobaciones de sintaxis.
- npm test: 196 PASS, 0 FAIL, 1 E2E omitida.
- scripts/check-navigation-browser.js: 30 escenarios PASS, 10 perfiles, 390/768/1366 px. Datos ficticios; clics reales en detalle de entrenadores, referencias de Recepción y criterios Housekeeping; Contabilidad sin pago; limpieza al salir.
- Casos adicionales: aislamiento por persona y mes, seis indicadores con diferencias, partes ausentes, error de lectura, archivo incompleto, referencias ausentes, escape HTML y sesión cambiada.
- Revisión contra fc3edf44306c672df2764f908c3786a45de38aac: cambios relacionados únicamente con este alcance. Fórmulas y endpoints de liquidación sin cambios.
- Pantalla y endpoints con sesión de producción después de publicar: [NO DATA]. El acceso del navegador fue rechazado previamente por su política; no se elude el control de IP ni la política.

## Publicación y reversión
Rama codex/incentivos-autocontrol-20261008. main no se fusiona.
PRODUCCIÓN confirmada por Vercel: dpl_2EHAywYVzE31zudUusoneofgwRQf, READY, target production, código bf1907fa9e35daf44d4e4c2e47fe16268520a5d2 desde 2026-10-08T13:54:01.889Z. Consulta del dominio syncro-shift.vercel.app devuelve el mismo deployment y commit. Preview dpl_4NVwYKLEnjbHBMptVmbVvLDPFQyG READY; se reconstruyó exactamente esa revisión para Producción con withLatestCommit:false. Build de ambos: 196 PASS, 0 FAIL, 1 omitida. El estado READY confirma la publicación; el flujo autenticado real sigue [NO DATA].
Reversión: volver al deployment anterior dpl_G5LMLN86SbsJbTigVCcxNAddYTjL, código 1ecbe1da9c31e1f38d7608ce4021d7f7ed74f717. Conservar la protección Supabase existente y todo el historial.
No hace falta una nueva decisión para este despliegue ya autorizado. Una integración directa nueva con MEWS no está implementada en este cambio.
