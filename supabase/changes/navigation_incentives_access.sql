-- PREPARED ONLY. Requires specific authorization before applying to LIVE.
-- No data updates, migrations of balances, grants or role assignments.
-- Keep existing containment policies; restrictive ceilings intersect them.
BEGIN;

DO $check$
DECLARE target text;
BEGIN
  IF to_regprocedure('public.syncro_auth_context()') IS NULL THEN
    RAISE EXCEPTION 'Missing trusted authentication context';
  END IF;
  FOREACH target IN ARRAY ARRAY['employees','employee_incentives',
    'entrenadores_incentivos_mes','incentivos_liquidaciones','dept_incentive_rules'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=target AND c.relrowsecurity) THEN
      RAISE EXCEPTION 'Missing RLS on %', target;
    END IF;
  END LOOP;
END
$check$;

DO $policies$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['employees','employee_incentives',
    'entrenadores_incentivos_mes','incentivos_liquidaciones','dept_incentive_rules'] LOOP
    EXECUTE format('CREATE POLICY syncro_finance_read_ceiling ON public.%I AS RESTRICTIVE
      FOR SELECT TO anon, authenticated
      USING ((SELECT public.syncro_auth_context()->>''role'') IN (''admin'',''contable'')
        AND (%L <> ''employees'' OR (SELECT public.syncro_auth_context()->>''role'') = ''admin''))',target,target);
    EXECUTE format('CREATE POLICY syncro_finance_insert_ceiling ON public.%I AS RESTRICTIVE
      FOR INSERT TO anon, authenticated
      WITH CHECK ((SELECT public.syncro_auth_context()->>''role'') = ''admin'')',target);
    EXECUTE format('CREATE POLICY syncro_finance_update_ceiling ON public.%I AS RESTRICTIVE
      FOR UPDATE TO anon, authenticated
      USING ((SELECT public.syncro_auth_context()->>''role'') = ''admin'')
      WITH CHECK ((SELECT public.syncro_auth_context()->>''role'') = ''admin'')',target);
    EXECUTE format('CREATE POLICY syncro_finance_delete_ceiling ON public.%I AS RESTRICTIVE
      FOR DELETE TO anon, authenticated
      USING ((SELECT public.syncro_auth_context()->>''role'') = ''admin'')',target);
  END LOOP;
END
$policies$;

-- employees is protected too: otherwise a client could change its own role.
-- Employee/team/accounting access continues through /api/auth/employees with projection.
-- Accounting cannot read raw employees (identity secrets and unrelated personal fields).
-- HK table and its four SECURITY DEFINER RPCs already have service-only grants.

CREATE FUNCTION public.syncro_preserve_settled_trainer_incentive()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $trigger$
BEGIN
  IF OLD.liquidado IS TRUE THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Settled incentive cannot be deleted'; END IF;
    IF NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Settled incentive cannot be changed'; END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$trigger$;
REVOKE ALL ON FUNCTION public.syncro_preserve_settled_trainer_incentive() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER syncro_preserve_settled_trainer
BEFORE UPDATE OR DELETE ON public.entrenadores_incentivos_mes
FOR EACH ROW EXECUTE FUNCTION public.syncro_preserve_settled_trainer_incentive();

COMMIT;
