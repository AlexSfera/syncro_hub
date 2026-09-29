-- Índices de cobertura para todas las claves foráneas del módulo.
-- Mantienen predecibles las comprobaciones de integridad y los borrados/cambios
-- de referencias sin alterar datos ni ampliar permisos.

begin;

create index if not exists idx_ecl_convenio_version
  on public.empleado_condiciones_laborales (convenio_version_id);
create index if not exists idx_ecl_creado_por
  on public.empleado_condiciones_laborales (creado_por);

create index if not exists idx_erm_aprobado_por
  on public.extra_recuperacion_movimientos (aprobado_por);
create index if not exists idx_erm_creado_por
  on public.extra_recuperacion_movimientos (creado_por);
create index if not exists idx_erm_origen_planificacion
  on public.extra_recuperacion_movimientos (origen_planificacion_id);

create index if not exists idx_plan_aprobaciones_actor
  on public.planificacion_aprobaciones (actor);
create index if not exists idx_plan_asignaciones_turno_catalogo
  on public.planificacion_asignaciones (turno_catalogo_id);
create index if not exists idx_plan_audit_actor
  on public.planificacion_audit (actor);
create index if not exists idx_plan_audit_semana
  on public.planificacion_audit (semana_id);

create index if not exists idx_plan_ausencias_creado_por
  on public.planificacion_ausencias (creado_por);
create index if not exists idx_plan_ausencias_modificado_por
  on public.planificacion_ausencias (modificado_por);
create index if not exists idx_plan_ausencias_reemplaza
  on public.planificacion_ausencias (reemplaza_ausencia_id);

create index if not exists idx_plan_semanas_creado_por
  on public.planificacion_semanas (creado_por);
create index if not exists idx_plan_semanas_modificado_por
  on public.planificacion_semanas (modificado_por);
create index if not exists idx_plan_semanas_publicado_por
  on public.planificacion_semanas (publicado_por);

create index if not exists idx_plan_sync_log_actor
  on public.planificacion_sync_log (actor);
create index if not exists idx_plan_sync_log_asignacion
  on public.planificacion_sync_log (asignacion_id);
create index if not exists idx_plan_versiones_creado_por
  on public.planificacion_versiones (creado_por);

create index if not exists idx_vacaciones_movimientos_actor
  on public.vacaciones_movimientos (actor);
create index if not exists idx_vacaciones_movimientos_ausencia
  on public.vacaciones_movimientos (referencia_ausencia_id);

commit;
