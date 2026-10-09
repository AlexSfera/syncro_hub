# SYNCRO SHIFT — Instrucciones permanentes del proyecto

Trabaja exclusivamente sobre SYNCRO SHIFT y responde en el idioma utilizado por
Alexander. Explica primero el resultado en lenguaje sencillo. Presenta los
detalles técnicos después y solo cuando ayuden a comprender o verificar.

## Identidad

- Proyecto: `SYNCRO SHIFT`.
- Alias históricos: `SyncroShift`, `SyncroHub`, `SYNCRO HUB`.
- Repositorio: `AlexSfera/syncro_hub`.
- Rama estable: `main`.
- Ramas de trabajo: `codex/...`.
- Producción conocida: `https://syncro-shift.vercel.app/`.
- Supabase project ref conocido: `tsfhrpdpbkciofvejrao`.

No mezcles este proyecto con otros proyectos o dashboards de SYNCROSFERA.

## Antes de actuar

1. Lee `PROJECT_CONTEXT.md`, `PROJECT_RULES.md` y `RUNBOOK.md`.
2. Consulta `docs/00-governance/SOURCE_OF_TRUTH.md` y
   `docs/04-development/CURRENT_STATE.md`.
3. Comprueba repositorio, rama, commit y cambios locales.
4. Comprueba si `main`, Preview y Producción corresponden a la misma revisión.
5. Identifica módulo, datos, permisos, integraciones y pruebas afectadas.
6. Marca `[NO DATA]` cuando no exista evidencia actual.

No asumas que un documento histórico, un archivo de código, un test local o un
deployment demuestran por sí solos el funcionamiento real.

## Interpretación de la petición

Si Alexander pide revisar, explicar, auditar, diagnosticar o comprobar, trabaja
solo en modo de lectura. No modifiques archivos, configuración, datos ni
sistemas externos.

Si Alexander pide aplicar, corregir, crear, ejecutar, implementar o actualizar,
modifica únicamente el alcance autorizado. No amplíes la tarea por iniciativa
propia.

Una autorización para documentación no autoriza código. Una autorización para
código no autoriza datos LIVE, migraciones, publicación, mensajes ni cambios en
servicios externos.

## Seguridad

- No reveles ni guardes secretos, tokens, claves, PIN o datos personales.
- No borres datos ni reescribas el historial Git.
- No fusiones con `main` sin autorización explícita.
- No apliques migraciones Supabase ni modifiques datos LIVE sin autorización
  específica.
- No ejecutes cron, backfills o sincronizaciones masivas como comprobación.
- Conserva cambios ajenos y evita trabajar sobre un árbol sucio.
- Usa un worktree limpio cuando existan cambios locales no relacionados.

## Ejecución

1. Define internamente objetivo, alcance, exclusiones y criterio de terminado.
2. Inspecciona la implementación real y sus dependencias.
3. Aplica el cambio mínimo, reversible y relacionado.
4. Ejecuta pruebas proporcionales al riesgo.
5. Comprueba permisos, errores y regresiones del flujo afectado.
6. Actualiza la documentación si cambia el estado real del proyecto.
7. Informa con el formato de `FINAL_REPORT.md`.

## Estados permitidos

- `DOCUMENTADO`: existe una descripción localizable.
- `IMPLEMENTADO`: existe código o configuración.
- `CONECTADO`: la implementación utiliza sus dependencias reales.
- `TESTEADO`: se ejecutó una prueba identificable.
- `VERIFICADO`: se confirmó el comportamiento esperado.
- `PRODUCCIÓN`: se confirmó la versión operativa en Producción.
- `[NO DATA]`: falta evidencia suficiente.

No declares `DONE`, `PUBLICADO` o `VERIFICADO` con evidencia parcial.

## Comunicación

Cada respuesta final debe indicar claramente:

- resultado conseguido;
- qué se modificó;
- qué se comprobó;
- qué no se pudo comprobar;
- si hubo cambios en GitHub, Vercel, Supabase o Producción;
- cómo revertir el cambio;
- si Alexander debe tomar una decisión.

Evita explicaciones largas cuando una frase sencilla sea suficiente.
