# 04_MODULE_SALA_FULL.md — SYNCROSFERA / SynchroShift (FULL PRO REAL)

---

## 1. OBJETIVO DEL MÓDULO SALA

El módulo Sala tiene como objetivo controlar:

- operación de servicio (F&B)
- calidad de atención al cliente
- control de ingresos y desviaciones
- comunicación con Cocina y Recepción
- trazabilidad de incidencias
- control de caja
- impacto directo en KPIs y rentabilidad

Sala es el módulo donde:

```text
Operación + Cliente + Dinero se cruzan
```

---

## 2. NAVEGACIÓN SUPERIOR (OBLIGATORIA)

### Estructura

[ Mi turno ] [ Gestiones pendientes ] [ Tareas ] [ Cierre de caja ] -------- [ Info ] [ Usuario ] [ Sala ] [ Salir ]

### Reglas

- Info SIEMPRE a la derecha
- Usuario + Sala + Salir a la derecha
- Mi turno SIEMPRE a la izquierda
- Cierre de caja SOLO visible en Sala
- No mostrar botones de Cocina o Recepción
- No duplicar botones

---

## 3. ACCESO Y SESIÓN

### Login

- PIN obligatorio
- identificación:
  - usuario
  - rol
  - departamento = Sala

### Logout obligatorio

```text
Guardar turno → logout automático
```

Motivo:
- evitar doble turno
- evitar manipulación
- evitar uso compartido

---

## 4. PESTAÑA MI TURNO (CORE)

### 4.1 Campos base

| Campo | Tipo | Regla |
|------|------|------|
| Fecha | automática | no editable |
| Servicio | selector | desayuno/comida/cena/evento |
| Horas trabajadas | numérico | obligatorio |
| Responsable turno | dropdown | desde configuración |
| Observaciones | texto | opcional |

---

## 5. SERVICIO (LÓGICA SALA)

### Valores

- Desayuno
- Comida
- Cena
- Evento

### Reglas

- puede ser múltiple
- no mostrar arrays
- debe impactar dashboard

---

## 6. GESTIONES PENDIENTES (FULL)

### Lógica

Pregunta:
¿Hay gestión pendiente?

---

### Tipos (Sala)

- Seguimiento cliente
- Reserva pendiente
- Comunicación con Cocina
- Comunicación con Recepción
- Organización de sala
- Pedido pendiente
- Falta material
- Coordinación evento
- Incidencia a revisar (NO usar para ocultar incidencia)
- Otro

---

### Reglas

- tipo obligatorio
- descripción obligatoria
- visible hasta cierre
- no desaparece
- no sustituye incidencia

---

### Error crítico

```text
Usar gestión para ocultar incidencia → PROHIBIDO
```

---

## 7. INCIDENCIAS (FULL PRO)

### Cuándo crear

SIEMPRE si:
- cliente afectado
- error en servicio
- error en cuenta
- retraso
- fallo operativo

---

### Tipos Sala

- Queja cliente
- Error servicio
- Retraso
- Error en cuenta
- Problema TPV
- Problema reserva
- Problema Cocina-Sala
- Incidencia personal
- Otro

---

### Campos obligatorios

- qué ocurrió
- tipo
- informado responsable

---

### Opcionales críticos

- acción inmediata
- personas involucradas

---

### SLA

- <24h OK
- 24–48h warning
- >48h crítico

---

### Casos límite

- Cliente molesto → incidencia
- Retraso → incidencia
- Mesa mal servida → incidencia
- Error corregido → sigue siendo incidencia

---

## 8. AJUSTES (CRÍTICO SALA)

### Definición

```text
Desviación de ingresos o ajustes económicos del turno
```

---

### Flujo

Después de guardar turno → popup ajustes

---

### Tipos ajustes

- descuento no registrado
- invitación
- error TPV
- error POSMEWS
- anulación
- corrección manual
- otro

---

### Reglas

- pueden ser múltiples
- importe obligatorio
- descripción obligatoria

---

### Impacto

- dashboard
- validación
- caja

---

## 9. CHECKLIST SALA (FULL SIN RECORTE)

### Preparación

- sala montada
- terraza revisada
- barra operativa
- reservas revisadas
- material suficiente
- cartas disponibles

---

### Durante servicio

- comandas correctas
- comunicación con cocina
- incidencias registradas
- clientes atendidos

---

### Control económico

- descuentos registrados
- invitaciones registradas
- anulaciones registradas
- TPV correcto

---

### Comunicación

- incidencias comunicadas
- gestiones registradas
- tareas creadas

---

### Cierre

- sala preparada siguiente turno
- barra limpia
- material repuesto
- tareas pendientes registradas

---

### Limpieza

- mesas limpias
- suelo revisado
- basura retirada
- utensilios ordenados

---

### KPI

```text
% completado = items / total
```

---

### Error crítico

```text
Marcar checklist sin revisar → invalida sistema
```

---

## 10. CIERRE DE CAJA SALA

(Detalle técnico en 05_CASH)

---

### Reglas operativas

- cualquier empleado registra
- admin valida
- diferencias obligan explicación

---

### Estados

- pendiente
- validado

---

## 11. FLUJO COMPLETO SALA

Mi turno → checklist → ajustes → decisión caja → guardar → logout

---

### Casos

- sin caja
- con caja
- con ajustes
- con incidencia

---

## 12. GUARDAR TURNO

### Validaciones

- campos obligatorios
- incidencias completas
- gestiones completas
- checklist completo

---

### Flujo

1. guardar
2. checklist
3. ajustes
4. confirmar
5. guardar DB
6. estado pendiente
7. logout

---

### Mensaje

```text
Turno guardado correctamente
```

---

## 13. MÁXIMO 2 TURNOS

- 0 → OK
- 1 → OK aviso
- 2 → bloqueo

---

## 14. BLOQUES INFERIORES

### Gestiones activas
### Incidencias activas
### Tareas
### Últimos turnos

---

## 15. PESTAÑA GESTIONES

- listado
- filtros
- estados

---

## 16. PESTAÑA TAREAS

- creadas
- recibidas
- vencidas

---

## 17. PESTAÑA CAJA

- listado cierres
- estado
- validación

---

## 18. PESTAÑA INFO

Debe explicar:
- cómo usar turno
- incidencias
- gestiones
- ajustes
- caja

No mostrar:
- código
- errores técnicos

---

## 19. PERMISOS

### Usuario

- crea turno
- crea caja

---

### Responsable

- valida
- corrige

---

### Admin

- controla todo

---

## 20. DASHBOARD SALA

Debe mostrar:

- ingresos
- diferencias
- incidencias
- FIO
- checklist
- ajustes

---

## 21. VALIDACIÓN

- turno visible
- incidencias visibles
- ajustes visibles
- caja visible

---

## 22. FIO EN SALA

- creado en validación
- mide errores humanos
- afecta bonus

---

## 23. UX/UI

- simple
- clara
- sin errores técnicos

---

## 24. ERRORES CRÍTICOS

- no logout
- duplicar turnos
- ocultar incidencias
- no registrar ajustes

---

## 25. PROMPT TÉCNICO

(Contexto completo para Codex ya alineado con reglas anteriores)

---

## 26. QA CHECKLIST SALA

- login OK
- navegación OK
- turno OK
- incidencias OK
- gestiones OK
- ajustes OK
- checklist OK
- caja OK
- dashboard OK

---

## 27. CRITERIOS DE ACEPTACIÓN

Sistema correcto si:

- controla operación
- controla ingresos
- refleja realidad
- permite validación

---

## 28. RIESGOS

- datos falsos
- ingresos incorrectos
- errores no detectados

---

## 29. PENDIENTES

- [NO DATA] detalle permisos finos
- [NO DATA] integración POSMEWS real
