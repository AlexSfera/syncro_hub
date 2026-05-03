# 04_MODULE_RECEPCION_HOTEL_FULL.md — SYNCROSFERA / SynchroShift (FULL PRO REAL)

---

## 1. OBJETIVO DEL MÓDULO RECEPCIÓN HOTEL

El módulo **Recepción Hotel** controla la operación diaria del equipo de recepción del hotel.

Es uno de los módulos más críticos porque conecta:

- atención al huésped;
- turnos operativos;
- reservas;
- check-ins;
- check-outs;
- MEWS;
- Bitrix24;
- ventas SYNCROLAB;
- clientes insatisfechos;
- caja recepción;
- conciliación con Sala;
- conciliación con SYNCROLAB;
- dashboard;
- validación;
- FIO.

Recepción Hotel no debe tratarse como un simple follow-up.  
Debe tratarse como un módulo operativo-financiero con impacto directo en cliente, ingresos y control interno.

---

## 2. ALCANCE DEL MÓDULO

### Incluido

- Login por PIN.
- Pestaña Mi turno.
- Pestaña Gestiones pendientes.
- Pestaña Tareas.
- Pestaña Caja Recepción.
- Pestaña Info a la derecha.
- Registro de turno mañana/tarde/noche.
- Registro de gestiones pendientes.
- Registro de incidencias operativas.
- Personas involucradas.
- Checklist Recepción Hotel.
- KPI directo de empleado.
- Ventas SYNCROLAB.
- Leads Bitrix24.
- Clientes insatisfechos.
- Caja Recepción.
- Conciliación futura con Sala / MEWS / SYNCROLAB.
- Logout automático.
- Validación con reglas específicas.
- Dashboard Recepción Hotel.

### No incluido todavía

- Integración automática real con MEWS.
- Integración automática real con Bitrix24.
- Integración automática real con SYNCROLAB.
- Integración automática con Nubimed.
- Auditoría nocturna completa.
- Conciliación automática final.

Si falta información técnica o API real:

```text
[NO DATA]
```

---

## 3. NAVEGACIÓN SUPERIOR

### Estructura correcta

```text
[ Mi turno ] [ Gestiones pendientes ] [ Tareas ] [ Caja Recepción ] -------------------- [ Info ] [ Usuario ] [ Recepción Hotel ] [ Salir ]
```

### Reglas

- `Mi turno` siempre a la izquierda.
- `Gestiones pendientes` debe existir como pestaña.
- `Tareas` debe estar visible.
- `Caja Recepción` debe estar activa.
- `Info` debe estar a la derecha.
- Usuario, departamento y salir a la derecha.
- No mostrar `Cierre de caja` de Sala.
- No mostrar `Mermas`.
- No duplicar botones.
- En Recepción usar siempre **turno**, no “servicio”.

---

## 4. ACCESO Y SESIÓN

### Login

- Usuario entra mediante PIN.
- Sistema identifica:
  - usuario;
  - departamento;
  - rol;
  - permisos.

### Departamento

Debe quedar asociado a:

```text
Recepción Hotel
```

### Logout obligatorio

Después de guardar turno completo:

```text
Guardar y cerrar turno → logout automático obligatorio
```

Motivos:

- evitar doble registro;
- cerrar sesión después de turno;
- evitar manipulación posterior;
- proteger datos de recepción/caja.

---

## 5. PESTAÑA MI TURNO

La pestaña **Mi turno** abre el follow-up de Recepción Hotel.

Debe contener:

1. Datos base del turno.
2. Gestiones pendientes.
3. Incidencia operativa.
4. Guardar turno.
5. Gestiones pendientes activas.
6. Mis últimos turnos.

Después de pulsar Guardar:

7. Checklist.
8. KPI directo del empleado.
9. Caja Recepción.
10. Guardar y cerrar.
11. Logout automático.

---

## 6. DATOS BASE DEL TURNO

### Campos

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| Fecha | Automática | Sí | No editable |
| Turno | Selector | Sí | Mañana / Tarde / Noche |
| Horas trabajadas | Numérico | Sí | Punto o coma |
| Observaciones | Texto | No | Comentario libre |

### No usar

```text
Servicio
```

En Recepción Hotel se usa:

```text
Turno
```

---

## 7. TURNOS RECEPCIÓN HOTEL

### Valores

- Mañana.
- Tarde.
- Noche.

### Reglas

- Debe seleccionarse uno.
- Debe alimentar dashboard.
- Debe alimentar caja.
- Debe permitir filtros por turno.
- Turno Noche puede tener campos específicos de caja, como fondo inicial siguiente.

---

## 8. HORAS TRABAJADAS

### Reglas

- Aceptar:
  - `8`
  - `8.5`
  - `8,5`
- Normalizar internamente.
- No permitir:
  - vacío;
  - negativo;
  - texto;
  - valores absurdos.

Mensaje:

```text
Introduce horas trabajadas válidas.
```

---

## 9. OBSERVACIONES

Campo texto opcional.

Debe permitir:

- nota general del turno;
- contexto operativo;
- información no estructurada.

No debe usarse para ocultar:

- incidencias;
- gestiones pendientes;
- leads;
- ventas;
- diferencias caja.

---

## 10. GESTIONES PENDIENTES

### Pregunta

```text
¿Queda alguna gestión pendiente?
```

Opciones:

- Sí.
- No.

### Si No

- No abrir campos.
- Guardar que no hubo gestión pendiente.

### Si Sí

Campos obligatorios:

- Tipo de gestión.
- Descripción.

---

## 11. TIPOS DE GESTIÓN RECEPCIÓN HOTEL

Catálogo recomendado:

1. Seguimiento para siguiente turno.
2. Reserva pendiente de confirmar.
3. Reserva pendiente de revisar.
4. Comunicación pendiente con huésped.
5. Comunicación pendiente con Sala.
6. Comunicación pendiente con Housekeeping.
7. Comunicación pendiente con Mantenimiento.
8. Comunicación pendiente con SYNCROLAB.
9. Información pendiente en MEWS.
10. Cargo pendiente de revisar.
11. Room charge pendiente.
12. Pensión / desayuno pendiente de confirmar.
13. Documentación pendiente.
14. Lead pendiente en Bitrix24.
15. Pulsera / acceso pendiente.
16. Tarea operativa pendiente.
17. Otro.

### Reglas

- Si se marca Sí, tipo y descripción son obligatorios.
- Si tipo = Otro, descripción debe explicar.
- Debe aparecer en:
  - bloque de gestiones activas;
  - pestaña Gestiones pendientes;
  - dashboard;
  - validación.
- No usar gestión para ocultar incidencia.
- Si es un lead Bitrix24, debe registrarse también en KPI/lead si aplica.

---

## 12. INCIDENCIAS OPERATIVAS

### Pregunta

```text
¿Hubo alguna incidencia durante el turno?
```

Opciones:

- Sí.
- No.

### Si No

- No abrir campos.
- Guardar que no hubo incidencia.

### Si Sí

Campos:

- Qué ocurrió.
- Acción inmediata tomada.
- Tipo de incidencia.
- Informado al responsable.
- Personas involucradas.

---

## 13. TIPOS DE INCIDENCIA RECEPCIÓN HOTEL

Catálogo recomendado:

1. Petición de cliente.
2. Queja / cliente insatisfecho.
3. Error check-in.
4. Error check-out.
5. Error de reserva.
6. Overbooking.
7. Error en MEWS.
8. Error de cobro / caja.
9. Room charge incorrecto.
10. Pensiones / desayuno incorrectos.
11. Problema con habitación.
12. Problema con Housekeeping.
13. Problema con Sala / Restaurante.
14. Problema con SYNCROLAB.
15. Documentación pendiente.
16. Pulsera / acceso.
17. Comunicación interna incorrecta.
18. Incumplimiento de procedimiento.
19. Accidente o seguridad.
20. Otro.

### Reglas

- Si se marca Sí, “Qué ocurrió” y “Tipo” son obligatorios.
- Si afecta cliente, debe quedar claro.
- Si hay cliente insatisfecho, debe indicar si se informó al responsable.
- Incidencia abierta aparece en dashboard.
- Incidencia abierta debe permanecer hasta cierre.
- Tiempo medio se calcula desde creación hasta cierre.
- Si no se cierra, SLA se calcula contra fecha actual.

---

## 14. PERSONAS INVOLUCRADAS

### Reglas

- Multi-selector con buscador.
- Buscar por:
  - nombre;
  - puesto;
  - departamento.
- Permitir varias personas.
- Guardar correctamente.
- Mostrar nombre legible.
- No mostrar IDs técnicos.

---

## 15. CHECKLIST RECEPCIÓN HOTEL

El checklist aparece antes del KPI directo.

### Reglas

- Se guarda vinculado al turno.
- Guarda:
  - usuario;
  - fecha/hora;
  - respuestas;
  - porcentaje completado.
- No bloquear al 100% salvo decisión futura `[NO DATA]`.
- Debe alimentar dashboard como porcentaje.

### Checklist recomendado

#### Inicio / cierre de turno

- Fichaje realizado desde móvil.
- Handover del turno anterior revisado.
- Incidencias pendientes revisadas.
- Gestiones pendientes revisadas.
- Tareas abiertas revisadas.

#### Operación MEWS

- Llegadas del día revisadas en MEWS.
- Salidas del día revisadas en MEWS.
- Reservas modificadas revisadas.
- Cargos pendientes revisados antes de check-out.
- Pensiones y extras revisados.
- Room charge revisado si aplica.

#### Clientes / comunicación

- WhatsApp revisado.
- Email revisado.
- Llamadas pendientes revisadas.
- Clientes con incidencias revisados.
- Clientes insatisfechos registrados si existieron.

#### Housekeeping

- Estado de habitaciones revisado.
- Habitaciones prioritarias comunicadas.
- Cambios relevantes comunicados.

#### Caja / pagos

- Cash MEWS revisado.
- Tarjeta MEWS revisada.
- Stripe MEWS revisado.
- Diferencias detectadas registradas.
- Caja fuerte / fondo revisado si aplica.

#### Bitrix24

- Leads revisados.
- Seguimientos pendientes revisados.
- Comunicaciones pendientes anotadas.

#### SYNCROLAB

- Ventas SYNCROLAB revisadas.
- Nº reserva MEWS vinculado si aplica.
- Cargos SYNCROLAB pendientes comunicados.

#### Cierre / handover

- Handover preparado para siguiente turno.
- Gestiones pendientes registradas.
- Incidencias registradas.
- Tareas creadas si procede.
- Fichaje de salida realizado desde móvil.

### KPI checklist

```text
% checklist = items completados / total items * 100
```

Debe poder analizarse por:

- empleado;
- turno;
- departamento;
- periodo.

---

## 16. KPI DIRECTO DEL EMPLEADO

Después del checklist debe aparecer el modal:

```text
Cierre de turno — Preguntas de control
```

Este bloque es obligatorio para medir rendimiento operativo/comercial de Recepción.

---

## 17. KPI — OPERACIÓN

### Campos

- Check-ins realizados.
- Check-outs realizados.
- Reservas gestionadas.

### Reglas

- Numérico.
- Mínimo 0.
- No permitir negativos.
- Debe alimentar dashboard.

---

## 18. KPI — RESERVAS PENDIENTES

### Pregunta

```text
¿Quedan reservas pendientes para el siguiente turno?
```

Opciones:

- Sí.
- No.

### Si Sí

Campo obligatorio:

- Explicación reservas pendientes.

### Reglas

- Sin explicación no permite continuar.
- Debe aparecer como gestión/alerta si aplica.
- Debe ser visible en validación.

---

## 19. KPI — DESAYUNOS / UPSELL

### Pregunta

```text
¿Ofertaste desayunos a clientes sin desayuno incluido?
```

Opciones:

- Sí.
- No.
- No aplica.

### Si Sí

Campos:

- Nº clientes a los que se ofreció.
- Nº desayunos vendidos.

### Reglas

- Numérico.
- No negativo.
- Desayunos vendidos alimentan dashboard.
- Puede cruzarse con Sala/MEWS en conciliación futura.

---

## 20. KPI — VENTAS SYNCROLAB

### Pregunta

```text
¿Has vendido servicios SYNCROLAB?
```

Opciones:

- Sí.
- No.

### Si Sí

Abrir bloque:

```text
Ventas SYNCROLAB — añade una línea por venta
```

### Campos por venta

| Campo | Tipo | Obligatorio |
|---|---|---:|
| Tipo de servicio | Dropdown | Sí |
| Importe | Numérico | Sí |
| Nº reserva MEWS | Texto | Sí |
| Comentario | Texto | No |

### Tipos de servicio SYNCROLAB

- Entrenamiento personal.
- Fisioterapia.
- Recuperación.
- Testing deportivo.
- Nutrición.
- Consulta médica.
- Otro SYNCROLAB.

### Reglas

- Permitir varias ventas.
- No guardar líneas vacías.
- Importe debe ser >= 0.
- Nº reserva MEWS obligatorio.
- Venta sin Nº reserva MEWS = error grave.
- Venta sin Nº reserva MEWS puede generar FIO en validación.
- Debe alimentar dashboard.
- Debe permitir conciliación futura con SYNCROLAB/talonario.
- MEWS debe escribirse correctamente, nunca MUSE.

---

## 21. KPI — BITRIX24 / COMUNICACIÓN

### Pregunta 1

```text
¿Revisaste WhatsApp / email / llamadas pendientes en Bitrix24?
```

Opciones:

- Sí.
- No.

### Pregunta 2

```text
¿Queda algún lead pendiente en Bitrix24?
```

Opciones:

- Sí.
- No.

### Si Sí

Campos:

- Descripción del lead.
- Registrado en Bitrix24: Sí/No.
- Responsable.
- Fecha/hora seguimiento.

### Reglas

- Lead pendiente sin descripción = error.
- Lead pendiente sin descripción genera corrección obligatoria.
- Debe alimentar dashboard.
- Debe quedar visible en validación.
- Si no está registrado en Bitrix24, debe quedar marcado.

---

## 22. KPI — CLIENTES INSATISFECHOS

### Pregunta

```text
¿Hubo clientes insatisfechos durante el turno?
```

Opciones:

- Sí.
- No.

### Si Sí

Campos:

- Número de clientes insatisfechos.
- Informado al responsable: Sí/No.
- Comentario si aplica.

### Reglas confirmadas

```text
Si hay cliente insatisfecho y NO informado al responsable → FIO automático.
```

### Reglas adicionales

- Cantidad debe ser numérica.
- Si cantidad > 0, informado responsable obligatorio.
- Debe alimentar dashboard.
- Debe quedar visible en validación.
- Debe relacionarse con incidencia si hubo queja formal.

---

## 23. CONTINUAR AL CUADRO DE CAJA

Después de KPI debe aparecer botón:

```text
Continuar al cuadro de caja
```

### Reglas

No permitir continuar si:

- lead pendiente = Sí y descripción vacía;
- venta SYNCROLAB = Sí y falta Nº reserva MEWS;
- cliente insatisfecho = Sí y falta cantidad;
- cliente insatisfecho = Sí y falta informado responsable;
- campos obligatorios KPI incompletos.

---

## 24. CAJA RECEPCIÓN

### Pestaña

```text
Caja Recepción
```

Debe estar activa.

Puede abrirse:

- desde flujo de Mi turno después de KPI;
- desde pestaña Caja Recepción si permisos lo permiten.

---

## 25. CAJA RECEPCIÓN — ESTRUCTURA

### Secciones

1. Efectivo.
2. Tarjeta.
3. Stripe.
4. Diferencias.
5. Caja fuerte.
6. Fondo a traspasar.
7. Confirmación Restaurante.
8. SYNCROLAB.
9. Totales.
10. Comentario.

---

## 26. CAJA — EFECTIVO

Campos:

- Fondo recibido del turno anterior.
- Cash según MEWS.
- Cash real contado.
- Retiro caja fuerte.
- Fondo real a traspasar.

### Reglas

- Fondo recibido se auto-rellena desde cierre anterior.
- Cash MEWS obligatorio.
- Cash real obligatorio.
- Diferencia debe calcularse.
- Diferencia requiere explicación.

---

## 27. CAJA — TARJETA Y STRIPE

Campos:

- Tarjeta según MEWS.
- TPV físico.
- Stripe según MEWS.
- Stripe real.

### Reglas

- Comparar MEWS vs real.
- Diferencias deben calcularse.
- Diferencia > 0.01 requiere explicación.

---

## 28. CAJA — DIFERENCIAS

Campos calculados:

- Δ Cash.
- Δ Tarjeta.
- Δ Stripe.
- Diferencia operativa total.

### Regla

```text
Diferencia distinta de 0 requiere explicación.
```

---

## 29. CAJA — FONDO Y CAJA FUERTE

### Caja fuerte

Pregunta:

```text
¿Hay retiro para caja fuerte?
```

Opciones:

- Sí.
- No.

Si Sí:

- importe;
- responsable si aplica;
- observación.

### Fondo traspaso

Campo:

- Fondo real a traspasar.

Turno Noche puede definir:

- fondo inicial día siguiente.

---

## 30. CAJA — CONFIRMACIÓN RESTAURANTE / SALA

Campos necesarios:

- Room charge recibido de Restaurante.
- Desayunos confirmados en MEWS.
- Pensiones comida & cena confirmadas en MEWS.

### Reglas

- Se usará para conciliación futura con Sala.
- Sala declara; Recepción confirma.
- Dashboard debe poder comparar.
- No implementar conciliación automática sin orden específica.

---

## 31. CAJA — SYNCROLAB

Campos:

- Servicios SYNCROLAB room charged.
- Cargos SYNCROLAB declarados por Recepción.
- Nº reserva MEWS si aplica.

### Reglas

- Preparado para conciliar con SYNCROLAB/talonario.
- Si SYNCROLAB sube talonario en futuro, dashboard debe comparar.
- No inventar integración sin API/documentación.

---

## 32. GUARDAR Y CERRAR TURNO

### Flujo completo

1. Usuario rellena Mi turno.
2. Pulsa Guardar.
3. Sistema valida campos.
4. Aparece checklist.
5. Usuario completa checklist.
6. Aparece KPI directo.
7. Usuario completa KPI.
8. Continúa a Caja Recepción.
9. Usuario completa caja.
10. Sistema valida diferencias/explicaciones.
11. Guarda:
    - turno;
    - gestiones;
    - incidencias;
    - checklist;
    - KPI;
    - ventas SYNCROLAB;
    - leads Bitrix24;
    - clientes insatisfechos;
    - caja recepción.
12. Estado inicial: Pendiente de revisión.
13. Mensaje:

```text
Turno guardado correctamente.
```

14. Logout automático.
15. Redirigir a login.

### Regla crítica

```text
No volver a Mi turno después de guardar.
```

---

## 33. MÁXIMO 2 TURNOS POR DÍA

### Regla

```text
Máximo 2 turnos por usuario por día.
```

### Casos

| Turnos existentes hoy | Acción |
|---|---|
| 0 | Permitir |
| 1 | Permitir segundo con aviso |
| 2 | Bloquear |

### Mensajes

Segundo turno:

```text
Ya tienes un turno registrado hoy. Este será tu segundo turno.
```

Tercer turno:

```text
Ya has registrado el máximo de turnos permitidos hoy (2).
```

---

## 34. FORMULARIO NUEVO VACÍO

Después de guardar y volver a entrar:

- formulario debe estar vacío;
- no precargar horas;
- no precargar turno;
- no precargar observaciones;
- no precargar KPI;
- no precargar caja;
- no precargar checklist.

Sí debe aparecer:

- turno anterior en Mis últimos turnos;
- gestiones activas;
- incidencias activas;
- tareas activas.

---

## 35. BLOQUES INFERIORES

### Gestiones pendientes activas

Mostrar gestiones abiertas de Recepción Hotel.

### Mis últimos turnos

Mostrar turnos del usuario conectado.

Columnas recomendadas:

- Fecha.
- Turno.
- Horas.
- Gestión.
- Incidencia.
- KPI.
- Caja.
- Estado.

---

## 36. PESTAÑA GESTIONES PENDIENTES

Debe permitir gestionar todas las gestiones abiertas de Recepción Hotel.

Campos:

- fecha;
- tipo;
- descripción;
- estado;
- creado por;
- responsable;
- deadline si aplica.

Filtros:

- estado;
- tipo;
- fecha;
- responsable.

---

## 37. PESTAÑA TAREAS

Debe mostrar:

- tareas creadas por Recepción;
- tareas asignadas a Recepción;
- tareas vencidas;
- tareas pendientes.

Campos:

- título;
- descripción;
- departamento origen;
- departamento destino;
- responsable;
- deadline;
- prioridad;
- estado.

---

## 38. PESTAÑA INFO

Debe explicar:

- cómo registrar turno;
- diferencia entre gestión/incidencia/tarea;
- cómo registrar KPI;
- cómo registrar ventas SYNCROLAB;
- cómo registrar leads Bitrix24;
- cómo registrar clientes insatisfechos;
- cómo cerrar caja;
- qué pasa después de guardar;
- máximo 2 turnos.

No debe mostrar:

- código;
- nombres de tabla;
- logs;
- errores técnicos.

---

## 39. VALIDACIÓN RECEPCIÓN HOTEL — REGLAS ESPECÍFICAS

Recepción Hotel debe validarse con reglas propias.

No basta con validar solo campos base del turno.

### El validador debe revisar

- turno correcto;
- horas;
- incidencias;
- gestiones;
- checklist;
- KPI;
- ventas SYNCROLAB;
- leads Bitrix24;
- clientes insatisfechos;
- caja;
- diferencias;
- conciliación.

---

## 40. VALIDACIÓN — REGLAS FIO ESPECÍFICAS RECEPCIÓN

### FIO automático / recomendado

1. Cliente insatisfecho no informado al responsable.
2. Venta SYNCROLAB sin Nº reserva MEWS.
3. Error grave de caja sin explicación.
4. Lead pendiente sin seguimiento claro.
5. Error check-in/check-out por procedimiento.
6. Error de cobro.
7. Comunicación interna omitida.
8. Incidencia grave no registrada.

### Reglas confirmadas

```text
Si hay cliente insatisfecho y NO informado → FIO automático.
Venta sin número de reserva MEWS → error grave → posible FIO.
Lead pendiente sin descripción → corrección obligatoria.
```

---

## 41. VALIDACIÓN — CORRECCIÓN OBLIGATORIA

Debe enviarse a corrección si:

- lead pendiente = Sí y no hay descripción;
- KPI incompleto;
- caja con diferencia sin explicación;
- venta SYNCROLAB sin datos suficientes;
- incidencia incompleta;
- gestión incompleta;
- turno sin horas válidas.

---

## 42. VALIDACIÓN — CASOS DE FIO

### FIO directo

- cliente insatisfecho no informado;
- caja con diferencia grave y sin explicación;
- error de cobro;
- error de reserva que afectó huésped;
- incumplimiento de procedimiento.

### Posible FIO

- venta sin número MEWS;
- lead no registrado en Bitrix24;
- KPI incompleto reiterado;
- observación genérica para ocultar problema.

---

## 43. DASHBOARD RECEPCIÓN HOTEL

Debe alimentar:

### Turnos

- turnos por empleado;
- horas;
- estado;
- turno mañana/tarde/noche.

### Incidencias

- abiertas;
- cerradas;
- SLA;
- tipos.

### Gestiones

- abiertas;
- en proceso;
- cerradas.

### KPI Recepción

- check-ins;
- check-outs;
- reservas gestionadas;
- reservas pendientes;
- desayunos ofertados;
- desayunos vendidos;
- ventas SYNCROLAB;
- leads pendientes;
- clientes insatisfechos.

### Caja

- cash MEWS vs real;
- tarjeta MEWS vs TPV;
- Stripe MEWS vs real;
- diferencias;
- caja fuerte;
- fondo traspaso.

### Conciliación

- room charge Sala vs Recepción;
- desayunos Sala vs Recepción;
- pensiones Sala vs Recepción;
- SYNCROLAB Recepción vs SYNCROLAB/talonario.

### FIO

- FIO Recepción por empleado;
- severidad;
- impacto bonus;
- estado gestionado/no gestionado.

---

## 44. RELACIÓN CON MEWS

MEWS es el sistema hotelero principal.

Reglas:

- escribir siempre MEWS;
- nunca MUSE;
- cualquier número de reserva debe llamarse Nº reserva MEWS;
- integración automática pendiente `[NO DATA]`.

No inventar datos MEWS.

---

## 45. RELACIÓN CON BITRIX24

Bitrix24 es fuente de:

- leads;
- CRM;
- tareas;
- seguimiento.

Reglas:

- lead pendiente debe tener descripción;
- si se marca registrado en Bitrix24, debe quedar trazado;
- integración automática pendiente `[NO DATA]`.

---

## 46. RELACIÓN CON SYNCROLAB

Recepción puede vender servicios SYNCROLAB.

Reglas:

- cada venta debe tener tipo de servicio;
- importe;
- Nº reserva MEWS;
- comentario si aplica;
- debe alimentar dashboard;
- debe poder conciliarse con SYNCROLAB.

---

## 47. RELACIÓN CON SALA

Recepción confirma información que Sala declara.

Campos clave:

- Room charge.
- Desayunos.
- Pensiones.

Regla:

```text
Sala declara → Recepción confirma → Dashboard compara.
```

No implementar comparación automática hasta que se defina en dashboard/conciliación.

---

## 48. PERMISOS

### Usuario Recepción

Puede:

- crear turno;
- registrar gestiones;
- registrar incidencias;
- registrar KPI;
- registrar caja;
- crear tareas;
- ver sus últimos turnos;
- editar durante ventana permitida si existe.

No puede:

- validar;
- crear FIO;
- cerrar definitivo;
- eliminar;
- editar tras ventana permitida.

### Jefe Recepción / Validador

Puede:

- revisar turnos Recepción;
- validar;
- enviar a corrección;
- crear FIO;
- revisar caja;
- validar caja si tiene permiso.

### Admin

Puede:

- ver todo;
- validar;
- enviar corrección;
- crear FIO;
- eliminar;
- reabrir;
- cerrar;
- ver dashboard completo.

---

## 49. REGLAS UX/UI

- Interfaz simple.
- No lenguaje técnico.
- No mostrar “MUSE”.
- No mostrar JSON.
- No mostrar null/undefined/NaN.
- Bloques claros:
  - turno;
  - gestión;
  - incidencia;
  - checklist;
  - KPI;
  - caja.
- Modales largos deben ser usables en pantalla pequeña.
- Botones claros.
- Feedback tras guardar.

---

## 50. ERRORES CRÍTICOS A EVITAR

- usar “servicio” en vez de “turno” en Recepción;
- escribir MUSE;
- permitir venta SYNCROLAB sin Nº reserva MEWS;
- permitir lead pendiente sin descripción;
- no generar FIO por cliente insatisfecho no informado;
- caja con diferencia sin explicación;
- volver a Mi turno tras guardar;
- precargar datos anteriores;
- no activar Caja Recepción;
- no alimentar dashboard;
- no mostrar KPI en validación;
- no guardar datos para conciliación futura.

---

## 51. PROMPT TÉCNICO PARA CODEX / CLAUDE CODE

```text
Contexto:
Estamos trabajando en SynchroShift / SYNCROSFERA. El módulo Recepción Hotel debe quedar completo a nivel producción. Recepción Hotel usa turno mañana/tarde/noche, registra KPI directo del empleado, ventas SYNCROLAB, leads Bitrix24, clientes insatisfechos y Caja Recepción vinculada a MEWS.

Objetivo:
Completar módulo Recepción Hotel sin romper CoreTurnos, Dashboard ni Validación.

Requisitos funcionales:
1. Navegación:
- Izquierda: Mi turno, Gestiones pendientes, Tareas, Caja Recepción.
- Derecha: Info, Usuario, Recepción Hotel, Salir.

2. Mi turno:
- Fecha automática.
- Turno: Mañana, Tarde, Noche.
- Horas trabajadas numérico.
- Observación opcional.
- Gestiones e incidencias igual core común.

3. Gestiones:
- Si Sí: tipo y descripción obligatorios.
- Usar catálogo Recepción Hotel.
- Mostrar en Gestiones pendientes.

4. Incidencias:
- Si Sí: qué ocurrió, acción inmediata, tipo, informado responsable, personas involucradas.
- Usar catálogo Recepción Hotel.
- Incidencias activas hasta cierre.

5. Checklist:
- Mostrar antes de KPI.
- Guardar respuestas y porcentaje.

6. KPI:
- Check-ins.
- Check-outs.
- Reservas gestionadas.
- Reservas pendientes.
- Desayunos ofrecidos/vendidos.
- Ventas SYNCROLAB.
- Leads Bitrix24.
- Clientes insatisfechos.

7. Reglas críticas KPI:
- Lead pendiente sin descripción = corrección obligatoria.
- Cliente insatisfecho no informado = FIO automático.
- Venta SYNCROLAB sin Nº reserva MEWS = error grave y posible FIO.

8. Caja Recepción:
- Activar Caja Recepción.
- MEWS vs real.
- Diferencias.
- Fondo recibido / fondo traspaso.
- Confirmación restaurante.
- SYNCROLAB room charged.

9. Guardar:
- Guardar turno + checklist + KPI + caja.
- Estado Pendiente de revisión.
- Logout automático.
- No volver a Mi turno.

Reglas de datos:
- Máximo 2 turnos por usuario/día.
- Formulario nuevo vacío.
- No mostrar arrays.
- No mostrar null/undefined/NaN.
- Escribir MEWS, no MUSE.
- No inventar integraciones.

Reglas de permisos:
- Usuario crea.
- Jefe/validador valida y crea FIO.
- Admin controla todo.

Criterios de aceptación:
- Turno Recepción funciona.
- KPI se guarda.
- Caja se guarda.
- Validación ve KPI.
- Dashboard recibe datos.
- Reglas FIO recepción funcionan.
- Logout funciona.

Pruebas obligatorias:
1. Login Recepción.
2. Crear turno Mañana.
3. Crear gestión.
4. Crear incidencia.
5. Completar checklist.
6. Completar KPI.
7. Añadir venta SYNCROLAB con Nº MEWS.
8. Probar venta sin Nº MEWS.
9. Crear lead pendiente sin descripción y verificar bloqueo/corrección.
10. Registrar cliente insatisfecho no informado y verificar FIO.
11. Completar Caja Recepción.
12. Guardar y verificar logout.
13. Ver Validación.
14. Ver Dashboard.
15. Revisar permisos.

No romper:
- Cocina.
- Sala.
- Validación.
- Dashboard.
- Caja Sala.
- CoreTurnos.
```

---

## 52. QA CHECKLIST RECEPCIÓN HOTEL

### Login / navegación

- [ ] PIN correcto.
- [ ] Departamento Recepción Hotel cargado.
- [ ] Info a la derecha.
- [ ] Caja Recepción visible.
- [ ] No aparece Cierre Caja Sala.
- [ ] Salir funciona.

### Mi turno

- [ ] Fecha automática.
- [ ] Turno Mañana/Tarde/Noche.
- [ ] Horas válidas.
- [ ] Observaciones guardan.
- [ ] Formulario nuevo vacío.

### Gestiones

- [ ] Sí abre campos.
- [ ] No oculta campos.
- [ ] Tipo obligatorio.
- [ ] Descripción obligatoria.
- [ ] Aparece en activas.

### Incidencias

- [ ] Sí abre campos.
- [ ] Tipo obligatorio.
- [ ] Qué ocurrió obligatorio.
- [ ] Informado responsable persiste.
- [ ] Personas involucradas funciona.
- [ ] Incidencia aparece hasta cierre.
- [ ] SLA calcula.

### Checklist

- [ ] Aparece antes de KPI.
- [ ] Guarda respuestas.
- [ ] Guarda porcentaje.
- [ ] No muestra errores técnicos.

### KPI

- [ ] Check-ins guardan.
- [ ] Check-outs guardan.
- [ ] Reservas gestionadas guardan.
- [ ] Reservas pendientes exige descripción.
- [ ] Desayunos guardan.
- [ ] Ventas SYNCROLAB guardan.
- [ ] Venta sin Nº MEWS bloquea o marca error.
- [ ] Lead pendiente sin descripción bloquea/corrección.
- [ ] Cliente insatisfecho no informado genera FIO.

### Caja Recepción

- [ ] Cash MEWS guarda.
- [ ] Cash real guarda.
- [ ] Tarjeta MEWS guarda.
- [ ] TPV real guarda.
- [ ] Stripe MEWS guarda.
- [ ] Stripe real guarda.
- [ ] Diferencias calculan.
- [ ] Diferencia exige explicación.
- [ ] Fondo recibido carga.
- [ ] Fondo traspaso guarda.
- [ ] Confirmación restaurante guarda.
- [ ] SYNCROLAB room charged guarda.

### Guardado / logout

- [ ] Guarda todo.
- [ ] Mensaje correcto.
- [ ] Logout automático.
- [ ] No vuelve a Mi turno.

### Validación

- [ ] Turno aparece.
- [ ] KPI visible.
- [ ] Caja visible.
- [ ] Reglas FIO aplican.
- [ ] Corrección obligatoria funciona.

### Dashboard

- [ ] KPI Recepción aparece.
- [ ] Caja Recepción aparece.
- [ ] Leads pendientes cuentan.
- [ ] Clientes insatisfechos cuentan.
- [ ] Ventas SYNCROLAB cuentan.
- [ ] FIO Recepción aparece.

### UX

- [ ] No MUSE.
- [ ] No null/undefined/NaN.
- [ ] No arrays.
- [ ] No IDs técnicos.
- [ ] Responsive usable.

---

## 53. CRITERIOS DE ACEPTACIÓN

Recepción Hotel está correcto si:

- registra turnos mañana/tarde/noche;
- guarda checklist;
- guarda KPI completo;
- registra ventas SYNCROLAB con Nº reserva MEWS;
- bloquea/corrige leads sin descripción;
- genera FIO si cliente insatisfecho no informado;
- guarda Caja Recepción;
- alimenta Dashboard;
- aparece completo en Validación;
- respeta permisos;
- hace logout automático;
- no muestra errores técnicos.

---

## 54. PENDIENTES / [NO DATA]

- API real MEWS: `[NO DATA]`.
- API real Bitrix24: `[NO DATA]`.
- API real SYNCROLAB/talonario: `[NO DATA]`.
- Integración automática Nubimed: `[NO DATA]`.
- Fórmula exacta de bonus por FIO Recepción: `[NO DATA]`.
- Validación Caja Recepción SYNCROLAB: `[NO DATA]`.
- Edición exacta 30 minutos Recepción: `[NO DATA]`.

---

## 55. RESULTADO ESPERADO

Recepción Hotel debe quedar como módulo completo de control operativo, comercial y financiero.

Debe garantizar:

- operación trazable;
- datos MEWS preparados;
- leads Bitrix24 controlados;
- ventas SYNCROLAB registradas;
- clientes insatisfechos visibles;
- caja recepción confiable;
- dashboard accionable;
- validación con FIO específico.
