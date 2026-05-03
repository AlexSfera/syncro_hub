# 03_CORE_TURNOS.md — SYNCROSFERA (FULL PRO)

---

## 1. OBJETIVO

Definir la estructura CORE del sistema: el TURNO.

Este documento es el más crítico del sistema porque:

```text
TODO (incidencias, tareas, FIO, caja, dashboard) depende del turno.
```

---

## 2. DEFINICIÓN DE TURNO

Un turno es el registro operativo completo de un empleado en un periodo de trabajo.

Incluye:

- datos básicos
- actividad operativa
- incidencias
- gestiones
- tareas
- validación
- relación con caja
- impacto en KPIs

---

## 3. CAMPOS CORE (OBLIGATORIOS PARA TODOS)

### Identificación

- turno_id (ID único)
- usuario_id
- nombre_usuario
- departamento
- fecha

---

### Operación

- servicio_turno
- horas_trabajadas
- responsable_turno
- observaciones

---

### Control

- estado
- fecha_creacion
- fecha_actualizacion

---

## 4. CAMPOS CONDICIONALES

### Incidencias

- hay_incidencia (boolean)
- tipo_incidencia
- descripcion_incidencia
- accion_inmediata
- informado_responsable
- personas_involucradas

---

### Gestiones pendientes

- hay_gestion (boolean)
- tipo_gestion
- descripcion_gestion

---

### Tareas

- tareas_creadas (array / relación)

---

### FIO (validación)

- hay_fio
- tipo_error
- severidad
- impacto
- comentario

---

### Checklist

- checklist_items
- checklist_completado (boolean)
- checklist_porcentaje

---

### Caja (según departamento)

- caja_id
- tipo_caja (sala / recepcion)

---

## 5. REGLAS DE NEGOCIO

### 5.1 Creación

- siempre se crea
- no existe borrador

---

### 5.2 Restricción

```text
Máximo 2 turnos por usuario por día
```

---

### 5.3 Logout

```text
Guardar → logout obligatorio
```

---

### 5.4 Edición

- editable en ventana limitada
- luego solo validación

---

## 6. ESTADOS

- pendiente
- corrección
- validado
- cerrado

---

## 7. RELACIONES

```text
turno → incidencias
turno → gestiones
turno → tareas
turno → FIO
turno → checklist
turno → caja
```

---

## 8. REGLAS DE DATOS

- no duplicar turno
- no permitir fecha futura inválida
- no permitir campos vacíos obligatorios
- no guardar arrays visibles

---

## 9. IMPACTO EN DASHBOARD

Cada turno afecta:

- KPIs
- incidencias
- FIO
- tareas
- costes
- alertas

---

## 10. VALIDACIÓN

Proceso:

1. usuario crea turno
2. sistema guarda
3. pasa a pendiente
4. validador revisa
5. puede:
   - validar
   - enviar a corrección

---

## 11. ALERTAS

Un turno genera alerta si:

- no está validado
- tiene incidencia abierta
- tiene FIO crítico no gestionado

---

## 12. BORRADO

Eliminar turno implica:

- eliminar incidencias
- eliminar gestiones
- eliminar FIO
- eliminar tareas relacionadas
- recalcular dashboard

---

## 13. DIFERENCIAS POR DEPARTAMENTO

### Sala / Cocina

- servicio (desayuno/comida/cena)

---

### Recepción

- turno (mañana/tarde/noche)

---

## 14. REGLAS UX

- formulario simple
- no mostrar campos irrelevantes
- feedback al guardar
- no mostrar errores técnicos

---

## 15. RESULTADO ESPERADO

Turno:

- consistente
- completo
- auditable
- medible
