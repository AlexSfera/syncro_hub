-- Requires specific authorization: restores the previous accounting read access.
BEGIN;
DO $rollback$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['employee_incentives','entrenadores_incentivos_mes','incentivos_liquidaciones','dept_incentive_rules'] LOOP
    EXECUTE format('ALTER POLICY syncro_finance_read_ceiling ON public.%I
      USING ((SELECT public.syncro_auth_context()->>''role'') IN (''admin'',''contable''))',target);
  END LOOP;
END
$rollback$;
COMMIT;
