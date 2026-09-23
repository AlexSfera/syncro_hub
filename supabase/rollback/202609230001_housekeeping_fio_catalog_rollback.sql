-- Reversión funcional del catálogo FIO Housekeeping 2026.
-- Desactiva las nueve tipologías nuevas y reactiva el catálogo anterior
-- sin modificar nombres, niveles ni históricos FIO existentes.

begin;

update fio_catalog
set activo = false
where id in (
  'HK26-01','HK26-02','HK26-03','HK26-04','HK26-05',
  'HK26-06','HK26-07','HK26-08','HK26-09'
);

update fio_catalog
set activo = true
where lower(trim(departamento)) in ('housekeeping', 'hk', 'limpieza')
  and id not in (
    'HK26-01','HK26-02','HK26-03','HK26-04','HK26-05',
    'HK26-06','HK26-07','HK26-08','HK26-09'
  );

commit;
