-- Secure authentication stores PIN fingerprints in syncro_auth_identities.
-- New employees therefore have no plaintext PIN in the legacy employees table.

begin;

alter table if exists public.employees
  alter column pin drop not null;

comment on column public.employees.pin is
  'Legacy PIN field. Secure-auth employees keep this null; authentication data lives in syncro_auth_identities.';

commit;
