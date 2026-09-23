# Housekeeping — criterios de aceptación UX

**Fecha:** 2026-09-23  
**Dispositivo objetivo:** OSCAL C30 Pro, referencia de validación 360 × 800 CSS px  
**Responsable funcional:** Yessica · Gobernanta

## Resultado esperado

Housekeeping debe permitir planificar, ejecutar e inspeccionar el trabajo diario sin duplicidades ni controles ajenos al departamento.

## Flujos por rol

### Gobernanta

- Entra directamente en **Mi Ruta**.
- Accede a planificación, inspecciones, zonas públicas, configuración y dashboard HK.
- Tiene un checklist diario propio de 15 controles.
- Puede crear una planificación, cargar la plantilla diaria, asignar varias zonas o tareas periódicas a la vez y comprobar la carga frente al objetivo de 8 horas.
- Inspecciona habitaciones y aprueba el resto de trabajos, con visibilidad expresa de incidencias.
- No ve la pestaña **Cierre Caja** dentro de Validación.

### Personal de limpieza

- Entra directamente en **Mi Ruta**.
- Solo ve y ejecuta sus asignaciones.
- No recibe el checklist de Gobernanta.
- Puede iniciar, pausar, continuar, finalizar y registrar una incidencia.

## Reglas operativas

- Una habitación puede tener una limpieza y una inspección el mismo día; no puede tener dos limpiezas ni dos inspecciones equivalentes.
- Las zonas públicas y tareas periódicas admiten selección múltiple, filtro de texto y selección total de resultados visibles.
- Las tareas periódicas se muestran en orden alfabético.
- **Destripe** tiene una duración estándar de 3 minutos.
- La carga diaria muestra minutos, número de asignaciones, porcentaje sobre 480 minutos y desviación restante o exceso.
- La sesión se cierra después de 40 minutos sin actividad y no se restaura si ya había caducado.

## Catálogo FIO Housekeeping

El catálogo operativo contiene nueve tipologías agrupadas. Los niveles L2 o superiores requieren evidencia. «Otro fallo» es provisional y debe reclasificarse antes de validar. Las incidencias de puntualidad o ausencia se controlan en Bitrix24.

## Validación mínima

- Sintaxis de todos los módulos modificados.
- Pruebas automáticas del catálogo, checklist, permisos, sesión y reglas UX.
- Revisión visual en escritorio y en 360 × 800 CSS px.
- Prueba del flujo de Gobernanta sin escrituras sobre datos LIVE.
