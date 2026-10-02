# SYNCRO SHIFT — Instrucciones permanentes para agentes

**Estado:** ACTIVO
**Aplicación:** Codex, ChatGPT y otros agentes autorizados

## 1. Misión

Mantener SYNCRO SHIFT con seguridad, trazabilidad y cambios pequeños. La
evidencia técnica prevalece sobre recuerdos, conversaciones y documentación
histórica.

## 2. Identidad del proyecto

- Nombre actual: `SYNCRO SHIFT`.
- Alias históricos: `SyncroShift`, `SyncroHub`, `SYNCRO HUB`.
- Repositorio: `AlexSfera/syncro_hub`.
- Producción pública conocida: `https://syncro-shift.vercel.app/`.
- Backend conocido: Supabase `tsfhrpdpbkciofvejrao`.

No mezclar este proyecto con SYNCROSFERA Executive Operating System ni con otros
dashboards de SYNCROSFERA.

## 3. Lectura obligatoria

Antes de proponer o modificar:

1. `AGENTS.md`.
2. `docs/MASTER_DOCUMENTATION.md`.
3. `docs/00-governance/SOURCE_OF_TRUTH.md`.
4. Este documento.
5. `docs/01-architecture/ARCHITECTURE.md`.
6. `docs/04-development/CURRENT_STATE.md`.
7. `docs/04-development/MODULE_STATUS.md`.
8. Documentación específica del módulo.

Los archivos `_ARCHIVE`, handoffs y conversaciones son contexto, no estado.

## 4. Primera comprobación

Confirmar siempre:

- remote, rama, commit y working tree;
- revisión real de `main` en GitHub;
- revisión o deployment que sirve Producción;
- instrucciones locales;
- scripts cargados y sobrescrituras globales;
- tablas, policies, Functions, Storage e integraciones afectadas;
- pruebas disponibles y plan de reversión.

Producción no estaba alineada con `main` en el corte 2026-10-02. No asumir que
esa divergencia se resolvió sin comprobarla de nuevo.

## 5. Vocabulario obligatorio

- `FACT`: evidencia actual confirmada.
- `[NO DATA]`: falta evidencia.
- `PROPOSED`: decisión no implementada.
- `CORREGIDO`: el código o documento cambió.
- `TESTEADO`: pasó una prueba reproducible.
- `VERIFICADO`: se comprobó el flujo real completo.
- `PRODUCCIÓN`: existe en el entorno público; no implica `VERIFICADO`.

## 6. Seguridad

- No incluir secretos, tokens, claves, PIN, datos de clientes o empleados.
- No aplicar migraciones ni modificar datos LIVE sin autorización específica.
- No usar endpoints de cron o backfill como comprobación de lectura.
- No confiar solo en controles del frontend.
- Revisar autorización backend, grants, RLS y Storage.
- No retirar compatibilidad o acceso existente sin reversión probada.

## 7. Reglas de implementación

- Cambios pequeños, relacionados y reversibles.
- Sin refactor general para una corrección puntual.
- Sin nuevos frameworks si la arquitectura existente basta.
- Buscar definiciones duplicadas antes de editar una función global.
- Respetar el orden de scripts de `index.html`.
- Centralizar el transporte autenticado cuando el alcance lo permita.
- Comprobar respuestas HTTP y efecto real de las escrituras.
- Invalidar cachés afectados tras cambios de datos.

## 8. Git y documentación

- Trabajo nuevo en ramas `codex/...`.
- Conservar cambios ajenos.
- No fusionar `main` sin autorización explícita.
- Toda actualización relevante debe mantener alineados:
  `MASTER_DOCUMENTATION.md`, `CURRENT_STATE.md` y `MODULE_STATUS.md`.
- Una rama remota documenta el trabajo, pero no cambia la fuente estable hasta
  su integración autorizada.

## 9. Verificación mínima

- pruebas relevantes;
- sintaxis JavaScript;
- pruebas negativas de permisos;
- efecto real en datos o integración;
- Preview cuando hay cambios de ejecución;
- Producción y dominio público solo cuando el alcance autoriza despliegue;
- registro de todo lo no ejecutado.

## 10. Informe final

Indicar:

- hallazgos y causa raíz;
- archivos afectados;
- pruebas y resultados;
- commit y rama remota;
- deployment, si aplica;
- reversión;
- riesgos y `[NO DATA]` restantes.

No declarar `DONE`, `PUBLICADO` o `VERIFICADO` con evidencia parcial.
