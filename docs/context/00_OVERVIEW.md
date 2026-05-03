# 00_OVERVIEW.md — SYNCROSFERA / SynchroShift (FULL)

---

## 1. VISIÓN GENERAL

SYNCROSFERA es una plataforma interna de gestión operativa diseñada para centralizar, controlar y medir toda la operativa diaria de múltiples departamentos en un entorno hospitality / salud / servicios.

La plataforma permite:

- registrar turnos operativos;
- documentar incidencias y gestiones;
- controlar tareas interdepartamentales;
- validar operaciones;
- gestionar cierres de caja;
- analizar rendimiento mediante dashboard y KPIs.

---

## 2. OBJETIVO DEL SISTEMA

El sistema existe para resolver un problema real:

```text
Falta de control, trazabilidad y medición real en operaciones diarias.
```

### Objetivos clave:

- estandarizar procesos;
- eliminar comunicación informal (WhatsApp, verbal);
- asegurar trazabilidad completa;
- medir rendimiento real por empleado y departamento;
- detectar errores operativos (FIO);
- permitir decisiones basadas en datos;
- conectar operación con resultados económicos.

---

## 3. ALCANCE FUNCIONAL

Actualmente la plataforma cubre:

### Operativa diaria
- registro de turnos (follow-up);
- incidencias operativas;
- gestiones pendientes;
- checklist de control;
- observaciones de turno;

### Control y validación
- validación por responsable;
- estados de turno;
- seguimiento de correcciones;

### Gestión financiera operativa
- cierre de caja Sala;
- caja Recepción Hotel;
- control de diferencias;
- conciliaciones internas;

### Productividad y control
- tareas interdepartamentales;
- deadlines y seguimiento;
- KPI de rendimiento;

### Análisis
- dashboard centralizado;
- métricas por departamento;
- FIO (fallos individuales operativos);
- SLA incidencias;
- costes (ej. merma);

---

## 4. DEPARTAMENTOS

### Activos

- Sala
- Cocina
- Recepción Hotel
- Restaurante F&B (agregado Sala + Cocina)

### En desarrollo

- Recepción SYNCROLAB
- Housekeeping
- Mantenimiento
- Clínica
- Marketing
- Sales

---

## 5. ESTRUCTURA OPERATIVA

La plataforma está organizada por módulos:

### Core
- Turnos (follow-up)

### Módulos operativos
- Cocina
- Sala
- Recepción Hotel

### Módulos de control
- Validación
- Dashboard

### Módulos de gestión
- Incidencias
- Gestiones pendientes
- Tareas

### Módulos financieros
- Caja Sala
- Caja Recepción

---

## 6. CONCEPTO CLAVE: TURNO (CORE)

Todo gira alrededor del turno.

Un turno incluye:

- fecha;
- servicio o turno (según departamento);
- horas trabajadas;
- responsable;
- observaciones;
- incidencias;
- gestiones pendientes;
- tareas creadas;
- FIO;
- checklist;
- relación con caja (si aplica).

Regla:

```text
El turno es la unidad mínima de control operativo.
```

---

## 7. ENTIDADES PRINCIPALES

- Turnos (shifts)
- Incidencias
- Gestiones pendientes
- Tareas
- FIO (fallos individuales)
- Checklist
- Cierres de caja
- Costes

Todas estas entidades están interrelacionadas.

---

## 8. SISTEMAS EXTERNOS

La plataforma debe integrarse o considerar:

- Bitrix24 → CRM, tareas, leads
- MEWS → PMS hotel
- POSMEWS → POS restaurante
- Nubimed → sistema clínica

Regla:

```text
“MUSE” debe interpretarse siempre como MEWS.
```

---

## 9. PRINCIPIOS DEL SISTEMA

### 9.1 Fuente única de verdad

```text
Todo dato debe existir en base de datos antes de aparecer en dashboard.
```

---

### 9.2 Trazabilidad total

Cada acción debe poder responder:

- quién;
- cuándo;
- qué;
- por qué;

---

### 9.3 Separación de conceptos

No mezclar:

- Incidencia ≠ Gestión pendiente
- Gestión ≠ Tarea
- FIO ≠ Incidencia

---

### 9.4 Validación obligatoria

```text
Nada está cerrado hasta ser validado.
```

---

### 9.5 Impacto en KPIs

```text
Todo registro afecta al dashboard.
```

---

### 9.6 Eliminación controlada

- eliminación afecta estadísticas;
- puede ser soft o hard delete;
- requiere control de permisos;

---

## 10. ESTADOS OPERATIVOS

### Turnos

- Pendiente
- En corrección
- Validado
- Cerrado

### Incidencias

- Abierta
- En proceso
- Cerrada

### Cierres de caja

- Pendiente
- Validado

---

## 11. SLA Y CONTROL DE TIEMPO

### Incidencias

- < 24h → OK
- 24–48h → warning
- > 48h → crítico

Tiempo calculado:

```text
fecha cierre - fecha creación
o
fecha actual - fecha creación (si sigue abierta)
```

---

## 12. FIO (FALLO INDIVIDUAL OPERATIVO)

Sistema para medir errores individuales.

Incluye:

- tipo de error;
- severidad;
- impacto en bonus;
- comentario;

Regla:

```text
Crítica = mayor impacto negativo.
```

---

## 13. DASHBOARD

El dashboard es el sistema de análisis central.

Debe mostrar:

- turnos;
- incidencias;
- gestiones;
- FIO;
- tareas;
- costes;
- KPIs por departamento;

Reglas:

- datos reales (no hardcode);
- filtros globales;
- recalculo tras cambios;
- real-time o actualización manual;

---

## 14. F&B (AGREGADO)

```text
F&B = Sala + Cocina
```

Debe sumar:

- turnos;
- incidencias;
- FIO;
- costes;
- tareas;

---

## 15. REGLAS DE UX OPERATIVA

La interfaz debe ser:

- clara;
- simple;
- sin lenguaje técnico;
- usable por personal de línea;

No mostrar:

- errores técnicos;
- arrays;
- IDs;
- null/undefined;
- logs;

---

## 16. PERMISOS (VISIÓN GENERAL)

### Usuario

- registra datos;
- no valida;
- no elimina;

### Validador / Responsable

- valida;
- revisa;
- devuelve a corrección;

### Admin

- controla todo;
- valida;
- elimina;
- reabre;
- gestiona sistema;

---

## 17. RELACIÓN CON ARQUITECTURA

Este archivo NO define:

- código;
- funciones;
- estructura JS;
- queries;
- tablas detalladas;

Eso pertenece a:

- 01_ARCHITECTURE.md
- 06_DATA_MODEL.md

---

## 18. RELACIÓN CON OTROS ARCHIVOS

| Archivo | Contenido |
|--------|----------|
| 01_ARCHITECTURE.md | lógica técnica |
| 02_BUSINESS_RULES.md | reglas operativas |
| 03_CORE_TURNOS.md | definición completa turno |
| 04_MODULES/* | detalle por módulo |
| 05_CASH/* | lógica de caja |
| 06_DATA_MODEL.md | tablas y campos |
| 07_QA.md | testing |
| 08_CURRENT_TASK.md | estado actual |
| 09_DECISIONS_PENDING.md | decisiones abiertas |

---

## 19. QUÉ NO DEBE ESTAR AQUÍ

- código
- SQL
- funciones JS
- lógica técnica detallada
- tareas en curso
- bugs específicos

---

## 20. RESULTADO ESPERADO

Este archivo debe permitir a cualquier desarrollador o IA entender:

- qué es la plataforma;
- qué problema resuelve;
- cómo se estructura conceptualmente;
- qué entidades existen;
- cómo se relacionan;
- qué principios gobiernan el sistema;

sin necesidad de leer código.

