# SYNCRO SHIFT — Contexto estable del proyecto

## Propósito

SYNCRO SHIFT es la plataforma operativa interna de SYNCROSFERA. Centraliza
turnos, checklists, tareas, gestiones, incidencias, validaciones, cajas, merma,
Housekeeping, mantenimiento, FIO, incentivos, informes y fichaje.

## Arquitectura conocida

- Frontend: SPA de HTML y JavaScript sin framework.
- Hosting y Functions: Vercel.
- Datos, Auth, RPC y Storage: Supabase.
- Integraciones: Bitrix24, POSMEWS y procesos relacionados con MEWS, Nubimed,
  VirtuGym, correo y SheetJS.
- Repositorio: `AlexSfera/syncro_hub`.
- Dominio público conocido: `https://syncro-shift.vercel.app/`.

Los módulos de navegador comparten funciones y estado global. El orden de los
scripts de `index.html` forma parte del comportamiento de la aplicación.

## Documentos de referencia

1. `docs/00-governance/SOURCE_OF_TRUTH.md` — fuentes de verdad.
2. `docs/04-development/CURRENT_STATE.md` — estado documentado, sujeto a verificación.
3. `PROJECT_RULES.md` — límites y autorizaciones.
4. `RUNBOOK.md` — procedimiento de trabajo.

La documentación de `_ARCHIVE`, handoffs y conversaciones anteriores es
histórica. Debe verificarse contra el código y el entorno real antes de usarla.

## Riesgos conocidos en el corte 2026-10-02

- La Producción observada no coincidía completamente con `main`.
- Producción cargaba módulos ausentes de `main`.
- El deployment y commit exactos de Producción eran `[NO DATA]`.
- El esquema Supabase completo no podía reconstruirse con las migraciones de
  `main`.
- El estado LIVE actual de grants, RLS, Functions, triggers y Storage era
  `[NO DATA]`.
- Existían funciones globales duplicadas o referenciadas sin definición en
  varios módulos.

Estos riesgos son un punto de partida histórico. Deben comprobarse de nuevo al
inicio de cualquier tarea.

## Regla central

La evidencia actual prevalece sobre este contexto. Si el código, GitHub,
Vercel, Supabase o una prueba reproducible contradicen este archivo, registra la
contradicción y actualiza la documentación autorizada.
