-- Roll back only this release's guards. Does not delete rows or audit history.
-- WARNING: restores the broad previous access; use only with explicit approval.
BEGIN;
DROP TRIGGER IF EXISTS syncro_preserve_settled_trainer ON public.entrenadores_incentivos_mes;
DROP FUNCTION IF EXISTS public.syncro_preserve_settled_trainer_incentive();
DO $policies$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['employees','employee_incentives',
    'entrenadores_incentivos_mes','incentivos_liquidaciones','dept_incentive_rules'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS syncro_finance_read_ceiling ON public.%I',target);
    EXECUTE format('DROP POLICY IF EXISTS syncro_finance_insert_ceiling ON public.%I',target);
    EXECUTE format('DROP POLICY IF EXISTS syncro_finance_update_ceiling ON public.%I',target);
    EXECUTE format('DROP POLICY IF EXISTS syncro_finance_delete_ceiling ON public.%I',target);
  END LOOP;
END
$policies$;
COMMIT;
