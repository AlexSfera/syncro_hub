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
  fusionar a `main` ni modificar datos LIVE sin autorización explícita para esa
  acción.
- La autorización permanente definida en "Cierre automático de cambios
  probados" permite crear el commit, subir la rama `codex/...` y publicar en
  Vercel Producción sin pedir una confirmación adicional, siempre que se
  cumplan todas sus condiciones.
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
  esté autorizado. Una vez verificado, subir la rama conforme al capítulo
  "Cierre automático de cambios probados"; no dejar el único commit en local.
- "Publicar en GitHub" significa: comprobar, crear commit si hace falta y
  subir únicamente la rama indicada.
- "Publicar en Vercel" significa: comprobar, desplegar únicamente el entorno
  indicado. Para cambios solicitados, probados y desplegados en Preview,
  Producción es el cierre normal y no requiere una nueva pregunta al usuario.
- Antes de publicar, comprobar internamente el commit, entorno y plan de
  reversión; después, informar la versión publicada y el resultado.

## Verificación mínima

- Ejecutar las pruebas relevantes y la comprobación de sintaxis disponible.
- Para cambios de interfaz o permisos, validar en Preview y, si la validación es
  satisfactoria, continuar directamente a Producción.
- Para Supabase, no ejecutar migraciones ni tocar datos LIVE sin autorización;
  comprobar primero el plan, reversión y permisos.

## Cierre automático de cambios probados

El objetivo es evitar que un cambio terminado quede solamente en local o en
Preview. Para este proyecto, una petición de implementar, corregir o desplegar
un cambio autoriza a completar todo el circuito técnico necesario para dejarlo
publicado y recuperable, sin solicitar una segunda confirmación de publicación.

1. Cuando el cambio solicitado esté implementado y las pruebas relevantes sean
   satisfactorias, crear un commit que incluya exclusivamente ese cambio.
2. Subir el commit a su rama `codex/...` para que el trabajo no exista solo en
   el equipo local.
3. Usar Preview como control intermedio. Preview no constituye entrega final ni
   permite marcar la tarea como `DONE`.
4. Si Preview está correcto y existe un plan de reversión verificable, promover
   exactamente ese deployment inmutable a Vercel Producción sin preguntar de
   nuevo al usuario.
5. Verificar después de publicar el dominio público de producción, los recursos
   modificados, los endpoints relevantes y los registros disponibles.
6. Informar al usuario solo después del cierre, indicando URL pública, commit,
   estado de las pruebas, resultado de la verificación y referencia de
   reversión.

No afirmar `PUBLICADO`, `VERIFICADO` ni `DONE` si el cambio permanece en local,
solo está en GitHub o únicamente está en Preview. El cierre correcto exige como
mínimo: commit remoto, deployment de Producción en estado `READY` y comprobación
del dominio público.

Esta autorización permanente no amplía el alcance funcional solicitado ni
autoriza migraciones Supabase, cambios o borrados de datos LIVE, publicación de
secretos, inclusión de modificaciones ajenas, fusión a `main`, reescritura de
historial ni acciones irreversibles. Ante cualquiera de esos casos, detenerse y
pedir autorización específica. Si fallan las pruebas, Preview o la verificación
de Producción, no ocultar el fallo: ejecutar una reversión segura cuando proceda
y comunicar el bloqueo con evidencia.

## Progreso

En tareas largas, comunicar brevemente dónde estamos, qué se comprobó, qué
cambió y cuál es el siguiente paso. No detener el trabajo por actualizaciones
intermedias que no requieran una decisión del usuario.
