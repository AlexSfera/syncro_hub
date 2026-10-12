-- APPLIED with Alexander's specific authorization on 2026-10-12.
-- Supabase migration: 20261012192221 employee_notes_board.
-- Extends existing notes without replacing/deleting their original content.
BEGIN;
ALTER TABLE public.employee_notes
  ADD COLUMN titulo text NOT NULL DEFAULT '',
  ADD COLUMN modulo text NOT NULL DEFAULT '',
  ADD COLUMN estado text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN posicion bigint,
  ADD COLUMN respuesta text NOT NULL DEFAULT '',
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT employee_notes_board_state CHECK (estado IN ('pendiente','en_desarrollo','terminado','rechazado')),
  ADD CONSTRAINT employee_notes_board_version CHECK (version > 0),
  ADD CONSTRAINT employee_notes_board_rejection CHECK (estado <> 'rechazado' OR length(btrim(respuesta)) >= 3);

-- All notes access now goes through /api/suggestions, with trusted session/role
-- checks. Prevent bypass through the previously broad direct REST grants.
ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.employee_notes FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employee_notes TO service_role;

CREATE FUNCTION public.syncro_move_suggestion(
  p_id text, p_estado text, p_before_id text, p_respuesta text,
  p_expected_version integer, p_actor text
) RETURNS jsonb LANGUAGE plpgsql SET search_path = '' AS $body$
DECLARE
  current_note public.employee_notes;
  ids text[];
  anchor integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = p_actor AND rol = 'admin' AND estado = 'Activo') THEN
    RETURN jsonb_build_object('error','FORBIDDEN');
  END IF;
  IF p_estado IS NULL OR p_estado NOT IN ('pendiente','en_desarrollo','terminado','rechazado')
    OR p_respuesta IS NULL OR length(p_respuesta) > 2000
    OR (p_estado = 'rechazado' AND length(btrim(p_respuesta)) < 3)
    OR p_expected_version IS NULL OR p_expected_version < 1 OR p_before_id = p_id THEN
    RETURN jsonb_build_object('error','INVALID_REQUEST');
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(72943112);
  SELECT * INTO current_note FROM public.employee_notes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','NOT_FOUND'); END IF;
  IF current_note.version <> p_expected_version THEN RETURN jsonb_build_object('error','CONFLICT'); END IF;
  SELECT coalesce(array_agg(id ORDER BY posicion NULLS LAST, created_at, id), ARRAY[]::text[])
    INTO ids FROM public.employee_notes WHERE estado = p_estado AND id <> p_id;
  IF p_before_id IS NULL THEN
    ids := array_append(ids,p_id);
  ELSE
    anchor := array_position(ids,p_before_id);
    IF anchor IS NULL THEN RETURN jsonb_build_object('error','INVALID_ANCHOR'); END IF;
    ids := coalesce(ids[1:anchor-1], ARRAY[]::text[]) || ARRAY[p_id] || ids[anchor:array_length(ids,1)];
  END IF;
  UPDATE public.employee_notes SET estado = p_estado,
    respuesta = CASE WHEN p_estado = 'rechazado' THEN btrim(p_respuesta) ELSE '' END,
    leida = true WHERE id = p_id;
  UPDATE public.employee_notes n SET posicion = ordering.rank, version = n.version + 1, updated_at = now()
    FROM unnest(ids) WITH ORDINALITY AS ordering(id,rank)
    WHERE n.id = ordering.id AND (n.posicion IS DISTINCT FROM ordering.rank OR n.id = p_id);
  IF current_note.estado <> p_estado THEN
    UPDATE public.employee_notes n SET posicion = ordering.rank, version = n.version + 1, updated_at = now()
      FROM (SELECT id, row_number() OVER (ORDER BY posicion NULLS LAST, created_at, id) AS rank
        FROM public.employee_notes WHERE estado = current_note.estado) ordering
      WHERE n.id = ordering.id AND n.posicion IS DISTINCT FROM ordering.rank;
  END IF;
  SELECT * INTO current_note FROM public.employee_notes WHERE id = p_id;
  RETURN jsonb_build_object('record',to_jsonb(current_note));
END
$body$;
REVOKE ALL ON FUNCTION public.syncro_move_suggestion(text,text,text,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.syncro_move_suggestion(text,text,text,text,integer,text) TO service_role;
COMMIT;
