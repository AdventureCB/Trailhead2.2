-- 2026-07-23: Tap-through link on admin push broadcasts.
--
-- The broadcast-push edge function hardcoded data.url = "/" so tapping an
-- admin broadcast always landed on the app home. Add an optional link the
-- admin can set in the Push composer; the SW routes the tap to it (in-app
-- path or full https:// URL).
--
--   1. Store the link on the audit row so HISTORY can show it.
--   2. Re-create admin_get_push_history to include link_url in the return
--      signature (return-column change → drop first).

alter table public.push_broadcasts add column if not exists link_url text;

drop function if exists public.admin_get_push_history(int);

create or replace function public.admin_get_push_history(p_limit int default 50)
returns table(
  id uuid,
  segment text,
  body text,
  image_url text,
  link_url text,
  recipient_count int,
  status text,
  sent_at timestamptz,
  sender_handle text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if not public.is_admin(v_uid) then
    raise exception 'admin_get_push_history: not authorized';
  end if;
  return query
  select
    b.id,
    b.segment,
    b.body,
    b.image_url,
    b.link_url,
    b.recipient_count::int,
    b.status,
    b.sent_at,
    p.handle as sender_handle
  from public.push_broadcasts b
  left join public.profiles p on p.id = b.sender_id
  order by b.sent_at desc
  limit greatest(coalesce(p_limit, 50), 1);
end;
$$;

revoke all on function public.admin_get_push_history(int) from public;
grant execute on function public.admin_get_push_history(int) to authenticated;

notify pgrst, 'reload schema';
