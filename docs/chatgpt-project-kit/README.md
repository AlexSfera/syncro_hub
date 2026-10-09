# SYNCRO SHIFT — Kit para configurar el proyecto en ChatGPT

## Qué es este kit

Este directorio contiene los textos y archivos necesarios para configurar un
proyecto real de ChatGPT dedicado a SYNCRO SHIFT. No crea el proyecto de ChatGPT
automáticamente: primero hay que crear la carpeta del proyecto desde la interfaz
de ChatGPT.

## Instalación

1. Cree en ChatGPT un proyecto llamado `SYNCRO SHIFT`.
2. Abra la configuración del proyecto.
3. Copie todo el contenido de `PROJECT_INSTRUCTIONS.md` en el campo
   **Instrucciones del proyecto**.
4. Suba como archivos del proyecto:
   - `PROJECT_CONTEXT.md`;
   - `PROJECT_RULES.md`;
   - `RUNBOOK.md`;
   - `../00-governance/SOURCE_OF_TRUTH.md`;
   - `../04-development/CURRENT_STATE.md`.
5. Guarde `TASK_BRIEF.md` para iniciar tareas nuevas.
6. Use `FINAL_REPORT.md` como formato obligatorio de cierre.

## Función de cada archivo

| Archivo | Dónde se usa | Para qué sirve |
|---|---|---|
| `PROJECT_INSTRUCTIONS.md` | Instrucciones del proyecto | Define el comportamiento permanente del agente |
| `PROJECT_CONTEXT.md` | Archivo del proyecto | Identifica SYNCRO SHIFT y explica su arquitectura |
| `PROJECT_RULES.md` | Archivo del proyecto | Fija seguridad, permisos y reglas de evidencia |
| `RUNBOOK.md` | Archivo del proyecto | Indica el procedimiento de revisión, cambio y cierre |
| `TASK_BRIEF.md` | Mensaje de inicio | Permite pedir trabajo sin lenguaje técnico |
| `FINAL_REPORT.md` | Respuesta final | Obliga a separar hechos, pruebas y límites |

## Regla de mantenimiento

Cuando cambie la arquitectura, el estado de un módulo, GitHub, Vercel o
Supabase, se debe actualizar primero la documentación versionada en GitHub. Los
archivos del proyecto ChatGPT se sustituyen después por la nueva versión.

No mantenga copias editadas manualmente sin registrar su cambio en GitHub.
