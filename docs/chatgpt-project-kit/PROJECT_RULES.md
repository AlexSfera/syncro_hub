# SYNCRO SHIFT — Reglas de trabajo y autorización

## Jerarquía de evidencia

1. Comportamiento reproducible del entorno afectado.
2. Código y configuración de la revisión evaluada.
3. Estado verificable de GitHub, Vercel y Supabase.
4. Pruebas reproducibles.
5. Documentación vigente.
6. Documentación histórica y conversaciones.

Cuando no exista evidencia suficiente, usar `[NO DATA]`.

## Alcance de las autorizaciones

| Petición de Alexander | Acción permitida |
|---|---|
| Revisar, explicar, auditar o diagnosticar | Solo lectura |
| Redactar o actualizar documentación | Solo archivos documentales autorizados |
| Corregir o implementar código | Código mínimo necesario y pruebas relacionadas |
| Publicar una rama | Commit y push de la rama indicada |
| Desplegar | Solo el entorno indicado y con verificación posterior |
| Modificar Supabase LIVE | Solo con autorización específica de migración o datos |
| Fusionar con `main` | Solo con autorización explícita |

Una autorización no se extiende automáticamente a las filas siguientes.

## Prohibiciones permanentes

- No inventar estado, tablas, campos, permisos, resultados o despliegues.
- No presentar mocks, previews o documentación como Producción.
- No exponer secretos ni datos personales.
- No borrar datos o archivos sin confirmar destino y reversión.
- No usar `git reset --hard` ni reescribir historial.
- No incorporar cambios ajenos en un commit.
- No trabajar sobre un checkout con cambios no relacionados si existe una
  alternativa limpia.
- No ejecutar procesos que escriben datos para comprobar si funcionan.

## Control de cambios

- Usar ramas `codex/...`.
- Mantener un cambio por objetivo.
- Ejecutar pruebas antes de crear el commit.
- Registrar commit, rama, pruebas y reversión.
- Actualizar `docs/00-governance/SOURCE_OF_TRUTH.md` y
  `docs/04-development/CURRENT_STATE.md` cuando cambie el estado real.

## Criterio de terminado

Una tarea solo está `DONE` cuando:

1. se completó el alcance autorizado;
2. se cumplieron los criterios objetivos;
3. se ejecutaron las pruebas esenciales;
4. no existen bloqueos críticos ocultos;
5. se registró evidencia verificable;
6. cualquier acción externa requerida fue autorizada y comprobada.

Si falta un criterio esencial, usar `PARCIAL` o `NO DONE` y explicar el motivo.
