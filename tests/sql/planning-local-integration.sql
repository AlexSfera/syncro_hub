do $$
declare
  v_catalog_id bigint;
  v_result jsonb;
begin
  insert into public.bitrix_turnos_catalogo (
    bitrix_schedule_id, bitrix_shift_id, nombre, inicio, fin,
    cruza_medianoche, activo, ultima_lectura_at
  ) values (
    55, 'T1', 'Turno prueba', time '08:00', time '16:00', false, true, now()
  ) returning id into v_catalog_id;

  select public.planificacion_guardar_semana(
    'Cocina', date '2026-09-28', 0,
    jsonb_build_object(
      'department', 'Cocina',
      'week_start', '2026-09-28',
      'assignments', jsonb_build_array(jsonb_build_object(
        'empleado_id', 'E1',
        'fecha_operativa', '2026-09-28',
        'tipo_dia', 'turno',
        'turno_catalogo_id', v_catalog_id,
        'inicio', '2026-09-28T08:00:00+02:00',
        'fin', '2026-09-28T16:00:00+02:00',
        'cruza_medianoche', false,
        'descanso_minutos', 30,
        'minutos_planificados', 480,
        'bitrix_user_id_snapshot', 'B1',
        'bitrix_schedule_id_snapshot', 55,
        'bitrix_shift_id_snapshot', 'T1',
        'tramos', jsonb_build_array(jsonb_build_object(
          'orden', 1,
          'inicio', '2026-09-28T08:00:00+02:00',
          'fin', '2026-09-28T16:00:00+02:00',
          'cruza_medianoche', false,
          'bitrix_shift_id', 'T1'
        ))
      ))
    ),
    'E2', 'borrador', null
  ) into v_result;

  if v_result ->> 'estado' <> 'borrador' then
    raise exception 'WEEK_SAVE_ASSERTION_FAILED';
  end if;

  begin
    perform public.planificacion_guardar_extra_recuperacion(
      'E2', date '2026-09-29', 'extra', 60, 'E2', null, 'Prueba controlada'
    );
    raise exception 'SELF_ASSIGNMENT_WAS_NOT_BLOCKED';
  exception when others then
    if sqlerrm <> 'INVALID_EXTRA_RECOVERY_REQUEST' then raise; end if;
  end;

  begin
    update public.planificacion_audit set resultado = 'alterado' where true;
    raise exception 'APPEND_ONLY_WAS_NOT_BLOCKED';
  exception when others then
    if sqlerrm <> 'planning history is append-only' then raise; end if;
  end;
end;
$$;

select case when count(*) = 1 then 'planning_local_integration_ok'
  else 'planning_local_integration_failed' end as result
from public.planificacion_semanas;
