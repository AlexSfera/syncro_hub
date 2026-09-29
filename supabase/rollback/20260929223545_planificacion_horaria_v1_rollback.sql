-- Rollback seguro de Planificacion Horaria v1.
-- Solo permite retirar el esquema si no contiene datos operativos.

begin;

do $$
declare
  populated_tables text[] := array[]::text[];
  table_name text;
  row_exists boolean;
begin
  foreach table_name in array array[
    'empleado_condiciones_laborales', 'bitrix_turnos_catalogo',
    'planificacion_semanas',
    'planificacion_versiones', 'planificacion_asignaciones',
    'planificacion_tramos', 'planificacion_ausencias',
    'festivos_calendario', 'vacaciones_movimientos',
    'extra_recuperacion_movimientos', 'planificacion_aprobaciones',
    'planificacion_sync_log', 'planificacion_audit'
  ] loop
    execute format('select exists (select 1 from public.%I limit 1)', table_name)
      into row_exists;
    if row_exists then
      populated_tables := array_append(populated_tables, table_name);
    end if;
  end loop;

  if cardinality(populated_tables) > 0 then
    raise exception 'Rollback detenido: existen datos en %', array_to_string(populated_tables, ', ');
  end if;
end;
$$;

drop function public.planificacion_guardar_semana(text, date, integer, jsonb, text, text, text);
drop function public.planificacion_guardar_ausencia(text, date, date, text, text, text, text, bigint);
drop function public.planificacion_guardar_extra_recuperacion(text, date, text, integer, text, text, text);
drop function public.planificacion_guardar_condicion_laboral(text, text, date, date, date, numeric, integer, integer, text, text, text, text);
drop trigger planificacion_versiones_append_only on public.planificacion_versiones;
drop trigger vacaciones_movimientos_append_only on public.vacaciones_movimientos;
drop trigger planificacion_sync_log_append_only on public.planificacion_sync_log;
drop trigger planificacion_audit_append_only on public.planificacion_audit;
drop function public.planificacion_prevent_history_mutation();

drop table public.planificacion_audit;
drop table public.planificacion_sync_log;
drop table public.planificacion_aprobaciones;
drop table public.extra_recuperacion_movimientos;
drop table public.vacaciones_movimientos;
drop table public.festivos_calendario;
drop table public.planificacion_ausencias;
drop table public.planificacion_tramos;
drop table public.planificacion_asignaciones;
drop table public.planificacion_versiones;
drop table public.planificacion_semanas;
drop table public.bitrix_turnos_catalogo;
drop table public.bitrix_horarios_departamento;
drop table public.empleado_condiciones_laborales;
drop table public.convenio_versiones;
drop table public.convenios;

commit;
