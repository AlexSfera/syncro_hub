# 04_MODULE_COCINA_FULL.md — SYNCROSFERA / SynchroShift (FULL PRO)

---

## 1. OBJETIVO DEL MÓDULO

Definir el módulo **Cocina** a nivel operativo, UI/UX, datos, validación y QA.

El módulo Cocina debe permitir:

- registrar turnos de Cocina;
- registrar gestiones pendientes;
- registrar incidencias operativas;
- registrar mermas;
- crear tareas para otros departamentos;
- mostrar gestiones e incidencias activas;
- mostrar últimos turnos del usuario;
- alimentar dashboard y validación;
- evitar duplicidad de turnos;
- cerrar sesión tras guardar.

---

## 2. ALCANCE

### Incluido

- Login por PIN / sesión de usuario.
- Pestaña Mi turno.
- Pestaña Gestiones pendientes.
- Pestaña Tareas.
- Pestaña Info a la derecha.
- Registro de turno.
- Registro de gestiones.
- Registro de incidencias.
- Registro de mermas.
- Checklist Cocina.
- Logout automático.
- Máximo 2 turnos por usuario/día.
- Preparación para dashboard.

### No incluido todavía

- Integración real con POSMEWS.
- Autocomplete real de productos con base de datos.
- Cálculo automático de coste de merma si no existe coste unitario.
- Integración automática con proveedores.

Si falta dato técnico real, usar:

```text
[NO DATA]
```

---

## 3. NAVEGACIÓN SUPERIOR

### Estructura correcta

```text
[ Mi turno ] [ Gestiones pendientes ] [ Tareas ] -------------------- [ Info ] [ Usuario ] [ Cocina ] [ Salir ]
```

### Reglas

- `Mi turno` siempre a la izquierda.
- `Gestiones pendientes` debe existir como pestaña.
- `Tareas` se mantiene.
- `Info` debe estar completamente a la derecha.
- A la derecha deben estar:
  - Info;
  - nombre de usuario;
  - departamento Cocina;
  - Salir.
- No duplicar botones.
- No mostrar navegación de otros departamentos.
- No mostrar Cierre de caja en Cocina.
- No mostrar Caja Recepción en Cocina.

---

## 4. ACCESO Y SESIÓN

### Login

- Usuario entra con PIN.
- Sistema identifica:
  - usuario;
  - departamento;
  - rol;
  - permisos.

### Departamento

Debe quedar asociado a:

```text
Cocina
```

### Logout obligatorio

Después de guardar turno:

```text
Guardar turno → logout automático obligatorio
```

Motivo:

- evitar doble registro;
- evitar uso por otra persona;
- evitar formulario precargado;
- proteger datos.

---

## 5. PESTAÑA MI TURNO

La pestaña **Mi turno** es el follow-up principal del empleado de Cocina.

Debe contener:

1. Datos base del turno.
2. Gestiones pendientes.
3. Incidencia operativa.
4. Mermas.
5. Crear tarea.
6. Guardar / Cancelar.
7. Gestiones e incidencias activas.
8. Mis últimos turnos.

---

## 6. DATOS BASE DEL TURNO

### Campos

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| Fecha | Automática | Sí | No editable |
| Servicio | Selector | Sí | Desayuno / Comida / Cena / Evento |
| Turno | Selector si existe | [NO DATA] | Solo si está implementado |
| Responsable de turno | Dropdown | Sí | Desde configuración Cocina |
| Horas trabajadas | Numérico | Sí | Punto o coma |
| Observaciones | Texto | No | Comentario libre |

---

## 7. FECHA

### Regla

- Fecha automática del día.
- No editable por usuario lineal.
- Admin solo puede modificar si existe permiso definido.

### UX

Mostrar como:

```text
Fecha: 03/05/2026
```

No mostrar formato técnico tipo:

```text
2026-05-03T08:00:00Z
```

---

## 8. SERVICIO

### Valores confirmados

- Desayuno
- Comida
- Cena
- Evento

### Reglas

- Puede ser selector simple o múltiple según implementación actual.
- Si es múltiple, mostrar valores legibles:

Correcto:

```text
Desayuno, Comida
```

Incorrecto:

```text
["Desayuno","Comida"]
```

### Dashboard

Debe permitir filtrar por:

- servicio;
- departamento;
- usuario;
- fecha.

---

## 9. RESPONSABLE DE TURNO

### Regla

Debe cargar solo usuarios configurados como responsables de turno del departamento Cocina.

No debe mostrar:

- responsables de Sala;
- responsables de Recepción;
- usuarios inactivos;
- IDs técnicos.

### Si no hay responsables

Mensaje:

```text
No hay responsables configurados para Cocina.
```

---

## 10. HORAS TRABAJADAS

### Reglas

- Campo numérico.
- Aceptar:
  - `8`
  - `8.5`
  - `8,5`
- Guardar número normalizado.
- No permitir:
  - vacío;
  - negativo;
  - texto;
  - valores absurdos.

Mensaje error:

```text
Introduce horas trabajadas válidas.
```

---

## 11. OBSERVACIONES

### Regla

- Campo texto.
- Opcional.
- No debe bloquear guardado si está vacío.

Placeholder recomendado:

```text
Nota breve del turno
```

---

## 12. GESTIONES PENDIENTES

### Pregunta

```text
¿Queda alguna gestión pendiente?
```

Opciones:

- Sí
- No

### Si No

- No mostrar campos adicionales.
- Guardar que no hubo gestión pendiente.

### Si Sí

Mostrar:

- Tipo de gestión.
- Descripción.

Ambos obligatorios.

---

## 13. TIPOS DE GESTIÓN — COCINA

Catálogo recomendado:

1. Seguimiento para siguiente turno.
2. Pedido pendiente.
3. Preparación pendiente.
4. Revisión de stock.
5. Falta de producto.
6. Comunicación pendiente con Sala.
7. Comunicación pendiente con Recepción.
8. Comunicación pendiente con Mantenimiento.
9. Limpieza o revisión pendiente.
10. Organización interna.
11. Gestión con proveedor pendiente.
12. Información a confirmar.
13. Traspaso de tarea operativa.
14. Otro.

### Reglas

- Si se marca Sí, tipo y descripción son obligatorios.
- Si tipo = Otro, descripción debe explicar.
- Debe aparecer en:
  - pestaña Gestiones pendientes;
  - bloque de gestiones activas;
  - dashboard;
  - validación si aplica.
- Debe permanecer visible hasta cierre.
- No mezclar con incidencias.

---

## 14. INCIDENCIA OPERATIVA

### Pregunta

```text
¿Hubo alguna incidencia durante el turno?
```

Opciones:

- Sí
- No

### Si No

- No mostrar campos.
- Guardar que no hubo incidencia.

### Si Sí

Mostrar:

- Qué ocurrió.
- Acción inmediata tomada.
- Tipo de incidencia.
- Informado al responsable.
- Personas involucradas.

---

## 15. TIPOS DE INCIDENCIA — COCINA

Catálogo recomendado:

1. Error de preparación.
2. Retraso en servicio.
3. Falta de producto.
4. Producto en mal estado.
5. Calidad del producto.
6. Problema con maquinaria o equipo.
7. Avería de cocina.
8. Problema de limpieza.
9. APPCC / seguridad alimentaria.
10. Problema de comunicación interna.
11. Problema Cocina-Sala.
12. Problema con Recepción.
13. Problema con proveedor.
14. Incumplimiento de procedimiento.
15. Accidente o seguridad.
16. Otro.

---

## 16. CAMPOS DE INCIDENCIA

| Campo | Tipo | Obligatorio |
|---|---|---:|
| Qué ocurrió | Texto largo | Sí |
| Acción inmediata tomada | Texto | Recomendado |
| Tipo de incidencia | Dropdown | Sí |
| Informado al responsable | Sí/No | Sí |
| Personas involucradas | Multi-selector | No / según caso |

### Reglas

- Si se marca Sí, al menos “Qué ocurrió” y “Tipo” son obligatorios.
- `Informado al responsable` debe persistir.
- Personas involucradas debe poder guardar varias personas.
- No mostrar IDs técnicos.
- Incidencia abierta debe permanecer visible hasta cierre.
- Tiempo de resolución se calcula al cerrar.

---

## 17. PERSONAS INVOLUCRADAS

### Reglas

- Buscador por nombre.
- Permitir seleccionar varias personas.
- Mostrar:
  - nombre;
  - puesto;
  - departamento.
- Guardar correctamente.
- Al recargar histórico, mostrar valores legibles.
- No mostrar IDs internos.

---

## 18. MERMAS

### Estado actual

Mermas funcionan y deben mantenerse.

### Campos

| Campo | Tipo | Obligatorio |
|---|---|---:|
| Producto | Texto libre | Sí si hay merma |
| Cantidad | Numérico | Sí si hay merma |
| Unidad | Selector | Sí si hay merma |
| Causa | Selector | Sí si hay merma |
| Observación | Texto | No |

---

## 19. PRODUCTO EN MERMAS

### Estado actual

Producto se introduce manualmente.

### Regla actual

```text
Mantener texto libre.
```

### Mejora futura confirmada

Añadir buscador/autocomplete de productos cuando exista catálogo.

### Futuro comportamiento

- Usuario escribe parte del producto.
- Sistema sugiere productos.
- Usuario selecciona.
- Si no existe producto, permitir texto libre si el negocio lo decide.
- No mostrar códigos internos.

Estado:

```text
Futuro / [NO DATA] catálogo productos
```

---

## 20. CANTIDAD, UNIDAD Y CAUSA

### Cantidad

- Numérico.
- Mayor que 0.
- No permitir negativos.
- No permitir línea vacía.

### Unidad

Opciones recomendadas:

- uds
- kg
- g
- l
- ml
- porción
- bandeja
- otro

### Causa

Opciones recomendadas:

- Caducidad.
- Producto en mal estado.
- Error de preparación.
- Sobreproducción.
- Devolución.
- Rotura.
- Manipulación incorrecta.
- Prueba / ajuste interno.
- Otro.

---

## 21. SIN MERMA EN ESTE TURNO

Debe existir opción:

```text
Sin merma en este turno
```

### Reglas

- Si se marca, no exigir líneas de merma.
- Si no se marca y hay línea añadida, validar todos los campos obligatorios.
- No guardar líneas vacías.
- Debe quedar registrado para dashboard/checklist.

---

## 22. COSTE DE MERMA

### Estado actual

[NO DATA] sobre coste unitario real por producto.

### Regla

- Si no hay coste unitario, no inventar coste.
- Dashboard puede contar cantidad de mermas.
- Coste solo debe calcularse si existe:
  - coste manual;
  - coste unitario;
  - catálogo productos.

### Riesgo

No mostrar “coste merma” como dato fiable si no existe fuente.

---

## 23. CREAR TAREA DESDE COCINA

### Pregunta

```text
¿Crear tarea operativa?
```

Opciones:

- Sí
- No

### Si Sí

Campos mínimos:

- Título.
- Descripción.
- Departamento destino.
- Responsable si aplica.
- Deadline.
- Prioridad si aplica.

### Reglas

- Deadline con calendario.
- Solo fechas futuras.
- Tarea debe aparecer en módulo Tareas.
- Tarea debe aparecer en dashboard.
- Tarea no debe mezclarse con gestión ni incidencia.
- Departamento origen = Cocina.

---

## 24. CHECKLIST COCINA

El checklist aparece antes de guardar.

### Reglas

- Debe guardarse vinculado al turno.
- Debe guardar:
  - usuario;
  - fecha/hora;
  - respuestas;
  - porcentaje completado.
- No mostrar errores técnicos.

### Checklist recomendado

#### APPCC y producto

- Cámaras y cuarto frío revisados.
- Temperaturas de cámaras y congeladores OK.
- Producto sin fecha o en mal estado retirado.
- Producto correctamente etiquetado.
- Alérgenos y trazabilidad revisados si aplica.

#### Buffet / vitrina

- Buffet gestionado correctamente.
- Vitrina gestionada correctamente.
- Producto sobrante revisado.
- Zona de exposición limpia y ordenada.

#### Maquinaria y seguridad

- No quedan comandas pendientes.
- Fuegos apagados.
- Horno apagado.
- Plancha apagada.
- Freidoras apagadas.
- Gas cerrado.
- Extractor / campana apagados.
- Cámaras cerradas.
- Herramientas peligrosas guardadas.

#### Limpieza

- Fogones limpios.
- Superficies de trabajo limpias.
- Suelo limpio o comunicado.
- Basura retirada.
- Utensilios recogidos.
- Zona de lavado revisada.

#### Comunicación y cierre

- Incidencias registradas.
- Gestiones pendientes registradas.
- Mermas registradas o marcada opción sin merma.
- Información importante comunicada.

---

## 25. GUARDAR TURNO

### Flujo obligatorio

1. Usuario pulsa Guardar turno.
2. Sistema valida máximo 2 turnos/día.
3. Sistema valida campos base.
4. Sistema valida gestiones si Sí.
5. Sistema valida incidencias si Sí.
6. Sistema valida mermas.
7. Sistema abre checklist.
8. Usuario completa checklist.
9. Sistema guarda:
   - turno;
   - gestiones;
   - incidencias;
   - mermas;
   - tareas;
   - checklist.
10. Estado inicial: Pendiente de revisión.
11. Mostrar mensaje:

```text
Turno guardado correctamente.
```

12. Logout automático.
13. Redirigir a login.

### Regla crítica

```text
No volver a Mi turno después de guardar.
```

---

## 26. MÁXIMO 2 TURNOS POR DÍA

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

### Mensaje segundo turno

```text
Ya tienes un turno registrado hoy. Este será tu segundo turno.
```

### Mensaje tercer turno

```text
Ya has registrado el máximo de turnos permitidos hoy (2).
```

---

## 27. FORMULARIO NUEVO VACÍO

Después de guardar y volver a entrar:

- formulario debe estar vacío;
- no precargar horas anteriores;
- no precargar servicio anterior;
- no precargar observaciones anteriores;
- no precargar mermas anteriores;
- no precargar checklist anterior.

Lo que sí debe aparecer:

- turno anterior en Mis últimos turnos;
- gestiones activas;
- incidencias activas;
- tareas activas si existen.

---

## 28. BLOQUE GESTIONES E INCIDENCIAS ACTIVAS

### Ubicación

Debajo del formulario.

### Debe mostrar

- gestiones abiertas de Cocina;
- incidencias abiertas de Cocina;
- tareas activas si corresponde.

### Reglas

- Permanecen visibles hasta cierre.
- Mostrar estado.
- Mostrar responsable si existe.
- Usuario lineal no debe cerrar/validar si no tiene permiso.
- Admin o responsable puede cerrar/validar según reglas.

---

## 29. MIS ÚLTIMOS TURNOS

### Ubicación

Debajo del bloque activo.

### Columnas recomendadas

- Fecha.
- Servicio.
- Horas.
- Mermas.
- Gestión.
- Incidencia.
- Estado.

### Reglas

- Solo turnos del usuario conectado.
- Solo lectura para usuario lineal.
- Mostrar icono de edición solo si regla de edición aplica.
- No mostrar datos técnicos.

---

## 30. PESTAÑA GESTIONES PENDIENTES

### Objetivo

Permitir seguimiento global de gestiones Cocina.

### Contenido

- Fecha creación.
- Tipo.
- Descripción.
- Estado.
- Creado por.
- Responsable/destino.
- Deadline si aplica.
- Acciones permitidas.

### Filtros recomendados

- Estado.
- Tipo.
- Fecha.
- Responsable.
- Creado por.

### Reglas

- Mostrar solo Cocina salvo Admin.
- No mezclar con incidencias.
- No mezclar con tareas.
- Cerradas pueden ir a histórico.

---

## 31. PESTAÑA TAREAS

Debe mostrar:

- tareas creadas por Cocina;
- tareas asignadas a Cocina;
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

## 32. PESTAÑA INFO

### Ubicación

Derecha.

### Contenido recomendado

- Cómo registrar turno.
- Qué es gestión pendiente.
- Qué es incidencia.
- Qué es merma.
- Cómo guardar turno.
- Qué pasa después de guardar.
- Máximo 2 turnos.
- Estados.

### No debe mostrar

- logs;
- errores;
- datos técnicos;
- nombres de tablas;
- debug.

---

## 33. PERMISOS

### Usuario Cocina

Puede:

- crear turno;
- crear gestión;
- crear incidencia;
- crear merma;
- crear tarea si permitido;
- ver sus últimos turnos;
- ver activos visibles.

No puede:

- validar turno;
- cerrar turno;
- editar turnos cerrados;
- validar incidencias;
- modificar datos de otros sin permiso.

### Responsable Cocina / Validador

Puede:

- ver turnos de Cocina;
- revisar;
- validar;
- enviar a corrección;
- cerrar incidencias/gestiones si permitido.

### Admin

Puede:

- ver todo;
- validar;
- devolver;
- cerrar;
- eliminar;
- corregir datos;
- ver dashboard completo.

---

## 34. DASHBOARD — IMPACTO COCINA

Cocina debe alimentar dashboard con:

### Turnos

- total turnos;
- horas trabajadas;
- pendientes;
- validados.

### Incidencias

- abiertas;
- cerradas;
- por tipo;
- por SLA;
- tiempo medio de resolución.

### Gestiones

- abiertas;
- cerradas;
- por tipo.

### Mermas

- cantidad de registros;
- productos;
- causas;
- cantidades;
- coste si existe fuente.

### Checklist

- porcentaje completado;
- media por turno;
- media por empleado;
- media por departamento.

### Tareas

- creadas por Cocina;
- asignadas a Cocina;
- vencidas;
- abiertas.

### FIO

- FIO asociados a empleados Cocina;
- severidad;
- impacto bonus.

---

## 35. RELACIÓN CON F&B

Cocina forma parte del agregado:

```text
F&B = Sala + Cocina
```

Cuando se selecciona F&B en dashboard, deben sumarse:

- turnos Cocina;
- horas Cocina;
- incidencias Cocina;
- gestiones Cocina;
- tareas Cocina;
- FIO Cocina;
- costes/mermas Cocina.

---

## 36. VALIDACIÓN

Los turnos de Cocina deben aparecer en módulo Validación.

### Tabla validación debe mostrar

- empleado;
- departamento;
- fecha;
- servicio;
- horas;
- incidencias;
- gestiones;
- tareas;
- FIO;
- estado;
- acción.

### Pop-up validación

Debe incluir:

- datos turno;
- checklist;
- gestiones;
- incidencias;
- mermas;
- tareas creadas;
- FIO.

---

## 37. FIO EN COCINA

FIO no lo crea el usuario durante el turno.  
Lo registra el validador/admin durante la validación.

### Campos FIO

- Sí/No.
- Concepto.
- Severidad.
- Impacto bonus.
- Comentario.

### Reglas

- Si No FIO: campos bloqueados.
- Si Sí FIO: campos obligatorios.
- FIO crítico no gestionado genera alerta dashboard.

---

## 38. REGLAS UI/UX

- Formularios simples.
- Bloques separados visualmente.
- Botones claros.
- Feedback tras guardar.
- No mostrar lenguaje técnico.
- No mostrar campos de Sala/Recepción.
- No mostrar arrays.
- No mostrar null/undefined/NaN.
- Responsive debe funcionar.

---

## 39. ERRORES ACTUALES / RIESGOS

### Riesgos

- Info a la izquierda.
- Falta pestaña Gestiones pendientes.
- No logout tras guardar.
- Doble registro de turno.
- Mezclar gestión con incidencia.
- Mostrar arrays.
- Mermas incompletas.
- Coste merma inventado.
- Dashboard contando duplicados.
- Responsive no revisado.

### Reglas para evitar

- Validar máximo 2 turnos.
- Logout obligatorio.
- Formulario nuevo vacío.
- Separar conceptos.
- No calcular costes sin fuente.

---

## 40. PROMPT TÉCNICO PARA CODEX / CLAUDE CODE

```text
Contexto:
Estamos trabajando en SynchroShift / SYNCROSFERA. El módulo Cocina debe alinearse con el core común de turnos, manteniendo su lógica específica: gestiones, incidencias, mermas, checklist y tareas.

Objetivo:
Completar y corregir módulo Cocina a nivel producción.

Requisitos funcionales:
1. Navegación:
- Izquierda: Mi turno, Gestiones pendientes, Tareas.
- Derecha: Info, Usuario, Cocina, Salir.

2. Mi turno:
- Fecha automática no editable.
- Servicio: Desayuno, Comida, Cena, Evento.
- Responsable de turno desde configuración Cocina.
- Horas trabajadas numérico.
- Observación opcional.

3. Gestiones:
- Pregunta Sí/No.
- Si Sí: tipo y descripción obligatorios.
- Usar catálogo Cocina.
- Mostrar en pestaña Gestiones pendientes y bloque activo.

4. Incidencias:
- Pregunta Sí/No.
- Si Sí: qué ocurrió, acción inmediata, tipo, informado responsable, personas involucradas.
- Mostrar activas hasta cierre.
- Calcular tiempo resolución al cerrar.

5. Mermas:
- Producto texto libre.
- Cantidad > 0.
- Unidad.
- Causa.
- Observación opcional.
- Opción Sin merma.
- No implementar autocomplete sin catálogo real.

6. Checklist:
- Mostrar antes de guardar.
- Guardar respuestas, usuario, fecha/hora, porcentaje.

7. Guardar:
- Validar máximo 2 turnos/día.
- Guardar todo.
- Estado Pendiente de revisión.
- Logout automático.
- No volver a Mi turno.

Reglas de datos:
- No precargar datos anteriores.
- No guardar líneas vacías.
- No mostrar arrays.
- No mostrar null/undefined/NaN.
- No inventar coste merma.

Reglas de permisos:
- Usuario crea, no valida.
- Responsable/Admin valida.
- Admin puede eliminar.

Criterios de aceptación:
- Navegación correcta.
- Gestiones existe.
- Info a la derecha.
- Turno guarda correctamente.
- Logout funciona.
- Mermas guardan.
- Dashboard recibe datos.
- Validación muestra turno Cocina.

Pruebas obligatorias:
1. Login Cocina.
2. Crear turno sin gestión/incidencia/merma.
3. Guardar y verificar logout.
4. Login de nuevo y verificar formulario vacío.
5. Crear turno con gestión.
6. Crear turno con incidencia.
7. Crear merma.
8. Marcar Sin merma.
9. Crear tarea.
10. Ver dashboard.
11. Ver validación.
12. Probar máximo 2 turnos.
13. Revisar responsive.
14. Confirmar ausencia de textos técnicos.

No romper:
- Sala.
- Recepción.
- Dashboard.
- Validación.
- Core turnos.
```

---

## 41. CHECKLIST QA COCINA

### Login

- [ ] PIN correcto entra.
- [ ] Departamento Cocina cargado.
- [ ] Salir cierra sesión.

### Navegación

- [ ] Mi turno izquierda.
- [ ] Gestiones pendientes existe.
- [ ] Tareas existe.
- [ ] Info derecha.
- [ ] Usuario/Cocina/Salir derecha.
- [ ] No hay Cierre Caja.

### Turno

- [ ] Fecha automática.
- [ ] Servicio guarda.
- [ ] Responsable carga.
- [ ] Horas acepta punto/coma.
- [ ] Observación guarda.
- [ ] Máximo 2 turnos.

### Gestiones

- [ ] Sí abre campos.
- [ ] No oculta campos.
- [ ] Tipo obligatorio.
- [ ] Descripción obligatoria.
- [ ] Aparece en activas.

### Incidencias

- [ ] Sí abre campos.
- [ ] Qué ocurrió obligatorio.
- [ ] Tipo obligatorio.
- [ ] Informado responsable persiste.
- [ ] Personas involucradas guarda.
- [ ] Incidencia activa hasta cierre.
- [ ] Tiempo resolución calcula.

### Mermas

- [ ] Producto guarda.
- [ ] Cantidad valida.
- [ ] Unidad guarda.
- [ ] Causa guarda.
- [ ] Observación guarda.
- [ ] Sin merma funciona.
- [ ] No guarda líneas vacías.

### Checklist

- [ ] Aparece antes de guardar.
- [ ] Guarda respuestas.
- [ ] Guarda porcentaje.
- [ ] No muestra errores técnicos.

### Guardado/logout

- [ ] Guarda.
- [ ] Mensaje correcto.
- [ ] Logout.
- [ ] Redirige login.
- [ ] No vuelve a Mi turno.

### Dashboard

- [ ] Turnos Cocina cuentan.
- [ ] Incidencias Cocina cuentan.
- [ ] Gestiones Cocina cuentan.
- [ ] Mermas aparecen.
- [ ] F&B suma Cocina.

### Validación

- [ ] Turno Cocina aparece.
- [ ] Pop-up muestra mermas.
- [ ] FIO se puede registrar.
- [ ] Validar funciona.
- [ ] Enviar corrección funciona.

### UX

- [ ] Sin arrays.
- [ ] Sin null/undefined/NaN.
- [ ] Sin IDs técnicos.
- [ ] Responsive correcto.

---

## 42. CRITERIOS DE ACEPTACIÓN

El módulo Cocina se considera correcto si:

- usuario puede registrar turno completo;
- no puede registrar más de 2 turnos por día;
- al guardar sale de la plataforma;
- gestiones e incidencias están separadas;
- mermas funcionan;
- checklist se guarda;
- dashboard recibe datos;
- validación recibe datos;
- F&B agrega Cocina;
- usuario no ve errores técnicos;
- admin puede revisar y validar.

---

## 43. PENDIENTES

- Catálogo real de productos: `[NO DATA]`.
- Coste unitario de productos: `[NO DATA]`.
- Permisos exactos responsable Cocina: `[NO DATA]`.
- Definición completa de edición 30 minutos para Cocina: `[NO DATA]`.
- Integración POSMEWS: futuro.
