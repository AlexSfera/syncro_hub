# 04_MODULE_VALIDACION_FULL.md — SYNCROSFERA / SynchroShift (FULL PRO REAL)

---

## 1. OBJETIVO DEL MÓDULO VALIDACIÓN

El módulo **Validación** es el centro de control operativo de SYNCROSFERA.

Su función es revisar, corregir, validar y cerrar registros creados por empleados en los módulos operativos.

Validación conecta:

- Turnos.
- Incidencias.
- Gestiones pendientes.
- Tareas.
- Checklist.
- Mermas.
- Ajustes.
- Cierres de caja.
- KPI Recepción Hotel.
- Ventas SYNCROLAB.
- Leads Bitrix24.
- Clientes insatisfechos.
- FIO.
- Dashboard.
- Permisos.
- Auditoría.

Regla principal:

```text
Nada está cerrado operativamente hasta pasar por Validación.
```

---

## 2. PRINCIPIO GENERAL

Validación NO es una pantalla operativa para registrar turno.

Validación es una pantalla de control para:

- revisar lo que el empleado ha enviado;
- detectar errores;
- pedir corrección;
- registrar FIO;
- validar información;
- cerrar control operativo;
- alimentar dashboard fiable.

---

## 3. NAVEGACIÓN SUPERIOR ADMIN

### Estructura obligatoria

```text
[ Dashboard ] [ Validación ] [ Incidencias ] [ Gestiones pendientes ] [ Tareas ] [ Maestro ] [ Export ]
```

### Reglas

- `Dashboard` primero.
- `Validación` segundo.
- `Incidencias`, `Gestiones pendientes`, `Tareas` después.
- `Maestro` y `Export` al final.
- `Info`, si existe, debe estar a la derecha.
- No mostrar `Mi turno` en Admin.
- No mostrar `Cierre de caja` operativo arriba.
- No mostrar `Caja Recepción` operativa arriba.
- La validación de cajas vive dentro de Validación.

---

## 4. ROLES Y ACCESO

### Usuario lineal

No accede a Validación.

Puede:

- crear turno;
- crear incidencias;
- crear gestiones;
- crear tareas si aplica;
- crear caja si su departamento lo permite;
- corregir si se devuelve a corrección.

No puede:

- validar;
- crear FIO;
- eliminar;
- ver registros de otros;
- validar caja;
- cerrar definitivamente.

---

### Jefe de departamento / Validador

Puede:

- acceder a Validación;
- ver registros de su departamento;
- revisar turnos;
- validar turnos de su departamento;
- enviar a corrección;
- crear FIO;
- revisar caja de su departamento si tiene permiso;
- validar caja si está definido;
- ver dashboard parcial si aplica.

No puede:

- eliminar definitivamente;
- ver todos los departamentos salvo permiso;
- modificar datos fuera de su departamento;
- hard delete.

---

### Admin

Puede:

- ver todos los departamentos;
- revisar todo;
- validar todo;
- enviar a corrección;
- crear FIO;
- validar cierres;
- eliminar registros;
- hard delete con confirmación;
- reabrir si está implementado;
- ver dashboard completo;
- exportar.

---

## 5. ESTRUCTURA INTERNA DEL MÓDULO

Validación debe tener dos submódulos principales:

```text
[ Follow-up ] [ Cierres de caja ]
```

### Follow-up valida:

- Turnos.
- Checklist.
- Gestiones.
- Incidencias.
- Tareas.
- Mermas Cocina.
- Ajustes Sala.
- KPI Recepción Hotel.
- FIO.
- Datos operativos específicos por departamento.

### Cierres de caja valida:

- Caja Sala.
- Caja Recepción Hotel.
- Caja Recepción SYNCROLAB cuando exista.
- Futuros cierres financieros por departamento.

---

## 6. FOLLOW-UP — TABLA PRINCIPAL

La tabla debe permitir revisar todos los turnos enviados.

### Columnas obligatorias

| Columna | Descripción |
|---|---|
| Fecha | Fecha del turno |
| Empleado | Persona que envió el turno |
| Departamento | Cocina / Sala / Recepción Hotel / etc. |
| Servicio / Turno | Servicio o turno según departamento |
| Horas | Horas trabajadas |
| Ajustes | Badge numérico si aplica |
| Incidencias | Badge numérico |
| Gestiones | Badge numérico |
| Tareas | Badge numérico |
| FIO | Estado o badge |
| Estado | Pendiente / Corrección / Validado / Cerrado |
| Acción | Revisar |

### Reglas

- Gestiones y tareas deben mostrarse como badge numérico.
- No mostrar arrays.
- No mostrar JSON.
- No mostrar IDs técnicos.
- No mezclar Servicio con Turno.
- No mezclar incidencias con gestiones.

---

## 7. FILTROS FOLLOW-UP

### Filtros obligatorios

- Fecha desde.
- Fecha hasta.
- Estado.
- Departamento.
- Servicio / Turno.
- Empleado.

### Estado

Opciones:

- Todos.
- Pendiente de revisión.
- En corrección.
- Validado.
- Cerrado.

### Departamento

Dropdown:

- Todos.
- Cocina.
- Sala.
- Restaurante F&B.
- Recepción Hotel.
- Recepción SYNCROLAB.
- Housekeeping.
- Clínica.
- Mantenimiento.
- Marketing.
- Sales.

Aunque algunos departamentos estén en desarrollo, deben poder existir como opción si están configurados.

### Empleado

Debe filtrarse según departamento:

- Cocina → empleados Cocina.
- Sala → empleados Sala.
- Restaurante F&B → Sala + Cocina.
- Recepción Hotel → empleados Recepción Hotel.
- Todos → todos los empleados visibles para el rol.

---

## 8. SERVICIO / TURNO UNIFICADO

### Regla general

```text
Sala y Cocina usan Servicio.
Recepción Hotel usa Turno.
La UI Admin debe mostrar Servicio / Turno.
```

### Cocina

- Desayuno.
- Comida.
- Cena.
- Evento.

### Sala

- Desayuno.
- Comida.
- Cena.
- Evento.

### Recepción Hotel

- Mañana.
- Tarde.
- Noche.

### Recepción SYNCROLAB

[NO DATA]

### F&B

Cuando departamento = Restaurante F&B:

- incluir servicios de Sala;
- incluir servicios de Cocina;
- no incluir turnos Recepción.

---

## 9. ACCIONES DISPONIBLES

### Acciones permitidas

- Revisar.
- Enviar a corrección.
- Validar.
- Eliminar solo Admin.

### Acción eliminada

```text
Rechazar
```

Debe eliminarse.

Motivo:

- genera ambigüedad;
- no define si borra, invalida o devuelve;
- se sustituye por Validar / Enviar a corrección / Eliminar.

---

## 10. POP-UP DE VALIDACIÓN — CABECERA

Al pulsar `Revisar`, se abre pop-up completo.

### Cabecera obligatoria

Debe mostrar:

- Empleado.
- Departamento.
- Fecha.
- Servicio / Turno.
- Estado actual.

Ejemplo:

```text
Empleado: Ana López
Departamento: Recepción Hotel
Fecha: 03/05/2026
Servicio / Turno: Mañana
Estado: Pendiente de revisión
```

---

## 11. POP-UP DE VALIDACIÓN — BLOQUES

El pop-up debe mostrar bloques según departamento.

### Bloques comunes

1. Datos base del turno.
2. Checklist.
3. Gestiones pendientes.
4. Incidencias.
5. Tareas creadas.
6. FIO.
7. Acciones finales.

### Cocina añade

- Mermas.
- APPCC si aplica.

### Sala añade

- Ajustes.
- Resumen Caja Sala si vinculada.

### Recepción Hotel añade

- KPI empleado.
- Ventas SYNCROLAB.
- Leads Bitrix24.
- Clientes insatisfechos.
- Caja Recepción.
- Conciliación Sala/SYNCROLAB/MEWS.

---

## 12. POP-UP — DATOS BASE

Debe mostrar:

- Fecha.
- Empleado.
- Departamento.
- Servicio / Turno.
- Horas trabajadas.
- Responsable de turno si aplica.
- Observaciones.

### Reglas

- Solo lectura por defecto.
- Admin puede editar solo si permiso definido.
- No mostrar IDs.
- No mostrar null/undefined/NaN.

---

## 13. POP-UP — CHECKLIST

Debe mostrar:

- checklist completado;
- puntos marcados;
- puntos no marcados;
- porcentaje;
- fecha/hora;
- usuario que lo completó.

### Reglas

- Checklist incompleto NO genera alerta automática por decisión actual.
- Puede justificar corrección o FIO si se detecta incumplimiento real.
- Debe alimentar dashboard como porcentaje.

### Fórmula

```text
% checklist = items completados / total items * 100
```

---

## 14. POP-UP — GESTIONES PENDIENTES

Debe mostrar:

- tipo;
- descripción;
- estado;
- fecha creación;
- responsable/destino;
- deadline si aplica.

### Reglas

- No mezclar con incidencias.
- Si sigue abierta, debe aparecer en Gestiones pendientes.
- Gestión mal clasificada puede enviarse a corrección.
- Gestión no es FIO automáticamente.

---

## 15. POP-UP — INCIDENCIAS

Debe mostrar:

- tipo;
- qué ocurrió;
- acción inmediata;
- informado responsable;
- personas involucradas;
- estado;
- fecha creación;
- fecha cierre;
- tiempo resolución.

### SLA

- <24h → OK.
- 24–48h → Warning.
- >48h → Crítico.

### Reglas

- Incidencia abierta genera alerta dashboard.
- Incidencia >24h genera aviso.
- Incidencia >48h genera crítico.
- Incidencia incompleta puede enviarse a corrección.
- Si hay error individual, puede generar FIO.

---

## 16. POP-UP — TAREAS CREADAS

Debe mostrar:

- título;
- descripción;
- departamento destino;
- responsable;
- deadline;
- prioridad;
- estado.

### Reglas

- Tarea debe tener responsable y deadline.
- Tarea sin deadline = corrección obligatoria.
- Tarea no sustituye incidencia.
- Tarea no sustituye gestión.

---

## 17. VALIDACIÓN COCINA

### Debe revisar

- datos turno;
- gestiones;
- incidencias;
- mermas;
- checklist;
- tareas;
- FIO si aplica.

### Mermas

Mostrar:

- producto;
- cantidad;
- unidad;
- causa;
- observación;
- coste si existe fuente.

### Reglas

- No inventar coste.
- Merma sin producto/cantidad/causa = corrección.
- Si se oculta merma o se registra mal repetidamente, puede generar FIO.
- Cocina no tiene cierre de caja.

---

## 18. VALIDACIÓN SALA

### Debe revisar

- datos turno;
- servicio;
- incidencias;
- gestiones;
- ajustes;
- checklist;
- tareas;
- Caja Sala si vinculada;
- FIO si aplica.

### Ajustes

Mostrar:

- tipo;
- importe;
- motivo;
- comunicado responsable;
- comentario.

### Reglas

- Ajuste sin motivo = corrección.
- Ajuste económico grave sin comunicación = posible FIO.
- Ajustes deben coincidir con lógica de caja si aplica.
- Sala no tiene mermas.

### Caja Sala

Puede mostrarse resumen en pop-up follow-up, pero validación completa está en submódulo Cierres de caja.

---

## 19. VALIDACIÓN RECEPCIÓN HOTEL — VISIÓN GENERAL

Recepción Hotel requiere validación específica.

No basta con revisar el turno base.

Debe revisarse:

- turno mañana/tarde/noche;
- horas;
- gestiones;
- incidencias;
- checklist;
- KPI empleado;
- ventas SYNCROLAB;
- leads Bitrix24;
- clientes insatisfechos;
- caja recepción;
- conciliación;
- FIO específico.

Recepción Hotel conecta cliente + PMS + ingresos + caja.  
Por tanto, su validación debe ser más estricta que un follow-up simple.

---

## 20. VALIDACIÓN RECEPCIÓN — KPI EMPLEADO

### Debe mostrar

- check-ins realizados;
- check-outs realizados;
- reservas gestionadas;
- reservas pendientes;
- explicación de reservas pendientes;
- desayunos ofertados;
- desayunos vendidos.

### Reglas

- KPI incompleto = corrección.
- Reservas pendientes sin explicación = corrección.
- Números negativos = error.
- Datos deben alimentar dashboard.

---

## 21. VALIDACIÓN RECEPCIÓN — VENTAS SYNCROLAB

### Debe mostrar por venta

- tipo de servicio;
- importe;
- Nº reserva MEWS;
- comentario.

### Reglas críticas

```text
Venta SYNCROLAB sin Nº reserva MEWS = error grave.
```

### Validación

- Si falta Nº reserva MEWS, enviar a corrección o marcar posible FIO.
- Si venta afecta caja o room charge, debe poder conciliarse.
- No aceptar ventas sin trazabilidad.
- MEWS debe escribirse correctamente, nunca MUSE.

### Posible FIO

Venta sin Nº reserva MEWS puede generar FIO si:

- es error reiterado;
- impide conciliación;
- afecta ingresos;
- no fue comunicado.

---

## 22. VALIDACIÓN RECEPCIÓN — BITRIX24 / LEADS

### Debe mostrar

- si se revisaron comunicaciones;
- si quedó lead pendiente;
- descripción del lead;
- si está registrado en Bitrix24;
- responsable;
- fecha/hora seguimiento.

### Regla confirmada

```text
Lead marcado como pendiente SIN descripción = error → corrección obligatoria.
```

### Reglas

- No validar si lead pendiente está sin descripción.
- Si lead no está registrado en Bitrix24, debe quedar marcado.
- Si falta responsable de seguimiento, corrección.
- Si el error es reiterado o afecta venta/cliente, puede generar FIO.

---

## 23. VALIDACIÓN RECEPCIÓN — CLIENTES INSATISFECHOS

### Debe mostrar

- si hubo clientes insatisfechos;
- número de clientes;
- informado responsable Sí/No;
- comentario si existe;
- incidencia relacionada si aplica.

### Regla confirmada

```text
Si hay cliente insatisfecho y NO informado al responsable → FIO automático.
```

### Reglas

- Si cantidad > 0, informado responsable es obligatorio.
- Si no se informó responsable, el sistema debe crear o exigir FIO.
- Cliente insatisfecho debe vincularse a incidencia si hubo queja formal.
- Debe alimentar dashboard.

---

## 24. VALIDACIÓN RECEPCIÓN — CAJA RECEPCIÓN

### Debe mostrar

- cash MEWS;
- cash real;
- tarjeta MEWS;
- TPV físico;
- Stripe MEWS;
- Stripe real;
- diferencias;
- fondo recibido;
- fondo traspasado;
- retiro caja fuerte;
- fondo inicial siguiente si turno noche;
- explicación diferencia;
- acción tomada;
- room charge recibido;
- desayunos confirmados MEWS;
- pensiones confirmadas MEWS;
- SYNCROLAB room charged.

### Reglas

- Diferencia > 0.01 requiere explicación.
- Sin explicación no se puede validar caja.
- Caja Recepción debe alimentar dashboard.
- Caja Recepción debe permitir conciliación futura con Sala y SYNCROLAB.
- Validar caja = cierre definitivo.

---

## 25. VALIDACIÓN RECEPCIÓN — CONCILIACIÓN

Recepción confirma datos que otros departamentos declaran.

### Sala declara → Recepción confirma

- Room charge.
- Desayunos.
- Pensiones.

### SYNCROLAB declara → Recepción confirma / compara

- servicios vendidos;
- cargos a habitación;
- talonario futuro;
- Nº reserva MEWS.

### MEWS

Recepción compara:

- cash;
- tarjeta;
- Stripe;
- reservas;
- cargos;
- pensiones.

### Regla

No implementar conciliación automática si no está pedida, pero sí guardar datos necesarios para dashboard futuro.

---

## 26. VALIDACIÓN RECEPCIÓN — CORRECCIÓN OBLIGATORIA

Enviar a corrección si:

- lead pendiente sin descripción;
- reserva pendiente sin explicación;
- venta SYNCROLAB sin Nº reserva MEWS;
- cliente insatisfecho sin cantidad;
- cliente insatisfecho sin informar responsable;
- KPI incompleto;
- caja con diferencia sin explicación;
- incidencia incompleta;
- gestión incompleta;
- turno sin horas válidas;
- datos MEWS ausentes donde son obligatorios.

---

## 27. VALIDACIÓN RECEPCIÓN — FIO AUTOMÁTICO / POSIBLE

### FIO automático

Debe crearse si:

```text
Cliente insatisfecho = Sí
y
Informado responsable = No
```

### Posible FIO

Puede crearse si:

- venta SYNCROLAB sin Nº reserva MEWS;
- lead no registrado en Bitrix24;
- error check-in/check-out por procedimiento;
- error de cobro;
- caja con diferencia grave y explicación insuficiente;
- comunicación interna omitida;
- incidencia grave no registrada;
- KPI incompleto reiterado.

### Reglas

- FIO solo lo crea jefe/validador/admin.
- Usuario no crea FIO.
- FIO debe tener concepto, severidad, impacto bonus y comentario.
- FIO crítico no gestionado genera alerta dashboard.

---

## 28. FIO — DEFINICIÓN GENERAL

FIO significa:

```text
Fallo Individual Operativo
```

Es un error individual detectado durante validación.

Lo crea:

- jefe de departamento;
- validador;
- admin.

Nunca lo crea usuario lineal.

---

## 29. FIO — UI EN POP-UP

Debe estar siempre visible.

### Pregunta

```text
¿Hay FIO?
```

Opciones:

- Sí.
- No.

### Si No

Bloquear:

- concepto;
- severidad;
- impacto bonus;
- comentario.

### Si Sí

Obligatorios:

- concepto;
- severidad;
- impacto bonus;
- comentario.

No se puede validar con FIO Sí incompleto.

---

## 30. TIPOS / CONCEPTOS FIO

Catálogo inicial:

1. Operativo.
2. Disciplina.
3. Comunicación.
4. Procedimiento.
5. Calidad.
6. Caja / cobro.
7. APPCC / higiene.
8. Atención al cliente.
9. Registro incompleto.
10. Otro.

### Recepción puede usar especialmente

- Comunicación.
- Procedimiento.
- Atención al cliente.
- Caja / cobro.
- Registro incompleto.
- Operativo.

### Sala puede usar especialmente

- Caja / cobro.
- Atención al cliente.
- Procedimiento.
- Comunicación.

### Cocina puede usar especialmente

- APPCC / higiene.
- Calidad.
- Procedimiento.
- Operativo.

---

## 31. SEVERIDAD FIO

Valores:

- Baja.
- Media.
- Alta.
- Crítica.

### Lógica

```text
Crítica = mayor impacto negativo.
Baja = menor impacto negativo.
```

### Dashboard

Debe mostrar:

```text
Baja: X
Media: X
Alta: X
Crítica: X
```

Gráfico opcional permitido.

---

## 32. IMPACTO EN BONUS

Opciones:

- Sin impacto.
- Parcial.
- Total.
- Requiere revisión.

### Reglas

- No usar texto libre.
- Debe guardarse para análisis mensual.
- Puede usarse para bonus mensual.
- Fórmula monetaria exacta: `[NO DATA]`.

---

## 33. ESTADO FIO

Estados recomendados:

- No gestionado.
- Gestionado.

### Regla

- FIO crítico no gestionado genera alerta dashboard.
- Cuando se gestiona, desaparece alerta.
- No desaparece del histórico.

---

## 34. FLUJO FOLLOW-UP COMPLETO

1. Validador abre Validación.
2. Filtra registros.
3. Abre turno.
4. Revisa datos base.
5. Revisa checklist.
6. Revisa gestiones.
7. Revisa incidencias.
8. Revisa tareas.
9. Revisa bloque específico departamento:
   - Cocina: mermas.
   - Sala: ajustes/caja.
   - Recepción: KPI/caja/conciliación.
10. Decide FIO.
11. Valida o envía a corrección.
12. Dashboard se recalcula.

---

## 35. ACCIÓN VALIDAR

### Resultado

- estado → Validado;
- guardar validador;
- guardar fecha/hora;
- guardar FIO si existe;
- actualizar dashboard.

### No permitir validar si:

- faltan campos obligatorios;
- FIO Sí incompleto;
- caja con diferencia sin explicación;
- Recepción tiene lead pendiente sin descripción;
- Recepción tiene venta SYNCROLAB sin Nº MEWS sin corrección;
- cliente insatisfecho no informado sin FIO;
- datos críticos incompletos.

---

## 36. ACCIÓN ENVIAR A CORRECCIÓN

### Uso

Cuando existe error corregible.

Debe pedir:

- motivo;
- comentario claro;
- campos afectados si aplica.

### Resultado

- estado → En corrección;
- usuario puede corregir;
- vuelve a Validación.

### Ejemplos

- horas incorrectas;
- incidencia incompleta;
- gestión mal clasificada;
- ajuste sin motivo;
- caja sin explicación;
- lead sin descripción;
- venta sin Nº MEWS;
- KPI incompleto.

---

## 37. ACCIÓN ELIMINAR

Solo Admin.

### Soft delete

- uso normal;
- oculta en UI;
- no cuenta dashboard;
- mantiene trazabilidad.

### Hard delete

- definitivo;
- popup especial;
- solo Admin.

Mensaje:

```text
¿Eliminar definitivamente este registro?
Esta acción no se puede deshacer.
```

### Reglas

- afecta dashboard;
- recalcula KPIs;
- evita datos huérfanos;
- debe tener audit log si existe.

---

## 38. BORRADO EN CASCADA

Eliminar turno debe eliminar o excluir:

- incidencias;
- gestiones;
- FIO;
- checklist;
- tareas creadas desde turno si aplica;
- ajustes;
- KPI Recepción;
- ventas SYNCROLAB;
- leads;
- clientes insatisfechos;
- caja vinculada si la regla lo permite `[NO DATA]`.

Regla:

```text
No dejar datos huérfanos.
```

---

## 39. ESTADOS

### Turnos

- Pendiente de revisión.
- En corrección.
- Validado.
- Cerrado.

### Cajas

- Pendiente validación.
- En corrección.
- Validado.
- Cerrado si aplica.

### FIO

- No gestionado.
- Gestionado.

### Incidencias

- Abierta.
- En proceso.
- Cerrada.

### Gestiones

- Abierta.
- En proceso.
- Cerrada.

---

## 40. CIERRES DE CAJA EN VALIDACIÓN

Submódulo:

```text
Cierres de caja
```

Debe validar:

- Caja Sala.
- Caja Recepción Hotel.
- Caja Recepción SYNCROLAB cuando exista.

No debe estar como pestaña superior Admin independiente.

---

## 41. FILTROS CIERRES DE CAJA

Obligatorios:

- fecha desde;
- fecha hasta;
- departamento;
- responsable;
- estado;
- servicio / turno;
- solo pendientes;
- solo con diferencia.

### Departamentos con caja

- Sala.
- Recepción Hotel.
- Recepción SYNCROLAB.

Cocina no debe aparecer como departamento de caja.

---

## 42. TABLA CIERRES DE CAJA

Columnas:

- Fecha.
- Departamento.
- Responsable.
- Servicio / Turno.
- Neto.
- Bruto.
- Diferencia.
- Estado.
- Acción.

Acciones:

- Revisar.
- Validar.
- Enviar a corrección.
- Eliminar solo Admin.

---

## 43. VALIDACIÓN CAJA SALA

Debe mostrar:

- efectivo real;
- efectivo POSMEWS;
- fondo inicial;
- fondo final;
- retiro caja fuerte;
- tarjeta POSMEWS;
- tarjeta TPV;
- propinas;
- Stripe POSMEWS;
- Stripe real;
- diferencia efectivo;
- diferencia tarjeta;
- diferencia Stripe;
- diferencia operativa Sala;
- room charge;
- cargo Alexander;
- pensiones;
- total neto;
- total bruto;
- comentario.

### Reglas

- Diferencia sin comentario = no validar.
- Validar cierre = cierre definitivo.
- Usuario lineal no valida.
- Cualquier empleado Sala puede crear.
- Jefe/F&B/Admin validan según permisos.

---

## 44. VALIDACIÓN CAJA RECEPCIÓN HOTEL

Debe mostrar:

- cash MEWS;
- cash real;
- tarjeta MEWS;
- TPV físico;
- Stripe MEWS;
- Stripe real;
- diferencias;
- fondo recibido;
- fondo traspasado;
- retiro caja fuerte;
- fondo inicial siguiente si turno noche;
- explicación diferencia;
- acción tomada;
- room charge recibido;
- desayunos confirmados MEWS;
- pensiones confirmadas MEWS;
- SYNCROLAB room charged.

### Reglas

- Diferencia > 0.01 requiere explicación.
- Sin explicación no se puede validar.
- Validar caja = cierre definitivo.
- Alimenta dashboard.
- Prepara conciliación futura con Sala y SYNCROLAB.
- MEWS siempre escrito correctamente.

---

## 45. DASHBOARD — IMPACTO VALIDACIÓN

Validación impacta:

- turnos pendientes;
- turnos validados;
- turnos en corrección;
- FIO;
- alertas;
- incidencias;
- gestiones;
- tareas;
- caja;
- diferencias;
- KPI Recepción;
- bonus;
- SLA.

### Reglas

- Validar recalcula dashboard.
- Corrección recalcula dashboard.
- Eliminar recalcula dashboard.
- FIO crítico no gestionado genera alerta.
- FIO gestionado elimina alerta.

---

## 46. ALERTAS GENERADAS

Alertas activas:

- turno no validado;
- incidencia abierta;
- incidencia >24h;
- incidencia >48h;
- FIO crítico no gestionado;
- caja con diferencia pendiente;
- caja pendiente validación;
- cliente insatisfecho no informado hasta FIO gestionado/corregido.

No genera alerta:

- checklist incompleto, salvo decisión futura `[NO DATA]`.

---

## 47. UX/UI VALIDACIÓN

### Principios

- claridad;
- rapidez;
- jerarquía visual;
- bloques separados;
- badges para conteos;
- modales bien estructurados;
- evitar saturación.

### Prohibido mostrar

- JSON.
- Arrays.
- IDs técnicos.
- null.
- undefined.
- NaN.
- logs.
- errores internos.
- botones duplicados.
- acciones contradictorias.

### Mensajes recomendados

Validado:

```text
Registro validado correctamente.
```

Corrección:

```text
Registro enviado a corrección.
```

FIO incompleto:

```text
Completa todos los campos FIO antes de validar.
```

Diferencia caja:

```text
Explica la diferencia antes de validar el cierre.
```

Lead sin descripción:

```text
Completa la descripción del lead pendiente.
```

Venta sin MEWS:

```text
La venta SYNCROLAB necesita número de reserva MEWS.
```

Cliente no informado:

```text
Cliente insatisfecho no informado al responsable: requiere FIO.
```

---

## 48. ERRORES ACTUALES A CORREGIR

- Falta filtro Departamento.
- Servicio y turno mezclados.
- Falta columna Gestiones.
- Falta columna Tareas.
- Acción Rechazar debe eliminarse.
- FIO debe estar siempre visible.
- FIO No debe bloquear campos.
- FIO Sí debe obligar campos.
- Validación Caja Recepción Hotel incompleta.
- Recepción Hotel no validada con reglas propias.
- Ventas SYNCROLAB sin Nº MEWS no controladas.
- Lead Bitrix sin descripción no bloqueado.
- Cliente insatisfecho no informado no genera FIO.
- Admin muestra pestañas operativas.
- Eliminar no recalcula dashboard.
- Caja Recepción no integrada al mismo nivel que Caja Sala.

---

## 49. PROMPT TÉCNICO PARA CODEX / CLAUDE CODE

```text
Contexto:
Estamos trabajando en SynchroShift / SYNCROSFERA. Validación es el módulo central de control operativo. Debe validar turnos, checklist, incidencias, gestiones, tareas, mermas Cocina, ajustes Sala, KPI Recepción, ventas SYNCROLAB, leads Bitrix24, clientes insatisfechos y cierres de caja. También debe crear FIO solo por jefe de departamento, validador o admin.

Objetivo:
Completar Validación FULL PRO sin romper módulos existentes.

Requisitos funcionales:
1. Menú Admin:
- Mostrar: Dashboard, Validación, Incidencias, Gestiones pendientes, Tareas, Maestro, Export.
- Ocultar Mi turno, Cierre caja operativo y Caja Recepción operativo.

2. Follow-up:
- Tabla con columnas: Fecha, Empleado, Departamento, Servicio/Turno, Horas, Ajustes, Incidencias, Gestiones, Tareas, FIO, Estado, Acción.
- Filtros: fecha desde/hasta, estado, departamento, servicio/turno, empleado.

3. Servicio/Turno:
- Cocina/Sala: servicios.
- Recepción: mañana/tarde/noche.
- UI: Servicio / Turno.

4. Pop-up:
- Cabecera: empleado, departamento, fecha, servicio/turno, estado.
- Bloques comunes: datos turno, checklist, gestiones, incidencias, tareas, FIO.
- Cocina: mermas.
- Sala: ajustes y caja si aplica.
- Recepción: KPI, ventas SYNCROLAB, leads Bitrix24, clientes insatisfechos, caja y conciliación.

5. Recepción Hotel:
- Validar KPI.
- Lead pendiente sin descripción = corrección obligatoria.
- Cliente insatisfecho no informado = FIO automático.
- Venta SYNCROLAB sin Nº reserva MEWS = error grave y posible FIO.
- Caja Recepción con diferencia >0.01 requiere explicación.

6. FIO:
- Siempre visible.
- Si No: bloquear campos.
- Si Sí: concepto, severidad, impacto bonus y comentario obligatorios.
- Solo jefe/validador/admin puede crearlo.
- FIO crítico no gestionado genera alerta dashboard.

7. Acciones:
- Validar.
- Enviar a corrección.
- Eliminar solo Admin.
- Eliminar Rechazar.

8. Cierres de caja:
- Submódulo dentro de Validación.
- Incluir Caja Sala y Caja Recepción Hotel.
- Filtros: fecha, departamento, responsable, estado, servicio/turno, pendientes, con diferencia.
- Validar caja = cierre definitivo.

9. Eliminación:
- Soft delete normal.
- Hard delete con popup especial solo Admin.
- Recalcular dashboard.
- Evitar datos huérfanos.

Reglas de datos:
- No mostrar arrays.
- No null/undefined/NaN.
- No IDs técnicos.
- No cash_closings.
- No mezclar gestiones/incidencias.
- MEWS siempre correcto.
- Dashboard recalcula tras cambios.

Reglas de permisos:
- Usuario lineal no accede.
- Validador ve su departamento.
- Admin ve todo.
- Solo Admin elimina.

Criterios de aceptación:
- Filtros funcionan.
- Departamento filtra.
- Servicio/Turno correcto.
- Gestiones y tareas en badges.
- FIO condicional funciona.
- Rechazar no existe.
- Cocina muestra mermas.
- Sala muestra ajustes.
- Recepción muestra KPI y caja.
- Reglas Recepción funcionan.
- Caja Sala se valida.
- Caja Recepción se valida.
- Dashboard se actualiza.
- Permisos respetados.

Pruebas obligatorias:
1. Login Admin.
2. Abrir Validación.
3. Confirmar menú Admin correcto.
4. Filtrar por Cocina.
5. Abrir turno Cocina y ver mermas.
6. Filtrar por Sala.
7. Abrir turno Sala y ver ajustes.
8. Filtrar por Recepción Hotel.
9. Abrir turno Recepción y ver KPI.
10. Probar lead pendiente sin descripción.
11. Probar venta SYNCROLAB sin Nº MEWS.
12. Probar cliente insatisfecho no informado.
13. Confirmar FIO automático/requerido.
14. Probar FIO No.
15. Probar FIO Sí incompleto.
16. Validar turno.
17. Enviar a corrección.
18. Validar Caja Sala.
19. Validar Caja Recepción.
20. Eliminar soft.
21. Eliminar hard.
22. Confirmar dashboard actualizado.
23. Confirmar sin errores técnicos.

No romper:
- Mi turno.
- Cocina.
- Sala.
- Recepción.
- Dashboard.
- Caja Sala.
- Caja Recepción.
- Tareas.
- Incidencias.
- Gestiones.

Salida esperada:
- Código corregido.
- Explicación breve.
- Lista archivos modificados.
- Checklist QA.
```

---

## 50. QA CHECKLIST VALIDACIÓN

### Navegación Admin

- [ ] Mi turno no aparece.
- [ ] Cierre Caja operativo no aparece.
- [ ] Caja Recepción operativo no aparece.
- [ ] Orden correcto.

### Filtros

- [ ] Fecha desde.
- [ ] Fecha hasta.
- [ ] Estado.
- [ ] Departamento.
- [ ] Servicio/Turno.
- [ ] Empleado según departamento.

### Tabla

- [ ] Empleado.
- [ ] Departamento.
- [ ] Servicio/Turno.
- [ ] Horas.
- [ ] Ajustes.
- [ ] Incidencias.
- [ ] Gestiones.
- [ ] Tareas.
- [ ] FIO.
- [ ] Estado.

### Pop-up común

- [ ] Cabecera completa.
- [ ] Datos base.
- [ ] Checklist.
- [ ] Gestiones.
- [ ] Incidencias.
- [ ] Tareas.
- [ ] FIO.

### Cocina

- [ ] Mermas visibles.
- [ ] Mermas no aparecen en Sala/Recepción.
- [ ] Sin coste inventado.

### Sala

- [ ] Ajustes visibles.
- [ ] Caja Sala resumen visible si aplica.
- [ ] Ajuste sin motivo genera corrección.

### Recepción Hotel

- [ ] KPI visible.
- [ ] Ventas SYNCROLAB visibles.
- [ ] Leads Bitrix visibles.
- [ ] Clientes insatisfechos visibles.
- [ ] Caja Recepción visible.
- [ ] Lead sin descripción bloquea/corrección.
- [ ] Venta sin Nº MEWS marca error.
- [ ] Cliente insatisfecho no informado exige FIO.
- [ ] Caja diferencia sin explicación bloquea validación.

### FIO

- [ ] Siempre visible.
- [ ] No bloquea campos.
- [ ] Sí desbloquea campos.
- [ ] Sí exige concepto.
- [ ] Sí exige severidad.
- [ ] Sí exige impacto bonus.
- [ ] Sí exige comentario.
- [ ] Crítico no gestionado genera alerta.
- [ ] Gestionado quita alerta.

### Acciones

- [ ] Validar cambia estado.
- [ ] Corrección pide motivo.
- [ ] Rechazar no existe.
- [ ] Eliminar solo Admin.
- [ ] Hard delete confirma.

### Cierres

- [ ] Caja Sala aparece.
- [ ] Caja Recepción aparece.
- [ ] Filtros funcionan.
- [ ] Validar caja funciona.
- [ ] Diferencia sin comentario bloquea.

### Dashboard

- [ ] Validar actualiza.
- [ ] Corrección actualiza.
- [ ] Eliminar recalcula.
- [ ] FIO aparece.
- [ ] Alertas correctas.

### UX

- [ ] Sin arrays.
- [ ] Sin IDs.
- [ ] Sin null.
- [ ] Sin undefined.
- [ ] Sin NaN.
- [ ] Responsive usable.

---

## 51. CRITERIOS DE ACEPTACIÓN

Validación está correcta si:

- Admin ve todo.
- Validador ve su departamento.
- Usuario lineal no accede.
- Filtros completos funcionan.
- Servicio/Turno está unificado.
- Tabla muestra gestiones y tareas.
- Pop-up muestra bloques específicos por departamento.
- Recepción Hotel tiene validación específica real.
- FIO funciona correctamente.
- Rechazar no existe.
- Corrección funciona.
- Validar funciona.
- Cajas se validan.
- Eliminación recalcula dashboard.
- No hay datos técnicos visibles.

---

## 52. RIESGOS A EVITAR

- KPI falsos.
- FIO creado por usuario lineal.
- Recepción validada superficialmente.
- Lead sin descripción validado.
- Cliente insatisfecho no informado sin FIO.
- Venta SYNCROLAB sin MEWS aceptada.
- Caja Recepción sin explicación validada.
- Rechazar generando ambigüedad.
- Eliminación sin recalcular dashboard.
- Datos huérfanos.
- Caja Sala mezclada con Recepción.
- Servicio mezclado con Turno.
- Validador viendo departamentos no permitidos.
- Usuario accediendo a Validación.
- Mostrar errores técnicos.

---

## 53. PENDIENTES / [NO DATA]

- Fórmula exacta penalización bonus por FIO: `[NO DATA]`.
- Si jefe puede cerrar definitivo o solo validar: `[NO DATA]`.
- Política final hard delete en producción: `[NO DATA]`.
- Validación Caja Recepción SYNCROLAB: `[NO DATA]`.
- Tabla definitiva FIO si no existe separada: `[NO DATA]`.
- Reglas reapertura turno validado: `[NO DATA]`.
- Integración automática MEWS: `[NO DATA]`.
- Integración automática Bitrix24: `[NO DATA]`.
- Integración automática SYNCROLAB/talonario: `[NO DATA]`.

---

## 54. RESULTADO ESPERADO

Validación debe convertirse en el módulo de control central de SYNCROSFERA.

Debe garantizar:

- datos fiables;
- turnos revisados;
- incidencias controladas;
- gestiones visibles;
- tareas trazables;
- FIO correcto;
- Recepción Hotel validada con profundidad;
- Caja Sala validada;
- Caja Recepción validada;
- dashboard confiable;
- permisos respetados;
- auditoría y trazabilidad.
