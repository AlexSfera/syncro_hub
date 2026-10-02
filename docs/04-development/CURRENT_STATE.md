# SYNCRO SHIFT — Estado actual verificable

**Estado:** ACTIVO
**Corte de evidencia:** 2026-10-02
**Repositorio:** `AlexSfera/syncro_hub`

Este documento resume el estado que pudo comprobarse en el corte indicado. No
convierte evidencia histórica en estado actual. Cuando falta una comprobación
directa se utiliza `[NO DATA]`.

## Estado general

| Área | Estado | Evidencia o límite |
|---|---|---|
| GitHub | VERIFICADO | `main` observado en `38074d99302009228dee8fd8c31fa69c475fc1ab` |
| Aplicación | IMPLEMENTADA | SPA de JavaScript sin build declarado |
| Producción pública | PARCIALMENTE VERIFICADA | Portada cargada y sin errores de consola el 2026-10-02 |
| Revisión exacta desplegada | `[NO DATA]` | Panel Vercel sin sesión y CLI no disponible |
| Alineación Producción / `main` | NO ALINEADA | Producción sirve módulos ausentes de `main` |
| Supabase LIVE | `[NO DATA]` | Panel sin acceso verificable y CLI no disponible |
| Migraciones en `main` | VERIFICADO | Cuatro migraciones y rollbacks; no reconstruyen el esquema completo |
| Tests Node | TESTEADO | 28 correctos, 1 E2E Supabase omitido, 0 fallos |
| Sintaxis JavaScript | TESTEADO | Todos los `.js` de raíz, `api/`, `lib/` y `scripts/` |
| Tests SQL | `[NO DATA]` | No se ejecutaron en este corte |
| Flujos autenticados | `[NO DATA]` | No se utilizaron credenciales ni datos reales |

## Arquitectura observada

- Frontend SPA global servido por Vercel.
- Datos, Auth, RPC y Storage en Supabase.
- Vercel Functions para autenticación, administración, Bitrix24 y correo.
- Integraciones documentadas con Bitrix24, POSMEWS, MEWS, Nubimed, VirtuGym,
  n8n y SheetJS, con distinto nivel de evidencia.
- Cron de `vercel.json` para `/api/bitrix-sync` a las `23:00` UTC.

Véase `docs/01-architecture/ARCHITECTURE.md`.

## Hallazgos abiertos prioritarios

1. Producción carga `planificacion_horaria.js` y
   `housekeeping_incentivos.js`, ausentes de `main`.
2. `main` declara dos cargas de `adjuntos.js`; Producción observada carga una.
3. `bitrix-sync.js` raíz declara v4 y `api/bitrix-sync.js` declara v3; el cron
   utiliza la Function de `api/`.
4. Varias pantallas llaman helpers de fotos no definidos en `main`.
5. Validación Hypoxic referencia acciones de edición y borrado no definidas.
6. `faults.js` existe, pero no se carga desde `index.html`.
7. El esquema Supabase completo no puede reconstruirse desde las migraciones de
   `main`.

Estos puntos son hallazgos de auditoría, no autorización para modificar código
o datos.

## Estado funcional

La presencia de un archivo o una pantalla se marca `IMPLEMENTADO`; únicamente
se usa `VERIFICADO` cuando se probó el flujo completo con permisos y resultado.
La matriz vigente está en `docs/04-development/MODULE_STATUS.md`.

En este corte:

- autenticación dispone de pruebas automáticas locales;
- la portada pública está comprobada;
- el resto de flujos operativos autenticados permanece `NO VERIFICADO`;
- las afirmaciones de aplicación RLS LIVE de agosto son evidencia histórica y
  requieren revalidación.

## Límites del corte

No se realizaron escrituras, despliegues, migraciones, ejecución de cron,
backfills ni cambios en LIVE. No se inspeccionaron secretos ni datos personales.
El estado administrativo actual de Vercel y Supabase permanece `[NO DATA]`.

## Mantenimiento

Actualizar este documento junto con `docs/MASTER_DOCUMENTATION.md` y
`docs/04-development/MODULE_STATUS.md` cuando cambien código, esquema,
configuración, deployment o comportamiento verificado.
