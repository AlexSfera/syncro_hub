# SYNCRO HUB — Guía de trabajo para agentes

## Objetivo

Mantener y mejorar SYNCRO SHIFT con seguridad, trazabilidad y ritmo de trabajo.
La evidencia técnica prevalece sobre documentación, recuerdos o hipótesis:

1. código y configuración reales;
2. estado verificable de Git, Vercel y Supabase;
3. pruebas reproducibles;
4. documentación.

Si falta evidencia, indicar `[NO DATA]`.

## Lectura obligatoria

Antes de analizar o modificar el proyecto, leer en este orden:

1. `docs/MASTER_DOCUMENTATION.md`;
2. `docs/00-governance/SOURCE_OF_TRUTH.md`;
3. `docs/00-governance/AGENT_INSTRUCTIONS.md`;
4. `docs/01-architecture/ARCHITECTURE.md`;
5. `docs/04-development/CURRENT_STATE.md`;
6. `docs/04-development/MODULE_STATUS.md`;
7. documentación funcional del módulo afectado.

Los archivos `_ARCHIVE`, handoffs y conversaciones son contexto histórico, no
estado actual.

## Forma de trabajar

- Actuar autónomamente en comprobaciones de lectura y pasos normales ya
  autorizados.
- Informar en hitos: hallazgo, cambio, prueba o bloqueo real.
- Hacer supuestos razonables de bajo riesgo y explicarlos al entregar.
- Separar hechos, riesgos, recomendaciones y `[NO DATA]`.
- Comprobar primero remote, rama, commit, working tree y divergencia entre
  `main` y Producción.

## Seguridad y control de cambios

- Nunca borrar datos, reescribir historial Git, aplicar migraciones Supabase,
  fusionar a `main` ni modificar LIVE sin autorización explícita.
- Conservar cambios ajenos y usar puntos de restauración cuando proceda.
- Mantener cambios pequeños y relacionados.
- No incluir secretos, tokens, PIN ni datos reales de empleados o clientes.
- No invocar cron o backfills como prueba de lectura.

## Flujo de implementación

1. Auditar problema, dependencias y permisos.
2. Aplicar únicamente el alcance autorizado.
3. Ejecutar pruebas proporcionales al riesgo.
4. Verificar Preview y Producción cuando el alcance autorice publicación.
5. Informar archivos, resultado, límites y reversión.

Usar `CORREGIDO` cuando cambió código o documentación, `TESTEADO` cuando pasó
una prueba reproducible y `VERIFICADO` solo para el flujo real completo.

## Git y publicación

- Usar ramas `codex/...` para trabajo nuevo.
- Publicar únicamente la rama indicada; no fusionar `main` sin autorización.
- Un commit remoto no equivale a un deployment.
- Preview no equivale a Producción.
- Antes de publicar, comprobar commit, entorno y reversión.
- No declarar `PUBLICADO`, `VERIFICADO` o `DONE` con evidencia parcial.

## Supabase

- Verificar primero plan, reversión, RLS, grants, Storage y permisos por rol.
- No aplicar migraciones ni tocar datos LIVE sin autorización específica.
- No asumir que los conteos o policies de documentos antiguos siguen vigentes.

## Cierre documental

Todo cambio relevante de arquitectura, módulos, SQL, configuración o deployment
debe mantener alineados:

- `docs/MASTER_DOCUMENTATION.md`;
- `docs/04-development/CURRENT_STATE.md`;
- `docs/04-development/MODULE_STATUS.md`.

El informe final debe incluir rama, commit, pruebas, deployment si aplica,
reversión, riesgos y datos aún no verificados.
