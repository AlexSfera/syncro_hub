-- SAFE APP ROLLBACK: redeploy cc47b4c and restore these exact former grants.
-- Keep workflow columns/data/function: do not erase suggestions or decisions.
-- Requires specific authorization; never execute automatically against LIVE.
BEGIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_notes TO authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.employee_notes FROM anon;
COMMIT;
