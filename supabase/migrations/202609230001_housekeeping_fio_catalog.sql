-- Catálogo definitivo FIO · Housekeeping · 2026-09-23
-- Reduce el catálogo operativo de 14 a 9 tipologías agrupadas.
-- Reglas de uso:
--   · L2 o superior exige evidencia verificable.
--   · Limpieza/higiene escala a L3 si afecta a cliente o punto crítico.
--   · Tarea no realizada escala a L4 ante cierre falso deliberado.
--   · "Otro fallo" es provisional y debe reclasificarse antes de validar.
--   · Puntualidad/ausencia se controla en Bitrix24, no en FIO Housekeeping.

begin;

update fio_catalog
set activo = false
where lower(trim(departamento)) in ('housekeeping', 'hk', 'limpieza');

insert into fio_catalog
  (id, departamento, categoria, nombre, nivel_default, puntos_default, critico, activo, requiere_ev)
values
  ('HK26-01', 'Housekeeping', 'Calidad',       'Limpieza o higiene incorrectas',                'L2', 1,  false, true, true),
  ('HK26-02', 'Housekeeping', 'Preparación',   'Preparación o reposición incorrectas',          'L2', 1,  false, true, true),
  ('HK26-03', 'Housekeeping', 'Ejecución',     'Tarea asignada no realizada',                   'L2', 1,  false, true, true),
  ('HK26-04', 'Housekeeping', 'Operación',     'Habitación no lista o estado incorrecto',       'L3', 5,  false, true, true),
  ('HK26-05', 'Housekeeping', 'Control',       'Inspección o incidencia no gestionada',         'L3', 5,  false, true, true),
  ('HK26-06', 'Housekeeping', 'Procedimiento', 'Residuos, destripe o lencería mal gestionados', 'L1', 1,  false, true, false),
  ('HK26-07', 'Housekeeping', 'Comunicación',  'Comunicación o informe incompletos',             'L2', 1,  false, true, true),
  ('HK26-08', 'Housekeeping', 'Seguridad',     'Incumplimiento de seguridad o privacidad',      'L4', 15, true,  true, true),
  ('HK26-09', 'Housekeeping', 'Otro',          'Otro fallo de Housekeeping — reclasificar',      'L0', 0,  false, true, false)
on conflict (id) do update set
  departamento   = excluded.departamento,
  categoria      = excluded.categoria,
  nombre         = excluded.nombre,
  nivel_default  = excluded.nivel_default,
  puntos_default = excluded.puntos_default,
  critico        = excluded.critico,
  activo         = excluded.activo,
  requiere_ev    = excluded.requiere_ev;

commit;
