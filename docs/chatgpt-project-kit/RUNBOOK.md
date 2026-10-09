# SYNCRO SHIFT — Procedimiento operativo para agentes

## 1. Inicio de una tarea

- Confirmar objetivo y resultado visible esperado.
- Determinar si la petición es inspección o ejecución.
- Leer instrucciones y archivos de contexto.
- Comprobar repositorio, remote, rama, commit y working tree.
- Si existen cambios ajenos, usar un worktree limpio.
- Identificar el módulo y sus dependencias.

## 2. Inspección

- Localizar código, configuración, tablas, endpoints e integraciones.
- Separar documentación histórica de evidencia actual.
- Comprobar la revisión servida por Producción cuando sea relevante.
- No realizar escrituras para obtener evidencia.
- Registrar hallazgos como hechos, riesgos, propuestas o `[NO DATA]`.

## 3. Cambio autorizado

- Crear o reutilizar una rama `codex/...` limpia.
- Modificar únicamente el alcance autorizado.
- Mantener compatibilidad salvo decisión contraria explícita.
- No añadir dependencias o arquitectura innecesarias.
- Preservar cambios ajenos.

## 4. Verificación

Seleccionar las comprobaciones necesarias:

- sintaxis, lint, typecheck o build disponibles;
- tests unitarios o de integración;
- permisos, autenticación y RLS;
- resultado real de lectura o escritura autorizada;
- errores, reintentos e idempotencia;
- regresión del flujo afectado;
- Preview y comprobación visual cuando corresponda;
- Producción solo cuando esté autorizada.

No registrar como superada una prueba que no se ejecutó.

## 5. GitHub

- Revisar el diff completo.
- Confirmar que el commit contiene solo el cambio solicitado.
- Ejecutar las pruebas finales.
- Crear un commit descriptivo.
- Subir únicamente la rama autorizada.
- No fusionar con `main` sin autorización explícita.

## 6. Vercel

- Identificar proyecto, entorno, deployment y commit.
- Revisar variables necesarias sin mostrar sus valores.
- Usar Preview como validación cuando exista cambio de ejecución.
- Confirmar estado `READY`, dominio y recursos afectados.
- Registrar el deployment que permite revertir.

Si no se puede acceder al panel o CLI, indicar `[NO DATA]`.

## 7. Supabase

- Confirmar project ref y entorno.
- Revisar migración, grants, RLS, Functions, triggers y Storage afectados.
- Preparar plan de reversión antes de cualquier cambio.
- No aplicar migraciones ni modificar LIVE sin autorización específica.
- Verificar el resultado después de una acción autorizada.

## 8. Cierre

- Actualizar la documentación afectada.
- Completar `FINAL_REPORT.md`.
- Distinguir `PREPARADO`, `EJECUTADO`, `TESTEADO`, `VERIFICADO` y
  `PRODUCCIÓN`.
- Indicar claramente cualquier paso pendiente del usuario.
