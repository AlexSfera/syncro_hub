create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create table public.employees (
  id text primary key,
  nombre text not null,
  area text not null,
  puesto text,
  rol text not null,
  estado text not null,
  bitrix_user_id text,
  validador integer not null default 0
);

insert into public.employees (
  id, nombre, area, puesto, rol, estado, bitrix_user_id, validador
)
values
  ('E1', 'Empleado Uno', 'Cocina', 'Cocinero', 'empleado', 'Activo', 'B1', 0),
  ('E2', 'Responsable Dos', 'Cocina', 'Responsable', 'jefe', 'Activo', 'B2', 1);
