-- Reversión segura: desactiva únicamente el trabajo creado por esta migración.
-- Las extensiones se conservan porque podrían ser utilizadas por otros procesos.

do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'syncro-bitrix-hours-continuous';
  end if;
end;
$$;
