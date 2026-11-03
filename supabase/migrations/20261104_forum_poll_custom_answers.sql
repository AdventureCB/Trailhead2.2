-- ============================================================================
-- FORUM POLLS — voter write-in answers
-- ============================================================================
-- A poll section may set `allowCustom: true`. Voters can then add their own
-- answer: `forum_poll_add_option` appends `{id, label, custom:true, added_by}`
-- to that poll's options inside forum_threads.sections (SECURITY DEFINER —
-- voters can't update threads directly), and the client casts a normal vote
-- for the new id. Dedupes case-insensitively so "33s" and "33S" merge; caps a
-- poll at 30 options. The existing vote RLS (option id must exist in the
-- section) keeps working because the option is now in the section.
-- Idempotent.
-- ============================================================================

create or replace function public.forum_poll_add_option(p_thread_id uuid, p_poll_id text, p_label text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid     uuid := auth.uid();
  v_label   text := left(regexp_replace(coalesce(p_label, ''), '\s+', ' ', 'g'), 80);
  v_sections jsonb;
  v_sec     jsonb;
  v_idx     int := -1;
  v_i       int := 0;
  v_opt     jsonb;
  v_new_id  text;
  v_opts    jsonb;
begin
  if v_uid is null then raise exception 'sign in to add an answer'; end if;
  v_label := trim(v_label);
  if v_label = '' then raise exception 'answer required'; end if;
  select sections into v_sections from public.forum_threads where id = p_thread_id and hidden_at is null for update;
  if v_sections is null then raise exception 'thread not found'; end if;
  for v_sec in select * from jsonb_array_elements(v_sections) loop
    if v_sec->>'type' = 'poll' and v_sec->>'pollId' = p_poll_id then v_idx := v_i; exit; end if;
    v_i := v_i + 1;
  end loop;
  if v_idx < 0 then raise exception 'poll not found'; end if;
  v_sec := v_sections->v_idx;
  if coalesce((v_sec->>'allowCustom')::boolean, false) is not true then raise exception 'this poll does not accept write-in answers'; end if;
  if v_sec->>'closesAt' is not null and (v_sec->>'closesAt')::timestamptz <= now() then raise exception 'poll is closed'; end if;
  v_opts := coalesce(v_sec->'options', '[]'::jsonb);
  -- Existing option with the same label (case-insensitive) → reuse it.
  for v_opt in select * from jsonb_array_elements(v_opts) loop
    if lower(trim(coalesce(v_opt->>'label', ''))) = lower(v_label) then
      return jsonb_build_object('ok', true, 'id', v_opt->>'id', 'label', v_opt->>'label', 'existing', true);
    end if;
  end loop;
  if jsonb_array_length(v_opts) >= 30 then raise exception 'this poll already has the maximum number of answers'; end if;
  v_new_id := 'o_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  v_opts := v_opts || jsonb_build_array(jsonb_build_object('id', v_new_id, 'label', v_label, 'custom', true, 'added_by', v_uid));
  v_sec := jsonb_set(v_sec, '{options}', v_opts);
  v_sections := jsonb_set(v_sections, array[v_idx::text], v_sec);
  -- Intentionally NOT touching updated_at: a write-in isn't an edit of the thread.
  update public.forum_threads set sections = v_sections where id = p_thread_id;
  return jsonb_build_object('ok', true, 'id', v_new_id, 'label', v_label, 'existing', false);
end;
$$;
grant execute on function public.forum_poll_add_option(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
