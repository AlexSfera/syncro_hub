-- PREPARED ONLY. Apply to LIVE only with specific authorization.
-- Narrows existing restrictive SELECT ceilings; no data, grants or write policies change.
BEGIN;
DO $check$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['employee_incentives','entrenadores_incentivos_mes','incentivos_liquidaciones','dept_incentive_rules'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=target
      AND policyname='syncro_finance_read_ceiling' AND permissive='RESTRICTIVE' AND cmd='SELECT') THEN
      RAISE EXCEPTION 'Missing restrictive financial read ceiling on %',target;
    END IF;
    EXECUTE format('ALTER POLICY syncro_finance_read_ceiling ON public.%I
      USING ((SELECT public.syncro_auth_context()->>''role'') = ''admin'')',target);
  END LOOP;
END
$check$;
COMMIT;
