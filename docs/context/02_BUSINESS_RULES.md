# 02_BUSINESS_RULES_FULL_PRO_REAL.md — SYNCROSFERA / SynchroShift

---

## 1. OBJETIVO

Documento maestro de reglas operativas reales del sistema.

Este archivo define **cómo se usa el sistema en la práctica**, no solo qué es cada elemento.

Debe servir para:
- desarrollo
- QA
- validación
- formación operativa

---

## 2. PRINCIPIO BASE

```text
Si no está registrado, no existe.
Si no está validado, no está cerrado.
Si no impacta en dashboard, está mal diseñado.
```

---

## 3. DIFERENCIACIÓN CRÍTICA DE CONCEPTOS

### 3.1 Incidencia

```text
Algo que YA impactó operación o cliente.
```

Ejemplos:
- cliente se queja
- retraso servicio
- producto en mal estado
- error en cuenta

---

### 3.2 Gestión pendiente

```text
Algo que debe hacerse después, sin urgencia crítica.
```

Ejemplos:
- revisar stock
- hacer pedido
- comunicar algo a otro turno

---

### 3.3 Tarea

```text
Acción formal con responsable y deadline interdepartamental.
```

Ejemplos:
- mantenimiento debe reparar máquina
- recepción debe contactar cliente

---

### 3.4 FIO

```text
Error individual detectado en validación.
```

Regla clave:

```text
FIO solo lo crea jefe de departamento / validador / admin.
NUNCA el usuario durante turno.
```

---

## 4. REGLAS DE TURNO (OPERATIVO REAL)

### Creación

- obligatorio
- no hay borrador
- guardar = enviar

---

### Restricción

```text
Máximo 2 turnos por usuario por día
```

---

### Logout

```text
Guardar turno = logout automático obligatorio
```

Motivo:
- evitar duplicidad
- evitar manipulación posterior

---

### Edición

- limitada en tiempo (ej: 30 min)
- después solo validación puede modificar

---

### Estados

- pendiente
- en corrección
- validado
- cerrado

---

## 5. REGLAS DE INCIDENCIAS (PROFUNDAS)

### Cuándo crear incidencia

SIEMPRE cuando:
- afecta cliente
- afecta servicio
- afecta operación

NO usar incidencia si:
- es algo futuro → usar gestión
- es acción estructurada → usar tarea

---

### Obligaciones

- debe describirse claramente
- debe clasificarse
- debe poder resolverse

---

### SLA

- <24h → OK
- 24–48h → warning
- >48h → crítico

---

### Cierre

- debe registrarse fecha cierre
- debe quedar trazabilidad
- impacta KPI

---

### Impacto en dashboard

- cuenta incidencias abiertas
- calcula tiempo medio resolución
- genera alertas

---

## 6. REGLAS DE GESTIONES

### Uso correcto

- no urgentes
- continuidad operativa
- traspaso entre turnos

---

### Reglas

- visibles hasta cierre
- no deben desaparecer
- no se convierten en incidencia

---

### Error común

```text
Usar gestión para ocultar incidencias → PROHIBIDO
```

---

## 7. REGLAS DE TAREAS

### Uso correcto

- acción concreta
- responsable definido
- deadline obligatorio

---

### Reglas

- interdepartamental
- visible en módulo tareas
- visible en dashboard
- control de vencimiento

---

### Error común

```text
Crear tarea sin responsable o deadline → inválido
```

---

## 8. REGLAS DE FIO (CRÍTICO)

### Creación

- solo en validación
- por responsable o admin

---

### Cuándo crear FIO

- error humano
- incumplimiento proceso
- negligencia operativa

---

### Severidad

- Baja
- Media
- Alta
- Crítica

```text
Crítica = mayor impacto negativo
```

---

### Estado

- gestionado
- no gestionado

---

### Impacto

- afecta bonus
- genera alerta si crítico no gestionado

---

## 9. CHECKLIST

### Uso

- obligatorio antes de guardar turno

---

### Función

- control de calidad
- estandarización

---

### KPI

```text
% completado = items completados / total
```

---

### Error común

```text
Marcar todo sin revisar → invalida sistema
```

---

## 10. CIERRES DE CAJA

### Regla base

```text
Validar = cierre definitivo
```

---

### Obligaciones

- registrar correctamente
- explicar diferencias

---

### Error crítico

```text
Guardar caja con diferencia sin explicación → inválido
```

---

## 11. REGLAS DE DATOS

- no duplicados
- no arrays visibles
- no null/undefined
- no datos huérfanos

---

## 12. ELIMINACIÓN

### Tipos

- soft delete
- hard delete (admin)

---

### Regla crítica

```text
Eliminar afecta dashboard
```

---

### Borrado en cascada

Eliminar turno implica:
- incidencias
- gestiones
- FIO
- tareas relacionadas

---

## 13. DASHBOARD (NEGOCIO)

### Reglas

- solo datos reales
- filtros afectan TODO
- recalculo tras cambios

---

### Alertas

- turno no validado
- incidencia abierta
- FIO crítico no gestionado

---

### F&B

```text
Sala + Cocina
```

---

## 14. PERMISOS

### Usuario

- registra
- no valida
- no elimina

---

### Validador

- valida
- corrige

---

### Admin

- todo

---

## 15. UX OPERATIVA

- simple
- clara
- sin lenguaje técnico

---

## 16. ERRORES CRÍTICOS A EVITAR

- duplicar turnos
- mezclar conceptos
- ocultar incidencias
- no validar
- KPI falsos

---

## 17. CRITERIOS DE ACEPTACIÓN

Sistema correcto si:

- datos son fiables
- incidencias se gestionan
- dashboard refleja realidad
- turnos son trazables
- FIO detecta errores reales
