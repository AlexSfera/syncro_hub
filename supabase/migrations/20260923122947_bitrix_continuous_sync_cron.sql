-- Sincronización frecuente Bitrix24 → SynchroShift sin depender del límite
-- diario de Vercel Hobby. El secreto se guarda previamente en Supabase Vault
-- con el nombre `syncro_bitrix_cron_secret`; nunca se incluye en el repositorio.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'syncro_bitrix_cron_secret'
  ) then
    raise exception 'Missing Vault secret: syncro_bitrix_cron_secret';
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'syncro-bitrix-hours-continuous';
end;
$$;

select cron.schedule(
  'syncro-bitrix-hours-continuous',
  '*/15 * * * *',
  $job$
    select net.http_post(
      url := 'https://syncro-shift.vercel.app/api/bitrix-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'syncro_bitrix_cron_secret'
          limit 1
        )
      ),
      body := jsonb_build_object(
        'source', 'supabase_cron',
        'requested_at', now()
      ),
      timeout_milliseconds := 300000
    ) as request_id;
  $job$
);
