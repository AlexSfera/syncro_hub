# SYNCRO HUB — Guía de trabajo para Codex

## Objetivo

Mantener y mejorar SYNCRO HUB con seguridad, trazabilidad y ritmo de trabajo.
La evidencia técnica prevalece sobre documentación, recuerdos o hipótesis:

1. código y configuración reales;
2. estado verificable de Git, Vercel y Supabase;
3. pruebas reproducibles;
4. documentación.

Si falta evidencia, indicar `[NO DATA]`.

## Forma de trabajar

- Trabajar de forma autónoma en comprobaciones de lectura y pasos normales de
  implementación ya autorizados.
- Se pueden ejecutar varios comandos relacionados sin esperar al usuario tras
  cada uno. Informar en hitos: hallazgo, cambio realizado, prueba terminada o
  bloqueo real.
- Hacer supuestos razonables de bajo riesgo y explicarlos al entregar el
  resultado. Pedir decisión solo si cambia materialmente el alcance o afecta a
  producción, datos o terceros.
- Explicar resultados en español sencillo y separar hechos, riesgos y
  recomendaciones.

## Seguridad y control de cambios

- Nunca borrar datos, reescribir historial Git, aplicar migraciones Supabase,
  desplegar en Vercel, fusionar a `main` ni subir a GitHub sin autorización
  explícita para esa acción.
- Conservar cambios ajenos o no confirmados. Antes de una operación que pueda
  alterar el árbol de trabajo, crear un punto de restauración reversible cuando
  sea necesario.
- Mantener los cambios pequeños y relacionados; no incluir refactorizaciones
  generales en una corrección puntual.
- No incluir secretos, claves, tokens ni datos reales de empleados o clientes
  en código, documentación o mensajes.

## Flujo de implementación

1. Auditar y confirmar el problema y sus dependencias.
2. Aplicar solo el alcance autorizado.
3. Ejecutar pruebas y comprobaciones proporcionales al riesgo.
4. Informar archivos afectados, comportamiento esperado, resultados y límites
   de la verificación.

Usar `CORREGIDO` cuando el código cambió y `VERIFICADO` solo cuando existe
evidencia suficiente del flujo real, permisos y resultado esperado.

## Git y publicación

- Usar ramas `codex/...` para trabajo nuevo.
- Se pueden crear commits locales tras pruebas satisfactorias cuando el cambio
  esté autorizado. No hacer `push` sin una orden explícita.
- "Publicar en GitHub" significa: comprobar, crear commit si hace falta y
  subir únicamente la rama indicada.
- "Publicar en Vercel" significa: comprobar, desplegar únicamente el entorno
  indicado. Producción requiere que el usuario nombre expresamente
  "producción".
- Antes de publicar, confirmar el commit, entorno y plan de reversión; después,
  informar la versión publicada y el resultado.

## Verificación mínima

- Ejecutar las pruebas relevantes y la comprobación de sintaxis disponible.
- Para cambios de interfaz o permisos, validar en Preview antes de proponer
  producción.
- Para Supabase, no ejecutar migraciones ni tocar datos LIVE sin autorización;
  comprobar primero el plan, reversión y permisos.

## Progreso

En tareas largas, comunicar brevemente dónde estamos, qué se comprobó, qué
cambió y cuál es el siguiente paso. No detener el trabajo por actualizaciones
intermedias que no requieran una decisión del usuario.
