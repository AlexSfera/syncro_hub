-- SYNCRO SHIFT - Planificacion horaria v1
-- PREPARADA, NO APLICADA A LIVE.
-- El acceso se realiza exclusivamente mediante backend con service_role.

begin;

create table public.convenios (
  id text primary key,
  codigo_oficial text not null unique,
  nombre text not null,
  ambito text not null,
  fuente_oficial_url text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint convenios_id_format check (id ~ '^[a-z0-9_]+$')
);

create table public.convenio_versiones (
  id text primary key,
  convenio_id text not null references public.convenios(id),
  version text not null,
  vigente_desde date not null,
  vigente_hasta date,
  unidad_vacaciones text not null check (unidad_vacaciones in ('natural', 'laborable')),
  vacaciones_anuales numeric(7,2) not null check (vacaciones_anuales > 0),
  jornada_anual_minutos integer not null check (jornada_anual_minutos > 0),
  reglas_json jsonb not null default '{}'::jsonb,
  fuente_publicacion text not null,
  verificado_por text,
  verificado_at timestamptz,
  created_at timestamptz not null default now(),
  unique (convenio_id, version),
  constraint convenio_versiones_vigencia check (
    vigente_hasta is null or vigente_hasta >= vigente_desde
  )
);

create table public.empleado_condiciones_laborales (
  id bigint generated always as identity primary key,
  empleado_id text not null references public.employees(id),
  convenio_version_id text not null references public.convenio_versiones(id),
  vigente_desde date not null,
  vigente_hasta date,
  fecha_inicio_contrato date not null,
  fecha_fin_contrato date,
  porcentaje_jornada numeric(6,3) not null check (porcentaje_jornada > 0 and porcentaje_jornada <= 100),
  minutos_semanales_contrato integer check (minutos_semanales_contrato > 0),
  minutos_anuales_contrato integer check (minutos_anuales_contrato > 0),
  centro_calendario_id text,
  condicion_mas_beneficiosa text,
  creado_por text not null references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empleado_condiciones_vigencia check (
    vigente_hasta is null or vigente_hasta >= vigente_desde
  ),
  constraint empleado_condiciones_contrato check (
    fecha_fin_contrato is null or fecha_fin_contrato >= fecha_inicio_contrato
  ),
  unique (empleado_id, vigente_desde)
);

create index empleado_condiciones_empleado_vigencia_idx
  on public.empleado_condiciones_laborales (empleado_id, vigente_desde desc, vigente_hasta);

create table public.bitrix_horarios_departamento (
  id bigint generated always as identity primary key,
  departamento_id text not null,
  bitrix_schedule_id bigint not null,
  tipo_uso text not null default 'principal_departamento'
    check (tipo_uso in ('principal_departamento', 'extra_recuperacion')),
  regla_aplicacion jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  ultima_lectura_at timestamptz,
  ultimo_resultado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (departamento_id, bitrix_schedule_id, tipo_uso)
);

create index bitrix_horarios_departamento_activo_idx
  on public.bitrix_horarios_departamento (departamento_id, tipo_uso)
  where activo;

create table public.bitrix_turnos_catalogo (
  id bigint generated always as identity primary key,
  bitrix_schedule_id bigint not null,
  bitrix_shift_id text not null,
  nombre text,
  inicio time,
  fin time,
  cruza_medianoche boolean not null default false,
  descanso_minutos integer not null default 0 check (descanso_minutos >= 0 and descanso_minutos <= 1440),
  tramos_json jsonb not null default '[]'::jsonb,
  activo boolean not null default true,
  source_updated_by text,
  source_snapshot jsonb not null default '{}'::jsonb,
  ultima_lectura_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bitrix_schedule_id, bitrix_shift_id),
  constraint bitrix_turnos_tramos_array check (jsonb_typeof(tramos_json) = 'array'),
  constraint bitrix_turnos_publicables check (
    not activo or (inicio is not null and fin is not null)
  )
);

create index bitrix_turnos_catalogo_activo_idx
  on public.bitrix_turnos_catalogo (bitrix_schedule_id, activo, bitrix_shift_id);

create table public.planificacion_semanas (
  id bigint generated always as identity primary key,
  departamento_id text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  version_actual integer not null default 0 check (version_actual >= 0),
  estado text not null default 'borrador' check (estado in (
    'borrador', 'validando', 'listo_para_publicar', 'publicando_bitrix',
    'publicacion_parcial', 'publicado_bitrix', 'error_publicacion',
    'rectificacion_pendiente', 'rectificando_bitrix', 'rectificado_bitrix'
  )),
  creado_por text not null references public.employees(id),
  modificado_por text not null references public.employees(id),
  publicado_por text references public.employees(id),
  publicado_at timestamptz,
  ultima_verificacion_at timestamptz,
  ultimo_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (departamento_id, fecha_inicio),
  constraint planificacion_semana_lunes check (extract(isodow from fecha_inicio) = 1),
  constraint planificacion_semana_siete_dias check (fecha_fin = fecha_inicio + 6)
);

create index planificacion_semanas_estado_idx
  on public.planificacion_semanas (estado, fecha_inicio desc);

create table public.planificacion_versiones (
  id bigint generated always as identity primary key,
  semana_id bigint not null references public.planificacion_semanas(id) on delete restrict,
  version integer not null check (version > 0),
  tipo text not null check (tipo in ('borrador', 'validacion', 'publicacion', 'rectificacion')),
  snapshot_json jsonb not null,
  motivo text,
  creado_por text not null references public.employees(id),
  created_at timestamptz not null default now(),
  unique (semana_id, version),
  constraint planificacion_versiones_snapshot_object check (jsonb_typeof(snapshot_json) = 'object'),
  constraint planificacion_versiones_motivo_rectificacion check (
    tipo <> 'rectificacion' or length(trim(coalesce(motivo, ''))) > 0
  )
);

create table public.planificacion_asignaciones (
  id bigint generated always as identity primary key,
  semana_id bigint not null references public.planificacion_semanas(id) on delete restrict,
  version integer not null check (version > 0),
  empleado_id text not null references public.employees(id),
  fecha_operativa date not null,
  tipo_dia text not null check (tipo_dia in (
    'turno', 'descanso', 'festivo', 'ausencia', 'vacaciones'
  )),
  turno_catalogo_id bigint references public.bitrix_turnos_catalogo(id),
  inicio timestamptz,
  fin timestamptz,
  cruza_medianoche boolean not null default false,
  descanso_minutos integer not null default 0 check (descanso_minutos >= 0 and descanso_minutos <= 1440),
  minutos_planificados integer check (minutos_planificados >= 0 and minutos_planificados <= 2880),
  bitrix_user_id_snapshot text,
  bitrix_schedule_id_snapshot bigint,
  bitrix_shift_id_snapshot text,
  sync_status text not null default 'sin_publicar' check (sync_status in (
    'sin_publicar', 'pendiente', 'enviado', 'verificado', 'error', 'no_soportado'
  )),
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semana_id, version, empleado_id, fecha_operativa),
  constraint planificacion_asignaciones_intervalo check (
    (tipo_dia = 'turno' and inicio is not null and fin is not null and fin > inicio)
    or (tipo_dia <> 'turno' and inicio is null and fin is null)
  )
);

-- La pertenencia de fecha_operativa al lunes-domingo de la semana se valida
-- en backend y en las pruebas; PostgreSQL no admite subconsultas en CHECK.

create index planificacion_asignaciones_semana_version_idx
  on public.planificacion_asignaciones (semana_id, version, empleado_id, fecha_operativa);

create index planificacion_asignaciones_empleado_fecha_idx
  on public.planificacion_asignaciones (empleado_id, fecha_operativa desc);

create table public.planificacion_tramos (
  id bigint generated always as identity primary key,
  asignacion_id bigint not null references public.planificacion_asignaciones(id) on delete cascade,
  orden smallint not null check (orden > 0 and orden <= 8),
  inicio timestamptz not null,
  fin timestamptz not null,
  cruza_medianoche boolean not null default false,
  bitrix_shift_id text,
  created_at timestamptz not null default now(),
  unique (asignacion_id, orden),
  constraint planificacion_tramos_intervalo check (fin > inicio)
);

create table public.planificacion_ausencias (
  id bigint generated always as identity primary key,
  empleado_id text not null references public.employees(id),
  fecha_inicio date not null,
  fecha_fin date not null,
  tipo_ausencia_id text not null,
  etiqueta_publica text not null,
  estado text not null default 'aprobada' check (estado in ('borrador', 'aprobada', 'rectificada', 'anulada')),
  origen text not null default 'syncro_shift' check (origen in ('syncro_shift', 'bitrix24', 'importacion')),
  version integer not null default 1 check (version > 0),
  reemplaza_ausencia_id bigint references public.planificacion_ausencias(id),
  motivo_cambio text,
  justificante_ref text,
  creado_por text not null references public.employees(id),
  modificado_por text not null references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planificacion_ausencias_fechas check (fecha_fin >= fecha_inicio)
);

create index planificacion_ausencias_empleado_fecha_idx
  on public.planificacion_ausencias (empleado_id, fecha_inicio, fecha_fin);

create table public.festivos_calendario (
  id bigint generated always as identity primary key,
  centro_calendario_id text not null,
  fecha date not null,
  nombre text,
  bitrix_schedule_id bigint,
  origen text not null default 'bitrix24' check (origen in ('bitrix24', 'manual_autorizado')),
  activo boolean not null default true,
  source_snapshot jsonb not null default '{}'::jsonb,
  ultima_lectura_at timestamptz,
  created_at timestamptz not null default now(),
  unique (centro_calendario_id, fecha)
);

create table public.vacaciones_movimientos (
  id bigint generated always as identity primary key,
  empleado_id text not null references public.employees(id),
  ejercicio smallint not null check (ejercicio between 2020 and 2100),
  tipo text not null check (tipo in ('apertura', 'devengo', 'consumo', 'devolucion', 'ajuste', 'arrastre')),
  unidad text not null check (unidad in ('natural', 'laborable')),
  dias numeric(9,2) not null,
  referencia_ausencia_id bigint references public.planificacion_ausencias(id),
  referencia_externa text,
  motivo text not null,
  actor text not null references public.employees(id),
  created_at timestamptz not null default now(),
  constraint vacaciones_movimientos_signo check (
    (tipo in ('apertura', 'devengo', 'devolucion', 'ajuste', 'arrastre') and dias <> 0)
    or (tipo = 'consumo' and dias < 0)
  )
);

create index vacaciones_movimientos_saldo_idx
  on public.vacaciones_movimientos (empleado_id, ejercicio, created_at);

create table public.extra_recuperacion_movimientos (
  id bigint generated always as identity primary key,
  empleado_id text not null references public.employees(id),
  fecha date not null,
  tipo text not null check (tipo in ('extra', 'recuperacion')),
  minutos integer not null check (minutos > 0 and minutos <= 1440),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'rectificado')),
  origen_planificacion_id bigint references public.planificacion_asignaciones(id),
  origen_fichaje_id text,
  creado_por text not null references public.employees(id),
  aprobado_por text references public.employees(id),
  motivo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extra_recuperacion_no_auto_creacion check (creado_por <> empleado_id),
  constraint extra_recuperacion_no_auto_aprobacion check (
    aprobado_por is null or aprobado_por <> empleado_id
  )
);

create index extra_recuperacion_empleado_fecha_idx
  on public.extra_recuperacion_movimientos (empleado_id, fecha desc);

create table public.planificacion_aprobaciones (
  id bigint generated always as identity primary key,
  objeto_tipo text not null check (objeto_tipo in ('semana', 'ausencia', 'extra_recuperacion', 'condicion_laboral')),
  objeto_id text not null,
  decision text not null check (decision in ('aprobado', 'rechazado', 'revocado')),
  actor text not null references public.employees(id),
  motivo text not null,
  created_at timestamptz not null default now()
);

create index planificacion_aprobaciones_objeto_idx
  on public.planificacion_aprobaciones (objeto_tipo, objeto_id, created_at desc);

create table public.planificacion_sync_log (
  id bigint generated always as identity primary key,
  semana_id bigint references public.planificacion_semanas(id) on delete restrict,
  version integer,
  asignacion_id bigint references public.planificacion_asignaciones(id) on delete restrict,
  operacion text not null,
  idempotency_key text not null unique,
  resultado_envio text not null,
  resultado_verificacion text,
  intentos integer not null default 1 check (intentos > 0 and intentos <= 20),
  error_seguro text,
  actor text not null references public.employees(id),
  request_snapshot jsonb not null default '{}'::jsonb,
  response_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index planificacion_sync_log_semana_idx
  on public.planificacion_sync_log (semana_id, version, created_at desc);

create table public.planificacion_audit (
  id bigint generated always as identity primary key,
  event_at timestamptz not null default now(),
  actor text not null references public.employees(id),
  accion text not null,
  entidad text not null,
  entidad_id text not null,
  departamento_id text,
  empleado_id text references public.employees(id),
  semana_id bigint references public.planificacion_semanas(id) on delete restrict,
  fecha_operativa date,
  valor_anterior jsonb,
  valor_nuevo jsonb,
  motivo text not null,
  resultado text not null,
  detalle_seguro jsonb not null default '{}'::jsonb
);

create index planificacion_audit_entidad_idx
  on public.planificacion_audit (entidad, entidad_id, event_at desc);
create index planificacion_audit_empleado_idx
  on public.planificacion_audit (empleado_id, event_at desc);

create or replace function public.planificacion_guardar_semana(
  p_departamento_id text,
  p_fecha_inicio date,
  p_expected_version integer,
  p_snapshot jsonb,
  p_actor text,
  p_tipo text default 'borrador',
  p_motivo text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_semana public.planificacion_semanas%rowtype;
  v_semana_id bigint;
  v_new_version integer;
  v_assignment jsonb;
  v_segment jsonb;
  v_assignment_id bigint;
  v_assignment_date date;
  v_old_state text;
  v_new_state text;
begin
  if p_departamento_id is null or length(trim(p_departamento_id)) = 0
     or extract(isodow from p_fecha_inicio) <> 1
     or p_expected_version < 0
     or jsonb_typeof(p_snapshot) <> 'object'
     or jsonb_typeof(coalesce(p_snapshot -> 'assignments', '[]'::jsonb)) <> 'array'
     or p_tipo not in ('borrador', 'rectificacion') then
    raise exception 'INVALID_PLANNING_REQUEST';
  end if;

  if p_tipo = 'rectificacion' and length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'RECTIFICATION_REASON_REQUIRED';
  end if;

  select * into v_semana
    from public.planificacion_semanas
   where departamento_id = p_departamento_id
     and fecha_inicio = p_fecha_inicio
   for update;

  if found then
    if v_semana.version_actual <> p_expected_version then
      raise exception 'VERSION_CONFLICT';
    end if;
    v_semana_id := v_semana.id;
    v_old_state := v_semana.estado;
  else
    if p_expected_version <> 0 then
      raise exception 'VERSION_CONFLICT';
    end if;
    insert into public.planificacion_semanas (
      departamento_id, fecha_inicio, fecha_fin, version_actual, estado,
      creado_por, modificado_por
    ) values (
      p_departamento_id, p_fecha_inicio, p_fecha_inicio + 6, 0, 'borrador',
      p_actor, p_actor
    ) returning id into v_semana_id;
    v_old_state := null;
  end if;

  v_new_version := p_expected_version + 1;
  v_new_state := case when p_tipo = 'rectificacion'
    then 'rectificacion_pendiente' else 'borrador' end;

  insert into public.planificacion_versiones (
    semana_id, version, tipo, snapshot_json, motivo, creado_por
  ) values (
    v_semana_id, v_new_version, p_tipo, p_snapshot, p_motivo, p_actor
  );

  for v_assignment in
    select value from jsonb_array_elements(coalesce(p_snapshot -> 'assignments', '[]'::jsonb))
  loop
    v_assignment_date := (v_assignment ->> 'fecha_operativa')::date;
    if v_assignment_date < p_fecha_inicio or v_assignment_date > p_fecha_inicio + 6 then
      raise exception 'ASSIGNMENT_OUTSIDE_WEEK';
    end if;

    insert into public.planificacion_asignaciones (
      semana_id, version, empleado_id, fecha_operativa, tipo_dia,
      turno_catalogo_id, inicio, fin, cruza_medianoche,
      descanso_minutos, minutos_planificados, bitrix_user_id_snapshot,
      bitrix_schedule_id_snapshot, bitrix_shift_id_snapshot
    ) values (
      v_semana_id,
      v_new_version,
      v_assignment ->> 'empleado_id',
      v_assignment_date,
      v_assignment ->> 'tipo_dia',
      nullif(v_assignment ->> 'turno_catalogo_id', '')::bigint,
      nullif(v_assignment ->> 'inicio', '')::timestamptz,
      nullif(v_assignment ->> 'fin', '')::timestamptz,
      coalesce((v_assignment ->> 'cruza_medianoche')::boolean, false),
      coalesce((v_assignment ->> 'descanso_minutos')::integer, 0),
      nullif(v_assignment ->> 'minutos_planificados', '')::integer,
      nullif(v_assignment ->> 'bitrix_user_id_snapshot', ''),
      nullif(v_assignment ->> 'bitrix_schedule_id_snapshot', '')::bigint,
      nullif(v_assignment ->> 'bitrix_shift_id_snapshot', '')
    ) returning id into v_assignment_id;

    for v_segment in
      select value from jsonb_array_elements(coalesce(v_assignment -> 'tramos', '[]'::jsonb))
    loop
      insert into public.planificacion_tramos (
        asignacion_id, orden, inicio, fin, cruza_medianoche, bitrix_shift_id
      ) values (
        v_assignment_id,
        (v_segment ->> 'orden')::smallint,
        (v_segment ->> 'inicio')::timestamptz,
        (v_segment ->> 'fin')::timestamptz,
        coalesce((v_segment ->> 'cruza_medianoche')::boolean, false),
        nullif(v_segment ->> 'bitrix_shift_id', '')
      );
    end loop;
  end loop;

  update public.planificacion_semanas
     set version_actual = v_new_version,
         estado = v_new_state,
         modificado_por = p_actor,
         updated_at = now(),
         ultimo_error = null
   where id = v_semana_id;

  insert into public.planificacion_audit (
    actor, accion, entidad, entidad_id, departamento_id, semana_id,
    valor_anterior, valor_nuevo, motivo, resultado
  ) values (
    p_actor,
    case when p_tipo = 'rectificacion' then 'RECTIFICAR_SEMANA' else 'GUARDAR_BORRADOR' end,
    'planificacion_semana',
    v_semana_id::text,
    p_departamento_id,
    v_semana_id,
    jsonb_build_object('version', p_expected_version, 'estado', v_old_state),
    jsonb_build_object('version', v_new_version, 'estado', v_new_state),
    coalesce(p_motivo, 'Guardado de borrador'),
    'ok'
  );

  return jsonb_build_object(
    'semana_id', v_semana_id,
    'version', v_new_version,
    'estado', v_new_state
  );
end;
$$;

create or replace function public.planificacion_guardar_ausencia(
  p_empleado_id text,
  p_fecha_inicio date,
  p_fecha_fin date,
  p_tipo_ausencia_id text,
  p_etiqueta_publica text,
  p_actor text,
  p_motivo text,
  p_reemplaza_ausencia_id bigint default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_previous public.planificacion_ausencias%rowtype;
  v_new_id bigint;
  v_version integer := 1;
begin
  if p_fecha_fin < p_fecha_inicio
     or length(trim(coalesce(p_tipo_ausencia_id, ''))) = 0
     or length(trim(coalesce(p_etiqueta_publica, ''))) = 0
     or length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'INVALID_ABSENCE_REQUEST';
  end if;

  if p_reemplaza_ausencia_id is not null then
    select * into v_previous
      from public.planificacion_ausencias
     where id = p_reemplaza_ausencia_id
     for update;
    if not found or v_previous.empleado_id <> p_empleado_id then
      raise exception 'ABSENCE_NOT_FOUND';
    end if;
    v_version := v_previous.version + 1;
    update public.planificacion_ausencias
       set estado = 'rectificada',
           modificado_por = p_actor,
           updated_at = now()
     where id = p_reemplaza_ausencia_id;
  end if;

  insert into public.planificacion_ausencias (
    empleado_id, fecha_inicio, fecha_fin, tipo_ausencia_id,
    etiqueta_publica, estado, origen, version, reemplaza_ausencia_id,
    motivo_cambio, creado_por, modificado_por
  ) values (
    p_empleado_id, p_fecha_inicio, p_fecha_fin, p_tipo_ausencia_id,
    p_etiqueta_publica, 'aprobada', 'syncro_shift', v_version,
    p_reemplaza_ausencia_id, p_motivo, p_actor, p_actor
  ) returning id into v_new_id;

  insert into public.planificacion_audit (
    actor, accion, entidad, entidad_id, empleado_id, fecha_operativa,
    valor_anterior, valor_nuevo, motivo, resultado
  ) values (
    p_actor,
    case when p_reemplaza_ausencia_id is null then 'CREAR_AUSENCIA' else 'RECTIFICAR_AUSENCIA' end,
    'planificacion_ausencia',
    v_new_id::text,
    p_empleado_id,
    p_fecha_inicio,
    case when p_reemplaza_ausencia_id is null then null else to_jsonb(v_previous) end,
    jsonb_build_object(
      'fecha_inicio', p_fecha_inicio,
      'fecha_fin', p_fecha_fin,
      'tipo_ausencia_id', p_tipo_ausencia_id,
      'etiqueta_publica', p_etiqueta_publica,
      'version', v_version
    ),
    p_motivo,
    'ok'
  );

  return jsonb_build_object('id', v_new_id, 'version', v_version, 'estado', 'aprobada');
end;
$$;

create or replace function public.planificacion_guardar_extra_recuperacion(
  p_empleado_id text,
  p_fecha date,
  p_tipo text,
  p_minutos integer,
  p_actor text,
  p_aprobador text,
  p_motivo text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
  v_estado text;
begin
  if p_tipo not in ('extra', 'recuperacion')
     or p_minutos <= 0 or p_minutos > 1440
     or p_actor = p_empleado_id
     or p_aprobador = p_empleado_id
     or length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'INVALID_EXTRA_RECOVERY_REQUEST';
  end if;
  v_estado := case when p_aprobador is null then 'pendiente' else 'aprobado' end;

  insert into public.extra_recuperacion_movimientos (
    empleado_id, fecha, tipo, minutos, estado, creado_por, aprobado_por, motivo
  ) values (
    p_empleado_id, p_fecha, p_tipo, p_minutos, v_estado, p_actor, p_aprobador, p_motivo
  ) returning id into v_id;

  insert into public.planificacion_audit (
    actor, accion, entidad, entidad_id, empleado_id, fecha_operativa,
    valor_nuevo, motivo, resultado
  ) values (
    p_actor,
    case when p_tipo = 'extra' then 'REGISTRAR_HORA_EXTRA' else 'REGISTRAR_RECUPERACION' end,
    'extra_recuperacion',
    v_id::text,
    p_empleado_id,
    p_fecha,
    jsonb_build_object('tipo', p_tipo, 'minutos', p_minutos, 'estado', v_estado, 'aprobador', p_aprobador),
    p_motivo,
    'ok'
  );

  return jsonb_build_object('id', v_id, 'estado', v_estado);
end;
$$;

create or replace function public.planificacion_guardar_condicion_laboral(
  p_empleado_id text,
  p_convenio_version_id text,
  p_vigente_desde date,
  p_fecha_inicio_contrato date,
  p_fecha_fin_contrato date,
  p_porcentaje_jornada numeric,
  p_minutos_semanales integer,
  p_minutos_anuales integer,
  p_centro_calendario_id text,
  p_condicion_mas_beneficiosa text,
  p_actor text,
  p_motivo text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_previous public.empleado_condiciones_laborales%rowtype;
  v_new_id bigint;
begin
  if p_vigente_desde < p_fecha_inicio_contrato
     or (p_fecha_fin_contrato is not null and p_fecha_fin_contrato < p_fecha_inicio_contrato)
     or p_porcentaje_jornada <= 0 or p_porcentaje_jornada > 100
     or length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'INVALID_LABOR_CONDITION_REQUEST';
  end if;

  select * into v_previous
    from public.empleado_condiciones_laborales
   where empleado_id = p_empleado_id
     and vigente_hasta is null
   order by vigente_desde desc
   limit 1
   for update;

  if found then
    if p_vigente_desde <= v_previous.vigente_desde then
      raise exception 'LABOR_CONDITION_DATE_CONFLICT';
    end if;
    update public.empleado_condiciones_laborales
       set vigente_hasta = p_vigente_desde - 1,
           updated_at = now()
     where id = v_previous.id;
  end if;

  insert into public.empleado_condiciones_laborales (
    empleado_id, convenio_version_id, vigente_desde, fecha_inicio_contrato,
    fecha_fin_contrato, porcentaje_jornada, minutos_semanales_contrato,
    minutos_anuales_contrato, centro_calendario_id,
    condicion_mas_beneficiosa, creado_por
  ) values (
    p_empleado_id, p_convenio_version_id, p_vigente_desde,
    p_fecha_inicio_contrato, p_fecha_fin_contrato, p_porcentaje_jornada,
    p_minutos_semanales, p_minutos_anuales, p_centro_calendario_id,
    p_condicion_mas_beneficiosa, p_actor
  ) returning id into v_new_id;

  insert into public.planificacion_audit (
    actor, accion, entidad, entidad_id, empleado_id,
    valor_anterior, valor_nuevo, motivo, resultado
  ) values (
    p_actor,
    'CAMBIAR_CONDICION_LABORAL',
    'empleado_condicion_laboral',
    v_new_id::text,
    p_empleado_id,
    case when v_previous.id is null then null else to_jsonb(v_previous) end,
    jsonb_build_object(
      'convenio_version_id', p_convenio_version_id,
      'vigente_desde', p_vigente_desde,
      'fecha_inicio_contrato', p_fecha_inicio_contrato,
      'fecha_fin_contrato', p_fecha_fin_contrato,
      'porcentaje_jornada', p_porcentaje_jornada,
      'minutos_semanales_contrato', p_minutos_semanales,
      'minutos_anuales_contrato', p_minutos_anuales,
      'centro_calendario_id', p_centro_calendario_id
    ),
    p_motivo,
    'ok'
  );

  return jsonb_build_object('id', v_new_id, 'vigente_desde', p_vigente_desde);
end;
$$;

create or replace function public.planificacion_prevent_history_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'planning history is append-only';
end;
$$;

create trigger planificacion_versiones_append_only
before update or delete on public.planificacion_versiones
for each row execute function public.planificacion_prevent_history_mutation();

create trigger vacaciones_movimientos_append_only
before update or delete on public.vacaciones_movimientos
for each row execute function public.planificacion_prevent_history_mutation();

create trigger planificacion_sync_log_append_only
before update or delete on public.planificacion_sync_log
for each row execute function public.planificacion_prevent_history_mutation();

create trigger planificacion_audit_append_only
before update or delete on public.planificacion_audit
for each row execute function public.planificacion_prevent_history_mutation();

insert into public.convenios (id, codigo_oficial, nombre, ambito, fuente_oficial_url)
values
  (
    'hosteleria_alicante',
    '03000425011982',
    'Convenio de Hosteleria de Alicante',
    'provincial',
    'https://www.dip-alicante.es/bop2/pdftotal/2023/10/18_200/2023_008879.pdf'
  ),
  (
    'instalaciones_deportivas_estatal',
    '99015105012005',
    'Convenio de Instalaciones Deportivas',
    'estatal',
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2024-1506'
  );

insert into public.convenio_versiones (
  id, convenio_id, version, vigente_desde, vigente_hasta,
  unidad_vacaciones, vacaciones_anuales, jornada_anual_minutos,
  reglas_json, fuente_publicacion
)
values
  (
    'hosteleria_alicante_2023_2026',
    'hosteleria_alicante',
    '2023-2026',
    date '2023-01-01',
    date '2026-12-31',
    'natural',
    31,
    107798,
    '{"prorrateo":"dias_alta_ejercicio","arrastre":"primer_trimestre_con_acuerdo"}'::jsonb,
    'BOP Alicante 200 de 18/10/2023'
  ),
  (
    'instalaciones_deportivas_2024',
    'instalaciones_deportivas_estatal',
    'V-2024',
    date '2024-01-01',
    null,
    'laborable',
    23,
    105120,
    '{"prorrateo":"dias_alta_ejercicio","extra_festivo_descanso_factor":1.75,"extra_otro_dia_descanso_factor":1.5}'::jsonb,
    'BOE 23 de 26/01/2024'
  );

insert into public.bitrix_horarios_departamento (
  departamento_id, bitrix_schedule_id, tipo_uso, regla_aplicacion
)
values
  ('Cocina', 55, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Sala', 47, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Housekeeping', 41, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Mantenimiento', 63, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Recepción SYNCROLAB', 33, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Recepción', 35, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Fisioterapeutas', 51, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('RRHH', 91, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Comercial', 43, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Marketing', 45, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('Dirección Comercial', 95, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('C&C', 87, 'principal_departamento', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb),
  ('*', 85, 'extra_recuperacion', '{"fuente":"inventario_verificado_2026_09_29"}'::jsonb);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'convenios', 'convenio_versiones', 'empleado_condiciones_laborales',
    'bitrix_horarios_departamento', 'bitrix_turnos_catalogo',
    'planificacion_semanas', 'planificacion_versiones',
    'planificacion_asignaciones', 'planificacion_tramos',
    'planificacion_ausencias', 'festivos_calendario',
    'vacaciones_movimientos', 'extra_recuperacion_movimientos',
    'planificacion_aprobaciones', 'planificacion_sync_log',
    'planificacion_audit'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;

revoke all on function public.planificacion_prevent_history_mutation() from public, anon, authenticated;
grant execute on function public.planificacion_prevent_history_mutation() to service_role;
revoke all on function public.planificacion_guardar_semana(text, date, integer, jsonb, text, text, text)
  from public, anon, authenticated;
grant execute on function public.planificacion_guardar_semana(text, date, integer, jsonb, text, text, text)
  to service_role;
revoke all on function public.planificacion_guardar_ausencia(text, date, date, text, text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.planificacion_guardar_ausencia(text, date, date, text, text, text, text, bigint)
  to service_role;
revoke all on function public.planificacion_guardar_extra_recuperacion(text, date, text, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.planificacion_guardar_extra_recuperacion(text, date, text, integer, text, text, text)
  to service_role;
revoke all on function public.planificacion_guardar_condicion_laboral(text, text, date, date, date, numeric, integer, integer, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.planificacion_guardar_condicion_laboral(text, text, date, date, date, numeric, integer, integer, text, text, text, text)
  to service_role;

grant usage, select on sequence
  public.empleado_condiciones_laborales_id_seq,
  public.bitrix_horarios_departamento_id_seq,
  public.bitrix_turnos_catalogo_id_seq,
  public.planificacion_semanas_id_seq,
  public.planificacion_versiones_id_seq,
  public.planificacion_asignaciones_id_seq,
  public.planificacion_tramos_id_seq,
  public.planificacion_ausencias_id_seq,
  public.festivos_calendario_id_seq,
  public.vacaciones_movimientos_id_seq,
  public.extra_recuperacion_movimientos_id_seq,
  public.planificacion_aprobaciones_id_seq,
  public.planificacion_sync_log_id_seq,
  public.planificacion_audit_id_seq
to service_role;

comment on table public.planificacion_semanas is
  'Semanas de planificacion. Sin policies directas: acceso exclusivo por backend autorizado.';
comment on table public.planificacion_audit is
  'Auditoria append-only de cambios de planificacion, ausencias, convenios, extras y recuperacion.';

commit;
